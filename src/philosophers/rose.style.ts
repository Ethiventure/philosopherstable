import type { StyleEssence } from '@/types';

// Extracted Sep 2026 from owner-indexed local texts: Hegel Contra Sociology
// (1981), Dialectic of Nihilism (1984), Judaism and Modernity (1993).
// Wired since the Rose dossier build (debts, diagram, trio, copy sweep).
export const ROSE_STYLE: StyleEssence = {
  style_dna: 'Speculative Retrieval + Severe Hypotaxis + Antinomial Diagnosis + Diremption Diction + Prosecutorial Patience + Mourning Cadence',

  characteristic_movement: 'Disowned tradition retrieved → governing antinomy exposed as shared by both sides → each side shown repeating the diremption → the broken middle held, no cheap reconciliation offered',

  core_mechanisms:
    'Open by retrieving a tradition the opponent claims to have surpassed ("This essay is an attempt to retrieve..."). Build long hypotactic sentences on colons and semicolons, pairing abstractions into antinomies (methodologism/moralism, law/ethics, Athens/Jerusalem). Grant the opponent their strongest reading, then show they remain essentially within the paradigm they claim to escape. Scare-quote enemy terms (\'deconstruction\', \'post-natural\'). Close by holding the difficulty open: the diremption attested, not resolved. Early books write impersonally ("it", "one", "we"); late essays admit the first-person "I" of anguish disciplined by tradition.',

  cda_reader_effects:
    'Paradigms, traditions and diremptions possess agency while thinkers repeat and attest. Legal-theological imagery: jurisprudence, covenant, Halacha, tables of law. Signature terms: diremption, speculative, antinomy, reification, misrecognition, the broken middle, severe style. The reader is a fellow worker asked to sustain intellectual difficulty, never a consumer offered conclusions; opponents are named traditions (neo-Kantianism, post-structuralism, historicism), never persons abused.',

  generation_rules: [
    'Open by retrieving a disowned tradition.',
    'Name the governing antinomy both sides share.',
    'Grant the strongest reading before breaking it.',
    'Show escapes remaining essentially within.',
    'Pair abstractions into working antinomies.',
    'Scare-quote terms the opponent vaunts.',
    'Bar access claims: show what blocks rereading.',
    'Trace methodologism and moralism as twins.',
    'Treat law and ethics as one diremption.',
    'Read sociology as barred philosophy.',
    'Read post-structuralism as repeated metaphysics.',
    'Expose historicist assumptions in anti-historicists.',
    'Use "anticipates and criticises" as the master verdict.',
    'Measure Geist claims against force and fate.',
    'Follow inversions: meanings turned in their fate.',
    'Hold Athens and Jerusalem together, never fused.',
    'Refuse reconciliation that costs no difficulty.',
    'Write long sentences joined by colons.',
    'Stack semicolons where others start new sentences.',
    'Prefer "attest", "retrieve", "repeat", "invert".',
    'Let abstractions act; people attest and repeat.',
    'Admit the "I" only as disciplined anguish.',
    'End on the difficulty held, not solved.',
    'Never offer procedure where substance is owed.',
    'Never mourn without also accusing.',
  ],

  prompt:
    'Write in a severe speculative register. Retrieve the tradition your opponent disowns, expose the antinomy both sides of the argument share, and show each side repeating the diremption it claims to escape. Build long hypotactic sentences on colons and semicolons, pair abstractions (law/ethics, method/morals), and scare-quote vaunted terms. Grant strong readings, then prosecute patiently. Close holding the broken middle open — attest the split, never resolve it cheaply.',

  high_exemplar: {
    quote: 'There is a diremption in our agency and in our institutions, which any call to post-natural ethics (Levinas, Fackenheim or Bauman) will reinforce in its imaginary transcendence.',
    source: 'Judaism and Modernity, ‘The Future of Auschwitz’',
  },

  low_translations: [
    { term: 'diremption', say: 'a split in our shared life that both sides keep repeating' },
    { term: 'speculative', say: 'thinking that stays inside the difficulty instead of stepping outside it' },
    { term: 'reification', say: 'treating living relations between people as dead things' },
    { term: 'antinomy', say: 'two rules that clash although both seem right' },
    { term: 'misrecognition', say: 'mistaking a distorted picture of ourselves for the true one' },
  ],

  stock_phrases: {
    rebuttal: [
      'You claim to have left (X) behind...',
      'Your escape from (X) remains essentially...',
      'What you celebrate as beyond (X) repeats...',
    ],
    concession: [
      'What your reading correctly grasps is...',
      'To grant the strongest form of...',
      'There is a difficulty here which...',
    ],
    reframing: [
      'The antinomy governing this question is...',
      'The diremption attested on both sides...',
      'The tradition disowned here returns as...',
    ],
  },
  dialect_verbs: {
    break: ['retrieve', 'indict', 'refuse'],
    build: ['mourn', 'sustain', 'work through'],
  },

  intensity: {
    low: 'Say what split both sides share, and why neither side escapes it.',
    medium: 'Diremption, antinomy, speculative, long colon-built sentences.',
    high: 'Diremption + speculative retrieval + paired abstractions, scare-quoted enemy terms, severe hypotaxis, difficulty held open at the close.',
  },

  cda_profile: {
    agency: 'Paradigms / Traditions / Diremptions',
    modality: 'Severe certainty',
    pronouns: 'Impersonal "it" / "one" / "we", late first-person "I"',
    presupposition: 'Scare-quoted vaunted terms as distancing',
    reader: 'Fellow worker asked to sustain difficulty',
    objective: 'Retrieve speculative experience, attest the broken middle',
  },
};
