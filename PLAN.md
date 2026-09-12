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

### Style intensity: global
One Low / Medium / High setting in Settings, applied to every philosopher's intensity
ladder.

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
A full 10 × 3 session ≈ 3k words normal — roughly a 12-minute read.

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

## Phase 1 — Per-philosopher files with style essences

- [ ] Add `style_essence` to the `Philosopher` type:
      `style_dna`, `core_mechanisms`, `cda_reader_effects`, `generation_rules[]`,
      `prompt`, `intensity {low, medium, high}`, `characteristic_movement`.
- [ ] Create `src/philosophers/spinoza.ts … fisher.ts`; move each profile verbatim
      (no fields deleted); add the essence from the Forensic Generative Model doc.
- [ ] `src/philosophers/shared/universal-mechanisms.ts` (cross-author CDA table,
      AVOID CARICATURE, GENERATIVE ARGUMENT MODEL, FINAL STYLE CONTROL) and
      `shared/anti-waffle.ts` (NOT NEUTRAL, no filler, no vague language,
      anti-summary, every turn must add).
- [ ] `src/philosophers/index.ts` exports `PHILOSOPHER_DATA` sorted by birth year and
      `DEFAULT_SEATING_ORDER` derived from it. Delete `src/data/philosophers.ts`.
- [ ] ProfileModal shows Style DNA + characteristic movement.

## Phase 2 — Gemini + dialectical engine (replaces `makeMockIntervention`)

**2a Settings** — `src/lib/settings.ts` (localStorage): provider
(`shared` default / `openrouter` free cycle or paid pinned model / `groq`,
`deepinfra`, `together` BYOK keys),
keys per provider, `groqModel` (qwen3.8-27b default, free tier), `economy`
(`full` / `efficient` — efficient caps fed-back PREV text at ~1200 chars;
personas are never trimmed), `grounding` (default off — experimental source
passages, undo by deleting `lib/extract.ts` + `functions/extract.js` + flag),
`intensity`, `longForm`. No Gemini anywhere (retired for new keys; stored
'gemini' migrates to shared). No OpenAI models, ever.
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
variant may be used once per whole session: spent variants ride in the prompt and
are tracked post-turn by fragment match. Four supplied variants were reworded to
respect the banned-phrase list (Marx/Hegel/Weil/Bookchin).
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
1. User's question, verbatim.
2. Full text of the previous intervention (PREV) — the only other voice
   the speaker ever sees (passes 1–2).
3. Speaker's own prior turns (one-line summaries): *"Do not restate your prior
   position. Name it in one clause and show how it has shifted."* Anti-
   self-repetition only; no other history is passed.
4. Pass 3 only: every other seat's one-line determinations, labelled by name
   (`othersPriorLines`) — the final rotation may invoke the most striking ideas.
5. Grounding block, only when the experimental `grounding` toggle is on:
   top keyword passages from the speaker's own HTML source, cited by footnote.
   Resolver prefers ingested works, falls back to any live HTML page (this is
   what lets metadata-only thinkers like Weil ground at all). Failures carry
   machine-readable reasons (`unsupported-source` / `fetch-failed` / `no-match`)
   surfaced per-turn in the modal — never a generic nothing.
4. System prompt = identity + profile + style essence (at chosen intensity) +
   universal mechanisms + anti-waffle rules + banned-phrase list + word budgets.
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
pause flag checked between turns; "X is thinking…" state. After the final seat,
`runCoda` fires once: reads ONLY the question + every seat's one-line
determination, writes margin notes in a fixed Gen-Z PPE-student voice
(`CODA_SYSTEM` + `buildCodaPrompt`), stored as separate `coda` state (never an
Intervention — seats/passes/deck math untouched). Own visible status
(`codaState`: writing / failed + retry + console diagnostics); silent catches
are banned everywhere, including here.

**References, not citations** — `src/lib/footnotes.ts`: model-claimed work labels
resolve display-side to stable manifest numbers (`Read similar: 3, 9`; numbers
are file order + 1, never drawer order). Unmatched labels render once as plain
unverified text. Nothing enters prompts. `npm run check-links [--fix]` re-verifies
URLs; broken keeps the reference with a sarcastic `link_note`, never deletes.

## Phase 3 — Export rewrite
Each intervention once, as continuous prose (no formal section headings — the
dialectical movement stays in the argument, not in labels). Never re-print the previous turn.
No inline citations, read-more lines, or footnote markers in the flow. Append:
Margin Notes (if written), then a READING LIST of cited manifest entries
(`[n] title — author — url`, numbers stable). `.md` and `.txt`.

## Phase 4 — Accessibility & display
`src/lib/preferences.ts`: font scale, line height, font family (serif / sans /
dyslexia-friendly), high contrast, reduce motion (honour `prefers-reduced-motion`),
parchment / dim / dark theme — applied as CSS custom properties + data attributes on `<html>`.
Settings → *Display* tab (Key / Cabinet / Display). Audit: focus rings, `aria-live` on reading
status + "currently speaking", `aria-expanded` on drawers, Esc on modals, `aria-label` on
seats. Free TTS via browser SpeechSynthesis: per-turn Listen + full-session read, single
auto-picked English voice, rate control, voice inventory listed read-only in Settings so the
user can report which voice sounds best.

## Phase 5 — RAG with vectorised books (later)
Migration to `vector(768)`; Python ingestion in the existing `.venv` (chunk ~800
tokens with section labels, embed with Gemini @768). **Only `PUBLIC_DOMAIN` sources
get full text** — Fisher, Deleuze, Bookchin stay metadata-only with unverified
badges. Query time: embed question + previous turn, `match_chunks(k=4)`, inject,
cite by label. RLS: corpus tables read-only for anon.
Retrieval contract (no vectors needed for the interim): for the likely most
relevant linked work, never ingest/embed whole documents — extract/search text on
demand (headings, contents, index terms, keyword/BM25), read only the top ~2
passages plus a little surrounding context, answer strictly from them with
page/section citations, never expand to adjacent pages on ambiguity. The current
`netlify/functions/extract.js` + `grounding` toggle is the working prototype.

## Phase 6 — Richer philosopher information
Per file: `biography`, `key_works`, `why_this_seat` (hand-off line). Profile modal
tabs: Thought / Voice / Works / In this cabinet. Seat hover shows the hand-off line.
