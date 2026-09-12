#!/usr/bin/env node
/**
 * Link checker for the corpus manifest.
 *   npm run check-links
 *
 * HEADs (GET fallback) every source_url in src/data/corpus-sources.ts.
 * - 2xx: ok (clears a stale link_note with --fix)
 * - 404/410/DNS/timeout: broken → inserts/updates the sarcastic link_note
 * - 403/429: bot-blocking, uncertain — reported, never auto-marked
 *
 * Never deletes references. Run after every manifest edit.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/corpus-sources.ts', import.meta.url);
const FIX = process.argv.includes('--fix');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const stamp = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()} check`;
};
const NOTE = (reason) => `Philosophers' assistant do your job and fix this link! (${reason}, ${stamp()})`;

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: controller.signal,
        redirect: 'follow',
      }).finally(() => clearTimeout(timer));
      if (method === 'GET') {
        try { await res.arrayBuffer().then((b) => b.slice(0, 1)); } catch { /* body unreadable, status stands */ }
        await res.body?.cancel().catch(() => {});
      }
      return { status: res.status };
    } catch (error) {
      if (error?.cause?.code === 'ENOTFOUND' || error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        return { status: 0, error: error?.cause?.code ?? error?.name ?? 'fetch failed' };
      }
      if (method === 'HEAD') continue;
      return { status: 0, error: String(error).slice(0, 80) };
    }
  }
  return { status: 0, error: 'fetch failed' };
}

const src = readFileSync(FILE, 'utf8');
const urlRe = /source_url: '([^']+)'/g;
const urls = [...src.matchAll(urlRe)].map((m) => ({ url: m[1], index: m.index }));

const broken = [];
const uncertain = [];
for (const url of new Set(urls.map((u) => u.url))) {
  const { status, error } = await check(url);
  const tag = status === 0 ? `ERR:${error}` : String(status);
  if ((status >= 200 && status < 400) || status === 405) {
    console.log(`ok        ${status}  ${url}`);
  } else if (status === 403 || status === 429) {
    uncertain.push({ url, status });
    console.log(`uncertain ${status}  ${url}`);
  } else {
    broken.push({ url, status: tag });
    console.log(`BROKEN    ${tag}  ${url}`);
  }
}

console.log(`\n${urls.length} urls: ${urls.length - broken.length - uncertain.length} ok, ${broken.length} broken, ${uncertain.length} uncertain`);

if (FIX && broken.length) {
  let out = src;
  for (const { url, status } of broken) {
    // Find the entry containing this URL: walk back to its title, forward to licence_status.
    const at = out.indexOf(`source_url: '${url}'`);
    if (at === -1) continue;
    const licAt = out.indexOf('licence_status:', at);
    if (licAt === -1) continue;
    const eol = out.indexOf('\n', out.indexOf(',', licAt)) + 1;
    const existing = /link_note: "Philosophers' assistant do your job and fix this link![^"]*"/.exec(
      out.slice(at, at + 2000),
    );
    if (existing) {
      out = out.slice(0, at) + out.slice(at).replace(existing[0], `link_note: "${NOTE(status)}"`);
    } else {
      out = out.slice(0, eol) + `    link_note: "${NOTE(status)}",\n` + out.slice(eol);
    }
  }
  writeFileSync(FILE, out);
  console.log('notes written. Run tsc + build to verify quoting.');
} else if (broken.length) {
  console.log('Re-run with --fix to write link notes.');
}
