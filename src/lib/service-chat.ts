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
import type { Philosopher } from '@/types';

/** Questions per page load before the desk closes its shutter. */
export const SERVICE_MAX_QUESTIONS = 20;

/** Humorous halt when the sitting's question budget is spent. */
export const SERVICE_LIMIT_MESSAGE =
  '☞ The Service desk is closing its little shutter: twenty questions make a full sitting, and you have asked them all. The shared well needs time to refill — bring your own key in Settings and ask away, or take your question back to the main table.';

/** How many recent exchanges ride in each prompt (token discipline). */
const HISTORY_EXCHANGES = 12;

/**
 * Tutor rules, layered under the thinker's full persona (top intensity).
 * This is the prompt the user asked to see: identity + teaching scaffold +
 * honesty about sources.
 */
export function buildServiceSystemPrompt(philosopher: Philosopher): string {
  return [
    renderPersona(philosopher, 'high'),
    '',
    'PHILOSOPHERS’ SERVICE DESK: you are staffing a help desk as yourself. A visitor asks; you teach. Not a debate, no opponent, no negation — explain your own thinking so a newcomer can use it.',
    'Scaffold every answer in four short moves: 1) answer the question directly in your own framework; 2) define every school-term or unusual word in plain words on first use — say “this means …” out loud at least once, never assume the reading; 3) land one concrete 21st-century example; 4) close with one short question checking the idea landed.',
    'HARD ceiling 180 words. Continuous prose, no headings, no lists of more than three items. Standard written English: complete sentences, terminal punctuation.',
    'SOURCES, honestly: passages headed SEARCHED PASSAGES below are the only text you actually searched — when they fit, borrow visibly (at least one short verbatim loan in ‘single’ quotes) and say “from the passage above” when you do. Otherwise your answer comes from your profile and framework: say “on my account” rather than implying you re-read the books. Your links are the only ones you can search — never cite, quote, or claim another thinker’s works; if asked about them, answer from your own framework and say whose desk that question belongs at.',
    'The sitting’s one-line determinations below are what the main table has said so far — you may refer to a seat by name, in your own terms, never quoted verbatim. They do not override the visitor’s question.',
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
}

export function buildServiceUserMessage({ question, history, tableLines, groundingBlock = '' }: ServiceUserMessageArgs): string {
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
