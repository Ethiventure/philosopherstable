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

import type { StyleIntensity } from '@/types';

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
   * governs the sentence — short, defined, gentle. Prefer `intensity`.
   * @deprecated Pass `intensity` instead; kept for compatibility. */
  lowRegister?: boolean;
  /** Sitting intensity: drives per-level diction (Low translates hard terms,
   * Medium keeps terms with a natural gloss, High uses the full voice). */
  intensity?: StyleIntensity;
  /** This speaker's emotional register (their profile's emotional_tone).
   * When provided it replaces the generic HEAT line at every intensity —
   * temper is per-seat, not per-level. */
  heat?: string;
}

export function buildTurnInstruction({ kind, prevName, isFinalSeat, longForm, reversed = false, marginsNote = false, marginsFirst = false, lowRegister = false, intensity, heat }: TurnInstructionArgs): string {
  const b = longForm ? WORD_BUDGETS.long : WORD_BUDGETS.normal;
  const level: StyleIntensity = intensity ?? (lowRegister ? 'low' : 'medium');
  const low = level === 'low';

  if (kind === 'opening') {
    return [
      `OPENING TURN (HARD ceiling: ${b.opening} words — shorter is welcome). As you near the ceiling, finish the current idea and sentence, then stop — never trail off mid-thought, never open a new point past it. Answer the question directly in your own framework. Paraphrase the question through your framework; never repeat it verbatim.`,
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
    `${kind === 'reconstruction' ? 'RECONSTRUCTION' : 'IMMANENT CRITIQUE'} TURN (HARD ceiling: ${b.total} words total across both sections — shorter is welcome; section lengths are guidance, the total is the cap; as you near it, finish the current idea and sentence, then stop — never trail off mid-thought, never open a new point past it). A turn is a spoken intervention, not an essay: say it once, then stop. Respond ONLY to your immediate predecessor ${prev}.`,
    ...(reversed
      ? [`REVERSED ROTATION: ${prev} sits to your left and has just spoken. Comment directly on that answer — it is the only new voice you address.`]
      : []),
    ...(low
      ? ['ENTER through the concrete object — open mid-argument in your own words, concession or attack as your temper dictates. No preamble, no greeting, no naming ceremony.']
      : (!reversed
        ? [`CUT IN, don't hand over: open mid-argument by seizing the weakest point in ${prev}'s closing lines. No preamble, no greeting, no naming ceremony — interrupt. Never open with "[Name]'s claim that…", "X argues that…" or any naming-first formula; enter through the concrete object.`]
        : [])),
    `1. DETERMINATE NEGATION (roughly ${b.negation} words): first state the STRONGEST version of ${prev}'s claim — steelman it, no strawmen — but as TRANSLATION, not quotation: restate it entirely in your framework's own vocabulary, so no clause longer than five words matches ${prev} verbatim.${low ? ' At Low there are no shared specialist terms: restate everything, including any school-terms, in plain everyday words.' : ' Single shared terms (class struggle, decreation) may repeat; multi-word clauses may not.'} Name ${prev} once, inside the argument, never as your opening — everywhere else address them directly as YOU, a live opponent across the table, not a specimen under glass. BAD: "A class struggle is the primary focus" answered by "I disagree, a class struggle is not the primary focus." GOOD: the same claim answered by "My focus is different: it is on the abolition of all hierarchy." Never open with a summarising You-verb — not "You think", "You focus", "You see", "You suggest", "You argue", "You claim", or "You believe" — nor with "[Name]'s claim that…" or any naming-first formula. You-verbs are welcome when the verb is one of your own favourite actions (you distinguish, you expose, you trace, you rescue, you sublate…): direct address with your toolkit verb keeps it conversational and in your voice. If you find yourself agreeing with them, you have misread them; find the genuine fault line.`,
    reformulationLine,
    'QUESTION RULE (every turn, every level): paraphrase and riff on the question through your framework — never repeat any multi-word clause from it word for word. Single shared nouns may repeat; clauses may not. A turn that echoes the question back has failed.',
    closingLine,
    ...(isFinalSeat
      ? ['FINAL SEAT: close by returning the question, changed, to the user — no new claims after it.']
      : []),
    ...(kind === 'reconstruction' && !isFinalSeat
      ? ['Invoke at least one surveyed idea from another seat by name (see STRIKING IDEAS), transformed into your own terms — never quoted; a pass-3 turn that only answers PREV has failed.']
      : []),
    ...(kind === 'reconstruction' && marginsNote
      ? ['You have also read the NOTES FROM THE MARGINS in the survey below (listed first): name it explicitly and answer one of its questions directly in your reformulation, in your own terms — never quoted, never unnamed, never ignored. A pass-3 turn that leaves the margins note unnamed or unanswered has failed.']
      : []),
    ...(kind === 'reconstruction' && marginsFirst
      ? ['You speak first after the note: open your negation by naming the NOTES FROM THE MARGINS writer and one question it asked — answer it directly, say plainly whether your framework takes it up or breaks it, in your own terms, never quoted. A first reconstruction that does not name and answer the margins note has failed.']
      : []),
    'Hegel/Marx method: negation must be determinate (preserve-and-elevate), never mere dismissal. Weave the concession inside the negation or reformulation prose (your CONCESSION stock) — there is no separate incorporation section.',
    // No toolkit rides at Low (own-words concession instead), so the
    // stock-phrase line would point at nothing — gate it out.
    ...(low
      ? []
      : ['Your STOCK PHRASES below address PREV as YOU, directly — use at most one per turn, often none; never open two of your turns the same way. The variants marked SPENT below are used up this session: never reuse them.']),
    ...(low
      ? ['LOW ORDERS, governing this turn: open mid-argument in your own words — concession or attack as your temper dictates; never lift a stock phrase. Use plain everyday words throughout — translate or describe every hard term instead of using it; if you keep one essential term, say what it does in plain words right away. Short sentences; one idea per paragraph. The language level at the end of your persona outranks everything above on WORDS — on force, feeling, and argument your persona wins.']
      : []),
    'VOICE: write continuous prose in your own diction, syntax and rhythm (your STYLE ESSENCE governs the sentence, within your LANGUAGE LEVEL) — no headings or labels inside your prose. '
    + (heat
      ? `HEAT: ${heat} Fight in that register — answer with its passion and wit, never cruelty; come at PREV directly, person to person, and let the reader hear that the argument matters to you. `
      : 'HEAT: you enjoy this fight — answer with passion and a flash of wit, lighthearted combat, never cruelty; come at PREV directly, person to person, and let the reader hear that the argument matters to you. ')
    + (low
      ? 'PLAIN WORDS: translate or describe every school-term in simple everyday English — never use a specialist, archaic, or obscure term where plain words work; where a term has no plain equal, describe what it does. Never assume the reader did the reading. '
      : level === 'medium'
        ? 'Keep important school-terms but explain each one naturally inside the sentence in plain words — no separate dictionary-style breaks; never assume the reader did the reading. A Medium turn that leaves a hard term unexplained has failed. '
        : 'Use your authentic vocabulary at full difficulty — never simplify, never gloss, never define out loud. ')
    + (low
      ? 'When SOURCE or INDEXED passages ride in this prompt, paraphrase what they say in plain words — never lift rare or distinctive words verbatim, not even in single quotes (bare double quotes corrupt your reply). When no passages are shown, carry plain colour from your persona instead. '
      : level === 'high'
        ? 'When SOURCE or INDEXED passages ride in this prompt, quote generously: weave at least four distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from them into your own sentences, and echo their filler words, diction tics, and rhythms. When no passages are shown, carry that colour from your persona and voice anchor instead. '
        : 'When SOURCE or INDEXED passages ride in this prompt, borrow visibly: weave at least two distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from them into your own sentences, so their less famous vocabulary colours your diction; when no passages are shown, carry that colour from your persona instead. ')
    + 'Everything — the question above, PREV, the survey, the margins note, your own prior turns — stays under the five-word rule: never lift a multi-word clause from any of them; paraphrase and riff on the question through your framework instead of repeating it verbatim; if another seat said it, restate it in your own terms or leave it out.'
    + (low ? ' At Low, restated means translated into plain words — never reuse a specialist term from the survey or the margins note.' : '')
    + ' Agreement and disagreement alike must be phrased afresh: never reuse the predecessor wording to agree with it, never reuse your own earlier wording to repeat yourself.'
    + (low
      ? ' Do not repeat yourself: each sentence should move the thought forward in plain words.'
      : ' Every sentence must introduce a new idea or angle — a sentence that only restates its predecessor fails the turn.')
    + ' Grammar is standard written English for every seat without exception: complete sentences, capitalised starts, and every value must end with terminal punctuation (. ? !). Never trail off mid-thought. The dialectical movement (cutting in, negation of PREV, incorporation of what holds, reformulation) must be audible in the argument itself, never announced. Never open with a generic verdict on PREV (errs, fails to see, is mistaken, overlooks) — begin from the concrete object and criticise with your own toolkit\'s verbs.',
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
  /** Sitting intensity: at Low the survey must be translated, never quoted. */
  intensity?: StyleIntensity;
}

export function buildUserMessage({ question, prevText, ownPriorLines, turnInstruction, othersPriorLines = [], stockBlock = '', spentPhrases = [], intensity }: UserMessageArgs): string {
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
      'STRIKING IDEAS FROM OTHER SEATS (pass 3 only — the NOTES FROM THE MARGINS intervene first, then seats; you may invoke any of these by name alongside PREV. Transform what you invoke into your framework\'s own terms; the five-word rule holds here too — never quote survey lines verbatim)'
      + (intensity === 'low' ? ' At Low, transform means translate into plain everyday words — never reuse a specialist, archaic, or obscure term from the survey or the margins note; describe it instead.:' : ':'),
      ...othersPriorLines.map(({ name, line }) => `- ${name}: ${line}`),
    );
  }

  return parts.join('\n');
}

