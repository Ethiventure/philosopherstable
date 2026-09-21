# webapp-commons-template (staging doc)

The later app: a bare Vite shell holding this repo's content-free machinery,
so the next app starts from proven commons instead of a blank page. Status
Sep 20 2026: specified here, not yet scaffolded as its own repo. Source of
truth is this repo at the commit recorded below — re-check each module
against source before lifting it, never from memory.

Owner name pick (says what it is): `webapp-commons-template` — a web-app
shell holding the commons pattern: no signup, shared quota made fair,
accessible, static-first. Ships public on GitHub: bare Vite shell + seven
modules + one "how to tweak" doc per module.

## Policies that do NOT transfer verbatim

The template carries mechanisms, not this project's politics or taste.
Each line below is a mechanism plus the owner default that must be
re-decided per app:

- Model denylist: the mechanism is a migration guard for banned ID prefixes
  (`settings.ts` refuses `openai/*`); the "no OpenAI models, ever" rule is
  this project's policy, not the template's.
- Model picks: every default ID + `why` line is this project's verdict at a
  date. The template ships the free-text-ID + live-check + dead-ID-fallback
  machinery with placeholder IDs and a "re-verify before launch" flag.
- Aesthetic: dark-academia is this project. The template ships the *system*
  (tested font/button/accent pairs per theme, never a lone text toggle),
  not the palette.
- Voices/personas: all twelve seats, the margins writer, the desk tutor
  scaffold content stay behind. The tutor *shape* (answer → plain
  definitions → example → check question) transfers.

## Aesthetic options (one fully specified, rest later)

- Option A — dark academia (this project's house style, reference
  implementation in `src/index.css`): parchment / dim / ink-dark themes as
  tested pairs, Fell + Alegreya serif with system-sans and
  dyslexia-friendly tri-state, brass + ink accents, drop caps, card
  surfaces. Lift the token block + theme rules; re-decide the content
  typefaces per app.
- Later options (names reserved, details unwritten): add each here with
  its token block + one screenshot + its tested theme pairs. The theme
  *system* (Module 1) never changes — only the tokens do.

## Module 1 — Access + display layer

Files: `src/lib/preferences.ts`, `src/lib/tts.ts`, theme/contrast/motion
rules in `src/index.css`, Display settings tab, first-run card.
Transfers whole. Per-app work is palette + typeface only; the rules
(versioned JSON prefs, merge-with-defaults load, `prefers-reduced-motion`
first visit, voice picker with preview, chunked speech queue, `aria-live`
position-only, Esc dismisses, real buttons/inputs) stay untouched.

## Module 2 — Settings + BYOK + quota honesty

Files: `src/lib/settings.ts`, Key/Seats/Voice/Display drawer shape,
per-provider clients (`src/lib/openrouter.ts`, `groq.ts`, `deepinfra.ts`,
`together.ts`, `alibaba.ts`, `shared.ts`), `netlify/functions/`
proxy pattern, `scripts/test-keys.mjs` + `test-env.mjs` +
`test-providers.mjs` + `test-keys.env.example`.
Transfers whole minus IDs and keys. Per-app work: provider list, default
IDs with dated `why` lines, caps (per-IP + global), proxy endpoint. Rules
that ride along: keys in browser `localStorage` only (visitor) or host env
(server function) only, never `VITE_*`; free-text ID field with one-tap
live check; dead IDs migrate; quota halt shows resume / switch-provider /
usage-link recovery with progress preserved; test scripts skip keyless
pipes and never print keys. Retired-provider notes (kept for future
projects, never re-added without fresh evidence): Z.ai (`api.z.ai/api/
paas/v4/chat/completions`, GLM house — free tier, 1 request at a time so
sittings run slow, reasoning always-on with no disable flag; needs big
output caps or small caps return 200-empty; removed here Sep 21 2026
when its only model parked).

## Module 3 — LLM plumbing + eval discipline

Files: `src/lib/llm.ts` (error codes, layered salvage, repair suffixes,
`retryAfterMs`, `sharesPassage`, `detectVolatility`, usage/repair/cost
instrumentation, `RATES_AS_OF`), `src/lib/verify.ts` (quote check),
`src/lib/footnotes.ts` (`findInventedTags` + UNVERIFIED-TAGS pattern),
`scripts/test-sitting.mjs` + `test-matrix.mjs` (+ `--dry-run`), prompt/rules
version-stamp pattern, thinking-throttle flags per provider.
Transfers whole. Per-app work: rate table, repair-kind names, detector
thresholds. Rules that ride along: every graded run records model +
provider + route, prompt version, timestamp, wall time, tokens
(in/out/cached/reasoning), repair counts, cost with rate date, errors
verbatim, human grade; verdicts never transfer across versions; mechanical
shape guards retry visibly (snippet in UI, full text in console); auto
checks gate pipes, humans write verdicts. Per-constraint scorecard over
real transcripts (budgets, echo, city, loans, margins, volatility — verify,
don't compose). Model-selection funnel (full version in the project's
`docs/model-selection.md`): desk research with live lists first (IDs rot;
benchmarks filter, never vote; corpses checked), then key checks, then
single-call probes (contract, volatility, loans, load), then at most 4
sittings with fixed question/seats and mechanical pre-scores, then one
model per slot (free / value / quality) with fail-at-any-level exclusion
and written kill rules (gibberish parks entirely, burn buries, echo gets
one experiment). Crowns carry dates; re-confirm quarterly. Benchmark adaptations, method
never package (no judge model, no new deps): RAGAS faithfulness ≈
checkable-loans-or-flagged, relevancy ≈ retrieval recall, noise handling ≈
abstention traps (`docs.ragas.io`); DeepEval-style per-constraint
pass/fail gates (`deepeval.com`); Inspect-style versioned runs
(`inspect.aisi.org.uk`); FollowBench/IFEval/ComplexBench-style composed
constraints decomposed into separately graded mechanical checks
(`github.com/YJiangcm/FollowBench`,
`github.com/google/instruction_following_eval`,
`github.com/thu-coai/complexbench`).

