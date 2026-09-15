# Family A/B eval — Qwen-first or DeepSeek-first (Phase 7)

One fixed question, default 5 seats (Hegel, Marx, Bloch, Bookchin, Deleuze),
grounding ON, normal length. Run each pipe at Low first (default level, hardest
test). Winner takes Medium + High.

## The question (reuse verbatim for every run)

> AGI can now do most paid work cheaper than people, and some say humans need
> jobs to have purpose. So who works, who eats, who decides — and does the
> system that paid for the machines survive them?

Post-2020 for all eleven seats (fair — none saw it), earthed in wages and
dinners rather than essences, and it splits the table: property and ownership
one way, recognition and meaning another, organization a third. Concrete
answers (pay, kitchens, rotas) and abstract ones (what work is for) both count.

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

## Auto-metrics (assistants, not judges — human grades rule)

- Every session: **AlignScore** (Low turn vs High turn + profile) as the
  meaning-drift guardrail; flag low scores for human review.
- Once: **LENS-SALSA** calibration on a past Low session — adopt as leak
  detector only if its error tags match your leaked-term list.
- Optional, heavy: owner writes 3–5 plain refs for ~20 High sentences,
  SARI-score the Low/Med rewrites (ASSET method, EASSE run externally —
  never a repo dependency, GPL-3.0). Full notes in PLAN.md Phase 7b.
