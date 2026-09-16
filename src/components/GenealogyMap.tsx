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
 *  evidence (high 100% / medium 90% / low 80%). Stance lives in the data
 *  and the text, never in the rendering. Element opacity covers markers
 *  too, so heads fade with their thread. */
function edgeStyle(e: Edge): { w: number; o: number; cls: string; dash?: string; marker: string } {
  const o = e.confidence === 'high' ? 1 : e.confidence === 'medium' ? 0.9 : 0.8;
  if (e.kind === 'indirect') {
    return { w: 2, o, cls: 'gen-edge gen-edge-indirect', dash: '8 7', marker: 'url(#gen-arrow-indirect)' };
  }
  return { w: 2.4, o, cls: 'gen-edge gen-edge-direct', marker: 'url(#gen-arrow-direct)' };
}

function stanceWord(stance: Edge['stance']): string {
  return stance === 'positive' ? 'appreciative' : stance === 'critical' ? 'critical' : 'mixed';
}

function relationshipLabel(e: Edge): string {
  const source = PHILOSOPHER_BY_SLUG[e.from]?.full_name ?? e.from;
  const debtor = PHILOSOPHER_BY_SLUG[e.to]?.full_name ?? e.to;
  const route =
    e.kind === 'direct'
      ? 'direct engagement'
      : e.hops?.length
        ? `mediated through ${e.hops.join(', ')}`
        : 'mediated inheritance';
  return `${source} to ${debtor}: ${route}, ${stanceWord(e.stance)}. ${e.note}`;
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
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  // Reciprocal pairs draw once. Each group keeps every directed debt for
  // text, tooltips and the panel — the line never eats a relationship.
  const groups = useMemo(() => {
    const map = new Map<string, Edge[]>();
    for (const e of ALL_EDGES) {
      const key = genPairKey(e.from, e.to);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.values()];
  }, []);

  const selected = groups.find(
    (g) => genPairKey(g[0].from, g[0].to) === selectedPair,
  );

  return (
    <div className="dark-academia-card genealogy-dark p-5 md:p-7">
      <p className="pass-indicator text-[#8b5254]">Debts and heirs</p>
      <h2 className="text-3xl mt-1">A Genealogy of Influence</h2>
      <p className="italic text-[#465f75]/70 mt-1 max-w-3xl">
        Oldest at the top, youngest at the bottom. Arrows run creditor to heir,
        so a debt may point back up the years. Solid is direct (read closely, even
        to break); dashed is indirect. A line with heads at both ends is a
        two-way debt. Line strength shows strength of evidence, from full
        strength down through thinner claims. Select a line to read it. Select a seat to open its profile.
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-base text-[#465f75]/80" aria-label="Legend">
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-direct" strokeWidth="2" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-direct" />
          </svg>
          Direct — read and answered
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-indirect" strokeWidth="2" strokeDasharray="8 7" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-indirect" />
          </svg>
          Indirect — through intermediaries
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
            <marker id="gen-arrow-direct" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0.5 L 9 5 L 0 9.5 z" />
            </marker>
            <marker id="gen-arrow-indirect" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0.5 L 9 5 L 0 9.5 z" />
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
            const isSel = selectedPair === key;
            const label = g.map(relationshipLabel).join(' Also: ');
            const fromName = PHILOSOPHER_BY_SLUG[first.from]?.name ?? first.from;
            const toName = PHILOSOPHER_BY_SLUG[first.to]?.name ?? first.to;
            return (
              <Fragment key={key}>
                {first.kind === 'indirect' && (
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--gen-ground)"
                    strokeWidth={st.w + 3.4}
                    opacity={1}
                    aria-hidden="true"
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  className={`${st.cls}${isSel ? ' is-selected' : ''}`}
                  strokeWidth={isSel ? st.w + 1 : st.w}
                  strokeDasharray={st.dash}
                  opacity={isSel ? 1 : st.o}
                  markerEnd={st.marker}
                  markerStart={reciprocal ? st.marker : undefined}
                  tabIndex={0}
                  role="button"
                  aria-label={`${label} Activate to read this debt.`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedPair(isSel ? null : key)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setSelectedPair(isSel ? null : key);
                    }
                  }}
                >
                  <title>{`${fromName} → ${toName}${reciprocal ? ' ⇄' : ''}: ${g.map((e) => e.note).join(' Also: ')}`}</title>
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
            return (
              <g
                key={slug}
                transform={`translate(${x}, ${y})`}
                tabIndex={0}
                role="button"
                aria-label={`${label}. Name shown at ${labelSize(slug)} points. Activate to open profile.`}
                className="genealogy-node"
                style={{ cursor: live ? 'pointer' : 'default' }}
                onClick={() => live && onSelect(live)}
                onKeyDown={(ev) => {
                  if ((ev.key === 'Enter' || ev.key === ' ') && live) {
                    ev.preventDefault();
                    onSelect(live);
                  }
                }}
              >
                <title>{label}</title>
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

      {selected && (
        <aside className="mt-4 border border-[#4a392d]/20 rounded-sm p-4" aria-live="polite" aria-label="Selected debt">
          {selected.map((e) => (
            <div key={`${e.from}-${e.to}-${e.kind}`} className="mb-2 last:mb-0">
              <p className="font-heading text-[#4a392d]">
                {PHILOSOPHER_BY_SLUG[e.from]?.name} → {PHILOSOPHER_BY_SLUG[e.to]?.name}{' '}
                <span className="text-xs italic text-[#465f75]/60">({e.kind}, {stanceWord(e.stance)})</span>
              </p>
              <p className="text-sm text-[#465f75]/85">{e.note}</p>
              {e.hops?.length ? (
                <p className="text-xs text-[#465f75]/65">Mediated route: {e.hops.join(' → ')}</p>
              ) : null}
            </div>
          ))}
        </aside>
      )}

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
