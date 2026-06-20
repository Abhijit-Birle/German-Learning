# Graph Report - .  (2026-06-21)

## Corpus Check
- Corpus is ~32,025 words - fits in a single context window. You may not need a graph.

## Summary
- 488 nodes · 1709 edges · 32 communities (29 shown, 3 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 416 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Minified Assets Bundle|Minified Assets Bundle]]
- [[_COMMUNITY_Minified JS Chunk 1|Minified JS Chunk 1]]
- [[_COMMUNITY_React App & Components|React App & Components]]
- [[_COMMUNITY_Minified JS Chunk 2|Minified JS Chunk 2]]
- [[_COMMUNITY_Minified JS Chunk 3|Minified JS Chunk 3]]
- [[_COMMUNITY_Minified JS Chunk 4|Minified JS Chunk 4]]
- [[_COMMUNITY_Vite Asset Core|Vite Asset Core]]
- [[_COMMUNITY_NPM Package Config|NPM Package Config]]
- [[_COMMUNITY_Minified JS Chunk 5|Minified JS Chunk 5]]
- [[_COMMUNITY_Minified JS Chunk 6|Minified JS Chunk 6]]
- [[_COMMUNITY_Minified JS Chunk 7|Minified JS Chunk 7]]
- [[_COMMUNITY_Minified JS Chunk 8|Minified JS Chunk 8]]
- [[_COMMUNITY_Minified JS Chunk 9|Minified JS Chunk 9]]
- [[_COMMUNITY_Minified JS Chunk 10|Minified JS Chunk 10]]
- [[_COMMUNITY_Minified JS Chunk 11|Minified JS Chunk 11]]
- [[_COMMUNITY_Android Instrumented Test|Android Instrumented Test]]
- [[_COMMUNITY_Android Unit Test|Android Unit Test]]
- [[_COMMUNITY_Minified JS Chunk 12|Minified JS Chunk 12]]
- [[_COMMUNITY_Android App Activity|Android App Activity]]

