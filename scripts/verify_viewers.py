#!/usr/bin/env python3
"""Inspect the isolated carousel and presentation viewers at desktop size."""
import sys
sys.path.insert(0, 'scripts')
from export_branding import Browser
from verify_materials import evaluate, open_page, shot

BASE = 'http://127.0.0.1:8766'

with Browser(1920, 1080) as browser:
    open_page(browser, BASE + '/carousel-preview.html')
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1800))")
    carousel = evaluate(browser, """(()=>{const frame=document.querySelector('iframe');const doc=frame.contentDocument;return {backOutside:!!document.querySelector('.viewer-toolbar a'),backInside:!!doc.querySelector('.material-back'),copy:!!document.querySelector('#copy-embed'),slide:doc.querySelector('.slide.is-active')?.className,first:doc.querySelector('.overview-line-one')?.textContent,second:doc.querySelector('.overview-line-two')?.textContent}})()""")
    print('Carousel', carousel)
    assert carousel['backOutside'] and not carousel['backInside'] and carousel['copy']
    assert carousel['first'] == 'Let Europe be' and carousel['second'] == 'your laboratory'
    shot(browser, 'euga-new-carousel-viewer.png')
    evaluate(browser, "document.querySelector('#copy-embed').click()")
    copy_status = evaluate(browser, "new Promise(resolve=>setTimeout(()=>resolve(document.querySelector('#copy-status').textContent),200))")
    print('Embed copy', copy_status)
    assert 'WordPress Custom HTML block' in copy_status

    open_page(browser, BASE + '/presentation-preview.html')
    evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>document.querySelector('iframe')?.contentDocument?.querySelector('.slide.is-active')?resolve(true):Date.now()-started>15000?reject(Error('presentation timed out')):setTimeout(poll,50);poll()})")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,2500))")
    opening = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const title=doc.querySelector('.slide.is-active');const motion=title.querySelector('.presentation-title-motion');return {full:!!document.querySelector('#make-fullscreen'),backOutside:!!document.querySelector('.viewer-toolbar a'),backInside:!!doc.querySelector('.material-back'),stepper:!!doc.querySelector('.presentation-stepper'),title:title.className,removedOpening:!doc.querySelector('.opening'),motion:!!motion,approvedMotion:!!motion?.contentDocument?.querySelector('#alternate-mark'),headline:title.querySelector('h1')?.textContent,slides:doc.querySelectorAll('.slide').length}})()""")
    print('Title slide', opening)
    assert opening['full'] and opening['backOutside'] and not opening['backInside'] and not opening['stepper']
    assert opening['removedOpening'] and 'overview' in opening['title'] and opening['motion'] and opening['approvedMotion'] and opening['slides'] == 12
    shot(browser, 'euga-new-presentation-opening-viewer.png')
    button = evaluate(browser, "(()=>{const r=document.querySelector('#make-fullscreen').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
    browser.call('Input.dispatchMouseEvent', {'type':'mousePressed','x':button['x'],'y':button['y'],'button':'left','clickCount':1})
    browser.call('Input.dispatchMouseEvent', {'type':'mouseReleased','x':button['x'],'y':button['y'],'button':'left','clickCount':1})
    fullscreen_active = evaluate(browser, "new Promise(resolve=>setTimeout(()=>resolve(document.fullscreenElement?.id||''),250))")
    print('Fullscreen target (headless may deny user activation)', fullscreen_active)
    if fullscreen_active:
        assert fullscreen_active == 'material-frame'
        evaluate(browser, "document.exitFullscreen()")
    evaluate(browser, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))")
    moved = evaluate(browser, "document.querySelector('iframe').contentDocument.querySelector('.slide.is-active')?.className")
    print('Arrow navigation', moved)
    assert 'curriculum' in moved
    final = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const slide=doc.querySelector('.application-slide');return {qr:slide.querySelector('.application-qr')?.getAttribute('src'),caption:slide.querySelector('.application-qr-caption')?.textContent,rule:!!slide.querySelector('.rule'),schoolCount:doc.querySelectorAll('.presentation-school-logo').length,brandCount:doc.querySelectorAll('.presentation-logo').length,cityCount:doc.querySelectorAll('.city-slide').length}})()""")
    print('Final', final)
    assert final['qr'].endswith('-transparent.png') and final['caption'] == 'Scan to Learn More' and not final['rule'] and final['schoolCount'] == 0
    evaluate(browser, "document.querySelector('iframe').contentWindow.postMessage({type:'euga-presentation-key',key:'End'},location.origin)")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,300))")
    shot(browser, 'euga-new-presentation-apply-viewer.png')

    evaluate(browser, "localStorage.setItem('euga-program-brand','concept')")
    open_page(browser, BASE + '/presentation-preview.html')
    evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>document.querySelector('iframe')?.contentDocument?.querySelector('.slide.is-active')?resolve(true):Date.now()-started>15000?reject(Error('presentation timed out')):setTimeout(poll,50);poll()})")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1000))")
    in_motion = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const motion=doc.querySelector('.presentation-title-motion').contentDocument;return {approvedSource:!!motion.querySelector('#alternate-artboard'),rotation:!!motion.querySelector('#alternate-rotation-grid'),stars:motion.querySelectorAll('#alternate-mark [data-animation-part="star"]').length}})()""")
    print('Concept flourish in motion', in_motion)
    assert in_motion['approvedSource'] and in_motion['rotation'] and in_motion['stars'] == 7
    shot(browser, 'euga-new-presentation-concept-motion.png')
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,3300))")
    concept = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const motion=doc.querySelector('.presentation-title-motion').contentDocument;return {source:motion.querySelector('#alternate-mark')?.getAttribute('viewBox'),settled:!motion.querySelector('#alternate-rotation-grid'),stars:motion.querySelectorAll('#alternate-mark [data-animation-part="star"]').length}})()""")
    print('Concept title', concept)
    assert concept['source'] == '0 0 220 220' and concept['settled'] and concept['stars'] == 7
    shot(browser, 'euga-new-presentation-concept-opening.png')
    feature = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const slides=[...doc.querySelectorAll('.slide')],index=slides.indexOf(doc.querySelector('.city-slide'));doc.querySelectorAll('.progress-dot')[index].click();const logo=slides[index].querySelector('.presentation-logo');return {slide:slides[index].className,logo:!!logo,filter:getComputedStyle(logo).filter,background:getComputedStyle(logo.querySelector('.program-brand')).backgroundColor,width:logo.getBoundingClientRect().width,static:!logo.querySelector('iframe,svg')}})()""")
    print('Feature logo', feature)
    assert feature['logo'] and feature['filter'] != 'none' and feature['background'] == 'rgba(0, 0, 0, 0)' and feature['static'] and feature['width'] <= 400
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,2400))")
    shot(browser, 'euga-new-presentation-concept-feature.png')

    evaluate(browser, "localStorage.setItem('euga-program-brand','standard')")
    open_page(browser, BASE + '/presentation-preview.html')
    evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>document.querySelector('iframe')?.contentDocument?.querySelector('.slide.is-active')?resolve(true):Date.now()-started>15000?reject(Error('presentation timed out')):setTimeout(poll,50);poll()})")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,1000))")
    saved_choice = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;const title=doc.querySelector('.slide.is-active');return {motion:!!title.querySelector('.presentation-title-motion'),logo:title.querySelector('.presentation-logo img')?.getAttribute('src')}})()""")
    print('Saved standard choice', saved_choice)
    assert not saved_choice['motion'] and saved_choice['logo'] == 'assets/branding/program-wordmark.svg'
    evaluate(browser, "document.querySelector('iframe').contentWindow.EUGABranding.select('concept')")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,550))")
    live_switch = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;return !!doc.querySelector('.overview .presentation-title-motion')})()""")
    print('Live logo switch', live_switch)
    assert live_switch
    evaluate(browser, "new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>document.querySelector('iframe')?.contentDocument?.querySelector('.presentation-title-motion')?.contentDocument?.querySelector('#alternate-mark')?resolve(true):Date.now()-started>15000?reject(Error('logo iframe timed out')):setTimeout(poll,50);poll()})")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,3600))")
    evaluate(browser, "document.querySelector('iframe').contentWindow.postMessage({type:'euga-presentation-key',key:'ArrowRight'},location.origin)")
    evaluate(browser, "document.querySelector('iframe').contentWindow.postMessage({type:'euga-presentation-key',key:'Home'},location.origin)")
    evaluate(browser, "new Promise(resolve=>setTimeout(resolve,150))")
    replaying = evaluate(browser, """(()=>{const doc=document.querySelector('iframe').contentDocument;return !!doc.querySelector('.presentation-title-motion')?.contentDocument?.querySelector('#alternate-rotation-grid')})()""")
    print('Title replay on return', replaying)
    assert replaying

    open_page(browser, BASE + '/table-tent.html')
    preview_guides = evaluate(browser, "getComputedStyle(document.querySelector('.tent-face'),'::after').display")
    browser.call('Emulation.setEmulatedMedia', {'media':'print'})
    print_guides = evaluate(browser, "getComputedStyle(document.querySelector('.tent-face'),'::after').display")
    print('Table-tent fold guides', {'preview': preview_guides, 'print': print_guides})
    assert preview_guides != 'none' and print_guides == 'none'
