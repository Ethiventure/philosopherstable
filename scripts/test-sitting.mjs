/**
 * test-sitting: single opening-turn probe against one pipe (Sep 2026).
 * A cheap gate before burning a full sitting: real turn instruction, real
 * JSON contract, real parse + volatility checks, real token/cost capture.
 *
 *   npm run test:sitting -- --provider groq --level low
 *   npm run test:sitting -- --provider alibaba --model qwen3.8-27b --level medium --city Nairobi
 *   npm run test:sitting -- --provider deepinfra --level low --kind reconstruction
 *   npm run test:sitting -- --provider alibaba --level medium --ground karl-marx
 *
 * --kind critique|reconstruction reuses a fixed stub PREV to load the
 * heavier contracts (FollowBench-style load bench: same pipe, more
 * instructions). It gates obedience under load, never voice — no survey,
 * no rotation, stand-in persona throughout.
 * --ground <author-slug> searches the shipped shard with the repo's own
 * scorer and rides the top-2 passages in a grounding block mirroring the
 * app shape, then counts verbatim loans in the reply: the grounded-vs-
 * plain loan delta is the objective grounding-effectiveness metric
 * (RAGAS faithfulness proxy, no judge). Needs no key beyond the pipe's.
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
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTestEnv } from './test-env.mjs';
import { resolvePipe, postChat } from './test-providers.mjs';
import {
  PROMPT_VERSION, WORD_BUDGETS, MAX_OUTPUT_TOKENS, buildTurnInstruction,
  buildClosingScan, LOW_CLOSING_REMINDER, STRUCTURED_OUTPUT_HINT, GLOSSARY_SHAPE,
} from '../src/lib/dialectic/prompts.ts';
import { prepareIndex, searchIndex } from '../src/lib/rag-search.ts';
import { joinShard } from '../src/lib/rag-shard.ts';
import { smartCut } from '../src/lib/rag-text.ts';
import { parseTurnOutput, detectVolatility, estimateCost } from '../src/lib/llm.ts';

loadTestEnv();

const QUESTION = 'Automation and robotics have replaced almost all human necessary work. How does this change the education system? What do we teach children?';

function args() {
  const out = { provider: '', model: '', level: 'low', city: 'Cairo', long: false, kind: 'opening', ground: '' };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    const a = raw[i];
    if (a === '--provider') out.provider = raw[++i] || '';
    else if (a === '--model') out.model = raw[++i] || '';
    else if (a === '--level') out.level = raw[++i] || 'low';
    else if (a === '--city') out.city = raw[++i] || 'Cairo';
    else if (a === '--long') out.long = true;
    else if (a === '--kind') out.kind = raw[++i] || 'opening';
    else if (a === '--ground') out.ground = raw[++i] || '';
    else if (a === '--help' || a === '-h') {
      console.log('usage: npm run test:sitting -- --provider <groq|openrouter|deepinfra|together|alibaba|zai> [--model ID] [--level low|medium|high] [--city NAME] [--long] [--kind opening|critique|reconstruction] [--ground author-slug]');
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
  if (!['opening', 'critique', 'reconstruction'].includes(out.kind)) {
    console.error(`bad --kind "${out.kind}" (want: opening, critique, reconstruction)`);
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

// Fixed stub PREV for load probes: on-question, self-contained, with a
// closable edge — never graded as voice, only as load to answer.
const STUB_PREV = `Marx, you say the school must forge agents of a new totality once machines do the heavy lifting. I grant the forge and deny the mold: your assembly recaptures every line of flight it claims to free. In Cairo, where silent looms run the night shift without a single hand, who decides what a child becomes when no wage waits? That is the live edge: an assembly that cannot name its decider is a school by another name.`;

/** Grounding block mirroring the app shape (top-2 passages, loan order). */
function groundAuthor(slug, level) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const shardPath = join(root, 'public', 'rag', `author-${slug}.json`);
  if (!existsSync(shardPath)) return { error: `no shard public/rag/author-${slug}.json` };
  const shard = JSON.parse(readFileSync(shardPath, 'utf8'));
  const passages = joinShard(shard);
  const index = prepareIndex(passages);
  const hits = searchIndex(index, QUESTION, { limit: 2 }).selected;
  if (!hits.length) return { error: `no passages retrieved for ${slug}` };
  const loanRule = level === 'low'
    ? 'Paraphrase the passages below in plain words — never lift, not even single rare words.'
    : level === 'high'
      ? 'Quote generously: at least four distinctive words/phrases (≤6 words each, single quotes only).'
      : 'Borrow visibly: at least two distinctive words/phrases (≤6 words each, single quotes only).';
  return {
    block: `SOURCE PASSAGES (your own indexed works — ${loanRule})\n${hits.map((h, i) => `[${i + 1}] ${smartCut(h.passage.text, 650)}`).join('\n')}`,
    works: hits.map((h) => h.passage.work_id || h.passage.id),
  };
}

