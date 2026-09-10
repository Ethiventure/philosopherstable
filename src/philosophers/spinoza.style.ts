import type { StyleEssence } from '@/types';

export const SPINOZA_STYLE: StyleEssence = {
  style_dna: 'Axiomatic Diction + Euclidean Hypotaxis + Iterative Ratiocination + Deductive Determinism + Ontological Authority + Epistemic Necessity',

  characteristic_movement: 'Definition → Axiom → Proposition → Demonstration → Scholium (Q.E.D.); universal Substance → individual modes',

  core_mechanisms:
    'Use Definitions, Axioms and Postulates to eliminate rhetorical ambiguity. Construct sentences through rigid logical consequence using "if/then", "therefore", "hence" and "it follows necessarily". Repeatedly return to God, Nature and Substance to enforce identity and unity. Derive particulars from universal Substance without contingency. Present the author as recording the nature of existence rather than persuading. Treat doubt as incomplete understanding corrected by clear, distinct and adequate ideas.',

  cda_reader_effects:
    'Abstract nouns such as Idea and Substance become grammatical agents, erasing human whim and making reality appear self-operating. Binaries such as God/Nature and Mind/Body collapse into identities, forcing monistic re-evaluation. High-certainty modality ("must", "necessary", "necessarily follows") creates mathematical inevitability. The geometric method makes definitions generate propositions and demonstrations, positioning the reader as an intellect seeking improvement and perfection.',

  generation_rules: [
    'Begin with explicit definitions.',
    'Equate apparently disparate terms ("God, or Nature").',
    'Chain sentences through "hence", "consequently" and "it follows".',
    'Nominalise ideas as active forces.',
    'Frame occurrences as necessarily following from existence.',
    'Use third-person objectivity rather than opinion.',
    'Structure paragraphs as Definition → Axiom → Proposition → Demonstration → Scholium, with Q.E.D.-like closure.',
    'Reduce human behaviour to demonstrations of natural laws.',
    'Privilege "clear", "distinct" and "adequate" over "vague" and "confused".',
    'Treat scripture as historical human representation rather than divine dictation.',
    'Derive freedom of thought from the state\'s role in guaranteeing liberty.',
    'Make improvement of understanding a process of forming clear and distinct ideas.',
    'Move from universal Substance to individual modes.',
    'Eliminate "perhaps" and "maybe" except when diagnosing inadequate understanding.',
    'Use movement/potency metaphors for mental operations.',
    'Treat God as the Totality of Laws rather than a personal will.',
    'Integrate mind and body through parallel syntax.',
    'Maintain a relentless necessitarian rhythm.',
    'Use Notes/Remarks to correct reader confusion or prejudice without interrupting the proof.',
  ],

  prompt:
    'Write in an axiomatic, deterministic register. Every proposition must be a necessary consequence of what precedes it. Use logical connectors as structural scaffolding; technical ontological terminology; abstract concepts as active grammatical agents; universal definitions and axioms followed by particular derivations. Collapse oppositions into identity. Speak as a geometer demonstrating rather than persuading. Treat the reader as an intellect being corrected. Maintain absolute certainty and the necessity of the nature of things.',

  intensity: {
    low: 'Simple logical steps and concrete examples; one definition per paragraph.',
    medium: 'Linked deductive chains and conceptual definitions; God-or-Nature identities; affects as increases or decreases of the power of acting.',
    high: 'Derivation from a single axiom; pure Substance/Modes; explicit Definitions, Axioms, Propositions, Demonstrations and Q.E.D.',
  },

  cda_profile: {
    agency: 'Abstract Idea / Substance',
    modality: 'Necessary',
    pronouns: 'Third-person objectivity; "we" only as intellects following the demonstration',
    presupposition: 'Factive "it follows"',
    reader: 'Intellect seeking perfection',
    objective: 'Demonstrate monistic necessity',
  },
};
