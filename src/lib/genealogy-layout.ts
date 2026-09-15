/**
 * Pure geometry for the genealogy diagram (no JSX, no aliases): positions,
 * path-building and overlap rules. Imported by both the GenealogyMap
 * component and scripts/check-diagram-geometry.mjs, so the checker can
 * never drift from the renderer. All units are SVG viewBox px.
 */

export interface GeomEdge {
  from: string;
  to: string;
  kind: 'direct' | 'indirect';
}

export const GEN_W = 704;
export const GEN_NODE_R = 22;
export const GEN_SPINE_X = 352;

/** Rim offset: arrowheads land just outside the heir's circle instead of
 *  buried under it (buried markers peeked out as stray blobs). */
export const GEN_RIM = GEN_NODE_R + 5;

export const GEN_POS: Record<string, { x: number; y: number }> = {
  spinoza: { x: GEN_SPINE_X, y: 60 },
  kant: { x: 210, y: 155 },
  hegel: { x: 494, y: 155 },
  marx: { x: 210, y: 250 },
  lenin: { x: 494, y: 250 },
  bogdanov: { x: 210, y: 345 },
  bloch: { x: 494, y: 345 },
  weil: { x: 210, y: 440 },
  bookchin: { x: 494, y: 440 },
  deleuze: { x: GEN_SPINE_X, y: 535 },
  fisher: { x: GEN_SPINE_X, y: 630 },
};

export function genNodePos(slug: string): { x: number; y: number } {
  return GEN_POS[slug] ?? { x: 0, y: 0 };
}

/**
 * Sidestep for dotted lines sharing a vertical with another line: steps
 * toward the spine so both stay visible (Kant's corridor, Hegel→Bookchin).
 */
export function genLateralShift(edges: GeomEdge[], edge: GeomEdge): number {
  if (edge.kind !== 'indirect') return 0;
  const ax = genNodePos(edge.from).x;
  const ay = genNodePos(edge.from).y;
  const by = genNodePos(edge.to).y;
  if (genNodePos(edge.to).x !== ax) return 0;
  const lo = Math.min(ay, by);
  const hi = Math.max(ay, by);
  const clash = edges.some((o) => {
    if (o === edge) return false;
    const ox = genNodePos(o.from).x;
    if (ox !== ax || genNodePos(o.to).x !== ax) return false;
    const oy1 = genNodePos(o.from).y;
    const oy2 = genNodePos(o.to).y;
    return Math.min(oy1, oy2) < hi && Math.max(oy1, oy2) > lo;
  });
  return clash ? (ax < GEN_SPINE_X ? 10 : -10) : 0;
}

/**
 * Stacked dotted tracks: several indirect debts can leave one seat down one
 * corridor (Kant → Marx / Bogdanov / Weil share x=220). Nested arcs keep
 * every debt visibly arrowed instead of reading as one doubled line: the
 * shortest hop stays shallowest, the longest reaches furthest.
 */
export function genTrackRank(edges: GeomEdge[], fromSlug: string, shift: number, span: number): number {
  if (shift === 0) return 0;
  const ax = genNodePos(fromSlug).x + shift;
  const spans = edges
    .filter((o) => {
      if (o.from !== fromSlug || o.kind !== 'indirect') return false;
      const s2 = genLateralShift(edges, o);
      if (s2 === 0 || genNodePos(o.from).x + s2 !== ax) return false;
      return Math.abs(genNodePos(o.to).y - genNodePos(o.from).y) > 1;
    })
    .map((o) => Math.abs(genNodePos(o.to).y - genNodePos(o.from).y))
    .sort((p, q) => p - q);
  return spans.filter((s) => s < span - 1).length;
}

/** Straight-spine mode: every debt draws one straight thread from creditor
 *  to heir rim. Same-side debts run exactly down the left (x=210), right
 *  (x=494) or central (x=352) spine and may overlap — overlap there is
 *  accepted, the text list carries full understanding. */
export const STRAIGHT_SPINES = true;

/** Lane index among free-line debts leaving the same creditor: keeps
 *  same-source threads from collapsing into one apparent line now that
 *  amplitude comes in shared buckets. */
