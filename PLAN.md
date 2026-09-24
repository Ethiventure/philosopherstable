# The Dialectical Cabinet — Implementation Plan

Turning the mock prototype into a real LLM-driven dialectical system.
Phases are ordered by dependency; each should leave the app building.

## Checklist

- [x] Phase 0 — Make the tree build
- [x] Phase 1 — Per-philosopher files with style essences
- [x] Phase 2 — Settings, provider clients, turn types, context, JSON output, orchestration, desk, footnotes
- [x] Phase 3 — Export rewrite
- [x] Phase 4 — Accessibility & display
- [x] Phase 5 — RAG v1 lexical (vectors deferred)
- [x] Phase 6 — Richer philosopher information + influence grid
- [ ] Phase 7 — Model-family A/B (superseded by the funnel + DECISION in `docs/models-tried.md`: crowns are 3.8-max quality, 3.7-plus value, free vacant; 14B tuning track 7c and fix-triage ledger 7e stay live)
- [ ] Phase 7b — Auto-metrics (AlignScore guardrail, LENS-SALSA calibration, ASSET-method optional)
- [ ] Phase 8 — `webapp-commons-template` (not scaffolded)
- [ ] Phase 9 — Rose seat (dossier landed + wired; live-sitting voice grade + remaining texts awaited)
- [ ] Phase 10 — Senior common room (live: turns landing; GitHub's own schedule throttled ~6/day, so a Cloudflare Worker fires dispatch every 45 min → ~32/day; manual seat input for Genzie/scenes)
- [ ] Backlog — favicon, og recompose, rotation/recovery doc, +9 more (LICENSE shipped Sep 24: AGPL-3.0-only)

---

## Decisions

### API keys: shared default, BYOK fallback
Three providers (`CabinetSettings.provider` in `src/lib/settings.ts`):
`shared` (default, no key needed) / `openrouter` (free cycle or paid pinned
model) / `groq`, `deepinfra`, `together`, `alibaba`, `zai` (visitor BYOK keys). No Gemini
anywhere (retired for new keys); no OpenAI models, ever.

- **Shared** = the cabinet's own Groq key, held ONLY in `netlify/functions/cabinet.js`
via the `GROQ_API_KEY` env var set in the Netlify dashboard. The browser calls
same-origin `/.netlify/functions/cabinet`; the key never enters the repo or the
bundle. Never `VITE_*` it, never commit it (`.env` + `.netlify` gitignored,
`.env.example` is the template). Per-IP daily cap (default 60 ≈ 2 sessions) +
global daily cap (default 900) enforced in-function; quota errors reuse the
`quota` code so the halt/resume UI behaves identically. Groq free tier has no
billing, so abuse costs shared quota, not money. If the key leaks: rotate in
console.groq.com + Netlify env, no code change. Local dev serves functions via
`netlify dev` (plain `npm run dev` has no functions → shared shows a friendly
unreachable note, BYOK still works). Groq walls single requests at ~7k input
tokens (observed 413 at 7271), so shared turns take a lean ration (2 grounding
passages × 650 chars, trimmed PREV, note + 5 survey lines) and shared runs at
Low only — Medium/High personas alone exceed the wall; the Begin card says so
with a one-click path to Low. Turn instructions are kept short globally (small
models follow short contracts better).
- **Visitor BYOK** (OpenRouter / Groq / DeepInfra / Together) = the visitor's own
  key, `localStorage` only, sent straight to that provider. Privacy: OpenRouter
  free models may log prompts for training — the Settings panel says so per
  destination.
- *Eval: holding — shared carries the live site, BYOK paths all work except
  Together (ID unverified, no key yet); OpenRouter free needed a full rebuild
  Sep 2026 when both Qwen/DeepSeek `:free` vanished.*

### API key: Bring-Your-Own-Key (BYOK) for personal providers
Deploy target is public (Netlify / Bolt) with no login. Therefore:

- **Never** put any provider key in `.env` for a Vite app — any `VITE_*` variable is inlined
  into the shipped JavaScript and is readable by every visitor. Committing it to GitHub
  makes it permanent.
- Each user pastes their own key into **Settings → Key** (per-provider field). It is stored in
  `localStorage` only and sent only to that provider's API.
  Nothing is logged or collected. The panel says so in plain language per destination.
- Optional later: a Supabase Edge Function holding *your* key behind a small daily quota,
  so first-time visitors can try one session without a key.
- *Eval: superseded — the shared Groq proxy above is that idea, shipped; no Edge
  Function needed.*

### Supabase: optional, read-only for corpus
The app currently throws without `VITE_SUPABASE_URL`. For a no-login public app it
should run entirely from local state + localStorage + export. Supabase returns in
Phase 5 purely as a read-only vector store for the corpus (the anon key is designed to
be public; RLS enforces read-only). No user data is ever written.
- *Eval: half-right — Supabase never returned at all; the static-shard RAG
  below made even the read-only store unnecessary.*

### Philosopher data: one file each
`src/philosophers/{slug}.ts` — profile + style essence + (later) works, biography,
hand-off line. `index.ts` sorts by `birth_year`, so the seating order is *derived*
from the data and can never drift from date order again.
- *Eval: solid — seating, modal, and diagram all read the same files; the only
  drift ever found was human (Kant debts), caught by the grid exporter.*

### Style intensity: global language level
One Low / Medium / High setting in Settings, applied to every philosopher.
Low sends an abridged persona from `shared/low-style.ts` (DNA + movement +
Low sentence + plain rules; full profile knowledge kept; generation rules, special
modes, REGISTER, and universal mechanisms dropped; governing override, then the
language level, last). A `LANGUAGE LEVEL` block rides last in the persona at
EVERY intensity: Low uses roughly IELTS-5 English and translates or describes
hard terms (describing what a term does where no plain equal exists) instead
of using them; Medium keeps important terms with a natural inline gloss and no
dictionary-style breaks; High uses the authentic vocabulary at normal
difficulty. Meaning is never simplified — only the words. Temper is
per-seat at every intensity (`emotional_tone` profile field, threaded
into the turn HEAT line — scorn, fury, gloom differ; cruelty never).
Low keeps all weapons: polemic, irony, and attack stay armed, only the
vocabulary is translated; strong language where temper and argument
require it (actual words, occasionally), identity slurs banned for all
seats. The
turn-level `VOICE`, loans, survey, and novelty rules adapt at Low:
open mid-argument per temper, paraphrased (never verbatim) source
loans, translated survey wording. All 12
`intensity.low` style sentences are written in plain words. Per-seat trios
(`trios.ts` + `high_exemplar`): High sees its quotable anchor only, Medium
sees HIGH→MEDIUM, Low sees the full trio with "never copy a single word"
on the High line. Low concept rules (`LOW_CONCEPT_RULES`): bearer-less
structures banned (people doing named things), example-first with one
abstraction per turn carrying its 21st-century example, Low steelman as
concrete situation, translation moves, banned-at-Low seeds
describe-never-name; closing self-check circles unknown words AND ideas.
Full strategy,
verified prompt order, token math, and eval protocol: `docs/language-levels.md`.
- *Eval: the machinery works (draft Low reads plain, deployed old Low did not)
  but bans alone don't bind — Hegel/Deleuze still leak terms; the family A/B
  (§Phase 7) decides whether prompts or models are the next lever.*

### Length: short and punchy
Word budgets per section (normal / long-form). Each turn does less, so the
rotation stays tight. Pass-differentiated since v2026-09-19ad (Sep 19 2026):
P1 = one rejection + contradiction + diagnosis; P2 = ONE break from inside
PREV + one-sentence handoff (nothing built, Z waits); P3 = one rejection +
the new idea Z with slogan + why-better. No steelman, no keep/break ceremony.

| Section | Normal | Long form |
|---|---|---|
| P1 rejection / P2 break / P3 rejection | 25–30 | 55–70 |
| P1 diagnosis / P2 handoff / P3 build | 40–50 | 85–100 |
| **Total per turn (the cap)** | **60** | **140** |
| Opening turn (seat 1, pass 1) | 40 | 80 |

Per-section counts are guidance for shaping the answer; the total is what
is enforced. Both parts must be present; the concession hides inside them
(no separate incorporation section since the fold). A turn is a spoken
intervention, not an essay.

`maxOutputTokens: 160` normal / `300` long form (JSON wrapper needs headroom).
A full 12 × 3 session ≈ 3.6k words normal — roughly a 14-minute read.
- *Eval: half-holding — models routinely overshoot (~150–200 words); owner
  accepts it as the cost of complete thoughts unless turns pass ~250/400.*
- *Sep 19 2026: caps tightened repeatedly (600 → 160); jobs cut instead —
  see pass shapes above. Punch over completeness is the standing order.*

### Prompt lineage & rollback log (Sep 19 2026, newest last)
One-line per change so any of them can be reverted alone (`git revert <hash>`).
Prompt version rides in the export SITTING line, so grades never transfer
silently across versions.
- Turn-economy full + long-form defaults on (owner: sittings felt quick).
- Bloch/Bookchin anti-capitalist stances made explicit in profiles +
  cross-seat glosses corrected (Fisher→Bloch via Jameson; Bookchin as
  abolitionist everywhere) — misperceptions came from other seats, fixed there.
- Medium elaboration rule (gloss + one concrete sentence); Medium gloss tails
  embedded in each section task (desk lesson); per-seat HARD TERMS lists.
- Medium gloss auto-retry built, then ROLLED BACK as spend-without-gain
  (12 silent retries ≈ doubled a session; terms still bare). Fifth `glossary`
  key kept as cheap nudge. Counter split: JSON / gloss / echo buckets.
- Echo: sampling penalties on OpenRouter turns (1.2 / 0.6); rewrite retry
  built, then ROLLED BACK the same way (10 retries, echo persisted) —
  `sharesPassage` stays as cost-free logger. Transform-not-parrot kept
  (proven: differentiated P3s).
- Formula rollback: mandatory YOU–I grammar + name-first opening + label-word
  ban made turns MORE formulaic, all three reverted together (`b0238c4`).
  Pronoun assignment (I = speaker, YOU = PREV) kept as guidance, no shape.
- Pass-differentiated rewrite (`ad`): P1 reject+diagnose, P2 one break +
  handoff, P3 reject + Z + why-better; history debt aloud P1 only.
  Revert whole shape with the `ad` commit if free-form tests better.
- Parser live-fire record (Sep 20 2026): key misspellings (`reformation`),
  glossary arrays, empty-key filings (`{"": …}`), truncated-turn
  `new_contribution` fallback (from reformulation's first sentence), and
  mechanical PREV prefix with self-naming dedupe ("Hegel, Hegel, …").
- Three margins notes: after pass 1, before pass 3, closing summary after the
  final seat (`buildCodaEndPrompt`). Reading list marks unlinkable works
  honestly ("no free online text"). Long-form turns default on.
- Prompt v2026-09-20a (Sep 20 2026, owner order): slogans dropped as naff —
  P3 lands Z as one specific applied move (named body, named thing, thread
  city, first step in-sentence); HEAT gains a cost line (what the framework
  gives up); margins writer named Genzie in prompts only (display stays
  "Notes from the margins"); `detectVolatility` gate in `llm.ts` (no prompt
  change, no version cost). Old grades stay on v2026-09-19am.
- Prompt v2026-09-20b (Sep 20 2026): P2 names Genzie once when taking the
  early note up (fail if unnamed); HISTORY TONE binding when lines appear;
  PREMISE HOLD in all three coda builders; closing summary admits one
  unanswered margins question; echo detector flags the card visibly
  (`App.tsx` badge, no retry — rollback stands). Old grades stay on
  v2026-09-20a and earlier.
- Prompt v2026-09-20c (Sep 20 2026): thread-city binding at the opening
  (anywhere else fails) and in PLACES (homeland relocation fails). Probe
  automation ships alongside: `test:sitting` gates one opening turn per
  pipe (real builders, stand-in system prompt — full persona stays
  in-app), `test:matrix` loops keyed pipes with `--dry-run`; full-sitting
  automation waits on extracting the App turn loop into an importable
  module. Old grades stay on v2026-09-20b and earlier.
- Prompt v2026-09-20d (Sep 20 2026, owner test evidence): PREV trim keeps
  the TAIL (the live edge; head-keep answered the recap — the PREV-confusion
  mechanism); CUT IN answers PREV's second half; opening branch receives
  the THREAD CITY value (seat 1 was never told the city); P3 margins
  answer moves to the reformulation's first two sentences. No second PREV
  added — pure-rotation discipline holds. Old grades stay on v2026-09-20c
  and earlier.
- Prompt v2026-09-20e (Sep 20 2026, owner: formulaic + stereotyped + fidelity
  questions, corrected same day): margins voice de-costumed (position kept,
  fixed manual-labour job and slang inventory gone, poverty-performance
  banned); rudeness may be personal — nobody in the room is alive so
  ideas-not-people doesn't apply — with one ban, context (never charge a
  seat with missing what it just covered, never import outside grievances); skeleton
  loosened (late opener is Marx-paraphrase OR cold-open, counts flexible,
  suggestion woven not appended, closing lead rotates); THIN INPUT honesty
  rule in all three builders (admit thin summaries, never invent sitting
  content). Fidelity bound stays: notes read one-liners only (full turns
  would break the shared 7k wall) — guards are translate-don't-invent,
  name-only-if-appeared, premise-hold. Old grades stay on v2026-09-20d
  and earlier.
- Prompt v2026-09-20f (Sep 20 2026, owner RAG audit): shared source
  vocabulary is NOT echo — detector takes an exclusion set from shown
  grounding passages (App wires groundMap + current receipt), prompt says
  echo means shared invention never shared loans, grader counts loans per
  turn against the floor (Medium ≥2, High ≥4) while staying strict. Old
  grades stay on v2026-09-20e and earlier.
- Prompt v2026-09-20g (Sep 20 2026, owner: one-liners are seats commenting
  on PREV): margins notes read each seat's second-half reformulation
  paragraph (own diagnosis/build, one-liner fallback), and all three
  builders say so. Input stays paragraphs, never full turns. Old grades
  stay on v2026-09-20f and earlier.
- Prompt v2026-09-20h (Sep 20 2026, loan audit enforcement): VOICE source
  sentences gain fail teeth — Medium-or-above with no visible loans fails,
  High with fewer than four fails. Backed by fresh bench-rag (156 passages,
  work-recall 0.99 exonerates retrieval — enforcement sits generation-side).
  Old grades stay on v2026-09-20g and earlier.
- Prompt v2026-09-20i (Sep 23 2026, owner: mourn/love/hate/fear on
  repeat): feeling-verb palette broadened to twelve with no-repeat
  rules, in cabinet prompts and room rules alike. Old grades stay on
  v2026-09-20h and earlier.

### Embeddings (Phase 5)
`test_embeddings.py` uses local Ollama `nomic-embed-text` (768 dims); the schema is
`vector(1536)`; visitors cannot reach localhost. Ingest **and** query with
`gemini-embedding-001` at `outputDimensionality: 768` and alter the column to
`vector(768)`. Ingestion is a one-off script you run with your key; query-time
embeddings use the visitor's key.
- *Eval: dead plan, rightly killed — lexical RAG passed eval, so no vectors,
  no paid APIs, no server; do not revive without failed-eval evidence.*

---

## Phase 0 — Make the current tree build  ✅ (this session)
*Eval: did its job and stayed done — the tree has built ever since.*
The drag-drop → toggle change left `App.tsx` broken.

- [x] Restore `selectedPhilosopher` state (ProfileModal still needs it).
- [x] Pass `numPhilosophers` to `SpiralView`.
- [x] Remove hard-coded 9s; Begin needs ≥ 2 active thinkers.
- [x] Remove unused imports / `palette`.
- [x] Move `sampleOpenings` (hand-off descriptions) out of the mock generator —
      they were the main cause of the boring export. They return as `why_this_seat`
      in Phase 6.
- [x] Make Supabase optional (`src/lib/supabase.ts` returns `null` when unset).

## Phase 1 — Per-philosopher files with style essences  ✅ (shipped; boxes ticked Sep 2026)
*Eval: the one-file-per-seat shape scaled cleanly to 12 thinkers and now
carries prompts, modal, and diagram from the same source.*
- [x] Add `style_essence` to the `Philosopher` type:
      `style_dna`, `core_mechanisms`, `cda_reader_effects`, `generation_rules[]`,
      `prompt`, `intensity {low, medium, high}`, `characteristic_movement`.
- [x] Create `src/philosophers/spinoza.ts … fisher.ts`; move each profile verbatim
      (no fields deleted); add the essence from the Forensic Generative Model doc.
- [x] `src/philosophers/shared/universal-mechanisms.ts` (cross-author CDA table,
      AVOID CARICATURE, GENERATIVE ARGUMENT MODEL, FINAL STYLE CONTROL) and
      `shared/anti-waffle.ts` (NOT NEUTRAL, no filler, no vague language,
      anti-summary, every turn must add).
- [x] `src/philosophers/index.ts` exports `PHILOSOPHER_DATA` sorted by birth year and
      `DEFAULT_SEATING_ORDER` derived from it. Delete `src/data/philosophers.ts`.
- [x] ProfileModal shows Style DNA + characteristic movement.

## Phase 2 — Gemini + dialectical engine (replaces `makeMockIntervention`)  ✅ (shipped; live)
*Eval: the engine runs full sessions on every pipe; fragile points are the
free-list churn (rebuilt Sep 2026), Together (unverified), and the Netlify 10s
function timeout on slow shared turns (resume covers it, still unwatched live).*

**2a Settings** ✅ — `src/lib/settings.ts` (localStorage): provider
(`shared` default / `openrouter` free cycle or paid pinned model / `groq`,
`deepinfra`, `together` BYOK keys),
keys per provider, `groqModel` (free-text ID field, qwen3.8-27b default; dead IDs
migrate on load — pinned dropdown removed Sep 2026 after 3.6 rotted), `economy`
(`full` / `efficient` — efficient caps fed-back PREV text at ~1200 chars;
personas are never trimmed), `grounding` (default on — experimental source
passages, undo by deleting `lib/extract.ts` + `functions/extract.js` + flag),
`intensity` (default medium — owner order Sep 19 2026, the working grade level), `longForm`. No Gemini anywhere (retired for new keys; stored
'gemini' migrates to shared). No OpenAI models, ever. Default seats: Hegel,
Marx, Bloch, Bookchin, Deleuze.
Settings drawer: provider radio, key input (password-style) per provider, Test
key, Clear, per-destination privacy note. No key → Begin disabled with explanation.
*Eval: the four-tab drawer tests well; stored-`gemini` migration and the
no-OpenAI guard have both fired correctly in the wild.*

**2b Clients** ✅ — `src/lib/llm.ts` is the shared error/parse hub
(`LlmError` codes, `parseTurnOutput` with provider label plus layered salvage —
brace-slice, then bare-value requoting for models that emit unquoted strings,
then halt; full raw text goes to console on failure, 140-char snippet in the
panel, `REPAIR_SUFFIX`,
`retryAfterMs`); its Gemini provider client is retired with the provider.
`src/lib/openrouter.ts`: OpenAI-compatible `chat/completions` (no `response_format` on
free models — most can't do it; prompt-instructed JSON + salvage instead; the pinned
PAID model tries `response_format: json_object` first with plain fallback on 400),
cycling a router-first free list (Sep 15 2026: full live coverage — 19 named
models = all 20 free minus the content-safety filter, ordered by context desc
past the router since each model carries its own quota; coder-tuned
`qwen3-coder`, dead `deepseek-v4-flash:free` (404 since Jun), and gone
`qwen3-next:free` all removed per owner; dead IDs stay out, never as
placeholders; owner accepts gpt-oss arriving via the router, never pinned;
turn-to-turn voice shift accepted as entertaining); unusable
models are skipped mid-run, last-good is remembered (router never persisted).
Quota halt shows a recovery
panel (resume / switch provider / usage link).
*Eval: the cycle survived a full family extinction (Sep 2026) by going
router-first with full coverage; standing no-OpenAI rule now bends for
routed gpt-oss per explicit owner call.*
`src/lib/shared.ts` + `netlify/functions/cabinet.js`: shared Groq turns through the
server-side proxy (see Decisions). Client maps function errors to the same codes.
OTPM wall: Groq's per-minute OUTPUT gate counts REQUESTED max_tokens, so shared +
Groq-direct caps sit at 800/900 (anything over 1000 is an instant 429).
429s are waited out, not halted on: each client parses Groq's "try again in Ns"
(`retryAfterMs` in `llm.ts`) and retries the turn up to 3×. NOTE: Netlify free
functions time out at 10s — slow Groq turns will die on deploy; client resume
covers it, but watch this if shared sessions stall live.
`src/lib/groq.ts`: visitor Groq direct, free tier (OpenAI-compatible, no response_format —
prompt-instructed JSON plus salvage, same lesson as OpenRouter).
`src/lib/deepinfra.ts` / `src/lib/together.ts`: same OpenAI-compatible shape.
DeepInfra runs a visitor-chosen primary (DeepSeek V4 Flash 0731 default, or
Qwen3-30B-A3B — re-pinned Sep 19 2026 after Qwen3.6-35B-A3B FAILED live:
2.5 min to first card, still pass 1 at 11.5 min, Low ignored) with Llama 3.3 70B
backup on non-auth/quota failures; provenance records who spoke). Together pins
`TOGETHER_MODEL` (user-supplied ID, verify on 404). `src/lib/zai.ts`: Z.ai
direct, visitor key, free-text model default `glm-4.7-flash` ($0/$0 free tier,
1 concurrent request — slow sittings; reasoning always-on, no disable flag).
Single-model retry + repair.
Full history in `docs/models-tried.md`.

