import { LlmError, REPAIR_SUFFIX, incrementRepair, parseTurnOutput, recordUsage, retryAfterMs, type TurnOutput } from '@/lib/llm';
import type { GroqModel } from '@/lib/settings';

/**
 * Groq direct provider (visitor's own free key — free tier, no card).
 * OpenAI-compatible `chat/completions`. Same models as the shared proxy.
 *
 * Free tier, no card (30 RPM / ~1K RPD / 8K TPM, 1000 output TPM per the rate
 * table): the output-token gate counts REQUESTED max_tokens, so this stays
 * under 1000 or every call 429s on arrival.
 */
const GROQ_MAX_TOKENS = { normal: 800, long: 900 } as const;

interface GroqTurnArgs {
  apiKey: string;
  model: GroqModel;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function groqError(status: number, detail: string, model: string): LlmError {
  if (status === 401) {
    return new LlmError(
      'Groq rejected the API key (401). Check it in Settings → Key (console.groq.com → API Keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (/quota|rate.?limit|exhausted|too many requests|tokens per|limit exceeded|daily limit|spend/i.test(detail) || status === 429) {
    return new LlmError(
      `Groq rate limit on ${model}. Paid tiers are per-minute caps — wait a minute and Resume the cabinet.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 404) {
    return new LlmError(
      `Groq has no such model (${model}) — the catalog churns. Pick a current one in Settings → Key.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new LlmError(`Groq server error on ${model} (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new LlmError(
    `Groq request failed on ${model} (${status}).${detail ? ` Detail: ${detail}` : ''}`,
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

interface GroqTextArgs {
  apiKey: string;
  model: GroqModel;
  systemPrompt: string;
  userMessage: string;
}

const postGroq = async (apiKey: string, model: GroqModel, maxTokens: number, systemPrompt: string, msg: string): Promise<string> => {
    let lastError: LlmError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: msg },
            ],
            max_tokens: maxTokens,
            // Experimental Sep 2026: thinking burns output budget (proven on
            // Alibaba/Qwen where enable_thinking:false fixed pace 5min→sec).
            // Groq documents reasoning_effort on some models; harmless if a
            // host ignores it, live test decides. Revisit on 400s.
            reasoning_effort: 'low',
          }),
          signal: AbortSignal.timeout(60000),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          lastError = new LlmError(`Groq timed out on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
          continue;
        }
        throw new LlmError('Network error reaching Groq. Check the connection and Resume the cabinet.', true, 'network');
      }
      if (!response.ok) {
        const detail = await extractDetail(response);
        const error = groqError(response.status, detail, model);
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
        throw new LlmError(`Groq returned non-JSON on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
      }
      recordUsage('groq', model, data.usage);
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new LlmError(`Groq returned an empty response on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
      }
      return text;
    }
    throw lastError ?? new LlmError('Groq request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

export async function generateTurnGroq({ apiKey, model, systemPrompt, userMessage, longForm }: GroqTurnArgs): Promise<TurnOutput> {
  const maxTokens = longForm ? GROQ_MAX_TOKENS.long : GROQ_MAX_TOKENS.normal;
  const text = await postGroq(apiKey, model, maxTokens, systemPrompt, userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Groq');
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== 'parse') throw error;
    incrementRepair();
    return parseTurnOutput(stripFences(await postGroq(apiKey, model, maxTokens, systemPrompt, userMessage + REPAIR_SUFFIX)), 'Groq');
  }
}

/** Plain-text path for the Philosophers' Service desk: same models, retries
 * and quota mapping, no JSON turn contract — the reply is the answer. */
export async function generateTextGroq({ apiKey, model, systemPrompt, userMessage }: GroqTextArgs): Promise<string> {
  return postGroq(apiKey, model, GROQ_MAX_TOKENS.normal, systemPrompt, userMessage);
}

/** Cheap key check: one tiny call on the given model. */
export async function testGroqKey(apiKey: string, model: GroqModel): Promise<void> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    throw groqError(response.status, await extractDetail(response), model);
  }
}
