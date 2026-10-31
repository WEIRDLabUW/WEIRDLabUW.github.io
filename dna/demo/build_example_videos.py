#!/usr/bin/env python3
"""Write demo/examples-video.js: the example clips as base64 data URLs.

Opened straight from disk (file://), a browser blocks fetching the clips, and a video played from a plain file path
taints the canvas, so re-annotating and exporting fail. The demo decodes these copies into same-origin blob URLs
instead. Over http(s) the file is never loaded. Run this again after changing the examples in index.html.
"""
import base64, json, re
from pathlib import Path

here = Path(__file__).resolve().parent
html = (here / "index.html").read_text()
ids = re.findall(r"clipExample\('([^']+)'", html)
out = {}
for i in ids:
    p = here.parent / "widget" / "data" / "robot_videos" / f"{i}.mp4"
    if not p.exists():
        p = here.parent / "widget" / "data" / "videos" / f"{i}.mp4"
    out[i] = "data:video/mp4;base64," + base64.b64encode(p.read_bytes()).decode()
(here / "examples-video.js").write_text(
    "// Example clips as base64, only loaded when the page is opened from disk (see build_example_videos.py).\n"
    "window.DNA_EXAMPLE_VIDEOS = " + json.dumps(out) + ";\n")
print(f"{len(out)} clips -> examples-video.js ({(here / 'examples-video.js').stat().st_size // 1024} KB)")
