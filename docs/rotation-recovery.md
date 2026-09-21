# Rotation & recovery (write before needed — standing rule)

## Key rotation

- Shared keys (`GROQ_API_KEY`, `ALIBABA_API_KEY`) live ONLY in the Netlify
  dashboard (Site settings → Environment variables), never in the repo or
  bundle. If one leaks: rotate at the provider console
  (console.groq.com, Model Studio) AND replace the Netlify env value —
  no code change, redeploy picks it up. Then check `git log -S` that the
  value never entered history; if it did, treat it as burned and rotate
  again after cleaning.
- Visitor keys live in browser `localStorage` only. Clear one in
  Settings → Key → Clear. Clearing site data wipes them (keep a copy
  elsewhere); they never sync between devices.
- Trial quota ends Dec 16 2026 (Alibaba) — re-hunt the free pipe before
  expiry (tried-log holds the candidates), or paid takes over silently.

## Quota recovery

- Shared: per-IP 60/day + global 900/day (host env overrides). Per-minute
  429s recover in minutes (resume), daily caps at midnight UTC.
- Visitor: your key, your quota — usage links live in each halt panel.
- Stop-on-Exhaust on Model Studio keys turns overruns into 403s, not bills.
- Any halt preserves progress: resume, switch provider, or check usage —
  never lost work.

## Code rollback

- Every change ships as one small commit (`git log --oneline` tells the
  story). Revert one: `git revert <hash>`, push, Netlify redeploys.
- Prompt changes ride `PROMPT_VERSION` — grades stay pinned to the version
  they were earned on, so rollback never confuses old verdicts.
- Never rewrite pushed history (force-push) except for a leaked secret,
  and then only with owner sign-off.

## Deploy recovery

- Netlify builds `main` on push. If the site looks stale: hard-refresh
  first (stale tabs lie), then check Dashboard → Deploys for the commit
  hash — red builds name their cause in the log.
- Local check before pushing: `npm run test:all` must end ALL GREEN.
- Netlify free functions time out at 10s — slow shared turns die on
  deploy; client resume covers it, and the halt panel says so.
