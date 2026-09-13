import { LlmError, REPAIR_SUFFIX, parseTurnOutput, retryAfterMs, type TurnOutput } from '@/lib/llm';

/**
 * DeepInfra direct provider (visitor's own key).
 * OpenAI-compatible `chat/completions` at api.deepinfra.com/v1/openai.
 * Pinned model: meta-llama/Llama-3.3-70B-Instruct-Turbo (user-supplied ID —
 * verify at https://deepinfra.com/models if calls 404).
 * No response_format (unverified on this host): prompt-instructed JSON plus
 * salvage, same lesson as OpenRouter free.
 */

export const DEEPINFRA_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
const DEEPINFRA_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface DeepInfraTurnArgs {
  apiKey: string;
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
      `DeepInfra has no such model (${DEEPINFRA_MODEL}) — verify the ID at deepinfra.com/models.` +
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
  systemPrompt: string;
  maxTokens: number;
  useJsonMode: boolean;
}

const postDeepInfra = async ({ apiKey, systemPrompt, maxTokens, useJsonMode }: DeepInfraPostArgs, msg: string): Promise<string> => {
    // Constrained decoding first (turns only): response_format forces
    // syntactically valid JSON. If the server rejects the parameter (400),
    // fall back to plain requests. Plain-text callers pass useJsonMode false.
    const jsonMode = { current: useJsonMode };
    const makeBody = (m: string) => ({
      model: DEEPINFRA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: m },
      ],
      max_tokens: maxTokens,
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
      let data: { choices?: { message?: { content?: string } }[] };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new LlmError('DeepInfra returned non-JSON. Resume the cabinet to retry the turn.', true, 'server');
      }
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new LlmError('DeepInfra returned an empty response. Resume the cabinet to retry the turn.', true, 'server');
      }
      return text;
    }
    throw lastError ?? new LlmError('DeepInfra request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

export async function generateTurnDeepInfra({ apiKey, systemPrompt, userMessage, longForm }: DeepInfraTurnArgs): Promise<TurnOutput> {
  const maxTokens = longForm ? DEEPINFRA_MAX_TOKENS.long : DEEPINFRA_MAX_TOKENS.normal;
  const post = (msg: string) => postDeepInfra({ apiKey, systemPrompt, maxTokens, useJsonMode: true }, msg);
  const text = await post(userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'DeepInfra');
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
    return parseTurnOutput(stripFences(await post(userMessage + REPAIR_SUFFIX)), 'DeepInfra');
  }
}

/** Plain-text path for the Philosophers' Service desk: same model, retries
 * and quota mapping, no JSON contract — the reply is the answer. */
export async function generateTextDeepInfra({ apiKey, systemPrompt, userMessage }: { apiKey: string; systemPrompt: string; userMessage: string }): Promise<string> {
  return postDeepInfra({ apiKey, systemPrompt, maxTokens: DEEPINFRA_MAX_TOKENS.normal, useJsonMode: false }, userMessage);
}

/** Cheap key check: one tiny call. */
export async function testDeepInfraKey(apiKey: string): Promise<void> {
  const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: DEEPINFRA_MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 10,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw deepInfraError(response.status, await extractDetail(response));
  }
}
