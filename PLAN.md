# The Dialectical Cabinet — Implementation Plan

Turning the mock prototype into a real LLM-driven dialectical system.
Phases are ordered by dependency; each should leave the app building.

---

## Decisions

### API key: Bring-Your-Own-Key (BYOK)
Deploy target is public (Netlify / Bolt) with no login. Therefore:

- **Never** put a Gemini key in `.env` for a Vite app — any `VITE_*` variable is inlined
  into the shipped JavaScript and is readable by every visitor. Committing it to GitHub
  makes it permanent.
- Each user pastes their own Gemini key into **Settings → API key**. It is stored in
  `localStorage` only and sent only to `generativelanguage.googleapis.com`.
  Nothing is logged or collected. The panel says so in plain language.
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
| Determinate negation | 35 | 95 |
| Substantive incorporation | 20 | 55 |
| Reformulation | 65 | 175 |
| Contradiction passed on | 30 | 75 |
| **Total per turn (the cap)** | **~150** | **~400** |
| Opening turn (seat 1, pass 1) | 90 | 240 |

Per-section counts are guidance for shaping the answer; the total is what
is enforced. All four parts must be present.

`maxOutputTokens: 300` normal / `600` long form (JSON wrapper needs headroom).
A full 9 × 3 session ≈ 3.9k words normal — roughly a 15-minute read.

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

**2a Settings** — `src/lib/settings.ts` (localStorage): `geminiApiKey`, `model`
(`gemini-2.5-flash` default / `gemini-2.5-pro`), `intensity`, `longForm`.
Settings drawer: key input (password-style), Test key, Clear, privacy statement,
link to Google AI Studio. No key → Begin disabled with explanation.

**2b Client** — `src/lib/gemini.ts`: `fetch` to `generateContent` with
`responseMimeType: 'application/json'` + `responseSchema`; one retry on 429/5xx;
errors surfaced in UI. No SDK.

**2c Three turn types** — `src/lib/dialectic/prompts.ts`

| Turn | When | Shape |
|---|---|---|
| Opening | Pass 1, seat 1 | Answer the question directly in own framework; no reference to other thinkers; follow characteristic movement. |
| Immanent critique | All other turns, passes 1–2 | (1) Determinate negation of PREV using their own premises; (2) Substantive incorporation; (3) Reformulation from own framework; (4) Contradiction passed to NEXT, by name. |
| Reconstruction | Pass 3 | Same four parts; (3) becomes *what institutions / practices / forms of collective power follow now the contradictions are visible*. Final seat's (4) returns the question, as it now stands, to the user. |

PREV crosses pass boundaries: pass 2 seat 1 critiques pass 1's last seat.

**2d Context per call (pure, except own priors)**
1. User's question, verbatim.
2. Full text of the previous intervention (PREV) — the only other voice
   the speaker ever sees.
3. Speaker's own prior turns (one-line summaries): *"Do not restate your prior
   position. Name it in one clause and show how it has shifted."* Anti-
   self-repetition only; no other history is passed.
4. System prompt = identity + profile + style essence (at chosen intensity) +
   universal mechanisms + anti-waffle rules + banned-phrase list + word budgets.
5. ~~**Ledger** (one line per claim/concept, fed back each call) — **DROPPED
   experiment**: feeding the whole conversation back in broke the blunt-rotation
   discipline. `new_contribution` is still stored per turn for export/display
   but is never model input. May revisit if the chain loops or forgets.~~

**2e Structured output**
```ts
{ negation, incorporation, reformulation, contradiction_passed,
  new_contribution, works_referenced: string[] }
```
Stored as `Intervention.sections`; `response_text` kept as a joined string.

**2f Orchestration** — async loop over passes × seats replaces `setInterval`;
pause flag checked between turns; "X is thinking…" state.

## Phase 3 — Export rewrite
Each intervention once, with section headings. Never re-print the previous turn.
Append the per-turn `new_contribution` list (display only — the fed-back
Ledger is a dropped experiment, see 2d) and the final formulation of the
question. `.md` and `.txt`.

## Phase 4 — Accessibility & display
`src/lib/preferences.ts`: font scale, line height, font family (serif / sans /
dyslexia-friendly), high contrast, reduce motion (honour `prefers-reduced-motion`),
parchment / dark theme — applied as CSS custom properties on `<html>`.
Settings → *Reading & display* tab. Audit: focus rings, `aria-live` on "currently
speaking", `aria-expanded` on drawers, focus-trap + Esc on modals, `aria-label` on
seats, lift `/60` text opacities that fail 4.5:1.

## Phase 5 — RAG with vectorised books (later)
Migration to `vector(768)`; Python ingestion in the existing `.venv` (chunk ~800
tokens with section labels, embed with Gemini @768). **Only `PUBLIC_DOMAIN` sources
get full text** — Fisher, Deleuze, Bookchin stay metadata-only with unverified
badges. Query time: embed question + previous turn, `match_chunks(k=4)`, inject,
cite by label. RLS: corpus tables read-only for anon.

## Phase 6 — Richer philosopher information
Per file: `biography`, `key_works`, `why_this_seat` (hand-off line). Profile modal
tabs: Thought / Voice / Works / In this cabinet. Seat hover shows the hand-off line.
