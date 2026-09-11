import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CirclePause,
  CirclePlay,
  Download,
  ExternalLink,
  Feather,
  Info,
  Library,
  RotateCcw,
  ScrollText,
  Settings2,
  Sparkles,
  Square,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_DATA, renderPersona } from '@/philosophers';
import {
  DEFAULT_ACCESSIBILITY,
  PASS_DESCRIPTIONS,
  PASS_NAMES,
  type AccessibilitySettings,
  type Intervention,
  type Philosopher,
  type StyleEssence,
} from '@/types';
import { buildTurnInstruction, buildUserMessage, getTurnKind, STRUCTURED_OUTPUT_HINT } from '@/lib/dialectic/prompts';
import { generateTurn, testApiKey, GeminiError, type GeminiErrorCode, type TurnOutput } from '@/lib/gemini';
import { loadSettings, saveSettings, type CabinetSettings, type GeminiModel, type GroqModel } from '@/lib/settings';
import { applyDisplay, loadDisplay, saveDisplay } from '@/lib/preferences';
import { generateTurnGroq, testGroqKey } from '@/lib/groq';
import { generateTurnShared } from '@/lib/shared';
import { generateTurnOpenRouter, testOpenRouterKey } from '@/lib/openrouter';
import { createTtsController, ensureVoices, isTtsSupported, listVoices, type TtsItem, type TtsStatus } from '@/lib/tts';

// "Read more" resolution: the philosopher's most relevant text from the corpus
// manifest. Prefers an ingested magnum opus (readable right now), then any
// ingested work, then the magnum opus, then whatever is listed first.
function getReadMoreSource(philosopherName: string) {
  const works = CORPUS_SOURCES_DATA.filter((s) =>
    s.author.toLowerCase().includes(philosopherName.toLowerCase()));
  if (!works.length) return null;
  return works.find((s) => s.is_magnum_opus && s.full_text_ingested)
    ?? works.find((s) => s.full_text_ingested)
    ?? works.find((s) => s.is_magnum_opus)
    ?? works[0];
}

function ReadMore({ philosopherName, onNavigate }: { philosopherName: string; onNavigate?: (event: React.MouseEvent) => void }) {
  const source = getReadMoreSource(philosopherName);
  if (!source?.source_url) return null;
  return (
    <a
      href={source.source_url}
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      aria-label={`Read more: ${source.title}`}
      className="inline-flex items-center gap-1.5 text-sm italic text-[#8b5254] underline underline-offset-2 decoration-[#8b5254]/40 hover:decoration-[#8b5254]"
    >
      <ExternalLink size={13} /> Read more: {source.title}
    </a>
  );
}
// Shapes a live Gemini turn into an Intervention. Citations stay unverified
// until the Phase 5 corpus retrieval lands; works_referenced is the model's
// own claim about which works it drew on.
function toIntervention(
  philosopher: Philosopher,
  pass: number,
  index: number,
  output: TurnOutput,
  previousSpeaker: Philosopher | null,
): Intervention {
  const kind = getTurnKind(pass, index + 1);
  const isOpening = kind === 'opening' && !previousSpeaker;
  const citations = output.works_referenced.length > 0
    ? output.works_referenced.map((work) => ({ label: work, verified: false }))
    : [{ label: `[${philosopher.name.toUpperCase()}, SOURCE-GROUNDED PROFILE]`, verified: false }];
  return {
    id: `live-${pass}-${index}`,
    meeting_id: 'live',
    philosopher_id: philosopher.id,
    pass_number: pass,
    seat_position: index,
    response_text: [
      output.negation,
      output.incorporation,
      output.reformulation,
      output.contradiction_passed,
    ].join('\n\n'),
    sections: {
      negation: output.negation,
      incorporation: output.incorporation,
      reformulation: output.reformulation,
      contradiction_passed: output.contradiction_passed,
      new_contribution: output.new_contribution,
    },
    retrieved_chunk_ids: [],
    citations,
    position_label: isOpening
      ? 'Opening'
      : kind === 'reconstruction'
        ? `Reconstruction after ${previousSpeaker?.name ?? 'PREV'}`
        : `Immanent critique of ${previousSpeaker?.name ?? 'PREV'}`,
    created_at: new Date().toISOString(),
  };
}

