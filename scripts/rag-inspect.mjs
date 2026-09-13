#!/usr/bin/env node
/**
 * Inspect the indexed corpus: the fastest way to read what the machine reads.
 *   node scripts/rag-inspect.mjs --id <source-id> [--full <ordinal>]
 *   node scripts/rag-inspect.mjs --passage <passage-id>
 *
 * --id lists sections with passage counts; --full prints one passage complete.
 */
import { DatabaseSync } from 'node:sqlite';

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

const db = new DatabaseSync(new URL('../data/rag.sqlite', import.meta.url));

const pid = get('--passage');
if (pid) {
  const r = db.prepare('SELECT * FROM passages WHERE id = ?').get(pid);
  if (!r) {
    console.error(`no such passage: ${pid}`);
    process.exit(1);
  }
  console.log(`${r.id} · ${r.author} — ${r.work_title}`);
  console.log(`section: ${r.section_path ?? '(none)'} · paras ${r.paragraph_start}–${r.paragraph_end} · ${r.word_count} words`);
  console.log(`source: ${r.source_url}\n\n${r.text}`);
  db.close();
  process.exit(0);
}

const id = get('--id');
if (!id) {
  console.error('Usage: node scripts/rag-inspect.mjs --id <source-id> [--full <ordinal>] | --passage <passage-id>');
  process.exit(1);
}
const work = db.prepare('SELECT * FROM works WHERE id = ?').get(id);
if (!work) {
  console.error(`no such work: ${id}`);
  process.exit(1);
}
console.log(`${work.title} — ${work.author}\n${work.passage_count} passages · imported ${work.imported_at} · hash ${work.content_hash}\n`);
const sections = db.prepare('SELECT section_path, COUNT(*) AS n, MIN(ordinal) AS lo FROM passages WHERE work_id = ? GROUP BY section_path ORDER BY lo').all(id);
for (const s of sections) console.log(`  ${String(s.n).padStart(3)}  ${s.section_path ?? '(no heading)'}`);
const full = get('--full');
if (full !== null) {
  const r = db.prepare('SELECT * FROM passages WHERE work_id = ? AND ordinal = ?').get(id, parseInt(full, 10));
  if (!r) {
    console.error(`no ordinal ${full} in ${id}`);
    process.exit(1);
  }
  console.log(`\n--- ${r.id} · ${r.word_count} words ---\n\n${r.text}`);
}
db.close();
