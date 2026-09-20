/**
 * Shared LLM plumbing for every provider client (shared, OpenRouter, Groq,
 * DeepInfra, Together). One error type with machine-readable codes, one turn
 * parser with layered salvage, one repair suffix, one retry-after parser.
 * Provider-specific code lives in each client's own module.
 */

export interface TurnOutput {
  negation: string;
  incorporation: string;
  reformulation: string;
  new_contribution: string;
  works_referenced: string[];
  /** Medium-only enforcement field: hard terms used + plain meanings.
   * Optional everywhere (old prompts never send it); required at Medium by
   * the App-level check, which retries once when hard terms stand without it.
   * Displayed nowhere — its job is forcing the definitions into existence so
   * the inline gloss follows (desk-scaffold evidence). */
  glossary: string;
}

export type LlmErrorCode = 'quota' | 'auth' | 'model' | 'network' | 'server' | 'parse' | 'unknown';

/** Provider-reported token usage, one entry per API call (retries included —
 *  true cost, not estimates). Recorded by every provider client from the
 *  response `usage` block; read out in the export provenance trail. */
export interface UsageEntry {
  provider: string;
  model: string;
  inTokens: number;
  outTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
}

const usageLog: UsageEntry[] = [];

export function recordUsage(provider: string, model: string, usage: unknown): void {
  if (typeof usage !== 'object' || usage === null) return;
  const u = usage as Record<string, unknown>;
  const inTokens = typeof u.prompt_tokens === 'number' ? u.prompt_tokens : 0;
  const outTokens = typeof u.completion_tokens === 'number' ? u.completion_tokens : 0;
  if (!inTokens && !outTokens) return;
  // Prompt-cache hits (OpenRouter reports prompt_tokens_details.cached_tokens):
  // the system prompt is persona-first and byte-stable per speaker, so repeat
  // turns should increasingly ride cache. Tracked to prove it.
  const details = u.prompt_tokens_details as Record<string, unknown> | undefined;
  const cached = details && typeof details.cached_tokens === 'number' ? details.cached_tokens : 0;
  // Authoritative thinking signal where hosts report it (OpenRouter always;
  // Groq classic Chat Completions; Reader unknown elsewhere — absence proves
  // nothing, presence proves thinking happened).
  const compDetails = u.completion_tokens_details as Record<string, unknown> | undefined;
  const reasoning = compDetails && typeof compDetails.reasoning_tokens === 'number' ? compDetails.reasoning_tokens : 0;
  usageLog.push({ provider, model, inTokens, outTokens, cachedTokens: cached, reasoningTokens: reasoning });
  if (typeof console !== 'undefined') console.info(`[usage] ${provider} ${model}: ${inTokens} in / ${outTokens} out${cached ? ` (${cached} cached)` : ''}${reasoning ? ` [${reasoning} reasoning]` : ''}`);
}

/** Session totals, per model. Resets with the sitting. */
export function usageTotals(): { entries: UsageEntry[]; inTokens: number; outTokens: number } {
  const inTokens = usageLog.reduce((a, e) => a + e.inTokens, 0);
  const outTokens = usageLog.reduce((a, e) => a + e.outTokens, 0);
  return { entries: [...usageLog], inTokens, outTokens };
}

export function resetUsage(): void {
  usageLog.length = 0;
  parseRepairs = 0;
  glossBounces = 0;
  echoRetries = 0;
}

/** Repair turns, split by cause so evals can tell malformed JSON apart from
 *  gloss bounces (Sep 2026: 12 silent gloss retries nearly doubled a session).
 *  Counted OUTSIDE the turn total so evals see them cleanly instead of
 *  silently inflated voice numbers. Every provider client increments before
 *  its repair parse. */
let parseRepairs = 0;
let glossBounces = 0;
let echoRetries = 0;

export function incrementRepair(kind: 'parse' | 'gloss' | 'echo' = 'parse'): void {
  if (kind === 'gloss') glossBounces += 1;
  else if (kind === 'echo') echoRetries += 1;
  else parseRepairs += 1;
}

export function repairTotals(): number {
  return parseRepairs + glossBounces + echoRetries;
}

/** Split counts for the export trail: malformed-JSON repairs, gloss bounces,
 * echo rewrites. */
export function repairBreakdown(): { parse: number; gloss: number; echo: number } {
  return { parse: parseRepairs, gloss: glossBounces, echo: echoRetries };
}

/**
 * Shared-passage detector (structural echo guard): true when `text` shares
 * any run of 8+ words with any prior text. Normalised (case, punctuation)
 * so reworded-twice still counts as shared. 8 words sits above the
 * five-word quotation allowance and below any honest coincidence — thread
 * cities, stock terms, and short grounding loans never trip it.
 */
