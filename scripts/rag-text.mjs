/**
 * Node-side RAG text re-exports. Tokenizer/normalizer live in
 * src/lib/rag-text.ts (single source shared with the browser scorer);
 * chunking lives in rag-chunk.mjs (ingest-time only).
 */
export { normalizeText, tokenize, wordCount } from '../src/lib/rag-text.ts';
export { CHUNK_TARGET_WORDS, CHUNK_SOFT_MIN, CHUNK_SOFT_MAX, chunkParagraphs } from './rag-chunk.mjs';
