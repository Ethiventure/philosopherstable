/**
 * Pure geometry for the horizontal genealogy diagram (no JSX, no aliases):
 * positions, path-building and bundling rules. Imported by both the
 * GenealogyMap component and scripts/check-diagram-geometry.mjs, so the
 * checker can never drift from the renderer. All units are SVG viewBox px.
 *
 * Time runs left → right (chronological seat order); arrows run creditor →
 * debtor and may point either way across the timeline. Reciprocal pairs
 * (A owes B and B owes A) draw as ONE line with arrowheads at both ends —
 * never two threads.
 *
 * Road system: threads bundle onto four shared highways — small roads join
 * them at steep ramps and leave the same way. Overlap is the design, not
 * a failure; the text list beside the diagram carries exactness.
 */

export interface GeomEdge {
  from: string;
  to: string;
  kind: 'direct' | 'indirect';
}

export const GEN_W = 1500;
export const GEN_H = 850;
export const GEN_NODE_R = 34;
export const GEN_TIMELINE_Y = 425;
export const GEN_TOP_Y = 285;
export const GEN_BOTTOM_Y = 565;
const GEN_LEFT_MARGIN = 90;
const GEN_RIGHT_MARGIN = 90;

/** Rim offset: arrowheads land just outside a node's circle instead of
 *  buried under it (buried markers peeked out as stray blobs). */
export const GEN_RIM = GEN_NODE_R + 5;

/**
 * The four highways. Outer pair carries same-row traffic (top bows up,
 * bottom bows down); middle pair carries opposite-row crossings, picked
 * deterministically per edge. All clear seated rows by 70px+.
 */
const GEN_HWY_TOP = 140;
const GEN_HWY_UPPER = 390;
const GEN_HWY_LOWER = 460;
const GEN_HWY_BOTTOM = 710;

/** Chronological seat order — the single source for left-to-right
 *  placement. (Mirrors birth-year order; the grid script keeps its own
 *  copy for its reading view.) */
export const GEN_ORDER = [
  'spinoza', 'kant', 'hegel', 'marx', 'lenin', 'bogdanov',
  'bloch', 'weil', 'bookchin', 'deleuze', 'rose', 'fisher',
];

function buildPositions(): Record<string, { x: number; y: number }> {
  const usable = GEN_W - GEN_LEFT_MARGIN - GEN_RIGHT_MARGIN;
  const step = usable / Math.max(GEN_ORDER.length - 1, 1);
  const pos: Record<string, { x: number; y: number }> = {};
  GEN_ORDER.forEach((slug, i) => {
    pos[slug] = {
      x: GEN_LEFT_MARGIN + step * i,
      y: i % 2 === 0 ? GEN_TOP_Y : GEN_BOTTOM_Y,
    };
  });
  return pos;
}

export const GEN_POS: Record<string, { x: number; y: number }> = buildPositions();

export function genNodePos(slug: string): { x: number; y: number } {
  return GEN_POS[slug] ?? { x: 0, y: 0 };
}

/** Unordered pair key: reciprocal debts share one drawn line. */
export function genPairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/** True when both directions hold at least one debt: the pair draws as a
 *  single bidirectional line (arrowheads at both ends). */
export function genIsReciprocal(edges: GeomEdge[], a: string, b: string): boolean {
  return (
    edges.some((e) => e.from === a && e.to === b) &&
    edges.some((e) => e.from === b && e.to === a)
  );
}

/**
 * Highway picker for opposite-row crossings: one of the two middle
 * highways, deterministic per edge key. Same-row traffic always takes its
 * outer highway. Stable — same input always draws the same diagram.
 */
function genHighway(fromSlug: string, toSlug: string): number {
  const key = `${fromSlug}>${toSlug}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 101;
  return h % 2 === 0 ? GEN_HWY_UPPER : GEN_HWY_LOWER;
}

/**
 * Compatibility shim: individual offsets no longer exist — threads bundle
 * by design. Kept so the checker call-shape never drifts from the renderer.
 */
export function genLateralShift(_edges: GeomEdge[], _edge: GeomEdge): number {
  void _edges;
  void _edge;
  return 0;
}

/**
 * One calm cubic per debt, rim to rim, via its highway.
 *
 * Road rules (cohesion without touching the data):
 * - Same-row pairs take the outer highway on their side; opposite-row
 *   pairs take one of the two middle highways. Four levels total, so the
 *   whole diagram reads as a road system, not spaghetti.
 * - Ramps hug the endpoints (5% / 95%): threads leave their row almost
 *   vertically — small roads joining the motorway — clearing seated
 *   neighbours before travelling, and rise only at their heir.
 * - Arrowheads land on rims along the arrival perpendicular — never
 *   buried, never floating, approach angle consistent per row.
 */
export function genEdgePath(_edges: GeomEdge[], fromSlug: string, toSlug: string, _shift = 0): string {
  void _edges;
  void _shift;
  const a = genNodePos(fromSlug);
  const b = genNodePos(toSlug);
  const sameRow = a.y === b.y;
  const aUp = a.y < GEN_TIMELINE_Y ? -1 : 1;
  const bUp = b.y < GEN_TIMELINE_Y ? -1 : 1;
  // Shared rims: bundling threads start and land together by design.
  const sx = a.x;
  const sy = a.y + aUp * GEN_RIM;
  const ex = b.x;
  const ey = b.y + bUp * GEN_RIM;
  const hwy = sameRow
    ? (aUp < 0 ? GEN_HWY_TOP : GEN_HWY_BOTTOM)
    : genHighway(fromSlug, toSlug);
  const c1x = sx + (ex - sx) * 0.05;
  const c1y = hwy;
  const c2x = sx + (ex - sx) * 0.95;
  const c2y = hwy;
  void sameRow;
  const f = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  return `M ${f(sx)} ${f(sy)} C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(ex)} ${f(ey)}`;
}
