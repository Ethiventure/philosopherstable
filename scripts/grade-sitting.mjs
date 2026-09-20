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
 * namings per pass, P3 vague verbs, volatility shapes. Prints a plain-text
 * scorecard (reads aloud cleanly) plus a paste-ready models-tried.md row
 * with human fields marked TODO — best/worst quotes and the verdict stay
 * yours; the machine never writes them.
 *
 * Uses the repo's own detectors (sharesPassage, detectVolatility) imported
 * from src — same normalization as the live guards, no duplication.
 */
import { readFileSync } from 'node:fs';
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

// 4. Citations: entries in the reading-list section (raw wraps each on its
// own line; filed md joins them with semicolons across lines — count tags).
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
lines.push(`| TODO-model | TODO-provider | TODO-time, prompt ${version}, ${city ?? 'TODO-city'} | TODO-tokens | TODO-errors | probe-grade: ${over.length} over budget, ${clusters.length} echo, city ${city ? `${turns.length - turns.filter((t) => !t.text.toLowerCase().includes(city.toLowerCase())).length}/${turns.length}` : '?'}, ${cites} cites, Genzie P2 ${genzie(p2)}/${p2.length} P3 ${genzie(p3)}/${p3.length}, vague-P3 ${vague.length}, volatile ${vol.length} | TODO | TODO | Open |`);

console.log(lines.join('\n'));
