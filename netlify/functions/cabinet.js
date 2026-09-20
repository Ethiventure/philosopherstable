/**
 * POST /.netlify/functions/cabinet — shared-LLM proxy (Groq).
 *
 * Why this exists: a browser bundle cannot hold a secret. Any key shipped in
 * the Vite JS is extractable by every visitor, so the Groq key lives ONLY in
 * the Netlify dashboard env (GROQ_API_KEY) and the browser never sees it.
 * This function attaches the key server-side and enforces quota guards so one
 * visitor can't drink the shared well dry.
 *
 * Free-tier safety: Groq's free tier is rate-capped with no billing attached,
 * so worst-case abuse exhausts shared quota (visible, recoverable) rather
 * than producing a bill. Rotate GROQ_API_KEY in console.groq.com + Netlify
 * env if it ever leaks — no code change needed.
 *
 * Env vars (all optional except one provider key):
 *   GROQ_API_KEY            Secret. Set in Netlify dashboard, never in repo.
 *   ALIBABA_API_KEY         Secret. When set, the shared path routes to the
 *                           Alibaba trial quota instead of Groq (trial to
 *                           Dec 16 2026 — re-hunt the free pipe before expiry).
 *                           LIVE TEST PENDING (Sep 20 2026): route is
 *                           env-guarded and syntax-checked only; run one
 *                           shared sitting on deploy before trusting it.
 *   ALIBABA_MODELS          Comma list, tried in order. Default below.
 *   GROQ_MODELS             Comma list, tried in order. Default below.
 *   SHARED_PER_IP_PER_DAY   Default 60 (≈2 full 30-turn sessions per visitor).
 *   SHARED_GLOBAL_PER_DAY   Default 900 (just under Groq's 1K RPD on these models).
 *
 * Honest limitation: per-IP counts are in-memory per function instance, so a
 * determined abuser rotating IPs (or hitting parallel instances) can exceed
 * them. The global cap bounds total damage. Upgrade to Redis (Upstash) if
 * abuse ever materialises.
 */

const DEFAULT_MODELS = ['qwen/qwen3.8-27b', 'qwen/qwen3-32b'];
// qwen3.6-27b retired Sep 20 2026 (Groq 404) — corpse, do not restore.
// qwen3-32b verified live via Groq docs Sep 2026; ungraded voice — fallback only.
// Alibaba route (trial quota to Dec 16 2026): OpenAI-compatible endpoint,
// same body/response shape as Groq, so the call below is shared.
const ALIBABA_BASE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_ALIBABA_MODELS = ['qwen3.8-27b'];
const MAX_BODY_CHARS = 60000;
const FETCH_TIMEOUT_MS = 60000;

// In-memory counters, reset on date rollover. Per-instance (see note above).
let usageDay = utcDay();
let perIp = new Map();
let globalCount = 0;

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay() {
  const today = utcDay();
  if (today !== usageDay) {
    usageDay = today;
    perIp = new Map();
    globalCount = 0;
  }
}

function clientIp(event) {
  const h = event.headers || {};
  const forwarded = h['x-forwarded-for'] || h['X-Forwarded-For'] || '';
  const first = String(forwarded).split(',')[0].trim();
  return first || h['x-nf-client-connection-ip'] || h['client-ip'] || h['Client-Ip'] || 'unknown';
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

async function tryModel(model, apiKey, messages, maxTokens, baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: controller.signal,
    });
    if (response.status === 429 || response.status >= 500) {
      return { retryNext: true, status: response.status, detail: await safeDetail(response) };
    }
    if (!response.ok) {
      const detail = await safeDetail(response);
      return { retryNext: isModelFault(response.status, detail), status: response.status, detail };
    }
    const data = await response.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return { retryNext: true, status: 502, detail: 'empty response' };
    }
    const usage = data?.usage;
    return {
      text: text.trim(),
      model,
      usage: usage && (usage.prompt_tokens || usage.completion_tokens)
        ? { prompt_tokens: usage.prompt_tokens ?? 0, completion_tokens: usage.completion_tokens ?? 0 }
        : undefined,
    };
  } catch (error) {
    const timedOut = error && (error.name === 'AbortError' || error.name === 'TimeoutError');
    return { retryNext: true, status: timedOut ? 504 : 502, detail: timedOut ? 'timeout' : 'network error' };
  } finally {
    clearTimeout(timer);
  }
}

