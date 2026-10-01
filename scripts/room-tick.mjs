/**
 * room-tick: one unprompted turn in the living room (Phase 10).
 * Roster order, recent turns as context, lean Low persona, top-2 RAG
 * passages from the speaker's own shard, plain prose out (no JSON
 * contract — nothing to parse, nothing to repair).
 * Loops forever: seat = roster[cursor % roster.length], then cursor + 1.
 * No end state, no backfill — a missed tick is simply skipped.
 *
 *   GROQ_API_KEY=... node scripts/room-tick.mjs [--dry-run] [--seat genzie] [--turns 3]
 *
 * Budget per tick (~3k input tokens, well inside Groq's 7k wall):
 * persona ~1000 + 8 recent turns + own top-up ~1200 + 2 passages ~400 + rules ~350.
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
const ROOM_RULES = `You are on a Discord server in the 21st century, trying to understand modern life alongside dead colleagues. Speak when you have something; answer whoever you are answering. Carry one small aim of your own and let the others' words move it: respond to the recent conversation but try to subtly divert the topic toward what you are interested in — show the shift in what you say. Thinking aloud in character is fine; announcing a plan is not. Stay anchored: hook onto one specific thing said recently — a word, a claim, an image — and visibly carry it. Reusing the room's image is fine and often good; mixing images is not — one image per message, one meaning throughout, and it must make the point clearer, never harder. If a phrase comes from elsewhere, name its maker. Name only people and things said aloud in the recent turns — never open with he, she, or they for someone unnamed. Lean on your shown passages two ways: borrow a phrase if one fits, and let them set your pet topic. Talk in a way that thinkers from other perspectives can understand you: short chat-length messages, continuous prose, your own grammar, about 100 words or fewer. Carry feeling in your own words and have a live reaction. Never greet, never use emojis or formatting. Never list examples from these rules back at the room — find your own. If the room is empty, open with the first perplexing modern thing on your mind.`;

function fail(reason) {
  console.log(`SKIP: ${reason}`);
  process.exit(2);
}

if (!existsSync(T_PATH)) fail('no transcript.json (seed it first)');
if (!existsSync(P_PATH)) fail('no personas.json (run export-personas first)');
const t = JSON.parse(readFileSync(T_PATH, 'utf8'));
const personas = JSON.parse(readFileSync(P_PATH, 'utf8')).seats;
if (!t.roster?.length) fail('empty roster');
// Seat-keeping (Sep 24 2026): the roster follows the exported personas —
// any persona missing from it is appended, so a newly added seat joins
// the rotation through code, never a hand-edited transcript (which would
// fight the cron's own commits on every rebase). A roster seat that has
// never spoken jumps the queue once, then takes normal turns.
for (const slug of Object.keys(personas)) {
  if (!t.roster.includes(slug)) t.roster.push(slug);
}
const spoken = new Set((t.turns || []).map((x) => x.seat));
const newcomer = t.roster.find((s) => !spoken.has(s));
if (newcomer) {
  let guard = 0;
  while (t.roster[t.cursor % t.roster.length] !== newcomer && guard++ < 1000) t.cursor += 1;
}
// Manual scene controls: --seat <slug> sets the FIRST speaker (the rest
// follow roster order, so a barge gets answered); --turns <n> writes n
// turns in one run (1 default, 5 max — each turn sees the one before,
// so a run plays a scene, not a batch). A failed turn aborts the run;
// the workflow only commits on success, so scenes are all-or-nothing.
const turnsArg = Number(process.argv[process.argv.indexOf('--turns') + 1]);
const TURNS = process.argv.includes('--turns') ? Math.min(5, Math.max(1, Math.floor(turnsArg) || 1)) : 1;
const seatFlag = process.argv.indexOf('--seat');
const firstSeat = seatFlag !== -1 && process.argv[seatFlag + 1] ? process.argv[seatFlag + 1] : null;
if (firstSeat && !personas[firstSeat]) fail(`no persona for ${firstSeat}`);
const key = (process.env.GROQ_API_KEY || process.env.TEST_GROQ_KEY || '').trim();
if (!DRY && !key) fail('no GROQ_API_KEY (or TEST_GROQ_KEY) in env');
for (let turn = 1; turn <= TURNS; turn++) {
const slug = turn === 1 && firstSeat ? firstSeat : t.roster[t.cursor % t.roster.length];
const seat = personas[slug];
if (!seat) fail(`no persona for ${slug}`);
const recent = (t.turns || []).slice(-8);
// Own top-up (Sep 24 2026): longer arcs need the speaker's own lines even
// when they fell outside the window — carried separately, labelled.
const own = (t.turns || []).filter((x) => x.seat === slug).slice(-2).filter((x) => !recent.includes(x));

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

// Scene rotation (Sep 25 2026): anchor + same-scene rules converge the
// room onto one image forever (24h on a pipe leak reads as parody), so
// the opening seat starts a fresh scene each full rotation instead —
// deterministic, no image-judging needed. ~2 fresh scenes/day at pace.
const newScene = slug === t.roster[0] && (t.turns || []).length > 0;
const userMessage = [
  ...recent.map((x) => `${x.name}: ${x.text}`),
  ...own.map((x) => `You said earlier: ${x.text}`),
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
  newScene
    ? 'A full rotation has passed: you may leave the old scene behind and open a new perplexing modern thing on your mind instead — the anchor rule is lifted this turn, follow your own aim.'
    : 'Your turn — speak now.',
].filter((s) => s !== '').join('\n');
const systemPrompt = `${seat.persona}\n\n${ROOM_RULES}`;

const inEst = Math.round((systemPrompt.length + userMessage.length) / 4);
console.log(`tick ${turn}/${TURNS}: ${seat.name} (${slug}) after ${recent.length} turns · ~${inEst} in-tokens · model ${MODEL}`);
if (DRY) {
  console.log('--- system head ---\n' + systemPrompt.slice(0, 300) + '\n--- user head ---\n' + userMessage.slice(0, 400));
  process.exit(0);
}

const t0 = Date.now();
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 90000);
let res;
try {
  res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    signal: ctrl.signal,
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 300 }),
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
} // end scene loop (TURNS)
