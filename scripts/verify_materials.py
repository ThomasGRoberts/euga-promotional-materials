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
            evaluate(browser, "localStorage.setItem('euga-program-brand','concept')")
            open_page(browser, base + '/branding.html')
            evaluate(browser, "document.fonts.ready.then(()=>true)")
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(animationFrame===0)resolve(true);else if(Date.now()-started>8000)reject(Error('branding animation timed out'));else setTimeout(poll,30)};poll()})")
            brand = evaluate(browser, "({cards:document.querySelectorAll('.brand-card').length,sliders:document.querySelectorAll('input[type=range]').length,markWidth:parseFloat(getComputedStyle(document.querySelector('#alternate-mark')).width),stars:document.querySelectorAll('#alternate-stars [data-animation-part=star]').length,images:document.querySelectorAll('#alternate-mark image').length,inks:[...document.querySelectorAll('#alternate-mark [fill],#alternate-mark [stroke]')].map(node=>node.getAttribute('fill')||node.getAttribute('stroke')).filter(ink=>ink!=='none'),baseline:document.querySelector('#alternate-status').textContent})")
            print('Branding', brand)
            assert brand['cards'] == 2 and brand['sliders'] == 0 and brand['markWidth'] == 220
            choices = evaluate(browser, "({labels:[...document.querySelectorAll('.brand-choice-label')].map(node=>node.textContent),standardImage:document.querySelector('[data-select-brand=standard] img').naturalWidth,clone:!!document.querySelector('#concept-choice-visual .alternate-artboard'),cloneText:document.querySelector('#concept-choice-visual .alternate-type')?.textContent,cloneSize:getComputedStyle(document.querySelector('#concept-choice-visual .alternate-type')).fontSize,cloneAlign:getComputedStyle(document.querySelector('#concept-choice-visual .alternate-type')).textAlign,mainAlign:getComputedStyle(document.querySelector('#alternate-type')).textAlign,cloneStar:document.querySelector('#concept-choice-visual [data-animation-part=star]')?.getAttribute('transform'),cloneWidth:document.querySelector('#concept-choice-visual').getBoundingClientRect().width,typeSize:getComputedStyle(document.querySelector('#alternate-type')).fontSize,typeRight:document.querySelector('#alternate-type').getBoundingClientRect().right,artRight:document.querySelector('#alternate-artboard').getBoundingClientRect().right})")
            print('Logo choices', choices)
            assert choices['labels'] == ['EU/UN Flags', 'Stars + Globe'] and choices['standardImage'] > 0 and choices['clone']
            assert 'EU and Global Affairs' in choices['cloneText'] and 'Study Abroad Program' in choices['cloneText']
            assert choices['cloneSize'] == choices['typeSize'] and choices['cloneAlign'] == choices['mainAlign'] == 'left' and choices['cloneStar'] == 'translate(35.730 99.562)' and choices['cloneWidth'] > 0
            assert choices['typeSize'] == '60px' and choices['typeRight'] < choices['artRight'] - 20
            assert evaluate(browser, "document.querySelector('#brand-toggle').getAttribute('aria-checked')==='true'&&document.querySelector('#approved-branding').hidden")
            assert brand['stars'] == 7 and brand['images'] == 0 and set(brand['inks']) == {'#003057'}
            tuned = evaluate(browser, "({star:document.querySelector('#alternate-stars g').getAttribute('transform'),outline:document.querySelector('#alternate-globe-outline').getAttribute('stroke-width'),horizon:document.querySelector('#alternate-horizon').getAttribute('stroke-width'),typeWeight:getComputedStyle(document.querySelector('#alternate-type')).fontWeight,typeFamily:getComputedStyle(document.querySelector('#alternate-type')).fontFamily})")
            print('Tuned baseline', tuned)
            assert tuned['star'] == 'translate(35.730 99.562)' and tuned['outline'] == '3.4' and tuned['horizon'] == '1.6' and tuned['typeWeight'] == '300' and 'Roboto' in tuned['typeFamily']
            shot(browser, 'euga-branding-approved.png')
            evaluate(browser, "document.querySelector('#alternate-replay').click()")
            evaluate(browser, "new Promise(resolve=>{const poll=()=>animationStarted&&performance.now()-animationStarted>=700?resolve(true):setTimeout(poll,8);poll()})")
            rotating = evaluate(browser, "({clipY:Number(document.querySelector('#alternate-globe-clip').getAttribute('y')),outerCx:document.querySelector('#alternate-globe-outline').getAttribute('cx'),flatSpin:document.querySelector('#alternate-globe-motion').hasAttribute('transform'),rotationGrid:!!document.querySelector('#alternate-rotation-grid'),smooth:[...document.querySelector('#alternate-rotation-grid').children].slice(0,5).filter(path=>path.getAttribute('d').includes(' A ')).length,firstStarOpacity:document.querySelector('#alternate-stars g').style.opacity,firstLineMask:document.querySelector('#alternate-type .alternate-two-line > div').style.clipPath})")
            print('Polar rotation', rotating)
            assert rotating['clipY'] < 40 and rotating['outerCx'] == '110' and not rotating['flatSpin'] and rotating['rotationGrid'] and rotating['smooth'] >= 4 and rotating['firstStarOpacity'] == '0' and '100%' in rotating['firstLineMask']
            shot(browser, 'euga-branding-polar-rotation.png')
            evaluate(browser, "new Promise(resolve=>{const poll=()=>performance.now()-animationStarted>=1500?resolve(true):setTimeout(poll,8);poll()})")
            withdrawal = evaluate(browser, "({clipY:Number(document.querySelector('#alternate-globe-clip').getAttribute('y')),upper:!!document.querySelector('#alternate-upper-withdrawal'),contraction:document.querySelector('#alternate-upper-withdrawal-motion')?.getAttribute('transform'),fragments:!!document.querySelector('#alternate-upper-fragments'),firstStarOpacity:document.querySelector('#alternate-stars g').style.opacity,firstLineMask:document.querySelector('#alternate-type .alternate-two-line > div').style.clipPath})")
            print('Upper-globe withdrawal', withdrawal)
            assert withdrawal['clipY'] == 118 and withdrawal['upper'] and 'scale(1 0.' in withdrawal['contraction'] and not withdrawal['fragments'] and withdrawal['firstStarOpacity'] == '0' and '100%' in withdrawal['firstLineMask']
            shot(browser, 'euga-branding-upper-withdrawal.png')
            evaluate(browser, "new Promise(resolve=>{const poll=()=>performance.now()-animationStarted>=2200?resolve(true):setTimeout(poll,8);poll()})")
            stars_motion = evaluate(browser, "({first:document.querySelector('#alternate-stars g').style.opacity,last:document.querySelector('#alternate-stars g:last-child').style.opacity,firstLineMask:document.querySelector('#alternate-type .alternate-two-line > div').style.clipPath})")
            print('Stars assembling', stars_motion)
            assert float(stars_motion['first']) > 0 and stars_motion['last'] == '0' and '100%' in stars_motion['firstLineMask']
            shot(browser, 'euga-branding-stars-assembling.png')
            evaluate(browser, "new Promise(resolve=>{const poll=()=>performance.now()-animationStarted>=2650?resolve(true):setTimeout(poll,8);poll()})")
            first_line = evaluate(browser, "({first:document.querySelector('#alternate-type .alternate-two-line > div').style.clipPath,second:document.querySelector('#alternate-type .alternate-two-line > div:nth-child(2)').style.clipPath,lastStarTransform:document.querySelector('#alternate-stars g:last-child').getAttribute('transform')})")
            assert '100%' not in first_line['first'] and '100%' in first_line['second'] and 'scale(' in first_line['lastStarTransform']
            shot(browser, 'euga-branding-first-line.png')
            evaluate(browser, "new Promise(resolve=>{const poll=()=>performance.now()-animationStarted>=2950?resolve(true):setTimeout(poll,8);poll()})")
            second_line = evaluate(browser, "document.querySelector('#alternate-type .alternate-two-line > div:nth-child(2)').style.clipPath")
            assert '100%' not in second_line
            shot(browser, 'euga-branding-second-line.png')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(animationFrame===0)resolve(true);else if(Date.now()-started>8000)reject(Error('branding animation timed out'));else setTimeout(poll,30)};poll()})")
            settled = evaluate(browser, "({star:document.querySelector('#alternate-stars g').getAttribute('transform'),clipY:Number(document.querySelector('#alternate-globe-clip').getAttribute('y')),firstLineMask:document.querySelector('#alternate-type .alternate-two-line > div').style.clipPath,upper:!!document.querySelector('#alternate-upper-withdrawal')})")
            print('Assembly settled', settled)
            assert settled['star'] == tuned['star'] and settled['clipY'] == 118 and not settled['firstLineMask'] and not settled['upper']
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
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(animationFrame===0)resolve(true);else if(Date.now()-started>8000)reject(Error('branding animation timed out'));else setTimeout(poll,30)};poll()})")
            single = evaluate(browser, "(()=>{const art=document.querySelector('#alternate-artboard').getBoundingClientRect(),type=document.querySelector('#alternate-type').getBoundingClientRect();return {layout:document.querySelector('#alternate-lockup').dataset.layout,artWidth:art.width,typeRight:type.right,artRight:art.right,star:document.querySelector('#alternate-stars g').getAttribute('transform'),type:document.querySelector('#alternate-type .alternate-single-line').textContent}})()")
            print('Single-line lockup', single)
            assert single['layout'] == 'single-line' and single['typeRight'] < single['artRight'] - 30 and single['star'] == tuned['star'] and single['type'] == 'EU and Global Affairs Study Abroad Program'
            assert evaluate(browser, "document.querySelector('#concept-choice-visual .alternate-artboard').dataset.layout==='single-line'&&document.querySelector('#concept-choice-visual .alternate-single-line').textContent==='EU and Global Affairs Study Abroad Program'")
            shot(browser, 'euga-branding-single-line.png')
            evaluate(browser, "document.querySelector('[data-layout=two-line]').click()")
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(animationFrame===0)resolve(true);else if(Date.now()-started>8000)reject(Error('branding animation timed out'));else setTimeout(poll,30)};poll()})")
            static = evaluate(browser, "(()=>{const svg=document.querySelector('#alternate-mark').cloneNode(true);const parsed=new DOMParser().parseFromString(new XMLSerializer().serializeToString(svg),'image/svg+xml');return {markWidth:parseFloat(getComputedStyle(document.querySelector('#alternate-mark')).width),star:document.querySelector('#alternate-stars g').getAttribute('transform'),valid:!parsed.querySelector('parsererror')&&parsed.querySelectorAll('[data-animation-part=star]').length===7,options:document.querySelectorAll('[data-brand-option]').length,advanced:!!document.querySelector('.brand-tuning')}})()")
            assert static['markWidth'] == 220 and static['star'] == tuned['star'] and static['valid'] and static['options'] == 2 and not static['advanced']
            evaluate(browser, "document.querySelector('#brand-toggle').click()")
            assert evaluate(browser, "window.EUGABranding.current()==='standard'&&!document.querySelector('#approved-branding').hidden&&document.querySelector('#concept-branding').hidden")
            evaluate(browser, "document.querySelector('#brand-toggle').click()")
            assert evaluate(browser, "window.EUGABranding.current()==='concept'&&document.querySelector('#approved-branding').hidden")
            open_page(browser, base + '/banner.html?autoplay=0')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.overview.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('carousel timed out'));else setTimeout(poll,50)};poll()})")
            title = evaluate(browser, "(()=>{const first=document.querySelector('.overview-line-one').getBoundingClientRect(),second=document.querySelector('.overview-line-two').getBoundingClientRect(),copy=document.querySelector('.overview-copy').getBoundingClientRect();return {first:first.width,second:second.width,copy:copy.width,secondText:document.querySelector('.overview-line-two').textContent,slides:document.querySelectorAll('.slide').length,verticalDots:getComputedStyle(document.querySelector('#progress-dots')).flexDirection,stepper:!!document.querySelector('.presentation-stepper')}})()")
            print('Carousel', title)
            assert title['verticalDots'] == 'column' and not title['stepper']
            city_focus = evaluate(browser, "({source:document.documentElement.dataset.contentSource,featured:globeState.cities.filter(city=>EUGACities.isFeatured(city.featured)).map(city=>city.city),dots:globeState.cities.length,countries:new Set(globeState.cities.map(city=>city.country)).size,citySlides:[...document.querySelectorAll('.city-slide')].map(slide=>slide.dataset.city),siteSlides:[...document.querySelectorAll('.site-slide')].map(slide=>slide.dataset.city),stats:[...document.querySelectorAll('.overview-stats strong')].map(node=>Number(node.textContent))})")
            print('Featured city focus', city_focus)
            assert city_focus['dots'] >= len(city_focus['featured']) and city_focus['dots'] > len(city_focus['featured'])
            assert all(city in city_focus['featured'] for city in city_focus['citySlides'])
            assert city_focus['stats'] == [city_focus['dots'], city_focus['countries'], 4]
            assert all(city in city_focus['featured'] or city not in [item['city'] for item in json.loads((ROOT / 'data/program.json').read_text())['cities']] for city in city_focus['siteSlides'])
            weighting = evaluate(browser, "(()=>{const counts=Object.fromEntries(fallbackFaculty.map(person=>[person.Name,0]));for(let i=0;i<20000;i++){const sample=featuredFacultySelection(fallbackFaculty);if(new Set(sample).size!==sample.length)return {duplicate:true};sample.forEach(person=>counts[person.Name]++)}return {duplicate:false,counts}})()")
            print('Faculty weighting', weighting)
            assert not weighting['duplicate'] and 15500 < weighting['counts']['Prof. Vicki Birchfield'] < 16500
            assert all(7500 < count < 8500 for name,count in weighting['counts'].items() if name != 'Prof. Vicki Birchfield')
            shot(browser, 'euga-carousel-approved.png')
            open_page(browser, base + '/banner.html?present=1')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(document.querySelector('.overview.is-active'))resolve(true);else if(Date.now()-started>15000)reject(Error('presentation timed out'));else setTimeout(poll,50)};poll()})")
            navigation = evaluate(browser, "(()=>{const count=document.querySelectorAll('.slide').length;handleKey('End');return {stepper:!!document.querySelector('.presentation-stepper'),count,final:document.querySelector('.slide.is-active')?.className,verticalDots:getComputedStyle(document.querySelector('#progress-dots')).flexDirection,whiteBackedSchoolLogo:!!document.querySelector('.application-slide .presentation-school-logo')}})()")
            print('Presentation navigation', navigation)
            assert not navigation['stepper'] and 'application-slide' in navigation['final'] and navigation['verticalDots'] == 'column' and not navigation['whiteBackedSchoolLogo']
            end = evaluate(browser, "(()=>{const slides=[...document.querySelectorAll('.slide')],last=slides.at(-1);return {slides:slides.length,last:last.className,qr:last.querySelector('.application-qr')?.complete,url:last.querySelector('.application-link')?.textContent,brand:!!last.querySelector('.program-brand')}})()")
            print('Presentation', end)
            presentation_cities = evaluate(browser, "[...document.querySelectorAll('.city-slide')].map(slide=>slide.dataset.city)")
            assert set(presentation_cities) == set(city_focus['featured'])
            assert evaluate(browser, "[...document.querySelectorAll('.program-brand')].every(img=>img.src.includes('concept-wordmark.svg'))")
            assert not evaluate(browser, "!!document.querySelector('.material-back')")
            shot(browser, 'euga-presentation-apply-approved.png')
            open_page(browser, base + '/office-door.html')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(window.__EUGA_PRINT_READY__&&document.querySelector('[data-brand-logo]').complete)document.fonts.ready.then(resolve);else if(Date.now()-started>15000)reject(Error('door sign timed out'));else setTimeout(poll,50)};poll()})")
            assert evaluate(browser, "document.querySelector('[data-brand-logo]').src.includes('concept-wordmark.svg')&&document.querySelector('[data-download-concept]').href.includes('office-door-half-page-concept.pdf')")
            door = evaluate(browser, "(()=>{const page=document.querySelector('.door-page').getBoundingClientRect(),details=document.querySelector('.door-details').getBoundingClientRect(),qr=document.querySelector('.door-qr').getBoundingClientRect(),school=document.querySelector('.door-school').getBoundingClientRect(),apply=document.querySelector('.door-apply').getBoundingClientRect(),credentials=document.querySelector('.door-credentials').getBoundingClientRect();return {size:[page.width,page.height],stats:[...document.querySelectorAll('.door-stats strong')].map(node=>Number(node.textContent)),source:document.documentElement.dataset.contentSource,detailsBottom:details.bottom,pageBottom:page.bottom,qrRight:qr.right,schoolRight:school.right,pageRight:page.right,schoolSrc:document.querySelector('.door-school').getAttribute('src'),applyInside:apply.left>=credentials.left&&apply.right<=credentials.right}})()")
            print('Door sign', door)
            assert door['size'] == [816, 480] and door['stats'][:2] == [city_focus['dots'], city_focus['countries']] and door['stats'][2] == 4
            assert door['detailsBottom'] <= door['pageBottom'] and door['qrRight'] < door['pageRight'] and door['schoolRight'] < door['pageRight'] - 4
            assert door['schoolSrc'] == 'assets/Nunnlogo-transparent.png' and door['applyInside']
            logo_audit = evaluate(browser, "(async()=>{const xml=await fetch('assets/branding/concept-wordmark.svg').then(response=>response.text());const doc=new DOMParser().parseFromString(xml,'image/svg+xml'),svg=document.importNode(doc.documentElement,true);svg.style.cssText='position:absolute;left:-9999px;top:0;width:900px;height:220px';document.body.append(svg);const mark=svg.querySelector('svg'),texts=[...svg.querySelectorAll('text')],boxes=texts.map(node=>node.getBBox()),result={viewBox:svg.getAttribute('viewBox'),markWidth:mark.getAttribute('width'),typeSize:texts[0].parentNode.getAttribute('font-size'),gap:Number(texts[0].getAttribute('x'))-Number(mark.getAttribute('width')),textBottom:boxes[1].y+boxes[1].height,textRight:boxes[0].x+boxes[0].width};svg.remove();return result})()")
            print('Canonical logo audit', logo_audit)
            assert logo_audit['viewBox'] == '0 0 900 220' and logo_audit['markWidth'] == '220' and logo_audit['typeSize'] == '60' and logo_audit['gap'] == 36
            assert logo_audit['textBottom'] < 210 and logo_audit['textRight'] < 890
            school_alpha = evaluate(browser, "(()=>{const img=document.querySelector('.door-school'),canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;return new Promise(resolve=>{const check=()=>{if(img.complete&&img.naturalWidth){const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);resolve(ctx.getImageData(4,4,1,1).data[3])}else setTimeout(check,20)};check()})})()")
            assert school_alpha == 0
            shot(browser, 'euga-office-approved.png')
            open_page(browser, base + '/office-door-two-up.html?brand=concept')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{const frames=[...document.querySelectorAll('iframe')];if(frames.length===2&&frames.every(frame=>frame.contentWindow?.__EUGA_PRINT_READY__&&frame.contentDocument?.querySelector('.sheet-embed')))resolve(true);else if(Date.now()-started>15000)reject(Error('two-up sheet timed out'));else setTimeout(poll,50)};poll()})")
            two_up = evaluate(browser, "({sheet:[document.querySelector('.sheet').getBoundingClientRect().width,document.querySelector('.sheet').getBoundingClientRect().height],panels:[...document.querySelectorAll('.panel')].map(panel=>[panel.getBoundingClientRect().width,panel.getBoundingClientRect().height])})")
            assert two_up['sheet'] == [816, 1056] and two_up['panels'] == [[816, 480], [816, 480]]
            shot(browser, 'euga-office-two-up.png')
            open_page(browser, base + '/table-tent.html')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(window.__EUGA_PRINT_READY__&&[...document.querySelectorAll('.tent-wordmark')].every(image=>image.complete&&image.naturalWidth))document.fonts.ready.then(resolve);else if(Date.now()-started>15000)reject(Error('table tent timed out'));else setTimeout(poll,50)};poll()})")
            tent = evaluate(browser, "(()=>{const sheet=document.querySelector('.tent-sheet').getBoundingClientRect(),tab=document.querySelector('.tent-tab').getBoundingClientRect(),faces=[...document.querySelectorAll('.tent-face')],base=document.querySelector('.tent-base').getBoundingClientRect(),art=faces.map(face=>face.querySelector('.tent-art')),qr=faces.map(face=>face.querySelector('.tent-action a').getBoundingClientRect()),wordmark=faces[1].querySelector('.tent-wordmark').getBoundingClientRect(),term=faces[1].querySelector('.tent-term').getBoundingClientRect();return {sheet:[sheet.width,sheet.height],faces:faces.map(face=>[face.getBoundingClientRect().width,face.getBoundingClientRect().height]),same:art[0].textContent===art[1].textContent,inverted:getComputedStyle(art[0]).transform,upright:getComputedStyle(art[1]).transform,logos:[...document.querySelectorAll('.tent-wordmark')].every(image=>image.src.includes('concept-wordmark.svg')),qr:qr.map(rect=>[rect.width,rect.height]),folds:[tab.bottom,faces[0].getBoundingClientRect().bottom,faces[1].getBoundingClientRect().bottom,base.top],logoGap:term.top-wordmark.bottom}})()")
            print('Table tent', tent)
            assert tent['sheet'] == [816, 1056] and tent['faces'] == [[816, 326.390625], [816, 326.390625]] and tent['same'] and tent['inverted'].startswith('matrix(-1') and tent['upright'] == 'none' and tent['logos']
            assert all(width > 120 and height > 120 for width, height in tent['qr'])
            assert abs(tent['folds'][2] - tent['folds'][3]) < 1 and tent['logoGap'] > 10
            shot(browser, 'euga-table-tent-sheet.png')
            open_page(browser, base + '/flyer.html')
            evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{const logo=document.querySelector('.flyer-identity [data-brand-logo]');if(window.__EUGA_RENDER_READY__&&logo?.complete&&logo.naturalWidth)document.fonts.ready.then(resolve);else if(Date.now()-started>15000)reject(Error('flyer did not render'));else setTimeout(poll,50)};poll()})")
            flyer = evaluate(browser, "(()=>{const app=document.querySelector('#app').getBoundingClientRect(),identity=document.querySelector('.flyer-identity').getBoundingClientRect(),logo=document.querySelector('.flyer-identity [data-brand-logo]').getBoundingClientRect(),heading=document.querySelector('.program-heading h1').getBoundingClientRect(),details=document.querySelector('.details').getBoundingClientRect(),footer=document.querySelector('.brand-footer').getBoundingClientRect();return {logo:document.querySelector('.flyer-identity [data-brand-logo]').src,logoSize:[logo.width,logo.height],opacity:getComputedStyle(document.querySelector('.flyer-identity')).opacity,app:[app.width,app.height],identityBottom:identity.bottom,headingTop:heading.top,logoRight:logo.right,appRight:app.right,footerTop:footer.top,detailsBottom:details.bottom}})()")
            print('Flyer watermark', flyer)
            assert evaluate(browser, "Number(document.querySelector('#city-count').textContent)===state.data.cities.length&&Number(document.querySelector('#country-count').textContent)===new Set(state.data.cities.map(city=>city.country)).size&&Number(document.querySelector('#course-count').textContent)===state.data.courses.length")
            assert flyer['logo'].endswith('concept-wordmark.svg') and 61 < flyer['logoSize'][1] < 65
            assert flyer['opacity'] == '0.54' and flyer['app'] == [816, 1056] and flyer['identityBottom'] < flyer['headingTop'] and flyer['logoRight'] < flyer['appRight'] - 30 and flyer['detailsBottom'] <= flyer['footerTop'] + 1
            shot(browser, 'euga-flyer-concept-watermark.png')
            evaluate(browser, "window.EUGABranding.select('standard');document.querySelector('.flyer-identity [data-brand-logo]').decode()")
            assert evaluate(browser, "document.querySelector('.flyer-identity [data-brand-logo]').src.endsWith('program-wordmark.svg')")
            shot(browser, 'euga-flyer-flags-watermark.png')
            evaluate(browser, "window.EUGABranding.select('concept')")
            open_page(browser, base + '/hallway.html')
            assert evaluate(browser, "document.querySelector('[data-brand-logo]').src.includes('concept-wordmark.svg')&&document.querySelector('[data-download-concept]').href.includes('hallway-tv-concept-1920x1080.png')")
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
