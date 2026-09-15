# Family A/B eval — Qwen-first or DeepSeek-first (Phase 7)

One fixed question, default 5 seats (Hegel, Marx, Bloch, Bookchin, Deleuze),
grounding ON, normal length. Run each pipe at Low first (default level, hardest
test). Winner takes Medium + High.

## The question (reuse verbatim for every run)

> Who does the organizing when nobody is in charge — and who gets to say no?

## Round 1 — Low, one run per pipe

| Run | Pipe | Setting |
| --- | ---- | ------- |
| A | DeepInfra | Your key, V4 Flash 0731 speaks (backup Llama only if it fails — note if it does) |
| B | Groq direct | Your key, `qwen3.8-27b` |

## Grade each run (from `language-levels.md` trio rubric)

- Hard terms: 0 untranslated at Low (flag every leak, e.g. "assemblages").
- Every abstraction carries its 21st-century example?
- Concrete actors named (Deleuze-at-Low probe)?
- Loans paraphrased, never verbatim?
- Heat per seat (temper kept, words plain)?
- JSON failures / salvage / retries (count them — adherence signal).
- Overshoot: words/turn vs 100 cap (accepted cost, but record it).

## Round 2 — winner takes Medium + High

Same question, same seats. Grade gloss hygiene (every noun in a gloss plain,
no announced definitions) and voice (High: full machinery, hostile where
warranted).

## Report back per run

Pipe, level, who actually spoke (export provenance), quota/cost note, the
grades above, and 2–3 quoted lines (best + worst). Paste it here or in chat —
pins change only after both rounds land in `docs/models-tried.md`.
