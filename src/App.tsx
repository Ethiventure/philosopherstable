import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CirclePause,
  CirclePlay,
  Download,
  ExternalLink,
  Feather,
  Info,
  Library,
  ConciergeBell,
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
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_BY_SLUG, PHILOSOPHER_DATA, renderPersona } from '@/philosophers';
import { CABINET_DEBTS, cabinetHeirs, relationshipLine, tableStancesLine } from '@/philosophers/influences';
import {
  DEFAULT_ACCESSIBILITY,
  PASS_DESCRIPTIONS,
  PASS_NAMES,
  type AccessibilitySettings,
  type Intervention,
  type Philosopher,
  type StyleEssence,
} from '@/types';
import { buildCodaEarlyPrompt, buildCodaEndPrompt, buildCodaPrompt, buildClosingScan, buildTurnInstruction, buildUserMessage, CODA_REPAIR_SUFFIX, CODA_SYSTEM, drawThreadCity, getTurnKind, GLOSSARY_SHAPE, LOW_CLOSING_REMINDER, PROMPT_VERSION, STRUCTURED_OUTPUT_HINT } from '@/lib/dialectic/prompts';
import { LlmError, RATES_AS_OF, estimateCost, repairBreakdown, repairTotals, resetUsage, sharesPassage, usageTotals, type LlmErrorCode, type TurnOutput } from '@/lib/llm';
import { DEEPINFRA_BACKUP_LABEL, DEEPINFRA_PRIMARIES, ALIBABA_MODEL_OPTIONS, CUSTOM_MODEL_VALUE, GROQ_MODEL_OPTIONS, OPENROUTER_PAID_OPTIONS, loadSettings, saveSettings, type CabinetSettings, type DeepInfraPrimary } from '@/lib/settings';
import { applyDisplay, loadDisplay, saveDisplay } from '@/lib/preferences';
import { generateTurnGroq, testGroqKey } from '@/lib/groq';
import { generateTurnShared } from '@/lib/shared';
import { generateTurnOpenRouter, testOpenRouterKey, lastOpenRouterModel } from '@/lib/openrouter';
import { generateTurnDeepInfra, testDeepInfraKey, lastDeepInfraModel } from '@/lib/deepinfra';
import { generateTurnAlibaba, testAlibabaKey, lastAlibabaModel } from '@/lib/alibaba';
import { generateTurnTogether, testTogetherKey, TOGETHER_MODEL } from '@/lib/together';
import { entriesForNumbers, findInventedTags, splitLabels } from '@/lib/footnotes';
import { smartCut } from '@/lib/rag-text';
import { extractPassages, formatGroundedBlock, groundableSource } from '@/lib/extract';
import { searchThinkerPassages } from '@/lib/rag-ground';
import { verifyQuotes } from '@/lib/verify';
import { createTtsController, ensureVoices, isTtsSupported, listVoices, resolveVoice, type TtsItem, type TtsStatus } from '@/lib/tts';
import ServiceChat, { type ServiceLogEntry } from '@/components/ServiceChat';
import GenealogyMap from '@/components/GenealogyMap';

