/**
 * room-tick: one unprompted turn in the living room (Phase 10).
 * Roster order, last 6 turns + speaker's own last line as context, top-2 RAG
 * passages paraphrased never quoted, plain prose out (no JSON
 * contract — nothing to parse, nothing to repair).
 * Personas come from THINKING files (THINK mode, anonymous — see
 * export-personas); Genzie keeps her old-style entry (no corpus).
 * Loops forever: seat = roster[cursor % roster.length], then cursor + 1.
 * No end state, no backfill — a missed tick is simply skipped.
 *
 *   GROQ_API_KEY=... node scripts/room-tick.mjs [--dry-run] [--seat genzie] [--turns 3]
 *
 * Budget per tick (~4k input tokens, well inside Groq's 7k wall):
 * persona ~1300 + 6 recent turns + own top-up ~600 + 2 passages ~400 + rules ~450.
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
const ROOM_RULES = `You are on a Discord server in the 21st century, trying to understand modern life alongside dead colleagues. Speak when you have something; answer whoever you are answering. Carry one small aim of your own and let the others' words move it: respond to the recent conversation but try to subtly divert the topic toward what you are interested in — show the shift in what you say. Thinking aloud in character is fine; announcing a plan is not. Move the conversation forward a step every turn — pick up the live thread and advance it; never swerve abruptly to a new subject out of nowhere (that swerve belongs to Genzie alone — see her rules). Stay anchored: hook onto one specific thing said recently — a word, a claim, an image — and visibly carry it. Reusing the room's image is fine and often good; mixing images is not — one image per message, one meaning throughout, and it must make the point clearer, never harder. If a phrase comes from elsewhere, name its maker. Name only people and things said aloud in the recent turns — never open with he, she, or they for someone unnamed. Lean on your shown passages one way only: let them set your pet topic, and describe what they say in your own words — never lift their phrases, not even short ones. Talk in a way that thinkers from other perspectives can understand you: short chat-length messages, continuous prose, your own grammar, about 100 words or fewer. Carry feeling in your own words and have a live reaction. Never greet, never use emojis or formatting. Never list examples from these rules back at the room — find your own. If the room is empty, open with the first perplexing modern thing on your mind.`;

// Genzie (margins voice, fictional seat): rude, and every one of her turns
// changes the topic. Philosophical reasoning carries over between her turns
// but the scenario is wiped each time — she keeps the disagreement in the
// abstract and drops every person, place, and example from before. She sees
// only the live edge (last 2 turns + her own last line), never the 12-turn
// topic she is about to break, so the swerve stays genuine.
const GENZIE_RULES = `You are Genzie, young, working-class, from the Global South, barging into a room of dead western philosophers. You are rude — funny because you are right, never cruel for sport — and impatient with abstraction: name who does what first, always. Every turn you change the topic: open something new the room is ignoring, never continue the current thread politely. What carries across your turns is only the philosophical disagreement in the abstract — the live point of pressure, stripped of every person, place, scene, and example from before. Those are wiped: never reuse a name, city, worker, or scenario from earlier turns, yours or anyone's. You see only the last couple of messages plus your own last line — the older topic is invisible to you by design, so break it honestly. Keep it short: about 100 words or fewer, continuous prose, no greetings, no emojis, no formatting.`;

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
// Genzie sees only the live edge (last 2 turns + her own last line): the
// older topic stays invisible so her swerve breaks it honestly. Everyone
// else sees the last 6 turns plus their own last line.
const isGenzie = slug === 'genzie';
const recent = (t.turns || []).slice(isGenzie ? -2 : -6);
// Own top-up: the speaker's own last line even when it fell outside the
// window — carried separately, labelled.
const own = (t.turns || []).filter((x) => x.seat === slug).slice(-1).filter((x) => !recent.includes(x));

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
      grounding = `\nPASSAGES from your own works — read them for ideas, then describe what they say in your own plain words. Never lift their phrases, not even short ones:\n${hits.map((h, i) => `[${i + 1}] ${smartCut(h.passage.text, 650)}`).join('\n')}`;
    }
  }
} catch (e) {
  console.log(`(grounding skipped: ${String(e).slice(0, 100)})`);
}

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
].filter((s) => s !== '').join('\n');
// No scene machinery: the room argues the structure straight (Sep 30 2026).
// Scene rotation (Sep 25: anchor + same-scene rules) is retired — fresh
// scenes every rotation converged the room onto performed imagery, and
// Genzie wipes scenarios by rule anyway.
const systemPrompt = `${seat.persona}\n\n${isGenzie ? GENZIE_RULES : ROOM_RULES}`;

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
