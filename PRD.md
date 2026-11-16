# PRD — Balanced Parentheses & Brackets Analyzer

| Field | Detail |
|---|---|
| **Product** | Balanced Parentheses & Brackets Analyzer |
| **Version** | 1.0.0 (MVP) |
| **Status** | Approved for Build |
| **Date** | 2026-11-16 |
| **Owner** | CDproject Team |
| **Type** | Web App (Static, Deployable) |
| **Repo** | `Mayank17OP/CDproject` |

---

## 1. Overview

The **Balanced Parentheses & Brackets Analyzer** is a free, browser-based tool that checks whether brackets in any text, expression, or code snippet are correctly balanced and properly nested. It goes beyond a simple yes/no answer — it visualizes the stack algorithm step-by-step, pinpoints the exact error position, and suggests a fix.

**Tagline:** *Paste anything. Know instantly if your brackets are balanced — and exactly where they break.*

### 1.1 Problem Statement
- Developers, students, and interview candidates frequently make bracket-matching mistakes in code and math expressions.
- Existing online checkers give only "Balanced / Not Balanced" with no explanation, no visualization, and no fix suggestion.
- Students learning the Stack data structure need an interactive visualizer, not just static text.

### 1.2 Solution
A single-page web app that:
1. Accepts any text/code in a textarea.
2. Runs the classic Stack-based matching algorithm in the browser (no server needed).
3. Shows: verdict, stack trace visualization, error highlighting, matched pairs, statistics, and an auto-fix suggestion.
4. Works offline after first load and deploys as a static site anywhere.

---

## 2. Goals & Non-Goals

### 2.1 Goals (MVP — v1.0)
- ✅ Check balance for `()`, `[]`, `{}`, `<>` and quotes `""`, `''`, ```` `` ````.
- ✅ Visualize the stack step-by-step (push/pop animation).
- ✅ Highlight the exact character where the error occurs.
- ✅ Suggest a corrected string (auto-fix).
- ✅ Provide preset examples (balanced, unbalanced, nested, code snippet).
- ✅ Show statistics: total brackets, matched pairs, max depth, unmatched count.
- ✅ Fully responsive, mobile-friendly, dark modern UI.
- ✅ Deployable as a static site (GitHub Pages / Netlify / Vercel) with zero build step.

### 2.2 Non-Goals (Out of Scope for MVP)
- ❌ User accounts / login / database.
- ❌ Server-side API or persistence (history is local-only via `localStorage`).
- ❌ Syntax parsing for a specific language (e.g., Python vs C++ grammar).
- ❌ Real-time collaborative editing.
- ❌ Mobile native apps.

### 2.3 Future Scope (v1.1+)
- File upload (`.py`, `.js`, `.c`, `.java`) with drag-and-drop.
- "Ignore brackets in strings/comments" toggle (language-aware).
- Export report as PDF / shareable link with encoded input.
- Dark/Light theme toggle.
- Multi-language UI (Hindi + English).

---

## 3. Target Users

| Persona | Need |
|---|---|
| **Students (DSA learners)** | Understand how the Stack algorithm works, step-by-step. |
| **Developers** | Quickly validate a code snippet before committing. |
| **Interview candidates** | Practice & verify bracket problems with examples. |
| **Teachers** | Demonstrate stack operations live in class. |
| **Math / expression users** | Check `((a+b)*(c-d))` style expressions. |

---

## 4. Functional Requirements

### 4.1 Core Analysis (FR-1 … FR-8)

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | User can type/paste any text into the input area and click **Analyze**. | P0 |
| FR-2 | System checks balance using a Stack: push opening, pop on matching closing. | P0 |
| FR-3 | System displays verdict: **✅ Balanced** or **❌ Not Balanced** with reason. | P0 |
| FR-4 | System highlights the first error position in the input (red underline + marker). | P0 |
| FR-5 | System lists unmatched opening brackets and unmatched closing brackets separately. | P0 |
| FR-6 | System shows matched pairs (e.g., `(` at 2 ↔ `)` at 9). | P1 |
| FR-7 | System suggests an **auto-fixed** string (append missing closers / remove extra closers). | P1 |
| FR-8 | System shows statistics: total brackets, matched, unmatched, max nesting depth, time complexity. | P1 |

### 4.2 Visualization (FR-9 … FR-11)

| ID | Requirement | Priority |
|---|---|---|
| FR-9 | Step-by-step stack trace: each character → action (Push/Pop/Ignore/Error) + stack snapshot. | P0 |
| FR-10 | User can step forward/backward through the trace (Prev / Next / Play). | P1 |
| FR-11 | Stack is rendered visually as stacked boxes. | P1 |

