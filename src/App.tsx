import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CirclePause,
  CirclePlay,
  Download,
  Feather,
  GripVertical,
  Library,
  Pause,
  RotateCcw,
  Save,
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
  DEFAULT_SEATING_ORDER,
  PASS_DESCRIPTIONS,
  PASS_NAMES,
  type Intervention,
  type Philosopher,
} from '@/types';

const palette = ['#8b7355', '#465f75', '#8b5254', '#6b5b3f', '#5d6b54', '#7d3b3b', '#4a6b3f', '#5a6b8b', '#6b5b73'];

const sampleOpenings: Record<string, string> = {
  spinoza: 'The question must first be freed from the superstition that treats the instrument as an autonomous cause. We should ask what increases or diminishes the collective power of acting.',
  kant: 'Before deciding what may be done, we must establish the maxim on which the action rests. Can the principle governing this use of technology be willed as a universal law while preserving every person as an end?',
  marx: 'The appearance of a neutral instrument conceals a social relation. We must investigate ownership, labour-power, and the conditions under which this technology becomes capital rather than merely a means of production.',
  hegel: 'The difficulty is that the opposing positions each express a partial truth. The task is not to choose one side immediately, but to grasp the contradiction that gives the question its movement.',
  deleuze: 'Let us not begin by assuming that the question has one subject, one interest, or one answer. We should map the assemblage: the flows it connects, the controls it introduces, and the lines of flight it may open.',
  lenin: 'The decisive matter is the concrete balance of forces. Who controls the institution, who sets its programme, and what organisation can turn a technical possibility into political power?',
  bookchin: 'To be sure, the instrument may enlarge human capacities. But the issue is not merely what it can do; it is what kind of social relations its ownership and institutional setting reproduce.',
  bogdanov: 'We should identify the organisation beneath the device. Which elements are linked, which feedbacks regulate the system, and where does the present arrangement become incapable of maintaining its own coherence?',
  fisher: 'The most dangerous feature may be the narrowing of what can be imagined. A technology marketed as emancipation can become another atmosphere of permanent performance unless it helps produce collective alternatives.',
};

