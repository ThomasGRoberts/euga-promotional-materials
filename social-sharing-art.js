const socialSheetUrl='https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pub?output=csv&gid=0';
const socialCanvas=document.querySelector('#social-art');
const socialWidth=1200,socialHeight=630,socialScale=2;

function socialParseCsv(source){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(quoted){
      if(c==='"'&&source[i+1]==='"'){field+='"';i++}
      else if(c==='"')quoted=false;
      else field+=c;
    }else if(c==='"')quoted=true;
    else if(c===','){row.push(field);field=''}
    else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);row=[];field=''}
    else field+=c;
  }
  row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);
  return rows;
}
function socialDecodeArc(topology,index){const raw=topology.arcs[index<0?~index:index],scale=topology.transform.scale,translate=topology.transform.translate;let x=0,y=0;const points=raw.map(pair=>{x+=pair[0];y+=pair[1];return[x*scale[0]+translate[0],y*scale[1]+translate[1]]});return index<0?points.reverse():points}
function socialPolygonRings(topology,geometry){const ring=indices=>indices.flatMap((index,i)=>{const points=socialDecodeArc(topology,index);return i?points.slice(1):points});return geometry.type==='Polygon'?[geometry.arcs.map(ring)]:geometry.type==='MultiPolygon'?geometry.arcs.map(polygon=>polygon.map(ring)):[]}
function socialClipPolygon(polygon,project,visibilityCutoff){
  const radians=Math.PI/180,degrees=180/Math.PI,rotate=d3.geoRotation([-socialGlobe.longitude,-socialGlobe.latitude]);
  const rings=[];let ring;
  const stream=d3.geoClipCircle(Math.acos(visibilityCutoff))({
    polygonStart(){},polygonEnd(){},lineStart(){rings.push(ring=[])},lineEnd(){},
    point(lon,lat){ring.push(project(rotate.invert([lon*degrees,lat*degrees])))}
  });
  stream.polygonStart();
  for(const coordinates of polygon){
    stream.lineStart();
    const last=coordinates.length-1,closed=last>0&&coordinates[0][0]===coordinates[last][0]&&coordinates[0][1]===coordinates[last][1];
    for(let i=0;i<coordinates.length-(closed?1:0);i++){
      const[lon,lat]=rotate(coordinates[i]);stream.point(lon*radians,lat*radians);
    }
    stream.lineEnd();
  }
  stream.polygonEnd();return rings;
}
function socialTraceClipped(ctx,rings,cx,cy,radius,fill){
  for(const ring of rings){
    if(!ring.length)continue;
    ctx.moveTo(ring[0][0],ring[0][1]);
    for(let i=1;i<=ring.length;i++){
      const previous=ring[i-1],point=ring[i%ring.length];
      if(Math.abs(previous[2])<1e-7&&Math.abs(point[2])<1e-7){
        if(fill){
          const from=Math.atan2(previous[1]-cy,previous[0]-cx),to=Math.atan2(point[1]-cy,point[0]-cx);
          const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));
          ctx.arc(cx,cy,radius,from,from+delta,delta<0);
        }else ctx.moveTo(point[0],point[1]);
      }else ctx.lineTo(point[0],point[1]);
    }
    if(fill)ctx.closePath();
  }
}
// Match the print flyer's globe rotation and perspective, with room for its two-line headline.
const socialGlobe={longitude:-0.059843750000003776,latitude:28.265625,roll:8,cx:380,cy:1020,radius:750,perspective:1.42};

