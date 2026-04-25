# Graph Report - .  (2026-04-25)

## Corpus Check
- 18 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 39 nodes · 41 edges · 14 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `hasKeyboardMash()` - 3 edges
2. `buildDocxParagraphs()` - 3 edges
3. `triggerDownload()` - 3 edges
4. `downloadSectionAsDocx()` - 3 edges
5. `downloadFullPlanAsDocx()` - 3 edges
6. `callGemini()` - 2 edges
7. `POST()` - 2 edges
8. `validateBusiness()` - 2 edges
9. `validateProject()` - 2 edges
10. `turnoverValue()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.67
Nodes (2): callGemini(), POST()

### Community 2 - "Community 2"
Cohesion: 0.67
Nodes (4): buildDocxParagraphs(), downloadFullPlanAsDocx(), downloadSectionAsDocx(), triggerDownload()

### Community 3 - "Community 3"
Cohesion: 0.67
Nodes (3): hasKeyboardMash(), validateBusiness(), validateProject()

### Community 4 - "Community 4"
Cohesion: 1
Nodes (2): getRecommendation(), StructureAdvisor()

### Community 5 - "Community 5"
Cohesion: 1
Nodes (2): scoreScheme(), turnoverValue()

### Community 6 - "Community 6"
Cohesion: 1
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1
Nodes (2): calcPAYE(), PAYECalculator()

### Community 8 - "Community 8"
Cohesion: 1
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 4`** (2 nodes): `getRecommendation()`, `StructureAdvisor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (2 nodes): `scoreScheme()`, `turnoverValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `calcPAYE()`, `PAYECalculator()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `EmailCapture.jsx`, `EmailCapture()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `Shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hasKeyboardMash()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `buildDocxParagraphs()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.000) - this node is a cross-community bridge._
- **Why does `triggerDownload()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.000) - this node is a cross-community bridge._