import { CABINET_DEBTS } from '@/philosophers/influences';
import { DEFAULT_SEATING_ORDER, PHILOSOPHER_BY_SLUG } from '@/philosophers';
import type { Philosopher } from '@/types';

interface Edge {
  from: string;
  to: string;
  kind: 'direct' | 'indirect';
  stance: 'positive' | 'critical' | 'ambivalent';
  note: string;
}

const ALL_EDGES: Edge[] = Object.entries(CABINET_DEBTS).flatMap(([debtor, debts]) =>
  debts.map((d) => ({ from: d.to, to: debtor, kind: d.kind, stance: d.stance, note: d.note })),
);

/** Line treatment per edge: kind sets solid/dashed. Stance lives in the data
 *  and the tooltips, never in the rendering — one calm monochrome canvas. */
function edgeStyle(e: Edge): { w: number; o: number; stroke: string; dash?: string; marker: string } {
  if (e.kind === 'indirect') {
    return { w: 1.4, o: 0.8, cls: 'gen-edge gen-edge-indirect', dash: '5 4', marker: 'url(#gen-arrow-indirect)' };
  }
  return { w: 1.6, o: 0.8, cls: 'gen-edge gen-edge-direct', marker: 'url(#gen-arrow-direct)' };
}

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

/** Rim offset: arrowheads land just outside the heir's circle instead of
 *  buried under it (buried markers peeked out as stray blobs). */
const RIM = NODE_R + 5;

function edgePath(fromSlug: string, toSlug: string, shift = 0): string {
  const a = nodePos(fromSlug);
  const b = nodePos(toSlug);
  const ax = a.x + shift;
  const bx = b.x + shift;
  const dx = bx - ax;
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1) {
    // Same-row pair (Kant → Hegel): a gentle bow below the row, arrow at rim.
    const dir = Math.sign(dx) || 1;
    const mx = (ax + bx) / 2;
    return `M ${ax} ${a.y} Q ${mx} ${a.y + 44} ${bx - dir * RIM} ${b.y}`;
  }
  if (Math.abs(dx) < 1) {
    // Shared spine: straight runs and rim arrows — unless shifted aside
    // (drapes with the rest) or blocked by a seat in between, in which case
    // dodge left around it. Spinoza→Fisher would otherwise run straight
    // through Deleuze's circle, reading as handed along by him.
    const dir = Math.sign(dy) || 1;
    if (shift === 0) {
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      const blocked = Object.keys(POS).some((s) => {
        const p = POS[s];
        return Math.abs(p.x - ax) < NODE_R + 6 && p.y > lo + 4 && p.y < hi - 4;
      });
      const span = Math.abs(dy);
      // Showcase vase on the spine: fixed characters so the pair reads as
      // one gesture — Deleuze bows right, Fisher sweeps wide left around
      // Deleuze's circle, the finale nearly straight but never ruled.
      const vase: Record<string, number> = {
        'spinoza→deleuze': 40,
        'deleuze→fisher': 11,
        'spinoza→fisher': -84,
      };
      const v = vase[`${fromSlug}→${toSlug}`];
      if (v !== undefined) {
        return `M ${ax} ${a.y} C ${ax + v} ${a.y + dir * span * 0.25}, ${ax + v} ${b.y - dir * span * 0.25}, ${ax} ${b.y - dir * RIM}`;
      }
      if (!blocked) {
        return `M ${ax} ${a.y} L ${bx} ${b.y - dir * RIM}`;
      }
      // Blocked runs swing right, wide enough that no circle is ever in
      // doubt (Marx→Weil around Bogdanov).
      return `M ${ax} ${a.y} C ${ax + 80} ${a.y + dir * span * 0.25}, ${ax + 80} ${b.y - dir * span * 0.25}, ${ax} ${b.y - dir * RIM}`;
    }
    const out = shift > 0 ? 1 : -1;
    const span = Math.abs(dy);
    return `M ${ax} ${a.y} C ${ax + out * 48} ${a.y + dir * span * 0.25}, ${ax + out * 48} ${b.y - dir * span * 0.25}, ${ax} ${b.y - dir * RIM}`;
  }
  if (dy < 0) {
    // The one backward feud (younger creditor answered by an older heir):
    // arc out to the debtor's side and arrive from the side, never dipping
    // below either seat.
    const dir = Math.sign(dx) || 1;
    const cx = (a.x + b.x) / 2 - dir * 60;
    const cy = (a.y + b.y) / 2;
    const tx = b.x - cx;
    const ty = b.y - cy;
    const tl = Math.hypot(tx, ty) || 1;
    return `M ${a.x} ${a.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${(b.x - (tx / tl) * RIM).toFixed(1)} ${(b.y - (ty / tl) * RIM).toFixed(1)}`;
  }
  // Balanced S-curves: leave and arrive heading down the years (or up them,
  // for the one backward feud), arching the same way on both sides. Jumps
  // over intermediate rows drape inward toward the spine with span, so a
  // long-range direct reads as one gesture arcing over the middle seats;
  // adjacent rows stay straight. One family, gentle: depth encodes reach,
  // never loops.
  const bend = Math.max(30, Math.abs(dy) / 2);
  const dir = Math.sign(dy) || 1;
  const span = Math.abs(dy);
  const bow = span <= 100 ? 0 : Math.min(44, (span - 100) * 0.18);
  const side = (a.x + b.x) / 2 < SPINE_X ? 1 : -1;
  const ox = side * bow;
  return `M ${ax} ${a.y} C ${ax + ox} ${a.y + bend}, ${bx + ox} ${b.y - bend}, ${bx} ${b.y - dir * RIM}`;
}

