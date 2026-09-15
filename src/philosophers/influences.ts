/**
 * In-cabinet influence map: who each seat learned from (debts) and who
 * learned from them (heirs, derived). Displayed in the profile modal's
 * "In this cabinet" tab; `known_influences` in each philosopher file carries
 * the same facts into prompts.
 *
 * direct = read closely and answered (including critically, or by rupture).
 * indirect = arrived through intermediaries or a wider tradition.
 * stance = the debtor's attitude: positive (carries forward), critical
 * (attacks or breaks), ambivalent (mixed or unclear). Grid codes combine
 * both: D+/D-/D and I+/I-/I, N for no evidenced link. N means "cannot
 * currently demonstrate under these rules" — never "unrelated". Chat
 * evidence from the owner outranks both the repo's prior text and any
 * outside model; the notes say whose evidence each link stands on.
 * Only links with evidence are listed. The Bloch→Bookchin link is
 * documentary: Bookchin cites and quotes The Principle of Hope in The
 * Ecology of Freedom (Ch. 12) — alliance technology, co-productivity of
 * nature, the principle of hope named as foundational. Bookchin→Deleuze is
 * a direct critical debt: SALA (1995) explicitly names D&G's
 * "desiring-machines" as the lifestyle mood made flesh. No Bookchin link to
 * Bogdanov is claimed: Bertalanffy's GST cites no Bogdanov, direct
 * Tektology→GST influence is unproven, and no Bookchin reading of
 * Bertalanffy is documented. Deleuze→Bloch is direct but bare: a single
 * Ernst Bloch mention in What Is Philosophy? (p.100) — contact, not debt
 * (full-text checks of Anti-Oedipus and A Thousand Plateaus find zero Ernst
 * Bloch; the two "Bloch" hits there are Jules Bloch the linguist).
 * Deleuze→Lenin is direct and substantive: Anti-Oedipus honours the
 * Leninist break while refusing the father-function, and A Thousand Plateaus
 * studies Lenin's "On Slogans" ("the Leninist wager, an act of audacity").
 * Kant→Spinoza is direct-critical: Kant talks about Spinoza only to refuse
 * him — the adversary named through the Pantheismusstreit (Jacobi,
 * Mendelssohn). Kant creditor to nearly all: direct to Hegel, Marx, Lenin, Weil,
 * Bloch, Bookchin, Deleuze, Bogdanov; no evidenced Fisher link.
 * Hegel→Spinoza is direct-positive ("first be a
 * Spinozist"), Marx→Spinoza is direct-positive (1841 notebooks hand-copying
 * the TTP, democratic blueprint), Deleuze→Spinoza is direct-positive
 * ("Prince of Philosophers", immanence ontology). Weil→Spinoza is direct
 * (Alain curriculum, returned to in the Notebooks), Weil→Hegel is
 * direct-critical (Geist measured against force), Weil→Lenin is
 * direct-critical (engaged Lenin's Materialism and Empiriocriticism in
 * Oppression and Liberty; the party model answered with abolition),
 * Weil→Kant is direct (disinterestedness taken to decreation).
 */
export type DebtStance = 'positive' | 'critical' | 'ambivalent';

export interface CabinetDebt {
  /** Slug of the creditor seat. */
  to: string;
  kind: 'direct' | 'indirect';
  /** + embraces and carries forward, − attacks or breaks, bare is mixed. */
  stance: DebtStance;
  note: string;
}

