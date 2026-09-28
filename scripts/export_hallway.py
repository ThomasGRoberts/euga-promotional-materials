#!/usr/bin/env python3
"""Export the TV artifact without its browser-only navigation controls."""

import base64
import functools
import http.server
import pathlib
import threading

from PIL import Image
from export_branding import Browser

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'downloads/hallway-tv-1920x1080.png'


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with Browser(1920, 1080) as browser:
            browser.call('Page.navigate', {'url': f'http://127.0.0.1:{server.server_port}/hallway.html'})
            result = browser.call('Runtime.evaluate', {'expression': "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{const logo=document.querySelector('.tv-wordmark img');if(window.__EUGA_HALLWAY_READY__&&logo?.complete&&logo.naturalWidth>0)resolve(true);else if(Date.now()-started>15000)reject(Error('hallway art did not load'));else setTimeout(poll,50)};poll()})", 'awaitPromise': True})
            if 'exceptionDetails' in result:
                raise RuntimeError(result['exceptionDetails'])
            browser.call('Runtime.evaluate', {'expression': "document.querySelectorAll('.material-back,.hallway-download').forEach(node=>node.style.display='none')"})
            raw = browser.call('Page.captureScreenshot', {'format': 'png', 'fromSurface': True, 'captureBeyondViewport': False})['data']
            OUTPUT.write_bytes(base64.b64decode(raw))
            with Image.open(OUTPUT) as image:
                assert image.size == (1920, 1080)
                print(f'{OUTPUT.relative_to(ROOT)}: {image.size}')
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
