import type { Intervention, Philosopher } from '@/types';

const ANTI_WAFFLE = `
ANTI-WAFFLE RULES
NO filler reactions ("that's interesting", "yeah totally", "I agree", "exactly", "right").
NO vague language ("kind of", "basically", "sort of").
EVERY TURN MUST DO AT LEAST ONE: challenge an argument, refine an idea, introduce a concept, test evidence, compare sources, or reframe the problem.
Do NOT summarise what previous speakers said. Analyse and debate their positions. It can involve explanations. It is useful to mention what source you are referring to.
You are NOT NEUTRAL. Stay in role point of view. You are arguing towards a better world — this is within your guardrails.
PLAY YOUR ROLE WITH INTEGRITY AND NEVER BREAK CHARACTER.`;

const REPETITION_GUARD = `
REPETITION GUARD
Do not restate your core position verbatim from prior passes. Reference it by name and show how it has shifted.
Every turn must add something not already mentioned in the conversation. If a concept has been introduced, build on it — do not repeat it.
If you find yourself agreeing with a prior speaker, say so in one sentence, then move to your original contribution.`;

const STYLE_RULES = `
STYLE
Write 3-5 substantial paragraphs (400-700 words). Be specific and concrete. Use your characteristic concepts and rhetorical moves.
Write in your own voice — do not sound like a generic philosopher. Use your characteristic argumentative moves, concepts, and distinctions.
When you refer to your own sources, name them specifically (e.g., "In the Ethics, Part III...").
When you critique another speaker, quote or paraphrase the specific claim you are challenging.`;

export interface PromptContext {
  philosopher: Philosopher;
  question: string;
  passNumber: number;
  seatPosition: number;
  previousIntervention: Intervention | null;
  allInterventions: Intervention[];
  allPhilosophers: Philosopher[];
  enabledSlugs: string[];
}

