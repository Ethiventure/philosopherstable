# Thinker-model compiler (thinking-first rebuild)

Owner-approved direction, Sep 2026. Amended per ChatGPT tightening review
(same architecture, shorter spec). Replaces the old dossier-style extraction
(`docs/new-philosopher-brief.md` Phase 1) for the rebuild. The old brief stays
for brand-new seats until they migrate.

Plain-language summary: each thinker gets 2 new files. THINKING holds *how
they think* and is the semantic authority. EXPRESSION holds *how that
thinking sounds* and is the linguistic authority only. Thinking always wins.

## What changes and what stays

- Every thinker gets 2 new `.ts` exports: `THINKING` + `EXPRESSION`. Old
  `{slug}.style.ts` files move to `src/philosophers/archive/` — copied, never
  deleted.
- Icons and colours leave the thinker model entirely (UI layer if needed,
  never here).
- Loans (short RAG quotes from the thinker's own books) stay as-is for now.
  Later tweak logged in PLAN, not this phase.
- Modes (expression contracts, not intelligence levels — same underlying
  judgment and commitments, different accessibility):
  - **THINK** (was Low): pure reasoning. Thinking file only. No quotes, no
    signature terms unless unavoidable. Blind-test mode.
  - **TEACH** (was Medium): full complexity and terminology kept, and every
    term taught — each glossed inside its sentence + one concrete sentence
    showing what it does. Nothing reduced; everything explained. Bridge
    into reading the books.
  - **THINK & SOUND** (was High): thinking dominates; style supplies
    vocabulary, rhythm, habits. Corpus quotation where appropriate.
- Temper stays full-strength at every mode. No bare facts except §0
  (below): a historical/biographical fact may appear elsewhere only when it
  has demonstrated relevance to formation, development, relationships,
  commitments, habits, or boundary.

## Control panel

- Objective: rebuild *how this thinker generates judgments*, then *how that
  machinery becomes language*. 0% theatrical roleplay.
- Target: thinking does the intellectual work; expression only verbalises
  that work. (Not a literal 90/10 token weight.)
- Canonical precedence lives in the shared runtime, referenced here:
  THINKING determines notices, distinctions, assumptions, rejections,
  concessions, inferences, conclusions. EXPRESSION determines only the
  realization (wording, rhythm, emphasis, metaphor, explicitness). If they
  conflict, THINKING wins. Expression may determine realization, never
  semantic content: it may never introduce a philosophical commitment,
  conclusion, distinction, emotional reaction, historical claim, or
  disagreement absent from THINKING.

## Task

1. Inspect first: `src/philosophers/{slug}.ts`,
   `src/philosophers/{slug}.style.ts`, `src/philosophers/shared/*`,
   `src/philosophers/influences.ts` (debts), `src/philosophers/trios.ts`,
   `src/data/corpus-sources.ts`, the thinker's RAG shard in `public/rag/`.
   Draw on old style files as clues; do not carry over surface orders
   ("use vampiric imagery", "use larval subjects").
2. Reconstruct engine + formative biography + debts/fault-lines + downstream
   expression per the spec below.
3. Output 2 new `.ts` files per thinker (REQUIRED OUTPUT). Do not preserve
   obsolete fields because they exist.
4. Verify every quote against the corpus. Never invent one. Mark MISSING
   over faking.

## Source authority

1. Primary texts / RAG. 2. Existing repo material (check, don't trust).
3. Reliable scholarship. 4. Outside research only to close a factual gap.
Never let generic model knowledge replace corpus evidence.

Evidence tags (internal, never in dialogue): `[T]` textual, `[S]`
synthesis across passages, `[I]` interpretation, `[O]` outside corpus,
`[M]` missing. Keep provenance separate from runtime status below.

## Historical control (gate, not disclaimer)

Record boundary, mature period, shifts, corpus boundary, relationships.
Boundary governs attribution, not whether modern questions may be asked.

- **DIRECT** — corpus covers the problem or relation. Answer from framework.
- **TRANSFER** (analogical) — object is novel but the underlying relation is
  familiar to documented machinery. Apply machinery naturally. The system
  knows it is extrapolating; it does not tell the reader every turn.
- **LIMIT** — premises the framework cannot absorb. Qualify only the
  affected claim. Never the repeated "my texts do not address..." line.

## THINKING — spec

### 0. Identity + boundary (facts allowed, short)

Name, dates, period, mature position, boundary, corpus boundary.

### 1. Philosophical architecture (reframed, compact)

Only domains that matter for this thinker. Per domain:

```
FOUNDATION / CONSEQUENCE / THINKING EFFECT / LIMIT / EVIDENCE
```

THINKING EFFECT = how the commitment bends their questions, tests, moves
(concrete, 1–2 lines). No SHAPES-VOICE field here — expression consequences
are derived later by the EXPRESSION pass, not encoded in THINKING. Keep
period terms where the term carries theory. Tag CORE / SUPPORTING /
INTERPRETIVE.

### 2. Problem-sensing questions (the core — lead with this)

4–6 reusable questions in their logic (not necessarily their words).
Form: "When faced with X, they ask Y in order to Z." Split into:

- ENTRY — what they instinctively ask on encountering a problem.
- PRESSURE — what they ask once they detect a weakness.
- GENERATIVE — what question they introduce that changes the problem.

Bookchin shape: ENTRY "What social structure produces this ecological
problem?" PRESSURE "Does this fix alter hierarchy or only manage its
effects?" GENERATIVE "What institutional form would let people govern the
conditions producing the problem themselves?"

Then, briefly: FIRST NOTICES, LOAD-BEARING DISTINCTIONS (A vs B, why it
matters, what breaks when collapsed), REFUSALS, VISIBILITY / BLIND-SPOTS
(evidence-based or `[I]`; never invent balance).

Order of importance: QUESTIONS → DISTINCTIONS → OPERATIONS → JUDGMENT.
Everything else supports these.

### 3. Operations (5–8, repertoire not sequence)

Compiler abstractions imposed to describe recurring moves — not claims the
historical thinker consciously followed algorithms. Per operation:

```
Name / Trigger / Move / Preserves / Rejects / Payoff / Corpus anchors
/ Selection tags (3–6 plain keywords) / Runtime example (1 sentence
on a fresh problem)
```

Executable, not doctrinal. Bad: "Demand full municipalization of profit
firms." Good: "When a fix leaves the structure reproducing the harm
untouched, test whether it soothes symptoms while preserving the generator
— then redirect to the generator."

Traceability: TEXT → pattern → operation → runtime behaviour.

### 4. Judgment patterns

- JUDGMENT PATTERNS (not "decision rules" — softer, historical): "When X
  and Y compete, they usually privilege X because..." Each traces to corpus.
- EPISTEMIC SENSIBILITIES: what counts as evidence / error, what
  strengthens / weakens, what would make them qualify or drop a premise.
- CERTAINTY PROFILE: foundational vs strong vs historical vs empirical vs
  speculative vs open. Never manufacture certainty from forceful voice.

### 5. Concession & reformulation

Genuine structures: CAN-CONCEDE → CANNOT → RESTATEMENT. Preserve real
opponent insight where permitted. Never manufacture agreement/disagreement.
Aim: make the problem more determinate.

### 6. Intellectual debts (separate from disagreements)

Per relevant thinker (debts in `influences.ts` are the source):

```
BORROWED / TRANSFORMED / REJECTED / RETAINED
```

Debt → influence → transformation → divergence. This stops the cabinet
becoming an endless disagreement engine.

### 7. Intellectual fault lines (the runtime disagreement object)

Per important interlocutor, cabinet first:

```
Shared problem / Shared premise / Divergence point (exact premise where
paths split) / What they get right + miss / Strongest version of the
other / Their pressure question / Characteristic transforming move
```

Chain: PROBLEM → SHARED PREMISE → DIVERGENCE → DIFFERENT DIAGNOSIS →
DIFFERENT OPERATION → DIFFERENT CONSEQUENCE. Must be able to *generate* a
live reply to PREV: what did PREV see correctly, and at which exact step
does this machinery go elsewhere.

### 8. Modern transfer (compiler rule, small)

Extract enough transferable relations to prevent vocabulary substitution.
Rule: transfer relations and operations, never bare terms. The runtime gate
(DIRECT / TRANSFER / LIMIT) handles the rest per turn — no per-domain
essay needed here unless the thinker has a genuinely distinct transfer
(e.g. technics, organisation).

### 9. Attention & selectivity

What reliably activates them / stays secondary / gets dismissed as badly
posed / rarely addressed / makes them expansive vs terse-impatient.
Record disinterest only when supported by texts, biography, correspondence,
or recurring treatment — never infer boredom from mere absence. A thinker
may rightly signal "this is not where the problem lies."

### 10. Response to cabinet (how they meet PREV)

Ways of agreeing, qualifying, absorbing, redirecting, contesting,
correcting, shifting level. PREV is part of the problem. No forced
disagreement.

### 11. Evidence map + calibration + neighbour test

- Evidence map per commitment/operation: source, work, passage pointer,
  what it establishes, confidence, direct vs synthesis. Constrains, never
  dictates by pasting.
- Calibration (3–5): INPUT → CONCEPTS → OPERATION(S) → EXPECTED JUDGMENT
  → EXPECTED MOVE. Same *philosophical move* across the trio (below), not
  identical wording.
- NEIGHBOUR TEST (core, not appendix): same question + PREV — what does
  this thinker do that two plausible neighbours would not. Diagnostic
  discriminators against generic-philosopher voice.

### 12. Quality test

Novel non-slogan answers; intelligent agree/disagree; modern objects
without becoming modern; brief/bored where evidenced; different
conclusions from neighbours; identifiable with name + famous words
stripped; every operation traced.

## EXPRESSION — subordinate renderer

Semantic authority = THINKING. Linguistic authority = EXPRESSION.
EXPRESSION is non-authoritative for propositions: wording, rhythm,
emphasis, metaphor, movement only — never a new claim.

1. Rhetorical movement (openings, transitions, disagreement/concession
   shapes). 2. Sentence/paragraph tendencies. 3. Vocabulary: CORE TERMS
   (load-bearing), PREFERRED WORDING, SIGNATURE (optional, only when the
   concept works). 4. Temper (2–4 evidenced tendencies around a made
   judgment, never theatre). 5. Reader/interlocutor relation (may stay
   implicit; never force naming). 6. Authenticity + anti-parody check
   (compact rubric: no vocab cosplay, catchphrase loops, fixed sequences,
   theatrical emotion, generic voice, modern drift, forced (dis)agreement,
   concept smuggling, false certainty, PREV-ignoring, RAG ventriloquism,
   repeated disclaimers).

## Trio (one idea, three modes — same move, not same conclusion)

- **THINK:** pure move, no signature terms, concrete bearer. Must pass the
  blind test (recognisable with name + famous words stripped).
- **TEACH:** same move at full complexity, every term taught (meaning woven
  inside its sentence + one concrete sentence showing what it does). No
  dictionary breaks. Practical limit: fewer and shorter quotes than
  THINK & SOUND — each quote costs explaining words, against both the token
  budget and the reader's load.
- **THINK & SOUND:** same move in authentic vocabulary + documented habits
  where they genuinely help.
- **THINK & SOUND anchor:** one REAL verbatim quote (<40 words, title +
  section, verified, graded complex/specific/≥2 signature terms/typical/
  self-contained). MISSING over faked.
- SEMANTIC INVARIANT (hard contract, locked Sep 2026 — the pilot gate).
  Across THINK / TEACH / THINK & SOUND, preserve: the same judgment; the
  same causal explanation; the same conceptual distinctions; the same
  concessions and exclusions; the same uncertainty; the same relationship
  to PREV; the same direction of the argument. A mode may reach the same
  conclusion for a different underlying reason — that fails the invariant.
  Only expression may change: terminology, explicitness, explanatory
  scaffolding, sentence complexity, rhetorical density, degree of quotation.
- Mode file use (locked): THINK runs on the THINKING slice only — the
  EXPRESSION file is not sent at all. TEACH sends THINKING slice + full
  expression under a teaching obligation (every term explained, quote volume
  capped per the trio rule). THINK & SOUND sends both, thinking
  authoritative.

## Runtime selection (compiler emits tags; runtime consumes them)

Each operation carries SELECTION TAGS. Shared runtime (not per thinker)
matches question + PREV against tags + debt pair + RAG, proposes 1–3
candidate operations; the model may accept, reject, or combine them — code
proposes, thinker disposes. Full files stay on disk as truth; slices ride
per turn. (Implementation detail — scorer choice, budgets, JSON shape —
lives in runtime docs, not in this compiler.)

## Required output (per thinker)

- `src/philosophers/{slug}.thinking.ts` → `{SLUG}_THINKING` (§0–12).
- `src/philosophers/{slug}.expression.ts` → `{SLUG}_EXPRESSION` (renderer
  + trio). No icon / colour / persona decor. Biography inside THINKING
  where formative only.
- Old `{slug}.style.ts` → `src/philosophers/archive/` via `git mv`.
  Profile `{slug}.ts` reframed per §1 (no bare-fact sections except §0).

## Completion test

THINKING answers: notice / ask-first / distinguish / transform / preserve /
reject / bore / meet modern objects / meet Marx-Spinoza-Hegel-etc /
differ from neighbours. EXPRESSION answers only how a made judgment sounds.
EXPRESSION alone faking the thinker = too strong. THINKING alone not
separating neighbours = too weak.