export const CABINET_DEBTS: Record<string, CabinetDebt[]> = {
  spinoza: [],
  kant: [
    { to: 'spinoza', kind: 'direct', stance: 'critical', note: 'named Spinoza as the adversary — answered Spinozism head-on through the Pantheismusstreit (Jacobi, Mendelssohn)' },
  ],
  hegel: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', note: '"first be a Spinozist": substance taken up as subject' },
    { to: 'kant', kind: 'direct', stance: 'critical', note: 'system built on and past Kant — reason knowing itself' },
  ],
  marx: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', note: 'hand-copied the TTP in youth; democratic blueprint and critique of superstition shaped historical materialism' },
    { to: 'hegel', kind: 'direct', stance: 'ambivalent', note: 'turned the dialectic right-side up, keeping the method: matter first, ideas second' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'read and answered head-on — early notes through to Capital, via Hegel and Feuerbach and past them' },
  ],
  lenin: [
    { to: 'marx', kind: 'direct', stance: 'positive', note: 'developed Marx into a theory of party and revolution' },
    { to: 'hegel', kind: 'direct', stance: 'positive', note: 'read the Logic cover to cover in 1914–15' },
    { to: 'kant', kind: 'direct', stance: 'critical', note: 'took the thing-in-itself apart in Materialism and Empirio-criticism — knowable, not unknowable' },
    { to: 'bogdanov', kind: 'direct', stance: 'critical', note: 'read closely in order to refute — Materialism and Empirio-criticism (1909) is aimed largely at Bogdanov, then expelled him from the Bolsheviks' },
  ],
  bogdanov: [
    { to: 'marx', kind: 'direct', stance: 'positive', note: 'rebuilt Marxism as a science of organisation' },
    { to: 'hegel', kind: 'direct', stance: 'positive', note: 'Hegelian and Marxian dialectics the major precursors of Tektology — internal contradictions carried over' },
    { to: 'lenin', kind: 'direct', stance: 'critical', note: 'comrade, then rupture — expelled from the Bolsheviks in 1909' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'answered head-on through and past the empiriocriticist post-Kantians (Mach, Avenarius)' },
  ],
  weil: [
    { to: 'spinoza', kind: 'direct', stance: 'ambivalent', note: 'studied under Alain and returned to in the Notebooks — necessity consented to, not merely understood; grace parts them' },
    { to: 'hegel', kind: 'direct', stance: 'critical', note: 'measured Hegel’s Geist against force — history has no self-developing spirit' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', note: 'took up class analysis early, blasted Marxist orthodoxy late' },
    { to: 'lenin', kind: 'direct', stance: 'critical', note: 'devoted a piece to Lenin’s Materialism and Empiriocriticism in Oppression and Liberty (26 Lenin hits); answered the party model with abolition' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'took Kant’s disinterestedness to decreation — aesthetics inverted into hunger, dignity into the cry' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', note: 'via Lenin’s M&EC controversy — O&L names Bogdanov as Lenin’s best-known opponent there; no inherited judgment' },
  ],
  bloch: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', note: 'immanent objectivity has Spinoza as one of its origins (SEP; Hindrichs on Bloch’s materialist Spinoza-reading)' },
    { to: 'marx', kind: 'direct', stance: 'positive', note: 'praxis over contemplation, via the Theses on Feuerbach' },
    { to: 'hegel', kind: 'direct', stance: 'ambivalent', note: 'dialectical process kept open against his closed circle' },
    { to: 'kant', kind: 'direct', stance: 'positive', note: 'practical reason and regulative ideas turned into ontology of hope' },
  ],
  bookchin: [
    { to: 'spinoza', kind: 'direct', stance: 'ambivalent', note: 'named in EoF — a single explicit nod, carried by the wider Spinozist tradition (Hegel, Marx, Deleuze)' },
    { to: 'hegel', kind: 'direct', stance: 'positive', note: 'Dialectical Naturalism built by decades of direct reading, quoting, and wrestling with Hegel' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', note: 'kept the critique of capital, refused economism' },
    { to: 'lenin', kind: 'direct', stance: 'critical', note: 'answered the party model with the assembly — Listen, Marxist! takes on What Is to Be Done? directly' },
    { to: 'deleuze', kind: 'direct', stance: 'critical', note: 'named D&G’s “desiring-machines” in SALA (1995) as the lifestyle mood made flesh' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'named Kant across EoF — neo-Kantian dualism refused, the moral imperative kept' },
    { to: 'bloch', kind: 'direct', stance: 'positive', note: 'cited the Principle of Hope in The Ecology of Freedom — alliance technology, co-productivity, hope as foundation' },
  ],
  deleuze: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', note: '"Prince of Philosophers": immanence ontology, power to affect and be affected' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'book-length study claimed as precursor, representation refused: Kant’s Critical Philosophy' },
    { to: 'hegel', kind: 'direct', stance: 'critical', note: 'a generalized anti-Hegelianism (D&R preface): difference against contradiction, via Hyppolite and Kojève' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', note: 'read with Guattari: capital as desiring-production — "remained Marxists" who broke orthodoxy' },
    { to: 'lenin', kind: 'direct', stance: 'ambivalent', note: 'honoured the Leninist break in Anti-Oedipus; studied “On Slogans” in A Thousand Plateaus — then refused the father-function' },
    { to: 'bloch', kind: 'direct', stance: 'ambivalent', note: 'named once in What Is Philosophy? (p.100) — contact established, no major influence' },
  ],
  fisher: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', note: 'used directly in Capitalist Realism — Spinoza offers the best resources for a paternalism without the father' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', note: 'co-authored straight Kant scholarship (Fisher & Watkins 1998, Review of Metaphysics)' },
    { to: 'bloch', kind: 'indirect', stance: 'ambivalent', note: 'thin chain: D&G mention Bloch once in WIP; Fisher read D&G closely' },
    { to: 'deleuze', kind: 'direct', stance: 'positive', note: 'CCRU and k-punk: assemblages, control, the weird' },
    { to: 'marx', kind: 'direct', stance: 'positive', note: 'read through critical theory: commodity, spectacle, realism' },
  ],
};

