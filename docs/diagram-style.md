# Node-and-debt diagram — style, preferences, and quick-start

Content-agnostic recipe for relationship diagrams on any topic (people,
texts, systems, events — anything with nodes and directed debts). It was
built for a genealogy of thinkers but depends on none of that content:
substitute any entities, any axis (time or otherwise). Implementation
pointers naming this repo's files are marked [repo]; everything else
transfers to any UI scheme. Data contract always: a debts table is the
single source of truth; heirs derive; a generator script exports the audit
grid and fails loudly on drift.

## Fixed dark cabinet (hard rule)

The panel NEVER follows display settings: it is always the darkest surface
in the scheme, with the scheme's light ink on it. Every painted thing inside
the panel resolves against panel-scoped fixed vars — never travelling theme
vars, never hardcoded utilities. That rule exists because of a real bug:
node names once used theme ink and rendered dark-on-dark in light schemes.
Guard: a contrast-check script over every painted pair (text ≥ 4.5,
graphics ≥ 3.0), run after any palette edit; fix the palette, never the test.

## Palette (roles, never hex)

Read the current values off the panel vars ([repo] `--gen-*`); the roles
are the spec and survive any reskin:

| Role | Rule |
|---|---|
| Ground | darkest surface + warm vignettes + the card's own top-bar |
| Node fill | one step up from ground |
| Ink (names, initials, heading) | the scheme's light ink, full strength |
| Rings | one muted cool metal (sage/teal family), lifted until it passes on the fill |
| Direct lines + arrows | the scheme's warm accent (rose/crimson family) |
| Indirect lines + arrows | the scheme's gold, deepened until it passes on the ground |
| Muted text | base ink dimmed to 60–85%, weakest pair still ≥ 4.5 |

Monochrome nodes always: one ring metal, one ink — never per-entity colours.

## Layout (current instantiation [repo]; roles are the spec)

- Time runs top to bottom: one opening seat on the central axis, paired
  seats alternating left / right down the rows, closing seats back on the
  axis — both ends mirror. ([repo]: canvas 704×738; axis x=352; sides
  x=210 / x=494; rows y = 90–600; channels x=276 / x=412 / x=432.)
  Arrows run creditor → heir and may
  point back up the years — direction shows debt, position shows time,
  never the reverse.
- Node radius 34; threads trim to rims along perpendiculars and arrowheads
  land on rims, never buried, never floating. Labels: names only, sized by
  degree (least-connected seat at standard body 16px, +2px per extra
  connection — a legibility aid, never a ranking); dates live in hover
  text, accessible labels and the detail panel, never painted.
- Type: the scheme's display face. Halo behind labels in ground
  colour so lines pass behind text.
- No drawn spine: a drawn line implies one continuous transmission,
  which is not an evidenced claim. The bundled threads themselves trace
  the descent. Nothing sticks out past either end circle.

## Lines (road-system design — the default)

Precisely how to draw it:

1. Every debt draws exactly one calm cubic, rim to rim. Reciprocal pairs
   (A owes B and B owes A) draw as ONE line with arrowheads at both ends.
   Same-pair dual-kind never draws twice: the direct thread wins (guard —
   zero such pairs today).
2. Threads bundle onto three shared vertical channels beside the node
   columns (left / centre / right): same-side pairs take their side
   channel, cross-side pairs share the centre channel. Small roads join
   on horizontal ramps and leave the same way. Overlap is the design,
   never routed around: the full edge list beside the diagram carries
   complete understanding, so the drawing optimises for calm, not
   provability.
3. Ramps hug the endpoints: threads leave their node almost horizontally
   toward the channel, clearing seated neighbours before travelling, and
   leave only at their heir. Arrowheads land on rims along the arrival
   horizontal — never buried, never floating.
4. Kind sets solid vs dashed: solid warm accent = direct, dashed gold =
   indirect (dash `8 7`). Opacity sets strength of evidence: high full /
   medium half / low quarter. Stance lives in data, tooltips and the
   detail panel, never in geometry.
5. Strokes stay calm ([repo] 2.4 direct / 2.0 indirect): the nodes
   dominate, the lines are threads.

## Lines (single-thread variant — simple diagrams only)

When the diagram is small (roughly ≤ 15 debts) and the canvas is uncrowded,
single straight threads may read more calmly than curves: one segment per
debt, rim to rim, same-side debts sharing one channel by design (the text
list carries exactness). Rule of thumb: if any two threads overlap for
most of their length, the diagram is no longer simple — switch to curves.

## Recipe B — vertical road system (built here, ~60 debts, reusable)

Content-agnostic build order for any node-and-debt diagram at this scale.
Substitute any entities, any axis direction. Data contract always: a debts
table is truth, heirs derive, a generator fails loudly on drift.

