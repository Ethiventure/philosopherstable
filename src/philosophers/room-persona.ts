/**
 * Room persona renderer (Oct 18 2026): the thinking engine rendered for the
 * living room in full — what they hold (with limits), the questions they
 * start and press with, the tells they spot, THREE code-picked moves (not
 * all seven), the stopping rule, and the distinctions with their collapse
 * costs.
 *
 * Deliberately a separate renderer from `renderThinkingPersona`: that one
 * feeds graded sittings (PROMPT_VERSION lineage), so nothing about it
 * changes. Read only by scripts/room-tick.mjs.
 *
 * Why full depth here: the room turn is one short message, and the old
 * render sent seven candidate moves for it — moves averaged into committee
 * talk. Wiring the unwired fields (architecture, collapseCost, pressure,
 * generative, firstNotices) is depth the dossiers already carry.
 */
import type { ThinkingEngine } from './thinking-types';
import { selectThinkingSlice, MODE_LINES } from './thinking-select.ts';
import { ANONYMOUS_LEAD } from './thinking-select.ts';

export function renderRoomThinking(
  engine: ThinkingEngine,
  question: string,
  prevText: string | null,
  prevSlug: string | null,
): string {
  const ps = engine.problemSensing;
  // Code proposes, thinker disposes: the moves that match the news story
  // and the last turn, not the whole file.
  const slice = selectThinkingSlice(engine, question, prevText, prevSlug, 3);
  const lines: string[] = [ANONYMOUS_LEAD, ''];

  if (engine.architecture?.length) {
    lines.push('WHAT YOU HOLD (your standing positions, with their limits):');
    for (const a of engine.architecture) {
      lines.push(`- ${a.domain}: ${a.foundation} Then: ${a.consequence} In practice: ${a.thinkingEffect} You refuse: ${a.limit}`);
    }
    lines.push('');
  }
  if (ps.entry?.length) {
    lines.push('YOUR FIRST QUESTIONS — ask these of any topic before anything else:',
      ...ps.entry.map((q) => `- ${q}`), '');
  }
  if (ps.pressure?.length) {
    lines.push('UNDER PRESSURE YOU ASK:',
      ...ps.pressure.map((q) => `- ${q}`), '');
  }
  if (ps.generative?.length) {
    lines.push('WHEN SOMETHING IS STUCK, YOU ASK:',
      ...ps.generative.map((q) => `- ${q}`), '');
  }
  if (ps.firstNotices?.length) {
    lines.push('WHAT YOU SPOT INSTANTLY (and distrust):',
      ...ps.firstNotices.map((q) => `- ${q}`), '');
  }

  lines.push('MOVES FOR THIS TOPIC (picked from your file by code — use what fits, ignore the rest):');
  slice.operations.forEach((op, i) => {
    lines.push('', `MOVE ${i + 1}. When: ${op.trigger}`, `Do: ${op.move}`,
      `Keep: ${op.preserves} Drop: ${op.rejects}`, `You gain: ${op.payoff}`);
  });

  if (engine.closureRule) {
    lines.push('', `STOPPING RULE — you have thought far enough when: ${engine.closureRule}`);
  }
  lines.push('', 'YOUR LOAD-BEARING DISTINCTIONS (the pairs you judge by):');
  for (const d of ps.distinctions) {
    lines.push(`- ${d.pair[0]} vs ${d.pair[1]}: ${d.whyItMatters} Collapse either side and: ${d.collapseCost}`);
  }
  lines.push('', MODE_LINES.think);
  return lines.join('\n');
}