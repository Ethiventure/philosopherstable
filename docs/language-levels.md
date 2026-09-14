# Language levels (Low / Medium / High)

How the cabinet and service desk control reading difficulty without dumbing
down the ideas. Strategy record — Run 1 evaluated Sep 2026 (Low debate FAIL
on diction, margins + High desk PASS); Run 2 fixes built, awaiting retest;
question-riff rule added after (see Evaluation).

## The strategy

One `LANGUAGE LEVEL` block rides **last** in every persona system prompt
(`src/philosophers/shared/low-style.ts`, wired in
`src/philosophers/index.ts`), so it has the final word on diction:

- **LOW:** roughly IELTS-5 English. Translate or describe difficult,
  specialist, archaic, and obscure terms in plain words instead of using
  them. Where a term has no plain equal, describe what it does rather than
  naming it. Keep an essential term only when dropping it would change the
  meaning.
- **MEDIUM:** keep important terms, explain each one naturally inside the
  sentence. No separate dictionary-style breaks.
- **HIGH:** authentic vocabulary at normal difficulty.
- All levels: preserve meaning, distinctions, reasoning. Simplify the
  language, not the ideas.

Supporting changes (same release):

- Low personas read the profile/style lines for ideas only, never borrowing
  their specialist words (`LANGUAGE_LEVELS.low`).
- All 10 `intensity.low` style sentences rewritten in plain words (no
  `compound syntax`, `polemic`, `sublation` orders).
- Turn instructions (`src/lib/dialectic/prompts.ts`) take `intensity`: Low
  gets calm-teacher heat, paraphrased (never verbatim) source loans, no
  shared specialist terms in the steelman, translated survey wording, relaxed
  novelty rule. Medium/High keep verbatim loans and combative heat.
- Service desk (`src/lib/service-chat.ts`, `ServiceChat.tsx`) has its own
  Level picker (Low — plain words / Medium — terms explained / High — full
  voice), starting at the cabinet setting. Scaffold, definitions, and
  source-quoting follow the desk level.
- Margins note never quotes seat wording or specialist terms at any level
  (`buildCodaPrompt`), so it works in Low sittings.

## Verified prompt order (Bookchin, Low, critique turn)

Built from the real builders offline (esbuild bundle, Sep 2026). System
message first, then user message. Measured sizes are chars/4 estimates with
placeholder user content — real turns add ~400–500 tokens of predecessor
text, toolkit, and optional grounding:

| Level | System | User | Total/call |
| ----- | ------ | ---- | ---------- |
| Low | ~3,660 | ~1,490 | ~5,150 |
| Medium | ~5,120 | ~1,380 | ~6,500 |
| High | ~5,110 | ~1,360 | ~6,470 |

Low is smaller because the style machinery, REGISTER, and universal
mechanisms are dropped.

System message order (Bookchin sees exactly this, top to bottom):

1. Identity line (`You are Murray Bookchin… up to 30 July 2006…`).
2. `ANALYTICAL CENTRE: hierarchy, social ecology, …`.
3. `INTELLECTUAL PROFILE` — full knowledge, academic diction (never
   abridged; ideas source, not word source).
4. `STYLE ESSENCE — LOW REGISTER`: DNA + movement + Low sentence.
5. `PLAIN RULES` (4 lines: short sentences, define terms, concessive, concrete
   consequence).
6. Role integrity (`You are NOT NEUTRAL…`).
7. `ANTI-WAFFLE RULES` + banned phrases + dialectical frame.
8. `LOW REGISTER OVERRIDE` ("…this wins, no exceptions", bans 4 insult words).
9. `LANGUAGE LEVEL — LOW` + `Simplify the language, not the ideas.` ← governs.

User message order: verbatim question → turn instruction (entry + determinate
negation + reformulation + closing + pass-3/margins lines + Low orders +
per-level voice) → predecessor full text → own priors → toolkit →
spent list → pass-3 survey (Low: translate, never reuse survey terms) →
grounding block → Low one-line plain-words reminder (`LOW_CLOSING_REMINDER`,
Low only, closest instruction to generation) → JSON shape hint (always final).