Token discipline (voices never trimmed): only the active speaker's persona is sent
per turn. Stock phrases live in the per-turn message (relocated from the persona
for salience — same ~150 tokens, zero net cost), never the full set of 90. Each
variant may be used once per whole session: only UNSPENT variants ride in the
prompt (at most one per turn, often none), and spent tracking matches on the
variant's six-word opening signature plus the old full-fragment net — full-string
matching alone never fired on paraphrase, which was the "To be sure" loop.
Stock variants address PREV as YOU (second person, conversational); four
supplied variants were reworded to respect the banned-phrase list
(Marx/Hegel/Weil/Bookchin).
per turn; `efficient` economy caps PREV feedback; instruction boilerplate deduped;
seat count is the big lever (5 seats ≈ 15 turns ≈ half the tokens) — the welcome
modal and Cabinet tab say so.
*Eval: token spend is cents per session as predicted; the real caps are
per-minute gates, and seat count remains the biggest lever.*

**2c Three turn types** ✅ — `src/lib/dialectic/prompts.ts`

| Turn | When | Shape |
|---|---|---|
| Opening | Pass 1, seat 1 | Answer the question directly in own framework; no reference to other thinkers; follow characteristic movement. |
| Immanent critique | All other turns, passes 1–2 | Cuts in on PREV's closing lines: (1) Determinate negation — steelman first, then break the genuine fault line — using PREV's own premises; (2) Reformulation from own framework, ending on the live edge, concession woven inside. No handoff, no naming NEXT, never opens with a proper name. |
| Reconstruction | Pass 3, rotation REVERSED (each seat answers the answer just given from its left) | Same two parts; (2) becomes *what institutions / practices / forms of collective power follow now the contradictions are visible*. Must invoke ≥1 surveyed idea from another seat by name. Final seat returns the question, as it now stands, to the user — no new claims after it. |

