/**
 * Shared text primitives for retrieval (browser + node single source).
 * Erasable-syntax TypeScript only — node imports this directly for eval/tests.
 */

export const STOPWORDS: string[] = [
  'the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'is', 'are',
  'was', 'were', 'be', 'been', 'by', 'with', 'as', 'at', 'from', 'that',
  'this', 'it', 'its', 'it’s', "it's", 'an', 'or', 'not', 'but', 'which',
  'what', 'when', 'where', 'who', 'how', 'why', 'can', 'could', 'should',
  'would', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'shall',
  'may', 'might', 'must', 'than', 'then', 'there', 'their', 'they', 'them',
  'he', 'she', 'we', 'you', 'i', 'his', 'her', 'our', 'your', 'my', 'all',
  'any', 'each', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
  'same', 'so', 'too', 'very', 'just', 'about', 'into', 'over', 'after',
  'between', 'out', 'up', 'down', 'off', 'again', 'once', 'here', 'there',
];

const STOP = new Set(STOPWORDS);

export function normalizeText(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function tokenize(s: string): string[] {
  const runs = s.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*(?:'[a-z]+)?/g) ?? [];
  const out: string[] = [];
  for (const t of runs) {
    out.push(t);
    if (t.includes('-')) {
      for (const part of t.split('-')) if (part) out.push(part);
    }
  }
  return out;
}

/** Query terms: tokenized, stopwords removed, order kept, deduped. */
export function queryTerms(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokenize(query)) {
    if (STOP.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function wordCount(s: string): number {
  const m = s.match(/\S+/g);
  return m ? m.length : 0;
}

/** Trim to maxChars without cutting mid-word: breaks at the last whitespace
 * inside the limit (falls back to a hard cut for unbroken runs). */
export function smartCut(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  const head = s.slice(0, maxChars);
  const at = head.lastIndexOf(' ');
  if (at < maxChars * 0.5) return `${head}…`;
  return `${head.slice(0, at)}…`;
}
