/**
 * Thinking-first pilot types (Phase 11, `docs/thinker-compiler.md`).
 *
 * Additive only: `StyleEssence` in `@/types` stays until all seats migrate.
 * THINKING is the semantic authority; EXPRESSION is the linguistic renderer.
 * THINK mode sends the THINKING slice only — never the EXPRESSION file.
 */

export type ThinkingEvidence = 'T' | 'S' | 'I' | 'O' | 'M';

export interface LoadBearingDistinction {
  /** A vs B, in the thinker's own logic. */
  pair: [string, string];
  whyItMatters: string;
  /** What breaks when the two are collapsed. */
  collapseCost: string;
}

export interface ProblemSensing {
  /** What they instinctively ask on encountering a problem. */
  entry: string[];
  /** What they ask once they detect a weakness. */
  pressure: string[];
  /** What question they introduce that changes the problem. */
  generative: string[];
  firstNotices: string[];
  distinctions: LoadBearingDistinction[];
  refusals: string[];
  visibility: string;
  blindSpots: string[];
}

export interface ThinkingOperation {
  name: string;
  trigger: string;
  move: string;
  preserves: string;
  rejects: string;
  payoff: string;
  /** Work + section per anchor, e.g. 'Ecology of Freedom, Ch. 1'. */
  corpusAnchors: string[];
  /** Plain keywords the code scorer matches (no model call). */
  selectionTags: string[];
  /** One sentence: what it does to a fresh problem. */
  runtimeExample: string;
  evidence: ThinkingEvidence;
}

export interface JudgmentPatterns {
  patterns: string[];
  epistemicSensibilities: string[];
  certaintyProfile: string[];
}

export interface ConcessionStructure {
  canConcede: string;
  cannotConcede: string;
  restatement: string;
}

export interface IntellectualDebt {
  thinker: string;
  borrowed: string;
  transformed: string;
  rejected: string;
  retained: string;
}

export interface FaultLine {
  /** Cabinet slug, e.g. 'marx'. */
  with: string;
  sharedProblem: string;
  sharedPremise: string;
  /** The exact premise where paths split. */
  divergencePoint: string;
  getsRight: string;
  misses: string;
  strongestOther: string;
  pressureQuestion: string;
  transformingMove: string;
}

export interface CalibrationCase {
  input: string;
  concepts: string[];
  operations: string[];
  expectedJudgment: string;
  expectedMove: string;
}

export interface ThinkingEngine {
  slug: string;
  /** Identity lives in the LIFE file, never here — anonymous mode drops it. */
  /** §1: compact FOUNDATION → CONSEQUENCE → THINKING EFFECT → LIMIT. */
  architecture: { domain: string; foundation: string; consequence: string; thinkingEffect: string; limit: string; weight: 'CORE' | 'SUPPORTING' | 'INTERPRETIVE' }[];
  problemSensing: ProblemSensing;
  /** Repertoire, not sequence. Code proposes 1–3; model may decline. */
  operations: ThinkingOperation[];
  judgment: JudgmentPatterns;
  /** What makes them decide they have thought far enough. Rendered (one
   * line) — it governs output shape directly. Optional during migration. */
  closureRule?: string;
  /** What happens when reality pushes back. Stored for meta evaluation;
   * not rendered (keeps slices lean). Optional during migration. */
  counterEvidenceResponse?: string;
  concessions: ConcessionStructure[];
  /** Formation debts (borrowed/transformed/rejected/retained) stay: they
   * are provenance about this thinker, not comparisons. Live pair
   * dynamics live in `fault-lines.ts`; neighbour tests in
   * `docs/thinking-diversity.md` — neither belongs in a dossier. */
  debts: IntellectualDebt[];
  /** TRANSFER rule for novel objects (runtime gate handles the rest). */
  modernTransferRule: string;
  attention: { activates: string[]; secondary: string[]; dismisses: string[]; expansiveWhen: string; terseWhen: string };
  /** How they meet PREV: agree, qualify, absorb, redirect, contest, shift. */
  prevResponse: string[];
  calibration: CalibrationCase[];
}

export interface TrioModes {
  /** The bare reasoning that leads to the quote — neutral diction, no tics, temper, or quotes. Blind-test line. */
  think: string;
  /** The quote's idea with more explanation: full complexity, every term taught. */
  teach: string;
  /** Literally the verbatim anchor quote below — full voice, no paraphrase. */
  thinkAndSound: string;
  /** Provenance of the thinkAndSound quote (title + section, verified). */
  anchorSource: string | null;
}

/**
 * The three files travel as one: thinking + expression + life. Named modes
 * need all three; anonymous mode withholds life only. Life never ships
 * alone — there is no mode that renders a name without its machinery.
 */
export interface ThinkerFiles {
  thinking: ThinkingEngine;
  expression: ExpressionModel;
  life: LifeFile;
}

/**
 * File 2 of the three-file split: who the thinker is. The ONLY file the
 * anonymous mode withholds. Formative facts live here with their reveal
 * (what each explains about the thinking), never as trivia.
 */
export interface LifeFile {
  slug: string;
  /** Full second-person identity (name, stations, mature position). */
  identity: string;
  historicalBoundary: string;
}

export interface ExpressionModel {
  slug: string;
  movement: string;
  sentenceBehaviour: string;
  vocabulary: { core: string[]; preferred: string[]; signature: string[] };
  temper: string[];
  readerRelation: string;
  /** Compact anti-parody / avoid list for review. */
  avoid: string[];
  trio: TrioModes;
}
