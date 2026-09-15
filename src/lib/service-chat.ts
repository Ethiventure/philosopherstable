/**
 * Philosophers' Service desk — one-to-one tutoring with a single thinker.
 *
 * Unlike the cabinet loop (strict JSON turns, determinate negation), the desk
 * is free prose teaching at top style intensity: answer, define, exemplify,
 * check understanding. Plain-text provider paths (`generateText*`) carry the
 * replies — no turn contract, no repair suffix.
 *
 * Context discipline: the tutor sees the recent chat, the sitting's one-line
 * determinations (if any), and — only when the visitor enabled grounding —
 * searched passages from ITS OWN links. It can never read other thinkers'
 * links: `groundableSource` resolves per-thinker, and nothing else is passed.
 */
import { renderPersona } from '@/philosophers';
import { generateTextDeepInfra } from '@/lib/deepinfra';
import { generateTextGroq } from '@/lib/groq';
import { generateTextOpenRouter } from '@/lib/openrouter';
import { generateTextShared } from '@/lib/shared';
import { generateTextTogether } from '@/lib/together';
import type { CabinetSettings } from '@/lib/settings';
import { LlmError } from '@/lib/llm';
import type { Philosopher, StyleIntensity } from '@/types';

/** Questions per page load before the desk closes its shutter. */
export const SERVICE_MAX_QUESTIONS = 20;

/** Humorous halt when the sitting's question budget is spent. */
export const SERVICE_LIMIT_MESSAGE =
  '☞ The Service desk is closing its little shutter: twenty questions make a full sitting, and you have asked them all. The shared well needs time to refill — bring your own key in Settings and ask away, or take your question back to the main table.';

/** How many recent exchanges ride in each prompt (token discipline). */
const HISTORY_EXCHANGES = 12;

/**
 * Tutor rules, layered under the thinker's persona at the desk's own level.
 * This is the prompt the user asked to see: identity + teaching scaffold +
 * honesty about sources. The tutor's own words follow the desk level (Low
 * plain, Medium natural gloss, High full voice); quoted source loans stay
 * verbatim at every level, and sequential summaries are allowed on request.
 */
export function buildServiceSystemPrompt(philosopher: Philosopher, intensity: StyleIntensity = 'high'): string {
  const defineLine = intensity === 'low'
    ? 'Scaffold every answer in four short moves: 1) answer the question directly in your own framework, in plain everyday words; 2) translate or describe every school-term or unusual word in plain words instead of using it — where a word has no plain equal, describe what it does; 3) land one concrete 21st-century example; 4) close with one short question checking the idea landed.'
    : intensity === 'medium'
      ? 'Scaffold every answer in four short moves: 1) answer the question directly in your own framework; 2) keep important school-terms but explain each one naturally inside the sentence in plain words — never a separate dictionary-style break, never a bare unexplained term; 3) land one concrete 21st-century example; 4) close with one short question checking the idea landed.'
      : 'Scaffold every answer in four short moves: 1) answer the question directly in your own framework, in your full authentic voice — never simplify, never define out loud; 2) quote your works generously and echo their filler words, tics, and rhythms; 3) land one concrete 21st-century example; 4) close with one short question checking the idea landed.';
  const sourcesLine = intensity === 'high'
    ? 'SOURCES, honestly: passages headed SEARCHED PASSAGES below are the only text you actually searched — quote generously (several short verbatim loans in ‘single’ quotes) and say “from the passage above” when you do; echo their filler words, diction tics, and rhythms. Otherwise your answer comes from your profile and framework: say “on my account” rather than implying you re-read the books. Your links are the only ones you can search — never cite, quote, or claim another thinker’s works; if asked about them, answer from your own framework and say whose desk that question belongs at.'
    : 'SOURCES, honestly: passages headed SEARCHED PASSAGES below are the only text you actually searched — when they fit, borrow visibly with direct quotes (at least one short verbatim loan in ‘single’ quotes) and say “from the passage above” when you do. Direct quotation stays verbatim at every desk level — your own surrounding words follow the level. Otherwise your answer comes from your profile and framework: say “on my account” rather than implying you re-read the books. Your links are the only ones you can search — never cite, quote, or claim another thinker’s works; if asked about them, answer from your own framework and say whose desk that question belongs at.';
  return [
    renderPersona(philosopher, intensity),
    '',
    'PHILOSOPHERS’ SERVICE DESK: you are staffing a help desk as yourself. A visitor asks; you teach. Not a debate, no opponent, no negation — explain your own thinking so a newcomer can use it. Riff on the visitor’s question — paraphrase it in your own terms; never repeat it verbatim.',
    defineLine,
    'HARD ceiling 180 words. Continuous prose, no headings, no lists of more than three items. Standard written English: complete sentences, terminal punctuation.',
    sourcesLine,
    'The sitting’s one-line determinations below are what the main table has said so far — you may refer to a seat by name, in your own terms, never quoted verbatim. They do not override the visitor’s question.',
    'DESK OVERRIDE, governing summaries only: when the visitor asks for a recap or turn-by-turn summary, give it sequentially — the no-summary rule above does not apply at the help desk. Everything else above still holds.',
  ].join('\n');
}

