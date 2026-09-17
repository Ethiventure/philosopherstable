# Models tried

Living log of every model/provider combination tested for the cabinet, newest
first. Check here before (re)trying anything — corpses stay buried.

## Current standing (Sep 17 2026, owner-graded, Low, AGI-jobs question)

- **DeepSeek v4.1-flash (OpenRouter paid) — the engine.** Strengths: holds
  the JSON contract every turn, quick start, full session ~6 min, plainness
  mostly holds (Hegel P1 succinct, Bookchin P1 plain, Rose P1+P3 genuinely
  Rosean). Weaknesses: voice at ~85% — "arm" limb/tool/weapon blur across
  turns, occasional staccato AI compressions (P2 Hegel), plain words combined
  into harder phrases. Gap is prompt-fixable surface, not model nature.
- **Qwen3.8-27B (Groq free) — the voice reference.** Strengths: best
  voice+plainness together (Bloch P1 exemplar), developed turns, better
  margins voice, ideas + emotional tone held. Weaknesses: 14+ min + 3 resumes
  per session free; quota walls (429s in pass 1); odd metaphors, mixed
  metaphors, wrong-continent examples. Unusable free; ~$0.20+/session paid.
- **Desk (all providers) reads easier than turns** — concrete examples land —
  but at medium difficulty while set to Low. Desk level calibration is open.
- **Every Qwen under 27B failed the same way** (3.6-35B, 3.8-flash, 3.5-9B):
  reasoning burn — thinks about the contract/persona until cutoff, answers
  nothing. The contract needs a model that answers instead of thinking.
- `deepseek-r1-distill-qwen-32b` (Groq free): DEAD on arrival Sep 17 —
  decommissioned (400), never tested. Groq ID churn claims another one.

## New candidates (Perplexity round 2, Sep 17 — UNTESTED, prices not
independently verified, do not quote)
- `mistral-small-3.2-24b` (OpenRouter paid `mistralai/mistral-small-3.2-24b-instruct`):
  FAILED live Sep 17 (owner): 50s to start, 2+ min stuck on seat 1, then
  empty body (200, nothing in it). Non-reasoning by construction did not
  save it. Retry produced a turn: catastrophic loop — "The issue/problem/
  contradiction/danger is not X but Y" repeated ~30 times in one Hegel turn
  (a scaffold family our ban list only half-covered; extended same day + new
  NO LOOPS rule). Voice verdict: dead. Desk Spinoza on the same model read
  plain and decent — turns unusable, desk tolerable. Out.
- `glm-5.3-flash` (~$0.075/$0.25 promo, $0.15/$0.50 list claimed): MIT-licensed
  open weights. Promoted from parked-fallback to test candidate on price/perf
  reports. Same test. (Zhipu-owned; allowed — ban is OpenAI-only.)
- `qwen3-14b` / `qwen3-30b-a3b` (DeepInfra, ~$0.10–0.12/$0.24–0.30 claimed):
  different architectures from the burned small Qwens; may dodge the burn.
  Needs DeepInfra primary code to test there, or OpenRouter paid box if listed.
- Non-thinking models (owner question Sep 17): Mistral-Small is non-reasoning
  by construction — top of the queue doubles as this test. DeepSeek v4.1-flash
  is already effectively non-thinking (obedient, no burn observed).
- Rejected from the same report: Llama-3.1-8B (Llama-family verdict stands);
  Groq paid 3.8 (our verdict stands); free-tier-as-production (stands).
  Corrected: report's Groq 3.8 rates ($0.59/$0.79) look guessed — our observed
  free-tier behavior (429s mid-session) overrules its "3–4 sessions/day" math.

## Verdicts

