import { LlmError, REPAIR_SUFFIX, parseTurnOutput, retryAfterMs, type TurnOutput } from '@/lib/llm';

/**
 * OpenRouter provider (Phase 2b-ii). Same cabinet contract as the Gemini
 * client, but requests go to OpenRouter's OpenAI-compatible endpoint and
 * cycle through free models: if one is rate-limited, down, retired, or can't
 * produce the required JSON, the next one takes over mid-session.
 *
 * Why a fixed ordered cycle with the router first: the router picks a random
 * model per call, which can shift voice across the 30 turns — but the named
 * bench alone goes stale in days (Sep 2026: zero Qwen/DeepSeek `:free` on the
 * live API, both families gone). Router-first means relisted family models
 * rejoin with no code change; last-good memory then holds one working model
 * for as long as it behaves. NOTE: the router can return any free model incl.
 * OpenAI `gpt-oss` (standing rule: no OpenAI models, ever); a future pass
 * could detect and skip router answers that identify as OpenAI.
 *
 * Removed Sep 2026 per owner: `qwen/qwen3-coder:free` (coder-tuned, wrong
 * shape for chatbot turns), `deepseek/deepseek-v4-flash:free` (404 since Jun
 * 2026 — dead IDs stay out, no first-try placeholders),
 * `qwen/qwen3-next-80b-a3b-instruct:free` (also gone from the live API).
 * Re-add a family pin only when the `/models` API lists it as live.
 *
 * Free-model IDs churn — check https://openrouter.ai/models?max_price=0 when
 * the whole cycle fails. Free-tier note: limits apply PER MODEL
 * (~20 RPM / ~200 RPD each), so cycling also spreads quota. Prompts sent to
 * free models may be logged by providers for training; the Settings panel
 * says so.
 */

// All IDs verified live via the /models API Sep 15 2026 (20 free total).
// Deliberately NOT in cycle: coder-tuned qwen3-coder, dead deepseek:free,
// content-safety filter model, and 4 untested new arrivals (dots-3,
// ling-flash-vl, nano-omni-reasoning, inkling ×2, glm-5.2 relisted) — see
// docs/models-tried.md pending list.
export const FREE_MODEL_CYCLE = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nex-agi/nex-n2.5-pro:free',
  'nex-agi/nex-n2.5-mini:free',
  'poolside/laguna-s-2.1:free',
  'poolside/laguna-xs-2.1:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'inclusionai/ling-3.0-flash-sante:free',
  'cohere/north-mini-code:free',
  'liquid/lfm-2.5-2.6b:free',
] as const;

const LASTGOOD_KEY = 'dialectical-cabinet:openrouter-lastgood:v1';

/**
 * Auto-rotating router: first in cycle (no family pins live), never persisted
 * as last-good (starting there would randomise every session).
 */
export const FREE_ROUTER_FALLBACK = 'openrouter/free';

function loadLastGood(): string | null {
  try {
    const raw = localStorage.getItem(LASTGOOD_KEY);
    if (raw && (FREE_MODEL_CYCLE as readonly string[]).includes(raw)) return raw;
  } catch {
    // ignore
  }
  return null;
}

function saveLastGood(model: string): void {
  // Never persist the router: starting there would randomise every session.
  if (model === FREE_ROUTER_FALLBACK) return;
  try {
    localStorage.setItem(LASTGOOD_KEY, model);
  } catch {
    // ignore
  }
}

function orderedCycle(): string[] {
  const lastGood = loadLastGood();
  const named = lastGood
    ? [lastGood, ...FREE_MODEL_CYCLE.filter((m) => m !== lastGood)]
    : [...FREE_MODEL_CYCLE];
  // Router already sits mid-list; append only if some edit removed it.
  return named.includes(FREE_ROUTER_FALLBACK) ? named : [...named, FREE_ROUTER_FALLBACK];
}

interface OpenRouterTurnArgs {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
  /** 'free' cycles the free list; 'paid' pins one model ID (key needs credits). */
  mode?: 'free' | 'paid';
  modelId?: string;
}

// Reasoning models spend output budget on thinking before answering (observed:
// content null, finish_reason=length, at a 300-token cap). Output is cheap or
// free here, so give thinking room — the word budget still governs length.
const OR_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

function isAvailabilityDetail(detail: string): boolean {
  return /only available|agentic harness|\bharness\b|not available|disabled|decommissioned|retired|unsupported|no longer|taken down|removed/i.test(detail);
}

