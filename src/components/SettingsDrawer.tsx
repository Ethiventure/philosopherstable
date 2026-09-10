import { useState } from 'react';
import {
  Eye,
  Key,
  Type,
  X,
  Zap,
  AlignLeft,
  AlignJustify,
  RotateCcw,
} from 'lucide-react';
import {
  type AccessibilitySettings,
  DEFAULT_ACCESSIBILITY,
} from '@/types';
import { getApiKey, setApiKey, getModel, setModel, hasApiKey } from '@/lib/gemini';

interface SettingsDrawerProps {
  enabledSlugs: string[];
  onToggleSlug: (slug: string) => void;
  accessibility: AccessibilitySettings;
  onAccessibilityChange: (settings: AccessibilitySettings) => void;
  philosophers: { slug: string; name: string; full_name: string; birth_year: number | null; accent_color: string }[];
  onClose: () => void;
}

export function SettingsDrawer({
  enabledSlugs,
  onToggleSlug,
  accessibility,
  onAccessibilityChange,
  philosophers,
  onClose,
}: SettingsDrawerProps) {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const [modelInput, setModelInput] = useState(getModel());
  const [keySaved, setKeySaved] = useState(hasApiKey());

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setModel(modelInput);
    setKeySaved(true);
  };

  const update = (partial: Partial<AccessibilitySettings>) => {
    onAccessibilityChange({ ...accessibility, ...partial });
  };

  const resetAccessibility = () => {
    onAccessibilityChange(DEFAULT_ACCESSIBILITY);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 bottom-0 w-full max-w-lg parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="pass-indicator text-[#8b5254]">Cabinet configuration</p>
            <h2 className="text-3xl">Settings</h2>
          </div>
          <button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button>
        </div>

        {/* API Key Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Key size={18} className="text-[#8b5254]" />
            <h3 className="text-xl">Gemini API Key</h3>
          </div>
          <p className="text-sm italic text-[#465f75]/65 mb-3">
            Your key is stored only in your browser and sent directly to Google's API. No login required, no data collected.
          </p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => { setApiKeyInput(e.target.value); setKeySaved(false); }}
            placeholder="Paste your Gemini API key"
            className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-sm text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30 mb-2"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={modelInput}
              onChange={(e) => { setModelInput(e.target.value); setKeySaved(false); }}
              placeholder="gemini-2.0-flash"
              className="flex-1 bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-sm text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"
            />
            <button className="btn-primary" onClick={handleSaveKey}>Save</button>
          </div>
          {keySaved && (
            <p className="text-xs text-[#4a6b3f] mt-2 flex items-center gap-1">
              <Zap size={12} /> Key saved — the cabinet will use live AI.
            </p>
          )}
          <p className="text-xs text-[#465f75]/50 mt-2">
            Get a free key at Google AI Studio (aistudio.google.com). Without a key, the cabinet uses mock responses.
          </p>
        </section>

        {/* Philosopher Toggle Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xl">Cabinet Members</h3>
          </div>
          <p className="text-sm italic text-[#465f75]/65 mb-3">
            Toggle thinkers on or off. Order is always chronological by birth year. At least 2 required.
          </p>
          <div className="space-y-2">
            {philosophers.map((p) => {
              const enabled = enabledSlugs.includes(p.slug);
              return (
                <button
                  key={p.slug}
                  onClick={() => onToggleSlug(p.slug)}
                  className={`w-full flex items-center gap-3 p-3 border transition-all ${
                    enabled
                      ? 'border-[#4a392d]/30 bg-[#f2ebd9]/80'
                      : 'border-[#4a392d]/15 bg-[#eae1ca]/30 opacity-50'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-full border flex items-center justify-center font-heading shrink-0"
                    style={{ borderColor: p.accent_color, color: p.accent_color }}
                  >
                    {p.name.charAt(0)}
                  </span>
                  <div className="text-left flex-1">
                    <p className="font-heading text-base text-[#4a392d]">{p.full_name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#465f75]/55">
                      {p.birth_year ?? '?'} — {p.slug}
                    </p>
                  </div>
                  <span
                    className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
                      enabled ? 'bg-[#4a6b3f] justify-end' : 'bg-[#4a392d]/20 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#f2ebd9] shadow-sm" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={18} className="text-[#8b5254]" />
            <h3 className="text-xl">Accessibility & Display</h3>
          </div>

          {/* Font Scale */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Type size={15} className="text-[#465f75]/60" />
              <label className="text-sm font-heading text-[#4a392d]">Text Size</label>
              <span className="text-xs text-[#465f75]/55 ml-auto">
                {Math.round(accessibility.fontScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.85}
              max={1.4}
              step={0.05}
              value={accessibility.fontScale}
              onChange={(e) => update({ fontScale: parseFloat(e.target.value) })}
              className="w-full accent-[#8b5254]"
            />
          </div>

          {/* Line Height */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-heading text-[#4a392d]">Line Spacing</label>
              <span className="text-xs text-[#465f75]/55 ml-auto">
                {accessibility.lineHeight.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={1.4}
              max={2.0}
              step={0.1}
              value={accessibility.lineHeight}
              onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
              className="w-full accent-[#8b5254]"
            />
          </div>

          {/* Text Alignment */}
          <div className="mb-4">
            <label className="text-sm font-heading text-[#4a392d] block mb-2">Text Alignment</label>
            <div className="flex gap-2">
              <button
                onClick={() => update({ textAlignment: 'left' })}
                className={`btn-secondary !text-xs flex items-center gap-1 ${accessibility.textAlignment === 'left' ? '!bg-[#4a392d] !text-[#eae1ca]' : ''}`}
              >
                <AlignLeft size={13} /> Left
              </button>
              <button
                onClick={() => update({ textAlignment: 'justify' })}
                className={`btn-secondary !text-xs flex items-center gap-1 ${accessibility.textAlignment === 'justify' ? '!bg-[#4a392d] !text-[#eae1ca]' : ''}`}
              >
                <AlignJustify size={13} /> Justified
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <ToggleRow
              label="High Contrast"
              description="Increase text/background contrast"
              checked={accessibility.highContrast}
              onChange={(v) => update({ highContrast: v })}
            />
            <ToggleRow
              label="Reduce Motion"
              description="Disable animations and transitions"
              checked={accessibility.reduceMotion}
              onChange={(v) => update({ reduceMotion: v })}
            />
            <ToggleRow
              label="Dyslexia-Friendly Font"
              description="Use a font designed for dyslexic readers"
              checked={accessibility.dyslexiaFont}
              onChange={(v) => update({ dyslexiaFont: v })}
            />
          </div>

          <button
            onClick={resetAccessibility}
            className="btn-secondary w-full mt-5 flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Reset to Defaults
          </button>
        </section>
      </aside>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-3 border border-[#4a392d]/20 bg-[#f2ebd9]/50"
    >
      <div className="text-left">
        <p className="text-sm font-heading text-[#4a392d]">{label}</p>
        <p className="text-xs text-[#465f75]/55">{description}</p>
      </div>
      <span
        className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${
          checked ? 'bg-[#4a6b3f] justify-end' : 'bg-[#4a392d]/20 justify-start'
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-[#f2ebd9] shadow-sm" />
      </span>
    </button>
  );
}
