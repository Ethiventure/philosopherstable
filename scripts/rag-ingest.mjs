#!/usr/bin/env node
/**
 * RAG ingest: manifest → fetch → clean → chunk → SQLite + static JSON index.
 *   node scripts/rag-ingest.mjs --id <source-id>
 *   node scripts/rag-ingest.mjs --all        (fail-soft per source, summary table)
 *
 * Rights gate runs before any network: only `approved` / `approved_excerpt_only`
 * sources are fetched. Anything else aborts with the reason — no silent skips.
 * Idempotent: re-ingesting a source replaces its passages (same stable IDs).
 *
 * Outputs: data/rag.sqlite (local truth, gitignored) + public/search-index.json
 * (shipped to the site; pure data, no secrets).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { normalizeText, chunkParagraphs, wordCount } from './rag-text.mjs';

const ROOT = new URL('..', import.meta.url);
const MANIFEST = new URL('../data/sources.json', import.meta.url);
const DB_PATH = new URL('../data/rag.sqlite', import.meta.url);
const JSON_OUT = new URL('../public/search-index.json', import.meta.url);
const SCHEMA_VERSION = 1;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (PhilosophersCabinet/1.0; ingest)';
const FETCH_TIMEOUT_MS = 30000;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

/** Rights gate: returns null when the source may be fetched, else the reason. */
export function rightsRefusal(entry) {
  if (!entry.rights_status) {
    return `Source "${entry.id}" has no explicit owner rights approval. Set rights_status to "approved" or "approved_excerpt_only" after the project owner has reviewed the source. No content has been fetched or indexed.`;
  }
  if (entry.rights_status !== 'approved' && entry.rights_status !== 'approved_excerpt_only') {
    return `Source "${entry.id}" has rights_status "${entry.rights_status}" — refusing. Only "approved" / "approved_excerpt_only" may be fetched.`;
  }
  if (!entry.enabled) return `Source "${entry.id}" is disabled in the manifest.`;
  return null;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!/html|text/i.test(type)) throw new Error(`unsupported content-type ${type}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve the fetchable full-text URL. TAL book pages get their .html edition. */
function resolveFetchUrl(entry) {
  const u = entry.source_url;
  try {
    const parsed = new URL(u);
    if (parsed.hostname === 'theanarchistlibrary.org' && !/\.[a-z0-9]+$/i.test(parsed.pathname)) {
      return u.replace(/\/$/, '') + '.html';
    }
  } catch { /* fall through to raw URL */ }
  return u;
}

const BOILERPLATE_RE = /(donate|newsletter|subscribe|table of contents|the anarchist library|librarian|login|register|search the library|print edition|epub|pdf version)/i;

/** Generic readable-content extraction: prefers main/article, keeps h1-h3 + p/li/blockquote with heading paths. */
export function extractReadable(html) {
  const stripTags = (s) => s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const named = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", mdash: '—', ndash: '–', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…', copy: '©', reg: '®', laquo: '«', raquo: '»', middot: '·', bull: '•', sect: '§' };
  const textOf = (s) => s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n\n')
    // Sup/subscripts are inline (14<th>th</th>): drop the tags, keep the text.
    .replace(/<\/?(sup|sub)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => { const c = parseInt(n, 10); return c > 31 ? String.fromCharCode(c) : ' '; })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { const c = parseInt(h, 16); return c > 31 ? String.fromCharCode(c) : ' '; })
    .replace(/&([a-z]+);/gi, (_, n) => named[n.toLowerCase()] ?? ' ')
    // Source line-breaks inside a paragraph are formatting, not structure.
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/[ \t\u00a0]+/g, ' ')
    .trim();

  let body = stripTags(html);
  const main = body.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (main) body = main[2];
  for (const tag of ['nav', 'header', 'footer', 'aside', 'form']) {
    body = body.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  }
  const blocks = [];
  const re = /<(h[1-3]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  const path = [];
  let tocLevel = 0; // >0 while inside a Table-of-Contents section: skip it
  while ((m = re.exec(body)) !== null) {
    const tag = m[1].toLowerCase();
    const text = normalizeText(textOf(m[2]));
    if (!text || text.length < 20) continue;
    if (tag.startsWith('h')) {
      const level = parseInt(tag[1], 10);
      path.length = Math.min(path.length, level - 1);
      path[level - 1] = text.slice(0, 120);
      tocLevel = /^(table of )?contents$/i.test(text) ? level : (level <= tocLevel ? 0 : tocLevel);
      continue;
    }
    if (tocLevel > 0) continue; // TOC entries are navigation, not evidence
    if (BOILERPLATE_RE.test(text.slice(0, 80)) && wordCount(text) < 25) continue;
    blocks.push({ text, heading: path[path.length - 1] ?? null, path: path.filter(Boolean).join(' / ') || null });
  }
  return blocks;
}

function sha1(s) {
  return createHash('sha1').update(s).digest('hex').slice(0, 12);
}

function openDb() {
  mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS works (
      id TEXT PRIMARY KEY, author TEXT NOT NULL, title TEXT NOT NULL,
      source_url TEXT NOT NULL, rights_status TEXT NOT NULL,
      content_hash TEXT, passage_count INTEGER DEFAULT 0, imported_at TEXT
    );
    CREATE TABLE IF NOT EXISTS passages (
      id TEXT PRIMARY KEY, work_id TEXT NOT NULL REFERENCES works(id),
      author TEXT NOT NULL, work_title TEXT NOT NULL,
      section_title TEXT, section_path TEXT,
      paragraph_start INTEGER, paragraph_end INTEGER, ordinal INTEGER NOT NULL,
      word_count INTEGER NOT NULL, text TEXT NOT NULL, search_text TEXT NOT NULL,
      source_url TEXT NOT NULL, content_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS system_metadata (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
  `);
  return db;
}

