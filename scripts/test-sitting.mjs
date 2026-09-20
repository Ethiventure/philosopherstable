/**
 * test-sitting: single opening-turn probe against one pipe (Sep 2026).
 * A cheap gate before burning a full sitting: real turn instruction, real
 * JSON contract, real parse + volatility checks, real token/cost capture.
 *
 *   npm run test:sitting -- --provider groq --level low
 *   npm run test:sitting -- --provider alibaba --model qwen3.8-27b --level medium --city Nairobi
 *
 * What it IS: pipe health + contract adherence for one opening turn, using
 * the repo's own builders (buildTurnInstruction, closing scans, JSON hint,
 * parseTurnOutput, detectVolatility, estimateCost) imported from src.
 * What it is NOT: the full persona (renderPersona's `@/` graph can't load
 * under plain node — extensionless imports), grounding shards, rotation, or
 * coda. The system prompt is a fixed lean stand-in, labelled as such in the
 * report. Full-sitting automation waits on extracting the App turn loop
 * into an importable module (ledger item). Until then this probe + the
 * in-app sitting + the export footer are the three legs.
 *
 * Writes one JSON line per run to data/test-runs/probes.jsonl (gitignored);
 * nothing is committed by this script. Keys never printed.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTestEnv } from './test-env.mjs';
import { resolvePipe, postChat } from './test-providers.mjs';
import {
  PROMPT_VERSION, WORD_BUDGETS, MAX_OUTPUT_TOKENS, buildTurnInstruction,
  buildClosingScan, LOW_CLOSING_REMINDER, STRUCTURED_OUTPUT_HINT, GLOSSARY_SHAPE,
} from '../src/lib/dialectic/prompts.ts';
import { parseTurnOutput, detectVolatility, estimateCost } from '../src/lib/llm.ts';

loadTestEnv();

const QUESTION = 'Automation and robotics have replaced almost all human necessary work. How does this change the education system? What do we teach children?';

function args() {
  const out = { provider: '', model: '', level: 'low', city: 'Cairo', long: false };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    const a = raw[i];
    if (a === '--provider') out.provider = raw[++i] || '';
    else if (a === '--model') out.model = raw[++i] || '';
    else if (a === '--level') out.level = raw[++i] || 'low';
    else if (a === '--city') out.city = raw[++i] || 'Cairo';
    else if (a === '--long') out.long = true;
    else if (a === '--help' || a === '-h') {
      console.log('usage: npm run test:sitting -- --provider <groq|openrouter|deepinfra|together|alibaba|zai> [--model ID] [--level low|medium|high] [--city NAME] [--long]');
      process.exit(0);
    }
  }
  if (!out.provider) {
    console.error('missing --provider (want: groq, openrouter, deepinfra, together, alibaba, zai)');
    process.exit(2);
  }
  if (!['low', 'medium', 'high'].includes(out.level)) {
    console.error(`bad --level "${out.level}" (want: low, medium, high)`);
    process.exit(2);
  }
  return out;
}

function stripFences(text) {
  const t = text.trim();
  if (!t.startsWith('```')) return t;
  const first = t.indexOf('\n');
  const last = t.lastIndexOf('```');
  if (first === -1 || last <= first) return t;
  return t.slice(first + 1, last).trim();
}

const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;

export async function runProbe({ provider, model, level, city, long }) {
  const pipe = resolvePipe(provider);
  if (model) pipe.model = model;
  if (!pipe.key) return { skipped: true, reason: `no key (set the key env for ${provider})`, provider, model: pipe.model, level };
  const b = long ? WORD_BUDGETS.long : WORD_BUDGETS.normal;
  const instruction = buildTurnInstruction({ kind: 'opening', prevName: null, isFinalSeat: false, longForm: long, intensity: level, threadCity: city, pass: 1 });
  const userMessage = [
    `QUESTION (verbatim): ${QUESTION}`,
    '',
    instruction,
    ...(level === 'low' ? ['', LOW_CLOSING_REMINDER] : []),
    '',
    buildClosingScan(level),
    '',
    STRUCTURED_OUTPUT_HINT + (level === 'medium' ? ` ${GLOSSARY_SHAPE}` : ''),
  ].join('\n');
  // Stand-in system prompt (NOT the full persona — see header). Carries the
  // level contract only, so the probe gates pipes, never voices.
  const system = `You are an opening speaker in a dialectical seminar. Answer at ${level} register: ${level === 'low' ? 'plain everyday words, no specialist terms' : level === 'medium' ? 'keep important terms but explain each inside its sentence' : 'full authentic vocabulary'}.`;
  const maxTokens = long ? MAX_OUTPUT_TOKENS.long : MAX_OUTPUT_TOKENS.normal;
  const started = Date.now();
  const res = await postChat(pipe, system, userMessage, maxTokens);
  const wallMs = Date.now() - started;
  if (!res.ok) return { skipped: false, failed: true, error: res.error, provider, model: pipe.model, level, promptVersion: PROMPT_VERSION, wallMs };
  let parsed = null;
  let parseError = null;
  try {
    parsed = parseTurnOutput(stripFences(res.text), `Probe/${provider}`);
  } catch (e) {
    parseError = String(e.message || e).slice(0, 200);
  }
  const words = parsed ? wordCount(`${parsed.negation} ${parsed.reformulation}`) : null;
  const volatile = parsed ? detectVolatility(parsed.negation, parsed.reformulation) : null;
  const u = res.usage || {};
  const inTokens = Number(u.prompt_tokens ?? 0);
  const outTokens = Number(u.completion_tokens ?? 0);
  const cost = inTokens || outTokens
    ? estimateCost([{ provider, model: pipe.model, inTokens, outTokens }])
    : null;
  return {
    skipped: false, failed: false, provider, model: pipe.model, level, city,
    promptVersion: PROMPT_VERSION, wallMs, parseError, volatile, words,
    budget: b.opening, overBudget: words === null ? null : words > b.opening,
    inTokens, outTokens, cost, at: new Date().toISOString(),
  };
}

const cli = process.argv[1] && process.argv[1].endsWith('test-sitting.mjs');
if (cli) {
  const a = args();
  const r = await runProbe(a);
  if (r.skipped) {
    console.log(`SKIP: ${r.provider}/${r.model} @ ${r.level} — ${r.reason}`);
  } else if (r.failed) {
    console.log(`FAIL: ${r.provider}/${r.model} @ ${r.level} — ${r.error} (${r.wallMs}ms, prompt ${r.promptVersion})`);
    process.exit(1);
  } else if (r.parseError) {
    console.log(`PARSE-FAIL: ${r.provider}/${r.model} @ ${r.level} — ${r.parseError} (${r.wallMs}ms, prompt ${r.promptVersion})`);
    process.exit(1);
  } else {
    console.log(`OK: ${r.provider}/${r.model} @ ${r.level} — ${r.words} words (budget ${r.budget}${r.overBudget ? ', OVER' : ''})${r.volatile ? `, VOLATILE: ${r.volatile}` : ''} — ${r.wallMs}ms, ${r.inTokens} in / ${r.outTokens} out${r.cost === null || r.cost === undefined ? '' : `, ~$${r.cost.toFixed(4)}`} — prompt ${r.promptVersion}`);
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    mkdirSync(join(root, 'data', 'test-runs'), { recursive: true });
    appendFileSync(join(root, 'data', 'test-runs', 'probes.jsonl'), `${JSON.stringify(r)}\n`);
    console.log('logged to data/test-runs/probes.jsonl (gitignored)');
  }
}
