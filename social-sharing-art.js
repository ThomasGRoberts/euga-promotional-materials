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
function socialTrace(ctx,ring,project){let drawing=false;for(const point of ring){const[x,y,visible]=project(point);if(visible<=.01){drawing=false;continue}if(drawing)ctx.lineTo(x,y);else{ctx.moveTo(x,y);drawing=true}}}

function drawSocialArt(topology,cities){
  const ctx=socialCanvas.getContext('2d');
  socialCanvas.width=socialWidth*socialScale;socialCanvas.height=socialHeight*socialScale;
  ctx.setTransform(socialScale,0,0,socialScale,0,0);
  ctx.fillStyle='#051e39';ctx.fillRect(0,0,socialWidth,socialHeight);
  const cx=930,cy=310,projectRadius=980,lon0=13*Math.PI/180,lat0=49*Math.PI/180,distance=1+1/1.42,cutoff=1/distance,sphereRadius=projectRadius*Math.sqrt((distance-1)/(distance+1));
  const project=([lonDegrees,latDegrees])=>{const lon=lonDegrees*Math.PI/180,lat=latDegrees*Math.PI/180,delta=lon-lon0,rawX=Math.cos(lat)*Math.sin(delta),rawY=Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(delta),z=Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(delta),factor=(distance-1)/(distance-z);return[cx+projectRadius*rawX*factor,cy-projectRadius*rawY*factor,z-cutoff]};
  const aura=ctx.createRadialGradient(cx,cy,sphereRadius*.78,cx,cy,sphereRadius*1.24);aura.addColorStop(0,'rgba(215,173,104,.22)');aura.addColorStop(1,'rgba(215,173,104,0)');ctx.fillStyle=aura;ctx.fillRect(0,0,socialWidth,socialHeight);
  const ocean=ctx.createRadialGradient(cx-250,cy-280,40,cx,cy,sphereRadius*1.5);ocean.addColorStop(0,'#f1f2eb');ocean.addColorStop(.58,'#d8e0df');ocean.addColorStop(1,'#adc0c5');
  ctx.beginPath();ctx.arc(cx,cy,sphereRadius,0,Math.PI*2);ctx.fillStyle=ocean;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,sphereRadius,0,Math.PI*2);ctx.clip();
  ctx.strokeStyle='rgba(37,70,89,.18)';ctx.lineWidth=.85;
  for(let lon=-180;lon<180;lon+=15){ctx.beginPath();let drawing=false;for(let lat=-85;lat<=85;lat+=2){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(drawing)ctx.lineTo(x,y);else{ctx.moveTo(x,y);drawing=true}}ctx.stroke()}
  for(let lat=-75;lat<=75;lat+=15){ctx.beginPath();let drawing=false;for(let lon=-180;lon<=180;lon+=2){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(drawing)ctx.lineTo(x,y);else{ctx.moveTo(x,y);drawing=true}}ctx.stroke()}
  for(const geometry of topology.objects.countries.geometries)for(const polygon of socialPolygonRings(topology,geometry)){ctx.beginPath();polygon.forEach(ring=>socialTrace(ctx,ring,project));ctx.fillStyle='#e6e1d5';ctx.fill('evenodd');ctx.strokeStyle='rgba(38,60,68,.55)';ctx.lineWidth=1;ctx.stroke()}
  for(const city of cities){
    const[x,y,visible]=project([city.lon,city.lat]);if(visible<=0)continue;
    ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fillStyle='rgba(214,160,72,.24)';ctx.fill();
    ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle='#c9933e';ctx.fill();ctx.strokeStyle='#fff9eb';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,sphereRadius,0,Math.PI*2);ctx.strokeStyle='rgba(222,185,121,.72)';ctx.lineWidth=2;ctx.stroke();
  const shade=ctx.createLinearGradient(0,0,socialWidth,0);shade.addColorStop(0,'#051e39');shade.addColorStop(.29,'#051e39');shade.addColorStop(.41,'rgba(5,30,57,.87)');shade.addColorStop(.54,'rgba(5,30,57,.30)');shade.addColorStop(.69,'rgba(5,30,57,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,socialWidth,socialHeight);
  ctx.save();ctx.shadowColor='rgba(0,10,28,.25)';ctx.shadowBlur=22;ctx.shadowOffsetY=4;ctx.textBaseline='alphabetic';
  ctx.fillStyle='#f7f6f2';ctx.font='800 74px "Roboto Slab", Georgia, serif';ctx.fillText('Let Europe be',60,216);
  ctx.font='800 116px "Roboto Slab", Georgia, serif';ctx.fillText('your',60,326);
  ctx.fillStyle='#d7ad68';ctx.font='800 95px "Roboto Slab", Georgia, serif';ctx.fillText('laboratory',60,425);
  ctx.restore();
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
  try{await document.fonts.load('800 95px "Roboto Slab"')}catch(error){console.warn('Using fallback headline font.',error)}
  drawSocialArt(topology,cities);
  window.EUGASocialArt={pngBlob:socialPngBlob,cityCount:cities.length,missingCities:missing,source};
  window.__SOCIAL_READY__=true;
}
initSocialArt().catch(error=>console.error('Unable to render social sharing image.',error));
