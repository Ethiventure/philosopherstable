import { DEFAULT_ACCESSIBILITY, type AccessibilitySettings } from '@/types';

/** Display preferences = accessibility settings, persisted separately from the Gemini key. */
export type DisplayPreferences = AccessibilitySettings;

export const DEFAULT_DISPLAY: DisplayPreferences = DEFAULT_ACCESSIBILITY;

const STORAGE_KEY = 'dialectical-cabinet:display:v1';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function loadDisplay(): DisplayPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY, reduceMotion: prefersReducedMotion() };
    const parsed = JSON.parse(raw) as Partial<DisplayPreferences>;
    const dyslexia = parsed.dyslexiaFont === true;
    return {
      fontScale: typeof parsed.fontScale === 'number' ? clamp(parsed.fontScale, 0.85, 1.4) : 1,
      highContrast: parsed.highContrast === true,
      reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : prefersReducedMotion(),
      dyslexiaFont: dyslexia,
      lineHeight: typeof parsed.lineHeight === 'number' ? clamp(parsed.lineHeight, 1.4, 2.0) : 1.6,
      textAlignment: parsed.textAlignment === 'justify' ? 'justify' : 'left',
      theme: parsed.theme === 'dim' || parsed.theme === 'ink' ? parsed.theme : 'parchment',
      // Back-compat: the old boolean maps onto the new tri-state.
      font: parsed.font === 'sans' || parsed.font === 'dyslexia' || parsed.font === 'academia'
        ? parsed.font
        : dyslexia ? 'dyslexia' : 'academia',
      ttsRate: typeof parsed.ttsRate === 'number' ? clamp(parsed.ttsRate, 0.8, 1.3) : 1,
      ttsVoiceURI: typeof parsed.ttsVoiceURI === 'string' ? parsed.ttsVoiceURI : null,
    };
  } catch {
    return { ...DEFAULT_DISPLAY };
  }
}

export function saveDisplay(prefs: DisplayPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode etc. — preferences simply won't persist.
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Apply display prefs to <html>. Dark academia parchment stays the default:
 * theme="parchment" + font="academia" reproduces the original :root exactly.
 * Background and foreground always change together via data-theme so pairs
 * stay legible; high-contrast is a modifier on top of whichever theme.
 */
export function applyDisplay(prefs: DisplayPreferences): void {
  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.dataset.font = prefs.font;
  root.style.setProperty('--font-scale', String(prefs.fontScale));
  root.style.setProperty('--line-height', String(prefs.lineHeight));
  root.style.setProperty('--text-align', prefs.textAlignment);
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.classList.toggle('reduce-motion', prefs.reduceMotion);
  // dyslexiaFont class retained for back-compat with saved CSS hooks;
  // the tri-state data-font is the source of truth going forward.
  root.classList.toggle('dyslexia-font', prefs.font === 'dyslexia');
  root.classList.toggle('justify-text', prefs.textAlignment === 'justify');
}
