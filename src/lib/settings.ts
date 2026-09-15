import type { StyleIntensity } from '@/types';

export type GroqModel = 'qwen/qwen3.8-27b' | 'qwen/qwen3.6-27b';

export const GROQ_MODELS: { id: GroqModel; label: string; hint: string }[] = [
  { id: 'qwen/qwen3.8-27b', label: 'qwen3.8-27b', hint: 'Better quality, free tier' },
  { id: 'qwen/qwen3.6-27b', label: 'qwen3.6-27b', hint: 'Alternative voice, free tier' },
];

export type DeepInfraModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo' | 'deepseek-ai/DeepSeek-V4-Flash-0731';

export const DEEPINFRA_MODELS: { id: DeepInfraModel; label: string; hint: string }[] = [
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B', hint: 'Proven full cabinet, card on file' },
  { id: 'deepseek-ai/DeepSeek-V4-Flash-0731', label: 'DeepSeek V4 Flash 0731', hint: 'Backup: ~6× cheaper, adherence untested' },
];

export type TurnEconomy = 'full' | 'efficient';

export type LlmProvider = 'shared' | 'openrouter' | 'groq' | 'deepinfra' | 'together';

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
  deepInfraModel: DeepInfraModel;
  togetherApiKey: string;
  economy: TurnEconomy;
  /** Experimental source grounding (Phase 2, item ii): fetch + keyword-extract
   * HTML source pages server-side and inject top passages. Default off;
   * delete lib/extract.ts + functions/extract.js + this flag to fully undo. */
  grounding: boolean;
}

const STORAGE_KEY = 'dialectical-cabinet:settings:v1';

export const DEFAULT_SETTINGS: CabinetSettings = {
  intensity: 'low',
  longForm: false,
  provider: 'shared',
  openRouterApiKey: '',
  openRouterMode: 'free',
  openRouterModel: 'deepseek/deepseek-v4.1-flash',
  groqApiKey: '',
  groqModel: 'qwen/qwen3.8-27b',
  deepInfraApiKey: '',
  deepInfraModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  togetherApiKey: '',
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
      provider: parsed.provider === 'openrouter' || parsed.provider === 'groq' || parsed.provider === 'deepinfra' || parsed.provider === 'together'
        ? parsed.provider
        : 'shared',
      openRouterApiKey: typeof parsed.openRouterApiKey === 'string' ? parsed.openRouterApiKey : '',
      openRouterMode: parsed.openRouterMode === 'paid' ? 'paid' : 'free',
      groqApiKey: typeof parsed.groqApiKey === 'string' ? parsed.groqApiKey : '',
      groqModel: GROQ_MODELS.some((m) => m.id === parsed.groqModel) ? (parsed.groqModel as GroqModel) : 'qwen/qwen3.8-27b',
      deepInfraApiKey: typeof parsed.deepInfraApiKey === 'string' ? parsed.deepInfraApiKey : '',
      deepInfraModel: DEEPINFRA_MODELS.some((m) => m.id === parsed.deepInfraModel) ? (parsed.deepInfraModel as DeepInfraModel) : 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      togetherApiKey: typeof parsed.togetherApiKey === 'string' ? parsed.togetherApiKey : '',
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
  const next = { ...loadSettings(), openRouterApiKey: '', groqApiKey: '', deepInfraApiKey: '', togetherApiKey: '' };
  saveSettings(next);
  return next;
}
