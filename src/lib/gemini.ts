import { MAX_OUTPUT_TOKENS } from '@/lib/dialectic/prompts';
import type { GeminiModel } from '@/lib/settings';

/**
 * Minimal Gemini client (Phase 2b). Plain `fetch`, no SDK.
 * Structured JSON output via `responseMimeType` + `responseSchema`,
 * one retry on 429/5xx, user-facing errors for bad keys and quota.
 */

export interface TurnOutput {
  negation: string;
  incorporation: string;
  reformulation: string;
  contradiction_passed: string;
  new_contribution: string;
  works_referenced: string[];
}

export class GeminiError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.name = 'GeminiError';
    this.retryable = retryable;
  }
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    negation: { type: 'STRING' },
    incorporation: { type: 'STRING' },
    reformulation: { type: 'STRING' },
    contradiction_passed: { type: 'STRING' },
    new_contribution: { type: 'STRING' },
    works_referenced: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['negation', 'incorporation', 'reformulation', 'contradiction_passed', 'new_contribution', 'works_referenced'],
  propertyOrdering: ['negation', 'incorporation', 'reformulation', 'contradiction_passed', 'new_contribution', 'works_referenced'],
} as const;

interface GenerateTurnArgs {
  apiKey: string;
  model: GeminiModel;
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function endpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function friendlyError(status: number, detail: string): GeminiError {
  if (status === 400 || status === 401 || status === 403) {
    return new GeminiError(
      'Gemini rejected the API key. Check it in Settings (Google AI Studio → Get API key) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
    );
  }
  if (status === 429) {
    return new GeminiError(
      'Gemini rate limit hit (429). Wait a minute and Resume the cabinet. Consider gemini-2.5-flash, which has the higher free quota.',
      true,
    );
  }
  if (status >= 500) {
    return new GeminiError(`Gemini server error (${status}). Resume the cabinet to retry the turn.`, true);
  }
  return new GeminiError(`Gemini request failed (${status}).${detail ? ` Detail: ${detail}` : ''}`);
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? '';
  } catch {
    return '';
  }
}

function parseTurnOutput(rawText: string): TurnOutput {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // One salvage attempt: some models wrap JSON in prose despite JSON mode.
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(rawText.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new GeminiError('Gemini returned unparseable output. Resume the cabinet to retry the turn.', true);
  }
  const record = parsed as Record<string, unknown>;
  for (const key of ['negation', 'incorporation', 'reformulation', 'contradiction_passed', 'new_contribution']) {
    if (typeof record[key] !== 'string' || !(record[key] as string).trim()) {
      throw new GeminiError(`Gemini output was missing “${key}”. Resume the cabinet to retry the turn.`, true);
    }
  }
  const works = Array.isArray(record.works_referenced)
    ? (record.works_referenced as unknown[]).filter((w): w is string => typeof w === 'string')
    : [];
  return {
    negation: (record.negation as string).trim(),
    incorporation: (record.incorporation as string).trim(),
    reformulation: (record.reformulation as string).trim(),
    contradiction_passed: (record.contradiction_passed as string).trim(),
    new_contribution: (record.new_contribution as string).trim(),
    works_referenced: works,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateTurn({ apiKey, model, systemPrompt, userMessage, longForm }: GenerateTurnArgs): Promise<TurnOutput> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: longForm ? MAX_OUTPUT_TOKENS.long : MAX_OUTPUT_TOKENS.normal,
    },
  };

  let lastError: GeminiError | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await sleep(1500);
    let response: Response;
    try {
      response = await fetch(endpoint(model, apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      lastError = new GeminiError('Network error reaching Gemini. Check the connection and Resume the cabinet.', true);
      continue;
    }
    if (!response.ok) {
      const detail = await extractDetail(response);
      const error = friendlyError(response.status, detail);
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        lastError = error;
        continue;
      }
      throw error;
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    if (!text.trim()) {
      throw new GeminiError('Gemini returned an empty response. Resume the cabinet to retry the turn.', true);
    }
    return parseTurnOutput(text);
  }
  throw lastError ?? new GeminiError('Gemini request failed. Resume the cabinet to retry the turn.', true);
}

/** Cheap key check: one tiny JSON call on flash regardless of chosen model. */
export async function testApiKey(apiKey: string): Promise<void> {
  const response = await fetch(endpoint('gemini-2.5-flash', apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: ok' }] }],
      generationConfig: { maxOutputTokens: 10 },
    }),
  });
  if (!response.ok) {
    throw friendlyError(response.status, await extractDetail(response));
  }
}