function openRouterError(status: number, detail: string, model: string, tag = 'Free model'): LlmError {
  if (status === 401) {
    return new LlmError(
      'OpenRouter rejected the API key (401). Check it in Settings → Key (openrouter.ai → Keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  // Quota wording wins over status: Google/OpenRouter report exhausted free
  // tiers as 400/402/403/429 alike, and those messages often mention "key".
  if (/quota|rate.?limit|exhausted|credits?|balance|too many requests|limit exceeded|daily limit|spend/i.test(detail)) {
    return new LlmError(
      `OpenRouter quota/credits issue on ${model}. Free models are capped per day — the cycle will try the next one.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 403) {
    // 403 usually means THIS MODEL is off-limits to the key (harness-only,
    // region-gated, retired) — a property of the model, not the key — so the
    // cycle should move on rather than blame the key.
    if (isAvailabilityDetail(detail) || !/auth|token|credential|permission|forbidden/i.test(detail)) {
      return new LlmError(
        `${tag} ${model} refused this key (403) — restricted or retired. Trying the next one.` +
          (detail ? ` Detail: ${detail}` : ''),
        true,
        'model',
      );
    }
    return new LlmError(
      'OpenRouter refused the request (403). Re-check the key in Settings → Key and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (status === 400) {
    // Generic provider hiccup ("Provider returned error") — retryable, not a key verdict.
    // Happens on flaky free models; the next model usually works.
    if (/provider returned error|provider error/i.test(detail) || !detail.trim()) {
      return new LlmError(`${tag} ${model} had a provider error (400). Trying the next one.`, true, 'server');
    }
    return new LlmError(
      `OpenRouter request failed on ${model} (400).${detail ? ` Detail: ${detail}` : ''} Trying the next one.`,
      true,
      'server',
    );
  }
  if (status === 402) {
    return new LlmError(
      `OpenRouter needs credits for ${model} (402). Free models shouldn't bill — the cycle will try the next one.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 429) {
    return new LlmError(`OpenRouter rate limit on ${model} (429). Trying the next free model.`, true, 'quota');
  }
  if (status === 404) {
    return new LlmError(`${tag} ${model} is gone (404) — the list rotates. Trying the next one.`, true, 'model');
  }
  if (status >= 500) {
    return new LlmError(`OpenRouter/model error on ${model} (${status}). Trying the next free model.`, true, 'server');
  }
  return new LlmError(
    `OpenRouter request failed on ${model} (${status}).${detail ? ` Detail: ${detail}` : ''}`,
    false,
    'unknown',
  );
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    return data.error?.message ?? data.message ?? '';
  } catch {
    try {
      const text = await response.text();
      return text.slice(0, 400);
    } catch {
      return '';
    }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

async function fetchModelText(
  model: string,
  apiKey: string,
  body: Record<string, unknown>,
  tag = 'Free model',
  useJsonMode = false,
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'The Dialectical Cabinet',
      };
      try {
        headers['HTTP-Referer'] = window.location.origin;
      } catch {
        // non-browser context — referer is optional
      }
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, model, ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}) }),
        signal: AbortSignal.timeout(60000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        // Cold free models hang — fail over to the next one immediately
        // rather than stalling the cabinet for another minute.
        throw new LlmError(`${tag} ${model} timed out. Trying the next one.`, true, 'server');
      }
      throw new LlmError(
        'Network error reaching OpenRouter. Check the connection and Resume the cabinet.',
        true,
        'network',
      );
    }
    if (statusIsRetryableModel(response.status) && attempt === 0) {
      // Fail over fast by design — but a 429 names its window ("try again in
      // Ns"), so honor short ones before moving to the next free model.
      const detail = response.status === 429 ? await extractDetail(response.clone()) : '';
      await sleep(response.status === 429 ? retryAfterMs(detail, 2000, 30000) : 2000);
      continue;
    }
    if (!response.ok) {
      throw openRouterError(response.status, await extractDetail(response), model, tag);
    }
    let data: {
      choices?: {
        message?: { content?: string | { text?: string }[]; reasoning?: string; reasoning_details?: unknown[] };
        text?: string;
      }[];
      error?: { message?: string };
    };
    try {
      data = (await response.json()) as typeof data;
    } catch {
      throw new LlmError(`${tag} ${model} returned non-JSON. Trying the next one.`, true, 'server');
    }
    if (data.error?.message) {
      throw openRouterError(400, data.error.message, model, tag);
    }
    const choice = data.choices?.[0];
    // OpenRouter may put reasoning in separate fields; content is still the answer.
    const raw = choice?.message?.content ?? choice?.text ?? '';
    const text = Array.isArray(raw) ? raw.map((p) => (p as { text?: string }).text ?? '').join('') : (raw as string);
    if (!text.trim()) {
      // Capture a snippet for debugging — many free models return only reasoning when
      // they can't follow the JSON instruction.
      const snippet = JSON.stringify(choice ?? {}).slice(0, 300);
      throw new LlmError(
        `${tag} ${model} returned an empty response (no content). Snippet: ${snippet} — trying the next one.`,
        true,
        'server',
      );
    }
    return text;
  }
  throw new LlmError(`${tag} ${model} timed out twice. Trying the next one.`, true, 'server');
}

