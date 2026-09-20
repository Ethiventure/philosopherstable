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
import { loadTestEnv } from './test-env.mjs';
import { PROVIDERS, resolvePipe, postChat } from './test-providers.mjs';

loadTestEnv();

const rows = [];
for (const name of Object.keys(PROVIDERS)) {
  const pipe = resolvePipe(name);
  if (!pipe.key) {
    rows.push({ pipe: name, model: pipe.model, result: `SKIP (no key — set ${PROVIDERS[name].keyEnv})` });
    continue;
  }
  // Sequential: Z.ai free allows 1 request at a time. 100 tokens, not 10:
  // reasoning models burn tiny caps thinking and return empty (Sep 2026).
  const r = await postChat(pipe, null, 'Reply with exactly: ok', 100);
  rows.push({ pipe: name, model: pipe.model, result: r.ok ? `OK (${r.ms}ms)` : `${r.error} (${r.ms}ms)` });
}

const width = Math.max(...rows.map((r) => r.pipe.length));
console.log('\ntest-keys sweep (keys never printed):');
for (const r of rows) console.log(`  ${r.pipe.padEnd(width)}  ${r.model}  ->  ${r.result}`);
const tested = rows.filter((r) => !r.result.startsWith('SKIP')).length;
console.log(`\n${tested}/${rows.length} pipes tested, ${rows.length - tested} skipped (no key). Add keys to .env.test.local as needed.\n`);
