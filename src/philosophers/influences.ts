/**
 * In-cabinet influence map: who each seat learned from (debts) and who
 * learned from them (heirs, derived). Displayed in the profile modal's
 * "In this cabinet" tab; `known_influences` in each philosopher file carries
 * the same facts into prompts.
 *
 * direct = route of debt: debtor directly engaged creditor's thought
 * (read, quoted, criticised, answered — ruptures count). indirect = route via
 * one or more identifiable intermediaries (hops, may sit outside cabinet).
 * D/I is ROUTE ONLY — never strength, importance, agreement, fame, or
 * evidential certainty. stance = character (positive/critical/ambivalent).
 * confidence = how securely evidence establishes the route (high/medium/low).
 * Owner's evidence outranks repo text and outside models; confidence
 * records how securely each route is evidenced. Surface notes state the
 * claim plainly — no hedging. (Full-text check log 2026-09-16: no Ashby
 * in ATP/AO, one Bertalanffy name-drop and 0 Ashby/Bogdanov in EoF,
 * 0 Wark in k-punk; kept here as the do-not-re-hunt list, never shown.)
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
  /** Route certainty: high/medium/low — independent of kind and stance. */
  confidence: 'high' | 'medium' | 'low';
  /** Intermediary route for indirect debts (may sit outside cabinet). */
  hops?: string[];
  note: string;
}

