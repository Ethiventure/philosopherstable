# Model brief (for other LLMs)

Copy-paste prompt asking an outside model for model + provider + prompting
advice. Updated Sep 17 2026. Keep current: prices, dead IDs, verdicts.

---

**Our problem: pick the voice engine for a public philosophy-debate app.
Advise on model + provider + prompting.**

**The app.** Free public site, no login. A "cabinet" of 12 philosophers
debates a visitor's question over 3 passes (~15 turns). Each turn is one LLM
call returning strict JSON (four keys: negation, reformulation, new
contribution, works cited). Three language levels: Low (plain everyday
words, no jargon), Medium, High (full voice). Turns are grounded in a small
retrieval corpus of the thinkers' own texts. One shared server key serves all
visitors free; power users add their own keys (Groq, OpenRouter, DeepInfra,
Together). Full session ≈ 15–30 turns over ~6–14 minutes, one visitor at a
time, sequential — never concurrent load.

**Hard constraints.**
- No OpenAI models, ever (owner rule, non-negotiable — includes GPT-OSS).
- Prefer open-weight models; cost every paid pick per session.
- Free tiers welcomed but must survive a whole session without quota walls.

**Tested so far (all live sessions, owner-graded).**
- Qwen3.8-27B on Groq free: best voice — holds ideas + emotional tone in
  plain words, best margin notes. Fatal: 14+ min/session, rate-limit walls
  mid-session. Paid same model costs ~$0.20+/session (Groq $0.80/$4.00,
  OpenRouter ~$0.30/$2.00) and is Preview status.
- DeepSeek v4.1-flash (paid, OpenRouter/DeepInfra, ~$0.01/session): current
  engine. Holds the JSON contract, ~6 min sessions. Voice at ~85% —
  occasional AI tics (a word used in three senses across turns; staccato
  slogan compressions; decree-style closings).
- Every Qwen under 27B failed identically (3.6-35B, 3.8-Flash, 3.5-9B):
  "reasoning burn" — spends the whole output budget thinking about the JSON
  contract or persona, returns empty. Ignores reasoning-effort dampening.
- Llama 3.3 70B: weak prompt adherence. Qwen3.6-27B on Groq: dead ID
  (provider retired it without notice).
- Groq retires model IDs constantly; OpenRouter free IDs rot in days.

**The dilemmas.**
1. The voice we want lives at 27B ($2–4/1M output); everything cheap is
   either disobedient or burns. Is there a genuinely cheap (~$0.50/1M
   output or less), open-weight model with a track record of strict JSON
   obedience *and* plain-language persona voice? Name exact provider +
   model ID + price.
2. Prompt strategy: our Low-level rules ("short sentences, one idea per
   paragraph") compress one model into placards while another disobeys them
   into good paragraphs. How do you write persona+simplicity constraints
   that survive across models without per-model prompt forks?
3. Provider strategy: one provider per model, or router/aggregator with
   pinned fallbacks? How do you survive ID churn without stranding users?
4. What would you change about the turn contract itself (strict JSON every
   turn) to widen the set of models that can play?

**Grading.** A human grades every candidate on voice consistency,
instruction adherence, plain-language discipline, and pace (time to first
card; 90 seconds of silence = fail). Benchmarks don't count — only live
sessions.

**Session sizes (token counts are Perplexity's estimates, Sep 2026 —
not measured from our app; treat as budgeting guides).**
5-seat debate = 85.3k in / 3.5k out; 11-seat = 190.5k in / 7.1k out;
500-word desk chat = 21.9k in / 0.67k out. Medium ≈ +37.5% input.

**Cost per scenario (prices verified live by us unless marked *).**

| Model | $/1M in–out | 5-seat | 11-seat | Desk chat |
|---|---|---|---|---|
| DeepSeek v4.1-flash (OpenRouter) | 0.15 / 0.60 | $0.015 | $0.033 | $0.004 |
| Qwen3.8-Flash (OpenRouter) | 0.15 / 0.47 | $0.014 | $0.032 | $0.004 |
| Qwen3.5-9B (OpenRouter) | 0.10 / 0.15 | $0.009 | $0.020 | $0.002 |
| Qwen3.8-27B (OpenRouter) | 0.30 / 2.00 | $0.033 | $0.071 | $0.008 |
| Qwen3.8-27B (DeepInfra) | 0.40 / 3.00 | $0.045 | $0.097 | $0.011 |
| Qwen3.8-27B (Groq) | 0.80 / 4.00 * | $0.082 | $0.181 | $0.020 |

*Groq row from Perplexity's pull of console.groq.com, not independently
re-verified. Cost = in/1M × P_in + out/1M × P_out; Medium multiplies the
input part by 1.375.