export async function runProbe({ provider, model, level, city, long, kind = 'opening', ground = '' }) {
  const pipe = resolvePipe(provider);
  if (model) pipe.model = model;
  if (!pipe.key) return { skipped: true, reason: `no key (set the key env for ${provider})`, provider, model: pipe.model, level };
  const b = long ? WORD_BUDGETS.long : WORD_BUDGETS.normal;
  const pass = kind === 'opening' ? 1 : kind === 'critique' ? 2 : 3;
  const instruction = buildTurnInstruction({ kind, prevName: kind === 'opening' ? null : 'Marx', isFinalSeat: false, longForm: long, intensity: level, threadCity: city, pass });
  let grounding = null;
  if (ground) {
    grounding = groundAuthor(ground, level);
    if (grounding.error) return { skipped: true, reason: grounding.error, provider, model: pipe.model, level };
  }
  const userMessage = [
    `QUESTION (verbatim): ${QUESTION}`,
    '',
    instruction,
    ...(kind === 'opening' ? [] : ['', `IMMEDIATE PREDECESSOR'S FULL TEXT:\n${STUB_PREV}`]),
    ...(grounding ? ['', grounding.block] : []),
    ...(level === 'low' ? ['', LOW_CLOSING_REMINDER] : []),
    '',
    buildClosingScan(level),
    '',
    STRUCTURED_OUTPUT_HINT + (level === 'medium' ? ` ${GLOSSARY_SHAPE}` : ''),
  ].join('\n');
  // Stand-in system prompt (NOT the full persona — see header). Carries the
  // level contract only, so the probe gates pipes, never voices.
  const system = `You are a ${kind === 'opening' ? 'opening' : 'responding'} speaker in a dialectical seminar. Answer at ${level} register: ${level === 'low' ? 'plain everyday words, no specialist terms' : level === 'medium' ? 'keep important terms but explain each inside its sentence' : 'full authentic vocabulary'}.${grounding ? ' Borrow visibly from the SOURCE PASSAGES in the user message.' : ''}`;
  const maxTokens = long ? MAX_OUTPUT_TOKENS.long : MAX_OUTPUT_TOKENS.normal;
  // Attempt ladder mirrors each app client (Sep 2026): DeepInfra turns and
  // the OpenRouter paid pin try response_format:json_object first (without
  // it some hosts return 200 with empty content on long prompts), plain
  // retry on 400; OpenRouter steps reasoning none→low on mandatory-reasoning
  // 400s. First success wins; the route taken is reported.
  const jsonFirst = provider === 'deepinfra' || provider === 'openrouter';
  const attempts = [];
  if (jsonFirst) attempts.push({ json: true, extra: {}, via: 'json' });
  attempts.push({ json: false, extra: {}, via: 'plain' });
  if (provider === 'openrouter') {
    attempts.push({ json: true, extra: { reasoning: { effort: 'low' } }, via: 'json+thinking-low' });
    attempts.push({ json: false, extra: { reasoning: { effort: 'low' } }, via: 'plain+thinking-low' });
  }
  const started = Date.now();
  let res = null;
  let via = '';
  let cap = maxTokens;
  // Cap step-up (Sep 21 2026): thinking models can burn the whole turn cap
  // thinking (max-0902 needs >260, Z.ai needs ~120 for "ok") and return
  // 200-empty. On EMPTY, the ladder re-runs once at 4× caps (2000 ceiling)
  // before failing — a big-cap success proves the pipe, and the via trail
  // records that it needs room to think.
  for (let round = 0; round < 2; round += 1) {
    for (const a of attempts) {
      if (a.json === false && res && res.status !== 400) break; // plain is fallback for 400s only
      if (a.via.includes('thinking-low') && !(res && /reasoning.*mandatory|mandatory.*reasoning/i.test(res.detail || ''))) break;
      res = await postChat(pipe, system, userMessage, cap, a);
      via = round > 0 ? `${a.via}+stepup` : a.via;
      if (res.ok) break;
    }
    if (res.ok || !(res.error || '').startsWith('EMPTY')) break;
    cap = Math.min(cap * 4, 2000);
  }
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
  // Verbatim loans: single-quoted multi-word spans (same shape the grader
  // counts). Reported always; meaningful on grounded runs (floor Medium ≥2).
  const loans = parsed ? ((`${parsed.negation} ${parsed.reformulation}`).match(/'[^']* [^']*'/g) || []).length : null;
  const u = res.usage || {};
  const inTokens = Number(u.prompt_tokens ?? 0);
  const outTokens = Number(u.completion_tokens ?? 0);
  const cost = inTokens || outTokens
    ? estimateCost([{ provider, model: pipe.model, inTokens, outTokens }])
    : null;
  return {
    skipped: false, failed: false, provider, model: pipe.model, level, city, kind, grounded: grounding ? ground : null,
    promptVersion: PROMPT_VERSION, wallMs, via, parseError, volatile, words, loans,
    budget: kind === 'opening' ? b.opening : b.total, overBudget: words === null ? null : words > (kind === 'opening' ? b.opening : b.total),
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
    console.log(`OK: ${r.provider}/${r.model} @ ${r.level}/${r.kind}${r.grounded ? ` grounded:${r.grounded}` : ''} — ${r.words} words (budget ${r.budget}${r.overBudget ? ', OVER' : ''})${r.loans !== null && r.loans !== undefined ? `, ${r.loans} loans` : ''}${r.volatile ? `, VOLATILE: ${r.volatile}` : ''} — ${r.wallMs}ms, ${r.inTokens} in / ${r.outTokens} out${r.cost === null || r.cost === undefined ? '' : `, ~$${r.cost.toFixed(4)}`} — prompt ${r.promptVersion}`);
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    mkdirSync(join(root, 'data', 'test-runs'), { recursive: true });
    appendFileSync(join(root, 'data', 'test-runs', 'probes.jsonl'), `${JSON.stringify(r)}\n`);
    console.log('logged to data/test-runs/probes.jsonl (gitignored)');
  }
}
