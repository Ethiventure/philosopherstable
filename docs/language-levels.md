# Language levels (Low / Medium / High)

Instructions for setting reading difficulty without dumbing down ideas —
what to build, in order, followed by the trio-creation instructions that
did not work and why. Evidence: one evaluated Low/High session (DeepInfra
Llama-3.3-70B-Turbo, Sep 2026) plus two trio-writing rounds.

## How to set difficulty levels

Build in this order. Each step fixes a distinct leak; skipping one leaves
its leak open.

**1. Put a LANGUAGE LEVEL block last in every persona, at every level**
(`src/philosophers/shared/low-style.ts`, wired in
`src/philosophers/index.ts`). Last position plus explicit precedence
("governs", "wins, no exceptions") gives it the final word on diction.
Define all three levels, not just the simple one, or "simple mode"
drifts while the others stay undefined:
- LOW: roughly IELTS-5. Translate or describe hard terms instead of
  using them; where a term has no plain equal, describe what it does.
  Assume a reader who finished high school and never studied philosophy.
  Keep an essential term only when dropping it changes the meaning.
- MEDIUM: keep important terms, explain each one naturally inside the
  sentence — trigger, procedure, example, and failure condition below.
- HIGH: authentic vocabulary at normal difficulty; simplify only for
  clarity.
- Every level ends: preserve meaning, distinctions, reasoning. Simplify
  the language, not the ideas.

**2. Starve Low of difficulty generators.** The language block alone
loses to ~3,000 tokens of academic profile above it. At Low: drop the
style machinery (generation rules, REGISTER, CDA detail, special modes,
universal mechanisms), add "read the profile and style lines for ideas
only — never borrow their specialist words", and rewrite every
`intensity.low` sentence in plain words (no `compound syntax`,
`polemic`, or `sublation` orders). Knowledge stays full — only diction
is governed.

**3. Give Medium trigger + procedure + example + teeth** (in that
order of importance):
- Trigger (concrete reader test): "any jargon or IELTS7+-level wording".
- Procedure: go sentence by sentence, term by term — no hard word
  stands without its plain meaning beside it in the same sentence.
- Worked example: one per voice (see trios below), framed as "shape
  every kept term exactly like this".
- Failure conditions: the turn fails if any hard term stands
  unexplained, AND fails equally if the explanation announces itself
  ("this means…", "in other words", "i.e."). Unlabelled inline gloss
  is the only passing shape.
- Gloss-hygiene rule: every noun inside a gloss must itself be plain;
  a gloss that needs a hard word gives that word its own same-sentence
  gloss.

**4. Match the turn instructions to the level**
(`src/lib/dialectic/prompts.ts`). Persona rules get overridden by
louder turn machinery, so each level needs its own voice, heat, loan,
and quoting rules: Low gets calm-teacher heat, paraphrased (never
verbatim) source loans, no shared specialist terms in the steelman,
translated survey wording, and a one-line plain-words reminder just
before the JSON hint; Medium keeps terms with inline gloss; High uses
full voice with generous verbatim loans (minimum four) plus filler-word
and tic echo. Standalone directives beat embedded clauses — the
question-paraphrase rule only started working as its own QUESTION RULE
("a turn that echoes the question back has failed"), never as part of
the five-word rule. The JSON shape hint always stays final.

**5. Match grounding to the level** (`src/lib/extract.ts`,
`src/lib/rag-ground.ts`). Grounding blocks are nearer to generation
than the persona and win any contradiction: Low orders paraphrase-only
and bans verbatim loans; Medium/High order verbatim borrowing. A level
system with level-blind grounding contradicts itself every grounded
turn. The service desk keeps verbatim quotes at every level by explicit
owner decision (quotes are checkable against shown sources), with a
trailing DESK OVERRIDE exempting it from the no-summary rule.

**6. Never quote the question.** Every voice at every level paraphrases
and riffs on the user question through its framework — opening turn,
critique turns, desk, margins note. Single shared nouns may repeat;
multi-word clauses may not.

**7. Cost it.** Measured (chars/4, Bookchin critique turn): Low ~5,150,
Medium ~6,500, High ~6,470 tokens/call. Worked examples add ~150
Medium / ~120 Low; paired comparison lines add ~40 / ~150. Only the
active speaker's context loads, so per-seat examples cost ~4%/session,
not 10×. Per-session money is cents — the binding constraints are
per-minute caps (Groq free: 30 RPM / 1K RPD / 8K TPM; DeepInfra credits
burn fast on 70B), so sequential calls are fine but retry bursts bite.