export interface CabinetHeir {
  /** Slug of the debtor seat. */
  from: string;
  kind: 'direct' | 'indirect';
  stance: DebtStance;
  note: string;
}

/** Heirs are the debts table read backwards — no second source of truth. */
export function cabinetHeirs(slug: string): CabinetHeir[] {
  const out: CabinetHeir[] = [];
  for (const [from, debts] of Object.entries(CABINET_DEBTS)) {
    for (const debt of debts) {
      if (debt.to === slug) out.push({ from, kind: debt.kind, stance: debt.stance, note: debt.note });
    }
  }
  return out;
}

/**
 * The relationship line a turn carries about its immediate predecessor:
 * turns always address PREV, so the speaker meets them with the real history
 * between the seats — honour, rupture, or theft, in the speaker's own terms.
 * Null when the pair has no evidenced link (most pairs): the turn then runs
 * on live argument alone. Low appends a plain-words order since debt notes
 * may carry school-terms.
 */
export function relationshipLine(
  speakerSlug: string,
  prevSlug: string,
  prevName: string,
  low: boolean,
): string | null {
  const plain = low ? ' Render any hard terms here into plain everyday words.' : '';
  const owed = (CABINET_DEBTS[speakerSlug] ?? []).find((d) => d.to === prevSlug);
  if (owed) {
    return `YOUR DEBT — you owe ${prevName} this: ${owed.note}. Let that history colour this meeting: honour it, rupture it, or steal from it, in your own terms.${plain}`;
  }
  const owing = (CABINET_DEBTS[prevSlug] ?? []).find((d) => d.to === speakerSlug);
  if (owing) {
    return `${prevName} OWES YOU this: ${owing.note}. They come to you already shaped by it — answer them in light of that, in your own terms.${plain}`;
  }
  return null;
}

/** One attitude phrase per debt — how the debtor stands toward the creditor. */
function attitude(debt: CabinetDebt): string {
  if (debt.kind === 'indirect') return 'reached you through others';
  if (debt.stance === 'positive') return 'you carry forward';
  if (debt.stance === 'critical') return 'you broke with';
  return 'you wrestle with';
}

/**
 * Table stances: how the speaker stands toward every OTHER sitting seat
 * (PREV excluded — the relationship line above covers them in full). One
 * compressed line, names plus attitude phrases, never the full notes: the
 * room's old honours and ruptures ride along at ~40 tokens so turns meet
 * non-adjacent seats with real history instead of blank politeness. Null
 * when no sitting seat (besides PREV) holds a link either way.
 */
export function tableStancesLine(
  speakerSlug: string,
  sitting: { slug: string; name: string }[],
  prevSlug: string | null,
  low: boolean,
): string | null {
  const others = sitting.filter((s) => s.slug !== speakerSlug && s.slug !== prevSlug);
  if (others.length === 0) return null;
  const owed: string[] = [];
  const owing: string[] = [];
  for (const other of others) {
    const debt = (CABINET_DEBTS[speakerSlug] ?? []).find((d) => d.to === other.slug);
    if (debt) {
      owed.push(`${other.name} (${attitude(debt)})`);
      continue;
    }
    const held = (CABINET_DEBTS[other.slug] ?? []).find((d) => d.to === speakerSlug);
    if (held) owing.push(`${other.name} (${held.stance === 'positive' ? 'carries you forward' : held.stance === 'critical' ? 'broke with you' : 'wrestles with you'})`);
  }
  if (owed.length === 0 && owing.length === 0) return null;
  const bits: string[] = [];
  if (owed.length > 0) bits.push(`you owe ${owed.join(', ')}`);
  if (owing.length > 0) bits.push(`${owing.join(', ')} owe you`);
  const plain = low ? ' Render any hard terms here into plain everyday words.' : '';
  return `TABLE DEBTS — among the sitting: ${bits.join('; ')}. Let old honours and ruptures colour how you meet them — in your own terms, never listed back, never announced.${plain}`;
}
