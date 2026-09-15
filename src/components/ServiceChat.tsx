/**
 * Philosophers' Service desk — floating one-to-one tutoring window.
 *
 * Owns its messages and question budget; reports each answered exchange to
 * App for the export transcript. Quota/auth failures surface visibly with a
 * way into Settings — never a silent catch.
 */
import { useEffect, useRef, useState } from 'react';
import { ConciergeBell, Send, X } from 'lucide-react';
import { searchThinkerPassages, type RagGrounding } from '@/lib/rag-ground';
import { extractPassages, formatGroundedBlock, groundableSource } from '@/lib/extract';
import {
  buildServiceSystemPrompt,
  buildServiceUserMessage,
  generateServiceText,
  SERVICE_LIMIT_MESSAGE,
  SERVICE_MAX_QUESTIONS,
  type ServiceHistoryItem,
} from '@/lib/service-chat';
import { LlmError } from '@/lib/llm';
import type { CabinetSettings } from '@/lib/settings';
import type { Intervention, Philosopher, StyleIntensity } from '@/types';

export interface ServiceLogEntry {
  thinker: string;
  question: string;
  answer: string;
  sources: string[];
}

interface ServiceChatProps {
  thinkers: Philosopher[];
  interventions: Intervention[];
  settings: CabinetSettings;
  open: boolean;
  onToggle: () => void;
  onExchange: (entry: ServiceLogEntry) => void;
  onOpenSettings: () => void;
}

type DisplayItem =
  | { kind: 'visitor'; text: string }
  | { kind: 'thinker'; thinker: string; text: string; sources: { title: string; text: string; source_url: string }[] }
  | { kind: 'note'; text: string };

