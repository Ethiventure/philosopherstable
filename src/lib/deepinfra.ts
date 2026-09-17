import { LlmError, REPAIR_SUFFIX, incrementRepair, parseTurnOutput, recordUsage, retryAfterMs, type TurnOutput } from '@/lib/llm';

/**
 * DeepInfra direct provider (visitor's own key).
 * OpenAI-compatible `chat/completions` at api.deepinfra.com/v1/openai.
 * Visitor's chosen primary (DeepSeek V4 Flash 0731 or Qwen3.6-35B-A3B) speaks
 * first; if it fails on anything but auth/quota (same key, same credits — a
 * backup can't help those), Llama 3.3 70B Turbo takes the turn so the sitting
 * survives. `lastDeepInfraModel` records who
 * actually spoke for the export provenance trail. Turns try
 * `response_format: json_object` first, plain fallback on 400. NOTE: the Qwen
 * primary thinks by default — no thinking-dampening param is sent (unverified
 * server support); if Qwen turns arrive truncated, revisit.
 */
import type { DeepInfraModel, DeepInfraPrimary } from '@/lib/settings';

export const DEEPINFRA_MODEL: DeepInfraModel = 'deepseek-ai/DeepSeek-V4-Flash-0731';
export const DEEPINFRA_MODEL_QWEN: DeepInfraModel = 'Qwen/Qwen3.6-35B-A3B';
export const DEEPINFRA_MODEL_BACKUP: DeepInfraModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

/** Visitor's chosen first voice; the Llama backup rescues either. */
export function resolveDeepInfraPrimary(primary: DeepInfraPrimary): DeepInfraModel {
  return primary === 'qwen' ? DEEPINFRA_MODEL_QWEN : DEEPINFRA_MODEL;
}