export function sharesPassage(text: string, priors: string[], run = 8): boolean {
  return findSharedPassage(text, priors, run) !== null;
}

/**
 * First shared word-run between `text` and any prior, for grading display.
 * Same normalization as sharesPassage above; null when nothing shared.
 */
export function findSharedPassage(text: string, priors: string[], run = 8): string | null {
  const wordsOf = (s: string): string[] =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const grams = new Map<string, boolean>();
  for (const prior of priors) {
    const w = wordsOf(prior);
    for (let i = 0; i + run <= w.length; i += 1) grams.set(w.slice(i, i + run).join(' '), true);
  }
  if (!grams.size) return null;
  const w = wordsOf(text);
  for (let i = 0; i + run <= w.length; i += 1) {
    const g = w.slice(i, i + run).join(' ');
    if (grams.has(g)) return g;
  }
  return null;
}

/**
 * Volatility detector (mechanical word-salad / key-salad guard, Sep 2026).
 * Runs on parsed prose values only (never raw JSON — URLs and `"key":`
 * shapes would false-positive). Cheap checks, no deps:
 *  - key-salad: `word:word` runs like `greek:negation` (GLM High, Sep 20)
 *  - word-repeat: same word 6+ times running, or same sentence twice in-turn
 *  - low-diversity: unique/total words < 0.35 on 60+ word turns (salad/loop)
 * Returns the first reason found, else null. Callers throw a retryable
 * `parse` LlmError so every existing repair/retry path retries visibly
 * (snippet in panel, full text in console) with zero UI changes.
 */
export function detectVolatility(negation: string, reformulation: string): string | null {
  const prose = `${negation} ${reformulation}`;
  const words = prose.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  // Key-salad first (most specific): letter-runs joined by a colon, e.g.
  // `greek:negation`. URLs never reach here (parsed prose, not raw JSON).
  const salad = prose.match(/\b[a-z]{3,}:[a-z][a-z_-]{2,}\b/);
  if (salad) return `key-salad "${salad[0]}"`;
  // Same word 6+ times in a row ("the the the …" meltdowns).
  const run = prose.match(/\b(\w+)(?:\s+\1){5,}\b/i);
  if (run) return `word-repeat "${run[0].slice(0, 60)}"`;
  // Same sentence twice inside one turn (within-turn loop the closing scan missed).
  const sentences = prose.split(/(?<=[.?!])\s+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 20);
  if (new Set(sentences).size < sentences.length && sentences.length > 1) {
    const dup = sentences.find((s, i) => sentences.indexOf(s) !== i);
    if (dup) return `sentence-repeat "${dup.slice(0, 80)}"`;
  }
  // Salad/loop soup: vocabulary collapses on longer turns.
  if (words.length >= 60) {
    const unique = new Set(words).size;
    const ratio = unique / words.length;
    if (ratio < 0.35) return `low-diversity ${ratio.toFixed(2)} (${unique}/${words.length} unique)`;
  }
  return null;
}

/**
 * What a token cost when last checked — NOT live prices. Providers reprice
 * without notice, so every figure the export prints carries RATES_AS_OF and
 * the word "about". To refresh: verify against the provider's pricing page
 * and bump the date; never silently edit a number.
 */
export const RATES_AS_OF = 'Sep 19 2026';

interface RateRow { match: (provider: string, model: string) => boolean; perIn: number; perOut: number }

const RATE_TABLE: RateRow[] = [
  { match: (_p, m) => m.includes('deepseek-v4.1-flash'), perIn: 0.15, perOut: 0.60 },
  { match: (_p, m) => m.includes('deepseek') && m.includes('flash'), perIn: 0.09, perOut: 0.18 },
  { match: (p, m) => p.includes('groq') && m.includes('qwen3.8-27b'), perIn: 0.80, perOut: 4.00 },
  { match: (p, m) => p.includes('openrouter') && m.includes('qwen3.8-27b'), perIn: 0.30, perOut: 2.00 },
  { match: (_p, m) => m.includes('qwen3.8-27b'), perIn: 0.40, perOut: 3.00 },
  { match: (_p, m) => m.includes('qwen3.8-flash'), perIn: 0.15, perOut: 0.47 },
  { match: (_p, m) => m.includes('qwen3.5-9b'), perIn: 0.10, perOut: 0.15 },
  { match: (_p, m) => m.includes('glm-5.3-flash') || m.includes('glm-5-flash'), perIn: 0.075, perOut: 0.25 },
  { match: (_p, m) => m.includes('glm-4.7-flash') || m.includes('glm-4.5-flash'), perIn: 0, perOut: 0 },
  { match: (_p, m) => m.includes('qwen3-30b-a3b-instruct-2507'), perIn: 0.048, perOut: 0.19 },
  { match: (_p, m) => m.includes('qwen3-30b-a3b'), perIn: 0.12, perOut: 0.50 },
  { match: (_p, m) => m.includes('qwen3-14b'), perIn: 0.12, perOut: 0.24 },
  { match: (_p, m) => m.includes('qwen3.6-35b'), perIn: 0.10, perOut: 0.95 },
  { match: (_p, m) => m.includes('llama-3.3-70b'), perIn: 0.10, perOut: 0.32 },
];

