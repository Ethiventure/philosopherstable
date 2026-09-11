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

export type GeminiErrorCode = 'quota' | 'auth' | 'model' | 'network' | 'server' | 'parse' | 'unknown';

export class GeminiError extends Error {
  readonly retryable: boolean;
  readonly code: GeminiErrorCode;
  constructor(message: string, retryable = false, code: GeminiErrorCode = 'unknown') {
    super(message);
    this.name = 'GeminiError';
    this.retryable = retryable;
    this.code = code;
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
    // Key problems and quota problems share these statuses; tell them apart
    // from Google's own wording so the UI can show the right recovery panel.
    if (/quota|rate.?limit|rate_limit|exhausted|resource_exhausted|too many requests|limit exceeded|daily limit|spend/i.test(detail)) {
      return new GeminiError(
        'Gemini free-tier quota reached. Google caps free use per day and per minute — the cabinet kept everything so far; resume later or switch to the Lite model.' +
          (detail ? ` Detail: ${detail}` : ''),
        true,
        'quota',
      );
    }
    return new GeminiError(
      'Gemini rejected the API key. Check it in Settings (Google AI Studio → Get API key) and try Test key again.' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'auth',
    );
  }
  if (status === 429) {
    return new GeminiError(
      'Gemini rate limit hit (429). Wait a minute and Resume the cabinet. A full session needs ~30 calls, so if this recurs, switch to gemini-3.5-flash-lite in Settings → Key — it has the most generous free quota.',
      true,
      'quota',
    );
  }
  if (status === 404) {
    return new GeminiError(
      'Gemini returned 404 for this model — it has been retired or is not enabled for your key. Open Settings → Key and pick a current model (gemini-3.6-flash is the safe default).' +
        (detail ? ` Detail: ${detail}` : ''),
      false,
      'model',
    );
  }
  if (status >= 500) {
    return new GeminiError(`Gemini server error (${status}). Resume the cabinet to retry the turn.`, true, 'server');
  }
  return new GeminiError(`Gemini request failed (${status}).${detail ? ` Detail: ${detail}` : ''}`, false, 'unknown');
}

async function extractDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? '';
  } catch {
    return '';
  }
}

export function parseTurnOutput(rawText: string, label = 'Gemini'): TurnOutput {
  // Short single-line excerpt so halt panels stay readable when pasted back.
  function snippet(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat || '(empty)';
  }
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
    throw new GeminiError(`${label} returned unparseable output. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
  }
  const record = parsed as Record<string, unknown>;
  for (const key of ['negation', 'incorporation', 'reformulation', 'contradiction_passed', 'new_contribution']) {
    if (typeof record[key] !== 'string' || !(record[key] as string).trim()) {
      throw new GeminiError(`${label} output was missing “${key}”. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
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
  ' Your previous reply was not valid JSON. Reply again with JSON only: the complete six-key object, no prose outside it.';

export async function generateTurn({ apiKey, model, systemPrompt, userMessage, longForm }: GenerateTurnArgs): Promise<TurnOutput> {
  const makeBody = (msg: string) => ({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: msg }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: longForm ? MAX_OUTPUT_TOKENS.long : MAX_OUTPUT_TOKENS.normal,
      // Gemini 3 reasons at HIGH effort when thinkingLevel is unset (tens of
      // seconds per turn). Our turns are short-form stylised writing, for which
      // LOW is documented as the right setting — it minimises latency and cost.
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });

  const post = async (msg: string): Promise<string> => {
    let lastError: GeminiError | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(endpoint(model, apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makeBody(msg)),
        });
      } catch {
        lastError = new GeminiError('Network error reaching Gemini. Check the connection and Resume the cabinet.', true, 'network');
        continue;
      }
      if (!response.ok) {
        const detail = await extractDetail(response);
        const error = friendlyError(response.status, detail);
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          lastError = error;
          await sleep(response.status === 429 ? retryAfterMs(detail, 15000) : 2000);
          continue;
        }
        throw error;
      }
      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      if (!text.trim()) {
        throw new GeminiError('Gemini returned an empty response. Resume the cabinet to retry the turn.', true, 'server');
      }
      return text;
    }
    throw lastError ?? new GeminiError('Gemini request failed. Resume the cabinet to retry the turn.', true, 'unknown');
  };

  const text = await post(userMessage);
  try {
    return parseTurnOutput(text);
  } catch (error) {
    if (!(error instanceof GeminiError) || error.code !== 'parse') throw error;
    return parseTurnOutput(await post(userMessage + REPAIR_SUFFIX));
  }
}

/** Cheap key check: one tiny call on the given model (defaults to flash). */
export async function testApiKey(apiKey: string, model: GeminiModel = 'gemini-3.6-flash'): Promise<void> {
  const response = await fetch(endpoint(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: ok' }] }],
      generationConfig: { maxOutputTokens: 10, thinkingConfig: { thinkingLevel: 'low' } },
    }),
  });
  if (!response.ok) {
    throw friendlyError(response.status, await extractDetail(response));
  }
}