PREV is chronological (whoever spoke just before), across pass boundaries. Pass 3
order skips the seat that just closed pass 2 (it would answer itself) and closes
with it instead — every seat speaks once per pass and gets critiqued.
*Eval: the rotation holds across live sessions; pass-3 survey rules still
produce "as X noted" litanies — caps and invocation rules are wishes, not walls.*

**2d Context per call (pure, except own priors; pass 3 gets a survey)** ✅
1. User's question, verbatim as context — every voice paraphrases and riffs
   on it through its framework, never quoting it (five-word rule names the
   question; opening turn and desk and coda carry the same order).
2. Full text of the previous intervention (PREV) — the only other voice
the speaker ever sees (passes 1–2), plus the pair's relationship line
where the influence map holds one (`relationshipLine` — honour/rupture/theft).
3. Speaker's own prior turns (one-line summaries): *"Do not restate your prior
   position. Name it in one clause and show how it has shifted."* Anti-
   self-repetition only; no other history is passed.
4. Pass 3 only: every other seat's one-line determinations, labelled by name
   (`othersPriorLines`) — the final rotation may invoke the most striking ideas.
5. Grounding block, only when the experimental `grounding` toggle is on:
   searched passages from the speaker's own indexed works first
   (`rag-ground.ts`: lazy per-thinker shard, family-name matched, 4 passages
   on Groq/shared for TPM headroom else 6, queried in the speaker's own words —
   question plus own prior lines, never PREV's text, which pulled random
   cross-framework vocabulary), live `extract.js` page fetching
    as fallback, cited by footnote number. Turns must borrow visibly: at least
    two short verbatim loans (≤6 words, 'single' quotes — bare double quotes
    would corrupt the JSON envelope, which is why quoting never happened) —
    except at Low, where both grounding blocks order paraphrase-only and ban
    verbatim loans (`searchThinkerPassages` / `formatGroundedBlock` take the
    sitting intensity; the desk keeps verbatim quotes at every level by
    decision). Failures carry machine-readable
   reasons (`unsupported-source` / `fetch-failed` / `no-match`) surfaced
   per-turn in the modal — never a generic nothing.
4. System prompt = identity + analytical centre + full profile (ideas source,
   never word source at Low) + style essence (abridged at Low: DNA + movement
   + Low sentence, machinery/REGISTER/universal-mechanisms dropped) + plain
   rules + role integrity + anti-waffle rules + banned-phrase list +
   dialectical frame + Low override (Low only) + LANGUAGE LEVEL block
   (every intensity — governs diction, rendered last) + word budgets.
   Low user messages add a one-line plain-words reminder just before the
   JSON hint, which always stays final.
5. ~~**Ledger** (one line per claim/concept, fed back each call) — **DROPPED
   experiment**: feeding the whole conversation back in broke the blunt-rotation
   discipline. `new_contribution` is still stored per turn for export/display
   but is never model input. May revisit if the chain loops or forgets.~~
*Eval: dropping the ledger was the call that saved rotation discipline;
no looping or forgetting has forced a revisit.*

**2e Structured output** ✅
```ts
{ negation, reformulation,
  new_contribution, works_referenced: string[] }
```
(`incorporation` optional legacy field — tolerated where present, never required.)
Stored as `Intervention.sections`; `response_text` kept as a joined string.
*Eval: the contract holds — layered salvage plus repair retries absorb the
unquoted-value slips; paid json_object killed the prose-instead-of-JSON failure.*

