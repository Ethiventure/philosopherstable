import { LlmError, REPAIR_SUFFIX, incrementRepair, parseTurnOutput, recordUsage, retryAfterMs, type TurnOutput } from '@/lib/llm';
import type { ZaiModel } from '@/lib/settings';

/**
 * Z.ai (Zhipu GLM) direct provider (visitor's own key).
 * OpenAI-compatible endpoint, international base. GLM-4.7-Flash rides a
 * standing free tier ($0 in/out, no card — phone verification only), capped
 * at 1 concurrent request, so sittings run slow but free.
 *
 * Watch item (Sep 2026): GLM reasoning is architecturally always-on and
 * cannot be disabled, only throttled — no thinking flag is sent here, so
 * the output-token line is the judge. Burn risk stands until a live
 * session clears it.
 */
const ZAI_BASE = 'https://api.z.ai/api/paas/v4';
const ZAI_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface ZaiTurnArgs {
  apiKey: string;
  model: ZaiModel;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function zaiError(status: number, detail: string, model: string): LlmError {
  if (status === 401 || status === 403) {
    if (/quota|rate.?limit|exhausted|balance|insufficient|arrear/i.test(detail)) {
      return new LlmError(
        `Z.ai quota exhausted on ${model} (403). Free tier is 1 concurrent request — wait for the in-flight call, or check usage in the Z.ai console.` +
          (detail ? ` Detail: ${detail}` : ''),
        true,
        'quota',
      );
    }
    return new LlmError(
      'Z.ai rejected the API key. Check it in Settings → Key (Z.ai console → API keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (/quota|rate.?limit|exhausted|too many requests|tokens per|limit exceeded|daily limit|concurrent/i.test(detail) || status === 429) {
    return new LlmError(
      `Z.ai rate limit on ${model} (free tier allows 1 concurrent request). Wait a minute and Resume the cabinet.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 404) {
    return new LlmError(
      `Z.ai has no such model (${model}) — check the model list and type the exact ID.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new LlmError(`Z.ai server error on ${model} (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new LlmError(
    `Z.ai request failed on ${model} (${status}).${detail ? ` Detail: ${detail}` : ''}`,
    false,
    'unknown',
  );
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as { error?: { message?: string; code?: string }; message?: string };
    const err = data.error;
    return [err?.code, err?.message ?? data.message].filter(Boolean).join(': ') ?? '';
  } catch {
    try {
      return (await response.text()).slice(0, 300);
    } catch {
      return '';
    }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ZaiTextArgs {
  apiKey: string;
  model: ZaiModel;
  systemPrompt: string;
  userMessage: string;
}

const postZai = async (apiKey: string, model: ZaiModel, maxTokens: number, systemPrompt: string, msg: string): Promise<string> => {
  let lastError: LlmError | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${ZAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: msg },
          ],
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(90000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        lastError = new LlmError(`Z.ai timed out on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
        continue;
      }
      throw new LlmError('Network error reaching Z.ai. Check the connection and Resume the cabinet.', true, 'network');
    }
    if (!response.ok) {
      const detail = await extractDetail(response);
      const error = zaiError(response.status, detail, model);
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
      throw new LlmError(`Z.ai returned non-JSON on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
    }
    recordUsage('zai', model, data.usage);
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) {
      throw new LlmError(`Z.ai returned an empty response on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
    }
    return text;
  }
  throw lastError ?? new LlmError('Z.ai request failed. Resume the cabinet to retry the turn.', true, 'unknown');
};

export async function generateTurnZai({ apiKey, model, systemPrompt, userMessage, longForm }: ZaiTurnArgs): Promise<TurnOutput> {
  const maxTokens = longForm ? ZAI_MAX_TOKENS.long : ZAI_MAX_TOKENS.normal;
  const text = await postZai(apiKey, model, maxTokens, systemPrompt, userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Z.ai');
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
    incrementRepair();
    return parseTurnOutput(stripFences(await postZai(apiKey, model, maxTokens, systemPrompt, userMessage + REPAIR_SUFFIX)), 'Z.ai');
  }
}

/** Plain-text path for the Philosophers' Service desk: same model, retries
 * and quota mapping, no JSON turn contract — the reply is the answer. */
export async function generateTextZai({ apiKey, model, systemPrompt, userMessage }: ZaiTextArgs): Promise<string> {
  return postZai(apiKey, model, ZAI_MAX_TOKENS.normal, systemPrompt, userMessage);
}

/** Cheap key check: one tiny call on the given model. */
export async function testZaiKey(apiKey: string, model: ZaiModel): Promise<void> {
  const response = await fetch(`${ZAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      // 100 tokens, not 10: reasoning models (GLM always thinks) burn the
      // whole budget thinking and return empty content on tiny caps (Sep 2026).
      max_tokens: 100,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw zaiError(response.status, await extractDetail(response), model);
  }
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}
