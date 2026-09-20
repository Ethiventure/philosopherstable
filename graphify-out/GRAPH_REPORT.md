# Graph Report - philosopherstable  (2026-09-20)

## Corpus Check
- 127 files · ~4,751,573 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 918 nodes · 1170 edges · 82 communities (58 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `851b36ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- check-links.mjs
- types/index.ts
- App.tsx
- compilerOptions
- openrouter.ts
- compilerOptions
- alibaba.ts
- llm.ts
- settings.ts
- tts.ts
- cabinet.js
- dialectic/prompts.ts
- groq.ts
- preferences.ts
- philosophers/index.ts
- lib/prompts.ts
- The Dialectical Cabinet — Implementation Plan
- bloch.ts
- The Dialectical Cabinet
- shared.ts
- AGENTS.md
- deepinfra.ts
- together.ts
- extract.js
- footnotes.ts
- extract.ts
- anti-waffle.ts
- Models tried
- bogdanov.ts
- bookchin.ts
- graphify.js
- tsconfig.json
- split_philosophers.py
- corpus-sources.ts
- deleuze.ts
- fisher.ts
- hegel.ts
- kant.ts
- lenin.ts
- marx.ts
- spinoza.ts
- weil.ts
- opencode.json
- verify.ts
- dev-keepalive.sh
- rag-search.mjs
- service-chat.ts
- scripts
- Language levels (Low / Medium / High)
- rag-ingest.mjs
- rag-inspect.mjs
- rag-manifest.mjs
- manifest.json
- genealogy-layout.ts
- New philosopher brief (reusable)
- Node-and-debt diagram — style, preferences, and quick-start
- Family A/B eval — Qwen-first or DeepSeek-first (Phase 7)
- check-diagram-contrast.mjs
- rose.ts
- trios.ts
- universal-mechanisms.ts
- Influence grid (generated)
- Things taught (owner's notebook)
- rag-translate-once.mjs
- model-brief.md
- Alibaba 27B High, visitor key — v1 (São Paulo, education question)
- zai.ts
- GLM 5.3 High, OpenRouter paid — v2 (Seoul, education question)
- Qwen 14B High, OpenRouter paid — v1 (Buenos Aires, education question)
- Qwen 30B High, OpenRouter paid — v2 (São Paulo, education question)
- test-matrix.mjs
- porter.ts
- test-sitting.mjs
- rag-text.ts
- rag-eval.mjs
- rag-ground.ts
- rag-search.ts

## God Nodes (most connected - your core abstractions)
1. `Alibaba 27B High, visitor key — v1 (São Paulo, education question)` - 22 edges
2. `GLM 5.3 High, OpenRouter paid — v2 (Seoul, education question)` - 22 edges
3. `Qwen 14B High, OpenRouter paid — v1 (Buenos Aires, education question)` - 22 edges
4. `Qwen 30B High, OpenRouter paid — v2 (São Paulo, education question)` - 22 edges
5. `compilerOptions` - 18 edges
6. `The Dialectical Cabinet — Implementation Plan` - 18 edges
7. `scripts` - 17 edges
8. `compilerOptions` - 14 edges
9. `Things taught (owner's notebook)` - 13 edges
10. `Node-and-debt diagram — style, preferences, and quick-start` - 12 edges

## Surprising Connections (you probably didn't know these)
- `tryMarxChapters()` --calls--> `normalizeText()`  [EXTRACTED]
  scripts/rag-ingest.mjs → src/lib/rag-text.ts
- `ingestOne()` --calls--> `wordCount()`  [EXTRACTED]
  scripts/rag-ingest.mjs → src/lib/rag-text.ts
- `loadIndex()` --calls--> `joinShard()`  [EXTRACTED]
  scripts/rag-search.mjs → src/lib/rag-shard.ts
- `runProbe()` --calls--> `detectVolatility()`  [EXTRACTED]
  scripts/test-sitting.mjs → src/lib/llm.ts
- `runProbe()` --calls--> `parseTurnOutput()`  [EXTRACTED]
  scripts/test-sitting.mjs → src/lib/llm.ts

## Import Cycles
- None detected.

## Communities (82 total, 20 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, lucide-react, react, react-dom, @supabase/supabase-js, devDependencies, autoprefixer, eslint (+35 more)

### Community 1 - "check-links.mjs"
Cohesion: 0.20
Nodes (9): broken, FILE, FIX, MONTHS, NOTE(), src, stamp(), uncertain (+1 more)

### Community 2 - "types/index.ts"
Cohesion: 0.07
Nodes (26): AccessibilitySettings, CHRONOLOGICAL_ORDER, Citation, CorpusChunk, CorpusPassage, CorpusSource, DEFAULT_ACCESSIBILITY, DEFAULT_SEATING_ORDER (+18 more)

### Community 3 - "App.tsx"
Cohesion: 0.06
Nodes (20): lucide-react, react, App(), DeckEntry, getReadMoreSource(), ReadMore(), toIntervention(), ALL_EDGES (+12 more)

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 5 - "openrouter.ts"
Cohesion: 0.21
Nodes (19): attemptModel(), extractDetail(), fetchModelText(), FREE_MODEL_CYCLE, FREE_ROUTER_FALLBACK, generateTextOpenRouter(), generateTurnOpenRouter(), isAvailabilityDetail() (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 7 - "alibaba.ts"
Cohesion: 0.29
Nodes (11): ALIBABA_MAX_TOKENS, alibabaError(), AlibabaTextArgs, AlibabaTurnArgs, extractDetail(), generateTextAlibaba(), generateTurnAlibaba(), postAlibaba() (+3 more)

### Community 8 - "llm.ts"
Cohesion: 0.09
Nodes (15): detectVolatility(), ECHO_REPAIR_SUFFIX, GLOSS_REPAIR_SUFFIX, LlmError, LlmErrorCode, parseTurnOutput(), RATE_TABLE, RateRow (+7 more)

### Community 9 - "settings.ts"
Cohesion: 0.12
Nodes (18): AlibabaModel, CabinetSettings, clearApiKey(), DEAD_GROQ_IDS, DEEPINFRA_BACKUP_LABEL, DEEPINFRA_PRIMARIES, DeepInfraModel, DeepInfraPrimary (+10 more)

### Community 10 - "tts.ts"
Cohesion: 0.22
Nodes (14): chunkText(), createTtsController(), finish(), speakItemChunks(), defaultVoice(), ensureVoices(), isTtsSupported(), listVoices() (+6 more)

### Community 11 - "cabinet.js"
Cohesion: 0.27
Nodes (12): clientIp(), DEFAULT_ALIBABA_MODELS, DEFAULT_MODELS, handler(), isModelFault(), json(), perIp, resetIfNewDay() (+4 more)

### Community 12 - "dialectic/prompts.ts"
Cohesion: 0.12
Nodes (9): CLOSING_SCAN, CODA_REPAIR_SUFFIX, CODA_SYSTEM, MARGINS_WRITER_NAME, MEDIUM_GLOSS_SCAN, THREAD_CITIES, TurnInstructionArgs, TurnKind (+1 more)

### Community 13 - "groq.ts"
Cohesion: 0.29
Nodes (11): extractDetail(), generateTextGroq(), generateTurnGroq(), GROQ_MAX_TOKENS, groqError(), GroqTextArgs, GroqTurnArgs, postGroq() (+3 more)

### Community 14 - "preferences.ts"
Cohesion: 0.32
Nodes (5): clamp(), DEFAULT_DISPLAY, DisplayPreferences, loadDisplay(), prefersReducedMotion()

### Community 15 - "philosophers/index.ts"
Cohesion: 0.20
Nodes (14): DEFAULT_SEATING_ORDER, DEFINITIONS, PHILOSOPHER_BY_SLUG, PHILOSOPHER_DATA, renderPersona(), renderAntiWaffle(), LANGUAGE_COMMON, LANGUAGE_LEVELS (+6 more)

### Community 16 - "lib/prompts.ts"
Cohesion: 0.52
Nodes (6): buildExportPrompt(), buildPrompt(), findPhilosopher(), interventionSummary(), philosopherProfileBlock(), PromptContext

### Community 17 - "The Dialectical Cabinet — Implementation Plan"
Cohesion: 0.06
Nodes (31): A. Not style (pipe/prompt plumbing — do first), API key: Bring-Your-Own-Key (BYOK) for personal providers, API keys: shared default, BYOK fallback, B. Style, NOT model-specific (do second), C. Style, model-specific (do last, one model at a time), Checklist, Decisions, Embeddings (Phase 5) (+23 more)

### Community 19 - "The Dialectical Cabinet"
Cohesion: 0.29
Nodes (6): For the curious, Quotas, Run it yourself (developers), Settings, explained (all four tabs), The Dialectical Cabinet, Try it

### Community 20 - "shared.ts"
Cohesion: 0.43
Nodes (6): generateTextShared(), generateTurnShared(), postShared(), SHARED_MAX_TOKENS, SharedTurnArgs, stripFences()

### Community 21 - "AGENTS.md"
Cohesion: 0.29
Nodes (6): free TTS recipe (Web Speech, no key), genealogy diagram, graphify, graphify workflow, RAG runbook (this repo), working rules (shared project norms)

### Community 22 - "deepinfra.ts"
Cohesion: 0.20
Nodes (16): DEEPINFRA_MAX_TOKENS, DEEPINFRA_MODEL, DEEPINFRA_MODEL_BACKUP, DEEPINFRA_MODEL_QWEN, deepInfraError(), DeepInfraPostArgs, DeepInfraTurnArgs, extractDetail() (+8 more)

### Community 23 - "together.ts"
Cohesion: 0.29
Nodes (11): extractDetail(), generateTextTogether(), generateTurnTogether(), postTogether(), sleep(), stripFences(), testTogetherKey(), TOGETHER_MAX_TOKENS (+3 more)

### Community 24 - "extract.js"
Cohesion: 0.43
Nodes (7): handler(), htmlToParagraphs(), json(), normalise(), queryTerms(), SKIP_EXTENSIONS, SKIP_HOSTS

### Community 25 - "footnotes.ts"
Cohesion: 0.36
Nodes (6): distinctive(), footnoteNumbers(), manifestNumber(), normalise(), splitLabels(), STOPWORDS

### Community 26 - "extract.ts"
Cohesion: 0.25
Nodes (4): ExtractReason, GroundedPassage, SKIP_EXTENSIONS, SKIP_HOSTS

### Community 27 - "anti-waffle.ts"
Cohesion: 0.40
Nodes (4): ANTI_WAFFLE_RULES, BANNED_PHRASES, DIALECTICAL_MATERIALISM_FRAME, ROLE_INTEGRITY

### Community 28 - "Models tried"
Cohesion: 0.18
Nodes (10): Current ranks (Sep 19 2026, owner-graded live sessions only), Current standing (Sep 17 2026, owner-graded, Low, 2030 question), Elimination plan (Sep 20 2026 — owner: start cutting, different models per level allowed), Free-provider shelf (awesome-free-llm-apis, evaluated Sep 17 2026 — NOT tested), Models tried, New candidates (Perplexity round 2, Sep 17 — UNTESTED, prices not, Pending verification (user fetching keys), Selection strategy (Sep 20 2026, owner order — revised same day) (+2 more)

### Community 47 - "verify.ts"
Cohesion: 0.60
Nodes (4): extractQuotes(), normalise(), QuoteCheck, verifyQuotes()

### Community 49 - "rag-search.mjs"
Cohesion: 0.16
Nodes (11): args, debug, loadIndex(), { manifest, passages }, prepared, query, IndexPassage, AuthorShard (+3 more)

### Community 50 - "service-chat.ts"
Cohesion: 0.25
Nodes (4): SERVICE_LIMIT_MESSAGE, SERVICE_MAX_QUESTIONS, ServiceHistoryItem, ServiceUserMessageArgs

### Community 51 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, check-links, check-links:fix, dev, lint, preview, rag:eval (+9 more)

### Community 52 - "Language levels (Low / Medium / High)"
Cohesion: 0.29
Nodes (6): How to make trios (worked procedure), How to set difficulty levels, Language levels (Low / Medium / High), Reference: verified prompt order (Bookchin, Low, critique turn), Rollback points (read before changing anything below), Trio-creation instructions that did NOT work

### Community 53 - "rag-ingest.mjs"
Cohesion: 0.17
Nodes (20): authorSlug(), DB_PATH, exportJson(), fail(), fetchText(), ingestOne(), leadingCapsRun(), main() (+12 more)

### Community 54 - "rag-inspect.mjs"
Cohesion: 0.22
Nodes (7): args, db, full, id, pid, sections, work

### Community 55 - "rag-manifest.mjs"
Cohesion: 0.22
Nodes (7): APPROVE_ALL, blocks, byId, CORPUS, MANIFEST, SKIP_IDS, src

### Community 56 - "manifest.json"
Cohesion: 0.29
Nodes (6): authors, chunker_version, exported_at, schema_version, total_passages, version

### Community 57 - "genealogy-layout.ts"
Cohesion: 0.07
Nodes (27): drawn, drawnKeys, edges, paths, cell(), code(), counts, known (+19 more)

### Community 58 - "New philosopher brief (reusable)"
Cohesion: 0.50
Nodes (3): New philosopher brief (reusable), Phase 1 — research prompt (paste to research LLM), Phase 2 — build checklist (builder)

### Community 59 - "Node-and-debt diagram — style, preferences, and quick-start"
Cohesion: 0.15
Nodes (12): Access and review, Data contract [repo], Fixed dark cabinet (hard rule), Geometry specification (what the code may do), Layout (current instantiation [repo]; roles are the spec), Lines (road-system design — the default), Lines (single-thread variant — simple diagrams only), Node-and-debt diagram — style, preferences, and quick-start (+4 more)

### Community 60 - "Family A/B eval — Qwen-first or DeepSeek-first (Phase 7)"
Cohesion: 0.25
Nodes (7): Auto-metrics (assistants, not judges — human grades rule), Family A/B eval — Qwen-first or DeepSeek-first (Phase 7), Grade each run (from `language-levels.md` trio rubric), Report back per run, Round 1 — Low, one run per pipe, Round 2 — winner takes Medium + High, The question (reuse verbatim for every run)

### Community 61 - "check-diagram-contrast.mjs"
Cohesion: 0.50
Nodes (4): luminance(), pairs, ratio(), NOTE: muted rgba() entries above are pre-blended approximations on #221910.

### Community 63 - "trios.ts"
Cohesion: 0.50
Nodes (3): FALLBACK_MEDIUM_EXAMPLE, SEAT_TRIOS, SeatTrio

### Community 64 - "universal-mechanisms.ts"
Cohesion: 0.33
Nodes (5): AVOID_CARICATURE, FORENSIC_PREAMBLE, GENERATIVE_ARGUMENT_MODEL, STYLE_CONTROL_DESCRIPTION, UNIVERSAL_SUPPORTING_MECHANISMS

### Community 67 - "Things taught (owner's notebook)"
Cohesion: 0.14
Nodes (13): Copyright has two clocks (Sep 17 2026), Flag the fake citation, don't delete it (Sep 20 2026), Free tiers wall mid-session (Sep 17 2026), Garbled turns get caught by shape, not by reading (Sep 20 2026), Input tokens run the show (Sep 17 2026), Model IDs rot (Sep 17 2026), One browser, many keys, no login: localStorage (Sep 20 2026), Pass-3 architecture (Sep 17 2026) (+5 more)

### Community 68 - "rag-translate-once.mjs"
Cohesion: 0.29
Nodes (6): DB, JOBS, out, sleep(), translateBatch(), USE_OR

### Community 70 - "Alibaba 27B High, visitor key — v1 (São Paulo, education question)"
Cohesion: 0.09
Nodes (22): Alibaba 27B High, visitor key — v1 (São Paulo, education question), MODELS USED, NOTES FROM THE MARGINS (after pass 1), NOTES FROM THE MARGINS (before pass 3), NOTES FROM THE MARGINS (closing summary), PASS 1 — Bloch, PASS 1 — Bogdanov, PASS 1 — Bookchin (+14 more)

### Community 71 - "zai.ts"
Cohesion: 0.29
Nodes (11): extractDetail(), generateTextZai(), generateTurnZai(), postZai(), sleep(), stripFences(), testZaiKey(), ZAI_MAX_TOKENS (+3 more)

### Community 72 - "GLM 5.3 High, OpenRouter paid — v2 (Seoul, education question)"
Cohesion: 0.09
Nodes (22): GLM 5.3 High, OpenRouter paid — v2 (Seoul, education question), MODELS USED, NOTES FROM THE MARGINS (after pass 1), NOTES FROM THE MARGINS (before pass 3), NOTES FROM THE MARGINS (closing summary), PASS 1 — Bloch, PASS 1 — Bookchin, PASS 1 — Hegel (+14 more)

### Community 73 - "Qwen 14B High, OpenRouter paid — v1 (Buenos Aires, education question)"
Cohesion: 0.09
Nodes (22): MODELS USED, NOTES FROM THE MARGINS (after pass 1), NOTES FROM THE MARGINS (before pass 3), NOTES FROM THE MARGINS (closing summary), PASS 1 — Bloch — ECHO (shares Lenin/Bogdanov lever phrase), PASS 1 — Bogdanov, PASS 1 — Bookchin, PASS 1 — Lenin (+14 more)

### Community 74 - "Qwen 30B High, OpenRouter paid — v2 (São Paulo, education question)"
Cohesion: 0.09
Nodes (22): MODELS USED, NOTES FROM THE MARGINS (after pass 1), NOTES FROM THE MARGINS (before pass 3), NOTES FROM THE MARGINS (closing summary), PASS 1 — Bloch, PASS 1 — Bogdanov, PASS 1 — Bookchin, PASS 1 — Lenin (+14 more)

### Community 75 - "test-matrix.mjs"
Cohesion: 0.16
Nodes (15): loadTestEnv(), rows, width, ci, done, dry, li, long (+7 more)

### Community 76 - "porter.ts"
Cohesion: 0.30
Nodes (14): endsCvc(), endsDouble(), hasVowel(), isConsonant(), measure(), stem(), step1(), step1b() (+6 more)

### Community 77 - "test-sitting.mjs"
Cohesion: 0.20
Nodes (12): runProbe(), stripFences(), wordCount(), buildClosingScan(), buildTurnInstruction(), GLOSSARY_SHAPE, LOW_CLOSING_REMINDER, MAX_OUTPUT_TOKENS (+4 more)

### Community 78 - "rag-text.ts"
Cohesion: 0.36
Nodes (9): CHUNK_SOFT_MAX, CHUNK_SOFT_MIN, CHUNK_TARGET_WORDS, chunkParagraphs(), splitLongParagraph(), extractReadable(), normalizeText(), STOP (+1 more)

### Community 79 - "rag-eval.mjs"
Cohesion: 0.15
Nodes (11): byCategory, failures, index, lat, latencies, passages, pos, prepared (+3 more)

### Community 80 - "rag-ground.ts"
Cohesion: 0.27
Nodes (10): cache, CachedAuthor, loadThinker(), manifestNumberForUrl(), RagGrounding, searchThinkerPassages(), ShardHit, PreparedIndex (+2 more)

### Community 81 - "rag-search.ts"
Cohesion: 0.25
Nodes (9): bm25Term(), ScoredPassage, SearchDebug, searchIndex(), SearchOptions, STOP, queryTerms(), STOPWORDS (+1 more)

## Knowledge Gaps
- **483 isolated node(s):** `$schema`, `plugin`, `DEFAULT_MODELS`, `DEFAULT_ALIBABA_MODELS`, `usageDay` (+478 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 564 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `package.json`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `DEFAULT_MODELS` to the rest of the system?**
  _483 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04717853839037928 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0620782726045884 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._