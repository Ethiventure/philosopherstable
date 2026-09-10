import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  CirclePause,
  CirclePlay,
  Download,
  Feather,
  Library,
  RotateCcw,
  ScrollText,
  Settings2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CORPUS_SOURCES_DATA } from '@/data/corpus-sources';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_DATA, renderPersona } from '@/philosophers';
import {
  CHRONOLOGICAL_ORDER,
  DEFAULT_ACCESSIBILITY,
  PASS_DESCRIPTIONS,
  PASS_NAMES,
  type AccessibilitySettings,
  type Intervention,
  type Philosopher,
  type StyleEssence,
} from '@/types';
import { buildTurnInstruction, buildUserMessage, getTurnKind, STRUCTURED_OUTPUT_HINT } from '@/lib/dialectic/prompts';
import { generateTurn, testApiKey, type TurnOutput } from '@/lib/gemini';
import { loadSettings, saveSettings, type CabinetSettings, type GeminiModel } from '@/lib/settings';

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
      `Negation — ${output.negation}`,
      `Incorporation — ${output.incorporation}`,
      `Reformulation — ${output.reformulation}`,
      `Contradiction passed on — ${output.contradiction_passed}`,
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
  const [settings, setSettings] = useState<CabinetSettings>(() => loadSettings());
  const [thinkingName, setThinkingName] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const runRef = useRef(0);

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
  // Load saved accessibility settings
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try { setAccessibility({ ...DEFAULT_ACCESSIBILITY, ...JSON.parse(saved) }); } catch { /* ignore */ }
    }
    const savedSlugs = localStorage.getItem('enabled_slugs');
    if (savedSlugs) {
      try {
        const parsed = JSON.parse(savedSlugs);
        if (Array.isArray(parsed) && parsed.length >= 2) setEnabledSlugs(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  // Save accessibility settings
  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(accessibility));
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(accessibility.fontScale));
    root.style.setProperty('--line-height', String(accessibility.lineHeight));
    root.style.setProperty('--text-align', accessibility.textAlignment);
    root.classList.toggle('high-contrast', accessibility.highContrast);
    root.classList.toggle('reduce-motion', accessibility.reduceMotion);
    root.classList.toggle('dyslexia-font', accessibility.dyslexiaFont);
  }, [accessibility]);

  // Save enabled slugs
  useEffect(() => {
    localStorage.setItem('enabled_slugs', JSON.stringify(enabledSlugs));
  }, [enabledSlugs]);

  const orderedPhilosophers = useMemo(
    () => enabledSlugs.map((slug) => philosophers.find((p) => p.slug === slug)).filter((p): p is Philosopher => Boolean(p)),
    [philosophers, enabledSlugs],
  );
  const currentInterventions = interventions.filter((item) => item.pass_number === activePass + 1);
  const currentSpeaker = orderedPhilosophers[activeAgent];
  const hasKey = settings.geminiApiKey.trim().length > 0;
  const isComplete = orderedPhilosophers.length > 0 && interventions.length >= orderedPhilosophers.length * 3;

  // Async loop over passes × seats (Phase 2f). Each turn sees only the
  // question, PREV's full text, and the speaker's own prior one-liners.
  // The pause flag (runRef) is checked between turns and after each call.
  const runLoop = async (runId: number, seats: Philosopher[], startCount: number, collected: Intervention[]) => {
    const snap = settings;
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
      const userMessage = [
        buildUserMessage({
          question,
          prevText: n === 0 ? null : (collected[collected.length - 1]?.response_text ?? null),
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
        output = await generateTurn({
          apiKey: snap.geminiApiKey,
          model: snap.model,
          systemPrompt,
          userMessage,
          longForm: snap.longForm,
        });
      } catch (error) {
        if (runRef.current !== runId) return;
        setRunError(error instanceof Error ? error.message : 'Unknown error from Gemini.');
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
    if (orderedPhilosophers.length < 2 || !settings.geminiApiKey.trim()) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
  const toggleSlug = (slug: string) => {
    setEnabledSlugs((prev) => {
      if (prev.includes(slug)) {
        if (prev.length <= 2) return prev;
        return prev.filter((s) => s !== slug);
      }
      // Add back in chronological position
      const withAdded = [...prev, slug];
      return CHRONOLOGICAL_ORDER.filter((s) => withAdded.includes(s));
    });
  };

  const generateIntervention = async (
    philosopher: Philosopher,
    passNumber: number,
    seatPosition: number,
    allPriorInterventions: Intervention[],
  ): Promise<Intervention> => {
    const apiKey = getApiKey();
    const model = getModel();
    const useLLM = hasApiKey() && apiKey;

    if (!useLLM) {
      const prevIntervention = allPriorInterventions[allPriorInterventions.length - 1] ?? null;
      const prevPhilosopher = prevIntervention ? philosophers.find((p) => p.id === prevIntervention.philosopher_id) : null;
      return makeMockIntervention(philosopher, passNumber, question, seatPosition, prevPhilosopher?.name ?? null);
    }

    const prevIntervention = allPriorInterventions[allPriorInterventions.length - 1] ?? null;
    const ctx: PromptContext = {
      philosopher,
      question,
      passNumber,
      seatPosition,
      previousIntervention: prevIntervention,
      allInterventions: allPriorInterventions,
      allPhilosophers: philosophers,
      enabledSlugs,
    };
    const prompt = buildPrompt(ctx);
    const responseText = await generateContent(prompt, { apiKey, model });

    const citations = philosopher.slug === 'marx'
      ? [{ label: '[MARX, CAPITAL VOL. I]', verified: true }]
      : [{ label: `[${philosopher.name.toUpperCase()}, PROFILE-GROUNDED]`, verified: false }];

    return {
      id: `llm-${passNumber}-${seatPosition}-${Date.now()}`,
      meeting_id: 'demo',
      philosopher_id: philosopher.id,
      pass_number: passNumber,
      seat_position: seatPosition,
      response_text: responseText,
      retrieved_chunk_ids: [],
      citations,
      position_label: passNumber === 1 ? 'Initial diagnosis' : passNumber === 2 ? 'Position revised under critique' : 'Reconstructed position',
      created_at: new Date().toISOString(),
    };
  };

  const runMeeting = async () => {
    if (orderedPhilosophers.length < 2) {
      setError('At least 2 philosophers must be enabled.');
      return;
    }
    setError(null);
    setInterventions([]);
    setRunError(null);
    setActivePass(0);
    setActiveAgent(0);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], 0, []);
  };

  const resumeMeeting = () => {
    if (orderedPhilosophers.length < 2 || !settings.geminiApiKey.trim()) return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions]);
  };

  const pauseMeeting = () => {
    runRef.current += 1;
    setIsRunning(false);
    setThinkingName(null);
  };

  const resetMeeting = () => {
    runRef.current += 1;
    runningRef.current = true;

    const allInterventions: Intervention[] = [];
    const totalPasses = 3;

    for (let pass = 0; pass < totalPasses; pass++) {
      for (let seat = 0; seat < orderedPhilosophers.length; seat++) {
        if (!runningRef.current) return;

        const speaker = orderedPhilosophers[seat];
        setActivePass(pass);
        setActiveAgent(seat);
        setLoadingNext(true);

        try {
          const intervention = await generateIntervention(speaker, pass + 1, seat, [...allInterventions]);
          allInterventions.push(intervention);
          setInterventions([...allInterventions]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setError(`Generation failed: ${msg}. Check your API key in Settings.`);
          setIsRunning(false);
          runningRef.current = false;
          return;
        } finally {
          setLoadingNext(false);
        }
      }
    }

    setIsRunning(false);
    runningRef.current = false;
    setActivePass(2);
    setActiveAgent(orderedPhilosophers.length - 1);
  };

  const pauseMeeting = () => {
    runningRef.current = false;
    setIsRunning(false);
  };

  const resetMeeting = () => {
    runningRef.current = false;
    setIsRunning(false);
    setThinkingName(null);
    setRunError(null);
    setActivePass(0);
    setActiveAgent(-1);
    setInterventions([]);
    setSelectedIntervention(null);
    setError(null);
  };

  const exportTranscript = () => {
    const text = [
      `THE DIALECTICAL CABINET\n\nQUESTION\n${question}\n`,
      ...interventions.map((item) => {
        const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
        return `PASS ${item.pass_number} — ${philosopher?.full_name ?? 'Unknown'}\n\n${item.response_text}\n\n${item.citations.map((c) => c.label).join(', ')}\n`;
      }),
    ].join('\n');
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

  return (
    <div className="min-h-screen parchment-bg-dark" style={{
      fontSize: `${accessibility.fontScale}rem`,
      lineHeight: accessibility.lineHeight,
    } as React.CSSProperties}>
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
            <span className="flex items-center gap-2"><Users size={15} /> {orderedPhilosophers.length} thinkers</span>
            <span className="text-[#b89968]">·</span>
            <span className="flex items-center gap-2"><ScrollText size={15} /> Three passes</span>
            {hasApiKey() && <><span className="text-[#b89968]">·</span><span className="flex items-center gap-2 text-[#4a6b3f]"><Sparkles size={13} /> Live AI</span></>}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !px-3" onClick={() => setShowSources(!showSources)} title="Corpus manifest"><Library size={16} /></button>
            <button className="btn-secondary !px-3" onClick={() => setShowSettings(!showSettings)} title="Settings"><Settings2 size={16} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-[#7d3b3b]/10 border-l-2 border-[#7d3b3b] text-sm text-[#7d3b3b]">
            {error}
          </div>
        )}

        <section className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b5254] mb-2">
                  Clockwise protocol / {isRunning ? 'in session' : 'at rest'}
                </p>
                <h2 className="text-4xl md:text-5xl">
                  A question enters.<br /><span className="text-[#8b5254]">A problem emerges.</span>
                </h2>
              </div>
              {isRunning && (
                <div className="flex items-center gap-2 text-sm italic text-[#8b5254]">
                  <span className="w-2 h-2 rounded-full bg-[#cc5f68] speaker-glow" /> Cabinet in motion
                </div>
              )}
            </div>

            <div className="dark-academia-card p-5 md:p-6 mb-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <label htmlFor="question" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">
                  The contemporary problem
                </label>
                <span className="text-xs text-[#465f75]/65">The question remains constant; its formulation may change.</span>
              </div>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isRunning}
                className="w-full min-h-[92px] resize-y bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-4 text-lg leading-relaxed text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"
              />
              <div className="flex flex-wrap gap-3 mt-4">
                <button className="btn-primary flex items-center gap-2" onClick={isRunning ? pauseMeeting : interventions.length ? resumeMeeting : startMeeting} disabled={!question.trim() || orderedPhilosophers.length < 2 || (!isRunning && (!hasKey || isComplete))}>{isRunning ? <><CirclePause size={17} /> Pause circuit</> : <><CirclePlay size={17} /> {isComplete ? 'Cabinet complete' : interventions.length ? 'Resume cabinet' : 'Begin cabinet'}</>}</button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetMeeting}><RotateCcw size={15} /> Restart</button>
                <button className="btn-secondary flex items-center gap-2" onClick={exportTranscript} disabled={!interventions.length}><Download size={15} /> Export</button>
              </div>
              {!hasKey && <p className="text-sm italic text-[#8b5254] mt-3">Add your Gemini API key in <button className="underline" onClick={() => setShowSettings(true)}>Settings</button> to begin — it stays in this browser only, and goes straight to Google.</p>}
              {runError && <div className="mt-3 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254]"><p className="text-xs uppercase tracking-widest text-[#8b5254]">Cabinet halted</p><p className="text-sm mt-1 text-[#465f75]">{runError}</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={resumeMeeting} disabled={!hasKey}>Resume cabinet</button><button className="btn-secondary" onClick={() => setShowSettings(true)}>Open settings</button><button className="btn-secondary" onClick={() => setRunError(null)}>Dismiss</button></div></div>}
            </div>

            <div className="dark-academia-card p-5 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="pass-indicator text-[#8b5254]">Pass {activePass + 1} / 3</p>
                  <h3 className="text-2xl mt-1">{PASS_NAMES[activePass]}</h3>
                  <p className="italic text-[#465f75]/70">{PASS_DESCRIPTIONS[activePass]}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((pass) => (
                    <button
                      key={pass}
                      onClick={() => setActivePass(pass)}
                      className={`w-9 h-9 rounded-full border text-sm font-semibold transition-all ${
                        activePass === pass
                          ? 'bg-[#4a392d] text-[#eae1ca] border-[#4a392d]'
                          : 'border-[#4a392d]/30 text-[#4a392d]/60 hover:border-[#4a392d]'
                      }`}
                    >
                      {pass + 1}
                    </button>
                  ))}
                </div>
              </div>

              <CabinetTable
                philosophers={orderedPhilosophers}
                activeAgent={activeAgent}
                activePass={activePass}
                interventions={interventions}
                onSelect={(p) => setSelectedPhilosopher(p)}
              />

              {currentSpeaker && (isRunning || thinkingName) && <div className="mt-6 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254] slide-in-right"><p className="text-xs uppercase tracking-widest text-[#8b5254]">{thinkingName ? `${thinkingName} is thinking…` : 'Currently speaking'}</p><p className="font-heading text-xl text-[#4a392d]">{currentSpeaker.full_name}</p><p className="text-sm italic text-[#465f75]/70 mt-1">The intervention will pass clockwise to {orderedPhilosophers[(activeAgent + 1) % orderedPhilosophers.length]?.name}.</p></div>}
              {currentSpeaker && isRunning && (
                <div className="mt-6 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254] slide-in-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8b5254]">
                    {loadingNext ? 'Generating intervention' : 'Currently speaking'}
                  </p>
                  <p className="font-heading text-xl text-[#4a392d]">{currentSpeaker.full_name}</p>
                  <p className="text-sm italic text-[#465f75]/70 mt-1">
                    {loadingNext ? (
                      <span className="flex items-center gap-1">
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[#8b5254]" />
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[#8b5254]" />
                        <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-[#8b5254]" />
                      </span>
                    ) : (
                      `The intervention will pass clockwise to ${orderedPhilosophers[(activeAgent + 1) % orderedPhilosophers.length]?.name ?? 'the next speaker'}.`
                    )}
                  </p>
                </div>
              )}
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
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} className="text-[#8b5254]" />
                <h3 className="text-xl">The spiral</h3>
              </div>
              <SpiralView interventions={interventions} question={question} activePass={activePass} />
            </div>
            <CabinetRecord
              interventions={interventions}
              onInspectLatest={() => setSelectedIntervention(interventions[interventions.length - 1] ?? null)}
            />
          </aside>
        </section>

        <section className="mt-10">
          <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="pass-indicator text-[#8b5254]">The developing transcript</p>
              <h2 className="text-3xl">Voices around the table</h2>
            </div>
            <p className="hidden md:block max-w-md text-right italic text-[#465f75]/65">
              Select an intervention to inspect its argument and source status. Earlier positions are preserved.
            </p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentInterventions.length ? (
              currentInterventions.map((intervention) => {
                const philosopher = philosophers.find((p) => p.id === intervention.philosopher_id);
                return philosopher ? (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    philosopher={philosopher}
                    onClick={() => setSelectedIntervention(intervention)}
                  />
                ) : null;
              })
            ) : (
              <div className="md:col-span-2 xl:col-span-3 dark-academia-card p-10 text-center">
                <Feather size={28} className="mx-auto text-[#b89968] mb-3" />
                <p className="font-heading text-2xl text-[#4a392d]">The cabinet awaits its question.</p>
                <p className="italic text-[#465f75]/65 mt-2">
                  Begin the circuit to watch the problem transform one intervention at a time.
                </p>
              </div>
            )}
          </div>
        </section>

        {interventions.length > orderedPhilosophers.length && <PositionComparison philosophers={orderedPhilosophers} interventions={interventions} />}
      </main>

      {showSources && <SourceDrawer onClose={() => setShowSources(false)} />}
      {showSettings && <SettingsDrawer philosophers={philosophers} activeSlugs={activeSlugs} togglePhilosopher={togglePhilosopher} settings={settings} onSettingsChange={updateSettings} onClose={() => setShowSettings(false)} />}
      {selectedIntervention && <InterventionModal intervention={selectedIntervention} philosopher={philosophers.find((p) => p.id === selectedIntervention.philosopher_id)} onClose={() => setSelectedIntervention(null)} />}
      {selectedPhilosopher && <ProfileModal philosopher={selectedPhilosopher} onClose={() => setSelectedPhilosopher(null)} />}
    </div>
  );
}

