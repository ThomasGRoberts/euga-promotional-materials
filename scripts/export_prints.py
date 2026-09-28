#!/usr/bin/env python3
"""Regenerate the current flyer and office-door PDFs from their live pages."""

import functools
import http.server
import pathlib
import re
import subprocess
import tempfile
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
JOBS = [
    ("flyer.html", "downloads/print-flyer-current.pdf", (612, 792), 9000),
    ("office-door.html", "downloads/office-door-half-page.pdf", (396, 612), 4000),
    ("office-door-two-up.html", "downloads/office-door-two-up.pdf", (792, 612), 5000),
]


def export(server, page, dest, size, budget):
    with tempfile.TemporaryDirectory(prefix="euga-pdf-") as profile:
        command = [
            CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
            f"--user-data-dir={profile}", f"--virtual-time-budget={budget}",
            "--run-all-compositor-stages-before-draw", "--no-pdf-header-footer",
            f"--print-to-pdf={dest}", f"http://127.0.0.1:{server.server_port}/{page}?export=approved-wordmark",
        ]
        started = time.time()
        try:
            done = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=18)
            if done.returncode not in (0, 21):
                raise RuntimeError(f"Chrome failed to export {page}: {done.returncode}")
        except subprocess.TimeoutExpired:
            if not dest.exists() or dest.stat().st_mtime < started:
                raise
    pdf = dest.read_bytes()
    pages = len(re.findall(rb"/Type\s*/Page(?!s)\b", pdf))
    if pages != 1:
        raise RuntimeError(f"Expected one page in {dest}, got {pages}")
    if not any(abs(float(w)-size[0])<1 and abs(float(h)-size[1])<1 for w,h in re.findall(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]",pdf)):
        raise RuntimeError(f"Unexpected page size in {dest}")
    print(f"{dest.relative_to(ROOT)}: one {size[0]} × {size[1]} pt page, {len(pdf)} bytes")


def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        for page, relative_dest, size, budget in JOBS:
            export(server, page, ROOT / relative_dest, size, budget)
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
