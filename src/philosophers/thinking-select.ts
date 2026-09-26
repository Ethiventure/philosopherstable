/**
 * Thinking-slice selector + renderer (Phase 11 pilot).
 *
 * Code proposes, thinker disposes: plain keyword matching over SELECTION
 * TAGS picks 1–3 candidate operations (no model call — same trick RAG uses
 * to pick passages). The renderer turns the slice into a second-person
 * system prompt per mode. THINK sends no EXPRESSION content at all.
 *
 * Dependency-free by design (only relative type import) so node scripts
 * can load it alongside the dialectic builders.
 */
import type { FaultLine, ThinkingEngine, ThinkingOperation } from './thinking-types';
import type { StyleIntensity } from '@/types';
import type { ExpressionModel } from './thinking-types';

export type ThinkMode = 'think' | 'teach' | 'thinkAndSound';

/** Old level → new mode (same conclusions, different expression contract). */
export function intensityToThinkMode(intensity: StyleIntensity): ThinkMode {
  return intensity === 'low' ? 'think' : intensity === 'high' ? 'thinkAndSound' : 'teach';
}

/** `?thinking=1` forces the pilot on without touching stored settings —
 * works on localhost, deploy previews, and live alike. */
export function thinkingPilotRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('thinking') === '1';
  } catch {
    return false;
  }
}

/** `?thinking=1&scene=0` runs the pilot without any scene or metaphor
 * mandate (uncanny-valley experiment). URL-only — no settings field, so
 * the experiment can never leak into anyone else's sitting. */
export function thinkingSceneOff(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get('thinking') === '1' && q.get('scene') === '0';
  } catch {
    return false;
  }
}

/** Trio line for the mode: think sees Think only, teach sees Teach,
 * thinkAndSound sees the verbatim quote itself. */
export function trioFor(expression: ExpressionModel, mode: ThinkMode): string {
  return mode === 'think' ? expression.trio.think : mode === 'teach' ? expression.trio.teach : expression.trio.thinkAndSound;
}

/** Short voice block for teach/thinkAndSound. Null in THINK mode —
 * THINK sends no expression content at all. */
export function buildExpressionText(expression: ExpressionModel, mode: ThinkMode): string | null {
  if (mode === 'think') return null;
  if (mode === 'teach') return `YOUR VOICE (teach — full terms, every term explained): ${expression.sentenceBehaviour}`;
  return [
    `YOUR VOICE: ${expression.movement}`,
    expression.sentenceBehaviour,
    `Temper: ${expression.temper.join(' / ')}`,
    `Core terms (use only where the concept works): ${expression.vocabulary.core.join(', ')}.`,
  ].join('\n');
}

export interface ThinkingSlice {
  operations: ThinkingOperation[];
  faultLine: FaultLine | null;
}

/** Score one operation's tags against question + PREV words. */
function scoreOperation(op: ThinkingOperation, hay: string): number {
  let score = 0;
  for (const raw of op.selectionTags) {
    const words = raw.toLowerCase().split(/\s+/);
    if (words.every((w) => hay.includes(w))) score += words.length > 1 ? 3 : 1;
  }
  return score;
}

export function selectThinkingSlice(
  engine: ThinkingEngine,
  question: string,
  prevText: string | null,
  prevSlug: string | null,
  maxOps = 3,
): ThinkingSlice {
  const hay = `${question}\n${prevText ?? ''}`.toLowerCase();
  const scored = engine.operations.map((op) => ({ op, score: scoreOperation(op, hay) }));
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0).slice(0, maxOps);
  // Fallback: nothing matched — first operation (the thinker's default move).
  // Entry questions always ride in the prompt regardless.
  const operations = (hits.length > 0 ? hits : scored.slice(0, 1)).map((s) => s.op);
  const faultLine = prevSlug ? engine.faultLines.find((f) => f.with === prevSlug) ?? null : null;
  return { operations, faultLine };
}

function renderOperation(op: ThinkingOperation): string {
  return [
    `OPERATION — ${op.name}. Trigger: ${op.trigger}`,
    `Move: ${op.move}`,
    `Preserve: ${op.preserves} Reject: ${op.rejects}`,
    `Payoff: ${op.payoff}`,
  ].join('\n');
}

const MODE_LINES: Record<ThinkMode, string> = {
  think:
    'THINK MODE: reason only, no added expression style. No signature terms, no linguistic tics, no temper performance, no quotations. Keep the full complexity of the move — clarity comes from the reasoning, never from simplifying. Your thinking move must carry your identity alone.',
  teach:
    'TEACH MODE: full complexity, every term taught. Keep your real terminology; weave each term’s plain meaning inside its sentence plus one short concrete sentence showing what it does. Nothing reduced; everything explained. Fewer, shorter quotes than full voice — each quote costs explaining words.',
  thinkAndSound:
    'THINK & SOUND MODE: full thinking in your full voice. Your expression habits below govern wording, rhythm, and terminology only — they never add claims. You sound like yourself because you think like yourself, never as mimicry.',
};

/**
 * System prompt from a thinking slice. `expressionText` is a short,
 * pre-rendered voice block (movement + sentence + temper) — pass null in
 * THINK mode. Trio lines ride per mode: think sees Think only, teach sees
 * Teach, thinkAndSound sees the verbatim quote itself.
 */
export function renderThinkingPersona(
  engine: ThinkingEngine,
  mode: ThinkMode,
  slice: ThinkingSlice,
  expressionText: string | null,
  trioLine: string | null,
): string {
  const lines: string[] = [engine.identity, ''];
  lines.push(
    'YOUR FIRST QUESTIONS — ask these of any topic before anything else:',
    ...engine.problemSensing.entry.map((q) => `- ${q}`),
    '',
  );
  lines.push(
    'YOUR PRESSURE QUESTIONS — once you detect weakness:',
    ...engine.problemSensing.pressure.map((q) => `- ${q}`),
    '',
  );
  lines.push('CANDIDATE OPERATIONS (code-proposed from your tags — use what fits, ignore the rest):');
  for (const op of slice.operations) lines.push('', renderOperation(op));
  lines.push('');
  lines.push(
    'YOUR LOAD-BEARING DISTINCTIONS:',
    ...engine.problemSensing.distinctions.map((d) => `- ${d.pair[0]} vs ${d.pair[1]}: ${d.whyItMatters}`),
    '',
  );
  if (slice.faultLine) {
    const f = slice.faultLine;
    lines.push(
      `FAULT LINE with ${f.with}: shared ground — ${f.sharedPremise} Split point — ${f.divergencePoint}`,
      `Their pressure on you: ${f.strongestOther} Your transforming move: ${f.transformingMove}`,
      '',
    );
  }
  lines.push(
    'YOUR JUDGMENT PATTERNS:',
    ...engine.judgment.patterns.map((p) => `- ${p}`),
    '',
  );
  if (expressionText) lines.push(expressionText, '');
  if (trioLine) lines.push(`YOUR WORKED EXAMPLE (same move, your mode — shape your terms like this): “${trioLine}”`, '');
  lines.push(MODE_LINES[mode]);
  return lines.join('\n');
}
