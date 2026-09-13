#!/usr/bin/env node
/**
 * Retrieval debug CLI (developer only — never user-facing scores).
 *   node scripts/rag-search.mjs --query "Why does Bookchin criticise hierarchy?" [--author "Murray Bookchin"] [--limit 6]
 *
 * Prints corpus versions, normalised query, every candidate with score
 * components, exclusions, selected evidence, and sufficiency assessment.
 */
import { readFileSync } from 'node:fs';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';
import { joinShard } from '../src/lib/rag-shard.ts';

const args = process.argv.slice(2);
const get = (flag, fallback = '') => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const query = get('--query');
if (!query) {
  console.error('Usage: node scripts/rag-search.mjs --query "<query>" [--author "<author>"] [--limit 6]');
  process.exit(1);
}
const authorArg = get('--author') || null;

function loadIndex() {
  const manifest = JSON.parse(readFileSync(new URL('../public/rag/manifest.json', import.meta.url), 'utf8'));
  const passages = [];
  for (const entry of manifest.authors) {
    if (authorArg && !entry.author.toLowerCase().includes(authorArg.toLowerCase())) continue;
    const shard = JSON.parse(readFileSync(new URL(`../public/rag/${entry.file}`, import.meta.url), 'utf8'));
    passages.push(...joinShard(shard));
  }
  return { manifest, passages };
}

const { manifest, passages } = loadIndex();
const prepared = prepareIndex(passages);
const debug = searchIndex(prepared, query, {
  author: authorArg,
  limit: parseInt(get('--limit', '6'), 10),
});

console.log(`index: schema v${manifest.schema_version}, chunker v${manifest.chunker_version}, ${manifest.total_passages} passages, exported ${manifest.exported_at}`);
console.log(`query: ${debug.query}`);
console.log(`terms: ${debug.terms.join(', ') || '(none — all stopwords)'}`);
console.log(`author filter: ${debug.authorFilter ?? '(none)'}\n`);
for (const c of debug.selected) {
  console.log(`SELECT  ${c.finalScore.toFixed(2)} (bm25 ${c.bm25.toFixed(2)} + phrase ${c.exactPhraseBoost.toFixed(2)} + heading ${c.headingBoost.toFixed(2)}) ${c.passage.id}`);
  console.log(`        [${c.passage.section_title ?? 'no section'}] matched: ${c.matchedTerms.join(', ')}`);
  console.log(`        ${c.passage.text.slice(0, 220).replace(/\n+/g, ' ')}…\n`);
}
for (const c of debug.excluded.slice(0, 6)) {
  console.log(`SKIP    ${c.finalScore.toFixed(2)} ${c.passage.id} (${c.excluded})`);
}
console.log(`\nevidence: ${debug.evidence} — ${debug.evidenceReasons.join('; ')}`);
console.log(`elapsed: ${debug.elapsedMs}ms over ${debug.candidateCount} candidates`);
