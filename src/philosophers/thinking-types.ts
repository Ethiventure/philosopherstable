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
  /** §0: name, dates, period, mature position, boundary — facts allowed. */
  identity: string;
  historicalBoundary: string;
  /** §1: compact FOUNDATION → CONSEQUENCE → THINKING EFFECT → LIMIT. */
  architecture: { domain: string; foundation: string; consequence: string; thinkingEffect: string; limit: string; weight: 'CORE' | 'SUPPORTING' | 'INTERPRETIVE' }[];
  problemSensing: ProblemSensing;
  /** Repertoire, not sequence. Code proposes 1–3; model may decline. */
  operations: ThinkingOperation[];
  judgment: JudgmentPatterns;
  concessions: ConcessionStructure[];
  debts: IntellectualDebt[];
  faultLines: FaultLine[];
  /** Compiler rule for novel objects (runtime gate handles the rest). */
  modernTransferRule: string;
  attention: { activates: string[]; secondary: string[]; dismisses: string[]; expansiveWhen: string; terseWhen: string };
  /** How they meet PREV: agree, qualify, absorb, redirect, contest, shift. */
  prevResponse: string[];
  calibration: CalibrationCase[];
  /** Same question + PREV: what they do that two neighbours would not. */
  neighbourTest: string;
}

export interface TrioModes {
  /** Pure move, no signature terms — blind-test line. */
  think: string;
  /** Same move, real terms kept + woven gloss + concrete sentence. */
  teach: string;
  /** Same move in authentic vocabulary where it helps. */
  thinkAndSound: string;
  /** Real verbatim quote (<40 words) or null when unverified. */
  anchorQuote: string | null;
  anchorSource: string | null;
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
