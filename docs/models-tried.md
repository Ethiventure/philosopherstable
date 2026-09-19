# Models tried

Living log of every model/provider combination tested for the cabinet, newest
first. Check here before (re)trying anything — corpses stay buried.

## Current ranks (Sep 19 2026, owner-graded live sessions only)

- Style (voice + temperature): Qwen3.8-27B (Alibaba, unthinking) > GLM-5.3-flash > DeepSeek v4.1-flash > Qwen3-30B-A3B (dilemma-grasp best, P2 echo-prone) > Qwen3.6-35B (voice good, obedience bad) > Mistral (loop) > Llama (weak).
- Prompt adherence (contract + Low): DeepSeek (0 repairs) > GLM (3 repairs) > Qwen27B (obeys; quota is the fault, not obedience) > Qwen30B (0–1 repairs; obeys contract, drops gloss/bank rules under load) > Llama > Mistral > burn models (no answer to grade).
- Speed (full sitting pace): Qwen30B paid (~2 min, debate ~1 min) > Alibaba-unthinking (<3.5 min incl. desk) > DeepSeek (~6 min) > GLM (~7 min) > Groq free Qwen (7.5–14 min, walls) > everything else (failed).
- Reliability (finishes sessions cleanly): DeepSeek > Qwen30B paid (5/5 clean) > Alibaba-unthinking > GLM > Groq free > rest (out).
- Value (cost per 5-seat session): Qwen30B ~$0.032 > DeepSeek ~$0.036 > Qwen27B paid ~$0.20+.
- Overall: Qwen30B paid (tuning target — speed + dilemma-grasp, echo/gloss/bank open) ≈ DeepSeek (fallback engine) > Alibaba Qwen27B-unthinking (default while trial lasts) > GLM (best backup) > Groq free Qwen (voice reference) > dead (all small Qwens, Mistral, Llama-as-primary, distill, 3.6-27B).

## Current standing (Sep 17 2026, owner-graded, Low, 2030 question)
- **Qwen3.8-27B (Alibaba, unthinking) — the default while trial quota lasts.**
  Strengths: best voice measured (felt, not admired — Hegel's "mind with
  nothing to fight against," Rose's law-vs-love held open); sub-3.5-min full
  sitting + desk; 0 repairs; 23 calls, 168.6k/5.3k (~$0.08 paid-equiv, $0 on
  quota). Weaknesses: trial ends Dec 16 2026; needs `enable_thinking:false`
  or pace collapses (5-min turns). Watch the quota wall coming.
- **DeepSeek v4.1-flash (OpenRouter paid) — the fallback engine.** Strengths:
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
| Sep 19 2026 | OpenRouter paid | `qwen/qwen3-30b-a3b` | Five graded Medium runs same day (education question, prompts d→f→h→l→m): no thinking burn, 0–1 repairs, ~$0.032/session, debate down to ~1 min. Best dilemma-grasp of any model (P1s sit inside the question's horns); sampling penalties (v2026-09-19g) killed within-turn loops; transform rule fixed P3 parroting; thread cities held throughout. Standing faults: pairwise P2 echo, turn-level gloss ignored through three placements, margins bank absent twice, Lenin-engineers/premise residue. Prompt words judged exhausted for gloss + bank — structural fixes pending (separate bank call; gloss repair pass or desk-carries-clarity). Tuning target alongside DeepSeek fallback engine. |
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