// "Read more" resolution: the philosopher's most relevant text from the corpus
// manifest. Entries flagged with link_note (broken link) are skipped unless
// nothing else exists. Prefers an ingested magnum opus (readable right now),
// then any ingested work, then the magnum opus, then whatever is listed first.
function getReadMoreSource(philosopherName: string) {
  const works = CORPUS_SOURCES_DATA.filter((s) =>
    s.author.toLowerCase().includes(philosopherName.toLowerCase()));
  if (!works.length) return null;
  const usable = works.filter((s) => !s.link_note);
  const pool = usable.length ? usable : works;
  return pool.find((s) => s.is_magnum_opus && s.full_text_ingested)
    ?? pool.find((s) => s.full_text_ingested)
    ?? pool.find((s) => s.is_magnum_opus)
    ?? pool[0] ?? null;
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

/**
 * Footnote line for a turn: model-claimed work labels resolved to stable
 * manifest numbers ("Read similar: 3, 9"). Numbers match the [#n] badges in
 * Further reading and the export Reading List. Unmatched labels render once
 * as plain unverified text — never numbered, never dropped.
 */
function ReadSimilar({ philosopherName, labels, onOpenSources }: { philosopherName: string; labels: string[]; onOpenSources: (n: number) => void }) {
  // Bare URLs are never work claims (usually the model echoing a shown link)
  // — drop them instead of printing them as "claimed".
  const { numbers, unmatched } = splitLabels(philosopherName, labels.filter((l) => !/^https?:\/\//i.test(l.trim())));
  if (!numbers.length && !unmatched.length) return null;
  return (
    <p className="text-sm italic text-[#465f75]/75 mt-3">
      {numbers.length > 0 && (
        <>Read similar: {numbers.map((n, i) => (
          <span key={n}>
            <button
              onClick={() => onOpenSources(n)}
              className="underline underline-offset-2 decoration-[#8b5254]/40 hover:decoration-[#8b5254] text-[#8b5254]"
              aria-label={`Open source ${n} in Further reading`}
            >{n}</button>{i < numbers.length - 1 ? ', ' : ''}
          </span>
        ))}</>
      )}
      {unmatched.length > 0 && (
        <span className="text-[#465f75]/60">{numbers.length > 0 ? ' · also claimed: ' : 'Claimed, not in manifest: '}{unmatched.join('; ')}</span>
      )}
    </p>
  );
}
// Shapes a live turn into an Intervention. Citations are the model's own
// claims (verified: false); RAG grounding receipts record what it was
// actually shown, checkable in the inspector.
function toIntervention(
  philosopher: Philosopher,
  pass: number,
  index: number,
  output: TurnOutput,
  previousSpeaker: Philosopher | null,
): Intervention {
  const kind = getTurnKind(pass, index + 1);
  const isOpening = kind === 'opening' && !previousSpeaker;
  // The margins note is a prompt input, never a cited work (Sep 21 2026:
  // 30B cited it as a source). Drop such labels before they reach the
  // footnote matcher, which would honestly — but noisily — list them.
  const claimedWorks = output.works_referenced.filter(
    (work) => !/notes? from the margins/i.test(work),
  );
  const citations = claimedWorks.length > 0
    ? claimedWorks.map((work) => ({ label: work, verified: false }))
    : [{ label: `[${philosopher.name.toUpperCase()}, SOURCE-GROUNDED PROFILE]`, verified: false }];
  // Mechanical address prefix (Sep 2026): the turn opens with PREV's name
  // because the app puts it there, not because the model remembered to.
  // Models that name PREV themselves get deduped first ("Hegel, Hegel, …"
  // observed live) — strip any leading self-naming before prefixing.
  const bodyParts = [
    output.negation,
    output.incorporation,
    output.reformulation,
  ].filter((s) => s && s.trim());
  const deduped = previousSpeaker
    ? bodyParts.map((s, i) => i === 0
      ? s.replace(new RegExp(`^${previousSpeaker.name.split(' ')[0]}[,\\s]+(${previousSpeaker.name}[,\\s]+)?`, 'i'), '')
      : s)
    : bodyParts;
  const body = previousSpeaker && deduped.length
    ? [`${previousSpeaker.name}, ${deduped[0]}`, ...deduped.slice(1)].join('\n\n')
    : deduped.join('\n\n');
  return {
    id: `live-${pass}-${index}`,
    meeting_id: 'live',
    philosopher_id: philosopher.id,
    pass_number: pass,
    seat_position: index,
    response_text: body,
    sections: {
      negation: output.negation,
      incorporation: output.incorporation,
      reformulation: output.reformulation,
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

/** One card in the reading deck: a turn, or a margins note where it spoke. */
export type DeckEntry =
  | { kind: 'turn'; intervention: Intervention }
  | { kind: 'margins'; which: 'early' | 'late' | 'end' };

function App() {
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  // TEMPORARY default (Sep 21 2026): the leftistsforAI moderation question,
  // so test sittings start with zero setup. Revert to the education question
  // when the test round ends (it stays the family-eval default).
  const [question, setQuestion] = useState('leftistsforAI sub on Reddit is “A space for leftists discussing Artificial Intelligence from a labor, ownership, and political-economy perspective. Topics include worker impact, platform power, automation, regulation, and collective control of Al infrastructure”. What should we encourage posts about and what types of posts should we take down as bracketed off topics which don’t benefit us?');
  const [activePass, setActivePass] = useState(0);
  const [activeAgent, setActiveAgent] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [coda, setCoda] = useState<{ text: string } | null>(null);
  const [codaError, setCodaError] = useState<string | null>(null);
  // The margin note runs between pass 2 and pass 3, so it gets its own
  // visible status — a silent catch here once swallowed a whole margin-notes
  // failure with no trace.
  const [codaState, setCodaState] = useState<'idle' | 'writing' | 'failed'>('idle');
  // Ref mirror of the note text so pass-3 turns can carry it in the same run
  // (state updates do not apply synchronously inside the async loop).
  const codaRef = useRef<string | null>(null);
  // Early margin note: same voice, different job — reads pass 1 for
  // contradictions, translations, banked actionables and missing perspectives
  // so pass 2 can let them in. Own status + ref, same contract as the late one.
  const [codaEarly, setCodaEarly] = useState<{ text: string } | null>(null);
  const [codaEarlyError, setCodaEarlyError] = useState<string | null>(null);
  const [codaEarlyState, setCodaEarlyState] = useState<'idle' | 'writing' | 'failed'>('idle');
  const codaEarlyRef = useRef<string | null>(null);
  // Ending summary: the third margins note, running once after the final
  // seat of pass 3. Own status + ref, same contract as the other two.
  const [codaEnd, setCodaEnd] = useState<{ text: string } | null>(null);
  const [codaEndError, setCodaEndError] = useState<string | null>(null);
  const [codaEndState, setCodaEndState] = useState<'idle' | 'writing' | 'failed'>('idle');
  const codaEndRef = useRef<string | null>(null);
  // Per-turn grounding receipts: what each speaker was actually shown, so its
  // quotes stay checkable after the fact. Keyed by intervention id.
  const [groundMap, setGroundMap] = useState<Record<string, { title: string; number: number; passages: string[]; reason: string | null }>>({});
  // Per-turn margins receipts: which pass-3 prompts carried the note in their
  // survey. Attached ≠ answered — the badge says "saw", never "obeyed".
  const [noteMap, setNoteMap] = useState<Record<string, true>>({});
  // Per-turn echo flags: the detector tripped on this turn's wording against
  // earlier sitting text. Kept (no retry — the rewrite retry was rolled back
  // Sep 19 as spend-without-gain) and badged, so grading sees every hit.
  const [echoMap, setEchoMap] = useState<Record<string, true>>({});
  // Per-turn provenance for the export footer (provider switches mid-session
  // stay honest). Consecutive duplicates collapse at render time.
  const provRef = useRef<string[]>([]);
  // Thread city: drawn per sitting (not per turn, never by the model — it has
  // no memory of last time). Resume keeps the sitting's city.
  const threadCityRef = useRef<string>('');
  const [threadCity, setThreadCity] = useState<string>('');
  // Levels actually generated at: the export used to print the picker's live
  // value, so a sitting run at Medium exported as "low" if the picker moved
  // before export (Sep 19 2026). Begin records, resumes append on change, the
  // export prints this trail instead of the picker.
  const runLevelsRef = useRef<string[]>([]);
  const pushRunLevel = (level: string) => {
    if (runLevelsRef.current[runLevelsRef.current.length - 1] !== level) runLevelsRef.current.push(level);
  };
  // Sitting stopwatch: started on Begin, read at export. The owner grades
  // pace but is bad at the stopclock — the export keeps time instead.
  const sittingStartedAt = useRef<number | null>(null);
  // Debate clock stops when the last turn lands; the export clock runs to
  // export (desk + reading included). Two clocks because they answer
  // different questions: engine pace vs session cost.
  const debateEndedAt = useRef<number | null>(null);
  // Stock variants already spent this session (any seat). Each of the 90 may
  // be used once across the whole table; the spent list rides in each prompt.
  const spentRef = useRef<string[]>([]);
  const markSpentVariants = (text: string) => {
    const lower = text.toLowerCase();
    // Short signature: the variant's first six words with the (X) slot
    // stripped. Models paraphrase the tail ("To be sure, where your argument
    // stands…"), so full-string matching never fired and spent variants kept
    // returning every turn — the repetition loop. The signature catches the
    // opening shape; the old full-fragment check stays as a second net.
    // Floor of five words: shorter variants ("I must agree that…") collide
    // with ordinary prose, so they match on the full fragment only.
    const signature = (variant: string) => {
      const words = variant.replace(/\(X\)/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(' ').slice(0, 6);
      return words.length >= 5 ? words.join(' ') : null;
    };
    for (const p of philosophers) {
      const slots = p.style_essence.stock_phrases;
      for (const slot of [slots.rebuttal, slots.concession, slots.reframing]) {
        for (const variant of slot) {
          if (spentRef.current.includes(variant)) continue;
          const fragments = variant
            .split('(X)')
            .map((f) => f.trim())
            .filter((f) => f.replace(/[^a-z]/gi, '').length > 12);
          const sig = signature(variant);
          if (
            (sig !== null && lower.includes(sig)) ||
            fragments.some((f) => lower.includes(f.toLowerCase()))
          ) {
            spentRef.current.push(variant);
          }
        }
      }
    }
  };

  /** Human-readable "model via key" label, e.g. DeepInfra (Llama 3.3 70B, visitor key). */
  const provenanceLabel = (snap: CabinetSettings): string => {
    switch (snap.provider) {
      case 'shared':
        return 'Cabinet shared key (server-side Groq)';
      case 'openrouter':
        return snap.openRouterMode === 'paid' && snap.openRouterModel.trim()
          ? `OpenRouter paid ${lastOpenRouterModel || snap.openRouterModel.trim()} (visitor key)`
          : 'OpenRouter free cycle (visitor key)';
      case 'groq':
        return `Groq ${snap.groqModel} (visitor key)`;
      case 'deepinfra':
        return `DeepInfra ${lastDeepInfraModel} (visitor key)`;
      case 'together':
        return `Together ${TOGETHER_MODEL} (visitor key)`;
      case 'alibaba':
        return `Alibaba ${lastAlibabaModel} (visitor key)`;
      default:
        return 'Unknown provider';
    }
  };
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null);
  // Default cabinet: Marx, Bloch, Weil, Bookchin (owner has read all four)
  // plus Hegel (models find him hardest — the standing stress test).
  // labour, hope, municipality, and control, ending in new forms of life.
  // Full chronological order lives in DEFAULT_SEATING_ORDER.
  // Default five matches the family-eval cabinet (Hegel/Marx/Bloch/Bookchin/
  // Deleuze) so test sittings start comparable with zero seat-toggling.
  const [activeSlugs, setActiveSlugs] = useState<string[]>(['hegel', 'marx', 'bloch', 'bookchin', 'deleuze']);
  const [showSources, setShowSources] = useState(false);
  const [sourceTarget, setSourceTarget] = useState<number | null>(null);
  const openSourcesAt = (n?: number) => {
    setSourceTarget(n ?? null);
    setShowSources(true);
  };
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'key' | 'seats' | 'voice' | 'display'>('seats');
  // Philosophers' Service desk: floating tutor window + its export log.
  const [showService, setShowService] = useState(false);
  const [serviceLog, setServiceLog] = useState<ServiceLogEntry[]>([]);
  const openSettings = (tab: 'key' | 'seats' | 'voice' | 'display' = 'seats') => {
    setSettingsTab(tab);
    setShowSettings(true);
  };
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
    ttsRef.current?.stop();
    setShowWelcome(false);
  };
  const [settings, setSettings] = useState<CabinetSettings>(() => loadSettings());
  const [thinkingName, setThinkingName] = useState<string | null>(null);
  const [runError, setRunError] = useState<{ message: string; code: LlmErrorCode } | null>(null);
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
    ttsRef.current = createTtsController({ rate: display.ttsRate, voiceURI: display.ttsVoiceURI, onStatus: setTtsStatus });
    return () => {
      ttsRef.current?.stop();
      ttsRef.current = null;
    };
  }, [display.ttsRate, display.ttsVoiceURI]);

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

  // Abridged spoken welcome (~40 seconds): the assembly, the seats, the keys.
  const WELCOME_SPOKEN = 'How this cabinet works. We are twelve thinkers at this table, from Spinoza to Fisher, and none of us may rule it. Each of us speaks only against its predecessor — negating, preserving, reformulating — until your question returns to you, changed, after three passes. To begin: open Settings, choose who gets a seat — five is the lean assembly, twelve the full one — press Begin cabinet, and read at your own pace. The shared key carries the first sittings; when it runs dry, bring your own. We never see your keys and want no login — we are only here for the debate.';

  const toggleWelcomeSpeech = () => {
    if (!ttsSupported) return;
    if (ttsStatus.state !== 'idle' && ttsStatus.currentId === 'welcome') {
      ttsRef.current?.stop();
      return;
    }
    ttsRef.current?.speak([{ id: 'welcome', heading: 'How this cabinet works', text: WELCOME_SPOKEN }]);
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
  // Service desk offers all twelve thinkers in chronological seating order,
  // whether or not they hold a seat in this sitting.
  const allOrderedPhilosophers = useMemo(() => DEFAULT_SEATING_ORDER
    .map((slug) => philosophers.find((p) => p.slug === slug))
    .filter((p): p is Philosopher => p !== undefined), [philosophers]);
  const currentSpeaker = orderedPhilosophers[activeAgent];
  const providerKey = (s: CabinetSettings) =>
    s.provider === 'shared' ? ''
    : s.provider === 'openrouter' ? s.openRouterApiKey
    : s.provider === 'groq' ? s.groqApiKey
    : s.provider === 'deepinfra' ? s.deepInfraApiKey
    : s.provider === 'together' ? s.togetherApiKey
    : s.provider === 'alibaba' ? s.alibabaApiKey
    : '';
  const hasKey = settings.provider === 'shared' ? true : providerKey(settings).trim().length > 0;
  // Groq's free tier walls single requests at ~7k input tokens: Medium/High
  // prompts (≈7.9k measured Sep 21 2026 — the request itself exceeds the
  // allowance, so waiting/resuming can never pass) exceed it, so the shared
  // key AND visitor Groq keys run Low sittings only — stated up front, with
  // a one-click path to Low.
  const freeTierNeedsLow = (settings.provider === 'shared' || settings.provider === 'groq') && settings.intensity !== 'low';
  const activeKeyLabel = settings.provider === 'shared'
    ? 'Shared cabinet key'
    : settings.provider === 'openrouter' ? 'OpenRouter API key'
    : settings.provider === 'groq' ? 'Groq API key'
    : settings.provider === 'deepinfra' ? 'DeepInfra API key'
    : settings.provider === 'together' ? 'Together API key'
    : settings.provider === 'alibaba' ? 'Alibaba API key'
    : 'API key';
  const activeKeyReady = (s: CabinetSettings) =>
    s.provider === 'shared' ? true : providerKey(s).trim().length > 0;
  const isComplete = orderedPhilosophers.length > 0 && interventions.length >= orderedPhilosophers.length * 3;

  // Reading deck: always starts at the first card and stays where put — only
  // the reader's manicule moves it forward. New arrivals collect in the
  // "up next" pile; the table card always shows the current turn.
  const [readIdx, setReadIdx] = useState(0);
  const [freshId, setFreshId] = useState<string | null>(null);
  const deckRef = useRef<HTMLElement>(null);
  const prevCountRef = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = interventions.length;
    if (interventions.length === 0) {
      setReadIdx(0);
      setFreshId(null);
      return;
    }
    if (interventions.length > prev) {
      const newest = interventions[interventions.length - 1];
      if (newest) setFreshId(newest.id);
    }
  }, [interventions]);
  useEffect(() => {
    if (!freshId) return;
    const timer = window.setTimeout(() => setFreshId(null), 2600);
    return () => window.clearTimeout(timer);
  }, [freshId]);

  // Deck order is chronological: pass 1, the early note where it spoke,
  // pass 2, the late note where it spoke, then pass 3, then the closing
  // summary. Notes are cards in the flow, not appendices.
  const deckEntries: DeckEntry[] = useMemo(() => {
    const list: DeckEntry[] = interventions
      .filter((item) => item.pass_number <= 1)
      .map((intervention) => ({ kind: 'turn', intervention }));
    if (codaEarly || codaEarlyState !== 'idle') list.push({ kind: 'margins', which: 'early' });
    for (const intervention of interventions.filter((item) => item.pass_number === 2)) {
      list.push({ kind: 'turn', intervention });
    }
    if (coda || codaState !== 'idle') list.push({ kind: 'margins', which: 'late' });
    for (const intervention of interventions.filter((item) => item.pass_number >= 3)) {
      list.push({ kind: 'turn', intervention });
    }
    if (codaEnd || codaEndState !== 'idle') list.push({ kind: 'margins', which: 'end' });
    return list;
  }, [interventions, coda, codaState, codaEarly, codaEarlyState, codaEnd, codaEndState]);

  const jumpToLatest = () => {
    if (!deckEntries.length) return;
    setReadIdx(deckEntries.length - 1);
    setFreshId(null);
    deckRef.current?.scrollIntoView({ behavior: display.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const latestForTable = (() => {
    const item = interventions[interventions.length - 1];
    if (!item) return null;
    const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
    if (!philosopher) return null;
    return { intervention: item, philosopher };
  })();

  // Async loop over passes × seats (Phase 2f). Each turn sees only the
  // question, PREV's full text, and the speaker's own prior one-liners —
  // plus, in pass 3 only, every other seat's one-line determinations.
  // The pause flag (runRef) is checked between turns and after each call.
  const generateWithProvider = (
    snap: CabinetSettings,
    systemPrompt: string,
    userMessage: string,
    longForm: boolean,
  ): Promise<TurnOutput> => {
    switch (snap.provider) {
      case 'shared':
        return generateTurnShared({ systemPrompt, userMessage, longForm });
      case 'openrouter':
        return generateTurnOpenRouter({
          apiKey: snap.openRouterApiKey,
          systemPrompt,
          userMessage,
          longForm,
          mode: snap.openRouterMode,
          modelId: snap.openRouterModel,
        });
      case 'groq':
        return generateTurnGroq({
          apiKey: snap.groqApiKey,
          model: snap.groqModel,
          systemPrompt,
          userMessage,
          longForm,
        });
      case 'deepinfra':
        return generateTurnDeepInfra({
          apiKey: snap.deepInfraApiKey,
          primary: snap.deepInfraPrimary,
          systemPrompt,
          userMessage,
          longForm,
        });
      case 'together':
        return generateTurnTogether({
          apiKey: snap.togetherApiKey,
          systemPrompt,
          userMessage,
          longForm,
        });
      case 'alibaba':
        return generateTurnAlibaba({
          apiKey: snap.alibabaApiKey,
          model: snap.alibabaModel,
          systemPrompt,
          userMessage,
          longForm,
        });
      default:
        throw new LlmError('Unknown provider. Pick one in Settings → Key.', false, 'unknown');
    }
  };

  const runLoop = async (runId: number, seats: Philosopher[], startCount: number, collected: Intervention[], snap: CabinetSettings) => {
    const total = seats.length * 3;
    for (let n = startCount; n < total; n += 1) {
      if (runRef.current !== runId) return;
      const pass = Math.floor(n / seats.length);
      const index = n % seats.length;
      // The early note barges in once, right before the second round,
      // reading only pass 1 — contradictions, translations, banked actionables,
      // missing perspectives. A failed note never blocks pass 2.
      if (pass === 1 && index === 0 && !codaEarlyRef.current) {
        await runCoda(runId, collected, snap, 'early');
        if (runRef.current !== runId) return;
      }
      // The late margin note barges in once, right before the final round,
      // reading only the first two passes. A failed note never blocks
      // pass 3 — the sitting stands without it and the retry button
      // re-runs it.
      if (pass === 2 && index === 0 && !codaRef.current) {
        await runCoda(runId, collected, snap, 'late');
        if (runRef.current !== runId) return;
      }
      // Pass 3 runs the rotation backwards: each seat answers the answer just
      // given from its left. The seat that just closed pass 2 does NOT open
      // (it would answer itself and never get critiqued) — it closes pass 3
      // instead, returning the question. Every seat still speaks exactly once.
      const order = pass === 2
        ? [...seats.slice(0, seats.length - 1).reverse(), seats[seats.length - 1]]
        : seats;
      const speaker = order[index];
      if (!speaker) continue;
      const seatPos = seats.indexOf(speaker);
      const isOpeningTurn = n === 0;
      // PREV is whoever spoke just before in time — across pass boundaries too.
      const prevItem = collected[collected.length - 1] ?? null;
      const previousSpeaker = isOpeningTurn || !prevItem
        ? null
        : seats.find((s) => s.id === prevItem.philosopher_id) ?? null;
      const isFinalTurn = pass === 2 && index === seats.length - 1;
      const kind = getTurnKind(pass + 1, index + 1);
      // The pair's history rides along: where the map holds a debt between
      // speaker and PREV (either direction), the turn meets them through it.
      const pairHistory = previousSpeaker
        ? relationshipLine(speaker.slug, previousSpeaker.slug, previousSpeaker.name, snap.intensity === 'low')
        : null;
      // The room's history rides too: one compressed line on how the speaker
      // stands toward every other sitting seat (PREV already covered above).
      const tableHistory = tableStancesLine(
        speaker.slug,
        seats.map((s) => ({ slug: s.slug, name: s.name })),
        previousSpeaker?.slug ?? null,
        snap.intensity === 'low',
      );
      const relationshipBlock = [pairHistory, tableHistory].filter(Boolean).join('\n');
      const ownPriorLines = collected
        .filter((item) => item.philosopher_id === speaker.id && item.sections?.new_contribution)
        .map((item) => String(item.sections?.new_contribution));
      // Surveys: pass 2 carries ONLY the early note (pass-1 purity otherwise
      // holds); pass 3 carries the late note first, then other seats'
      // determinations, labelled by name, so the final rotation can invoke
      // the most striking ideas — including the note's demands.
      const noteEntry = pass === 1 && codaEarlyRef.current
        ? [{ name: 'Notes from the margins (after pass 1)', line: codaEarlyRef.current }]
        : pass === 2 && codaRef.current
          ? [{ name: 'Notes from the margins', line: codaRef.current }]
          : [];
      const othersPriorLines = pass === 1
        ? [...noteEntry]
        : pass === 2
          ? [
            ...noteEntry,
            ...collected
              .filter((item) => item.philosopher_id !== speaker.id && item.sections?.new_contribution)
              .map((item) => ({
                name: seats.find((s) => s.id === item.philosopher_id)?.name ?? 'A seat',
                line: String(item.sections?.new_contribution),
              })),
          ]
          : [];
      const turnInstruction = buildTurnInstruction({
        kind,
        prevName: previousSpeaker?.name ?? null,
        isFinalSeat: isFinalTurn,
        longForm: snap.longForm,
        reversed: pass === 2,
        marginsNote: pass === 2 && !!codaRef.current,
        marginsEarly: pass === 1 && !!codaEarlyRef.current,
        marginsFirst: pass === 2 && index === 0 && !!codaRef.current,
        intensity: snap.intensity,
        heat: typeof speaker.profile['emotional_tone'] === 'string' ? speaker.profile['emotional_tone'] : undefined,
        threadCity: threadCityRef.current || null,
        pass: pass + 1,
      });
      const systemPrompt = renderPersona(speaker, snap.intensity);
      // Efficient economy trims the fed-back predecessor text (the displayed
      // and exported transcript keeps everything). Voices are untouched —
      // personas are never trimmed. Shared/Groq always trim: Groq's free tier
      // walls single requests at ~7k input tokens (observed 413 at 7271).
      const rawPrev = n === 0 ? null : (collected[collected.length - 1]?.response_text ?? null);
      const trimPrev = snap.economy === 'efficient' || snap.provider === 'shared' || snap.provider === 'groq';
      // Tail-keep (Sep 2026): the live edge the next seat must answer sits at
      // the END of PREV (handoff/problem), while the opening paragraph is
      // recap of older material. Keeping the head answered the recap.
      const prevText = rawPrev && trimPrev && rawPrev.length > 1200
        ? `[…opening trimmed for economy — answer the closing lines below, not the recap above; the full text stands in the transcript]\n${rawPrev.slice(-1200)}`
        : rawPrev;
      // Experimental grounding (on by default): searched passages from the
      // speaker's own indexed works first (no fetch, no quota beyond the
      // turn itself), live page fetching as fallback. Fails soft.
      // The receipt (what was actually shown) is stored per turn for verification.
      let groundingBlock = '';
      let groundingReceipt: { title: string; number: number; passages: string[]; reason: string | null } | null = null;
      if (snap.grounding) {
        // Shared/Groq take the lean ration (2 short passages): Groq's free
        // tier walls single requests at ~7k input tokens (observed 413 at
        // 7271). Other providers keep the full six.
        const leanRation = snap.provider === 'shared' || snap.provider === 'groq';
        try {
          // Query in the speaker's OWN words: the question plus their own
          // developing line. PREV's full text used to ride here — another
          // author's diction pulling other-framework vocabulary out of this
          // thinker's shard, which read as near-random passages.
          const hit = await searchThinkerPassages(
            speaker.full_name,
            `${question} ${ownPriorLines.join(' ')}`.slice(0, 800),
            leanRation ? 2 : 6,
            snap.intensity,
            leanRation ? 650 : 0,
          );
          if (runRef.current !== runId) return;
          if (hit) {
            groundingBlock = hit.block;
            groundingReceipt = hit.receipt;
          }
        } catch {
          // Index unavailable — fall through to live fetching below.
        }
        if (!groundingBlock) {
          const g = groundableSource(speaker.name);
          if (g?.source.source_url) {
            const prevSlice = (collected[collected.length - 1]?.response_text ?? '').slice(0, 300);
            const { passages, reason } = await extractPassages(g.source.source_url, question, prevSlice);
            if (runRef.current !== runId) return;
            // Same lean ration for the live fallback on shared/Groq.
            const rationed = leanRation
              ? passages.slice(0, 2).map((p) => ({ text: smartCut(p.text, 650) }))
              : passages;
            groundingBlock = formatGroundedBlock(g.source.title, g.number, rationed, snap.intensity);
            groundingReceipt = {
              title: g.source.title,
              number: g.number,
              passages: rationed.map((p) => p.text),
              reason,
            };
          }
        }
      }
      const messageParts = [
        buildUserMessage({
          question,
          prevText,
          relationshipLine: relationshipBlock || null,
          ownPriorLines,
          // Lean ration on shared/Groq: the margins note (first when present)
          // plus five seats — the full survey can't fit Groq's free-tier wall.
          othersPriorLines: (snap.provider === 'shared' || snap.provider === 'groq') && othersPriorLines.length > 6
            ? [othersPriorLines[0], ...othersPriorLines.slice(1, 6)]
            : othersPriorLines,
          turnInstruction,
          stockBlock: (() => {
            // The opener has no predecessor ("Do not refer to any other
            // thinker"), so PREV-addressed openers must not ride in its
            // prompt — they used to, contradicting the opening instruction.
            if (isOpeningTurn) return '';
            // Only unspent variants ride in the prompt: showing the whole
            // toolkit every turn kept spent openers salient and they came
            // back verbatim ("To be sure" every other paragraph). When a
            // slot is exhausted it drops out instead of repeating.
            const unspent = (vs: string[]) => vs.filter((v) => !spentRef.current.includes(v));
            const rebuttal = snap.intensity === 'low' ? [] : unspent(speaker.style_essence.stock_phrases.rebuttal);
            // Low sees no toolkit at all: the transcript shows variants lifted
            // verbatim three-to-a-turn despite "at most ONE" — the entry
            // is ordered in own words by LOW ORDERS instead.
            const concession = snap.intensity === 'low' ? [] : unspent(speaker.style_essence.stock_phrases.concession);
            const reframing = snap.intensity === 'low' ? [] : unspent(speaker.style_essence.stock_phrases.reframing);
            if (!rebuttal.length && !concession.length && !reframing.length) return '';
            return [
              'YOUR TRANSITIONAL TOOLKIT (your own phrasing — at most ONE of these per turn, often none; never force them, and never open two turns of yours the same way):',
              // Low never sees the rebuttal variants: every one of them is an
              // attack shape, and the transcript shows turns open with them
              // verbatim. Own-words openings carry the entry instead.
              ...(rebuttal.length ? [`REBUTTAL: ${rebuttal.join(' / ')}`] : []),
              ...(concession.length ? [`CONCESSION: ${concession.join(' / ')}`] : []),
              ...(reframing.length ? [`REFRAMING: ${reframing.join(' / ')}`] : []),
            ].join('\n');
          })(),
          spentPhrases: isOpeningTurn || snap.intensity === 'low' ? [] : spentRef.current,
          intensity: snap.intensity,
          surveyKind: pass === 1 ? 'early' : 'late',
        }),
      ];
      if (groundingBlock) messageParts.push('', groundingBlock);
      // Closing scan at every level just before the JSON hint (closest
      // instruction to generation; the hint itself stays final). Low keeps
      // its own language check on top.
      if (snap.intensity === 'low') messageParts.push('', LOW_CLOSING_REMINDER);
      messageParts.push('', buildClosingScan(snap.intensity));
      const userMessage = [...messageParts, '', STRUCTURED_OUTPUT_HINT + (snap.intensity === 'medium' ? ` ${GLOSSARY_SHAPE}` : '')].join('\n');
      setActivePass(pass);
      setActiveAgent(seatPos);
      setThinkingName(speaker.full_name);
      if (typeof console !== 'undefined') console.info(`[Turn] pass ${pass + 1} ${speaker.full_name} intensity=${snap.intensity}${pass === 1 && codaEarlyRef.current ? ' early-margins=attached' : ''}${pass === 2 && codaRef.current ? ' margins=attached' : ''}.`);
      let output: TurnOutput;
      try {
        output = await generateWithProvider(snap, systemPrompt, userMessage, snap.longForm);
      } catch (error) {
        if (runRef.current !== runId) return;
        if (error instanceof LlmError) {
          setRunError({ message: error.message, code: error.code });
        } else {
          setRunError({ message: error instanceof Error ? error.message : 'Unknown provider error.', code: 'unknown' });
        }
        setIsRunning(false);
        setThinkingName(null);
        return;
      }
      if (runRef.current !== runId) return;
      // Gloss audit hook (Sep 2026): the auto-retry was rolled back as
      // spend-without-gain — the fifth key stays as a cheap nudge, but no
      // turn is ever re-sent for it. Bare-term counts, if ever needed, go here.
      // Echo watch (Sep 2026): the rewrite retry was rolled back as
      // spend-without-gain (10 retries, echo persisted) — the detector stays
      // as a cost-free logger so evals keep measuring, and flags the card
      // with a visible badge. Revert: delete block + badge + echoMap state.
      // (Computed here against pre-turn priors; filed under the item id below.)
      // Loan-aware (Sep 2026): grams appearing in shown grounding passages
      // are shared source vocabulary, not echo — excluded on both sides so
      // borrowing more never badges more. Echo means shared invention.
      const loanTexts = [
        ...collected.flatMap((item) => groundMap[item.id]?.passages ?? []),
        ...(groundingReceipt?.passages ?? []),
      ];
      const echoHit = sharesPassage(
        `${output.negation} ${output.reformulation}`,
        [
          ...collected.map((item) => item.response_text),
          ...(codaEarlyRef.current ? [codaEarlyRef.current] : []),
          ...(codaRef.current ? [codaRef.current] : []),
        ],
        8,
        loanTexts,
      );
      if (echoHit && typeof console !== 'undefined') {
        console.warn(`[Echo] overlap kept (logger only) for ${speaker.full_name}.`);
      }
      const item = toIntervention(speaker, pass + 1, seatPos, output, previousSpeaker);
      collected.push(item);
      markSpentVariants(item.response_text);
      if (echoHit) {
        const id = item.id;
        setEchoMap((m) => ({ ...m, [id]: true }));
      }
      if (groundingReceipt) {
        const receipt = groundingReceipt;
        setGroundMap((m) => ({ ...m, [item.id]: receipt }));
      }
      // Receipt: this turn's prompt carried a margins note in its survey,
      // so "did they see it" is never a guess — check the badge + console.
      if (pass === 1 && noteEntry.length > 0) {
        const id = item.id;
        setNoteMap((m) => ({ ...m, [id]: true }));
        if (typeof console !== 'undefined') console.info(`[Margins] early note in survey for ${speaker.full_name} (${codaEarlyRef.current?.length ?? 0} chars).`);
      }
      if (pass === 2 && noteEntry.length > 0) {
        const id = item.id;
        setNoteMap((m) => ({ ...m, [id]: true }));
        if (typeof console !== 'undefined') console.info(`[Margins] note in survey for ${speaker.full_name} (${codaRef.current?.length ?? 0} chars).`);
      }
      provRef.current.push(provenanceLabel(snap));
      setInterventions([...collected]);
      if (collected.length >= seats.length * 3 && debateEndedAt.current === null) {
        debateEndedAt.current = Date.now();
      }
    }
    setThinkingName(null);
    setIsRunning(false);
    setActivePass(2);
    // The ending summary barges in once, after the final seat, reading only
    // the final round. A failed note never breaks the sitting.
    if (typeof console !== 'undefined') console.info('[Margins-end] trigger reached.');
    if (!codaEndRef.current) {
      await runCoda(runId, collected, snap, 'end');
      if (runRef.current !== runId) return;
    }
    setActivePass(2);
    // Pass 3 runs backwards but the just-spoken seat closes it, so the final
    // speaker holds the last seat as usual. The margin note already ran
    // before pass 3 — nothing fires after the final seat.
    setActiveAgent(seats.length - 1);
  };

  /**
   * Margin notes: extra calls that barge in outside the rotation — early
   * (after pass 1) and late (before pass 3). See runCoda below.
   */
  /**
   * Margin note: one extra call that barges in outside the rotation — early
   * (after pass 1, reading pass 1 only) or late (before pass 3, reading passes
   * 1–2). Not a seat, not an intervention — stored separately so
   * seats/passes/deck math never shifts. Returns the text so the next round
   * can carry it; a failure never blocks the round and the retry button
   * re-runs it. Same visible-status contract: writing / failed + reason +
   * retry + console diagnostics, never a silent catch.
   */
  const runCoda = async (runId: number, collected: Intervention[], snap: CabinetSettings, which: 'early' | 'late' | 'end' = 'late'): Promise<string | null> => {
    const early = which === 'early';
    const end = which === 'end';
    // Second halves, not one-liners (Sep 2026): new_contribution comments on
    // PREV, so notes built from it reviewed reactions, not positions. The
    // reformulation paragraph is each seat's own diagnosis/build — that is
    // what the note summarizes. Falls back to the one-liner on truncated
    // turns. Still paragraphs, never full turns (shared 7k wall holds).
    const lines = collected
      .filter((item) => (early ? item.pass_number <= 1 : end ? item.pass_number >= 3 : item.pass_number <= 2) && item.sections?.new_contribution)
      .map((item) => ({
        name: philosophers.find((p) => p.id === item.philosopher_id)?.full_name ?? 'A seat',
        line: String(item.sections?.reformulation || item.sections?.new_contribution),
      }));
    if (!lines.length) {
      // Silent nulls hid two missing end-notes (Sep 2026): every empty read
      // now reports visibly instead.
      if (typeof console !== 'undefined') console.warn(`[Margins-${which}] no lines to read, note skipped.`);
      if (which === 'end') {
        setCodaEndState('failed');
        setCodaEndError('No final-round lines found to summarize.');
      }
      return null;
    }
    const setText = early ? setCodaEarly : end ? setCodaEnd : setCoda;
    const setState = early ? setCodaEarlyState : end ? setCodaEndState : setCodaState;
    const setErr = early ? setCodaEarlyError : end ? setCodaEndError : setCodaError;
    const ref = early ? codaEarlyRef : end ? codaEndRef : codaRef;
    const tag = early ? '[Margins-early]' : end ? '[Margins-end]' : '[Margins]';
    setThinkingName(end ? 'Notes from the margins (closing)' : 'Notes from the margins');
    setState('writing');
    setErr(null);
    const codaUser = early ? buildCodaEarlyPrompt(question, lines) : end ? buildCodaEndPrompt(question, lines) : buildCodaPrompt(question, lines);
    const attempt = async (repair = false): Promise<string> => {
      const output = await generateWithProvider(snap, CODA_SYSTEM, repair ? codaUser + CODA_REPAIR_SUFFIX : codaUser, false);
      if (runRef.current !== runId) throw new LlmError('Superseded.', false, 'unknown');
      const text = [output.negation, output.incorporation, output.reformulation].filter((s) => s && s.trim()).join('\n\n');
      setText({ text });
      ref.current = text;
      setState('idle');
      return text;
    };
    try {
      return await attempt();
    } catch (error) {
      if (runRef.current !== runId) return null;
      if (error instanceof LlmError && error.code === 'unknown' && error.message === 'Superseded.') return null;
      // Parse failures get a repair retry with the quotes rule restated
      // (bare double quotes are the usual cause); other retryable failures
      // (typically quota cooling) get one retry after a wait. Then the
      // failure surfaces visibly.
      const isParse = error instanceof LlmError && error.code === 'parse';
      const retryable = error instanceof LlmError && error.retryable;
      let codaFailure: unknown = error;
      if (isParse || retryable) {
        if (!isParse) {
          await new Promise((resolve) => setTimeout(resolve, 20000));
          if (runRef.current !== runId) return null;
        }
        try {
          return await attempt(isParse);
        } catch (retryError) {
          if (runRef.current !== runId) return null;
          codaFailure = retryError;
        }
      }
      if (typeof console !== 'undefined') console.error(`${tag} note failed:`, codaFailure, { which, linesRead: lines.length, promptVersion: PROMPT_VERSION, provider: provenanceLabel(snap) });
      setText(null);
      ref.current = null;
      setState('failed');
      setErr(codaFailure instanceof Error ? codaFailure.message : 'Unknown error.');
      return null;
    } finally {
      if (runRef.current === runId) setThinkingName(null);
    }
  };

  const runCodaNow = (which: 'early' | 'late' | 'end' = 'late') => {
    if (!interventions.length || isRunning) return;
    setRunError(null);
    if (which === 'early') {
      setCodaEarlyState('idle');
      setCodaEarlyError(null);
    } else if (which === 'end') {
      setCodaEndState('idle');
      setCodaEndError(null);
    } else {
      setCodaState('idle');
      setCodaError(null);
    }
    void runCoda(runRef.current, [...interventions], settings, which);
  };

  const toggleCodaSpeech = (which: 'early' | 'late' | 'end' = 'late') => {
    if (!ttsSupported) return;
    const note = which === 'early' ? codaEarly : which === 'end' ? codaEnd : coda;
    const id = which === 'early' ? 'coda-early' : which === 'end' ? 'coda-end' : 'coda';
    if (!note) return;
    if (ttsStatus.state !== 'idle' && ttsStatus.currentId === id) {
      ttsRef.current?.stop();
      return;
    }
    ttsRef.current?.speak([{ id, heading: which === 'early' ? 'Notes from the margins, after pass 1' : which === 'end' ? 'Notes from the margins, closing' : 'Notes from the margins', text: note.text }]);
  };

  const startMeeting = () => {
    if (orderedPhilosophers.length < 2 || !activeKeyReady(settings)) return;
    if ((settings.provider === 'shared' || settings.provider === 'groq') && settings.intensity !== 'low') return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    setInterventions([]);
    setCoda(null);
    setCodaState('idle');
    setCodaError(null);
    codaRef.current = null;
    setCodaEarly(null);
    setCodaEarlyState('idle');
    setCodaEarlyError(null);
    codaEarlyRef.current = null;
    setCodaEnd(null);
    setCodaEndState('idle');
    setCodaEndError(null);
    codaEndRef.current = null;
    setGroundMap({});
    setNoteMap({});
    setEchoMap({});
    provRef.current = [];
    resetUsage();
    threadCityRef.current = drawThreadCity();
    setThreadCity(threadCityRef.current);
    runLevelsRef.current = [settings.intensity];
    sittingStartedAt.current = Date.now();
    debateEndedAt.current = null;
    spentRef.current = [];
    setRunError(null);
    setActivePass(0);
    setActiveAgent(0);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], 0, [], settings);
  };

  const resumeMeeting = () => {
    if (orderedPhilosophers.length < 2 || !activeKeyReady(settings)) return;
    if ((settings.provider === 'shared' || settings.provider === 'groq') && settings.intensity !== 'low') return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    pushRunLevel(settings.intensity);
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], settings);
  };

  const switchToFreeCycleAndResume = () => {
    if (orderedPhilosophers.length < 2 || !settings.openRouterApiKey.trim()) return;
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    const next = { ...settings, provider: 'openrouter' as const, openRouterMode: 'free' as const };
    updateSettings(next);
    pushRunLevel(next.intensity);
    const runId = runRef.current + 1;
    runRef.current = runId;
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], next);
  };

  const switchProviderAndResume = (provider: CabinetSettings['provider']) => {
    const next = { ...settings, provider };
    if (next.provider === 'shared' || next.provider === 'groq') {
      if (next.intensity !== 'low') {
        // Landing on a 7k-walled pipe at Medium/High would 429 mid-sitting:
        // switch the provider but hold at the question card, where the Low
        // notice waits.
        updateSettings(next);
        setShowSettings(false);
        return;
      }
    }
    if (orderedPhilosophers.length < 2 || !activeKeyReady(next)) {
      setShowSettings(true);
      return;
    }
    if (interventions.length >= orderedPhilosophers.length * 3) return;
    updateSettings(next);
    const runId = runRef.current + 1;
    runRef.current = runId;
    pushRunLevel(next.intensity);
    setRunError(null);
    setIsRunning(true);
    void runLoop(runId, [...orderedPhilosophers], interventions.length, [...interventions], next);
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
    setCoda(null);
    setCodaState('idle');
    setCodaError(null);
    codaRef.current = null;
    setCodaEarly(null);
    setCodaEarlyState('idle');
    setCodaEarlyError(null);
    codaEarlyRef.current = null;
    setCodaEnd(null);
    setCodaEndState('idle');
    setCodaEndError(null);
    codaEndRef.current = null;
    setServiceLog([]);
    setGroundMap({});
    setNoteMap({});
    setEchoMap({});
    provRef.current = [];
    resetUsage();
    runLevelsRef.current = [];
    spentRef.current = [];
    setSelectedIntervention(null);
  };

  const exportTranscript = () => {
    const citedNumbers: number[] = [];
    const seenNumbers = new Set<number>();
    const usedInPass: Map<number, Set<number>> = new Map();
    // Invented citation tags (e.g. [UN143]): kept in the prose as evidence,
    // flagged in the footer so no fake authority passes unmarked.
    const inventedTags: { pass: number; name: string; tags: string[] }[] = [];
    const turnText = (item: Intervention) => {
      const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
      const name = philosopher?.name ?? 'Unknown';
      const numbers = splitLabels(name, item.citations.map((c) => c.label)).numbers;
      for (const n of numbers) {
        if (!seenNumbers.has(n)) {
          seenNumbers.add(n);
          citedNumbers.push(n);
        }
        if (!usedInPass.has(n)) usedInPass.set(n, new Set());
        usedInPass.get(n)?.add(item.pass_number);
      }
      // Footnotes sit under their own answer, not inside sentences: bracket
      // numbers break spoken meaning in read-aloud apps, so the text goes out
      // clean. Source usage is tallied into the end READING LIST instead of
      // per-turn Sources lines, annotated with the passes that used each work.
      const clean = item.response_text.replace(/\[\d+\]/g, '').replace(/[ \t]+/g, ' ');
      const invented = findInventedTags(item.response_text);
      if (invented.length) {
        inventedTags.push({ pass: item.pass_number, name, tags: invented });
        if (typeof console !== 'undefined') console.warn(`[Provenance] invented tags in pass ${item.pass_number} ${name}:`, invented.join(' '));
      }
      return `PASS ${item.pass_number} — ${name}\n\n${clean}\n`;
    };
    // Each note sits where it spoke: the early note between pass 1 and pass 2,
    // the late note between the pass-2 close and pass-3 open.
    const pass1 = interventions.filter((item) => item.pass_number <= 1).map(turnText);
    const pass2 = interventions.filter((item) => item.pass_number === 2).map(turnText);
    const late = interventions.filter((item) => item.pass_number >= 3).map(turnText);
    const earlyText = codaEarly ? `\nNOTES FROM THE MARGINS (after pass 1)\n${codaEarly.text}\n` : '';
    const codaText = coda ? `\nNOTES FROM THE MARGINS (before pass 3)\n${coda.text}\n` : '';
    const endText = codaEnd ? `\nNOTES FROM THE MARGINS (closing summary)\n${codaEnd.text}\n` : codaEndState === 'failed' ? `\nNOTES FROM THE MARGINS (closing summary)\n[The closing summary failed to arrive${codaEndError ? ` — ${codaEndError}` : ''} — the sitting stands without it.]\n` : '';
    const body = [`THE DIALECTICAL CABINET\n\nQUESTION\n${question}\n`, ...pass1, ...(codaEarly ? [earlyText] : []), ...pass2, ...(coda && late.length ? [codaText] : []), ...late, ...(codaEnd ? [endText] : [])].join('\n');
    // Notes written but their next round never ran (paused session) still export.
    const trailingCoda = `${codaEarly && !pass2.length ? earlyText : ''}${coda && !late.length ? codaText : ''}${codaEnd && !late.length ? endText : ''}`;
    const serviceText = serviceLog.length
      ? `\nPHILOSOPHERS' SERVICE\n${serviceLog.map((entry) => `— ${entry.thinker} was asked:\n${entry.question}\n— ${entry.thinker} answered:\n${entry.answer.replace(/\[\d+\]/g, '').replace(/[ \t]+/g, ' ')}\n${entry.sources.length ? `— Sources shown: ${entry.sources.join('; ')}\n` : ''}`).join('\n')}`
      : '';
    const readingList = `\nREADING LIST\n${citedNumbers.length
      ? entriesForNumbers(citedNumbers).map(({ number, source }) => {
        const passes = [...(usedInPass.get(number) ?? [])].sort((a, b) => a - b).map((p) => `pass ${p}`).join(', ');
        return `[${number}] ${source.title} — ${source.author}${source.source_url ? ` — ${source.source_url}` : ' — no free online text (model-claimed, not shown in-session)'} (used in ${passes})`;
      }).join('\n')
      : '— none cited this sitting'}\n`;
    const trail = [...new Set(provRef.current)];
    const provenanceText = trail.length
      ? `\nMODELS USED\n${trail.map((t) => `— ${t}`).join('\n')}\n`
      : '';
    // Invented tags match no manifest entry: listed, never numbered, so the
    // export can't launder a hallucinated citation into authority. Absent
    // when the sitting is clean (no empty section).
    const inventedText = inventedTags.length
      ? `\nUNVERIFIED TAGS (model-invented, match no manifest entry)\n${inventedTags.map((t) => `— pass ${t.pass} ${t.name}: ${t.tags.join(' ')}`).join('\n')}\n`
      : '';
    // Levels actually generated at (Begin records, resumes append on change) —
    // the picker value at export time is NOT truth (Sep 19 2026: a Medium run
    // exported as "low" after the picker moved). Mid-sitting changes print all.
    const runLevels = [...new Set(runLevelsRef.current)];
    const levelText = runLevels.length > 1
      ? `${runLevels.join(' → ')} (level changed mid-sitting)`
      : (runLevels[0] ?? settings.intensity);
    const settingsText = `\nSITTING\n— Level: ${levelText} · Long form: ${settings.longForm ? 'on' : 'off'} · Grounding: ${settings.grounding ? 'on' : 'off'} · Economy: ${settings.economy} (at export)${threadCityRef.current ? ` · Thread city: ${threadCityRef.current}` : ''} · Prompt v${PROMPT_VERSION}\n${(() => {
      if (!sittingStartedAt.current) return '— Tested: time not recorded (sitting predates the stopwatch)\n';
      const started = new Date(sittingStartedAt.current);
      const fmt = (ms: number) => {
        const secs = Math.max(0, Math.round(ms / 1000));
        return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      };
      const debate = debateEndedAt.current ? ` · Debate: ${fmt(debateEndedAt.current - sittingStartedAt.current)}` : '';
      return `— Tested: ${started.toISOString()} · Wall time Begin→export: ${fmt(Date.now() - sittingStartedAt.current)}${debate} (debate clock stops at the last turn; wall includes desk + reading)\n`;
    })()}`;
    // Provider-reported tokens (retries included): measured cost, not estimates.
    const usage = usageTotals();
    const byModel = [...new Set(usage.entries.map((e) => `${e.provider} ${e.model}`))]
      .map((m) => {
        const rows = usage.entries.filter((e) => `${e.provider} ${e.model}` === m);
        const calls = rows.length;
        const tin = rows.reduce((a, e) => a + e.inTokens, 0);
        const tout = rows.reduce((a, e) => a + e.outTokens, 0);
        return `— ${m}: ${calls} calls, ${tin.toLocaleString('en-US')} in / ${tout.toLocaleString('en-US')} out`;
      })
      .join('\n');
    const usageText = `\nTOKENS (provider-reported)\n${byModel || '— no usage reported'}\n— Session total: ${usage.inTokens.toLocaleString('en-US')} in / ${usage.outTokens.toLocaleString('en-US')} out${(() => {
      const r = usage.entries.reduce((a, e) => a + (e.reasoningTokens ?? 0), 0);
      const c = usage.entries.reduce((a, e) => a + (e.cachedTokens ?? 0), 0);
      const bits = [`${r.toLocaleString('en-US')} reasoning`, `${c.toLocaleString('en-US')} cached`].filter((_, i) => (i === 0 ? r : c) > 0);
      return bits.length ? ` (${bits.join(', ')})` : '';
    })()}\n— Repair turns (outside the turn count): ${repairTotals()} (JSON ${repairBreakdown().parse} · gloss ${repairBreakdown().gloss} · echo ${repairBreakdown().echo})\n${(() => {
      const cost = estimateCost(usage.entries);
      return cost === null
        ? `— Cost: unknown (a model has no rate on file)`
        : `— About $${cost.toFixed(cost < 0.1 ? 3 : 2)} at ${RATES_AS_OF} rates (estimates drift — re-verify before quoting)`;
    })()}\n`;
    // BOM + explicit charset: without them some viewers (notably Windows
    // Notepad) decode UTF-8 smart quotes/dashes as Latin-1 mojibake (â€…).
    const text = `\uFEFF${body}${trailingCoda}${serviceText}${readingList}${provenanceText}${inventedText}${settingsText}${usageText}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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
      else if (showService) setShowService(false);
      else if (showSettings) setShowSettings(false);
      else if (showSources) setShowSources(false);
      else if (showWelcome) dismissWelcome(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIntervention, selectedPhilosopher, showService, showSettings, showSources, showWelcome]);

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

      <main className="max-w-[1500px] mx-auto px-4 md:px-6 py-5">
        <section className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b5254] mb-2">Clockwise protocol / {isRunning ? 'in session' : 'at rest'}</p>
                <h2 className="text-3xl md:text-4xl">A question enters.<br /><span className="text-[#8b5254]">A problem emerges.</span></h2>
              </div>
              {isRunning && <div className="flex items-center gap-2 text-sm italic text-[#8b5254]"><span className="w-2 h-2 rounded-full bg-[#cc5f68] speaker-glow" /> Cabinet in motion</div>}
            </div>

            <div className="dark-academia-card p-4 md:p-5 mb-5" id="question-card">
              <div className="flex items-center justify-between gap-4 mb-3">
                <label htmlFor="question" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">The contemporary problem</label>
                <span className="text-xs text-[#465f75]/65">The question remains constant; its formulation may change.</span>
              </div>
              <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={isRunning} className="w-full min-h-[72px] resize-y bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-base leading-relaxed text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
              <div className="flex flex-wrap gap-3 mt-4">
                <button className="btn-primary flex items-center gap-2" onClick={isRunning ? pauseMeeting : interventions.length ? resumeMeeting : startMeeting} disabled={!question.trim() || orderedPhilosophers.length < 2 || (!isRunning && (!hasKey || isComplete || freeTierNeedsLow))}>{isRunning ? <><CirclePause size={17} /> Pause circuit</> : <><CirclePlay size={17} /> {isComplete ? 'Cabinet complete' : interventions.length ? 'Resume cabinet' : 'Begin cabinet'}</>}</button>
                <button className="btn-secondary flex items-center gap-2" onClick={resetMeeting}><RotateCcw size={15} /> Restart</button>
                <button className="btn-secondary flex items-center gap-2" onClick={exportTranscript} disabled={!interventions.length}><Download size={15} /> Export</button>
              </div>
              {freeTierNeedsLow && !isRunning && <p className="text-sm italic text-[#8b5254] mt-3">{settings.provider === 'groq' ? 'Your Groq key speaks Low only — the free tier cannot fit Medium or High prompts (they halt on the first turn; no wait fixes it). ' : 'The shared key speaks Low only — its free tier cannot fit Medium or High prompts (they halt mid-sitting). '}<button className="underline" onClick={() => updateSettings({ ...settings, intensity: 'low' })}>Continue at Low</button>{settings.provider === 'shared' ? <> or <button className="underline" onClick={() => openSettings('key')}>add your own key</button> for the full voice.</> : <> or switch provider for the full voice.</>}</p>}
              {!hasKey && <p className="text-sm italic text-[#8b5254] mt-3">Add your {activeKeyLabel} in <button className="underline" onClick={() => setShowSettings(true)}>Settings</button> to begin — it stays in this browser and goes straight to the provider alone; we never see it{settings.provider === 'openrouter' ? ', and goes straight to OpenRouter.' : settings.provider === 'groq' ? ', and goes straight to Groq.' : settings.provider === 'deepinfra' ? ', and goes straight to DeepInfra.' : settings.provider === 'together' ? ', and goes straight to Together.' : settings.provider === 'alibaba' ? ', and goes straight to Alibaba.' : '.'}</p>}
              {runError && (runError.code === 'quota' ? <div role="alert" className="mt-3 p-5 bg-[#8b5254]/10 border-l-2 border-[#8b5254]"><p className="text-xs uppercase tracking-widest text-[#8b5254]">Paused — free-tier quota reached</p><p className="text-sm mt-2 text-[#465f75]">{runError.message}</p><p className="text-sm mt-2 text-[#465f75]">Nothing is lost: {interventions.length} of {orderedPhilosophers.length * 3} interventions are kept, and read-aloud plus export keep working. Quotas reset with time — per-minute caps within minutes, daily caps the next day.</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={() => resumeMeeting()} disabled={!hasKey}>Try resume</button>{settings.provider === 'shared' && <button className="btn-secondary" onClick={() => { setRunError(null); setShowSettings(true); }}>Use my own key instead</button>}{settings.provider === 'openrouter' && settings.openRouterMode === 'paid' && <button className="btn-secondary" onClick={switchToFreeCycleAndResume}>Back to free cycle & resume</button>}{(settings.provider === 'groq' || settings.provider === 'deepinfra' || settings.provider === 'together' || settings.provider === 'alibaba') && <button className="btn-secondary" onClick={() => switchProviderAndResume('shared')}>Fall back to shared</button>}<button className="btn-secondary" onClick={() => setShowSettings(true)}>Open settings</button>{settings.provider === 'openrouter' ? <a className="btn-secondary" href="https://openrouter.ai/activity" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'groq' ? <a className="btn-secondary" href="https://console.groq.com" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'deepinfra' ? <a className="btn-secondary" href="https://deepinfra.com/dash" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'together' ? <a className="btn-secondary" href="https://api.together.xyz/settings/api-keys" target="_blank" rel="noreferrer">Check usage</a> : settings.provider === 'alibaba' ? <a className="btn-secondary" href="https://bailian.console.aliyun.com/" target="_blank" rel="noreferrer">Check usage</a> : null}<button className="btn-secondary" onClick={() => setRunError(null)}>Dismiss</button></div></div> : <div className="mt-3 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254]"><p className="text-xs uppercase tracking-widest text-[#8b5254]">Philosopher Strike Demand</p><p className="text-sm mt-1 text-[#465f75]">{runError.message}</p><div className="flex flex-wrap gap-2 mt-3"><button className="btn-secondary" onClick={resumeMeeting} disabled={!hasKey}>Resume cabinet</button><button className="btn-secondary" onClick={() => setShowSettings(true)}>Open settings</button><button className="btn-secondary" onClick={() => setRunError(null)}>Dismiss</button></div></div>)}
            </div>

            <div className="dark-academia-card p-4 md:p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="pass-indicator text-[#8b5254]">Pass {activePass + 1} / 3</p>
                  <h3 className="text-2xl mt-1">{PASS_NAMES[activePass]}</h3>
                  <p className="italic text-[#465f75]/70">{PASS_DESCRIPTIONS[activePass]}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((pass) => <button key={pass} onClick={() => setActivePass(pass)} aria-label={`View pass ${pass + 1}`} className={`w-11 h-11 rounded-full border text-sm font-semibold transition-all ${activePass === pass ? 'bg-[#4a392d] text-[#eae1ca] border-[#4a392d]' : 'border-[#4a392d]/30 text-[#4a392d]/60 hover:border-[#4a392d]'}`}>{pass + 1}</button>)}
                </div>
              </div>

              <CabinetTable philosophers={orderedPhilosophers} activeAgent={activeAgent} activePass={activePass} interventions={interventions} onSelect={(philosopher) => setSelectedPhilosopher(philosopher)} latest={latestForTable} onJumpToLatest={jumpToLatest} />

              {currentSpeaker && (isRunning || thinkingName) && <div className="mt-6 p-4 bg-[#8b5254]/8 border-l-2 border-[#8b5254] slide-in-right"><p className="text-xs uppercase tracking-widest text-[#8b5254]">{thinkingName ? `${thinkingName} is thinking…` : 'Currently speaking'}</p><p className="font-heading text-xl text-[#4a392d]">{currentSpeaker.full_name}</p><p className="text-sm italic text-[#465f75]/70 mt-1">The intervention will pass clockwise to {orderedPhilosophers[(activeAgent + 1) % orderedPhilosophers.length]?.name}.{threadCity ? ` This sitting lives in ${threadCity}.` : ''}</p></div>}
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
            <div className="dark-academia-card p-5">
              <div className="flex items-center gap-3 mb-2"><ConciergeBell size={18} className="text-[#8b5254]" /><h3 className="text-xl">Philosophers&rsquo; Service</h3></div>
              <p className="text-sm italic text-[#465f75]/70">One thinker, at your pace — plain definitions, a concrete example, a check question. Any of the twelve, switchable mid-chat.</p>
              <button className="btn-secondary w-full mt-4 flex justify-center items-center gap-2" onClick={() => setShowService(true)}><ConciergeBell size={15} /> Ask a thinker</button>
            </div>
          </aside>
        </section>

        <section id="genealogy" className="mt-10" aria-label="Genealogy of influence">
          <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
          <GenealogyMap philosophers={philosophers} onSelect={(p) => setSelectedPhilosopher(p)} />
        </section>

        <section className="mt-10" ref={deckRef} aria-label="Reading deck">
          <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5"><div><p className="pass-indicator text-[#8b5254]">The developing transcript</p><h2 className="text-3xl">Voices around the table</h2></div><p className="hidden md:block max-w-md text-right italic text-[#465f75]/65">Read at your own pace with the arrows — new turns collect underneath without pulling you away.</p></div>
          <p className="sr-only" aria-live="polite">{ttsStatus.state === 'idle' ? '' : ttsStatus.state === 'paused' ? `Reading paused.` : `Reading aloud.`}</p>
          {deckEntries.length ? (
            <ReadingDeck
              entries={deckEntries}
              philosophers={philosophers}
              readIdx={Math.min(readIdx, deckEntries.length - 1)}
              onNav={(i) => { setReadIdx(i); setFreshId(null); }}
              freshId={freshId}
              ttsSupported={ttsSupported}
              ttsStatus={ttsStatus}
              onToggleSpeech={toggleTurnSpeech}
              onToggleNoteSpeech={toggleCodaSpeech}
              onInspect={(item) => setSelectedIntervention(item)}
              onOpenSources={openSourcesAt}
              notes={{
                early: { text: codaEarly?.text ?? null, state: codaEarlyState, error: codaEarlyError },
                late: { text: coda?.text ?? null, state: codaState, error: codaError },
                end: { text: codaEnd?.text ?? null, state: codaEndState, error: codaEndError },
              }}
              onRetryNote={runCodaNow}
              noteSeenFor={noteMap}
              echoSeenFor={echoMap}
            />
          ) : (
            <div className="dark-academia-card p-10 text-center"><Feather size={28} className="mx-auto text-[#b89968] mb-3" /><p className="font-heading text-2xl text-[#4a392d]">The cabinet awaits its question.</p><p className="italic text-[#465f75]/65 mt-2">Begin the circuit to watch the problem transform one intervention at a time.</p></div>
          )}
        </section>

        {interventions.length > orderedPhilosophers.length && <PositionComparison philosophers={orderedPhilosophers} interventions={interventions} onOpenSources={openSourcesAt} />}
        <LivingRoom />
      </main>

      {/* Halt banner: the inline error panel lives up at the question card, so
          a halt mid-deck would otherwise pass unnoticed. Fixed, so it alerts
          wherever the reader sits; Details scrolls to the full recovery panel. */}
      {runError && !isRunning && (
        <div role="alert" className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
          <div className="pointer-events-auto max-w-3xl mx-auto dark-academia-card p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-[#465f75]"><span className="font-heading uppercase tracking-wider text-[#8b5254] text-xs mr-2">{runError.code === 'quota' ? 'Paused — quota reached' : 'Paused — provider error'}</span>{runError.message.length > 140 ? `${runError.message.slice(0, 140)}…` : runError.message}</p>
            <span className="flex gap-2 ml-auto">
              <button className="btn-secondary !text-xs" onClick={() => resumeMeeting()} disabled={!hasKey}>Try resume</button>
              <button className="btn-secondary !text-xs" onClick={() => document.getElementById('question-card')?.scrollIntoView({ behavior: display.reduceMotion ? 'auto' : 'smooth', block: 'start' })}>Full details</button>
            </span>
          </div>
        </div>
      )}
      {showSources && <SourceDrawer target={sourceTarget} onClose={() => { setSourceTarget(null); setShowSources(false); }} />}      <ServiceChat
        thinkers={allOrderedPhilosophers}
        interventions={interventions}
        settings={settings}
        open={showService}
        onToggle={() => setShowService((v) => !v)}
        onExchange={(entry) => setServiceLog((log) => [...log, entry])}
        onOpenSettings={() => openSettings('key')}
      />
      {showWelcome && <WelcomeModal onClose={dismissWelcome} onOpenSettings={() => { dismissWelcome(false); openSettings('seats'); }} ttsSupported={ttsSupported} listening={ttsStatus.state !== 'idle' && ttsStatus.currentId === 'welcome'} onListen={toggleWelcomeSpeech} />}      {showSettings && <SettingsDrawer key={settingsTab} philosophers={philosophers} activeSlugs={activeSlugs} togglePhilosopher={togglePhilosopher} settings={settings} onSettingsChange={updateSettings} display={display} onDisplayChange={updateDisplay} initialTab={settingsTab} onClose={() => setShowSettings(false)} />}
      {selectedIntervention && <InterventionModal intervention={selectedIntervention} philosopher={philosophers.find((p) => p.id === selectedIntervention.philosopher_id)} onClose={() => { ttsRef.current?.stop(); setSelectedIntervention(null); }} ttsSupported={ttsSupported} speaking={ttsStatus.state !== 'idle' && ttsStatus.currentId === selectedIntervention.id} onToggleSpeech={() => toggleTurnSpeech(selectedIntervention)} onOpenSources={(n) => { ttsRef.current?.stop(); setSelectedIntervention(null); openSourcesAt(n); }} grounding={selectedIntervention ? groundMap[selectedIntervention.id] ?? null : null} groundingOn={settings.grounding} allPassages={Object.values(groundMap).flatMap((g) => g.passages)} />}
      {selectedPhilosopher && <ProfileModal philosopher={selectedPhilosopher} onClose={() => setSelectedPhilosopher(null)} />}
    </div>
  );
}

/**
 * Model-ID picker with a Custom escape hatch (Sep 21 2026): curated
 * dropdown options (verified-live IDs only) plus free text, so IDs can
 * rot without stranding anyone — dead stored IDs still migrate in
 * settings.ts and Test key checks the typed ID live.
 */
function ModelIdField({ id, value, options, placeholder, onPick }: {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  onPick: (modelId: string) => void;
}) {
  // Custom mode is state, not derived: picking "Type another ID…" must
  // reveal the box even though the stored value is still a listed ID
  // (Sep 21 2026 — the first version fired nothing on Custom, so the box
  // never appeared).
  const [custom, setCustom] = useState(!options.includes(value));
  const listed = options.includes(value);
  const cls = 'w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30';
  return (
    <>
      <select id={id} value={!custom && listed ? value : CUSTOM_MODEL_VALUE} onChange={(event) => { const v = event.target.value; if (v === CUSTOM_MODEL_VALUE) { setCustom(true); } else { setCustom(false); onPick(v); } }} className={cls}>
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
        <option value={CUSTOM_MODEL_VALUE}>Type another ID…</option>
      </select>
      {(custom || !listed) && (
        <input type="text" autoComplete="off" spellCheck={false} value={value} onChange={(event) => onPick(event.target.value)} placeholder={placeholder} aria-label={`${id} custom model ID`} className={`${cls} mt-2 placeholder:text-[#465f75]/45`} />
      )}
    </>
  );
}

