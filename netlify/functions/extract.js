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

function queryTerms(query) {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'how', 'should', 'does', 'are', 'was', 'were', 'been', 'have', 'has', 'will', 'would', 'could', 'their', 'there', 'which', 'when', 'whom', 'about']);
  return [...new Set(normalise(query).split(' ').filter((t) => t.length > 2 && !stop.has(t)))];
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
    .filter((p) => p.length > 80);
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
  const { url, query } = body;
  if (typeof url !== 'string' || typeof query !== 'string' || !url.startsWith('http')) {
    return json(400, { error: { message: 'url and query are required.', code: 'bad_request' } });
  }
  const lower = url.toLowerCase();
  if (SKIP_HOSTS.some((h) => lower.includes(h)) || SKIP_EXTENSIONS.some((ext) => lower.split('?')[0].endsWith(ext))) {
    return json(200, { passages: [] });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DialecticalCabinet/1.0 (source grounding; contact via repo)' },
      signal: controller.signal,
    });
    if (!response.ok) return json(200, { passages: [] });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('html') && !contentType.includes('text')) return json(200, { passages: [] });
    html = await response.text();
  } catch {
    return json(200, { passages: [] });
  } finally {
    clearTimeout(timer);
  }

  const paragraphs = htmlToParagraphs(html);
  const terms = queryTerms(query);
  if (!terms.length || !paragraphs.length) return json(200, { passages: [] });

  const scored = paragraphs
    .map((text, i) => {
      const norm = normalise(text);
      const score = terms.reduce((s, t) => s + norm.split(t).length - 1, 0);
      return { text, i, score };
    })
    .filter((p) => p.score > 0)
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
  return json(200, { passages });
}
