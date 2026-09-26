# Things taught (owner's notebook)
Plain-words record of technical lessons from building this cabinet.
Low intensity, nothing dumbed down: every entry keeps the full fact,
only the words stay simple. Newest first. The owner asked for this
Sep 17 2026 — keep writing here, one entry per lesson.

## Test the detector before blaming it (Sep 26 2026)
Three verbatim repeats across two sittings looked like a dead detector —
and I said so out loud before checking. One script run later, the
detector fired on the exact pair. The failure was downstream: detection
ended in a log line and an unexported badge, with the blind retry (the
only enforcement) long buried for good reasons. The fix names the shared
run in a single repair attempt and marks survivors in the export. Two
morals: reproduce before you accuse, and never report an invisible
negative ("no badge fired") as fact — the export couldn't show badges
either way.

## Subtract before you add: the pilot turn scaffold (Sep 26 2026)
The owner's verdict on a weak sitting was to strip the general prompts,
not extend them — and the numbers backed it: the old turn scaffold ran
~6,000 characters of orders (mood, feeling verbs, rhythm, naming
ceremonies, stock phrases) against a ~4,000-character thinking slice, so
the generic instructions outweighed the thinker twice over in attention.
The pilot scaffold keeps seven things (pass job, PREV discipline,
budgets, scene hold, premise hold, margins duty, closing) and drops the
rest, because the thinking files already carry voice, moves, and temper.
The old scaffold stays byte-unchanged behind the flag as the A/B
baseline, and the version stamp (now m) keeps the grades apart. Lesson:
when a prompt underperforms, weigh it first — the fix may be deletion.

## Stored examples may not invent scenes (Sep 26 2026)
A trio TEACH line explained its quote with a power station that existed
nowhere in the corpus — pure invention smuggled into a stored example.
The rule it produced: concrete scenes in stored files must be traceable
to the thinker's own stock material (their cases, their program); fresh
scenes belong to live turns, where the sitting supplies them. Same pass
also tightened THINK: no signature terms at all, not merely "where
unavoidable" — the thinking process in neutral words, with the terms
returning in TEACH and the voice in THINK & SOUND.

## One quote, one home: the trio's third line IS the quote (Sep 26 2026)
Correction from the owner: the trio used to keep the verbatim quote in a
separate anchor field beside a paraphrased full-voice line — two homes
for one idea, guaranteed to drift apart. Now the shape is strict: THINK
shows the bare reasoning that leads to the quote, TEACH explains the
quote's idea at full complexity, and THINK & SOUND literally is the
quote, source beside it. The general lesson: any fact stored twice will
contradict itself eventually, so store it once where it is used.

## Modes are jobs, not levels: THINK is not plainer (Sep 26 2026)
Correction caught by the owner mid-pilot: several new files described
THINK as plain-words output, smuggling the old Low level back in under a
new name. The actual distinction is different. THINK means the thinking
slice with no expression style added — no tics, no performed temper, no
quotes — while complexity and terms stay wherever the move needs them.
For a plain writer like Bookchin, THINK may read almost like his voice;
the difference is the missing fury and tics, not simpler words. Temper
split the same way: stance (what angers them) rides everywhere,
performance (fury, swearing) rides only with the expression file. Lesson:
when renaming a system, grep the new files for the old system's
adjectives — "plain", "simple", "restrained" — because the old mental
model hides inside words like that.