export interface ServiceHistoryItem {
  role: 'visitor' | 'thinker';
  thinker: string;
  text: string;
}

interface ServiceUserMessageArgs {
  question: string;
  history: ServiceHistoryItem[];
  tableLines: { name: string; line: string }[];
  groundingBlock?: string;
  intensity?: StyleIntensity;
}

/** Desk Low closing check: the persona's plain rules sit far above generation,
 * so the last line re-orders plainness — the missing reinforcement that let
 * Low desk answers drift to Medium (Sep 2026 eval). */
const DESK_LOW_CLOSING =
  'FINAL CHECK before answering, Low only: reread your draft and circle every word AND every idea a school-leaver would not know — rewrite both in plain words and concrete scenes from your world. Quoted source loans stay verbatim; everything around them stays plain.';

export function buildServiceUserMessage({ question, history, tableLines, groundingBlock = '', intensity = 'high' }: ServiceUserMessageArgs): string {
  const parts = [`VISITOR'S QUESTION (answer this): ${question}`];
  const recent = history.slice(-HISTORY_EXCHANGES * 2);
  if (recent.length > 0) {
    parts.push(
      '',
      'RECENT CHAT (for continuity only):',
      ...recent.map((item) => `- ${item.role === 'visitor' ? 'Visitor' : item.thinker}: ${item.text.slice(0, 600)}`),
    );
  }
  if (tableLines.length > 0) {
    parts.push(
      '',
      'SITTING SO FAR, ONE LINE PER SEAT (may refer by name, never quote):',
      ...tableLines.map(({ name, line }) => `- ${name}: ${String(line).slice(0, 300)}`),
    );
  }
  if (groundingBlock) parts.push('', groundingBlock);
  parts.push('', 'Answer the visitor’s question now, in your own voice, following the desk scaffold.');
  if (intensity === 'low') parts.push('', DESK_LOW_CLOSING);
  return parts.join('\n');
}

/** Plain-text dispatch across providers — mirrors the cabinet's switch. */
export function generateServiceText(
  snap: CabinetSettings,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  switch (snap.provider) {
    case 'shared':
      return generateTextShared({ systemPrompt, userMessage });
    case 'openrouter':
      return generateTextOpenRouter({
        apiKey: snap.openRouterApiKey,
        systemPrompt,
        userMessage,
        longForm: false,
        mode: snap.openRouterMode,
        modelId: snap.openRouterModel,
      });
    case 'groq':
      return generateTextGroq({
        apiKey: snap.groqApiKey,
        model: snap.groqModel,
        systemPrompt,
        userMessage,
      });
    case 'deepinfra':
      return generateTextDeepInfra({
        apiKey: snap.deepInfraApiKey,
        primary: snap.deepInfraPrimary,
        systemPrompt,
        userMessage,
      });
    case 'together':
      return generateTextTogether({
        apiKey: snap.togetherApiKey,
        systemPrompt,
        userMessage,
      });
    default:
      throw new LlmError('Unknown provider. Pick one in Settings → Key.', false, 'unknown');
  }
}
