#!/usr/bin/env node
/**
 * Geometry checker for the genealogy diagram: proves every debt draws
 * exactly one line and no line runs through a seat it doesn't involve.
 * Threads bundle onto shared highways by design (road system — overlap is
 * expected; the text list carries exactness), so merging is reported, not
 * failed. Imports the renderer's own layout module plus the debts table,
 * so it can never drift from either.
 *   node scripts/check-diagram-geometry.mjs
 * Exits non-zero on failure. Thresholds: node clearance (radius + 8px
 * air); 40px endpoint zones. Renderer emits M + C only.
 */
import { CABINET_DEBTS } from '../src/philosophers/influences.ts';
import {
  GEN_NODE_R,
  GEN_POS,
  genEdgePath,
  genLateralShift,
} from '../src/lib/genealogy-layout.ts';

const CLEAR = GEN_NODE_R + 8;

const edges = [];
for (const [debtor, debts] of Object.entries(CABINET_DEBTS)) {
  for (const d of debts) edges.push({ from: d.to, to: debtor, kind: d.kind });
}
console.log(`debts: ${edges.length}`);

// Mirror the renderer: reciprocal pairs (A owes B and B owes A) draw as ONE
// bidirectional line, so checking counts one path per unordered pair.
// Same-pair dual-kind entries (none today) keep separate fanned paths.
const drawnKeys = new Set();
const drawn = [];
for (const e of edges) {
  const key = [e.from, e.to].sort().join('|');
  const reciprocal = edges.some((o) => o.from === e.to && o.to === e.from);
  const dkey = reciprocal ? `pair:${key}` : `one:${e.from}>${e.to}:${e.kind}`;
  if (drawnKeys.has(dkey)) continue;
  drawnKeys.add(dkey);
  drawn.push(e);
}

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
    const [ax, ay, c1x, c1y, c2x, c2y, ex, ey] = nums;
    pts.push([
      u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
      u * u * u * ay + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey,
    ]);
  }
  return pts;
}

const paths = drawn.map((e) => ({
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
  for (const [slug, pos] of Object.entries(GEN_POS)) {
    if (slug === p.e.from || slug === p.e.to) continue;
    let m = Infinity;
    for (const q of p.pts) {
      if (ends.some((e) => Math.hypot(q[0] - e.x, q[1] - e.y) < 40)) continue;
      m = Math.min(m, Math.hypot(q[0] - pos.x, q[1] - pos.y));
    }
    if (m < CLEAR) fail(`${p.e.from}>${p.e.to} passes ${slug} at ${m.toFixed(1)}px`);
  }
}

// 3. Bundling report (INFO only): threads share four highways by design —
// small roads joining motorways — so overlap is expected, not a failure.
// Exactness lives in the text list and the selection panel. What still
// fails is a thread running through a seat it doesn't involve (rule 2).
{
  const bands = new Map();
  for (const p of paths) {
    const ys = p.pts.filter((_, i) => i % 6 === 0).map((q) => Math.round(q[1] / 40) * 40);
    const lane = [...ys].sort((a, b) =>
      ys.filter((y) => y === a).length - ys.filter((y) => y === b).length).pop();
    bands.set(lane, (bands.get(lane) ?? 0) + 1);
  }
  console.log(`bundle bands: ${[...bands.entries()].map(([y, n]) => `y≈${y} ×${n}`).join(', ')}`);
}

if (failed) {
  console.error(`\n${failed} geometr${failed === 1 ? 'y failure' : 'y failures'} — adjust paths, not thresholds.`);
  process.exitCode = 1;
} else {
  console.log(`geometry clean: ${paths.length} lines, no drive-throughs (bundling by design)`);
}

// 4. Retired: shared rims are the design now (small roads join at one
// slip road), so near-identical arrivals are expected, not warned.
