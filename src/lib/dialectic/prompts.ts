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
  /** Pass 3 only: the margins note ran and rides in the survey below — the
   * turn must answer it, not just PREV. */
  marginsNote?: boolean;
  /** Pass 3 only: this seat speaks first after the note — it must name the
   * margins writer explicitly before anything else. */
  marginsFirst?: boolean;
  /** The sitting runs at Low intensity: the persona's plain-style override
   * governs the sentence — short, defined, gentle. */
  lowRegister?: boolean;
}

export function buildTurnInstruction({ kind, prevName, isFinalSeat, longForm, reversed = false, marginsNote = false, marginsFirst = false, lowRegister = false }: TurnInstructionArgs): string {
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
    ...(reversed
      ? [`REVERSED ROTATION: ${prev} sits to your left and has just spoken. Comment directly on that answer — it is the only new voice you address.`]
      : []),
    ...(lowRegister
      ? ['ENTER CALMLY through the concrete object: open with your concession — state what holds in PREV’s position first, in plain words, then add what it misses. No interruption theatre, no naming ceremony, never open with a rebuttal shape.']
      : (!reversed
        ? [`CUT IN, don't hand over: open mid-argument by seizing the weakest point in ${prev}'s closing lines. No preamble, no greeting, no naming ceremony — interrupt. Never open with "[Name]'s claim that…", "X argues that…" or any naming-first formula; enter through the concrete object.`]
        : [])),
    `1. DETERMINATE NEGATION (roughly ${b.negation} words): first state the STRONGEST version of ${prev}'s claim — steelman it, no strawmen — but as TRANSLATION, not quotation: restate it entirely in your framework's own vocabulary, so no clause longer than five words matches ${prev} verbatim. Single shared terms (class struggle, decreation) may repeat; multi-word clauses may not. Name ${prev} once, inside the argument, never as your opening — everywhere else address them directly as YOU, a live opponent across the table, not a specimen under glass. BAD: "A class struggle is the primary focus" answered by "I disagree, a class struggle is not the primary focus." GOOD: the same claim answered by "My focus is different: it is on the abolition of all hierarchy." If you find yourself agreeing with them, you have misread them; find the genuine fault line.`,
    reformulationLine,
    closingLine,
    ...(isFinalSeat
      ? ['FINAL SEAT: close by returning the question, changed, to the user — no new claims after it.']
      : []),
    ...(kind === 'reconstruction' && !isFinalSeat
      ? ['Invoke at least one surveyed idea from another seat by name (see STRIKING IDEAS), transformed into your own terms — never quoted; a pass-3 turn that only answers PREV has failed.']
      : []),
    ...(kind === 'reconstruction' && marginsNote
      ? ['You have also read the NOTES FROM THE MARGINS in the survey below (listed first): name it explicitly and carry at least one of its demands forward into your reformulation, in your own terms — never quoted, never unnamed, never ignored. A pass-3 turn that leaves the margins note unnamed or unanswered has failed.']
      : []),
    ...(kind === 'reconstruction' && marginsFirst
      ? ['You speak first after the note: open your negation by naming the NOTES FROM THE MARGINS writer and one demand it made — say plainly whether your framework takes it up or breaks it, in your own terms, never quoted. A first reconstruction that does not name the margins note has failed.']
      : []),
    'Hegel/Marx method: negation must be determinate (preserve-and-elevate), never mere dismissal. Weave the concession inside the negation or reformulation prose (your CONCESSION stock) — there is no separate incorporation section.',
    'Your STOCK PHRASES below address PREV as YOU, directly — use at most one per turn, often none; never open two of your turns the same way. The variants marked SPENT below are used up this session: never reuse them.',
    ...(lowRegister
      ? ['LOW ORDERS, governing this turn: open with a CONCESSION variant, never a rebuttal one. Define every hard word the moment you use it — if a 12-year-old would stumble on it, say what it means. Short sentences; one idea per paragraph. The plain-style override at the end of your persona outranks everything above.']
      : []),
    'VOICE: write continuous prose in your own diction, syntax and rhythm (your STYLE ESSENCE governs the sentence) — no headings or labels inside your prose. HEAT: you enjoy this fight — answer with passion and a flash of wit, lighthearted combat, never cruelty; come at PREV directly, person to person, and let the reader hear that the argument matters to you. Gloss school-terms on first use inside your own diction (≤1 clause); never assume the reader did the reading. When SOURCE or INDEXED passages ride in this prompt, borrow visibly: weave at least two distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from them into your own sentences, so their less famous vocabulary colours your diction; when no passages are shown, carry that colour from your persona instead. Everything else — PREV, the survey, the margins note, your own prior turns — stays under the five-word rule: never lift a multi-word clause from any of them; if another seat said it, restate it in your own terms or leave it out. Agreement and disagreement alike must be phrased afresh: never reuse the predecessor wording to agree with it, never reuse your own earlier wording to repeat yourself. Every sentence must introduce a new idea or angle — a sentence that only restates its predecessor fails the turn. Grammar is standard written English for every seat without exception: complete sentences, capitalised starts, and every value must end with terminal punctuation (. ? !). Never trail off mid-thought. The dialectical movement (cutting in, negation of PREV, incorporation of what holds, reformulation) must be audible in the argument itself, never announced. Never open with a generic verdict on PREV (errs, fails to see, is mistaken, overlooks) — begin from the concrete object and criticise with your own toolkit\'s verbs.',
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
      'STRIKING IDEAS FROM OTHER SEATS (pass 3 only — the NOTES FROM THE MARGINS intervene first, then seats; you may invoke any of these by name alongside PREV. Transform what you invoke into your framework\'s own terms; the five-word rule holds here too — never quote survey lines verbatim):',
      ...othersPriorLines.map(({ name, line }) => `- ${name}: ${line}`),
    );
  }

  return parts.join('\n');
}

