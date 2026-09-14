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
import type { SeatTrio } from '@/philosophers/trios';

/** Flavour without machinery: who they are and how they move, in four lines. */
export function renderLowStyleEssence(essence: StyleEssence, trio?: SeatTrio): string[] {
  return [
    'STYLE ESSENCE — LOW REGISTER (short version; the full stylistic machinery is switched off)',
    `STYLE DNA: ${essence.style_dna}`,
    `CHARACTERISTIC MOVEMENT: ${essence.characteristic_movement}`,
    `INTENSITY (LOW): ${essence.intensity.low}`,
    ...(trio
      ? [`YOUR WORKED EXAMPLE — the same idea stepping down. MEDIUM: “${trio.medium}” LOW (your level — plain words carrying the full idea; never borrow the harder words above): “${trio.low}”`]
      : []),
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

/**
 * Language level, rendered last in the persona at EVERY intensity so it
 * governs diction. Low translates hard terms into plain words (describing
 * the idea when no plain equal exists); Medium keeps important terms with a
 * natural inline gloss; High uses the authentic voice. Meaning is never
 * simplified — only the words carrying it are.
 */
export const LANGUAGE_LEVELS = {
  low: 'LANGUAGE LEVEL — LOW: use roughly IELTS-5 English: short plain sentences in everyday words, one idea per paragraph. Assume your reader finished high school and never studied philosophy — if they would stumble on a word, it needs plain words around it. Translate or describe difficult, specialist, archaic, and obscure terms in simple natural English instead of using them — where a term has no plain equal, describe what it does rather than naming it. Keep an essential philosophical term only when dropping it would change the meaning. Read the profile and style lines above for ideas only — never borrow their specialist words.',
  medium:
    'LANGUAGE LEVEL — MEDIUM: keep important philosophical, specialist, archaic, and obscure terms, but explain their meaning naturally inside the sentence in plain words. Trigger: any word a bright 16-year-old who never studied philosophy would stumble on. Do not use separate dictionary-style breaks such as saying “this means …” out loud — weave the explanation into the sentence itself. Go through each sentence term by term as you write: no specialist, archaic, or obscure word may stand without its plain meaning beside it in the same sentence. Shape every kept term exactly like this example — term kept, meaning woven beside it: “This contradiction leads to a new form through Aufhebung, a process in which the old form is overcome but also preserved within what comes next.” Never a bare term, never a dictionary break. A Medium turn that leaves a hard term unexplained has failed.',
  high: 'LANGUAGE LEVEL — HIGH: use the philosopher’s authentic vocabulary, terminology, and normal level of linguistic difficulty. Do not simplify unless needed for clarity.',
} as const;

export const LANGUAGE_COMMON =
  'At every level, preserve the philosophical meaning, distinctions, and reasoning. Simplify the language, not the ideas.';

export function renderLanguageLevel(intensity: keyof typeof LANGUAGE_LEVELS): string[] {
  return [LANGUAGE_LEVELS[intensity], LANGUAGE_COMMON];
}
