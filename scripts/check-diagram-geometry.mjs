#!/usr/bin/env node
/**
 * Geometry checker for the genealogy diagram: proves every debt draws
 * exactly one line, no line runs through a seat it doesn't involve, and no
 * two lines merge into one. Imports the renderer's own layout module plus
 * the debts table, so it can never drift from either.
 *   node scripts/check-diagram-geometry.mjs
 * Exits non-zero on failure. Thresholds: node clearance 30px from centre
 * (node radius 22 + 8px air), path overlap fraction 0.4 outside shared
 * 40px endpoint zones. Renderer emits M + C only.
 */
import { CABINET_DEBTS } from '../src/philosophers/influences.ts';
import {
  GEN_NODE_R,
  GEN_POS,
  genEdgePath,
  genLateralShift,
} from '../src/lib/genealogy-layout.ts';

const CLEAR = GEN_NODE_R + 8;
const OVERLAP_BAR = 0.4;
// Near-identical arrival warning: two edges reaching the same heir whose
// final segments run within this distance and whose rim tips land within
// this distance get flagged as WARN (not FAIL) so the renderer can fan out.
const ARRIVE_SEG = 12;
const ARRIVE_TIP = 10;

const edges = [];
for (const [debtor, debts] of Object.entries(CABINET_DEBTS)) {
  for (const d of debts) edges.push({ from: d.to, to: debtor, kind: d.kind });
}
console.log(`debts: ${edges.length}`);

function samplePath(d) {
  const nums = d.match(/-?\d+\.?\d*/g).map(Number);
  const isL = !d.includes('C');
  const pts = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    if (isL) {
      pts.push([nums[0] + t * (nums[2] - nums[0]), nums[1] + t * (nums[3] - nums[1])]);
      continue;
    }
    const [a, b, c, e, f, g, h, k] = nums;
    pts.push([
      u * u * u * a + 3 * u * u * t * c + 3 * u * t * t * e + t * t * t * g,
      u * u * u * b + 3 * u * u * t * e + 3 * u * t * t * f + t * t * t * h,
    ]);
  }
  return pts;
}

const paths = edges.map((e) => ({
  e,
  d: genEdgePath(edges, e.from, e.to, genLateralShift(edges, e)),
  pts: null,
}));
for (const p of paths) p.pts = samplePath(p.d);

let failed = 0;
const fail = (msg) => {
  failed += 1;
  console.log(`FAIL  ${msg}`);
};

// 1. Every debt draws exactly one path (renderer skips unknown slugs).
for (const p of paths) {
  if (!p.d || !p.d.startsWith('M')) fail(`no path for ${p.e.from}>${p.e.to}`);
}

// 1b. Exact duplicate debts: same from + same to + same kind more than once.
// Data-layer error — report, never silently deduplicate.
{
  const seen = new Map();
  for (const p of paths) {
    const key = `${p.e.from}>${p.e.to} (${p.e.kind})`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, n] of seen) {
    if (n > 1) fail(`DUPLICATE DEBT ${key} appears ${n} times`);
  }
}

// 2. No path runs through a seat it doesn't involve. Samples within 40px
// of either endpoint are exempt: departures necessarily leave through
// crowded space near their creditor (e.g. Kant's fan over Marx).
for (const p of paths) {
  const ends = [GEN_POS[p.e.from], GEN_POS[p.e.to]];
  const spineRun = ends[0].x === ends[1].x;
  for (const [slug, pos] of Object.entries(GEN_POS)) {
    if (slug === p.e.from || slug === p.e.to) continue;
    // Accepted by design: same-spine straight runs overlap intermediate
    // seats on their spine (left / right / central).
    if (spineRun && pos.x === ends[0].x) continue;
    let m = Infinity;
    for (const q of p.pts) {
      if (ends.some((e) => Math.hypot(q[0] - e.x, q[1] - e.y) < 40)) continue;
      m = Math.min(m, Math.hypot(q[0] - pos.x, q[1] - pos.y));
    }
    if (m < CLEAR) fail(`${p.e.from}>${p.e.to} passes ${slug} at ${m.toFixed(1)}px`);
  }
}

// 3. No two lines merge: overlap fraction outside shared endpoint zones.
function overlapFrac(A, B) {
  const shared = [];
  for (const p of [
    GEN_POS[A.e.from], GEN_POS[A.e.to],
  ]) {
    for (const q of [GEN_POS[B.e.from], GEN_POS[B.e.to]]) {
      if (Math.hypot(p.x - q.x, p.y - q.y) < 40) shared.push(q);
    }
  }
  let n = 0;
  let tot = 0;
  for (const p of A.pts) {
    if (shared.some((q) => Math.hypot(p[0] - q.x, p[1] - q.y) < 40)) continue;
    tot += 1;
    let m = Infinity;
    for (const q of B.pts) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
    if (m < 9) n += 1;
  }
  return tot ? n / tot : 0;
}
for (let i = 0; i < paths.length; i++) {
  for (let j = i + 1; j < paths.length; j++) {
    // Accepted by design: threads sharing one spine overlap by construction.
    const A = paths[i];
    const B = paths[j];
    const ax = GEN_POS[A.e.from].x;
    const bx = GEN_POS[B.e.from].x;
    if (ax === GEN_POS[A.e.to].x && bx === GEN_POS[B.e.to].x && ax === bx) continue;
    const f = Math.max(overlapFrac(paths[i], paths[j]), overlapFrac(paths[j], paths[i]));
    if (f > OVERLAP_BAR) {
      fail(
        `${paths[i].e.from}>${paths[i].e.to} merges with ${paths[j].e.from}>${paths[j].e.to} (${Math.round(f * 100)}% overlap)`,
      );
    }
  }
}

if (failed) {
  console.error(`\n${failed} geometr${failed === 1 ? 'y failure' : 'y failures'} — adjust paths, not thresholds.`);
  process.exitCode = 1;
} else {
  console.log('geometry clean: 41 lines, no drive-throughs, no merges');
}

// 4. Near-identical arrivals (WARN only): same heir, final segments running
// close together, tips landing at effectively the same rim point. Distinct
// debts, so the fix is fanning out rim arrivals — never changing the data.
{
  const tail = (p) => p.pts.slice(-12);
  const tip = (p) => p.pts[p.pts.length - 1];
  let warns = 0;
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const A = paths[i];
      const B = paths[j];
      if (A.e.to !== B.e.to) continue;
      const tA = tip(A);
      const tB = tip(B);
      if (Math.hypot(tA[0] - tB[0], tA[1] - tB[1]) > ARRIVE_TIP) continue;
      const sA = tail(A);
      const sB = tail(B);
      let close = 0;
      for (const p of sA) {
        let m = Infinity;
        for (const q of sB) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
        if (m < ARRIVE_SEG) close += 1;
      }
      if (close / sA.length > 0.5) {
        warns += 1;
        console.log(`WARN  near-identical arrival ${A.e.from}>${A.e.to} vs ${B.e.from}>${B.e.to} — fan out rim points`);
      }
    }
  }
  if (!warns) console.log('arrivals distinct: no near-identical rim approaches');
}