Does last position guarantee obedience? No. Recency plus explicit precedence
("governs", "wins, no exceptions") raises compliance a lot, but the model
still sees ~3,000 tokens of academic profile above. That is why the block
also says "never borrow their specialist words". Watch the eval for leakage.

Known weak spots to watch: PLAIN RULES still says `say "this means …" out
loud` (fine only for rare kept terms); anti-waffle names hard machinery
(sublation, rhizome, tectological) as examples near the end.

## Quote-example proposal (not built yet)

Idea: each philosopher gets a verified quote plus Low/Medium/High renderings
of one concept, e.g. the Hegel contradiction trio (Low translates, Medium
keeps `contradiction`/`Aufhebung` with inline gloss, High runs free).

Token math (measured base above): a trio block ≈ 200–250 tokens. Only the
active speaker's persona loads per turn, so 30 turns × ~225 ≈ +6.7K input
tokens per session on a ~165K base ≈ **+4%**. Output tokens unchanged. Verdict:
affordable, and per-minute limits (below) do not change regime.

First gold entry (illustrative — the owner's own rendering for eval
comparison, not a verified corpus quote). Concept: contradiction changes a thing.

- LOW: "A thing changes because it contains a conflict within itself. That
  conflict pushes it towards a new form. The old form does not simply
  disappear. It becomes part of what comes next."
- MEDIUM: "A thing develops through **contradiction**, because it contains a
  conflict within itself. This contradiction leads to a new form through
  **Aufhebung**, a process in which the old form is overcome but also preserved
  within what comes next. The development is therefore not a simple break with
  the past."
- HIGH: "The determinate being of the thing contains within itself the
  contradiction through which its immediacy is sublated. In this **Aufhebung**,
  the determinate form is aufgehoben, both negated and preserved, and thereby
  passes into its determinate other. What appears as mere alteration is thus the
  necessary movement of the Concept itself."

Trio planning: keep trios here as eval gold first (zero token cost, zero
prompt risk). Wire into prompts only if eval shows Low still leaks.
Per-philosopher quote openers must be real and verified against corpus
sources — never invent. Mark unverified drafts `MOCK`/`TODO(wire:)` per
standing rules.

## Cost vs rate limits (Sep 2026)

- Per-session cost on Llama-3.3-70B-Turbo is cents; a +4% prompt change is a
  fraction of a cent. Cost is not the constraint.
- Binding constraints are per-minute/rate caps: Groq free tier 30 RPM / 1K
  RPD / 8K TPM with a 1,000 output-token gate (`src/lib/groq.ts`,
  `docs/models-tried.md`); DeepInfra runs on credits that "exhaust fast on
  70B models" (`src/lib/deepinfra.ts`) with 429 → wait-and-resume handling.
- Call counts: one turn = one API call. A 5-seat sitting is 15 turns + 1
  margins call = 16 minimum, plus one repair retry per parse failure and up
  to 3 client attempts on 429/5xx. A full 11-seat cabinet is 33 + 1 = **34
  calls minimum** — fine sequentially (each call's inference time spreads
  them over many minutes, so 30 RPM never binds), but 31 × ~6.5K input
  tokens ≈ 200K input tokens per session, so DeepInfra credit burn and TPM
  bursts on retries are the things to watch. Mitigations already in code:
  `retryAfterMs` backoff, single repair retry, Resume, efficient economy
  (trims predecessor text).

## Evaluation

Protocol: same question, one sitting per level. Probe: ask each level to
explain the Hegel contradiction point, plus read one full sitting per level.

| Check | Low bar | Medium bar | High bar |
| ----- | ------- | ---------- | -------- |
| Hard terms untranslated | 0 (describe instead) | kept + glossed inline | free |
| Avg sentence length | short, one idea | mixed | long, nested |
| Hegel probe meaning kept | yes | yes | yes |
| Profile/DNA word leakage | none verbatim | — | — |
| Loans quoted verbatim | never (paraphrase) | glossed | verbatim ok |
| Heat | calm teacher | light combat | full fight |

### Run 1 (Sep 2026) — Low debate + High desk, DeepInfra Llama-3.3-70B-Turbo

