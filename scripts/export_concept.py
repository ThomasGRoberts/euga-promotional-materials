#!/usr/bin/env python3
"""Generate the static concept lockup and a GIF from the live branding source."""

import base64
import functools
import http.server
import pathlib
import sys
import threading
import xml.etree.ElementTree as ET

from PIL import Image
from export_branding import Browser

ROOT = pathlib.Path(__file__).resolve().parents[1]
SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)


def evaluate(browser, expression):
    result = browser.call('Runtime.evaluate', {'expression': expression, 'awaitPromise': True, 'returnByValue': True})
    if 'exceptionDetails' in result:
        raise RuntimeError(result['exceptionDetails'])
    return result['result'].get('value')


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with Browser(1920, 1080) as browser:
            browser.call('Page.navigate', {'url': f'http://127.0.0.1:{server.server_port}/branding.html?brand=concept'})
            evaluate(browser, "new Promise((resolve,reject)=>{let n=0;const poll=()=>{if(document.readyState==='complete'&&window.EUGABranding&&document.querySelector('#alternate-stars').children.length===7)document.fonts.ready.then(resolve);else if(n++>300)reject(Error('branding page failed to load'));else setTimeout(poll,40)};poll()})")
            markup = evaluate(browser, "(()=>{finishAnimation();return new XMLSerializer().serializeToString(document.querySelector('#alternate-mark'))})()")
            mark = ET.fromstring(markup)
            mark.set('x', '0')
            mark.set('y', '0')
            mark.set('width', '220')
            mark.set('height', '220')
            for key in ('id', 'role', 'aria-label'):
                mark.attrib.pop(key, None)
            # Match the live 220 px mark, 36 px gap, and 60 px light type exactly.
            # The extra right/bottom space prevents glyph descenders from being clipped.
            root = ET.Element(f'{{{SVG_NS}}}svg', {'viewBox': '0 0 900 220', 'role': 'img', 'aria-label': 'EU and Global Affairs Study Abroad Program'})
            root.append(mark)
            typography = ET.SubElement(root, f'{{{SVG_NS}}}g', {'fill': '#003057', 'font-family': 'Roboto, Arial, sans-serif', 'font-size': '60', 'font-weight': '300', 'letter-spacing': '-1.2'})
            ET.SubElement(typography, f'{{{SVG_NS}}}text', {'x': '256', 'y': '101'}).text = 'EU and Global Affairs'
            ET.SubElement(typography, f'{{{SVG_NS}}}text', {'x': '256', 'y': '164'}).text = 'Study Abroad Program'
            svg_path = ROOT / 'assets/branding/concept-wordmark.svg'
            ET.ElementTree(root).write(svg_path, encoding='unicode', xml_declaration=False)
            print(svg_path.relative_to(ROOT))
            if '--static-only' in sys.argv:
                return

            evaluate(browser, 'replayAnimation(); true')
            bounds = evaluate(browser, "(()=>{const r=document.querySelector('#alternate-artboard').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()")
            if bounds['width'] < 800:
                raise RuntimeError(f'Unexpected animation size: {bounds}')
            frames = []
            for millis in range(0, 3250, 100):
                if millis:
                    evaluate(browser, f"new Promise(resolve=>{{const poll=()=>{{if(animationStarted&&performance.now()-animationStarted>={millis})resolve(true);else setTimeout(poll,5)}};poll()}})")
                raw = browser.call('Page.captureScreenshot', {'format': 'png', 'clip': {**bounds, 'scale': 1}, 'captureBeyondViewport': True})['data']
                from io import BytesIO
                frame = Image.open(BytesIO(base64.b64decode(raw))).convert('RGB').resize((840, 300), Image.Resampling.LANCZOS)
                frames.append(frame.quantize(colors=96))
            evaluate(browser, "new Promise(resolve=>{const poll=()=>animationFrame===0?resolve(true):setTimeout(poll,20);poll()})")
            raw = browser.call('Page.captureScreenshot', {'format': 'png', 'clip': {**bounds, 'scale': 1}, 'captureBeyondViewport': True})['data']
            from io import BytesIO
            settled_rgb = Image.open(BytesIO(base64.b64decode(raw))).convert('RGB').resize((840, 300), Image.Resampling.LANCZOS)
            frames.append(settled_rgb.quantize(colors=96))
            output = ROOT / 'downloads/eu-stars-globe-animated.gif'
            frames[0].save(output, save_all=True, append_images=frames[1:], duration=[100] * (len(frames) - 1) + [1400], loop=0, optimize=True, disposal=2)
            print(f'{output.relative_to(ROOT)}: {len(frames)} frames, {output.stat().st_size} bytes')
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