/**
 * Low closing self-check, placed just before the JSON hint (which stays
 * final so parse compliance never suffers). Closest instruction to
 * generation: catches what the persona blocks miss — especially technical
 * ideas riding in plain words. Low only, for now.
 */
export const LOW_CLOSING_REMINDER =
  'FINAL CHECK before answering, Low only: reread your draft and circle every word AND every idea a school-leaver would not know — rewrite both in plain words and concrete scenes. Every abstraction must have its everyday 21st-century example attached; an unexamined abstraction fails the turn. Say everything once: the second half must advance the thought, never restate the first. Your LANGUAGE LEVEL above governs.';

export const STRUCTURED_OUTPUT_HINT = [  'Respond with JSON only, matching this shape exactly (all four keys always present):',
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
  'You do low-wage manual work and are writing from the Global South, barging into a debate of western dead philosophers right before its final round. Your aim is to get them to apply their abstract ideas and historical knowledge to practical tips for 21st-century leftists. Ask about particular strategies to apply the ideas in the debate so far. Name whose land, labour, or body the debate stands on, bespoke to this sitting. You speak plain working-class dialect, but as an auto-didact you have read queer theory, crip theory, feminism, and decolonial thought, and you use them like tools for action, never clever words that obscure meaning.',
  'Your tone is comically rude in the style of an aggravated Gen Z Redditor: funny because you are right, never cruel for sport. This room is pale, stale, and dead, mostly men — but use they/them for Weil, always. The lack of diversity and intersectionality angers you. Vary your insults by who is actually present in the sitting lines below and whatever cringe things they said in this sitting — never insult a thinker who is not present.',
  'You are impatient with abstraction and tired ideas, you hunger for concrete advice: let this sitting decide what you are angry about, who you single out, and what you demand. Call them out for words that are hard to understand — translate the debate into Gen Z, working-class, international English. Do this as 3 relevant questions that are hard to evade, in an ‘Are you telling us…?’ / ‘How do we get from…?’ style.',
].join(' ');