Question: autonomous AI agents for positive social change. 5 seats
(Spinoza, Kant, Hegel, Lenin, Deleuze) × 3 passes + margins note + 2 High
desk answers (Deleuze). Grounding was on (reading list of 9 sources).

Low debate verdict: **FAIL on diction, PASS on meaning.**

- Hard terms kept untranslated throughout: `perpetual peace`, `federative
  union`, `moral politician` (Kant); `self-consciousness`, `ethical life`
  (Hegel, repeated verbatim many times); `deterritorialization`, `lines of
  flight`, `dividuation/dividuals` (Deleuze); archaic Ethics quotes
  (`womanish pity`, `sufficient money or other commodities`) in Spinoza P1.
- Long multi-clause sentences everywhere, not one-idea paragraphs.
- Root cause found: both grounding blocks (`formatGroundedBlock` in
  `src/lib/extract.ts:84`, index block in `src/lib/rag-ground.ts:118`)
  order verbatim borrowing **unconditionally** — "prefer the passage's own
  terms over your stock summary" — contradicting the Low paraphrase rule.
  With grounding on, Low gets two opposing orders and the nearer, more
  specific one wins. Second contributor: the full academic profile (~3K
  tokens) sits above the language block and gets mirrored.
- Meaning and dialectical movement preserved: critique chains, steelman
  openings, and pass-3 answers all present.

Margins pipeline verdict: **PASS.** Paraphrased Thesis Eleven opener, plain
voice, picked a real absence (disability/accessibility), asked 3 concrete
questions — and pass-3 seats named the note and answered (unions, living
wage, community-led projects).

High desk verdict: **PASS on voice, one bleed noted.** Terms, verbatim
single-quote loans, sources shown, example + check question all present.
But Q1 asked for a turn-by-turn summary and got an overview instead:
`renderAntiWaffle()` (with ANTI-SUMMARY) rides in every persona including
the desk's, so the tutor refuses sequential summaries.

Follow-ups (Run 2, built Sep 2026 — await retest): per-level grounding
blocks now exist — at Low both the indexed block (`searchThinkerPassages`,
`src/lib/rag-ground.ts`) and the live-fetch block (`formatGroundedBlock`,
`src/lib/extract.ts`) order paraphrase-only and ban verbatim loans, with the
cabinet passing `snap.intensity` (`src/App.tsx`); Medium/High keep verbatim
borrowing. The desk is exempt from anti-summary via a trailing DESK OVERRIDE
in `buildServiceSystemPrompt`, and desk source loans stay verbatim at every
desk level by owner decision (quotes are checkable against shown sources; the
tutor's own words still follow the desk level). Open question from
Run 1: confirm whether long-form was on before treating long P3 turns as
budget overshoot.

Run 2 add-on: every voice at every level must paraphrase and riff on the
user question itself, never repeating it verbatim — a standalone QUESTION
RULE in the turn instruction (plus opening turn, desk system prompt, coda
prompt), after the embedded five-word clause proved too weak.

Run 3 add-ons (built, awaiting retest): Low assumes a reader who finished
high school and never studied philosophy; Medium requires term-by-term
coverage (no specialist word stands without its plain meaning in the same
sentence). RAG selection now ranks passages matching 2+ query terms above
scattered single-term hits (`src/lib/rag-search.ts`) — the retrieval eval
harness stays green with no regressions, though its verdict was already
passing before, so live sittings are the real test.

## Transfer notes (other apps)

- Pattern: `LANGUAGE LEVEL` block rendered last in the system prompt at every
  setting, not just the simple one — Medium and High need definitions too,
  or "simple mode" drifts.
- Profile/knowledge stays full; only diction is governed. Add an explicit
  "ideas only, never borrow words" line or the model mirrors the reference
  text's register.
- Per-turn instructions must match the level (loans, heat, quoting rules) —
  persona-level rules alone get overridden by louder turn machinery.
- Few-shot trios: keep as eval fixtures first; promote into prompts only on
  measured need. Per-speaker examples cost ~4%/session here, not ~10× —
  only active-speaker context loads.
