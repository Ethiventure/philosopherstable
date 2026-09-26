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
import { selectThinkingSlice, renderThinkingPersona } from '../src/philosophers/thinking-select.ts';
import { buildPilotTurnInstruction } from '../src/lib/dialectic/prompts.ts';

const QUESTION =
  'Automation and robotics have replaced almost all human necessary work. How does this change the education system? What do we teach children?';
const MARX_PREV =
  'The school trains labour-power for capital: strip it down, for automation has abolished the wages system that schooling served, and education must become the free development of human powers rather than the production of employable skills.';

const rawMode = process.argv.find((a) => a.startsWith('--mode'))?.split('=')[1] ?? 'think';
const modes = rawMode === 'all' ? ['think', 'teach', 'thinkAndSound'] : [rawMode];

const trioFor = (expr, mode) =>
  mode === 'think' ? expr.trio.think : mode === 'teach' ? expr.trio.teach : expr.trio.thinkAndSound;

const exprTextFor = (slug, expr, mode) => {
  if (mode === 'think') return null;
  if (mode === 'teach') return `YOUR VOICE (teach — full terms, every term explained): ${expr.sentenceBehaviour}`;
  return [
    `YOUR VOICE: ${expr.movement}`,
    expr.sentenceBehaviour,
    `Temper: ${expr.temper.join(' / ')}`,
    `Core terms (use only where the concept works): ${expr.vocabulary.core.join(', ')}.`,
  ].join('\n');
};

for (const mode of modes) {
  console.log(`\n######## MODE: ${mode} ########`);
  for (const [engine, expr] of [
    [BOOKCHIN_THINKING, BOOKCHIN_EXPRESSION],
    [BLOCH_THINKING, BLOCH_EXPRESSION],
    [SPINOZA_THINKING, SPINOZA_EXPRESSION],
  ]) {
    const prevSlug = engine.slug === 'bookchin' ? 'marx' : engine.slug === 'bloch' ? 'marx' : 'hegel';
    const prev = engine.slug === 'spinoza' ? 'Spirit learns discipline through negation in the school ban.' : MARX_PREV;
    const slice = selectThinkingSlice(engine, QUESTION, prev, prevSlug);
    const prompt = renderThinkingPersona(engine, mode, slice, exprTextFor(engine.slug, expr, mode), trioFor(expr, mode));
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
