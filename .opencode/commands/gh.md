---
description: Commit + push current branch and post a paste-ready description
agent: general
---
Inspect `git status --short`, `git diff --stat HEAD`, and `git log --oneline -8`. Stage only intended files (never secrets/keys), commit with a concise message matching repo style. This repo's room cron commits to the same branch, so the remote moves under you: before pushing, always run `git pull --rebase origin <current-branch>` first (stash graphify-out noise first if it blocks the rebase, pop after; if the rebase reports a real conflict, stop and report it — never force-push). Then run `git push origin <current-branch>`. If push fails (e.g. no SSH key in this env), stop and give the user: 1) the exact `git push origin <branch>` command, 2) a paste-ready description of what's new (bullet list grouped by area), 3) the commit hash/message. Never present unpushed work as backed up. Extra args: $ARGUMENTS (append to commit scope if given).
