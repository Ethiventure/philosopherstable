import type { StyleIntensity } from '@/types';

/** Free text: Groq retires IDs without notice, so no pinned list survives.
 *  Test key verifies the typed ID immediately. */
export type GroqModel = string;

export const DEFAULT_GROQ_MODEL = 'qwen/qwen3.8-27b';

/** IDs that 404 for visitor keys — stored picks migrate to the default. */
const DEAD_GROQ_IDS = new Set(['qwen/qwen3.6-27b']);

export type DeepInfraModel = 'deepseek-ai/DeepSeek-V4-Flash-0731' | 'Qwen/Qwen3-30B-A3B' | 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

/** Who speaks first on DeepInfra (backup Llama rescues either). */
export type DeepInfraPrimary = 'deepseek' | 'qwen';

/** Transparency rule: every option names its exact model ID and why it is
 *  picked. The Settings UI renders these verbatim, so keep each `why` to one
 *  plain line (model, price, reason). */
export const DEEPINFRA_PRIMARIES: { id: DeepInfraPrimary; label: string; model: DeepInfraModel; why: string }[] = [
  { id: 'deepseek', label: 'DeepSeek V4 Flash 0731', model: 'deepseek-ai/DeepSeek-V4-Flash-0731', why: 'Obedient JSON, ~$0.10/$0.30 per 1M — the fallback engine, fastest reliable pick.' },
  { id: 'qwen', label: 'Qwen3-30B-A3B', model: 'Qwen/Qwen3-30B-A3B', why: 'Cheap Qwen voice, $0.12/$0.50 per 1M, with a documented thinking off-switch — retest pending (replaces 3.6-35B, which burned live Sep 2026).' },
];

/** Llama rescue model, named in the UI beside the primary. */
export const DEEPINFRA_BACKUP_LABEL = 'Llama 3.3 70B (meta-llama/Llama-3.3-70B-Instruct-Turbo) — rescue only, never first choice (weak prompt adherence).';

export type TurnEconomy = 'full' | 'efficient';

export type LlmProvider = 'shared' | 'openrouter' | 'groq' | 'deepinfra' | 'together' | 'alibaba' | 'zai';

/** Free text (Z.ai model codes): Test key verifies live. */
export type ZaiModel = string;

export const DEFAULT_ZAI_MODEL = 'glm-4.7-flash';

/** Free text (Model Studio codes vary by region): Test key verifies live. */
export type AlibabaModel = string;

export const DEFAULT_ALIBABA_MODEL = 'qwen3.8-27b';

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
  zaiApiKey: string;
  zaiModel: ZaiModel;
  economy: TurnEconomy;
  /** Experimental source grounding (Phase 2, item ii): fetch + keyword-extract
   * HTML source pages server-side and inject top passages. Default off;
   * delete lib/extract.ts + functions/extract.js + this flag to fully undo. */
  grounding: boolean;
}

const STORAGE_KEY = 'dialectical-cabinet:settings:v1';

export const DEFAULT_SETTINGS: CabinetSettings = {
  intensity: 'medium',
  longForm: true,
  provider: 'shared',
  openRouterApiKey: '',
  openRouterMode: 'free',
  openRouterModel: 'deepseek/deepseek-v4.1-flash',
  groqApiKey: '',
  groqModel: DEFAULT_GROQ_MODEL,
  deepInfraApiKey: '',
  deepInfraPrimary: 'deepseek',
  togetherApiKey: '',
  alibabaApiKey: '',
  alibabaModel: DEFAULT_ALIBABA_MODEL,
  zaiApiKey: '',
  zaiModel: DEFAULT_ZAI_MODEL,
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
      provider: parsed.provider === 'openrouter' || parsed.provider === 'groq' || parsed.provider === 'deepinfra' || parsed.provider === 'together' || parsed.provider === 'alibaba' || parsed.provider === 'zai'
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
      deepInfraPrimary: parsed.deepInfraPrimary === 'qwen' ? 'qwen' : 'deepseek',
      togetherApiKey: typeof parsed.togetherApiKey === 'string' ? parsed.togetherApiKey : '',
      alibabaApiKey: typeof parsed.alibabaApiKey === 'string' ? parsed.alibabaApiKey : '',
      // Free-text Model Studio code (never openai/*); dead IDs fall back.
      alibabaModel: typeof parsed.alibabaModel === 'string' && parsed.alibabaModel.trim() && !parsed.alibabaModel.trim().startsWith('openai/')
        ? parsed.alibabaModel.trim().slice(0, 120)
        : DEFAULT_ALIBABA_MODEL,
      // Free-text Z.ai model code (never openai/*); anything else passes
      // through — Test key is the live check.
      zaiApiKey: typeof parsed.zaiApiKey === 'string' ? parsed.zaiApiKey : '',
      zaiModel: typeof parsed.zaiModel === 'string' && parsed.zaiModel.trim() && !parsed.zaiModel.trim().startsWith('openai/')
        ? parsed.zaiModel.trim().slice(0, 120)
        : DEFAULT_ZAI_MODEL,
      // No OpenAI models, ever: stored openai/* IDs migrate to the default.
      openRouterModel: typeof parsed.openRouterModel === 'string' && parsed.openRouterModel.trim() && !parsed.openRouterModel.trim().startsWith('openai/')
        ? parsed.openRouterModel.trim().slice(0, 120)
        : 'deepseek/deepseek-v4.1-flash',
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
  const next = { ...loadSettings(), openRouterApiKey: '', groqApiKey: '', deepInfraApiKey: '', togetherApiKey: '', alibabaApiKey: '', zaiApiKey: '' };
  saveSettings(next);
  return next;
}
