import type { StyleIntensity } from '@/types';

/** Free text: Groq retires IDs without notice, so no pinned list survives.
 *  Test key verifies the typed ID immediately. */
export type GroqModel = string;

export const DEFAULT_GROQ_MODEL = 'qwen/qwen3.8-27b';

/** IDs that 404 for visitor keys — stored picks migrate to the default. */
const DEAD_GROQ_IDS = new Set(['qwen/qwen3.6-27b']);

/** Curated dropdown options per provider (Sep 21 2026, graded/probed —
 *  IDs rot, so every field keeps a Custom escape hatch plus dead-ID
 *  migration and the Test-key live check; see ModelIdField in App).
 *  Only verified-live IDs are listed; anything else goes through Custom. */
export const CUSTOM_MODEL_VALUE = '__custom';
export const GROQ_MODEL_OPTIONS = ['qwen/qwen3.8-27b'];
/** OpenRouter paid options (Sep 21 2026, probed live — cheapest first,
 *  best voice first among equals): 3.7-plus default (clean probe; same
 *  weights as the Alibaba value crown — host differs), 3.7-flash (clean
 *  probe, cheapest), 3.8-flash (burn verdict reversed on new prompts).
 *  Dead pins fall through the list mid-sitting; stored GLM migrates. */
export const OPENROUTER_PAID_OPTIONS = ['qwen/qwen3.7-plus', 'qwen/qwen3.7-flash', 'qwen/qwen3.8-flash'];
export const ALIBABA_MODEL_OPTIONS = ['qwen3.8-max', 'qwen3.7-plus', 'qwen3.8-27b', 'qwen3.8-flash'];

export type DeepInfraModel = 'Qwen/Qwen3-30B-A3B' | 'Qwen/Qwen3-14B';

/** Who speaks first on DeepInfra (failures halt visibly — no backup model). */
export type DeepInfraPrimary = 'qwen30b' | 'qwen14b';

/** Transparency rule: every option names its exact model ID and why it is
 *  picked. The Settings UI renders these verbatim, so keep each `why` to one
 *  plain line (model, price, reason). */
export const DEEPINFRA_PRIMARIES: { id: DeepInfraPrimary; label: string; model: DeepInfraModel; why: string }[] = [
  { id: 'qwen30b', label: 'Qwen3-30B-A3B', model: 'Qwen/Qwen3-30B-A3B', why: 'Default. Tuning target: best dilemma-grasp measured, ~1–2 min debates, ~$0.03/sitting. Echo clusters + unspoken history still open.' },
  { id: 'qwen14b', label: 'Qwen3-14B', model: 'Qwen/Qwen3-14B', why: 'Cheapest proven paid engine (~$0.021/sitting); tuning parked. Slow pipe (42s probe), over budget — needs room, not haste.' },
];

export type TurnEconomy = 'full' | 'efficient';

export type LlmProvider = 'shared' | 'openrouter' | 'groq' | 'deepinfra' | 'together' | 'alibaba';

/** Free text (Model Studio codes vary by region): Test key verifies live. */
export type AlibabaModel = string;

/** Owner default to Dec 2026 trial (Sep 21 2026): quality crown speaks
 *  first. Fallback chain lives in alibaba.ts (3.7-plus → 27B → flash). */
export const DEFAULT_ALIBABA_MODEL = 'qwen3.8-max';

export interface CabinetSettings {
  intensity: StyleIntensity;
  longForm: boolean;
  provider: LlmProvider;
  openRouterApiKey: string;
  openRouterMode: 'free' | 'paid';
  openRouterModel: string;
  groqApiKey: string;
  groqModel: GroqModel;
  deepInfraApiKey: string;
  deepInfraPrimary: DeepInfraPrimary;
  togetherApiKey: string;
  alibabaApiKey: string;
  alibabaModel: AlibabaModel;
  economy: TurnEconomy;
  /** Experimental source grounding (Phase 2, item ii): fetch + keyword-extract
   * HTML source pages server-side and inject top passages. Default on;
   * delete lib/extract.ts + functions/extract.js + this flag to fully undo. */
  grounding: boolean;
}

const STORAGE_KEY = 'dialectical-cabinet:settings:v1';

export const DEFAULT_SETTINGS: CabinetSettings = {
  intensity: 'medium',
  longForm: false,
  provider: 'shared',
  openRouterApiKey: '',
  openRouterMode: 'free',
  openRouterModel: 'qwen/qwen3.7-plus',
  groqApiKey: '',
  groqModel: DEFAULT_GROQ_MODEL,
  deepInfraApiKey: '',
  deepInfraPrimary: 'qwen30b',
  togetherApiKey: '',
  alibabaApiKey: '',
  alibabaModel: DEFAULT_ALIBABA_MODEL,
  economy: 'full',
  grounding: true,
};

