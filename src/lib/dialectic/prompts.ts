/**
 * Blunt (baton) rotation prompt builders — Phase 2c.
 *
 * Only pass 1 seat 1 opens. Every other turn determinately negates its
 * immediate predecessor (PREV) using PREV's own premises, preserves what
 * holds, reformulates from its own framework, and hands a contradiction to
 * the next seat (NEXT) by name. PREV crosses pass boundaries.
 *
 * Word budgets are tight on purpose: each turn does less so the rotation
 * stays readable. Normal ≈150 words/turn, long-form ≈400. Totals are the
 * cap; per-section counts below are guidance for shaping the answer, not
 * hard limits — the four parts must all be present and the total must hold.
 *
 * Context discipline (pure, except own priors): each call sees ONLY
 * a) the original question, b) the immediate predecessor's full text,
 * c) the speaker's own prior turns (one line each, anti-self-repetition).
 * The global ledger is NOT fed back. `new_contribution` is still stored per
 * turn for export/display, never as model input.
 */

export type TurnKind = 'opening' | 'critique' | 'reconstruction';

export const WORD_BUDGETS = {
  normal: { negation: 35, incorporation: 20, reformulation: 65, contradiction: 30, total: 150, opening: 90 },
  long: { negation: 95, incorporation: 55, reformulation: 175, contradiction: 75, total: 400, opening: 240 },
} as const;

export const MAX_OUTPUT_TOKENS = { normal: 300, long: 600 } as const;

/** Pass and seat are 1-indexed to match the UI (`pass_number`, `seat_position + 1`). */
export function getTurnKind(pass: number, seatPosition1Indexed: number): TurnKind {
  if (pass === 1 && seatPosition1Indexed === 1) return 'opening';
  if (pass === 3) return 'reconstruction';
  return 'critique';
}

interface TurnInstructionArgs {
  kind: TurnKind;
  prevName: string | null;
  nextName: string | null;
  isFinalSeat: boolean;
  longForm: boolean;
}

export function buildTurnInstruction({ kind, prevName, nextName, isFinalSeat, longForm }: TurnInstructionArgs): string {
  const b = longForm ? WORD_BUDGETS.long : WORD_BUDGETS.normal;

  if (kind === 'opening') {
    return [
      `OPENING TURN (max ~${b.opening} words). Answer the question directly in your own framework.`,
      'Do not refer to any other thinker; there is no predecessor yet.',
      'Follow your characteristic movement.',
      nextName
        ? `End by handing ${nextName} a contradiction to negate, by name.`
        : 'End by stating the contradiction the next seat must address.',
    ].join(' ');
  }

  const prev = prevName ?? 'PREV';
  const next = isFinalSeat ? null : (nextName ?? 'NEXT');

  const reformulationLine =
    kind === 'reconstruction'
      ? `3. REFORMULATION (roughly ${b.reformulation} words): what institutions, practices, or forms of collective power follow now the contradictions are visible.`
      : `3. REFORMULATION (roughly ${b.reformulation} words): restate the problem from your framework at a higher level of determination.`;

  const handoffLine = isFinalSeat
    ? '4. CONTRADICTION PASSED ON: return the question, as it now stands, to the user.'
    : next
      ? `4. CONTRADICTION PASSED ON (roughly ${b.contradiction} words): name ${next} and demand they address the unresolved contradiction.`
      : '4. CONTRADICTION PASSED ON: name the next seat and hand them the unresolved contradiction.';

  return [
    `${kind === 'reconstruction' ? 'RECONSTRUCTION' : 'IMMANENT CRITIQUE'} TURN (max ~${b.total} words total; section lengths are guidance, the total is the cap). Respond ONLY to your immediate predecessor ${prev}.`,
    `1. DETERMINATE NEGATION (roughly ${b.negation} words): expose the internal tension in ${prev}'s claim using their own premises. Name ${prev} and the exact claim.`,
    `2. SUBSTANTIVE INCORPORATION (roughly ${b.incorporation} words): preserve what is true in ${prev}. One clause only; do not re-explain it, and do not repeat your own prior turns — name your earlier position in one clause only if you must, then show the shift.`,
    reformulationLine,
    handoffLine,
    'Hegel/Marx method: negation must be determinate (preserve-and-elevate), never mere dismissal. Add something new; do not restate PREV or yourself.',
  ].join(' ');
}

interface UserMessageArgs {
  question: string;
  prevText: string | null;
  ownPriorLines: string[];
  turnInstruction: string;
}

export function buildUserMessage({ question, prevText, ownPriorLines, turnInstruction }: UserMessageArgs): string {
  const parts = [
    `QUESTION (verbatim): ${question}`,
    '',
    turnInstruction,
  ];

  if (prevText) {
    parts.push('', `IMMEDIATE PREDECESSOR'S FULL TEXT:\n${prevText}`);
  }

  if (ownPriorLines.length > 0) {
    parts.push(
      '',
      'YOUR OWN PRIOR TURNS (one-line summaries, for anti-self-repetition only — this is the only history you see besides PREV): do not restate your prior position. Name it in one clause and show how it has shifted.',
      ...ownPriorLines.map((line) => `- ${line}`),
    );
  }

  return parts.join('\n');
}

export const STRUCTURED_OUTPUT_HINT = [
  'Respond with JSON only, matching this shape:',
  '{ negation, incorporation, reformulation, contradiction_passed, new_contribution, works_referenced: string[] }',
  'The four text sections together obey the total word budget above; per-section counts are guidance.',
  'new_contribution is one export-ready line: the single determination this turn adds. It is stored for display, never fed back as model input.',
].join(' ');
