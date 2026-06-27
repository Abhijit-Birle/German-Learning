# Graph Report - .  (2026-06-21)

## Corpus Check
- Corpus is ~36,627 words - fits in a single context window. You may not need a graph.

## Summary
- 506 nodes · 1762 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 416 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Vite JS Assets Block 1|Vite JS Assets Block 1]]
- [[_COMMUNITY_React App & Utilities|React App & Utilities]]
- [[_COMMUNITY_Vite JS Assets Block 2|Vite JS Assets Block 2]]
- [[_COMMUNITY_Vite JS Assets Block 3|Vite JS Assets Block 3]]
- [[_COMMUNITY_Vite JS Assets Block 4|Vite JS Assets Block 4]]
- [[_COMMUNITY_Vite JS Assets Block 5|Vite JS Assets Block 5]]
- [[_COMMUNITY_Vite JS Assets Block 6|Vite JS Assets Block 6]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Vite JS Assets Block 8|Vite JS Assets Block 8]]
- [[_COMMUNITY_Vite JS Assets Block 9|Vite JS Assets Block 9]]
- [[_COMMUNITY_Vite JS Assets Block 10|Vite JS Assets Block 10]]
- [[_COMMUNITY_Vite JS Assets Block 11|Vite JS Assets Block 11]]
- [[_COMMUNITY_Vite JS Assets Block 13|Vite JS Assets Block 13]]
- [[_COMMUNITY_Vite JS Assets Block 14|Vite JS Assets Block 14]]
- [[_COMMUNITY_Android UI Tests|Android UI Tests]]
- [[_COMMUNITY_Android Unit Tests|Android Unit Tests]]
- [[_COMMUNITY_Android Main Activity|Android Main Activity]]

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
- `ExerciseResults()` --calls--> `useExerciseStore`  [EXTRACTED]
  src/components/ExerciseResults.jsx → src/store/useExerciseStore.js
- `ExerciseSession()` --calls--> `useExerciseStore`  [EXTRACTED]
  src/components/ExerciseSession.jsx → src/store/useExerciseStore.js

## Import Cycles
- None detected.

## Communities (30 total, 3 thin omitted)

### Community 0 - "Vite JS Assets Block 1"
Cohesion: 0.08
Nodes (74): $a(), aa(), Ac(), ao(), as(), bc(), be(), bi() (+66 more)

### Community 1 - "React App & Utilities"
Cohesion: 0.09
Nodes (48): ApiKeyBar(), DailyLesson(), ExerciseList(), ExerciseResults(), ExerciseRow(), ExerciseSession(), MistakeMemory(), Onboarding() (+40 more)

### Community 2 - "Vite JS Assets Block 2"
Cohesion: 0.07
Nodes (58): ap(), at(), Au(), bd(), bu(), cd(), cp(), ct() (+50 more)

### Community 3 - "Vite JS Assets Block 3"
Cohesion: 0.11
Nodes (47): bl(), cl(), dc(), dl(), ec(), el(), fl(), gc() (+39 more)

### Community 4 - "Vite JS Assets Block 4"
Cohesion: 0.09
Nodes (44): b(), Bo(), bs(), cs(), dd(), ds(), es(), fs() (+36 more)

### Community 5 - "Vite JS Assets Block 5"
Cohesion: 0.15
Nodes (38): af(), cf(), df(), ef(), en(), et(), fd(), ff() (+30 more)

### Community 6 - "Vite JS Assets Block 6"
Cohesion: 0.08
Nodes (22): $(), addListener(), addWindowListener(), clearAllCookies(), clearCookies(), hide(), jr(), Mr() (+14 more)

### Community 7 - "NPM Dependencies"
Cohesion: 0.06
Nodes (30): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, caveman, lucide-react, react (+22 more)

### Community 8 - "Vite JS Assets Block 8"
Cohesion: 0.19
Nodes (19): ad(), ar(), Cn(), cr(), Ed(), fr(), Gd(), hn() (+11 more)

### Community 9 - "Vite JS Assets Block 9"
Cohesion: 0.17
Nodes (15): ae(), ce(), De(), Ee(), ie(), le(), ne(), Oe() (+7 more)

### Community 10 - "Vite JS Assets Block 10"
Cohesion: 0.17
Nodes (13): f(), fe(), hl(), jl(), l(), m(), ml(), mp() (+5 more)

### Community 11 - "Vite JS Assets Block 11"
Cohesion: 0.20
Nodes (10): Bt(), dr(), Er(), gr(), Ht(), Tr(), ue(), Vt() (+2 more)

### Community 13 - "Vite JS Assets Block 13"
Cohesion: 0.29
Nodes (7): dt(), i(), rc(), Ro(), sf(), t(), vs()

### Community 14 - "Vite JS Assets Block 14"
Cohesion: 0.33
Nodes (6): hr(), Ki(), qi(), ud(), uf(), yd()

## Knowledge Gaps
- **30 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$()` connect `Vite JS Assets Block 6` to `Vite JS Assets Block 1`, `Vite JS Assets Block 2`, `Vite JS Assets Block 3`, `Vite JS Assets Block 4`, `Vite JS Assets Block 5`, `Vite JS Assets Block 8`, `Vite JS Assets Block 9`, `Vite JS Assets Block 10`, `Vite JS Assets Block 11`, `Capacitor Web JS`, `Vite JS Assets Block 13`, `Vite JS Assets Block 14`?**
  _High betweenness centrality (0.510) - this node is a cross-community bridge._
- **Why does `S()` connect `Vite JS Assets Block 1` to `Vite JS Assets Block 2`, `Vite JS Assets Block 3`, `Vite JS Assets Block 4`, `Vite JS Assets Block 5`, `Vite JS Assets Block 6`, `Vite JS Assets Block 8`, `Vite JS Assets Block 10`, `Vite JS Assets Block 11`, `Vite JS Assets Block 14`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `pc()` connect `Vite JS Assets Block 1` to `Vite JS Assets Block 2`, `Vite JS Assets Block 3`, `Vite JS Assets Block 4`, `Vite JS Assets Block 5`, `Vite JS Assets Block 6`, `Vite JS Assets Block 9`, `Vite JS Assets Block 14`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `S()` (e.g. with `Au()` and `b()`) actually correct?**
  _`S()` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `pc()` (e.g. with `mu()` and `Nu()`) actually correct?**
  _`pc()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `wc()` (e.g. with `dl()` and `fl()`) actually correct?**
  _`wc()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `bc()` (e.g. with `bd()` and `d()`) actually correct?**
  _`bc()` has 15 INFERRED edges - model-reasoned connections that need verification._