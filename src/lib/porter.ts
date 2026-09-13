/**
 * Porter stemmer (public-domain algorithm, compact implementation).
 * Erasable-syntax TS: node imports this directly for eval/tests.
 * Why: philosophical vocabularies inflect constantly (ecology/ecological,
 * commune/communalism/communalist, dominate/domination) and lexical retrieval
 * must connect the variants. Applied consistently to queries AND documents.
 */

function isConsonant(w: string, i: number): boolean {
  const c = w[i];
  if ('aeiou'.includes(c)) return false;
  if (c === 'y') return i === 0 ? true : !isConsonant(w, i - 1);
  return true;
}

function measure(w: string): number {
  let m = 0;
  let i = 0;
  const n = w.length;
  while (i < n) {
    while (i < n && isConsonant(w, i)) i++;
    if (i >= n) break;
    i++;
    m++;
    while (i < n && !isConsonant(w, i)) i++;
  }
  return m;
}

function hasVowel(w: string): boolean {
  for (let i = 0; i < w.length; i++) if (!isConsonant(w, i)) return true;
  return false;
}

function endsDouble(w: string): boolean {
  if (w.length < 2) return false;
  return w[w.length - 1] === w[w.length - 2] && isConsonant(w, w.length - 1);
}

function endsCvc(w: string): boolean {
  if (w.length < 3) return false;
  const c = w[w.length - 1];
  return isConsonant(w, w.length - 3) && !isConsonant(w, w.length - 2) && isConsonant(w, w.length - 1) && !'wxy'.includes(c);
}

function step1(w: string): string {
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ies')) return w.slice(0, -2);
  if (w.endsWith('ss')) return w;
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

function step1b(w: string): string {
  if (w.endsWith('eed')) {
    return measure(w.slice(0, -3)) > 0 ? w.slice(0, -1) : w;
  }
  let cut: string | null = null;
  if (w.endsWith('ed') && hasVowel(w.slice(0, -2))) cut = w.slice(0, -2);
  else if (w.endsWith('ing') && hasVowel(w.slice(0, -3))) cut = w.slice(0, -3);
  if (cut === null) return w;
  w = cut;
  if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) return w + 'e';
  if (endsDouble(w) && !'lsz'.includes(w[w.length - 1])) return w.slice(0, -1);
  if (measure(w) === 1 && endsCvc(w)) return w + 'e';
  return w;
}

function step1c(w: string): string {
  return w.endsWith('y') && hasVowel(w.slice(0, -1)) ? w.slice(0, -1) + 'i' : w;
}

const STEP2: [string, string][] = [
  ['ational', 'ate'], ['tional', 'tion'], ['enci', 'ence'], ['anci', 'ance'],
  ['izer', 'ize'], ['bli', 'ble'], ['alli', 'al'], ['entli', 'ent'], ['eli', 'e'],
  ['ousli', 'ous'], ['ization', 'ize'], ['ation', 'ate'], ['ator', 'ate'],
  ['alism', 'al'], ['alisti', 'al'], ['alist', 'al'], ['iveness', 'ive'], ['fulness', 'ful'], ['ousness', 'ous'],
  ['aliti', 'al'], ['iviti', 'ive'], ['biliti', 'ble'],
];

const STEP3: [string, string][] = [
  ['icate', 'ic'], ['ative', ''], ['alize', 'al'], ['iciti', 'ic'],
  ['ical', 'ic'], ['ful', ''], ['ness', ''],
];

const STEP4 = ['al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement', 'ment', 'ent', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize'];

function step234(w: string): string {
  for (const [suf, rep] of STEP2) {
    if (w.endsWith(suf) && measure(w.slice(0, -suf.length)) > 0) { w = w.slice(0, -suf.length) + rep; break; }
  }
  for (const [suf, rep] of STEP3) {
    if (w.endsWith(suf) && measure(w.slice(0, -suf.length)) > 0) { w = w.slice(0, -suf.length) + rep; break; }
  }
  for (const suf of STEP4) {
    if (!w.endsWith(suf)) continue;
    const stem = w.slice(0, -suf.length);
    if (suf === 'ion') {
      if (measure(stem) > 1 && (stem.endsWith('s') || stem.endsWith('t'))) return stem;
      continue;
    }
    if (measure(stem) > 1) return stem;
  }
  // Documented addition: ideological -isms/-ists (anarchist, communist,
  // socialist, capitalist, statist). Guarded so exist/wrist/prism survive:
  // surviving stem must be 4+ chars, not end in x, and measure above zero.
  if (w.endsWith('ism')) {
    const stem = w.slice(0, -3);
    if (stem.length >= 4 && measure(stem) > 0) return stem;
  }
  if (w.endsWith('ist')) {
    const stem = w.slice(0, -3);
    if (stem.length >= 4 && !stem.endsWith('x') && measure(stem) > 0) return stem;
  }
  return w;
}

function step5(w: string): string {
  let stem = w.endsWith('e') ? w.slice(0, -1) : w;
  const m = measure(stem);
  if (!(m > 1 || (m === 1 && !endsCvc(stem)))) stem = w;
  if (w.endsWith('ll') && measure(w) > 1) return stem.slice(0, -1);
  return stem;
}

export function stem(word: string): string {
  if (word.length < 3) return word;
  // Documented deviation for Greek-derived vocabulary: without it, ecology
  // and ecological (likewise commune/communalism/communalist) never meet.
  let w = word;
  if (w.endsWith('ology')) w = w.slice(0, -5) + 'olog';
  else if (w.endsWith('logical')) w = w.slice(0, -7) + 'logic';
  w = step1(w);
  w = step1b(w);
  w = step1c(w);
  w = step234(w);
  w = step5(w);
  return w;
}
