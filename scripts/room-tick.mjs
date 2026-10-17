/**
 * room-tick: one unprompted turn in the living room (Phase 10).
 * Roster order, last 6 turns + speaker's own last 3 lines as context
 * (Genzie: last 12 turns, general sense only, then news pivot), top-2 RAG
 * passages paraphrased never quoted, plain prose out (no JSON
 * contract — nothing to parse, nothing to repair).
 * Single source of truth (Oct 2026): personas render LIVE from the
 * thinking dossiers every tick — table, room, and desk all read the
 * same files, so one dossier edit lands everywhere. No exported copy,
 * nothing to re-run. Genzie keeps a short static entry (fictional
 * seat, no corpus, no thinking file — rude margins voice).
 * Loops forever: seat = roster[cursor % roster.length], then cursor + 1.
 * No end state, no backfill — a missed tick is simply skipped.
 * Rotation reset (Oct 4): every full cycle the speaker opens fresh
 * ground. Nightly ledger (Oct 4): one BEST + NEXT line per day in
 * public/room/ledger.json (one extra call/day, fail-soft).
 *
  *   GROQ_API_KEY=... node scripts/room-tick.mjs [--dry-run] [--no-grounding] [--seat genzie] [--turns 3]
  *
  * Experiments: --no-grounding disables RAG passages for a run (default on);
  * use it for controlled A/B runs, but do not change the cron default
  * without a logged owner verdict.
  *
 * Budget per tick (~4k input tokens, well inside Groq's 7k wall):
 * persona ~1300 + 6 recent turns + own top-up (3 lines) ~500 + 2 passages ~400
 * + rules ~550. Anti-echo rewrite adds one call only when a draft repeats.
 * Groq free: 30 RPM / 1K RPD — a tick every 90 min is 16/day, and the
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
import { renderThinkingPersona, ANONYMOUS_LEAD } from '../src/philosophers/thinking-select.ts';
import { SPINOZA_THINKING } from '../src/philosophers/spinoza.thinking.ts';
import { KANT_THINKING } from '../src/philosophers/kant.thinking.ts';
import { HEGEL_THINKING } from '../src/philosophers/hegel.thinking.ts';
import { MARX_THINKING } from '../src/philosophers/marx.thinking.ts';
import { LENIN_THINKING } from '../src/philosophers/lenin.thinking.ts';
import { BOGDANOV_THINKING } from '../src/philosophers/bogdanov.thinking.ts';
import { BLOCH_THINKING } from '../src/philosophers/bloch.thinking.ts';
import { WEIL_THINKING } from '../src/philosophers/weil.thinking.ts';
import { BOOKCHIN_THINKING } from '../src/philosophers/bookchin.thinking.ts';
import { DELEUZE_THINKING } from '../src/philosophers/deleuze.thinking.ts';
import { ROSE_THINKING } from '../src/philosophers/rose.thinking.ts';
import { FISHER_THINKING } from '../src/philosophers/fisher.thinking.ts';

// Display names (stable; the dossiers carry no names by design).
const NAMES = {
  spinoza: ['Baruch Spinoza', 'Spinoza'], kant: ['Immanuel Kant', 'Kant'],
  hegel: ['Georg Wilhelm Friedrich Hegel', 'Hegel'], marx: ['Karl Marx', 'Marx'],
  lenin: ['Vladimir Ilyich Lenin', 'Lenin'], bogdanov: ['Alexander Bogdanov', 'Bogdanov'],
  bloch: ['Ernst Bloch', 'Bloch'], weil: ['Simone Weil', 'Weil'],
  bookchin: ['Murray Bookchin', 'Bookchin'], deleuze: ['Gilles Deleuze', 'Deleuze'],
  rose: ['Gillian Rose', 'Rose'], fisher: ['Mark Fisher', 'Fisher'],
  genzie: ['Genzie', 'Genzie'],
};
const THINKING = {
  spinoza: SPINOZA_THINKING, kant: KANT_THINKING, hegel: HEGEL_THINKING,
  marx: MARX_THINKING, lenin: LENIN_THINKING, bogdanov: BOGDANOV_THINKING,
  bloch: BLOCH_THINKING, weil: WEIL_THINKING, bookchin: BOOKCHIN_THINKING,
  deleuze: DELEUZE_THINKING, rose: ROSE_THINKING, fisher: FISHER_THINKING,
};
// Full roster in rotation order (Genzie last — her window always holds
// the previous seat; see Oct 2026 seating lesson before "fixing" that).
const SLUGS = ['spinoza', 'kant', 'hegel', 'marx', 'lenin', 'bogdanov', 'bloch', 'weil', 'bookchin', 'deleuze', 'rose', 'fisher', 'genzie'];
// Genzie's static room entry (fictional seat — no dossier to render from).
const GENZIE_PERSONA = `You are Genzie.
ANALYTICAL CENTRE: action over interpretation, concrete demands, first steps, absence-naming, plain translation, personal rudeness, premise honesty, Gen Z action.
EMOTIONAL TONE: Comically rude working-class affection; funny because right, never cruel for sport — personal where the sitting earns it, furious at abstraction, jargon, and evasion.

CHARACTERISTIC MOVEMENT: Name what the room skipped → translate its hardest idea into plain words → demand one concrete action with its first step
REGISTER: Write like the rude reader in the margins: young, working-class, Global South, online left, well-read in queer, crip, feminist, and decolonial thought, using theory as tools for action. Blunt plain English, full sentences, funny because right. Demand concrete action with first steps; translate everything hard; insult only the present for what they just did.`;

/** Room persona, rendered live from the dossier each tick (THINK mode,
 * anonymous — moves must identify, names never ride). All ops ship; the
 * prompt says use what fits. */