async function attemptModel(
  model: string,
  apiKey: string,
  body: Record<string, unknown>,
  tag = 'Free model',
  useJsonMode = false,
): Promise<TurnOutput> {
  const text = await fetchModelText(model, apiKey, body, tag, useJsonMode);
  try {
    return parseTurnOutput(stripFences(text), 'OpenRouter');
  } catch (error) {
    // Model can't do the required JSON — a property of the model, so cycle on.
    if (error instanceof LlmError) throw error;
    throw new LlmError(`${tag} ${model} broke the JSON shape. Trying the next one.`, true, 'parse');
  }
}

function statusIsRetryableModel(status: number): boolean {
  return status === 429 || status >= 500;
}

function isFailFast(error: unknown): boolean {
  return error instanceof LlmError && (error.code === 'auth' || (error.code === 'unknown' && !error.retryable));
}

export async function generateTurnOpenRouter({ apiKey, systemPrompt, userMessage, longForm, mode = 'free', modelId = '' }: OpenRouterTurnArgs): Promise<TurnOutput> {
  // Do NOT request json_object: most free models don't support it and will
  // return empty / 400. We instruct JSON via STRUCTURED_OUTPUT_HINT in the
  // user message (same as Gemini) and parse it ourselves.
  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: longForm ? OR_MAX_TOKENS.long : OR_MAX_TOKENS.normal,
    // Reasoning models otherwise burn the whole output budget thinking about
    // the JSON contract (observed: content null, finish_reason length) and
    // ramble past the word budgets. Low effort keeps thinking small; the
    // overall max_tokens above still caps the turn. NOTE: OpenRouter rejects
    // reasoning.effort + reasoning.max_tokens together (400) — effort only.
    reasoning: { effort: 'low' },
  };
  const paidId = mode === 'paid' ? modelId.trim() : '';
  if (paidId) {
    // Pinned paid model: constrained decoding first (DeepSeek-class hosts
    // honour response_format: json_object — the "PHILOSOPHER STRIKE DEMAND
    // REASONS" prose-instead-of-JSON failure dies mechanically), plain retry
    // on 400, then the usual parse-repair. Free cycle never sends
    // response_format (most free models 400/empty on it).
    const runPaid = async (json: boolean): Promise<TurnOutput> => {
      try {
        return await attemptModel(paidId, apiKey, body, 'Paid model', json);
      } catch (error) {
        if (isFailFast(error)) throw error;
        if (error instanceof LlmError && error.code === 'parse') {
          return attemptModel(paidId, apiKey, {
            ...body,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage + REPAIR_SUFFIX },
            ],
          }, 'Paid model', json);
        }
        throw error;
      }
    };
    try {
      return await runPaid(true);
    } catch (error) {
      if (error instanceof LlmError && error.code === 'server' && /\(400\)/.test(error.message)) {
        return runPaid(false);
      }
      if (isFailFast(error)) throw error;
      if (error instanceof LlmError && error.code === 'server') {
        return runPaid(true);
      }
      // Quota on a pinned model means the key's cap or credits, not a dead
      // model — say so plainly instead of the cycle's "trying the next one".
      if (error instanceof LlmError && error.code === 'quota') {
        throw new LlmError(
          `OpenRouter cap hit on ${paidId} — new credit can take minutes to apply, and keys carry their own daily cap (check it at openrouter.ai/keys). Otherwise add credits at openrouter.ai/settings/credits, wait for the reset, or switch back to Free cycle. Detail: ${error.message}`,
          true,
          'quota',
        );
      }
      throw error;
    }
  }
  const tried: string[] = [];
  let lastError: LlmError | null = null;
  for (const model of orderedCycle()) {
    tried.push(model);
    try {
      const output = await attemptModel(model, apiKey, body);
      saveLastGood(model);
      return output;
    } catch (error) {
      if (isFailFast(error)) throw error; // bad key etc. — cycling won't help
      lastError = error instanceof LlmError
        ? error
        : new LlmError('OpenRouter request failed. Resume the cabinet to retry the turn.', true, 'unknown');
    }
  }
  // Every model answered but none produced valid JSON: one repair attempt on
  // the first model before giving up, so a single bad turn doesn't halt.
  if (lastError?.code === 'parse' && tried.length > 0) {
    try {
      const repaired = await attemptModel(tried[0], apiKey, {
        ...body,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage + REPAIR_SUFFIX },
        ],
      });
      saveLastGood(tried[0]);
      return repaired;
    } catch (error) {
      if (isFailFast(error)) throw error;
      lastError = error instanceof LlmError ? error : lastError;
    }
  }
  throw new LlmError(
    `All ${tried.length} free models failed (${tried.join(', ')}). Free IDs rotate — check openrouter.ai/models?max_price=0, or switch back to Gemini direct in Settings → Key. Last error: ${lastError?.message ?? 'unknown'}`,
    true,
    lastError?.code === 'quota' ? 'quota' : 'server',
  );
}

