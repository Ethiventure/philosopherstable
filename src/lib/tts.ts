/**
 * Free text-to-speech via the browser's built-in SpeechSynthesis.
 * No key, no network, no cost. Single auto-picked English voice, one
 * shared queue owned by App so per-turn and full-session reads can't overlap.
 */

export interface TtsItem {
  id: string;
  heading: string;
  text: string;
}

export type TtsStatus =
  | { state: 'idle' }
  | { state: 'reading'; currentId: string; position: number; total: number }
  | { state: 'paused'; currentId: string; position: number; total: number };

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Read-only voice inventory for the Display tab (user picks the best by ear). */
export interface TtsVoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
  voiceURI: string;
}

export function listVoices(): TtsVoiceInfo[] {
  if (!isTtsSupported()) return [];
  return window.speechSynthesis.getVoices().map((v) => ({
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    isDefault: v.default,
    voiceURI: v.voiceURI,
  }));
}

/** Resolve which voice to speak with. An explicit visitor pick (persisted
 * voiceURI) always wins. Otherwise the browser-flagged default voice (the
 * OS-level default), preferring English — assigning it explicitly is what
 * yields "the device default" on desktop Chrome, where leaving
 * `utter.voice` unset falls back to a bundled voice instead.
 *
 * iPad note: iOS Safari often flags no voice as default, or flags a compact
 * one — so the chain falls through to an on-device English voice rather
 * than nothing, and the Display tab offers an explicit pick that sticks. */
export function resolveVoice(preferredURI?: string | null): SpeechSynthesisVoice | null {
  if (!isTtsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  if (preferredURI) {
    const picked = voices.find((v) => v.voiceURI === preferredURI);
    if (picked) return picked;
  }
  return (
    voices.find((v) => v.default && v.lang.toLowerCase().startsWith('en')) ??
    voices.find((v) => v.default) ??
    voices.find((v) => v.localService && v.lang.toLowerCase().startsWith('en')) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
    voices[0] ??
    null
  );
}

/** Back-compat alias (device default, no explicit pick). */
export function defaultVoice(): SpeechSynthesisVoice | null {
  return resolveVoice(null);
}
/** Voices load asynchronously (Chrome returns [] on first call) — wait briefly. */
export function ensureVoices(): Promise<void> {
  if (!isTtsSupported()) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const timer = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      finish();
    }, 1500);
    const onChange = () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      finish();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
  });
}
/** Split long text at sentence boundaries — browsers truncate single long utterances. */
export function chunkText(text: string, maxLen = 200): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]+["”']?\s*|[^.!?…]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        // Hard-split an over-long sentence on word boundaries.
        const words = s.split(' ');
        current = '';
        for (const w of words) {
          if ((current + ' ' + w).trim().length <= maxLen) current = (current + ' ' + w).trim();
          else { chunks.push(current); current = w; }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

export interface TtsControllerOptions {
  rate: number;
  voiceURI: string | null;
  onStatus: (status: TtsStatus) => void;
}

/** Single owner for speechSynthesis. App creates one and passes speak/stop down. */
export function createTtsController({ rate, voiceURI, onStatus }: TtsControllerOptions) {
  let cancelled = false;
  let paused = false;
  let queue: TtsItem[] = [];
  let resumeFn: (() => void) | null = null;
  let generation = 0;

  const synth = () => window.speechSynthesis;

  function finish() {
    queue = [];
    resumeFn = null;
    onStatus({ state: 'idle' });
  }

  // Device-default voice, assigned explicitly: leaving `utter.voice` unset
  // lets Chrome fall back to a bundled voice instead of the OS default.
  // Still nothing baked in — this resolves per visitor, with their explicit
  // Display-tab pick first. `utter.lang` is deliberately left alone: on
  // Safari, assigning lang after voice can make the engine switch voices.
  function speakItemChunks(chunks: string[], itemIndex: number) {
    if (cancelled || itemIndex >= queue.length) { finish(); return; }
    const item = queue[itemIndex];
    if (!item) { finish(); return; }
    onStatus({ state: 'reading', currentId: item.id, position: itemIndex + 1, total: queue.length });
    let partIndex = 0;
    const speakPart = () => {
      if (cancelled) { finish(); return; }
      if (paused) {
        resumeFn = speakPart;
        onStatus({ state: 'paused', currentId: item.id, position: itemIndex + 1, total: queue.length });
        return;
      }
      if (partIndex >= chunks.length) {
        const nextIndex = itemIndex + 1;
        const next = queue[nextIndex];
        if (!next) { finish(); return; }
        speakItemChunks(chunkText(`${next.heading}. ${next.text}`), nextIndex);
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunks[partIndex]);
      utter.rate = rate;
      const voice = resolveVoice(voiceURI);
      if (voice) {
        utter.voice = voice;
      }
      utter.onend = () => { partIndex += 1; speakPart(); };
      utter.onerror = () => { partIndex += 1; speakPart(); };
      synth().speak(utter);
    };
    speakPart();
  }

  return {
    speak(items: TtsItem[]) {
      if (!isTtsSupported() || !items.length) return;
      generation += 1;
      const myGen = generation;
      cancelled = false;
      paused = false;
      resumeFn = null;
      synth().cancel();
      // Chrome starts the synth paused until a user gesture resumes it;
      // a click got us here, so unpause before queuing.
      if (synth().paused) synth().resume();
      queue = [...items];
      // Speaking before voices load is silently dropped in Chrome — wait first.
      void ensureVoices().then(() => {
        if (cancelled || myGen !== generation) return;
        speakItemChunks(chunkText(`${items[0].heading}. ${items[0].text}`), 0);
      });
    },
    pause() {
      if (!isTtsSupported()) return;
      paused = true;
      synth().pause();
    },
    resume() {
      if (!isTtsSupported()) return;
      paused = false;
      if (synth().paused) {
        synth().resume();
        return;
      }
      const fn = resumeFn;
      resumeFn = null;
      fn?.();
    },
    stop() {
      generation += 1;
      cancelled = true;
      paused = false;
      resumeFn = null;
      if (isTtsSupported()) synth().cancel();
      finish();
    },
    setRate() {
      // Rate applies to the next speak() call (controller is recreated on change).
    },
  };
}

export type TtsController = ReturnType<typeof createTtsController>;
