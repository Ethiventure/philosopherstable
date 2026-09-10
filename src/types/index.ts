export type StyleIntensity = 'low' | 'medium' | 'high';

/**
 * Forensic generative style model for one philosopher.
 * Reconstructs the linguistic *mechanisms* (syntax, agency, modality, conceptual
 * movement, reader positioning) rather than surface vocabulary, so the LLM can
 * think in the philosopher's machinery instead of decorating prose with their words.
 */
export interface StyleEssence {
  /** Six-part formula, e.g. "Axiomatic Diction + Euclidean Hypotaxis + …" */
  style_dna: string;
  core_mechanisms: string;
  /** Critical Discourse Analysis: agency, binaries, modality, reader effects. */
  cda_reader_effects: string;
  generation_rules: string[];
  /** Compact register instruction used verbatim in the system prompt. */
  prompt: string;
  intensity: Record<StyleIntensity, string>;
  /** The author's distinctive transformation logic, e.g. "Immediate → Negation → Sublation". */
  characteristic_movement: string;
  /** Row from the cross-author CDA comparison table. */
  cda_profile: {
    agency: string;
    modality: string;
    pronouns?: string;
    presupposition?: string;
    reader: string;
    objective: string;
  };
  /** Author-specific extras, e.g. Marx's forensic mode or Hegel's dialectical flow. */
  special_modes?: Record<string, string>;
}

export interface Philosopher {
  id: string;
  slug: string;
  name: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  historical_boundary: string | null;
  seat_order: number;
  icon_name: string;
  accent_color: string;
  profile: Record<string, unknown>;
  analytical_center: string[];
  style_essence: StyleEssence;
  created_at: string;
}

/** Shape of each `src/philosophers/{slug}.ts` file. Seat order is derived from birth year in the index. */
export type PhilosopherDefinition = Omit<Philosopher, 'id' | 'created_at' | 'seat_order'>;

export interface CorpusSource {
  id: string;
  philosopher_id: string;
  author: string;
  title: string;
  publication_date: string | null;
  work_type: string;
  language: string;
  source_url: string | null;
  licence_status: string;
  source_reliability: string | null;
  full_text_ingested: boolean;
  metadata_only: boolean;
  translation_notes: string | null;
  is_magnum_opus: boolean;
  is_final_work: boolean;
  sort_order: number;
  created_at: string;
}

export interface CorpusChunk {
  id: string;
  philosopher_id: string;
  source_id: string;
  chunk_index: number;
  chunk_text: string;
  section_label: string | null;
  work_title: string;
  embedding: number[] | null;
  created_at: string;
}

export interface CorpusPassage {
  id: string;
  philosopher_id: string;
  source_id: string;
  passage_text: string;
  citation_label: string;
  work_title: string;
  section_label: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  question: string;
  seating_order: string[];
  num_passes: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'error';
  current_pass: number;
  current_agent_index: number;
  transformed_question: string | null;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  label: string;
  passage_text?: string;
  source_id?: string;
  chunk_id?: string;
  verified: boolean;
}

export interface InterventionSections {
  negation: string;
  incorporation: string;
  reformulation: string;
  contradiction_passed: string;
  new_contribution: string;
}

export interface Intervention {
  id: string;
  meeting_id: string;
  philosopher_id: string;
  pass_number: number;
  seat_position: number;
  response_text: string;
  sections?: InterventionSections;
  retrieved_chunk_ids: string[];
  citations: Citation[];
  position_label: string;
  created_at: string;
}

export interface PositionMemory {
  id: string;
  meeting_id: string;
  philosopher_id: string;
  original_position: string | null;
  pass_1_position: string | null;
  pass_2_position: string | null;
  pass_3_position: string | null;
  changed_my_mind_about: string | null;
  still_defend: string | null;
  adopted_from_other_agent: string | null;
  rejected_from_other_agent: string | null;
  new_conceptual_distinction: string | null;
  unresolved_tension: string | null;
  created_at: string;
  updated_at: string;
}

export interface PassSummary {
  id: string;
  meeting_id: string;
  pass_number: number;
  summary_type: 'problem_map' | 'dialectical_map' | 'spiral_synthesis';
  content: Record<string, unknown>;
  created_at: string;
}

export interface ProblemMap {
  original_question: string;
  transformed_question: string;
  major_concepts_introduced: string[];
  emerging_contradictions: string[];
  unresolved_disagreements: string[];
  strongest_arguments: string[];
  blind_spots: string[];
}

export interface DialecticalMap {
  contradictions: string[];
  convergences: string[];
  unresolved_conflicts: string[];
  changed_positions: string[];
  assumptions_exposed: string[];
  concepts_transformed: string[];
  new_formulation: string;
}

export interface SpiralSynthesis {
  transformed_question: string;
  new_understanding: string;
  major_convergences: string[];
  irreducible_disagreements: string[];
  productive_contradictions: string[];
  position_changes: string[];
  practical_possibilities: string[];
  major_risks: string[];
  unresolvable_questions: string[];
  proposed_action: string;
}

// DEFAULT_SEATING_ORDER now lives in `src/philosophers/index.ts`, derived from birth year.

export const PASS_NAMES = ['First Rotation', 'Second Rotation', 'Reconstruction'] as const;
export const PASS_DESCRIPTIONS = [
  'Seat 1 opens on the question; every later seat determinately negates its immediate predecessor and hands a contradiction on.',
  'The baton keeps rotating across the pass boundary; each turn critiques PREV, preserves what holds, reformulates.',
  'Same chain, reconstructive: what institutions, practices, forms of collective power follow; final seat returns the question to the user.',
] as const;
