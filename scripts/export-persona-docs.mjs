/**
 * export-persona-docs: generate docs/persona-prompts.md — one self-contained
 * CustomGPT-ready persona prompt per seat, rendered from the repo's own
 * sources (never hand-copied, so it cannot drift from the data).
 * Re-run after any philosopher/style/corpus/debt edit:
 *   npm run personas:docs
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = join(tmpdir(), `persona-docs-${Date.now()}`);
mkdirSync(work, { recursive: true });
const tmp = join(work, 'entry.mjs');
const out = join(work, 'bundle.mjs');

const entry = `import { PHILOSOPHER_DATA } from ${JSON.stringify(join(root, 'src/philosophers/index.ts'))};
import { SEAT_TRIOS } from ${JSON.stringify(join(root, 'src/philosophers/trios.ts'))};
import { CORPUS_SOURCES_DATA } from ${JSON.stringify(join(root, 'src/data/corpus-sources.ts'))};
import { PROMPT_VERSION } from ${JSON.stringify(join(root, 'src/lib/dialectic/prompts.ts'))};
const AUTHOR_TO_SLUG = { 'Baruch Spinoza': ['spinoza'], 'Immanuel Kant': ['kant'], 'Karl Marx': ['marx'], 'Karl Marx and Friedrich Engels': ['marx'], 'G.W.F. Hegel': ['hegel'], 'Gilles Deleuze': ['deleuze'], 'Vladimir Lenin': ['lenin'], 'Murray Bookchin': ['bookchin'], 'Alexander Bogdanov': ['bogdanov'], 'Mark Fisher': ['fisher'], 'Simone Weil': ['weil'], 'Ernst Bloch': ['bloch'], 'Gillian Rose': ['rose'] };
const lines = [];
const push = (...xs) => { for (const x of xs) lines.push(x); };
const title = (s) => s.replace(/_/g, ' ');
const bullets = (arr) => arr.map((x) => '- ' + x);
push('# Persona prompts — one per character', '');
push('Generated from this repo (' + PROMPT_VERSION + ', ' + new Date().toISOString().slice(0, 10) + '). Regen: npm run personas:docs. Sources: src/philosophers/, src/data/corpus-sources.ts.', '');
push('USE: s1+s2 = CustomGPT Instructions; s5 = knowledge links. s3 = in-prompt knowledge, keep. Genzie = fictional, no texts by design.', '');
for (const p of PHILOSOPHER_DATA) {
  const e = p.style_essence || {};
  const trio = SEAT_TRIOS[p.slug];
  const dates = p.birth_year + (p.death_year ? '–' + p.death_year : '–present');
  const holdings = CORPUS_SOURCES_DATA.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => (AUTHOR_TO_SLUG[s.author] || []).includes(p.slug));
  push('---', '', '## ' + p.full_name + ' (' + dates + ')', '');
  push(p.biography || '', '');
  push('### 1. Identity card', '');
  push('- ' + p.full_name + ' (' + dates + ') | boundary: ' + (p.historical_boundary || p.profile.historical_boundary || 'unset — do not invent') + ' | centre: ' + p.analytical_center.join(', ') + ' | tone: ' + p.profile.emotional_tone, '');
  push('### 2. Persona prompt (paste s1+s2 as Instructions)', '');
  push('You are ' + p.full_name + ', ' + (p.profile.identity || '') + '.', '');
  if (p.profile.core_principle) push('PRINCIPLE: ' + p.profile.core_principle, '');
  if (e.characteristic_movement) push('MOVEMENT: ' + e.characteristic_movement, '');
  if (e.style_dna) push('DNA: ' + e.style_dna, '');
  if (e.core_mechanisms) push('MECHANISMS: ' + e.core_mechanisms, '');
  if (e.cda_reader_effects) push('READER EFFECT: ' + e.cda_reader_effects, '');
  if (e.prompt) push('REGISTER: ' + e.prompt, '');
  if (e.cda_profile) push('VOICE PROFILE: ' + Object.entries(e.cda_profile).map(([k, v]) => title(k) + ' — ' + v).join('; '), '');
  if (e.generation_rules && e.generation_rules.length) push('GENERATION RULES:', ...bullets(e.generation_rules), '');
  if (e.dialect_verbs) push('MOVE VERBS — break: ' + e.dialect_verbs.break.join(' / ') + '. Build: ' + e.dialect_verbs.build.join(' / ') + '.', '');
  if (e.stock_phrases) {
    for (const kind of ['rebuttal', 'concession', 'reframing']) {
      const list = e.stock_phrases[kind];
      if (list && list.length) push(kind.toUpperCase() + ' OPENERS (1 use each; (X)=slot):', ...bullets(list), '');
    }
  }
  if (e.intensity) {
    push('LEVEL: default Medium. Ideas fixed; diction varies:', '- Low: ' + (e.intensity.low || 'not set'), '- Medium: ' + (e.intensity.medium || 'not set'), '- High: ' + (e.intensity.high || 'not set'), 'Confused signals (asks definitions, lost, off-point) → Low, silently; restore when comfortable. Confident term use → offer High once.', '');
  }
  if (e.high_exemplar && e.high_exemplar.quote) {
    push('ANCHOR — study, never copy (' + (e.high_exemplar.source || 'source unrecorded') + '):', '"' + e.high_exemplar.quote + '"', '');
    if (trio) push('Med: "' + trio.medium + '"', '', 'Low: "' + trio.low + '"', '');
  } else if (trio) {
    push('Med: "' + trio.medium + '"', '', 'Low: "' + trio.low + '"', '');
  }
  push('HONESTY: no unshown texts; name only conversation-present people/places; admit thin input. Vary openings; never recite rules.', '');
  push('HABITS: end with 1 plain check-question (max 1). Cold open: 1 short question from centre, no lecture. Past-boundary questions: framework answer + admit limit.', '');
  push('### 3. Knowledge (in-prompt, keep whole)', '');
  for (const [k, v] of Object.entries(p.profile)) {
    if (['identity', 'emotional_tone', 'core_principle', 'historical_boundary', 'relevant_interlocutors'].includes(k)) continue;
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (Array.isArray(v)) push(title(k) + ':', ...bullets(v), '');
    else push(title(k) + ': ' + v, '');
  }
  if (p.key_works && p.key_works.length) {
    push('### 4. Key works (curator notes)', '');
    for (const w of p.key_works) push('- ' + w.title + (w.year ? ' (' + w.year + ')' : '') + (w.note ? ' — ' + w.note : ''), '');
    push('');
  }
  if (holdings.length) {
    push('### 5. Writings (attach as knowledge)', '');
    for (const { s, n } of holdings) {
      push('- [' + n + '] ' + s.title + (s.publication_date ? ' (' + s.publication_date + ')' : '') + ' — ' + s.author + ' | ' + s.licence_status + ' | ' + (s.full_text_ingested ? 'full-text' : (s.metadata_only ? 'metadata-only' : 'link-only')) + (s.language && s.language !== 'en' ? ' | ' + s.language : '') + (s.translation_notes ? ' | ed: ' + s.translation_notes : ''));
      push('  URL: ' + (s.source_url || 'none recorded'));
    }
    push('');
  } else {
    push('### 5. Writings', '', 'No corpus entries recorded for this character. (Genzie: fictional reader — no texts exist by design.)', '');
  }
}
console.log(JSON.stringify({ promptVersion: PROMPT_VERSION, seats: PHILOSOPHER_DATA.map((p) => p.slug), lines: lines.length }));
console.log('DOC-SEPARATOR-' + lines.join('\\n'));
`;
writeFileSync(tmp, entry);
const raw = execSync(`npx esbuild ${JSON.stringify(tmp)} --bundle --platform=node --format=esm --alias:@=${JSON.stringify(join(root, 'src'))} --outfile=${JSON.stringify(out)} --log-level=error && node ${JSON.stringify(out)}`, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const [metaJson, doc] = raw.split('DOC-SEPARATOR-');
const meta = JSON.parse(metaJson);
mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs', 'persona-prompts.md'), doc.trimEnd() + '\n');
rmSync(work, { recursive: true, force: true });
console.log(`persona-prompts: ${meta.seats.length} seats (${meta.seats.join(', ')}), prompt ${meta.promptVersion}`);
