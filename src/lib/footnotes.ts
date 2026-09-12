import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';

/**
 * Numbered footnotes for the manifest (Phase: references).
 *
 * Numbers are STABLE manifest indices (file order + 1) — never drawer order
 * (newest-first), so inserting a source can't renumber history. Displayed as
 * "Read similar: 3, 9"; the numbers match the [#n] badges in Further reading
 * and the Reading List appendix of the export. References never enter the
 * token exchange: they are resolved display-side from the model's
 * works_referenced labels, never fed back into prompts.
 */

export function manifestNumber(index: number): number {
  return index + 1;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\[|\]|\(|\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distinctive words of a label: drop tiny stopwords so "the", "of", "on" can't match. */
const STOPWORDS = new Set([
  'the', 'of', 'on', 'a', 'an', 'and', 'in', 'to', 'vol', 'volume', 'ch', 'chapter',
  'part', 'postscript', 'by', 'ed', 'trans',
]);

function distinctive(label: string): string[] {
  return normalise(label).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Resolve model-claimed work labels to manifest numbers. Prefers same-author
 * entries; requires at least two distinctive words (or one word of length
 * 7+) to match so "Capital" alone can't claim a number. Unmatched labels
 * return nothing — callers render them as plain unverified text, never
 * numbered. Order follows the label order, deduplicated.
 */
export function footnoteNumbers(philosopherName: string, labels: string[]): number[] {
  return splitLabels(philosopherName, labels).numbers;
}

/**
 * Split model-claimed labels into manifest numbers vs unmatched leftovers.
 * Unmatched render as plain unverified text (never numbered, never dropped).
 */
export function splitLabels(philosopherName: string, labels: string[]): { numbers: number[]; unmatched: string[] } {
  const out: number[] = [];
  const unmatched: string[] = [];
  const seen = new Set<number>();
  const entries = CORPUS_SOURCES_DATA.map((source, index) => ({ source, number: manifestNumber(index) }));
  const own = entries.filter(({ source }) =>
    source.author.toLowerCase().includes(philosopherName.toLowerCase()));

  for (const label of labels) {
    const words = distinctive(label);
    if (words.length === 0) continue;
    const strong = words.length >= 2 || words[0].length >= 7;
    if (!strong) {
      unmatched.push(label);
      continue;
    }
    const matchesTitle = (title: string) => {
      const titleWords = normalise(title).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));
      // Either direction: the label may add detail ("Capital, Vol I, ch. 15")
      // or the title may ("Capital, Volume I" vs label "Capital").
      return titleWords.every((w) => words.includes(w)) || words.every((w) => titleWords.includes(w));
    };
    // The speaker's own works first — footnotes should overwhelmingly be
    // things they actually wrote.
    const ownHit = own.find(({ source }) => matchesTitle(source.title));
    if (ownHit && !seen.has(ownHit.number)) {
      seen.add(ownHit.number);
      out.push(ownHit.number);
      continue;
    } else if (ownHit) {
      continue;
    }
    // Another author's work only exceptionally: three or more distinctive
    // words must all match, so passing mentions can't claim a stranger's book.
    if (words.length >= 3) {
      const other = entries.find(
        ({ source }) =>
          !source.author.toLowerCase().includes(philosopherName.toLowerCase()) &&
          matchesTitle(source.title),
      );
      if (other && !seen.has(other.number)) {
        seen.add(other.number);
        out.push(other.number);
        continue;
      }
    }
    unmatched.push(label);
  }
  return { numbers: out, unmatched };
}

/** Manifest entries for a set of footnote numbers (export Reading List). */
export function entriesForNumbers(numbers: number[]) {
  return numbers
    .map((n) => ({ number: n, source: CORPUS_SOURCES_DATA[n - 1] }))
    .filter((entry): entry is { number: number; source: (typeof CORPUS_SOURCES_DATA)[number] } =>
      Boolean(entry.source));
}
