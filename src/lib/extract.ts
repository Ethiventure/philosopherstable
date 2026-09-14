import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';
import type { StyleIntensity } from '@/types';

/**
 * Client for the extract function (Phase 2, item ii). Resolves the speaker's
 * best groundable HTML source, asks the server for its top keyword passages
 * for this turn's question, and formats them for prompt injection with the
 * manifest footnote number so the model can cite [n].
 *
 * Always fails soft (returns []): grounding is enhancement, never gate.
 * Delete this file + functions/extract.js + the `grounding` setting to undo.
 */

const SKIP_EXTENSIONS = ['.pdf', '.epub', '.mobi', '.zip', '.prc', '.tex'];
const SKIP_HOSTS = ['archive.org'];

/** Best groundable HTML source for the philosopher. Prefers ingested works,
 * then falls back to any live HTML page. Skips scans/binaries. The fallback
 * matters for entries without indexed text; the indexed path
 * (`rag-ground.ts`) is tried first by callers. */
export function groundableSource(philosopherName: string) {
  const works = CORPUS_SOURCES_DATA.filter(
    (s) =>
      s.author.toLowerCase().includes(philosopherName.toLowerCase()) &&
      typeof s.source_url === 'string',
  );
  const isHtml = (url: string) => {
    const lower = url.toLowerCase().split('?')[0];
    return (
      !SKIP_EXTENSIONS.some((ext) => lower.endsWith(ext)) &&
      !SKIP_HOSTS.some((h) => lower.includes(h))
    );
  };
  const html =
    works.find((s) => s.full_text_ingested && isHtml(s.source_url as string)) ??
    works.find((s) => isHtml(s.source_url as string));
  if (!html) return null;
  const index = CORPUS_SOURCES_DATA.indexOf(html);
  return { source: html, number: index + 1 };
}

export interface GroundedPassage {
  text: string;
}

export type ExtractReason =
  | 'unsupported-source'
  | 'fetch-failed'
  | 'no-match';

/** Top passages for this turn, with a machine-readable failure reason. */
export async function extractPassages(
  url: string,
  question: string,
  context = '',
): Promise<{ passages: GroundedPassage[]; reason: ExtractReason | null }> {
  const fail = (reason: ExtractReason) => ({ passages: [], reason });
  try {
    const response = await fetch('/.netlify/functions/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, question: question.slice(0, 500), query: context.slice(0, 500) }),
    });
    if (!response.ok) return fail('fetch-failed');
    const data = (await response.json()) as { passages?: GroundedPassage[]; reason?: string };
    const passages = Array.isArray(data.passages) ? data.passages : [];
    if (!passages.length) {
      return fail(
        data.reason === 'unsupported-source' || data.reason === 'fetch-failed'
          ? data.reason
          : 'no-match',
      );
    }
    return { passages, reason: null };
  } catch {
    return fail('fetch-failed');
  }
}

/** Prompt block, or '' when nothing grounded. Citations use the footnote number.
 * At Low the block orders paraphrase-only (never verbatim loans) so grounded
 * turns stay in plain words; default keeps the verbatim-borrow rule. */
export function formatGroundedBlock(title: string, number: number, passages: GroundedPassage[], intensity?: StyleIntensity): string {
  if (!passages.length) return '';
  const quoted = passages.map((p) => `> ${p.text}`).join('\n');
  if (intensity === 'low') {
    return [
      `SOURCE PASSAGES from '${title}' [${number}] — read these for ideas, then PARAPHRASE: describe what they say in your own plain everyday words and cite the use [${number}]. Never lift rare, distinctive, archaic, or specialist words verbatim — not even in single quotes (bare double quotes corrupt your reply). Plain description beats the passage's own terms; closely paraphrase everything, always citing [${number}]:`,
      quoted,
    ].join('\n');
  }
  if (intensity === 'high') {
    return [
      `SOURCE PASSAGES from '${title}' [${number}] — quote generously: weave at least four distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from these passages into your own sentences, and cite each use [${number}]. Echo their filler words, diction tics, and rhythms. Prefer the passage's own terms over your stock summary of this thinker; what you don't quote, closely paraphrase, always citing [${number}]:`,
      quoted,
    ].join('\n');
  }
  return [
    `SOURCE PASSAGES from '${title}' [${number}] — borrow visibly: weave at least two distinctive single words or short phrases (no more than six words each, in single quotes — bare double quotes corrupt your reply) from these passages into your own sentences, and cite the use [${number}]. Prefer the passage's own terms over your stock summary of this thinker; what you don't borrow, closely paraphrase, always citing [${number}]:`,
    quoted,
  ].join('\n');
}
