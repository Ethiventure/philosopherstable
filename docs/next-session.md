# First thing tomorrow — Fri Sep 25 (owner-only tasks)

In energy order. Smallest first, stop anywhere — everything keeps.

## Today (Thu Sep 24): clock nearly proven, licence shipped, room fixed
Shipped: AGPL-3.0-only (LICENSE + package field + README + footer Source
link + HowBuilt section); persona-prompts doc + generator; models-tried
crowns summary; rotation-recovery doc; provider-health indicator; burst
loop; transcript fetch fix (GitHub-raw-first — Bogdanov reappeared);
morning command. Room rules rewritten to owner rulings. Decided: 45-min
clock, free-forever trigger, Cloudflare most robust. All pushed.
Worker status: code live, fires on schedule (4 firings logged) — but
dispatch 403s: token lacks Actions:write. Fix is a new token (permissions
freeze at creation), pre-filled link given. Everything else proven or
queued behind that token.

## 1. New token, paste, Deploy (5 min — unblocks everything)
Pre-filled link in chat Sep 24 (Actions:write pre-ticked — pick repo +
expiry). Paste into worker `GH_PAT` → Deploy. Next :00/:45 proves it.
Delete the old token after.

## 2. Prove the room (just looking)
- First clock-time turn + Genzie's first line (seating code is live).
- One manual burst (seat + turns 3) whenever curious.
- Eyes on footer/health/HowBuilt after deploy.

## 3. Shared key off Groq (checks + 1 sitting)
Netlify `ALIBABA_API_KEY` set? Deployed after the change? One shared
sitting — export names the model, that's the live test.

## 4. Room future (whenever, pick letters)
Memory / shape / watchability / audience steering (research plan Sep 23).
Parked: Genzie dossier reframe, daily recap, auto-refresh polling.

## 5. Phase 7b auto-metrics (new today — plan first, then build)
AlignScore guardrail, LENS-SALSA calibration, ASSET-method optional.
Honest costing: new Python deps (torch + spacy + weights), GPU-preferred —
slow on this MacBook's CPU. Sequenced after the room proofs; say go and
the plan gets written before anything installs.
Venv ready: `.venv312` (Python 3.12.13) built Sep 25 with the old venv's
full package set; old `.venv` untouched. One import proof still owed —
this session's sandbox blocked reads of the new dir (EPERM), so run
`.venv312/bin/python -c "import langchain_ollama"` in a real terminal
(or next session verifies).

## 6. Sittings/verdicts/picks (only if you feel like it)
Crowns stand (3.8-max / 3.7-plus / free vacant). `Grade: TODO` files in
`docs/eval-sittings/`; golden picks for Phase 7c.

## 7. Small decisions (carried)
Together pipe: key or drop · `.env.test.local` model check · favicon/OG
art (needs your artwork) · git-history name.

## Explicitly NOT (parked, no nagging)
Z.ai · GLM/DeepSeek sittings · 30B length tests · template scaffold ·
podcast · RAG latency · 14B tuning · visitor posting · denser cron ·
Netlify scheduled functions.

## Dropped today (dead, with reason)
- Dashboard-created Worker path: no blank-worker flow; agent/terminal
  routes documented instead.
- Reusing the old token: permissions freeze at creation — new token only.
- MIT/Apache: AGPL-3.0 picked.
