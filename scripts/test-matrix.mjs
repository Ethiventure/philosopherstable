/**
 * test-matrix: loop the probe across keyed pipes × levels.
 *   npm run test:matrix -- --dry-run            # plan + cost hint, zero spend
 *   npm run test:matrix                         # low/opening on every keyed pipe
 *   npm run test:matrix -- --levels low,medium --city Nairobi
 *   npm run test:matrix -- --kind reconstruction    # load bench: heaviest contract
 *   npm run test:matrix -- --ground murray-bookchin # loan A/B: grounded loan rate per pipe
 *
 * Sequential (Z.ai free = 1 request at a time). Skips keyless pipes.
 * Per-probe lines append to data/test-runs/probes.jsonl (gitignored).
 * Prints one paste-ready models-tried.md row per probe at the end.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTestEnv } from './test-env.mjs';
import { PROVIDERS, resolvePipe } from './test-providers.mjs';
import { runProbe } from './test-sitting.mjs';

loadTestEnv();

const raw = process.argv.slice(2);
const dry = raw.includes('--dry-run');
const li = raw.indexOf('--levels');
const lv = (li === -1 ? 'low' : (raw[li + 1] ?? 'low')).split(',').map((s) => s.trim()).filter(Boolean);
const ci = raw.indexOf('--city');
const city = ci === -1 ? 'Cairo' : (raw[ci + 1] ?? 'Cairo');
const long = raw.includes('--long');
const ki = raw.indexOf('--kind');
const kind = ki === -1 ? 'opening' : (raw[ki + 1] ?? 'opening');
const gi = raw.indexOf('--ground');
const ground = gi === -1 ? '' : (raw[gi + 1] ?? '');
if (!['opening', 'critique', 'reconstruction'].includes(kind)) {
  console.error(`bad --kind "${kind}" (want opening, critique, reconstruction)`);
  process.exit(2);
}

for (const l of lv) {
  if (!['low', 'medium', 'high'].includes(l)) {
    console.error(`bad --levels value "${l}" (want low, medium, high)`);
    process.exit(2);
  }
}

const plan = [];
for (const name of Object.keys(PROVIDERS)) {
  const pipe = resolvePipe(name);
  for (const level of lv) plan.push({ provider: name, model: pipe.model, level, key: !!pipe.key });
}

if (dry) {
  console.log(`\nmatrix plan (city ${city}${long ? ', long form' : ''}, kind ${kind}${ground ? `, grounded:${ground}` : ''}, prompt from src):`);
  for (const p of plan) console.log(`  ${p.provider}/${p.model} @ ${p.level} — ${p.key ? 'would run (~1 probe call)' : 'SKIP (no key)'}`);
  console.log(`\n${plan.filter((p) => p.key).length}/${plan.length} probes would run. No spend made.\n`);
  process.exit(0);
}

const done = [];
for (const p of plan) {
  if (!p.key) {
    console.log(`SKIP: ${p.provider}/${p.model} @ ${p.level} — no key`);
    continue;
  }
  const r = await runProbe({ provider: p.provider, model: '', level: p.level, city, long, kind, ground });
  done.push(r);
  if (!r.skipped) {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    mkdirSync(join(root, 'data', 'test-runs'), { recursive: true });
    appendFileSync(join(root, 'data', 'test-runs', 'probes.jsonl'), `${JSON.stringify(r)}\n`);
  }
  if (r.skipped) console.log(`SKIP: ${p.provider} @ ${p.level} — ${r.reason}`);
  else if (r.failed) console.log(`FAIL: ${p.provider}/${r.model} @ ${p.level} — ${r.error}`);
  else if (r.parseError) console.log(`PARSE-FAIL: ${p.provider}/${r.model} @ ${p.level} — ${r.parseError}`);
  else console.log(`OK: ${p.provider}/${r.model} @ ${p.level}/${r.kind}${r.grounded ? ` grounded:${r.grounded}` : ''} — ${r.words} words (budget ${r.budget}${r.overBudget ? ', OVER' : ''})${r.loans !== null && r.loans !== undefined ? `, ${r.loans} loans` : ''}${r.volatile ? `, VOLATILE: ${r.volatile}` : ''} — ${r.wallMs}ms`);
}

console.log('\n paste-ready models-tried.md rows (human grade still yours):');
for (const r of done) {
  if (r.skipped || r.failed || r.parseError) continue;
  console.log(`| ${r.model} | ${r.provider} (probe ${r.kind}${r.grounded ? ` grounded:${r.grounded}` : ''}) | ${(r.wallMs / 1000).toFixed(0)}s wall, ${r.inTokens}/${r.outTokens} tok | ${r.volatile ? `VOLATILE ${r.volatile}` : 'contract held'} | ${r.words}w vs ${r.budget} budget${r.loans !== null && r.loans !== undefined ? `, ${r.loans} loans` : ''}, city ${r.city}, prompt ${r.promptVersion} | — | — | — |`);
}
console.log('\nYour moves after a matrix run: 1) paste the rows above into docs/models-tried.md  2) run one live sitting on the winner  3) grade 2-3 best/worst quotes by eye — the machine never writes verdicts.\n');
