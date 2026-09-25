import type { Philosopher, PhilosopherDefinition, StyleIntensity } from '@/types';
import { SPINOZA } from './spinoza';
import { KANT } from './kant';
import { HEGEL } from './hegel';
import { MARX } from './marx';
import { LENIN } from './lenin';
import { BOGDANOV } from './bogdanov';
import { BLOCH } from './bloch';
import { WEIL } from './weil';
import { BOOKCHIN } from './bookchin';
import { DELEUZE } from './deleuze';
import { ROSE } from './rose';
import { FISHER } from './fisher';
import { GENZIE } from './genzie';
import { renderUniversalMechanisms } from './shared/universal-mechanisms';
import { renderAntiWaffle } from './shared/anti-waffle';
import { LOW_CONCEPT_RULES, LOW_OVERRIDE, LOW_PLAIN_RULES, renderLanguageLevel, renderLowStyleEssence } from './shared/low-style';
import { FALLBACK_MEDIUM_EXAMPLE, SEAT_TRIOS } from './trios';

const DEFINITIONS: PhilosopherDefinition[] = [SPINOZA, KANT, HEGEL, MARX, LENIN, BOGDANOV, BLOCH, WEIL, BOOKCHIN, DELEUZE, ROSE, FISHER, GENZIE];

/**
 * The cabinet always sits in chronological order of birth, Spinoza (1632) first.
 * Seat order is derived here rather than hand-maintained so it cannot drift.
 */
export const PHILOSOPHER_DATA: Omit<Philosopher, 'id' | 'created_at'>[] = [...DEFINITIONS]
  .sort((a, b) => (a.birth_year ?? 0) - (b.birth_year ?? 0))
  .map((definition, index) => ({ ...definition, seat_order: index }));

export const DEFAULT_SEATING_ORDER: string[] = PHILOSOPHER_DATA.map((p) => p.slug);

export const PHILOSOPHER_BY_SLUG: Record<string, Omit<Philosopher, 'id' | 'created_at'>> = Object.fromEntries(
  PHILOSOPHER_DATA.map((p) => [p.slug, p]),
);

/**
 * Builds the persona portion of a system prompt: who the philosopher is, how they
 * think (profile), how they write (style essence at the chosen intensity), plus the
 * cross-author rules. Turn-specific instructions are appended by the dialectic engine.
 */
