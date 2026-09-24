# Rotation & recovery

One page: every secret's home, how to rotate it, the quota caps, and how
to roll back. Names only — values live on the MacBook and iPad, never in
this repo, never in docs, never in chat.

## Secrets (names only)

| Secret | Lives in | Serves |
|---|---|---|
| `GROQ_API_KEY` | Netlify env; GitHub repo secret; local `.env` (dev only) | Shared sittings (Netlify), room ticks (GitHub cron) |
| `ALIBABA_API_KEY` | Netlify env | Shared route when set (Groq becomes fallback) |
| `GH_PAT` | Cloudflare Worker secret | Room clock trigger (starts the tick workflow) |
| Visitor BYOK keys | Browser `localStorage` only | Owner/visitor personal pipes |
| `TEST_*` | `.env.test.local` (gitignored) | Local probes/evals, never CI |

`.env`, `.env.test.local`, `.netlify` are gitignored (verified). History
holds no values — re-verify with the security sweep after any key-handling
change (Module 8 pattern).

## Rotation (leak or expiry — no code change, ever)

1. Make the new value at the provider (Groq console / Alibaba Model
   Studio / GitHub fine-grained token: this repo, Actions read+write).
2. Put it where it lives:
   - Netlify env → **redeploy** (functions only pick it up on a new deploy).
   - GitHub repo secret → takes effect on the next tick run.
   - Cloudflare Worker secret → deploys immediately on save.
   - Local `.env` / `.env.test.local` → edit the file, nothing else.
3. Prove it: one shared sitting (Netlify), one manual tick run (GitHub),
   one 45-min boundary (Worker). Delete the old value at the provider.

## Quota caps (shared path)

- Per address: 60 turns/day (~2 full sessions). Global: 900/day.
- Hit either → the cabinet pauses with resume/wait/BYOK recovery; nothing is lost.
- Groq free ceiling behind it all: ~1K requests/day. Room clock uses ~32.

## Rollback markers

- Prompts: lineage log in PLAN.md, one line per change — revert any
  single change with `git revert <hash>`. Prompt version rides the
  export; grades never transfer across versions.
- App: Netlify keeps the previous deploy — one-click rollback there.
- Room clock: 2-day rule (PLAN Phase 10) — Worker unproven → delete it,
  GitHub schedule stays. Comparison is turns/day.

## Recovery scenarios

- **Shared quota exhausted:** wait (resets midnight UTC) or add a personal
  key in Settings → Key. Sittings resume where they paused.
- **Room stall, GitHub-paced:** normal (~6/day). Check Actions → room-tick
  for red runs; read the `SKIP:` line.
- **Room stall, Worker live:** check Worker View events (firings?) then
  Actions runs (starting?). No firings → trigger didn't save; firings
  without runs → token/permission; runs without turns → read `SKIP:`.
- **Bad deploy:** roll back in Netlify; the previous deploy is kept.
- **Shared key invalid (401):** rotate per above; the app names the fault
  plainly (`auth`) instead of failing silently.
