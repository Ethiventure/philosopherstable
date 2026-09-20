/**
 * test-keys: one-command live key check for every provider (Sep 2026).
 * You add keys as needed, the script tests only what has a key.
 *
 * Setup (once):
 *   cp scripts/test-keys.env.example .env.test.local   # gitignored, never commit
 *   # fill in whichever TEST_*_KEY lines you hold, then:
 *   npm run test:keys
 *
 * Rules:
 * - Reads `.env.test.local` (same folder as the repo root) + process env.
 *   Real env wins over the file. Keys are never printed, never committed.
 * - No key for a pipe = SKIP (not a failure). One tiny 10-token call per
 *   keyed pipe, sequential (Z.ai free allows 1 request at a time).
 * - Same endpoints + "Reply with exactly: ok" shape as each provider's
 *   in-app Test key button, so a pass here means the app's button passes.
 * - Exit 0 always on a completed sweep (even with skips/fails); exit 2
 *   only when the sweep itself could not run. Parse the RESULT column.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOTENV = join(ROOT, '.env.test.local');

// Minimal dotenv loader (stdlib only): KEY=value, ignores blanks + # comments,
// strips wrapping quotes. Real environment wins over the file.
function loadDotenv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k && !(k in process.env)) process.env[k] = v;
  }
}
loadDotenv(DOTENV);

const PIPES = [
  { name: 'openrouter', key: 'TEST_OPENROUTER_KEY', model: 'TEST_OPENROUTER_MODEL', defModel: 'deepseek/deepseek-v4.1-flash', url: 'https://openrouter.ai/api/v1/chat/completions', timeout: 60000, referer: true },
  { name: 'groq', key: 'TEST_GROQ_KEY', model: 'TEST_GROQ_MODEL', defModel: 'qwen/qwen3.8-27b', url: 'https://api.groq.com/openai/v1/chat/completions', timeout: 60000 },
  { name: 'deepinfra', key: 'TEST_DEEPINFRA_KEY', model: 'TEST_DEEPINFRA_MODEL', defModel: 'Qwen/Qwen3-30B-A3B', url: 'https://api.deepinfra.com/v1/openai/chat/completions', timeout: 60000 },
  { name: 'together', key: 'TEST_TOGETHER_KEY', model: 'TEST_TOGETHER_MODEL', defModel: 'Qwen/Qwen3-30B-A3B', url: 'https://api.together.xyz/v1/chat/completions', timeout: 60000 },
  { name: 'alibaba', key: 'TEST_ALIBABA_KEY', model: 'TEST_ALIBABA_MODEL', defModel: 'qwen3.8-27b', url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', timeout: 90000 },
  { name: 'zai', key: 'TEST_ZAI_KEY', model: 'TEST_ZAI_MODEL', defModel: 'glm-4.7-flash', url: 'https://api.z.ai/api/paas/v4/chat/completions', timeout: 90000 },
];

function classify(status, text) {
  const t = `${status} ${text}`.toLowerCase();
  if (status === 401) return 'BAD-KEY (401 — check the key value)';
  if (status === 404) return 'DEAD-MODEL (404 — ID retired, edit the TEST_*_MODEL value)';
  if (status === 402 || status === 429 || /quota|rate.?limit|credit|balance|concurrent|exhaust/i.test(t)) {
    return 'QUOTA (key works — cap, credits, or per-minute gate)';
  }
  if (status >= 500) return `SERVER (${status} — provider-side, retry later)`;
  return `FAIL (${status || 'no-status'} — ${(text || '').slice(0, 100)})`;
}

async function check(pipe) {
  const key = (process.env[pipe.key] || '').trim();
  const model = (process.env[pipe.model] || pipe.defModel).trim();
  if (!key) return { pipe: pipe.name, model, result: 'SKIP (no key — set ' + pipe.key + ')' };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
  if (pipe.referer) {
    headers['X-Title'] = 'The Dialectical Cabinet (test-keys)';
    headers['HTTP-Referer'] = 'https://philosopherstable.netlify.app/';
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), pipe.timeout);
  const started = Date.now();
  try {
    const res = await fetch(pipe.url, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with exactly: ok' }], max_tokens: 10 }),
    });
    const text = await res.text().catch(() => '');
    const ms = Date.now() - started;
    if (res.ok) return { pipe: pipe.name, model, result: `OK (${ms}ms)` };
    return { pipe: pipe.name, model, result: `${classify(res.status, text)} (${ms}ms)` };
  } catch (err) {
    const ms = Date.now() - started;
    return { pipe: pipe.name, model, result: `NETWORK (${err.name === 'AbortError' ? 'timeout' : String(err).slice(0, 80)}) (${ms}ms)` };
  } finally {
    clearTimeout(timer);
  }
}

const rows = [];
for (const pipe of PIPES) rows.push(await check(pipe)); // sequential: Z.ai free = 1 at a time

const width = Math.max(...rows.map((r) => r.pipe.length));
console.log('\ntest-keys sweep (keys never printed):');
for (const r of rows) console.log(`  ${r.pipe.padEnd(width)}  ${r.model}  ->  ${r.result}`);
const tested = rows.filter((r) => !r.result.startsWith('SKIP')).length;
console.log(`\n${tested}/${rows.length} pipes tested, ${rows.length - tested} skipped (no key). Add keys to .env.test.local as needed.\n`);
