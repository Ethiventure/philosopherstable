/**
 * pilot-slice-demo: dry-run the Phase 11 thinking slice (no API calls).
 *
 * Loads the 3 pilot THINKING files + selector/renderer via relative
 * imports (no `@/` graph), runs the fixed education question with a stub
 * Marx PREV, and prints per-seat/per-mode: selected operations, fault
 * line hit, prompt size (chars + ~tokens at chars/4) against the ~7k
 * shared wall. Proves the slice fits before any live sitting burns quota.
 *
 *   node scripts/pilot-slice-demo.mjs [--mode think|teach|thinkAndSound]
 */
import { BOOKCHIN_THINKING } from '../src/philosophers/bookchin.thinking.ts';
import { BOOKCHIN_EXPRESSION } from '../src/philosophers/bookchin.expression.ts';
import { BLOCH_THINKING } from '../src/philosophers/bloch.thinking.ts';
import { BLOCH_EXPRESSION } from '../src/philosophers/bloch.expression.ts';
import { SPINOZA_THINKING } from '../src/philosophers/spinoza.thinking.ts';
import { SPINOZA_EXPRESSION } from '../src/philosophers/spinoza.expression.ts';
import { KANT_THINKING } from '../src/philosophers/kant.thinking.ts';
import { KANT_EXPRESSION } from '../src/philosophers/kant.expression.ts';
import { HEGEL_THINKING } from '../src/philosophers/hegel.thinking.ts';
import { HEGEL_EXPRESSION } from '../src/philosophers/hegel.expression.ts';
import { MARX_THINKING } from '../src/philosophers/marx.thinking.ts';
import { MARX_EXPRESSION } from '../src/philosophers/marx.expression.ts';
import { LENIN_THINKING } from '../src/philosophers/lenin.thinking.ts';
import { LENIN_EXPRESSION } from '../src/philosophers/lenin.expression.ts';
import { BOGDANOV_THINKING } from '../src/philosophers/bogdanov.thinking.ts';
import { BOGDANOV_EXPRESSION } from '../src/philosophers/bogdanov.expression.ts';
import { WEIL_THINKING } from '../src/philosophers/weil.thinking.ts';
import { WEIL_EXPRESSION } from '../src/philosophers/weil.expression.ts';
import { DELEUZE_THINKING } from '../src/philosophers/deleuze.thinking.ts';
import { DELEUZE_EXPRESSION } from '../src/philosophers/deleuze.expression.ts';
import { ROSE_THINKING } from '../src/philosophers/rose.thinking.ts';
import { ROSE_EXPRESSION } from '../src/philosophers/rose.expression.ts';
import { FISHER_THINKING } from '../src/philosophers/fisher.thinking.ts';
import { FISHER_EXPRESSION } from '../src/philosophers/fisher.expression.ts';
import { composePersona } from '../src/philosophers/thinking-select.ts';
import { BOOKCHIN_LIFE } from '../src/philosophers/bookchin.life.ts';
import { BLOCH_LIFE } from '../src/philosophers/bloch.life.ts';
import { SPINOZA_LIFE } from '../src/philosophers/spinoza.life.ts';
import { KANT_LIFE } from '../src/philosophers/kant.life.ts';
import { HEGEL_LIFE } from '../src/philosophers/hegel.life.ts';
import { MARX_LIFE } from '../src/philosophers/marx.life.ts';
import { LENIN_LIFE } from '../src/philosophers/lenin.life.ts';
import { BOGDANOV_LIFE } from '../src/philosophers/bogdanov.life.ts';
import { WEIL_LIFE } from '../src/philosophers/weil.life.ts';
import { DELEUZE_LIFE } from '../src/philosophers/deleuze.life.ts';
import { ROSE_LIFE } from '../src/philosophers/rose.life.ts';
import { FISHER_LIFE } from '../src/philosophers/fisher.life.ts';
import { buildPilotTurnInstruction } from '../src/lib/dialectic/prompts.ts';

const QUESTION =
  'Automation and robotics have replaced almost all human necessary work. How does this change the education system? What do we teach children?';
const MARX_PREV =
  'The school trains labour-power for capital: strip it down, for automation has abolished the wages system that schooling served, and education must become the free development of human powers rather than the production of employable skills.';

const rawMode = process.argv.find((a) => a.startsWith('--mode'))?.split('=')[1] ?? 'think';
const modes = rawMode === 'all' ? ['think', 'teach', 'thinkAndSound'] : [rawMode];
const anon = process.argv.includes('--anon');

for (const mode of modes) {
  console.log(`\n######## MODE: ${mode}${anon ? ' (anonymous)' : ''} ########`);
  for (const [engine, expr, life, prevSlug] of [
    [SPINOZA_THINKING, SPINOZA_EXPRESSION, SPINOZA_LIFE, 'hegel'],
    [KANT_THINKING, KANT_EXPRESSION, KANT_LIFE, 'hegel'],
    [HEGEL_THINKING, HEGEL_EXPRESSION, HEGEL_LIFE, 'marx'],
    [MARX_THINKING, MARX_EXPRESSION, MARX_LIFE, 'hegel'],
    [LENIN_THINKING, LENIN_EXPRESSION, LENIN_LIFE, 'marx'],
    [BOGDANOV_THINKING, BOGDANOV_EXPRESSION, BOGDANOV_LIFE, 'lenin'],
    [BLOCH_THINKING, BLOCH_EXPRESSION, BLOCH_LIFE, 'marx'],
    [WEIL_THINKING, WEIL_EXPRESSION, WEIL_LIFE, 'marx'],
    [BOOKCHIN_THINKING, BOOKCHIN_EXPRESSION, BOOKCHIN_LIFE, 'marx'],
    [DELEUZE_THINKING, DELEUZE_EXPRESSION, DELEUZE_LIFE, 'hegel'],
    [ROSE_THINKING, ROSE_EXPRESSION, ROSE_LIFE, 'hegel'],
    [FISHER_THINKING, FISHER_EXPRESSION, FISHER_LIFE, 'deleuze'],
  ]) {
    const prev = engine.slug === 'spinoza' ? 'Spirit learns discipline through negation in the school ban.' : MARX_PREV;
    const { system: prompt, slice } = composePersona({ thinking: engine, expression: expr, life }, QUESTION, prev, prevSlug, { mode, anonymous: anon });
    const toks = Math.round(prompt.length / 4);
    console.log(`\n--- ${engine.slug} (${prompt.length} chars ≈ ${toks} tokens) ---`);
    console.log(`ops: ${slice.operations.map((o) => o.name).join(' | ')}`);
    console.log(`fault: ${slice.faultLine ? slice.faultLine.with : 'none'}`);
    if (toks > 7000) console.log('WALL-BREACH: over the ~7k shared wall');
  }
}
console.log('\nDone — no API calls made.');

console.log('\n######## TURN SCAFFOLD (critique, pass 1) ########');
for (const noScene of [false, true]) {
  const t = buildPilotTurnInstruction({ kind: 'critique', prevName: 'Marx', isFinalSeat: false, longForm: false, pass: 1, threadCity: 'Nairobi', noScene });
  console.log(`${noScene ? 'no-scene' : 'scene'}: ${t.length} chars ≈ ${Math.round(t.length / 4)} tokens`);
}
