# Genealogy diagram — style, preferences, and quick-start

Content-agnostic recipe for node-and-debt diagrams in this project's
dark-academia theme. Implementation: `src/components/GenealogyMap.tsx`,
data from `src/philosophers/influences.ts` (single source of truth),
auditable grid via `node scripts/influence-grid.mjs` → `docs/influence-grid.md`.

## Fixed dark cabinet (hard rule)

The panel NEVER follows Display settings: deep walnut ground, parchment
ink, teal rings. Every painted thing inside it resolves against the fixed
`--gen-*` vars — never travelling theme vars, never hardcoded utilities.
That rule exists because of a real bug: node names once used theme ink and
rendered dark-on-dark in light schemes. Guard: `node
scripts/check-diagram-contrast.mjs` (text ≥ 4.5, graphics ≥ 3.0) after any
palette edit.

## Exact palette (fixed hex, all schemes)

| Use | Hex | Notes |
|---|---|---|
| Ground | `#221910` | walnut, warm vignettes, gold top-bar from the card |
| Node fill | `#2e2318` | espresso |
| Ink (names, initials, heading) | `#ecdfc4` | parchment |
| Rings | `#6e7f5c` | Deleuze's sage, lifted one step for contrast on the fill |
| Direct lines + arrows | `#d98a8f` | rose |
| Indirect lines + arrows, spine | `#d3ab6b` | gold |
| Muted text | base ink at 60–85% | weakest pair 5.36, still passing |

Monochrome nodes always: one ring metal, one ink — never per-entity colours.

## Layout (canvas 704×738, taller than wide)

- Time runs top-to-bottom down a central spine at x=352. Spinoza opens on
  the spine (60), Deleuze (535) and Fisher (630) close on it — both ends
  mirror. Middle seats alternate left (x=210) / right (x=494) in
  chronological pairs, rows at y = 60, 155, 250, 345, 440, 535, 630.
- Node radius 22; arrows land on rims (offset 27) along the arrival tangent,
  never buried, never floating. Labels: names only, no dates or metadata.
- Type: house heading face; least-connected seat at standard body 16px,
  +2px per extra connection (in or out). Halo behind labels in ground
  colour so lines pass behind text.
- Spine runs exactly first-centre to last-centre — nothing sticks out past
  either end circle.

## Curves (one family)

- All free curves belly spine-ward; bow depth ∝ span (adjacent rows
  straight, longest jumps deepest, caps before looping). Same-row pairs get
  one gentle bow below. Backward feuds arc to the debtor's side, never
  dipping past either seat.
- The spine trio keeps fixed characters (showcase arcs, never ruled
  straight). Verticals sharing a track: dashed steps spine-side and drapes
  with the rest; blocked verticals swing wide clear (peaks ~25px+ off every
  circle — never a near-miss).
- Left/right pairs mirror about the axis — check reflection, never one side
  alone. Crossings are fine; overlaps and near-misses are bugs.
- Edge kinds are absolute: solid = direct, dashed = indirect. Stance lives
  in data and tooltips, never in rendering.

## Data contract

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