| Date | Provider | Model | Verdict |
| ---- | -------- | ----- | ------- |
| Sep 2026 | OpenRouter paid | `deepseek/deepseek-v4.1-flash` | WORKING, graded live by owner: quick starting, main turns good, full session ~6 min. Desk path threw one transient empty-body on the same model (new logging caught it); desk paid path now retries once on server errors. Formal trio grade Sep 17 (owner, Low, AGI-jobs question, 5 seats): Hegel P1 succinct and good; Bookchin P1 plain and good; Rose P1+P3 excellent (shared split named, middle held open, no cheap resolution); Marx/Bookchin P2 concrete and good. AI-isms: "arm" used weirdly throughout (P1 Marx, P2 Bloch — reads as weapons at times); P2 Hegel staccato AI mess; low words combined into harder phrases (P2 Bloch). Margins tone good but numbered lists + bracketed names unreadable aloud (prompts fixed same day: flowing paragraphs). Desk answers read easier than turns (concrete examples land) but at medium difficulty, not Low — desk level calibration open. Fixed same day from this eval: export headings use short names; TTS strips [nn]; margins ban lists/brackets. |
| Sep 2026 | OpenRouter free cycle | Router-first + 19-model named bench = full live coverage (all 20 free minus the content-safety filter, verified via `/models` API Sep 15 2026), ordered by context desc (1M inkling ×2 / Nemotron ultra+lightning → 512k dots-3 → 262k Gemma/Ling/Nex/super/Laguna → 256k nano-omni-reasoning + north → 65k liquid → 32k glm-5.2 relisted). Removed: `qwen3-coder:free` (coder-tuned), `deepseek-v4-flash:free` (404 since Jun), `qwen3-next:free` (gone). Owner: gpt-oss via router accepted, never pinned. Voice-shift across turns accepted as entertaining; last-good still holds a named model once one succeeds. | More models = more per-model quota. New arrivals (inkling, dots-3, ling-vl, nano-omni) untested against the JSON contract — watch the salvage logs. Paid pin `deepseek/deepseek-v4.1-flash` verified LIVE same day. |
| Sep 2026 | Groq direct (visitor key) | `qwen/qwen3.6-27b` | DEAD for visitor keys (404: no such model or no access) despite the live docs page. Pinned dropdown removed same day — Groq model is now a free-text ID field, Test key verifies immediately. Llama-as-primary also rejected same day: weak prompt adherence per owner — Llama stays rescue backup only. |
| Sep 2026 | DeepInfra | `Qwen/Qwen3.6-35B-A3B` as primary | FAILED live (owner session): 2.5 min to first card, still on pass 1 at 11.5 min — session abandoned (thinking-burn confirmed) + ignores Low — Pass 1 reads as school-terms with citations, no plain words. Voice good, obedience bad. Not the quick Qwen. |
| Sep 2026 | Groq free (visitor key) | `qwen/qwen3.8-27b` | VOICE VERIFIED, QUOTA-WALLED: immediate first card, output genuinely good — but 429s inside pass 1, slow resumes, 11 min to pass 2 seat 4. Free tier can't carry a session. Second full eval Sep 17 (owner, Low, AGI-jobs question): 14.24 min + 3 resumes — too slow, but best quality so far: ideas + emotional tone held at plain level (Bloch P1 exemplar), margins voice better than DeepSeek's. AI-isms: odd metaphors ("crisis of stealing", "locking the door while inside"), mixed metaphors (Bloch), far-flung geography for German thinkers. Second full eval Sep 17 (owner, Low, new 2030 question, Groq free): pass 2
seat 4 in 7.5 min with one quota resume — fastest Qwen session yet, voice
holds (developed turns, Bookchin/Rose determinations strong, margins voice
good). New RAG visible live: [54] Social Ecology and Communalism cited.
"Robots" in the old question triggered no arm-blur this time.
Measured Groq free walls Sep 17: input TPM limit ~7K/req wall (413 at 7271;
5640 used + 5818 requested vs 7000 ITPM limit); owner day-total 66K in /
3.8K out ≈ $0.07 paid-equivalent. Paid same-ID is the obvious next test. |
| Sep 2026 | OpenRouter paid | `qwen/qwen3.8-flash` | FAILED live (owner session): reasoning burn — content null, finish `length`, reasoning trace shows it thinking about the JSON contract until cutoff; `reasoning.effort:low` ignored. 3.5 min stuck on seat 1. Same failure shape DeepSeek had pre-mitigation, unmitigable from here. Paid-pin error copy fixed same day (no more "trying the next one" on a pin). |
| Sep 2026 | Perplexity review | GPT-OSS 20B/120B on Groq | REJECTED without test: OpenAI-owned, standing rule bans OpenAI models ever (app migrates `openai/*` IDs out). GLM-5.3 Flash noted only as later non-Qwen fallback — voice unproven, not this round. Free-tier-as-production (ling, union-alpha) rejected: daily caps can't carry sessions. Perplexity's load math (7 turns/min) doesn't match us — single visitor, ~15–30 turns/session, so per-session cost rules: DeepSeek ~$0.01, Flash ~$0.02, paid 3.8-27B ~$0.20+. |
| Sep 2026 | DeepInfra | `deepseek-ai/DeepSeek-V4.1-Flash` ($0.20/$0.60) | Deliberately NOT pinned on DeepInfra — stays the OpenRouter paid default; one winner per pipe, less confusion. |
| Sep 2026 | DeepInfra | Qwen3.8-27B ($0.40/$3.00 output) | Exists on DeepInfra but rejected on price — output rate kills the value case. Groq free stays the qwen path. |
| Sep 2026 | OpenRouter paid | `qwen/qwen3.5-9b` | FAILED live (owner session): same reasoning burn as Flash — content null, finish `length`, trace shows it thinking about the persona instead of answering; 2+ min silence first. 9B can't hold the contract. Cheapest-Qwen line ends here. |
| Sep 2026 | Together | `Qwen/Qwen3-30B-A3B` ($0.30/$1.20 — priciest in the cabinet) | Still unverified AND most expensive per debate (~$0.03/5-seat). Drop candidate once the A/B settles. |
| Sep 2026 | OpenRouter | `qwen/qwen3.8-27b` (paid, ~$0.15–0.35 in / ~$2–3 out) | Exists but rejected on output price vs DeepSeek. |
| Sep 2026 | Shared/desk | Groq free-tier input wall (~7k/req, observed 413 at 7271) | Shared turns take the lean ration (2×650-char passages, trimmed PREV, note+5 survey) and run Low only; desk takes the same ration on shared/groq (history + full table lines untouched). |
| Sep 2026 | OpenRouter | `z-ai/glm-5.2:free`, `minimax/minimax-m3:free` | Retired (404). Never re-add without re-verifying. |
| Sep 2026 | OpenRouter | `openai/gpt-oss-120b` (paid) | Worked, then daily key cap hit. Removed: no OpenAI models, ever (standing rule). |
| Sep 2026 | Gemini direct | `gemini-3.6-flash`, `gemini-3.5-flash-lite` | Worked with `thinkingLevel:low`. Provider removed Sep 2026: 2.5 retired (404 for new keys), consolidating on fewer providers. |
| Sep 2026 | Gemini direct | `gemini-2.5-flash` | Retired by Google (404 for new keys). Never re-add. |