## How to make trios (worked procedure)

1. Commission per-voice trios from a source-grounded writer (our
   NotebookLM prompt lives in `docs/new-philosopher-brief.md`).
2. Select the High quote FIRST and grade it 1–4 before translating
   anything: complex (multi-clause), specific (only this thinker),
   unusual words (≥2 signature terms), typical style — plus
   self-contained (no dangling pronouns). A weak High poisons the trio.
3. Judge Medium/Low against the fail rules; rewrite failures
   owner-side rather than bouncing them back.
4. Wire High quotes as quotable voice anchors; wire per-seat
   Medium/Low as worked examples. Render comparisons, not isolated
   lines: Medium sees HIGH→MEDIUM, Low sees MEDIUM→LOW. High stays
   anchor-only (simplified versions would drag it down); Low never
   sees the High quote (verbatim hard text in context is the leak
   vector). Keep one shared fallback example in code for seats
   without trios.
5. Evaluate live sittings per level (rubric: hard terms untranslated —
   0 Low / glossed Medium / free High; sentence length; meaning kept;
   leakage; loan behavior; heat).

## Trio-creation instructions that did NOT work

What we tried, in order, and why each failed. Do not repeat these.

**1. "Explain terms" as an abstract rule.** Ran a full session with
nothing but "keep important terms and explain them naturally". Result:
terms kept, almost nothing explained — inconsistently, some glossed,
most bare (`ethical life`, `self-consciousness`, `lines of flight`).
A bare rule loses to ~5K tokens of surrounding difficult text every
time. Rules describe the target; they do not demonstrate the shape.

**2. One shared example for all voices.** A single Hegel Medium
sentence in the shared block. Result: no measurable improvement —
proof by demonstration only transfers when the demonstration is in the
seat's own voice, with its own terms. Retired to code fallback.

**3. Famous quotes as High anchors.** Thesis 11 ("the point is to
change it") passed fame and verifiability but has no unusual words
and no typical style — there is nothing for Medium to keep or Low to
translate, so the trio collapses into paraphrase exercises. The Wagner
method note replaced it. Fame is not a criterion; term density is.

**4. Vague triggers.** "Important terms" and "school-terms" let the
model decide everything was fine. "Any jargon or IELTS7+-level
wording" is testable; "important" is not.

**5. Rules without failure conditions.** Low had "never borrow" and
obeyed best; the question rule only worked once given "a turn that
echoes the question back has failed". Medium named no failure until
Run 3 and failed silently the whole time. Every level rule needs its
"this fails when" sentence.

**6. Glossing jargon with jargon.** The recurring translator failure:
keeping the term count but explaining with more abstract nouns
(Bookchin's "immanently elicits those hidden implicit traits…",
Deleuze's "virtual multiplicity… unactualised"). Caught only by the
gloss-hygiene rule — every noun in a gloss must itself be plain.

**7. Announced definitions.** "This means…", "in other words",
"i.e." — technically explained, still failed: labelling the gloss
breaks voice and reads as a dictionary, not thinking. The desk High
scaffold once *ordered* "say this means… out loud"; removed everywhere.

**8. Burying the rule mid-paragraph.** The question-paraphrase order
sat inside the five-word rule for a full release and changed nothing;
as a standalone QUESTION RULE it worked. Salience is positional —
one directive, one line, near the instruction it governs.

**9. Isolated examples.** Single-level examples taught shapes but not
the mapping — the failures were all in High→Medium and Medium→Low
translation, which no isolated line demonstrates. Each level must see
the step it personally performs.

## Reference: verified prompt order (Bookchin, Low, critique turn)

System message, top to bottom: identity line → analytical centre →
full intellectual profile (ideas source, not word source) → Low style
essence (DNA + movement + Low sentence + worked example) → plain
rules → role integrity → anti-waffle + banned phrases → Low override
→ language block (governs). User message: verbatim question → turn
instruction (entry, negation, QUESTION RULE, reformulation, closing,
pass-3/margins lines, Low orders, per-level voice) → predecessor
text → own priors → toolkit → spent list → pass-3 survey → grounding
block → Low closing reminder → JSON hint (always final). Last
position raises compliance but never guarantees it — the model still
sees the full academic profile above, hence "never borrow".
