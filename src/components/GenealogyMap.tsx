import { CABINET_DEBTS } from '@/philosophers/influences';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_BY_SLUG } from '@/philosophers';
import {
  GEN_NODE_R,
  GEN_POS,
  GEN_W,
  genEdgePath,
  genLateralShift,
  genNodePos,
  type GeomEdge,
} from '@/lib/genealogy-layout';
import type { Philosopher } from '@/types';

interface Edge extends GeomEdge {
  stance: 'positive' | 'critical' | 'ambivalent';
  note: string;
}

const ALL_EDGES: Edge[] = Object.entries(CABINET_DEBTS).flatMap(([debtor, debts]) =>
  debts.map((d) => ({ from: d.to, to: debtor, kind: d.kind, stance: d.stance, note: d.note })),
);

/** Line treatment per edge: kind sets solid/dashed. Stance lives in the data
 *  and the tooltips, never in the rendering — one calm monochrome canvas. */
function edgeStyle(e: Edge): { w: number; o: number; stroke: string; dash?: string; marker: string } {
  // D- (direct-critical) debts sit back at 80% transparency so breaks
  // read as quieter than carried-forward lines. Kind still sets solid/dashed.
  if (e.kind === 'direct' && e.stance === 'critical') {
    return { w: 1.1, o: 0.9, cls: 'gen-edge gen-edge-direct', marker: 'url(#gen-arrow-direct)' };
  }
  if (e.kind === 'indirect') {
    return { w: 1.1, o: 0.8, cls: 'gen-edge gen-edge-indirect', dash: '5 4', marker: 'url(#gen-arrow-indirect)' };
  }
  return { w: 1.3, o: 0.8, cls: 'gen-edge gen-edge-direct', marker: 'url(#gen-arrow-direct)' };
}

// Layout geometry lives in `@/lib/genealogy-layout` (shared with the
// geometry checker, so the two can never drift). This file keeps only
// presentation: styling, labels, and interaction.

// Seats on the spine get centred labels below; the paired rows label outward.
const SPINE_SEATS = new Set(['spinoza', 'deleuze', 'fisher']);
const LEFT_SEATS = new Set(['kant', 'marx', 'bogdanov', 'weil']);

// Label size: standard body (16px) for the least-connected seat, +2px per
// extra connection. Degree counts every debt in or out.
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

export default function GenealogyMap({
  philosophers,
  onSelect,
}: {
  philosophers: Philosopher[];
  onSelect: (p: Philosopher) => void;
}) {
  const order = DEFAULT_SEATING_ORDER.filter((slug) => PHILOSOPHER_BY_SLUG[slug]);
  const bySlug = (slug: string) => philosophers.find((p) => p.slug === slug);

  return (
    <div className="dark-academia-card genealogy-dark p-5 md:p-7">
      <p className="pass-indicator text-[#8b5254]">Debts and heirs</p>
      <h2 className="text-3xl mt-1">A Genealogy of Influence</h2>
      <p className="italic text-[#465f75]/70 mt-1 max-w-2xl">
        Oldest at the top, youngest at the bottom. Arrows run down the years —
        from creditor to heir. Solid is direct (read closely, even to break);
        dashed is indirect. Select a seat to open its profile.
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-[#465f75]/80" aria-label="Legend">
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-direct" strokeWidth="2" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-direct" />
          </svg>
          Direct — read and answered
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="gen-edge-indirect" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="28,1 34,4 28,7" className="gen-poly-indirect" />
          </svg>
          Indirect — through intermediaries
        </span>
      </div>

      <div className="overflow-x-auto custom-scroll mt-4 -mx-1 px-1" tabIndex={0} aria-label="Genealogy diagram, scrollable horizontally on small screens">
        <svg
          viewBox={`0 0 ${GEN_W} 738`}
          className="w-full max-w-[660px] min-w-[420px] h-auto mx-auto"
          role="img"
          aria-label={`Genealogy of influence across ${order.length} thinkers, Spinoza at the top to Fisher at the bottom. ${ALL_EDGES.length} debts shown. Name size grows with connections: smallest names at body size, 2 points larger per extra connection.`}
        >
          <defs>
            <marker id="gen-arrow-direct" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" />
            </marker>
            <marker id="gen-arrow-indirect" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" />
            </marker>
          </defs>

          {/* No drawn spine: the edges themselves trace the descent. */}

          {/* Direct threads first so the dashed indirect threads always
              paint on top — otherwise a dashed spine run (e.g.
              Bogdanov→Weil) disappears under the solid lines sharing
              its spine. */}
          {[...ALL_EDGES]
            .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'direct' ? -1 : 1))
            .map((e, i) => {
            if (!GEN_POS[e.from] || !GEN_POS[e.to]) return null;
            const st = edgeStyle(e);
            const stanceWord = e.stance === 'positive' ? 'embraces' : e.stance === 'critical' ? 'attacks' : 'mixed';
            const fromName = PHILOSOPHER_BY_SLUG[e.from]?.full_name ?? e.from;
            const toName = PHILOSOPHER_BY_SLUG[e.to]?.full_name ?? e.to;
            return (
              <path
                key={`${e.from}-${e.to}-${i}`}
                d={genEdgePath(ALL_EDGES, e.from, e.to, genLateralShift(ALL_EDGES, e))}
                fill="none"
                className={st.cls}
                strokeWidth={st.w}
                strokeDasharray={st.dash}
                opacity={st.o}
                markerEnd={st.marker}
              >
                <title>{`${fromName} → ${toName} (${e.kind}, ${stanceWord}): ${e.note}`}</title>
              </path>
            );
          })}

          {order.map((slug) => {
            const def = PHILOSOPHER_BY_SLUG[slug];
            const live = bySlug(slug);
            const { x, y } = genNodePos(slug);
            const label = `${def.full_name}, ${DEGREE[slug] ?? 0} connections`;
            const centred = SPINE_SEATS.has(slug);
            const left = LEFT_SEATS.has(slug);
            const size = labelSize(slug);
            const nameProps = centred
              ? { textAnchor: 'middle' as const, x: 0, y: GEN_NODE_R + 24 }
              : left
                ? { textAnchor: 'end' as const, x: -GEN_NODE_R - 12, y: 2 }
                : { textAnchor: 'start' as const, x: GEN_NODE_R + 12, y: 2 };
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
                  textAnchor={nameProps.textAnchor}
                  x={nameProps.x}
                  y={nameProps.y}
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
