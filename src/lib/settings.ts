import type { StyleIntensity } from '@/types';

export type GeminiModel = 'gemini-3.6-flash' | 'gemini-3.5-flash-lite';

export const GEMINI_MODELS: { id: GeminiModel; label: string; hint: string }[] = [
  { id: 'gemini-3.6-flash', label: 'gemini-3.6-flash', hint: 'Better quality, recommended default' },
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite', hint: 'Maxes the free tier, lighter prose' },
];

const LEGACY_MODEL_MAP: Record<string, GeminiModel> = {
  'gemini-2.5-flash': 'gemini-3.6-flash',
  'gemini-2.5-pro': 'gemini-3.6-flash',
  'gemini-2.0-flash': 'gemini-3.6-flash',
  'gemini-3.8-flash': 'gemini-3.6-flash',
};

export type LlmProvider = 'shared' | 'gemini' | 'openrouter' | 'groq';

export type GroqModel = 'qwen/qwen3.8-27b' | 'qwen/qwen3.6-27b';

export const GROQ_MODELS: { id: GroqModel; label: string; hint: string }[] = [
  { id: 'qwen/qwen3.8-27b', label: 'qwen3.8-27b', hint: 'Better quality, free tier' },
  { id: 'qwen/qwen3.6-27b', label: 'qwen3.6-27b', hint: 'Alternative voice, free tier' },
];

export type TurnEconomy = 'full' | 'efficient';

export interface CabinetSettings {
  geminiApiKey: string;
  model: GeminiModel;
  intensity: StyleIntensity;
  longForm: boolean;
  provider: LlmProvider;
  openRouterApiKey: string;
  openRouterMode: 'free' | 'paid';
  openRouterModel: string;
  groqApiKey: string;
  groqModel: GroqModel;
  economy: TurnEconomy;
}

const STORAGE_KEY = 'dialectical-cabinet:settings:v1';

export const DEFAULT_SETTINGS: CabinetSettings = {
  geminiApiKey: '',
  model: 'gemini-3.6-flash',
  intensity: 'medium',
  longForm: false,
  provider: 'shared',
  openRouterApiKey: '',
  openRouterMode: 'free',
  openRouterModel: 'deepseek/deepseek-v4.1-flash',
  groqApiKey: '',
  groqModel: 'qwen/qwen3.8-27b',
  economy: 'full',
};

export function loadSettings(): CabinetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<CabinetSettings>;
    const rawModel = typeof parsed.model === 'string' ? parsed.model : '';
    return {
      geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      // Migrate stored 2.x IDs (retired, 404 for new keys) to their 3.x successors.
      model: (GEMINI_MODELS.some((m) => m.id === rawModel) ? rawModel : (LEGACY_MODEL_MAP[rawModel] ?? 'gemini-3.6-flash')) as GeminiModel,
      intensity: parsed.intensity === 'low' || parsed.intensity === 'high' ? parsed.intensity : 'medium',
      longForm: parsed.longForm === true,
      provider: parsed.provider === 'gemini' || parsed.provider === 'openrouter' || parsed.provider === 'groq' ? parsed.provider : 'shared',
      openRouterApiKey: typeof parsed.openRouterApiKey === 'string' ? parsed.openRouterApiKey : '',
      openRouterMode: parsed.openRouterMode === 'paid' ? 'paid' : 'free',
      groqApiKey: typeof parsed.groqApiKey === 'string' ? parsed.groqApiKey : '',
      groqModel: GROQ_MODELS.some((m) => m.id === parsed.groqModel) ? (parsed.groqModel as GroqModel) : 'qwen/qwen3.8-27b',
      // No OpenAI models, ever: stored openai/* IDs migrate to the default.
      openRouterModel: typeof parsed.openRouterModel === 'string' && parsed.openRouterModel.trim() && !parsed.openRouterModel.trim().startsWith('openai/')
        ? parsed.openRouterModel.trim().slice(0, 120)
        : 'deepseek/deepseek-v4.1-flash',
      economy: parsed.economy === 'efficient' ? 'efficient' : 'full',
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
  const next = { ...loadSettings(), geminiApiKey: '' };
  saveSettings(next);
  return next;
}
