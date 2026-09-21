# Model selection funnel (fewer tests, decided faster)

Lesson of Sep 2026: thirteen graded sittings to crown three models is too
many. This funnel caps the work: at most 6 candidates enter, at most 4
sittings run, and each stage kills — the point is eliminating, not
collecting. Assumes the same providers; similar model families; what's
good varies by topic/task, so every decision carries its date and never
transfers silently.

## Stage 0 — desk research (zero spend, one sitting of reading)

- Re-verify live lists (IDs rot in days, never trust memory or old docs):
  OpenRouter free list + activity page, Groq docs free tier, DeepInfra /
  Together / Alibaba model pages and pricing pages.
- Read public benchmark tables as a FILTER only (IFEval leaderboard,
  provider bench tables, community leaderboards): cut what scores badly
  at instruction-following, shortlist what scores well. Benchmarks never
  vote — our probes do (see Phase 7b verdicts for why each public bench
  is method-only here).
- Check the tried-log corpses first (`docs/models-tried.md`): buried
  stays buried without new evidence (new provider counts as new evidence;
  a new month does not).
- Output: shortlist of at most 6 — 2 free, 2 value, 2 quality. Write it
  down with the date before spending anything.

## Stage 1 — key checks (~10 cents of effort, ~$0)

`npm run test:keys`. Dead IDs, unreachable pipes, and bad keys die here —
never spend a sitting on a pipe that fails "Reply with exactly: ok".
Retry throttled pipes once off-peak, then move on. Skips are free.

## Stage 2 — probes (~1 call each, fractions of a cent)

`npm run test:matrix` (add `--ground <shard>` for the loan A/B,
`--kind reconstruction` for the load bench). Each probe reports contract
held / parse-fail / volatile / over-budget / loans. Kill anything that
fails the contract twice. What survives (expect 3–4) earns a sitting.
Nothing unprobed gets a sitting — no exceptions, however hyped the ID.

## Stage 3 — sittings (max 4, then stop)

Fixed question, fixed seats, grounding ON, `npm run grade` scores each
transcript mechanically and the human writes 2–3 quotes plus the verdict.
Run order: cheapest crown-fillers first (Low sittings are minutes each),
free-tier walls last (they cost patience, not money). Four sittings is
the budget — the fifth sitting is how thirteen happened.

## Stage 4 — crowns (one model per slot across ALL levels)

Slots: best free, best value (paid), best quality (price no object). A
fail at any level excludes — no per-level splitting (that's the fallback,
not the aim). Kill rules, decided up front so sunk cost can't argue:
- Gibberish at any level → park the model entirely (no easy fix exists
  until proven otherwise on a cleaner pipe).
- Burn / halt / loop → bury, log the corpse with the exact ID + provider.
- Echo clusters → ONE mechanical experiment, then park as engine if the
  next sitting still clusters.
- Budget: state per-session cost before each sitting; trial $0 windows
  get expiry dates written next to every verdict that depends on them.

## Re-verify rhythm

Model IDs rot in days, prices without notice, free lists weekly. Every
crown carries its date; a crown older than one quarter is a rumour until
`test:keys` + one probe re-confirm it. The free-model hunt (Stage 0,
first bullet) is a recurring step, never a one-time assumption.