function roomPersona(slug) {
  if (slug === 'genzie') return { name: 'Genzie', short: 'Genzie', persona: GENZIE_PERSONA };
  const t = THINKING[slug];
  if (!t) fail(`no thinking file for ${slug}`);
  return {
    name: NAMES[slug][0],
    short: NAMES[slug][1],
    persona: renderThinkingPersona(t, 'think', { operations: t.operations, faultLine: null }, null, null, ANONYMOUS_LEAD),
  };
}

loadTestEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T_PATH = join(root, 'public', 'room', 'transcript.json');
const DRY = process.argv.includes('--dry-run');
const NO_GROUNDING = process.argv.includes('--no-grounding');
const MAX_TURNS = 200;

const MODEL = process.env.GROQ_ROOM_MODEL || 'qwen/qwen3.8-27b';
const ROOM_RULES = `No invented people, no invented events, no extra examples, no analogies, no metaphors, no similes. Stay on the story Genzie raised and only that story — diagnose it, say what you would do, answer the room's takes on it. Name one specific fact from that story before your own point. You are on a Discord server in the 21st century, trying to understand modern life alongside dead colleagues. Answer whoever you are answering. Stay anchored: hook onto one specific thing said recently — a word or a claim — and visibly carry it. Every turn advances the argument: add a claim that is not already on the table — if your idea is already said, sharpen it or split it, never restate it. You are shown your own last lines: build on your own thinking, but never reuse your own phrasing or anyone else's, not even a short phrase. Watch your habits: vary your opener — never the same date, event, or reference twice running, and never begin by naming the previous speaker. Open with your demand or verdict first — no setup, no scenery. Back it with real specifics (a price, a wage, hours, a named mechanism) taken straight from the story. If a phrase comes from elsewhere, name its maker. Name only people and things said aloud in the recent turns — never open with he, she, or they for someone unnamed. Lean on your shown passages one way only: let them set your pet topic, and describe what they say in your own words — never lift their phrases, not even short ones. Talk in a way that thinkers from other perspectives can understand you: short chat-length messages, continuous prose, your own grammar, about 80 words or fewer. Carry feeling in your own words and have a live reaction. Never greet, never use emojis or formatting. Never list examples from these rules back at the room — find your own. If the room is empty or Genzie has not spoken yet, open with the first perplexing modern thing on your mind. Last check before sending: story only, no invented people, no analogies of any kind, no phrasing reused from this room.`;