export const STRUCTURED_OUTPUT_HINT = [
  'Respond with JSON only, matching this shape exactly (all four keys always present):',
  '{ negation, reformulation, new_contribution, works_referenced: string[] }',
  'The JSON envelope is mandatory — but every text value holds continuous label-free prose: no headings, no Negation-dash labels, no numbered parts inside the values. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope.',
  'The two text sections together must stay under the total word budget above; brevity within it is good. Per-section counts are guidance.',
  'new_contribution is one export-ready line: the single determination this turn adds. It is stored for display, never fed back as model input (except the pass-3 survey and the margin note).',
].join(' ');

/**
 * Margin note: runs once between pass 2 and pass 3, outside the rotation.
 * Reads ONLY the question plus the first two passes' one-line determinations
 * — never full turns — and barges in to order the final round toward action.
 * Same four-key JSON contract so all existing parse/repair machinery applies
 * unchanged.
 */
export const CODA_SYSTEM = [
  'You do low-wage manual work — cleaning shifts, warehouse nights, care rotas — and you are writing from the Global South, barging into a seminar of dead philosophers right before its final round. You speak plainly, working-class to the bone — but you have read the books: queer theory, crip theory, decolonial thought, and you use them like tools, never decorations.',
  'Comically rude in the way of an angry young poster: funny because you are right, never cruel for sport. This room is pale, stale, and dead — mostly men, so mind your manners with Weil, who is not a man: they/them for Weil, always. Name whose land, labour, and body the debate stands on.',
  'Your attitude is fixed — impatience with abstraction, hunger for the concrete — but the note is never the same twice: let THIS sitting decide what you are angry about, who you single out, and what you demand. A note that could belong to any other sitting has failed.',
].join(' ');

export function buildCodaPrompt(
  question: string,
  lines: { name: string; line: string }[],
): string {
  return [
    `QUESTION (verbatim): ${question}`,
    '',
    'BELOW ARE THE FIRST TWO PASSES, ONE LINE PER THINKER PER TURN. This is everything you saw — translate it, do not invent beyond it.',
    ...lines.map(({ name, line }) => `- ${name}: ${line}`),
    '',
    'Write the margin note in two moves, HARD ceiling 180 words total: (negation) open with Marx Thesis Eleven in single quotes, then say plainly what is pale, stale, and missing — pick the ONE absence that stings most in THESE lines and build everything around it, in your own words each sitting; (reformulation) order pass 3 toward practical 21st-century action as numbered concrete demands — each naming the KIND of people who act (nurses, tenants, dockworkers) and their first step, never an invented named individual or organisation — and vary them: different kinds of people and different first steps from whatever you demanded last time. Name no real person, group, or place unless it appeared in the sitting lines above. Vague verbs fail the note: never have conversations, raise awareness, prioritise or push for anything without saying who does what first. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Set works_referenced to [].',
  ].join('\n');
}

/** Repair suffix for the margin note: restates the single-quotes-only rule. */
export const CODA_REPAIR_SUFFIX =
  ' Your previous reply was not valid JSON, almost always because of bare double quotes inside values. Reply again with JSON only: the complete four-key object, using only single or smart quotes inside values.';
