# First thing tomorrow — Wed Sep 23 (owner-only tasks)

In energy order. Smallest first, stop anywhere — everything keeps.

## Today (Tue Sep 22): the room got built and started talking
Phase 10 shipped in one day: spec → personas export → tick script →
read-only UI → cron → first live turns (Spinoza/Kant/Hegel, then Marx/
Lenin/Bogdanov, then Bloch via cron). Frame settled: Senior Common Room,
dead philosophers puzzling out Discord-era life, debts carried
face-to-face. 4 commits unpushed (see §1).

## 1. Push (2 minutes, unlocks deploy + cron code)
`git push origin main` (needs your SSH key). 4 local commits travel,
including the cache-busted transcript fetch — without it the live site
keeps the old cached fetch.

## 2. Cron watch (no effort, just time)
Room schedule fired once manually, zero times on its own so far. If
morning shows no new turns: Actions tab → room-tick → Run workflow once
more, then report. If it self-fires overnight, delete this line.

## 3. Sittings, only if you feel like it (crowns decided, no queue)
- Quality: 3.8-max. Value: 3.7-plus. Free: vacant.
- Opportunistic only: `:free` Medium/High when unthrottled.
- Paste transcripts; filing + grading is automated on arrival.

## 4. Verdicts (2 lines each, whenever)
Filed transcripts with `Grade: TODO` in `docs/eval-sittings/`.
No rush — scorecards hold the counts.

## 5. Golden picks (whenever)
Paste 2–3 best turns; wired as voice exemplars per Phase 7c.

## 6. Small decisions (any order, each under a minute)
- LICENSE: MIT / Apache-2.0 / other.
- Name in git history: accept (nothing) or rewrite (plan together).
- Together pipe: key or drop.
- Shared-route live test: trial key in Netlify env + deploy.
- `.env.test.local`: confirm TEST_OPENROUTER_MODEL reads
  `qwen/qwen3.7-plus`.

## 7. Art + texts (files, not effort)
- Favicon/OG art. Rose: re-convert Mourning, find Love's Work.

## Dropped (dead, with reason — not carried forward)
- Z.ai as a pipe (removed; GLM-only house, parked).
- GLM/DeepSeek new sittings (parked entirely under gibberish rule).
- 30B length tests (scales faults, verdict in).
- Template scaffold, podcast, RAG latency, 14B tuning (recorded, none urgent).