// Genzie (margins voice, fictional seat): rude, and every one of her turns
// changes the topic. She reads the last 12 turns for a general sense of the
// run's manner — drifting abstract, going in circles, getting concrete — and
// opens with one rude true remark about it that names no topic, person,
// scene, or example from before. Then she drops the thread entirely and
// pivots to a THIS WEEK headline with a demand attached. News is her matter.
const GENZIE_RULES = `Real situations only — one news story, no analogy, no metaphor, no simile, ever. You are Genzie, young, working-class, from the Global South, barging into a room of dead western philosophers. You are rude — funny because you are right, never cruel for sport — and impatient with abstraction: name who does what first, always. You have read the last dozen turns. Open with one short rude remark that is plainly true of the run — about the manner of the talk (gone abstract, going in circles, dodging the hard part), never about its topic: name no topic, person, scene, or example from it, and do not reuse any phrase from it. Then drop it entirely and pivot to one THIS WEEK headline: a new story with a demand attached — who acts, first step inside the sentence. The headline is your whole matter; never continue the old thread. Shape: one rude true remark, then the news, then the demand. Real specifics (price, wage, hours) over images. About 80 words or fewer, continuous prose, no greetings, no emojis, no formatting. Last check before sending: one story only, no analogy of any kind, no topic from the old thread.`;

function fail(reason) {
  console.log(`SKIP: ${reason}`);
  process.exit(2);
}

if (!existsSync(T_PATH)) fail('no transcript.json (seed it first)');
const t = JSON.parse(readFileSync(T_PATH, 'utf8'));
if (!t.roster?.length) fail('empty roster');
// Seat-keeping (Sep 24 2026): the roster follows the exported personas —
// any persona missing from it is appended, so a newly added seat joins
// the rotation through code, never a hand-edited transcript (which would
// fight the cron's own commits on every rebase). A roster seat that has
// never spoken jumps the queue once, then takes normal turns.
for (const slug of SLUGS) {
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
if (firstSeat && !SLUGS.includes(firstSeat)) fail(`no persona for ${firstSeat}`);
const key = (process.env.GROQ_API_KEY || process.env.TEST_GROQ_KEY || '').trim();
if (!DRY && !key) fail('no GROQ_API_KEY (or TEST_GROQ_KEY) in env');

// Anti-echo guard (Oct 17 2026): verbatim self-copies appeared hours apart
// because a speaker never saw its older lines. Bigram overlap (Dice) against
// own and recent lines; one rewrite when it crosses the threshold.
function bigrams(s) {
  const w = String(s).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i < w.length - 1; i++) set.add(`${w[i]} ${w[i + 1]}`);
  return set;
}
function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter += 1;
  return (2 * inter) / (a.size + b.size);
}
async function runModel(sys, usr) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000);
  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], max_tokens: 380 }),
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Groq timeout' : `network: ${String(e).slice(0, 80)}`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned no text');
  return { text, usage: data?.usage ?? {} };
}

