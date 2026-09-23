# Family A/B eval — Qwen-first or DeepSeek-first (Phase 7)

One fixed question, default 5 seats (Hegel, Marx, Bloch, Bookchin, Deleuze),
grounding ON, normal length. Run each pipe at Low first (default level, hardest
test). Winner takes Medium + High.

## Test dimensions (Sep 21 2026 — vary ONE axis at a time, rest stay default)

- Intensity: low / medium / high (default: the level under test).
- Output: short (normal budgets) / long (long-form budgets). Default: short.
- Re-read: full PREV / trimmed PREV — trimmed keeps the SECOND half (the
  live edge), never the opening recap. Default: full (efficient or
  free-tier walls trim automatically, tail-keep).
- Grounding: grounded (own indexed works) / profile-only. Default: grounded.
A run that moves two axes at once proves nothing — its grade cannot be
compared. Record all four settings in every tried-log row.

## The question (reuse verbatim for every run)

> Automation and robotics have replaced almost all human necessary work.
> How does this change the education system? What do we teach children?

## The high-long question (TEMPORARY default, Sep 21 2026 — reuse verbatim for every High + long-form run until replaced)

Same rules as above (fixed seats, grounding ON), long form on. This one
tests the cabinet on governance and strategy instead of a scenario:

> leftistsforAI sub on Reddit is “A space for leftists discussing Artificial Intelligence from a labor, ownership, and political-economy perspective. Topics include worker impact, platform power, automation, regulation, and collective control of Al infrastructure”. What should we encourage posts about and what types of posts should we take down as bracketed off topics which don’t benefit us?

Table rule for this question: Bookchin moderates — names the sub's actual rules, pulls the conversation back on topic, threatens bans (and means them).

The sub's bracket rule of thumb: a post that could run unchanged on a
tech-cheer sub doesn't belong on a labour sub.

Future-set for all seats (fair — none saw it), earthed in children and
classrooms rather than essences, and it splits the table: purpose and
formation one way, power over what gets taught another, organization a
third. Concrete answers (lessons, teachers, schools) and abstract ones
(what childhood is for) both count. Prior 2030 purpose-question retired
Sep 19 2026; old grades stay tied to it.

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
