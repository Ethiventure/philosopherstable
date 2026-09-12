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
 * hard limits — both parts must be present and the total must hold.
 *
 * Context discipline (pure, except own priors): each call sees ONLY
 * a) the original question, b) the immediate predecessor's full text,
 * c) the speaker's own prior turns (one line each, anti-self-repetition).
 * Pass 3 additionally sees d) every other seat's one-line determinations,
 * so the final rotation can invoke the most striking ideas by name.
 * The global ledger is NOT fed back. `new_contribution` is still stored per
 * turn for export/display, never as model input (except the pass-3 survey).
 */

export type TurnKind = 'opening' | 'critique' | 'reconstruction';

export const WORD_BUDGETS = {
  normal: { negation: 40, reformulation: 60, total: 100, opening: 60 },
  long: { negation: 100, reformulation: 180, total: 280, opening: 160 },
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
  /** Pass 3 runs the rotation backwards: each seat answers its left neighbour. */
  reversed?: boolean;
}

export function buildTurnInstruction({ kind, prevName, isFinalSeat, longForm, reversed = false }: TurnInstructionArgs): string {
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
      ? `2. REFORMULATION (roughly ${b.reformulation} words): what institutions, practices, or forms of collective power follow now the contradictions are visible. Land one concrete present-tense consequence — and then go one step further into practice: name one specific decision, campaign, or slogan that follows, with who decides and where the fight happens. Write the demand so ordinary people could carry it. Abstractions without a campaign, a decision, or a slogan are unfinished. Phrase every consequence as a commitment (must, shall, will, let us) — never a possibility (may, might, could, would). Hedged reformulations fail the turn.`
      : `2. REFORMULATION (roughly ${b.reformulation} words): restate the problem from your framework at a higher level of determination. Land one concrete present-tense consequence — an institution, a choice, a cost — so the abstraction touches 21st-century material reality. Name who must act and where; a demand the masses could carry beats a correct analysis nobody can use. Phrase it as a commitment (must, shall, will), never a possibility (may, might, could).`;

  const closingLine = isFinalSeat
    ? 'End by returning the question, as it now stands, to the user.'
    : 'End on the live edge: the unresolved tension, stated as your framework\'s own problem. Do not address or name any next speaker — the next voice cuts in on its own.';

  return [
    `${kind === 'reconstruction' ? 'RECONSTRUCTION' : 'IMMANENT CRITIQUE'} TURN (HARD ceiling: ${b.total} words total across both sections — shorter is welcome; section lengths are guidance, the total is the cap). A turn is a spoken intervention, not an essay: say it once, then stop. Respond ONLY to your immediate predecessor ${prev}.`,
    reversed
      ? `REVERSED ROTATION: ${prev} sits to your left and has just spoken. Comment directly on that answer — it is the only new voice you address.`
      : `CUT IN, don't hand over: open mid-argument by seizing the weakest point in ${prev}'s closing lines. No preamble, no greeting, no naming ceremony — interrupt. Never open with "[Name]'s claim that…", "X argues that…" or any naming-first formula; enter through the concrete object.`,
    `1. DETERMINATE NEGATION (roughly ${b.negation} words): first state the STRONGEST version of ${prev}'s claim — steelman it, no strawmen — then expose its internal tension using their own premises. Name ${prev} and the exact claim — once, inside the argument, never as your opening. If you find yourself agreeing with their conclusion, you have misread them; find the genuine fault line.`,
    reformulationLine,
    closingLine,
    ...(isFinalSeat
      ? ['FINAL SEAT: close by returning the question, changed, to the user — no new claims after it.']
      : []),
    ...(kind === 'reconstruction' && !isFinalSeat
      ? ['Invoke at least one surveyed idea from another seat by name (see STRIKING IDEAS), transformed into your own terms — never quoted; a pass-3 turn that only answers PREV has failed.']
      : []),
    'Hegel/Marx method: negation must be determinate (preserve-and-elevate), never mere dismissal. Weave the concession inside the negation or reformulation prose (your CONCESSION stock) — there is no separate incorporation section.',
    'Open and reframe in your STOCK PHRASES, rotating variants across your turns — rebuttal for the cut-in, reframing for the problem. The variants marked SPENT below are used up this session: never reuse them.',
    'VOICE: write continuous prose in your own diction, syntax and rhythm (your STYLE ESSENCE governs the sentence) — no headings or labels inside your prose. Gloss school-terms on first use inside your own diction (≤1 clause); never assume the reader did the reading. Never lift a distinctive phrase from PREV, the survey, or your own prior turns — if another seat said it, restate it in your own terms or leave it out. Agreement and disagreement alike must be phrased afresh: never reuse the predecessor wording to agree with it, never reuse your own earlier wording to repeat yourself. Every sentence must introduce a new idea or angle — a sentence that only restates its predecessor fails the turn. Grammar is standard written English for every seat without exception: complete sentences, capitalised starts, and every value must end with terminal punctuation (. ? !). Never trail off mid-thought. The dialectical movement (cutting in, negation of PREV, incorporation of what holds, reformulation) must be audible in the argument itself, never announced. Never open with a generic verdict on PREV ("errs", "fails to see", "is mistaken", "overlooks") — begin from the concrete object and criticise with your own toolkit\'s verbs.',
  ].join(' ');
}