### 4.3 UX Features (FR-12 … FR-16)

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | Preset examples: Balanced, Unbalanced, Nested, Code Snippet, Empty. | P0 |
| FR-13 | Copy result / Copy fixed string buttons. | P1 |
| FR-14 | Clear input button. | P0 |
| FR-15 | Recent history (last 5 analyses) stored in `localStorage`. | P2 |
| FR-16 | Keyboard shortcut: `Ctrl/Cmd + Enter` to analyze. | P2 |

### 4.4 Options (FR-17 … FR-19)

| ID | Requirement | Priority |
|---|---|---|
| FR-17 | Toggle: include angle brackets `<>`. | P1 |
| FR-18 | Toggle: include quotes `"" '' `` `. | P1 |
| FR-19 | Toggle: ignore brackets inside strings/comments (basic). | P2 |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Analyze 10,000 chars in < 50 ms. No blocking UI. |
| **Availability** | Static hosting; 99.9% uptime via CDN (GitHub Pages/Netlify). |
| **Security** | 100% client-side; no data leaves the browser. No cookies, no tracking. |
| **Accessibility** | WCAG 2.1 AA: keyboard navigable, ARIA labels, sufficient contrast, focus visible. |
| **Compatibility** | Chrome, Firefox, Safari, Edge (latest 2 versions). Mobile responsive. |
| **Maintainability** | Single core algorithm (`analyzer.js` + `analyzer.py` mirror) with unit tests. |
| **SEO** | Semantic HTML, meta tags, Open Graph. |

---

## 6. User Stories

1. **As a student**, I paste `{(})` and see *why* it fails at position 3, so I understand nesting rules.
2. **As a developer**, I paste a JS snippet and get an auto-fixed version I can copy.
3. **As a teacher**, I click Play and watch the stack grow/shrink step-by-step in class.
4. **As a mobile user**, I open the site on my phone and it works without zooming/scrolling horizontally.

---

## 7. Algorithm Specification

### 7.1 Approach — Stack
```
pairs = { ')':'(', ']':'[', '}':'{', '>':'<', '"':'"', "'":"'", '`':'`' }
stack = []
for i, ch in enumerate(input):
    if ch is opening: push (ch, i)
    elif ch is closing:
        if stack empty → ERROR: unmatched closing at i
        elif top matches ch → pop, record pair
        else → ERROR: mismatch (expected X, found Y) at i
    else: ignore
end: if stack not empty → ERROR: unmatched openings remain
else → BALANCED
```

### 7.2 Complexity
- **Time:** O(n) — single pass.
- **Space:** O(n) worst case (all openings).

### 7.3 Edge Cases
| Case | Expected |
|---|---|
| Empty string | Balanced (vacuously) |
| Only text, no brackets | Balanced |
| `((()))` | Balanced, depth 3 |
| `(()` | Not balanced — 1 unmatched `(` |
| `())` | Not balanced — unmatched `)` at index 2 |
| `{(})` | Not balanced — mismatch at index 2 |
| `"hello"` | Balanced (quote pair) |
| `"hello` | Not balanced — unclosed quote |

---

## 8. UI / UX Specification

### 8.1 Layout (Single Page)
```
┌─────────────────────────────────────────────┐
│ Header: Logo + Title + GitHub link          │
├─────────────────────────────────────────────┤
│ Hero: Title, subtitle, verdict badge        │
│ ┌─ Input Card ────────────────────────────┐ │
│ │ Textarea (mono font, line numbers)      │ │
│ │ [Examples ▾] [Clear] [Analyze ▶]        │ │
│ │ Toggles: <>  Quotes  Strings            │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Result Card ───────────────────────────┐ │
│ │ ✅ BALANCED / ❌ NOT BALANCED + reason  │ │
│ │ Stats grid: Total | Matched | Depth ... │ │
│ │ Error highlight + Unmatched lists       │ │
│ │ Matched pairs chips                     │ │
│ │ Auto-fixed output + [Copy]              │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Visualization Card ────────────────────┐ │
│ │ Step controls: ⏮ ◀ ▶ ⏭ Play             │ │
│ │ Stack visual (boxes) + step table       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ How it works / Complexity ─────────────┐ │
│ Footer: Made with Stack • MIT License     │
└─────────────────────────────────────────────┘
```

### 8.2 Design System
- **Theme:** Dark slate (`#0f172a` bg) + indigo accent (`#6366f1`), emerald for success, rose for error.
- **Typography:** Inter / system sans for UI; JetBrains Mono / ui-monospace for code.
- **Components:** Cards with subtle borders + shadows, pill badges, chip lists.
- **Motion:** Smooth stack push/pop transitions, verdict badge pop-in.

