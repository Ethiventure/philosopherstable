# The Dialectical Cabinet

An experimental reasoning system: ten philosophers around a table — Spinoza, Kant, Hegel, Marx, Lenin, Bogdanov, **Weil**, Bookchin, Deleuze, Fisher — debate a contemporary question across three clockwise passes, each thinker negating their predecessor in their own voice until the problem transforms.

## Try it

No account, no setup: open the site and press **Begin cabinet**. It runs on the shared cabinet key by default.

- **Read along** as each intervention appears, or press **Read full session aloud** (free, uses your device's own voice).
- Click any intervention for the full text and its source status; click any seat for the thinker's intellectual profile.
- **Display tab** (Settings): parchment / dim / ink-dark themes, three typefaces, text size and spacing, high contrast, reduced motion.
- **Export** saves the whole session as a text file, with "read more" links to each philosopher's key work.

## Quotas (the honest version)

The shared key is one quota split across every visitor — about two full sessions a day each, resetting at midnight UTC. A full session takes ~30 turns. If the shared well runs dry, the cabinet pauses (nothing is lost) and offers one-click recovery:

1. **Wait and resume** — per-minute caps recover in minutes, daily caps overnight.
2. **Add your own key** in Settings → Key — Gemini (Google AI Studio, free) or OpenRouter (openrouter.ai, free, cycles through free models). Your keys stay in your browser only.

Your own key = your own quota = no sharing, no waiting.

## For the curious

- Every turn follows the same dialectical discipline — determinate negation of the previous speaker, incorporation of what holds, reformulation, a contradiction handed on — but written in each philosopher's own machinery, never from a template.
- Source badges distinguish verified corpus passages from profile-grounded interpretation (full retrieval arrives in a later phase).
- Accessibility is opt-in, never a restyle: the dark-academia default stays put; adjustments layer on top.

## Run it yourself (developers)

```bash
npm install
cp .env.example .env   # only needed for the shared provider locally
# put your Groq key in .env (gitignored — never commit it)
npx netlify dev        # serves the app AND the shared-key function
```

Deploying: connect the repo to Netlify (builds via `netlify.toml`), then set `GROQ_API_KEY` in Site settings → Environment variables. The key must never appear in the repo or the frontend bundle — it lives server-side in `netlify/functions/cabinet.js`'s environment only. See `PLAN.md` for the full agent-facing build plan.
