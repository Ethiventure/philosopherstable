/**
 * Shared loader for local test scripts (test-keys, test-sitting, test-matrix).
 * Reads `.env.test.local` (repo root, gitignored) + process env. Real env
 * wins. Keys are never printed by any script using this loader.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadTestEnv() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const path = join(root, '.env.test.local');
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