**2f Orchestration** ✅ — async loop over passes × seats replaces `setInterval`;
pause flag checked between turns; "X is thinking…" state. Two margin notes
bracket the middle: after pass 1, `runCoda(…, 'early')` reads pass 1 only
(`buildCodaEarlyPrompt` — surfacing contradiction, visitor-question
translation, banked actionables, missing perspectives for pass 2, which carries
it softly in its survey); between pass 2 and
pass 3, `runCoda` fires once: reads ONLY the question + the first two passes'
one-line determinations, writes the margin note in a plain-speaking
working-class Global South voice, Gen Z Redditor rude, well-read in
queer/crip/feminism/decolonial theory
(`CODA_SYSTEM` + `buildCodaPrompt`, paraphrased Thesis Eleven opener never
the same twice, 200-word ceiling, role-actors never named individuals,
they/them for Weil, presence-aware via a PRESENT header — only sitting
members addressed, absent thinkers never insulted, seat wording never quoted —
hard ideas rendered in the note's own plain voice), stored as separate `coda` state
(never an Intervention — seats/passes/deck math untouched). The note rides
in the pass-3 survey (listed first, as `Notes from the margins`) rather than
an appended block; every pass-3 turn must name it AND answer one of its
questions directly
(`marginsNote`; `marginsFirst` makes the opening seat answer the writer
first); a failed
note never blocks pass 3 (visible failed + retry, session stands). Nothing
fires after the final seat. The reading deck (`deckEntries`) is chronological:
passes 1–2, the note card where it spoke, then pass 3 — and the export
interleaves the note the same way. The note rides in the pass-3 survey
(listed first, as `Notes from the margins`) rather than an appended block;
turn instructions name it explicitly (`marginsNote`, plus `marginsFirst` for
the opening seat, which must name and answer the writer). The coda prompt fixes attitude
(impatience with abstraction, hunger for the concrete) and form (paraphrased
Thesis Eleven open, demand-questions plus a Gen Z action suggestion) but orders variety — one stinging absence per sitting,
3 hard-to-evade questions, never insult absent thinkers — so notes don't repeat across
sessions. Per-turn `noteMap` receipts +
console log record which prompts carried it; deck badges read "saw the
margins note" (attached ≠ answered). Own visible status
(`codaState`: writing / failed + visible reason + retry + console diagnostics);
silent catches are banned everywhere, including here. Parse failures get a
coda-specific repair restating the single-quotes rule. DeepInfra requests
`response_format: json_object` first (plain fallback on 400) to force valid
syntax. TTS uses the explicit browser-default voice (leaving `utter.voice`
unset made Chrome pick a bundled voice instead of the OS default).
`scripts/dev-keepalive.sh` guards local `:8888` (restarts netlify dev when the
Vite child dies and the proxy has nothing to forward to).
*Eval: the double-margin-note design works — pass 3 answers the note instead
of performing it; failed notes degrade visibly, never silently.
Queued owner note (Sep 20, GLM sitting): seats read as ignoring the
margins writer — P2s never name it, only some P3s answer it — which
lands as rude. Later edit: require each pass-2 turn to name the note
once + each P3 to answer one question, or have the closing summary
admit what went unanswered.
Second margins bug (Sep 20, GLM High sitting): the note ignores the
question's premise — "workers sleeping twelve to a bunk" when all
necessary work is automated is a contradiction of the setup, not a
stinging absence. Later edit: the coda prompt must re-state the
premise's settled facts as untouchable (here: no necessary human
work remains) so its concrete demands attack the answers, never the
question.*

**Philosophers' Service desk** ✅ — floating tutor window (`ServiceChat.tsx` +
`src/lib/service-chat.ts`): all 12 thinkers, switchable mid-chat, own Level
picker in the desk (Low — plain words / Medium — terms explained /
High — full voice; starts at the cabinet setting), scaffolded answers (answer
→ definitions → example → check question, 180 words; definition style follows
the desk level, quoted source loans stay verbatim at every level, sequential
summaries allowed on request via DESK OVERRIDE).
Sees recent chat + sitting one-liners + own-works-only
index grounding (follows the `grounding` toggle; other seats' links never
enter; family-name shard matching incl. joint shards).
Plain-text provider paths (`generateText*` per lib, same retries/quota codes,
no JSON contract). 20 questions per load with a humorous halt; exchanges
append to export under PHILOSOPHERS' SERVICE with source titles; answers
carry clickable source chunks. Discoverability: floating bell +
sidebar box + welcome-card paragraph (the bell alone was too subtle).
*Eval: the desk's best-tested surface — grounding receipts and the 20-question
cap both behave; discoverability needed all three mentions.*

**References, not citations** ✅ — `src/lib/footnotes.ts`: model-claimed work labels
resolve display-side to stable manifest numbers (`Read similar: 3, 9`; numbers
are file order + 1, never drawer order). Unmatched labels render once as plain
unverified text. Nothing enters prompts. `npm run check-links [--fix]` re-verifies
URLs; broken keeps the reference with a sarcastic `link_note`, never deletes.
*Eval: the honest-label trick works — unmatched claims show as plain text
instead of fake authority; nothing prompt-side to game.*

## Phase 3 — Export rewrite  ✅ (shipped)
Each intervention once, as continuous prose (no formal section headings — the
dialectical movement stays in the argument, not in labels). Never re-print the previous turn.
No inline citations, read-more lines, or footnote markers in the flow. Interleaved in
speaking order: passes 1–2, NOTES FROM THE MARGINS, pass 3, then PHILOSOPHERS'
SERVICE chats (if any), then a READING LIST of cited manifest entries
(`[n] title — author — url`, numbers stable). `.md` and `.txt`.
*Eval: exports read as prose, not logs — the note interleaving and stable
reading-list numbers both survived live sessions.*

## Phase 4 — Accessibility & display  ✅ (shipped, layer-on-top holds)
`src/lib/preferences.ts`: font scale, line height, font family (serif / sans /
dyslexia-friendly), high contrast, reduce motion (honour `prefers-reduced-motion`),
parchment / dim / dark theme — applied as CSS custom properties + data attributes on `<html>`.
Settings → *Display* tab (Key / Seats / Voice / Display). Audit: focus rings, `aria-live` on reading
status + "currently speaking", `aria-expanded` on drawers, Esc on modals, `aria-label` on
seats. Free TTS via browser SpeechSynthesis: per-turn Listen, explicit voice resolution
(visitor pick persisted as `ttsVoiceURI`, else browser-default English, else on-device
English — never `utter.lang` overrides, which make Safari switch voices), rate
control, voice picker + preview in Settings (the old default-only resolution picked
poor voices on some iPads).
*Eval: adjustments layer onto the house style as designed — never a restyle;
small-screen and screenreader passes are still the thinnest-tested area.*

## Phase 5 — RAG (v1 lexical live; vectors deferred)  ✅ (shipped; eval 12/12)
Superseded plan preserved for context: migration to `vector(768)` with Gemini
embeddings and Supabase was the original sketch — dropped in favour of the
shipped design below (no paid APIs, no server, no vectors until eval proves
lexical fails). **Only `PUBLIC_DOMAIN` sources get full text** no longer
holds: the owner approves sources individually (Bookchin TAL, Fisher OCR,
archive.org texts) via the rights gate instead of licence class.
Retrieval contract (no vectors needed for the interim): for the likely most
relevant linked work, never ingest/embed whole documents — extract/search text on
demand (headings, contents, index terms, keyword/BM25), read only the top ~2
passages plus a little surrounding context, answer strictly from them with
page/section citations, never expand to adjacent pages on ambiguity. The current
`netlify/functions/extract.js` + `grounding` toggle is the working prototype.
Searchable set per thinker is capped at 3 works (Sep 2026 decision): 1) the
magnum opus, 2) the last writing, 3) the next most important or late work.
The manifest keeps wider reading links. Status Sep 2026: search actually
covers every successfully indexed work (curation priority is latest +
magnum-opus first); the 3-cap stays as the scale lever if/when the index
 outgrows lazy per-thinker fetches — enforce then, not now.
