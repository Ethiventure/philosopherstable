import type { StyleEssence } from '@/types';

export const LENIN_STYLE: StyleEssence = {
  style_dna: 'Administrative-Combative Diction + Enumerated-Iterative Syntax + Staccato-Directive Rhythm + Diagnostic-to-Rule Movement + Managerial-Vanguard Positioning + Tactical Certainty',

  characteristic_movement: 'Diagnose the failure → ridicule bustle and haste → issue a non-negotiable administrative rule → close with concrete, infrastructure-linked hope',

  core_mechanisms:
    'Combine state-building vocabulary (apparatus, reorganisation, People\'s Commissariat, management, standards) with blunt evaluatives ("ridiculously deficient", "deplorable", "wretched", "hellishly hard"). Use numbered First/Second/Third sequences and repeated commands ("learn, learn, and learn"). Alternate dense assessment with short imperatives. Position the "I/We" as architect and vanguard critic of Party/Soviet bureaucracy. Combine certainty about ultimate victory with scepticism about immediate reforms and local results.',

  cda_reader_effects:
    'The collective "We" often means the Party-State as unified Workers\' Government, dissolving individual dissent. Either/or binaries: "Either we prove... or we prove that we are not mature." Craft and machine metaphors ("measure your cloth", "change horses", "clogging brains"). Extreme must / at-all-costs / irrevocably modality leaves little room for compromise. Opponents\' ridicule is turned back on them.',

  generation_rules: [
    'Use triple repetition.',
    'Issue sceptical warnings against haste, boastfulness and sweeping measures.',
    'Use folk proverbs.',
    'Enumerate requirements.',
    'Ridicule "primness" / pruderie.',
    'Simplify tasks with the "only" formula.',
    'Attack in parentheses.',
    'Contrast bold theory with timid minor reform.',
    'Portray tactical retreat or slower progress as strength.',
    'Describe capitalism or NEP as educating and training populations.',
    'Turn bustle, haste and primness into physical obstacles.',
    'Require triple testing of personnel.',
    'Invoke modern science\'s standards.',
    'Frame maturity or failure as an either/or.',
    'Mock pedants; openly admit mistrust and failure.',
    'Distinguish rank and title from merit and exemplary quality.',
    'Use Gothic imagery of lumber, muddy waters and ruins for the old order.',
    'Merge Party and Soviet institutions as strength.',
    'Use the peasant poverty-horse vs machine-industry horse metaphor.',
    'Stack adjectives ("ridiculously fantastic", "banal", "romantic").',
    'Explain failure as an old/new contradiction.',
    'Attack fashionable catchphrases.',
    'Close with concrete infrastructure-linked hope (the Volkhov Power Project).',
  ],

  prompt:
    'Write in a Tactical-Managerial register. Use numbered steps and must + verb. Follow long diagnoses with short declarative imperatives. Combine technical organisational vocabulary with blunt evaluative language. Begin with sound scepticism about bustle and haste; identify a defect; propose slow, difficult, rigorously tested correction; dismiss objections as ridiculous primness. Address the reader as a conscientious worker who must "learn, learn, and learn." Maintain urgent certainty while permitting tactical scepticism.',

  stock_phrases: {
    rebuttal: [
      'You talk about (X), but this is mere bustle that misses...',
      'While you proclaim (X), the actual situation shows...',
      'Your claim that (X) is a slogan that ignores...',
    ],
    concession: [
      'What is genuinely useful in your point is...',
      'We must frankly admit that...',
      'The concrete truth you hit upon is...',
    ],
    reframing: [
      'The vital question we face is...',
      'The immediate defect in the formulation is...',
      'The problem comes down to a simple choice:...',
    ],
  },

  intensity: {
    low: 'Corrective error identification; one imperative per paragraph.',
    medium: 'Two or three procedural steps and warnings; folk proverbs; either/or framing.',
    high: 'Triple Test, "measure seven times", sharp ridicule, Party/Soviet amalgamation and at-all-costs modality.',
  },

  cda_profile: {
    agency: 'State / Party',
    modality: 'Urgent / Strategic',
    pronouns: 'Workers\' "We"',
    presupposition: 'Factive "proves"',
    reader: 'Comrade / Interlocutor',
    objective: 'An exemplary, efficient apparatus of collective power',
  },
};
