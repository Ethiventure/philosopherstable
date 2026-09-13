/**
 * Shared LLM plumbing for every provider client (shared, OpenRouter, Groq,
 * DeepInfra, Together). One error type with machine-readable codes, one turn
 * parser with layered salvage, one repair suffix, one retry-after parser.
 * Provider-specific code lives in each client's own module.
 */

export interface TurnOutput {
  negation: string;
  incorporation: string;
  reformulation: string;
  new_contribution: string;
  works_referenced: string[];
}

export type LlmErrorCode = 'quota' | 'auth' | 'model' | 'network' | 'server' | 'parse' | 'unknown';

export class LlmError extends Error {
  readonly retryable: boolean;
  readonly code: LlmErrorCode;
  constructor(message: string, retryable = false, code: LlmErrorCode = 'unknown') {
    super(message);
    this.name = 'LlmError';
    this.retryable = retryable;
    this.code = code;
  }
}

const TURN_KEYS = ['negation', 'reformulation', 'new_contribution'] as const;

/** Last-resort salvage for models that emit JSON structure with UNQUOTED
 * string values (`"negation": some prose…`). Requotes the values of known
 * keys only, so prose that merely mentions `"word":` can't corrupt anything.
 * Returns reparsed text or null. */
function requoteBareValues(text: string): string | null {
  try {
    const known = new Set<string>([...TURN_KEYS, 'works_referenced']);
    const keyRe = /"([^"\\]+)"\s*:/g;
    const keys: { key: string; valueStart: number; keyStart: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(text)) !== null) {
      if (known.has(m[1])) keys.push({ key: m[1], keyStart: m.index, valueStart: m.index + m[0].length });
    }
    if (!keys.length) return null;
    // Truncated responses have no closing brace: close the last value and the
    // object so partial content still parses (better a clipped turn than none).
    let src = text;
    if (src.lastIndexOf('}') < keys[keys.length - 1].valueStart) src += '"}';
    const objEnd = src.lastIndexOf('}');
    if (objEnd === -1) return null;
    // Rebuild the object from scratch: any leading prose is dropped.
    let out = '{';
    keys.forEach((k, i) => {
      const end = i + 1 < keys.length ? keys[i + 1].keyStart : objEnd;
      const raw = src.slice(k.valueStart, end).trim().replace(/,\s*$/, '');
      if (/^[[{"]/.test(raw) || /^(true|false|null|-?\d)/.test(raw)) {
        out += `"${k.key}": ${raw}`;
      } else if (!raw) {
        return;
      } else {
        out += `"${k.key}": ${JSON.stringify(raw)}`;
      }
      out += i + 1 < keys.length ? ',' : '';
    });
    out += '}';
    JSON.parse(out); // validate before returning
    return out;
  } catch {
    return null;
  }
}

export function parseTurnOutput(rawText: string, label = 'LLM'): TurnOutput {
  // Short single-line excerpt so halt panels stay readable when pasted back.
  function snippet(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat || '(empty)';
  }
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Salvage 1: some models wrap JSON in prose despite JSON mode.
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(rawText.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
    // Salvage 2: JSON structure with unquoted string values (common Llama slip).
    if (!parsed || typeof parsed !== 'object') {
      const fixed = requoteBareValues(rawText);
      if (fixed) {
        try {
          parsed = JSON.parse(fixed);
        } catch {
          parsed = null;
        }
      }
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    if (typeof console !== 'undefined') console.warn(`[${label}] unparseable turn text:`, rawText.slice(0, 2000));
    throw new LlmError(`${label} returned unparseable output. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
  }
  const record = parsed as Record<string, unknown>;
  for (const key of TURN_KEYS) {
    if (typeof record[key] !== 'string' || !(record[key] as string).trim()) {
      if (typeof console !== 'undefined') console.warn(`[${label}] turn missing key "${key}":`, rawText.slice(0, 2000));
      throw new LlmError(`${label} output was missing “${key}”. Resume the cabinet to retry the turn. Got: ${snippet(rawText)}`, true, 'parse');
    }
  }
  // Incorporation is optional (folded into the other prose since the
  // incorporation-fold); everything else is mandatory.
  const incorporation = typeof record.incorporation === 'string' ? record.incorporation.trim() : '';
  const works = Array.isArray(record.works_referenced)
    ? (record.works_referenced as unknown[]).filter((w): w is string => typeof w === 'string')
    : [];
  // Safety net for dropped terminal punctuation (models trail off): the rule
  // lives in the prompt; this guarantees it mechanically.
  const terminate = (s: string): string => {
    const t = s.trim();
    return /[.?!…:;]$/.test(t) ? t : `${t}.`;
  };
  return {
    negation: terminate(record.negation as string),
    incorporation: incorporation ? terminate(incorporation) : '',
    reformulation: terminate(record.reformulation as string),
    new_contribution: terminate(record.new_contribution as string),
    works_referenced: works,
  };
}

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
  ' Your previous reply was not valid JSON. Reply again with JSON only: the complete four-key object, no prose outside it.';