function LivingRoom() {
  // Read-only transcript of the unprompted room (Phase 10): visitors read,
  // never generate — one shared stream written by the 20-minute cron.
  const [room, setRoom] = useState<{ roster: string[]; cursor: number; turns: { id: string; ts: string; seat: string; name: string; text: string; model: string }[]; lastTick: string | null } | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}room/transcript.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setRoom(j); }).catch(() => {});
    fetch(`${import.meta.env.BASE_URL}room/personas.json`).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j?.seats) {
        const m: Record<string, string> = {};
        for (const [slug, s] of Object.entries<{ name: string }>(j.seats)) m[slug] = s.name;
        setNames(m);
      }
    }).catch(() => {});
  }, []);
  if (!room) return null;
  const next = room.roster.length ? room.roster[room.cursor % room.roster.length] : null;
  const nextAt = room.lastTick ? new Date(new Date(room.lastTick).getTime() + 20 * 60 * 1000) : null;
  return (
    <section className="mt-12" aria-label="Living room">
      <div className="ornament-divider mb-6"><span className="text-xl">✦</span></div>
      <p className="pass-indicator text-[#8b5254]">No question asked</p>
      <h2 className="text-3xl mb-2">Living room</h2>
      <p className="text-xs italic text-[#465f75]/65 mb-4">
        Twelve dead philosophers, idling out loud — one short turn about every 20 minutes, lowest voice, own books at hand.
        {next ? <> Next up: <span className="font-heading not-italic">{names[next] ?? next}</span>{nextAt ? <> (around {nextAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</> : null}.</> : null}
      </p>
      {room.turns.length === 0 ? (
        <div className="dark-academia-card p-8 text-center"><p className="italic text-[#465f75]/65">The room wakes at the next tick — check back in a little while.</p></div>
      ) : (
        <div className="dark-academia-card p-5 md:p-8 max-h-[32rem] overflow-y-auto custom-scroll">
          {room.turns.map((t) => (
            <article key={t.id} className="border-t border-[#4a392d]/15 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
              <p className="text-[10px] uppercase tracking-wider text-[#8b5254]">{t.name} · {new Date(t.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-[#465f75] mt-1">{t.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReadingDeck({ entries, philosophers, readIdx, onNav, freshId, ttsSupported, ttsStatus, onToggleSpeech, onToggleNoteSpeech, onInspect, onOpenSources, notes, onRetryNote, noteSeenFor, echoSeenFor }: {
  entries: DeckEntry[];
  philosophers: Philosopher[];
  readIdx: number;
  onNav: (index: number) => void;
  freshId: string | null;
  ttsSupported: boolean;
  ttsStatus: TtsStatus;
  onToggleSpeech: (item: Intervention) => void;
  onToggleNoteSpeech: (which: 'early' | 'late' | 'end') => void;
  onInspect: (item: Intervention) => void;
  onOpenSources: (n: number) => void;
  notes: {
    early: { text: string | null; state: 'idle' | 'writing' | 'failed'; error: string | null };
    late: { text: string | null; state: 'idle' | 'writing' | 'failed'; error: string | null };
    end: { text: string | null; state: 'idle' | 'writing' | 'failed'; error: string | null };
  };
  onRetryNote: (which: 'early' | 'late' | 'end') => void;
  noteSeenFor: Record<string, true>;
  echoSeenFor: Record<string, true>;
}) {
  const entry = entries[readIdx];
  if (!entry) return null;
  const upcoming = entries.slice(readIdx + 1, readIdx + 4);
  const behind = entries.length - 1 - readIdx;
  const noteName = (which: 'early' | 'late' | 'end') => which === 'early' ? 'Notes from the margins (after pass 1)' : which === 'end' ? 'Notes from the margins (closing summary)' : 'Notes from the margins (before pass 3)';
  const entryLabel = (e: DeckEntry): string => {
    if (e.kind === 'margins') return noteName(e.which);
    const p = philosophers.find((x) => x.id === e.intervention.philosopher_id);
    return `${p?.full_name ?? 'Unknown'}, pass ${e.intervention.pass_number}`;
  };
  const label = `Now reading ${readIdx + 1} of ${entries.length}: ${entryLabel(entry)}`;
  const noteSpeaking = (which: 'early' | 'late' | 'end') => ttsStatus.state !== 'idle' && ttsStatus.currentId === (which === 'early' ? 'coda-early' : which === 'end' ? 'coda-end' : 'coda');
  return (
    <div role="region" aria-roledescription="carousel" aria-label="Reading deck: move through the sitting with the arrow buttons">
      <p className="sr-only" aria-live="polite">{label}</p>
      {entry.kind === 'margins' ? (() => {
        const which = entry.which;
        const note = notes[which];
        const speaking = noteSpeaking(which);
        return (
        <article aria-label={noteName(which)} className="dark-academia-card p-5 md:p-8 max-w-3xl">
          <p className="pass-indicator text-[#8b5254]">☞ {which === 'early' ? 'Notes from the margins · after pass 1' : which === 'end' ? 'Notes from the margins · closing summary' : 'Notes from the margins'}</p>
          {note.text ? (
            <>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#465f75] mt-3">{note.text}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {ttsSupported && <button onClick={() => onToggleNoteSpeech(which)} className="btn-secondary !text-xs flex items-center gap-2" aria-label={speaking ? 'Stop reading margin notes' : 'Listen to margin notes'}>{speaking ? <><Square size={13} /> Stop reading</> : <><Volume2 size={13} /> Listen</>}</button>}
              </div>
            </>
          ) : note.state === 'writing' ? (
            <p className="text-sm italic text-[#465f75]/70 mt-3" aria-live="polite">Notes from the margins are interrupting…</p>
          ) : (
            <>
              <p className="text-sm italic text-[#465f75]/70 mt-3">{which === 'early' ? 'The note failed to arrive — pass 2 carries on without it.' : which === 'end' ? 'The closing summary failed to arrive — the sitting stands without it.' : 'The note failed to arrive — the final round carries on without it.'}</p>
              {note.state === 'failed' && note.error && (
                <p className="text-xs mt-2 text-[#8b5254]">Reason: {note.error.length > 220 ? `${note.error.slice(0, 220)}…` : note.error}</p>
              )}
              <button className="btn-secondary !text-xs mt-3" onClick={() => onRetryNote(which)}>Bring the note</button>
            </>
          )}
          <div className="flex items-center justify-between mt-4">
            <p aria-hidden="true" className="text-sm italic text-[#465f75]/70">{readIdx + 1} of {entries.length}</p>
            <button onClick={() => onNav(Math.min(entries.length - 1, readIdx + 1))} disabled={readIdx >= entries.length - 1} className="manicule-next" aria-label={readIdx >= entries.length - 1 ? 'Latest card — awaiting the next turn' : `Next: ${entryLabel(entries[readIdx + 1] ?? entry)}`}>☞</button>
          </div>
        </article>
        );
      })() : (() => {
        const item = entry.intervention;
        const philosopher = philosophers.find((p) => p.id === item.philosopher_id);
        if (!philosopher) return null;
        const speaking = ttsStatus.state !== 'idle' && ttsStatus.currentId === item.id;
        const paused = ttsStatus.state === 'paused' && ttsStatus.currentId === item.id;
        return (
        <article key={item.id} aria-label={`${philosopher.full_name}, pass ${item.pass_number}`} className={`dark-academia-card p-5 md:p-8 max-w-3xl ${freshId === item.id ? 'card-arrive' : ''} ${speaking ? 'tts-reading' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-heading text-lg shrink-0" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }} aria-hidden="true">{philosopher.name.charAt(0)}</span>
            <div>
              <h3 className="font-heading text-2xl text-[#4a392d] leading-tight">{philosopher.full_name}</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#8b5254]">Pass {item.pass_number} · Seat {item.seat_position + 1} · Card {readIdx + 1} of {entries.length}</p>
              {noteSeenFor[item.id] && <p className="text-[10px] uppercase tracking-wider text-[#8b5254]/80 mt-0.5">☞ saw the margins note</p>}
              {echoSeenFor[item.id] && <p className="text-[10px] uppercase tracking-wider text-[#8b5254]/80 mt-0.5">☞ shares wording with an earlier turn</p>}
            </div>
          </div>
          <p className="drop-cap text-[15px] leading-relaxed whitespace-pre-line text-[#465f75]">{item.response_text}</p>
          <div className="mt-4"><ReadMore philosopherName={philosopher.name} /></div>
          <ReadSimilar philosopherName={philosopher.name} labels={item.citations.map((c) => c.label)} onOpenSources={onOpenSources} />
          <div className="flex flex-wrap gap-2 mt-5">
            {ttsSupported && <button onClick={() => onToggleSpeech(item)} className="btn-secondary !text-xs flex items-center gap-2" aria-label={speaking ? `Stop reading intervention by ${philosopher.full_name}` : `Listen to intervention by ${philosopher.full_name}`}>{speaking ? <><Square size={13} /> {paused ? 'Paused — stop' : 'Stop reading'}</> : <><Volume2 size={13} /> Listen</>}</button>}
            <button onClick={() => onInspect(item)} className="btn-secondary !text-xs">Inspect sources</button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p aria-hidden="true" className="text-sm italic text-[#465f75]/70">{readIdx + 1} of {entries.length}</p>
            <button onClick={() => onNav(Math.min(entries.length - 1, readIdx + 1))} disabled={readIdx >= entries.length - 1} className="manicule-next" aria-label={readIdx >= entries.length - 1 ? 'Latest card — awaiting the next turn' : `Next: ${entryLabel(entries[readIdx + 1] ?? entry)}`}>☞</button>
          </div>
        </article>
        );
      })()}
      <div className="flex items-center gap-3 mt-4 max-w-3xl">
        <p className="text-sm italic text-[#465f75]/70">Card {readIdx + 1} of {entries.length}</p>
        {behind > 0 && <button onClick={() => onNav(entries.length - 1)} className="btn-secondary !text-xs flex items-center gap-1"><ArrowDown size={13} /> {behind} new — jump to latest</button>}
      </div>
      {upcoming.length > 0 && (
        <div className="mt-4 max-w-3xl" aria-label="Up next">
          <p className="text-[10px] uppercase tracking-widest text-[#8b5254] mb-2">Up next in the pile</p>
          <div className="space-y-2">
            {upcoming.map((next, offset) => {
              if (next.kind === 'margins') {
                return (
                  <button key={`margins-${next.which}`} onClick={() => onNav(readIdx + 1 + offset)} className="w-full text-left dark-academia-card px-4 py-3 flex items-center gap-3" aria-label={`Skip ahead to ${noteName(next.which)}`}>
                    <span className="w-7 h-7 rounded-full border border-[#8b5254] flex items-center justify-center font-heading text-sm shrink-0 text-[#8b5254]" aria-hidden="true">☞</span>
                    <span className="font-heading text-base text-[#4a392d]">Notes from the margins</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#465f75]/60 ml-auto shrink-0">{next.which === 'early' ? 'After pass 1' : next.which === 'end' ? 'Closing summary' : 'Before pass 3'}</span>
                  </button>
                );
              }
              const phil = philosophers.find((p) => p.id === next.intervention.philosopher_id);
              if (!phil) return null;
              return (
                <button key={next.intervention.id} onClick={() => onNav(readIdx + 1 + offset)} className="w-full text-left dark-academia-card px-4 py-3 flex items-center gap-3" aria-label={`Skip ahead to ${phil.full_name}, pass ${next.intervention.pass_number}`}>
                  <span className="w-7 h-7 rounded-full border flex items-center justify-center font-heading text-sm shrink-0" style={{ borderColor: phil.accent_color, color: phil.accent_color }} aria-hidden="true">{phil.name.charAt(0)}</span>
                  <span className="font-heading text-base text-[#4a392d]">{phil.full_name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#465f75]/60 ml-auto shrink-0">Pass {next.intervention.pass_number}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CabinetTable({ philosophers, activeAgent, activePass, interventions, onSelect, latest, onJumpToLatest }: { philosophers: Philosopher[]; activeAgent: number; activePass: number; interventions: Intervention[]; onSelect: (philosopher: Philosopher) => void; latest: { intervention: Intervention; philosopher: Philosopher } | null; onJumpToLatest: () => void }) {
  return <div className="relative w-full max-w-[920px] mx-auto aspect-square min-h-[400px] md:min-h-[560px] flex items-center justify-center"><div className="absolute w-[62%] h-[40%] rounded-[50%] border-[10px] border-[#4a392d]/80 bg-[#6d4c37]/10 shadow-[inset_0_0_40px_rgba(74,57,45,0.2),0_8px_24px_rgba(74,57,45,0.2)]"><div className="absolute inset-3 rounded-[50%] border border-[#b89968]/50 flex flex-col items-center justify-center text-center"><span className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">The cabinet</span><span className="font-heading text-lg md:text-2xl text-[#4a392d]">A dialectical spiral</span><span className="text-[10px] italic text-[#465f75]/60 mt-1 px-6 leading-snug">clockwise<br />sequential<br />unresolved</span></div></div>{latest && <div className="absolute z-20 w-[66%] max-w-[430px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><div className="dark-academia-card p-5 text-center"><p className="text-[9px] uppercase tracking-[0.2em] text-[#8b5254]">Now having their say</p><p className="font-heading text-xl text-[#4a392d] mt-1 leading-tight">{latest.philosopher.full_name}</p><p className="text-[10px] uppercase tracking-wider text-[#465f75]/65 mt-1">Pass {latest.intervention.pass_number} · Seat {latest.intervention.seat_position + 1}</p><p className="text-[15px] leading-relaxed mt-3 max-h-[190px] md:max-h-[240px] overflow-y-auto custom-scroll text-left text-[#465f75]">{latest.intervention.response_text}</p><button className="btn-secondary !text-xs mt-3" onClick={onJumpToLatest}>Read in the deck</button></div></div>}<div className="absolute inset-[8%] rotation-arrow pointer-events-none"><div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#8b5254]"><ArrowRight size={22} /></div></div>{philosophers.map((philosopher, index) => { const angle = (index / philosophers.length) * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 44; const y = 50 + Math.sin(angle) * 33; const isActive = activeAgent === index; const hasSpoken = interventions.some((item) => item.pass_number === activePass + 1 && item.seat_position === index); return <button key={philosopher.slug} onClick={() => onSelect(philosopher)} title={philosopher.why_this_seat} aria-label={`Seat ${index + 1}: ${philosopher.full_name}`} className={`cabinet-seat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0 leading-none ${isActive ? 'cabinet-seat-active' : ''} ${hasSpoken ? 'cabinet-seat-spoken' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}><span className={`w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center bg-[#f2ebd9] ${isActive ? 'speaker-glow border-[#cc5f68]' : 'border-[#4a392d]/35'}`} style={{ borderColor: isActive ? undefined : philosopher.accent_color }}><span className="font-heading text-base sm:text-xl md:text-3xl" style={{ color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span></span><span className="hidden sm:block font-heading text-sm md:text-base text-[#4a392d] whitespace-nowrap">{philosopher.name} <span className="text-[10px] uppercase tracking-wider text-[#465f75]/60">· {index + 1}</span></span></button>; })}</div>;
}

function SpiralView({ interventions, question, activePass, numPhilosophers }: { interventions: Intervention[]; question: string; activePass: number; numPhilosophers: number }) { const labels = ['The question', 'Problem map', 'Dialectical map', 'Spiral synthesis']; return <div className="space-y-2">{labels.map((label, index) => { const isVisible = index === 0 || interventions.length >= index * numPhilosophers; const text = index === 0 ? question : index === 1 ? 'First rotation chained: seat 1 opens, each later seat negates its immediate predecessor.' : index === 2 ? 'Second rotation continues across the boundary; each turn critiques PREV and hands a contradiction on.' : 'Reconstruction rotation: institutions, practices, collective power; final seat returns the question.'; return <div key={label} className={`relative pl-8 ${isVisible ? 'opacity-100' : 'opacity-35'} transition-opacity`}><div className={`absolute left-0 top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${index <= activePass + 1 ? 'bg-[#8b5254] text-[#f2ebd9] border-[#8b5254]' : 'border-[#4a392d]/30 text-[#4a392d]/50'}`}>{index}</div>{index < 3 && <div className="absolute left-[9px] top-6 h-8 border-l border-dashed border-[#b89968]" />}<p className="text-xs uppercase tracking-wider text-[#8b5254]">{label}</p><p className="text-sm italic text-[#465f75]/75 leading-snug mt-1">{text}</p></div>; })}</div>; }

function PositionComparison({ philosophers, interventions, onOpenSources }: { philosophers: Philosopher[]; interventions: Intervention[]; onOpenSources: (n: number) => void }) { return <section className="mt-12"><div className="ornament-divider mb-6"><span className="text-xl">✦</span></div><p className="pass-indicator text-[#8b5254]">Memory across passes</p><h2 className="text-3xl mb-5">Position changes</h2><div className="grid lg:grid-cols-3 gap-4">{philosophers.map((philosopher) => <div key={philosopher.id} className="dark-academia-card p-5"><h3 className="text-xl mb-3">{philosopher.name}</h3>{[1, 2, 3].map((pass) => { const item = interventions.find((entry) => entry.philosopher_id === philosopher.id && entry.pass_number === pass); return <div key={pass} className="border-t border-[#4a392d]/15 pt-3 mt-3"><p className="text-[10px] uppercase tracking-widest text-[#8b5254]">Pass {pass} · {PASS_NAMES[pass - 1]}</p><p className="text-sm mt-1 line-clamp-6 text-[#465f75]/80">{item?.response_text ?? 'Awaiting intervention.'}</p>{item && <ReadSimilar philosopherName={philosopher.name} labels={item.citations.map((c) => c.label)} onOpenSources={onOpenSources} />}</div>; })}</div>)}</div></section>; }

function WelcomeModal({ onClose, onOpenSettings, ttsSupported, listening, onListen }: { onClose: (remember: boolean) => void; onOpenSettings: () => void; ttsSupported: boolean; listening: boolean; onListen: () => void }) {
  const [remember, setRemember] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onClose(remember)}>
      <div role="dialog" aria-modal="true" aria-label="About the Dialectical Cabinet" className="dark-academia-card max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}>
        <p className="pass-indicator text-[#8b5254]">The assembly is convened</p>
        <h2 className="text-3xl mt-1">How this cabinet works</h2>
        <div className="space-y-4 mt-5 text-[15px] leading-relaxed text-[#465f75]">
          <p><span className="drop-cap">A</span>sk your question of the Philosophers' Table and watch dead thinkers debate it. Convene 4–6 of us (all 12 means a slow 36 turns); each speaks 3 times across three passes. Read along below the table, or export it all as one text file.</p>
          <p>Each of us answers only our predecessor — negating on its own premises, preserving what holds, handing a contradiction clockwise. Whatever truth appears shows up <em>between</em> our seats, never handed down.</p>
          <p>Lost? Ring the Service desk bell (bottom-right): one thinker, plain definitions, an example, a check-back question — 20 per sitting, with its own voice picker. First set the table's voice in Settings → Cabinet: <strong>Low</strong> speaks plainly, <strong>Medium</strong> explains its terms, <strong>High</strong> runs at full difficulty. Ideas unchanged throughout.</p>
          <p>Start on the shared key: no account, nothing to configure. When the commons runs dry, bring your own — OpenRouter, Groq, DeepInfra, Together or Alibaba; keys stay in your browser. Test the key in Settings; if we ever halt, read the notice — Resume usually fixes it.</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-[#465f75] mt-6"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="w-4 h-4 accent-[#8b5254]" /> Don’t show this again</label>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn-primary" onClick={onOpenSettings}>Choose who gets to sit at the table</button>
          <button className="btn-secondary" onClick={() => onClose(remember)}>Convene the cabinet</button>
          {ttsSupported && <button className="btn-secondary !text-xs flex items-center gap-2" onClick={onListen} aria-label={listening ? 'Stop reading the welcome' : 'Listen to the welcome'}>{listening ? <><Square size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}</button>}
        </div>
      </div>
    </div>
  );
}

function SourceDrawer({ target, onClose }: { target: number | null; onClose: () => void }) {
  const yearOf = (date: string | null): number => {
    const match = typeof date === 'string' ? date.match(/\d{4}/) : null;
    return match ? parseInt(match[0], 10) : -Infinity;
  };
  const sorted = [...CORPUS_SOURCES_DATA].sort((a, b) => yearOf(b.publication_date) - yearOf(a.publication_date));
  useEffect(() => {
    if (target == null) return;
    // Let the drawer mount before scrolling to the anchored entry.
    const timer = window.setTimeout(() => {
      document.getElementById(`ref-${target}`)?.scrollIntoView({ block: 'center' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [target]);
  return <div className="fixed inset-0 z-50 bg-[#4a392d]/30 backdrop-blur-sm" onClick={onClose}><aside className="absolute right-0 top-0 bottom-0 w-full max-w-xl parchment-bg p-6 md:p-8 overflow-y-auto custom-scroll" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Corpus manifest"><div className="flex items-start justify-between mb-2"><div><p className="pass-indicator text-[#8b5254]">Corpus manifest</p><h2 className="text-3xl">Further reading</h2><p className="italic text-[#465f75]/65 mt-1">The works behind the cabinet — full-text badges mean indexed and searchable when Grounding is on.</p></div><button className="btn-secondary !px-3" onClick={onClose} aria-label="Close corpus manifest"><X size={17} /></button></div><p className="text-xs uppercase tracking-widest text-[#465f75]/60 mb-5">{sorted.length} works · newest first · numbers are stable file order</p><div className="space-y-3">{sorted.map((source) => { const number = CORPUS_SOURCES_DATA.indexOf(source) + 1; return <div key={`${source.author}-${source.title}`} id={`ref-${number}`} className={`border-b border-[#4a392d]/15 pb-3 ${target === number ? 'ref-flash' : ''}`}><div className="flex justify-between gap-3"><p className="font-heading text-base text-[#4a392d]"><span className="text-xs text-[#8b5254] mr-2" aria-label={`Reference ${number}`}>[{number}]</span>{source.source_url ? <a href={source.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-[#8b5254]/40 hover:decoration-[#8b5254]">{source.title}</a> : source.title}</p><span className={`text-[9px] whitespace-nowrap uppercase tracking-wider ${source.full_text_ingested ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{source.full_text_ingested ? 'Full text' : 'Metadata'}</span></div><p className="text-sm text-[#465f75]/70">{source.author} · {source.publication_date ?? 'undated'}</p><p className="text-[10px] uppercase tracking-widest text-[#8b5254]/80 mt-1">{source.licence_status}</p>{source.link_note && <p className="text-xs italic mt-1 text-[#8b5254]">⚠ {source.link_note}</p>}</div>; })}</div></aside></div>;
}

function SettingsDrawer({ philosophers, activeSlugs, togglePhilosopher, settings, onSettingsChange, display, onDisplayChange, initialTab, onClose }: { philosophers: Philosopher[]; activeSlugs: string[]; togglePhilosopher: (slug: string) => void; settings: CabinetSettings; onSettingsChange: (next: CabinetSettings) => void; display: AccessibilitySettings; onDisplayChange: (next: AccessibilitySettings) => void; initialTab: 'key' | 'seats' | 'voice' | 'display'; onClose: () => void }) {
  const [orKeyInput, setOrKeyInput] = useState(settings.openRouterApiKey);
  const [groqKeyInput, setGroqKeyInput] = useState(settings.groqApiKey);
  const [deepInfraKeyInput, setDeepInfraKeyInput] = useState(settings.deepInfraApiKey);
  const [togetherKeyInput, setTogetherKeyInput] = useState(settings.togetherApiKey);
  const [alibabaKeyInput, setAlibabaKeyInput] = useState(settings.alibabaApiKey);
  // Key inputs must follow stored settings when the provider changes: useState
  // initialisers run once at mount, so without this a saved key shows as an
  // empty box after switching provider and back.
  const providerNow = settings.provider;
  useEffect(() => {
    setOrKeyInput(settings.openRouterApiKey);
    setGroqKeyInput(settings.groqApiKey);
    setDeepInfraKeyInput(settings.deepInfraApiKey);
    setTogetherKeyInput(settings.togetherApiKey);
    setAlibabaKeyInput(settings.alibabaApiKey);
    setTestState('idle');
    setTestMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerNow]);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [tab, setTab] = useState<'key' | 'seats' | 'voice' | 'display'>(initialTab);
  const usingOpenRouter = settings.provider === 'openrouter';
  const usingGroq = settings.provider === 'groq';
  const usingDeepInfra = settings.provider === 'deepinfra';
  const usingTogether = settings.provider === 'together';
  const usingAlibaba = settings.provider === 'alibaba';
  const activeKeyInput = usingGroq ? groqKeyInput : usingOpenRouter ? orKeyInput : usingDeepInfra ? deepInfraKeyInput : usingTogether ? togetherKeyInput : usingAlibaba ? alibabaKeyInput : '';
  const activeStoredKey = usingGroq ? settings.groqApiKey : usingOpenRouter ? settings.openRouterApiKey : usingDeepInfra ? settings.deepInfraApiKey : usingTogether ? settings.togetherApiKey : usingAlibaba ? settings.alibabaApiKey : '';
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
      } else if (usingDeepInfra) {
        await testDeepInfraKey(key, settings.deepInfraPrimary);
        setTestState('ok');
        setTestMessage(`Key works (${DEEPINFRA_PRIMARIES.find((p) => p.id === settings.deepInfraPrimary)?.label ?? settings.deepInfraPrimary} first, Llama 3.3 70B backup). Saved for this browser.`);
        onSettingsChange({ ...settings, deepInfraApiKey: key });
      } else if (usingTogether) {
        await testTogetherKey(key);
        setTestState('ok');
        setTestMessage(`Key works on ${TOGETHER_MODEL}. Saved for this browser.`);
        onSettingsChange({ ...settings, togetherApiKey: key });
      } else if (usingAlibaba) {
        await testAlibabaKey(key, settings.alibabaModel);
        setTestState('ok');
        setTestMessage(`Key works on ${settings.alibabaModel}. Saved for this browser.`);
        onSettingsChange({ ...settings, alibabaApiKey: key });
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
    } else if (usingDeepInfra) {
      setDeepInfraKeyInput('');
      onSettingsChange({ ...settings, deepInfraApiKey: '' });
    } else if (usingTogether) {
      setTogetherKeyInput('');
      onSettingsChange({ ...settings, togetherApiKey: '' });
    } else if (usingAlibaba) {
      setAlibabaKeyInput('');
      onSettingsChange({ ...settings, alibabaApiKey: '' });
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
          </div>
          <button className="btn-secondary !px-3" onClick={onClose} aria-label="Close settings"><X size={17} /></button>
        </div>
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Settings sections">
          {(['seats', 'voice', 'display', 'key'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`btn-secondary capitalize ${tab === t ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>
              {t === 'key' ? 'Key' : t === 'seats' ? 'Seats' : t === 'voice' ? 'Voice' : 'Display'}
            </button>
          ))}
        </div>
        {tab === 'key' && (
          <div className="space-y-3 border-b border-[#4a392d]/15 pb-6 mb-6">
            <p className="italic text-sm text-[#465f75]/70">Your own keys stay in this browser and go only to the named provider (OpenRouter → OpenRouter, whose free models may log prompts for training; Groq → Groq; DeepInfra → DeepInfra; Together → Together; Alibaba → Alibaba Model Studio). Naturally each provider also holds your key on their servers — that is how API keys work. What we never do: see them, store them, or ask for any login. The shared cabinet key never leaves the server. Nothing identifying is collected here.</p>
            <p className="text-xs text-[#465f75]/70">What it costs, roughly: <span className="font-heading">free</span> — Cabinet shared (shared quota), Groq, OpenRouter cycle. <span className="font-heading">Pennies a sitting</span> — OpenRouter paid (~$0.01–0.06), DeepInfra (~$0.03). <span className="font-heading">Dear (~$0.40 a sitting)</span> — Alibaba max, Together. <span className="font-heading">Trial $0 to Dec</span> — Alibaba. Vague estimates from list prices; every export prints the measured cost, and the model behind each turn is named there too.</p>
            <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] block">Provider</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="AI provider">
              <button role="radio" aria-checked={settings.provider === 'shared'} title="No key needed — the cabinet's own key, a few sittings a day each." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'shared' }); }} className={`btn-secondary ${settings.provider === 'shared' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Cabinet shared</button>
              <button role="radio" aria-checked={usingOpenRouter} title="Your OpenRouter key — free model cycle, or a pinned paid model." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'openrouter' }); }} className={`btn-secondary ${usingOpenRouter ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>OpenRouter</button>
              <button role="radio" aria-checked={usingGroq} title="Your Groq key — free tier, no card." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'groq' }); }} className={`btn-secondary ${usingGroq ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Groq free</button>
              <button role="radio" aria-checked={usingDeepInfra} title="Your DeepInfra key — Qwen first, Llama 70B backup, card on file." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'deepinfra' }); }} className={`btn-secondary ${usingDeepInfra ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>DeepInfra</button>
              <button role="radio" aria-checked={usingTogether} title="Your Together key — pinned Qwen 30B, card required." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'together' }); }} className={`btn-secondary ${usingTogether ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Together</button>
              <button role="radio" aria-checked={usingAlibaba} title="Your Alibaba key — Model Studio codes, free trial quota." onClick={() => { setTestState('idle'); setTestMessage(''); onSettingsChange({ ...settings, provider: 'alibaba' }); }} className={`btn-secondary ${usingAlibaba ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Alibaba</button>
            </div>
            {settings.provider === 'shared' ? (
              <p className="text-xs text-[#465f75]/70">No key needed — the cabinet runs on its own key, held server-side and shared across visitors (about two full sessions a day each): Alibaba's trial bench first, Groq behind it. The export names the model behind each turn, so you can always see who spoke. If the shared quota runs dry, add your own OpenRouter, Groq, DeepInfra, Together or Alibaba key below by switching provider.</p>
            ) : usingGroq ? (
              <>
                <label htmlFor="groq-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Groq API key (free)</label>
                <input id="groq-key" name="dialectical-cabinet-groq-key" type="password" autoComplete="new-password" value={groqKeyInput} onChange={(event) => { setGroqKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from console.groq.com" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!groqKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!groqKeyInput && !settings.groqApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Free tier, no card: 30 requests/min, ~1K/day shared across your uses. Get a key at <a className="underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com</a>.</p>
                <label htmlFor="groq-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model ID</label>
                <ModelIdField id="groq-model" value={settings.groqModel} options={GROQ_MODEL_OPTIONS} placeholder="qwen/qwen3.8-27b" onPick={(m) => { onSettingsChange({ ...settings, groqModel: m }); setTestState('idle'); setTestMessage(''); }} />
                <p className="text-xs text-[#465f75]/70">Paste: <span className="font-heading">qwen/qwen3.8-27b</span> — voice reference only. Groq retires IDs without notice — type a current one (see <a className="underline" href="https://console.groq.com/docs/models" target="_blank" rel="noreferrer">console.groq.com/docs/models</a>) and press Test key. Free tier walls at ~7K input tokens per request against ~8K turns: Low sittings limp through with resumes, Medium/High are blocked outright (the prompt itself exceeds the wall — measured 7,871 vs 7,000 Sep 21 2026, no wait fixes it). Fine for the desk and Low. <span className="font-heading">qwen/qwen3.6-27b</span> is dead for visitor keys since Sep 2026.</p>
              </>
            ) : usingOpenRouter ? (
              <>
                <label htmlFor="or-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">OpenRouter API key</label>
                <input id="or-key" name="dialectical-cabinet-openrouter-key" type="password" autoComplete="new-password" value={orKeyInput} onChange={(event) => { setOrKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from openrouter.ai/keys" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
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
                  <p className="text-xs text-[#465f75]/70">Each turn tries free models in order — the auto-router first, then the named bench by context size — moving to the next when one is limited, down, or retired. Limits apply per model, so cycling stretches the free quota across a session. Voices may shift turn to turn; the export says who spoke.</p>
                ) : (
                  <>
                    <label htmlFor="or-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-1 block">Paid model ID</label>
                    <ModelIdField id="or-model" value={settings.openRouterModel} options={OPENROUTER_PAID_OPTIONS} placeholder="qwen/qwen3.7-plus" onPick={(m) => { onSettingsChange({ ...settings, openRouterModel: m }); setTestState('idle'); setTestMessage(''); }} />
                    <p className="text-xs text-[#465f75]/70">Options, best voice first: <span className="font-heading">qwen/qwen3.7-plus</span> ($0.32/$1.28 — same weights as our value crown elsewhere); <span className="font-heading">qwen/qwen3.7-flash</span> ($0.03/$0.13 — probe-clean, least proven voice); <span className="font-heading">qwen/qwen3.8-flash</span> ($0.15/$0.47 — punchy, once burned, since clean). A dead pin falls through to the next option mid-sitting — resuming switches models on this provider. A full sitting runs roughly 170K input + 5K output tokens, so about: plus ~$0.06, flash under a cent, 3.8-flash ~$0.03. Vague estimates — the export prints the measured cost.</p>
                    <p className="text-xs text-[#465f75]/70">Higher quality with much bigger limits than free — needs credits on your key. Browse IDs at <a className="underline" href="https://openrouter.ai/models" target="_blank" rel="noreferrer">openrouter.ai/models</a> (exact ID string matters — dated suffixes retire fast). If a paid model reports a daily limit, check the key's own cap at <a className="underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> — new credit can take minutes to apply.</p>
                  </>
                )}
              </>
            ) : usingDeepInfra ? (
              <>
                <label htmlFor="di-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">DeepInfra API key</label>
                <input id="di-key" name="dialectical-cabinet-deepinfra-key" type="password" autoComplete="new-password" value={deepInfraKeyInput} onChange={(event) => { setDeepInfraKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from deepinfra.com/dash/api_keys" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!deepInfraKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!deepInfraKeyInput && !settings.deepInfraApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Qwen3-30B-A3B speaks first; Llama 3.3 70B takes over automatically if it fails (never on key/quota errors — a backup cannot fix those) — the export says who spoke. Needs a card on file — get a key at <a className="underline" href="https://deepinfra.com/dash/api_keys" target="_blank" rel="noreferrer">deepinfra.com</a>.</p>
                <label htmlFor="di-primary" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">First voice</label>
                <select id="di-primary" value={settings.deepInfraPrimary} onChange={(event) => onSettingsChange({ ...settings, deepInfraPrimary: event.target.value as DeepInfraPrimary })} className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30">
                  {DEEPINFRA_PRIMARIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} ({p.model})</option>
                  ))}
                </select>
                {(() => {
                  const picked = DEEPINFRA_PRIMARIES.find((p) => p.id === settings.deepInfraPrimary) ?? DEEPINFRA_PRIMARIES[0];
                  return (
                    <p className="text-xs text-[#465f75]/70">Speaks first: <span className="font-heading">{picked.model}</span> — {picked.why} Backup: {DEEPINFRA_BACKUP_LABEL}</p>
                  );
                })()}
              </>
            ) : usingTogether ? (
              <>
                <label htmlFor="tog-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Together API key</label>
                <input id="tog-key" name="dialectical-cabinet-together-key" type="password" autoComplete="new-password" value={togetherKeyInput} onChange={(event) => { setTogetherKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from api.together.ai" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!togetherKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!togetherKeyInput && !settings.togetherApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <p className="text-xs text-[#465f75]/70">Pinned model <span className="font-heading">Qwen/Qwen3-30B-A3B</span> — paste exactly that; verify it at <a className="underline" href="https://api.together.ai/models" target="_blank" rel="noreferrer">api.together.ai/models</a> if calls 404. The priciest route for these weights, and untested here — DeepInfra serves the same model cheaper. Get a key at <a className="underline" href="https://api.together.ai/settings/api-keys" target="_blank" rel="noreferrer">api.together.ai</a> (requires a card upfront).</p>
              </>
            ) : usingAlibaba ? (
              <>
                <label htmlFor="ali-key" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d]">Alibaba API key</label>
                <input id="ali-key" name="dialectical-cabinet-alibaba-key" type="password" autoComplete="new-password" value={alibabaKeyInput} onChange={(event) => { setAlibabaKeyInput(event.target.value); setTestState('idle'); setTestMessage(''); }} placeholder="Paste key from Model Studio" className="w-full bg-[#eae1ca]/60 border border-[#4a392d]/25 rounded-sm p-3 text-[15px] text-[#465f75] placeholder:text-[#465f75]/45 focus:outline-none focus:ring-2 focus:ring-[#8b5254]/30" />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={runTest} disabled={!alibabaKeyInput.trim() || testState === 'testing'}>{testState === 'testing' ? 'Testing…' : 'Test key'}</button>
                  <button className="btn-secondary" onClick={clearKey} disabled={!alibabaKeyInput && !settings.alibabaApiKey}>Clear</button>
                  {keySaved && <span className="text-xs italic self-center text-[#4a6b3f]">Saved in this browser.</span>}
                </div>
                {testMessage && <p className={`text-sm italic ${testState === 'ok' ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{testMessage}</p>}
                <label htmlFor="ali-model" className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block">Model code</label>
                <ModelIdField id="ali-model" value={settings.alibabaModel} options={ALIBABA_MODEL_OPTIONS} placeholder="qwen3.8-max" onPick={(m) => { onSettingsChange({ ...settings, alibabaModel: m }); setTestState('idle'); setTestMessage(''); }} />
                <p className="text-xs text-[#465f75]/70">Default: <span className="font-heading">qwen3.8-max</span> — the finest voice, dearest price. If it stumbles the cabinet falls through <span className="font-heading">qwen3.7-plus</span>, then <span className="font-heading">qwen3.8-27b</span>, then <span className="font-heading">qwen3.8-flash</span>, and the export confesses who actually spoke. Free trial quota to Dec 16 2026 ($0 on quota). Model Studio codes vary by region — type the exact code and press Test key. Free quota pools in Singapore; enable Stop-on-Exhaust so overruns stop instead of billing. Check remaining quota in Model Studio before a big sitting.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-[#465f75]/70">Pick a provider above — this cabinet no longer speaks to Gemini.</p>
              </>
            )}
          </div>
        )}
        {tab === 'seats' && (
          <div>
            <div className="flex items-start justify-between mb-4"><div><p className="pass-indicator text-[#8b5254]">Who sits at the table</p><h2 className="text-2xl">Cabinet selection</h2></div></div>
            <div className="space-y-2">{DEFAULT_SEATING_ORDER.map((slug) => {
              const philosopher = philosophers.find((item) => item.slug === slug);
              const isActive = activeSlugs.includes(slug);
              if (!philosopher) return null;
              return <button key={slug} onClick={() => togglePhilosopher(slug)} aria-pressed={isActive} title={philosopher.biography} className={`w-full flex items-center gap-3 p-3 border transition-all ${isActive ? 'bg-[#f2ebd9]/65 border-[#4a392d]/40' : 'bg-transparent border-[#4a392d]/10 opacity-50 hover:opacity-80'}`}><div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${isActive ? 'bg-[#8b5254] border-[#8b5254]' : 'border-[#4a392d]/30'}`}>{isActive && <X size={12} className="text-white" />}</div><span className="w-8 h-8 rounded-full border flex items-center justify-center font-heading" style={{ borderColor: philosopher.accent_color, color: philosopher.accent_color }}>{philosopher.name.charAt(0)}</span><span className="font-heading text-lg text-[#4a392d]">{philosopher.full_name}</span></button>;
            })}</div>
            <p className="text-xs italic text-[#465f75]/60 mt-5">The baton passes only to active thinkers, always to the immediate next seat. The dialectical order remains fixed to preserve the historical-conceptual movement.</p>
            <p className="text-xs text-[#465f75]/70 mt-2">{activeSlugs.length} thinkers × 3 passes = {activeSlugs.length * 3} turns{activeSlugs.length > 5 ? ' — five seats (≈15 turns) is the recommended session; it halves token use with the arc intact.' : ' — a lean session.'}</p>
          </div>
        )}
        {tab === 'voice' && (
          <div>
            <div className="flex items-start justify-between mb-4"><div><p className="pass-indicator text-[#8b5254]">How the table talks</p><h2 className="text-2xl">Voice</h2></div></div>
            <div className="space-y-3">
              <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] block" title="How hard the language hits. Ideas stay the same at every level — only the words change.">How it speaks (all seats)</span>
              <p className="text-xs italic text-[#465f75]/70">Low speaks plainly · Medium explains its terms · High runs at full difficulty — the ideas stay the same. Medium is a good starting point: drop to Low if too hard, up to High for the full voice.</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Style intensity">
                <button role="radio" aria-checked={settings.intensity === 'low'} title="Plain everyday words — the easiest read. Temper unchanged." onClick={() => onSettingsChange({ ...settings, intensity: 'low' })} className={`btn-secondary capitalize ${settings.intensity === 'low' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Low</button>
                <button role="radio" aria-checked={settings.intensity === 'medium'} title="The standard seminar — important terms kept and explained." onClick={() => onSettingsChange({ ...settings, intensity: 'medium' })} className={`btn-secondary capitalize ${settings.intensity === 'medium' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Medium</button>
                <button role="radio" aria-checked={settings.intensity === 'high'} title="Full voice — authentic vocabulary, hostile where the author warrants it." onClick={() => onSettingsChange({ ...settings, intensity: 'high' })} className={`btn-secondary capitalize ${settings.intensity === 'high' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>High</button>
              </div>
              {settings.intensity === 'medium' && <p className="text-xs italic text-[#8b5254]">Medium sends the most tokens of any level — pricier on metered keys and likelier to strain free-tier limits than Low or High.</p>}
              <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block" title="How long each answer runs. Short is the default — quick thrusts, not lectures.">Turn length</span>
              <p className="text-xs italic text-[#465f75]/70">Short is punchier and cheaper — pick Long only for slow, developed sittings.</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Turn length">
                <button role="radio" aria-checked={!settings.longForm} title="About 60 words a turn. Quick back-and-forth, lowest token use." onClick={() => onSettingsChange({ ...settings, longForm: false })} className={`btn-secondary ${!settings.longForm ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Short (~60 words)</button>
                <button role="radio" aria-checked={settings.longForm} title="About 140 words a turn. Slower sittings, roughly double the tokens." onClick={() => onSettingsChange({ ...settings, longForm: true })} className={`btn-secondary ${settings.longForm ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Long (~140 words)</button>
              </div>
              <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block" title="How much of the previous turn is re-sent with each call.">What each turn re-reads</span>
              <p className="text-xs italic text-[#465f75]/70">Every turn answers its predecessor — this sets how much of that predecessor rides along. The transcript and export always stay whole either way.</p>
              <div className="flex gap-2" role="radiogroup" aria-label="What each turn re-reads">
                <button role="radio" aria-checked={settings.economy === 'full'} title="Re-send the whole previous turn. Best continuity, highest token use." onClick={() => onSettingsChange({ ...settings, economy: 'full' })} className={`btn-secondary ${settings.economy === 'full' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Full re-read</button>
                <button role="radio" aria-checked={settings.economy === 'efficient'} title="Re-send a trimmed excerpt. About a third fewer input tokens; voices untouched." onClick={() => onSettingsChange({ ...settings, economy: 'efficient' })} className={`btn-secondary ${settings.economy === 'efficient' ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Trimmed re-read</button>
              </div>
              <span className="font-heading text-sm uppercase tracking-[0.16em] text-[#4a392d] pt-2 block" title="Fetch each speaker's key work and inject the most relevant passages.">Source grounding</span>
              <p className="text-xs italic text-[#465f75]/70">On: each speaker answers with passages from their own works in view — slower, more tokens, better grounded.</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Source grounding">
                <button role="radio" aria-checked={settings.grounding} title="Speakers see their own sourced passages. Recommended." onClick={() => onSettingsChange({ ...settings, grounding: true })} className={`btn-secondary ${settings.grounding ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Grounded</button>
                <button role="radio" aria-checked={!settings.grounding} title="Speakers answer from profile alone. Faster, cheaper, easier to drift." onClick={() => onSettingsChange({ ...settings, grounding: false })} className={`btn-secondary ${!settings.grounding ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>Profile only</button>
              </div>
            </div>
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
  const [voices, setVoices] = useState<{ name: string; lang: string; localService: boolean; isDefault: boolean; voiceURI: string }[]>([]);
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
      const voice = resolveVoice(display.ttsVoiceURI);
      if (voice) {
        utter.voice = voice;
      }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Colour theme">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Typeface">
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
        <p className="text-xs italic text-[#465f75]/70 mb-3">Uses your browser's built-in speech — no key, no cost, nothing leaves this page. Device default suits most visitors; if it sounds wrong on your device (some iPads pick a poor default), choose a voice below and it sticks.</p>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="tts-voice" className="text-sm text-[#4a392d]">Voice</label>
        </div>
        <select id="tts-voice" value={display.ttsVoiceURI ?? ''} onChange={(e) => onChange({ ttsVoiceURI: e.target.value || null })} disabled={!isTtsSupported() || !voices.length} className="w-full border border-[#4a392d]/25 bg-[#f2ebd9] text-sm text-[#4a392d] p-2 mb-3">
          <option value="">Device default</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}{v.localService ? ' · on-device' : ''}{v.isDefault ? ' · default' : ''}</option>
          ))}
        </select>
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


function GroundingReceipt({ grounding, responseText, allPassages }: { grounding: { title: string; number: number; passages: string[]; reason: string | null }; responseText: string; allPassages: string[] }) {
  const checks = verifyQuotes(responseText, grounding.passages, allPassages);
  return <div className="mt-5 border-t border-[#4a392d]/20 pt-5"><p className="font-heading text-xl text-[#4a392d] mb-1">What the speaker was shown</p><p className="text-xs italic text-[#465f75]/65 mb-3">Passages the speaker was actually shown before this turn, searched from their own works (“{grounding.title}” [{grounding.number}]). The contract differs by level — Low: ideas only, never lifted (that is the whole point of grounding here); Medium: direct quotes plus plain-words translation; High: exact lifts plus connecting style wording. Only verbatim is machine-checkable below: paraphrase and idea-use never trip these badges and are graded by eye, never inferred from them.</p>{grounding.passages.map((text, i) => <p key={i} className="text-[13px] leading-relaxed p-3 mb-2 bg-[#eae1ca]/60 border border-[#4a392d]/15 text-[#465f75]">“{smartCut(text, 400)}”</p>)}<div className="mt-3 space-y-2">{checks.length === 0 ? <p className="text-xs italic text-[#465f75]/65">No quoted loans in this turn.</p> : checks.map((check, i) => <div key={i} className="flex items-start gap-2 text-[13px]"><span aria-hidden="true">{check.verified ? '✓' : '✗'}</span><p className="text-[#465f75]"><span className={`font-heading text-xs uppercase tracking-wider ${check.verified ? 'text-[#4a6b3f]' : 'text-[#8b5254]'}`}>{check.verified ? 'Verified verbatim' : 'Not verbatim — check by hand'}: </span>“{smartCut(check.quote, 160)}”</p></div>)}</div></div>;
}

function InterventionModal({ intervention, philosopher, onClose, ttsSupported, speaking, onToggleSpeech, onOpenSources, grounding, groundingOn, allPassages }: { intervention: Intervention; philosopher?: Philosopher; onClose: () => void; ttsSupported?: boolean; speaking?: boolean; onToggleSpeech?: () => void; onOpenSources: (n: number) => void; grounding?: { title: string; number: number; passages: string[]; reason: string | null } | null; groundingOn: boolean; allPassages?: string[] }) { return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={`Intervention by ${philosopher?.full_name ?? 'unknown thinker'}`} className="dark-academia-card max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="pass-indicator text-[#8b5254]">Pass {intervention.pass_number} · {PASS_NAMES[intervention.pass_number - 1]}</p><h2 className="text-3xl">{philosopher?.full_name}</h2><p className="italic text-[#465f75]/65">{intervention.position_label}</p></div><div className="flex flex-col items-end gap-2"><button className="btn-secondary !px-3 h-fit" onClick={onClose} aria-label="Close intervention"><X size={17} /></button>{ttsSupported && <button className="btn-secondary !text-xs flex items-center gap-2" onClick={onToggleSpeech} aria-label={speaking ? 'Stop reading this intervention' : 'Listen to this intervention'}>{speaking ? <><Square size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}</button>}</div></div><p className="drop-cap text-[17px] leading-relaxed mt-6 whitespace-pre-line text-[#465f75]">{intervention.response_text}</p>{philosopher && <div className="mt-4"><ReadMore philosopherName={philosopher.name} /></div>}<div className="mt-7 border-t border-[#4a392d]/20 pt-5"><p className="font-heading text-xl text-[#4a392d] mb-3">References</p>{philosopher && <ReadSimilar philosopherName={philosopher.name} labels={intervention.citations.map((c) => c.label)} onOpenSources={onOpenSources} />}{grounding && grounding.passages.length ? <GroundingReceipt grounding={grounding} responseText={intervention.response_text} allPassages={allPassages ?? []} /> : groundingOn ? <div className="mt-5 border-t border-[#4a392d]/20 pt-5"><p className="text-xs italic text-[#465f75]/65">{grounding && grounding.reason === 'unsupported-source' ? 'Grounding skipped this source (a scan or binary with nothing fetchable as text) — the speaker answered from profile alone.' : grounding && grounding.reason === 'fetch-failed' ? 'Grounding tried, but the source page could not be fetched — the speaker answered from profile alone.' : 'Grounding found no passages about this question on that page — the speaker answered from profile alone.'}</p></div> : null}</div></div></div>; }

function StyleEssenceDisplay({ style }: { style: StyleEssence }) { return <div className="grid md:grid-cols-2 gap-5"><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Style DNA</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.style_dna}</p></div><div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Characteristic Movement</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{style.characteristic_movement}</p></div></div>; }
function ProfileModal({ philosopher, onClose }: { philosopher: Philosopher; onClose: () => void }) {
  const [tab, setTab] = useState<'thought' | 'voice' | 'works' | 'cabinet'>('thought');
  const profile = philosopher.profile;
  const style = philosopher.style_essence;
  const baseKeys = ['identity', 'ontology', 'epistemology', 'conception_of_human_subject', 'conception_of_society', 'conception_of_power', 'conception_of_freedom', 'theory_of_social_change', 'conception_of_technology', 'rhetorical_style', 'what_he_sees_well', 'what_he_overlooks'];
  const hiddenKeys = new Set(['reasoning', 'self_review', 'meta_fix', 'style', 'historical_boundary', 'core_principle', 'methodological_habits', 'primary_authority', 'modern_adaptation']);
  // Variant keys across philosophers (his/her/their). First content found wins;
  // the label follows the variant that holds it.
  const altKeys = (key: string): string[] => {
    if (!key.startsWith('what_he_')) return [];
    const stem = key.slice('what_he_'.length);
    const alts = [`what_she_${stem}`, `what_they_${stem}`];
    if (stem.startsWith('sees_')) alts.push(`what_they_see_${stem.slice('sees_'.length)}`);
    return alts;
  };
  const rows: { label: string; value: unknown }[] = [];
  const consumed = new Set<string>();
  for (const key of baseKeys) {
    const alts = altKeys(key);
    const found = [key, ...alts].find((k) => profile[k] !== undefined);
    if (found === undefined) continue;
    // Label follows the variant that actually holds the content (their content, their words).
    rows.push({ label: found.replace(/_/g, ' '), value: profile[found] });
    consumed.add(key);
    for (const alt of alts) consumed.add(alt);
  }
  for (const key of Object.keys(profile)) {
    if (consumed.has(key) || hiddenKeys.has(key)) continue;
    rows.push({ label: key.replace(/_/g, ' '), value: profile[key] });
  }
  const tabs = [
    { id: 'thought', label: 'Thought' },
    { id: 'voice', label: 'Voice' },
    { id: 'works', label: 'Works' },
    { id: 'cabinet', label: 'In this cabinet' },
  ] as const;
  return <div className="fixed inset-0 z-50 bg-[#4a392d]/35 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={`Profile of ${philosopher.full_name}`} className="dark-academia-card max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll p-6 md:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4 mb-4"><div><p className="pass-indicator text-[#8b5254]">Seat {philosopher.seat_order + 1} · intellectual profile</p><h2 className="text-4xl">{philosopher.full_name}</h2><p className="italic text-[#465f75]/70">{philosopher.birth_year} — {philosopher.death_year}</p></div><button className="btn-secondary !px-3 h-fit" onClick={onClose} aria-label="Close profile"><X size={17} /></button></div><p className="text-[15px] leading-relaxed text-[#465f75] mb-4">{philosopher.biography}</p><div className="flex flex-wrap gap-2 mb-5">{philosopher.analytical_center.map((item) => <span key={item} className="citation-badge">{item}</span>)}</div><div className="flex gap-2 mb-5" role="tablist" aria-label="Profile sections">{tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`btn-secondary !text-xs ${tab === t.id ? '!border-[#8b5254] !text-[#8b5254]' : ''}`}>{t.label}</button>)}</div>{tab === 'thought' && <div className="grid md:grid-cols-2 gap-5">{rows.map((row) => <div key={row.label} className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">{row.label}</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{Array.isArray(row.value) ? row.value.join(' · ') : String(row.value ?? '')}</p></div>)}</div>}{tab === 'voice' && <div className="grid md:grid-cols-2 gap-5"><StyleEssenceDisplay style={style} /></div>}{tab === 'works' && <ul className="space-y-3">{philosopher.key_works.map((work) => <li key={work.title} className="border-t border-[#4a392d]/15 pt-3"><p className="font-heading text-lg text-[#4a392d]">{work.title} <span className="text-sm italic text-[#465f75]/65">· {work.year}</span></p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{work.note}</p></li>)}</ul>}{tab === 'cabinet' && <div className="border-t border-[#4a392d]/15 pt-3"><p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Why this seat</p><p className="text-[15px] leading-relaxed text-[#465f75]/85">{philosopher.why_this_seat}</p><p className="text-sm italic text-[#465f75]/65 mt-3">Seat {philosopher.seat_order + 1} of {DEFAULT_SEATING_ORDER.length} · answers its predecessor, hands a contradiction on.</p>{(() => {
            const debts = CABINET_DEBTS[philosopher.slug] ?? [];
            const heirs = cabinetHeirs(philosopher.slug);
            if (!debts.length && !heirs.length) return null;
            const nameOf = (slug: string) => PHILOSOPHER_BY_SLUG[slug]?.full_name ?? slug;
            const kindHint = (kind: 'direct' | 'indirect') => kind === 'direct' ? 'read closely and answered (criticism and ruptures count)' : 'arrived through intermediaries and wider traditions';
            return (
              <div className="mt-4 space-y-3">
                {debts.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Owes at this table</p>
                    <ul className="space-y-1.5">
                      {debts.map((d) => (
                        <li key={d.to} className="text-[15px] leading-relaxed text-[#465f75]/85"><span className="font-heading text-[#4a392d]" title={kindHint(d.kind)}>{nameOf(d.to)}</span> <span className="text-xs italic text-[#465f75]/60">({d.kind})</span> — {d.note}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {heirs.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#8b5254] mb-1">Owed by at this table</p>
                    <ul className="space-y-1.5">
                      {heirs.map((h) => (
                        <li key={h.from} className="text-[15px] leading-relaxed text-[#465f75]/85"><span className="font-heading text-[#4a392d]" title={kindHint(h.kind)}>{nameOf(h.from)}</span> <span className="text-xs italic text-[#465f75]/60">({h.kind})</span> — {h.note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}</div>}</div></div>;
}

export default App;
