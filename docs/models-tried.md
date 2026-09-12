# Models tried

Living log of every model/provider combination tested for the cabinet, newest
first. Check here before (re)trying anything — corpses stay buried.

## Verdicts

| Date | Provider | Model | Verdict |
| ---- | -------- | ----- | ------- |
| Nov 2026 | OpenRouter paid | `deepseek/deepseek-v4.1-flash` | Current paid default ($0.15/$0.60, 1M ctx). Reasoning burn observed (content null, finish_reason length) — mitigated with `reasoning.effort:low` + 4000/8000 output caps. |
| Nov 2026 | OpenRouter free cycle | Gemma/Nemotron/Nex/Laguna/Ling/North/Liquid `:free` IDs + `openrouter/free` fallback | Works, variable voice/quality. IDs rot in days — recheck via `/models` API. |
| Nov 2026 | Groq direct + shared proxy | `qwen/qwen3.8-27b`, `qwen/qwen3.6-27b` | Current free picks (30 RPM / 1K RPD / 8K TPM). Needs 2000+ output budget — tight caps truncate JSON mid-object. |
| Nov 2026 | OpenRouter | `thinkingmachines/inkling-small:free` | Dead for API keys: 403 harness-only. Never re-add. |
| Nov 2026 | OpenRouter | `z-ai/glm-5.2:free`, `minimax/minimax-m3:free` | Retired (404). Never re-add without re-verifying. |
| Nov 2026 | OpenRouter | `openai/gpt-oss-120b` (paid) | Worked, then daily key cap hit. Removed: no OpenAI models, ever (standing rule). |
| Nov 2026 | Gemini direct | `gemini-3.6-flash`, `gemini-3.5-flash-lite` | Worked with `thinkingLevel:low`. Provider removed Nov 2026: 2.5 retired (404 for new keys), consolidating on fewer providers. |
| Nov 2026 | Gemini direct | `gemini-2.5-flash` | Retired by Google (404 for new keys). Never re-add. |

## Pending verification (user fetching keys)

- DeepInfra `meta-llama/Llama-3.3-70B-Instruct-Turbo` — ID supplied by user, unverified against the catalog.
- Together `Qwen/Qwen3-30B-A3B` — ID supplied by user, unverified against the catalog.
- OpenRouter `meta-llama/llama-3.3-70b-instruct:free` — does NOT exist as `:free` (re-verified Nov 2026 via `/models` API, 445 models; only paid `meta-llama/llama-3.3-70b-instruct` listed). Do not add unless it appears. User reports seeing it on the website — website listing ≠ API availability.
- DeepInfra `meta-llama/Llama-3.3-70B-Instruct-Turbo` — VERIFIED WORKING end-to-end by user (test 9, Nov 2026). Needs a card on file despite earlier no-card assumption. Full cabinet completes on it.
