#!/usr/bin/env python3
"""Smoke-test the materials pages in a local browser at presentation size."""

import base64
import functools
import http.server
import json
import pathlib
import threading

from export_branding import Browser

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHOTS = pathlib.Path('/private/tmp')


def evaluate(browser, expression):
    result = browser.call('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    if 'exceptionDetails' in result:
        raise RuntimeError(result['exceptionDetails'])
    return result['result'].get('value')


def open_page(browser, url):
    browser.call('Page.navigate', {'url': url})
    evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.readyState==='complete'&&document.querySelector('main'))resolve(true);else if(Date.now()-started>15000)reject(Error('page load timed out'));else setTimeout(poll,50)};poll()})")


def shot(browser, name):
    raw = browser.call('Page.captureScreenshot', {'format': 'png', 'fromSurface': True, 'captureBeyondViewport': False})['data']
    path = SHOTS / name
    path.write_bytes(base64.b64decode(raw))
    print(path)


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    try:
        with Browser(1920, 1080) as browser:
            open_page(browser, base + '/index.html')
            hub = evaluate(browser, "({groups:[...document.querySelectorAll('.hub-section h2')].map(node=>node.textContent),links:[...document.querySelectorAll('.material-card')].map(node=>node.querySelector('strong')?.textContent),separateButtons:document.querySelectorAll('.material-card .buttons').length})")
            print('Hub', hub)
            shot(browser, 'euga-hub-desktop.png')
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
            shot(browser, 'euga-hub-mobile.png')
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 1920, 'height': 1080, 'deviceScaleFactor': 1, 'mobile': False})
            open_page(browser, base + '/branding.html')
            brand = evaluate(browser, "({cards:document.querySelectorAll('.brand-card').length,sliders:document.querySelectorAll('input[type=range]').length})")
            print('Branding', brand)
            shot(browser, 'euga-branding-approved.png')
            open_page(browser, base + '/banner.html?autoplay=0')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.overview.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('carousel timed out'));else setTimeout(poll,50)};poll()})")
            title = evaluate(browser, "(()=>{const first=document.querySelector('.overview-line-one').getBoundingClientRect(),second=document.querySelector('.overview-line-two').getBoundingClientRect(),copy=document.querySelector('.overview-copy').getBoundingClientRect();return {first:first.width,second:second.width,copy:copy.width,secondText:document.querySelector('.overview-line-two').textContent,slides:document.querySelectorAll('.slide').length}})()")
            print('Carousel', title)
            shot(browser, 'euga-carousel-approved.png')
            open_page(browser, base + '/banner.html?present=1&slide=999')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.application-slide.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('presentation timed out'));else setTimeout(poll,50)};poll()})")
            end = evaluate(browser, "(()=>{const slides=[...document.querySelectorAll('.slide')],last=slides.at(-1);return {slides:slides.length,last:last.className,qr:last.querySelector('.application-qr')?.complete,url:last.querySelector('.application-link')?.textContent,brand:!!last.querySelector('.program-brand')}})()")
            print('Presentation', end)
            print('Back navigation', evaluate(browser, "(()=>{const link=document.querySelector('.material-back'),rect=link.getBoundingClientRect(),style=getComputedStyle(link);return {text:link.textContent,display:style.display,color:style.color,top:rect.top,left:rect.left,elementAtPoint:document.elementFromPoint(rect.left+4,rect.top+4)?.className}})()"))
            shot(browser, 'euga-presentation-apply-approved.png')
            open_page(browser, base + '/office-door.html')
            shot(browser, 'euga-office-approved.png')
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