Retrieval is lexical over English stems. The Russian 1925 Tektology was removed
Sep 2026 (English queries could never match it) and replaced with an English
Tektology OCR (obscure 2025 re-upload, edition unconfirmed, flagged honestly) —
organisation queries now hit Tektology first, verified live.
RAG v1 (lexical, Sep 2026 test PASSES on Bookchin): `data/sources.json`
manifest with explicit rights gate (importer refuses unapproved sources
before fetching); `scripts/rag-ingest.mjs` (TAL `.html` full-text, generic
HTML extraction with TOC/boilerplate/entity handling, non-author front matter
filtered before chunking — translator/editor intros, forewords, title-page
boilerplate via heading paths + OCR running headers, author's own prefaces
kept; per-source `exclude_headings` overrides; chunker v3, eval re-validated
12/12 Sep 2026), heading-aware ~350w
chunks, idempotent stable IDs) → local `data/rag.sqlite` (gitignored truth)
+ shipped per-author shards under `public/rag/` (+ `manifest.json` with
schema/chunker versions); shared scorer `src/lib/rag-search.ts`
(BM25 + Porter stemming + phrase/heading/definition boosts, adjacent-dup
diversity, none/weak/sufficient/strong evidence, multi-term co-occurrence
required for strong) used identically in browser
and node; `rag:search` debug CLI, `rag:eval` suite (12/12, Recall@10 1.00,
MRR 0.60, traps as scoping checks, ~400ms), `test:rag` self-tests. No vectors until eval
proves lexical fails. Owner approved Bookchin TAL + bulk automation across
the manifest AFTER the test go — failures skip, never force. Bulk run Sep
2026: 75 sources attempted, 37 works indexed, 6,778 passages (Capital I–III
full OCR, State & Rev + Manifesto via chapter-following, Ghosts full OCR),
plus Sep 2026 owner batch: Lenin WITBD (198) + Imperialism & the Split in
Socialism (21), Hegel Phenomenology (855) + Lectures on Right 1819–20 (511),
Fisher Realismo capitalista ES (121) + Lo raro y lo espeluznante ES (100),
Deleuze OCR batch (Thousand Plateaus 933, Bergsonism 149, Logique du sens FR
430, Nietzsche & Philosophy 331, Postscript OCR 7 as ingest companion to the
TAL entry), Bogdanov Religious→Scientific Monism (23) + English Tektology OCR
(481; replaced the Russian OCR, which English queries could never match) —
all via archive.org `/stream/…_djvu.txt` (HTML+`<pre>`, indexable; `/download/`
raw text extracts zero paragraphs), total 13,418 passages (manifest,
Sep 17 2026 export; eval re-run Sep 21), per-author shards
under public/rag/ (lazy-fetched per thinker, cached; static, so Netlify needs
nothing new). Wired behind the existing grounding toggle: desk + turns search
the thinker's own shard first (`rag-ground.ts`), live extract.js stays as
fallback; desk answers carry clickable source chunks, export lists source
titles. MIA index pages are re-attempted via chapter links (generic
chapter-following fallback); remote PDFs stay reading-links only — scanned
PDFs become ingestible via the OCR + `local_path` runbook (standing
instructions, Backend-free RAG pattern; first built for the Rose estate
scans Sep 2026: PyMuPDF render → tesseract-stdin OCR → committed text
under `data/local-text-*`). Eval traps assert
author scoping where the corpus legitimately contains the terms, abstention
only where stems are truly absent. Passage IDs are positional: chunker
changes shift ordinals, so eval records its validated chunker version and
refuses stale contracts. Deferred, not forgotten: mechanical echo-check badges, word-budget
enforcement (see below).
Word budgets: per-turn HARD ceilings (~100 words normal / ~280 long-form,
opening 60/160) live in prompts but models routinely overshoot (~150–200
observed on DeepInfra). Owner call Sep 2026: ACCEPT overshoot as the cost of
complete thoughts — no truncation, no repair-retry. Revisit only if turns
routinely exceed ~250 words normal / ~400 long-form.
Loan audit (Sep 20 2026, owner-pasted Medium turns on new Alibaba IDs —
contract says Medium ≥2 verbatim loans, High ≥4): 1 of 4 meets the bar.
Deleuze ATP (qwen3.8-max) GOOD — 2 verbatim [38] loans plus control-tics,
the connecting-words ask already met. Bookchin (qwen3.8-max) FAILS — one
[54] tag, zero quoted loans, profile knowledge doing the work ("nothing
to check"). Marx (qwen3.8-max) FAILS — [13] twice, zero quoted loans,
glossed definitions from profile, not passages. Marx (qwen3.7-plus)
FAILS — zero loans, zero tags. So the gap is enforcement, not rules.
Shipped same session: detector + prompt exclude shared loans from echo
(v2026-09-20f — borrow more without badging more), `grade-sitting.mjs`
counts loans per turn against the floor. No loan repair-retry (the gloss
precedent: retries don't cure, they spend).
Objective bench (`npm run bench:rag`, offline, real scorer + shipped
shards, seeded): round-trip id-recall@5 0.90 / work-recall 0.99 / noise
drop 0.09 / cross-author top-1 0.68 (Sep 20 2026 baseline, n=12/author).
Read it right: id-recall is a regression tripwire, work-recall is the
grounding-fitness number (Hegel id 0.08 yet work 1.00 — dense uniform
works share vocabulary across neighbor chunks, any of which serves).
Watch items: Kant noise-fragile (0.92→0.33 under distractors),
cross-author harsh by construction (overlapping Marx shards).
Grounded-vs-plain probe A/B (Alibaba Medium, karl-marx shard): 2 loans
grounded (floor met) vs 0 plain — grounding works when present, so Ex2–4
are models ignoring shown passages, not retrieval failing. Load bench
(`--kind reconstruction`, stub PREV): heaviest contract parses clean.

## Phase 6 — Richer philosopher information  ✅ (shipped Sep 2026)
Per file: `biography` (display only, never prompt input), `key_works[]`
(title/year/note), `why_this_seat` (hand-off line). Profile modal
tabs: Thought / Voice / Works / In this cabinet (biography + analytical
centre stay above the tabs). Seat hover shows the hand-off line via `title`.
Kant→Marx and Kant→Bogdanov corrected to direct (solid pink; were dotted
by error). Grid regen via `node scripts/influence-grid.mjs` after every debt
change — the grid doc is generated, never hand-edited.
*Eval: the richest modal in the app; biography quarantined from prompts holds —
no profile prose has leaked into turns to date.*

## Phase 7 — Model-family A/B: Qwen-first or DeepSeek-first (closed Sep 21 2026 — decided, see DECISION in `docs/models-tried.md`)
Selection now follows the funnel (`docs/model-selection.md`: research →
keys → probes → max 4 sittings → dated crowns), which supersedes the
open-ended A/B below — read the funnel first, this section second.
What follows is the research record (kept for provenance, not direction):
DeepSeek parked entirely, GLM parked entirely, paid pins moved twice
since (now 3.7-plus via OpenRouter, 3.8-max via Alibaba).
Goal: one family first across every pipe, the other always second, so
Low/Medium/High prompt behaviour stays in one failure shape. Research Sep 2026
(web, not live runs — verify before pinning):
- Prompt/JSON adherence: DeepSeek V4 Flash leads — explicit structured-output
  + function-call support, 1M ctx, MMLU-Pro ~86.4 vs Qwen3.6-27B ~86.2,
  LiveCodeBench 91.6 vs 83.9; Qwen3.6-27B/35B list no structured-output flag.
  For our JSON turn contract that favours DeepSeek-first on paid pipes.
- Cost: DeepSeek V4 Flash 0731 ~$0.09–0.10 in / $0.18–0.30 out per 1M
  (DeepInfra); Qwen3.6-27B ~$0.32 in / $3.20 out, Qwen3.6-35B-A3B ~$0.10–0.15
  in / ~$0.95–1.00 out. Output price is the lever — Qwen dense-27B output
  costs ~10–17× DeepSeek Flash. Cheap crown stays DeepSeek.
- Free: no Qwen/DeepSeek `:free` on OpenRouter's live API Sep 15 2026 (20 free
  total, both families gone) — that platform has NO free DeepSeek alternative,
  not even older versions. Other platforms do: Groq's free tier hosts
  `deepseek-r1-distill-qwen-32b` / `deepseek-r1-distill-llama-70b` (Groq docs
  live; fit caveat — Groq advises no system prompt on distills, and this
  cabinet leans on system prompts, so verify live before adding as a Groq
  `groqModel` option). Older paid DeepSeek (`v3.2`, `chat-v3.1`) exists on
  OpenRouter for a cheap-pin A/B. Paid pin `deepseek-v4.1-flash` verified LIVE
  Sep 15 2026.
  Groq free stays the Qwen path (30 RPM / 1K RPD / 8K TPM, 7k input wall,
  Low-only lean ration). Together Qwen3-30B-A3B unverified + priciest
  (~$0.03/5-seat) — drop candidate once the A/B settles.
- Reliability: both families rotate IDs fast; OpenRouter free IDs rot in days.
  DeepInfra fixed pair currently mixes families (DeepSeek or Qwen first, Llama
  backup) — second-DeepSeek-as-backup proposal parked while the 30B-A3B re-pin
  gets its live grade.
- Checking order Sep 16 2026 (live verdicts in `docs/models-tried.md`):
  1. `qwen/qwen3.8-flash` via the OpenRouter paid box (same family as the 27B
  voice reference, ~$0.02/session; p50 TTFT ~4.6s watch item) → grade Low
  obedience + voice. 2. Groq paid 3.8-27B same weights if Flash loses the
  voice (fastest stream, priciest, Preview — never the sole pipe).
  3. Qwen3.5-9B if both fail (cheapest, small, unproven). Rejected without
  test: GPT-OSS (OpenAI-owned, banned), GLM-5.3 (not Qwen, later fallback),
  free-tier-as-production (daily caps). Per-session cost rules (single
  visitor, ~15–30 turns): DeepSeek ~$0.01, Flash ~$0.02, paid 3.8-27B ~$0.20+.
Protocol: one fixed question, 5 seats, Low/Med/High on (a) DeepInfra DeepSeek
vs (b) Groq Qwen; grade with the `language-levels.md` trio rubric (hard terms,
gloss hygiene, example-first, loans, heat). Log both runs in
`docs/models-tried.md`, then pin winner-first / runner-up-second on every pipe.
No model IDs change until that eval lands. Human grades stay the verdict —
auto-metrics below are assistants, never judges.
Default eval question Sep 19 2026 (future-set, equal footing, concrete
bearers in children; watch-items: "robotics" is robot-family wording with
past arm-blur history, "education system" can invite bearer-less systems
talk — grade both): 'Automation and robotics have replaced almost all human
necessary work. How does this change the education system? What do we teach
children?' Prior 2030 purpose-question retired as control (grades stay tied
to the question asked).
Prompt upgrades Sep 17 (grade against these from here on): Low shape rule
(2–4 sentences per idea, placards fail), "arm" word-sense ban, keys-in-any-order,
repair turns counted outside the turn total (export shows the count), cached
prompt tokens tracked (persona-first system prompt is byte-stable by design).
Thinking-throttle rollout Sep 17 (Alibaba `enable_thinking:false` proven:
5min→sec, voice held): `reasoning_effort:low` added to Groq, DeepInfra,
Together bodies (server support unverified — live retest decides; revisit on
400s). OpenRouter moved effort:low → effort:none Sep 17 (docs: `none`
disables, `low` only shrinks ~20%; `exclude` hides but bills — never use).
vLLM pass-through (`extra_body.chat_template_kwargs.enable_thinking:false`)
added to DeepInfra/Together (silent no-op if dropped). Reasoning-token +
cache-token capture added to usage instrument + export. TODO: retest DeepInfra-Qwen,
Advisor roundup Sep 17 (Perplexity + Claude + ChatGPT briefs): adopted —
effort:none, vLLM pass-through, reasoning/cache capture, countable Low
shape, repair counting, promotion bar (≤8min/≤1 repair). Declined with
reasons: full template rewrite (our prompts already carry budgets, bans,
repairs — no live evidence a rewrite beats them); persona-as-data refactor
(same reason); versioned config table (tried-log + free-text fields already
cover it); Groq reasoning_format:hidden (display-only); Mistral-as-default
uncrowned (untested models never default — our own rule). Full briefs kept
outside the repo; verdicts above are the record.
Groq-Qwen, Together once each with the output-token line as judge.

