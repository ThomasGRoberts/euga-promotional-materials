const citySheetUrl='https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pub?output=csv&gid=0';
const currentCityFallback=['Brussels','Geneva','Paris','Bucharest','Berlin','Bern','Vienna'];
const mapCanvas=document.querySelector('#tv-map');
let mapTopology=null,programCities=[];

function parseCsv(source){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<source.length;i++){const c=source[i];if(quoted){if(c==='"'&&source[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);row=[];field=''}else field+=c}row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);return rows}
function decodeArc(topology,index){const raw=topology.arcs[index<0?~index:index],scale=topology.transform.scale,translate=topology.transform.translate;let x=0,y=0;const points=raw.map(pair=>{x+=pair[0];y+=pair[1];return[x*scale[0]+translate[0],y*scale[1]+translate[1]]});return index<0?points.reverse():points}
function polygonRings(topology,geometry){const ring=indices=>indices.flatMap((index,i)=>{const points=decodeArc(topology,index);return i?points.slice(1):points});return geometry.type==='Polygon'?[geometry.arcs.map(ring)]:geometry.type==='MultiPolygon'?geometry.arcs.map(polygon=>polygon.map(ring)):[]}

function drawMap(){
  if(!mapTopology)return;
  const rect=mapCanvas.getBoundingClientRect(),width=rect.width,height=rect.height,dpr=Math.min(devicePixelRatio||1,2),ctx=mapCanvas.getContext('2d');
  mapCanvas.width=Math.round(width*dpr);mapCanvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const scale=Math.min(width/29,height/25),cos50=Math.cos(50*Math.PI/180),project=([lon,lat])=>[width*.51+(lon-12)*cos50*scale,height*.51-(lat-49)*scale];
  ctx.lineWidth=1;ctx.strokeStyle='rgba(82,76,66,.10)';
  for(let lon=-10;lon<=40;lon+=10){const[x]=project([lon,49]);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}
  for(let lat=35;lat<=65;lat+=5){const[,y]=project([12,lat]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
  for(const geometry of mapTopology.objects.countries.geometries)for(const polygon of polygonRings(mapTopology,geometry)){
    const exterior=polygon[0];if(!exterior?.length)continue;
    const lons=exterior.map(point=>point[0]),lats=exterior.map(point=>point[1]);
    if(Math.max(...lons)<-13||Math.min(...lons)>38||Math.max(...lats)<30||Math.min(...lats)>68||Math.max(...lons)-Math.min(...lons)>180)continue;
    ctx.beginPath();for(const ring of polygon){ring.forEach((point,index)=>{const[x,y]=project(point);if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.closePath()}
    ctx.fillStyle='#dcd7cb';ctx.fill('evenodd');ctx.strokeStyle='rgba(120,111,96,.64)';ctx.lineWidth=1.1;ctx.stroke();
  }
  for(const city of programCities){const[x,y]=project([city.lon,city.lat]);ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fillStyle='rgba(155,115,50,.24)';ctx.fill();ctx.beginPath();ctx.arc(x,y,6.5,0,Math.PI*2);ctx.fillStyle='#ac7b30';ctx.fill();ctx.strokeStyle='#fffaf0';ctx.lineWidth=1.8;ctx.stroke()}
  mapCanvas.dataset.cityCount=programCities.length;window.__EUGA_HALLWAY_READY__=true;
}

async function initMap(){
  const [topology,snapshot]=await Promise.all([fetch('assets/countries-110m.json').then(response=>response.json()),fetch('data/program.json').then(response=>response.json())]);mapTopology=topology;
  const known=new Map(snapshot.cities.map(city=>[city.city,city]));let names=currentCityFallback;
  try{const response=await fetch(citySheetUrl,{cache:'no-store'});if(!response.ok)throw Error(response.status);const rows=parseCsv(await response.text()),headers=rows.shift(),cityIndex=headers.indexOf('City');if(cityIndex<0)throw Error('City column missing');names=rows.map(row=>row[cityIndex]).filter(Boolean)}catch(error){console.warn('Using current-city snapshot for signage map.',error)}
  programCities=names.map(name=>known.get(name)).filter(city=>city&&Number.isFinite(city.lat)&&Number.isFinite(city.lon));
  if(programCities.length!==names.length)console.warn('Missing map coordinates for:',names.filter(name=>!known.has(name)));
  drawMap();window.addEventListener('resize',drawMap);
}
initMap();