1. **Positions first, from data alone.** Order nodes chronologically down
   the canvas (opening seat on axis, pairs alternating sides, closing
   seats on axis). Node radius generous (34 units here) — threads need
   rim room. Freeze positions before routing a single line.
2. **Channels, not threads.** Give traffic 2–4 shared vertical levels
   beside (never through) the node columns, with 50px+ clearance to every
   circle. Same-side pairs take their side channel; cross-side pairs share
   the centre one. Ramps hug the endpoints (5%/95% of span) so 90% of
   every thread runs parallel: short slips, long travel, laminar flow.
3. **One cubic per debt, rim to rim.** Trim endpoints to rims along the
   arrival direction first, then bow all channels the same small degree
   east (20 units here; less where heads sit close). Same curve family
   everywhere; named S-swings only where a run reads ruled — each logged
   in a per-edge exception table, never silent.
4. **Reciprocals draw once.** A↔B pairs get one line, heads at both ends;
   the text list still carries each directed debt. Same-pair dual-kind
   never draws twice (direct wins; guard kept even at zero cases).
5. **End-circle fountains.** The busiest source/sink nodes spray rim
   points around their circle (angular fan, one step per thread) instead
   of stacking loops. Compute BOTH ends in one helper — split helpers
   return blanks for the combined case and one debt will land at 0,0.
6. **Grade by evidence, state it.** Opacity carries confidence (here full
   / half / quarter); solid vs dashed carries route. Say what strength
   means in the caption. Stance never touches geometry.
7. **Checker shares the router module.** Drive-throughs fail, bundling
   reports, arrivals retired once rims are shared. The checker must sample
   the DRAWN curve — an old sampler here tested a wrong curve for months
   because control indices were misnamed; name them ax/ay/c1x/c1y/… .
8. **Component behaviour.** Hover a seat to isolate its debts: one `lit`
   slug in state; threads not touching it drop to 0.08 opacity (and drop
   their markers — marker opacity does not inherit reliably, so dimmed
   threads must unmount markers, not fade them), unrelated seats to 0.35,
   all eased over 0.18s via a single CSS transition on opacity. Keyboard
   focus isolates identically (focus/blur set the same state); the hover
   card, if any, is mouse-only. Click a line for its note(s); full edge
   list in a disclosure; no text on hover, ever — remove native SVG
   `<title>` elements too, not just custom cards (they linger). Dates live
   in aria-labels and panels, never painted.
9. **Styling traps.** Marker fill needs direct selectors (var() in
   presentation attributes fails cross-browser); marker opacity does NOT
   inherit reliably — drop markers off dimmed threads instead. Dark
   cabinet: every painted pair resolves against fixed panel vars, checked
   by script over every pair after any palette edit.
10. **Review honestly.** HMR and stale tabs lie — hard-refresh before
    judging, and never tune geometry from a stale screenshot (two rounds
    here were).

## Priority order (never sacrifice a higher rule for a lower one)

```text
1. Factual accuracy (the debts table is truth)
2. Correct relationship direction and type
3. Ordering/layout constraints
4. Legibility
5. Node clearance and collision avoidance
6. Symmetrical visual balance
7. Graceful line composition
8. Decorative refinement
```

The renderer must never alter factual data to improve visual symmetry.
Symmetry is a design preference, not a factual claim.

## Visual specification (what the human sees)

Straight threads on shared spines, symmetrical composition, fanned
arrowheads and deliberate negative space. Left and right feel visually
balanced. Same-spine overlaps read as one calm channel with the text list
beside it for exactness. Crossings are acceptable but appear deliberate
rather than clustered. Ornamental and scholarly, still easy to follow.

## Geometry specification (what the code may do)

Node positions and factual edges are authoritative. The routing engine
may alter rim arrival/departure fans, lane assignment, kick buckets and
documented per-edge exceptions — nothing else. Reciprocal pairs are one
drawn line (both arrowheads); the text list still carries each directed
debt separately.
Clearance exemptions must be explicit and documented (e.g. accepted
same-spine overlap). Geometry stays independent of node names and
identities; unavoidable exceptions are documented and justified.

## Data contract [repo]

- `CABINET_DEBTS` is truth; heirs derive; the grid generator fails loudly
  on drift. Codes: D+/D-/D, I+/I-/I, N (N = "cannot currently demonstrate",
  never "unrelated"). Owner's chat evidence outranks repo text and outside
  models; notes say whose evidence each link stands on.

## Access and review

- Fluid SVG capped ~660px, horizontal scroll under ~420px (targets stay
  ≥44px); full edge list in a disclosure; `role="img"` summary;
  keyboard-operable seats opening detail views; nothing animates.
- Review protocol: judge the BUILT canvas after a hard refresh — HMR and
  stale tabs lie, and most "regressions" to date were old bundles.
