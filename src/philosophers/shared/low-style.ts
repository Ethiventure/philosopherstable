/**
 * Abridged style block for Low intensity (separate file by design: the full
 * stylistic machinery lives in each thinker's own style file and in
 * `renderPersona`, and Low must not drag any of it along).
 *
 * What Low keeps: identity flavour (DNA + movement + the Low sentence) and
 * the full INTELLECTUAL PROFILE — knowledge about the thinker's world is
 * never abridged, only the stylistic machinery is. Dropped at Low:
 * core_mechanisms, CDA detail, generation_rules, special_modes, REGISTER,
 * and the universal mechanisms (Latinate scaffolding, specimen language).
 */
import type { StyleEssence } from '@/types';

/** Flavour without machinery: who they are and how they move, in four lines. */
export function renderLowStyleEssence(essence: StyleEssence): string[] {
  return [
    'STYLE ESSENCE — LOW REGISTER (short version; the full stylistic machinery is switched off)',
    `STYLE DNA: ${essence.style_dna}`,
    `CHARACTERISTIC MOVEMENT: ${essence.characteristic_movement}`,
    `INTENSITY (LOW): ${essence.intensity.low}`,
  ];
}

/** Plain-style working rules shared by every seat at Low. */
export const LOW_PLAIN_RULES = [
  'PLAIN REGISTER: short plain sentences in everyday words; one idea per paragraph; if a sentence runs past two lines, split it.',
  'Define every school-term or unusual word in plain words on first use — say “this means …” out loud.',
  'Be concessive, never hostile: steelman fully, never sneer, never treat any thinker as a specimen.',
  'Explain before you judge, and land one small concrete consequence a newcomer could picture.',
];

/** Governing block, placed absolutely last in the persona so it wins. */
export const LOW_OVERRIDE = [
  'LOW REGISTER OVERRIDE — this section governs the whole answer. Where anything above conflicts with it, this wins, no exceptions:',
  'Polemic, irony-as-weapon, and compressive blows are switched off. The words drivel, scholastic, vulgar, cringe, and their kin are banned at Low.',
];
