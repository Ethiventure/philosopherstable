# Models tried

Living log of every model/provider combination tested for the cabinet, newest
first. Check here before (re)trying anything — corpses stay buried.

## Selection strategy (Sep 20 2026, owner order — revised same day)
Goal: one model that carries all three levels. Per-level split is the
fallback, not the prize — and if it sticks, the Voice tab says plainly
which engine is best for what. Until then: 1) A free model that works
(default while it lasts: Alibaba Qwen27B trial quota to Dec 16;
free-tier Qwen elsewhere walls — Groq ~7K TPM vs ~8K turns, OpenRouter
:free has no Qwen). 2) A quick model (paid Qwen30B: ~1–2 min debates).
3) A model meeting all quality requirements (open — GLM holds Medium,
High still unclaimed).
## Elimination plan (Sep 20 2026 — owner: start cutting, different models per level allowed)
Parked, not buried: DeepSeek v4.1-flash. Two bad outings (halt, partial)
plus 12-min pace — no more sittings spent on it until a contender fails
cleaner. Revisit conditions: Qwen echo unfixable, or a calm full sitting
owed. The old fallback-engine verdict is suspended, not erased.
Next three sittings, in order, each with kill/keep criteria:
1. qwen/qwen3-14b (OpenRouter paid, ~$0.011) — Medium, education question.
   RESULT Sep 20: SURVIVES. 0 repairs, no burn, no loop; $0.021 actual.
   Cheapest viable engine. Faults: city dropped, no citations, debts unspoken.
2. z-ai/glm-5.3-flash (rematch) — Medium, same question. KEEP if P3s
   differentiate and thread city holds; PARK if slower than 8 min wall.
   RESULT Sep 20: KEEPS. 5:26 wall (4:26 debate), $0.018, 3 JSON repairs.
   P3s differentiated (5 distinct slogans, Bookchin dissents from Hegel's
   ache); city mostly held (Hegel P1 opens Berlin, Bookchin P3 names no
   city); 9 citations with pass annotations; debts spoken (Marx→Hegel,
   Bloch→Thesis 3, Bookchin→Weil via Macdonald). Owner speed note: pace
   only needs to beat reading time — 4:26 for 15 turns passes easily.
3. Alibaba qwen3.8-27b — first Medium grade (trial quota). KEEP if voice
   survives Medium rules; otherwise it stays the Low voice leader only.
   RESULT Sep 20: SPLIT. Voice survives (P1s voiced + distinct, P3s
   differentiated with slogan "Map the grid, seize the future", $0.090
   paid-equiv / $0 quota, 3:15 wall, 1 repair). But P2s collapse into
   verbatim echo — the same "atrophy of political agency / citoyen
   rebirth" paragraph in 4 of 5 turns, shared opener across Marx/Bloch/
   Weil. Stays the Low voice leader; not a Medium engine. Medium is now
   GLM vs Qwen30B.
Per-level recommendation (current best guess, changes with evidence):
- Low: Alibaba 27B (proven voice, plain level) — Qwen30B untested at Low.
- Medium: GLM-5.3-flash takes it (Sep 20: no P2 echo, debts spoken,
  P3 slogans; 30B retest same day keeps pairwise echo + beat-less P3s).
  Qwen30B stays the dilemma-grasp challenger + High probe candidate.
- High: OPEN — nobody graded at High since prompts stabilized; winner of
  Medium gets the High sitting.
Next test (owner, Sep 20): High still open — 30B parked (thin),
GLM parked (gibberish). Both return only via ledger fixes (7e-A5),
not raw retests. Meanwhile: 14B tuning + Low probes.
- High: OPEN — nobody graded at High since prompts stabilized; winner of
  Medium gets the High sitting.
Free default: Alibaba trial to Dec 16, then cheapest proven paid.
Test queue (Sep 20 2026 — NOTHING ruled out yet, status per model):
- deepseek/deepseek-v4.1-flash (control): PARKED, not standing — was the
  fallback engine, but Sep 20 outings were a halt (word-salad P1, 12 min/3 turns) and a
  2-turn partial. Needs a clean full sitting before any verdict moves.
- z-ai/glm-5.3-flash: KEEPS (Sep 20 rematch) — engine challenger
  confirmed on current rules. Next: Alibaba 27B Medium grade; then
  Medium winner takes the High sitting.
- qwen/qwen3-30b-a3b: NOT ruled out — tuning target, 6+ graded runs, echo
  clusters + unspoken history + beat-less P3s still open.
- qwen/qwen3-14b: FRONTRUNNER (Sep 20) — elimination test 1 SURVIVES
  (Medium, $0.021, 0 repairs). Tuning track open in PLAN Phase 7c:
  emotional-grip gap vs 30B, golden-turn few-shots from owner-graded
  best turns, retest checklist per round.
- Alibaba qwen3.8-27b: SPLIT (Sep 20 Medium) — voice survives, P2 echo
  fails. Low voice leader confirmed; not a Medium engine (see session log).
- Z.ai glm-4.7-flash: NOT ruled out — pipe built, never run; Low burn-check
  first, Medium only if clean.
Ruled out already (corpses, do not re-test): small Qwens (burn),
Qwen3.6-35B (thinking-burn + disobedient), Mistral Small 3.2 (loop),
Llama-as-primary (weak), R1-distill (dead), GPT-OSS (OpenAI ban),
qwen/qwen3.6-27b on Groq (404 retired Sep 20 2026 — shared fallback
replaced by qwen3-32b, ungraded).
Anti-overfit rule: fixes must be mechanical/universal (parser forgiveness,
sampling penalties, structural calls) — never model-specific prompt tweaks.
Evidence: the mechanical name prefix made DeepSeek double-name (it names
AND gets named); per-model wording is a treadmill. Park anything that only
helps one model.

## Current ranks (Sep 19 2026, owner-graded live sessions only)

- Style (voice + temperature): Qwen3.8-27B (Alibaba, unthinking) > GLM-5.3-flash > DeepSeek v4.1-flash > Qwen3-30B-A3B (dilemma-grasp best, P2 echo-prone) > Qwen3.6-35B (voice good, obedience bad) > Mistral (loop) > Llama (weak).
- Prompt adherence (contract + Low): DeepSeek (0 repairs) > GLM (3 repairs) > Qwen27B (obeys; quota is the fault, not obedience) > Qwen30B (0–1 repairs; obeys contract, drops gloss/bank rules under load) > Llama > Mistral > burn models (no answer to grade).
- Speed (full sitting pace): Qwen30B paid (~2 min, debate ~1 min) > Alibaba-unthinking (<3.5 min incl. desk) > DeepSeek (~6 min) > GLM (~7 min) > Groq free Qwen (7.5–14 min, walls) > everything else (failed).
- Reliability (finishes sessions cleanly): DeepSeek > Qwen30B paid (5/5 clean) > Alibaba-unthinking > GLM > Groq free > rest (out).
- Value (cost per 5-seat session): GLM-5.3-flash ~$0.018 > Qwen14B ~$0.021 > Qwen30B ~$0.032 > DeepSeek ~$0.036 > Qwen27B paid ~$0.20+.
- Overall: GLM paid (rematch keeps — citations + debts + differentiated P3s, cheapest) ≈ Qwen14B (frontrunner cheap engine, tuning track open) ≈ Qwen30B paid (dilemma-grasp best, echo open) ≈ DeepSeek-parked > Alibaba Qwen27B-unthinking (default while trial lasts) > Groq free Qwen (voice reference) > dead (all small Qwens, Mistral, Llama-as-primary, distill, 3.6-27B).

