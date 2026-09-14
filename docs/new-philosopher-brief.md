# New philosopher brief (reusable)

Use this when adding a seat. Two phases: research dossier first, then build.
Style rules for everything returned: British spelling (-ise, -our);
third-person descriptions for habits/moves ("Begins from…"), never
instructions to a reader; 1–3 sentences per string, plain in form (diction
lives in the style file, not here).

## Phase 1 — research prompt (paste to research LLM)

> You are writing a structured philosophy dossier on **[NAME] ([mature
> position/era])**, grounded ONLY in these texts: [list]. Everything must
> come from them; anything beyond them flagged `[outside-corpus]`. Never
> invent quotes — paraphrase, or mark `MOCK`.
>
> Return exactly: (1) `core_principle` — one operating rule for thinking
> like them (imperative voice allowed here only). (2) `ontology`,
> `epistemology`, `conception_of_human_subject`, `_society`, `_power`,
> `_freedom`, `_technology`, `_organisation`, `_contradiction`.
> (3) `characteristic_argumentative_moves` ×7. `characteristic_concepts`
> ~15. `recurring_distinctions` ×8 pairs. `recurring_criticisms` ×6
> targets (things they attack). (4) `known_influences` with one-line "how"
> each — must cover [expected names] if the texts support it, plus any
> others evidenced. (5) `known_antagonists` — named people only if
> evidenced, else positions. (6) `methodological_habits` ×5.
> `rhetorical_style` — one paragraph on how they write.
> (7) `what_[pro]noun_sees_well` / `_overlooks` / `_assumes` / `_rejects`
> — fair-minded, genuine limits included. Pronouns for this thinker:
> [he/him | they/them]. (8) `relevant_interlocutors` ×5 as "Name (shared
> problem)" — current cabinet members preferred: [roster].
> (9) Evidence hunt: citable links to [named cabinet relations];
> technology/organisation passages; publication facts (year, translator or
> "unconfirmed"). (10) CONFIDENCE per field: grounded/thin/missing.
>
> Plus one TRIO, High-first: (1) select a verbatim High quote (<40 words,
> title + section — or MISSING, never faked) and grade it 1–4 —
> complex (multi-clause), specific (only this thinker), unusual words
> (≥2 signature terms), typical style — plus self-contained (no dangling
> pronouns); a weak High poisons the trio. (2) Medium under the fail
> rules: F1 no jargon/IELTS7+ unexplained (every noun in a gloss must
> itself be plain), F2 no announced definitions. (3) Low per the Low
> rules. Output: THINKER / HIGH / HIGH-GRADE (pass/fail per criterion) /
> MEDIUM / LOW / CONFIDENCE.
>
> End with APPOINTMENT: proposed analytical_centre (8 terms), biography
> (exactly two sentences), key_works (5: title/year/one-line note),
> why_this_seat (one line), icon idea + accent colour idea, birth/death
> years + historical_boundary date.

## Phase 2 — build checklist (builder)

- [ ] `src/philosophers/{slug}.ts` + `{slug}.style.ts` in house format
  (Low intensity sentence in plain words, no specialist terms; stock
  phrases 3×3 with `(X)` slots and distinct six-word signatures).
- [ ] Register in `DEFINITIONS` (`index.ts`) — seat order re-derives by
  birth year; note shifted seats for old saved sessions.
- [ ] `influences.ts`: debts with evidence (direct = read closely and
  answered, ruptures count; indirect = via traditions); heirs derive.
  Update other seats' `relevant_interlocutors` / `known_influences`
  where the newcomer belongs. Never claim an unevidenced link.
- [ ] Corpus entries appended at END of `corpus-sources.ts` (footnote
  numbers are file order + 1). Honest licence + translator notes;
  `metadata_only` for unscannable items (never ingested).
- [ ] `rag-manifest.mjs` → stamp rights approved/dated on owner say-so
  (never `--approve-all` with other items pending) → ingest per `--id`
  → `check-links` → `test:rag` → `rag:eval` (must stay green).
- [ ] Wire the trio: verified High quote as `high_exemplar`
  (quotable anchor, High only); Medium/Low lines into `trios.ts` once
  they pass the fail rules — each level renders its comparison (Medium
  sees HIGH→MEDIUM, Low sees the full trio with "never copy a single
  word" on the High line).
- [ ] Copy sweep for the headcount ("ten" → "eleven", turn counts,
  spoken welcome, desk lines, README, PLAN).
- [ ] Typecheck + lint + build + graph update. Record eval in
  `docs/language-levels.md`.