/** Plain-text path for the Philosophers' Service desk: same free-model cycle
 * (or pinned paid model), same fail-fast mapping, no JSON turn contract —
 * the reply is the answer, so no repair pass is needed. */
export async function generateTextOpenRouter({ apiKey, systemPrompt, userMessage, mode = 'free', modelId = '' }: OpenRouterTurnArgs): Promise<string> {
  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: OR_MAX_TOKENS.normal,
    // Same low reasoning effort as turns: free reasoning models otherwise burn
    // the budget thinking instead of answering.
    reasoning: { effort: 'low' },
  };
  const paidId = mode === 'paid' ? modelId.trim() : '';
  if (paidId) {
    try {
      return await fetchModelText(paidId, apiKey, body, 'Paid model');
    } catch (error) {
      if (error instanceof LlmError && error.code === 'quota') {
        throw new LlmError(
          `OpenRouter cap hit on ${paidId} — new credit can take minutes to apply, and keys carry their own daily cap (check it at openrouter.ai/keys). Otherwise add credits at openrouter.ai/settings/credits, wait for the reset, or switch back to Free cycle. Detail: ${error.message}`,
          true,
          'quota',
        );
      }
      throw error;
    }
  }
  const tried: string[] = [];
  let lastError: LlmError | null = null;
  for (const model of orderedCycle()) {
    tried.push(model);
    try {
      const text = await fetchModelText(model, apiKey, body);
      saveLastGood(model);
      return text;
    } catch (error) {
      if (isFailFast(error)) throw error; // bad key etc. — cycling won't help
      lastError = error instanceof LlmError
        ? error
        : new LlmError('OpenRouter request failed. Resume the cabinet to retry the turn.', true, 'unknown');
    }
  }
  throw new LlmError(
    `All ${tried.length} free models failed (${tried.join(', ')}). Free IDs rotate — check openrouter.ai/models?max_price=0, or switch back to Gemini direct in Settings → Key. Last error: ${lastError?.message ?? 'unknown'}`,
    true,
    lastError?.code === 'quota' ? 'quota' : 'server',
  );
}

/** Cheap key check: paid mode tests the pinned model; free mode walks the
 * cycle until a model answers. Never blames the key for dead models — only
 * a 401 (or all-403) means the key itself is bad. */
export async function testOpenRouterKey(apiKey: string, mode: 'free' | 'paid' = 'free', modelId = ''): Promise<string> {
  const paidId = mode === 'paid' ? modelId.trim() : '';
  if (paidId) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'The Dialectical Cabinet',
      },
      body: JSON.stringify({
        model: paidId,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (response.status === 401) {
      throw openRouterError(401, await extractDetail(response), paidId);
    }
    if (!response.ok) {
      throw openRouterError(response.status, await extractDetail(response), paidId);
    }
    return paidId;
  }
  const tried: string[] = [];
  let saw403 = 0;
  for (const model of orderedCycle()) {
    tried.push(model);
    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Title': 'The Dialectical Cabinet',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(60000),
      });
    } catch {
      throw new LlmError('Network error reaching OpenRouter. Check the connection and try again.', true, 'network');
    }
    if (response.status === 401) {
      throw openRouterError(401, await extractDetail(response), model);
    }
    if (response.ok) {
      saveLastGood(model);
      return model;
    }
    if (response.status === 403) saw403 += 1;
    // 404/429/402/5xx/403-restricted: dead or capped model, not a key verdict.
    await extractDetail(response).catch(() => '');
  }
  if (saw403 === tried.length && tried.length > 0) {
    throw new LlmError(
      'Every free model refused this key (403). The key works but nothing free is accessible to it — check openrouter.ai/activity, or use Gemini direct instead.',
      false,
      'auth',
    );
  }
  throw new LlmError(
    `No free model answered (${tried.join(', ')}). The list rotates — check openrouter.ai/models?max_price=0.`,
    true,
    'server',
  );
}
