#!/usr/bin/env python3
"""
Static file server WITH HTTP Range support.

`python -m http.server` does NOT honor `Range:` requests, so browsers refuse to
seek <video> elements served from it (the teaser scrubber resets to 0). GitHub
Pages supports Range, so this only matters for local preview. Run from the repo
root so URLs resolve as on the live site:

    python3 serve.py            # serves ./ on http://localhost:8000/
    python3 serve.py 8001       # custom port
"""
import http.server, os, re, sys


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if rng and os.path.isfile(path):
            size = os.path.getsize(path)
            m = re.match(r"bytes=(\d+)-(\d*)", rng.strip())
            if m:
                start = int(m.group(1))
                end = int(m.group(2)) if m.group(2) else size - 1
                end = min(end, size - 1)
                if start <= end:
                    length = end - start + 1
                    self.send_response(206)
                    self.send_header("Content-Type", self.guess_type(path))
                    self.send_header("Accept-Ranges", "bytes")
                    self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                    self.send_header("Content-Length", str(length))
                    self.end_headers()
                    with open(path, "rb") as f:
                        f.seek(start)
                        self.wfile.write(f.read(length))
                    return
        super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    srv = http.server.ThreadingHTTPServer(("", port), RangeHandler)
    print(f"Serving (with Range support) http://localhost:{port}/")
    srv.serve_forever()
