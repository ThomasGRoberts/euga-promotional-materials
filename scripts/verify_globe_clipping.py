#!/usr/bin/env python3
"""Check spherical land containment and exact limb joins using the local flyer."""
import json
import sys
from export_branding import Browser
from verify_materials import evaluate, open_page

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
with Browser(1000, 1200) as browser:
    browser.call('Network.enable')
    browser.call('Network.setBlockedURLs', {'urls': ['*docs.google.com*']})
    open_page(browser, BASE + '/flyer.html?brand=concept')
    evaluate(browser, "new Promise(resolve=>{const p=()=>window.__EUGA_RENDER_READY__?resolve(true):setTimeout(p,40);p()})")
    result = evaluate(browser, """(()=>{
      const projection=globeProjection(723.84,411.84),{cx,cy,radius,project}=projection;
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}),scale=240/radius;
      const samples=[];
      for(let lon=-180;lon<180;lon+=2)for(let lat=-88;lat<90;lat+=2){
        const p=project([lon,lat]);if(p[2]>.001)samples.push({coord:[lon,lat],x:256+(p[0]-cx)*scale,y:256+(p[1]-cy)*scale});
      }
      const results=[],failures=[];let horizonEndpoints=0;
      for(const geometry of state.topology.objects.countries.geometries){
        const polygons=geometryRings(state.topology,geometry),vertices=polygons.flat(2);
        const crosses=vertices.some(p=>project(p)[2]>0)&&vertices.some(p=>project(p)[2]<=0);
        if(!crosses&&geometry.properties.name!=='France')continue;
        const geojson={type:'MultiPolygon',coordinates:polygons};
        ctx.resetTransform();ctx.clearRect(0,0,512,512);ctx.setTransform(scale,0,0,scale,256-cx*scale,256-cy*scale);
        ctx.beginPath();
        for(const polygon of polygons){
          const rings=clipGlobePolygon(polygon,projection);
          for(const point of rings.flat())if(Math.abs(point[2])<1e-7){
            horizonEndpoints++;if(Math.abs(Math.hypot(point[0]-cx,point[1]-cy)-radius)>1e-6)failures.push('Off-limb endpoint: '+geometry.properties.name);
          }
          traceClippedGlobe(ctx,rings,projection,true);
        }
        ctx.fillStyle='#d9d9d4';ctx.fill('evenodd');
        let land=0,ocean=0;
        for(const sample of samples){
          const [lon,lat]=sample.coord,expected=d3.geoContains(geojson,sample.coord);
          // Avoid differences between straight source edges and geodesics at borders.
          if(![[lon-.6,lat],[lon+.6,lat],[lon,lat-.6],[lon,lat+.6]].every(p=>d3.geoContains(geojson,p)===expected))continue;
          const filled=ctx.isPointInPath(sample.x,sample.y,'evenodd');
          if(expected)land++;else ocean++;
          if(filled!==expected)failures.push({country:geometry.properties.name,coord:sample.coord,expected,filled});
        }
        results.push({country:geometry.properties.name,land,ocean});
      }
      return {countries:results,horizonEndpoints,failures};
    })()""")
    print(json.dumps(result, indent=2))
    assert not result['failures'], 'Spherical fill containment or limb endpoint check failed'
    assert result['horizonEndpoints'] > 0
    assert any(row['country'] == 'Russia' and row['land'] > 0 for row in result['countries'])
