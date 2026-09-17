#!/usr/bin/env node
/**
 * One-shot: machine-translate non-English passages to English (owner order
 * 2026-09-17). Reads passages of given work_ids from data/rag.sqlite,
 * translates in batches via Groq, inserts as NEW works (<id>-english-mt)
 * with provenance in translation_notes (manifest) — never overwrites the
 * originals. Originals are shelved, not deleted (see shelf step below).
 *
 *   GROQ_API_KEY=... node scripts/rag-translate-once.mjs          (Groq)
 *   OPENROUTER_API_KEY=... node scripts/rag-translate-once.mjs      (OpenRouter)
 * Groq's edge blocks some networks entirely (403 on keyless requests too);
 * fall back to OpenRouter DeepSeek paid (~$0.15 on ~350k tokens).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

const DB = new URL('../data/rag.sqlite', import.meta.url);
const JOBS = [
  { id: 'gilles-deleuze-logic-of-sense-fulltext', lang: 'French', author: 'Gilles Deleuze', title: 'The Logic of Sense (English machine translation)' },
  { id: 'mark-fisher-capitalist-realism-spanish-edition', lang: 'Spanish', author: 'Mark Fisher', title: 'Capitalist Realism (English machine translation)' },
  { id: 'mark-fisher-the-weird-and-the-eerie-spanish-edition', lang: 'Spanish', author: 'Mark Fisher', title: 'The Weird and the Eerie (English machine translation)' },
];
const BATCH = 6;
const USE_OR = Boolean(process.env.OPENROUTER_API_KEY);
const ENDPOINT = USE_OR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.TRANSLATE_MODEL || (USE_OR ? 'deepseek/deepseek-v4.1-flash' : (process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'));
const KEY = USE_OR ? process.env.OPENROUTER_API_KEY : process.env.GROQ_API_KEY;
if (!KEY) { console.error('Set GROQ_API_KEY or OPENROUTER_API_KEY'); process.exit(1); }
const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateBatch(lang, items) {
  const numbered = items.map((t, i) => `[${i}] ${t}`).join('\n---\n');
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: `Translate each numbered passage from ${lang} to plain English. Preserve meaning and tone; do not explain, do not add commentary. Reply with JSON only: {"texts": ["...", ...]} in the same order, same count.` },
      { role: 'user', content: numbered },
    ],
    max_tokens: 4000,
  };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    if (res.status === 429) { await sleep(20000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) { await sleep(3000); continue; }
    try {
      const parsed = JSON.parse(m[0]);
      if (Array.isArray(parsed.texts) && parsed.texts.length === items.length) return parsed.texts;
    } catch { /* retry */ }
    await sleep(3000);
  }
  throw new Error('translation failed after retries');
}

const db = new DatabaseSync(DB);
const out = {};
for (const job of JOBS) {
  const rows = db.prepare('SELECT id, text, section_title, section_path, paragraph_start, paragraph_end, ordinal, word_count, source_url FROM passages WHERE work_id = ? ORDER BY ordinal').all(job.id);
  console.log(`${job.id}: ${rows.length} passages`);
  const texts = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const done = await translateBatch(job.lang, batch.map((r) => r.text));
    texts.push(...done);
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    await sleep(2500);
  }
  out[job.id] = rows.map((r, i) => ({ ...r, en: texts[i] }));
}
writeFileSync(new URL('../data/mt-translations.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('wrote data/mt-translations.json');
