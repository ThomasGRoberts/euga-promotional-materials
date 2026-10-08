#!/usr/bin/env python3
"""Export the complete mini-print globe without the flyer's rectangular crop.

Start the documented localhost preview first. The original crop's projection
and seven city markers are retained; the canvas expands around the entire disk.
The miniature CSS offsets compensate for that expansion to keep it positioned.
"""
import base64
import pathlib
import sys
from export_branding import Browser
from verify_materials import evaluate, open_page

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
with Browser(1000, 1200) as browser:
    browser.call('Network.enable')
    browser.call('Network.setCacheDisabled', {'cacheDisabled': True})
    browser.call('Network.setBlockedURLs', {'urls': ['*docs.google.com*']})
    open_page(browser, BASE + '/flyer.html?mapLabels=0&brand=concept')
    evaluate(browser, "new Promise(resolve=>{const p=()=>window.__EUGA_RENDER_READY__?resolve(true):setTimeout(p,40);p()})")
    result = evaluate(browser, """(()=>{
      const selected=['Geneva','Paris','Vienna','Brussels','Bucharest','Bern','Berlin'];
      const width=723.84,height=411.84,p=globeProjection(width,height),pad=2;
      const x=Math.floor(p.cx-p.radius-pad),y=Math.floor(p.cy-p.radius-pad);
      const w=Math.ceil(p.cx+p.radius+pad)-x,h=Math.ceil(p.cy+p.radius+pad)-y;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.translate(-x,-y);
      const cities=state.data.cities;
      state.data.cities=cities.filter(c=>selected.includes(c.city));
      paintGeography(ctx,width,height,{crop:false});state.data.cities=cities;
      return {x,y,w,h,data:canvas.toDataURL().split(',')[1]};
    })()""")
    assert (result['x'], result['y'], result['w'], result['h']) == (-277, 35, 909, 909), 'Projection changed: update miniature CSS offsets before re-exporting'
    path = ROOT / 'assets/earth-limb-destinations.png'
    path.write_bytes(base64.b64decode(result['data']))
    print(f'{path.relative_to(ROOT)}: complete 909 × 909 globe, darker #D9D9D4 fill')