function braidLane(edges: GeomEdge[], fromSlug: string, toSlug: string): number {
  const spans = edges
    .filter((o) => o.from === fromSlug && genNodePos(o.to).x !== genNodePos(o.from).x)
    .map((o) => Math.abs(genNodePos(o.to).y - genNodePos(o.from).y))
    .sort((p, q) => p - q);
  const span = Math.abs(genNodePos(toSlug).y - genNodePos(fromSlug).y);
  return spans.filter((s) => s < span - 1).length;
}

/** Deterministic stagger so neighbouring threads cross at different
 *  heights: small offset derived from the edge key, no randomness. */
function braidPhase(fromSlug: string, toSlug: string): number {
  const key = `${fromSlug}→${toSlug}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 97;
  return ((h % 5) - 2) * 6;
}

/** Corridor prototype flag: left-vertical family (x=210) gets span-ranked
 *  S corridors instead of the old shift/nest split. Flip to false to compare
 *  against the previous routing with the same 41 debts. */
export const LEFT_CORRIDOR_PROTO = true;

const LEFT_SPINE_X = 210;

/** Rank of this edge's span among left-vertical family members sharing the
 *  same corridor side: shortest hop = 0 (innermost), longest = outermost. */
function leftCorridorRank(edges: GeomEdge[], fromSlug: string, toSlug: string): number {
  const spans = edges
    .filter(
      (o) =>
        genNodePos(o.from).x === LEFT_SPINE_X &&
        genNodePos(o.to).x === LEFT_SPINE_X &&
        Math.abs(genNodePos(o.to).y - genNodePos(o.from).y) > 1,
    )
    .map((o) => Math.abs(genNodePos(o.to).y - genNodePos(o.from).y))
    .sort((p, q) => p - q);
  const span = Math.abs(genNodePos(toSlug).y - genNodePos(fromSlug).y);
  return spans.filter((s) => s < span - 1).length;
}

/** Rim landing points for crowded heirs, keyed `creditor→heir`. Default
 *  (absent) is the top rim. Angles spread arrivals that would otherwise
 *  thread one gap. */
export const GEN_RIM_POINTS: Record<string, [number, number]> = {
  // Fisher fan: spine arrivals keep the top; Kant takes upper-left, Marx
  // takes the left rim, so four arrows never share one approach.
  'kant→fisher': [333, 611],
  'marx→fisher': [327, 621],
  // Bookchin fan: Marx's long S arrives upper-left instead of threading
  // the 2px gap between Bloch's circle and the rim. Kant's arrives
  // upper-left too, a touch lower, so the two arrows never share a tip.
  'marx→bookchin': [475, 421],
  'kant→bookchin': [472, 423],
};

/** Extra lateral bow for named edges that must swing around a node the
 *  family rules would drive them through. Keep empty unless the checker
 *  demands it — every entry here is a reviewed exception. */
export const GEN_BOW_EXTRA: Record<string, number> = {
  // Fisher lanes nest inside as S-threads (longer debt runs deeper),
  // clearing Deleuze's circle on the way to their rim points.
  'marx→fisher': 15,
  'kant→fisher': 30,
  // Hegel→Weil nests with the mirrored family; no extra needed.
  'hegel→weil': 0,
  // Fisher→Bloch climbs past Deleuze and Bookchin's circles with the
  // standard mid bow — no extra needed.
  'fisher→bloch': 0,
};

export function genEdgePath(edges: GeomEdge[], fromSlug: string, toSlug: string, shift = 0): string {
  const a = genNodePos(fromSlug);
  const b = genNodePos(toSlug);
  if (STRAIGHT_SPINES) {
    // One straight thread, ending at the heir's rim along the line's own
    // direction (or a fanned rim point where one is assigned).
    const rim = GEN_RIM_POINTS[`${fromSlug}→${toSlug}`];
    if (rim) return `M ${a.x} ${a.y} L ${rim[0]} ${rim[1]}`;
    const vx0 = b.x - a.x;
    const vy0 = b.y - a.y;
    const len0 = Math.hypot(vx0, vy0) || 1;
    // Bidirectional pairs (e.g. Bogdanov↔Lenin) run as a two-way street:
    // each direction offsets 5px to its own side so both arrows stay
    // visible instead of sharing one thread. The offset uses the pair's
    // canonical orientation so the two lanes land on opposite sides.
    let sx = a.x;
    let sy = a.y;
    let ox = 0;
    let oy = 0;
    if (edges.some((o) => o.from === toSlug && o.to === fromSlug)) {
      const fwd = fromSlug < toSlug ? 1 : -1;
      const cx = fwd * vx0;
      const cy = fwd * vy0;
      ox = (-cy / len0) * 5;
      oy = (cx / len0) * 5;
      const s = fromSlug < toSlug ? 1 : -1;
      sx += ox * s;
      sy += oy * s;
      ox *= s;
      oy *= s;
    }
    const vx = b.x - sx;
    const vy = b.y - sy;
    const len = Math.hypot(vx, vy) || 1;
    const ex = b.x - (vx / len) * GEN_RIM + ox;
    const ey = b.y - (vy / len) * GEN_RIM + oy;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  const ax = a.x + shift;
  const bx = b.x + shift;
  const dx = bx - ax;
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1) {
    // Same-row pair (Kant → Hegel): a gentle S-bow below the row, arrow at rim.
    const dir = Math.sign(dx) || 1;
    const mx1 = ax + dx * 0.3;
    const mx2 = ax + dx * 0.7;
    return `M ${ax} ${a.y} C ${mx1} ${a.y + 46}, ${mx2} ${a.y + 46}, ${bx - dir * GEN_RIM} ${b.y}`;
  }
  if (Math.abs(dx) < 1) {
    // Shared spine: straight runs and rim arrows — unless shifted aside
    // (nested arcs, below) or blocked by a seat in between, in which case
    // dodge around it. Spinoza→Fisher would otherwise run straight
    // through Deleuze's circle, reading as handed along by him.
    const dir = Math.sign(dy) || 1;
    if (LEFT_CORRIDOR_PROTO && ax === LEFT_SPINE_X && bx === LEFT_SPINE_X) {
      // Prototype: every left-vertical debt owns one centre-draped S
      // corridor. Rank by span (shortest innermost), ~12px apart, so the
      // Kant fan reads as nested threads instead of one doubled line.
      // Arrival fans across the top rim by corridor index.
      const span = Math.abs(dy);
      const rank = leftCorridorRank(edges, fromSlug, toSlug);
      const drape = 30 + 12 * rank;
      const fan = 6 + 4 * rank;
      return `M ${ax} ${a.y} C ${ax + drape} ${a.y + dir * span * 0.3}, ${ax + drape * 0.4} ${b.y - dir * span * 0.3}, ${bx - fan} ${b.y - dir * GEN_RIM}`;
    }
    if (shift === 0) {
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      const blocked = Object.keys(GEN_POS).some((s) => {
        const p = GEN_POS[s];
        return Math.abs(p.x - ax) < GEN_NODE_R + 6 && p.y > lo + 4 && p.y < hi - 4;
      });
      const span = Math.abs(dy);
      // Showcase vase on the spine: S-curves with opposed controls, so the
      // long runs read as gestures rather than ruled lines — Deleuze echoes
      // Fisher's right-first gesture smaller so the pair nests, Fisher sweeps
      // right before diving wide left around Deleuze's circle, the finale
      // nearly straight but never ruled.
      const vase: Record<string, [number, number]> = {
        'spinoza→deleuze': [24, -32],
        'deleuze→fisher': [11, 11],
        'spinoza→fisher': [40, -95],
      };
      const v = vase[`${fromSlug}→${toSlug}`];
      if (v !== undefined) {
        return `M ${ax} ${a.y} C ${ax + v[0]} ${a.y + dir * span * 0.25}, ${ax + v[1]} ${b.y - dir * span * 0.25}, ${ax} ${b.y - dir * GEN_RIM}`;
      }
      if (!blocked) {
        // Unblocked shared track: a near-straight S (opposed nudges), never ruled.
        const sway = ax < GEN_SPINE_X ? 9 : -9;
        return `M ${ax} ${a.y} C ${ax + sway} ${a.y + dir * span * 0.3}, ${ax - sway} ${b.y - dir * span * 0.3}, ${bx} ${b.y - dir * GEN_RIM}`;
      }
      // Blocked runs drape toward the centre as an S and stay inside their
      // own side — right-side tracks (Hegel→Bloch/Bookchin) bow left of the
      // right spine, left-side tracks bow right. Never outside the spines.
      const inward = ax < GEN_SPINE_X ? 1 : -1;
      const drape = 72;
      return `M ${ax} ${a.y} C ${ax + inward * drape} ${a.y + dir * span * 0.3}, ${ax + inward * drape * 0.35} ${b.y - dir * span * 0.3}, ${ax} ${b.y - dir * GEN_RIM}`;
    }
    const out = shift > 0 ? 1 : -1;
    const span = Math.abs(dy);
    const nest = 24 + 12 * genTrackRank(edges, fromSlug, shift, span);
    return `M ${ax} ${a.y} C ${ax + out * nest} ${a.y + dir * span * 0.25}, ${ax + out * nest} ${b.y - dir * span * 0.25}, ${ax} ${b.y - dir * GEN_RIM}`;
  }
  if (fromSlug === 'deleuze' && toSlug === 'bookchin') {
    // The one backward feud (younger creditor answered by an older heir):
    // S-arc out to the debtor's side and arrive from the side, never dipping
    // below either seat.
    const dir = Math.sign(dx) || 1;
    const mx1 = a.x - dir * 70;
    const mx2 = b.x - dir * 30;
    const cy = (a.y + b.y) / 2;
    const tx = b.x - mx2;
    const ty = b.y - cy;
    const tl = Math.hypot(tx, ty) || 1;
    return `M ${a.x} ${a.y} C ${mx1.toFixed(1)} ${a.y.toFixed(1)}, ${mx2.toFixed(1)} ${cy.toFixed(1)}, ${(b.x - (tx / tl) * GEN_RIM).toFixed(1)} ${(b.y - (ty / tl) * GEN_RIM).toFixed(1)}`;
  }
  // Braid family: true nested S-curves with opposed controls. Sides
  // mirror by travel direction (rightward bellies right, leftward bellies
  // left) so each thread keeps one continuous gesture and neighbouring
  // threads nest instead of colliding. Amplitude comes in three calm
  // buckets by span; a small per-edge phase staggers crossings down the
  // axis. The vertical families keep their own corridors above and never
  // reach this branch.
  const bend = Math.max(30, Math.abs(dy) / 2);
  const dir = Math.sign(dy) || 1;
  const span = Math.abs(dy);
  const bow = BRAID_PROTO
    ? span <= 140 ? 18 : span <= 260 ? 34 : 48
    : span <= 100 ? 0 : Math.min(60, (span - 100) * 0.25);
  const side = dx >= 0 ? 1 : -1;
  const ox = side * bow + (GEN_BOW_EXTRA[`${fromSlug}→${toSlug}`] ?? 0);
  const rim = GEN_RIM_POINTS[`${fromSlug}→${toSlug}`];
  const ex = rim ? rim[0] : bx;
  const ey = rim ? rim[1] : b.y - dir * GEN_RIM;
  if (!BRAID_PROTO) {
    return `M ${ax} ${a.y} C ${ax + ox} ${a.y + dir * bend}, ${bx + ox} ${b.y - dir * bend}, ${ex} ${ey}`;
  }
  // Opposed controls: first bows with travel, second counters, so the
  // thread flows S-like through the middle instead of arcing one way.
  const ph = braidPhase(fromSlug, toSlug);
  const lane = (braidLane(edges, fromSlug, toSlug) % 3 - 1) * 10;
  const c1x = ax + ox + lane;
  const c2x = bx - ox * 0.7 + lane;
  return `M ${ax} ${a.y} C ${c1x} ${a.y + dir * bend + ph}, ${c2x} ${b.y - dir * bend + ph}, ${ex} ${ey}`;
}