## Module 4 — Service-desk chat

Files: `src/components/ServiceChat.tsx`, `src/lib/service-chat.ts`.
Transfers as architecture: floating button + panel + persona/topic dropdown
switchable mid-chat, tutor answer shape, per-sitting question cap with halt,
prior-chat + session one-liners as context, own-sources-only retrieval,
exchanges appended to export. Discoverable three ways (floating icon +
inline card + welcome mention). Per-app work: the personas, the cap number,
the halt joke.

## Module 5 — Backend-free RAG

Files: `src/lib/rag-search.ts`, `rag-shard.ts`, `rag-text.ts`, `porter.ts`,
`rag-ground.ts`, `scripts/rag-*.mjs` (ingest, chunk, manifest, search,
eval, inspect, translate-once), rights-gate manifest pattern.
Transfers whole. Per-app work: corpus entries, per-source rights approvals
(dated owner acts), chunk-size tuning. Rules that ride along: local SQLite
truth (gitignored) → static JSON shards; explicit rights gate refuses
before fetching; chunker version recorded, eval refuses stale contracts;
fail-soft per source with visible reasons; full text ships only with owner
approval; no vectors until eval proves lexical fails. Objective bench
(`bench-rag`, offline): round-trip id-recall as regression tripwire,
work-recall as grounding-fitness, noise probe for distractor fragility,
cross-author precision for leakage; grounded-vs-plain loan A/B proves the
passages change the prose.

## Module 6 — Diagram + generated views

Files: `src/lib/genealogy-layout.ts`, `src/components/GenealogyMap.tsx`,
`docs/diagram-style.md`, `scripts/check-diagram-geometry.mjs`,
`check-diagram-contrast.mjs`, `scripts/influence-grid.mjs` pattern.
Transfers as method: single source-of-truth table → generated view, never
hand-edit the output; geometry + contrast checkers run after palette or
data edits; full edge-list fallback beside the visual. Per-app work: the
entities, the debts table, the style recipe.

## Module 7 — Export + provenance

Pattern from the transcript exporter: continuous prose in speaking order,
reading list of stable-numbered entries with honest unlinkable marks,
provenance footer (who actually spoke, prompt version, wall/debate clocks,
per-model tokens, repairs, cost), unverified-tag section present only on
hits. Footnote numbers strip from spoken/read-aloud text. Per-app work:
the section order.

## Module 8 — Records + security

`docs/models-tried.md` tried-log (corpses stay buried), owner notebook
(`docs/things-taught.md`, plain words, newest first), prompt lineage log,
per-project dead-end log. Security sweep after any key-handling change and
on request: `check-ignore` each key file, no key files tracked, history
never held a value, examples carry names only, exports/logs print labels
never values, server keys stay `process.env`. Key files get explicit
gitignore lines, never pattern-only.

## Adaptable engines (re-skin, don't lift verbatim)

- Turn rotation / deliberation engine: passes × seats, PREV-only context,
  own-priors anti-repeat, survey of one-liners. The shapes (diagnose →
  pressure → reconstruct) are this project's; the *discipline* (one job per
  turn, word budgets as hard ceilings, closing scan last) transfers.
- Outside-reader mechanism: a non-seat voice reads one-line determinations
  and barges in with demands; seats must answer it. The voice stays behind.
- Difficulty levels: LANGUAGE-LEVEL-block-last, starve-the-simple-level,
  per-seat worked examples with failure conditions. The level *rules*
  transfer; the vocab lists don't.
- Transitional toolkit: rationed openers with spent-tracking by opening
  signature. The rationing transfers; the phrases don't.

## Stays behind (content, never scaffolded)

Seat profiles, essences, trios, debts, stock phrases, CODA/margins voice,
corpus entries and shards, RAG texts, eval transcripts and verdicts, model
rate numbers as verdicts, brand copy and palette, thread cities.

## Scaffolding order (when building starts)

Testing ships by default, not as a later pass: every module below lands
with its runnable check, and the sweep assembles them —

1. Vite shell + theme/display/accessibility (Module 1) — an app that reads
   well before it thinks at all.
2. Settings + one provider + proxy + caps (Module 2) — first paid call.
3. LLM hub + version stamp + probe scripts (Module 3) — first graded run.
4. Records + security sweep (Module 8) — before the second provider.
5. RAG (Module 5), desk (Module 4), diagram (Module 6), export (Module 7) —
   in the order the app needs them.
6. First content seat via the new-content brief, with trio + eval green.

## Open questions

- Template toolchain: same Vite + React + Tailwind + Netlify shape, or
  slimmer? Decide at scaffold time; the modules assume this stack.
- Shared-proxy quota store: in-memory caps ship first (documented limit);
  Redis upgrade path documented but unbuilt.
- Which starter content (one demo seat? one demo shard?) proves the shell
  without becoming content to delete. Current lean: none — shell only.
