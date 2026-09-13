#!/usr/bin/env node
/**
 * Builds data/sources.json entries from the app's own corpus manifest.
 *   node scripts/rag-manifest.mjs [--approve-all]
 *
 * Takes every CORPUS_SOURCES_DATA entry with a source_url and emits an RAG
 * source entry. Without --approve-all, new entries arrive as
 * rights_status "pending" (importer refuses them); with it, the owner records
 * bulk approval in one explicit, dated act. Existing entries are never
 * downgraded: approval only moves pending → approved.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CORPUS = new URL('../src/data/corpus-sources.ts', import.meta.url);
const MANIFEST = new URL('../data/sources.json', import.meta.url);
const APPROVE_ALL = process.argv.includes('--approve-all');

const src = readFileSync(CORPUS, 'utf8');
const blocks = src.split(/\{\s*\n\s*author:/).slice(1);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const byId = new Map(manifest.sources.map((s) => [s.id, s]));
// Mechanical slug collisions / legacy aliases: these corpus entries are
// already covered under another source id — never index twice.
const SKIP_IDS = new Set(['murray-bookchin-social-ecology-and-communalism']);
let added = 0;

for (const raw of blocks) {
  // The split consumes "{\n    author:" — restore the key before parsing.
  const block = `author:${raw}`;
  const author = (block.match(/author:\s*'([^']+)'/) || [])[1];
  // Titles may use either quote style and contain plain apostrophes (Hegel's).
  const tm = block.match(/title:\s*"([^"]+)"|title:\s*'([^']+)'/) || [];
  const title = tm[1] ?? tm[2];
  const url = (block.match(/source_url:\s*'([^']+)'/) || [])[1];
  if (!author || !title || !url) continue;
  const id = `${slug(author)}-${slug(title)}`.slice(0, 80);
  if (SKIP_IDS.has(id)) continue;
  if (byId.has(id)) {
    // Keep tracking the corpus: URLs and titles drift (link fixes), ids don't.
    // Pinned entries keep their own fetch URL (e.g. an index page read via
    // chapter-following while readers keep the corpus link).
    const existing = byId.get(id);
    if (!existing.url_pinned) existing.source_url = url;
    existing.author = author;
    existing.title = title;
    continue;
  }
  byId.set(id, {
    id,
    author,
    title,
    source_mode: 'REMOTE_IMPORT',
    source_url: url,
    rights_status: 'pending',
    rights_decision_by: null,
    rights_decision_at: null,
    rights_note: 'Auto-imported from the app corpus manifest; awaiting explicit owner approval.',
    enabled: true,
  });
  added += 1;
}

let approved = 0;
if (APPROVE_ALL) {
  for (const s of byId.values()) {
    if (s.rights_status === 'pending') {
      s.rights_status = 'approved';
      s.rights_decision_by = 'project_owner';
      s.rights_decision_at = new Date().toISOString().slice(0, 10);
      s.rights_note = 'Owner bulk approval Sep 2026: automate the working full-text links; failures skip, never force.';
      approved += 1;
    }
  }
}

manifest.sources = [...byId.values()];
manifest.rights_note = 'Every entry needs explicit owner approval before anything is fetched or indexed. The importer refuses anything else.';
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${manifest.sources.length} sources (${added} new${APPROVE_ALL ? `, ${approved} bulk-approved` : ''}) → data/sources.json`);
