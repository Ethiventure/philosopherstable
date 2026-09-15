# The Dialectical Cabinet — Implementation Plan

Turning the mock prototype into a real LLM-driven dialectical system.
Phases are ordered by dependency; each should leave the app building.

---

## Decisions

### API keys: shared default, BYOK fallback
Three providers (`CabinetSettings.provider` in `src/lib/settings.ts`):
`shared` (default, no key needed) / `openrouter` (free cycle or paid pinned
model) / `groq`, `deepinfra`, `together` (visitor BYOK keys). No Gemini
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
  unreachable note, BYOK still works).
- **Visitor BYOK** (OpenRouter / Groq / DeepInfra / Together) = the visitor's own
  key, `localStorage` only, sent straight to that provider. Privacy: OpenRouter
  free models may log prompts for training — the Settings panel says so per
  destination.

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

### Supabase: optional, read-only for corpus
The app currently throws without `VITE_SUPABASE_URL`. For a no-login public app it
should run entirely from local state + localStorage + export. Supabase returns in
Phase 5 purely as a read-only vector store for the corpus (the anon key is designed to
be public; RLS enforces read-only). No user data is ever written.

### Philosopher data: one file each
`src/philosophers/{slug}.ts` — profile + style essence + (later) works, biography,
hand-off line. `index.ts` sorts by `birth_year`, so the seating order is *derived*
from the data and can never drift from date order again.

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
loans, translated survey wording. All 11
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

### Length: short and punchy
Word budgets per section (normal / long-form). Each turn does less, so the
rotation stays tight:

| Section | Normal | Long form |
|---|---|---|
| Determinate negation | 40 | 100 |
| Reformulation | 60 | 180 |
| **Total per turn (the cap)** | **~100** | **~280** |
| Opening turn (seat 1, pass 1) | 60 | 160 |

Per-section counts are guidance for shaping the answer; the total is what
is enforced. Both parts must be present; the concession hides inside them
(no separate incorporation section since the fold). A turn is a spoken
intervention, not an essay.

`maxOutputTokens: 300` normal / `600` long form (JSON wrapper needs headroom).
A full 11 × 3 session ≈ 3.3k words normal — roughly a 13-minute read.

### Embeddings (Phase 5)
`test_embeddings.py` uses local Ollama `nomic-embed-text` (768 dims); the schema is
`vector(1536)`; visitors cannot reach localhost. Ingest **and** query with
`gemini-embedding-001` at `outputDimensionality: 768` and alter the column to
`vector(768)`. Ingestion is a one-off script you run with your key; query-time
embeddings use the visitor's key.

---

## Phase 0 — Make the current tree build  ✅ (this session)

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

## Phase 2 — Gemini + dialectical engine (replaces `makeMockIntervention`)

**2a Settings** — `src/lib/settings.ts` (localStorage): provider
(`shared` default / `openrouter` free cycle or paid pinned model / `groq`,
`deepinfra`, `together` BYOK keys),
keys per provider, `groqModel` (qwen3.8-27b default, free tier), `economy`
(`full` / `efficient` — efficient caps fed-back PREV text at ~1200 chars;
personas are never trimmed), `grounding` (default on — experimental source
passages, undo by deleting `lib/extract.ts` + `functions/extract.js` + flag),
`intensity` (default low), `longForm`. No Gemini anywhere (retired for new keys; stored
'gemini' migrates to shared). No OpenAI models, ever. Default seats: Hegel,
Marx, Bloch, Bookchin, Deleuze.
Settings drawer: provider radio, key input (password-style) per provider, Test
key, Clear, per-destination privacy note. No key → Begin disabled with explanation.

