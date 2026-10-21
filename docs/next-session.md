# Next session — Oct 21 2026 (evening)

Day summary: token cap 170→200 (170 still clipped 14/47), the voice A/B
went live — expression file rides the room (`2026-10-21b`, ROOM TERMS
override included after owner correction), owner verdicts logged (Genzie
story + recent replies stay for every seat; reading level measured first),
and `scripts/room-readability.mjs` added.

## Open problems

- **Voice A/B has produced zero ticks.** `2026-10-21b` went live 17:00 UTC;
  the last pre-change tick was 15:00 UTC. First voice tick = tomorrow's
  first cron run. Nothing to judge yet.
- **Cap 200 unverified** — no tick has run under it (same window).
- **Overlap may rise under voice** (signature words repeat across seats) —
  measure, don't panic; the 0.08–0.09 baseline was voice-off.
- **Plain-speech decision (IELTS Q)** waits on re-measuring under voice:
  baseline is graduate-level (mean FK grade ~17; Marx 20.7, Deleuze 7.2).
- Phase 11 `dialectic/prompts.ts` genuinely open (zero mode lines).
- Sep-era "Open" echo rows in `models-tried.md` superseded, need closing.
- Blind sitting (video-game question) still never run — untouched again.

## Carry forward (smallest first)

1. Pull, then verify cap-200 + voice on the first new ticks:
   `git pull --rebase origin main` → `node scripts/room-health.mjs` →
   endings check:

   ```
   node -e "const t=require('./public/room/transcript.json');const post=t.turns.filter(x=>x.ts>'2026-10-21T17:00');let b=0;for(const c of post){if(!/[.!?'’)]/.test(c.text.trim().slice(-1)))b++};console.log(post.length+' voice ticks, '+b+' clipped');"
   ```

2. After ~6 voice ticks: `node scripts/room-readability.mjs 3` and compare
   the per-thinker table against the Oct 21 baseline (Marx 20.7 → ?).
3. Revert knob if you don't like the voice: `ROOM_VOICE=off` (documented in
   `scripts/room-tick.mjs`); tag `room-tick-baseline-2026-10-21` restores
   the whole pre-voice state.
4. Blind sitting, still: fixed video-game question, 5 seats, then
   `npm run grade -- <export>`; tried-log rows after grading.
5. Close the two stale ledger items: `docs/models-tried.md` Sep echo rows;
   PLAN Phase 11 `dialectic/prompts.ts` mode-lines task.

## Dropped today (decided, not lost)

- Story-adherence redesign — owner verdict: current assembly IS the
  intended design (story + recent replies for every seat). Closed.
- The desk fence in the room voice block — superseded same day by the
  ROOM TERMS override (`2026-10-21a` → `21b`, no tick ran under 21a).
- Cap 170 — measured insufficient (14/47 clipped); replaced by 200.

## Explicitly NOT (parked, no nagging)

- App-code deploys until 1 Nov; any prompt edits while the voice A/B runs
  (one variable); loan rethink; add-back queue; persona-prompts regen;
  think-&-sound sitting.

Everything keeps. Stop anywhere; the room ticks without you.