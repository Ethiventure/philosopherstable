# Next session — Oct 18 2026 (evening)

Day summary: the room diet — prompt fragments moved to `prompts/room/*.md`,
story-first order, the full unwired cognitive process wired into every
tick, own-lines dropped, dead RAG retired, per-dossier length rules, a
nightly health score, and a hard 150-token cap. Plus the agent-config
rebuild: skills, commands, backup, and standing instructions reorganised.

## Open problems

- **Has the diet actually worked?** First verdict is tomorrow morning's
  read: `node scripts/room-health.mjs` — want 60–110w, overlap ≤0.10,
  and no turn opening by summarising the last speaker.
- **Story-adherence is flat at 0.12–0.13** across every version so far.
  Untouched by any rule. Bigger design question: is Genzie's story
  over-determining every seat?
- **150-token cap is untested for truncation.** If turns end mid-sentence,
  raise `GROQ_ROOM_MAX_TOKENS` to 170.
- **Signature vocabulary now audible** (Bloch says "pre-appearance") —
  deliberate room-only trade, but confirm you want it kept.
- Netlify frozen until 1 Nov: app-code pushes (src/App.tsx) don't deploy.
- Zed's AGENTS.md content is still the Sep 13 slim copy — trigger block and
  energy section now synced, the rest not.
- No graded sitting since the Oct 10 blind sheets; nothing new tested
  tonight.

## Carry forward (smallest first)

1. `node scripts/room-health.mjs` then read 4 fresh turns blind — judge
   length, restatement, voice separation.
2. If lengths land under cap but turns read clipped, bump the env to 170.
3. Decide the story-adherence question: does every seat need Genzie's
   story every turn, or one or two seats per rotation?
4. Config follow-ups (small): `git -C ~/mac-config-backup log --oneline -3`
   to confirm today's snapshots; restart opencode once so the new skills
   and `/critique` appear in the menu.
5. Sitting work (unchanged, still open): blind sitting on the video-game
   question, then `npm run grade -- <export>`, then tried-log rows for the
   Oct 10 blind sheets.

## Dropped today (decided, not lost)

- Markdown "includes" refactor of the sittings' prompts — the duplication
  there is deliberate (wording varies by position); keep the room fragments
  only.
- Symlinked single-source AGENTS.md — nice in theory, Zed wants its own
  copy; not worth the fragility.
- A/B test of the diet — owner call: plainly better, compare against
  unread old ticks instead.
- Groundings in the room — retired rather than fixed (never loaded).

## Explicitly NOT (parked, no nagging)

- App-code deploys until 1 Nov; old-path prompt edits; loan rethink;
  add-back queue; persona-prompts regen; think-&-sound sitting.

Everything keeps. Stop anywhere; the room ticks without you.