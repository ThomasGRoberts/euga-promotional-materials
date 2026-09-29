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
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1800))")
            brand = evaluate(browser, "({cards:document.querySelectorAll('.brand-card').length,sliders:document.querySelectorAll('#alternate-controls input[type=range]').length,markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,stars:document.querySelectorAll('#alternate-stars [data-animation-part=star]').length,images:document.querySelectorAll('#alternate-mark image').length,inks:[...document.querySelectorAll('#alternate-mark [fill],#alternate-mark [stroke]')].map(node=>node.getAttribute('fill')||node.getAttribute('stroke')).filter(ink=>ink!=='none'),baseline:document.querySelector('#alternate-status').textContent})")
            print('Branding', brand)
            assert brand['cards'] == 6 and brand['sliders'] == 14 and brand['markWidth'] == 220
            assert brand['stars'] == 7 and brand['images'] == 0 and set(brand['inks']) == {'#003057'}
            tuned = evaluate(browser, "({star:document.querySelector('#alternate-stars g').getAttribute('transform'),outline:document.querySelector('#alternate-globe-outline').getAttribute('stroke-width'),horizon:document.querySelector('#alternate-horizon').getAttribute('stroke-width'),arc:document.querySelector('#alternate-starSweep').value,starSize:document.querySelector('#alternate-starSize').value,typeWeight:getComputedStyle(document.querySelector('#alternate-type')).fontWeight,typeFamily:getComputedStyle(document.querySelector('#alternate-type')).fontFamily})")
            print('Tuned baseline', tuned)
            assert tuned['star'] == 'translate(35.730 99.562)' and tuned['outline'] == '3.4' and tuned['horizon'] == '1.6' and tuned['arc'] == '164' and tuned['starSize'] == '11' and tuned['typeWeight'] == '300' and 'Roboto' in tuned['typeFamily']
            shot(browser, 'euga-branding-approved.png')
            evaluate(browser, "document.querySelector('#animation-controls').scrollIntoView({block:'center'})")
            shot(browser, 'euga-branding-motion-controls.png')
            evaluate(browser, "scrollTo(0,0)")
            evaluate(browser, "document.querySelector('#alternate-replay').click()")
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,260))")
            motion = evaluate(browser, "({clipY:Number(document.querySelector('#alternate-globe-clip').getAttribute('y')),rotating:document.querySelector('#alternate-globe-motion').hasAttribute('transform'),wordmarkMask:document.querySelector('#alternate-type').style.clipPath})")
            print('Assembly motion', motion)
            assert motion['clipY'] < 118 and motion['rotating'] and 'inset' in motion['wordmarkMask']
            shot(browser, 'euga-branding-assembly-mid.png')
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,550))")
            shot(browser, 'euga-branding-reveal-mid.png')
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,700))")
            settled = evaluate(browser, "({star:document.querySelector('#alternate-stars g').getAttribute('transform'),clipY:Number(document.querySelector('#alternate-globe-clip').getAttribute('y')),wordmarkMask:document.querySelector('#alternate-type').style.clipPath})")
            print('Assembly settled', settled)
            assert settled['star'] == tuned['star'] and settled['clipY'] == 118 and not settled['wordmarkMask']
            motion_tune = evaluate(browser, "(()=>{const input=document.querySelector('#alternate-spinDegrees');input.value='90';input.dispatchEvent(new Event('input',{bubbles:true}));return {value:input.value,readout:document.querySelector('output[for=alternate-spinDegrees]').textContent}})()")
            assert motion_tune == {'value': '90', 'readout': '90°'}
            evaluate(browser, "document.querySelector('#alternate-motion-reset').click()")
            assert evaluate(browser, "document.querySelector('#alternate-spinDegrees').value") == '45'
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1500))")
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,100))")
            mobile_brand = evaluate(browser, "({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,stageWidth:document.querySelector('#alternate-stage').getBoundingClientRect().width,artboardWidth:document.querySelector('#alternate-artboard').getBoundingClientRect().width})")
            print('Alternate mobile', mobile_brand)
            assert mobile_brand['scrollWidth'] <= mobile_brand['viewport'] and mobile_brand['artboardWidth'] <= mobile_brand['stageWidth'] + 1
            shot(browser, 'euga-branding-alternate-mobile.png')
            evaluate(browser, "document.querySelector('[data-layout=single-line]').click()")
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,100))")
            mobile_single = evaluate(browser, "({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,stageWidth:document.querySelector('#alternate-stage').getBoundingClientRect().width,artboardWidth:document.querySelector('#alternate-artboard').getBoundingClientRect().width})")
            assert mobile_single['scrollWidth'] <= mobile_single['viewport'] and mobile_single['artboardWidth'] <= mobile_single['stageWidth'] + 1
            browser.call('Emulation.setDeviceMetricsOverride', {'width': 1920, 'height': 1080, 'deviceScaleFactor': 1, 'mobile': False})
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,100))")
            evaluate(browser, "document.querySelector('[data-layout=single-line]').click()")
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1800))")
            single = evaluate(browser, "(()=>{const art=document.querySelector('#alternate-artboard').getBoundingClientRect(),type=document.querySelector('#alternate-type').getBoundingClientRect();return {layout:document.querySelector('#alternate-lockup').dataset.layout,artWidth:art.width,typeRight:type.right,artRight:art.right,star:document.querySelector('#alternate-stars g').getAttribute('transform'),type:document.querySelector('.alternate-single-line').textContent}})()")
            print('Single-line lockup', single)
            assert single['layout'] == 'single-line' and single['typeRight'] < single['artRight'] - 30 and single['star'] == tuned['star'] and single['type'] == 'EU and Global Affairs Study Abroad Program'
            shot(browser, 'euga-branding-single-line.png')
            evaluate(browser, "document.querySelector('[data-layout=two-line]').click()")
            evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1800))")
            tune = evaluate(browser, "(()=>{for(const [id,value] of [['markSize','235'],['starRadius','92'],['starSize','11'],['globeRadius','83'],['gridStroke','2.3']]){const input=document.querySelector('#alternate-'+id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}))}return {markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,starTransform:document.querySelector('#alternate-stars g').getAttribute('transform'),globeRadius:document.querySelector('#alternate-globe-outline').getAttribute('r'),gridStroke:document.querySelector('#alternate-grid').getAttribute('stroke-width'),status:document.querySelector('#alternate-status').textContent}})()")
            assert tune['markWidth'] == 235 and tune['starTransform'] != 'translate(34.000 118.000)' and tune['globeRadius'] == '83' and tune['gridStroke'] == '2.3' and 'adjusted' in tune['status']
            print('Alternate tuning', tune)
            shot(browser, 'euga-branding-alternate-tuned.png')
            reset = evaluate(browser, "(()=>{document.querySelector('#alternate-reset').click();const svg=document.querySelector('#alternate-mark').cloneNode(true);const xml=new XMLSerializer().serializeToString(svg);const parsed=new DOMParser().parseFromString(xml,'image/svg+xml');return {markWidth:document.querySelector('#alternate-mark').getBoundingClientRect().width,starTransform:document.querySelector('#alternate-stars g').getAttribute('transform'),globeRadius:document.querySelector('#alternate-globe-outline').getAttribute('r'),exportHasRaster:!!svg.querySelector('image'),exportValid:!parsed.querySelector('parsererror')&&parsed.querySelectorAll('[data-animation-part=star]').length===7,options:document.querySelectorAll('[data-brand-option]').length,status:document.querySelector('#alternate-status').textContent}})()")
            assert reset['markWidth'] == 220 and reset['starTransform'] == tuned['star'] and reset['globeRadius'] == '76' and not reset['exportHasRaster'] and reset['exportValid'] and reset['options'] == 2 and 'tuned icon' in reset['status']
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