function App() {
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  const [question, setQuestion] = useState('Should democratic movements use autonomous AI agents for political organisation?');
  const [activePass, setActivePass] = useState(0);
  const [activeAgent, setActiveAgent] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null);
  const [activeSlugs, setActiveSlugs] = useState<string[]>(DEFAULT_SEATING_ORDER);
  const [showSources, setShowSources] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return !localStorage.getItem('dialectical-cabinet:welcomed:v1');
    } catch {
      return true;
    }
  });
  const dismissWelcome = (remember: boolean) => {
    if (remember) {
      try {
        localStorage.setItem('dialectical-cabinet:welcomed:v1', '1');
      } catch {
        // ignore
      }
    }
    setShowWelcome(false);
  };
  const [settings, setSettings] = useState<CabinetSettings>(() => loadSettings());
  const [thinkingName, setThinkingName] = useState<string | null>(null);
  const [runError, setRunError] = useState<{ message: string; code: GeminiErrorCode } | null>(null);
  const runRef = useRef(0);
  const [display, setDisplay] = useState<AccessibilitySettings>(() => loadDisplay());
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>({ state: 'idle' });
  const ttsRef = useRef<ReturnType<typeof createTtsController> | null>(null);

  const updateDisplay = (next: AccessibilitySettings) => {
    setDisplay(next);
    saveDisplay(next);
  };

  useEffect(() => {
    applyDisplay(display);
  }, [display]);

  // Single TTS owner: one queue for per-turn and full-session reads.
  useEffect(() => {
    if (!isTtsSupported()) return;
    ttsRef.current = createTtsController({ rate: display.ttsRate, onStatus: setTtsStatus });
    return () => {
      ttsRef.current?.stop();
      ttsRef.current = null;
    };
  }, [display.ttsRate]);

  // Stop reading when the transcript is cleared or the page unloads.
  useEffect(() => {
    if (interventions.length === 0) ttsRef.current?.stop();
  }, [interventions.length]);
  useEffect(() => {
    const onUnload = () => ttsRef.current?.stop();
    window.addEventListener('pagehide', onUnload);
    return () => window.removeEventListener('pagehide', onUnload);
  }, []);

  const ttsSupported = isTtsSupported();

  const describeIntervention = (item: Intervention): TtsItem => {
    const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
    return {
      id: item.id,
      heading: `Pass ${item.pass_number}, ${philosopher?.full_name ?? 'Unknown'}`,
      text: item.response_text,
    };
  };

  const toggleTurnSpeech = (item: Intervention) => {
    if (!ttsSupported) return;
    if (ttsStatus.state !== 'idle' && ttsStatus.currentId === item.id) {
      ttsRef.current?.stop();
      return;
    }
    ttsRef.current?.speak([describeIntervention(item)]);
  };

  const toggleSessionSpeech = () => {
    if (!ttsSupported || !interventions.length) return;
    if (ttsStatus.state !== 'idle') {
      ttsRef.current?.stop();
      return;
    }
    ttsRef.current?.speak(interventions.map(describeIntervention));
  };

  const updateSettings = (next: CabinetSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  useEffect(() => {
    const load = async () => {
      const local = PHILOSOPHER_DATA.map((item, index) => ({ ...item, id: `local-${item.slug}`, created_at: new Date().toISOString(), seat_order: index }));
      if (!supabase) { setPhilosophers(local); return; }
      const { data } = await supabase.from('philosophers').select('*').order('seat_order');
      setPhilosophers(data && data.length >= DEFAULT_SEATING_ORDER.length ? (data as Philosopher[]) : local);
    };
    void load();
  }, []);

  const orderedPhilosophers = useMemo(() => DEFAULT_SEATING_ORDER
    .map((slug) => philosophers.find((p) => p.slug === slug))
    .filter((p): p is Philosopher => p !== undefined && activeSlugs.includes(p.slug)), [philosophers, activeSlugs]);
  const currentInterventions = interventions.filter((item) => item.pass_number === activePass + 1);
  const currentSpeaker = orderedPhilosophers[activeAgent];
  const providerKey = (s: CabinetSettings) =>
    s.provider === 'shared' ? '' : s.provider === 'openrouter' ? s.openRouterApiKey : s.provider === 'groq' ? s.groqApiKey : s.geminiApiKey;
  const hasKey = settings.provider === 'shared' ? true : providerKey(settings).trim().length > 0;
  const activeKeyLabel = settings.provider === 'shared'
    ? 'Shared cabinet key'
    : settings.provider === 'openrouter' ? 'OpenRouter API key'
    : settings.provider === 'groq' ? 'Groq API key' : 'Gemini API key';
  const activeKeyReady = (s: CabinetSettings) =>
    s.provider === 'shared' ? true : providerKey(s).trim().length > 0;
  const isComplete = orderedPhilosophers.length > 0 && interventions.length >= orderedPhilosophers.length * 3;

  // Async loop over passes × seats (Phase 2f). Each turn sees only the
  // question, PREV's full text, and the speaker's own prior one-liners.
  // The pause flag (runRef) is checked between turns and after each call.
  const runLoop = async (runId: number, seats: Philosopher[], startCount: number, collected: Intervention[], model: GeminiModel) => {
    const snap = { ...settings, model };
    const total = seats.length * 3;
    for (let n = startCount; n < total; n += 1) {
      if (runRef.current !== runId) return;
      const pass = Math.floor(n / seats.length);
      const index = n % seats.length;
      const speaker = seats[index];
      if (!speaker) continue;
      const isOpeningTurn = pass === 0 && index === 0;
      // PREV crosses pass boundaries: pass 2 seat 1 critiques pass 1's last seat.
      const previousSpeaker = isOpeningTurn
        ? null
        : seats[(index - 1 + seats.length) % seats.length] ?? null;
      const isFinalTurn = pass === 2 && index === seats.length - 1;
      const nextSpeaker = isFinalTurn
        ? null
        : seats[(index + 1) % seats.length] ?? null;
      const kind = getTurnKind(pass + 1, index + 1);
      const ownPriorLines = collected
        .filter((item) => item.philosopher_id === speaker.id && item.sections?.new_contribution)
        .map((item) => String(item.sections?.new_contribution));
      const turnInstruction = buildTurnInstruction({
        kind,
        prevName: previousSpeaker?.name ?? null,
        nextName: nextSpeaker?.name ?? null,
        isFinalSeat: isFinalTurn,
        longForm: snap.longForm,
      });
      const systemPrompt = renderPersona(speaker, snap.intensity);
      // Efficient economy trims the fed-back predecessor text (the displayed
      // and exported transcript keeps everything). Voices are untouched —
      // personas are never trimmed.
      const rawPrev = n === 0 ? null : (collected[collected.length - 1]?.response_text ?? null);
      const prevText = rawPrev && snap.economy === 'efficient' && rawPrev.length > 1200
        ? `${rawPrev.slice(0, 1200)}\n[…earlier part trimmed for economy; the full text stands in the transcript]`
        : rawPrev;
      const userMessage = [
        buildUserMessage({
          question,
          prevText,
          ownPriorLines,
          turnInstruction,
        }),
        '',
        STRUCTURED_OUTPUT_HINT,
      ].join('\n');
      setActivePass(pass);
      setActiveAgent(index);
      setThinkingName(speaker.full_name);
      let output: TurnOutput;
      try {
        output = snap.provider === 'shared'
          ? await generateTurnShared({
              systemPrompt,
              userMessage,
              longForm: snap.longForm,
            })
          : snap.provider === 'openrouter'
          ? await generateTurnOpenRouter({
              apiKey: snap.openRouterApiKey,
              systemPrompt,
              userMessage,
              longForm: snap.longForm,
              mode: snap.openRouterMode,
              modelId: snap.openRouterModel,
            })
          : snap.provider === 'groq'
          ? await generateTurnGroq({
              apiKey: snap.groqApiKey,
              model: snap.groqModel,
              systemPrompt,
              userMessage,
              longForm: snap.longForm,
            })
          : await generateTurn({
              apiKey: snap.geminiApiKey,
              model,
              systemPrompt,
              userMessage,
              longForm: snap.longForm,
            });
      } catch (error) {
        if (runRef.current !== runId) return;
        if (error instanceof GeminiError) {
          setRunError({ message: error.message, code: error.code });
        } else {
          setRunError({ message: error instanceof Error ? error.message : 'Unknown error from Gemini.', code: 'unknown' });
        }
        setIsRunning(false);
        setThinkingName(null);
        return;
      }
      if (runRef.current !== runId) return;
      collected.push(toIntervention(speaker, pass + 1, index, output, previousSpeaker));
      setInterventions([...collected]);
    }
    setThinkingName(null);
    setIsRunning(false);
    setActivePass(2);
    setActiveAgent(seats.length - 1);
  };

  const startMeeting = () => {
    if (orderedPhilosophers.length < 2 || !activeKeyReady(settings)) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setInterventions([]);
    setRunError(null);
    setActivePass(0);
    setActiveAgent(0);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], 0, [], settings.model);
  };

  const resumeMeeting = (modelOverride?: GeminiModel) => {
    if (orderedPhilosophers.length < 2 || !activeKeyReady(settings)) return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    // NOTE: this is also used directly as an onClick handler, so the first
    // argument may be a click event — only accept real model IDs.
    const model = typeof modelOverride === 'string' ? modelOverride : settings.model;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], model);
  };

  const switchToLiteAndResume = () => {
    if (orderedPhilosophers.length < 2 || !settings.geminiApiKey.trim()) return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    const next = { ...settings, provider: 'gemini' as const, model: 'gemini-3.5-flash-lite' as GeminiModel };
    updateSettings(next);
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], next.model);
  };

  const switchToGeminiAndResume = () => {
    if (orderedPhilosophers.length < 2 || !settings.geminiApiKey.trim()) return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    const next = { ...settings, provider: 'gemini' as const };
    updateSettings(next);
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], next.model);
  };

  const pauseMeeting = () => {
    runRef.current += 1;
    setIsRunning(false);
    setThinkingName(null);
  };

  const resetMeeting = () => {
    runRef.current += 1;
    ttsRef.current?.stop();
    setIsRunning(false);
    setThinkingName(null);
    setRunError(null);
    setActivePass(0);
    setActiveAgent(-1);
    setInterventions([]);
    setSelectedIntervention(null);
  };

  const exportTranscript = () => {
    const text = [`THE DIALECTICAL CABINET\n\nQUESTION\n${question}\n`, ...interventions.map((item) => {
      const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
      const readMore = philosopher ? getReadMoreSource(philosopher.name) : null;
      return `PASS ${item.pass_number} — ${philosopher?.full_name ?? 'Unknown'}\n\n${item.response_text}\n\n${item.citations.map((citation) => citation.label).join(', ')}\n${readMore?.source_url ? `Read more: ${readMore.title} — ${readMore.source_url}\n` : ''}`;
    })].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dialectical-cabinet-transcript.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const togglePhilosopher = (slug: string) => {
    setActiveSlugs((current) =>
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug]
    );
  };

  // Esc closes the topmost drawer/modal.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedIntervention) setSelectedIntervention(null);
      else if (selectedPhilosopher) setSelectedPhilosopher(null);
      else if (showSettings) setShowSettings(false);
      else if (showSources) setShowSources(false);
      else if (showWelcome) setShowWelcome(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIntervention, selectedPhilosopher, showSettings, showSources, showWelcome]);

  return (
    <div className="min-h-screen parchment-bg-dark">
      <header className="border-b border-[#4a392d]/20 bg-[#eae1ca]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="wax-seal shrink-0"><Feather size={22} color="#eae1ca" /></div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b5254] font-semibold">An experimental reasoning system</p>
              <h1 className="text-2xl md:text-3xl">The Dialectical Cabinet</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[#4a392d]/65">
            <span className="flex items-center gap-2"><Users size={15} /> {orderedPhilosophers.length} {orderedPhilosophers.length === 1 ? 'tradition' : 'traditions'}</span>
            <span className="text-[#b89968]">·</span>
            <span className="flex items-center gap-2"><ScrollText size={15} /> Three passes</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !px-3" onClick={() => setShowWelcome(true)} title="About this cabinet" aria-label="About this cabinet"><Info size={16} /></button>
            <button className="btn-secondary !px-3" onClick={() => setShowSources(!showSources)} title="Corpus manifest" aria-expanded={showSources} aria-label="Corpus manifest"><Library size={16} /></button>
            <button className="btn-secondary !px-3" onClick={() => setShowSettings(!showSettings)} title="Settings" aria-expanded={showSettings} aria-label="Settings"><Settings2 size={16} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-8">
        <section className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b5254] mb-2">Clockwise protocol / {isRunning ? 'in session' : 'at rest'}</p>
                <h2 className="text-4xl md:text-5xl">A question enters.<br /><span className="text-[#8b5254]">A problem emerges.</span></h2>
              </div>
              {isRunning && <div className="flex items-center gap-2 text-sm italic text-[#8b5254]"><span className="w-2 h-2 rounded-full bg-[#cc5f68] speaker-glow" /> Cabinet in motion</div>}
            </div>

            <div className="dark-academia-card p-5 md:p-6 mb-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <label htmlFor="question" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">The contemporary problem</label>
                <span className="text-xs text-[#465f75]/65">The question remains constant; its formulation may change.</span>
              </div>
              <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={isRunning} className="w-full min-h-[92px] resize-y bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-4 text-lg leading-relaxed text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
              <div className="flex flex-wrap gap-3 mt-4">
                <button className="btn-primary flex items-center gap-2" onClick={isRunning ? pauseMeeting : interventions.length ? resumeMeeting : startMeeting} disabled={!question.trim() || orderedPhilosophers.length < 2 || (!isRunning && (!hasKey || isComplete))}>{isRunning ? <><CirclePause size={17} /> Pause circuit</> : <><CirclePlay size={17} /> {isComplete ? 'Cabinet complete' : interventions.length ? 'Resume cabinet' : 'Begin cabinet'}</>}</button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetMeeting}><RotateCcw size={15} /> Restart</button>
                <button className="btn-secondary flex items-center gap-2" onClick={exportTranscript} disabled={!interventions.length}><Download size={15} /> Export</button>
              </div>
              {!hasKey && <p className="text-sm italic text-[#8b5254] mt-3">Add your {activeKeyLabel} in <button className="underline" onClick={() => setShowSettings(true)}>Settings</button> to begin — it stays in this browser only{settings.provider === 'openrouter' ? ', and goes straight to OpenRouter.' : settings.provider === 'groq' ? ', and goes straight to Groq.' : ', and goes straight to Google.'}</p>}
              {runError && (runError.code === 'quota' ? <div role="alert" className="mt-3 p-5 bg-[#8b5254]/10 border-l-2 border-[#8b5254]"><p className="text-xs uppercase tracking-widest text-[#8b5254]">Paused — free-tier quota reached</p><p className="text-sm mt-2 text-[#465f75]">{runError.message}</p><p className="text-sm mt-2 text-[#465f75]">Nothing is lost: {interventions.length} of {orderedPhilosophers.length * 3} interventions are kept, and read-aloud plus export keep working. Quotas reset with time — per-minute caps within minutes, daily caps the next day.</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={() => resumeMeeting()} disabled={!hasKey}>Try resume</button>{settings.provider === 'shared' && <button className="btn-secondary" onClick={() => { setRunError(null); setShowSettings(true); }}>Use my own key instead</button>}{settings.provider === 'gemini' && settings.model !== 'gemini-3.5-flash-lite' && <button className="btn-secondary" onClick={switchToLiteAndResume} disabled={!hasKey}>Switch to Lite & resume</button>}{settings.provider === 'gemini' && <button className="btn-secondary" onClick={() => { updateSettings({ ...settings, provider: 'openrouter' }); setRunError(null); setShowSettings(true); }}>Try OpenRouter free models</button>}{settings.provider === 'openrouter' && settings.geminiApiKey.trim() && <button className="btn-secondary" onClick={switchToGeminiAndResume}>Switch to Gemini & resume</button>}{settings.provider === 'groq' && <button className="btn-secondary" onClick={() => { updateSettings({ ...settings, provider: 'shared' }); setRunError(null); }}>Fall back to shared</button>}<button className="btn-secondary" onClick={() => setShowSettings(true)}>Open settings</button>{settings.provider === 'gemini' ? <a className="btn-secondary" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'openrouter' ? <a className="btn-secondary" href="https://openrouter.ai/activity" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'groq' ? <a className="btn-secondary" href="https://console.groq.com" target="_blank" rel="noreferrer">Check usage</a> : null}<button className="btn-secondary" onClick={() => setRunError(null)}>Dismiss</button></div></div> : <div className="mt-3 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254]"><p className="text-xs uppercase tracking-widest text-[#8b5254]">Cabinet halted</p><p className="text-sm mt-1 text-[#465f75]">{runError.message}</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={resumeMeeting} disabled={!hasKey}>Resume cabinet</button><button className="btn-secondary" onClick={() => setShowSettings(true)}>Open settings</button><button className="btn-secondary" onClick={() => setRunError(null)}>Dismiss</button></div></div>)}
            </div>

            <div className="dark-academia-card p-5 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="pass-indicator text-[#8b5254]">Pass {activePass + 1} / 3</p>
                  <h3 className="text-2xl mt-1">{PASS_NAMES[activePass]}</h3>
                  <p className="italic text-[#465f75]/70">{PASS_DESCRIPTIONS[activePass]}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((pass) => <button key={pass} onClick={() => setActivePass(pass)} className={`w-9 h-9 rounded-full border text-sm font-semibold transition-all ${activePass === pass ? 'bg-[#4a392d] text-[#eae1ca] border-[#4a392d]' : 'border-[#4a392d]/30 text-[#4a392d]/60 hover:border-[#4a392d]'}`}>{pass + 1}</button>)}
                </div>
              </div>

              <CabinetTable philosophers={orderedPhilosophers} activeAgent={activeAgent} activePass={activePass} interventions={interventions} onSelect={(philosopher) => setSelectedPhilosopher(philosopher)} />

              {currentSpeaker && (isRunning || thinkingName) && <div className="mt-6 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254] slide-in-right"><p className="text-xs uppercase tracking-widest text-[#8b5254]">{thinkingName ? `${thinkingName} is thinking…` : 'Currently speaking'}</p><p className="font-heading text-xl text-[#4a392d]">{currentSpeaker.full_name}</p><p className="text-sm italic text-[#465f75]/70 mt-1">The intervention will pass clockwise to {orderedPhilosophers[(activeAgent + 1) % orderedPhilosophers.length]?.name}.</p></div>}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="dark-academia-card p-5">
              <div className="flex items-center gap-3 mb-4"><Sparkles size={18} className="text-[#8b5254]" /><h3 className="text-xl">The spiral</h3></div>
              <SpiralView interventions={interventions} question={question} activePass={activePass} numPhilosophers={orderedPhilosophers.length} />
            </div>
            <div className="dark-academia-card p-5">
              <div className="flex items-center gap-3 mb-4"><BookOpen size={18} className="text-[#8b5254]" /><h3 className="text-xl">Cabinet record</h3></div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#eae1ca]/70 p-3"><p className="text-2xl font-heading text-[#4a392d]">{interventions.length}</p><p className="text-xs uppercase tracking-wider text-[#465f75]/60">Interventions</p></div>
                <div className="bg-[#eae1ca]/70 p-3"><p className="text-2xl font-heading text-[#4a392d]">{new Set(interventions.flatMap((item) => item.citations.map((citation) => citation.label))).size}</p><p className="text-xs uppercase tracking-wider text-[#465f75]/60">References</p></div>
              </div>
              <button className="btn-secondary w-full mt-4 flex justify-center items-center gap-2" onClick={() => setSelectedIntervention(interventions[interventions.length - 1] ?? null)} disabled={!interventions.length}><ScrollText size={15} /> Inspect latest intervention</button>
            </div>
          </aside>
        </section>

        <section className="mt-10">
          <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5"><div><p className="pass-indicator text-[#8b5254]">The developing transcript</p><h2 className="text-3xl">Voices around the table</h2></div><div className="flex flex-col items-end gap-2"><p className="hidden md:block max-w-md text-right italic text-[#465f75]/65">Select an intervention to inspect its argument and source status. Earlier positions are preserved.</p>{ttsSupported && interventions.length > 0 && <button className="btn-secondary flex items-center gap-2" onClick={toggleSessionSpeech} aria-label={ttsStatus.state !== 'idle' ? 'Stop reading the full session aloud' : 'Read the full session aloud'}>{ttsStatus.state !== 'idle' ? <><Square size={15} /> Stop reading ({ttsStatus.position}/{ttsStatus.total})</> : <><Volume2 size={15} /> Read full session aloud</>}</button>}</div></div>
          <p className="sr-only" aria-live="polite">{ttsStatus.state === 'idle' ? '' : ttsStatus.state === 'paused' ? `Reading paused at item ${ttsStatus.position} of ${ttsStatus.total}.` : `Reading item ${ttsStatus.position} of ${ttsStatus.total}.`}</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentInterventions.length ? currentInterventions.map((intervention) => { const philosopher = philosophers.find((p) => p.id === intervention.philosopher_id); return philosopher ? <InterventionCard key={intervention.id} intervention={intervention} philosopher={philosopher} onClick={() => setSelectedIntervention(intervention)} ttsSupported={ttsSupported} speaking={ttsStatus.state !== 'idle' && ttsStatus.currentId === intervention.id} paused={ttsStatus.state === 'paused' && ttsStatus.currentId === intervention.id} onToggleSpeech={() => toggleTurnSpeech(intervention)} /> : null; }) : <div className="md:col-span-2 xl:col-span-3 dark-academia-card p-10 text-center"><Feather size={28} className="mx-auto text-[#b89968] mb-3" /><p className="font-heading text-2xl text-[#4a392d]">The cabinet awaits its question.</p><p className="italic text-[#465f75]/65 mt-2">Begin the circuit to watch the problem transform one intervention at a time.</p></div>}
          </div>
        </section>

        {interventions.length > orderedPhilosophers.length && <PositionComparison philosophers={orderedPhilosophers} interventions={interventions} />}
      </main>

      {showSources && <SourceDrawer onClose={() => setShowSources(false)} />}
      {showWelcome && <WelcomeModal onClose={dismissWelcome} onOpenSettings={() => { setShowWelcome(false); setShowSettings(true); }} />}      {showSettings && <SettingsDrawer philosophers={philosophers} activeSlugs={activeSlugs} togglePhilosopher={togglePhilosopher} settings={settings} onSettingsChange={updateSettings} display={display} onDisplayChange={updateDisplay} onClose={() => setShowSettings(false)} />}
      {selectedIntervention && <InterventionModal intervention={selectedIntervention} philosopher={philosophers.find((p) => p.id === selectedIntervention.philosopher_id)} onClose={() => { ttsRef.current?.stop(); setSelectedIntervention(null); }} ttsSupported={ttsSupported} speaking={ttsStatus.state !== 'idle' && ttsStatus.currentId === selectedIntervention.id} onToggleSpeech={() => toggleTurnSpeech(selectedIntervention)} />}
      {selectedPhilosopher && <ProfileModal philosopher={selectedPhilosopher} onClose={() => setSelectedPhilosopher(null)} />}
    </div>
  );
}