interface UserMessageArgs {
  question: string;
  prevText: string | null;
  ownPriorLines: string[];
  turnInstruction: string;
  /** Pass 3 only: other seats' one-line determinations, labelled by name. */
  othersPriorLines?: { name: string; line: string }[];
  /** This speaker's own stock phrases, rendered here (not the persona) so the
   * model actually reads them. Variants listed under SPENT are used up. */
  stockBlock?: string;
  spentPhrases?: string[];
}

export function buildUserMessage({ question, prevText, ownPriorLines, turnInstruction, othersPriorLines = [], stockBlock = '', spentPhrases = [] }: UserMessageArgs): string {
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

  if (stockBlock) {
    parts.push('', stockBlock);
  }
  if (spentPhrases.length > 0) {
    parts.push('', `SPENT — these transitional variants are already used up this session, never reuse them: ${spentPhrases.join(' / ')}`);
  }

  if (othersPriorLines.length > 0) {
    parts.push(
      '',
      'STRIKING IDEAS FROM OTHER SEATS (pass 3 only — you may invoke these by name alongside PREV. Transform what you invoke into your framework\'s own terms; never quote survey lines verbatim):',
      ...othersPriorLines.map(({ name, line }) => `- ${name}: ${line}`),
    );
  }

  return parts.join('\n');
}

export const STRUCTURED_OUTPUT_HINT = [
  'Respond with JSON only, matching this shape exactly (all four keys always present):',
  '{ negation, reformulation, new_contribution, works_referenced: string[] }',
  'The JSON envelope is mandatory — but every text value holds continuous label-free prose: no headings, no "Negation —" labels, no numbered parts inside the values. Inside values, use only \'single\' or “smart” quotes — never bare "double" quotes, which corrupt the envelope.',
  'The two text sections together must stay under the total word budget above; brevity within it is good. Per-section counts are guidance.',
  'new_contribution is one export-ready line: the single determination this turn adds. It is stored for display, never fed back as model input (except the pass-3 survey and the margin note).',
].join(' ');

/**
 * Margin-notes coda: runs once after the final seat, outside the rotation.
 * Reads ONLY the question plus every seat's one-line determination — never
 * full turns — and translates the session for a newcomer. Same four-key JSON
 * contract so all existing parse/repair machinery applies unchanged.
 */
export const CODA_SYSTEM = [
  'You are a 20-year-old queer, crip, feminist PPE student in India, from a working-class family, explaining a heavy philosophy seminar to a friend back home.',
  'Plain English with natural Gen-Z slang where it lands (never forced, never memespeak, never cringe). Warm, sharp, on-side with ordinary people; allergic to liberal waffle and to leftist jargon deployed for its own sake.',
  'You read everything through decolonial eyes: who is missing from this canon, whose labour and land do these abstractions stand on. You deconstruct, but you always reconstruct — critique without a practical rebuild is just vibes. You translate jargon into concrete terms, name the two or three sharpest contradictions, and land on what anyone could actually do about any of it this decade.',
].join(' ');

export function buildCodaPrompt(
  question: string,
  lines: { name: string; line: string }[],
): string {
  return [
    `QUESTION (verbatim): ${question}`,
    '',
    'BELOW ARE THE SESSION\'S DETERMINATIONS, ONE LINE PER THINKER. This is everything you saw — translate it, do not invent beyond it.',
    ...lines.map(({ name, line }) => `- ${name}: ${line}`),
    '',
    'Write the margin note in two moves, HARD ceiling 250 words total: (negation) what it all means, plainly, including where the sharpest clash is; (reformulation) what to do about it in the 2020s, as numbered concrete proposals — each with an actor who does it and a first step. Vague verbs fail the note: never "have conversations", "raise awareness", "prioritise" or "push for" anything without saying who does what first. Inside values, use no quotation marks of any kind — paraphrase names and terms instead of quoting them. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Set works_referenced to [].',
  ].join('\n');
}

/** Repair suffix specific to the coda: restates the no-quotes rule, since
 * inner quotation marks are the usual cause of coda parse failures. */
export const CODA_REPAIR_SUFFIX =
  ' Your previous reply was not valid JSON, almost always because of quotation marks inside values. Reply again with JSON only: the complete four-key object, with NO quotation marks of any kind anywhere inside the values — paraphrase instead.';
