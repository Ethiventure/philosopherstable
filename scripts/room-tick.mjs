/**
 * room-tick: one unprompted turn in the living room (Phase 10).
 * Roster order, recent turns as context, lean Low persona, top-2 RAG
 * passages from the speaker's own shard, plain prose out (no JSON
 * contract — nothing to parse, nothing to repair).
 *
 *   GROQ_API_KEY=... node scripts/room-tick.mjs [--dry-run]
 *
 * Budget per tick (~2k input tokens, well inside Groq's 7k wall):
 * lean persona ~500 + 3 recent turns ~300 + 2 passages ~400 + rules ~250.
 * Groq free: 30 RPM / 1K RPD — one tick per 20 min is 72/day, and the
 * 1-at-a-time cadence never trips concurrency. RAG uses the repo's own
 * scorer over shipped shards (offline, no quota). Reasoning flags are
 * NOT sent (Groq returns empty with them — Sep 21 2026).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTestEnv } from './test-env.mjs';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';
import { joinShard } from '../src/lib/rag-shard.ts';
import { smartCut } from '../src/lib/rag-text.ts';
import { relationshipLine } from '../src/philosophers/influences.ts';

loadTestEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T_PATH = join(root, 'public', 'room', 'transcript.json');
const P_PATH = join(root, 'public', 'room', 'personas.json');
const DRY = process.argv.includes('--dry-run');
const MAX_TURNS = 200;

const MODEL = process.env.GROQ_ROOM_MODEL || 'qwen/qwen3.8-27b';
const ROOM_RULES = `You are on a Discord server in the 21st century, trying to understand modern life alongside dead colleagues. React to the last message, or puzzle over something modern through your own framework, in your own voice and temper. Plain everyday words, 1–3 short sentences like chat messages, continuous prose. You may be baffled, delighted, or appalled — never lecture, never greet, never announce your moves, never use emojis or formatting. Never list examples from these rules back at the room — find your own. If the room is empty, open with the first modern thing on your mind.`;

function fail(reason) {
  console.log(`SKIP: ${reason}`);
  process.exit(2);
}

if (!existsSync(T_PATH)) fail('no transcript.json (seed it first)');
if (!existsSync(P_PATH)) fail('no personas.json (run export-personas first)');
const t = JSON.parse(readFileSync(T_PATH, 'utf8'));
const personas = JSON.parse(readFileSync(P_PATH, 'utf8')).seats;
if (!t.roster?.length) fail('empty roster');
const slug = t.roster[t.cursor % t.roster.length];
const seat = personas[slug];
if (!seat) fail(`no persona for ${slug}`);
const recent = (t.turns || []).slice(-3);

let grounding = '';
try {
  const shardPath = join(root, 'public', 'rag', `author-${slug}.json`);
  if (existsSync(shardPath)) {
    const shard = JSON.parse(readFileSync(shardPath, 'utf8'));
    const index = prepareIndex(joinShard(shard));
    const queryBits = [
      ...recent.filter((x) => x.seat === slug).map((x) => x.text),
      ...recent.slice(-1).map((x) => x.text),
    ].join(' ').slice(0, 800) || 'freedom power labour';
    const hits = searchIndex(index, queryBits, { limit: 2 }).selected;
    if (hits.length) {
      grounding = `\nPASSAGES from your own works (borrow a phrase or two if one fits, ≤6 words each, single quotes — or ignore them):\n${hits.map((h, i) => `[${i + 1}] ${smartCut(h.passage.text, 650)}`).join('\n')}`;
    }
  }
} catch (e) {
  console.log(`(grounding skipped: ${String(e).slice(0, 100)})`);
}

const userMessage = [
  ...recent.map((x) => `${x.name}: ${x.text}`),
  grounding,
  // Face-to-face history (Sep 22 2026): the room read as strangers —
  // seats now get their debt line to whoever spoke just before, same
  // mechanism as sittings, so connections surface in the open.
  ...(() => {
    const prev = recent[recent.length - 1];
    if (!prev || prev.seat === slug) return [];
    const prevShort = personas[prev.seat]?.short ?? prev.name;
    const line = relationshipLine(slug, prev.seat, prevShort, true);
    return line ? [line] : [];
  })(),
  '',
  'Your turn — speak now.',
].filter((s) => s !== '').join('\n');
const systemPrompt = `${seat.persona}\n\n${ROOM_RULES}`;

const inEst = Math.round((systemPrompt.length + userMessage.length) / 4);
console.log(`tick: ${seat.name} (${slug}) after ${recent.length} turns · ~${inEst} in-tokens · model ${MODEL}`);
if (DRY) {
  console.log('--- system head ---\n' + systemPrompt.slice(0, 300) + '\n--- user head ---\n' + userMessage.slice(0, 400));
  process.exit(0);
}

const key = (process.env.GROQ_API_KEY || process.env.TEST_GROQ_KEY || '').trim();
if (!key) fail('no GROQ_API_KEY (or TEST_GROQ_KEY) in env');
const t0 = Date.now();
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 90000);
let res;
try {
  res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    signal: ctrl.signal,
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 160 }),
  });
} catch (e) {
  fail(e.name === 'AbortError' ? 'Groq timeout' : `network: ${String(e).slice(0, 80)}`);
} finally {
  clearTimeout(timer);
}
if (!res.ok) fail(`Groq ${res.status}: ${(await res.text()).slice(0, 150)}`);
const data = await res.json().catch(() => null);
const text = data?.choices?.[0]?.message?.content?.trim();
if (!text) fail('Groq returned no text');
const usage = data?.usage ?? {};
console.log(`out: ${usage.completion_tokens ?? '?'} tokens in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

t.turns.push({ id: `r${Date.now()}`, ts: new Date().toISOString(), seat: slug, name: seat.name, text, model: MODEL });
let dropped = t.dropped ?? 0;
while (t.turns.length > MAX_TURNS) {
  t.turns.shift();
  dropped += 1;
}
t.dropped = dropped;
t.cursor = (t.cursor ?? 0) + 1;
t.lastTick = new Date().toISOString();
writeFileSync(T_PATH, `${JSON.stringify(t)}\n`);
console.log(`appended turn ${t.turns.length} (cursor ${t.cursor})${dropped ? `, ${dropped} archived off` : ''}`);
