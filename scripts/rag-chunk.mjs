/**
 * Heading/paragraph-aware chunking (ingest-time only).
 * Priority: keep paragraphs whole; keep short self-contained passages
 * (definitions, aphorisms); split long sections only on paragraph boundaries.
 */
import { wordCount } from '../src/lib/rag-text.ts';

export const CHUNK_TARGET_WORDS = 350;
export const CHUNK_SOFT_MIN = 120;
export const CHUNK_SOFT_MAX = 550;

export function chunkParagraphs(paragraphs) {
  const chunks = [];
  let current = [];
  let currentWords = 0;
  let paraStart = 0;

  const flush = (paraEnd) => {
    if (!current.length) return;
    const text = current.map((p) => p.text).join('\n\n');
    chunks.push({
      text,
      section_title: current[current.length - 1].heading,
      section_path: current[current.length - 1].path,
      paragraph_start: paraStart,
      paragraph_end: paraEnd,
      word_count: currentWords,
    });
    current = [];
    currentWords = 0;
  };

  paragraphs.forEach((para, i) => {
    const wc = wordCount(para.text);
    if (wc === 0) return;
    // Short, possibly self-contained passage (definition, aphorism under ~60
    // words): close whatever is open first so it can stand alone in its own
    // chunk. Threshold stays well below normal paragraph length so ordinary
    // ~100-word paragraphs flow into target-sized chunks instead.
    if (wc < 60 && currentWords >= CHUNK_SOFT_MIN) {
      flush(i - 1);
      paraStart = i;
    }
    if (currentWords + wc > CHUNK_SOFT_MAX && current.length > 0) {
      flush(i - 1);
      paraStart = i;
    }
    if (current.length === 0) paraStart = i;
    current.push(para);
    currentWords += wc;
    if (currentWords >= CHUNK_TARGET_WORDS) {
      flush(i);
      paraStart = i + 1;
    }
  });
  flush(paragraphs.length - 1);
  return chunks.filter((c) => c.word_count >= 20);
}