## God Nodes (most connected - your core abstractions)
1. `$()` - 370 edges
2. `S()` - 59 edges
3. `pc()` - 51 edges
4. `wc()` - 34 edges
5. `bc()` - 33 edges
6. `wd()` - 28 edges
7. `z()` - 26 edges
8. `hc()` - 25 edges
9. `get()` - 24 edges
10. `vl()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `ApiKeyBar()` --calls--> `t()`  [EXTRACTED]
  src/components/ApiKeyBar.jsx → src/i18n.js
- `DailyLesson()` --calls--> `useGemini()`  [EXTRACTED]
  src/components/DailyLesson.jsx → src/hooks/useGemini.js
- `DailyLesson()` --calls--> `t()`  [EXTRACTED]
  src/components/DailyLesson.jsx → src/i18n.js
- `MistakeMemory()` --calls--> `useGemini()`  [EXTRACTED]
  src/components/MistakeMemory.jsx → src/hooks/useGemini.js
- `MistakeMemory()` --calls--> `t()`  [EXTRACTED]
  src/components/MistakeMemory.jsx → src/i18n.js

## Import Cycles
- None detected.

## Communities (32 total, 3 thin omitted)

### Community 0 - "Minified Assets Bundle"
Cohesion: 0.06
Nodes (70): ap(), Au(), bd(), bu(), cd(), ci(), cp(), ct() (+62 more)

### Community 1 - "Minified JS Chunk 1"
Cohesion: 0.09
Nodes (60): $a(), aa(), Ac(), ao(), as(), bc(), be(), c() (+52 more)

### Community 2 - "React App & Components"
Cohesion: 0.11
Nodes (38): ApiKeyBar(), DailyLesson(), ExerciseRow(), MistakeMemory(), Onboarding(), QuickTranslator(), Tutor(), Vocabulary() (+30 more)

### Community 3 - "Minified JS Chunk 2"
Cohesion: 0.12
Nodes (44): bl(), Bo(), cl(), dl(), el(), f(), fl(), gc() (+36 more)

### Community 4 - "Minified JS Chunk 3"
Cohesion: 0.14
Nodes (41): af(), Bt(), cf(), df(), ef(), en(), et(), ff() (+33 more)

### Community 5 - "Minified JS Chunk 4"
Cohesion: 0.09
Nodes (40): b(), bs(), cs(), dd(), ds(), es(), fs(), Fu() (+32 more)

### Community 6 - "Vite Asset Core"
Cohesion: 0.08
Nodes (19): $(), addListener(), addWindowListener(), clearAllCookies(), clearCookies(), hide(), hl(), jl() (+11 more)

### Community 7 - "NPM Package Config"
Cohesion: 0.07
Nodes (28): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, lucide-react, react, react-dom (+20 more)

### Community 8 - "Minified JS Chunk 5"
Cohesion: 0.19
Nodes (19): ad(), ar(), Cn(), cr(), Ed(), fr(), Gd(), hn() (+11 more)

### Community 9 - "Minified JS Chunk 6"
Cohesion: 0.16
Nodes (15): ae(), ce(), ie(), le(), ne(), patch(), post(), put() (+7 more)

### Community 10 - "Minified JS Chunk 7"
Cohesion: 0.21
Nodes (14): bi(), dc(), ec(), Ha(), hi(), i(), ic(), rc() (+6 more)

### Community 11 - "Minified JS Chunk 8"
Cohesion: 0.20
Nodes (10): at(), fd(), it(), jd(), Jt(), kt(), md(), ni() (+2 more)

### Community 13 - "Minified JS Chunk 9"
Cohesion: 0.33
Nodes (6): dr(), Er(), gr(), Ht(), Tr(), wt()

### Community 14 - "Minified JS Chunk 10"
Cohesion: 0.33
Nodes (6): hr(), Ki(), qi(), ud(), uf(), yd()

### Community 15 - "Minified JS Chunk 11"
Cohesion: 0.40
Nodes (5): jr(), Mr(), Nr(), Pr(), Ru()

### Community 18 - "Minified JS Chunk 12"
Cohesion: 0.67
Nodes (4): De(), Ee(), Oe(), we()

## Knowledge Gaps
- **28 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$()` connect `Vite Asset Core` to `Minified Assets Bundle`, `Minified JS Chunk 1`, `Minified JS Chunk 2`, `Minified JS Chunk 3`, `Minified JS Chunk 4`, `Minified JS Chunk 5`, `Minified JS Chunk 6`, `Minified JS Chunk 7`, `Minified JS Chunk 8`, `Capacitor App Core`, `Minified JS Chunk 9`, `Minified JS Chunk 10`, `Minified JS Chunk 11`, `Minified JS Chunk 12`?**
  _High betweenness centrality (0.549) - this node is a cross-community bridge._
- **Why does `S()` connect `Minified JS Chunk 2` to `Minified Assets Bundle`, `Minified JS Chunk 1`, `Minified JS Chunk 3`, `Minified JS Chunk 4`, `Vite Asset Core`, `Minified JS Chunk 5`, `Minified JS Chunk 6`, `Minified JS Chunk 7`, `Minified JS Chunk 8`, `Minified JS Chunk 9`, `Minified JS Chunk 10`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `pc()` connect `Minified JS Chunk 1` to `Minified Assets Bundle`, `Minified JS Chunk 2`, `Minified JS Chunk 3`, `Minified JS Chunk 4`, `Vite Asset Core`, `Minified JS Chunk 6`, `Minified JS Chunk 7`, `Minified JS Chunk 10`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `S()` (e.g. with `Au()` and `b()`) actually correct?**
  _`S()` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `pc()` (e.g. with `mu()` and `Nu()`) actually correct?**
  _`pc()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `wc()` (e.g. with `dl()` and `fl()`) actually correct?**
  _`wc()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `bc()` (e.g. with `bd()` and `d()`) actually correct?**
  _`bc()` has 15 INFERRED edges - model-reasoned connections that need verification._