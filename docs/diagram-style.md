# Genealogy diagram — style, preferences, and quick-start

Content-agnostic recipe for node-and-debt diagrams. Implementation pointers
naming this repo's files are marked [repo]; everything else transfers to any
UI scheme. Data contract always: a debts table is the single source of
truth; heirs derive; a generator script exports the audit grid and fails
loudly on drift.

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
| Indirect lines + arrows, spine | the scheme's gold, deepened until it passes on the ground |
| Muted text | base ink dimmed to 60–85%, weakest pair still ≥ 4.5 |

Monochrome nodes always: one ring metal, one ink — never per-entity colours.

## Layout (current instantiation [repo]; roles are the spec)

- Time runs top-to-bottom down a central spine at x=352. Spinoza opens on
  the spine (60), Deleuze (535) and Fisher (630) close on it — both ends
  mirror. Middle seats alternate left (x=210) / right (x=494) in
  chronological pairs, rows at y = 60, 155, 250, 345, 440, 535, 630.
- Node radius 22; arrows land on rims (offset 27) along the arrival tangent,
  never buried, never floating. Labels: names only, no dates or metadata.
- Type: the scheme's display face; least-connected seat at standard body 16px,
  +2px per extra connection (in or out). Halo behind labels in ground
  colour so lines pass behind text.
- No drawn spine: the edges themselves trace the descent. Alignment still
  runs down the central axis — nothing sticks out past either end circle.

## Curves (one family)

- All free curves are S-curves leaving and arriving along the flow of years.
  Mirror rule in two parts: edges crossing the axis follow travel direction
  (rightward bellies right, leftward bellies left), so crossing pairs
  reflect; edges staying one side drape toward the centre. Bow depth ∝
  span, capped before looping. Same-row pairs get one gentle bow below.
  Stacked dotted tracks nest by span (shallowest hop innermost) so every
  debt keeps its own arrow.
  Backward feuds arc to the debtor's side, never
  dipping past either seat.
- The spine trio keeps fixed characters (showcase S-curves with opposed
  controls, never ruled straight: Deleuze echoes Fisher's right-first
  gesture at smaller amplitude so the pair nests, Fisher sweeps right
  before diving wide left around Deleuze's circle, the finale
  nearly straight). Verticals sharing a track: dashed steps spine-side and drapes
  with the rest; blocked verticals swing wide clear (peaks ~25px+ off every
  circle — never a near-miss).
- Left/right pairs mirror about the axis — check reflection, never one side
  alone. Crossings are fine; overlaps and near-misses are bugs.
- Edge kinds are absolute: solid = direct, dashed = indirect. Stance lives
  in data and tooltips, never in rendering.

## Priority order (never sacrifice a higher rule for a lower one)

```text
1. Historical accuracy
2. Correct relationship direction and type
3. Chronological/layout constraints
4. Legibility
5. Node clearance and collision avoidance
6. Symmetrical visual balance
7. Graceful S-curve composition
8. Decorative refinement
```

The renderer must never alter factual data to improve visual symmetry.
Symmetry is a design preference, not a historical claim.

## Visual specification (what the human sees)

The genealogy uses graceful S-curves, symmetrical composition, nested
parallel tracks, tangential arrowheads and deliberate negative space.
Left and right feel visually balanced. Long relationships may use deeper
S-curves. Crossings are acceptable but appear deliberate rather than
clustered. Ornamental and scholarly, still easy to follow. Mirror
balance, not mirror blindness: geometrically equivalent edges mirror;
different node layouts may diverge.

## Geometry specification (what the code may do)

Node positions and factual edges are authoritative. The routing engine
may alter control points, lateral displacement, track assignment,
crossing position and rim arrival point. It must not alter edge
identity, direction, type or node position. Obstacle avoidance precedes
aesthetic optimisation. Symmetry is a soft constraint. S-curve geometry
is preferred but may bend for obstacle avoidance or edge separation.
Geometry stays independent of node names and historical identities;
unavoidable exceptions are documented and justified.

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