async function safeDetail(response) {
  try {
    const data = await response.clone().json();
    return data?.error?.message || data?.message || '';
  } catch {
    try {
      return (await response.text()).slice(0, 300);
    } catch {
      return '';
    }
  }
}

function isModelFault(status, detail) {
  if (status === 404) return true;
  if (status === 400 || status === 403) {
    return !/key|auth|credential|permission/i.test(detail || '');
  }
  return false;
}

export async function handler(event) {
  resetIfNewDay();

  if (event.httpMethod !== 'POST') {
    return json(405, { error: { message: 'POST only.', code: 'method' } });
  }

  // Route: Alibaba trial quota when its key is set, else Groq. Default
  // behaviour with only GROQ_API_KEY set is byte-identical to before.
  const alibabaKey = process.env.ALIBABA_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const apiKey = alibabaKey || groqKey;
  const baseUrl = alibabaKey ? ALIBABA_BASE : GROQ_BASE;
  if (!apiKey) {
    return json(500, {
      error: {
        message: 'Shared provider is not configured (no GROQ_API_KEY or ALIBABA_API_KEY on the server). Add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key.',
        code: 'unconfigured',
      },
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: { message: 'Invalid JSON body.', code: 'bad_request' } });
  }

  const { systemPrompt, userMessage, maxTokens } = body;
  if (typeof systemPrompt !== 'string' || typeof userMessage !== 'string') {
    return json(400, { error: { message: 'systemPrompt and userMessage are required.', code: 'bad_request' } });
  }
  if (systemPrompt.length + userMessage.length > MAX_BODY_CHARS) {
    return json(413, { error: { message: 'Prompt too large.', code: 'bad_request' } });
  }
  const tokens = Number.isInteger(maxTokens) && maxTokens > 0 ? Math.min(maxTokens, 8000) : 4000;

  const perIpCap = parseInt(process.env.SHARED_PER_IP_PER_DAY || '60', 10);
  const globalCap = parseInt(process.env.SHARED_GLOBAL_PER_DAY || '900', 10);
  const ip = clientIp(event);
  const ipCount = perIp.get(ip) || 0;
  if (ipCount >= perIpCap) {
    return json(429, {
      error: {
        message: `Shared quota used up for your address today (${ipCount}/${perIpCap}). Caps reset at midnight UTC — or add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key for unlimited personal use.`,
        code: 'quota',
      },
    });
  }
  if (globalCount >= globalCap) {
    return json(429, {
      error: {
        message: 'Shared quota is exhausted for everyone today. It resets at midnight UTC — or add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key.',
        code: 'quota',
      },
    });
  }

  const modelsEnv = alibabaKey ? process.env.ALIBABA_MODELS : process.env.GROQ_MODELS;
  const models = (modelsEnv || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  if (!models.length) models.push(...(alibabaKey ? DEFAULT_ALIBABA_MODELS : DEFAULT_MODELS));

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const failures = [];
  for (const model of models) {
    // Count the attempt BEFORE calling: crashed instances shouldn't grant free retries.
    perIp.set(ip, (perIp.get(ip) || 0) + 1);
    globalCount += 1;
    const result = await tryModel(model, apiKey, messages, tokens, baseUrl);
    if (result.text) {
      return json(200, { text: result.text, model, ...(result.usage ? { usage: result.usage } : {}) });
    }
    // 401 means the server key itself is bad — every model will fail identically.
    if (result.status === 401) {
      return json(500, {
        error: {
          message: 'Shared provider key is invalid (owner must rotate GROQ_API_KEY). Meanwhile, add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key.',
          code: 'auth',
        },
      });
    }
    failures.push(`${model} (${result.status}${result.detail ? `: ${result.detail}` : ''})`);
  }

  const quotaish = failures.some(
    (f) => /\(429|\(402|quota|rate.?limit|exhausted|credits?|too many requests/i.test(f),
  );
  if (quotaish) {
    return json(429, {
      error: {
        message: `Shared quota is tight right now: ${failures.join('; ')}. Wait out the named window and Resume — or add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key.`,
        code: 'quota',
      },
    });
  }
  return json(502, {
    error: {
      message: `Shared provider failed on every model: ${failures.join('; ')}. Resume to retry, or add your own OpenRouter, Groq, DeepInfra, Together, Alibaba or Z.ai key in Settings → Key.`,
      code: 'server',
    },
  });
}
