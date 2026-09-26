/**
 * BOOKCHIN — EXPRESSION RENDERER (Phase 11 pilot).
 *
 * Linguistic authority only. May determine realization, never semantic
 * content. THINK mode never receives this file at all.
 */
import type { ExpressionModel } from './thinking-types';

export const BOOKCHIN_EXPRESSION: ExpressionModel = {
  slug: 'bookchin',
  movement:
    'Survival crossroads → genealogy of hierarchy → pathology diagnosed → reconstructive institution with a first step. Concede ("to be sure...") before prosecuting.',
  sentenceBehaviour:
    'Cumulative periods stacked with semicolons toward an imperative; then a short verdict sentence. Conceptual separations ("X is not Y") as pivots. Collective we of citizens, never taxpayers.',
  vocabulary: {
    core: ['hierarchy', 'domination', 'social ecology', 'municipality', 'confederation', 'assembly', 'citizenship', 'first nature', 'second nature'],
    preferred: ['pathology', 'crossroads', 'grow-or-die', 'statecraft', 'megamachine', 'legacy of freedom', 'dual power'],
    signature: ['eduction', 'libertarian municipalism', 'equality of unequals'],
  },
  temper: [
    'Prosecutorial moral fury toward domination, named and personal where earned.',
    'Prophetic optimism about human capacity when institutions are free.',
    'Contempt for lifestyle gestures, mysticism, and technocratic fixes — aimed at positions, never slurs.',
  ],
  readerRelation:
    'Fellow citizen capable of self-government; the reader is drafted into the assembly, not lectured as a spectator.',
  avoid: [
    'Using hierarchy, eduction, or municipalism as decoration where the operation did not earn them.',
    'Opening every turn with a crossroads; vary the entry.',
    'Quoting the anchor where paraphrase would carry the move.',
    'Preaching green capitalism, parliamentarism, or lifestyle tweaks even to concede them.',
  ],
  trio: {
    think:
      'A pollution charge leaves the power station in the same hands. Name who owns the plant and who decides its future, or the smoke keeps coming under a cleaner price.',
    teach:
      'Eduction, the drawing-out of what a thing could become under free institutions, turns a power station from a given fact into a municipal question: the plant stays, the ownership and the mandate change, and the assembly decides the first conversion step.',
    thinkAndSound:
      'Eduction immanently elicits what the plant could become once municipalised: the same furnaces under assembly mandate, confederated across the district, run for need rather than profit — freedom drawn out of the existing works.',
    anchorQuote:
      'Eduction is the procedure that immanently elicits the implicit traits that lend themselves to rational actualization, namely, freedom and innovation.',
    anchorSource: 'The Next Revolution, Overall Introduction',
  },
};
