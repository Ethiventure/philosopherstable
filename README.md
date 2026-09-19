# The Dialectical Cabinet

Twelve dead philosophers around a table — Spinoza, Kant, Hegel, Marx, Lenin, Bogdanov, Bloch, **Weil**, Bookchin, Deleuze, Rose, Fisher — made to answer *your* question across three passes of the table. Each thinker grabs their predecessor by the collar, in their own voice, until the problem comes out changed. It is the liveliest seminar none of them ever agreed to attend and the cover charge is whatever the machines demand: nothing on the shared key but your patience, or about a cent a session if you bring your own.

## Try it

No account, no setup: open the site and press **Convene the cabinet**. It runs on the shared cabinet key by default.

Try it here: https://philosopherstable.netlify.app/ 

- **Read along** in the deck (arrows move forward only — your place is never yanked), or press **Listen** on any card (free, uses your device's own voice). The latest turn also sits on the table itself.
- Click any intervention for footnoted references (`Read similar: 3, 9` — numbers match Further reading); click any seat for the thinker's profile — Thought, Voice, Works, and why they sit where they sit, plus who they owe at this table and who owes them. Hover a seat for the one-line version.
- **Export** saves the whole session as clean prose with a Reading List of full links at the end — nothing inline.
- **Notes from the margins**: between pass 2 and pass 3, one rude reader breaks in — naming what the table missed and asking hard, concrete questions. Pass 3 must answer one.
- **Philosophers' Service** (service bell, raised bottom-right, a card beside the table, and a mention in the welcome card): ask any of the twelve thinkers one-to-one — plain definitions, an example, and a check question each time, with a Level picker (plain words / terms explained / full voice). Twenty questions per sitting; chats append to export.

## Settings, explained (all three tabs)

**Key** — who pays for the thinking:
- **Shared** (default): the cabinet's own key, no action needed. One quota split across every visitor (see below).
- **OpenRouter**: your key. *Free cycle* hops across free models each turn so limits stretch; *Paid model* pins one ID (default `deepseek/deepseek-v4.1-flash`, ~$0.15/$0.60 per 1M — about two cents a session). Test-key button included; keys live in your browser only, never touch our servers (OpenRouter's free models may log prompts for training — the panel says so).
- **Groq / DeepInfra / Together / Alibaba / Z.ai**: your key, pinned or typed models (`qwen3.8-27b`, `Llama-3.3-70B-Instruct-Turbo`, `Qwen3-30B-A3B`, Model Studio codes, `glm-4.7-flash` — free on Z.ai, one request at a time so sittings run slow). Groq's free tier and Z.ai's free tier need no card; DeepInfra and Together want one on file.
- Below the keys, everything sits in the **Cabinet** tab so one screen shows the whole sitting: **who sits** (toggle thinkers, hover any name for the two-line life),
- **how it speaks** (Low = plain words, temper unchanged; Medium = the standard seminar; High = full machinery, hostile where the author warrants it), **Long form** (~280 words a turn instead of ~100 — a 12-minute read becomes a 30-minute one), and **Turn economy** (Efficient trims the predecessor text re-sent each turn — the transcript stays whole; voices are never trimmed). Hover anything for the one-line version.

**Cabinet** — who sits and how deep it goes:
- Toggle any of the twelve in or out (minimum two — a debate needs an opponent). Five seats (≈15 turns) is the recommended sitting: the full arc at half the tokens.
- **Ground turns in source texts** (experimental, on by default): each speaker searches its *own* indexed books first and must borrow their actual vocabulary — at least two short verbatim loans per turn (at Low, paraphrased in plain words instead of quoted), receipts inspectable under every intervention. Slower, more tokens, fewer stereotypes.

**Display** — the reading room, your way:
- Parchment / dim / ink-dark themes (background and text always change as tested pairs), three typefaces including dyslexia-friendly, text size, line spacing, high contrast, reduced motion. The house style stays; adjustments layer on top.
- **Read aloud**: speaking rate plus a real **voice picker with preview** — device default suits most, but some iPads pick a poor default, so choose once and it sticks. Free, browser-built-in, nothing leaves the page.

## Quotas 

The shared key is one quota split across every visitor — a few sittings a day each, resetting at midnight UTC. (A full twelve-seat table takes ~36 turns; the default five-seat sitting is about half that.) If the shared well runs dry, the cabinet pauses (nothing is lost) and offers one-click recovery:

1. **Wait and resume** — per-minute caps recover in minutes, daily caps overnight.
2. **Add your own key** in Settings → Key — OpenRouter (free cycle or cheap paid), Groq, DeepInfra, Together, Alibaba or Z.ai. Your keys stay in your browser only.

Your own key = your own quota = no sharing, no waiting.

## For the curious

- Every turn follows the same dialectical discipline — cutting in on the predecessor, determinate negation, incorporation of what holds, reformulation ending on the live edge — but written in each philosopher's own machinery, never from a template. Nobody repeats your question back verbatim — every seat paraphrases and riffs on it. Turns address each other as *you*, with heat and a flash of wit; stock openers are rationed to one per session, so nobody says "to be sure" twice. Pass 3 may invoke any seat's striking idea and must answer the margins note; the opening and closing moves belong to the question itself.
- Footnote numbers under each turn point into Further reading (stable manifest order); the models' claims are matched display-side and labelled honest — nothing is fed back into prompts.
- Source badges distinguish indexed full-text passages from profile-grounded interpretation. Switch on Grounding (Settings → Cabinet) and each speaker searches its own indexed works first — receipts stay inspectable per turn, and desk answers show their source chunks. The index is lexical (word stems, no AI embeddings) across 11,000+ passages; Russian texts only answer Russian queries, and the manifest says so where it matters.
- Accessibility is opt-in, never a restyle: the dark-academia default stays put; adjustments layer on top.

## Run it yourself (developers)

```bash
git clone https://github.com/Ethiventure/philosopherstable.git
cd philosopherstable
npm install
cp .env.example .env   # only needed for the shared provider locally
# put your Groq key in .env (gitignored — never commit it)
npx netlify dev        # app on http://localhost:8888 + the shared-key function
# (first run fetches the Netlify CLI — slow once, then cached)
```

Plain `npm run dev` also works but serves the app only — the shared provider shows an unreachable note there while visitor keys keep working. If `:8888` is already taken, stop the old server first (one instance owns the port).

Deploying: connect the repo to Netlify (builds via `netlify.toml`), then set `GROQ_API_KEY` in Site settings → Environment variables. The key must never appear in the repo or the frontend bundle — it lives server-side in `netlify/functions/cabinet.js`'s environment only. See `PLAN.md` for the full agent-facing build plan.
