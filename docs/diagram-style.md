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

- Time runs left-to-right: seats in chronological order along a horizontal
  axis, alternating above / below the timeline row by row, earliest left
  and latest right. ([repo]: canvas 1500×850; timeline y=425; rows y=285 /
  565; 12 seats.) Arrows run creditor → heir and may point back across the
  timeline — direction shows debt, position shows time, never the reverse.
- Node radius 34; threads trim to rims along perpendiculars and arrowheads
  land on rims, never buried, never floating. Labels: names only, sized by
  degree (least-connected seat at standard body 16px, +2px per extra
  connection — a legibility aid, never a ranking); dates live in hover
  text, accessible labels and the detail panel, never painted.
- Type: the scheme's display face. Halo behind labels in ground
  colour so lines pass behind text.
- One drawn timeline, labelled earlier / later: chronology only, never a
  transmission claim. The threads themselves carry the debts. Nothing
  sticks out past either end circle.

## Lines (curved-landscape design — the default)

Precisely how to draw it:

1. Every debt draws exactly one calm cubic, rim to rim. Reciprocal pairs
   (A owes B and B owes A) draw as ONE line with arrowheads at both ends.
   Same-pair dual-kind never draws twice: the direct thread wins (guard —
   zero such pairs today).
2. Threads leave and arrive near-perpendicular to their row and never
   travel along it. Same-row pairs arch outward (top bows up, bottom bows
   down), nested by span, then sibling order, then a small deterministic
   lane. Opposite-row pairs cross the open middle band in one gesture,
   each on its own fixed lane (six lanes, 32px apart), like lanes on a
   road: parallel, separated, same angle family.
3. One belly per debt; amplitude in capped buckets by span. Crowded heirs
   fan rim arrivals laterally; documented per-edge exceptions
   (`GEN_KICK_EXTRA` / `GEN_LANE_EXTRA`) where buckets still share a
   thread — reviewed, never silent.
4. Kind sets treatment only: solid warm accent = direct, dashed gold =
   indirect (dash `8 7`). Stance lives in data, tooltips and the detail
   panel, never in geometry.
5. Strokes stay calm ([repo] 2.4 direct / 2.0 indirect): the nodes
   dominate, the lines are threads.

## Lines (single-thread variant — simple diagrams only)

When the diagram is small (roughly ≤ 15 debts) and the canvas is uncrowded,
single straight threads may read more calmly than curves: one segment per
debt, rim to rim, same-side debts sharing one channel by design (the text
list carries exactness). Rule of thumb: if any two threads overlap for
most of their length, the diagram is no longer simple — switch to curves.

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