function drawSocialArt(topology,cities){
  const ctx=socialCanvas.getContext('2d');
  socialCanvas.width=socialWidth*socialScale;socialCanvas.height=socialHeight*socialScale;
  ctx.setTransform(socialScale,0,0,socialScale,0,0);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,socialWidth,socialHeight);
  const{cx,cy,radius:sphereRadius,perspective}=socialGlobe,lon0=socialGlobe.longitude*Math.PI/180,lat0=socialGlobe.latitude*Math.PI/180,roll=socialGlobe.roll*Math.PI/180,distance=1+1/perspective,cutoff=1/distance,projectRadius=sphereRadius/Math.sqrt((distance-1)/(distance+1));
  const project=([lonDegrees,latDegrees])=>{const lon=lonDegrees*Math.PI/180,lat=latDegrees*Math.PI/180,delta=lon-lon0,rawX=Math.cos(lat)*Math.sin(delta),rawY=Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(delta),z=Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(delta),factor=(distance-1)/(distance-z),x=(rawX*Math.cos(roll)-rawY*Math.sin(roll))*factor,y=(rawX*Math.sin(roll)+rawY*Math.cos(roll))*factor;return[cx+projectRadius*x,cy-projectRadius*y,z-cutoff]};
  ctx.beginPath();ctx.arc(cx,cy,sphereRadius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='rgba(5,30,57,.5)';ctx.lineWidth=1.3;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,sphereRadius,0,Math.PI*2);ctx.clip();
  ctx.strokeStyle='rgba(5,30,57,.11)';ctx.lineWidth=1;
  for(let lon=-20;lon<=40;lon+=10){ctx.beginPath();let drawing=false;for(let lat=25;lat<=70;lat+=.5){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(drawing)ctx.lineTo(x,y);else{ctx.moveTo(x,y);drawing=true}}ctx.stroke()}
  for(let lat=30;lat<=65;lat+=5){ctx.beginPath();let drawing=false;for(let lon=-30;lon<=50;lon+=.5){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(drawing)ctx.lineTo(x,y);else{ctx.moveTo(x,y);drawing=true}}ctx.stroke()}
  for(const geometry of topology.objects.countries.geometries)for(const polygon of socialPolygonRings(topology,geometry)){
    const rings=socialClipPolygon(polygon,project,cutoff);
    ctx.beginPath();socialTraceClipped(ctx,rings,cx,cy,sphereRadius,true);ctx.fillStyle='#d9d9d4';ctx.fill('evenodd');
    ctx.beginPath();socialTraceClipped(ctx,rings,cx,cy,sphereRadius,false);ctx.strokeStyle='rgba(32,32,32,.43)';ctx.lineWidth=.8;ctx.stroke();
  }
  for(const city of cities){
    const[x,y,visible]=project([city.lon,city.lat]);if(visible<=0)continue;
    ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fillStyle='#b39051';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.stroke();
  }
  ctx.restore();
  ctx.textBaseline='alphabetic';
  ctx.font='700 94px "Roboto Slab", Georgia, serif';
  ctx.fillStyle='#051e39';ctx.fillText('Let Europe be',160,137);
  ctx.fillStyle='#b39051';ctx.fillText('your laboratory',160,245);
}

async function socialPngBlob(){const output=document.createElement('canvas');output.width=socialWidth;output.height=socialHeight;output.getContext('2d').drawImage(socialCanvas,0,0,socialWidth,socialHeight);return new Promise(resolve=>output.toBlob(resolve,'image/png'))}

async function initSocialArt(){
  const [topology,snapshot]=await Promise.all([fetch('assets/countries-110m.json').then(response=>response.json()),fetch('data/program.json').then(response=>response.json())]);
  let rows=snapshot.cities,source='snapshot';
  try{
    const response=await fetch(socialSheetUrl,{cache:'no-store'});if(!response.ok)throw Error(response.status);
    const csv=socialParseCsv(await response.text()),headers=(csv.shift()||[]).map((header,index)=>(index?header:header.replace(/^\uFEFF/,'')).trim()),cityIndex=headers.indexOf('City'),countryIndex=headers.indexOf('Country'),latitudeIndex=headers.indexOf('Latitude'),longitudeIndex=headers.indexOf('Longitude');
    if(cityIndex<0||countryIndex<0)throw Error('City or Country column missing');
    rows=csv.map(row=>({city:row[cityIndex],country:row[countryIndex],lat:row[latitudeIndex],lon:row[longitudeIndex]})).filter(row=>row.city);
    if(!rows.length)throw Error('City list is empty');
    source='sheet';
  }catch(error){console.warn('Using saved cities for social art.',error)}
  const resolved=await window.EUGACityGeocoder.resolve(rows,snapshot.cities),cities=resolved.filter(city=>Number.isFinite(city.lat)&&Number.isFinite(city.lon)),missing=resolved.filter(city=>!Number.isFinite(city.lat)||!Number.isFinite(city.lon)).map(city=>city.city);
  try{await document.fonts.load('700 94px "Roboto Slab"')}catch(error){console.warn('Using fallback headline font.',error)}
  drawSocialArt(topology,cities);
  window.EUGASocialArt={pngBlob:socialPngBlob,cityCount:cities.length,missingCities:missing,source};
  window.__SOCIAL_READY__=true;
}
initSocialArt().catch(error=>console.error('Unable to render social sharing image.',error));
