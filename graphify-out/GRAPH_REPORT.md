# Graph Report - philosopherstable  (2026-09-12)

## Corpus Check
- 63 files · ~53,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 408 nodes · 483 edges · 48 communities (29 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19d09c47`
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
- devDependencies
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
- universal-mechanisms.ts
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 14 edges
3. `The Dialectical Cabinet — Implementation Plan` - 9 edges
4. `scripts` - 8 edges
5. `Decisions` - 8 edges
6. `attemptModel()` - 7 edges
7. `speakItemChunks()` - 6 edges
8. `tryModel()` - 5 edges
9. `handler()` - 5 edges
10. `handler()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `renderPersona()` --calls--> `renderAntiWaffle()`  [EXTRACTED]
  src/philosophers/index.ts → src/philosophers/shared/anti-waffle.ts
- `renderPersona()` --calls--> `renderUniversalMechanisms()`  [EXTRACTED]
  src/philosophers/index.ts → src/philosophers/shared/universal-mechanisms.ts

## Import Cycles
- None detected.

## Communities (48 total, 16 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (36): dependencies, lucide-react, react, react-dom, @supabase/supabase-js, name, private, scripts (+28 more)

### Community 1 - "check-links.mjs"
Cohesion: 0.20
Nodes (9): broken, FILE, FIX, MONTHS, NOTE(), src, stamp(), uncertain (+1 more)

### Community 2 - "types/index.ts"
Cohesion: 0.08
Nodes (24): AccessibilitySettings, CHRONOLOGICAL_ORDER, Citation, CorpusChunk, CorpusPassage, CorpusSource, DEFAULT_ACCESSIBILITY, DEFAULT_SEATING_ORDER (+16 more)

### Community 3 - "App.tsx"
Cohesion: 0.11
Nodes (6): lucide-react, react, App(), getReadMoreSource(), ReadMore(), toIntervention()

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

### Community 8 - "llm.ts"
Cohesion: 0.22
Nodes (7): LlmError, LlmErrorCode, parseTurnOutput(), REPAIR_SUFFIX, requoteBareValues(), TURN_KEYS, TurnOutput

### Community 9 - "settings.ts"
Cohesion: 0.24
Nodes (9): CabinetSettings, clearApiKey(), DEFAULT_SETTINGS, GROQ_MODELS, GroqModel, LlmProvider, loadSettings(), saveSettings() (+1 more)

### Community 10 - "tts.ts"
Cohesion: 0.23
Nodes (13): chunkText(), createTtsController(), finish(), speakItemChunks(), defaultVoice(), ensureVoices(), isTtsSupported(), listVoices() (+5 more)

### Community 11 - "cabinet.js"
Cohesion: 0.30
Nodes (11): clientIp(), DEFAULT_MODELS, handler(), isModelFault(), json(), perIp, resetIfNewDay(), safeDetail() (+3 more)

### Community 12 - "dialectic/prompts.ts"
Cohesion: 0.17
Nodes (7): CODA_SYSTEM, MAX_OUTPUT_TOKENS, STRUCTURED_OUTPUT_HINT, TurnInstructionArgs, TurnKind, UserMessageArgs, WORD_BUDGETS

### Community 13 - "groq.ts"
Cohesion: 0.39
Nodes (8): extractDetail(), generateTurnGroq(), GROQ_MAX_TOKENS, groqError(), GroqTurnArgs, sleep(), stripFences(), testGroqKey()

### Community 14 - "preferences.ts"
Cohesion: 0.32
Nodes (5): clamp(), DEFAULT_DISPLAY, DisplayPreferences, loadDisplay(), prefersReducedMotion()

### Community 15 - "philosophers/index.ts"
Cohesion: 0.32
Nodes (7): DEFAULT_SEATING_ORDER, DEFINITIONS, PHILOSOPHER_BY_SLUG, PHILOSOPHER_DATA, renderPersona(), renderAntiWaffle(), renderUniversalMechanisms()

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

### Community 22 - "deepinfra.ts"
Cohesion: 0.33
Nodes (9): DEEPINFRA_MAX_TOKENS, DEEPINFRA_MODEL, deepInfraError(), DeepInfraTurnArgs, extractDetail(), generateTurnDeepInfra(), sleep(), stripFences() (+1 more)

### Community 23 - "together.ts"
Cohesion: 0.33
Nodes (9): extractDetail(), generateTurnTogether(), sleep(), stripFences(), testTogetherKey(), TOGETHER_MAX_TOKENS, TOGETHER_MODEL, togetherError() (+1 more)

### Community 24 - "extract.js"
Cohesion: 0.43
Nodes (7): handler(), htmlToParagraphs(), json(), normalise(), queryTerms(), SKIP_EXTENSIONS, SKIP_HOSTS

### Community 25 - "footnotes.ts"
Cohesion: 0.43
Nodes (6): distinctive(), footnoteNumbers(), manifestNumber(), normalise(), splitLabels(), STOPWORDS

### Community 26 - "extract.ts"
Cohesion: 0.29
Nodes (3): GroundedPassage, SKIP_EXTENSIONS, SKIP_HOSTS

### Community 27 - "anti-waffle.ts"
Cohesion: 0.40
Nodes (4): ANTI_WAFFLE_RULES, BANNED_PHRASES, DIALECTICAL_MATERIALISM_FRAME, ROLE_INTEGRITY

### Community 28 - "Models tried"
Cohesion: 0.50
Nodes (3): Models tried, Pending verification (user fetching keys), Verdicts

### Community 47 - "verify.ts"
Cohesion: 0.60
Nodes (4): extractQuotes(), normalise(), QuoteCheck, verifyQuotes()

## Knowledge Gaps
- **191 isolated node(s):** `$schema`, `plugin`, `DEFAULT_MODELS`, `usageDay`, `perIp` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 232 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `package.json`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `App.tsx` to `package.json`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `DEFAULT_MODELS` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10822510822510822 - nodes in this community are weakly interconnected._