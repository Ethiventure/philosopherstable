/**
 * Pure geometry for the vertical genealogy diagram (no JSX, no aliases):
 * positions, path-building and bundling rules. Imported by both the
 * GenealogyMap component and scripts/check-diagram-geometry.mjs, so the
 * checker can never drift from the renderer. All units are SVG viewBox px.
 *
 * Time runs top → bottom (opening seat on the central axis, paired seats
 * alternating left / right down the rows, closing seats back on axis).
 * Arrows run creditor → heir and may point up or down the years — direction
 * shows debt, position shows time, never the reverse. Reciprocal pairs
 * (A owes B and B owes A) draw as ONE line with arrowheads at both ends —
 * never two threads.
 *
 * Road system: threads bundle onto three shared vertical channels — small
 * roads join them on horizontal ramps and leave the same way. Overlap is
 * the design, not a failure; the text list beside the diagram carries
 * exactness.
 */

export interface GeomEdge {
  from: string;
  to: string;
  kind: 'direct' | 'indirect';
}

export const GEN_W = 704;
export const GEN_H = 738;
export const GEN_NODE_R = 34;
export const GEN_SPINE_X = 352;
const GEN_LEFT_X = 210;
const GEN_RIGHT_X = 494;

/** Rim offset: arrowheads land just outside a node's circle instead of
 *  buried under it (buried markers peeked out as stray blobs). */
export const GEN_RIM = GEN_NODE_R + 5;

/**
 * The three channels, offset beside the node columns so bundled traffic
 * never runs through seated neighbours (50px+ clearance everywhere).
 * Same-side pairs take their side channel; cross-side pairs share the
 * centre channel.
 */
const GEN_CH_LEFT = 262;
const GEN_CH_CENTRE = 404;
const GEN_CH_RIGHT = 442;

/** Chronological seat order — rendered top to bottom. */
export const GEN_ORDER = [
  'spinoza', 'kant', 'hegel', 'marx', 'lenin', 'bogdanov',
  'bloch', 'weil', 'bookchin', 'deleuze', 'rose', 'fisher',
];

export const GEN_POS: Record<string, { x: number; y: number }> = {
  spinoza: { x: GEN_SPINE_X, y: 90 },
  kant: { x: GEN_LEFT_X, y: 155 },
  hegel: { x: GEN_RIGHT_X, y: 155 },
  marx: { x: GEN_LEFT_X, y: 250 },
  lenin: { x: GEN_RIGHT_X, y: 250 },
  bogdanov: { x: GEN_LEFT_X, y: 345 },
  bloch: { x: GEN_RIGHT_X, y: 345 },
  weil: { x: GEN_LEFT_X, y: 440 },
  bookchin: { x: GEN_RIGHT_X, y: 440 },
  rose: { x: GEN_LEFT_X, y: 535 },
  deleuze: { x: GEN_RIGHT_X, y: 535 },
  fisher: { x: GEN_SPINE_X, y: 600 },
};

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
 * Per-edge lateral bows [c1x, c2x] for character on two named runs:
 * gentle mirrored S-swings. Same family as the channel belly.
 * Documented, never silent.
 */
const GEN_BOW_EXTRA: Record<string, [number, number]> = {
  'hegel→deleuze': [-35, 15],
  'kant→rose': [15, -35],
  'lenin→bloch': [-28, 18],
  'lenin→bookchin': [-28, 18],
  'lenin→bogdanov': [-15, 15],
};

/**
 * End-circle fountain: Spinoza departures and Fisher arrivals spread
 * around the east rim of their circle (angular fan, one step per thread)
 * so the fans read as an embrace, not a stacked loop band. Returns full
 * rim points for both ends — plain channel-facing rims everywhere else.
 */
