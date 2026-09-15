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

- Order runs top-to-bottom: one opening seat on the central axis, paired
  seats alternating left / right down the rows, closing seats back on the
  axis — both ends mirror. ([repo]: axis x=352; sides x=210 / x=494;
  rows y = 60, 155, 250, 345, 440, 535, 630.)
- Node radius 22; arrows land on rims (offset 27) along the arrival
  direction, never buried, never floating. Labels: names only, no dates or
  metadata.
- Type: the scheme's display face; least-connected seat at standard body 16px,
  +2px per extra connection (in or out). Halo behind labels in ground
  colour so lines pass behind text.
- No drawn spine, ever: a drawn line implies one continuous transmission,
  which is not an evidenced claim. The threads themselves form the spines.
  Nothing sticks out past either end circle.

## Lines (straight-spine design — the default)

Precisely how to draw it:

1. Every debt draws exactly one straight segment: `M creditor-centre L
   heir-rim`, where the rim point is the heir's centre pulled back 27px
   along the segment's own direction (so the arrowhead lands on the rim,
   continuing the line — never buried, never floating, never kinked on).
2. Same-side debts therefore run exactly down the left, central or right
   spine. They WILL overlap there. That is accepted by design, never routed
   around: the full edge list beside the diagram carries complete
   understanding, so the drawing optimises for calm, not provability.
3. Cross-axis debts run straight diagonally, rim to rim, with no bow.
4. Crowded heirs may assign explicit fanned rim points ([repo]
   `GEN_RIM_POINTS`) so arrowheads never share one tip. Fan within the
   available rim; never move the node.
5. Kind sets treatment only: solid warm accent = direct, dashed gold =
   indirect ([repo] dash `5 4`). Critical direct debts sit back slightly
   ([repo] opacity 0.9 vs 0.8). Stance lives in data and tooltips, never in
   geometry.
6. Thin strokes throughout ([repo] 1.3 direct / 1.1 indirect): the nodes
   dominate, the lines are threads.

## Lines (S-curve variant — simple diagrams only)

When the diagram is small (roughly ≤ 15 debts) and the canvas is uncrowded,
single-gesture S-curves may read more elegantly than straight threads:

- One belly per debt, never a curve that changes its mind mid-flight;
  amplitude in three capped buckets by span (short / medium / long).
- Sides mirror by travel direction (rightward bellies right, leftward
  bellies left); same-side debts drape toward the centre.
- Opposed controls give the S; thin strokes and fanned rims as above.
- Rule of thumb: if any two threads overlap for most of their length, the
  diagram is no longer simple — switch back to straight spines.

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
may alter rim arrival points and nothing else in straight-spine mode (no
control points exist). In the S-curve variant it may also alter control
points, lateral displacement, track assignment and crossing position. It
must never alter edge identity, direction, type or node position.
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
