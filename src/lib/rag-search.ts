/**
 * Lexical retrieval over the static passage index (browser + node, one source).
 * BM25 over passage text, plus transparent boosts — every component stays
 * visible in debug output. No vector anything in v1.
 *
 * Erasable-syntax TypeScript only: node imports this directly for eval/tests.
 */
import { queryTerms, tokenize, STOPWORDS } from './rag-text.ts';
import { stem } from './porter.ts';

export interface IndexPassage {
  id: string;
  work_id?: string;
  author: string;
  work_title: string;
  section_title: string | null;
  section_path: string | null;
  ordinal: number;
  word_count: number;
  text: string;
  source_url: string;
}

export interface ScoredPassage {
  passage: IndexPassage;
  bm25: number;
  exactPhraseBoost: number;
  headingBoost: number;
  finalScore: number;
  matchedTerms: string[];
  excluded?: string;
}

export interface SearchDebug {
  query: string;
  terms: string[];
  authorFilter: string | null;
  candidateCount: number;
  selected: ScoredPassage[];
  excluded: ScoredPassage[];
  evidence: 'none' | 'weak' | 'sufficient' | 'strong';
  evidenceReasons: string[];
  elapsedMs: number;
}

const K1 = 1.2;
const B = 0.75;
// Stopwords compared post-stemming: this→thi, these→these-stem, etc. would
// otherwise survive filtering and break phrase contiguity.
const STOP = new Set(STOPWORDS.map(stem));

export interface PreparedIndex {
  passages: IndexPassage[];
  docFreq: Map<string, number>;
  docLens: number[];
  avgLen: number;
}

export function prepareIndex(passages: IndexPassage[]): PreparedIndex {
  const docFreq = new Map<string, number>();
  const docLens: number[] = [];
  let totalLen = 0;
  for (const p of passages) {
    // Index stems: ecological/ecology, commune/communalism, dominate/domination
    // must meet. Raw text stays canonical in passages[].text.
    const terms = tokenize(p.text).map(stem);
    docLens.push(terms.length);
    totalLen += terms.length;
    for (const t of new Set(terms)) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  }
  return { passages, docFreq, docLens, avgLen: totalLen / Math.max(1, passages.length) };
}

function bm25Term(tf: number, df: number, n: number, docLen: number, avgLen: number): number {
  const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
  return (idf * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * docLen) / Math.max(1, avgLen)));
}

export interface SearchOptions {
  limit?: number;
  author?: string | null;
  candidates?: number;
}

export function searchIndex(prepared: PreparedIndex, query: string, opts: SearchOptions = {}): SearchDebug {
  const t0 = Date.now();
  const limit = opts.limit ?? 6;
  const authorFilter = (opts.author ?? null)?.toLowerCase() ?? null;
  // The author's own name in the question ("Why does Bookchin think…") must
  // not score: it matches every self-mention and drowns the real terms.
  const authorTerms = new Set(tokenize(authorFilter ?? ''));
  const terms = queryTerms(query).filter((t) => !authorTerms.has(t));
  const qstems = [...new Set(terms.map(stem))];
  const normQuery = qstems.join(' ');
  const n = prepared.passages.length;
  const scored: ScoredPassage[] = [];

  prepared.passages.forEach((p, i) => {
    if (authorFilter && !p.author.toLowerCase().includes(authorFilter)) return;
    const tokens = tokenize(p.text).map(stem);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let bm25 = 0;
    const matched: string[] = [];
    for (const t of terms) {
      const s = stem(t);
      const f = tf.get(s) ?? 0;
      if (f > 0 && !matched.includes(t)) matched.push(t);
      bm25 += bm25Term(f, prepared.docFreq.get(s) ?? 0, n, prepared.docLens[i] ?? 0, prepared.avgLen);
    }
    if (matched.length === 0) return;
    // Phrase check on content stems (stopwords stripped both sides), so
    // "the future of life" still matches a query phrased "future of life".
    // Multi-term phrases also earn repetition credit: a passage returning to
    // the exact concept five times outranks one mentioning it once.
    const normText = tokens.filter((t) => !STOP.has(t)).join(' ');
    let exactPhraseBoost = 0;
    if (normQuery.length > 0 && qstems.length > 1 && normText.includes(normQuery)) {
      const occurrences = normText.split(normQuery).length - 1;
      exactPhraseBoost = 2.0 + Math.min(1.0, 0.5 * (occurrences - 1));
    }
    const sectionTokens = new Set(tokenize(p.section_title ?? '').map(stem));
    const titleTokens = new Set(tokenize(p.work_title ?? '').map(stem));
    let headingBoost = 0;
    for (const s of qstems) {
      if (sectionTokens.has(s)) headingBoost += 0.5;
      else if (titleTokens.has(s)) headingBoost += 0.3;
    }
    // Definition boost: the whole question lives in the section title
    // ("What is social ecology?" → section "What is Social Ecology?").
    if (qstems.length > 0 && qstems.every((s) => sectionTokens.has(s))) headingBoost += 2.0;
    headingBoost = Math.min(headingBoost, 3.0);
    scored.push({
      passage: p, bm25: round(bm25), exactPhraseBoost, headingBoost: round(headingBoost),
      finalScore: round(bm25 + exactPhraseBoost + headingBoost), matchedTerms: matched,
    });
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  const pool = scored.slice(0, opts.candidates ?? 30);

  // Diversity: skip passages adjacent to an already-selected one (same work),
  // unless the pool is too thin to fill the limit.
  const selected: ScoredPassage[] = [];
  const excluded: ScoredPassage[] = [];
  const taken = new Set<string>();
  for (const c of pool) {
    if (selected.length >= limit) { excluded.push({ ...c, excluded: 'beyond-limit' }); continue; }
    const near = [...taken].some((id) => {
      const [w1, o1] = id.split('|');
      const [w2, o2] = `${c.passage.work_id ?? c.passage.work_title}|${c.passage.ordinal}`.split('|');
      return w1 === w2 && Math.abs(parseInt(o1, 10) - parseInt(o2, 10)) <= 1;
    });
    if (near && pool.length > limit) { excluded.push({ ...c, excluded: 'adjacent-duplicate' }); continue; }
    taken.add(`${c.passage.work_id ?? c.passage.work_title}|${c.passage.ordinal}`);
    selected.push(c);
  }

  const max = selected.length ? selected[0].finalScore : 0;
  let evidence: SearchDebug['evidence'] = 'none';
  const reasons: string[] = [];
  if (selected.length === 0) {
    reasons.push('no usable passages after filtering');
  } else {
    const decisive = selected[0].passage.word_count < 150 && selected[0].exactPhraseBoost > 0;
    if ((selected.length >= 3 && max >= 4) || decisive) {
      evidence = 'strong';
      reasons.push(decisive ? 'one short decisive passage answers directly' : `${selected.length} direct passages support the answer`);
    } else if (selected.length >= 2 && max >= 2.5) {
      evidence = 'sufficient';
      reasons.push(`${selected.length} passages directly support a substantial part of the answer`);
    } else {
      evidence = 'weak';
      reasons.push('material is incidental, thin, or low-scoring — not enough for a confident answer');
    }
  }

  return {
    query, terms, authorFilter, candidateCount: pool.length,
    selected, excluded, evidence, evidenceReasons: reasons, elapsedMs: Date.now() - t0,
  };
}

function round(x: number): number {
  return Math.round(x * 1000) / 1000;
}
