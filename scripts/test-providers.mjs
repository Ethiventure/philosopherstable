/**
 * Shared provider table + POST helper for local test scripts.
 * Same endpoints and "Reply with exactly: ok"-compatible chat shape as each
 * provider's in-app Test key button — a pass here means the app passes.
 * No imports beyond stdlib: mirrors src/lib/* client shapes without the
 * `@/` alias node can't resolve (see test-sitting.mjs header).
 */
export const PROVIDERS = {
  openrouter: { keyEnv: 'TEST_OPENROUTER_KEY', modelEnv: 'TEST_OPENROUTER_MODEL', defModel: 'z-ai/glm-5.3-flash', url: 'https://openrouter.ai/api/v1/chat/completions', timeout: 60000, referer: true },
  groq: { keyEnv: 'TEST_GROQ_KEY', modelEnv: 'TEST_GROQ_MODEL', defModel: 'qwen/qwen3.8-27b', url: 'https://api.groq.com/openai/v1/chat/completions', timeout: 60000 },
  deepinfra: { keyEnv: 'TEST_DEEPINFRA_KEY', modelEnv: 'TEST_DEEPINFRA_MODEL', defModel: 'Qwen/Qwen3-30B-A3B', url: 'https://api.deepinfra.com/v1/openai/chat/completions', timeout: 60000 },
  together: { keyEnv: 'TEST_TOGETHER_KEY', modelEnv: 'TEST_TOGETHER_MODEL', defModel: 'Qwen/Qwen3-30B-A3B', url: 'https://api.together.xyz/v1/chat/completions', timeout: 60000 },
  alibaba: { keyEnv: 'TEST_ALIBABA_KEY', modelEnv: 'TEST_ALIBABA_MODEL', defModel: 'qwen3.8-27b', url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', timeout: 90000 },
  zai: { keyEnv: 'TEST_ZAI_KEY', modelEnv: 'TEST_ZAI_MODEL', defModel: 'glm-4.7-flash', url: 'https://api.z.ai/api/paas/v4/chat/completions', timeout: 90000 },
};

export function resolvePipe(name) {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`unknown provider "${name}" (want: ${Object.keys(PROVIDERS).join(', ')})`);
  return {
    name,
    key: (process.env[p.keyEnv] || '').trim(),
    model: (process.env[p.modelEnv] || p.defModel).trim(),
    url: p.url,
    timeout: p.timeout,
    referer: !!p.referer,
  };
}

export function classifyStatus(status, text) {
  const t = `${status} ${text}`.toLowerCase();
  if (status === 401) return 'BAD-KEY (401 — check the key value)';
  if (status === 404) return 'DEAD-MODEL (404 — ID retired, edit the model value)';
  if (status === 402 || status === 429 || /quota|rate.?limit|credit|balance|concurrent|exhaust/i.test(t)) {
    return 'QUOTA (key works — cap, credits, or per-minute gate)';
  }
  if (status >= 500) return `SERVER (${status} — provider-side, retry later)`;
  return `FAIL (${status || 'no-status'} — ${(text || '').slice(0, 100)})`;
}

/** One chat call. Returns { ok, text, usage, ms } or { ok:false, error, ms }. */
export async function postChat(pipe, system, user, maxTokens) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${pipe.key}` };
  if (pipe.referer) {
    headers['X-Title'] = 'The Dialectical Cabinet (test probe)';
    headers['HTTP-Referer'] = 'https://philosopherstable.netlify.app/';
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), pipe.timeout);
  const started = Date.now();
  try {
    const res = await fetch(pipe.url, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: pipe.model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
      }),
    });
    const ms = Date.now() - started;
    if (!res.ok) return { ok: false, error: classifyStatus(res.status, await res.text().catch(() => '')), ms };
    const data = await res.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'EMPTY (provider returned no text)', ms };
    return { ok: true, text: text.trim(), usage: data?.usage ?? null, ms };
  } catch (err) {
    return { ok: false, error: `NETWORK (${err.name === 'AbortError' ? 'timeout' : String(err).slice(0, 80)})`, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}
