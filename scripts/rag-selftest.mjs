/**
 * RAG self-tests: tokenizer parity, chunking smoke, scorer smoke.
 * Run: npm run test:rag  (node:test, no dependencies)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, tokenize, queryTerms, wordCount } from '../src/lib/rag-text.ts';
import { chunkParagraphs } from './rag-chunk.mjs';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';

describe('tokenizer', () => {
  it('lowercases and splits on non-alphanumerics', () => {
    assert.deepEqual(tokenize('Social Ecology!'), ['social', 'ecology']);
  });
  it('keeps hyphenates whole plus parts', () => {
    const toks = tokenize('self-management');
    assert.ok(toks.includes('self-management'));
    assert.ok(toks.includes('self') && toks.includes('management'));
  });
  it('queryTerms drops stopwords and dedupes', () => {
    assert.deepEqual(queryTerms('Why does the state do what the state does?'), ['state']);
  });
  it('wordCount counts whitespace runs', () => {
    assert.equal(wordCount('  two words '), 2);
    assert.equal(normalizeText('a\r\nb'), 'a\nb');
  });
});

describe('chunker', () => {
  const paras = (n, words, heading = 'H') =>
    Array.from({ length: n }, (_, i) => ({ text: `word `.repeat(words).trim() + ` end${i}`, heading, path: heading }));
  it('packs toward target without splitting paragraphs', () => {
    const chunks = chunkParagraphs(paras(10, 100));
    assert.ok(chunks.length >= 2 && chunks.length <= 4);
    assert.ok(chunks.every((c) => c.word_count <= 550));
  });
  it('lets short passages stand alone', () => {
    const short = { text: 'A short decisive definition stands here alone, with just enough words to count as evidence and hold its own chunk.', heading: 'H', path: 'H' };
    const chunks = chunkParagraphs([...paras(4, 100), short]);
    const last = chunks[chunks.length - 1];
    assert.ok(last.word_count < 120);
    assert.ok(last.text.includes('decisive definition'));
  });
  it('drops empties', () => {
    assert.deepEqual(chunkParagraphs([{ text: '   ', heading: null, path: null }]), []);
  });
});

describe('scorer', () => {
  const passages = [
    { id: 'w-0000', author: 'A U Thor', work_title: 'On Hierarchy', section_title: 'Domination', section_path: 'Domination', ordinal: 0, word_count: 30, text: 'Social hierarchy produces domination over nature through command.', source_url: 'https://example.test' },
    { id: 'w-0001', author: 'A U Thor', work_title: 'On Hierarchy', section_title: 'Cooking', section_path: 'Cooking', ordinal: 1, word_count: 30, text: 'Recipes for bread and soup with herbs from the garden wall.', source_url: 'https://example.test' },
  ];
  it('ranks the relevant passage first and abstains on nonsense', () => {
    const prepared = prepareIndex(passages);
    const hit = searchIndex(prepared, 'why does hierarchy dominate nature', {});
    assert.equal(hit.selected[0].passage.id, 'w-0000');
    assert.ok(hit.selected[0].finalScore > 0);
    const miss = searchIndex(prepared, 'quantum chromodynamics', {});
    assert.equal(miss.evidence, 'none');
    assert.deepEqual(miss.selected, []);
  });
  it('author filter excludes everyone else', () => {
    const prepared = prepareIndex(passages);
    const debug = searchIndex(prepared, 'hierarchy', { author: 'Nobody Here' });
    assert.equal(debug.evidence, 'none');
  });
});
