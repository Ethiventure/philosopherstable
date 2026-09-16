// Layout from ChatGPT via owner, adapted to repo contracts: horizontal
// timeline kept, but the dual-kind guard stays, names keep degree sizing
// (dates live in hover text only), geometry routes through
// @/lib/genealogy-layout so the checker can never drift, and reciprocal
// pairs draw as one bidirectional line.
import { Fragment, useMemo, useState } from 'react';
import { CABINET_DEBTS } from '@/philosophers/influences';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_BY_SLUG } from '@/philosophers';
import {
  GEN_H,
  GEN_NODE_R,
  GEN_W,
  genEdgePath,
  genIsReciprocal,
  genLateralShift,
  genNodePos,
  genPairKey,
  type GeomEdge,
} from '@/lib/genealogy-layout';
import type { Philosopher } from '@/types';

interface Edge extends GeomEdge {
  stance: 'positive' | 'critical' | 'ambivalent';
  confidence: 'high' | 'medium' | 'low';
  note: string;
  hops?: string[];
}

/**
 * Display direction is creditor → debtor (stored data is debtor →
 * creditor). Reciprocal pairs (A owes B and B owes A) are two debts but
 * ONE drawn line with arrowheads at both ends. Same-pair dual-kind never
 * draws twice: the direct thread wins (guard — zero such pairs today).
 */
const ALL_EDGES: Edge[] = Object.entries(CABINET_DEBTS).flatMap(([debtor, debts]) =>
  debts
    .filter((d) => d.kind === 'direct' || !debts.some((o) => o.to === d.to && o.kind === 'direct'))
    .map((d) => ({ from: d.to, to: debtor, kind: d.kind, stance: d.stance, confidence: d.confidence, note: d.note, hops: d.hops })),
);

/** Line treatment: kind sets solid/dashed; opacity sets strength of
 *  evidence (high full / medium half / low quarter — unmistakable steps).
 *  Stance lives in the data and the text, never in the rendering. Element
 *  opacity covers markers too, so heads fade with their thread. */
function edgeStyle(e: Edge): { w: number; o: number; cls: string; dash?: string; marker: string; markerStart: string } {
  const o = e.confidence === 'high' ? 1 : e.confidence === 'medium' ? 0.5 : 0.25;
  if (e.kind === 'indirect') {
    return { w: 2, o, cls: 'gen-edge gen-edge-indirect', dash: '8 7', marker: 'url(#gen-arrow-indirect)', markerStart: 'url(#gen-arrow-indirect-start)' };
  }
  return { w: 2.4, o, cls: 'gen-edge gen-edge-direct', marker: 'url(#gen-arrow-direct)', markerStart: 'url(#gen-arrow-direct-start)' };
}

// Seats on the spine get centred labels below; the paired rows label outward.
const SPINE_SEATS = new Set(['spinoza', 'fisher']);
const LEFT_SEATS = new Set(['kant', 'marx', 'bogdanov', 'weil', 'rose']);

// Label size: standard body (16px) for the least-connected seat, +2px per
// extra connection. Degree counts every debt in or out. Size reflects
// connectedness for legibility — never importance.
const DEGREE: Record<string, number> = Object.fromEntries(
  Object.keys(PHILOSOPHER_BY_SLUG).map((slug) => [
    slug,
    ALL_EDGES.filter((e) => e.from === slug || e.to === slug).length,
  ]),
);
const MIN_DEGREE = Math.min(...Object.values(DEGREE));
const BASE_LABEL = 16;

function labelSize(slug: string): number {
  return BASE_LABEL + 2 * ((DEGREE[slug] ?? 0) - MIN_DEGREE);
}

function seatDates(slug: string): string {
  const p = PHILOSOPHER_BY_SLUG[slug];
  if (!p?.birth_year) return '';
  return p.death_year ? `${p.birth_year}–${p.death_year}` : `${p.birth_year}–`;
}

