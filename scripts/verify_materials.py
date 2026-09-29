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
            evaluate(browser, "document.fonts.ready.then(()=>true)")
            brand = evaluate(browser, "({cards:document.querySelectorAll('.brand-card').length,sliders:document.querySelectorAll('#alternate-controls input[type=range]').length,markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,gtLoaded:document.querySelector('#alternate-mark image').href.baseVal.includes('gt-navy.png'),baseline:document.querySelector('#alternate-status').textContent})")
            print('Branding', brand)
            assert brand['cards'] == 6 and brand['sliders'] == 12 and brand['markWidth'] == 220 and brand['gtLoaded']
            shot(browser, 'euga-branding-approved.png')
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,100))")
            mobile_brand = evaluate(browser, "({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,stageWidth:document.querySelector('#alternate-stage').getBoundingClientRect().width,artboardWidth:document.querySelector('#alternate-artboard').getBoundingClientRect().width})")
            print('Alternate mobile', mobile_brand)
            assert mobile_brand['scrollWidth'] <= mobile_brand['viewport'] and mobile_brand['artboardWidth'] <= mobile_brand['stageWidth'] + 1
            shot(browser, 'euga-branding-alternate-mobile.png')
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 1920, 'height': 1080, 'deviceScaleFactor': 1, 'mobile': False})
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,100))")
            tune = evaluate(browser, "(()=>{const mark=document.querySelector('#alternate-markSize'),stars=document.querySelector('#alternate-starRadius');mark.value='235';mark.dispatchEvent(new Event('input',{bubbles:true}));stars.value='92';stars.dispatchEvent(new Event('input',{bubbles:true}));return {markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,starTransform:document.querySelector('#alternate-stars polygon').getAttribute('transform'),status:document.querySelector('#alternate-status').textContent}})()")
            assert tune['markWidth'] == 235 and tune['starTransform'] and 'adjusted' in tune['status']
            print('Alternate tuning', tune)
            shot(browser, 'euga-branding-alternate-tuned.png')
            reset = evaluate(browser, "(()=>{document.querySelector('#alternate-reset').click();return {markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,starTransform:document.querySelector('#alternate-stars polygon').getAttribute('transform'),status:document.querySelector('#alternate-status').textContent}})()")
            assert reset['markWidth'] == 220 and reset['starTransform'] is None and 'original' in reset['status']
            print('Alternate reset', reset)
            open_page(browser, base + '/banner.html?autoplay=0')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.overview.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('carousel timed out'));else setTimeout(poll,50)};poll()})")
            title = evaluate(browser, "(()=>{const first=document.querySelector('.overview-line-one').getBoundingClientRect(),second=document.querySelector('.overview-line-two').getBoundingClientRect(),copy=document.querySelector('.overview-copy').getBoundingClientRect();return {first:first.width,second:second.width,copy:copy.width,secondText:document.querySelector('.overview-line-two').textContent,slides:document.querySelectorAll('.slide').length,verticalDots:getComputedStyle(document.querySelector('#progress-dots')).flexDirection,stepper:getComputedStyle(document.querySelector('.presentation-stepper')).display}})()")
            print('Carousel', title)
            assert title['verticalDots'] == 'column' and title['stepper'] == 'none'
            shot(browser, 'euga-carousel-approved.png')
            open_page(browser, base + '/banner.html?present=1')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.opening.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('presentation timed out'));else setTimeout(poll,50)};poll()})")
            navigation = evaluate(browser, "(()=>{const next=document.querySelector('#next');const visible=getComputedStyle(document.querySelector('.presentation-stepper')).display!=='none';const count=document.querySelectorAll('.slide').length;for(let i=1;i<count;i++)next.click();return {visible,count,readout:document.querySelector('#slide-count').textContent,final:document.querySelector('.slide.is-active')?.className,verticalDots:getComputedStyle(document.querySelector('#progress-dots')).flexDirection,whiteBackedSchoolLogo:!!document.querySelector('.application-slide .presentation-school-logo')}})()")
            print('Presentation navigation', navigation)
            assert navigation['visible'] and 'application-slide' in navigation['final'] and navigation['readout'] == f"{navigation['count']} / {navigation['count']}" and navigation['verticalDots'] == 'column' and not navigation['whiteBackedSchoolLogo']
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
