# Graph Report - philosopherstable  (2026-09-11)

## Corpus Check
- 62 files · ~49,653 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 373 nodes · 442 edges · 29 communities (21 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cf13628`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- lucide-react
- types/index.ts
- App.tsx
- compilerOptions
- openrouter.ts
- compilerOptions
- devDependencies
- gemini.ts
- settings.ts
- tts.ts
- cabinet.js
- dialectic/prompts.ts
- groq.ts
- preferences.ts
- philosophers/index.ts
- lib/prompts.ts
- The Dialectical Cabinet — Implementation Plan
- universal-mechanisms.ts
- The Dialectical Cabinet
- shared.ts
- AGENTS.md
- graphify.js
- tsconfig.json
- split_philosophers.py
- corpus-sources.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 14 edges
3. `lucide-react` - 9 edges
4. `The Dialectical Cabinet — Implementation Plan` - 9 edges
5. `generateTurn()` - 8 edges
6. `Decisions` - 8 edges
7. `attemptModel()` - 7 edges
8. `scripts` - 6 edges
9. `tryModel()` - 5 edges
10. `handler()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `renderPersona()` --calls--> `renderAntiWaffle()`  [EXTRACTED]
  src/philosophers/index.ts → src/philosophers/shared/anti-waffle.ts
- `renderPersona()` --calls--> `renderUniversalMechanisms()`  [EXTRACTED]
  src/philosophers/index.ts → src/philosophers/shared/universal-mechanisms.ts

## Import Cycles
- None detected.

## Communities (29 total, 5 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (36): dependencies, @google/generative-ai, lucide-react, react, react-dom, @supabase/supabase-js, name, private (+28 more)

### Community 1 - "lucide-react"
Cohesion: 0.07
Nodes (10): lucide-react, CabinetTableProps, InterventionCardProps, InterventionModalProps, ProfileModalProps, SettingsDrawerProps, SourceDrawerProps, CabinetRecordProps (+2 more)

### Community 2 - "types/index.ts"
Cohesion: 0.08
Nodes (24): AccessibilitySettings, CHRONOLOGICAL_ORDER, Citation, CorpusChunk, CorpusPassage, CorpusSource, DEFAULT_ACCESSIBILITY, DEFAULT_SEATING_ORDER (+16 more)

### Community 3 - "App.tsx"
Cohesion: 0.13
Nodes (6): react, App(), getReadMoreSource(), NOTE: this is also used directly as an onClick handler, so the first, ReadMore(), toIntervention()

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 5 - "openrouter.ts"
Cohesion: 0.21
Nodes (17): attemptModel(), extractDetail(), FREE_MODEL_CYCLE, FREE_ROUTER_FALLBACK, generateTurnOpenRouter(), isAvailabilityDetail(), isFailFast(), loadLastGood() (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 7 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+7 more)

### Community 8 - "gemini.ts"
Cohesion: 0.21
Nodes (14): endpoint(), extractDetail(), friendlyError(), GeminiError, GeminiErrorCode, generateTurn(), GenerateTurnArgs, parseTurnOutput() (+6 more)

### Community 9 - "settings.ts"
Cohesion: 0.18
Nodes (12): CabinetSettings, clearApiKey(), DEFAULT_SETTINGS, GEMINI_MODELS, GeminiModel, GROQ_MODELS, GroqModel, LEGACY_MODEL_MAP (+4 more)

### Community 10 - "tts.ts"
Cohesion: 0.23
Nodes (12): chunkText(), createTtsController(), finish(), speakItemChunks(), ensureVoices(), isTtsSupported(), listVoices(), TtsController (+4 more)

### Community 11 - "cabinet.js"
Cohesion: 0.30
Nodes (11): clientIp(), DEFAULT_MODELS, handler(), isModelFault(), json(), perIp, resetIfNewDay(), safeDetail() (+3 more)

### Community 12 - "dialectic/prompts.ts"
Cohesion: 0.20
Nodes (6): MAX_OUTPUT_TOKENS, STRUCTURED_OUTPUT_HINT, TurnInstructionArgs, TurnKind, UserMessageArgs, WORD_BUDGETS

### Community 13 - "groq.ts"
Cohesion: 0.39
Nodes (8): extractDetail(), generateTurnGroq(), GROQ_MAX_TOKENS, groqError(), GroqTurnArgs, sleep(), stripFences(), testGroqKey()

### Community 14 - "preferences.ts"
Cohesion: 0.32
Nodes (5): clamp(), DEFAULT_DISPLAY, DisplayPreferences, loadDisplay(), prefersReducedMotion()

### Community 15 - "philosophers/index.ts"
Cohesion: 0.05
Nodes (31): BOGDANOV, BOGDANOV_STYLE, BOOKCHIN, BOOKCHIN_STYLE, DELEUZE, DELEUZE_STYLE, FISHER, FISHER_STYLE (+23 more)

### Community 16 - "lib/prompts.ts"
Cohesion: 0.52
Nodes (6): buildExportPrompt(), buildPrompt(), findPhilosopher(), interventionSummary(), philosopherProfileBlock(), PromptContext

### Community 17 - "The Dialectical Cabinet — Implementation Plan"
Cohesion: 0.12
Nodes (16): API key: Bring-Your-Own-Key (BYOK) for personal providers, API keys: shared default, BYOK fallback, Decisions, Embeddings (Phase 5), Length: short and punchy, Phase 0 — Make the current tree build  ✅ (this session), Phase 1 — Per-philosopher files with style essences, Phase 2 — Gemini + dialectical engine (replaces `makeMockIntervention`) (+8 more)

### Community 18 - "universal-mechanisms.ts"
Cohesion: 0.33
Nodes (5): AVOID_CARICATURE, FORENSIC_PREAMBLE, GENERATIVE_ARGUMENT_MODEL, STYLE_CONTROL_DESCRIPTION, UNIVERSAL_SUPPORTING_MECHANISMS

### Community 19 - "The Dialectical Cabinet"
Cohesion: 0.33
Nodes (5): For the curious, Quotas (the honest version), Run it yourself (developers), The Dialectical Cabinet, Try it

### Community 20 - "shared.ts"
Cohesion: 0.50
Nodes (4): generateTurnShared(), SHARED_MAX_TOKENS, SharedTurnArgs, stripFences()

## Knowledge Gaps
- **179 isolated node(s):** `DEFAULT_MODELS`, `usageDay`, `perIp`, `name`, `private` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 221 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `package.json`, `App.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `package.json`, `lucide-react`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `DEFAULT_MODELS`, `usageDay`, `perIp` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._