# Add-back queue (Phase 11 pilot)

Ranked by expected value against *observed* failure modes — deliberately
NOT the order these rules were originally added. One rule at a time, one
fixed-question sitting, one blind grade, keep-or-revert logged below.
Protocol lives in PLAN.md Phase 11; version stamp moves one letter per
restoration.

Observed failure ladder (what would trigger a return):
F1 verbatim echo/parroting (3 cases across 2 sittings) · F2 generic or
unidentifiable moves (blind-test failure) · F3 gloss failures in TEACH ·
F4 drift off PREV or the question · F5 bloodless tone (OBSERVED Oct 2
2026: THINK all-off dull on TTS — response is toggles-first per Oct 4,
add-backs only if toggles fail).

## 1. Full ECHO RULE paragraph — trigger: F1 persists despite scan + repair

Previous wording (old scaffold, `buildTurnInstruction`):
> ECHO RULE: answer PREV — never restate PREV, yourself, or the question. No sentence may reword an earlier sentence of theirs or yours; avoid even repeating ideas — each sentence must push the debate in a new direction. Shared paragraphs fail outright: never reuse PREV’s example, image, demand, or scene — bring your own concrete object. Shared source vocabulary is NOT echo: two seats drinking from the same work will share its words — echo means shared invention (examples, images, scenes you made up), never shared loans. SAY EVERY MOVE ONCE: the reformulation advances from the negation’s keep/break — it never restates them (“what I reject” may not repeat what the negation already broke). A turn that circles has failed, even if every word differs.

Why first: only return targeting the proven #1 failure. The one-line
paraphrase rule stays regardless; this restores the shared-invention
clause and the say-every-move-once clause.

## 2. Pressure questions render — trigger: F2 (moves fire weakly)

Previous wording: lives in every THINKING file
(`problemSensing.pressure`, e.g. Bookchin "Does this proposal alter
domination, or merely redistribute its effects more cleanly?").
Restoration = re-enable the render block in `renderThinkingPersona`
(deleted in the barest-bones cut), not new text.

## 3. Judgment patterns render — trigger: F2b (choices look random)

Previous wording: lives in every THINKING file (`judgment.patterns`).
Restoration = re-enable the render block in `renderThinkingPersona`.

## 4. Trio think + think&sound lines — trigger: F2c (think turns lose shape)

Previous wording: lives in every EXPRESSION file (`trio.think`,
`trio.thinkAndSound` — the verbatim quote). TEACH keeps its line throughout.
Restoration = lift the `mode === 'teach'` gate in `renderThinkingPersona`.

## 5. CUT-IN naming ceremony — trigger: F4a (turns rebut recaps)

Previous wording (old scaffold):
> CUT IN, don't hand over: seize the weakest point in PREV's closing lines. Open by naming PREV — then your own words, your own verbs. Answer the second half of PREV, the live edge — never rebut its opening recap. No preamble, no greeting beyond the name.

Note: the second-half clause already survives in the pilot scaffold;
this returns only the naming + weakest-point seizure. (`${prev}` slot.)

## 6. Debt narration — trigger: pair history feels absent in P1

Previous wording: generated per pair by `relationshipLine`
(`src/philosophers/influences.ts`) — honour/rupture/theft lines.
Restoration = stop passing `null` for `relationshipLine` in the App
pilot branch. Fault lines stay primary; narration returns as seasoning.

## 7. MOOD temper line — trigger: F5 with blind-grade evidence only

Previous wording (old scaffold):
> MOOD, OUT LOUD: let the feeling show strongly in your own diction — blunt words, swears, exclamations, sorrow, fear, joy, interjections where your voice would use them; mourning, fury, tenderness where it would feel them. The reader should hear this sitting cost you something. Polite evenness fails the turn.

## 8. Stock toolkit, single variant — trigger: flat entries + explicit owner override

Previous wording: code-driven (`YOUR TRANSITIONAL TOOLKIT… at most ONE
per turn…` plus per-seat variants in `{slug}.style.ts`). Returns only
with the owner accepting the verbatim-lift record in writing — the
transcript shows variants get lifted three-to-a-turn.

## 9. FELT VERBS cost line — trigger: F5 persists after #7 fails

Previous wording (old scaffold):
> FELT VERBS: the feeling lives inside the move, not beside it — the rejection, the break, the build each carries one feeling verb in your own diction: grief, dread, tenderness, fury, joy, disgust, longing, shame, delight, sorrow, contempt, pity — never the same verb twice in one turn, and never merely mourn/love/hate/fear on repeat (real people rarely say "mourn"). Name the cost inside the move: what your framework gives up to land it. A move performed coolly fails the turn; display verbs alone (shows, reveals, demonstrates) fail it twice.

## 10. RHYTHM BREAKS — trigger: none known; last resort

Previous wording (old scaffold):
> RHYTHM BREAKS: vary sentence structure and never three long sentences running without a short punch after. Even cadence lulls; the reader should feel the gear change.

## 11. TIME RULE — trigger: horizon/demand confusion in grades

Previous wording (old scaffold):
> TIME RULE: Mark present-day facts as facts and demands as demands: say what changes now (the minimum) and what the horizon holds (the maximum) — never present the horizon as already here, and never mistake a demand for a description.

## Never returning

- LOW ORDERS (contradicts modes — plain-words orders have no home now).
- VOICE loan quotas (renderer owns loans; floors stay buried).
- QUESTION RULE standalone (folded into the paraphrase line).
- SCENARIO / PLACES mandates (owned by the scene experiment).
- HISTORY TONE full mandate (fault lines own pair history).
- Determinate-negation keep-line (kept in pilot scaffold already).

## Verdict log

| Date | Rule # | Sitting | Verdict |
|---|---|---|---|
| | | | |