export function loadSettings(): CabinetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<CabinetSettings>;
    return {
      intensity: parsed.intensity === 'low' || parsed.intensity === 'high' ? parsed.intensity : 'medium',
      longForm: parsed.longForm === true,
      // Gemini removed (retired for new keys, 404): stored 'gemini' migrates to shared.
      // Z.ai removed Sep 21 2026 (GLM-only house, model parked entirely):
      // stored 'zai' migrates to shared, same rule.
      provider: parsed.provider === 'openrouter' || parsed.provider === 'groq' || parsed.provider === 'deepinfra' || parsed.provider === 'together' || parsed.provider === 'alibaba'
        ? parsed.provider
        : 'shared',
      openRouterApiKey: typeof parsed.openRouterApiKey === 'string' ? parsed.openRouterApiKey : '',
      openRouterMode: parsed.openRouterMode === 'paid' ? 'paid' : 'free',
      groqApiKey: typeof parsed.groqApiKey === 'string' ? parsed.groqApiKey : '',
      // Free-text model ID (never openai/*, never a known-dead ID);
      // anything else passes through — Test key is the live check.
      groqModel: typeof parsed.groqModel === 'string' && parsed.groqModel.trim() && !parsed.groqModel.trim().startsWith('openai/') && !DEAD_GROQ_IDS.has(parsed.groqModel.trim())
        ? parsed.groqModel.trim().slice(0, 120)
        : DEFAULT_GROQ_MODEL,
      deepInfraApiKey: typeof parsed.deepInfraApiKey === 'string' ? parsed.deepInfraApiKey : '',
      // 'qwen' stored picks predate the 14B option (Sep 21 2026) — they mean 30B.
      deepInfraPrimary: parsed.deepInfraPrimary === 'qwen14b' ? 'qwen14b' : 'qwen30b',
      togetherApiKey: typeof parsed.togetherApiKey === 'string' ? parsed.togetherApiKey : '',
      alibabaApiKey: typeof parsed.alibabaApiKey === 'string' ? parsed.alibabaApiKey : '',
      // Free-text Model Studio code (never openai/*); dead IDs fall back.
      alibabaModel: typeof parsed.alibabaModel === 'string' && parsed.alibabaModel.trim() && !parsed.alibabaModel.trim().startsWith('openai/')
        ? parsed.alibabaModel.trim().slice(0, 120)
        : DEFAULT_ALIBABA_MODEL,
      // No OpenAI models, ever: stored openai/* IDs migrate to the default.
      // Stored GLM pin migrates too (parked entirely Sep 21 2026).
      openRouterModel: typeof parsed.openRouterModel === 'string' && parsed.openRouterModel.trim() && !parsed.openRouterModel.trim().startsWith('openai/') && parsed.openRouterModel.trim() !== 'z-ai/glm-5.3-flash'
        ? parsed.openRouterModel.trim().slice(0, 120)
        : 'qwen/qwen3.7-plus',
      economy: parsed.economy === 'efficient' ? 'efficient' : 'full',
      grounding: parsed.grounding === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: CabinetSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode etc.) — settings simply won't persist.
  }
}

export function clearApiKey(): CabinetSettings {
  const next = { ...loadSettings(), openRouterApiKey: '', groqApiKey: '', deepInfraApiKey: '', togetherApiKey: '', alibabaApiKey: '' };
  saveSettings(next);
  return next;
}

// Provider health (Sep 24 2026): last Test-key outcome per provider,
// browser-only like the keys themselves. Display-only, never a gate:
// a stale OK never blocks a sitting, a past failure never forces one.
export interface ProviderHealth {
  state: 'ok' | 'error';
  at: string; // ISO timestamp
  detail: string; // short label: model ID on OK, truncated error otherwise
}

const HEALTH_KEY = 'dialectical-cabinet-provider-health';

export function loadProviderHealth(): Record<string, ProviderHealth> {
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ProviderHealth>;
    const out: Record<string, ProviderHealth> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || (v.state !== 'ok' && v.state !== 'error')) continue;
      if (typeof v.at !== 'string' || typeof v.detail !== 'string') continue;
      out[k] = { state: v.state, at: v.at, detail: v.detail.slice(0, 160) };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveProviderHealth(provider: string, health: ProviderHealth): void {
  try {
    const all = loadProviderHealth();
    all[provider] = { state: health.state, at: health.at, detail: health.detail.slice(0, 160) };
    localStorage.setItem(HEALTH_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — health simply won't persist.
  }
}

export function clearProviderHealth(provider: string): void {
  try {
    const all = loadProviderHealth();
    delete all[provider];
    localStorage.setItem(HEALTH_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
