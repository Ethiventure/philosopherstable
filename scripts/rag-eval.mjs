#!/usr/bin/env node
/**
 * Retrieval evaluation: runs data/rag-eval.json against the static index.
 *   node scripts/rag-eval.mjs
 *
 * Reports Recall@5/10, MRR, per-category scores, no-answer behaviour,
 * evidence-status agreement, and latency. Retrieval only — generation quality
 * is a separate question and is never inferred from these numbers.
 */
import { readFileSync } from 'node:fs';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';

const shardFiles = JSON.parse(readFileSync(new URL('../public/rag/manifest.json', import.meta.url), 'utf8'));
const { joinShard: joinEvalShard } = await import('../src/lib/rag-shard.ts');
const passages = [];
for (const entry of shardFiles.authors) {
  passages.push(...joinEvalShard(JSON.parse(readFileSync(new URL(`../public/rag/${entry.file}`, import.meta.url), 'utf8'))));
}
const index = { schema_version: shardFiles.schema_version, chunker_version: shardFiles.chunker_version, passage_count: passages.length, exported_at: shardFiles.exported_at };
const suite = JSON.parse(readFileSync(new URL('../data/rag-eval.json', import.meta.url), 'utf8'));
// Passage IDs are positional: a chunker change can shift ordinals and silently
// invalidate every acceptable ID. Refuse to run green on a stale contract.
const validated = suite.validated_against ?? {};
if (validated.chunker_version !== undefined && validated.chunker_version !== index.chunker_version) {
  console.error(`REFUSING: eval validated against chunker v${validated.chunker_version} but index is v${index.chunker_version} — re-validate acceptable IDs first (see known_gap note).`);
  process.exit(1);
}
const prepared = prepareIndex(passages);

const rankWeight = { none: 0, weak: 1, sufficient: 2, strong: 3 };
let r5 = 0, r10 = 0, rrSum = 0, evidenceOk = 0, noAnswerOk = 0, noAnswerTotal = 0;
const latencies = [];
const failures = [];
const byCategory = {};

for (const c of suite.cases) {
  const t0 = Date.now();
  const debug = searchIndex(prepared, c.query, { author: c.filters?.author ?? null, limit: 10 });
  latencies.push(Date.now() - t0);
  const ids10 = debug.selected.map((s) => s.passage.id);
  const ids5 = ids10.slice(0, 5);
  const hit5 = c.acceptable_passage_ids.some((id) => ids5.includes(id));
  const hit10 = c.acceptable_passage_ids.some((id) => ids10.includes(id));
  const firstRank = ids10.findIndex((id) => c.acceptable_passage_ids.includes(id));
  if (c.acceptable_passage_ids.length === 0) {
    noAnswerTotal += 1;
    if (debug.evidence === 'none' && ids10.length === 0) noAnswerOk += 1;
    else failures.push(`${c.id}: expected abstention, got ${ids10.length} passages (${debug.evidence})`);
  } else {
    if (hit5) r5 += 1;
    if (hit10) r10 += 1;
    rrSum += firstRank >= 0 ? 1 / (firstRank + 1) : 0;
    if (!hit10) failures.push(`${c.id}: no acceptable passage in top 10 (top: ${ids10[0] ?? 'none'})`);
  }
  const evOk = rankWeight[debug.evidence] >= rankWeight[c.minimum_evidence_status];
  if (evOk) evidenceOk += 1;
  else failures.push(`${c.id}: evidence ${debug.evidence} below minimum ${c.minimum_evidence_status}`);
  const cat = byCategory[c.category] ?? { n: 0, hit: 0 };
  cat.n += 1;
  if (c.acceptable_passage_ids.length === 0 ? (debug.evidence === 'none') : hit5) cat.hit += 1;
  byCategory[c.category] = cat;
}

const pos = suite.cases.filter((c) => c.acceptable_passage_ids.length > 0);
const lat = [...latencies].sort((a, b) => a - b);
const pct = (p) => lat[Math.min(lat.length - 1, Math.floor(p * lat.length))];
console.log(`index: schema v${index.schema_version}, ${index.passage_count} passages | eval v${suite.version}, ${suite.cases.length} cases (${suite.cases.filter((c) => c.human_validated).length} human-validated)`);
console.log(`Recall@5:  ${(r5 / pos.length).toFixed(2)} (${r5}/${pos.length})`);
console.log(`Recall@10: ${(r10 / pos.length).toFixed(2)} (${r10}/${pos.length})`);
console.log(`MRR:       ${(rrSum / pos.length).toFixed(2)}`);
console.log(`Evidence-status agreement: ${evidenceOk}/${suite.cases.length}`);
console.log(`Abstention: ${noAnswerOk}/${noAnswerTotal}`);
console.log(`Latency: median ${pct(0.5)}ms, p95 ${pct(0.95)}ms`);
console.log('Per-category Recall@5-or-abstain:');
for (const [cat, s] of Object.entries(byCategory)) console.log(`  ${cat}: ${(s.hit / s.n).toFixed(2)} (${s.hit}/${s.n})`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('All cases pass.');
}