/**
 * Where a dotted (indirect) line shares a vertical with another line — Kant
 * →Weil under Marx→Bogdanov on the left, Hegel→Bookchin under
 * Bloch→Bookchin on the right — the dotted line steps aside toward the spine
 * and drapes inward with the rest of the canvas, instead of running through
 * the seats it passes but doesn't involve.
 */
function lateralShift(edge: Edge): number {
  if (edge.kind !== 'indirect') return 0;
  const ax = nodePos(edge.from).x;
  const ay = nodePos(edge.from).y;
  const by = nodePos(edge.to).y;
  if (nodePos(edge.to).x !== ax) return 0;
  const lo = Math.min(ay, by);
  const hi = Math.max(ay, by);
  const clash = ALL_EDGES.some((o) => {
    if (o === edge) return false;
    const ox = nodePos(o.from).x;
    if (ox !== ax || nodePos(o.to).x !== ax) return false;
    const oy1 = nodePos(o.from).y;
    const oy2 = nodePos(o.to).y;
    return Math.min(oy1, oy2) < hi && Math.max(oy1, oy2) > lo;
  });
  return clash ? (ax < SPINE_X ? 10 : -10) : 0;
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
          viewBox={`0 0 ${W} 738`}
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

          {/* Central spine, exactly Spinoza's centre to Fisher's centre, so no
              line sticks out past either end circle (nodes draw over it). */}
          <line
            x1={SPINE_X} y1={60} x2={SPINE_X} y2={630}
            className="gen-spine"
            strokeWidth={1.5}
            opacity={0.4}
          />

          {ALL_EDGES.map((e, i) => {
            if (!POS[e.from] || !POS[e.to]) return null;
            const st = edgeStyle(e);
            const stanceWord = e.stance === 'positive' ? 'embraces' : e.stance === 'critical' ? 'attacks' : 'mixed';
            const fromName = PHILOSOPHER_BY_SLUG[e.from]?.full_name ?? e.from;
            const toName = PHILOSOPHER_BY_SLUG[e.to]?.full_name ?? e.to;
            return (
              <path
                key={`${e.from}-${e.to}-${i}`}
                d={edgePath(e.from, e.to, lateralShift(e))}
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
