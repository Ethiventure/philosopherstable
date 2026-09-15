/**
 * In-cabinet influence map: who each seat learned from (debts) and who
 * learned from them (heirs, derived). Displayed in the profile modal's
 * "In this cabinet" tab; `known_influences` in each philosopher file carries
 * the same facts into prompts.
 *
 * direct = read closely and answered (including critically, or by rupture).
 * indirect = arrived through intermediaries or a wider tradition.
 * Only links with evidence are listed. The Bloch→Bookchin link is
 * documentary: Bookchin cites and quotes The Principle of Hope in The
 * Ecology of Freedom (Ch. 12) — alliance technology, co-productivity of
 * nature, the principle of hope named as foundational. Bookchin→Deleuze is
 * a direct critical debt: SALA (1995) explicitly names D&G's
 * "desiring-machines" as the lifestyle mood made flesh. No Bookchin link to
 * Bogdanov is claimed: Bertalanffy's GST cites no Bogdanov, direct
 * Tektology→GST influence is unproven, and no Bookchin reading of
 * Bertalanffy is documented. No Deleuze link to Bloch is claimed either:
 * full-text checks of Anti-Oedipus and A Thousand Plateaus find zero Ernst
 * Bloch (the two "Bloch" hits are Jules Bloch the linguist).
 * Deleuze→Lenin is direct and substantive: Anti-Oedipus honours the
 * Leninist break while refusing the father-function, and A Thousand Plateaus
 * studies Lenin's "On Slogans" ("the Leninist wager, an act of audacity").
 * Kant→Spinoza is indirect: Kant answered Spinozism through the
 * Pantheismusstreit intermediaries (Jacobi, Mendelssohn), not by close
 * reading of the Ethics. Hegel→Spinoza is direct-positive ("first be a
 * Spinozist"), Marx→Spinoza is direct-positive (1841 notebooks hand-copying
 * the TTP, democratic blueprint), Deleuze→Spinoza is direct-positive
 * ("Prince of Philosophers", immanence ontology). Weil→Spinoza is direct
 * (Alain curriculum, returned to in the Notebooks), Weil→Hegel is
 * direct-critical (Geist measured against force), Weil→Lenin is
 * direct-critical (engaged Lenin's Materialism and Empiriocriticism in
 * Oppression and Liberty; the party model answered with abolition).
 */
export interface CabinetDebt {
  /** Slug of the creditor seat. */
  to: string;
  kind: 'direct' | 'indirect';
  note: string;
}

export const CABINET_DEBTS: Record<string, CabinetDebt[]> = {
  spinoza: [],
  kant: [
    { to: 'spinoza', kind: 'indirect', note: 'answered Spinozism through the Pantheismusstreit intermediaries — Jacobi and Mendelssohn, not the Ethics itself' },
  ],
  hegel: [
    { to: 'spinoza', kind: 'direct', note: '"first be a Spinozist": substance taken up as subject' },
    { to: 'kant', kind: 'direct', note: 'system built on and past Kant — reason knowing itself' },
  ],
  marx: [
    { to: 'spinoza', kind: 'direct', note: 'hand-copied the TTP in youth; democratic blueprint and critique of superstition shaped historical materialism' },
    { to: 'hegel', kind: 'direct', note: 'turned the dialectic right-side up: matter first, ideas second' },
  ],
  lenin: [
    { to: 'marx', kind: 'direct', note: 'developed Marx into a theory of party and revolution' },
    { to: 'hegel', kind: 'direct', note: 'read the Logic cover to cover in 1914–15' },
  ],
  bogdanov: [
    { to: 'marx', kind: 'direct', note: 'rebuilt Marxism as a science of organisation' },
    { to: 'lenin', kind: 'direct', note: 'comrade, then rupture — expelled from the Bolsheviks in 1909' },
  ],
  weil: [
    { to: 'spinoza', kind: 'direct', note: 'studied under Alain and returned to in the Notebooks — necessity consented to, not merely understood' },
    { to: 'hegel', kind: 'direct', note: 'measured Hegel’s Geist against force — history has no self-developing spirit' },
    { to: 'marx', kind: 'direct', note: 'measured Marx against affliction — labour without grace is still force' },
    { to: 'lenin', kind: 'direct', note: 'read Lenin’s Materialism and Empiriocriticism; answered the party model with abolition' },
    { to: 'kant', kind: 'indirect', note: 'through the philosophical curriculum and notebooks' },
  ],
  bloch: [
    { to: 'marx', kind: 'direct', note: 'praxis over contemplation, via the Theses on Feuerbach' },
    { to: 'hegel', kind: 'direct', note: 'dialectical process kept open against his closed circle' },
    { to: 'kant', kind: 'direct', note: 'practical reason and regulative ideas turned into ontology of hope' },
  ],
  bookchin: [
    { to: 'hegel', kind: 'indirect', note: 'dialectic inherited through the Marxist tradition' },
    { to: 'marx', kind: 'direct', note: 'kept the critique of capital, refused economism' },
    { to: 'lenin', kind: 'direct', note: 'answered the party model with the assembly — Listen, Marxist! takes on What Is to Be Done? directly' },
    { to: 'deleuze', kind: 'direct', note: 'named D&G’s “desiring-machines” in SALA (1995) as the lifestyle mood made flesh' },
    { to: 'kant', kind: 'indirect', note: 'Enlightenment reason kept, metaphysics dropped' },
    { to: 'bloch', kind: 'direct', note: 'cited the Principle of Hope in The Ecology of Freedom — alliance technology, co-productivity, hope as foundation' },
  ],
  deleuze: [
    { to: 'spinoza', kind: 'direct', note: '"Prince of Philosophers": immanence ontology, power to affect and be affected' },
    { to: 'kant', kind: 'direct', note: 'a whole book: Kant’s Critical Philosophy' },
    { to: 'hegel', kind: 'direct', note: 'a generalized anti-Hegelianism (D&R preface): difference against contradiction, via Hyppolite and Kojève' },
    { to: 'marx', kind: 'direct', note: 'read with Guattari: capital as desiring-production' },
    { to: 'lenin', kind: 'direct', note: 'honoured the Leninist break in Anti-Oedipus; studied “On Slogans” in A Thousand Plateaus — then refused the father-function' },
  ],
  fisher: [
    { to: 'deleuze', kind: 'direct', note: 'CCRU and k-punk: assemblages, control, the weird' },
    { to: 'marx', kind: 'direct', note: 'read through critical theory: commodity, spectacle, realism' },
  ],
};

export interface CabinetHeir {
  /** Slug of the debtor seat. */
  from: string;
  kind: 'direct' | 'indirect';
  note: string;
}

/** Heirs are the debts table read backwards — no second source of truth. */
export function cabinetHeirs(slug: string): CabinetHeir[] {
  const out: CabinetHeir[] = [];
  for (const [from, debts] of Object.entries(CABINET_DEBTS)) {
    for (const debt of debts) {
      if (debt.to === slug) out.push({ from, kind: debt.kind, note: debt.note });
    }
  }
  return out;
}
