#!/usr/bin/env python3
"""Generate wordmark variants and transparent 4× PNGs from the approved SVG."""

import base64
import functools
import http.server
import json
import pathlib
import subprocess
import tempfile
import threading
import time
import urllib.parse
import urllib.request

import websocket
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/branding/program-wordmark.svg"
OUTPUT = ROOT / "downloads/branding"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
NAVY = "#051e39"
WHITE = "#ffffff"
GOLD = "#b39051"


def variant(source, *, reversed_colors=False, gold_stars=False, background=None):
    svg = source
    if reversed_colors:
        svg = svg.replace(NAVY, WHITE)
    if gold_stars:
        original = f'<g fill="{WHITE}"><use href="#mark-star"'
        assert original in svg
        svg = svg.replace(original, f'<g fill="{GOLD}"><use href="#mark-star"', 1)
    if background:
        first_line, rest = svg.split("\n", 1)
        svg = first_line + f'\n  <rect width="390" height="56" fill="{background}"/>\n' + rest
    return svg


class Browser:
    def __init__(self, width=1560, height=224):
        self.width = width
        self.height = height

    def __enter__(self):
        self.profile = tempfile.TemporaryDirectory(prefix="euga-brand-export-")
        self.process = subprocess.Popen([
            CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
            "--remote-debugging-port=0", "--remote-allow-origins=*",
            f"--user-data-dir={self.profile.name}", "about:blank",
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        port_file = pathlib.Path(self.profile.name) / "DevToolsActivePort"
        for _ in range(100):
            if port_file.exists():
                break
            time.sleep(.1)
        else:
            raise RuntimeError("Chrome did not open its debugging port")
        port = port_file.read_text().splitlines()[0]
        target = next(item for item in json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json")) if item["type"] == "page")
        self.ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=60, origin="http://localhost")
        self.next_id = 0
        self.call("Page.enable")
        self.call("Emulation.setDeviceMetricsOverride", {"width": self.width, "height": self.height, "deviceScaleFactor": 1, "mobile": False})
        self.call("Emulation.setDefaultBackgroundColorOverride", {"color": {"r": 0, "g": 0, "b": 0, "a": 0}})
        return self

    def __exit__(self, *args):
        self.ws.close()
        self.process.terminate()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
        self.profile.cleanup()

    def call(self, method, params=None):
        self.next_id += 1
        request_id = self.next_id
        self.ws.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
        while True:
            result = json.loads(self.ws.recv())
            if result.get("id") == request_id:
                if "error" in result:
                    raise RuntimeError(result["error"])
                return result.get("result", {})

    def png(self, image_url):
        render_url = image_url.split('/downloads/')[0].split('/assets/')[0] + "/scripts/branding-render.html?src=" + urllib.parse.quote(image_url, safe='')
        self.call("Page.navigate", {"url": render_url})
        check = self.call("Runtime.evaluate", {"expression": "new Promise((resolve,reject)=>{const check=()=>{const image=document.querySelector('#wordmark');if(!image||!image.src){setTimeout(check,30);return}image.decode().then(()=>resolve(image.naturalWidth),reject)};check()})", "awaitPromise": True, "returnByValue": True})
        if not check.get("result", {}).get("value"):
            raise RuntimeError(f"SVG image did not load: {image_url}")
        result = self.call("Page.captureScreenshot", {"format": "png", "fromSurface": True, "captureBeyondViewport": False, "omitBackground": True})
        return base64.b64decode(result["data"])


def main():
    source = SOURCE.read_text()
    assert 'rotate(8.5 93 30.5)' in source and 'stroke-dasharray="34.8717 116.2389"' in source
    OUTPUT.mkdir(parents=True, exist_ok=True)
    versions = {
        "standard": source,
        "white-background": variant(source, background=WHITE),
        "blue-background": variant(source, reversed_colors=True, gold_stars=True, background=NAVY),
        "reversed": variant(source, reversed_colors=True, gold_stars=True),
        "all-white": variant(source, reversed_colors=True),
    }
    for name, svg in versions.items():
        if name != "standard":
            (OUTPUT / f"program-wordmark-{name}.svg").write_text(svg)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with Browser() as browser:
            for name in versions:
                path = "assets/branding/program-wordmark.svg" if name == "standard" else f"downloads/branding/program-wordmark-{name}.svg"
                dest = ROOT / "downloads/program-wordmark.png" if name == "standard" else OUTPUT / f"program-wordmark-{name}.png"
                dest.write_bytes(browser.png(f"http://127.0.0.1:{server.server_port}/{path}"))
                with Image.open(dest) as image:
                    assert image.size == (1560, 224), (dest, image.size)
                    print(f"{dest.relative_to(ROOT)}: {image.mode}, {image.size}")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
