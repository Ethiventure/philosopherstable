import { CABINET_DEBTS } from '@/philosophers/influences';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_BY_SLUG } from '@/philosophers';
import type { Philosopher } from '@/types';

interface Edge {
  from: string;
  to: string;
  kind: 'direct' | 'indirect';
  note: string;
}

const ALL_EDGES: Edge[] = Object.entries(CABINET_DEBTS).flatMap(([debtor, debts]) =>
  debts.map((d) => ({ from: d.to, to: debtor, kind: d.kind, note: d.note })),
);

// Chronological left-to-right, zigzag rows so long arcs stay readable.
const W = 1160;
const NODE_R = 22;

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

function nodePos(index: number): { x: number; y: number } {
  const x = 60 + index * 104;
  const y = index % 2 === 0 ? 105 : 225;
  return { x, y };
}

function edgePath(fromIdx: number, toIdx: number): string {
  const a = nodePos(fromIdx);
  const b = nodePos(toIdx);
  const span = Math.abs(toIdx - fromIdx);
  // Arcs lift above the nodes; longer jumps arc higher to clear intermediates.
  const lift = 34 + span * 16;
  const mx = (a.x + b.x) / 2;
  const my = Math.min(a.y, b.y) - lift;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export default function GenealogyMap({
  philosophers,
  onSelect,
}: {
  philosophers: Philosopher[];
  onSelect: (p: Philosopher) => void;
}) {
  const order = DEFAULT_SEATING_ORDER.filter((slug) => PHILOSOPHER_BY_SLUG[slug]);
  const idxOf = (slug: string) => order.indexOf(slug);
  const bySlug = (slug: string) => philosophers.find((p) => p.slug === slug);

  return (
    <div className="dark-academia-card p-5 md:p-7">
      <p className="pass-indicator text-[#8b5254]">Debts and heirs</p>
      <h2 className="text-3xl mt-1">A Genealogy of Influence</h2>
      <p className="italic text-[#465f75]/70 mt-1 max-w-2xl">
        Oldest left, youngest right. Arrows run forward in time — from creditor to heir.
        Solid crimson is direct (read closely, even to break); dashed gold is indirect.
        Select a seat to open its profile.
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-[#465f75]/80" aria-label="Legend">
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" stroke="var(--color-accent1)" strokeWidth="2" />
            <polygon points="28,1 34,4 28,7" fill="var(--color-accent1)" />
          </svg>
          Direct — read and answered
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="34" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" stroke="var(--color-gold)" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="28,1 34,4 28,7" fill="var(--color-gold)" />
          </svg>
          Indirect — through intermediaries
        </span>
      </div>

      <div className="overflow-x-auto custom-scroll mt-4 -mx-1 px-1" tabIndex={0} aria-label="Genealogy diagram, scrollable horizontally on small screens">
        <svg
          viewBox={`0 -110 ${W} 430`}
          className="w-full min-w-[720px] h-auto"
          role="img"
          aria-label={`Genealogy of influence across ${order.length} thinkers, Spinoza to Fisher. ${ALL_EDGES.length} debts shown. Name size grows with connections: smallest names at body size, 2 points larger per extra connection.`}
        >
          <defs>
            <marker id="gen-arrow-direct" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: 'var(--color-accent1)' }} />
            </marker>
            <marker id="gen-arrow-indirect" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: 'var(--color-gold)' }} />
            </marker>
          </defs>

          {ALL_EDGES.map((e, i) => {
            const fi = idxOf(e.from);
            const ti = idxOf(e.to);
            if (fi < 0 || ti < 0) return null;
            const direct = e.kind === 'direct';
            const fromName = PHILOSOPHER_BY_SLUG[e.from]?.full_name ?? e.from;
            const toName = PHILOSOPHER_BY_SLUG[e.to]?.full_name ?? e.to;
            return (
              <path
                key={`${e.from}-${e.to}-${i}`}
                d={edgePath(fi, ti)}
                fill="none"
                style={{ stroke: direct ? 'var(--color-accent1)' : 'var(--color-gold)' }}
                strokeWidth={direct ? 1.6 : 1.4}
                strokeDasharray={direct ? undefined : '5 4'}
                opacity={direct ? 0.85 : 0.8}
                markerEnd={direct ? 'url(#gen-arrow-direct)' : 'url(#gen-arrow-indirect)'}
              >
                <title>{`${fromName} → ${toName} (${e.kind}): ${e.note}`}</title>
              </path>
            );
          })}

          {order.map((slug, i) => {
            const def = PHILOSOPHER_BY_SLUG[slug];
            const live = bySlug(slug);
            const { x, y } = nodePos(i);
            const label = `${def.full_name}, ${def.birth_year}–${def.death_year}, ${DEGREE[slug] ?? 0} connections`;
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
                  r={NODE_R}
                  style={{ fill: 'var(--color-parchment-light)', stroke: def.accent_color }}
                  strokeWidth={2.5}
                />
                <text
                  textAnchor="middle"
                  dy="0.36em"
                  fontSize="19"
                  fill={def.accent_color}
                  style={{ fontFamily: 'var(--font-heading)' }}
                  aria-hidden="true"
                >
                  {def.name.charAt(0)}
                </text>
                <text
                  textAnchor="middle"
                  y={NODE_R + 20}
                  fontSize={labelSize(slug)}
                  fontWeight={700}
                  style={{ fontFamily: 'var(--font-heading)', fill: 'var(--color-main)' }}
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