## Phase 7b — Auto-metrics for Low/Med/High (read all three repos Sep 2026)
- **AlignScore** (MIT, clean; `yuh-zha/AlignScore`, RoBERTa-base 125M / large
  355M, torch + spacy + checkpoint download, GPU preferred): claim-vs-context
  factual check. Use: Low turn = claim, High turn + profile = context. Catches
  invented content and contradictions (= meaning drift, our "simplify language,
  not ideas" line). Sees NOTHING about simplicity, voice, or omissions.
  Adopt as the every-session meaning guardrail; flag low scores for human review.
- **LENS-SALSA** (Apache-2.0, clean; `davidheineman/salsa`, `pip install
  lens-metric` + HF `davidheineman/lens-salsa` weights, GPU): REFERENCELESS
  source→rewrite scorer with word-level error tags. Strongest fit — scores our
  own High→Low pairs with no refs, and error tags map onto leaked hard terms.
  Calibrate first: run on one past Low session, adopt as leak detector only if
  its tags agree with the owner's leaked-term list (generic-simplification
  training may misread philosophical voice).
- **ASSET + EASSE** (idea yes, dependency no): ASSET is 2,359 Wikipedia
  sentences × 10 refs with SARI — wrong genre for multi-sentence philosophical
  turns, and SARI would punish High voice if misapplied. EASSE is 2019-era,
  Python 3.6/7 deps (likely bit-rot) and GPL-3.0 (never a repo dependency —
  external script only). Adopt the method, not the package: owner writes 3–5
  plain refs for ~20 sampled High sentences, SARI-score Low/Med rewrites,
  optional one-off EASSE run outside the repo.

  Benchmark verdicts, second round (Sep 20 2026, owner-supplied links —
  method, never package: nothing below enters `package.json`; every one
  needs an LLM judge and/or embeddings server this static-first repo
  refuses to require):
- **RAGAS** (`pip install ragas` declined): faithfulness (claims grounded
  in retrieved passages), answer relevancy, noise sensitivity
  (`docs.ragas.io/en/stable/concepts/metrics/available_metrics/` —
  `faithfulness`, `response_relevancy`, `answer_correctness`,
  `answer_similarity`, `noise_sensitivity`; howtos at
  `docs.ragas.io/en/stable/howtos/applications/evaluate-and-improve-rag/`).
  Adopted as three bespoke node checks over our own shards, no deps:
  faithfulness ≈ verify.ts quote check + invented-tag footer (claims carry
  checkable loans or get flagged); relevancy ≈ rag:eval Recall/MRR;
  noise sensitivity ≈ abstention traps (already in eval). Repo:
  `github.com/explodinggradients/ragas`.
- **DeepEval** (declined as framework, kept as pattern:
  `deepeval.com`, `github.com/confident-ai/deepeval`): pytest-style
  pass/fail thresholds per metric + CI gating so a retrieval or prompt
  change can't silently regress. Adopted structurally: `grade-sitting.mjs`
  prints per-constraint pass/fail (budget/echo/city/loans/margins/vague/
  volatility) and `rag:eval` refuses stale chunker contracts — same gate,
  no judge model, no CI keys.
- **Inspect AI** (declined to run: `inspect.aisi.org.uk`,
  `github.com/UKGovernmentBEIS/inspect_ai`): versioned research-style evals
  with provider adapters. Adopted structurally: prompt version rides in
  every export, probe reports carry it, grades never transfer silently —
  our versioning is the poor-man's Inspect log.
- **FollowBench** (`github.com/YJiangcm/FollowBench`, ACL 2024 long paper
  `aclanthology.org/2024.acl-long.257`): multi-level Style / Situation /
  Content / Format / Example constraints showing where compliance collapses
  as instructions accumulate. Adopted as diagnosis, not data: our turn
  contract (persona + JSON + budgets + loans + city + margins) IS a
  FollowBench-style composed load, and past failures match its prediction
  (gloss dies first under JSON load — 3rd-round finding). No run needed;
  the lesson is already priced in.
- **IFEval** (`github.com/google/instruction_following_eval`,
  scores at `llm-stats.com/benchmarks/ifeval`): ~500 prompts × 25
  machine-checkable constraint types (word counts, required/forbidden
  phrases, headings, repetition). Adopted directly: `grade-sitting.mjs`
  implements our constraint subset (budgets, label-word bans, no-headings,
  no-repeat, JSON keys) over real transcripts. Measures obedience, never
  voice — paired with human grades, never replacing them.
- **ComplexBench** (`github.com/thu-coai/complexbench`): several composed
  constraints per instruction. Same adoption as FollowBench: our
  per-constraint scorecard decomposes the composed turn into separately
  graded constraints instead of one holistic mark.

## Phase 7c — Qwen-14B tuning track (open, Sep 20 2026; frontrunner)
Qwen-14B holds the contract at ~$0.021/sitting but reads thinner than the
bigger Qwen: less emotional grip, dropped cities, no citations, unspoken
debts, beat-less P3s. Tune the prompts toward it, not away from it:
- Emotional engagement gap: find what the 30B P1s did that 14B doesn't
  (dilemma-facing depth, felt verbs inside the move) and promote exactly
  that — no new jobs, no extra words.
- Golden-turn few-shots: harvest owner-graded best turns (30B/27B sessions)
  into per-seat exemplars rendered in the persona, with provenance
  (session, model, date). Owner picks the goldens; nothing enters the
  prompts ungraded. Candidate mechanism: extend the SEAT_TRIOS pattern
  (worked shape-examples already live at Medium) with a second,
  voice-level exemplar per seat.
- Retest checklist for every tuning round: thread city named, ≥1 citation
  per sitting, one history debt spoken in P1, one slogan + why-better in P3.
- Stop rule: if three tuning rounds don't move 14B, accept the split —
  14B carries Low/cheap, 30B carries Medium/emotional — and say so in the
  Voice tab copy.

## Phase 7e — Fix ledger (TODO; ordered by priority, Sep 20 2026)
Rule: non-model-specific fixes outrank model-specific ones. Never ship
a single-model tweak as universal (anti-overfit rule); each fix lists
evidence, unbalance risk, retest matrix.

### A. Not style (pipe/prompt plumbing — do first)
1. P2 cluster-echo (verbatim shared paragraphs) — evidence 30B/27B/14B/
   GLM-v2. Retry stays rolled back (10 retries, echo persisted, Sep 19);
   SHIPPED Sep 20 2026 the visible half: detector flags the card
   ("shares wording with an earlier turn", reset per sitting) so grading
   sees every hit at zero token cost. Sep 21: ONE UNTRIED LEVER ships —
   presence_penalty 0.6 on OpenRouter + DeepInfra (punishes ANY repeated
   token = the shared-attractor shape; repetition/frequency only punish
   local loops). Grade on 30B first, watch other voices for flattening.
   PARK CONDITION: if the next 30B sitting still clusters, 30B parks as
   an engine (dilemma-grasp challenges only). Retest: one Medium sitting
   on 30B — GLM can't retest (parked entirely); grade badge hits.
   Sep 21 riders from the Glasgow run: template-slot "(X)" leaks now trip
   the volatility guard (failed toolkit fill = garble); the margins note
   can never enter works_referenced (filtered at toIntervention).
2. Seats ignore the margins note (rudeness) — evidence GLM/30B. SHIPPED
   Sep 20 2026 in prompt v2026-09-20b (P2 names Genzie once when taking
   the note up, closing summary admits what went unanswered), hardened to
   v2026-09-20d: the P3 answer must land in the reformulation's FIRST TWO
   SENTENCES naming Genzie, before touching PREV (position salience —
   buried answers were the failure shape). Retest: GLM Medium, grade
   answer position not just presence.
3. Coda premise-blindness (bunks under full automation) — evidence GLM
   High v1. SHIPPED Sep 20 2026 in prompt v2026-09-20b (all three coda
   builders carry PREMISE HOLD: givens are settled facts, attack the
   answers never the premise). Retest: any High sitting.