export default function ServiceChat({ thinkers, interventions, settings, open, onToggle, onExchange, onOpenSettings }: ServiceChatProps) {
  const [slug, setSlug] = useState(thinkers[0]?.slug ?? '');
  const [level, setLevel] = useState<StyleIntensity>(settings.intensity);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [items.length, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  if (!open) {
    return (
      <button
        onClick={onToggle}
        aria-label="Open Philosophers' Service desk"
        title="Philosophers' Service — ask a thinker"
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-[#4a392d] text-[#eae1ca] flex items-center justify-center shadow-lg hover:bg-[#8b5254] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/50"
      >
        <ConciergeBell size={24} />
      </button>
    );
  }

  const thinker = thinkers.find((t) => t.slug === slug) ?? thinkers[0];
  if (!thinker) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (asked >= SERVICE_MAX_QUESTIONS) {
      setItems((prev) => [...prev, { kind: 'note', text: SERVICE_LIMIT_MESSAGE }]);
      return;
    }
    setInput('');
    setItems((prev) => [...prev, { kind: 'visitor', text }]);
    setBusy(true);
    try {
      const history: ServiceHistoryItem[] = items
        .filter((item): item is Extract<DisplayItem, { kind: 'visitor' | 'thinker' }> => item.kind !== 'note')
        .map((item) => item.kind === 'visitor'
          ? { role: 'visitor' as const, thinker: '', text: item.text }
          : { role: 'thinker' as const, thinker: item.thinker, text: item.text });
      const tableLines = interventions
        .filter((item) => item.sections?.new_contribution)
        .map((item) => ({
          name: thinkers.find((t) => t.id === item.philosopher_id)?.full_name ?? 'A seat',
          line: String(item.sections?.new_contribution),
        }));
      // Own works only, index first: the resolver keys off this thinker's
      // family name, so other seats' sources can never enter the prompt.
      // Falls back to live page fetching; fails soft like turns. Lean ration
      // on shared/Groq (same 7k wall as turns); history and table lines ride
      // whole regardless — the desk always sees the full debate.
      let groundingBlock = '';
      let grounding: RagGrounding | null = null;
      if (settings.grounding) {
        const lean = settings.provider === 'shared' || settings.provider === 'groq';
        try {
          grounding = await searchThinkerPassages(thinker.full_name, text, lean ? 2 : 5, undefined, lean ? 650 : 0);
          if (grounding) {
            groundingBlock = grounding.block;
          } else {
            const g = groundableSource(thinker.name);
            if (g?.source.source_url) {
              const { passages } = await extractPassages(g.source.source_url, text, '');
              const rationed = lean
                ? passages.slice(0, 2).map((p) => ({ text: p.text.length > 650 ? `${p.text.slice(0, 650)}…` : p.text }))
                : passages;
              groundingBlock = formatGroundedBlock(g.source.title, g.number, rationed);
            }
          }
        } catch {
          // Search unavailable — the tutor answers from profile instead.
        }
      }
      const answer = await generateServiceText(
        settings,
        buildServiceSystemPrompt(thinker, level),
        buildServiceUserMessage({ question: text, history, tableLines, groundingBlock }),
      );
      const sources = grounding?.chunks ?? [];
      setItems((prev) => [...prev, { kind: 'thinker', thinker: thinker.full_name, text: answer, sources }]);
      setAsked((n) => n + 1);
      onExchange({ thinker: thinker.full_name, question: text, answer, sources: [...new Set(sources.map((s) => s.title))] });
    } catch (error) {
      const message = error instanceof LlmError ? error.message : 'The desk dropped your question. Try again.';
      if (typeof console !== 'undefined') console.error('[Service desk] ask failed:', error);
      setItems((prev) => [...prev, { kind: 'note', text: `The desk apologises — ${message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Philosophers' Service desk"
      className="fixed bottom-24 right-5 z-40 w-[min(92vw,380px)] max-h-[70vh] flex flex-col dark-academia-card !p-0 overflow-hidden shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#4a392d]/20">
        <div>
          <h2 className="text-lg leading-tight">Philosophers&rsquo; Service</h2>
          <p className="text-xs italic text-[#465f75]/65">One thinker, at your pace · {asked} / {SERVICE_MAX_QUESTIONS} asked</p>
        </div>
        <button onClick={onToggle} aria-label="Close service desk" className="btn-secondary !px-2 !py-1"><X size={16} /></button>
      </div>
      <div className="px-4 py-2 border-b border-[#4a392d]/15">
        <label htmlFor="service-thinker" className="text-xs uppercase tracking-[0.16em] text-[#4a392d]">Asking</label>
        <select
          id="service-thinker"
          value={thinker.slug}
          onChange={(event) => setSlug(event.target.value)}
          className="w-full mt-1 bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-2 text-sm text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"
        >
          {thinkers.map((t) => <option key={t.slug} value={t.slug}>{t.full_name}</option>)}
        </select>
        <label htmlFor="service-level" className="text-xs uppercase tracking-[0.16em] text-[#4a392d] mt-2 block">Level</label>
        <select
          id="service-level"
          value={level}
          title="How hard the tutor's language hits. Quotes stay verbatim at every level."
          onChange={(event) => setLevel(event.target.value as StyleIntensity)}
          className="w-full mt-1 bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-2 text-sm text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"
        >
          <option value="low">Low — plain words</option>
          <option value="medium">Medium — terms explained</option>
          <option value="high">High — full voice</option>
        </select>
        {!settings.grounding && (
          <p className="text-xs italic text-[#465f75]/60 mt-1">Tip: switch on Grounding in Settings → Cabinet and I can search my own books for passages.</p>
        )}
        {(() => {
          const lines = interventions.filter((item) => item.sections?.new_contribution);
          if (!lines.length) return <p className="text-xs italic text-[#465f75]/60 mt-1">No sitting yet — ask anyway; I answer from my own works.</p>;
          const seats = new Set(lines.map((item) => item.philosopher_id)).size;
          return <p className="text-xs italic text-[#465f75]/60 mt-1">Reading this sitting with you: {lines.length} lines from {seats} {seats === 1 ? 'seat' : 'seats'}.</p>;
        })()}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[140px]" aria-live="polite">
        {items.length === 0 && (
          <p className="text-sm italic text-[#465f75]/65">Ask {thinker.name} anything — definitions come in plain words, with an example and a check question.</p>
        )}
        {items.map((item, i) => item.kind === 'visitor' ? (
          <p key={i} className="ml-8 p-2.5 rounded-sm bg-[#4a392d] text-[#eae1ca] text-sm leading-relaxed">{item.text}</p>
        ) : item.kind === 'thinker' ? (
          <div key={i} className="mr-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8b5254] mb-1">{item.thinker}</p>
            <p className="p-2.5 rounded-sm bg-[#eae1ca]/70 text-sm leading-relaxed text-[#465f75] whitespace-pre-line">{item.text}</p>
            {item.sources.length > 0 && (
              <details className="mt-1.5 text-xs">
                <summary className="cursor-pointer italic text-[#8b5254] underline underline-offset-2 decoration-[#8b5254]/40">
                  Sources used: {[...new Set(item.sources.map((s) => s.title))].join('; ')}
                </summary>
                <div className="mt-1.5 space-y-2">
                  {item.sources.map((s, j) => (
                    <div key={j} className="border-l-2 border-[#b89968] pl-2">
                      <p className="font-heading text-[13px] text-[#4a392d]">{s.title}</p>
                      <p className="text-xs leading-relaxed text-[#465f75]/85 whitespace-pre-line mt-0.5">{s.text}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : (
          <p key={i} className="text-xs italic text-[#8b5254] text-center px-2">{item.text}</p>
        ))}
        {busy && <p className="text-sm italic text-[#465f75]/60" aria-live="polite">{thinker.name} is writing…</p>}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex items-end gap-2 px-3 py-3 border-t border-[#4a392d]/20"
        onSubmit={(event) => { event.preventDefault(); void send(); }}
      >
        <label htmlFor="service-input" className="sr-only">Ask {thinker.name}</label>
        <textarea
          id="service-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
          rows={2}
          placeholder={`Ask ${thinker.name}…`}
          className="flex-1 resize-none bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-2 text-sm leading-relaxed text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send question" className="btn-primary !px-3 !py-2 disabled:opacity-50"><Send size={16} /></button>
      </form>
      <div className="px-4 pb-2">
        <button onClick={onOpenSettings} className="text-xs underline text-[#465f75]/60 hover:text-[#8b5254]">Quota trouble? Open Settings.</button>
      </div>
    </section>
  );
}
