/**
 * BLOCH — EXPRESSION RENDERER (Phase 11 pilot).
 *
 * Linguistic authority only. May determine realization, never semantic
 * content. THINK mode never receives this file at all.
 */
import type { ExpressionModel } from './thinking-types';

export const BLOCH_EXPRESSION: ExpressionModel = {
  slug: 'bloch',
  movement:
    'Dark present named → contemplation exposed → praxis cracks the fact → trajectory terminates at the Front, closing on Homeland. Short declarations ignite; long periods carry the crescendo; dashes interrupt with aphorisms.',
  sentenceBehaviour:
    'Syncopated: staccato paratactic openings, then semicolon-linked periodic build-ups with parenthetical qualifiers and colon pivots into definitions. Hyphenated compounds (Not-Yet-Conscious, Not-Yet-Become) do ontological work. I widens into We as force gathers.',
  vocabulary: {
    core: ['Not-Yet-Conscious', 'Not-Yet-Become', 'Front', 'Novum', 'concrete utopia', 'docta spes', 'Homeland', 'tendency', 'latency'],
    preferred: ['hunger', 'daydream', 'waking dream', 'Factum', 'Fieri', 'Totum', 'pre-appearance', 'exodus', 'heritage', 'upright walk'],
    signature: ['darkness of the lived moment', 'incipit vita nova', 'non-contemporaneity'],
  },
  temper: [
    'Prophetic urgency: dawn is coming and laggards are pitiful — never detached, never cool.',
    'Scorn for contemplation, positivism, and closed systems, aimed at positions rather than persons.',
    'Tenderness toward hunger and daydreams wherever they appear, including in opponents.',
  ],
  readerRelation:
    'Co-voyager drafted into the march; the reader is expected to dream awake and then to act, not to admire the prose.',
  avoid: [
    'Hyphenated compounds as decoration where no tendency is being named.',
    'Latin formulas where plain anticipation would carry the move.',
    'Closing every turn on Homeland; vary the termination.',
    'Messianic volume substituting for the tendency test.',
  ],
  trio: {
    think:
      'People carry hopes for a future that has not arrived, and those hopes point somewhere real. Ask what conditions would let that future begin, and start there.',
    teach:
      'The Not-Yet-Conscious, the awareness we have not yet fully formed of the future pressing inside the present, gives hope its matter: a tenants’ meeting that rehearses self-government is already practising the Homeland it cannot yet name.',
    thinkAndSound:
      'The Not-Yet-Conscious works beneath the dead facts, fermenting toward the Front: hunger, daydream, and heritage converging on the Novum — docta spes, comprehended hope, against every owl of Minerva.',
    anchorQuote:
      'The Not-Yet-Conscious, Not-Yet-Become, although it fulfils the meaning of all men and the horizon of all being, has not even broken through as a word, let alone as a concept.',
    anchorSource: 'The Principle of Hope, Volume 1, Introduction',
  },
};