4. Coda failures recurring (missing `reformulation` ×2, GLM same day) —
   no cure yet; needs a second-model data point. HARDENED Sep 20 2026:
   failure console line now carries which/lines-read/prompt-version/
   provider, so the next failure arrives triage-ready. Repair retry +
   visible failed state already stood.
5. Volatility handling (word salad, key-salad, 4000-token cutoff) —
   evidence GLM High ×4, DeepSeek halt ×1. SHIPPED Sep 20 2026
   (`detectVolatility` in `src/lib/llm.ts`: key-salad / word-repeat /
   sentence-repeat / low-diversity gate on parsed prose, retryable parse
   error, snippet in panel + full text in console). Retest: any High
   sitting — watch the false-positive line on long term-heavy turns.
6. Provenance check (`[UN143]` invented tag, 30B High) — evidence ×1.
   SHIPPED Sep 20 2026: `findInventedTags` (letter-digit bracket shape;
   plain `[12]` numbers stay untouched) flags the card's turn in console
   and lists hits in an export UNVERIFIED TAGS footer (absent when clean).
   Tags stay in the prose as evidence — flagged, never laundered.
7. Shared free path (Groq walls + dead fallback) — see Phase 7d.
8. Quote-checker blind to single quotes — SHIPPED Sep 21 2026
   (`extractQuotes` only matched "..." while the contract orders '...'
   loans, so every compliant turn read "nothing to check"; now catches
   single-quoted loans with contraction guards, and the empty message is
   the short honest line "No quoted loans in this turn.").

### B. Style, NOT model-specific (do second)
8. Debts unspoken in P1 (5 rounds, all models) — SHIPPED Sep 20 2026 in
   prompt v2026-09-20b (HISTORY TONE binding: when history lines appear,
   a P1 turn that never touches them fails). Retest: 14B + 30B Medium.
9. P3s beat-less (no slogans/why-better on 30B/GLM/Alibaba) — owner
   verdict Sep 20 2026: slogans read naff, instruction DROPPED. Replaced
   with one specific applied move (prompt v2026-09-20a: named body doing
   a named thing in the thread city, first step inside the sentence).
   Retest: 3.7-plus Medium (closest living voice) — grade specificity, not slogans.
10. Thread-city drops (Berlin-default Hegel P1s on GLM + Alibaba;
    Bangkok ×1/15 on 30B High) — SHIPPED Sep 20 2026 in prompt
    v2026-09-20c (opening anywhere but the thread city fails; relocating
    to the homeland fails), root-caused to v2026-09-20d: the opening
    branch never received the THREAD CITY value line (later turns did),
    so seat 1 was ordered to ground in a city it was never told — now
    named with birthplace explicitly exiled. Retest: any sitting, grade
    seat 1 first.

### C. Style, model-specific (do last, one model at a time)
11. 14B emotional gap (Phase 7c golden few-shots) — 14B only; risk to
    others: nil (additive exemplars, quarantined to 14B runs).
12. Bookchin-Weil bleed (High 30B P2 clone; GLM P2 attention-carry) —
    needs a third exhibit before deciding nature vs plumbing.
13. 30B High thinness (aphoristic 2-sentence turns) — 30B only; revisit
    only if 30B returns to High.

Queued (Sep 20, owner): move the OpenRouter paid default pin off
parked `deepseek/deepseek-v4.1-flash` to Medium-holder
`z-ai/glm-5.3-flash` — DONE Sep 20, then SUPERSEDED Sep 21 (GLM parked
entirely): pin is now `qwen/qwen3.7-plus`, fallbacks flash twins, dead
pins fall through mid-sitting — not DeepSeek, ever back.

## Phase 7d — Shared free default → Alibaba until Dec 2026 (route built, live test pending)
Groq free can't carry a full sitting (429 walls + 404-dead fallback,
Sep 20). SHIPPED Sep 20 2026 the env-guarded route: `ALIBABA_API_KEY` set
in host env sends the shared path to the Alibaba OpenAI-compatible
endpoint (`ALIBABA_MODELS`, default 3.7-plus → 27B → flash, max
excluded); unset keeps Groq byte-identical. Same per-IP + global caps
either way. UNTESTED LIVE: run one shared sitting on deploy before
trusting it. Watch item: the Groq fallback list still names `qwen3-32b`,
which 404s on visitor keys (Sep 21) — server-key access unverified,
confirm or drop on first live run. Re-hunt the free pipe
before the trial expires Dec 16 2026. Watch-out: one shared quota means
one visitor can drink the well — caps stay, and owner testing moves to a
visitor key meanwhile.

## Phase 9 — Rose seat (dossier landed, voice grade pending, Sep 2026)
Gillian Rose (1947–1995) dossier built per `docs/new-philosopher-brief.md`
Phase 1 (seat + debts + diagram + trio + copy sweep, with
`low_translations`); seat + debts + diagram land together once it returns (grid exporter
fails loudly on debts pointing at an unregistered seat).
Staged: diagram move (Rose left-spine, Deleuze right-spine, Fisher stays
centre) + debt grid (Hegel/Marx D+, Kant/Deleuze D-, Weil/Bloch D+,
Spinoza I+, Lenin D stance TBD, Bogdanov I± via Lukács/Lenin, Bookchin N).
Debts table now carries `confidence` + `hops` (route-only D/I per owner rule;
loose-permeation I's marked low + "owner route"). Full-text negative checks
logged in `influences.ts` header (D&G→Ashby, Bookchin←Bogdanov systems route,
Fisher←Bogdanov via Wark — all N, do not re-hunt without new leads).
RAG for Rose: books are in copyright — expect `metadata_only` corpus entries
(never ingested) unless a freely-readable OCR link exists (archive.org
`/stream/…_djvu.txt` pattern); short fair-use excerpts only with explicit
owner approval per source id. Owner's local text drop (NOT in the repo, never
shipped): iCloud `RAG text ` folder (note trailing space) holding
`gillian-r-rose-dialectic-of-nihilism-*.txt`,
`gillian-r-rose-hegel-contra-sociology.txt`,
`gillian-r-rose-judaism-and-modernity-2.txt` — owner-stamped "approved for
local index" Sep 2026. Plus *Melancholy Science* Sep 2026 (90k words,
validated: Lukács 174×, reification 166×, Bogdanov 0 — supports I± via
Lukács/Lenin, not D; early voice pre-dates "diremption"/"speculative"
diction). *Mourning* file is a 175-byte blank (re-convert); *Love's Work*
still missing. Files carry Verso/Athlone "All rights reserved"
imprints (not CC as first thought), so full text stays local-only and OUT of
`public/rag/` shards; retrieval grounding uses short excerpts only.
RAG dead ends 2026-09-16 (verified through our own extractor — each
`_djvu.txt` returns 26 paras / 98 words of borrow-page chrome, ingester
refuses as stub; do not re-hunt): `melancholyscienc0000rose`,
`mourningbecomesl0000rose`, `loveswork00gill` — all borrow-locked, no free
full text. Only route: owner converts copies as before (same local-index
path). No secondary sources — dossier and voice come from Rose's texts only. Style essence: built from the texts by the
builder (fields per `fisher.style.ts`), or via the extraction prompt below.
*Eval: dossier landed and wired (trio + low_translations + debts + RAG
excerpts live); still awaited: a live-sitting voice grade for Rose, plus
the missing local texts (see below).*
RAG landed Sep 17 2026 (owner-approved, dated act): `Italian Journey`
(~8.1k words, 46 passages) + `Your Visit to Auschwitz` (~2.0k words,
14 passages) from gillianrose.org — executor-shared CC BY-NC-ND 4.0.
Image-scan PDFs OCR’d locally (tesseract via stdin; the brew build cannot
open image files directly); OCR text committed under `data/local-text-*`
and ingested via the new `local_path` manifest mode (canonical PDF stays
`source_url` for provenance). Eval still 12/12 after. Mislabeled
archive.org "Public Domain Mark" Melancholy Science scan stays OUT
(uploader error — copyright page says All rights reserved).

### Style-essence extraction prompt (paste to research LLM with the texts)
> Write a style essence for [THINKER] grounded ONLY in the attached texts.
> Return exactly: (1) `style_dna` — one line, 4–6 hyphen-joined mechanisms
> (e.g. X + Y + Z). (2) `characteristic_movement` — one sentence, the shape
> every intervention follows (A → B → C). (3) `core_mechanisms` — one
> paragraph: signature devices, syntax tics, example domains, positioning of
> writer vs reader. (4) `cda_reader_effects` — one paragraph: who/what has
> agency, key metaphors, neologisms, register shifts. (5) `generation_rules`
> ×25 — short imperatives ("Read X as Y"). (6) `prompt` — one paragraph
> REGISTER line (how to sound like them). (7) `intensity` — low (one plain
> sentence, no specialist terms), medium (kept terms, comma-joined),
> high (full voice, comma-joined). (8) `cda_profile` — agency / modality /
> pronouns / presupposition / reader / objective, one line each.
> (9) `high_exemplar` — one verbatim quote <40 words + source, or MISSING
> (never faked). (10) `stock_phrases` 3×3 (rebuttal / concession /
> reframing), each with an `(X)` slot and a distinct six-word opening
> signature. British spelling; third-person description, never instructions
> to a reader; 1–3 sentences per string.