function CabinetTable({ philosophers, activeAgent, activePass, interventions, onSelect }: { philosophers: Philosopher[]; activeAgent: number; activePass: number; interventions: Intervention[]; onSelect: (philosopher: Philosopher) => void }) {
  return <div className="relative w-full max-w-[760px] mx-auto aspect-square min-h-[390px] md:min-h-[560px] flex items-center justify-center"><div className="absolute w-[48%] h-[34%] rounded-[50%] border-[10px] border-[#4a392d]/80 bg-[#6d4c37]/10 shadow-[inset_0_0_40px_rgba(74,57,45,0.2),0_8px_24px_rgba(74,57,45,0.2)]"><div className="absolute inset-3 rounded-[50%] border border-[#b89968]/50 flex flex-col items-center justify-center text-center"><span className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">The cabinet</span><span className="font-heading text-lg md:text-2xl text-[#4a392d]">A dialectical spiral</span><span className="text-xs italic text-[#465f75]/60 mt-1">clockwise · sequential · unresolved</span></div></div><div className="absolute inset-[8%] rotation-arrow pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#8b5254]"><ArrowRight size={22} /></div></div>{philosophers.map((philosopher, index) => { const angle = (index / philosophers.length) * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 42; const y = 50 + Math.sin(angle) * 42; const isActive = activeAgent === index; const hasSpoken = interventions.some((item) => item.pass_number === activePass + 1 && item.seat_position === index); return <button key={philosopher.slug} onClick={() => onSelect(philosopher)} aria-label={`Seat ${index + 1}: ${philosopher.full_name}`} className={`cabinet-seat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${isActive ? 'cabinet-seat-active' : ''} ${hasSpoken ? 'cabinet-seat-spoken' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}><span className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center bg-[#f2ebd9] ${isActive ? 'speaker-glow border-[#cc5f68]' : 'border-[#4a392d]/35'}`} style={{ borderColor: isActive ? undefined : philosopher.accent_color }}><span className="font-heading text-lg md:text-2xl" style={{ color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span></span><span className="font-heading text-xs md:text-sm text-[#4a392d] whitespace-nowrap">{philosopher.name}</span><span className="text-[9px] uppercase tracking-wider text-[#465f75]/55">Seat {index + 1}</span></button>; })}</div>;
}

function InterventionCard({ intervention, philosopher, onClick, ttsSupported, speaking, paused, onToggleSpeech }: { intervention: Intervention; philosopher: Philosopher; onClick: () => void; ttsSupported?: boolean; speaking?: boolean; paused?: boolean; onToggleSpeech?: () => void }) { return <article className={`dark-academia-card text-left p-5 w-full ${speaking ? 'tts-reading' : ''}`}><button onClick={onClick} className="w-full text-left" aria-label={`Inspect intervention by ${philosopher.full_name}`}><div className="flex items-start justify-between gap-3 mb-3"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><div><p className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</p><p className="text-[10px] uppercase tracking-wider text-[#8b5254]">Seat {intervention.seat_position + 1}</p></div></div><ChevronDown size={16} className="text-[#4a392d]/50" /></div><p className="drop-cap text-[15px] leading-relaxed text-[#465f75]">{intervention.response_text}</p></button><div className="mt-3"><ReadMore philosopherName={philosopher.name} onNavigate={(event) => event.stopPropagation()} /></div>{ttsSupported && <div className="mt-3"><button onClick={(event) => { event.stopPropagation(); onToggleSpeech?.(); }} className="btn-secondary !text-xs flex items-center gap-2" aria-label={speaking ? `Stop reading intervention by ${philosopher.full_name}` : `Listen to intervention by ${philosopher.full_name}`}>{speaking ? <><Square size={13} /> {paused ? 'Paused — stop' : 'Stop reading'}</> : <><Volume2 size={13} /> Listen</>}</button></div>}<div className="flex flex-wrap gap-1 mt-4">{intervention.citations.map((citation) => <span key={citation.label} className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={10} /> {citation.label}</span>)}</div></article>; }

function SpiralView({ interventions, question, activePass, numPhilosophers }: { interventions: Intervention[]; question: string; activePass: number; numPhilosophers: number }) { const labels = ['The question', 'Problem map', 'Dialectical map', 'Spiral synthesis']; return <div className="space-y-2">{labels.map((label, index) => { const isVisible = index === 0 || interventions.length >= index * numPhilosophers; const text = index === 0 ? question : index === 1 ? 'First rotation chained: seat 1 opens, each later seat negates its immediate predecessor.' : index === 2 ? 'Second rotation continues across the boundary; each turn critiques PREV and hands a contradiction on.' : 'Reconstruction rotation: institutions, practices, collective power; final seat returns the question.'; return <div key={label} className={`relative pl-8 ${isVisible ? 'opacity-100' : 'opacity-35'} transition-opacity`}><div className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${index <= activePass + 1 ? 'bg-[#8b5254] text-[#f2ebd9] border-[#8b5254]' : 'border-[#4a392d]/30 text-[#4a392d]/50'}`}>{index}</div>{index < 3 && <div className="absolute left-[9px] top-6 h-8 border-l border-dashed border-[#b89968]" />}<p className="text-xs uppercase tracking-wider text-[#8b5254]">{label}</p><p className="text-sm italic text-[#465f75]/75 leading-snug mt-1">{text}</p></div>; })}</div>; }

function PositionComparison({ philosophers, interventions }: { philosophers: Philosopher[]; interventions: Intervention[] }) { return <section className="mt-12"><div className="ornament-divider mb-6"><span className="text-xl">✦</span></div><p className="pass-indicator text-[#8b5254]">Memory across passes</p><h2 className="text-3xl mb-5">Position changes</h2><div className="grid lg:grid-cols-3 gap-4">{philosophers.map((philosopher) => <div key={philosopher.id} className="dark-academia-card p-5"><h3 className="text-xl mb-3">{philosopher.name}</h3>{[1, 2, 3].map((pass) => { const item = interventions.find((entry) => entry.philosopher_id === philosopher.id && entry.pass_number === pass); return <div key={pass} className="border-t border-[#4a392d]/15 pt-3 mt-3"><p className="text-[10px] uppercase tracking-widest text-[#8b5254]">Pass {pass} · {PASS_NAMES[pass - 1]}</p><p className="text-sm mt-1 line-clamp-6 text-[#465f75]/80">{item?.response_text ?? 'Awaiting intervention.'}</p></div>; })}</div>)}</div></section>; }

function WelcomeModal({ onClose, onOpenSettings }: { onClose: (remember: boolean) => void; onOpenSettings: () => void }) {
  const [remember, setRemember] = useState(true);
  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onClose(remember)}>
      <div role="dialog" aria-modal="true" aria-label="About the Dialectical Cabinet" className="dark-academia-card max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}>
        <p className="pass-indicator text-[#8b5254]">The assembly is convened</p>
        <h2 className="text-3xl mt-1">How this cabinet works</h2>
        <div className="space-y-4 mt-5 text-[15px] leading-relaxed text-[#465f75]">
          <p><span className="drop-cap">N</span>o single seat at this table holds the truth of your question — and none is permitted to. Ten thinkers are convened, from Spinoza to Fisher, and each may speak only against its immediate predecessor: negating it on its own premises, preserving what holds, and handing a contradiction clockwise to the next. If anything true appears here, it appears <em>between</em> the seats, in the contradictions forced into the open across three passes — never handed down from any one authority.</p>
          <p>Pose your question above and press <strong>Begin cabinet</strong>. The reconstruction pass returns the question to you at the end, changed by everything it has passed through. What you do with it then is yours to decide face to face with your own conscience — no vanguard, party, or apparatus decides for you.</p>
          <p>A practical word on scale. All ten are convened by default, and a full sitting is thirty turns. Five seats make the leaner assembly — roughly half the tokens with the dialectical arc intact. Choose them in Settings → Cabinet; the chronological order is never broken, only shortened.</p>
          <p>On power and its limits: the cabinet opens on a shared key, a commons of sorts, and like every commons it can run dry. When it does, bring your own — Gemini, OpenRouter and Groq all cost nothing on their free tiers. Your keys never leave your browser.</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-[#465f75] mt-6"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="w-4 h-4 accent-[#8b5254]" /> Don’t show this again</label>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn-primary" onClick={() => onClose(remember)}>Convene the cabinet</button>
          <button className="btn-secondary" onClick={onOpenSettings}>Open settings</button>
        </div>
      </div>
    </div>
  );
}

function SourceDrawer({ onClose }: { onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-xl parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-6"><div><p className="pass-indicator text-[#8b5254]">Corpus manifest</p><h2 className="text-3xl">The sources</h2><p className="italic text-[#465f75]/65 mt-1">Provenance before performance.</p></div><button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button></div><div className="space-y-3">{CORPUS_SOURCES_DATA.map((source) => <div key={`${source.author}-${source.title}`} className="border-b border-[#4a392d]/15 pb-3"><div className="flex justify-between gap-3"><p className="font-heading text-base text-[#4a392d]">{source.title}</p><span className={`text-[9px] whitespace-nowrap uppercase tracking-wider ${source.full_text_ingested ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{source.full_text_ingested ? 'Full text' : 'Metadata'}</span></div><p className="text-sm text-[#465f75]/70">{source.author} · {source.publication_date}</p><p className="text-[10px] uppercase tracking-widest text-[#8b5254]/80 mt-1">{source.licence_status}</p></div>)}</div></aside></div>; }

function SettingsDrawer({ philosophers, activeSlugs, togglePhilosopher, settings, onSettingsChange, display, onDisplayChange, onClose }: { philosophers: Philosopher[]; activeSlugs: string[]; togglePhilosopher: (slug: string) => void; settings: CabinetSettings; onSettingsChange: (next: CabinetSettings) => void; display: AccessibilitySettings; onDisplayChange: (next: AccessibilitySettings) => void; onClose: () => void }) {
  const [keyInput, setKeyInput] = useState(settings.geminiApiKey);
  const [orKeyInput, setOrKeyInput] = useState(settings.openRouterApiKey);
  const [groqKeyInput, setGroqKeyInput] = useState(settings.groqApiKey);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [tab, setTab] = useState<'key' | 'cabinet' | 'display'>('key');
  const usingOpenRouter = settings.provider === 'openrouter';
  const usingGroq = settings.provider === 'groq';
  const activeKeyInput = usingGroq ? groqKeyInput : usingOpenRouter ? orKeyInput : keyInput;
  const activeStoredKey = usingGroq ? settings.groqApiKey : usingOpenRouter ? settings.openRouterApiKey : settings.geminiApiKey;
  const keySaved = activeKeyInput === activeStoredKey && activeStoredKey.length > 0;
  const runTest = async () => {
    const key = activeKeyInput.trim();
    if (!key) return;
    setTestState('testing');
    setTestMessage('');
    try {
      if (usingGroq) {
        await testGroqKey(key, settings.groqModel);
        setTestState('ok');
        setTestMessage(`Key works on ${settings.groqModel}. Saved for this browser.`);
        onSettingsChange({ ...settings, groqApiKey: key });
      } else if (usingOpenRouter) {
        const modelUsed = await testOpenRouterKey(key, settings.openRouterMode, settings.openRouterModel);
        setTestState('ok');
        setTestMessage(`Key works (via ${modelUsed}). Saved for this browser.`);
        onSettingsChange({ ...settings, openRouterApiKey: key });
      } else {
        await testApiKey(key, settings.model);
        setTestState('ok');
        setTestMessage('Key works. Saved for this browser.');
        onSettingsChange({ ...settings, geminiApiKey: key });
      }
    } catch (error) {
      setTestState('error');
      setTestMessage(error instanceof Error ? error.message : 'Key test failed.');
    }
  };
  const clearKey = () => {
    setTestState('idle');
    setTestMessage('');
    if (usingGroq) {
      setGroqKeyInput('');
      onSettingsChange({ ...settings, groqApiKey: '' });
    } else if (usingOpenRouter) {
      setOrKeyInput('');
      onSettingsChange({ ...settings, openRouterApiKey: '' });
    } else {
      setKeyInput('');
      onSettingsChange({ ...settings, geminiApiKey: '' });
    }
  };
  const updateDisplay = (partial: Partial<AccessibilitySettings>) => {
    const next = { ...display, ...partial };
    // Keep the legacy boolean in sync with the tri-state font.
    if (partial.font) next.dyslexiaFont = partial.font === 'dyslexia';
    if (typeof partial.dyslexiaFont === 'boolean') next.font = partial.dyslexiaFont ? 'dyslexia' : (next.font === 'dyslexia' ? 'sans' : next.font);
    onDisplayChange(next);
  };
  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}>
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md parchment-bg p-6 md:p-8 overflow-y-auto" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="pass-indicator text-[#8b5254]">Bring your own key</p>
            <h2 className="text-3xl">Settings</h2>
            <p className="italic text-[#465f75]/65 mt-1">Your own keys stay in this browser only (Gemini → Google, OpenRouter → OpenRouter, whose free models may log prompts for training). The shared cabinet key never leaves the server. Nothing is logged or collected here.</p>
          </div>
          <button className="btn-secondary !px-3" onClick={onClose} aria-label="Close settings"><X size={17} /></button>
        </div>
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Settings sections">
          {(['key', 'cabinet', 'display'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn-secondary capitalize ${tab === t ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>
              {t === 'key' ? 'Key' : t === 'cabinet' ? 'Cabinet' : 'Display'}
            </button>
          ))}
        </div>
        {tab === 'key' && (
          <div className="space-y-3 border-b border-[#4a392d]/15 pb-6 mb-6">
            <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] block">Provider</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="AI provider">
              <button role="radio" aria-checked={settings.provider === 'shared'} onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'shared' }); }} className={`btn-secondary ${settings.provider === 'shared' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Cabinet shared</button>
              <button role="radio" aria-checked={settings.provider === 'gemini'} onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'gemini' }); }} className={`btn-secondary ${settings.provider === 'gemini' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Gemini direct</button>
              <button role="radio" aria-checked={usingOpenRouter} onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'openrouter' }); }} className={`btn-secondary ${usingOpenRouter ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>OpenRouter free cycle</button>
              <button role="radio" aria-checked={usingGroq} onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'groq' }); }} className={`btn-secondary ${usingGroq ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Groq free</button>
            </div>
            {settings.provider === 'shared' ? (
              <p className="text-xs text-[#465f75]/70">No key needed — the cabinet runs on its own Groq-backed key, held server-side and shared across visitors (about two full sessions a day each). If the shared quota runs dry, add your own Gemini or OpenRouter key below by switching provider.</p>
            ) : usingGroq ? (
              <>
                <label htmlFor="groq-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Groq API key (free)</label>
                <input id="groq-key" type="password" autoComplete="off" value={groqKeyInput} onChange={(event) => { setGroqKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from console.groq.com" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!groqKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!groqKeyInput && !settings.groqApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Free tier, no card: 30 requests/min, ~1K/day shared across your uses. Get a key at <a className="underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com</a>.</p>
                <label htmlFor="groq-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model</label>
                <select id="groq-model" value={settings.groqModel} onChange={(event) => onSettingsChange({ ...settings, groqModel: event.target.value as GroqModel })} className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30">
                  <option value="qwen/qwen3.8-27b">qwen3.8-27b (better quality, free tier)</option>
                  <option value="qwen/qwen3.6-27b">qwen3.6-27b (alternative voice, free tier)</option>
                  <option value="qwen/qwen3.8-27b">qwen3.8-27b (alternative voice)</option>
                  <option value="qwen/qwen3.6-27b">qwen3.6-27b (alternative voice)</option>
                </select>
              </>
            ) : usingOpenRouter ? (
              <>
                <label htmlFor="or-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">OpenRouter API key</label>
                <input id="or-key" type="password" autoComplete="off" value={orKeyInput} onChange={(event) => { setOrKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from openrouter.ai/keys" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!orKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!orKeyInput && !settings.openRouterApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Get a free key at <a className="underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> (no card needed).</p>
                <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model choice</span>
                <div className="flex gap-2" role="radiogroup" aria-label="OpenRouter model choice">
                  <button role="radio" aria-checked={settings.openRouterMode === 'free'} onClick={() => onSettingsChange({ ...settings, openRouterMode: 'free' })} className={`btn-secondary ${settings.openRouterMode === 'free' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Free cycle</button>
                  <button role="radio" aria-checked={settings.openRouterMode === 'paid'} onClick={() => onSettingsChange({ ...settings, openRouterMode: 'paid' })} className={`btn-secondary ${settings.openRouterMode === 'paid' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Paid model</button>
                </div>
                {settings.openRouterMode === 'free' ? (
                  <p className="text-xs text-[#465f75]/70">Each turn tries free models in order — Gemma, Nemotron, Nex, Laguna and others — moving to the next when one is limited, down, or retired. OpenRouter's own free router is the last resort, so a stale list degrades voices rather than halting. Limits apply per model, so cycling stretches the free quota across a session.</p>
                ) : (
                  <>
                    <label htmlFor="or-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-1 block">Paid model ID</label>
                    <input id="or-model" type="text" autoComplete="off" spellCheck={false} value={settings.openRouterModel} onChange={(event) => { onSettingsChange({ ...settings, openRouterModel: event.target.value }); setTestState('idle'); setTestMessage(''); }} placeholder="deepseek/deepseek-v4.1-flash" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                    <p className="text-xs text-[#465f75]/70">Higher quality with much bigger limits than free — needs credits on your key. Default <span className="font-heading">deepseek/deepseek-v4.1-flash</span> ($0.15/$0.60 per 1M, 1M context). Browse non-OpenAI IDs at <a className="underline" href="https://openrouter.ai/models" target="_blank" rel="noreferrer">openrouter.ai/models</a>. If a paid model reports a daily limit, check the key's own cap at <a className="underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> — new credit can take minutes to apply.</p>
                  </>
                )}
              </>
            ) : (
              <>
                <label htmlFor="gemini-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Gemini API key</label>
                <input id="gemini-key" type="password" autoComplete="off" value={keyInput} onChange={(event) => { setKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from Google AI Studio" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!keyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!keyInput && !settings.geminiApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Get a free key at <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>. Without a key the cabinet cannot begin.</p>
                <label htmlFor="gemini-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model</label>
                <select id="gemini-model" value={settings.model} onChange={(event) => onSettingsChange({ ...settings, model: event.target.value as GeminiModel })} className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30">
                  <option value="gemini-3.6-flash">gemini-3.6-flash (better quality, recommended)</option>
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (maxes the free tier)</option>
                </select>
              </>
            )}
            <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Style intensity (all seats)</span>
            <div className="flex gap-2">{(['low', 'medium', 'high'] as const).map((level) => <button key={level} onClick={() => onSettingsChange({ ...settings, intensity: level })} className={`btn-secondary capitalize ${settings.intensity === level ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>{level}</button>)}</div>
            <label className="flex items-center gap-3 text-[15px] text-[#465f75] pt-1"><input type="checkbox" checked={settings.longForm} onChange={(event) => onSettingsChange({ ...settings, longForm: event.target.checked })} className="w-4 h-4 accent-[#8b5254]" /> Long form (~400 words/turn instead of ~150)</label>
            <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Turn economy</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Turn economy">
              <button role="radio" aria-checked={settings.economy === 'full'} onClick={() => onSettingsChange({ ...settings, economy: 'full' })} className={`btn-secondary ${settings.economy === 'full' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Full</button>
              <button role="radio" aria-checked={settings.economy === 'efficient'} onClick={() => onSettingsChange({ ...settings, economy: 'efficient' })} className={`btn-secondary ${settings.economy === 'efficient' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Efficient</button>
            </div>
            <p className="text-xs text-[#465f75]/70">Efficient trims the predecessor text fed back each turn (shown and exported in full regardless). Voices are untouched — personas are never trimmed. Roughly a third fewer input tokens.</p>
          </div>
        )}
        {tab === 'cabinet' && (
          <div>
            <div className="flex items-start justify-between mb-4"><div><p className="pass-indicator text-[#8b5254]">Experimental variable</p><h2 className="text-2xl">Cabinet selection</h2></div></div>
            <div className="space-y-2">{DEFAULT_SEATING_ORDER.map((slug) => {
              const philosopher = philosophers.find((item) => item.slug === slug);
              const isActive = activeSlugs.includes(slug);
              if (!philosopher) return null;
              return <button key={slug} onClick={() => togglePhilosopher(slug)} aria-pressed={isActive} className={`w-full flex items-center gap-3 p-3 border transition-all ${isActive ? 'bg-[#f2ebd9]/65 border-[#4a392d]/40' : 'bg-transparent border-[#4a392d]/10 opacity-50 hover:opacity-80'}`}><div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${isActive ? 'bg-[#8b5254] border-[#8b5254]' : 'border-[#4a392d]/30'}`}>{isActive && <X size={12} className="text-white" />}</div><span className="w-8 h-8 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><span className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</span></button>;
            })}</div>
            <p className="text-xs italic text-[#465f75]/60 mt-5">The baton passes only to active thinkers, always to the immediate next seat. The dialectical order remains fixed to preserve the historical-conceptual movement.</p>
            <p className="text-xs text-[#465f75]/70 mt-2">{activeSlugs.length} thinkers × 3 passes = {activeSlugs.length * 3} turns{activeSlugs.length > 5 ? ' — five seats (≈15 turns) is the recommended session; it halves token use with the arc intact.' : ' — a lean session.'}</p>
          </div>
        )}
        {tab === 'display' && (
          <DisplayTab display={display} onChange={updateDisplay} />
        )}
      </aside>
    </div>
  );
}

function DisplayTab({ display, onChange }: { display: AccessibilitySettings; onChange: (partial: Partial<AccessibilitySettings>) => void }) {
  const [voices, setVoices] = useState<{ name: string; lang: string; localService: boolean; isDefault: boolean }[]>([]);
  useEffect(() => {
    if (!isTtsSupported()) return;
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  const [previewState, setPreviewState] = useState<'idle' | 'playing'>('idle');
  const testVoice = () => {
    if (!isTtsSupported()) return;
    if (previewState === 'playing') {
      window.speechSynthesis.cancel();
      setPreviewState('idle');
      return;
    }
    setPreviewState('playing');
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    void ensureVoices().then(() => {
      const utter = new SpeechSynthesisUtterance('The cabinet is in session. Each voice passes its contradiction clockwise.');
      utter.rate = display.ttsRate;
      utter.lang = 'en-GB';
      utter.onend = () => setPreviewState('idle');
      utter.onerror = () => setPreviewState('idle');
      window.speechSynthesis.speak(utter);
    });
  };
  const themes: { id: AccessibilitySettings['theme']; label: string; hint: string; bg: string; fg: string }[] = [
    { id: 'parchment', label: 'Parchment', hint: 'Original dark academia', bg: '#eae1ca', fg: '#4a392d' },
    { id: 'dim', label: 'Dim parchment', hint: 'Softer light', bg: '#ddd2b8', fg: '#413023' },
    { id: 'ink', label: 'Ink dark', hint: 'Night session', bg: '#241a12', fg: '#ecdfc4' },
  ];
  const fonts: { id: AccessibilitySettings['font']; label: string; hint: string }[] = [
    { id: 'academia', label: 'Academia serif', hint: 'Original Fell + Alegreya' },
    { id: 'sans', label: 'Readable sans', hint: 'System sans' },
    { id: 'dyslexia', label: 'Dyslexia-friendly', hint: 'Wider spacing, no drop cap' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] mb-1">Theme</p>
        <p className="text-xs italic text-[#465f75]/70 mb-3">Background and text always change together so every pair stays legible.</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Colour theme">
          {themes.map((t) => (
            <button key={t.id} role="radio" aria-checked={display.theme === t.id} onClick={() => onChange({ theme: t.id })} className={`border p-2 text-left transition-all ${display.theme === t.id ? 'border-[#8b5254] ring-2 ring-[#8b5254]/30' : 'border-[#4a392d]/25'}`}>
              <span className="block rounded-sm border border-black/10 px-2 py-3 font-heading text-lg leading-none" style={{ backgroundColor: t.bg, color: t.fg }}>Aa</span>
              <span className="block text-sm font-heading text-[#4a392d] mt-2">{t.label}</span>
              <span className="block text-[11px] italic text-[#465f75]/70">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] mb-1">Typeface</p>
        <p className="text-xs italic text-[#465f75]/70 mb-3">Parchment default; change only if it reads better for you.</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Typeface">
          {fonts.map((f) => (
            <button key={f.id} role="radio" aria-checked={display.font === f.id} onClick={() => onChange({ font: f.id })} className={`border p-2 text-left transition-all ${display.font === f.id ? 'border-[#8b5254] ring-2 ring-[#8b5254]/30' : 'border-[#4a392d]/25'}`}>
              <span className="block text-xl" style={f.id === 'sans' ? { fontFamily: 'Verdana, sans-serif' } : f.id === 'dyslexia' ? { fontFamily: 'Verdana, sans-serif', letterSpacing: '0.04em' } : undefined}>Aa</span>
              <span className="block text-sm font-heading text-[#4a392d] mt-1">{f.label}</span>
              <span className="block text-[11px] italic text-[#465f75]/70">{f.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="display-font-scale" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Text size</label>
          <span className="text-xs text-[#465f75]/60">{Math.round(display.fontScale * 100)}%</span>
        </div>
        <input id="display-font-scale" type="range" min={0.85} max={1.4} step={0.05} value={display.fontScale} onChange={(e) => onChange({ fontScale: parseFloat(e.target.value) })} className="w-full accent-[#8b5254]" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="display-line-height" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Line spacing</label>
          <span className="text-xs text-[#465f75]/60">{display.lineHeight.toFixed(1)}</span>
        </div>
        <input id="display-line-height" type="range" min={1.4} max={2.0} step={0.1} value={display.lineHeight} onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) })} className="w-full accent-[#8b5254]" />
      </div>
      <div className="space-y-2">
        <DisplayToggle label="High contrast" hint="Deepens text and borders on the current theme" checked={display.highContrast} onChange={(v) => onChange({ highContrast: v })} />
        <DisplayToggle label="Reduce motion" hint="Stops the rotation glow and transitions" checked={display.reduceMotion} onChange={(v) => onChange({ reduceMotion: v })} />
      </div>
      <div>
        <p className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] mb-1">Read aloud (free)</p>
        <p className="text-xs italic text-[#465f75]/70 mb-3">Uses your browser's built-in speech — no key, no cost, nothing leaves this page. It always speaks in the listener's own device-default voice, so every visitor hears their own.</p>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="tts-rate" className="text-sm text-[#4a392d]">Speaking rate</label>
          <span className="text-xs text-[#465f75]/60">{display.ttsRate.toFixed(2)}×</span>
        </div>
        <input id="tts-rate" type="range" min={0.8} max={1.3} step={0.05} value={display.ttsRate} onChange={(e) => onChange({ ttsRate: parseFloat(e.target.value) })} className="w-full accent-[#8b5254]" />
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn-secondary !text-xs flex items-center gap-2" onClick={testVoice} disabled={!isTtsSupported()}><Volume2 size={13} /> {previewState === 'playing' ? 'Stop preview' : 'Preview voice'}</button>
        </div>
        {!isTtsSupported() && <p className="text-xs italic text-[#8b5254] mt-2">This browser has no built-in speech — Listen buttons are hidden.</p>}
        <details className="mt-3 border border-[#4a392d]/20 rounded-sm">
          <summary className="cursor-pointer p-3 text-sm font-heading text-[#4a392d]">Voices on this device ({voices.length})</summary>
          <ul className="px-4 pb-3 space-y-1 max-h-48 overflow-y-auto custom-scroll">
            {voices.map((v) => (
              <li key={`${v.name}-${v.lang}`} className="text-xs text-[#465f75]">{v.name} <span className="text-[#465f75]/60">· {v.lang}{v.localService ? ' · on-device' : ''}{v.isDefault ? ' · default' : ''}</span></li>
            ))}
            {!voices.length && <li className="text-xs italic text-[#465f75]/60">No voices loaded yet — close and reopen Settings, then expand again.</li>}
          </ul>
        </details>
      </div>
      <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={() => onChange({ ...DEFAULT_ACCESSIBILITY })}><RotateCcw size={14} /> Reset display to parchment default</button>
    </div>
  );
}

function DisplayToggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} aria-pressed={checked} className="w-full flex items-center justify-between gap-3 p-3 border border-[#4a392d]/20 bg-[#f2ebd9]/50 text-left">
      <span><span className="block text-sm font-heading text-[#4a392d]">{label}</span><span className="block text-xs text-[#465f75]/60">{hint}</span></span>
      <span className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all shrink-0 ${checked ? 'bg-[#4a6b3f] justify-end' : 'bg-[#4a392d]/20 justify-start'}`}><span className="w-5 h-5 rounded-full bg-[#f2ebd9] shadow-sm" /></span>
    </button>
  );
}


function InterventionModal({ intervention, philosopher, onClose, ttsSupported, speaking, onToggleSpeech }: { intervention: Intervention; philosopher?: Philosopher; onClose: () => void; ttsSupported?: boolean; speaking?: boolean; onToggleSpeech?: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={`Intervention by ${philosopher?.full_name ?? 'unknown thinker'}`} className="dark-academia-card max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="pass-indicator text-[#8b5254]">Pass {intervention.pass_number} · {PASS_NAMES[intervention.pass_number - 1]}</p><h2 className="text-3xl">{philosopher?.full_name}</h2><p className="italic text-[#465f75]/65">{intervention.position_label}</p></div><div className="flex flex-col items-end gap-2"><button className="btn-secondary !px-3 h-fit" onClick={onClose} aria-label="Close intervention"><X size={17} /></button>{ttsSupported && <button className="btn-secondary !text-xs flex items-center gap-2" onClick={onToggleSpeech} aria-label={speaking ? 'Stop reading this intervention' : 'Listen to this intervention'}>{speaking ? <><Square size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}</button>}</div></div><p className="drop-cap text-lg leading-relaxed mt-6 whitespace-pre-line text-[#465f75]">{intervention.response_text}</p>{philosopher && <div className="mt-4"><ReadMore philosopherName={philosopher.name} /></div>}<div className="mt-7 border-t border-[#4a392d]/20 pt-5"><p className="font-heading text-xl text-[#4a392d] mb-3">Source status</p>{intervention.citations.map((citation) => <div key={citation.label} className="p-3 bg-[#eae1ca]/60 border border-[#4a392d]/15 mb-2"><span className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={11} /> {citation.label}</span><p className="text-xs italic mt-2 text-[#465f75]/65">{citation.verified ? 'Retrieved or verified source reference.' : 'Profile-grounded interpretation; underlying passage requires corpus retrieval.'}</p></div>)}</div></div></div>; }

function StyleEssenceDisplay({ style }: { style: StyleEssence }) { return <div className="grid md:grid-cols-2 gap-5"><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Style DNA</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.style_dna}</p></div><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Characteristic Movement</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.characteristic_movement}</p></div></div>; }
function ProfileModal({ philosopher, onClose }: { philosopher: Philosopher; onClose: () => void }) {
  const profile = philosopher.profile;
  const style = philosopher.style_essence;
  const baseKeys = ['identity', 'ontology', 'epistemology', 'conception_of_human_subject', 'conception_of_society', 'conception_of_power', 'conception_of_freedom', 'theory_of_social_change', 'conception_of_technology', 'rhetorical_style', 'what_he_sees_well', 'what_he_overlooks'];
  const hiddenKeys = new Set(['reasoning', 'self_review', 'meta_fix', 'style', 'historical_boundary']);
  const altKey = (key: string) => key.startsWith('what_he_') ? key.replace('what_he_', 'what_she_') : key.startsWith('what_she_') ? key.replace('what_she_', 'what_he_') : null;
  const rows: { label: string; value: unknown }[] = [];
  const consumed = new Set<string>();
  for (const key of baseKeys) {
    const alt = altKey(key);
    const value = profile[key] !== undefined ? profile[key] : alt ? profile[alt] : undefined;
    if (value === undefined) continue;
    // Label follows the variant that actually holds the content (her content, her words).
    const labelKey = profile[key] !== undefined ? key : (alt ?? key);
    rows.push({ label: labelKey.replace(/_/g, ' '), value });
    consumed.add(key);
    if (alt) consumed.add(alt);
  }
  for (const key of Object.keys(profile)) {
    if (consumed.has(key) || hiddenKeys.has(key)) continue;
    rows.push({ label: key.replace(/_/g, ' '), value: profile[key] });
  }
  return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="dark-academia-card max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4 mb-6"><div><p className="pass-indicator text-[#8b5254]">Seat {philosopher.seat_order + 1} · intellectual profile</p><h2 className="text-4xl">{philosopher.full_name}</h2><p className="italic text-[#465f75]/70">{philosopher.birth_year} — {philosopher.death_year}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button></div><div className="flex flex-wrap gap-2 mb-6">{philosopher.analytical_center.map((item) => <span key={item} className="citation-badge">{item}</span>)}</div><div className="grid md:grid-cols-2 gap-5"><StyleEssenceDisplay style={style} /></div><div className="grid md:grid-cols-2 gap-5 mt-5">{rows.map((row) => <div key={row.label} className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">{row.label}</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{Array.isArray(row.value) ? row.value.join(' · ') : String(row.value ?? '')}</p></div>)}</div></div></div>;
}

export default App;
