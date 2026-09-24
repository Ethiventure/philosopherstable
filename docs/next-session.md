# First thing tomorrow — Thu Sep 24 (owner-only tasks)

In energy order. Smallest first, stop anywhere — everything keeps.

## Today (Wed Sep 23): the room got its clock + Genzie joined
Genzie is the 13th seat (debts, trios, grid, room persona) but speaks
only when summoned — no manual run fired yet. Diagnosed the slow room:
GitHub starts the schedule ~6x/day, every start lands. Fix chosen:
Cloudflare Worker fires dispatch every 45 min (~32/day), free, most
robust — code written (`workers/room-cron/`), not yet switched on.
Research plan for the room's future delivered (memory/shape/watch/audience);
awaiting your letter picks. All pushed (`fc2045d` on origin).

## 1. Switch on the room clock (~10 min, needs your accounts)
Steps live in `workers/room-cron/worker.js` header. Short version:
free Cloudflare account → Workers & Pages → paste worker code →
cron `*/45 * * * *` → secret `GH_PAT` (fine-grained token, this repo,
Actions read+write) + variable `GH_REPO=Ethiventure/philosopherstable`.
First turn lands within ~45 min — watch one land before trusting it.

## 2. Summon Genzie (1 min)
Actions → room-tick → Run workflow → seat box: `genzie`.
Her line lands ~1 min later.

## 3. Shared key off Groq (checks + 1 sitting)
Netlify env has `ALIBABA_API_KEY`? Latest deploy after the Alibaba
change? Then one shared sitting — export names the model, that's the
live test the code still marks pending.

## 4. Room future (whenever, pick letters)
Research plan in chat Sep 23: memory (roundup/self-memory/old lines),
shape (forward links/date hooks/stall honesty), watchability (polling,
filters, TTS, model credit), audience steering. Reply with surviving
letters; build order suggested is memory → shape → watchability.

## 5. Sittings/verdicts/picks (only if you feel like it)
Crowns stand (3.8-max / 3.7-plus / free vacant). `Grade: TODO` files
in `docs/eval-sittings/`; golden picks for Phase 7c voice exemplars.

## 6. Small decisions (carried, each under a minute)
LICENSE · git-history name · Together pipe: key or drop ·
`.env.test.local`: confirm TEST_OPENROUTER_MODEL is `qwen/qwen3.7-plus` ·
favicon/OG art · Rose texts (Mourning re-convert, find Love's Work).

## Explicitly NOT (parked, no nagging)
Z.ai pipe · GLM/DeepSeek sittings (gibberish rule) · 30B length tests ·
template scaffold · podcast · RAG latency · 14B tuning · visitor posting
in the room (login+moderation, against the rules) · denser cron syntax
(same GitHub throttle) · Netlify scheduled functions (storage redesign).

## Dropped today (dead, with reason)
- "Push unlocks cron" (Sep 22 §1): pushed; cron runs on its own.
- "Cron watch / zero self-fires" (Sep 22 §2): self-fires ~6x/day;
  Worker replaces the watch.
- Burst-per-run as default: folded into manual scenes on demand, so the
  ~30/day target holds.