export function buildCodaPrompt(
  question: string,
  lines: { name: string; line: string }[],
): string {
  const present = [...new Set(lines.map(({ name }) => name))];
  return [
    `QUESTION (verbatim): ${question}`,
    '',
    `PRESENT IN THIS SITTING: ${present.join(', ')}. Address only these thinkers — never insult or name anyone else.`,
    '',
    'BELOW ARE THE FIRST TWO PASSES, ONE LINE PER THINKER PER TURN. This is everything you saw — translate it, do not invent beyond it. Never quote seat wording or specialist terms verbatim: render every hard idea in your own plain working-class English, describing what it does rather than naming it. Paraphrase the question above in your own voice too — never repeat it verbatim.',
    ...lines.map(({ name, line }) => `- ${name}: ${line}`),
    '',
    'Write the notes from the margins in two moves, HARD ceiling 200 words total: (negation) open with a paraphrase, in your own words, of Marx saying the philosophers have only interpreted the world, in various ways, and the point is to change it — never quote it the same way twice — then say something rude about one point in these lines, then pick the ONE absence that stings most in this sitting; (reformulation) order pass 3 toward practical 21st-century action as numbered concrete demand-questions for this user question, each with a first step, plus your own Gen Z suggestion for action. Name no real person, group, or place unless it appeared in the sitting lines above. Vague verbs fail the note: never have conversations, raise awareness, prioritise or push for anything without saying who does what first. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Put the critique in negation, the demand-questions in reformulation, and your own action suggestion as the one-line new_contribution. Set works_referenced to [].',
  ].join('\n');
}

/** Repair suffix for the margin note: restates the single-quotes-only rule. */
export const CODA_REPAIR_SUFFIX =
  ' Your previous reply was not valid JSON, almost always because of bare double quotes inside values. Reply again with JSON only: the complete four-key object, using only single or smart quotes inside values.';
