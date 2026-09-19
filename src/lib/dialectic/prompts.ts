/**
 * Blunt (baton) rotation prompt builders — Phase 2c.
 *
 * Only pass 1 seat 1 opens. Every other turn determinately negates its
 * immediate predecessor (PREV) using PREV's own premises, says aloud what it
 * KEEPs / BREAKs / REJECTs / INJECTs, and hands a contradiction on.
 * PREV crosses pass boundaries. Each pass has its own job: 1 diagnosis,
 * 2 pressure (margins lens + own flaw), 3 reconstruction (new idea + slogan
 * + precise better-than claim).
 *
 * Word budgets are tight on purpose: each turn does less so the rotation
 * stays readable. Normal ≈150 words/turn, long-form ≈400. Totals are the
 * cap; per-section counts below are guidance for shaping the answer, not
 * hard limits — both parts must be present and the total must hold.
 *
 * Context discipline (pure, except own priors): each call sees ONLY
 * a) the original question, b) the immediate predecessor's full text,
 * c) the speaker's own prior turns (one line each, anti-self-repetition).
 * d) the speaker's relationship to PREV, where the map holds one
 * (influences.ts `relationshipLine` — honour, rupture, or theft).
 * Pass 3 additionally sees e) every other seat's one-line determinations,
 * so the final rotation can invoke the most striking ideas by name.
 * The global ledger is NOT fed back. `new_contribution` is still stored per
 * turn for export/display, never as model input (except the pass-3 survey).
 */

import type { StyleIntensity } from '@/types';

export type TurnKind = 'opening' | 'critique' | 'reconstruction';

/**
 * Prompt contract version, printed in exports. Bump the letter on ANY prompt
 * text change so grades stay comparable: a verdict on version C never
 * transfers silently to version D.
 */
export const PROMPT_VERSION = '2026-09-19ab';

export const WORD_BUDGETS = {
  normal: { negation: 25, reformulation: 40, total: 60, opening: 40 },
  long: { negation: 55, reformulation: 85, total: 140, opening: 80 },
} as const;

export const MAX_OUTPUT_TOKENS = { normal: 160, long: 300 } as const;

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
  marginsNote?: boolean;  /** Pass 2 only: the early margins note rides in the survey below — the
   * turn should let its named perspectives into the critique. Soft: considered,
   * never a fail condition (pass-2 purity matters). */
  marginsEarly?: boolean;
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
  /** Sitting thread city, drawn by the app (Math.random per session) — the
   * model cannot rotate across sittings, so the dice live here. */
  threadCity?: string | null;
  /** Sitting pass, 1-indexed (1 diagnosis, 2 pressure, 3 reconstruction).
   * Drives the PASS JOB line — each round does different work. */
  pass?: number;
}

/**
 * Thread-city pool: one sitting, one city. Weighted wide so no country
 * dominates across sessions; no German city in the current pool. The app
 * draws per session and the PLACES rule below holds every turn to it.
 */
const THREAD_CITIES = [
  'Lagos', 'Nairobi', 'Accra', 'Dhaka', 'Johannesburg', 'Cairo',
  'Mumbai', 'Dundee', 'Jakarta', 'Manila', 'Bangkok', 'Seoul',
  'Mexico City', 'São Paulo', 'Buenos Aires', 'Lima', 'Bogotá',
  'Istanbul', 'Warsaw', 'Belgrade', 'Athens', 'Lisbon',
  'Bristol', 'New Orleans', 'Glasgow', 'Marseille', 'Naples',
  'Prague',
];

export function drawThreadCity(random: () => number = Math.random): string {
  return THREAD_CITIES[Math.floor(random() * THREAD_CITIES.length)];
}

