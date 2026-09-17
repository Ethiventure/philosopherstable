import { LlmError, REPAIR_SUFFIX, incrementRepair, parseTurnOutput, recordUsage, retryAfterMs, type TurnOutput } from '@/lib/llm';

/**
 * Together direct provider (visitor's own key).
 * OpenAI-compatible `chat/completions` at api.together.xyz/v1.
 * Pinned model: Qwen/Qwen3-30B-A3B (user-supplied ID — verify at
 * https://api.together.ai/models if calls 404).
 * No response_format (unverified on this host): prompt-instructed JSON plus
 * salvage, same lesson as OpenRouter free.
 */

export const TOGETHER_MODEL = 'Qwen/Qwen3-30B-A3B';
const TOGETHER_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface TogetherTurnArgs {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function togetherError(status: number, detail: string): LlmError {
  if (status === 401) {
    return new LlmError(
      'Together rejected the API key (401). Check it in Settings → Key (api.together.ai/settings/api-keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (/quota|rate.?limit|exhausted|credit|balance|limit exceeded|daily limit|spend/i.test(detail) || status === 429 || status === 402) {
    return new LlmError(
      'Together quota/credits issue. New accounts historically include $5 free credit — check usage at api.together.xyz.' +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 403) {
    return new LlmError(
      'Together refused the request (403). Re-check the key in Settings → Key and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (status === 404) {
    return new LlmError(
      `Together has no such model (${TOGETHER_MODEL}) — verify the ID at api.together.ai/models.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new LlmError(`Together server error (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new LlmError(
    `Together request failed (${status}).${detail ? ` Detail: ${detail}` : ''}`,
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

const postTogether = async (apiKey: string, systemPrompt: string, maxTokens: number, msg: string): Promise<string> => {
    let lastError: LlmError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: TOGETHER_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: msg },
            ],
            max_tokens: maxTokens,
            // Experimental Sep 2026, as Groq/DeepInfra: throttle hidden
            // thinking if the host honours it; live test decides. Plus the
            // vLLM/SGLang thinking-switch pass-through (silent no-op if
            // dropped — token line is the tell).
            reasoning_effort: 'low',
            extra_body: { chat_template_kwargs: { enable_thinking: false } },
          }),
          signal: AbortSignal.timeout(60000),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          lastError = new LlmError('Together timed out. Resume the cabinet to retry the turn.', true, 'server');
          continue;
        }
        throw new LlmError('Network error reaching Together. Check the connection and Resume the cabinet.', true, 'network');
      }
      if (!response.ok) {
        const detail = await extractDetail(response);
        const error = togetherError(response.status, detail);
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          lastError = error;
          await sleep(response.status === 429 ? retryAfterMs(detail, 1500) : 2000);
          continue;
        }
        throw error;
      }
      let data: { choices?: { message?: { content?: string } }[]; usage?: unknown };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new LlmError('Together returned non-JSON. Resume the cabinet to retry the turn.', true, 'server');
      }
      recordUsage('together', TOGETHER_MODEL, data.usage);
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new LlmError('Together returned an empty response. Resume the cabinet to retry the turn.', true, 'server');
      }
      return text;
    }
    throw lastError ?? new LlmError('Together request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

export async function generateTurnTogether({ apiKey, systemPrompt, userMessage, longForm }: TogetherTurnArgs): Promise<TurnOutput> {
  const maxTokens = longForm ? TOGETHER_MAX_TOKENS.long : TOGETHER_MAX_TOKENS.normal;
  const text = await postTogether(apiKey, systemPrompt, maxTokens, userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Together');
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
    incrementRepair();
    return parseTurnOutput(stripFences(await postTogether(apiKey, systemPrompt, maxTokens, userMessage + REPAIR_SUFFIX)), 'Together');
  }
}

/** Plain-text path for the Philosophers' Service desk: same model, retries
 * and quota mapping, no JSON turn contract — the reply is the answer. */
export async function generateTextTogether({ apiKey, systemPrompt, userMessage }: { apiKey: string; systemPrompt: string; userMessage: string }): Promise<string> {
  return postTogether(apiKey, systemPrompt, TOGETHER_MAX_TOKENS.normal, userMessage);
}

/** Cheap key check: one tiny call. */
export async function testTogetherKey(apiKey: string): Promise<void> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 10,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw togetherError(response.status, await extractDetail(response));
  }
}
