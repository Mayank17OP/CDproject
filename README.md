# Balanced Parentheses & Brackets Analyzer

A free, in-browser tool that checks whether `()`, `[]`, `{}`, `<>` and quotes are correctly balanced — with **step-by-step stack visualization**, **error highlighting**, and **auto-fix**.

> Paste anything. Know instantly if your brackets are balanced — and exactly where they break.

📄 Full product spec: **[PRD.md](./PRD.md)**

---

## ✨ Features

- ✅ Balanced / Not Balanced verdict with a plain-English reason
- 📍 Exact error position highlighted in your input
- 🥞 Live **stack visualizer** — step forward/back, play/pause, click any trace row
- 🔗 Matched-pair list (`(` @2 ↔ `)` @9) + unmatched brackets
- 🛠️ **Auto-fixed** version with one-click copy
- 📊 Stats: total brackets, matched pairs, max nesting depth, time, complexity
- 🎛️ Toggles for angle brackets `<>` and quotes `"" '' `` `
- 📚 Preset examples + recent history (stored locally, last 5)
- 📱 Fully responsive, dark modern UI, keyboard shortcut `Ctrl/⌘ + Enter`
- 🔒 100% client-side — no data ever leaves your browser

## 🚀 Run locally

No build step, no dependencies:

```bash
# Option 1 — Python (recommended)
python3 -m http.server 8000
# open http://localhost:8000

# Option 2 — Node
npx serve .
```

## 🌐 Deploy (free, 2 minutes)

This is a **pure static site** — no build step, no framework, no environment variables. Any static host works.

### Vercel (recommended)

**A. Dashboard — import from GitHub (no CLI needed)**
1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick `Mayank17OP/CDproject`.
2. Framework Preset: **Other**. Root Directory: `./`. Build Command: *leave empty*. Output Directory: *leave empty*.
3. **Deploy**. Your site is live at `https://cdproject.vercel.app` (or a generated name).
4. Pushing to `main` redeploys automatically — every branch gets its own preview URL.

**B. CLI**

```bash
npm i -g vercel        # or use: npx vercel
vercel login           # one-time browser auth
vercel --prod          # deploy to production, prints the live URL
```

Vercel auto-detects the static project thanks to [`vercel.json`](./vercel.json) (clean URLs + security/caching headers) and [`.vercelignore`](./.vercelignore) (keeps Python files and `.git` out of the upload). No `package.json` required.

### Other hosts

| Platform | Steps |
|---|---|
| **GitHub Pages** | Push to `main` → Settings → Pages → Source: `main` / root → live at `https://mayank17op.github.io/CDproject/` |
| **Netlify** | Drag this folder onto [Netlify Drop](https://app.netlify.com/drop) |

## 🧪 Tests

```bash
python3 test_analyzer.py   # no pytest needed
# or
pytest -v                  # if pytest is installed
```

The Python core (`analyzer.py`) mirrors the JavaScript core (`analyzer.js`) exactly — same algorithm, same spec (PRD §7).

## 📁 Project structure

```
CDproject/
├── PRD.md            ← Product Requirements Document
├── README.md         ← this file
├── index.html        ← web app entry point
├── styles.css        ← dark modern UI
├── analyzer.js       ← core algorithm + UI wiring (browser)
├── analyzer.py       ← Python implementation of the same algorithm
└── test_analyzer.py  ← 17 unit tests
```

## 🧠 How it works

Single-pass **Stack** algorithm — **O(n)** time, **O(n)** space:

1. Opening bracket → push onto stack
2. Closing bracket → pop if the top matches, else error
3. Balanced ⟺ stack is empty at the end

## 📜 License

MIT — see [LICENSE](./LICENSE).