export const CABINET_DEBTS: Record<string, CabinetDebt[]> = {
  spinoza: [],
  kant: [
    { to: 'spinoza', kind: 'direct', stance: 'critical', confidence: 'high', note: 'named Spinoza as the adversary — answered Spinozism head-on through the Pantheismusstreit (Jacobi, Mendelssohn)' },
  ],
  hegel: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: '"first be a Spinozist": substance taken up as subject' },
    { to: 'kant', kind: 'direct', stance: 'critical', confidence: 'high', note: 'system built on and past Kant — reason knowing itself' },
  ],
  marx: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: 'hand-copied the TTP in youth; democratic blueprint and critique of superstition shaped historical materialism' },
    { to: 'hegel', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'turned the dialectic right-side up, keeping the method: matter first, ideas second' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'read and answered head-on — early notes through to Capital, via Hegel and Feuerbach and past them' },
  ],
  lenin: [
    { to: 'marx', kind: 'direct', stance: 'positive', confidence: 'high', note: 'developed Marx into a theory of party and revolution' },
    { to: 'hegel', kind: 'direct', stance: 'positive', confidence: 'high', note: 'read the Logic cover to cover in 1914–15' },
    { to: 'kant', kind: 'direct', stance: 'critical', confidence: 'high', note: 'took the thing-in-itself apart in Materialism and Empirio-criticism — knowable, not unknowable' },
    { to: 'bogdanov', kind: 'direct', stance: 'critical', confidence: 'high', note: 'read closely in order to refute — Materialism and Empirio-criticism (1909) is aimed largely at Bogdanov, then expelled him from the Bolsheviks' },
  ],
  bogdanov: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: 'Tektology reads Spinoza organizationally: monistic structure of great strength and plasticity, unassimilated only for want of a favourable ideological environment — Descartes founded a school, Spinoza deserved one' },
    { to: 'marx', kind: 'direct', stance: 'positive', confidence: 'high', note: 'rebuilt Marxism as a science of organisation' },
    { to: 'hegel', kind: 'direct', stance: 'positive', confidence: 'medium', note: 'Hegelian and Marxian dialectics the major precursors of Tektology — internal contradictions carried over' },
    { to: 'lenin', kind: 'direct', stance: 'critical', confidence: 'high', note: 'comrade, then rupture — expelled from the Bolsheviks in 1909' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'medium', note: 'answered head-on through and past the empiriocriticist post-Kantians (Mach, Avenarius)' },
  ],
  weil: [
    { to: 'spinoza', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'studied under Alain and returned to in the Notebooks — necessity consented to, not merely understood; grace parts them' },
    { to: 'hegel', kind: 'direct', stance: 'critical', confidence: 'high', note: 'measured Hegel’s Geist against force — history has no self-developing spirit' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'took up class analysis early, blasted Marxist orthodoxy late' },
    { to: 'lenin', kind: 'direct', stance: 'critical', confidence: 'high', note: 'devoted a piece to Lenin’s Materialism and Empiriocriticism in Oppression and Liberty (26 Lenin hits); answered the party model with abolition' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'took Kant’s disinterestedness to decreation — aesthetics inverted into hunger, dignity into the cry' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', confidence: 'medium', hops: ['lenin'], note: 'via Lenin’s M&EC controversy — O&L names Bogdanov as Lenin’s best-known opponent there; no inherited judgment' },
  ],
  bloch: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: 'immanent objectivity has Spinoza as one of its origins (SEP; Hindrichs on Bloch’s materialist Spinoza-reading)' },
    { to: 'marx', kind: 'direct', stance: 'positive', confidence: 'high', note: 'praxis over contemplation, via the Theses on Feuerbach' },
    { to: 'hegel', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'dialectical process kept open against his closed circle' },
    { to: 'kant', kind: 'direct', stance: 'positive', confidence: 'high', note: 'practical reason and regulative ideas turned into ontology of hope' },
    { to: 'lenin', kind: 'direct', stance: 'positive', confidence: 'high', note: 'opens Principle of Hope Vol.1 quoting Lenin’s What Is To Be Done? defence of dreaming ("We should dream!") — forward dreaming (Vorausträumen) as materialist praxis' },
  ],
  bookchin: [
    { to: 'spinoza', kind: 'direct', stance: 'ambivalent', confidence: 'medium', note: 'named in EoF — a single explicit nod, carried by the wider Spinozist tradition (Hegel, Marx, Deleuze)' },
    { to: 'hegel', kind: 'direct', stance: 'positive', confidence: 'high', note: 'Dialectical Naturalism built by decades of direct reading, quoting, and wrestling with Hegel' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'kept the critique of capital, refused economism' },
    { to: 'lenin', kind: 'direct', stance: 'critical', confidence: 'high', note: 'answered the party model with the assembly — Listen, Marxist! takes on What Is to Be Done? directly' },
    { to: 'deleuze', kind: 'direct', stance: 'critical', confidence: 'high', note: 'named D&G’s “desiring-machines” in SALA (1995) as the lifestyle mood made flesh' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'named Kant across EoF — neo-Kantian dualism refused, the moral imperative kept' },
    { to: 'bloch', kind: 'direct', stance: 'positive', confidence: 'high', note: 'cited across the work, crowned in The Ecology of Freedom — "the principle of hope," as Ernst Bloch called it, "is part of everything I value" — plus the Ch. 12 alliance-technology and co-productivity borrowing, and closers invoking Bloch in The Left That Was, Social Anarchism or Lifestyle Anarchism, Whither Anarchism?, and The Murray Bookchin Reader against postmodernism' },
    { to: 'rose', kind: 'direct', stance: 'positive', confidence: 'high', note: 'quotes The Melancholy Science in Finding the Subject to strike at Habermas — Rose on Adorno used as a philosophical weapon' },
    { to: 'weil', kind: 'indirect', stance: 'positive', confidence: 'low', hops: ['macdonald'], note: 'via Macdonald, first American publisher of Weil (Politics Nov 1945, the Iliad via McCarthy); Bookchin read Politics in their shared post-Trotskyist milieu and carried her affliction-and-attention line into social ecology' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', confidence: 'low', hops: ['bertalanffy', 'ashby'], note: 'via Bertalanffy/Ashby: Bookchin builds the non-hierarchical self-organising model citing mid-century systems theory and cybernetics, and Bertalanffy acknowledged Bogdanov anticipated open systems, homeostasis and structural organisational laws decades before GST.' },
  ],
  deleuze: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: '"Prince of Philosophers": immanence ontology, power to affect and be affected' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'book-length study claimed as precursor, representation refused: Kant’s Critical Philosophy' },
    { to: 'hegel', kind: 'direct', stance: 'critical', confidence: 'high', note: 'a generalized anti-Hegelianism (D&R preface): difference against contradiction, via Hyppolite and Kojève' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'read with Guattari: capital as desiring-production — "remained Marxists" who broke orthodoxy' },
    { to: 'lenin', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'honoured the Leninist break in Anti-Oedipus; studied “On Slogans” in A Thousand Plateaus — then refused the father-function' },
    { to: 'bloch', kind: 'direct', stance: 'ambivalent', confidence: 'medium', note: 'named once in What Is Philosophy? (p.100) — contact established, no major influence' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', confidence: 'low', hops: ['ashby'], note: 'via Ashby: D&G work the early-cybernetics problem (homeostatic machines, self-organising systems, GST), and Ashby read and cited Bogdanov on organisational stability and regulation — the debt arrives through Ashby\'s systems language.' },
  ],
  fisher: [
    { to: 'spinoza', kind: 'direct', stance: 'positive', confidence: 'high', note: 'used directly in Capitalist Realism — Spinoza offers the best resources for a paternalism without the father' },
    { to: 'kant', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'co-authored straight Kant scholarship (Fisher & Watkins 1998, Review of Metaphysics)' },
    { to: 'bloch', kind: 'indirect', stance: 'ambivalent', confidence: 'medium', hops: ['jameson'], note: 'Jameson read/introduced Bloch (Marxism and Form 1971 Bloch chapter); Fisher built Capitalist Realism on Jameson on closure of horizons — never cited Bloch directly' },
    { to: 'deleuze', kind: 'direct', stance: 'positive', confidence: 'high', note: 'CCRU and k-punk: assemblages, control, the weird' },
    { to: 'marx', kind: 'direct', stance: 'positive', confidence: 'high', note: 'read through critical theory: commodity, spectacle, realism' },
    { to: 'bookchin', kind: 'indirect', stance: 'ambivalent', confidence: 'low', hops: ['marcuse'], note: 'via Marcuse, who read Bookchin (Post-Scarcity Anarchism, public debates); Fisher read Marcuse (Eros/Civilization, One-Dimensional Man into Acid Communism) — Fisher never cited Bookchin directly' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', confidence: 'low', hops: ['wark'], note: 'via Wark: Fisher moved in the circle around Wark, whose Molecular Red (2015) devotes its first half to reclaiming Tektology and Proletkult — Fisher promoted and discussed the Promethean socio-technical tradition Wark retrieved.' },
    { to: 'rose', kind: 'indirect', stance: 'positive', confidence: 'medium', hops: ['zizek'], note: 'via Žižek, who read Rose; Fisher read Žižek — political melancholy carried into hauntology; Rose and Fisher never cited each other directly' },
  ],
  rose: [
    { to: 'spinoza', kind: 'indirect', stance: 'positive', confidence: 'medium', hops: ['hegel', 'deleuze'], note: 'named across the early books, carried by the wider Spinozist tradition rather than answered head-on' },
    { to: 'kant', kind: 'direct', stance: 'critical', confidence: 'high', note: 'antinomies exposed as rooted in bourgeois social relations — read closely in order to refuse' },
    { to: 'hegel', kind: 'direct', stance: 'positive', confidence: 'high', note: 'speculative logic rehabilitated as the method: Hegel Contra Sociology is the foundation' },
    { to: 'marx', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'commodity fetishism and reification taken up directly; scientistic Marxism refused' },
    { to: 'lenin', kind: 'direct', stance: 'critical', confidence: 'medium', note: 'the Marxist Modernism lectures engage Lenin on vanguard organisation as social-democratic domination, with Lukács carrying the Lenin–Bogdanov controversy alongside' },
    { to: 'bogdanov', kind: 'indirect', stance: 'ambivalent', confidence: 'medium', hops: ['lukacs', 'lenin'], note: 'answered the Lenin–Bogdanov split through Lukács — Lukács’s resolution charged with swapping social reality for style' },
    { to: 'weil', kind: 'direct', stance: 'ambivalent', confidence: 'high', note: 'Angry Angels essay: attention, affliction and dispossession taken up comparatively, never devotionally' },
    { to: 'deleuze', kind: 'direct', stance: 'critical', confidence: 'high', note: 'The New Bergsonism chapter answers the refusal of dialectic head-on' },
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
  // Heat follows evidence: a medium-confidence debt is acknowledged in one
  // clause, never declaimed; a low one is a faint trace. Only high-confidence
  // debts get the full face-to-face treatment (owner eval: Bookchin played a
  // medium indirect debt to Weil too strongly).
  const strengthOrder =
    ' Evidence strength sets the volume — HIGH: full face-to-face heat. MEDIUM: one plain clause of acknowledgment, then move on. LOW: a faint trace, almost nothing.';
  const owed = (CABINET_DEBTS[speakerSlug] ?? []).find((d) => d.to === prevSlug);
  if (owed) {
    const heat =
      owed.stance === 'critical'
        ? `You have broken with ${prevName} — say so to their face, in your own terms, and say what of theirs you still use.`
        : owed.stance === 'positive'
          ? `You learned this move from ${prevName} — name what you took, then show where you break away from them.`
          : `You owe ${prevName} and you fight them too — hold both in the open.`;
    return `YOUR HISTORY WITH ${prevName} (confidence ${owed.confidence}) — you owe them this: ${owed.note}. ${heat}${strengthOrder}${plain}`;
  }
  const owing = (CABINET_DEBTS[prevSlug] ?? []).find((d) => d.to === speakerSlug);
  if (owing) {
    const heat =
      owing.stance === 'critical'
        ? `They came at you — answer them as someone who has heard the attack before.`
        : owing.stance === 'positive'
          ? `They carry your work forward — greet that, then test what they did with it.`
          : `They took from you and twisted it — name the twist.`;
    return `${prevName} OWES YOU this (confidence ${owing.confidence}): ${owing.note}. ${heat}${strengthOrder}${plain}`;
  }
  return null;
}

/**
 * Your people: how the speaker stands toward every OTHER sitting seat
 * (PREV excluded — the relationship line above covers them in full). Names
 * only, grouped by feeling — fans, critics, rated, done-with, tangled — and
 * only seats actually sitting, never the whole cabinet. One line, ~40 tokens:
 * the room's old honours and ruptures ride along so turns meet non-adjacent
 * seats with real history instead of blank politeness. Null when no sitting
 * seat (besides PREV) holds a link either way.
 */
export function tableStancesLine(
  speakerSlug: string,
  sitting: { slug: string; name: string }[],
  prevSlug: string | null,
  low: boolean,
): string | null {
  const others = sitting.filter((s) => s.slug !== speakerSlug && s.slug !== prevSlug);
  if (others.length === 0) return null;
  const fans: string[] = [];
  const critics: string[] = [];
  const rated: string[] = [];
  const doneWith: string[] = [];
  const tangled: string[] = [];
  for (const other of others) {
    const debt = (CABINET_DEBTS[speakerSlug] ?? []).find((d) => d.to === other.slug);
    if (debt) {
      // Medium/low debts ride along marked, so the speaker plays them quietly.
      const soft = debt.confidence === 'high' ? other.name : `${other.name} (lightly held)`;
      (debt.stance === 'positive' ? rated : debt.stance === 'critical' ? doneWith : tangled).push(soft);
      continue;
    }
    const held = (CABINET_DEBTS[other.slug] ?? []).find((d) => d.to === speakerSlug);
    if (held) {
      const soft = held.confidence === 'high' ? other.name : `${other.name} (lightly held)`;
      (held.stance === 'positive' ? fans : held.stance === 'critical' ? critics : tangled).push(soft);
    }
  }
  const bits: string[] = [];
  if (fans.length > 0) bits.push(`allies in the room: ${fans.join(', ')} — back them when they are attacked`);
  if (critics.length > 0) bits.push(`enemies in the room: ${critics.join(', ')} — go at them, don't be polite about it`);
  if (rated.length > 0) bits.push(`you champion: ${rated.join(', ')}`);
  if (doneWith.length > 0) bits.push(`you have written off: ${doneWith.join(', ')} — say so if they speak`);
  if (tangled.length > 0) bits.push(`unfinished business: ${tangled.join(', ')}`);
  if (bits.length === 0) return null;
  const plain = low ? ' Render any hard terms here into plain everyday words.' : '';
  return `YOUR PEOPLE — the room is not neutral, and neither are you: ${bits.join('; ')}. Let it show in your own voice — never list it back, never announce it.${plain}`;
}