## Free-provider shelf (awesome-free-llm-apis, evaluated Sep 17 2026 — NOT tested)
Rule: these are BYOK-only candidates. Per-user/per-IP free quotas can't ride
the shared server key (one global quota = one visitor eats everyone's share).
Each needs a new provider pipe (code) unless reachable via OpenRouter paid.
- Mistral AI direct (free mode, no card, $10/mo credits): Medium 3.5 / Small 4 /
  Large 3. Real candidate — own key, generous. Caveat: prompts may train
  models unless opted out (same warning our OpenRouter copy already carries).
- Z.ai GLM-4.7-Flash (permanent free, no card, api.z.ai endpoint): free test
  of the GLM candidate. Caveats: reasoning model (burn risk); 1 concurrent
  request (slow sessions).
- Ollama Cloud free tier (ollama.com/v1, OpenAI-compatible): serves
  deepseek-v4-flash — a free backup route for our engine. Session/weekly
  limits unpublished; verify live.
- NVIDIA NIM (dev-program membership, 40 RPM/10k RPD): mistral-large-2,
  gemma-4-31b, nemotron. Generous; membership is the price.
- Cloudflare Workers AI (10k neurons/day, no card): mistral-small-3.1,
  r1-distill-qwen-32b. Non-OpenAI API shape (`/ai/run`) — moderate pipe work.
- OVHcloud anonymous (no signup, 2 RPM/IP): Qwen3.6-27B, Mistral-3.2-24B.
  Too slow for sessions (one request per 30s); curiosity only.
- Rejected from the list: gpt-oss rows (OpenAI ban); Gemini (dead for new
  keys); Kilo/LLM7 anonymous routers (random routing breaks voice continuity
  — same objection as `openrouter/free`); Cohere trial (non-commercial clause
  + 1000 calls/mo); SiliconFlow/ModelScope (ID verification); Aion (roleplay-
  tuned, wrong shape for the contract).

## Pending verification (user fetching keys)

- Together `Qwen/Qwen3-30B-A3B` — ID supplied by user, unverified against the catalog (no key yet; skip until the owner adds one).
- Alibaba Cloud Model Studio (owner account Sep 17 2026): 233 models × 1M
  free tokens each, expiring 2026-12-16. Trial goldmine, not a long-term
  dependency. Enable Stop-on-Exhaust (auto-403 instead of charges); free
  quota shared across Singapore-region workspaces only. Provider pipe built
  same day (`src/lib/alibaba.ts`, DashScope Singapore endpoint, free-text
  model code default `qwen3.8-27b`, Test-key check, usage + repair counting);
  qwen3.8-27b + qwen3.8-flash confirmed in quota, qwen3.5-9b absent.
  First live test Sep 17 (owner, `qwen3.8-27b`, Low): key accepted, voice
  good (plain, concrete Berlin-coder opening) — but 5+ min on the opening
  turn. VERDICT: too slow for sessions. Follow-up: full 90s client timeout
  on a later turn (quota is per-model, so budget remains for other codes).
  FIX Sep 17: `enable_thinking: false` per request — full sitting + 6 desk
  answers in under 3.5 min, 0 repairs. Measured: 23 calls, 168.6k in /
  5.3k out (~$0.08 paid-equivalent, $0 on trial quota). Output line proves
  the flag held (5.3k total vs 3.6k for ONE thinking turn). Quality (owner):
  best session yet — developed Low turns, Rose/Weil/Bookchin determinations
  strong, margins voice good, desk answers strong (Lenin/Kant desk openings
  too similar — scaffold variety open). PROMOTED: default while Alibaba
  trial quota lasts; DeepSeek stays fallback. Input measured far above
  estimate (168k vs ~50k guess) — desk + grounding carry full history.
- OpenRouter `meta-llama/llama-3.3-70b-instruct:free` — does NOT exist as `:free` (re-verified Sep 2026 via `/models` API, 445 models; only paid `meta-llama/llama-3.3-70b-instruct` listed). Do not add unless it appears. User reports seeing it on the website — website listing ≠ API availability.
- DeepInfra `meta-llama/Llama-3.3-70B-Instruct-Turbo` — VERIFIED WORKING end-to-end by user (test 9, Sep 2026). ID re-verified against the DeepInfra catalog Sep 2026 (public model page, JSON mode supported). Needs a card on file despite earlier no-card assumption. Full cabinet completes on it.
- DeepInfra coda/turns: unquoted-value JSON slips observed; parser salvages + repair retries cover most. Constrained decoding (`response_format: json_object` first, plain fallback on 400) added to force valid syntax — catalog confirms JSON mode support; live verdict on whether slips stop is the owner's next DeepInfra session.
