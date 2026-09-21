/**
 * bench-rag: objective retrieval benchmarks, fully offline (Sep 2026).
 * No packages, no network, no judge model — the repo's own scorer
 * (rag-search.ts) over the shipped shards (public/rag/author-*.json).
 * RAGAS adaptations, method never package:
 * - round-trip recall@k: passage → its own distinctive terms → source in
 *   top-k? (context precision / answer-relevancy proxy)
 * - noise probe: same queries + distractor terms from another author —
 *   recall drop = noise sensitivity (RAGAS noise_sensitivity)
 * - cross-author top-1 precision over the combined index (leakage trap,
 *   generalized from rag:eval's single wrong-philosopher case)
 *
 *   npm run bench:rag [-- --authors bloch,marx --n 20 --k 5 --seed 7]
 *
 * Deterministic per seed. WARN floors are printed, never enforced (exit 0
 * always) — first runs set the baseline; the exit-1 gate lands once
 * baselines are stable. Raw JSON to data/test-runs/bench-rag.json
 * (gitignored) for trend tracking.
 */
import { readFileSync, readdirSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';
import { joinShard } from '../src/lib/rag-shard.ts';
import { queryTerms } from '../src/lib/rag-text.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = process.argv.slice(2);
const get = (name, def) => {
  const i = raw.indexOf(name);
  return i === -1 ? def : (raw[i + 1] ?? def);
};
const onlyAuthors = (get('--authors', 'all') === 'all') ? null : get('--authors', '').split(',').map((s) => s.trim()).filter(Boolean);
const N = parseInt(get('--n', '20'), 10);
const K = parseInt(get('--k', '5'), 10);
const SEED = parseInt(get('--seed', '7'), 10);
const SHOW_MISSES = raw.includes('--show-misses');

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Distinctive query for a passage: longest query terms EXCLUDING the
// shard's own most frequent tokens (Hegel lesson Sep 2026: corpus-wide
// vocabulary like "self-consciousness" retrieves neighbors, not the
// source — without the exclusion the bench measures term banality,
// not index quality).
function shardStopwords(passages, top = 25) {
  const freq = new Map();
  for (const p of passages) {
    for (const t of new Set(queryTerms(p.text || ''))) freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return new Set([...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([t]) => t));
}
function deriveQuery(text, stop = null) {
  const terms = [...new Set(queryTerms(text))].filter((t) => !(stop && stop.has(t)));
  terms.sort((a, b) => b.length - a.length);
  return terms.slice(0, 3).join(' ');
}

const files = readdirSync(join(root, 'public', 'rag'))
  .filter((f) => f.startsWith('author-') && f.endsWith('.json'))
  .sort();
const shards = [];
for (const f of files) {
  const slug = basename(f, '.json').replace(/^author-/, '');
  if (onlyAuthors && !onlyAuthors.includes(slug)) continue;
  const shard = JSON.parse(readFileSync(join(root, 'public', 'rag', f), 'utf8'));
  const passages = joinShard(shard);
  const idAuthor = new Map(passages.map((p) => [p.id, slug]));
  shards.push({ slug, passages, idAuthor, index: prepareIndex(passages) });
}
if (!shards.length) {
  console.error('no shards matched');
  process.exit(2);
}

// Distractor pool per author: query terms of another author's passages.
const noisePool = new Map();
for (const s of shards) {
  const other = shards.find((o) => o.slug !== s.slug);
  noisePool.set(s.slug, other ? deriveQuery(other.passages[3]?.text ?? '') : '');
}

const combinedAuthor = new Map();
for (const s of shards) for (const [id] of s.idAuthor) combinedAuthor.set(id, s.slug);
// NOTE: no combined index — preparing one 13k-passage index is O(n²)-slow.
// Cross-author top-1 compares each shard's top-1 score instead (12 fast
// searches per query over prebuilt per-shard indexes).

const perAuthor = [];
let totBase = 0, totHit = 0, totWorkHit = 0, totNoiseHit = 0, totCross = 0, totTested = 0, totSkipped = 0;
for (const s of shards) {
  process.stderr.write(`bench-rag: ${s.slug} (${s.passages.length} passages)…\n`);
  s.stop = shardStopwords(s.passages);
  const rand = mulberry32(SEED + s.slug.length * 97 + s.slug.charCodeAt(0));
  const pool = [...s.passages].sort(() => rand() - 0.5).slice(0, Math.min(N, s.passages.length));
  let hit = 0, workHit = 0, noiseHit = 0, cross = 0, tested = 0, skipped = 0;
  for (const p of pool) {
    const q = deriveQuery(p.text || '', s.stop);
    if (q.split(' ').length < 2) { skipped += 1; continue; }
    tested += 1;
    const own = searchIndex(s.index, q, { limit: K }).selected;
    if (own.map((c) => c.passage.id).includes(p.id)) hit += 1;
    else if (SHOW_MISSES) console.log(`  MISS ${s.slug} [${p.id}] q=${JSON.stringify(q)} top=${own[0] ? own[0].passage.id : '(none)'}`);
    // Work-recall: same work in top-k counts (dense uniform works share
    // vocabulary across neighbor chunks — any of them serves grounding;
    // exact-chunk identity is the stricter, noisier signal).
    if (own.some((c) => c.passage.work_id && c.passage.work_id === p.work_id)) workHit += 1;
    const nq = `${q} ${noisePool.get(s.slug)}`.trim();
    const noisy = searchIndex(s.index, nq, { limit: K }).selected.map((c) => c.passage.id);
    if (noisy.includes(p.id)) noiseHit += 1;
    // Cross-author top-1 without a combined index: own top-1 score must
    // beat every other shard's top-1 score for the same query.
    const ownTop = searchIndex(s.index, q, { limit: 1 }).selected[0];
    const ownBest = ownTop ? ownTop.finalScore : -Infinity;
    const beaten = shards.every((o) => {
      if (o.slug === s.slug) return true;
      const t = searchIndex(o.index, q, { limit: 1 }).selected[0];
      return !t || t.finalScore <= ownBest;
    });
    if (beaten) cross += 1;
  }
  perAuthor.push({ author: s.slug, tested, skipped, recall: tested ? hit / tested : null, workRecall: tested ? workHit / tested : null, noiseRecall: tested ? noiseHit / tested : null, crossTop1: tested ? cross / tested : null });
  totTested += tested; totSkipped += skipped; totHit += hit; totWorkHit += workHit; totNoiseHit += noiseHit; totCross += cross;
}

const overall = {
  recall: totTested ? totHit / totTested : null,
  workRecall: totTested ? totWorkHit / totTested : null,
  noiseRecall: totTested ? totNoiseHit / totTested : null,
  crossTop1: totTested ? totCross / totTested : null,
  tested: totTested, skipped: totSkipped, k: K, n: N, seed: SEED,
  at: new Date().toISOString(),
};

console.log(`\nbench-rag (offline, seed ${SEED}, n=${N}/author, k=${K}):`);
console.log('author'.padEnd(28) + ' tested  recall  workRc  noiseRc  crossTop1');
for (const r of perAuthor) {
  const f = (v) => (v === null ? '   —  ' : v.toFixed(2).padStart(6));
  console.log(`${r.author.padEnd(28)} ${String(r.tested).padStart(6)} ${f(r.recall)} ${f(r.workRecall)} ${f(r.noiseRecall)} ${f(r.crossTop1)}${r.skipped ? `  (${r.skipped} skipped: too thin)` : ''}`);
}
const f = (v) => (v === null ? '—' : v.toFixed(2));
console.log(`\nOVERALL id-recall@${K} ${f(overall.recall)} · work-recall ${f(overall.workRecall)} · noise ${f(overall.noiseRecall)} (drop ${overall.recall !== null && overall.noiseRecall !== null ? (overall.recall - overall.noiseRecall).toFixed(2) : '—'}) · cross-author top-1 ${f(overall.crossTop1)} · ${totTested} tested, ${totSkipped} skipped`);
const warns = [];
if (overall.recall !== null && overall.recall < 0.9) warns.push(`WARN recall ${overall.recall.toFixed(2)} < 0.90 floor`);
if (overall.recall !== null && overall.noiseRecall !== null && overall.recall - overall.noiseRecall > 0.15) warns.push(`WARN noise drop ${(overall.recall - overall.noiseRecall).toFixed(2)} > 0.15`);
if (overall.crossTop1 !== null && overall.crossTop1 < 0.9) warns.push(`WARN cross-author top-1 ${overall.crossTop1.toFixed(2)} < 0.90 floor`);
for (const w of warns) console.log(w);
if (!warns.length) console.log('no warnings — floors hold (recall 0.90, noise-drop 0.15, cross-top-1 0.90)');
console.log('');

mkdirSync(join(root, 'data', 'test-runs'), { recursive: true });
appendFileSync(join(root, 'data', 'test-runs', 'bench-rag.jsonl'), `${JSON.stringify({ overall, perAuthor })}\n`);
console.log('logged to data/test-runs/bench-rag.jsonl (gitignored)\n');
