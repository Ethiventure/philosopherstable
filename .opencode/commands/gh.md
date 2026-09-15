---
description: Commit + push current branch and post a paste-ready description
agent: general
---
Inspect `git status --short`, `git diff --stat HEAD`, and `git log --oneline -8`. Stage only intended files (never secrets/keys), commit with a concise message matching repo style, then run `git push origin <current-branch>`. If push fails (e.g. no SSH key in this env), stop and give the user: 1) the exact `git push origin <branch>` command, 2) a paste-ready description of what's new (bullet list grouped by area), 3) the commit hash/message. Never present unpushed work as backed up. Extra args: $ARGUMENTS (append to commit scope if given).