## Speak to the model as the thinker, not about them (Sep 26 2026)
The pilot files were first written in third person ("he widens the
frame") and converted on owner call to second person ("you widen the
frame"). Why it matters: the runtime prompt addresses the model AS the
thinker, so a third-person file forces a translation step — description
into inhabitation — that small models perform badly: they copy the
description instead of performing the move. "You ask" skips the step.
Metadata (tags, anchors, tests) stays neutral; only the generative
content speaks as you. The compiler now mandates this for all remaining
thinkers.

## Paraphrase eats the load-bearing words (Sep 26 2026)
Sequel to the entry above. The owner's accuracy corrections on the
Bookchin draft fell into one pattern: my paraphrases had smoothed away
his proper terms (Free Nature, liberatory technology, the full
Marxist→Trotskyist→anarchist→communalist chain, the full list of
revolutions) and swapped his concrete nouns for my metaphors
("address" for "institution"). Every restored term was doing conceptual
work, not decoration — which is exactly why paraphrase is dangerous in
THINKING files: plain renderings belong to the runtime modes, never the
stored file. Rule recorded in the compiler: keep the thinker's own terms
and full enumerations; prefer their concrete noun over your elegant one.
Same sitting also showed biography done right: "Bronx autodidact" earned
its place by explaining his plain prosecuting voice — the likely reason
Bookchin reads easiest.

## Check the library before citing it (Sep 26 2026)
Two pilot anchors cited works the manifest lists but the shipped search
index does not contain (one metadata-only book, one unshipped ingest).
They read fine and were wrong — a turn grounded on them would quote from
nothing. So the remaining thinkers get RAG-first treatment: inventory the
shipped shard before drafting, cite only shipped works, and audit the old
profile/style files for errors on the way (they hold real ones). A
manifest entry is a catalogue card, not a book on the shelf.

## Why the cabinet kept doing impressions, and the split that fixes it (Sep 26 2026)
The turns were turning into parody: each thinker sounded like a costume
of famous words. The cause was mechanical, not mysterious. The old
prompts listed 14–25 style orders per thinker ("use vampiric imagery",
"use larval subjects") next to a few vague thinking orders ("trace the
inner connection"). Small models obey what is easy to check — a word is
easy to check, a way of reasoning is not — so they did the words and
dropped the thought. Tight word budgets made it worse: 60 words and 30
demands leaves room for only the 3 most famous markers. The fix reverses
the shape: each thinker gets a THINKING file (what they notice, ask,
distinguish, do, concede — the engine) and an EXPRESSION file that only
decides how an already-made judgment sounds. Voice may choose the
realization, never the content. If voice and thinking clash, thinking
wins — written as a rule, not hoped from word order.

## Order in a prompt is not obedience (Sep 26 2026)
Sequel to the entry above. It is tempting to believe that putting
thinking first and style last in a prompt makes the model weight them
90/10. It does not — position is a nudge, not a lock, and a later
instruction can easily shout louder than an earlier one. So the rebuild
does not rely on order at all: thinking and voice live in separate
files, the thinking file is named the semantic authority and the voice
file the linguistic authority only, and the shared runtime carries one
precedence rule both must obey. The lesson travels: whenever two
instructions compete, write who wins explicitly instead of arranging
furniture.

## The model picks from a menu it never sees cooked (Sep 26 2026)
A puzzle from the rebuild: how can plain code choose which 1–3 thinking
moves ride in a turn without the model reading the whole file? Answer:
the same trick the RAG search already uses. Every operation carries 3–6
plain keywords (selection tags); the code matches question + last-turn
words against those tags plus the thinker-pair, with word-stem scoring —
no model call, no reading. Full files stay on disk as the truth; small
slices ride per turn. This also fits the hard 7k-token wall on the free
tier and the finding that small models obey short orders better. And the
safeguard both ways: code proposes, the thinker disposes — the model may
decline the offered moves if the question does not fire them, so the
picker never hardens into a hidden script.

## Same judgment, not same conclusion — plus TEACH means explained (Sep 26 2026)
Two fine points locked before the pilot. First, the three modes (THINK /
TEACH / THINK & SOUND) must preserve the same underlying judgment across
all tellings: same claim, same causal reason, same distinctions,
concessions, uncertainty, and answer to the last speaker. "Same
conclusion" was judged too weak — a mode can reach the same conclusion
for a different reason, and then it is a different philosopher wearing
the same verdict. That version fails the invariant. Second, TEACH is not
a watered-down middle: it keeps full complexity and terminology and
teaches every term (meaning woven in + one concrete sentence). The only
practical restraint is quote volume, because each quote costs explaining
words. Modes are jobs, not intelligence levels.

## Git tags do not travel with git push (Sep 26 2026)
Small practical one from the rebuild safety steps. A tag (our rollback
marker `before-thinking-rebuild`) lives only on your machine until you
push it by name: `git push origin <tag>`. A plain `git push` sends
branches, never tags — so a rollback point you never pushed is a
rollback point that does not exist on GitHub. Same sitting also showed:
uncommitted files travel with neither; commit first, push branch second,
push tag third.

## What the autumn metric trials actually did (Sep 25 2026)
The full record, since the lessons below only carry the morals. Two
published tools were tested against turns you had already graded by
hand, keep-only-on-agreement in both cases.
LENS-SALSA (leak detector): installed 2023 code into the old Python
(new Python can't build its spreadsheet part), fetched its ~1GB brain,
ran 9 same-thinker Medium→Low pairs from the Bristol/Naples sittings.
Result: zero ban-list hits; heaviest fire on names, cities, concrete
nouns (0.4–0.8). Dropped same day.
AlignScore-large (meaning guardrail): installed from its GitHub home
(not on PyPI; its pinned torch fits only old Python), fetched its
4.9GB brain, scored 24 Low turns against profiles plus 3 controls —
copy 0.98, faithful paraphrase 0.37, outright lie 0.01. All 24 real
turns landed 0.12–0.52, the paraphrase band. Dropped same day.
Running either needed two shims (force CPU, allow the old file format)
kept in throwaway scripts, never the repo. What survives: the ban-list
idea (a plain script checking your list would do the job), the ASSET
method on paper only (needs your hand-written references — expensive,
probably the same paraphrase disease), and the proof that paraphrase is
the assignment, not the failure.

## A guardrail that flags everything guards nothing (Sep 25 2026)
Sequel to the generic-grader lesson: the meaning-checker failed the
mirror test. It scores word-overlap dressed as understanding — a copied
sentence gets 0.98, a true paraphrase gets 0.37, an outright lie gets
0.01. Our plain-language turns live at 0.37 by design (translated words
are the whole job), so every turn would arrive flagged and the human
would learn to ignore every flag. A warning nobody heeds is worse than
no warning: it spends attention while pretending to save it. We buried
this one too. The rule that survives both burials: calibrate on your own
graded work first, and demand few sharp flags — mass flags mean the
instrument, not the writing.

## A generic grader punishes your best moves (Sep 25 2026)
We tested a published simplification-scorer as our leak detector: it
passed good Low turns and flagged the wrong words — people's names,
cities, and concrete nouns like child and sensors, with high confidence.
Those are the exact words our rules demand (debts need names, cities
anchor the thread, plain words need concrete things). The scorer learned
"simpler" from encyclopedia sentences, where cutting names is tidiness;
in philosophy, cutting them is lobotomy. We dropped it the same day.
The lesson: a metric is only as wise as its training diet — before
trusting any auto-grader, run it on work you already graded by hand and
check it flags what you flagged. Ours didn't, so it stays buried.

## A token's permissions freeze at birth (Sep 24 2026)
A GitHub fine-grained token can never gain new powers — there is no
edit-permissions button, only make-a-new-one (regenerate just replaces
the secret with the same powers). So when an automation 403s on scope,
don't reread your code: the token was born without the permission.
Rotation always means a new token plus one paste, never a code change —
which is why the recovery doc says "new token + same upload" instead
of anything cleverer.

## Keep your commits off the robot's files (Sep 24 2026)
A cron that commits data files will fight every human push: the remote
moves under you and the rebase complains. The fix is ownership, not
force — the robot owns the transcript, humans own code and docs, and
the two never share a file. New seats join through code that edits the
data at runtime (append-if-missing), so even seating changes travel as
clean code commits. If a push is rejected, pull-rebase-push; never
force-push a branch the robot writes to.

## A schedule is a request, not a promise (Sep 23 2026)
A cron line says when you *want* something to run: five slots for
minute, hour, day-of-month, month, weekday, so `*/45 * * * *` means
"at minute 0 and 45 of every hour" — about 32 starts a day. But the
machine that reads the line may still say "later": GitHub starts our
every-20-minutes room schedule only ~6 times a day on a quiet repo
(throttled, not broken — every start lands its turn, there are just
fewer starts). The fix keeps the work where it was and moves only the
clock: a tiny Cloudflare script (a Worker, free tier: 32 starts a day
against 100,000 allowed) calls GitHub's "start this workflow now"
address every 45 minutes. That call needs a token — a fine-grained one,
this repo only, allowed to start workflows and nothing else, kept in
the script's encrypted store and never in the repo. Tokens expire, so
the recovery note says: new token, same upload command, no code change.
Three clocks to keep straight: cron times are UTC, GitHub may delay any
start during busy spells, and the file host needs minutes after each
push before readers see the new line.

## Inventories become tics (Sep 22 2026)
Anything enumerated in a prompt — slang words, modern examples, moves —
comes back as a tic within a week: the model recites the list instead of
inhabiting the register. The fix is never a better list, it is no list:
name the register ("blunt online-left diction", "find your own"), ban
reciting, and let the voice fill the space. Position and attitude stick;
inventories don't.

## Thinking scales with the load (Sep 21 2026)
Sequel to the "bigger are-you-there" lesson: thinking doesn't cost a
flat fee per call — it grows with the prompt (120 tokens to answer "ok",
850 for a full turn contract on the same model). A model that answers a
tiny check can still starve on a real turn at the same output cap, and a
200-with-empty-content reply means "give me room", never "I'm broken".
Before ruling any thinker out, re-run once at quadruple caps: the probe
ladder does this itself now and writes `+stepup` on the route when head
room is what fixed it.

## Switches are per model, not per provider (Sep 20 2026)
One request flag does not fit every model on a provider. Alibaba's
thinking switch works for Qwen (off = fast, cheap, truer) but one model
refuses it outright with a 400 error — for that model the value may only
ever be True. The fix sends the switch first and drops it on exactly
that error, once, instead of failing the turn: prefer the cheap path,
retreat to the model's terms, never argue with the endpoint. The lesson:
capability flags live at the model level — a provider-wide setting is a
guess that some model will eventually refuse. (Same family as the
OpenRouter mandatory-reasoning step-down.)

## The right passage beats the exact passage (Sep 20 2026)
A retrieval self-test asks: this chunk's own rare words, do they find
this exact chunk again? On Hegel the answer is almost never — 8% — yet
every miss lands inside the right book. Hegel's vocabulary repeats
across hundreds of neighbour chunks (self-consciousness everywhere), so
no three words can point at one chunk. That looks like failure until
you ask what grounding actually needs: any good chunk from the right
work, not one particular chunk. Measured that way the score is 99%.
The lesson: grade retrieval by the job it does (right work on the
table), never by identity (exact chunk back) — and distrust any metric
before checking what its misses look like.

## A summary of reactions is not a summary of positions (Sep 20 2026)
Every turn has two halves: the first half answers the previous speaker,
the second half says what this speaker actually thinks. The margins notes
were fed only the one-line takeaway — which is almost always framed as a
reaction ("Marx's assembly fails because…") — so the note reviewed a
room full of reactions and kept charging seats with missing what they had
just said. The fix feeds the note the second-half paragraphs instead:
diagnoses and builds, not replies. The lesson: whenever you summarize a
debate for a third party, hand over what each side holds, never what each
side answered — answers without positions read as absence.

## Borrowed words are not copying (Sep 20 2026)
Two seats drinking from the same book will share its vocabulary — that
is grounding working, not echo. For a while the echo detector punished
exactly that: any 8-word run appearing twice got flagged, so the more a
sitting leaned on its sources, the guiltier it looked. The fix runs the
same detector with an exclusion set built from the passages each seat
was actually shown: shared source words can't trip it, shared inventions
still do. The prompt says the same line in words. The lesson travels to
any check you build: first ask what honest behaviour looks like under
the detector, then teach the detector the difference — never punish the
behaviour you ordered.

## Thinking models need a bigger "are you there" (Sep 20 2026)
The key-check call asks a model to reply "ok" with only 10 output tokens.
Thinking models (GLM always thinks; Qwen hybrids think) spend those 10
tokens thinking and return nothing — a 200 OK with empty content, billed.
Three pipes looked dead until the cap moved to 100 tokens, and the app's
own Test-key buttons had the same flaw (fixed the same way). Two companion
findings from the same session: long prompts can come back 200-with-empty
unless constrained decoding (`response_format: json_object`) forces
content out — which is why the app tries JSON first on some pipes; and
reasoning can't be switched off everywhere (one endpoint mandates it with
a 400, and the app steps down instead of fighting). The lesson: when a
model answers empty, check the thinking budget before blaming the key —
an empty 200 means the key works and the shape doesn't.

## Flag the fake citation, don't delete it (Sep 20 2026)
A model once cited `[UN143]` — a tag shaped like a reference that matches
nothing in the manifest. The instinct is to strip it so readers never see
it, but stripping destroys the evidence that the model invents authority.
So the export keeps the prose intact and adds a footer section listing
every invented tag by pass and seat (absent when the sitting is clean),
and the console logs it at export time. The detector only trips on the
letter-digit shape (`[UN143]`); plain numbers like `[12]` may be honest
references and stay untouched. The lesson: provenance tooling should mark
doubt visibly, not silently clean it — the reader grades the model, the
tool just refuses to launder the claim.

## Slogans feel cheap, applied moves feel real (Sep 20 2026)
The owner judged it plainly: pass-3 slogans always read naff. A slogan
is a line to chant; an applied move is a body doing a thing somewhere.
So the prompt no longer asks for anything "ordinary people could carry"
— it asks for a named body (a tenants' group, a union branch, pupils)
doing a named thing in the sitting's city, with the first step inside
the sentence, plus what changes in the first week. Vague verbs (raise
awareness, push for, prioritise) fail the turn. The lesson travels: when
the reader calls the output cheap, the fix is rarely a better slogan —
it is a smaller, more checkable claim about who does what first.

## Garbled turns get caught by shape, not by reading (Sep 20 2026)
When a model melts down it leaves shapes, not arguments: `word:word`
salads like `greek:negation`, one word six times running, the same
sentence twice in one turn, or seventy words built from three. None of
that needs a judge — a small checker (`detectVolatility` in
`src/lib/llm.ts`) spots the shape on the parsed prose and throws a
retryable error, so the sitting retries visibly instead of printing the
mush. It runs on parsed values only, never raw JSON, or web addresses
and `"key":` shapes would trip it. The limit to watch: very long turns
that repeat key terms honestly could look like soup — if good turns
start bouncing, the 0.35 diversity line moves, not the idea.

## When every model makes the same mistake, the fault is in our instructions (Sep 20 2026)
Five sittings in a row, across four model families, all repeated whole
paragraphs across seats in pass 2. No single model is copying — they
each fail the same way because the instruction asks for the impossible:
answer your predecessor, stay in voice, hold the city, keep it short,
all at once, so they all fall back on the same safe shared wording. The
lesson: one model's failure is about the model; every model's failure
is about us. Fix the shared plumbing (the prompt both share), never
tweak the words for one model — a tweak that cures one can flatten
another. This is why the project keeps a fix-triage ledger (PLAN
Phase 7e) before changing anything.

## One browser, many keys, no login: localStorage (Sep 20 2026)
The technical term is the Web Storage API — specifically `localStorage`:
a small key-value cupboard the browser keeps per website, with no account
and no login. Our settings (including all six provider keys, one field
each) live there under one key, so Groq, OpenRouter, DeepInfra and the
rest each keep their own saved key side by side. Switching provider tabs
shows that provider's own stored key — nothing carries over, by design.
Two catches worth knowing: clearing site data empties the cupboard
(keys included — keep a copy elsewhere), and it never syncs between
devices or browsers (phone keys stay on the phone). Same cupboard holds
the welcome flag, display settings, and the last-good free model.

## Unthinking models answer faster — sometimes (Sep 17 2026)
Many models "think" (private draft reasoning) before answering, and some
bill that thinking as output tokens: one turn showed 3,500 thinking tokens
behind 130 words of answer — and took 5 minutes. Switching thinking off
per request cut the same model to seconds with the voice intact (even
truer, the owner judged: less scaffolding, more person). But the switch
is different on every provider, some models ignore it, and some (like
GLM) cannot fully switch off — so "turn thinking off" is not one fix but
one verification per pipe: send the flag, then check the output-token
line. Small totals mean it held.

## Pass-3 architecture (Sep 17 2026)
Final-round turns do three jobs at once: answer the previous speaker,
weave in one idea from another seat (the survey), and obey the margins
note's demands. Done well, the round braids the whole sitting into one
chain (e.g. a levy idea passing Marx → Hegel → Bookchin, each adding a
link). Done badly, every seat chants the same slogan with different
nouns. If P3 sounds samey, the braid has slipped into chant — the fix
is in the survey instruction, not the models.

## Input tokens run the show (Sep 17 2026)
Each turn sends ~7,000 input tokens and gets ~230 back. Cost, speed,
and quota walls almost all come from the input side: what rides along
(past turns, retrieved passages, persona). Output price differences
between providers sound dramatic and matter in cents. To make sessions
cheaper or faster, slim the input or cache it — never chase output price.

## Reasoning burn (Sep 17 2026)
Some models think out loud before answering and spend the whole output
budget doing it — the reply arrives empty. Fixes: a per-request "don't
think" flag where the provider honours it (Alibaba: proven, 5 minutes
to seconds); exclude models that ignore the flag. A model that burns
twice is out, not coaxed.

## Free tiers wall mid-session (Sep 17 2026)
Free quotas are per-minute or per-request caps (~7K input tokens per
request on Groq free), not daily buckets. A session grows past the wall
halfway through — fast starts, stuck middles. Free is for trials;
sessions need paid or trial-quota pipes.

## Model IDs rot (Sep 17 2026)
Providers retire model names without warning (days, not years). Never
pin a single ID in a dropdown: free-text field, live key check, stored
dead IDs fall back to default. When a call 404s, read the current name
off the provider's list letter-for-letter.

## Copyright has two clocks (Sep 17 2026)
An old book is not automatically free: the translator's copyright runs
separately from the author's (both life-plus-70 in the UK). Check both
clocks. A translation you commission is yours; a translation of a book
still in copyright needs permission first. Short quoted excerpts with
credit sit in the safest zone; full public copies need clean rights.
