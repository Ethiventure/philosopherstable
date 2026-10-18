/**
 * room-health: one nightly score of the living room (Oct 18 2026).
 *
 * Pure code over the transcript — no model call, no spend, fail-soft. Reads
 * the last 200 turns, scores the day's turns on the three questions the
 * owner actually asks of the room, appends one dated row to
 * public/room/health.json, and prints a compact console line.
 *
 *   node scripts/room-health.mjs [--days 3] [--print]
 *
 * What each number means:
 *   overlap    — max bigram Dice against recent turns and the speaker's own
 *                last three. The anti-echo guard's own math: 0.4+ is where a
 *                rewrite fires. Rising = the room is repeating itself.
 *   novelty    — share of this turn's word-pairs that appear nowhere in the
 *                previous twelve turns. Falling = same ideas, new wording.
 *   story      — share of the standing news story's distinctive content words
 *                this turn picks up. Falling = the room has wandered off the
 *                topic it was given.
 *   words      — turn length; the per-dossier TURN LENGTH rules now aim this
 *                at 40–90.
 *   flags      — shout (all-caps ratio), figure (analogy/simile markers),
 *                long (>120 words), thin (<25).
 *
 * Read-only about the transcript: never writes transcript.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T_PATH = join(root, 'public', 'room', 'transcript.json');
const H_PATH = join(root, 'public', 'room', 'health.json');
const daysArg = process.argv.indexOf('--days');
const DAYS = daysArg !== -1 ? Math.max(1, Number(process.argv[daysArg + 1]) || 1) : 1;
const PRINT = process.argv.includes('--print');

const STOP = new Set(`the a an and or but of to in on at for with from by is are was were be been being it its this that these those he she they we you i not no as if then than so what which who whom whose when where how why all any some each every one two three very just also more most other such only own same too can will would could should may might must do does did done have has had your you their his her our my me him them us there here what about into over under again further once because while during before after above below between through against among`
  .split(' '));

function words(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
}
function bigrams(s) {
  const w = words(s);
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
function content(s) {
  return [...new Set(words(s).filter((w) => w.length > 3 && !STOP.has(w)))];
}
function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function round(x, dp = 2) { return Number(x.toFixed(dp)); }

const FIGURE = /\b(as if|as though|like a|like an|akin to|resembles|sings? of|feels like)\b/;

if (!existsSync(T_PATH)) { console.log('SKIP: no transcript.json'); process.exit(2); }
const t = JSON.parse(readFileSync(T_PATH, 'utf8'));
const turns = t.turns || [];

// Score every turn that has a full context (index ≥ 13) — earlier ones lack
// the twelve-turn novelty window.
const rows = [];
for (let i = 13; i < turns.length; i++) {
  const cur = turns[i];
  const before = turns.slice(0, i);
  const recent = before.slice(-6);
  const own = before.filter((x) => x.seat === cur.seat).slice(-3);
  const story = before.filter((x) => x.seat === 'genzie').slice(-1)[0];

  const curBg = bigrams(cur.text);
  const overlap = Math.max(0, ...[...own, ...recent].map((x) => dice(curBg, bigrams(x.text))));
  const prior = new Set();
  for (const x of before.slice(-12)) for (const g of bigrams(x.text)) prior.add(g);
  const fresh = [...curBg].filter((g) => !prior.has(g)).length;
  const novelty = curBg.size ? fresh / curBg.size : 0;

  let storyHits = null;
  if (story && cur.seat !== 'genzie') {
    const keys = content(story.text).slice(0, 14);
    const bag = new Set(words(cur.text));
    storyHits = keys.length ? keys.filter((k) => bag.has(k)).length / keys.length : null;
  }

  const caps = (cur.text.match(/[A-Z]/g) || []).length;
  const letters = (cur.text.match(/[A-Za-z]/g) || []).length || 1;
  const w = words(cur.text).length;
  const flags = [];
  if (caps / letters > 0.3) flags.push('shout');
  if (FIGURE.test(cur.text.toLowerCase())) flags.push('figure');
  if (w > 120) flags.push('long');
  if (w < 25) flags.push('thin');

  rows.push({
    ts: cur.ts, seat: cur.seat,
    words: w,
    overlap: round(overlap),
    novelty: round(novelty),
    story: storyHits === null ? null : round(storyHits),
    flags,
  });
}

const cutoff = new Date(Date.now() - DAYS * 864e5).toISOString();
const inWindow = rows.filter((r) => r.ts >= cutoff);
const summarise = (rs) => {
  const storyVals = rs.map((r) => r.story).filter((v) => v !== null);
  return {
    turns: rs.length,
    meanWords: round(mean(rs.map((r) => r.words)), 0),
    meanOverlap: round(mean(rs.map((r) => r.overlap))),
    meanNovelty: round(mean(rs.map((r) => r.novelty))),
    meanStory: storyVals.length ? round(mean(storyVals)) : null,
    guardRewrites: rs.filter((r) => r.overlap >= 0.4).length,
    flags: rs.flatMap((r) => r.flags.map((f) => `${f}:${r.seat}`)),
  };
};

const today = new Date().toISOString().slice(0, 10);
const day = {
  date: today,
  model: turns[turns.length - 1]?.model ?? null,
  summary: summarise(inWindow),
  turns: inWindow.map(({ ts, seat, ...rest }) => ({ ts, seat, ...rest })),
};
if (PRINT || daysArg !== -1) {
  console.log(JSON.stringify({ date: today, summary: day.summary }, null, 2));
} else {
  const s = day.summary;
  console.log(
    `room-health ${today}: ${s.turns} turns · ${s.meanWords}w avg · overlap ${s.meanOverlap}` +
    ` · novelty ${s.meanNovelty} · story ${s.meanStory ?? '—'} · rewrites ${s.guardRewrites}` +
    (s.flags.length ? ` · flags ${[...new Set(s.flags)].join(', ')}` : ''),
  );
}

// Append the row (one per day, last row for today wins) — fail-soft.
try {
  let log = [];
  if (existsSync(H_PATH)) log = JSON.parse(readFileSync(H_PATH, 'utf8'));
  if (!Array.isArray(log)) log = [];
  log = log.filter((e) => e && e.date !== today).concat(day);
  writeFileSync(H_PATH, `${JSON.stringify(log.slice(-60), null, 2)}\n`);
  console.log(`health row written (${log.length} days kept)`);
} catch (e) {
  console.log(`(health row skipped: ${String((e && e.message) || e).slice(0, 100)})`);
}