function makeMockIntervention(philosopher: Philosopher, pass: number, question: string, index: number): Intervention {
  const passLead = pass === 1
    ? sampleOpenings[philosopher.slug]
    : pass === 2
      ? `My first position did not sufficiently account for the pressure introduced by the preceding interventions. The strongest objection is that ${philosopher.analytical_center[0]} cannot be treated in isolation from the other determinations. I revise the emphasis, but I do not abandon the central distinction.`
      : `After the encounter, the question is no longer simply whether this should be done. It is what institutions, forms of collective power, and safeguards would make the practice emancipatory rather than merely efficient. I preserve my initial concern while incorporating the cabinet's strongest insight.`;

  const citations = philosopher.slug === 'marx'
    ? [{ label: '[MARX, CAPITAL VOL. I, CH. 1]', verified: true }]
    : philosopher.slug === 'bookchin'
      ? [{ label: '[BOOKCHIN, THE ECOLOGY OF FREEDOM]', verified: true }]
      : philosopher.slug === 'spinoza'
        ? [{ label: '[SPINOZA, ETHICS, PART III]', verified: true }]
        : [{ label: `[${philosopher.name.toUpperCase()}, SOURCE-GROUNDED PROFILE]`, verified: false }];

  return {
    id: `mock-${pass}-${index}`,
    meeting_id: 'demo',
    philosopher_id: philosopher.id,
    pass_number: pass,
    seat_position: index,
    response_text: `${passLead}\n\nThe contemporary formulation — “${question}” — therefore changes as it passes around the table. What appeared to be a question of individual choice becomes a question of conditions, mediation, and collective capacity. I respond to the preceding intervention by preserving what it sees clearly while rejecting its tendency to close the problem too soon.`,
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
  const [seatingOrder, setSeatingOrder] = useState(DEFAULT_SEATING_ORDER);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('philosophers').select('*').order('seat_order');
      if (data && data.length === 9) setPhilosophers(data as Philosopher[]);
      else setPhilosophers(PHILOSOPHER_DATA.map((item, index) => ({ ...item, id: `local-${item.slug}`, created_at: new Date().toISOString(), seat_order: index })));
    };
    void load();
  }, []);

  const orderedPhilosophers = useMemo(() => seatingOrder.map((slug) => philosophers.find((p) => p.slug === slug)).filter((p): p is Philosopher => Boolean(p)), [philosophers, seatingOrder]);
  const currentInterventions = interventions.filter((item) => item.pass_number === activePass + 1);
  const currentSpeaker = orderedPhilosophers[activeAgent];

  const runMeeting = () => {
    setInterventions([]);
    setActivePass(0);
    setActiveAgent(0);
    setIsRunning(true);
    let pass = 0;
    let index = 0;
    const timer = window.setInterval(() => {
      const speaker = orderedPhilosophers[index];
      if (!speaker) return;
      setActivePass(pass);
      setActiveAgent(index);
      setInterventions((previous) => [...previous, makeMockIntervention(speaker, pass + 1, question, index)]);
      index += 1;
      if (index >= orderedPhilosophers.length) {
        index = 0;
        pass += 1;
        if (pass >= 3) {
          window.clearInterval(timer);
          setIsRunning(false);
          setActivePass(2);
          setActiveAgent(8);
        }
      }
    }, 1250);
  };

  const resetMeeting = () => {
    setIsRunning(false);
    setActivePass(0);
    setActiveAgent(-1);
    setInterventions([]);
    setSelectedIntervention(null);
  };

  const exportTranscript = () => {
    const text = [`THE DIALECTICAL CABINET\n\nQUESTION\n${question}\n`, ...interventions.map((item) => {
      const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
      return `PASS ${item.pass_number} — ${philosopher?.full_name ?? 'Unknown'}\n\n${item.response_text}\n\n${item.citations.map((citation) => citation.label).join(', ')}\n`;
    })].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dialectical-cabinet-transcript.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const moveSeat = (slug: string) => {
    if (!draggedSlug || draggedSlug === slug) return;
    const next = [...seatingOrder];
    const from = next.indexOf(draggedSlug);
    const to = next.indexOf(slug);
    next.splice(from, 1);
    next.splice(to, 0, draggedSlug);
    setSeatingOrder(next);
    setDraggedSlug(null);
  };

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
            <span className="flex items-center gap-2"><Users size={15} /> Nine traditions</span>
            <span className="text-[#b89968]">·</span>
            <span className="flex items-center gap-2"><ScrollText size={15} /> Three passes</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !px-3" onClick={() => setShowSources(!showSources)} title="Corpus manifest"><Library size={16} /></button>
            <button className="btn-secondary !px-3" onClick={() => setShowSettings(!showSettings)} title="Seating order"><Settings2 size={16} /></button>
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
                <button className="btn-primary flex items-center gap-2" onClick={isRunning ? () => setIsRunning(false) : runMeeting} disabled={!question.trim() || philosophers.length !== 9}>{isRunning ? <><CirclePause size={17} /> Pause circuit</> : <><CirclePlay size={17} /> {interventions.length ? 'Resume cabinet' : 'Begin cabinet'}</>}</button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetMeeting}><RotateCcw size={15} /> Restart</button>
                <button className="btn-secondary flex items-center gap-2" onClick={exportTranscript} disabled={!interventions.length}><Download size={15} /> Export</button>
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
                  {[0, 1, 2].map((pass) => <button key={pass} onClick={() => setActivePass(pass)} className={`w-9 h-9 rounded-full border text-sm font-semibold transition-all ${activePass === pass ? 'bg-[#4a392d] text-[#eae1ca] border-[#4a392d]' : 'border-[#4a392d]/30 text-[#4a392d]/60 hover:border-[#4a392d]'}`}>{pass + 1}</button>)}
                </div>
              </div>

              <CabinetTable philosophers={orderedPhilosophers} activeAgent={activeAgent} activePass={activePass} interventions={interventions} onSelect={(philosopher) => setSelectedPhilosopher(philosopher)} />

              {currentSpeaker && isRunning && <div className="mt-6 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254] slide-in-right"><p className="text-xs uppercase tracking-[0.18em] text-[#8b5254]">Currently speaking</p><p className="font-heading text-xl text-[#4a392d]">{currentSpeaker.full_name}</p><p className="text-sm italic text-[#465f75]/70 mt-1">The intervention will pass clockwise to {orderedPhilosophers[(activeAgent + 1) % 9]?.name}.</p></div>}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="dark-academia-card p-5">
              <div className="flex items-center gap-3 mb-4"><Sparkles size={18} className="text-[#8b5254]" /><h3 className="text-xl">The spiral</h3></div>
              <SpiralView interventions={interventions} question={question} activePass={activePass} />
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
          <div className="flex items-end justify-between mb-5"><div><p className="pass-indicator text-[#8b5254]">The developing transcript</p><h2 className="text-3xl">Voices around the table</h2></div><p className="hidden md:block max-w-md text-right italic text-[#465f75]/65">Select an intervention to inspect its argument and source status. Earlier positions are preserved.</p></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentInterventions.length ? currentInterventions.map((intervention) => { const philosopher = philosophers.find((p) => p.id === intervention.philosopher_id); return philosopher ? <InterventionCard key={intervention.id} intervention={intervention} philosopher={philosopher} onClick={() => setSelectedIntervention(intervention)} /> : null; }) : <div className="md:col-span-2 xl:col-span-3 dark-academia-card p-10 text-center"><Feather size={28} className="mx-auto text-[#b89968] mb-3" /><p className="font-heading text-2xl text-[#4a392d]">The cabinet awaits its question.</p><p className="italic text-[#465f75]/65 mt-2">Begin the circuit to watch the problem transform one intervention at a time.</p></div>}
          </div>
        </section>

        {interventions.length > 9 && <PositionComparison philosophers={philosophers} interventions={interventions} />}
      </main>

      {showSources && <SourceDrawer onClose={() => setShowSources(false)} />}
      {showSettings && <SettingsDrawer philosophers={philosophers} seatingOrder={seatingOrder} setSeatingOrder={setSeatingOrder} draggedSlug={draggedSlug} setDraggedSlug={setDraggedSlug} moveSeat={moveSeat} onClose={() => setShowSettings(false)} />}
      {selectedIntervention && <InterventionModal intervention={selectedIntervention} philosopher={philosophers.find((p) => p.id === selectedIntervention.philosopher_id)} onClose={() => setSelectedIntervention(null)} />}
      {selectedPhilosopher && <ProfileModal philosopher={selectedPhilosopher} onClose={() => setSelectedPhilosopher(null)} />}
    </div>
  );
}

