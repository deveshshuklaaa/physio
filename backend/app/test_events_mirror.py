"""Checks backend/app/events.py and frontend/src/lib/events.js declare the
same event set. No framework — run directly: `python test_events_mirror.py`.
"""
import re
from pathlib import Path

import events

JS_PATH = Path(__file__).resolve().parents[2] / "frontend" / "src" / "lib" / "events.js"


def parse_js_events(path: Path) -> set[str]:
    text = path.read_text()
    return set(re.findall(r'"([a-z_]+)"', text))


def test_mirror():
    js_events = parse_js_events(JS_PATH)
    py_events = events.ALL_EVENTS
    assert js_events == py_events, (
        f"mirror mismatch. py-only: {py_events - js_events}, "
        f"js-only: {js_events - py_events}"
    )
    print(f"OK: events.py and events.js agree on {len(py_events)} events")


if __name__ == "__main__":
    test_mirror()