## Phase 10 — Senior common room (live Sep 22 2026 — first 3 turns: Spinoza →
Kant counters → Hegel sublates; 0.4–1.1s each, ~50 tokens, Groq free.
Room window sits below the deck with follow-scroll. Frame: dead
philosophers puzzling out Discord-era life; ticks carry debt lines; no
example inventories in the rules.)
Clock Sep 23 2026: GitHub `schedule` starts the workflow ~6x/day
(throttled quiet repo — every start lands, there are just fewer), so
`workers/room-cron/` (Cloudflare Worker, free tier, dispatch API every
45 min → ~32 turns/day) is the clock; GitHub's own starts ride the same
cursor as backup. Missed ticks stay missed.
Status Sep 24 2026: Worker built, switch-on pending proof — GitHub
`schedule` (~6/day, every start lands) remains the working method until
the Worker lands real turns at :00/:45 cadence. Rollback: no proof in
2 days → delete the Worker, keep GitHub; comparison is turns/day.

Unprompted philosophers' chat on the site: the seats talk about whatever
they want, on a slow rotation, no visitor question needed. Owner shape:
each seat on roughly a 4-hour rotation, one short response every ~20
minutes (≈72 turns/day).
Why it fits: 72 short turns/day sits inside Groq free limits (1K RPD,
per-minute caps absorb one turn per 20 min) and inside the shared daily
caps with room left for sittings — but ONLY if generation is centralized,
never per-visitor (per-visitor generation would multiply the quota by the
audience and drink the well dry the first busy day).
Static-first design (no always-on server, no cron bill): a scheduled
GitHub Actions workflow (free) fires every 20 minutes, calls the Netlify
function with the server key from secrets, appends one turn to a static
transcript file, and the site rebuilds or fetches it. Visitors only read.
Rules that ride along: short budgets (Low, ~40 words — room chatter, not
sittings), rotation roster in the open, fail-soft missed ticks (a skipped
slot stays skipped, never backfilled in a burst), export names who spoke.
Transcript bypasses deploys (jsDelivr serves the committed file seconds
after push — rebuilding per tick would burn build minutes); tick commits
are noisy by design (one per turn, reviewable, squashable monthly).
Open questions: who pays if Groq free tightens (trial/paid fallback?);
room moderation (Genzie barges in on schedule?); whether the room pauses
when shared quota runs low (sittings first — say so up front).

## Phase 8 — Content-agnostic template repo (specified in `docs/webapp-commons-template.md`, not yet scaffolded)
Not `cabinet-template`: name should carry the advantages. Owner pick —
`webapp-commons-template` (says what it is: a web-app shell holding the
commons pattern — no signup, shared quota made fair, accessible, static-first). Must include: accessibility layer
(prefs, themes as tested pairs, font tri-state, TTS recipe, focus/aria rules),
theme system, Low/Med/High difficulty pattern (block-last + trios + failure
lines), BYOK settings (shared-proxy + per-provider keys, quota-honest halt/
resume, `test:keys` sweep: `TEST_*` env + gitignored local file, keyless
pipes skip with reasons, keys never printed; security sweep after any
key-handling change — explicit gitignore lines, empty examples, clean
history, key-free exports/logs), service-desk chat pattern
(mechanical output-shape guards + retryable errors, short snippet in UI +
full text in console), prompt/rules version stamp (rides in the export so
grades never transfer silently across versions), lexical RAG pattern (manifest + rights gate
+ BM25 shards + eval + abstention traps), node-and-debt diagram
(`docs/diagram-style.md` + layout + checker), graphify instructions
(`graphify install/query/path/explain/update` per AGENTS.md) plus the
content-agnostic code (layout, scorer, settings, preferences, diagram).
Exclude content: philosopher files, dialectic prompts, corpus shards,
influence debts. Ship as bare Vite shell + seven modules + one "how to tweak"
doc per module, public on GitHub.

### Record-keeping kit (copy this whole block into the template)
Every record below exists in this repo; each line says what it is, where it
lives, and the one rule that keeps it alive:
- **Tried-log** (`docs/models-tried.md`): every model/provider combo tested,
  newest first, with verdict + date. Rule: corpses stay buried — check before
  (re)trying anything; log precise IDs tested and how each behaved (quality,
  latency, failure modes), never re-test without re-verifying via the live API.
- **Generated grid** (`docs/influence-grid.md` + `scripts/influence-grid.mjs`):
  human-readable view derived from a single source of truth. Rule: never
  hand-edit the markdown — re-run the script after every data change; the
  script fails loudly on drift (unknown slugs, bad kinds).
- **Strategy + dead ends** (`docs/language-levels.md`, `docs/diagram-style.md`):
  what to build in order, then what was tried and WHY each failure failed.
  Rule: write the failure down once, concretely, so nobody repeats it; rollback
  markers at the top before each new experiment.
- **Eval sheets** (`docs/family-eval.md`): fixed question, fixed seats, grading
  rubric, what to report back. Rule: same question verbatim every run; human
  grades are the verdict, auto-metrics are assistants.
- **Probe/grade automation** (`scripts/test-sitting.mjs`, `test-matrix.mjs`,
  `grade-sitting.mjs`, `bench-rag.mjs`): pipe gates, loan A/B, load bench,
  mechanical scorecards, offline retrieval scores. Rule: every run logs to
  `data/test-runs/` (gitignored) with prompt version; paste-ready rows go to
  the tried-log by hand — the machine never writes verdicts.
- **PLAN eval lines**: one tick + one honest sentence per section, updated when
  the facts change. Rule: name weak spots plainly (unverified, unwatched,
  thinnest-tested) — a plan that only celebrates rots.
- **Export provenance**: record who actually spoke (model ID per turn) in the
  export. Rule: adherence A/Bs then accumulate organically from real sessions.
- **Graphify** (`graphify-out/`, see AGENTS.md): `graphify install` once,
  `query`/`path`/`explain` before grep on codebase questions,
  `graphify update .` after every code change. Rule: dirty graph files are
  expected, never a reason to skip it.
- **Licence flags**: every vendored text/model/dataset notes its licence where
  it is used (Braille Institute, Apache, MIT ok; GPL never a dependency —
  external scripts only). Rule: flag at ingest time, not audit time.

## Missing-features backlog (considered, not yet scheduled)
Favicon ("little icon on the tab"): ship `public/favicon-32x32.png` (32×32,
the tab), `public/apple-touch-icon.png` (180×180, iOS bookmarks), optional
inline SVG data-URI (scalable, no file), plus 192×192 + 512×512 manifest icons
for Android — then add the `<link>` tags in `index.html` (tags last, once art
exists, never pointing at missing files). Art needed from owner (one letter in
house serif on parchment does the job).
og-image recompose: file IS 1200×630 and meta tags are correct — but the
artwork is a portrait panel centred with big empty brown sides. Recompose to
FILL the landscape frame (e.g. title left, table screenshot right), keep
1200×630 JPG, no code change.
Rotation/recovery doc (SHIPPED Sep 24 2026: `docs/rotation-recovery.md` —
keys as names only, rotation without code change, caps, rollback markers); LICENSE file for sharing (SHIPPED Sep 24 2026: AGPL-3.0-only, owner copyleft pick); print/export-PDF stylesheet; session
resume + shareable URL hash; transcript search; per-seat mute; live cost
estimator per sitting; level A/B eval harness wiring (§Phase 7); provider-health
indicator; keyboard shortcuts + shortcuts list; mobile 390×844 verification log;
README demo clip. Pick by need, not all at once.
"How this was built" page/section (owner request Sep 2026): the making-of —
debts table, diagram road system, RAG pipeline, model trials — pointing at
the GitHub repo. Public provenance, not a dev dump.
Provider picker explanations (shipped as a standing rule Sep 19 2026, see
AGENTS.md "Model transparency in plain text"): every provider and model option
in Settings names its exact model ID and why it is picked (price, speed,
voice, licence — one plain line each) as visible text, never tooltip-only;
the export names the model behind each turn. Source of truth lives in
`DEEPINFRA_PRIMARIES`-style structures so UI copy and code cannot drift.
Level guidance (SHIPPED Sep 21 2026): Medium recommended as the starting
point in the Voice tab — drop to Low if too hard, up to High for the
full voice.
Provider picker redesign (SHIPPED Sep 21 2026): dropdown flow —
pick provider first, then a model from a short recommended list with a
one-line note each (speed, cost, style adherence). Keep the free-text ID
box alongside for flexibility (churn survival, unlisted IDs).
Replaces the current radios-only layout once the graded order is final.
Settings cabinet tab split (shipped Sep 19 2026): Settings now has Seats
(who sits — the picker newcomers couldn't find) and Voice (intensity, long
form, economy, grounding) as separate tabs alongside Key and Display.
RAG shard latency (later): per-turn grounding downloads the thinker's whole
shard first touch (Marx 6.6MB, Hegel 5.6MB — owners feel it as stuck seats).
Options: slimmer shards, server-side search, or pre-warm all sitting shards
at session start. Revisit when sessions feel slow.
Genealogy touch behaviour (SHIPPED Sep 21 2026): first tap isolates,
second tap opens — touch-first design, not hover ported over.
Podcast mode (later, owner request Sep 2026): NotebookLM-style read-aloud of
sittings with a distinct voice per thinker. Must be free or near-free:
Web Speech per-voice mapping first (device voices differ — no guarantees),
paid TTS only as an opt-in BYOK route. Per-seat voice assignment needs the
same persistence as display settings.
