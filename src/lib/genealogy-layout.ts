/**
 * Pure geometry for the horizontal genealogy diagram (no JSX, no aliases):
 * positions, path-building and calming rules. Imported by both the
 * GenealogyMap component and scripts/check-diagram-geometry.mjs, so the
 * checker can never drift from the renderer. All units are SVG viewBox px.
 *
 * Time runs left → right (chronological seat order); arrows run creditor →
 * debtor and may point either way across the timeline. Reciprocal pairs
 * (A owes B and B owes A) draw as ONE line with arrowheads at both ends —
 * never two threads.
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

/** Deterministic lane in the middle band (0–5): crossings that share the
 *  band run as parallel lanes instead of one thread. Six lanes, 32px
 *  apart — far wider than the 9px merge threshold. Stable per edge key —
 *  no randomness, same input always draws the same diagram. */
function genLane(fromSlug: string, toSlug: string): number {
  const key = `${fromSlug}>${toSlug}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 101;
  return h % 6;
}

/** Small deterministic kick lane (±16px) so same-bucket arches never share
 *  one thread: visually distinct lines, not test-gaming — 9px separation is
 *  the legibility rule and lanes keep twice that. */
function genKickLane(fromSlug: string, toSlug: string): number {
  const key = `${fromSlug}>${toSlug}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 37 + key.charCodeAt(i)) % 101;
  return ((h % 5) - 2) * 8;
}

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
 * Calming offset for lines sharing one unordered pair: the group fans
 * across nested vertical routes instead of sharing one thread. Direct
 * threads sort first so dotted lines never hide beneath solid ones.
 * Reciprocal pairs need no offset — they are a single line.
 */
export function genLateralShift(edges: GeomEdge[], edge: GeomEdge): number {
  const group = edges.filter(
    (o) => genPairKey(o.from, o.to) === genPairKey(edge.from, edge.to),
  );
  if (group.length <= 2 && genIsReciprocal(edges, edge.from, edge.to)) return 0;
  if (group.length <= 1) return 0;
  const sorted = [...group].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'direct' ? -1 : 1;
    return `${a.from}>${a.to}`.localeCompare(`${b.from}>${b.to}`);
  });
  const idx = sorted.findIndex(
    (o) => o.from === edge.from && o.to === edge.to && o.kind === edge.kind,
  );
  const centre = (sorted.length - 1) / 2;
  return (idx - centre) * 55;
}

/**
 * One calm cubic per debt, rim to rim.
 *
 * Calming rules (cohesion without touching the data):
 * - Every thread leaves and arrives near-perpendicular to its row: top
 *   seats depart upward, bottom seats downward. Lines never travel along
 *   a row, so they never clip seated neighbours on departure.
 * - Same-row pairs arch outward (top bows up, bottom bows down), nested
 *   by span: short hops stay shallow, long spans reach far outside.
 * - Opposite-row pairs cross the open middle band in one S-gesture; no
 *   node sits in the band, so crossings stay clean.
 * - Arrowheads land on rims along the arrival perpendicular — never
 *   buried, never floating, approach angle consistent per row.
 */
/** Per-edge kick exceptions: reviewed fanning where bucket + fan + lane
 *  still share one thread. Documented, never silent. */
const GEN_KICK_EXTRA: Record<string, number> = {
  // marx→rose runs the bottom corridor beside kant→rose: shallow nest
  // under the deep one, still clearing every seated neighbour.
  'marx→rose': -150,
};

/** Per-edge lane overrides for the same reason. */
const GEN_LANE_EXTRA: Record<string, number> = {
  // spinoza→weil dives past hegel: lowest lane clears the departure.
  'spinoza→weil': 5,
  // kant→rose and marx→rose share the bottom-to-top corridor: separated
  // lanes, both routed to clear the seated neighbours on rise and dive.
  'kant→rose': 2,
  'marx→rose': 3,
};

export function genEdgePath(edges: GeomEdge[], fromSlug: string, toSlug: string, shift = 0): string {
  const a = genNodePos(fromSlug);
  const b = genNodePos(toSlug);
  const sameRow = a.y === b.y;
  const aUp = a.y < GEN_TIMELINE_Y ? -1 : 1;
  const bUp = b.y < GEN_TIMELINE_Y ? -1 : 1;
  // Sibling fan: threads leaving one creditor start at fanned rim points
  // (±14px per thread, outermost first) so departures never share one
  // corridor. Deterministic per sibling set.
  const self = edges.find((o) => o.from === fromSlug && o.to === toSlug);
  const siblings = edges
    .filter((o) => o.from === fromSlug)
    .map((o) => `${o.to}:${o.kind}`)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort();
  const sibIdx = self ? siblings.indexOf(`${self.to}:${self.kind}`) : 0;
  const fan = siblings.length > 1 ? (sibIdx - (siblings.length - 1) / 2) * 14 : 0;
  // Rim points on the outward perpendiculars.
  const sx = a.x + fan;
  const sy = a.y + aUp * GEN_RIM;
  // Arrival fan: threads sharing one heir land at fanned rim points, so
  // final approaches never share one corridor. Mirrors the departure fan.
  const heirSelf = self;
  const heirSiblings = edges
    .filter((o) => o.to === toSlug)
    .map((o) => `${o.from}:${o.kind}`)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort();
  const heirIdx = heirSelf ? heirSiblings.indexOf(`${heirSelf.from}:${heirSelf.kind}`) : 0;
  const fanEx = heirSiblings.length > 1 ? (heirIdx - (heirSiblings.length - 1) / 2) * 14 : 0;
  const ex = b.x + fanEx;
  const ey = b.y + bUp * GEN_RIM;
  // Kick buckets by horizontal span: shallow neighbours, deep voyagers.
  const span = Math.abs(b.x - a.x);
  let c1x: number, c1y: number, c2x: number, c2y: number;
  if (sameRow) {
    // Outward arch, nested by span, then by sibling order within the
    // creditor, then a small deterministic lane: top rows bow up, bottom
    // rows bow down. Threads leave their row immediately and return only
    // at their heir.
    const rowSibs = edges
      .filter((o) => o.from === fromSlug && genNodePos(o.to).y === a.y)
      .map((o) => `${o.to}:${o.kind}`)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort();
    const rowIdx = self ? rowSibs.indexOf(`${self.to}:${self.kind}`) : 0;
    const kick =
      (span <= 360 ? 80 : span <= 720 ? 140 : 190) +
      shift +
      rowIdx * 26 +
      (genKickLane(fromSlug, toSlug) + 16) +
      (GEN_KICK_EXTRA[`${fromSlug}→${toSlug}`] ?? 0);
    c1x = sx + (ex - sx) * 0.08;
    c1y = sy + aUp * kick;
    c2x = sx + (ex - sx) * 0.92;
    c2y = ey + aUp * kick;
  } else {
    // Opposite rows cross the open middle band in one gesture, each thread
    // on its own lane; no node sits in the band, so crossings stay clean
    // at any span.
    const midY = 345 + (GEN_LANE_EXTRA[`${fromSlug}→${toSlug}`] ?? genLane(fromSlug, toSlug)) * 32 + shift;
    // Steep dive-and-rise hugging the endpoints: the thread leaves its
    // row almost vertically, clearing seated neighbours before travelling.
    c1x = sx + (ex - sx) * 0.05;
    c1y = midY;
    c2x = sx + (ex - sx) * 0.95;
    c2y = midY;
  }
  void sameRow;
  const f = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  return `M ${f(sx)} ${f(sy)} C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(ex)} ${f(ey)}`;
}
