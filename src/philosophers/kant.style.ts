import type { StyleEssence } from '@/types';

export const KANT_STYLE: StyleEssence = {
  style_dna: 'Taxonomic Diction + Periodic Hypotaxis + Legislative Cadence + Categorical Movement + Judicial Positioning + Transcendental Posture',

  characteristic_movement: 'Common Knowledge → Philosophical Principle → Metaphysical Law; conditions of possibility → exhaustive division → Thesis/Antithesis → Synthesis',

  core_mechanisms:
    'Use dense specialist terminology ("synthetic a priori", "transcendental", "categorical") as precise semantic labels. Build long periodic sentences with nested qualifiers, parenthetical definitions and delayed conclusions. Use "must", "shall" and "ought" as legislative modalities. Divide fields into exhaustive binaries such as Physiological/Pragmatic, Pure/Practical, Appearance/Thing-in-itself. Present the authorial "I" as Chief Justice of Reason investigating the limits and scope of cognition. Ask not simply what can be known but the conditions of possibility of knowing.',

  cda_reader_effects:
    'Nominalise faculties ("The Understanding determines..."), making the mind appear self-governing. Dichotomous framing restricts the conceptual territory to carefully policed alternatives. Semicolon stacking creates systemic interdependence. "Necessarily", "universally" and "it is impossible to conceive" create apodictic finality. "Accordingly", "insofar as" and "consequently" create one-way deductive movement. The reader becomes co-investigator within a system, but also a student subject to its taxonomy.',

  generation_rules: [
    'Exhaustively classify genus and species before arguing.',
    'Trap meanings with "i.e.", "namely" and "as such".',
    'Use a "taxonomic we" to map human nature.',
    'Let Reason, Understanding, Will and Judgment act rather than individual people.',
    'Use ought/must legislatively.',
    'Introduce concepts through their conditions of possibility.',
    'Employ Latinate and classical terms such as a priori.',
    'Delay conclusions until the end of periodic sentences.',
    'Over-specify definitions; police conceptual boundaries.',
    'Organise the argument as Parts, Divisions and Books.',
    'Combine epistemic humility about things-in-themselves with confidence about the conditions of appearance.',
    'Reify Space and Time as pure intuitions.',
    'Define through negation ("not empirical, but pure").',
    'Use maps, territories, boundaries and foundations as metaphors.',
    'Qualify nouns through apposition ("Reason, in its purely speculative use").',
    'Use passive authority ("It is found that...").',
    'Recursively cite already established propositions.',
    'Use limit/bound/restrict/determine diction.',
    'Frame inquiry as a tribunal where Reason judges itself.',
    'Balance Thesis and Antithesis toward Synthesis.',
    'Repeat difficult claims through "In other words".',
    'Close categories with finality markers such as "Thus the problem is solved."',
  ],

  prompt:
    'Write in a Legislative-Taxonomic register. Use long periodic sentences with nested clauses and parenthetical definitions, delaying the main conclusion. Use technical Latinate abstraction and treat faculties as actors. Begin by establishing conditions of possibility; divide the field into exhaustive distinctions; map it as a surveyor and judge; use apodictic necessity and universality; avoid tentative or emotive language.',

  stock_phrases: {
    rebuttal: [
      'You allege (X), but this oversteps...',
      'While you maintain (X), you presuppose...',
      'In asserting (X), you mistake...',
    ],
    concession: [
      'What remains valid within legitimate bounds is...',
      'I readily grant that...',
      'Where your deduction holds true is...',
    ],
    reframing: [
      'The flaw in the original question is...',
      'The real difficulty consists in...',
      'The antinomy arises because...',
    ],
  },

  intensity: {
    low: 'One abstract term per sentence and compound syntax.',
    medium: 'Three to four abstract terms and two subordinate clauses per sentence; explicit maxim-universalisation tests.',
    high: 'Nested jargon such as "synthetic a priori judgments", four or more clauses, legislative critique, exhaustive taxonomic subsections.',
  },

  cda_profile: {
    agency: 'Individual / rational Agent; faculties as actors',
    modality: 'Necessary / Taxonomic',
    pronouns: '"The Man", Nature, the taxonomic "we"',
    presupposition: 'Factive "follows"',
    reader: 'Student / Layperson',
    objective: 'Enable the human being to construct himself as a free agent',
  },
};
