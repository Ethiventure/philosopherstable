import { LlmError, REPAIR_SUFFIX, incrementRepair, parseTurnOutput, recordUsage, retryAfterMs, type TurnOutput } from '@/lib/llm';
import type { AlibabaModel } from '@/lib/settings';

/**
 * Alibaba Cloud Model Studio direct provider (visitor's own key).
 * DashScope OpenAI-compatible endpoint, international (Singapore) base so the
 * Singapore-pooled free quota applies. Same models as elsewhere, billed (or
 * free-quota'd) by Alibaba — enable Stop-on-Exhaust on the key's quota page
 * and overruns 403 instead of charging.
 *
 * Free-quota note (owner account Sep 2026): 1M tokens per model, expiring
 * Dec 2026 — trial goldmine, not a long-term dependency.
 */
const ALIBABA_BASE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const ALIBABA_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface AlibabaTurnArgs {
  apiKey: string;
  model: AlibabaModel;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function alibabaError(status: number, detail: string, model: string): LlmError {
  if (status === 401 || status === 403) {
    // 403 doubles as quota-exhausted (AllocationQuota.FreeTierOnly) when
    // Stop-on-Exhaust is on — read the detail before blaming the key.
    if (/quota|exhaust|free.?tier|insufficient|balance|arrear/i.test(detail)) {
      return new LlmError(
        `Alibaba free quota exhausted on ${model} (403). The trial budget is spent — switch model or provider, or top up at Model Studio billing.` +
          (detail ? ` Detail: ${detail}` : ''),
        true,
        'quota',
      );
    }
    return new LlmError(
      'Alibaba rejected the API key. Check it in Settings → Key (Model Studio → API keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (/quota|rate.?limit|exhausted|too many requests|tokens per|limit exceeded|daily limit/i.test(detail) || status === 429) {
    return new LlmError(
      `Alibaba rate limit on ${model}. Wait a minute and Resume the cabinet.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 404) {
    return new LlmError(
      `Alibaba has no such model (${model}) — IDs vary by region. Check the Model Studio list and type the exact code.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new LlmError(`Alibaba server error on ${model} (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new LlmError(
    `Alibaba request failed on ${model} (${status}).${detail ? ` Detail: ${detail}` : ''}`,
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

interface AlibabaTextArgs {
  apiKey: string;
  model: AlibabaModel;
  systemPrompt: string;
  userMessage: string;
}

const postAlibaba = async (apiKey: string, model: AlibabaModel, maxTokens: number, systemPrompt: string, msg: string): Promise<string> => {
  let lastError: LlmError | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${ALIBABA_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: msg },
          ],
          max_tokens: maxTokens,
          // Qwen thinks by default and bills it as output (~3.5k hidden tokens
          // behind a 130-token turn, Sep 2026 measurement) — the 5-minute
          // starts. Off per request; owner call is that unthinking answers
          // also read truer to voice.
          enable_thinking: false,
        }),
        signal: AbortSignal.timeout(90000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        lastError = new LlmError(`Alibaba timed out on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
        continue;
      }
      throw new LlmError('Network error reaching Alibaba. Check the connection and Resume the cabinet.', true, 'network');
    }
    if (!response.ok) {
      const detail = await extractDetail(response);
      const error = alibabaError(response.status, detail, model);
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
      throw new LlmError(`Alibaba returned non-JSON on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
    }
    recordUsage('alibaba', model, data.usage);
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) {
      throw new LlmError(`Alibaba returned an empty response on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
    }
    return text;
  }
  throw lastError ?? new LlmError('Alibaba request failed. Resume the cabinet to retry the turn.', true, 'unknown');
};

export async function generateTurnAlibaba({ apiKey, model, systemPrompt, userMessage, longForm }: AlibabaTurnArgs): Promise<TurnOutput> {
  const maxTokens = longForm ? ALIBABA_MAX_TOKENS.long : ALIBABA_MAX_TOKENS.normal;
  const text = await postAlibaba(apiKey, model, maxTokens, systemPrompt, userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Alibaba');
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
    incrementRepair();
    return parseTurnOutput(stripFences(await postAlibaba(apiKey, model, maxTokens, systemPrompt, userMessage + REPAIR_SUFFIX)), 'Alibaba');
  }
}

/** Plain-text path for the Philosophers' Service desk: same model, retries
 * and quota mapping, no JSON turn contract — the reply is the answer. */
export async function generateTextAlibaba({ apiKey, model, systemPrompt, userMessage }: AlibabaTextArgs): Promise<string> {
  return postAlibaba(apiKey, model, ALIBABA_MAX_TOKENS.normal, systemPrompt, userMessage);
}

/** Cheap key check: one tiny call on the given model. */
export async function testAlibabaKey(apiKey: string, model: AlibabaModel): Promise<void> {
  const response = await fetch(`${ALIBABA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      // 100 tokens, not 10: reasoning models burn tiny caps thinking and
      // return empty content (Sep 2026).
      max_tokens: 100,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw alibabaError(response.status, await extractDetail(response), model);
  }
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}
