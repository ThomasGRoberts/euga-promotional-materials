#!/usr/bin/env python3
"""Render the social card from the current published city list for Pages."""

import argparse
import base64
import functools
import hashlib
import http.server
import json
import pathlib
import re
import shutil
import struct
import subprocess
import tempfile
import threading
import time
import urllib.request

import websocket


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'downloads/social-sharing-1200x630.png'
CHROME = shutil.which('google-chrome') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pages', action='store_true', help='Version the Open Graph image URL in the Pages artifact')
    args = parser.parse_args()
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = tempfile.TemporaryDirectory(prefix='euga-social-export-')
    chrome = subprocess.Popen([
        CHROME, '--headless=new', '--disable-gpu', '--disable-dev-shm-usage',
        '--no-sandbox', '--no-first-run', '--remote-allow-origins=*',
        '--remote-debugging-port=0', f'--user-data-dir={profile.name}', 'about:blank',
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    connection = None
    try:
        port_file = pathlib.Path(profile.name) / 'DevToolsActivePort'
        for _ in range(100):
            if port_file.exists():
                break
            time.sleep(.1)
        else:
            raise RuntimeError('Chrome did not start')
        port = port_file.read_text().splitlines()[0]
        pages = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json', timeout=5))
        page = next(item for item in pages if item['type'] == 'page')
        connection = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=45, suppress_origin=True)
        next_id = 0

        def call(method, params=None):
            nonlocal next_id
            next_id += 1
            target = next_id
            connection.send(json.dumps({'id': target, 'method': method, 'params': params or {}}))
            while True:
                result = json.loads(connection.recv())
                if result.get('id') == target:
                    if 'error' in result:
                        raise RuntimeError(result['error'])
                    return result.get('result', {})

        def evaluate(expression, *, await_promise=False):
            result = call('Runtime.evaluate', {
                'expression': expression, 'awaitPromise': await_promise,
                'returnByValue': True,
            })
            if 'exceptionDetails' in result:
                raise RuntimeError(result['exceptionDetails'])
            return result['result'].get('value')

        call('Page.enable')
        call('Runtime.enable')
        call('Emulation.setDeviceMetricsOverride', {
            'width': 1200, 'height': 630, 'deviceScaleFactor': 1, 'mobile': False,
        })
        call('Page.navigate', {'url': f'http://127.0.0.1:{server.server_port}/social-sharing.html'})
        evaluate("new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(window.__SOCIAL_READY__)resolve(true);else if(Date.now()-started>30000)reject(Error('Social art did not render'));else setTimeout(poll,100)};poll()})", await_promise=True)
        details = evaluate('JSON.stringify({source:EUGASocialArt.source,count:EUGASocialArt.cityCount,missing:EUGASocialArt.missingCities})')
        details = json.loads(details)
        if details['source'] != 'sheet' or details['missing']:
            raise RuntimeError(f'Cannot update link preview from current city list: {details}')
        data_url = evaluate("EUGASocialArt.pngBlob().then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)}))", await_promise=True)
        image = base64.b64decode(data_url.split(',', 1)[1])
        if image[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', image[16:24]) != (1200, 630):
            raise RuntimeError('Exported image is not a 1200 × 630 PNG')
        OUTPUT.write_bytes(image)
        if args.pages:
            index = ROOT / 'index.html'
            source = index.read_text()
            pattern = r'(<meta property="og:image" content="https://thomasgroberts\.github\.io/euga-promotional-materials/downloads/social-sharing-1200x630\.png)(?:\?v=[0-9a-f]+)?("\s*>)'
            digest = hashlib.sha256(image).hexdigest()[:12]
            updated, count = re.subn(pattern, lambda match: f'{match.group(1)}?v={digest}{match.group(2)}', source)
            if count != 1:
                raise RuntimeError('Could not version the Open Graph image URL')
            index.write_text(updated)
        print(f'{OUTPUT.relative_to(ROOT)}: {details["count"]} cities from Sheet, {len(image):,} bytes')
    finally:
        if connection:
            connection.close()
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except subprocess.TimeoutExpired:
            chrome.kill()
        profile.cleanup()
        server.shutdown()


if __name__ == '__main__':
    main()
