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

// Time runs top-to-bottom down a central spine. Spinoza opens on the spine,
// the middle seats alternate left–right in chronological pairs, and the line
// converges back onto the spine for the Deleuze → Fisher finale — so both
// ends mirror each other.
const W = 704;
const NODE_R = 22;
const SPINE_X = 352;

const POS: Record<string, { x: number; y: number }> = {
  spinoza: { x: SPINE_X, y: 60 },
  kant: { x: 210, y: 155 },
  hegel: { x: 494, y: 155 },
  marx: { x: 210, y: 250 },
  lenin: { x: 494, y: 250 },
  bogdanov: { x: 210, y: 345 },
  bloch: { x: 494, y: 345 },
  weil: { x: 210, y: 440 },
  bookchin: { x: 494, y: 440 },
  deleuze: { x: SPINE_X, y: 535 },
  fisher: { x: SPINE_X, y: 630 },
};

const ROW_Y = [60, 155, 250, 345, 440, 535, 630];

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

function nodePos(slug: string): { x: number; y: number } {
  return POS[slug] ?? { x: 0, y: 0 };
}

function edgePath(fromSlug: string, toSlug: string): string {
  const a = nodePos(fromSlug);
  const b = nodePos(toSlug);
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1) {
    // Same-row pair (Kant → Hegel): a gentle bow below the row.
    const mx = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} Q ${mx} ${a.y + 44} ${b.x} ${b.y}`;
  }
  // Vertical S-curves that leave and enter heading down the years
  // (or up them, for the one backward feud).
  const bend = Math.max(30, Math.abs(dy) / 2);
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
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
    <div className="dark-academia-card p-5 md:p-7">
      <p className="pass-indicator text-[#8b5254]">Debts and heirs</p>
      <h2 className="text-3xl mt-1">A Genealogy of Influence</h2>
      <p className="italic text-[#465f75]/70 mt-1 max-w-2xl">
        Oldest at the top, youngest at the bottom. Arrows run down the years —
        from creditor to heir. Solid crimson is direct (read closely, even to
        break); dashed gold is indirect. Select a seat to open its profile.
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
          viewBox={`0 0 ${W} 738`}
          className="w-full max-w-[660px] min-w-[420px] h-auto mx-auto"
          role="img"
          aria-label={`Genealogy of influence across ${order.length} thinkers, Spinoza at the top to Fisher at the bottom. ${ALL_EDGES.length} debts shown. Name size grows with connections: smallest names at body size, 2 points larger per extra connection.`}
        >
          <defs>
            <marker id="gen-arrow-direct" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: 'var(--color-accent1)' }} />
            </marker>
            <marker id="gen-arrow-indirect" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" style={{ fill: 'var(--color-gold)' }} />
            </marker>
          </defs>

          {/* Central spine with a bead for every row of seats. It runs exactly
              from Spinoza's centre to Fisher's centre so no line sticks out
              past either end circle (nodes draw over the spine). */}
          <line
            x1={SPINE_X} y1={60} x2={SPINE_X} y2={630}
            style={{ stroke: 'var(--color-gold)' }}
            strokeWidth={1.5}
            opacity={0.4}
          />
          {ROW_Y.map((y) => (
            <circle key={y} cx={SPINE_X} cy={y} r={3.5} style={{ fill: 'var(--color-gold)' }} opacity={0.55} />
          ))}

          {ALL_EDGES.map((e, i) => {
            if (!POS[e.from] || !POS[e.to]) return null;
            const direct = e.kind === 'direct';
            const fromName = PHILOSOPHER_BY_SLUG[e.from]?.full_name ?? e.from;
            const toName = PHILOSOPHER_BY_SLUG[e.to]?.full_name ?? e.to;
            return (
              <path
                key={`${e.from}-${e.to}-${i}`}
                d={edgePath(e.from, e.to)}
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

          {order.map((slug) => {
            const def = PHILOSOPHER_BY_SLUG[slug];
            const live = bySlug(slug);
            const { x, y } = nodePos(slug);
            const label = `${def.full_name}, ${DEGREE[slug] ?? 0} connections`;
            const centred = SPINE_SEATS.has(slug);
            const left = LEFT_SEATS.has(slug);
            const size = labelSize(slug);
            const nameProps = centred
              ? { textAnchor: 'middle' as const, x: 0, y: NODE_R + 24 }
              : left
                ? { textAnchor: 'end' as const, x: -NODE_R - 12, y: 2 }
                : { textAnchor: 'start' as const, x: NODE_R + 12, y: 2 };
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
                  textAnchor={nameProps.textAnchor}
                  x={nameProps.x}
                  y={nameProps.y}
                  fontSize={size}
                  fontWeight={700}
                  style={{ fontFamily: 'var(--font-heading)', fill: 'var(--color-main)', paintOrder: 'stroke', stroke: 'var(--color-parchment-light)', strokeWidth: 4 }}
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