export default function GenealogyMap({
  philosophers,
  onSelect,
}: {
  philosophers: Philosopher[];
  onSelect: (p: Philosopher) => void;
}) {
  const order = DEFAULT_SEATING_ORDER.filter((slug) => PHILOSOPHER_BY_SLUG[slug]);
  const bySlug = (slug: string) => philosophers.find((p) => p.slug === slug);
  const [lit, setLit] = useState<string | null>(null);

  // Reciprocal pairs draw once. Each group keeps every directed debt for
  // the text list — the line never eats a relationship.
  const groups = useMemo(() => {
    const map = new Map<string, Edge[]>();
    for (const e of ALL_EDGES) {
      const key = genPairKey(e.from, e.to);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.values()];
  }, []);

  return (
    <div className="dark-academia-card genealogy-dark p-5 md:p-7">
      <p className="pass-indicator text-[#8b5254]">Debts or heirs and ancestors?</p>
      <h2 className="text-3xl mt-1">A Genealogy of Influence</h2>
      <p className="italic text-[#465f75]/70 mt-1 max-w-3xl">
        Firstborn at the top, last at the bottom. Arrows run creditor to
        debtor. Solid is direct (at least a quotation or in person
        meeting); dashed is indirect via someone else. This is the route of
        connection, it doesn't communicate strength or depth. Line strength
        shows strength of evidence or depth of connection, from full
        strength down through thinner claims. Hover over the thinker's
        circle to see their connections to the others. Click on a seat to
        open its profile.
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-base text-[#465f75]/80" aria-label="Legend">
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-direct" strokeWidth="2" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-direct" />
          </svg>
          Direct — evidence of direct connection
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-indirect" strokeWidth="2" strokeDasharray="8 7" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-indirect" />
          </svg>
          Indirect — influenced through intermediaries
        </span>
      </div>

      <div className="overflow-x-auto custom-scroll mt-4 -mx-1 px-1" tabIndex={0} aria-label="Genealogy diagram, scrollable horizontally on small screens">
        <svg
          viewBox={`0 0 ${GEN_W} ${GEN_H}`}
          className="w-full max-w-[660px] min-w-[420px] h-auto mx-auto"
          role="img"
          aria-label={`Genealogy of influence across ${order.length} thinkers, Spinoza at the top to Fisher at the bottom. ${ALL_EDGES.length} debts shown. Name size grows with connections: smallest names at body size, 2 points larger per extra connection.`}
        >
          <defs>
            <marker id="gen-arrow-direct" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0.5 0.8 Q 4.6 3.6 9 5 Q 4.6 6.4 0.5 9.2 Q 3.2 5 0.5 0.8 Z" />
            </marker>
            <marker id="gen-arrow-indirect" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0.5 0.8 Q 4.6 3.6 9 5 Q 4.6 6.4 0.5 9.2 Q 3.2 5 0.5 0.8 Z" />
            </marker>
            <marker id="gen-arrow-direct-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 9.5 0.8 Q 5.4 3.6 1 5 Q 5.4 6.4 9.5 9.2 Q 6.8 5 9.5 0.8 Z" />
            </marker>
            <marker id="gen-arrow-indirect-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 9.5 0.8 Q 5.4 3.6 1 5 Q 5.4 6.4 9.5 9.2 Q 6.8 5 9.5 0.8 Z" />
            </marker>
          </defs>

          {/* No drawn spine: the bundled threads themselves trace the descent. */}

          {groups.map((g) => {
            const first = g[0];
            const reciprocal = g.length > 1 && genIsReciprocal(ALL_EDGES, first.from, first.to);
            // The drawn thread follows the first debt's direction; a
            // reciprocal pair gets heads at both ends instead of a twin.
            const d = genEdgePath(ALL_EDGES, first.from, first.to, genLateralShift(ALL_EDGES, first));
            const st = edgeStyle(first);
            const key = genPairKey(first.from, first.to);
            const involves = !lit || g.some((e) => e.from === lit || e.to === lit);
            const opacity = !involves ? 0.08 : st.o;
            // Dimmed threads drop their heads too: marker opacity doesn't
            // inherit reliably everywhere, so no markers off-focus, period.
            const heads = involves ? st.marker : undefined;
            return (
              <Fragment key={key}>
                <path
                  d={d}
                  fill="none"
                  className={st.cls}
                  strokeWidth={st.w}
                  strokeDasharray={st.dash}
                  opacity={opacity}
                  markerEnd={heads}
                  markerStart={reciprocal ? (heads ? st.markerStart : undefined) : undefined}
                  aria-hidden="true"
                >
                </path>
              </Fragment>
            );
          })}

          {order.map((slug) => {
            const def = PHILOSOPHER_BY_SLUG[slug];
            const live = bySlug(slug);
            const { x, y } = genNodePos(slug);
            const dates = seatDates(slug);
            const label = `${def.full_name}${dates ? `, ${dates}` : ''}, ${DEGREE[slug] ?? 0} connections`;
            const centred = SPINE_SEATS.has(slug);
            const left = LEFT_SEATS.has(slug);
            const size = labelSize(slug);
            const dimmed =
              !!lit &&
              slug !== lit &&
              !ALL_EDGES.some((e) => (e.from === slug && e.to === lit) || (e.from === lit && e.to === slug));
            return (
              <g
                key={slug}
                transform={`translate(${x}, ${y})`}
                tabIndex={0}
                role="button"
                aria-label={`${label}. Name shown at ${labelSize(slug)} points. Activate to open profile.`}
                className="genealogy-node"
                style={{ cursor: live ? 'pointer' : 'default', opacity: dimmed ? 0.35 : 1 }}
                onClick={() => {
                  // Taps (touch) never fire mouse-leave: clear the highlight
                  // or its heads linger on the next view.
                  setLit(null);
                  if (live) onSelect(live);
                }}
                onMouseEnter={() => setLit(slug)}
                onMouseLeave={() => setLit(null)}
                onFocus={() => setLit(slug)}
                onBlur={() => setLit(null)}
                onKeyDown={(ev) => {
                  if ((ev.key === 'Enter' || ev.key === ' ') && live) {
                    ev.preventDefault();
                    onSelect(live);
                  }
                }}
              >
                <circle
                  r={GEN_NODE_R}
                  className="gen-node-circle"
                  strokeWidth={2.5}
                />
                <text
                  textAnchor="middle"
                  dy="0.36em"
                  fontSize="19"
                  className="gen-node-initial"
                  aria-hidden="true"
                >
                  {def.name.charAt(0)}
                </text>
                <text
                  textAnchor={centred ? 'middle' : left ? 'end' : 'start'}
                  x={centred ? 0 : left ? -GEN_NODE_R - 12 : GEN_NODE_R + 12}
                  y={centred ? GEN_NODE_R + 26 : 2}
                  fontSize={size}
                  fontWeight={700}
                  className="gen-node-name"
                  aria-hidden="true"
                >
                  {def.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <details className="mt-4 border border-[#4a392d]/20 rounded-sm">
        <summary className="cursor-pointer p-3 text-sm font-heading text-[#4a392d]">
          All {ALL_EDGES.length} debts as text
        </summary>
        <ul className="px-4 pb-4 space-y-1.5 max-h-64 overflow-y-auto custom-scroll">
          {ALL_EDGES.map((e, i) => (
            <li key={i} className="text-sm text-[#465f75]/85">
              <span className="font-heading text-[#4a392d]">
                {PHILOSOPHER_BY_SLUG[e.from]?.name} → {PHILOSOPHER_BY_SLUG[e.to]?.name}
              </span>{' '}
              <span className="text-xs italic text-[#465f75]/60">({e.kind})</span> — {e.note}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