## Current standing (Sep 17 2026, owner-graded, Low, 2030 question)
- **Qwen3.8-27B (Alibaba, unthinking) — the default while trial quota lasts.**
  Strengths: best voice measured (felt, not admired — Hegel's "mind with
  nothing to fight against," Rose's law-vs-love held open); sub-3.5-min full
  sitting + desk; 0 repairs; 23 calls, 168.6k/5.3k (~$0.08 paid-equiv, $0 on
  quota). Weaknesses: trial ends Dec 16 2026; needs `enable_thinking:false`
  or pace collapses (5-min turns). Watch the quota wall coming.
- **DeepSeek v4.1-flash (OpenRouter paid) — PARKED Sep 20 (was the fallback engine).** Strengths:
  holds the JSON contract every turn, quick start, full session ~6 min,
  plainness mostly holds (Hegel P1 succinct, Bookchin P1 plain, Rose P1+P3
  genuinely Rosean). Weaknesses: voice at ~85% — "arm" limb/tool/weapon blur
  across turns, occasional staccato AI compressions (P2 Hegel), plain words
  combined into harder phrases. Gap is prompt-fixable surface, not model nature.
  First Medium grade Sep 19 (education question, prompt-c): rules firing, no
  arm-blur, 2 strict gloss fails ("praxis", "dialectic" unglossed) — engine holds.
- **GLM-5.3-flash (OpenRouter paid) — runner-up, best backup.** Cooler and
  more even than Qwen; developed turns, widest desk round. 3 repairs, ~7 min.
- **Qwen3.8-27B (Groq free) — retired voice reference.** Superseded by the
  Alibaba route (same weights, seconds not minutes). Free tier walls stand.
- **Desk (all providers) reads easier than turns** — concrete examples land —
  but at medium difficulty while set to Low. Desk level calibration is open.
- **Every Qwen under 27B failed the same way** (3.6-35B, 3.8-flash, 3.5-9B):
  reasoning burn — thinks about the contract/persona until cutoff, answers
  nothing. The contract needs a model that answers instead of thinking.

## Session log (one row per graded run; token columns filled only where the
usage instrument ran — earlier sessions predate it)

