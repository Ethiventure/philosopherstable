import type { Philosopher, PhilosopherDefinition, StyleIntensity } from '@/types';
import { SPINOZA } from './spinoza';
import { KANT } from './kant';
import { HEGEL } from './hegel';
import { MARX } from './marx';
import { LENIN } from './lenin';
import { BOGDANOV } from './bogdanov';
import { WEIL } from './weil';
import { BOOKCHIN } from './bookchin';
import { DELEUZE } from './deleuze';
import { FISHER } from './fisher';
import { renderUniversalMechanisms } from './shared/universal-mechanisms';
import { renderAntiWaffle } from './shared/anti-waffle';
import { LOW_OVERRIDE, LOW_PLAIN_RULES, renderLowStyleEssence } from './shared/low-style';

const DEFINITIONS: PhilosopherDefinition[] = [SPINOZA, KANT, HEGEL, MARX, LENIN, BOGDANOV, WEIL, BOOKCHIN, DELEUZE, FISHER];

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
export function renderPersona(philosopher: Pick<Philosopher, 'full_name' | 'name' | 'historical_boundary' | 'profile' | 'analytical_center' | 'style_essence'>, intensity: StyleIntensity): string {
  const essence = philosopher.style_essence;
  const profile = philosopher.profile;

  const profileLines = Object.entries(profile)
    .filter(([key]) => !['reasoning', 'self_review', 'meta_fix', 'style'].includes(key))
    .map(([key, value]) => `${key.toUpperCase()}: ${Array.isArray(value) ? value.join('; ') : String(value)}`);

  const low = intensity === 'low';

  // Low sends the abridged style block (separate file): flavour without the
  // machinery. Knowledge (profile) is never abridged — only style is.
  const styleBlock: string[] = low
    ? [...renderLowStyleEssence(essence), '', 'PLAIN RULES:', ...LOW_PLAIN_RULES]
    : [
        'STYLE ESSENCE (think in this machinery; do not decorate with vocabulary)',
        `STYLE DNA: ${essence.style_dna}`,
        `CHARACTERISTIC MOVEMENT: ${essence.characteristic_movement}`,
        `CORE MECHANISMS: ${essence.core_mechanisms}`,
        `READER EFFECTS: ${essence.cda_reader_effects}`,
        `AGENCY: ${essence.cda_profile.agency}. MODALITY: ${essence.cda_profile.modality}. READER: ${essence.cda_profile.reader}. OBJECTIVE: ${essence.cda_profile.objective}.`,
        'GENERATION RULES:',
        ...essence.generation_rules.map((rule) => `- ${rule}`),
        ...(essence.special_modes ? Object.entries(essence.special_modes).map(([key, value]) => `${key.toUpperCase().replace(/_/g, ' ')}: ${value}`) : []),
        '',
        `REGISTER: ${essence.prompt}`,
        `INTENSITY (${intensity.toUpperCase()}): ${essence.intensity[intensity]}`,
      ];

  return [
    `You are ${philosopher.full_name}. You speak only from what you could know up to ${philosopher.historical_boundary ?? 'the end of your life'}; when you address later phenomena you do so inferentially, from your own framework, and you say so only if it matters.`,
    '',
    `ANALYTICAL CENTRE: ${philosopher.analytical_center.join(', ')}.`,
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
    // Low override comes absolutely last so recency plus the explicit
    // precedence sentence outweigh everything above it.
    ...(low ? ['', ...LOW_OVERRIDE] : []),
  ].join('\n');
}
