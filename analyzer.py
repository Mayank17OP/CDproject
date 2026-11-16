"""
Balanced Parentheses & Brackets Analyzer — Python core.

Mirrors analyzer.js exactly (same spec, see PRD.md §7).
Pure stdlib, no dependencies. Reusable as a library:

    from analyzer import analyze
    result = analyze("{(})")
    print(result["balanced"], result["reason"])
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

# Opening -> closing
PAIRS = {"(": ")", "[": "]", "{": "}", "<": ">"}
# Closing -> opening
REVERSE = {v: k for k, v in PAIRS.items()}
QUOTES = {'"', "'", "`"}


def analyze(
    text: str,
    use_angle: bool = False,
    use_quotes: bool = False,
) -> Dict[str, Any]:
    """Analyze bracket balance in *text* using a stack.

    Args:
        text: Input string (expression / code / any text).
        use_angle: Include ``<>`` as a bracket pair.
        use_quotes: Include ``""``, ``''``, ```` `` ```` as pairs.

    Returns:
        Dict with keys: balanced, reason, error_index, unmatched_open,
        unmatched_close, pairs, fixed, stats, trace.
    """
    start = time.perf_counter()

    opening = dict(PAIRS)
    if not use_angle:
        opening.pop("<", None)
    closing = {v: k for k, v in opening.items()}

    stack: List[Dict[str, Any]] = []  # [{char, index}]
    pairs: List[Dict[str, Any]] = []
    unmatched_close: List[Dict[str, Any]] = []
    trace: List[Dict[str, Any]] = []
    error_index: Optional[int] = None
    reason = ""
    max_depth = 0
    total = 0

    def snapshot() -> List[str]:
        return [item["char"] for item in stack]

    for i, ch in enumerate(text):
        # --- quotes (open == close) ---
        if use_quotes and ch in QUOTES:
            total += 1
            if stack and stack[-1]["char"] == ch:
                top = stack.pop()
                pairs.append(
                    {"open": ch, "open_index": top["index"],
                     "close": ch, "close_index": i}
                )
                trace.append({
                    "index": i, "char": ch, "action": "pop",
                    "stack_after": snapshot(),
                    "note": f"Matched quote {ch!r} with index {top['index']}",
                })
            else:
                stack.append({"char": ch, "index": i})
                max_depth = max(max_depth, len(stack))
                trace.append({
                    "index": i, "char": ch, "action": "push",
                    "stack_after": snapshot(),
                    "note": f"Pushed quote {ch!r}",
                })
            continue

        # --- opening bracket ---
        if ch in opening:
            total += 1
            stack.append({"char": ch, "index": i})
            max_depth = max(max_depth, len(stack))
            trace.append({
                "index": i, "char": ch, "action": "push",
                "stack_after": snapshot(),
                "note": f"Pushed {ch!r} (expects {opening[ch]!r})",
            })
            continue

        # --- closing bracket ---
        if ch in closing:
            total += 1
            if not stack:
                unmatched_close.append({"char": ch, "index": i})
                if error_index is None:
                    error_index = i
                    reason = f"Unmatched closing bracket {ch!r} at position {i}"
                trace.append({
                    "index": i, "char": ch, "action": "error",
                    "stack_after": snapshot(),
                    "note": f"Error: no opening bracket for {ch!r}",
                })
            elif stack[-1]["char"] == closing[ch]:
                top = stack.pop()
                pairs.append(
                    {"open": top["char"], "open_index": top["index"],
                     "close": ch, "close_index": i}
                )
                trace.append({
                    "index": i, "char": ch, "action": "pop",
                    "stack_after": snapshot(),
                    "note": f"Matched {top['char']!r} (index {top['index']}) with {ch!r}",
                })
            else:
                expected = opening.get(stack[-1]["char"], "?")
                if error_index is None:
                    error_index = i
                    reason = (
                        f"Mismatched bracket at position {i}: "
                        f"expected {expected!r} but found {ch!r}"
                    )
                trace.append({
                    "index": i, "char": ch, "action": "error",
                    "stack_after": snapshot(),
                    "note": f"Error: expected {expected!r}, found {ch!r}",
                })
            continue

        # --- ordinary character ---
        trace.append({
            "index": i, "char": ch, "action": "ignore",
            "stack_after": snapshot(), "note": "Ignored (not a bracket)",
        })

    unmatched_open = [{"char": it["char"], "index": it["index"]} for it in stack]

    if error_index is None and stack:
        error_index = stack[0]["index"]
        reason = (
            f"Unclosed opening bracket(s): "
            + ", ".join(f"{it['char']!r} at {it['index']}" for it in stack)
        )

    balanced = error_index is None and not stack and not unmatched_close
    if balanced:
        reason = "All brackets are correctly balanced and nested."

    # --- auto-fix: drop unmatched closers, append missing closers ---
    # Rebuild by replaying with a fresh stack, skipping bad closers.
    fixed_chars: List[str] = []
    fix_stack: List[str] = []
    for ch in text:
        if use_quotes and ch in QUOTES:
            fixed_chars.append(ch)
            if fix_stack and fix_stack[-1] == ch:
                fix_stack.pop()
            else:
                fix_stack.append(ch)
        elif ch in opening:
            fixed_chars.append(ch)
            fix_stack.append(ch)
        elif ch in closing:
            if fix_stack and fix_stack[-1] == closing[ch]:
                fixed_chars.append(ch)
                fix_stack.pop()
            # else: skip stray/mismatched closer
        else:
            fixed_chars.append(ch)
    # Append closers in reverse stack order
    for open_ch in reversed(fix_stack):
        if open_ch in QUOTES:
            fixed_chars.append(open_ch)
        else:
            fixed_chars.append(opening[open_ch])
    fixed = "".join(fixed_chars)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 3)

    return {
        "balanced": balanced,
        "reason": reason,
        "error_index": error_index,
        "unmatched_open": unmatched_open,
        "unmatched_close": unmatched_close,
        "pairs": pairs,
        "fixed": fixed,
        "stats": {
            "total": total,
            "matched": len(pairs),
            "unmatched": len(unmatched_open) + len(unmatched_close),
            "max_depth": max_depth,
            "time_ms": elapsed_ms,
        },
        "trace": trace,
    }


if __name__ == "__main__":
    import sys

    sample = sys.argv[1] if len(sys.argv) > 1 else "{[()]}"
    r = analyze(sample)
    print(f"Input:    {sample!r}")
    print(f"Balanced: {r['balanced']}")
    print(f"Reason:   {r['reason']}")
    print(f"Fixed:    {r['fixed']!r}")
    print(f"Stats:    {r['stats']}")