### 8.3 States
- **Idle:** Placeholder text, neutral badge.
- **Balanced:** Emerald banner, confetti-free subtle glow.
- **Not Balanced:** Rose banner, error position highlighted in textarea overlay.

---

## 9. Technical Architecture

### 9.1 Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JS (no build) | Zero-deploy friction, works everywhere |
| Core Logic | `analyzer.js` (browser) + `analyzer.py` (Python mirror) | Testable, reusable, language-agnostic spec |
| Hosting | GitHub Pages / Netlify / Vercel (static) | Free, CDN, HTTPS |
| Tests | `test_analyzer.py` (pytest) + manual browser QA | CI-ready |

### 9.2 File Structure
```
CDproject/
├── PRD.md                  ← this document
├── README.md
├── index.html              ← entry point
├── styles.css
├── analyzer.js             ← core algorithm + UI wiring
├── analyzer.py             ← Python implementation (same spec)
├── test_analyzer.py        ← pytest suite
└── .github/workflows/      ← (optional) CI
```

### 9.3 Data Flow
```
User input → analyzer.js analyze() → { balanced, pairs, errors,
  unmatched, fixed, stats, trace[] } → render result + stack viz
  → localStorage history (last 5)
```
No network calls. No backend. Fully offline-capable after load.

### 9.4 API (Internal, JS)
```js
analyze(input: string, options: {angle:boolean, quotes:boolean})
  → {
      balanced: boolean,
      reason: string,
      errorIndex: number|null,
      unmatchedOpen: [{char,index}],
      unmatchedClose: [{char,index}],
      pairs: [{open,openIndex,close,closeIndex}],
      fixed: string,
      stats: {total, matched, maxDepth, timeMs},
      trace: [{index,char,action,stackAfter,note}]
    }
```

---

## 10. Testing Strategy

| Type | Tool | Coverage |
|---|---|---|
| Unit (Python) | `pytest test_analyzer.py` | 15+ cases: balanced, nested, mismatch, empty, quotes, angle |
| Manual QA | Browser checklist | Examples, toggles, copy, mobile viewport, keyboard |
| Performance | Manual (10k chars) | < 50 ms |

**Test Cases (minimum):**
`""`, `"hello"`, `"()"`, `"([])"`, `"{[()]}"`, `"((()))"`, `"(()"`, `"())"`, `"{(})"`, `"([)]"`, `"<>"`, `"<>"` with angle off, `'"hi"'`, `'"hi'`, `"a(b[c]d)e"`, `"}{"`.

---

## 11. Deployment Plan

### Option A — GitHub Pages (Interactive, configured in-repo)
1. Merge to `main` (the workflow at `.github/workflows/pages.yml` deploys automatically).
2. Repo → Settings → Pages → Source: **GitHub Actions** (one-time).
3. Live at `https://mayank17op.github.io/CDproject/`.

### Option B — Netlify (Drag & Drop)
1. Drag the repo folder onto Netlify Drop.
2. Live instantly with HTTPS + custom domain option.

### Option C — Vercel
```bash
npx vercel --prod   # zero config, static detected automatically
```

### Option D — Local Preview
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

## 12. Success Metrics (KPIs)

| Metric | Target (30 days post-launch) |
|---|---|
| Unique visitors | 500+ |
| Avg. analyses per session | ≥ 3 |
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 |
| GitHub stars | 10+ |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Angle brackets `<>` false positives in code (`a < b`) | Toggle OFF by default; user enables only when needed. |
| Quotes inside words (`don't`) | Toggle OFF by default; documented in UI. |
| No backend → no analytics | Use privacy-friendly, cookieless counters if needed later. |

---

## 14. Milestones

| Milestone | Deliverable | Effort |
|---|---|---|
| M1 — MVP | This PRD + working static site + Python mirror + tests | ✅ This delivery |
| M2 — Polish | File upload, string/comment-aware mode, theme toggle | 1–2 days |
| M3 — Launch | GitHub Pages deploy, README screenshots, social post | 0.5 day |

---

## 15. Acceptance Criteria (Definition of Done)

- [ ] All P0 functional requirements pass manual QA.
- [ ] `pytest` suite passes (15+ cases).
- [ ] Site loads with no console errors on desktop + mobile.
- [ ] Deployed URL is live and shareable.
- [ ] README explains how to run locally and deploy.

---

*End of PRD v1.0 — Balanced Parentheses & Brackets Analyzer*
