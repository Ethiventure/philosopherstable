# Models tried

Living log of every model/provider combination tested for the cabinet, newest
first. Check here before (re)trying anything — corpses stay buried.

## Verdicts

| Date | Provider | Model | Verdict |
| ---- | -------- | ----- | ------- |
| Sep 2026 | OpenRouter paid | `deepseek/deepseek-v4.1-flash` | WORKING, graded live by owner: quick starting, main turns good, full session ~6 min. Desk path threw one transient empty-body on the same model (new logging caught it); desk paid path now retries once on server errors. Formal trio-rubric half still open. |
| Sep 2026 | OpenRouter free cycle | Router-first + 19-model named bench = full live coverage (all 20 free minus the content-safety filter, verified via `/models` API Sep 15 2026), ordered by context desc (1M inkling ×2 / Nemotron ultra+lightning → 512k dots-3 → 262k Gemma/Ling/Nex/super/Laguna → 256k nano-omni-reasoning + north → 65k liquid → 32k glm-5.2 relisted). Removed: `qwen3-coder:free` (coder-tuned), `deepseek-v4-flash:free` (404 since Jun), `qwen3-next:free` (gone). Owner: gpt-oss via router accepted, never pinned. Voice-shift across turns accepted as entertaining; last-good still holds a named model once one succeeds. | More models = more per-model quota. New arrivals (inkling, dots-3, ling-vl, nano-omni) untested against the JSON contract — watch the salvage logs. Paid pin `deepseek/deepseek-v4.1-flash` verified LIVE same day. |
| Sep 2026 | Groq direct (visitor key) | `qwen/qwen3.6-27b` | DEAD for visitor keys (404: no such model or no access) despite the live docs page. Pinned dropdown removed same day — Groq model is now a free-text ID field, Test key verifies immediately. Llama-as-primary also rejected same day: weak prompt adherence per owner — Llama stays rescue backup only. |
| Sep 2026 | DeepInfra | `Qwen/Qwen3.6-35B-A3B` as primary | FAILED live (owner session): 2.5 min to first card, still on pass 1 at 11.5 min — session abandoned (thinking-burn confirmed) + ignores Low — Pass 1 reads as school-terms with citations, no plain words. Voice good, obedience bad. Not the quick Qwen. |
| Sep 2026 | Groq free (visitor key) | `qwen/qwen3.8-27b` | VOICE VERIFIED, QUOTA-WALLED: immediate first card, output genuinely good — but 429s inside pass 1, slow resumes, 11 min to pass 2 seat 4. Free tier can't carry a session. Paid same-ID is the obvious next test. |
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

## Pending verification (user fetching keys)

- Together `Qwen/Qwen3-30B-A3B` — ID supplied by user, unverified against the catalog (no key yet; skip until the owner adds one).
- OpenRouter `meta-llama/llama-3.3-70b-instruct:free` — does NOT exist as `:free` (re-verified Sep 2026 via `/models` API, 445 models; only paid `meta-llama/llama-3.3-70b-instruct` listed). Do not add unless it appears. User reports seeing it on the website — website listing ≠ API availability.
- DeepInfra `meta-llama/Llama-3.3-70B-Instruct-Turbo` — VERIFIED WORKING end-to-end by user (test 9, Sep 2026). ID re-verified against the DeepInfra catalog Sep 2026 (public model page, JSON mode supported). Needs a card on file despite earlier no-card assumption. Full cabinet completes on it.
- DeepInfra coda/turns: unquoted-value JSON slips observed; parser salvages + repair retries cover most. Constrained decoding (`response_format: json_object` first, plain fallback on 400) added to force valid syntax — catalog confirms JSON mode support; live verdict on whether slips stop is the owner's next DeepInfra session.