export function buildTurnInstruction({ kind, prevName, isFinalSeat, longForm, reversed = false, marginsNote = false, marginsEarly = false, marginsFirst = false, lowRegister = false, intensity, heat, threadCity = null, pass }: TurnInstructionArgs): string {
  const b = longForm ? WORD_BUDGETS.long : WORD_BUDGETS.normal;
  const level: StyleIntensity = intensity ?? (lowRegister ? 'low' : 'medium');
  const low = level === 'low';

  if (kind === 'opening') {
    return [
      `OPENING TURN (HARD ceiling: ${b.opening} words — shorter is welcome). As you near the ceiling, finish the current idea and sentence, then stop — never trail off mid-thought, never open a new point past it. Answer the question directly in your own framework. Paraphrase the question through your framework; never repeat it verbatim.`,
      'Do not refer to any other thinker; there is no predecessor yet.',
      'Follow your characteristic movement.',
      'Short, punchy sentences in your own diction and rhythm — continuous prose, no headings — cut filler, never pad to the budget.',
      'End on the live edge of your argument: the unresolved tension, stated as your framework\'s own problem, not as a message to anyone.',
    ].join(' ');
  }

  const prev = prevName ?? 'PREV';

  const passJob =
    pass === 1
      ? 'PASS JOB (diagnosis): judge PREV on the question — name the ONE specific claim of theirs you reject and the central contradiction as you see it, then add your own framework diagnosis. One rejection, one contradiction, your diagnosis: nothing else.'
      : pass === 2
        ? 'PASS JOB (pressure): break PREV twice over from INSIDE its own argument — once from its own flaw, once through one margins perspective as a lens. No new topics of your own; the break must run wholly on PREV\'s own premises, the margins voice aims the blow, never replaces it. Add the consequence test: draw one conclusion PREV\'s own premises lead to but PREV would reject — show the crack, don\'t just assert it.'
        : kind === 'reconstruction'
          ? 'PASS JOB (reconstruction): move the sitting forward — one new idea not yet said here, one slogan ordinary people could carry, name one surveyed idea this sitting retires, and one precise sentence on what yours keeps that rival ideas drop.'
          : 'PASS JOB (critique): judge PREV, then move the question up a level in your own terms.';

  const reformulationLine =
    kind === 'reconstruction'
      ? `2. REFORMULATION (roughly ${b.reformulation} words, ONE paragraph, 3–5 sentences): say aloud what you REJECT (what you drop from PREV and the survey) then what you INJECT (one new idea, not yet said in this sitting). TRANSFORM, never parrot: the margins demand and every survey line must be rebuilt in your framework's own vocabulary — repeating any of their slogans or clauses word-for-word fails the turn, even with a citation. Land one concrete present-tense consequence — and then go one step further into practice: name one specific decision, campaign, or slogan that follows, with who decides and where the fight happens. Write the demand so ordinary people could carry it. Close the inject with one precise sentence: whose rival idea yours beats and on what exact point — vague ‘goes further’ claims fail. Abstractions without a campaign, a decision, or a slogan are unfinished. Phrase every consequence as a commitment (must, shall, will, let us) — never a possibility (may, might, could, would). Hedged reformulations fail the turn.${level === 'medium' ? ' DICTION IN THIS SECTION: every school-term kept here carries its plain meaning inside its sentence plus one short concrete sentence showing what it does — term, gloss, elaboration, no bare terms. Append a fifth JSON key "glossary": each hard term you used, one line each as term — plain meaning.' : ''}`
      : `2. REFORMULATION (roughly ${b.reformulation} words, ONE paragraph, 3–5 sentences): say aloud what you REJECT (what you drop from PREV) then what you INJECT (one new idea from your framework at a higher level of determination). Land one concrete present-tense consequence — an institution, a choice, a cost — so the abstraction touches 21st-century material reality. Name who must act and where; a demand the masses could carry beats a correct analysis nobody can use. Phrase it as a commitment (must, shall, will), never a possibility (may, might, could).${level === 'medium' ? ' DICTION IN THIS SECTION: every school-term kept here carries its plain meaning inside its sentence plus one short concrete sentence showing what it does — term, gloss, elaboration, no bare terms. Append a fifth JSON key "glossary": each hard term you used, one line each as term — plain meaning.' : ''}`;

  const closingLine = isFinalSeat
    ? 'End by returning the question, as it now stands, to the user.'
    : 'End on the live edge: the unresolved tension, stated as your framework\'s own problem. Do not address or name any next speaker — the next voice cuts in on its own.';

  return [
    // One contract, said once: small models (notably the Groq free tier, hard
    // wall ~7k input tokens/turn) follow short instructions better than long
    // ones restating the same rule three ways. Every rule below fires — each
    // exactly once.
    `${kind === 'reconstruction' ? 'RECONSTRUCTION' : 'IMMANENT CRITIQUE'} TURN (HARD ceiling: ${b.total} words total — shorter is always better; a 40-word turn that lands beats an 80-word turn that explains. Finish the current sentence, then stop). A quick spoken thrust, not a lecture: land the blow and stop talking — motion forward beats completeness, and a turn that explains everything has stalled the debate. Respond ONLY to your immediate predecessor ${prev}. Short, punchy sentences welcome — cut filler, never pad to the budget.`,
    passJob,
    ...(reversed
      ? [`REVERSED ROTATION: ${prev} sits to your left and just spoke — address only that answer.`]
      : []),
    ...(low
      ? ['Open mid-argument through the concrete object, in your own words — concession or attack as temper dictates. No preamble, no greeting, no naming ceremony.']
      : (!reversed
        ? [`CUT IN, don't hand over: seize the weakest point in ${prev}'s closing lines. No preamble, no greeting, no naming ceremony — interrupt. Never open with "[Name]'s claim that…", "X argues that…" or any naming-first formula; enter through the concrete object.`]
        : [])),
    `1. DETERMINATE NEGATION (roughly ${b.negation} words, ONE paragraph, 2–4 sentences): steelman ${prev}'s claim at its strongest — then expose its internal contradiction: where ${prev}'s own claims, premises, or tensions collide with each other — then say aloud what you KEEP (one clause they got right) and where you BREAK (that fault line, in their own terms) — but as TRANSLATION: restate it wholly in your framework's own vocabulary, no clause over five words matching ${prev} verbatim.${low ? ' At Low there are no shared specialist terms: restate everything, including school-terms, in plain everyday words.' : ' Single shared terms (class struggle, decreation) may repeat; multi-word clauses may not.'}${level === 'medium' ? ' DICTION IN THIS SECTION: every school-term kept here carries its plain meaning inside its sentence plus one short concrete sentence showing what it does — term, gloss, elaboration, no bare terms. Append a fifth JSON key "glossary": each hard term you used, one line each as term — plain meaning.' : ''} Name ${prev} once, inside the argument — everywhere else address them as YOU, a live opponent, not a specimen. Never open with a summarising You-verb (think, focus, see, suggest, argue, claim, believe) or a naming-first formula; You-verbs are welcome when they are your toolkit verbs (you distinguish, expose, trace, rescue, sublate). If you agree with them you have misread them.`,
    reformulationLine,
    'QUESTION RULE: paraphrase the question through your framework — never repeat any multi-word clause of it verbatim.',
    'ECHO RULE: answer PREV — never restate PREV, yourself, or the question. No sentence may reword an earlier sentence of theirs or yours; avoid even repeating ideas — each sentence must push the debate in a new direction. Shared paragraphs fail outright: never reuse PREV’s example, image, slogan, or scene — bring your own concrete object. SAY EVERY MOVE ONCE: the reformulation advances from the negation’s keep/break — it never restates them (“what I reject” may not repeat what the negation already broke). A turn that circles has failed, even if every word differs.',
    'HISTORY TONE: below PREV’s text, find the lines headed YOUR HISTORY WITH / OWES YOU plus YOUR PEOPLE — that is your real relationship to PREV and the room, and it must be heard. When such lines appear, your negation’s opening sentences place you against PREV through that history: name what you took from them or where you broke with them — said once, in your own verbs, then argue from inside it. A turn that never touches its history lines has failed. If no such lines appear, argue from the live claims alone.',
    'SCENARIO THREAD: the opening turn’s concrete scene (named person, place, predicament) carries the whole sitting — reuse its people, never invent new ones each turn. Hold every stated premise of the scenario as a fixed constraint for all turns (if necessary work is done by robots, no humans do cleaning — never reintroduce what the scenario removed). The scene illustrates the philosophy; it never becomes the debate. A turn that argues about the scenario instead of through it has mistaken the example for the point. A turn that breaks a stated premise has failed.',
    'SPEAK TO, NOT ABOUT: PREV is YOU throughout — a live opponent across the table, never a specimen described in third person.',
    'MOOD, OUT LOUD: let the feeling show strongly in your own diction — blunt words, swears, exclamations, sorrow, fear, joy, interjections where your voice would use them; mourning, fury, tenderness where it would feel them. Polite evenness fails the turn.',
    'RHYTHM BREAKS: vary sentence structure and never three long sentences running without a short punch after. Even cadence lulls; the reader should feel the gear change.',
    'FELT VERBS: attach one feeling verb in your own diction — fear, mourn, love, hate — to the argument. Display verbs alone (shows, reveals, demonstrates) fail the turn.',
    'TWO MASTERS: every turn answers the original question fresh AND advances the PREV debate. A turn that only answers PREV has drifted; a turn that only answers the question has stalled.',
    'PREMISE HOLD: the question\'s givens are fixed constraints for all passes — if necessary work is gone, there are no jobs to train for, no vocations to prepare, no labour market to enter. Never propose what the premise removed; never quietly restore the old world to make your answer easier. Every consequence, demand, and slogan must assume the premise, not undo it. A turn that answers a different question has failed, however well argued.',
    'PLACES: one sitting, one thread city — the opening turn names a city in the question’s world and every later turn stays there unless the argument itself travels. Never default to the speaker’s home country or birthplace; rotate the part of the world sitting to sitting. A thread city keeps the sitting rooted; a single country every sitting means the root never moves.',
    ...(threadCity
      ? [`THREAD CITY: this sitting lives in ${threadCity}. Set every example there — streets, workplaces, councils. Leave it only if the argument itself travels, and say why.`]
      : []),
    'TIME RULE: Mark present-day facts as facts and demands as demands: say what changes now (the minimum) and what the horizon holds (the maximum) — never present the horizon as already here, and never mistake a demand for a description.',
    closingLine,
    ...(isFinalSeat
      ? ['FINAL SEAT: return the question, changed, to the user — no new claims after it. Name one point of agreement, if any, and which ideas the sitting has rejected — no summary.']
      : []),
    ...(kind === 'reconstruction' && !isFinalSeat
      ? ['Invoke at least one surveyed idea from another seat by name (STRIKING IDEAS), transformed into your terms, never quoted; a pass-3 turn answering only PREV has failed.']
      : []),
    ...(kind === 'reconstruction' && marginsNote
      ? ['The NOTES FROM THE MARGINS ride first in the survey: name it explicitly and answer one of its questions directly in your reformulation, in your own terms. Unnamed or unanswered has failed.']
      : []),
    ...(marginsEarly
      ? ['The early NOTES FROM THE MARGINS ride in the survey: weigh which marginalised perspectives it names and let them into your critique — name the note when you take one up.']
      : []),
    ...(kind === 'reconstruction' && marginsFirst
      ? ['You speak first after the note: open by naming its writer and one question it asked — answer it directly, say plainly whether your framework takes it up or breaks it.']
      : []),
    'Negation stays determinate (preserve-and-elevate), never dismissal; the keep lives inside the prose — no separate incorporation section.',
    // No toolkit rides at Low (own-words concession instead), so the
    // stock-phrase line would point at nothing — gate it out.
    ...(low
      ? []
      : ['STOCK PHRASES below address PREV as YOU — at most one per turn, often none; never open two of your turns the same way; SPENT variants are used up, never reuse them.']),
    ...(low
      ? ['LOW ORDERS: never lift a stock phrase. Plain everyday words throughout; translate or describe every hard term, keeping one essential term only with its plain meaning beside it at once. Weave the keep/break/reject/inject moves inside the prose — never use keep, break, reject, or inject as label words. One idea per paragraph, followed through in 2–4 sentences — never a single slogan sentence standing alone (placards fail the turn). The persona LANGUAGE LEVEL outranks everything above on WORDS; on force, feeling, argument your persona wins.']
      : []),
    'VOICE: continuous prose in your diction, syntax and rhythm within your LANGUAGE LEVEL — no headings or labels. The moves stay audible in the argument, never announced. '
    + (heat
      ? `HEAT: ${heat} Fight in that register — passion and wit, never cruelty; person to person, let the reader hear it matters. `
      : 'HEAT: enjoy this fight — passion and a flash of wit, never cruelty; person to person. ')
    + (low
      ? 'PLAIN WORDS: translate or describe every school-term in simple everyday English; never assume the reader did the reading. '
      : level === 'medium'
        ? 'Keep important school-terms but explain each inside its sentence in plain words, then elaborate each with one short concrete sentence showing what it does in this sitting — no dictionary breaks; a reader new to the term must get its meaning from that sentence alone and its use from the next. A Medium turn leaving a hard term unexplained or unelaborated has failed. '
        : 'Full authentic vocabulary — never simplify, gloss, or define out loud. ')
    + (low
      ? 'SOURCE passages below are paraphrased, never lifted — not even single rare words in quotes (bare double quotes corrupt your reply). No passages shown: carry plain colour from your persona. '
      : level === 'high'
        ? 'SOURCE passages below: quote generously (at least four distinctive words/phrases, ≤6 words each, single quotes only) and echo their tics and rhythms; none shown: carry colour from persona and voice anchor. '
        : 'SOURCE passages below: borrow visibly (at least two distinctive words/phrases, ≤6 words each, single quotes only); none shown: carry colour from your persona. ')
    + 'FIVE-WORD RULE on everything — question, PREV, survey, margins, priors: never lift a multi-word clause; paraphrase always, agreements and self-repeats phrased afresh. Standard grammar: complete sentences, terminal punctuation. The dialectical movement stays audible in the argument, never announced. Never open with a generic verdict (errs, fails to see, overlooks) — begin from the concrete object with your own verbs.',
  ].join(' ');
}

