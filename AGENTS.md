## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## genealogy diagram

Rebuilding the influence map (or any node-and-debt diagram in this project's
style): follow `docs/diagram-style.md` — vertical road system (Recipe B):
time-ordered seats, bundled channel threads, one cubic per debt rim to rim,
reciprocals drawn once, solid direct / dashed indirect, cradled end circles,
full edge-list fallback. Content-agnostic: substitute any entities.

## working rules (shared project norms)

- Plan before building anything non-trivial. Accessibility is in the initial
  plan, never a later pass — keep the house style, layer opt-in adjustments.
- Test commands (run before claiming behaviour changed): `npm run test:all`
  (typecheck + lint + build + RAG tests + eval + bench + key checks + probe
  dry-run), `npm run test:matrix` (live probes, spends ~1 call per keyed
  pipe), `npm run grade -- <transcript>` (mechanical scorecard — verify,
  don't compose). Keys live in `.env.test.local` (gitignored); pipes
  without a key skip.
- Prompt version rule: `PROMPT_VERSION` in
  `src/lib/dialectic/prompts.ts` gains a letter on ANY prompt-text change
  (turn instructions, coda builders, trim notes); grades never transfer
  across versions — the lineage log in PLAN.md grows one line per bump.
- Ignore `docs/User.md` and `docs/rose-research-chat.md`: pasted
  outside-chat transcripts (~47k lines, untracked). Open only for Rose
  dossier/diagram receipts, never whole, never as project direction.
- Truthfulness: verify against live sources (API model lists, rate tables,
  link checks) before claiming. HMR/stale tabs lie — hard-refresh + fresh
  session before trusting a test. Verify in layers: lint + typecheck + build
  + retrieval-eval + live-transcript evidence.
- Provenance: mocks reference only what exists in the repo; never invent
  resources. Licence every corpus source; verify against the work's own
  copyright page, never an uploader's label. Imported code carries a note
  saying where it came from.
- Public app, no login, zero identifying data. Keys never in repo/bundle.
- No OpenAI models for generation, ever. Prefer good-value open-weight
  models; cost paid picks per session before recommending.
- Provider model IDs rot in days: free-text ID field + live key check, never
  a pinned dropdown; dead IDs fall back to the default on load. Every test
  queue entry, verdict, and owner-facing model mention carries the exact
  paste-ready model ID (provider path included) — never names from memory.
- Debts table (`CABINET_DEBTS`) is truth; heirs derive. Model verdicts go in
  `docs/models-tried.md` — corpses stay buried, never re-test without new
  evidence. `PLAN.md` (agents) + `README.md` (humans) stay current.
  Structural lessons for the owner accumulate in `docs/things-taught.md`
  (plain words, newest first) — add one entry per lesson.
- Fail-soft everywhere with visible reasons; every failure preserves progress
  and offers recovery. UI copy keeps one speaker per surface.
- Voice and tone: chats in plain everyday language (~IELTS 6), jargon
  unpacked; no superlatives, no flattery, no emotional validation. UI copy
  uses domain diction with banned stock verbs — homogenised prose is a
  defect. When the evidence is good, public-facing text states the claim
  plainly (no hedging); caveats live in code comments, never on the surface.
- Beauty is a requirement: adjustments speak the design's palette and type;
  generic accessible-minimalism is a failure mode. Dark surfaces keep tested
  font/button/accent pairs — never a lone text-colour toggle.
- Quota-honest UX: per-user caps stated up front, visible halt states with
  recovery paths, provider/model switches that preserve progress.
- Model transparency in plain text: every provider and model option in Settings
  names its exact model ID and why it is picked (price, speed, voice, licence
  — one plain line each), rendered as visible text, never tooltip-only. The
  export names the model behind each turn. Source of truth lives in
  `DEEPINFRA_PRIMARIES`-style structures so UI copy and code cannot drift.
- Difficulty levels that hold (Low/Medium/High): define ALL levels, govern
  the simple one by removing difficulty machinery (not adding rules), every
  level gets a reader test + worked example + failure condition.
- First-run card: modal on first visit (what it is, honest quota picture,
  keys-never-leave-browser), "don't show again" default checked, Esc
  dismisses, header button reopens.

## graphify workflow

First setup: `graphify opencode install`, then `graphify .` (`--code-only`
without an LLM key). After edits: `graphify update .` (AST-only, no API
cost). Install once per machine; per-project graph lives in `graphify-out/`
(dirty files after hooks are expected — not a reason to skip it).

## free TTS recipe (Web Speech, no key)

Feature-detect, hide UI if absent. Set `lang` + `rate` only (device-default
voice, no picker). Chunk ~200 chars at sentence boundaries, chain
onend/onerror through one shared queue (generation counter vs overlap),
cancel on unmount/clear/pagehide. Chrome silence is always
voices-not-loaded or paused-synth: await `voiceschanged` (1.5s cap) +
`resume()` in the click gesture. `aria-live` announces position, never
full text.

## RAG runbook (this repo)

- Truth: `data/sources.json` manifest (explicit rights gate —
  `rights_status: approved` with dated owner act, importer refuses the
  rest) → local `data/rag.sqlite` (gitignored) → shipped per-author shards
  in `public/rag/` (+ `manifest.json` with schema/chunker versions).
- Corpus entries live in `src/data/corpus-sources.ts`; `rag-manifest.mjs`
  exports new ones as `pending` (never auto-approved). Licence every source
  (`licence_status` is free text: `CC_BY_NC_ND_4_0`, `IN_COPYRIGHT`…);
  verify against the work's copyright page, never an uploader's label.
- Fetch modes: remote HTML/text URLs, archive.org
  `/stream/<id>/<file>_djvu.txt` (HTML `<pre>`, indexable — `/download/`
  raw text extracts zero paragraphs), and `local_path` for committed
  OCR/converted text whose canonical URL serves no fetchable text (scans:
  PyMuPDF render at 300dpi → tesseract over stdin pipe, commit text under
  `data/local-text-*`, canonical URL stays `source_url`).
- Chunking: heading-aware ~350w chunks, idempotent stable passage IDs;
  non-author front matter filtered before chunking. Eval (`rag-eval.mjs`,
  12/12) records its chunker version and refuses stale contracts.
- Fail-soft per source with visible reasons; thin/link-dense/stub pages
  refused, never forced. Ship full text only with owner approval.