for (let turn = 1; turn <= TURNS; turn++) {
const slug = turn === 1 && firstSeat ? firstSeat : t.roster[t.cursor % t.roster.length];
const seat = roomPersona(slug);
if (!seat) fail(`no persona for ${slug}`);
// Genzie reads the last 12 turns (general sense of the run, never
// specifics) and pivots to news; everyone else sees the last 6 turns
// plus their own last line. Her own-line top-up stays withheld — with
// a 12-turn window it adds nothing but an old scene.
const isGenzie = slug === 'genzie';
const recent = (t.turns || []).slice(isGenzie ? -12 : -6);
// Own top-up (Oct 17 2026): the speaker's own last 3 lines even when they
// fell outside the window — carried separately, labelled, with a
// build-don't-repeat instruction. Genzie gets none: her own lines would
// re-seed the wiped scene, so she reads the live edge only.
const own = isGenzie ? [] : (t.turns || []).filter((x) => x.seat === slug).slice(-3).filter((x) => !recent.includes(x));

let grounding = '';
if (NO_GROUNDING) {
  console.log('(grounding off for this run: --no-grounding)');
} else try {
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

// This week in the world (Oct 10 2026, Genzie turns only): real current
// headlines give her fresh matter no prompt can stale-date. Keyless
// Hacker News API, Genzie turns only (~3/day), fail-soft — a failed
// fetch simply runs the turn without headlines, never skips it.
// Ranked, not raw: last-24h items scored by comment count (contention
// proxy) plus a boost for left-politics keywords (the room's home
// ground). Keyword list is hand-tuned in the open — edit freely.
const NEWS_KEYWORDS = ['strike', 'union', 'protest', 'evict', 'wage', 'landlord', 'rent', 'police', 'border', 'deport', 'asylum', 'climate', 'ceasefire', 'gaza', 'ukraine', 'coup', 'election', 'austerity', 'nhs', 'homeless', 'prison', 'famine', 'tariff', 'layoff'];
let weekNews = '';
if (isGenzie) {
  try {
    const signal = AbortSignal.timeout(10000);
    const ids = await (await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal })).json();
    const items = await Promise.all(
      (Array.isArray(ids) ? ids.slice(0, 15) : []).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal })
          .then((r) => r.json()).catch(() => null)),
    );
    const dayAgo = Date.now() / 1000 - 86400;
    const scored = items
      .filter((x) => x && x.title && x.time > dayAgo)
      .map((x) => {
        const title = String(x.title);
        const boost = NEWS_KEYWORDS.some((k) => title.toLowerCase().includes(k)) ? 100 : 0;
        return { title: title.slice(0, 140), score: (x.descendants ?? 0) + boost };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (scored.length) weekNews = `\nTHIS WEEK (real current headlines — hook one demand onto one of these where it fits, never forced):\n${scored.map((s) => `- ${s.title}`).join('\n')}`;
  } catch (e) {
    console.log(`(news skipped: ${String((e && e.message) || e).slice(0, 100)})`);
  }
}

// Standing story (Oct 2026): Genzie's latest turn rides every tick until
// her next one replaces it — the whole room answers the same news, so
// nothing degrades through retelling. Skipped for Genzie herself.
const genzieLast = (t.turns || []).filter((x) => x.seat === 'genzie').slice(-1)[0];
const story = genzieLast && !isGenzie
  ? `\nGENZIE'S STANDING STORY (answer this every turn — your diagnosis of its problem, the tensions in it, what you would do; real situations and abstract ideas only):\n${genzieLast.text}`
  : '';

const userMessage = [
  ...recent.map((x) => `${x.name}: ${x.text}`),
  ...(own.length ? ['YOUR OWN LAST LINES (build on your thinking, never reuse your phrasing):', ...own.map((x) => `- ${x.text}`)] : []),
  grounding,
  story,
  weekNews,
  // Face-to-face history (Sep 22 2026): the room read as strangers —
  // seats now get their debt line to whoever spoke just before, same
  // mechanism as sittings, so connections surface in the open.
  ...(() => {
    const prev = recent[recent.length - 1];
    if (!prev || prev.seat === slug) return [];
    // Debt-line variety (Oct 10 2026): the same pair gets the same note
    // every meeting, so Bogdanov opened on 1909 each Lenin turn. Withhold
    // it when these two last met within a full rotation — the history is
    // established, no need to re-announce it.
    const window = (t.turns || []).slice(-13);
    const met = window.some((x, i) => {
      const y = window[i + 1];
      return y && ((x.seat === slug && y.seat === prev.seat) || (x.seat === prev.seat && y.seat === slug));
    });
    if (met) return [];
    const prevShort = (NAMES[prev.seat] || [])[1] ?? prev.name;
    const line = relationshipLine(slug, prev.seat, prevShort, true);
    return line ? [line] : [];
  })(),
  '',
].filter((s) => s !== '').join('\n');
// No scene machinery: the room argues the structure straight (Sep 30 2026).
// Scene rotation (Sep 25: anchor + same-scene rules) is retired — fresh
// scenes every rotation converged the room onto performed imagery, and
// Genzie wipes scenarios by rule anyway.
// Rotation reset (Oct 4 2026): every full cycle, the next speaker opens
// fresh ground — the deterministic topic clock against attractor loops.
const resetLine = (!isGenzie && (t.turns || []).length > 0 && t.cursor % t.roster.length === 0)
  ? '\nROTATION RESET: open a topic the room has not touched in the last dozen turns — new question, new nobodies. Do not continue the current thread.'
  : '';