function CabinetTable({ philosophers, activeAgent, activePass, interventions, onSelect }: { philosophers: Philosopher[]; activeAgent: number; activePass: number; interventions: Intervention[]; onSelect: (philosopher: Philosopher) => void }) {
  return <div className="relative w-full max-w-[760px] mx-auto aspect-square min-h-[390px] md:min-h-[560px] flex items-center justify-center"><div className="absolute w-[48%] h-[34%] rounded-[50%] border-[10px] border-[#4a392d]/80 bg-[#6d4c37]/10 shadow-[inset_0_0_40px_rgba(74,57,45,0.2),0_8px_24px_rgba(74,57,45,0.2)]"><div className="absolute inset-3 rounded-[50%] border border-[#b89968]/50 flex flex-col items-center justify-center text-center"><span className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">The cabinet</span><span className="font-heading text-lg md:text-2xl text-[#4a392d]">A dialectical spiral</span><span className="text-xs italic text-[#465f75]/60 mt-1">clockwise · sequential · unresolved</span></div></div><div className="absolute inset-[8%] rotation-arrow pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#8b5254]"><ArrowRight size={22} /></div></div>{philosophers.map((philosopher, index) => { const angle = (index / philosophers.length) * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 42; const y = 50 + Math.sin(angle) * 42; const isActive = activeAgent === index; const hasSpoken = interventions.some((item) => item.pass_number === activePass + 1 && item.seat_position === index); return <button key={philosopher.slug} onClick={() => onSelect(philosopher)} className={`cabinet-seat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${isActive ? 'cabinet-seat-active' : ''} ${hasSpoken ? 'cabinet-seat-spoken' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}><span className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center bg-[#f2ebd9] ${isActive ? 'speaker-glow border-[#cc5f68]' : 'border-[#4a392d]/35'}`} style={{ borderColor: isActive ? undefined : philosopher.accent_color }}><span className="font-heading text-lg md:text-2xl" style={{ color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span></span><span className="font-heading text-xs md:text-sm text-[#4a392d] whitespace-nowrap">{philosopher.name}</span><span className="text-[9px] uppercase tracking-wider text-[#465f75]/55">Seat {index + 1}</span></button>; })}</div>;
}

function InterventionCard({ intervention, philosopher, onClick }: { intervention: Intervention; philosopher: Philosopher; onClick: () => void }) { return <button onClick={onClick} className="dark-academia-card text-left p-5 w-full"><div className="flex items-start justify-between gap-3 mb-3"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><div><p className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</p><p className="text-[10px] uppercase tracking-wider text-[#8b5254]">Seat {intervention.seat_position + 1}</p></div></div><ChevronDown size={16} className="text-[#4a392d]/50" /></div><p className="drop-cap line-clamp-4 text-[15px] leading-relaxed text-[#465f75]">{intervention.response_text}</p><div className="flex flex-wrap gap-1 mt-4">{intervention.citations.map((citation) => <span key={citation.label} className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={10} /> {citation.label}</span>)}</div></button>; }

function SpiralView({ interventions, question, activePass }: { interventions: Intervention[]; question: string; activePass: number }) { const labels = ['The question', 'Problem map', 'Dialectical map', 'Spiral synthesis']; return <div className="space-y-2">{labels.map((label, index) => { const isVisible = index === 0 || interventions.length >= index * 9; const text = index === 0 ? question : index === 1 ? 'The problem has entered the first circuit and gathered distinct conceptual lenses.' : index === 2 ? 'Positions are now encountering their strongest objections; agreement is not the measure.' : 'A revised problem waits for the cabinet to complete its third pass.'; return <div key={label} className={`relative pl-8 ${isVisible ? 'opacity-100' : 'opacity-35'} transition-opacity`}><div className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${index <= activePass + 1 ? 'bg-[#8b5254] text-[#f2ebd9] border-[#8b5254]' : 'border-[#4a392d]/30 text-[#4a392d]/50'}`}>{index}</div>{index < 3 && <div className="absolute left-[9px] top-6 h-8 border-l border-dashed border-[#b89968]" />}<p className="text-xs uppercase tracking-wider text-[#8b5254]">{label}</p><p className="text-sm italic text-[#465f75]/75 leading-snug mt-1">{text}</p></div>; })}</div>; }

function PositionComparison({ philosophers, interventions }: { philosophers: Philosopher[]; interventions: Intervention[] }) { return <section className="mt-12"><div className="ornament-divider mb-6"><span className="text-xl">✦</span></div><p className="pass-indicator text-[#8b5254]">Memory across passes</p><h2 className="text-3xl mb-5">Position changes</h2><div className="grid lg:grid-cols-3 gap-4">{philosophers.slice(0, 3).map((philosopher) => <div key={philosopher.id} className="dark-academia-card p-5"><h3 className="text-xl mb-3">{philosopher.name}</h3>{[1, 2, 3].map((pass) => { const item = interventions.find((entry) => entry.philosopher_id === philosopher.id && entry.pass_number === pass); return <div key={pass} className="border-t border-[#4a392d]/15 pt-3 mt-3"><p className="text-[10px] uppercase tracking-widest text-[#8b5254]">Pass {pass} · {PASS_NAMES[pass - 1]}</p><p className="text-sm mt-1 line-clamp-3 text-[#465f75]/80">{item?.response_text ?? 'Awaiting intervention.'}</p></div>; })}</div>)}</div></section>; }

function SourceDrawer({ onClose }: { onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-xl parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-6"><div><p className="pass-indicator text-[#8b5254]">Corpus manifest</p><h2 className="text-3xl">The sources</h2><p className="italic text-[#465f75]/65 mt-1">Provenance before performance.</p></div><button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button></div><div className="space-y-3">{CORPUS_SOURCES_DATA.map((source) => <div key={`${source.author}-${source.title}`} className="border-b border-[#4a392d]/15 pb-3"><div className="flex justify-between gap-3"><p className="font-heading text-base text-[#4a392d]">{source.title}</p><span className={`text-[9px] whitespace-nowrap uppercase tracking-wider ${source.full_text_ingested ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{source.full_text_ingested ? 'Full text' : 'Metadata'}</span></div><p className="text-sm text-[#465f75]/70">{source.author} · {source.publication_date}</p><p className="text-[10px] uppercase tracking-widest text-[#8b5254]/80 mt-1">{source.licence_status}</p></div>)}</div></aside></div>; }

function SettingsDrawer({ philosophers, seatingOrder, setSeatingOrder, draggedSlug, setDraggedSlug, moveSeat, onClose }: { philosophers: Philosopher[]; seatingOrder: string[]; setSeatingOrder: (order: string[]) => void; draggedSlug: string | null; setDraggedSlug: (slug: string | null) => void; moveSeat: (slug: string) => void; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-md parchment-bg p-6 md:p-8 overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between mb-6"><div><p className="pass-indicator text-[#8b5254]">Experimental variable</p><h2 className="text-3xl">Seating order</h2><p className="italic text-[#465f75]/65 mt-1">Drag the topology; change the encounter.</p></div><button className="btn-secondary !px-3" onClick={onClose}><X size={17} /></button></div><div className="space-y-2">{seatingOrder.map((slug, index) => { const philosopher = philosophers.find((item) => item.slug === slug); return philosopher ? <div key={slug} draggable onDragStart={() => setDraggedSlug(slug)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveSeat(slug)} className="flex items-center gap-3 p-3 border border-[#4a392d]/20 bg-[#f2ebd9]/65 cursor-grab"><GripVertical size={16} className="text-[#4a392d]/40" /><span className="w-6 text-center font-heading text-[#8b5254]">{index + 1}</span><span className="w-8 h-8 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><span className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</span></div> : null; })}</div><button className="btn-secondary w-full mt-5" onClick={() => setSeatingOrder(DEFAULT_SEATING_ORDER)}>Restore default order</button><p className="text-xs italic text-[#465f75]/60 mt-5">Order is recorded with each meeting. The cabinet treats adjacency as an epistemic variable.</p></aside></div>; }

function InterventionModal({ intervention, philosopher, onClose }: { intervention: Intervention; philosopher?: Philosopher; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="dark-academia-card max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="pass-indicator text-[#8b5254]">Pass {intervention.pass_number} · {PASS_NAMES[intervention.pass_number - 1]}</p><h2 className="text-3xl">{philosopher?.full_name}</h2><p className="italic text-[#465f75]/65">{intervention.position_label}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button></div><p className="drop-cap text-lg leading-relaxed mt-6 whitespace-pre-line text-[#465f75]">{intervention.response_text}</p><div className="mt-7 border-t border-[#4a392d]/20 pt-5"><p className="font-heading text-xl text-[#4a392d] mb-3">Source status</p>{intervention.citations.map((citation) => <div key={citation.label} className="p-3 bg-[#eae1ca]/60 border border-[#4a392d]/15 mb-2"><span className={`citation-badge ${citation.verified ? '' : 'citation-unverified'}`}><BookOpen size={11} /> {citation.label}</span><p className="text-xs italic mt-2 text-[#465f75]/65">{citation.verified ? 'Retrieved or verified source reference.' : 'Profile-grounded interpretation; underlying passage requires corpus retrieval.'}</p></div>)}</div></div></div>; }

function ProfileModal({ philosopher, onClose }: { philosopher: Philosopher; onClose: () => void }) { const profile = philosopher.profile; const keys = ['identity', 'ontology', 'epistemology', 'conception_of_human_subject', 'conception_of_society', 'conception_of_power', 'conception_of_freedom', 'theory_of_social_change', 'conception_of_technology', 'rhetorical_style', 'what_he_sees_well', 'what_he_overlooks']; return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div className="dark-academia-card max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4 mb-6"><div><p className="pass-indicator text-[#8b5254]">Seat {philosopher.seat_order + 1} · intellectual profile</p><h2 className="text-4xl">{philosopher.full_name}</h2><p className="italic text-[#465f75]/70">{philosopher.birth_year} — {philosopher.death_year}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose}><X size={17} /></button></div><div className="flex flex-wrap gap-2 mb-6">{philosopher.analytical_center.map((item) => <span key={item} className="citation-badge">{item}</span>)}</div><div className="grid md:grid-cols-2 gap-5">{keys.map((key) => { const value = profile[key]; return <div key={key} className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">{key.replace(/_/g, ' ')}</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{Array.isArray(value) ? value.join(' · ') : String(value ?? '')}</p></div>; })}</div></div></div>; }

export default App;
