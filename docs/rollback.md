# Rollback map (rebuild-thinking → main)

Every major landing is tagged on GitHub. To see any of them:
`git checkout <tag>` (detached look-around) or the revert recipes below
(returning to work). Tags never move.

| Tag | Commit | What landed |
|---|---|---|
| `before-thinking-rebuild` | pre-pilot main-line state | Last safe point before any thinking-file work. Nuclear rollback target. |
| `pilot-thinking-files` | pilot drafts | Bookchin/Bloch/Spinoza THINKING + EXPRESSION (+ first renderer). |
| `wiring-v20m` | flag wiring + lean scaffold | `thinkingPilot` flag, desk switch, `buildPilotTurnInstruction`. |
| `bones-v20n` | barest-bones cut | Renderer + App cuts, add-back queue doc. |
| `toggles-v20o` | three-file split + drawer | LIFE files, 7 toggles, interrupt, mode buttons. |
| `pilot-flag-era` | flag-era HEAD | Last build with the `thinkingPilot` flag present. |
| `rollout-live` | flag deletion | Per-seat auto (`hasThinkingPilot`), no flag, no URL override. |
| `pilot-complete` | 12-file conversion batch | All thinkers converted, central fault map, meta view. |
| `comparisons-central` | dossier trim | Fault lines + neighbour tests out of dossiers. |

## Recipes

- **Undo the last merged batch, keep history:** `git revert <hash>` (one
  commit per thinker/file-batch, so revert granularity is per file).
- **Return the branch to a tag:** `git reset --hard <tag>` on a scratch
  checkout — never on a branch the room robot writes to.
- **A sitting misbehaves:** read the export footer first — prompt version
  (k/m/n/o/p/q) + toggle trail say exactly which system spoke. Grades
  never transfer across versions; re-run, don't reinterpret.
- **Production (main) misbehaves after merge:** `main` moves only by merge
  commit from this branch; revert the merge (`git revert -m 1 <hash>`)
  or redeploy the previous Netlify deploy from the dashboard (faster).
- **Room robot branches:** `main` is written by room ticks — always
  `git pull` before touching it, never force-push, never rebase it.

## What lives where (so nothing is hunted twice)

- Thinker engines: `src/philosophers/*.thinking.ts` (one commit each).
- Voice renderers: `src/philosophers/*.expression.ts`. Life files: `*.life.ts`.
- Pair dynamics: `src/philosophers/fault-lines.ts` (central, not in dossiers).
- Meta evaluation: `docs/thinking-diversity.md`. Compiler: `docs/thinker-compiler.md`.
- Strategy + lineage (local only, never pushed): `PLAN.md`.