function setMeta(db, key, value) {
  db.prepare('INSERT INTO system_metadata (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
    .run(key, value, new Date().toISOString());
}

async function ingestOne(db, entry) {
  const refused = rightsRefusal(entry);
  if (refused) return { id: entry.id, status: 'refused', detail: refused };
  const t0 = Date.now();
  const fetchUrl = resolveFetchUrl(entry);
  let html;
  try {
    html = await fetchText(fetchUrl);
  } catch (error) {
    return { id: entry.id, status: 'fetch-failed', detail: `${fetchUrl}: ${String(error.message ?? error)}` };
  }
  const paragraphs = extractReadable(html);
  if (paragraphs.length < 5) {
    return { id: entry.id, status: 'no-match', detail: `only ${paragraphs.length} paragraphs extracted — refusing to index thin text (use LOCAL_FULL_TEXT or CURATED_EXCERPTS)` };
  }
  const chunks = chunkParagraphs(paragraphs);
  if (!chunks.length) return { id: entry.id, status: 'no-match', detail: 'chunking produced zero usable passages' };
  const now = new Date().toISOString();
  const hash = sha1(html);
  db.prepare('INSERT INTO works (id, author, title, source_url, rights_status, content_hash, passage_count, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET author=excluded.author, title=excluded.title, source_url=excluded.source_url, rights_status=excluded.rights_status, content_hash=excluded.content_hash, passage_count=excluded.passage_count, imported_at=excluded.imported_at')
    .run(entry.id, entry.author, entry.title, entry.source_url, entry.rights_status, hash, chunks.length, now);
  db.prepare('DELETE FROM passages WHERE work_id = ?').run(entry.id);
  const insert = db.prepare('INSERT INTO passages (id, work_id, author, work_title, section_title, section_path, paragraph_start, paragraph_end, ordinal, word_count, text, search_text, source_url, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  chunks.forEach((c, i) => {
    const pid = `${entry.id}-${String(i).padStart(4, '0')}`;
    insert.run(pid, entry.id, entry.author, entry.title, c.section_title, c.section_path, c.paragraph_start, c.paragraph_end, i, c.word_count, c.text, c.text.toLowerCase(), entry.source_url, sha1(c.text));
  });
  const words = chunks.map((c) => c.word_count).sort((a, b) => a - b);
  return {
    id: entry.id, status: 'ok', passages: chunks.length,
    words: { min: words[0], median: words[Math.floor(words.length / 2)], max: words[words.length - 1] },
    ms: Date.now() - t0,
  };
}

function exportJson(db) {
  const rows = db.prepare('SELECT id, work_id, author, work_title, section_title, section_path, ordinal, word_count, text, source_url FROM passages ORDER BY work_id, ordinal').all();
  mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
  writeFileSync(JSON_OUT, JSON.stringify({
    version: 1, schema_version: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    passage_count: rows.length,
    passages: rows,
  }));
  return rows.length;
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const args = process.argv.slice(2);
const onlyId = args[args.indexOf('--id') + 1];
const all = args.includes('--all');

const wanted = onlyId
  ? manifest.sources.filter((s) => s.id === onlyId)
  : all ? manifest.sources : [];
if (onlyId && !wanted.length) fail(`unknown source id "${onlyId}" (see data/sources.json)`);
if (!wanted.length && !onlyId) fail('pass --id <source-id> or --all');

const db = openDb();
const results = [];
for (const entry of wanted) {
  const r = await ingestOne(db, entry);
  results.push(r);
  console.log(r.status === 'ok'
    ? `ok        ${r.id}: ${r.passages} passages (words min/med/max ${r.words.min}/${r.words.median}/${r.words.max}) in ${r.ms}ms`
    : `${r.status.padEnd(10)}${r.id}: ${r.detail}`);
  await new Promise((resolve) => setTimeout(resolve, 800)); // rate-limit politeness
}
setMeta(db, 'schema_version', String(SCHEMA_VERSION));
setMeta(db, 'last_full_rebuild_at', new Date().toISOString());
const total = exportJson(db);
console.log(`\nindex: ${total} passages total → public/search-index.json`);
db.close();
if (results.some((r) => r.status !== 'ok')) process.exitCode = 1;
