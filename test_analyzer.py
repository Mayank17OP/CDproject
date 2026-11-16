"""Unit tests for analyzer.py — run with: pytest -v  (or: python test_analyzer.py)"""

from analyzer import analyze


def test_empty_is_balanced():
    r = analyze("")
    assert r["balanced"] is True
    assert r["stats"]["total"] == 0


def test_plain_text_is_balanced():
    assert analyze("hello world")["balanced"] is True


def test_simple_pair():
    r = analyze("()")
    assert r["balanced"] is True
    assert len(r["pairs"]) == 1


def test_nested():
    assert analyze("([])").__getitem__("balanced") is True
    assert analyze("{[()]}")["balanced"] is True
    assert analyze("((()))")["balanced"] is True


def test_expression():
    assert analyze("a(b[c]d)e")["balanced"] is True


def test_unclosed_opening():
    r = analyze("(()")
    assert r["balanced"] is False
    assert len(r["unmatched_open"]) == 1
    assert r["unmatched_open"][0]["char"] == "("


def test_extra_closing():
    r = analyze("())")
    assert r["balanced"] is False
    assert len(r["unmatched_close"]) == 1
    assert r["error_index"] == 2


def test_mismatch():
    r = analyze("{(})")
    assert r["balanced"] is False
    assert r["error_index"] == 2


def test_crossed_brackets():
    assert analyze("([)]")["balanced"] is False


def test_reversed():
    assert analyze("}{")["balanced"] is False


def test_max_depth():
    r = analyze("((()))")
    assert r["stats"]["max_depth"] == 3


def test_fixed_appends_closers():
    r = analyze("(()")
    assert r["fixed"] == "(())"


def test_fixed_removes_stray_closer():
    r = analyze("())")
    assert r["fixed"] == "()"


def test_angle_brackets_off_by_default():
    # '<' '>' ignored unless enabled
    assert analyze("a < b > c")["balanced"] is True
    r = analyze("<>", use_angle=True)
    assert r["balanced"] is True


def test_angle_unbalanced_when_enabled():
    assert analyze("<", use_angle=True)["balanced"] is False


def test_quotes():
    assert analyze('"hi"', use_quotes=True)["balanced"] is True
    assert analyze('"hi', use_quotes=True)["balanced"] is False
    assert analyze("'a' \"b\"", use_quotes=True)["balanced"] is True


def test_trace_length_matches_input():
    s = "a(b)"
    r = analyze(s)
    assert len(r["trace"]) == len(s)


if __name__ == "__main__":
    # Minimal runner so `python test_analyzer.py` works without pytest.
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS {t.__name__}")
    print(f"\n{len(tests)} tests passed ✅")
