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
import type { FaultLine, LifeFile, ThinkerFiles, ThinkingEngine, ThinkingOperation } from './thinking-types';
import type { StyleIntensity } from '@/types';
import type { ExpressionModel } from './thinking-types';

/** Anonymous lead-in (kept here, not in thinking-types, so this module
 * stays node-loadable without extension-ful imports): no name, no
 * stations — the moves must identify. */
export const ANONYMOUS_LEAD =
  'You are one thinker among several at this table. Your name is withheld — even from you. Reason from the machinery below; never claim a name, never guess at one. The other thinkers stay named: answer them as themselves.';

/** Identity line for the prompt: the life file, or the anonymous lead. */
export function identityFor(life: LifeFile, anonymous: boolean): string {
  return anonymous ? ANONYMOUS_LEAD : life.identity;
}

export interface ComposeOpts {
  mode: ThinkMode;
  anonymous?: boolean;
  feelings?: boolean;
  relations?: boolean;
}

/**
 * One composer for every caller (cabinet loop, desk, demo scripts) so the
 * file combinations behave identically everywhere:
 * - named: THINKING + EXPRESSION + LIFE;
 * - anonymous: same minus LIFE (identity line replaced, never omitted);
 * - anonymous + think&sound: trio quote withheld (a verbatim quote names
 *   its author instantly — the one combination that would unblind itself).
 * Teach trio keeps its terms even when anonymous: terms are load-bearing,
 * and anonymous-teach is inherently leaky — documented, not hidden.
 */
export function composePersona(
  entry: ThinkerFiles,
  question: string,
  prevText: string | null,
  prevSlug: string | null,
  opts: ComposeOpts,
): { system: string; slice: ThinkingSlice } {
  const anonymous = opts.anonymous ?? false;
  const picked = selectThinkingSlice(entry.thinking, question, prevText, prevSlug);
  const slice = opts.relations === false ? { ...picked, faultLine: null } : picked;
  const expressionText = opts.mode === 'think'
    ? null
    : buildExpressionText(entry.expression, opts.mode, opts.feelings ?? true);
  const trioLine = opts.mode === 'teach' || (opts.mode === 'thinkAndSound' && !anonymous)
    ? trioFor(entry.expression, opts.mode)
    : opts.mode === 'think' ? trioFor(entry.expression, 'think') : null;
  const system = renderThinkingPersona(
    entry.thinking, opts.mode, slice, expressionText, trioLine, identityFor(entry.life, anonymous),
  );
  return { system, slice };
}

export type ThinkMode = 'think' | 'teach' | 'thinkAndSound';

/** Old level → new mode (same conclusions, different expression contract). */
export function intensityToThinkMode(intensity: StyleIntensity): ThinkMode {
  return intensity === 'low' ? 'think' : intensity === 'high' ? 'thinkAndSound' : 'teach';
}

/** `?thinking=1&scene=0` runs without any scene or metaphor mandate
 * (uncanny-valley experiment). URL-only — no settings field, so
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
 * THINK sends no expression content at all. With feelings off, the temper
 * sentences drop (moves keep their verbs — feelings live in file 1). */
export function buildExpressionText(expression: ExpressionModel, mode: ThinkMode, feelings = true): string | null {
  if (mode === 'think') return null;
  if (mode === 'teach') return `YOUR VOICE (teach — full terms, every term explained): ${expression.sentenceBehaviour}`;
  return [
    `YOUR VOICE: ${expression.movement}`,
    expression.sentenceBehaviour,
    ...(feelings ? [`Temper: ${expression.temper.join(' / ')}`] : []),
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

function renderOperation(op: ThinkingOperation, index: number): string {
  // The name is deliberately withheld: it is a selector label ("Eduction",
  // "Factum into Fieri"), and shown names become borrowed vocabulary. The
  // numbered move carries the full meaning without teaching the word.
  return [
    `MOVE ${index + 1}. When: ${op.trigger}`,
    `Do: ${op.move}`,
    `Keep: ${op.preserves} Drop: ${op.rejects}`,
    `You gain: ${op.payoff}`,
  ].join('\n');
}

const MODE_LINES: Record<ThinkMode, string> = {
  think:
    'THINK MODE: reason only, no added expression style. Signature terms appear only where the move needs them — never borrow a word you are not using. No linguistic tics, no temper performance, no quotations. Keep the full complexity of the move — clarity comes from the reasoning, never from simplifying. Your thinking move must carry your identity alone.',
  teach:
    'TEACH MODE: full complexity, every term taught. Keep your real terminology; weave each term’s plain meaning inside its sentence plus one short concrete sentence showing what it does. Nothing reduced; everything explained. Fewer, shorter quotes than full voice — each quote costs explaining words.',
  thinkAndSound:
    'THINK & SOUND MODE: full thinking in your full voice. Your expression habits below govern wording, rhythm, and terminology only — they never add claims. You sound like yourself because you think like yourself, never as mimicry.',
};

/**
 * System prompt from a thinking slice. `expressionText` is a short,
 * pre-rendered voice block (movement + sentence + temper) — pass null in
 * THINK mode. Trio rides in TEACH only: rules describe, examples
 * demonstrate, and teach is the mode that needs the shape shown.
 *
 * Barest-bones audit (Sep 2026): pressure questions and judgment patterns
 * were cut from the render — the moves imply the choices, and the files
 * keep the rest for selective activation later. Rendered prompt is now:
 * identity, entry questions, numbered moves, distinctions, fault line,
 * expression (non-think), trio (teach only), mode line.
 */
export function renderThinkingPersona(
  engine: ThinkingEngine,
  mode: ThinkMode,
  slice: ThinkingSlice,
  expressionText: string | null,
  trioLine: string | null,
  identity: string,
): string {
  const lines: string[] = [identity, ''];
  lines.push(
    'YOUR FIRST QUESTIONS — ask these of any topic before anything else:',
    ...engine.problemSensing.entry.map((q) => `- ${q}`),
    '',
  );
  lines.push('CANDIDATE MOVES (code-proposed from your tags — use what fits, ignore the rest):');
  slice.operations.forEach((op, i) => lines.push('', renderOperation(op, i)));
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
  if (expressionText) lines.push(expressionText, '');
  if (mode === 'teach' && trioLine) lines.push(`YOUR WORKED EXAMPLE (shape every kept term exactly like this — term kept, meaning woven beside it): “${trioLine}”`, '');
  lines.push(MODE_LINES[mode]);
  return lines.join('\n');
}
