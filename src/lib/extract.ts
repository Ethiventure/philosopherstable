import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';

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

/** First full-text HTML source for the philosopher (skips scans/binaries). */
export function groundableSource(philosopherName: string) {
  const works = CORPUS_SOURCES_DATA.filter(
    (s) =>
      s.author.toLowerCase().includes(philosopherName.toLowerCase()) &&
      s.full_text_ingested &&
      typeof s.source_url === 'string',
  );
  const html = works.find((s) => {
    const lower = (s.source_url as string).toLowerCase().split('?')[0];
    return (
      !SKIP_EXTENSIONS.some((ext) => lower.endsWith(ext)) &&
      !SKIP_HOSTS.some((h) => lower.includes(h))
    );
  });
  if (!html) return null;
  const index = CORPUS_SOURCES_DATA.indexOf(html);
  return { source: html, number: index + 1 };
}

export interface GroundedPassage {
  text: string;
}

/** Top passages for this turn, or [] on any failure (proceed ungrounded). */
export async function extractPassages(url: string, query: string): Promise<GroundedPassage[]> {
  try {
    const response = await fetch('/.netlify/functions/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, query: query.slice(0, 500) }),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { passages?: GroundedPassage[] };
    return Array.isArray(data.passages) ? data.passages : [];
  } catch {
    return [];
  }
}

/** Prompt block, or '' when nothing grounded. Citations use the footnote number. */
export function formatGroundedBlock(title: string, number: number, passages: GroundedPassage[]): string {
  if (!passages.length) return '';
  const quoted = passages.map((p) => `> ${p.text}`).join('\n');
  return [
    `SOURCE PASSAGES from "${title}" [${number}] — quote them verbatim where you use them (copy the exact words inside "double quotes" so the claim stays checkable); otherwise closely paraphrase, always citing [${number}]:`,
    quoted,
  ].join('\n');
}
