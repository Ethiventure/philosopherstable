# Next session — Sun Sep 27 2026

Day summary: Phase 11 pilot built end-to-end on `rebuild-thinking` —
THINKING/EXPRESSION files (Bookchin, Bloch, Spinoza), slice renderer,
flag wiring (settings + `?thinking=1`), lean scaffold v2026-09-20m,
no-scene variant, echo enforcement with export marks. Two live sittings
run (AI-tutor question); blind test 4/4 on the first batch.

Open problems (one line each):
- Echo repeats verbatim across sittings (3 cases, detector works, localized
  repair untested live) — next sitting proves or kills it.
- Scene-vs-no-scene A/B ungraded — blind sheets A + B wait in
  `docs/eval-sittings/`.
- Alibaba qwen3.8-27b hit its free limit mid-test — next runs on flash or
  shared, or 3-seat pilot-only sittings.
- Two sitting transcripts unlogged in `docs/models-tried.md` (machine never
  writes verdicts — owner pastes rows after grading).

Carry forward (smallest first):
- `npm run grade` a blind-sheet verdict → paste row to models-tried, ask
  assistant for the letter reveal.
- Rerun AI-tutor question (`?thinking=1`, usual pipe) to test echo repair;
  read footer "echo N" + marked turns.
- Rerun same question (`?thinking=1&scene=0`); blind-grade A vs B for
  uncanny-valley moments; log verdict in PLAN per add-back protocol.
- Generic control: same question, flag off, Bookchin old path (1 call).
- Key-privacy copy: audit remaining quota wording (PLAN backlog has the
  line numbers); Genzie seat-picker removal + room topic-change (queued).
- Remaining 9 thinkers + Genzie THINKING/EXPRESSION (RAG-first workflow in
  compiler) — only after pilot go/no-go.

Explicitly NOT (parked, no nagging):
- Merging `rebuild-thinking` to main; old-path prompt edits; loan
  floor-vs-cap rethink; Room Genzie changes; remaining-seat files.

Everything keeps. Stop anywhere.
