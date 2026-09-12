/**
 * POST /.netlify/functions/extract — tiny source-text fetcher (Phase 2, item ii).
 *
 * NOT a vector RAG system: no embeddings, no index, no tokenisation task.
 * Fetches one public HTML page server-side (browsers would hit CORS),
 * strips markup, keyword-scores paragraphs against the query, and returns
 * the top passages with a little surrounding context. The cabinet injects
 * them into the turn prompt; the model quotes or paraphrases with the
 * footnote number supplied by the caller.
 *
 * Limits: HTML only (PDFs/archives return { passages: [] }); ~1200 chars
 * total; failures always resolve to empty passages so the turn proceeds
 * ungrounded. No key needed — public pages only.
 * Undo: delete this file + lib/extract.ts + the `grounding` setting.
 */

const MAX_CHARS = 1200;
const FETCH_TIMEOUT_MS = 15000;
const SKIP_HOSTS = ['archive.org'];
const SKIP_EXTENSIONS = ['.pdf', '.epub', '.mobi', '.zip', '.prc', '.tex'];

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

function normalise(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function queryTerms(text, extraStop) {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'how', 'should', 'does', 'are', 'was', 'were', 'been', 'have', 'has', 'will', 'would', 'could', 'their', 'there', 'which', 'when', 'whom', 'about', 'one', 'two', 'new', 'use', 'used', 'using', 'make', 'made', 'many', 'much', 'more', 'most', 'such', 'only', 'also', 'than', 'then', 'into', 'over', 'under', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'other', 'some', 'any', 'all', 'both', 'each', 'few', 'own', 'same', 'yet', 'however', 'therefore', 'thus', 'hence', 'upon', 'within', 'without', 'being', 'they', 'them', 'its', 'our', 'your', ...(extraStop || [])]);
  return [...new Set(normalise(text).split(' ').filter((t) => t.length > 3 && !stop.has(t)))];
}

function htmlToParagraphs(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .split('\n')
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 80)
    // Edition boilerplate (translator credits, correction notes, contents
    // listings) scores well on keywords but proves nothing — drop it so the
    // receipts never look like evidence when they aren't.
    .filter((p) => !/translat|corrected by|proofread|edition of \d+|first (english|german|french) edition|progress publishers|contents|table of contents|all rights reserved|^\s*(chapter|section|part|appendix|preface|foreword|index)\b.{0,60}$/i.test(p));
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: { message: 'POST only.', code: 'method' } });
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: { message: 'Invalid JSON body.', code: 'bad_request' } });
  }
  const { url, query, question } = body;
  if (typeof url !== 'string' || typeof query !== 'string' || !url.startsWith('http')) {
    return json(400, { error: { message: 'url and query are required.', code: 'bad_request' } });
  }
  const lower = url.toLowerCase();
  if (SKIP_HOSTS.some((h) => lower.includes(h)) || SKIP_EXTENSIONS.some((ext) => lower.split('?')[0].endsWith(ext))) {
    return json(200, { passages: [], reason: 'unsupported-source' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DialecticalCabinet/1.0 (source grounding; contact via repo)' },
      signal: controller.signal,
    });
    if (!response.ok) return json(200, { passages: [], reason: 'fetch-failed' });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('html') && !contentType.includes('text')) return json(200, { passages: [], reason: 'unsupported-source' });
    html = await response.text();
  } catch {
    return json(200, { passages: [], reason: 'fetch-failed' });
  } finally {
    clearTimeout(timer);
  }

  const paragraphs = htmlToParagraphs(html);
  // The QUESTION carries the ideas; the previous turn is context only. Terms
  // from the question score double, and rare-across-the-page terms outrank
  // common ones (TF-IDF-lite) so atmospheric prose can't win on glue words.
  const focusTerms = queryTerms(typeof question === 'string' ? question : query);
  const contextTerms = queryTerms(query).filter((t) => !focusTerms.includes(t));
  const allTerms = [...focusTerms, ...contextTerms];
  if (!allTerms.length || !paragraphs.length) return json(200, { passages: [], reason: 'no-match' });
  const docFreq = new Map();
  const norms = paragraphs.map((text) => normalise(text));
  for (const term of allTerms) {
    let count = 0;
    for (const norm of norms) if (norm.includes(term)) count += 1;
    docFreq.set(term, count);
  }
  const idf = (term) => 1 + Math.log(paragraphs.length / (1 + (docFreq.get(term) || 0)));

  const scored = paragraphs
    .map((text, i) => {
      const norm = norms[i];
      const focusHits = focusTerms.filter((t) => norm.includes(t));
      const contextHits = contextTerms.filter((t) => norm.includes(t));
      // Require at least TWO distinct question-idea terms: the passage must be
      // about the question, not merely adjacent to the previous turn. No
      // fallback — an honest empty beats junk dressed as evidence.
      if (focusHits.length < 2) return null;
      const score =
        focusHits.reduce((s, t) => s + (norm.split(t).length - 1) * idf(t) * 2, 0) +
        contextHits.reduce((s, t) => s + (norm.split(t).length - 1) * idf(t), 0);
      return { text, i, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // Attach one neighbour of context around each hit, in document order.
  const picked = new Set();
  const passages = [];
  let chars = 0;
  for (const hit of scored.sort((a, b) => a.i - b.i)) {
    for (const j of [hit.i - 1, hit.i, hit.i + 1]) {
      if (j < 0 || j >= paragraphs.length || picked.has(j)) continue;
      picked.add(j);
      const text = paragraphs[j];
      if (chars + text.length > MAX_CHARS) break;
      chars += text.length;
      passages.push({ text });
    }
  }
  return json(200, { passages, reason: passages.length ? null : 'no-match' });
}
