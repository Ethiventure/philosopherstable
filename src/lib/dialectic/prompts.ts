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
  normal: { negation: 40, incorporation: 20, reformulation: 90, total: 150, opening: 90 },
  long: { negation: 110, incorporation: 55, reformulation: 235, total: 400, opening: 240 },
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
  isFinalSeat: boolean;
  longForm: boolean;
}

export function buildTurnInstruction({ kind, prevName, isFinalSeat, longForm }: TurnInstructionArgs): string {
  const b = longForm ? WORD_BUDGETS.long : WORD_BUDGETS.normal;

  if (kind === 'opening') {
    return [
      `OPENING TURN (HARD ceiling: ${b.opening} words — shorter is welcome). Answer the question directly in your own framework.`,
      'Do not refer to any other thinker; there is no predecessor yet.',
      'Follow your characteristic movement.',
      'Write at length in your own diction and rhythm — continuous prose, no headings — the word budget is for development, not padding.',
      'End on the live edge of your argument: the unresolved tension, stated as your framework\'s own problem, not as a message to anyone.',
    ].join(' ');
  }

  const prev = prevName ?? 'PREV';

  const reformulationLine =
    kind === 'reconstruction'
      ? `3. REFORMULATION (roughly ${b.reformulation} words): what institutions, practices, or forms of collective power follow now the contradictions are visible.`
      : `3. REFORMULATION (roughly ${b.reformulation} words): restate the problem from your framework at a higher level of determination.`;

  const closingLine = isFinalSeat
    ? 'End by returning the question, as it now stands, to the user.'
    : 'End on the live edge: the unresolved tension, stated as your framework\'s own problem. Do not address or name any next speaker — the next voice cuts in on its own.';

  return [
    `${kind === 'reconstruction' ? 'RECONSTRUCTION' : 'IMMANENT CRITIQUE'} TURN (HARD ceiling: ${b.total} words total across all three sections — shorter is welcome; section lengths are guidance, the total is the cap). Respond ONLY to your immediate predecessor ${prev}.`,
    `CUT IN, don't hand over: open mid-argument by seizing the weakest point in ${prev}'s closing lines. No preamble, no greeting, no naming ceremony — interrupt.`,
    `1. DETERMINATE NEGATION (roughly ${b.negation} words): expose the internal tension in ${prev}'s claim using their own premises. Name ${prev} and the exact claim.`,
    `2. SUBSTANTIVE INCORPORATION (roughly ${b.incorporation} words): preserve what is true in ${prev}. One clause only; do not re-explain it, and do not repeat your own prior turns — name your earlier position in one clause only if you must, then show the shift.`,
    reformulationLine,
    closingLine,
    'Hegel/Marx method: negation must be determinate (preserve-and-elevate), never mere dismissal. Add something new; do not restate PREV or yourself.',
    'VOICE: write continuous prose in your own diction, syntax and rhythm (your STYLE ESSENCE governs the sentence) — no headings or labels inside your prose. The dialectical movement (cutting in, negation of PREV, incorporation of what holds, reformulation) must be audible in the argument itself, never announced. Never open with a generic verdict on PREV ("errs", "fails to see", "is mistaken", "overlooks") — begin from the concrete object and criticise with your own toolkit\'s verbs.',
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
      'YOUR OWN PRIOR TURNS (anti-self-repetition only): name your earlier position in one clause and show how it has shifted.',
      ...ownPriorLines.map((line) => `- ${line}`),
    );
  }

  return parts.join('\n');
}

export const STRUCTURED_OUTPUT_HINT = [
  'Respond with JSON only, matching this shape exactly (all five keys always present):',
  '{ negation, incorporation, reformulation, new_contribution, works_referenced: string[] }',
  'The JSON envelope is mandatory — but every text value holds continuous label-free prose: no headings, no "Negation —" labels, no numbered parts inside the values.',
  'The four text sections together must stay under the total word budget above; brevity within it is good. Per-section counts are guidance.',
  'new_contribution is one export-ready line: the single determination this turn adds. It is stored for display, never fed back as model input.',
].join(' ');
