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

/** Double-quoted spans of substance (skips empty/short fragments). */
export function extractQuotes(text: string): string[] {
  const out: string[] = [];
  const re = /"([^"]{25,400})"/g;
  let match: RegExpExecArray | null;
  // Normalise smart quotes first so “…” spans are caught too.
  const flat = text.replace(/[“”]/g, '"');
  while ((match = re.exec(flat)) !== null) {
    const quote = match[1].trim();
    if (quote && !out.includes(quote)) out.push(quote);
  }
  return out;
}

/**
 * A quote verifies if it (or its substantive core, for trimmed citations)
 * occurs verbatim in the shown passages. Returns one row per quote so the
 * UI can render ✓/✗ badges. Empty quote list → [] (caller shows "no
 * verifiable quotes", which is itself information).
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