**2b Clients** — `src/lib/llm.ts` is the shared error/parse hub
(`LlmError` codes, `parseTurnOutput` with provider label plus layered salvage —
brace-slice, then bare-value requoting for models that emit unquoted strings,
then halt; full raw text goes to console on failure, 140-char snippet in the
panel, `REPAIR_SUFFIX`,
`retryAfterMs`); its Gemini provider client is retired with the provider.
`src/lib/openrouter.ts`: OpenAI-compatible `chat/completions` (no `response_format` —
most free models can't do it; prompt-instructed JSON + salvage instead), cycling an
ordered free-model list with `openrouter/free` as last-resort fallback; unusable
models are skipped mid-run, last-good is remembered. Quota halt shows a recovery
panel (resume / switch provider / usage link).
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
`src/lib/deepinfra.ts` / `src/lib/together.ts`: same OpenAI-compatible shape,
pinned models (`DEEPINFRA_MODEL`, `TOGETHER_MODEL` — user-supplied IDs, verify on
404), single-model retry + repair. Full history in `docs/models-tried.md`.

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

**2c Three turn types** — `src/lib/dialectic/prompts.ts`

| Turn | When | Shape |
|---|---|---|
| Opening | Pass 1, seat 1 | Answer the question directly in own framework; no reference to other thinkers; follow characteristic movement. |
| Immanent critique | All other turns, passes 1–2 | Cuts in on PREV's closing lines: (1) Determinate negation — steelman first, then break the genuine fault line — using PREV's own premises; (2) Reformulation from own framework, ending on the live edge, concession woven inside. No handoff, no naming NEXT, never opens with a proper name. |
| Reconstruction | Pass 3, rotation REVERSED (each seat answers the answer just given from its left) | Same two parts; (2) becomes *what institutions / practices / forms of collective power follow now the contradictions are visible*. Must invoke ≥1 surveyed idea from another seat by name. Final seat returns the question, as it now stands, to the user — no new claims after it. |

PREV is chronological (whoever spoke just before), across pass boundaries. Pass 3
order skips the seat that just closed pass 2 (it would answer itself) and closes
with it instead — every seat speaks once per pass and gets critiqued.

**2d Context per call (pure, except own priors; pass 3 gets a survey)**
1. User's question, verbatim as context — every voice paraphrases and riffs
   on it through its framework, never quoting it (five-word rule names the
   question; opening turn and desk and coda carry the same order).
2. Full text of the previous intervention (PREV) — the only other voice
   the speaker ever sees (passes 1–2).
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

**2e Structured output**
```ts
{ negation, reformulation,
  new_contribution, works_referenced: string[] }
```
(`incorporation` optional legacy field — tolerated where present, never required.)
Stored as `Intervention.sections`; `response_text` kept as a joined string.

**2f Orchestration** — async loop over passes × seats replaces `setInterval`;
pause flag checked between turns; "X is thinking…" state. Between pass 2 and
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

**Philosophers' Service desk** — floating tutor window (`ServiceChat.tsx` +
`src/lib/service-chat.ts`): all 11 thinkers, switchable mid-chat, own Level
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

**References, not citations** — `src/lib/footnotes.ts`: model-claimed work labels
resolve display-side to stable manifest numbers (`Read similar: 3, 9`; numbers
are file order + 1, never drawer order). Unmatched labels render once as plain
unverified text. Nothing enters prompts. `npm run check-links [--fix]` re-verifies
URLs; broken keeps the reference with a sarcastic `link_note`, never deletes.

## Phase 3 — Export rewrite
Each intervention once, as continuous prose (no formal section headings — the
dialectical movement stays in the argument, not in labels). Never re-print the previous turn.
No inline citations, read-more lines, or footnote markers in the flow. Interleaved in
speaking order: passes 1–2, NOTES FROM THE MARGINS, pass 3, then PHILOSOPHERS'
SERVICE chats (if any), then a READING LIST of cited manifest entries
(`[n] title — author — url`, numbers stable). `.md` and `.txt`.

## Phase 4 — Accessibility & display
`src/lib/preferences.ts`: font scale, line height, font family (serif / sans /
dyslexia-friendly), high contrast, reduce motion (honour `prefers-reduced-motion`),
parchment / dim / dark theme — applied as CSS custom properties + data attributes on `<html>`.
Settings → *Display* tab (Key / Cabinet / Display). Audit: focus rings, `aria-live` on reading
status + "currently speaking", `aria-expanded` on drawers, Esc on modals, `aria-label` on
seats. Free TTS via browser SpeechSynthesis: per-turn Listen, explicit voice resolution
(visitor pick persisted as `ttsVoiceURI`, else browser-default English, else on-device
English — never `utter.lang` overrides, which make Safari switch voices), rate
control, voice picker + preview in Settings (the old default-only resolution picked
poor voices on some iPads).

## Phase 5 — RAG (v1 lexical live; vectors deferred)
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
raw text extracts zero paragraphs), total 11,022 passages,
per-author shards
under public/rag/ (lazy-fetched per thinker, cached; static, so Netlify needs
nothing new). Wired behind the existing grounding toggle: desk + turns search
the thinker's own shard first (`rag-ground.ts`), live extract.js stays as
fallback; desk answers carry clickable source chunks, export lists source
titles. MIA index pages are re-attempted via chapter links (generic
chapter-following fallback); PDFs stay reading-links only. Eval traps assert
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

## Phase 6 — Richer philosopher information  ✅ (shipped Sep 2026)
Per file: `biography` (display only, never prompt input), `key_works[]`
(title/year/note), `why_this_seat` (hand-off line). Profile modal
tabs: Thought / Voice / Works / In this cabinet (biography + analytical
centre stay above the tabs). Seat hover shows the hand-off line via `title`.