function CabinetTable({ philosophers, activeAgent, activePass, interventions, onSelect }: { philosophers: Philosopher[]; activeAgent: number; activePass: number; interventions: Intervention[]; onSelect: (philosopher: Philosopher) => void }) {
  return <div className="relative w-full max-w-[760px] mx-auto aspect-square min-h-[390px] md:min-h-[560px] flex items-center justify-center"><div className="absolute w-[48%] h-[34%] rounded-[50%] border-[10px] border-[#4a392d]/80 bg-[#6d4c37]/10 shadow-[inset_0_0_40px_rgba(74,57,45,0.2),0_8px_24px_rgba(74,57,45,0.2)]"><div className="absolute inset-3 rounded-[50%] border border-[#b89968]/50 flex flex-col items-center justify-center text-center"><span className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">The cabinet</span><span className="font-heading text-lg md:text-2xl text-[#4a392d]">A dialectical spiral</span><span className="text-xs italic text-[#465f75]/60 mt-1">clockwise · sequential · unresolved</span></div></div><div className="absolute inset-[8%] rotation-arrow pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#8b5254]"><ArrowRight size={22} /></div></div>{philosophers.map((philosopher, index) => { const angle = (index / philosophers.length) * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 42; const y = 50 + Math.sin(angle) * 42; const isActive = activeAgent === index; const hasSpoken = interventions.some((item) => item.pass_number === activePass + 1 && item.seat_position === index); return <button key={philosopher.slug} onClick={() => onSelect(philosopher)} className={`cabinet-seat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${isActive ? 'cabinet-seat-active' : ''} ${hasSpoken ? 'cabinet-seat-spoken' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}><span className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center bg-[#f2ebd9] ${isActive ? 'speaker-glow border-[#cc5f68]' : 'border-[#4a392d]/35'}`} style={{ borderColor: isActive ? undefined : philosopher.accent_color }}><span className="font-heading text-lg md:text-2xl" style={{ color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span></span><span className="font-heading text-xs md:text-sm text-[#4a392d] whitespace-nowrap">{philosopher.name}</span><span className="text-[9px] uppercase tracking-wider text-[#465f75]/55">Seat {index + 1}</span></button>; })}</div>;
}

function InterventionCard({ intervention, philosopher, onClick }: { intervention: Intervention; philosopher: Philosopher; onClick: () => void }) { return <button onClick={onClick} className="dark-academia-card text-left p-5 w-full"><div className="flex items-start justify-between gap-3 mb-3"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><div><p className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</p><p className="text-[10px] uppercase tracking-wider text-[#8b5254]">Seat {intervention.seat_position + 1}</p></div></div><ChevronDown size={16} className="text-[#4a392d]/50" /></div><p className="drop-cap line-clamp-4 text-[15px] leading-relaxed text-[#465f75]">{intervention.response_text}</p><div className="flex flex-wrap gap-1 mt-4">{intervention.citations.map((citation) => <span key={citation.label} className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={10} /> {citation.label}</span>)}</div></button>; }

function SpiralView({ interventions, question, activePass, numPhilosophers }: { interventions: Intervention[]; question: string; activePass: number; numPhilosophers: number }) { const labels = ['The question', 'Problem map', 'Dialectical map', 'Spiral synthesis']; return <div className="space-y-2">{labels.map((label, index) => { const isVisible = index === 0 || interventions.length >= index * numPhilosophers; const text = index === 0 ? question : index === 1 ? 'First rotation chained: seat 1 opens, each later seat negates its immediate predecessor.' : index === 2 ? 'Second rotation continues across the boundary; each turn critiques PREV and hands a contradiction on.' : 'Reconstruction rotation: institutions, practices, collective power; final seat returns the question.'; return <div key={label} className={`relative pl-8 ${isVisible ? 'opacity-100' : 'opacity-35'} transition-opacity`}><div className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${index <= activePass + 1 ? 'bg-[#8b5254] text-[#f2ebd9] border-[#8b5254]' : 'border-[#4a392d]/30 text-[#4a392d]/50'}`}>{index}</div>{index < 3 && <div className="absolute left-[9px] top-6 h-8 border-l border-dashed border-[#b89968]" />}<p className="text-xs uppercase tracking-wider text-[#8b5254]">{label}</p><p className="text-sm italic text-[#465f75]/75 leading-snug mt-1">{text}</p></div>; })}</div>; }

function PositionComparison({ philosophers, interventions }: { philosophers: Philosopher[]; interventions: Intervention[] }) { return <section className="mt-12"><div className="ornament-divider mb-6"><span className="text-xl">✦</span></div><p className="pass-indicator text-[#8b5254]">Memory across passes</p><h2 className="text-3xl mb-5">Position changes</h2><div className="grid lg:grid-cols-3 gap-4">{philosophers.map((philosopher) => <div key={philosopher.id} className="dark-academia-card p-5"><h3 className="text-xl mb-3">{philosopher.name}</h3>{[1, 2, 3].map((pass) => { const item = interventions.find((entry) => entry.philosopher_id === philosopher.id && entry.pass_number === pass); return <div key={pass} className="border-t border-[#4a392d]/15 pt-3 mt-3"><p className="text-[10px] uppercase tracking-widest text-[#8b5254]">Pass {pass} · {PASS_NAMES[pass - 1]}</p><p className="text-sm mt-1 line-clamp-3 text-[#465f75]/80">{item?.response_text ?? 'Awaiting intervention.'}</p></div>; })}</div>)}</div></section>; }

function SourceDrawer({ onClose }: { onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-xl parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-6"><div><p className="pass-indicator text-[#8b5254]">Corpus manifest</p><h2 className="text-3xl">The sources</h2><p className="italic text-[#465f75]/65 mt-1">Provenance before performance.</p></div><button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button></div><div className="space-y-3">{CORPUS_SOURCES_DATA.map((source) => <div key={`${source.author}-${source.title}`} className="border-b border-[#4a392d]/15 pb-3"><div className="flex justify-between gap-3"><p className="font-heading text-base text-[#4a392d]">{source.title}</p><span className={`text-[9px] whitespace-nowrap uppercase tracking-wider ${source.full_text_ingested ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{source.full_text_ingested ? 'Full text' : 'Metadata'}</span></div><p className="text-sm text-[#465f75]/70">{source.author} · {source.publication_date}</p><p className="text-[10px] uppercase tracking-widest text-[#8b5254]/80 mt-1">{source.licence_status}</p></div>)}</div></aside></div>; }

function SettingsDrawer({ philosophers, activeSlugs, togglePhilosopher, settings, onSettingsChange, onClose }: { philosophers: Philosopher[]; activeSlugs: string[]; togglePhilosopher: (slug: string) => void; settings: CabinetSettings; onSettingsChange: (next: CabinetSettings) => void; onClose: () => void }) {
  const [keyInput, setKeyInput] = useState(settings.geminiApiKey);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const keySaved = keyInput === settings.geminiApiKey && settings.geminiApiKey.length > 0;
  const runTest = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setTestState('testing');
    setTestMessage('');
    try {
      await testApiKey(key);
      setTestState('ok');
      setTestMessage('Key works. Saved for this browser.');
      onSettingsChange({ ...settings, geminiApiKey: key });
    } catch (error) {
      setTestState('error');
      setTestMessage(error instanceof Error ? error.message : 'Key test failed.');
    }
  };
  return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-md parchment-bg p-6 md:p-8 overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-6"><div><p className="pass-indicator text-[#8b5254]">Bring your own key</p><h2 className="text-3xl">Settings</h2><p className="italic text-[#465f75]/65 mt-1">The key stays in this browser only, and goes straight to Google. Nothing is logged or collected.</p></div><button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button></div><div className="space-y-3 border-b border-[#4a392d]/15 pb-6 mb-6"><label htmlFor="gemini-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Gemini API key</label><input id="gemini-key" type="password" autoComplete="off" value={keyInput} onChange={(event) => { setKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from Google AI Studio" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" /><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={runTest} disabled={!keyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button><button className="btn-secondary" onClick={() => { setKeyInput(''); setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, geminiApiKey: '' }); }} disabled={!keyInput && !settings.geminiApiKey}>Clear</button>{keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}</div>{testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}<p className="text-xs text-[#465f75]/70">Get a free key at <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>. Without a key the cabinet cannot begin.</p><label htmlFor="gemini-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model</label><select id="gemini-model" value={settings.model} onChange={(event) => onSettingsChange({ ...settings, model: event.target.value as GeminiModel })} className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30"><option value="gemini-2.5-flash">gemini-2.5-flash (faster, higher free quota)</option><option value="gemini-2.5-pro">gemini-2.5-pro (slower, stronger)</option></select><span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Style intensity (all seats)</span><div className="flex gap-2">{(['low', 'medium', 'high'] as const).map((level) => <button key={level} onClick={() => onSettingsChange({ ...settings, intensity: level })} className={`btn-secondary capitalize ${settings.intensity === level ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>{level}</button>)}</div><label className="flex items-center gap-3 text-[15px] text-[#465f75] pt-1"><input type="checkbox" checked={settings.longForm} onChange={(event) => onSettingsChange({ ...settings, longForm: event.target.checked })} className="w-4 h-4 accent-[#8b5254]" /> Long form (~400 words/turn instead of ~150)</label></div><div className="flex items-start justify-between mb-4"><div><p className="pass-indicator text-[#8b5254]">Experimental variable</p><h2 className="text-2xl">Cabinet selection</h2></div></div><div className="space-y-2">{DEFAULT_SEATING_ORDER.map((slug) => {
    const philosopher = philosophers.find((item) => item.slug === slug);
    const isActive = activeSlugs.includes(slug);
    if (!philosopher) return null;
    return <button key={slug} onClick={() => togglePhilosopher(slug)} className={`w-full flex items-center gap-3 p-3 border transition-all ${isActive ? 'bg-[#f2ebd9]/65 border-[#4a392d]/40' : 'bg-transparent border-[#4a392d]/10 opacity-50 hover:opacity-80'}`}><div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${isActive ? 'bg-[#8b5254] border-[#8b5254]' : 'border-[#4a392d]/30'}`}>{isActive && <X size={12} className="text-white" />}</div><span className="w-8 h-8 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><span className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</span></button>;
  })}</div><p className="text-xs italic text-[#465f75]/60 mt-5">The baton passes only to active thinkers, always to the immediate next seat. The dialectical order remains fixed to preserve the historical-conceptual movement.</p></aside></div>;
}

function InterventionModal({ intervention, philosopher, onClose }: { intervention: Intervention; philosopher?: Philosopher; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="dark-academia-card max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="pass-indicator text-[#8b5254]">Pass {intervention.pass_number} · {PASS_NAMES[intervention.pass_number - 1]}</p><h2 className="text-3xl">{philosopher?.full_name}</h2><p className="italic text-[#465f75]/65">{intervention.position_label}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button></div><p className="drop-cap text-lg leading-relaxed mt-6 whitespace-pre-line text-[#465f75]">{intervention.response_text}</p><div className="mt-7 border-t border-[#4a392d]/20 pt-5"><p className="font-heading text-xl text-[#4a392d] mb-3">Source status</p>{intervention.citations.map((citation) => <div key={citation.label} className="p-3 bg-[#eae1ca]/60 border border-[#4a392d]/15 mb-2"><span className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={11} /> {citation.label}</span><p className="text-xs italic mt-2 text-[#465f75]/65">{citation.verified ? 'Retrieved or verified source reference.' : 'Profile-grounded interpretation; underlying passage requires corpus retrieval.'}</p></div>)}</div></div></div>; }

function StyleEssenceDisplay({ style }: { style: StyleEssence }) { return <div className="grid md:grid-cols-2 gap-5"><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Style DNA</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.style_dna}</p></div><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Characteristic Movement</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.characteristic_movement}</p></div></div>; }
function ProfileModal({ philosopher, onClose }: { philosopher: Philosopher; onClose: () => void }) { const profile = philosopher.profile; const style = philosopher.style_essence; const keys = ['identity', 'ontology', 'epistemology', 'conception_of_human_subject', 'conception_of_society', 'conception_of_power', 'conception_of_freedom', 'theory_of_social_change', 'conception_of_technology', 'rhetorical_style', 'what_he_sees_well', 'what_he_overlooks']; return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="dark-academia-card max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4 mb-6"><div><p className="pass-indicator text-[#8b5254]">Seat {philosopher.seat_order + 1} · intellectual profile</p><h2 className="text-4xl">{philosopher.full_name}</h2><p className="italic text-[#465f75]/70">{philosopher.birth_year} — {philosopher.death_year}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button></div><div className="flex flex-wrap gap-2 mb-6">{philosopher.analytical_center.map((item) => <span key={item} className="citation-badge">{item}</span>)}</div><div className="grid md:grid-cols-2 gap-5"><StyleEssenceDisplay style={style} /></div><div className="grid md:grid-cols-2 gap-5 mt-5">{keys.map((key) => { const value = profile[key]; return <div key={key} className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">{key.replace(/_/g, ' ')}</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{Array.isArray(value) ? value.join(' · ') : String(value ?? '')}</p></div>; })}</div></div></div>; }

export default App;