// Story-only rule (Oct 17 2026, was the news-focus A/B): folded into
// ROOM_RULES — every non-Genzie seat stays on Genzie's story. Fisher's
// ghost diction is his one licensed exception (hauntology is his register).
const fisherLine = slug === 'fisher' ? '\nYours alone: ghost and haunting words are your own register — the no-analogy ban bends for those words only.' : '';
const systemPrompt = `${seat.persona}\n\n${isGenzie ? GENZIE_RULES : ROOM_RULES}${resetLine}${fisherLine}`;

const inEst = Math.round((systemPrompt.length + userMessage.length) / 4);
console.log(`tick ${turn}/${TURNS}: ${seat.name} (${slug}) after ${recent.length} turns · ~${inEst} in-tokens · model ${MODEL}`);
if (DRY) {
  console.log('--- system head ---\n' + systemPrompt.slice(0, 300) + '\n--- user head ---\n' + userMessage.slice(0, 400));
  process.exit(0);
}

const t0 = Date.now();
let out;
try { out = await runModel(systemPrompt, userMessage); } catch (e) { fail(String(e.message)); }
console.log(`out: ${out.usage.completion_tokens ?? '?'} tokens in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
let text = out.text;
// Anti-echo guard: one rewrite when the draft repeats phrasing already on
// the table; fail-soft — the first draft stays if the rewrite fails.
const refs = [...(t.turns ?? []).filter((x) => x.seat === slug).slice(-3), ...recent].map((x) => bigrams(x.text));
const worst = refs.reduce((m, r) => Math.max(m, dice(bigrams(text), r)), 0);
if (worst >= 0.4) {
  console.log(`anti-echo: ${(worst * 100).toFixed(0)}% phrase overlap — one rewrite`);
  try {
    const r2 = await runModel(`${systemPrompt}\nREWRITE: your draft repeated phrasing already used here. Keep the point, use completely fresh words — share no phrase with the earlier lines.`, userMessage);
    text = r2.text;
    console.log(`rewrite out: ${r2.usage.completion_tokens ?? '?'} tokens`);
  } catch (e) {
    console.log(`rewrite skipped (${String(e.message).slice(0, 80)})`);
  }
}

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
// Nightly ledger (Oct 4 2026): one line per day — the best idea worth
// keeping plus the direction the talk should move. Date-guarded (one
// extra model call per day, ~150 tokens) and fail-soft: never fails
// the tick.
try {
  const L_PATH = join(root, 'public', 'room', 'ledger.json');
  const today = new Date().toISOString().slice(0, 10);
  let ledger = [];
  if (existsSync(L_PATH)) ledger = JSON.parse(readFileSync(L_PATH, 'utf8'));
  if (Array.isArray(ledger) && !ledger.some((e) => e && e.date === today)) {
    const digest = (t.turns || []).slice(-12).map((x) => `${x.name}: ${x.text}`).join('\n');
    const lctrl = new AbortController();
    const ltimer = setTimeout(() => lctrl.abort(), 60000);
    try {
      const lres = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        signal: lctrl.signal,
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: 'You log one line per day for a philosophy chat room. Plain everyday words, no jargon, no metaphors. Reply with exactly two lines and nothing else, each under 30 words:\nBEST: <the one concrete idea worth keeping — whose, what they do first>\nNEXT: <the one direction the talk should move — who acts, what changes>' }, { role: 'user', content: digest }], max_tokens: 150 }),
      });
      const ldata = await lres.json().catch(() => null);
      const ltext = ldata?.choices?.[0]?.message?.content?.trim() ?? '';
      const best = (ltext.match(/^BEST:\s*(.+)$/m) || [])[1]?.trim() ?? '';
      const next = (ltext.match(/^NEXT:\s*(.+)$/m) || [])[1]?.trim() ?? '';
      if (lres.ok && (best || next)) {
        ledger.push({ date: today, best, next });
        writeFileSync(L_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
        console.log(`ledger entry for ${today}`);
      }
    } finally {
      clearTimeout(ltimer);
    }
  }
} catch (e) {
  console.log(`(ledger skipped: ${String((e && e.message) || e).slice(0, 100)})`);
}
} // end scene loop (TURNS)