/** Estimated session cost in USD, or null when any model has no known rate. */
export function estimateCost(entries: UsageEntry[]): number | null {
  let total = 0;
  for (const e of entries) {
    const row = RATE_TABLE.find((r) => r.match(e.provider.toLowerCase(), e.model.toLowerCase()));
    if (!row) return null;
    total += (e.inTokens / 1e6) * row.perIn + (e.outTokens / 1e6) * row.perOut;
  }
  return total;
}

export class LlmError extends Error {
  readonly retryable: boolean;
  readonly code: LlmErrorCode;
  constructor(message: string, retryable = false, code: LlmErrorCode = 'unknown') {
    super(message);
    this.name = 'LlmError';
    this.retryable = retryable;
    this.code = code;
  }
}

const TURN_KEYS = ['negation', 'reformulation', 'new_contribution'] as const;

/** Last-resort salvage for models that emit JSON structure with UNQUOTED
 * string values (`"negation": some prose…`). Requotes the values of known
 * keys only, so prose that merely mentions `"word":` can't corrupt anything.
 * Returns reparsed text or null. */
function requoteBareValues(text: string): string | null {
  try {
    const known = new Set<string>([...TURN_KEYS, 'works_referenced']);
    const keyRe = /"([^"\\]+)"\s*:/g;
    const keys: { key: string; valueStart: number; keyStart: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(text)) !== null) {
      if (known.has(m[1])) keys.push({ key: m[1], keyStart: m.index, valueStart: m.index + m[0].length });
    }
    if (!keys.length) return null;
    // Truncated responses have no closing brace: close the last value and the
    // object so partial content still parses (better a clipped turn than none).
    let src = text;
    if (src.lastIndexOf('}') < keys[keys.length - 1].valueStart) src += '"}';
    const objEnd = src.lastIndexOf('}');
    if (objEnd === -1) return null;
    // Rebuild the object from scratch: any leading prose is dropped.
    let out = '{';
    keys.forEach((k, i) => {
      const end = i + 1 < keys.length ? keys[i + 1].keyStart : objEnd;
      const raw = src.slice(k.valueStart, end).trim().replace(/,\s*$/, '');
      if (/^[[{"]/.test(raw) || /^(true|false|null|-?\d)/.test(raw)) {
        out += `"${k.key}": ${raw}`;
      } else if (!raw) {
        return;
      } else {
        out += `"${k.key}": ${JSON.stringify(raw)}`;
      }
      out += i + 1 < keys.length ? ',' : '';
    });
    out += '}';
    JSON.parse(out); // validate before returning
    return out;
  } catch {
    return null;
  }
}

export function parseTurnOutput(rawText: string, label = 'LLM'): TurnOutput {
  // Short single-line excerpt so halt panels stay readable when pasted back.
  function snippet(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat || '(empty)';
  }
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Salvage 1: some models wrap JSON in prose despite JSON mode.
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(rawText.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
    // Salvage 2: JSON structure with unquoted string values (common Llama slip).
    if (!parsed || typeof parsed !== 'object') {
      const fixed = requoteBareValues(rawText);
      if (fixed) {
        try {
          parsed = JSON.parse(fixed);
        } catch {
          parsed = null;
        }
      }
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    if (typeof console !== 'undefined') console.warn(`[${label}] unparseable turn text:`, rawText.slice(0, 2000));
    throw new LlmError(`${label} returned unparseable output. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
  }
  const record = parsed as Record<string, unknown>;
  // Forgiving aliases: close-miss key names get mapped to canonical keys
  // before the mandatory-key check (observed live: "reformation" for
  // "reformulation" — a halted sitting over one letter is the worse outcome).
  const KEY_ALIASES: Record<string, string> = {
    reformation: 'reformulation',
    reformuation: 'reformulation',
    refromulation: 'reformulation',
    reformulaton: 'reformulation',
    negotation: 'negation',
    negatiation: 'negation',
    newContribution: 'new_contribution',
    newcontribution: 'new_contribution',
  };
  for (const [alias, canon] of Object.entries(KEY_ALIASES)) {
    if (typeof record[canon] !== 'string' && typeof record[alias] === 'string') record[canon] = record[alias];
  };
  // Empty-key slip (observed live: {"": "I owe you this, Ernst…"}): content
  // filed under no key at all. Deal it to the first missing required key.
  if (typeof record[''] === 'string' && (record[''] as string).trim()) {
    const missing = (TURN_KEYS as readonly string[]).find((k) => typeof record[k] !== 'string' || !(record[k] as string).trim());
    if (missing) record[missing] = record[''];
  }
  // Truncation fallback: a turn cut off mid-JSON usually loses
  // new_contribution while reformulation survives. Derive the one-liner from
  // reformulation's first sentence rather than halting the sitting — the
  // survey gets a weaker line, which beats no line. Logged so evals see it.
  if ((typeof record.new_contribution !== 'string' || !record.new_contribution.trim()) && typeof record.reformulation === 'string' && record.reformulation.trim()) {
    const first = (record.reformulation as string).split(/(?<=[.?!])\s+/)[0].trim();
    if (first) {
      record.new_contribution = first;
      if (typeof console !== 'undefined') console.warn(`[${label}] new_contribution derived from reformulation (truncated turn?).`);
    }
  }
  for (const key of TURN_KEYS) {
    if (typeof record[key] !== 'string' || !(record[key] as string).trim()) {
      if (typeof console !== 'undefined') console.warn(`[${label}] turn missing key "${key}":`, rawText.slice(0, 2000));
      throw new LlmError(`${label} output was missing “${key}”. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
    }
  }
  // Incorporation is optional (folded into the other prose since the
  // incorporation-fold); everything else is mandatory.
  const incorporation = typeof record.incorporation === 'string' ? record.incorporation.trim() : '';
  const glossaryRaw = record.glossary;
  const glossary = typeof glossaryRaw === 'string'
    ? glossaryRaw.trim()
    : Array.isArray(glossaryRaw)
      ? glossaryRaw.filter((g): g is string => typeof g === 'string').join('\n')
      : '';
  const works = Array.isArray(record.works_referenced)
    ? (record.works_referenced as unknown[]).filter((w): w is string => typeof w === 'string')
    : [];
  // Safety net for dropped terminal punctuation (models trail off): the rule
  // lives in the prompt; this guarantees it mechanically.
  const terminate = (s: string): string => {
    const t = s.trim();
    return /[.?!…:;]$/.test(t) ? t : `${t}.`;
  };
  const out: TurnOutput = {
    negation: terminate(record.negation as string),
    incorporation: incorporation ? terminate(incorporation) : '',
    reformulation: terminate(record.reformulation as string),
    new_contribution: terminate(record.new_contribution as string),
    works_referenced: works,
    glossary,
  };
  // Volatility gate (mechanical, counted as a parse repair so the export
  // trail needs no shape change): salad turns retry visibly instead of
  // entering the transcript. Snippet in the panel, full text in console.
  const volatileReason = detectVolatility(out.negation, out.reformulation);
  if (volatileReason) {
    if (typeof console !== 'undefined') {
      console.warn(`[${label}] volatile turn (${volatileReason}):`, rawText.slice(0, 2000));
    }
    throw new LlmError(
      `${label} returned a garbled turn (${volatileReason}). Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`,
      true,
      'parse',
    );
  }
  return out;
}

/**
 * Providers that say "try again in Ns" (Groq does: `try again in 9.72s`).
 * Honor it, clamped, instead of a fixed sleep — our ~4.5K-token prompts mean
 * per-minute caps are the binding constraint, not daily quotas.
 */
export function retryAfterMs(detail: string, fallbackMs: number, capMs = 90000): number {
  const match = detail.match(/try again in ([\d.]+)\s*s/i);
  if (!match) return fallbackMs;
  const ms = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
  return Math.min(Math.max(ms, 0), capMs);
}

/** Appended to the user message for a single repair attempt after malformed JSON. */
export const REPAIR_SUFFIX =
  ' Your previous reply was not valid JSON. Reply again with JSON only: the complete four-key object, no prose outside it.';

/** Medium-only gloss repair: the turn used hard terms but sent no glossary.
 * One retry, same shape plus the fifth key. */
export const GLOSS_REPAIR_SUFFIX =
  ' Your turn used hard philosophical terms but the glossary key was missing or empty. Reply again with JSON only: the same turn, plus a fifth key "glossary" listing each hard term you used, one line each as term — plain meaning in your own words. Keep every other key.';

/** Echo repair: the turn shares whole passages with earlier sitting text.
 * One retry, rewritten wholly — not patched. */
export const ECHO_REPAIR_SUFFIX =
  ' Your turn shares whole passages with an earlier turn in this sitting. Reply again with JSON only: the same argument rewritten wholly in your own words — new example, new images, new demands, no clause over five words carried across. Keep every other key.';