| Model | Provider | Time | Tokens (in/out, calls) | Errors | Quality notes | Interim verdict | Next step | Final verdict |
| z-ai/glm-5.3-flash | OpenRouter paid | Sep 20, HIGH normal-form, prompt v2026-09-19am, Cairo, default five, no desk: 7:23 wall (debate 7:02), 26 calls 225.3K/16K (7.8K reasoning, 24.8K cached), 7 JSON repairs, ~$0.021 | FIRST GLM HIGH: PARKED (owner Sep 20 — gibberish rule: word-salad + key-salad + cutoff, no known fix; hypotheses live in ledger 7e-A5). P1s superb — best-voiced set at any level (Klara, Factory Act files, Thesis 3 charge, Beast, Shubra assembly; debts spoken). P2s distinct, no verbatim echo; Shubra held. Coda failed pre-P3 (missing "reformulation" key) — failed notes now
recurring on GLM (second instance same day, truncated mid-negation);
round carried on visibly per design (owner endorses). BUT Marx P3 breaks down mid-turn into word salad ("Batavian Milliner… Sobky shirtlining" — volatility, not voice). P3s otherwise slogan-less. 7 JSON repairs (most on record) yet cost held $0.021 via cache. Margins note contradicts the premise (twelve-to-a-bunk workers when no necessary work remains) — coda premise-blindness, queued in PLAN. Follow-up errors same day (owner console): empty `reformulation` / `new_contribution` / `works_referenced` objects AND key-salad run-on keys with output cut at the 4000-token ceiling — two more volatility flavors at High. Parser stayed fail-soft (visible console diagnostics, session stands). Second High sitting same day (Seoul, filed `docs/eval-sittings/glm-5-3-high-v2-seoul.md`): corruption in 3+ turns — Weil P1 full word salad, Hegel P2 megaparagraph filler, Bloch P3 copies Weil P3 opening verbatim; margins notes show artifacts too. Best turns (Marx P3 slogan, Bookchin P3 Songdo trace-the-cobalt + recallable vote) confirm the voice; the breakdowns confirm the reliability verdict. | **High voice yes, High reliability no** | Needs a clean full High; Medium held meanwhile | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 20, HIGH normal-form, prompt v2026-09-19am, Bangkok, default five, no desk: 0:56 wall (debate 0:54), 17 calls 153.2K/2.4K, 0 repairs, ~$0.020 | FIRST HIGH GRADE: PARKED (owner Sep 20). Bangkok cabinet:
fastest sitting on record because output halved (2.4K vs 4K Medium) —
turns are 2–3 sentence aphorisms, thin for High full-voice, not rich.
Thread city dropped wholesale (Bangkok ×1/15). P2 echo (Bookchin
repeats Weil's "battlefield but a grave" paragraph verbatim). Debts
unspoken (5th round). P3s slogan-less. Citations present (8 works) but
P1 Hegel cites "[UN143]" — unknown tag, provenance suspect. Margins
questions unanswered again. Second High sitting same day
(São Paulo, Lenin/Bogdanov/Bloch/Weil/Bookchin cabinet, filed
`docs/eval-sittings/qwen3-30b-a3b-high-v2-saopaulo.md`): PARK
CONFIRMED — zero repairs, no gibberish, but same thinness (P1 names no
child/city; city only from P2), Weil≈Bookchin P2 echo again, P3s
slogan-less, debts unspoken. 0:56 debate, ~$0.019. | **Parked at High — thin, not full voice** | 14B tuning (Phase 7c); GLM High probe owed | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 20, Medium normal-form, prompt v2026-09-19am, Buenos Aires, default five, no desk: 1:44 wall (debate 1:25), 18 calls 167K/4K, 0 repairs, ~$0.022 | MEDIUM RETEST (owner v15): city held throughout (Buenos Aires every pass); 9 citations pass-annotated; closing summary correct shape (use + Bloch new move + Hegel weakest). BUT pairwise P2 echo persists (Marx≈Bloch share "abandon the citizen" paragraph verbatim; Weil≈Bookchin share "loss of the burden" paragraph verbatim) — and both lift margins-note phrasing wholesale ("analyse systems, dismantle hierarchies, dream beyond algorithms"): performing the note, not answering it. Debts unspoken again (4th round). P3s beat-less (no slogans, no why-better). Hegel P1 thinnest (two generic paragraphs, no people). Margins questions (repair workshops, co-op farms) unanswered in P3 — rudeness note confirmed. | **Fast + cheap, faults persist — loses Medium to GLM** | High probe still open; 14B tuning (Phase 7c) | Open |
| qwen3.8-27b | Alibaba (visitor key) | Sep 20, Medium normal-form, prompt v2026-09-19am, Nairobi, default five, no desk: 3:15 wall (debate 3:11), 18 calls 180.4K/6K (10.8K cached), 1 JSON repair, ~$0.090 paid-equiv ($0 on trial quota) | FIRST MEDIUM GRADE: SPLIT. P1s genuinely voiced and distinct (Friedrich + loom, cunning of Reason; Marx flips Hegel on surplus-value; Bloch charges Marx with static abolition; Weil charges Bloch with Novum-illusion; Bookchin charges Weil with mechanic-trap). Debts spoken throughout. 8 citations pass-annotated. P3s differentiated with slogan + margins answers (Weil/Bloch answer bodies-break directly). BUT P2s echo catastrophically: identical "atrophy of political agency / citoyen rebirth / not just fix pipes" paragraph closes 4 of 5 turns; Marx/Bloch/Weil openers share "friction of scarcity / forge of agency / hollow shell" near-verbatim. Same cluster-echo fault as Qwen30B, worse here. Hegel P1 opens Berlin against Nairobi thread (persona-default? same as GLM's Hegel). Margins notes strong both rounds. | **Voice survives, engine fails — Low leader, not Medium** | Stays Low default; Medium is GLM vs 30B | Open |
| z-ai/glm-5.3-flash | OpenRouter paid | Sep 20, Medium normal-form, prompt v2026-09-19am, Johannesburg, default five, no desk: 5:26 wall (debate 4:26), 21 calls 189.6K/14.5K (5.3K reasoning, 14.9K cached), 3 JSON repairs, ~$0.018 | REMATCH: KEEPS. P3s genuinely differentiated — five distinct slogans (pipe decides / count-then-claim / machines to the school-street / assembly assigns the ache / no assigned ache + child votes own curriculum), Bookchin breaks from Hegel rather than echoing. Thread city mostly held (Hegel P1 opens Berlin against Johannesburg thread; Bookchin P3 names no city; rest hold incl. Hillbrow/Soweto/Alexandra). Citations present (9 works, pass-annotated — beats 14B's empty list). Debts spoken (Marx sets dialectic on feet; Bloch Thesis 3; Bookchin→Weil via Macdonald twice). Margins strong with banked first-steps per seat. Pace 4:26 debate for 15 turns — under 8-min wall and faster than reading time per owner note. Faults: Hegel P1 city break; closing summary names use + new move but weakest-shot is Hegel-roast rather than turn-grade; Berlin opener suggests PLACES still weak on P1. | **Keeps — engine challenger, best backup confirmed** | Alibaba 27B Medium next | Open |
| qwen/qwen3-14b | OpenRouter paid | Sep 20, Medium normal-form, prompt v2026-09-19am, Bristol, default five, no desk: 1:53 wall (debate 1:35), 18 calls 165.7K/4K, repairs 0, ~$0.021 | ELIMINATION TEST 1: SURVIVES — contract held, no burn, no loop. Name-first openings clean ("Hegel, You claim…" — prefix + body, no doubling). Turns punchy and varied; P3s concrete (loom-gazing, co-ops, seize-the-means). Closing summary present with use + praise (weakest-shot missing). Faults: thread city DROPPED (Bristol never mentioned — PLACES ignored); zero citations all sitting (reading list empty despite grounding on); history debts unspoken; "More's Utopia" filler slip in Bloch P2. Cheapest ticket works. | **Survives — cheapest viable engine** | GLM rematch next | Open |
| deepseek/deepseek-v4.1-flash | OpenRouter paid | Sep 20, Medium, prompt v2026-09-19al, Accra, PARTIAL — 3 turns then HALT (no pass 2/3, no notes): 11:57 wall, 8 calls 77.3K/2.2K (16.8K cached), 3 JSON repairs, ~$0.013 | Judgments below cover P1 ONLY — nothing about later passes can be read from this sitting. VOLATILE. Hegel P1 catastrophic word salad (German/Korean/Japanese fragments, fake-equation babble — breakdown, not voice). Marx P1 good WITH history debt spoken ("thirty years I sat with your dialectic") and Accra held — but double-named ("Hegel, Hegel,") by prefix+model, now mechanically deduped (same push). Bloch P1 good, Accra workshop held, also double-named. Then halt: missing-negation + empty-key slips (both now salvaged, same push). Reading-list pass annotations work. 12 min for 3 turns is unusable pace regardless. | **Unusable this outing — pace + volatility** | Revisit post-fix; needs a clean full sitting | Open |
| deepseek-ai/DeepSeek-V4-Flash-0731 | DeepInfra (visitor key) | Sep 20, Medium, prompt v2026-09-19ak, PARTIAL — owner stopped after 2 turns: 7:36 wall for 3 calls | Judgments cover P1 ONLY. Slow to start; primary failed on turn 2 → Llama-3.3-70B backup rescued per pipe design (console holds reason). Hegel P1 genuinely good (owner: best style yet — "stimulus to go further", pedagogy-of-play close). BUT reads High, not Medium: terms unexplained, abstract, no gloss/elaboration firing. Owner: hold all prompt edits while testing is this slow. | **Voice best, level wrong, pipe slow** | Revisit when fast; level calibration pending | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19ak (margins voice fix live), Athens, FULL cabinet, no desk: 1:42 wall (debate 1:38), 39 calls 393.6K/7.9K, repairs 0, ~$0.051 | Margins voice FIXED — late note does "bro / Real talk / TikTok" in normal grammar, closing "based" lands. End note present. P2 "You're right that…" shape holding. Athens in P3s. BUT: name-first opening (aj) FAILED — turns open "Your claim…" with no name; history debts STILL unspoken in P1 (third round); echo clusters persist (Rose≈Fisher P1/P2 diremption paragraphs; Bookchin/Deleuze/Rose/Fisher P2 voids paragraph; P3 hack-paragraphs shared); P3s lack slogans/beats. Premise holds; stances fine. | **Voice + end-note good; name-first and history need new levers** | Retest; consider structural name prefix | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19ai, Manila, FULL 12-seat cabinet, no desk: 1:33 wall (debate 1:31), 38 calls 390.5K/7.4K, repairs 0, ~$0.051 | Full-cabinet pace holds (36 turns in 91s). Turns punchy throughout; P2 "You're right that X…" shape holding; Manila in P3s; premise holds; stances intact. Echo persists in pairs/clusters (Lenin≈Bogdanov P1 opening; Rose≈Fisher P1 diremption paragraph; Bookchin/Deleuze/Rose/Fisher P2 voids paragraph). History debts STILL unspoken in P1 despite relate-order. P3s lack slogans/beats. END NOTE MISSING AGAIN with no failed state — trigger verified in place, so either silent empty-lines return (now made visible, same push) or the call never fired; console marker added. Gloss bare as accepted. | **End-note trigger needs console evidence; echo now cluster-shaped** | Owner: check console for [Margins-end]; retest | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19ad (pass shapes live), Lima, no desk: 0:49 wall (debate 0:47!), 18 calls 163.2K/3.4K, repairs 0, ~$0.021 | PUNCH ACHIEVED — cheapest, fastest sitting on record; turns genuinely short, no shared paragraphs, pronouns clean throughout, premise holds, Lima in P3s, closing summary correct. Shapes PARTIALLY held: P1s do reject-then-diagnose; P2 second paragraphs drift back into building (not handoffs); P3s lack slogans and beat-sentences (Z present but unmarked, no why-better). History debts STILL unspoken in P1 (Marx→Kant, Bloch→Marx leave no trace) — the P1-gated order fires no better than the old line. Gloss bare as accepted. | **Speed + brevity solved; P2-handoff, P3-slogan, history need teeth** | Retest after next pass; leak rule still queued | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19x (label ban live; pre name-first/cap), New Orleans, no desk: 2:19 wall (debate 2:18 — slowest yet, cause unknown), 17 calls 167.9K/5.6K, repairs 0, ~$0.023 | Label-word ban FAILED outright — "What I reject / what I inject" in nearly every turn, word-for-word the banned shape. Echo persists (P1 Bloch copies Bogdanov's paragraphs; P2 Lenin≈Bogdanov≈Bloch share; P3 Bloch≈Bogdanov share). P3 demands differentiated (cooperatives, transit/energy, gardens) — transform rule still the best lever. NO closing summary in export despite end-note code live — trigger fires post-loop so either the call failed silently into the deck's failed card (export hid it; now prints the failure line, same push) or it never ran; owner to check deck. Thread city DROPPED — New Orleans drawn, zero turns mention it (PLACES ignored wholesale). | **Ban ignored, city dropped, end-note missing — needs owner eyeball on deck** | Confirm end-note deck state; leak rule after retest | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19t (echo guard live; pre-dates name-first u + cap v), São Paulo, no desk: 3:25 wall (debate 2:00), 28 calls 282.8K/10.3K, repairs 10 (JSON 0 · gloss 0 · echo 10), ~$0.039 | Echo guard FIRES but DOES NOT CURE: 10 rewrite retries, yet P2 Bookchin still copies Bloch's paragraph verbatim and all five P3s share the Not-Yet/scientific-dreaming blocks — retries converge right back onto the same attractor. Same spend-without-gain shape as gloss. P1 the best yet (Bogdanov psychic-degression voice genuinely distinct; Bloch gardens/collectives with a half-gloss of Not-Yet). Name-first absent as expected (predates u). Closing summary works twice running — and roasts the echo itself ("repeating the same line like reading off a script"). São Paulo held. | **Echo retry joins gloss retry on the rollback list — detector stays as logger** | Retest under u/v, then decide | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19q (no gloss retry), Cairo, NO DESK: 2:26 wall (debate 1:05), 18 calls 170.8K/6.2K, repairs 0 (JSON 0 · gloss 0 — split counter works), ~$0.024 | Cheapest full sitting yet. Closing summary present, correct shape (Bookchin praised, Kant shot). Cairo held. Echo STILL the fault: P1 Bloch≈Marx share a full paragraph; P2 Marx≈Bloch≈Bookchin share the surplus-populations paragraph; P3 Bloch≈Marx share opening. Kant P2 smuggles jobs ("vocational training... barter") + preaches endurance — premise break. P3s repeat "dismantle the curriculum of scarcity" across seats (transform rule partially ignored). Gloss still bare (Not-Yet, decreation unglossed) — accepted, desk carries it. Owner directive from this grade: less per pass, sharper jobs — P1 diagnosis with one specific rejection, P2 PREV's internal contradiction only, P3 action + better-than. | **Echo is now the last big fault** | Pass-job sharpening (this push); leak rule after retest | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19p (end-note live), Marseille: 2:12 wall (debate 1:42), 38 calls 372K/17K, 12 repairs, ~$0.053 | Read-verdict: READ P1 + closing summary, SKIM P3, SKIP P2. P1 excellent (wage-labourer discipline → Not-Yet-Become → decreation → citizen-as-builder, a real chain). CLOSING SUMMARY WORKS — first appearance, correct shape (use / new move for Spinoza / weakest-shot at Marx). BUT: P2 mass echo again (Marx/Bloch/Weil/Bookchin all open on "adequate ideas of the multitude"; waste/transport/energy paragraph repeats across four turns); 12 REPAIRS nearly doubled cost ($0.053) yet hard terms STILL bare in turns (Not-Yet-Conscious, wage-labourer, decreation) — the retry fires but doesn't cure, suggesting replacements arrive with glossary yet inline still bare, or retries fail silently into originals; needs repair-efficacy check. PROMPT LEAK: Bookchin P3 quotes the relationship line verbatim ("You owe Spinoza this: named in EoF…") into prose. Desk watch: Rose now defines dictionary-style (violates the letter, serves the reader — consider allowing). ~$0.053. | **End-note confirmed; repairs need efficacy audit + leak fix** | History-lines-never-quoted rule; check what the 12 repairs actually returned | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19m (hard-terms + bank openers live), Istanbul: 1:49 wall (debate 1:10), 24 calls 227.1K/9.3K, 0 repairs | Read-verdict: READ P1 + P3, SKIP P2. P1 genuinely good (estrangement→rupture→dissolution-of-economic-categories arc; Weil gravity vs Bloch wonder is a real fight). P3s differentiated with concrete demands. Istanbul held; no loops; quick. BUT both m-fixes FAILED: hard-terms list ignored — Not-Yet-Conscious, wage-labour/estrangement, gravity, Great Beast all bare in turns (3rd round the gloss rule dies: persona tail → section tail → hard list, model meets none under JSON load); bank openers absent — late note ends "...even if it's just pretend for now" with no use/praise/shot sentences. P2 echo persists pairwise (Marx≈Lenin share full opening paragraph; Bloch≈Weil share theirs) despite penalties. Residue: Lenin engineers again; Weil "mend tools" + Hegel-desk "repair devices" smuggle manual labour back against the premise (Weil's rootedness makes hers on-profile — flag, not fail). Minor: P3 Bookchin leaks "Works referenced:" into prose. Desk gloss much better (Rose: diremption/reification/misrecognition each with woven meaning). ~$0.032. | **Prompt words exhausted for gloss + bank — needs structural fix** | Separate bank call; gloss via desk or repair pass | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium normal-form, prompt v2026-09-19l (section diction live), Glasgow: 2:14 wall (debate 1:03), 24 calls 225.9K/10.4K, 0 repairs | FIX-CHECK vs the six: loops GONE (no within-turn repeats); length HELD (quick thrusts); pronouns MOSTLY (YOU-address consistent; one slip: "As Bookchin notes" self-third-person); bleed BETTER (desk attributes terms per seat; no degression-theft); premise MOSTLY HELD — Hegel P3 even polices it ("reject the reduction of education to vocational training"); Lenin's "engineers/technical instruction" residue is the borderline (governance or jobs-smuggling?). TWO MISSES: (1) section-embedded gloss IGNORED — Not-Yet-Conscious, diremption, Great Beast, Novum all stand bare in turns despite the diction tail sitting inside the task; placement is not the problem, capacity under JSON load likely is; (2) margins bank ABSENT — late note asks questions but names no most-innovative move, no praise, no parting shot. Stances fine (Bookchin assemblies, Weil decreation not strawmanned). ~$0.032. | **Gloss + bank still open, rest holds** | Bank enforcement; gloss fallback plan | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium NORMAL-form, prompt v2026-09-19h (penalties + transform + scan live): 2:14 wall (debate 0:58!), 25 calls 227.9K/8.9K (3.7K reasoning), 1 repair (recovered) | Fixes LANDED: no within-turn loops anywhere; turns quick and differentiated; P3s carry five distinct demands (youth councils, hacker clubs, cooperative circles, vocational+philosophy, media literacy) — transform-not-parrot firing; Mumbai held every turn; margins names missing perspectives (disabled/poor kids) and lands a plain visitor question. Desk now defines terms ("adequate idea" = tree-from-sunlight) — elaboration alive there. REMAINING: turn-level Medium gloss still absent (sublation, diremption, Not-Yet-Conscious, reification unexplained); desk voice bleed (Fisher "degressing", shared framing sentences across Spinoza/Kant/Bogdanov); PROVENANCE: Rose turn/desk citations resolve to metadata-only works with no URL ([88]/[89]) — model-claimed from profile knowledge, never shown in-session; reading list now marks these honestly (same push). ~$0.032. | **Keep tuning — best sitting yet** | Turn-gloss enforcement; desk voice guard | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium, FULL economy, education question, prompt v2026-09-19f (closing scan live): 2:54 wall (debate 1:15), 25 calls 228K/12.3K (4.1K reasoning), 0 repairs | P1s still the best dilemma-facing set (non-labour as new unity, who-controls-education). But the f-scan did NOT cure sameness: "new unity formed by capital's demand for non-labour" + "who controls the education system when work is gone" echo across Marx/Lenin/Weil/Rose P1s; P2 Hegel repeats the long UN144 pedagogy paragraph twice verbatim IN-turn (scan ignored); P3 Weil loops "become nothing / bare instant" many times (scan ignored); P3 Lenin≈Marx identical (same slogan, same "beats Weil's idea on the exact point" wording); P3 Hegel≈Rose identical (same "think through the machine" slogan). Margins twice strawmans Weil ("kneel", "brainwashing") instead of steelmanning decreation. Elaboration rule (e) not visibly firing — sublation/diremption/decreation/reification unglossed. Desk faults: Bogdanov called twice; Bloch/Bookchin/Fisher/Deleuze desk answers ventriloquize Bogdanov ("degression", "basic metaphor" — voice bleed); Spinoza/Kant/Bogdanov share framing sentences. ~$0.034. | **Dilemma-grasp best, P3 convergence worst — scan insufficient** | Reformulation must TRANSFORM margins/survey (ban repeat slogans); desk variety; Weil steelman check | Open |
| qwen/qwen3-30b-a3b | OpenRouter paid | Sep 19, Medium, education question, prompt v2026-09-19d: 2:47 wall (debate 1:39), 24 calls 221K/10.6K (4.4K reasoning), 0 repairs | FAST + contract-clean (0 repairs, quick start — no burn; hybrid-thinking fear unfounded on this route). Stances hold: Bloch "socialised humanity"/dismantle-conditions, Bookchin assembly/municipal hubs, Lisbon thread held all sitting. FAULTS (all cross-seat sameness): P1 echo — Marx/Bloch/Bookchin share "created a new form of labor that must be prepared for, even if it is not the same as before" near-verbatim (echo-rule fail); P2 mass echo — Hegel/Marx/Bloch open with the identical Fisher-paraphrase paragraph ("market Stalinism", "hauntological space"); Marx P2 loops one sentence ×4 verbatim (NO LOOPS fail) AND speaks in Hegel's voice ("cultivation of the Concept" — voice bleed, un-Marxist); P3 formula — all five turns run "mystification of X as a transcendental force" + identical "replace corporate textbooks with community-led lesson plans" demand (margins parroted, not transformed); Medium gloss fails throughout — "Concept", "Not-Yet-Conscious", "hauntological", "business ontology", "market Stalinism" stand unexplained, and the margins note itself quotes "Not-Yet-Conscious" instead of translating it. ~$0.032. | **Cheap fast backup, not engine-grade** | Echo/loop prompt work, then rematch vs DeepSeek | Open |
| deepseek-v4.1-flash | OpenRouter paid | Sep 19, Medium, 8:31 wall (debate 8:29) | 212.4K/7.5K, 26 calls (15 turns + 2 codas + 8 desk + 1 repair), 11.5K cached | 1 repair | First Medium grade + first education-question grade (prompt v2026-09-19c). Prompt-c rules firing: drop/reject/inject in all five P3 turns; margins toilet-cleaner question answered by every P3 seat; consequences drawn in P2s; contradiction-first openings. No arm-blur. Medium lens: turns execute plain — few kept terms, but "praxis" (Bloch P1) + "dialectic" (Deleuze P3) stand unglossed (2 strict fails); no announced definitions (good). Faults: thread-city break (Hegel P1 opens Berlin, city Belgrade); "You hand the child a key" ×3 consecutive P3 openings + "I mourn that" ×2 P1 closings — pure model echo (neither is a stock variant, verified). Desk mixed levels, several read Medium+. ~$0.036 (8 desk calls + grounding beat the $0.015 no-desk budget). PROVENANCE BUG: export printed "Level: low" — the SITTING line read the picker at export time, not the run snap. Fixed same day (Begin records, resumes append, export prints the trail). | **Fallback engine, Medium holds** | GLM Medium rematch | Open |
| qwen3.8-27b | OpenRouter paid | ~5 min debate (+desk/reading to 11:46 wall) | 199.5K/5.9K, 26 calls, 0 repairs | New prompts v2026-09-17b, Naples thread held; heat lived (P2 Marx "trash", P3 Spinoza "toy"); Rose superb; desk skipped (forgotten) | Matches Alibaba voice; route viable | Cheaper route? | Open |
| glm-5.3-flash | OpenRouter paid | Retest Sep 18 (new prompts v2026-09-17b): 5:43 wall, 24 calls 182.8K/7K (1.8K reasoning — throttle holds), 0 repairs, 896 cached | Cleared decisively: thread city Dhaka held all sitting; TIME RULE minimum/horizon named; debt heat lived (Bloch/Marx shoulders lines, Bookchin-on-Bloch); desk individuated (Rose/Fisher superb); margins strong | **Best backup; engine challenger** | Paid Qwen27B route next | Open |
|---|---|---|---|---|---|---|---|---|
| deepseek-v4.1-flash | OpenRouter paid | ~6 min full session | n/a (pre-instrument) | 1 transient desk empty-body | Hegel/Bookchin P1 good; Rose excellent; "arm" blur; P2 Hegel staccato | Engine candidate | Trio grade | **Engine default** |
| deepseek-v4.1-flash | OpenRouter paid | ~3 min, 1 repair, 25 calls 194.9K/7K (25K cached) | DeepSeek's best session (new prompts): thread city Istanbul held all sitting; TIME RULE visible (minimum/maximum named); debt heat lived; cache proven working. Faults: Spinoza desk emitted pseudo-XML `<phish>` tags; Weil desk cut mid-sentence | **Fallback engine, gap closing** | Desk variety grade | Open |
| qwen3.8-27b | Groq free | 11 min (pass 2 seat 4); 14.24 min + 3 resumes | Day total 66K/3.8K ≈ $0.07 | 429s mid-session, slow resumes | Best voice+plainness (Bloch P1); odd metaphors; wrong-continent examples | Voice reference | Paid retest | **Voice ref; free walled** |
| Qwen3.6-35B-A3B | DeepInfra | 2.5 min first card; stuck pass 1 at 11.5 min | n/a | Thinking burn | Ignores Low (school-terms + citations) | Fail | — | **Out** |
| qwen3.8-flash | OpenRouter paid | 3.5 min stuck seat 1 | n/a | Burn (content null, length) | None (no answer) | Fail | — | **Out** |
| qwen3.5-9b | OpenRouter paid | 2+ min silence | n/a | Burn (content null, length) | None (no answer) | Fail | — | **Out** |
| mistral-small-3.2-24b | OpenRouter paid | 50s start; 2+ min stuck seat 1 | 13.2K/1.3K, 2 calls | Empty body, then ~30× scaffold loop | No voice (loop); desk Spinoza decent | Fail | — | **Out** |
| glm-5.3-flash | OpenRouter paid | ~7 min | n/a | None reported | Grade pending (owner reading) | Testing | Grade it | Open |
| qwen3.8-27b (thinking) | Alibaba | 5+ min seat 1; 90s timeout later | 6.8K/3.6K first turn (3.5K hidden thinking) | Timeout | Plain, concrete opening | Slow | Disable thinking | Superseded |
| qwen3.8-27b (unthinking) | Alibaba | <3.5 min full sitting + 6 desk | 168.6K/5.3K, 23 calls, 0 repairs | None | Best session yet (owner) | **Default** | Watch Dec quota | **Default (trial)** |
| qwen3.8-27b (unthinking) | Alibaba | 2:45 full sitting + 9 desk | 195.5K/5.9K, 26 calls, 0 repairs | Pace record. New-prompt faults: PLACES ignored wholesale (Berlin ×15); desk openings formula-shared; Lenin desk in Kant's vocabulary; margins still numbered (bundle-version suspect) | Default holds | Fix PLACES, desk variety, margins check | **Default (trial)** |
| deepseek-r1-distill-qwen-32b | Groq free | — (instant fail) | — | 400 decommissioned | — | Dead | — | **Out** |
- `deepseek-r1-distill-qwen-32b` (Groq free): DEAD on arrival Sep 17 —
  decommissioned (400), never tested. Groq ID churn claims another one.

## New candidates (Perplexity round 2, Sep 17 — UNTESTED, prices not
independently verified, do not quote)
- `mistral-small-3.2-24b` (OpenRouter paid `mistralai/mistral-small-3.2-24b-instruct`):
  FAILED live Sep 17 (owner): 50s to start, 2+ min stuck on seat 1, then
  empty body (200, nothing in it). Non-reasoning by construction did not
  save it. Retry produced a turn: catastrophic loop — "The issue/problem/
  contradiction/danger is not X but Y" repeated ~30 times in one Hegel turn
  (a scaffold family our ban list only half-covered; extended same day + new
  NO LOOPS rule). Voice verdict: dead. Desk Spinoza on the same model read
  plain and decent — turns unusable, desk tolerable. Out.
- `glm-5.3-flash` (~$0.075/$0.25 promo, $0.15/$0.50 list claimed): MIT-licensed
  open weights. Promoted from parked-fallback to test candidate on price/perf
  reports. Same test. (Zhipu-owned; allowed — ban is OpenAI-only.)
- `qwen3-14b` / `qwen3-30b-a3b` (DeepInfra, ~$0.10–0.12/$0.24–0.30 claimed):
  different architectures from the burned small Qwens; may dodge the burn.
  Needs DeepInfra primary code to test there, or OpenRouter paid box if listed.
  VERIFIED on OpenRouter `/models` API Sep 19 2026: both live —
  `qwen/qwen3-30b-a3b` 131k ctx $0.12/$0.50, `qwen/qwen3-14b` 131k ctx
  $0.12/$0.24 (owner reports Test key passes on both). Both undercut
  `qwen/qwen3.8-27b` ($0.214/$2.55 same API): ~5× cheaper output on 30b,
  ~10× on 14b; ~$0.011–0.012 per 5-seat session vs ~$0.027 for 27B
  (85.3k in / 3.5k out budget). Cheaper still: `qwen/qwen3-30b-a3b-instruct-2507`
  262k ctx $0.048/$0.19 (~$0.005/session). Caution: Qwen3 hybrid thinking —
  same burn family as the failed 9B/Flash; grade live before trusting.
- Non-thinking models (owner question Sep 17): Mistral-Small is non-reasoning
  by construction — top of the queue doubles as this test. DeepSeek v4.1-flash
  is already effectively non-thinking (obedient, no burn observed).
- Rejected from the same report: Llama-3.1-8B (Llama-family verdict stands);
  Groq paid 3.8 (our verdict stands); free-tier-as-production (stands).
  Corrected: report's Groq 3.8 rates ($0.59/$0.79) look guessed — our observed
  free-tier behavior (429s mid-session) overrules its "3–4 sessions/day" math.

## Verdicts

| Date | Provider | Model | Verdict |
| ---- | -------- | ----- | ------- |
| Sep 2026 | OpenRouter paid | `deepseek/deepseek-v4.1-flash` | WORKING, graded live by owner: quick starting, main turns good, full session ~6 min. Desk path threw one transient empty-body on the same model (new logging caught it); desk paid path now retries once on server errors. Formal trio grade Sep 17 (owner, Low, AGI-jobs question, 5 seats): Hegel P1 succinct and good; Bookchin P1 plain and good; Rose P1+P3 excellent (shared split named, middle held open, no cheap resolution); Marx/Bookchin P2 concrete and good. AI-isms: "arm" used weirdly throughout (P1 Marx, P2 Bloch — reads as weapons at times); P2 Hegel staccato AI mess; low words combined into harder phrases (P2 Bloch). Margins tone good but numbered lists + bracketed names unreadable aloud (prompts fixed same day: flowing paragraphs). Desk answers read easier than turns (concrete examples land) but at medium difficulty, not Low — desk level calibration open. Fixed same day from this eval: export headings use short names; TTS strips [nn]; margins ban lists/brackets. |
| Sep 2026 | OpenRouter free cycle | Router-first + 19-model named bench = full live coverage (all 20 free minus the content-safety filter, verified via `/models` API Sep 15 2026), ordered by context desc (1M inkling ×2 / Nemotron ultra+lightning → 512k dots-3 → 262k Gemma/Ling/Nex/super/Laguna → 256k nano-omni-reasoning + north → 65k liquid → 32k glm-5.2 relisted). Removed: `qwen3-coder:free` (coder-tuned), `deepseek-v4-flash:free` (404 since Jun), `qwen3-next:free` (gone). Owner: gpt-oss via router accepted, never pinned. Voice-shift across turns accepted as entertaining; last-good still holds a named model once one succeeds. | More models = more per-model quota. New arrivals (inkling, dots-3, ling-vl, nano-omni) untested against the JSON contract — watch the salvage logs. Paid pin `deepseek/deepseek-v4.1-flash` verified LIVE same day. |
| Sep 2026 | Groq direct (visitor key) | `qwen/qwen3.6-27b` | DEAD for visitor keys (404: no such model or no access) despite the live docs page. Pinned dropdown removed same day — Groq model is now a free-text ID field, Test key verifies immediately. Llama-as-primary also rejected same day: weak prompt adherence per owner — Llama stays rescue backup only. |
| Sep 2026 | DeepInfra | `Qwen/Qwen3.6-35B-A3B` as primary | FAILED live (owner session): 2.5 min to first card, still on pass 1 at 11.5 min — session abandoned (thinking-burn confirmed) + ignores Low — Pass 1 reads as school-terms with citations, no plain words. Voice good, obedience bad. Not the quick Qwen. Pin removed Sep 19 2026 (see next row) — this ID stays buried. |
| Sep 19 2026 | OpenRouter paid | `qwen/qwen3-30b-a3b` | Five graded Medium runs same day (education question, prompts d→f→h→l→m): no thinking burn, 0–1 repairs, ~$0.032/session, debate down to ~1 min. Best dilemma-grasp of any model (P1s sit inside the question's horns); sampling penalties (v2026-09-19g) killed within-turn loops; transform rule fixed P3 parroting; thread cities held throughout. Standing faults: pairwise P2 echo, turn-level gloss ignored through three placements, margins bank absent twice, Lenin-engineers/premise residue. Prompt words judged exhausted for gloss + bank — structural fixes pending (separate bank call; gloss repair pass or desk-carries-clarity). Was the tuning target; since Sep 20 the tuning track is Qwen14B (PLAN Phase 7c) and the Medium holder is `z-ai/glm-5.3-flash`. |
| Sep 2026 | Groq free (visitor key) | `qwen/qwen3.8-27b` | VOICE VERIFIED, QUOTA-WALLED: immediate first card, output genuinely good — but 429s inside pass 1, slow resumes, 11 min to pass 2 seat 4. Free tier can't carry a session. Second full eval Sep 17 (owner, Low, AGI-jobs question): 14.24 min + 3 resumes — too slow, but best quality so far: ideas + emotional tone held at plain level (Bloch P1 exemplar), margins voice better than DeepSeek's. AI-isms: odd metaphors ("crisis of stealing", "locking the door while inside"), mixed metaphors (Bloch), far-flung geography for German thinkers. Second full eval Sep 17 (owner, Low, new 2030 question, Groq free): pass 2
seat 4 in 7.5 min with one quota resume — fastest Qwen session yet, voice
holds (developed turns, Bookchin/Rose determinations strong, margins voice
good). New RAG visible live: [54] Social Ecology and Communalism cited.
"Robots" in the old question triggered no arm-blur this time.
Measured Groq free walls Sep 17: input TPM limit ~7K/req wall (413 at 7271;
5640 used + 5818 requested vs 7000 ITPM limit); owner day-total 66K in /
3.8K out ≈ $0.07 paid-equivalent. Paid same-ID is the obvious next test. |
| Sep 2026 | OpenRouter paid | `qwen/qwen3.8-flash` | FAILED live (owner session): reasoning burn — content null, finish `length`, reasoning trace shows it thinking about the JSON contract until cutoff; `reasoning.effort:low` ignored. 3.5 min stuck on seat 1. Same failure shape DeepSeek had pre-mitigation, unmitigable from here. Paid-pin error copy fixed same day (no more "trying the next one" on a pin). |
| Sep 2026 | Perplexity review | GPT-OSS 20B/120B on Groq | REJECTED without test: OpenAI-owned, standing rule bans OpenAI models ever (app migrates `openai/*` IDs out). GLM-5.3 Flash noted only as later non-Qwen fallback — voice unproven, not this round. Free-tier-as-production (ling, union-alpha) rejected: daily caps can't carry sessions. Perplexity's load math (7 turns/min) doesn't match us — single visitor, ~15–30 turns/session, so per-session cost rules: DeepSeek ~$0.01, Flash ~$0.02, paid 3.8-27B ~$0.20+. |
| Sep 2026 | DeepInfra | `deepseek-ai/DeepSeek-V4.1-Flash` ($0.20/$0.60) | Deliberately NOT pinned on DeepInfra — stays the OpenRouter paid default; one winner per pipe, less confusion. |
| Sep 2026 | DeepInfra | Qwen3.8-27B ($0.40/$3.00 output) | Exists on DeepInfra but rejected on price — output rate kills the value case. Groq free stays the qwen path. |
| Sep 2026 | OpenRouter paid | `qwen/qwen3.5-9b` | FAILED live (owner session): same reasoning burn as Flash — content null, finish `length`, trace shows it thinking about the persona instead of answering; 2+ min silence first. 9B can't hold the contract. Cheapest-Qwen line ends here. |
| Sep 2026 | Together | `Qwen/Qwen3-30B-A3B` ($0.30/$1.20 — priciest in the cabinet) | Still unverified AND most expensive per debate (~$0.03/5-seat). Drop candidate once the A/B settles. |
| Sep 2026 | OpenRouter | `qwen/qwen3.8-27b` (paid, ~$0.15–0.35 in / ~$2–3 out) | Exists but rejected on output price vs DeepSeek. |
| Sep 2026 | Shared/desk | Groq free-tier input wall (~7k/req, observed 413 at 7271) | Shared turns take the lean ration (2×650-char passages, trimmed PREV, note+5 survey) and run Low only; desk takes the same ration on shared/groq (history + full table lines untouched). |
| Sep 2026 | OpenRouter | `z-ai/glm-5.2:free` | Earlier verdict was retired (404) — but re-listed on the live `/models` API Sep 15 2026 (back in the free cycle) and still listed Sep 19 2026 (447 models). Cycle covers it; watch the salvage logs. `minimax/minimax-m3:free` stays out (not listed Sep 19 2026). |
| Sep 2026 | OpenRouter | `openai/gpt-oss-120b` (paid) | Worked, then daily key cap hit. Removed: no OpenAI models, ever (standing rule). |
| Sep 2026 | Gemini direct | `gemini-3.6-flash`, `gemini-3.5-flash-lite` | Worked with `thinkingLevel:low`. Provider removed Sep 2026: 2.5 retired (404 for new keys), consolidating on fewer providers. |
| Sep 2026 | Gemini direct | `gemini-2.5-flash` | Retired by Google (404 for new keys). Never re-add. |

## Free-provider shelf (awesome-free-llm-apis, evaluated Sep 17 2026 — NOT tested)
Rule: these are BYOK-only candidates. Per-user/per-IP free quotas can't ride
the shared server key (one global quota = one visitor eats everyone's share).
Each needs a new provider pipe (code) unless reachable via OpenRouter paid.
- Mistral AI direct (free mode, no card, $10/mo credits): Medium 3.5 / Small 4 /
  Large 3. Real candidate — own key, generous. Caveat: prompts may train
  models unless opted out (same warning our OpenRouter copy already carries).
- Z.ai GLM-4.7-Flash (permanent free, no card, api.z.ai endpoint): pipe BUILT
  Sep 19 2026 (`src/lib/zai.ts` + Settings + desk, default `glm-4.7-flash`,
  base `https://api.z.ai/api/paas/v4`, $0/$0) — live session pending.
  Caveats stand: reasoning always-on (burn risk, no disable flag); 1 concurrent
  request (slow sessions); ~1 req/sec, ~1K req/day reported.
- Ollama Cloud free tier (ollama.com/v1, OpenAI-compatible): serves
  deepseek-v4-flash — a free backup route for our engine. Session/weekly
  limits unpublished; verify live.
- NVIDIA NIM (dev-program membership, 40 RPM/10k RPD): mistral-large-2,
  gemma-4-31b, nemotron. Generous; membership is the price.
- Cloudflare Workers AI (10k neurons/day, no card): mistral-small-3.1,
  r1-distill-qwen-32b. Non-OpenAI API shape (`/ai/run`) — moderate pipe work.
- OVHcloud anonymous (no signup, 2 RPM/IP): Qwen3.6-27B, Mistral-3.2-24B.
  Too slow for sessions (one request per 30s); curiosity only.
- Rejected from the list: gpt-oss rows (OpenAI ban); Gemini (dead for new
  keys); Kilo/LLM7 anonymous routers (random routing breaks voice continuity
  — same objection as `openrouter/free`); Cohere trial (non-commercial clause
  + 1000 calls/mo); SiliconFlow/ModelScope (ID verification); Aion (roleplay-
  tuned, wrong shape for the contract). Mistral direct pipe declined by owner
  Sep 19 (Small 3.2 already dead live — a new route can't fix the model).

## Pending verification (user fetching keys)

- Together `Qwen/Qwen3-30B-A3B` — ID supplied by user, unverified against the catalog (no key yet; skip until the owner adds one).
- Alibaba Cloud Model Studio (owner account Sep 17 2026): 233 models × 1M
  free tokens each, expiring 2026-12-16. Trial goldmine, not a long-term
  dependency. Enable Stop-on-Exhaust (auto-403 instead of charges); free
  quota shared across Singapore-region workspaces only. Provider pipe built
  same day (`src/lib/alibaba.ts`, DashScope Singapore endpoint, free-text
  model code default `qwen3.8-27b`, Test-key check, usage + repair counting);
  qwen3.8-27b + qwen3.8-flash confirmed in quota, qwen3.5-9b absent.
  First live test Sep 17 (owner, `qwen3.8-27b`, Low): key accepted, voice
  good (plain, concrete Berlin-coder opening) — but 5+ min on the opening
  turn. VERDICT: too slow for sessions. Follow-up: full 90s client timeout
  on a later turn (quota is per-model, so budget remains for other codes).
  FIX Sep 17: `enable_thinking: false` per request — full sitting + 6 desk
  answers in under 3.5 min, 0 repairs. Measured: 23 calls, 168.6k in /
  5.3k out (~$0.08 paid-equivalent, $0 on trial quota). Output line proves
  the flag held (5.3k total vs 3.6k for ONE thinking turn). Quality (owner):
  best session yet — developed Low turns, Rose/Weil/Bookchin determinations
  strong, margins voice good, desk answers strong (Lenin/Kant desk openings
  too similar — scaffold variety open). PROMOTED: default while Alibaba
  trial quota lasts; DeepSeek stays fallback. Input measured far above
  estimate (168k vs ~50k guess) — desk + grounding carry full history.
- OpenRouter `meta-llama/llama-3.3-70b-instruct:free` — does NOT exist as `:free` (re-verified Sep 2026 via `/models` API, 445 models; only paid `meta-llama/llama-3.3-70b-instruct` listed). Do not add unless it appears. User reports seeing it on the website — website listing ≠ API availability.
- DeepInfra `meta-llama/Llama-3.3-70B-Instruct-Turbo` — VERIFIED WORKING end-to-end by user (test 9, Sep 2026). ID re-verified against the DeepInfra catalog Sep 2026 (public model page, JSON mode supported). Needs a card on file despite earlier no-card assumption. Full cabinet completes on it.
- DeepInfra coda/turns: unquoted-value JSON slips observed; parser salvages + repair retries cover most. Constrained decoding (`response_format: json_object` first, plain fallback on 400) added to force valid syntax — catalog confirms JSON mode support; live verdict on whether slips stop is the owner's next DeepInfra session.