/** Model that spoke last on this provider (turns and desk alike). */
export let lastDeepInfraModel: DeepInfraModel = DEEPINFRA_MODEL;
const DEEPINFRA_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface DeepInfraTurnArgs {
  apiKey: string;
  primary: DeepInfraPrimary;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function deepInfraError(status: number, detail: string): LlmError {
  if (status === 401 || status === 403) {
    if (/quota|rate.?limit|exhausted|credit|balance|limit exceeded|daily limit|spend/i.test(detail)) {
      return new LlmError(
        'DeepInfra quota/credits issue. Check usage at deepinfra.com/dash — free credit exhausts fast on 70B models.' +
          (detail ? ` Detail: ${detail}` : ''),
        true,
        'quota',
      );
    }
    return new LlmError(
      'DeepInfra rejected the API key. Check it in Settings → Key (deepinfra.com/dash/api_keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (status === 429) {
    return new LlmError('DeepInfra rate limit hit (429). Wait a minute and Resume the cabinet.', true, 'quota');
  }
  if (status === 404) {
    return new LlmError(
      `DeepInfra has no such model — verify the ID at deepinfra.com/models.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new LlmError(`DeepInfra server error (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new LlmError(
    `DeepInfra request failed (${status}).${detail ? ` Detail: ${detail}` : ''}`,
    false,
    'unknown',
  );
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as { error?: { message?: string }; message?: string };
    return data.error?.message ?? data.message ?? '';
  } catch {
    try {
      return (await response.text()).slice(0, 300);
    } catch {
      return '';
    }
  }
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface DeepInfraPostArgs {
  apiKey: string;
  model: DeepInfraModel;
  systemPrompt: string;
  maxTokens: number;
  useJsonMode: boolean;
}

const postDeepInfra = async ({ apiKey, model, systemPrompt, maxTokens, useJsonMode }: DeepInfraPostArgs, msg: string): Promise<string> => {
    // Constrained decoding first (turns only): response_format forces
    // syntactically valid JSON. If the server rejects the parameter (400),
    // fall back to plain requests. Plain-text callers pass useJsonMode false.
    const jsonMode = { current: useJsonMode };
    const makeBody = (m: string) => ({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: m },
      ],
      max_tokens: maxTokens,
      // Experimental Sep 2026: Qwen primaries think by default and burn the
      // budget (the 35B failure). Server support for this flag is unverified —
      // harmless if ignored, live retest decides. Revisit on 400s.
      reasoning_effort: 'low',
      ...(jsonMode.current ? { response_format: { type: 'json_object' } } : {}),
    });

    let lastError: LlmError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(makeBody(msg)),
          signal: AbortSignal.timeout(60000),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          lastError = new LlmError('DeepInfra timed out. Resume the cabinet to retry the turn.', true, 'server');
          continue;
        }
        throw new LlmError('Network error reaching DeepInfra. Check the connection and Resume the cabinet.', true, 'network');
      }
      if (!response.ok) {
        const detail = await extractDetail(response);
        if (response.status === 400 && jsonMode.current) {
          jsonMode.current = false;
          lastError = new LlmError('DeepInfra declined constrained decoding; retrying plain.', true, 'server');
          if (attempt < 2) {
            await sleep(1000);
            continue;
          }
        }
        const error = deepInfraError(response.status, detail);
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          lastError = error;
          await sleep(response.status === 429 ? retryAfterMs(detail, 15000) : 2000);
          continue;
        }
        throw error;
      }
      let data: { choices?: { message?: { content?: string } }[]; usage?: unknown };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new LlmError('DeepInfra returned non-JSON. Resume the cabinet to retry the turn.', true, 'server');
      }
      recordUsage('deepinfra', model, data.usage);
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new LlmError('DeepInfra returned an empty response. Resume the cabinet to retry the turn.', true, 'server');
      }
      return text;
    }
    throw lastError ?? new LlmError('DeepInfra request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

export async function generateTurnDeepInfra({ apiKey, primary, systemPrompt, userMessage, longForm }: DeepInfraTurnArgs): Promise<TurnOutput> {
  const first = resolveDeepInfraPrimary(primary);
  const maxTokens = longForm ? DEEPINFRA_MAX_TOKENS.long : DEEPINFRA_MAX_TOKENS.normal;
  const runFlow = async (model: DeepInfraModel): Promise<TurnOutput> => {
    const post = (msg: string) => postDeepInfra({ apiKey, model, systemPrompt, maxTokens, useJsonMode: true }, msg);
    const text = await post(userMessage);
    try {
      const out = parseTurnOutput(stripFences(text), 'DeepInfra');
      lastDeepInfraModel = model;
      return out;
    } catch (error) {
      if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
      incrementRepair();
      const repaired = parseTurnOutput(stripFences(await post(userMessage + REPAIR_SUFFIX)), 'DeepInfra');
      lastDeepInfraModel = model;
      return repaired;
    }
  };
  try {
    return await runFlow(first);
  } catch (error) {
    // Auth/quota belong to the key, not the model — a backup would fail
    // identically, so don't burn a second call. Anything else (server death,
    // retired ID, mangled JSON) is worth one Llama rescue before halting.
    if (error instanceof LlmError && (error.code === 'auth' || error.code === 'quota')) throw error;
    if (typeof console !== 'undefined') console.warn(`[DeepInfra] primary ${first} failed, trying backup ${DEEPINFRA_MODEL_BACKUP}:`, error instanceof Error ? error.message : error);
    try {
      return await runFlow(DEEPINFRA_MODEL_BACKUP);
    } catch (backupError) {
      if (typeof console !== 'undefined') console.error('[DeepInfra] backup also failed:', backupError instanceof Error ? backupError.message : backupError);
      throw backupError;
    }
  }
}

/** Plain-text path for the Philosophers' Service desk: same failover order,
 * no JSON contract — the reply is the answer. */
export async function generateTextDeepInfra({ apiKey, primary, systemPrompt, userMessage }: { apiKey: string; primary: DeepInfraPrimary; systemPrompt: string; userMessage: string }): Promise<string> {
  const first = resolveDeepInfraPrimary(primary);
  const post = (model: DeepInfraModel) => postDeepInfra({ apiKey, model, systemPrompt, maxTokens: DEEPINFRA_MAX_TOKENS.normal, useJsonMode: false }, userMessage);
  try {
    const text = await post(first);
    lastDeepInfraModel = first;
    return text;
  } catch (error) {
    if (error instanceof LlmError && (error.code === 'auth' || error.code === 'quota')) throw error;
    const text = await post(DEEPINFRA_MODEL_BACKUP);
    lastDeepInfraModel = DEEPINFRA_MODEL_BACKUP;
    return text;
  }
}

/** Cheap key check: one tiny call against the chosen primary. */
export async function testDeepInfraKey(apiKey: string, primary: DeepInfraPrimary = 'deepseek'): Promise<void> {
  const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: resolveDeepInfraPrimary(primary),
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 10,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw deepInfraError(response.status, await extractDetail(response));
  }
}
