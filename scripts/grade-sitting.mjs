/**
 * grade-sitting: mechanical scorecard for one transcript (Sep 2026).
 * Reads the raw export (.txt download) OR an owner-filed eval markdown
 * (## PASS headers) and counts everything countable, so grading becomes
 * verifying instead of composing:
 *
 *   npm run grade -- <transcript-file> [--city NAME] [--long]
 *
 * Checks: words/turn vs budget (worst turns named), echo clusters (shared
 * 8-grams quoted), thread-city hold per turn, citation count, Genzie
 * namings per pass, P3 vague verbs, volatility shapes, banned Low terms
 * (repo's own ban inventory, Low only). Prints a plain-text
 * scorecard (reads aloud cleanly) plus a paste-ready models-tried.md row
 * with human fields marked TODO — best/worst quotes and the verdict stay
 * yours; the machine never writes them.
 *
 * Uses the repo's own detectors (sharesPassage, detectVolatility) imported
 * from src — same normalization as the live guards, no duplication.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sharesPassage, findSharedPassage, detectVolatility } from '../src/lib/llm.ts';

const rawArgs = process.argv.slice(2);
const file = rawArgs.find((a) => !a.startsWith('--'));
let cityArg = null;
let longForm = false;
for (let i = 0; i < rawArgs.length; i += 1) {
  if (rawArgs[i] === '--city') cityArg = rawArgs[i + 1] ?? null;
  if (rawArgs[i] === '--long') longForm = true;
  if (rawArgs[i] === '--help' || rawArgs[i] === '-h') {
    console.log('usage: npm run grade -- <transcript.txt|eval.md> [--city NAME] [--long]');
    process.exit(0);
  }
}
if (!file) {
  console.error('give me a transcript file: npm run grade -- <file>');
  process.exit(2);
}
let text;
try {
  text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
} catch {
  console.error(`cannot read ${file}`);
  process.exit(2);
}

const md = /^## PASS \d+ — /m.test(text);
// Turn blocks: "PASS n — Name" (raw) or "## PASS n — Name" (filed md).
const turnRe = md ? /^## PASS (\d+) — (.+)$/gm : /^PASS (\d+) — (.+)$/gm;
const turns = [];
let m;
while ((m = turnRe.exec(text)) !== null) {
  // Filed-md headers may carry owner annotations ("Bookchin — ECHO (shares
  // Weil P2 phrasing)"); the seat name is always the first segment.
  const name = md ? m[2].split(' — ')[0].trim() : m[2].trim();
  turns.push({ pass: Number(m[1]), name, at: m.index });
}
for (let i = 0; i < turns.length; i += 1) {
  const end = i + 1 < turns.length ? turns[i + 1].at : text.length;
  let body = text.slice(turns[i].at, end).split('\n').slice(1).join('\n');
  // Stop at the next section header (NOTES / READING LIST / MODELS / SITTING / TOKENS / ## ).
  const stop = body.search(/\n(NOTES FROM THE MARGINS|READING LIST|MODELS USED|SITTING|TOKENS|UNVERIFIED TAGS|PHILOSOPHERS' SERVICE|## )/);
  if (stop !== -1) body = body.slice(0, stop);
  turns[i].text = body.trim();
}
if (!turns.length) {
  console.error('no turns found — is this a cabinet transcript?');
  process.exit(2);
}

// Sitting facts: raw footer first, filed-md header fallback.
const version = (text.match(/Prompt v(\S+)/) || [])[1] ?? 'unknown';
const city = cityArg
  || (text.match(/Thread city: ([^\n·]+)/) || [])[1]?.trim()
  || (text.match(/\((São Paulo|Buenos Aires|Cairo|Lagos|Nairobi|Accra|Bangkok|Seoul|Bristol|A Moving|Athens|Lima|Glasgow|Istanbul|Manila|Mumbai|Dhaka|Bogotá|Mexico City|New Orleans|Dundee|Jakarta|Manila|Marseille|Naples|Prague|Lisbon|Warsaw|Belgrade|Johannesburg)[^)]*\)/) || [])[1]
  || null;
if (/Long form: on|long-form/i.test(text)) longForm = true;
const budget = longForm ? 140 : 60;
const openingBudget = longForm ? 80 : 40;

const words = (s) => s.split(/\s+/).filter(Boolean).length;
const lines = [];
lines.push(`SCORECARD for ${file}`);
lines.push(`Turns: ${turns.length} · prompt ${version} · city ${city ?? 'unknown — pass --city NAME'} · budget ${budget}${longForm ? ' (long)' : ''}`);
lines.push('');

// 1. Length.
const over = turns
  .map((t, i) => ({ t, i, w: words(t.text), cap: t.pass === 1 && i === 0 ? openingBudget : budget }))
  .filter((o) => o.w > o.cap);
lines.push(`LENGTH: ${over.length}/${turns.length} turns over budget${over.length ? '' : ' — all held'}`);
for (const o of over.slice(0, 6)) lines.push(`  pass ${o.t.pass} ${o.t.name}: ${o.w} words (cap ${o.cap})`);
if (over.length > 6) lines.push(`  …and ${over.length - 6} more`);
lines.push('');

// 2. Echo clusters (each turn vs all earlier turns).
const clusters = [];
for (let i = 1; i < turns.length; i += 1) {
  const priors = turns.slice(0, i).map((t) => t.text);
  if (sharesPassage(turns[i].text, priors)) {
    const sample = findSharedPassage(turns[i].text, priors);
    let withWho = '?';
    for (let j = 0; j < i; j += 1) {
      if (sharesPassage(turns[i].text, [turns[j].text])) { withWho = `pass ${turns[j].pass} ${turns[j].name}`; break; }
    }
    clusters.push({ i, sample });
    turns[i].echoWith = withWho;
  }
}
lines.push(`ECHO: ${clusters.length} turns share an 8-word run with an earlier turn${clusters.length ? '' : ' — none'}`);
lines.push('(verbatim runs only — paraphrase-level clones stay human; past sittings show the worst echo paraphrases)');
for (const c of clusters) lines.push(`  pass ${turns[c.i].pass} ${turns[c.i].name} ≈ ${turns[c.i].echoWith}: “…${c.sample}…”`);
lines.push('');

// 3. City hold.
if (city) {
  const low = city.toLowerCase();
  const missing = turns.filter((t) => !t.text.toLowerCase().includes(low));
  lines.push(`CITY (${city}): named in ${turns.length - missing.length}/${turns.length} turns${missing.length ? '' : ' — held throughout'}`);
  for (const t of missing) lines.push(`  pass ${t.pass} ${t.name}: no mention`);
} else {
  lines.push('CITY: unknown — re-run with --city NAME');
}
lines.push('');

// 4b. Loans per turn: single-quoted multi-word spans (verbatim loans) plus
// [n] manifest tags. Thresholds follow the prompt contract (Medium ≥2,
// High ≥4; Low paraphrases). The grader stays strict here on purpose: the
// live badge excludes shared loans, so this count is the check on
// under-borrowing, not over-sharing.
const level = (((text.match(/Level: (\w+)/) || [])[1]
  || (text.slice(0, 600).match(/\b(High|Medium|Low)\b/i) || [])[1]
  || 'medium')).toLowerCase();
const loanFloor = level.startsWith('high') ? 4 : level.startsWith('low') ? 0 : 2;
const loansOf = (t) => {
  const quoted = (t.match(/'[^']* [^']*'/g) || []).length;
  const tags = (t.match(/\[\d+\]/g) || []).length;
  return { quoted, tags, total: quoted + tags };
};
const loanShort = level.startsWith('low')
  ? []
  : turns.filter((t) => loansOf(t.text).total < loanFloor);
lines.push(`LOANS (floor ${loanFloor} at ${level}): ${loanShort.length}/${turns.length} turns under-borrow${loanShort.length ? '' : ' — all met'}`);
for (const t of loanShort.slice(0, 8)) {
  const l = loansOf(t.text);
  lines.push(`  pass ${t.pass} ${t.name}: ${l.quoted} quoted + ${l.tags} tags`);
}
if (loanShort.length > 8) lines.push(`  …and ${loanShort.length - 8} more`);
lines.push('');

// 4c. Banned terms at Low: per-seat low_translations terms + the shared
// describe-never-name seeds, loaded from source via a throwaway esbuild
// bundle (same mechanism as export-personas) — never a copied list, so it
// cannot drift. Own-seat hits are the strong signal; shared-seed hits the
// backup. Above Low the check is meaningless: skipped, not zero.
const loadBanInventory = () => {
  try {
    const root = process.cwd();
    const esbuild = join(root, 'node_modules', '.bin', 'esbuild');
    const work = join(tmpdir(), `grade-bans-${Date.now()}`);
    const outJson = JSON.stringify(join(tmpdir(), 'grade-bans-out.json'));
    const entry = `import { PHILOSOPHER_DATA } from ${JSON.stringify(join(root, 'src', 'philosophers', 'index.ts'))};
import { LOW_CONCEPT_RULES } from ${JSON.stringify(join(root, 'src', 'philosophers', 'shared', 'low-style.ts'))};
import { writeFileSync as _w } from 'node:fs';
const seedLine = LOW_CONCEPT_RULES.find((s) => s.includes('describe-never-name')) || '';
const seeds = seedLine.split(':').slice(1).join(':').split(/,|;/).map((s) => s.replace(/\\(.*?\\)/g, '').replace(/ and their kin\\.?/i, '').trim()).filter((s) => s.length > 2);
const seats = {};
for (const p of PHILOSOPHER_DATA) {
  seats[p.slug] = { name: p.name, full: p.full_name, terms: (((p.style_essence || {}).low_translations) || []).map((t) => t.term) };
}
_w(${outJson}, JSON.stringify({ seeds, seats }));`;
    const tmp = join(work, 'entry.mjs');
    const out = join(work, 'bundle.mjs');
    mkdirSync(work, { recursive: true });
    writeFileSync(tmp, entry);
    execSync(`"${esbuild}" ${JSON.stringify(tmp)} --bundle --platform=node --format=esm --alias:@=${JSON.stringify(join(root, 'src'))} --outfile=${JSON.stringify(out)} --log-level=error && node ${JSON.stringify(out)}`, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'ignore', 'ignore'] });
    const data = JSON.parse(readFileSync(join(tmpdir(), 'grade-bans-out.json'), 'utf8'));
    rmSync(work, { recursive: true, force: true });
    try { rmSync(join(tmpdir(), 'grade-bans-out.json'), { force: true }); } catch { /* ignore */ }
    return data && data.seats ? data : null;
  } catch {
    return null;
  }
};
let bannedCount = 0;
if (level.startsWith('low')) {
  const inv = loadBanInventory();
  if (!inv) {
    lines.push('BANNED TERMS: inventory unreadable — skipped, grade by eye');
  } else {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hitsFor = (text, terms) => terms.filter((term) => new RegExp(`\\b${esc(term)}(?:s)?\\b`, 'i').test(text));
    const flagged = [];
    for (const t of turns) {
      const tl = t.name.toLowerCase();
      const slug = Object.keys(inv.seats).find((s) => tl === inv.seats[s].name.toLowerCase() || tl === inv.seats[s].full.toLowerCase());
      if (!slug) continue;
      const own = hitsFor(t.text, inv.seats[slug].terms);
      const shared = hitsFor(t.text, inv.seeds.filter((x) => !inv.seats[slug].terms.some((o) => o.toLowerCase() === x.toLowerCase())));
      if (own.length || shared.length) flagged.push({ t, own, shared });
    }
    bannedCount = flagged.length;
    lines.push(`BANNED TERMS (Low, own-seat + shared seeds): ${flagged.length}/${turns.length} turns name a banned term${flagged.length ? '' : ' — all clean'}`);
    for (const f of flagged.slice(0, 8)) lines.push(`  pass ${f.t.pass} ${f.t.name}: ${[...f.own, ...f.shared.map((s) => `${s} (seed)`)].join(', ')}`);
    if (flagged.length > 8) lines.push(`  …and ${flagged.length - 8} more`);
  }
} else {
  lines.push('BANNED TERMS: Low-only check — skipped above Low');
}
lines.push('');
const rlSection = md
  ? (text.match(/## READING LIST\n([\s\S]*?)(?=\n## |\s*$)/) || [])[1] ?? ''
  : (text.match(/READING LIST\n([\s\S]*?)(?=\n[A-Z][A-Z' ]*\n|\nSITTING|\nMODELS USED|$)/) || [])[1] ?? '';
const cites = (rlSection.match(/\[\d+\]/g) || []).length;
lines.push(`CITATIONS: ${cites} works in the reading list`);
lines.push('');

// 5. Margins (Genzie named per pass; questions end with ?).
const genzie = (list) => list.filter((t) => /genzie/i.test(t.text)).length;
const p2 = turns.filter((t) => t.pass === 2);
const p3 = turns.filter((t) => t.pass >= 3);
lines.push(`MARGINS: Genzie named in ${genzie(p2)}/${p2.length} P2 turns, ${genzie(p3)}/${p3.length} P3 turns`);
const unanswered = turns.filter((t) => t.pass >= 3 && !/\?/.test(t.text));
if (unanswered.length) lines.push(`  P3 turns with no question mark (may not answer the note): ${unanswered.map((t) => t.name).join(', ')}`);
lines.push('');

// 6. P3 applied-move check: vague verbs fail the turn.
const vague = p3.filter((t) => /rais(e|ing) awareness|have conversations|prioritis|push for |pushes for/i.test(t.text));
lines.push(`P3 APPLIED CHECK: ${vague.length}/${p3.length} P3 turns use vague verbs (raise awareness, conversations, prioritise, push for)${vague.length ? '' : ' — none'}`);
for (const t of vague) lines.push(`  ${t.name}`);
lines.push('');

// 7. Volatility shapes (halves through the repo detector).
const vol = turns.filter((t) => {
  const mid = Math.floor(t.text.length / 2);
  return detectVolatility(t.text.slice(0, mid), t.text.slice(mid));
});
lines.push(`VOLATILITY: ${vol.length} turns trip the salad detector${vol.length ? '' : ' — none'}`);
for (const t of vol) {
  const mid = Math.floor(t.text.length / 2);
  lines.push(`  pass ${t.pass} ${t.name}: ${detectVolatility(t.text.slice(0, mid), t.text.slice(mid))}`);
}
lines.push('');
lines.push('MANUAL (no mechanical check exists): debts spoken in P1, heat per seat, Medium gloss hygiene, High voice, best/worst quotes, THE VERDICT.');
lines.push('');
lines.push('| Model | Provider | Time | Tokens (in/out, calls) | Errors | Quality notes | Interim verdict | Next step | Final verdict |');
const bannedStr = level.startsWith('low') ? `, banned ${bannedCount}` : '';
lines.push(`| TODO-model | TODO-provider | TODO-time, prompt ${version}, ${city ?? 'TODO-city'} | TODO-tokens | TODO-errors | probe-grade: ${over.length} over budget, ${clusters.length} echo, city ${city ? `${turns.length - turns.filter((t) => !t.text.toLowerCase().includes(city.toLowerCase())).length}/${turns.length}` : '?'}, ${cites} cites, loans met ${turns.length - loanShort.length}/${turns.length}, Genzie P2 ${genzie(p2)}/${p2.length} P3 ${genzie(p3)}/${p3.length}, vague-P3 ${vague.length}, volatile ${vol.length}${bannedStr} | TODO | TODO | Open |`);

console.log(lines.join('\n'));
