#!/usr/bin/env node
// Per-thinker reading level from the room transcript (owner request Oct 21 2026).
// Flesch-Kincaid grade + Flesch reading ease over the last N turns per seat.
// Structural measure only: sentence length + syllable load — it rewards
// short-sentence styles (Deleuze) and punishes long periods (Marx); it is
// not a vocabulary test. Zero model calls, no writes. Re-run after the
// voice A/B lands to measure the shift.
//
//   node scripts/room-readability.mjs [n]   (n = turns per seat, default 3)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const n = Number(process.argv[2]) || 3;
const root = join(fileURLToPath(import.meta.url), '..', '..');
const transcript = JSON.parse(readFileSync(join(root, 'public', 'room', 'transcript.json'), 'utf8'));

const syl = (wordRaw) => {
  const word = wordRaw.toLowerCase().replaceAll(/(.)\1/g, '$1');
  if (!/[aeiouy]/.test(word)) return word.length > 1 ? 1 : 0;
  let groups = word.match(/[aeiouy]+/g).length;
  if (word.endsWith('e') && groups > 1) groups -= 1;
  return Math.max(1, groups);
};
const sentences = (text) => text.split(/(?<=[.!?])["')\]]*\s+/).filter((x) => /\S/.test(x));

const rows = [];
for (const seat of [...new Set(transcript.turns.map((x) => x.seat))]) {
  const turns = transcript.turns.filter((x) => x.seat === seat).slice(-n);
  if (turns.length < 2) continue;
  let words = 0, sents = 0, syll = 0;
  for (const turn of turns) {
    const ws = turn.text.split(/\s+/).filter(Boolean);
    const ss = sentences(turn.text);
    words += ws.length; sents += Math.max(1, ss.length);
    syll += ws.reduce((a, x) => a + syl(x), 0);
  }
  const aw = words / turns.length, as = sents / turns.length;
  const grade = 0.39 * aw / as + 11.8 * (syll / words) - 15.59;
  const ease = 206.835 - 1.015 * aw / as - 84.6 * (syll / words);
  const ielts = grade <= 7 ? '~6' : grade <= 10 ? '~6.5-7' : grade <= 13 ? '~7.5-8' : '~8+';
  const longw = turns.reduce((a, t) => a + t.text.split(/\s+/).filter(Boolean).filter((x) => syl(x) >= 3).length, 0) / words;
  rows.push({ seat, n: turns.length, grade: +grade.toFixed(1), ease: +ease.toFixed(0), ielts, aw: +aw.toFixed(0), wps: +aw / as, longw: +longw.toFixed(2) });
}
rows.sort((a, b) => b.grade - a.grade);
console.log(`per-thinker reading level, last ${n} room turns each (${transcript.turns[transcript.turns.length - 1].ts.slice(0, 10)} file):`);
console.log('seat        n  FK-grade  read-ease  ~IELTS  words/sent  3+-syl ratio  avg words');
for (const r of rows) console.log(r.seat.padEnd(10), String(r.n).padStart(2), String(r.grade).padStart(8), String(r.ease).padStart(9), r.ielts.padStart(9), '   ' + r.wps.toFixed(1).padStart(8), r.longw.toFixed(2).padStart(10), String(r.aw).padStart(9));
const mean = rows.reduce((a, r) => a + r.grade, 0) / rows.length;
console.log('', `room mean FK grade: ${mean.toFixed(1)}`);