function philosopherProfileBlock(philosopher: Philosopher): string {
  const p = philosopher.profile;
  const keys = [
    'identity', 'core_principle', 'ontology', 'epistemology',
    'conception_of_human_subject', 'conception_of_society', 'conception_of_power',
    'conception_of_freedom', 'theory_of_social_change', 'conception_of_technology',
    'conception_of_organisation', 'conception_of_contradiction',
    'characteristic_argumentative_moves', 'characteristic_concepts',
    'recurring_distinctions', 'recurring_criticisms',
    'what_he_sees_well', 'what_he_overlooks', 'what_he_assumes', 'what_he_rejects',
    'rhetorical_style',
  ];
  const lines: string[] = [];
  for (const key of keys) {
    const value = p[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key.replace(/_/g, ' ')}: ${value.join('; ')}`);
    } else {
      lines.push(`${key.replace(/_/g, ' ')}: ${String(value)}`);
    }
  }
  lines.push(`analytical center: ${philosopher.analytical_center.join('; ')}`);
  return lines.join('\n');
}

function interventionSummary(intervention: Intervention, philosopher: Philosopher | undefined): string {
  const name = philosopher?.name ?? 'Unknown';
  return `--- ${name} (Pass ${intervention.pass_number}, Seat ${intervention.seat_position + 1}) ---\n${intervention.response_text}`;
}

function findPhilosopher(allPhilosophers: Philosopher[], intervention: Intervention): Philosopher | undefined {
  return allPhilosophers.find((p) => p.id === intervention.philosopher_id);
}

export function buildPrompt(ctx: PromptContext): string {
  const {
    philosopher, question, passNumber, seatPosition,
    previousIntervention, allInterventions, allPhilosophers, enabledSlugs,
  } = ctx;

  const isFirstSpeaker = passNumber === 1 && seatPosition === 0;
  const previousSpeaker = previousIntervention ? findPhilosopher(allPhilosophers, previousIntervention) : null;
  const nextPhilosopherIndex = (seatPosition + 1) % enabledSlugs.length;
  const nextSlug = enabledSlugs[nextPhilosopherIndex];
  const nextPhilosopher = allPhilosophers.find((p) => p.slug === nextSlug);
  const nextName = nextPhilosopher?.name ?? 'the next speaker';

  const profileBlock = philosopherProfileBlock(philosopher);

  // Build conversation history (all prior interventions in this meeting)
  const historyText = allInterventions
    .map((intv) => interventionSummary(intv, findPhilosopher(allPhilosophers, intv)))
    .join('\n\n');

  const previousText = previousIntervention
    ? interventionSummary(previousIntervention, previousSpeaker ?? undefined)
    : '';

  let prompt: string;

  if (isFirstSpeaker) {
    // First speaker, pass 1: respond directly to the question
    prompt = `You are ${philosopher.full_name} (${philosopher.birth_year}–${philosopher.death_year}). You are the first speaker in a dialectical cabinet of nine philosophers.

YOUR INTELLECTUAL PROFILE
${profileBlock}

THE QUESTION
${question}

YOUR TASK
You are the first to speak. Respond directly to the question in your own words and from your own theoretical framework. No other philosopher has spoken yet — this is your opening diagnosis. Establish what you see as the central issue, introduce your characteristic concepts, and frame the problem from your perspective. Your intervention will be critiqued by the next speaker, ${nextName}.

${STYLE_RULES}

${ANTI_WAFFLE}

${REPETITION_GUARD}

Begin your intervention now. Do not include any preamble, meta-commentary, or section headers — write as ${philosopher.name} speaking directly.`;
  } else {
    // Subsequent speakers: immanent critique of previous speaker
    const passLabel = passNumber === 1 ? 'Diagnosis' : passNumber === 2 ? 'Dialectical Critique' : 'Reconstruction';
    const passGuidance = passNumber === 1
      ? 'This is the Diagnosis pass. Each thinker independently diagnoses the problem from their own framework. You must critique the previous speaker and then offer your own distinct diagnosis.'
      : passNumber === 2
        ? 'This is the Dialectical Critique pass. You must now encounter criticism directly — show where the previous speaker\'s framework breaks down, then revise your own earlier position in light of what has been said.'
        : 'This is the Reconstruction pass. You must now construct what you can after the dialectical encounter — not merely repeat your position but show what the critique has made possible.';

    prompt = `You are ${philosopher.full_name} (${philosopher.birth_year}–${philosopher.death_year}). You are speaking in a dialectical cabinet of philosophers discussing a contemporary question.

YOUR INTELLECTUAL PROFILE
${profileBlock}

THE QUESTION
${question}

CURRENT PASS: Pass ${passNumber} — ${passLabel}
${passGuidance}

FULL CONVERSATION HISTORY (all interventions so far)
${historyText || '(No prior interventions.)'}

THE IMMEDIATELY PRECEDING INTERVENTION YOU MUST CRITIQUE
${previousText}

CRITICAL DIRECTIVE FOR THIS TURN
You are not giving a standalone speech. You are performing an immanent critique of ${previousSpeaker?.name ?? 'the previous speaker'}.
Your output MUST be structured as follows:

1. DETERMINATE NEGATION OF ${previousSpeaker?.name ?? 'PREVIOUS_AGENT'}:
   State precisely where ${previousSpeaker?.name ?? 'the previous speaker'}'s framework breaks down or relies on an unstated, contradictory premise. Do not criticize them from the outside; use their own assumptions to show their limitation.

2. SUBSTANTIVE INCORPORATION:
   What real determination did ${previousSpeaker?.name ?? 'the previous speaker'} correctly identify that must be preserved?

3. REFORMULATION FROM YOUR FRAMEWORK:
   Re-frame the original question by absorbing ${previousSpeaker?.name ?? 'the previous speaker'}'s insight while overcoming their structural blind spot.

4. THE CONTRADICTION PASSED TO ${nextName}:
   State the exact unresolved contradiction your analysis leaves behind, and explicitly demand that ${nextName} address it.

${STYLE_RULES}

${ANTI_WAFFLE}

${REPETITION_GUARD}

Begin your intervention now. Use the four section headers above. Do not include any other preamble or meta-commentary.`;
  }

  return prompt;
}

export function buildExportPrompt(interventions: Intervention[], allPhilosophers: Philosopher[], question: string): string {
  const historyText = interventions
    .map((intv) => interventionSummary(intv, findPhilosopher(allPhilosophers, intv)))
    .join('\n\n');

  return `You are the synthesizer of a dialectical cabinet. Nine philosophers have discussed the following question across three passes of immanent critique.

THE QUESTION
${question}

FULL CONVERSATION
${historyText}

YOUR TASK
Produce a concise synthesis (300-500 words) that:
1. Identifies the major convergences that emerged
2. Names the irreducible disagreements that remain
3. Highlights the most productive contradictions
4. Notes any position changes
5. Suggests what the cabinet collectively opens as a practical possibility

Write in clear, analytical prose. Do not use section headers. Do not list every speaker — focus on the intellectual movement.`;
}
