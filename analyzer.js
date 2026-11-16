/* Balanced Parentheses & Brackets Analyzer — core logic + UI wiring.
   Mirrors analyzer.py (same spec, see PRD.md §7). No dependencies. */

(function () {
  "use strict";

  var PAIRS = { "(": ")", "[": "]", "{": "}", "<": ">" };
  var QUOTES = ['"', "'", "`"];

  function reversePairs(pairs) {
    var rev = {};
    for (var k in pairs) rev[pairs[k]] = k;
    return rev;
  }

  /**
   * Analyze bracket balance.
   * @param {string} text
   * @param {{angle?:boolean, quotes?:boolean}} [options]
   * @returns {{balanced,reason,errorIndex,unmatchedOpen,unmatchedClose,pairs,fixed,stats,trace}}
   */
  function analyze(text, options) {
    options = options || {};
    var useAngle = !!options.angle;
    var useQuotes = !!options.quotes;
    var t0 = performance.now();

    var opening = {};
    for (var k in PAIRS) opening[k] = PAIRS[k];
    if (!useAngle) delete opening["<"];
    var closing = reversePairs(opening);

    var stack = []; // [{char, index}]
    var pairs = [];
    var unmatchedClose = [];
    var trace = [];
    var errorIndex = null;
    var reason = "";
    var maxDepth = 0;
    var total = 0;

    function snapshot() {
      return stack.map(function (it) { return it.char; });
    }

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];

      if (useQuotes && QUOTES.indexOf(ch) !== -1) {
        total++;
        if (stack.length && stack[stack.length - 1].char === ch) {
          var top = stack.pop();
          pairs.push({ open: ch, openIndex: top.index, close: ch, closeIndex: i });
          trace.push({ index: i, char: ch, action: "pop", stackAfter: snapshot(),
            note: "Matched quote " + ch + " with index " + top.index });
        } else {
          stack.push({ char: ch, index: i });
          maxDepth = Math.max(maxDepth, stack.length);
          trace.push({ index: i, char: ch, action: "push", stackAfter: snapshot(),
            note: "Pushed quote " + ch });
        }
        continue;
      }

      if (ch in opening) {
        total++;
        stack.push({ char: ch, index: i });
        maxDepth = Math.max(maxDepth, stack.length);
        trace.push({ index: i, char: ch, action: "push", stackAfter: snapshot(),
          note: "Pushed " + ch + " (expects " + opening[ch] + ")" });
        continue;
      }

      if (ch in closing) {
        total++;
        if (!stack.length) {
          unmatchedClose.push({ char: ch, index: i });
          if (errorIndex === null) {
            errorIndex = i;
            reason = "Unmatched closing bracket '" + ch + "' at position " + i;
          }
          trace.push({ index: i, char: ch, action: "error", stackAfter: snapshot(),
            note: "Error: no opening bracket for '" + ch + "'" });
        } else if (stack[stack.length - 1].char === closing[ch]) {
          var t = stack.pop();
          pairs.push({ open: t.char, openIndex: t.index, close: ch, closeIndex: i });
          trace.push({ index: i, char: ch, action: "pop", stackAfter: snapshot(),
            note: "Matched '" + t.char + "' (index " + t.index + ") with '" + ch + "'" });
        } else {
          var expected = opening[stack[stack.length - 1].char] || "?";
          if (errorIndex === null) {
            errorIndex = i;
            reason = "Mismatched bracket at position " + i +
              ": expected '" + expected + "' but found '" + ch + "'";
          }
          trace.push({ index: i, char: ch, action: "error", stackAfter: snapshot(),
            note: "Error: expected '" + expected + "', found '" + ch + "'" });
        }
        continue;
      }

      trace.push({ index: i, char: ch, action: "ignore", stackAfter: snapshot(),
        note: "Ignored (not a bracket)" });
    }

    var unmatchedOpen = stack.map(function (it) { return { char: it.char, index: it.index }; });

    if (errorIndex === null && stack.length) {
      errorIndex = stack[0].index;
      reason = "Unclosed opening bracket(s): " +
        stack.map(function (it) { return "'" + it.char + "' at " + it.index; }).join(", ");
    }

    var balanced = errorIndex === null && !stack.length && !unmatchedClose.length;
    if (balanced) reason = "All brackets are correctly balanced and nested.";

    // Auto-fix: skip bad closers, append missing closers.
    var fixedChars = [];
    var fixStack = [];
    for (var j = 0; j < text.length; j++) {
      var c = text[j];
      if (useQuotes && QUOTES.indexOf(c) !== -1) {
        fixedChars.push(c);
        if (fixStack.length && fixStack[fixStack.length - 1] === c) fixStack.pop();
        else fixStack.push(c);
      } else if (c in opening) {
        fixedChars.push(c);
        fixStack.push(c);
      } else if (c in closing) {
        if (fixStack.length && fixStack[fixStack.length - 1] === closing[c]) {
          fixedChars.push(c);
          fixStack.pop();
        }
      } else {
        fixedChars.push(c);
      }
    }
    for (var s = fixStack.length - 1; s >= 0; s--) {
      var oc = fixStack[s];
      fixedChars.push(QUOTES.indexOf(oc) !== -1 ? oc : opening[oc]);
    }

    return {
      balanced: balanced,
      reason: reason,
      errorIndex: errorIndex,
      unmatchedOpen: unmatchedOpen,
      unmatchedClose: unmatchedClose,
      pairs: pairs,
      fixed: fixedChars.join(""),
      stats: {
        total: total,
        matched: pairs.length,
        unmatched: unmatchedOpen.length + unmatchedClose.length,
        maxDepth: maxDepth,
        timeMs: Math.round((performance.now() - t0) * 1000) / 1000
      },
      trace: trace
    };
  }

  // Expose for tests / console use
  window.BracketAnalyzer = { analyze: analyze };

  /* ---------------- UI wiring ---------------- */

  var EXAMPLES = {
    balanced: "{[()]}",
    unbalanced: "{(})",
    nested: "((a + b) * [c - {d / e}])",
    code: "function check(s) {\n  if (s.length === 0) { return true; }\n  return (s[0] === '(');\n}",
    empty: ""
  };

  var inputEl, analyzeBtn, clearBtn, exampleSel, angleToggle, quotesToggle;
  var verdictEl, reasonEl, statsEl, pairsEl, unmatchedEl, fixedEl, fixedWrap;
  var traceBody, stackViz, stepInfo, stepRange;
  var currentTrace = [], currentStep = 0, playTimer = null, lastResult = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderStack(stackArr) {
    if (!stackArr.length) {
      stackViz.innerHTML = '<span class="stack-empty">Stack is empty</span>';
      return;
    }
    stackViz.innerHTML = stackArr.slice().reverse().map(function (c, idx) {
      return '<span class="stack-box' + (idx === 0 ? " top" : "") + '">' + esc(c) + "</span>";
    }).join("");
  }

  function renderStep(step) {
    if (!currentTrace.length) {
      stepInfo.textContent = "No steps yet — run an analysis first.";
      renderStack([]);
      return;
    }
    step = Math.max(0, Math.min(step, currentTrace.length - 1));
    currentStep = step;
    var t = currentTrace[step];
    stepRange.value = step;
    stepRange.max = currentTrace.length - 1;
    stepInfo.innerHTML =
      "Step <strong>" + (step + 1) + " / " + currentTrace.length + "</strong> — " +
      "char <code>" + esc(t.char === " " ? "␣" : t.char) + "</code> at index " + t.index +
      " → <strong>" + t.action.toUpperCase() + "</strong><br>" + esc(t.note);
    renderStack(t.stackAfter);
    // Highlight trace row
    var rows = traceBody.querySelectorAll("tr");
    rows.forEach(function (r, idx) { r.classList.toggle("active", idx === step); });
    var active = traceBody.querySelector("tr.active");
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function renderTrace(trace) {
    traceBody.innerHTML = trace.map(function (t, idx) {
      var badge = t.action === "push" ? "push" : t.action === "pop" ? "pop" :
        t.action === "error" ? "error" : "ignore";
      return "<tr data-idx=\"" + idx + "\"><td>" + (idx + 1) + "</td><td>" + t.index +
        "</td><td><code>" + esc(t.char === " " ? "␣" : t.char) + "</code></td><td><span class=\"badge " +
        badge + "\">" + t.action + "</span></td><td>" + esc(t.note) + "</td><td>" +
        esc(t.stackAfter.join(" ") || "—") + "</td></tr>";
    }).join("");
    traceBody.querySelectorAll("tr").forEach(function (row) {
      row.addEventListener("click", function () { renderStep(parseInt(row.dataset.idx, 10)); });
    });
  }

  function highlightError(text, errorIndex) {
    // Underline the error char in a preview line under the textarea.
    var preview = $("errorPreview");
    if (errorIndex === null || errorIndex === undefined || errorIndex < 0) {
      preview.style.display = "none";
      return;
    }
    preview.style.display = "block";
    var before = esc(text.slice(0, errorIndex));
    var ch = esc(text[errorIndex] || "");
    var after = esc(text.slice(errorIndex + 1));
    preview.innerHTML = "Error at position <strong>" + errorIndex + "</strong>: <code>" +
      before + "<mark>" + ch + "</mark>" + after + "</code>";
  }

  function runAnalysis() {
    var text = inputEl.value;
    var result = analyze(text, { angle: angleToggle.checked, quotes: quotesToggle.checked });
    lastResult = result;

    // Verdict
    verdictEl.className = "verdict " + (result.balanced ? "ok" : "bad");
    verdictEl.textContent = result.balanced ? "✅ BALANCED" : "❌ NOT BALANCED";
    reasonEl.textContent = result.reason;
    highlightError(text, result.errorIndex);

    // Stats
    var s = result.stats;
    statsEl.innerHTML = [
      ["Total brackets", s.total], ["Matched pairs", s.matched],
      ["Unmatched", s.unmatched], ["Max depth", s.maxDepth],
      ["Time", s.timeMs + " ms"], ["Complexity", "O(n)"]
    ].map(function (kv) {
      return '<div class="stat"><span class="stat-num">' + kv[1] +
        '</span><span class="stat-label">' + kv[0] + "</span></div>";
    }).join("");

    // Pairs
    pairsEl.innerHTML = result.pairs.length
      ? result.pairs.map(function (p) {
          return '<span class="chip">' + esc(p.open) + " @" + p.openIndex +
            " ↔ " + esc(p.close) + " @" + p.closeIndex + "</span>";
        }).join("")
      : '<span class="muted">No matched pairs.</span>';

    // Unmatched
    var parts = [];
    if (result.unmatchedOpen.length)
      parts.push("Unclosed openings: " + result.unmatchedOpen.map(function (u) {
        return "'" + esc(u.char) + "' @" + u.index; }).join(", "));
    if (result.unmatchedClose.length)
      parts.push("Unmatched closings: " + result.unmatchedClose.map(function (u) {
        return "'" + esc(u.char) + "' @" + u.index; }).join(", "));
    unmatchedEl.innerHTML = parts.length ? esc(parts.join("  •  ")) : "None — everything matches.";

    // Fixed
    fixedEl.textContent = result.fixed || "(empty)";
    fixedWrap.style.display = result.balanced ? "none" : "block";

    // Trace + visualization
    currentTrace = result.trace;
    renderTrace(currentTrace);
    renderStep(0);

    saveHistory(text, result.balanced);
    renderHistory();
  }

  function saveHistory(text, balanced) {
    try {
      var h = JSON.parse(localStorage.getItem("bpa_history") || "[]");
      h.unshift({ text: text.slice(0, 120), balanced: balanced, at: Date.now() });
      h = h.slice(0, 5);
      localStorage.setItem("bpa_history", JSON.stringify(h));
    } catch (e) { /* storage unavailable */ }
  }

  function renderHistory() {
    var el = $("historyList");
    var h = [];
    try { h = JSON.parse(localStorage.getItem("bpa_history") || "[]"); } catch (e) {}
    if (!h.length) { el.innerHTML = '<span class="muted">No history yet.</span>'; return; }
    el.innerHTML = h.map(function (item, idx) {
      return '<button class="chip history-chip" data-idx="' + idx + '">' +
        (item.balanced ? "✅ " : "❌ ") + esc(item.text || "(empty)") + "</button>";
    }).join("");
    el.querySelectorAll(".history-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = h[parseInt(btn.dataset.idx, 10)];
        inputEl.value = item.text;
        runAnalysis();
      });
    });
  }

  function copyText(text, btn) {
    function done() {
      var old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  function init() {
    inputEl = $("input"); analyzeBtn = $("analyzeBtn"); clearBtn = $("clearBtn");
    exampleSel = $("exampleSel"); angleToggle = $("angleToggle"); quotesToggle = $("quotesToggle");
    verdictEl = $("verdict"); reasonEl = $("reason"); statsEl = $("stats");
    pairsEl = $("pairs"); unmatchedEl = $("unmatched"); fixedEl = $("fixedText"); fixedWrap = $("fixedWrap");
    traceBody = $("traceBody"); stackViz = $("stackViz"); stepInfo = $("stepInfo"); stepRange = $("stepRange");

    analyzeBtn.addEventListener("click", runAnalysis);
    clearBtn.addEventListener("click", function () {
      inputEl.value = ""; inputEl.focus();
      verdictEl.className = "verdict idle"; verdictEl.textContent = "—";
      reasonEl.textContent = "Paste something and hit Analyze.";
      $("errorPreview").style.display = "none";
      statsEl.innerHTML = ""; pairsEl.innerHTML = ""; unmatchedEl.textContent = "";
      fixedWrap.style.display = "none"; traceBody.innerHTML = "";
      currentTrace = []; renderStep(0);
    });
    exampleSel.addEventListener("change", function () {
      if (EXAMPLES[exampleSel.value] !== undefined) {
        inputEl.value = EXAMPLES[exampleSel.value];
        runAnalysis();
      }
    });
    angleToggle.addEventListener("change", runAnalysis);
    quotesToggle.addEventListener("change", runAnalysis);
    inputEl.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runAnalysis();
    });

    $("copyFixedBtn").addEventListener("click", function () {
      if (lastResult) copyText(lastResult.fixed, this);
    });
    $("copyInputBtn").addEventListener("click", function () { copyText(inputEl.value, this); });

    // Stepper controls
    $("prevStep").addEventListener("click", function () { renderStep(currentStep - 1); });
    $("nextStep").addEventListener("click", function () { renderStep(currentStep + 1); });
    $("firstStep").addEventListener("click", function () { renderStep(0); });
    $("lastStep").addEventListener("click", function () { renderStep(currentTrace.length - 1); });
    stepRange.addEventListener("input", function () { renderStep(parseInt(stepRange.value, 10)); });
    $("playBtn").addEventListener("click", function () {
      if (playTimer) { clearInterval(playTimer); playTimer = null; this.textContent = "▶ Play"; return; }
      this.textContent = "⏸ Pause";
      playTimer = setInterval(function () {
        if (currentStep >= currentTrace.length - 1) {
          clearInterval(playTimer); playTimer = null; $("playBtn").textContent = "▶ Play";
          return;
        }
        renderStep(currentStep + 1);
      }, 600);
    });

    // Default demo
    inputEl.value = "{[()]}";
    runAnalysis();
    renderHistory();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
