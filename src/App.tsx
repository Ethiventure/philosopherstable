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
import { PHILOSOPHER_DATA } from '@/data/philosophers';
import {
  CHRONOLOGICAL_ORDER,
  DEFAULT_ACCESSIBILITY,
  PASS_DESCRIPTIONS,
  PASS_NAMES,
  type AccessibilitySettings,
  type Intervention,
  type Philosopher,
} from '@/types';
import { buildPrompt, type PromptContext } from '@/lib/prompts';
import { generateContent, getApiKey, getModel, hasApiKey } from '@/lib/gemini';
import { CabinetTable } from '@/components/CabinetTable';
import { InterventionCard } from '@/components/InterventionCard';
import { InterventionModal } from '@/components/InterventionModal';
import { ProfileModal } from '@/components/ProfileModal';
import { SourceDrawer } from '@/components/SourceDrawer';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { SpiralView, CabinetRecord, PositionComparison } from '@/components/SpiralView';

function makeMockIntervention(philosopher: Philosopher, pass: number, question: string, index: number, prevName: string | null): Intervention {
  const passLead = pass === 1 && index === 0
    ? `The question — "${question}" — strikes at the junction of capacity and control. From my framework, the first task is to identify what this technology does to the collective power of acting.`
    : pass === 1
      ? `${prevName ? prevName + "'s diagnosis correctly identifies part of the terrain, but " : ''}the question must be reframed. What appears as a matter of individual choice is in fact a question of conditions and mediation.`
      : pass === 2
        ? `The preceding interventions have exposed a tension that ${prevName ?? 'the previous speaker'} did not fully resolve. I revise my emphasis, but I do not abandon the central distinction.`
        : `After the encounter, the question is no longer simply whether this should be done. It is what institutions and collective capacities would make the practice emancipatory.`;

  const citations = philosopher.slug === 'marx'
    ? [{ label: '[MARX, CAPITAL VOL. I, CH. 1]', verified: true }]
    : philosopher.slug === 'bookchin'
      ? [{ label: '[BOOKCHIN, THE ECOLOGY OF FREEDOM]', verified: true }]
      : philosopher.slug === 'spinoza'
        ? [{ label: '[SPINOZA, ETHICS, PART III]', verified: true }]
        : [{ label: `[${philosopher.name.toUpperCase()}, SOURCE-GROUNDED PROFILE]`, verified: false }];

  return {
    id: `mock-${pass}-${index}-${Date.now()}`,
    meeting_id: 'demo',
    philosopher_id: philosopher.id,
    pass_number: pass,
    seat_position: index,
    response_text: `${passLead}\n\nThe contemporary formulation changes as it passes around the table. What appeared to be a question of individual choice becomes a question of conditions, mediation, and collective capacity. I respond to the preceding intervention by preserving what it sees clearly while rejecting its tendency to close the problem too soon.`,
    retrieved_chunk_ids: [],
    citations,
    position_label: pass === 1 ? 'Initial diagnosis' : pass === 2 ? 'Position revised under critique' : 'Reconstructed position',
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
  const [showSources, setShowSources] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enabledSlugs, setEnabledSlugs] = useState<string[]>([...CHRONOLOGICAL_ORDER]);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [error, setError] = useState<string | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('philosophers').select('*').order('seat_order');
      if (data && data.length === 9) setPhilosophers(data as Philosopher[]);
      else setPhilosophers(PHILOSOPHER_DATA.map((item, index) => ({ ...item, id: `local-${item.slug}`, created_at: new Date().toISOString(), seat_order: index })));
    };
    void load();
  }, []);

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
    setActivePass(0);
    setActiveAgent(0);
    setIsRunning(true);
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
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={isRunning ? pauseMeeting : runMeeting}
                  disabled={!question.trim() || orderedPhilosophers.length < 2}
                >
                  {isRunning ? <><CirclePause size={17} /> Pause circuit</> : <><CirclePlay size={17} /> {interventions.length ? 'Resume cabinet' : 'Begin cabinet'}</>}
                </button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetMeeting}>
                  <RotateCcw size={15} /> Restart
                </button>
                <button className="btn-secondary flex items-center gap-2" onClick={exportTranscript} disabled={!interventions.length}>
                  <Download size={15} /> Export
                </button>
              </div>
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

        {interventions.length > 9 && (
          <PositionComparison philosophers={philosophers} interventions={interventions} />
        )}
      </main>

      {showSources && <SourceDrawer onClose={() => setShowSources(false)} />}
      {showSettings && (
        <SettingsDrawer
          enabledSlugs={enabledSlugs}
          onToggleSlug={toggleSlug}
          accessibility={accessibility}
          onAccessibilityChange={setAccessibility}
          philosophers={philosophers}
          onClose={() => setShowSettings(false)}
        />
      )}
      {selectedIntervention && (
        <InterventionModal
          intervention={selectedIntervention}
          philosopher={philosophers.find((p) => p.id === selectedIntervention.philosopher_id)}
          onClose={() => setSelectedIntervention(null)}
        />
      )}
      {selectedPhilosopher && (
        <ProfileModal philosopher={selectedPhilosopher} onClose={() => setSelectedPhilosopher(null)} />
      )}
    </div>
  );
}

export default App;