export function renderPersona(philosopher: Pick<Philosopher, 'slug' | 'full_name' | 'name' | 'historical_boundary' | 'profile' | 'analytical_center' | 'style_essence'>, intensity: StyleIntensity): string {
  const essence = philosopher.style_essence;
  const profile = philosopher.profile;
  const low = intensity === 'low';
  const trio = SEAT_TRIOS[philosopher.slug];

  const profileLines = Object.entries(profile)
    // Reasoning scaffolding, house style notes, and rhetorical_style (pure
    // style instruction — long sentences, prosecutorial force — never
    // knowledge) stay out; rhetorical_style drops at Low only, since Medium
    // and High need it for voice.
    // At Low the vocabulary-dense lists drop too: core_principle issues
    // imperatives ("think in terms of assemblages"), and the moves/concepts/
    // distinctions/criticisms/methods/authorities read as word-hoards the
    // model mirrors verbatim. Knowledge (conceptions, influences, whats)
    // stays — only the word-hoards go.
    .filter(([key]) => !['reasoning', 'self_review', 'meta_fix', 'style'].includes(key) && !(low && key === 'rhetorical_style') && !(low && ['core_principle', 'characteristic_argumentative_moves', 'characteristic_concepts', 'recurring_distinctions', 'recurring_criticisms', 'methodological_habits', 'primary_authority', 'modern_adaptation'].includes(key)))
    .map(([key, value]) => `${key.toUpperCase()}: ${Array.isArray(value) ? value.join('; ') : String(value)}`);

  // Low sends the abridged style block (separate file): flavour without the
  // machinery. Knowledge (profile) is never abridged — only style is.
  const styleBlock: string[] = low
    ? [...renderLowStyleEssence(essence, trio), '', 'PLAIN RULES:', ...LOW_PLAIN_RULES, '', ...LOW_CONCEPT_RULES]
    : [
        'STYLE ESSENCE (think in this machinery; do not decorate with vocabulary)',
        `STYLE DNA: ${essence.style_dna}`,
        `CHARACTERISTIC MOVEMENT: ${essence.characteristic_movement}`,
        `CORE MECHANISMS: ${essence.core_mechanisms}`,
        `EFFECTS TO PRODUCE IN YOUR READER — do these on purpose, in your own sentences: ${essence.cda_reader_effects}`,
        `YOUR STANCE: speak as ${essence.cda_profile.agency}; ${essence.cda_profile.modality} modality; your reader is ${essence.cda_profile.reader}; your aim is ${essence.cda_profile.objective}. Pronouns: ${essence.cda_profile.pronouns ?? 'as fits your voice'}.`,
        'GENERATION RULES:',
        ...essence.generation_rules.map((rule) => `- ${rule}`),
        ...(essence.special_modes ? Object.entries(essence.special_modes).map(([key, value]) => `${key.toUpperCase().replace(/_/g, ' ')}: ${value}`) : []),
        '',
        `REGISTER: ${essence.prompt}`,
        ...(essence.dialect_verbs
          ? [`YOUR MOVE VERBS — break PREV with these, build new with these, in your own sentences; never the bare shared words reject/inject: BREAK: ${essence.dialect_verbs.break.join(' / ')}. BUILD: ${essence.dialect_verbs.build.join(' / ')}.`]
          : []),
        `INTENSITY (${intensity.toUpperCase()}): ${essence.intensity[intensity]}`,
        ...(intensity === 'medium'
          ? [
              trio || essence.high_exemplar
                ? `YOUR WORKED EXAMPLE — the same idea at two levels. HIGH (their authentic voice): “${essence.high_exemplar?.quote ?? '(see grounding loans)'}” MEDIUM (your level — term kept, meaning woven beside it, never announced): “${trio?.medium ?? FALLBACK_MEDIUM_EXAMPLE}”. Render every kept term the Medium way.`
                : `YOUR WORKED EXAMPLE — shape every kept term exactly like this (term kept, meaning woven beside it, never announced): “${FALLBACK_MEDIUM_EXAMPLE}”`,
            ]
          : []),
        ...(intensity === 'high' && essence.high_exemplar
          ? [`VOICE ANCHOR — a genuine sentence of theirs; you may quote it verbatim where it fits: “${essence.high_exemplar.quote}” (${essence.high_exemplar.source}). Let its diction, tics, and rhythm colour everything you write.`]
          : []),
      ];

  return [
    `You are ${philosopher.full_name}. You speak only from what you could know up to ${philosopher.historical_boundary ?? 'the end of your life'}; when you address later phenomena you do so inferentially, from your own framework, and you say so only if it matters.`,
    '',
    `ANALYTICAL CENTRE: ${philosopher.analytical_center.join(', ')}.`,
    ...(intensity === 'medium'
      ? [`HARD TERMS — these words of yours must never stand bare: ${philosopher.analytical_center.join(', ')}. Every single use gets its plain meaning inside the sentence plus one short concrete sentence showing what it does. The same holds for any other specialist term you use.`]
      : []),
    '',
    'INTELLECTUAL PROFILE',
    ...profileLines,
    '',
    ...styleBlock,
    // Universal mechanisms carry specimen language and Latinate scaffolding:
    // fierce machinery with no place at Low.
    ...(low ? [] : ['', renderUniversalMechanisms()]),
    '',
    renderAntiWaffle(),
    // Low override comes before the language level so the language block —
    // plain words at Low, natural gloss at Medium, full voice at High —
    // has the final word on diction at every intensity.
    ...(low ? ['', ...LOW_OVERRIDE] : []),
    '',
    ...renderLanguageLevel(intensity),
  ].join('\n');
}
