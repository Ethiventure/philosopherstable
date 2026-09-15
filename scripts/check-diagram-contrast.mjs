#!/usr/bin/env node
/**
 * Contrast self-check for the fixed-dark genealogy cabinet.
 *   node scripts/check-diagram-contrast.mjs
 *
 * The panel never follows display themes, so every painted pair inside it
 * must pass on the dark ground in every scheme. Run after any palette edit.
 * Exits non-zero on failure. Thresholds: text ≥ 4.5, graphics ≥ 3.0 (WCAG).
 */
const pairs = [
  // [label, foreground, background, kind]
  ['node name', '#ecdfc4', '#221910', 'text'],
  ['node initial on fill', '#ecdfc4', '#2e2318', 'text'],
  ['heading', '#ecdfc4', '#221910', 'text'],
  ['body text (85% on ground)', '#cabfa8', '#221910', 'text'],
  ['muted text (60% on ground)', '#998e7b', '#221910', 'text'],
  ['crimson line', '#d98a8f', '#221910', 'graphics'],
  ['gold line', '#d3ab6b', '#221910', 'graphics'],
  ['teal ring on fill', '#6e7f5c', '#2e2318', 'graphics'],
  ['teal ring on ground', '#6e7f5c', '#221910', 'graphics'],
];

function luminance(hex) {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// NOTE: muted rgba() entries above are pre-blended approximations on #221910.
function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

let failed = 0;
for (const [label, fg, bg, kind] of pairs) {
  const r = ratio(fg, bg);
  const bar = kind === 'text' ? 4.5 : 3.0;
  const ok = r >= bar;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}  (needs ${bar})  ${label}`);
}
if (failed) {
  console.error(`\n${failed} pair(s) below bar — fix the palette, not the test.`);
  process.exitCode = 1;
} else {
  console.log('\nall pairs pass');
}
