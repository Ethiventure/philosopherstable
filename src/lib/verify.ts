/**
 * Quote verification for grounded turns (Phase 2, item ii, second half).
 *
 * The extractor shows passages to the model, but nothing stops the model
 * inventing quotes anyway. This module checks, purely client-side, whether
 * quoted spans in a turn's text actually occur in the passages it was shown.
 * No LLM involved — string matching only, so "verified" means literally
 * present, and "unverified" means check by hand (paraphrase also fails).
 */

export interface QuoteCheck {
  quote: string;
  verified: boolean;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Quoted spans of substance: double-quoted passages plus single-quoted
 * loans (the prompt contract orders single quotes — bare doubles corrupt
 * JSON — so singles are where compliant loans live). Singles need a space
 * inside (skips don't/children's) and stay short (skips run-on prose);
 * empties and dupes dropped. */
export function extractQuotes(text: string): string[] {
  const out: string[] = [];
  // Normalise smart quotes first so “…” and ‘…’ spans are caught too.
  const flat = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const reDouble = /"([^"]{25,400})"/g;
  let match: RegExpExecArray | null;
  while ((match = reDouble.exec(flat)) !== null) {
    const quote = match[1].trim();
    if (quote && !out.includes(quote)) out.push(quote);
  }
  const reSingle = /(?<![A-Za-z])'([^']* [^']*)'(?![A-Za-z])/g;
  // Lookarounds keep contractions out: the quote must neither open
  // mid-word (Don|'t …) nor close into one (… children|'s), or spans
  // stretch across whole sentences between two apostrophes.
  while ((match = reSingle.exec(flat)) !== null) {
    const quote = match[1].trim();
    if (quote.length >= 4 && quote.length <= 80 && !out.includes(quote)) out.push(quote);
  }
  return out;
}

/**
 * A quote verifies if it (or its substantive core, for trimmed citations)
 * occurs verbatim in the shown passages. Returns one row per quote so the
 * UI can render ✓/✗ badges. Empty quote list → [] (caller shows the
 * loan-free line, which is itself enforcement evidence).
 */
export function verifyQuotes(responseText: string, passages: string[]): QuoteCheck[] {
  const corpus = normalise(passages.join('\n'));
  if (!corpus.trim()) return [];
  return extractQuotes(responseText).map((quote) => {
    const norm = normalise(quote);
    if (!norm) return { quote, verified: false };
    if (corpus.includes(norm)) return { quote, verified: true };
    // Trimmed citations: verify the core (middle 60%) instead of the edges.
    const core = norm.slice(Math.floor(norm.length * 0.2), Math.floor(norm.length * 0.8));
    return { quote, verified: core.length > 20 && corpus.includes(core) };
  });
}