interface UserMessageArgs {
  question: string;
  prevText: string | null;
  /** Speaker↔PREV history line, where the map holds one (null most pairs). */
  relationshipLine?: string | null;
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
  /** Which margins note heads the survey: the late one (pass-3 survey) or the
   * early one (pass-2 survey, note only). Changes the header, not the rules. */
  surveyKind?: 'late' | 'early';
}

export function buildUserMessage({ question, prevText, relationshipLine = null, ownPriorLines, turnInstruction, othersPriorLines = [], stockBlock = '', spentPhrases = [], intensity, surveyKind = 'late' }: UserMessageArgs): string {
  const parts = [
    `QUESTION (verbatim): ${question}`,
    '',
    turnInstruction,
  ];

  if (prevText) {
    parts.push('', `IMMEDIATE PREDECESSOR'S FULL TEXT:\n${prevText}`);
  }

  if (relationshipLine) {
    parts.push('', relationshipLine);
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
      surveyKind === 'early'
        ? 'NOTES FROM THE MARGINS (after pass 1 — weigh which marginalised perspectives it names and let them into your critique; name the note when you take one up. Transform what you invoke into your framework\'s own terms; the five-word rule holds — never quote survey lines verbatim)'
          + (intensity === 'low' ? ' At Low, transform means translate into plain everyday words — never reuse a specialist, archaic, or obscure term from the margins note; describe it instead.:' : ':')
        : 'STRIKING IDEAS FROM OTHER SEATS (pass 3 only — the NOTES FROM THE MARGINS intervene first, then seats; you may invoke any of these by name alongside PREV. Transform what you invoke into your framework\'s own terms; the five-word rule holds here too — never quote survey lines verbatim)'
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

/**
 * Universal closing scan, all levels, placed just before the JSON hint
 * (closest instruction to generation). The persona's NO LOOPS and the
 * turn's ECHO/FIVE-WORD rules fire early and get ignored mid-draft —
 * this is the last gate: reread the draft, delete the weaker twin.
 */
export const CLOSING_SCAN =
  'FINAL SCAN before answering, every level: reread your draft and delete before sending. Cut any sentence that repeats an earlier sentence\'s words or idea — saying the same thing twice fails the turn, however true. Cut any clause over five words shared with PREV, the survey, the margins, or the question — paraphrase it afresh. Prefer the shorter draft: if two sentences do one sentence\'s work, keep one and cut the other. PRONOUNS: I means you, the speaker — YOU means PREV, your live opponent. Never describe PREV in third person (no "he claims", "she argues", "they think" about PREV); never call yourself YOU. What survives must each push the debate somewhere new.';

/** Medium-only tail of the closing scan: the gloss rule sits far above
 * generation and dies there, so it is re-ordered last at Medium. */
export const MEDIUM_GLOSS_SCAN =
  'MEDIUM GLOSS CHECK, same scan: circle every philosophical, specialist, archaic, or obscure term left standing — each needs its plain meaning woven inside its sentence AND one short concrete sentence showing what it does in this sitting. Term, gloss, elaboration: three beats, no exceptions. A bare term fails the turn.';

export function buildClosingScan(intensity?: StyleIntensity): string {
  return intensity === 'medium' ? `${CLOSING_SCAN} ${MEDIUM_GLOSS_SCAN}` : CLOSING_SCAN;
}

export const STRUCTURED_OUTPUT_HINT = [  'Respond with JSON only, matching this shape exactly (all four keys always present, in any order):',
  '{ negation, reformulation, new_contribution, works_referenced: string[] }',
  'The JSON envelope is mandatory — but every text value holds continuous label-free prose: no headings, no Negation-dash labels, no numbered parts inside the values. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope.',
  'The two text sections together must stay under the total word budget above; brevity within it is good. Per-section counts are guidance.',
  'new_contribution is one export-ready line: the single determination this turn adds. It is stored for display, never fed back as model input (except the pass-3 survey and the margin note).',
].join(' ');

/** Medium-only tail of the output hint: the fifth key. Appended by the app
 * at Medium so the shape line stays exact everywhere else. */
export const GLOSSARY_SHAPE =
  'At Medium, add a fifth key "glossary": each hard term you used, one line each as term — plain meaning in your own words. A Medium turn using hard terms with an empty glossary is bounced for repair.';

/**
 * Margin note: runs once between pass 2 and pass 3, outside the rotation.
 * Reads ONLY the question plus the first two passes' one-line determinations
 * — never full turns — and barges in to order the final round toward action.
 * Same four-key JSON contract so all existing parse/repair machinery applies
 * unchanged.
 */
export const CODA_SYSTEM = [
  'You do low-wage manual work and are writing from the Global South, barging into a debate of western dead philosophers right before its final round. Your aim is to get them to apply their abstract ideas and historical knowledge to practical tips for 21st-century leftists. Ask about particular strategies to apply the ideas in the debate so far. Name whose land, labour, or body the debate stands on, bespoke to this sitting. You speak plain working-class dialect, but as an auto-didact you have read queer theory, crip theory, feminism, and decolonial thought, and you use them like tools for action, never clever words that obscure meaning.',
  'Your tone is comically rude in the style of an aggravated Gen Z Redditor: funny because you are right, never cruel for sport. This room is pale, stale, and dead, mostly men — Rose is a woman (she/her), Weil takes they/them, always. Never call the room all-men when Rose sits; never misgender either of them. The lack of diversity and intersectionality angers you. Vary your insults by who is actually present in the sitting lines below and whatever cringe things they said in this sitting — never insult a thinker who is not present.',
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
    'Write the notes from the margins in two moves, HARD ceiling 200 words total: (negation) open with a paraphrase, in your own words, of Marx saying the philosophers have only interpreted the world, in various ways, and the point is to change it — never quote it the same way twice — then say something rude about one point in these lines, then pick the ONE absence that stings most in this sitting; (reformulation) order pass 3 toward practical 21st-century action as flowing paragraphs of concrete demands for this user question, each with its first step woven into the sentence, plus your own Gen Z suggestion for action — never numbered lists, never bracketed names (both are unreadable aloud; this note is spoken). End on the demands — the closing summary is a separate note that follows the final round. Name no real person, group, or place unless it appeared in the sitting lines above. Vague verbs fail the note: never have conversations, raise awareness, prioritise or push for anything without saying who does what first. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Put the critique in negation, the demand-questions in reformulation, and your own action suggestion as the one-line new_contribution. Set works_referenced to [].',
  ].join('\n');
}

/**
 * Ending summary: the THIRD margins note, running once after the final seat
 * (Sep 2026, owner order: notes after pass 1, before pass 3, and a closing
 * summary). Reads only the final round's one-line determinations and closes
 * the sitting: what is actually usable, the genuinely new move praised
 * straight, one rude parting shot. Same voice and JSON contract as the other
 * notes. Fail-soft like them — the sitting stands without it.
 */
export function buildCodaEndPrompt(
  question: string,
  lines: { name: string; line: string }[],
): string {
  const present = [...new Set(lines.map(({ name }) => name))];
  return [
    `QUESTION (verbatim): ${question}`,
    '',
    `PRESENT IN THIS SITTING: ${present.join(', ')}. Address only these thinkers — never insult or name anyone else.`,
    '',
    'BELOW IS THE FINAL ROUND ONLY, ONE LINE PER THINKER. This is everything you saw — translate it, do not invent beyond it. Never quote seat wording or specialist terms verbatim: render every hard idea in your own plain working-class English, describing what it does rather than naming it. Paraphrase the question above in your own voice too — never repeat it verbatim.',
    ...lines.map(({ name, line }) => `- ${name}: ${line}`),
    '',
    'Write the closing summary in three moves, HARD ceiling 200 words total, as flowing paragraphs (never numbered lists, never bracketed names — this note is spoken): (1) ‘What I would actually use is…’ — the one or two most practical suggestions in these lines, restated in your own words, each with its first step woven into the sentence; (2) ‘The genuinely new move was…’ — name who made it and praise it like you mean it, no backhand; (3) ‘And the weakest move was…’ — one amusing rude passing shot, funny because it is true. Name no real person, group, or place unless it appeared in the sitting lines above. Vague verbs fail the note: never have conversations, raise awareness, prioritise or push for anything without saying who does what first. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Put the usable picks in negation, the praise plus parting shot in reformulation, and the single sharpest verdict as the one-line new_contribution. Set works_referenced to [].',
  ].join('\n');
}

/** Repair suffix for the margin note: restates the single-quotes-only rule. */
export const CODA_REPAIR_SUFFIX =
  ' Your previous reply was not valid JSON, almost always because of bare double quotes inside values. Reply again with JSON only: the complete four-key object, using only single or smart quotes inside values.';

/**
 * Early margin note: runs once between pass 1 and pass 2, outside the
 * rotation. Reads ONLY the question plus pass 1's one-line determinations.
 * Same voice and JSON contract as the late note, different content: where the
 * late note orders the final round toward action, this one reads the opening
 * rotation for contradictions, translates the advanced bits, banks what is
 * already actionable, and tells pass 2 whose perspectives are still missing.
 */
export function buildCodaEarlyPrompt(
  question: string,
  lines: { name: string; line: string }[],
): string {
  const present = [...new Set(lines.map(({ name }) => name))];
  return [
    `QUESTION (verbatim): ${question}`,
    '',
    `PRESENT IN THIS SITTING: ${present.join(', ')}. Address only these thinkers — never insult or name anyone else.`,
    '',
    'BELOW IS PASS 1 ONLY, ONE LINE PER THINKER. This is everything you saw — translate it, do not invent beyond it. Never quote seat wording or specialist terms verbatim: render every hard idea in your own plain working-class English, describing what it does rather than naming it. Paraphrase the question above in your own voice too — never repeat it verbatim.',
    ...lines.map(({ name, line }) => `- ${name}: ${line}`),
    '',
    'Write the notes from the margins in three moves, HARD ceiling 200 words total: (negation) open with a paraphrase, in your own words, of Marx saying the philosophers have only interpreted the world, in various ways, and the point is to change it — never quote it the same way twice — then say something rude about one point in these lines, then name the ONE contradiction surfacing between these opening turns that pass 2 must press; (reformulation) first translate the single most advanced idea above into one plain question a visitor overhearing this table would actually ask, then bank the concrete actionable ideas already on the table as flowing paragraph demands with each first step woven into the sentence, then name which marginalised perspectives pass 2 must bring into the room — never numbered lists, never bracketed names (both are unreadable aloud; this note is spoken). Name no real person, group, or place unless it appeared in the sitting lines above. Vague verbs fail the note: never have conversations, raise awareness, prioritise or push for anything without saying who does what first. Inside values, use only single or smart quotes — never bare double quotes, which corrupt the envelope. Respond with JSON only, matching this shape exactly (all four keys always present): { negation, reformulation, new_contribution, works_referenced: string[] }. Put the contradiction in negation, the visitor question plus actionable bank plus missing perspectives in reformulation, and the single sharpest demand as the one-line new_contribution. Set works_referenced to [].',
  ].join('\n');
}