function endRims(edges: GeomEdge[], fromSlug: string, toSlug: string): { sx: number; sy: number; ex: number; ey: number } {
  const a = genNodePos(fromSlug);
  const b = genNodePos(toSlug);
  const step = 0.16;
  // Default rims face the channel (aDir/bDir recomputed by the caller —
  // these are the fallback when no fountain applies).
  let sx = a.x + GEN_RIM;
  let sy = a.y;
  let ex = b.x + GEN_RIM;
  let ey = b.y;
  if (fromSlug === 'spinoza') {
    const sibs = edges.filter((o) => o.from === 'spinoza').map((o) => `${o.to}:${o.kind}`).sort();
    const i = sibs.indexOf(`${toSlug}:${edges.find((o) => o.from === 'spinoza' && o.to === toSlug)?.kind ?? 'direct'}`);
    const ang = (i - (sibs.length - 1) / 2) * step;
    sx = a.x + GEN_RIM * Math.cos(ang);
    sy = a.y + GEN_RIM * Math.sin(ang);
  }
  if (toSlug === 'fisher') {
    const sibs = edges.filter((o) => o.to === 'fisher').map((o) => `${o.from}:${o.kind}`).sort();
    const i = sibs.indexOf(`${fromSlug}:${edges.find((o) => o.from === fromSlug && o.to === 'fisher')?.kind ?? 'direct'}`);
    const ang = (i - (sibs.length - 1) / 2) * step;
    ex = b.x + GEN_RIM * Math.cos(ang);
    ey = b.y + GEN_RIM * Math.sin(ang);
  }
  return { sx, sy, ex, ey };
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
 * One calm cubic per debt, rim to rim, via its channel.
 *
 * Road rules (cohesion without touching the data):
 * - Same-side pairs take their side channel; cross-side pairs share the
 *   centre channel. Three levels total, so the diagram reads as a road
 *   system, not spaghetti.
 * - Ramps hug the endpoints: threads leave their node almost horizontally
 *   toward the channel — small roads joining the motorway — clearing
 *   seated neighbours before travelling, and leave only at their heir.
 * - Arrowheads land on rims along the arrival horizontal — never buried,
 *   never floating, approach angle consistent per side.
 */
export function genEdgePath(_edges: GeomEdge[], fromSlug: string, toSlug: string, _shift = 0): string {
  void _edges;
  void _shift;
  const a = genNodePos(fromSlug);
  const b = genNodePos(toSlug);
  const sameSide = a.x === b.x;
  const channel = sameSide
    ? (a.x < GEN_SPINE_X ? GEN_CH_LEFT : a.x > GEN_SPINE_X ? GEN_CH_RIGHT : GEN_CH_CENTRE)
    : GEN_CH_CENTRE;
  // Rim points face the channel; the end-circle fountain spreads
  // Spinoza departures and Fisher arrivals around the rim instead.
  const aDir = channel >= a.x ? 1 : -1;
  const bDir = channel >= b.x ? 1 : -1;
  const rims = endRims(_edges, fromSlug, toSlug);
  // Departure fan: threads leaving one creditor start at slightly
  // staggered rim heights (±5px), mirroring the arrival fan, so stacked
  // departure heads separate instead of one blob. Skipped where the
  // Spinoza fountain already spreads departures.
  const fromSibs = _edges
    .filter((o) => o.from === fromSlug)
    .map((o) => `${o.to}:${o.kind}`)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort();
  const fromSelf = _edges.find((o) => o.from === fromSlug && o.to === toSlug);
  const fromIdx = fromSelf ? fromSibs.indexOf(`${fromSelf.to}:${fromSelf.kind}`) : 0;
  const fanSy = fromSibs.length > 1 && fromSlug !== 'spinoza' ? (fromIdx - (fromSibs.length - 1) / 2) * 5 : 0;
  const sx = fromSlug === 'spinoza' ? rims.sx : a.x + aDir * GEN_RIM;
  const sy = fromSlug === 'spinoza' ? rims.sy : a.y + fanSy;
  // Other heirs keep the small staggered landing so stacked arrowheads
  // separate into a readable row instead of one blob.
  const heirSibs = _edges
    .filter((o) => o.to === toSlug)
    .map((o) => `${o.from}:${o.kind}`)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort();
  const selfKey = _edges.find((o) => o.from === fromSlug && o.to === toSlug);
  const heirIdx = selfKey ? heirSibs.indexOf(`${selfKey.from}:${selfKey.kind}`) : 0;
  const fanEy = heirSibs.length > 1 ? (heirIdx - (heirSibs.length - 1) / 2) * 7 : 0;
  const ex = toSlug === 'fisher' ? rims.ex : b.x + bDir * GEN_RIM;
  const ey = toSlug === 'fisher' ? rims.ey : b.y + fanEy;
  // Gentle belly so no thread reads as a ruled line: left and centre
  // channels bow 20px east; the right channel holds 8px because arrival
  // heads sit close beside it. Same family of curve everywhere. Named
  // runs carry their S-bows from GEN_BOW_EXTRA.
  const belly = channel >= GEN_CH_RIGHT ? 8 : 20;
  const cradle: [number, number] = GEN_BOW_EXTRA[`${fromSlug}→${toSlug}`] ?? [0, 0];
  const c1x = channel + belly + cradle[0];
  const c1y = sy + (ey - sy) * 0.05;
  const c2x = channel + belly + cradle[1];
  const c2y = sy + (ey - sy) * 0.95;
  const f = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  return `M ${f(sx)} ${f(sy)} C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(ex)} ${f(ey)}`;
}
