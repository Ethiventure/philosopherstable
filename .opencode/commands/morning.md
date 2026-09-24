---
description: Morning startup — recall last session, read next-session.md + standing instructions, redo post-shutdown setup (SSH, pull, dev server), expand or start the first task.
---

# Morning

The owner is starting up. Do the whole list, in order, then report briefly.

## 1. Recall where things stand (evidence, not memory)

- Use the opencode-memory skill: last session's messages, plans, prompt
  history, prior decisions (small LIMITs, summarize don't dump — never
  by default, only for what files/git don't answer).
- Read `docs/next-session.md` — last night's goodnight output, today's
  task list in energy order.
- Read standing instructions: global `AGENTS.md` + project `AGENTS.md`.
  Corrections and scope constraints in them stay active until explicitly
  lifted — obey or explain why not.

## 2. Redo the after-shutdown setup

- `ssh-add -l`: if the agent has no identities, remind the owner to
  unlock it (`ssh-add ~/.ssh/id_ed25519`, passphrase typed by them —
  never ask for or handle it). Date-stamp the reminder (`date`) so the
  day it covers is visible.
- `git fetch` + `git pull`: collect overnight commits and report what's
  new (room ticks land here — newest turn name + time proves the clock).
- Localhost preview: if the project serves one (here: `npx netlify dev`
  on `:8888`, app + shared-key function), check it's up; restart if
  down. Plain `npm run dev` serves the app only (shared provider shows
  unreachable — say so if that's what's running).

## 3. Compare with `PLAN.md`, then start the day

- Diff the next-session tasks against PLAN's open phases and the
  `models-tried.md` queue: flag anything the night missed or that went
  stale overnight (a turn landed, a key arrived, a verdict moved).
- Take the FIRST task: expand it with exact commands and file paths. If
  it's a direct action with no open questions, start it at once (say so
  in one line, don't ask permission for the obvious).
- End with what's blocked on the owner vs what's yours — one line each.

## Rules

- Never print or write any key, token, or secret value — filenames and
  counts only.
- Plain everyday words, no flattery, no padding. Short lines, exact
  commands, nothing implied.
