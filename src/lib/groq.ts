import { GeminiError, REPAIR_SUFFIX, parseTurnOutput, retryAfterMs, type TurnOutput } from '@/lib/gemini';
import type { GroqModel } from '@/lib/settings';

/**
 * Groq direct provider (visitor's own free key — free tier, no card).
 * OpenAI-compatible `chat/completions`. Same models as the shared proxy.
 *
 * Free tier, no card (30 RPM / ~1K RPD / 8K TPM per the rate table): leave
 * output budget generous because reasoning models spend output tokens on
 * thinking before answering — a tight cap truncates the JSON mid-object,
 * which is the usual cause of "unparseable output" halts here.
 */
const GROQ_MAX_TOKENS = { normal: 4000, long: 8000 } as const;

interface GroqTurnArgs {
  apiKey: string;
  model: GroqModel;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function groqError(status: number, detail: string, model: string): GeminiError {
  if (status === 401) {
    return new GeminiError(
      'Groq rejected the API key (401). Check it in Settings → Key (console.groq.com → API Keys) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (/quota|rate.?limit|exhausted|too many requests|tokens per|limit exceeded|daily limit|spend/i.test(detail) || status === 429) {
    return new GeminiError(
      `Groq rate limit on ${model}. Paid tiers are per-minute caps — wait a minute and Resume the cabinet.` +
        (detail ? ` Detail: ${detail}` : ''),
      true,
      'quota',
    );
  }
  if (status === 404) {
    return new GeminiError(
      `Groq has no such model (${model}) — the catalog churns. Pick a current one in Settings → Key.` +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new GeminiError(`Groq server error on ${model} (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new GeminiError(
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

export async function generateTurnGroq({ apiKey, model, systemPrompt, userMessage, longForm }: GroqTurnArgs): Promise<TurnOutput> {
  const makeBody = (msg: string) => ({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: msg },
    ],
    max_tokens: longForm ? GROQ_MAX_TOKENS.long : GROQ_MAX_TOKENS.normal,
  });

  const post = async (msg: string): Promise<string> => {
    let lastError: GeminiError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(makeBody(msg)),
          signal: AbortSignal.timeout(60000),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          lastError = new GeminiError(`Groq timed out on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
          continue;
        }
        throw new GeminiError('Network error reaching Groq. Check the connection and Resume the cabinet.', true, 'network');
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
      let data: { choices?: { message?: { content?: string } }[] };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new GeminiError(`Groq returned non-JSON on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
      }
      const text = data.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) {
        throw new GeminiError(`Groq returned an empty response on ${model}. Resume the cabinet to retry the turn.`, true, 'server');
      }
      return text;
    }
    throw lastError ?? new GeminiError('Groq request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

  const text = await post(userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Groq');
  } catch (error) {
    if (!(error instanceof GeminiError) || error.code !== 'parse') throw error;
    return parseTurnOutput(stripFences(await post(userMessage + REPAIR_SUFFIX)), 'Groq');
  }
}

/** Cheap key check: one tiny call on the given model. */
export async function testGroqKey(apiKey: string, model: GroqModel): Promise<void> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 10,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw groqError(response.status, await extractDetail(response), model);
  }
}
