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
 * nature, the principle of hope named as foundational. No Bookchin link to
 * Deleuze or Fisher is claimed: the two ecologies run parallel (Guattari's
 * Three Ecologies is the D&G-side text).
 */
export interface CabinetDebt {
  /** Slug of the creditor seat. */
  to: string;
  kind: 'direct' | 'indirect';
  note: string;
}

export const CABINET_DEBTS: Record<string, CabinetDebt[]> = {
  spinoza: [],
  kant: [],
  hegel: [
    { to: 'spinoza', kind: 'direct', note: 'answered Spinoza on substance — the absolute as subject, not substance alone' },
    { to: 'kant', kind: 'direct', note: 'system built on and past Kant — reason knowing itself' },
  ],
  marx: [
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
    { to: 'marx', kind: 'direct', note: 'measured Marx against affliction — labour without grace is still force' },
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
    { to: 'lenin', kind: 'direct', note: 'answered the party model with the assembly' },
    { to: 'kant', kind: 'indirect', note: 'Enlightenment reason kept, metaphysics dropped' },
    { to: 'bloch', kind: 'direct', note: 'cited the Principle of Hope in The Ecology of Freedom — alliance technology, co-productivity, hope as foundation' },
  ],
  deleuze: [
    { to: 'spinoza', kind: 'direct', note: 'a whole book: Expressionism in Philosophy' },
    { to: 'kant', kind: 'direct', note: 'a whole book: Kant’s Critical Philosophy' },
    { to: 'hegel', kind: 'direct', note: 'read against, via Hyppolite and Kojève' },
    { to: 'marx', kind: 'direct', note: 'read with Guattari: capital as desiring-production' },
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
