import type { StyleIntensity } from '@/types';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';

export interface CabinetSettings {
  geminiApiKey: string;
  model: GeminiModel;
  intensity: StyleIntensity;
  longForm: boolean;
}

const STORAGE_KEY = 'dialectical-cabinet:settings:v1';

export const DEFAULT_SETTINGS: CabinetSettings = {
  geminiApiKey: '',
  model: 'gemini-2.5-flash',
  intensity: 'medium',
  longForm: false,
};

export function loadSettings(): CabinetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<CabinetSettings>;
    return {
      geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      model: parsed.model === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
      intensity: parsed.intensity === 'low' || parsed.intensity === 'high' ? parsed.intensity : 'medium',
      longForm: parsed.longForm === true,
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
