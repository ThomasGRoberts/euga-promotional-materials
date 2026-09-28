const $=selector=>document.querySelector(selector);
const direction='globe';
const app=$('#app');app.dataset.direction=direction;
const state={data:null,topology:null};
const globeDefaults={longitude:-0.059843750000003776,latitude:28.265625000000096,roll:8,zoom:2.15,perspective:1.42,x:-257,y:275,lineWeight:.7,labelScale:1.15};
const globe={...globeDefaults};
const sheetBase='https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pub';
const sheetTabs={text:'1338367530',cities:'0',courses:'753875659'};

async function loadJson(path){const response=await fetch(path);if(!response.ok)throw new Error(`${path}: ${response.status}`);return response.json()}
function parseCsv(source){
  const rows=[];let row=[],field='',quoted=false;
  for(let index=0;index<source.length;index++){
    const character=source[index];
    if(quoted){if(character==='"'&&source[index+1]==='"'){field+='"';index++}else if(character==='"')quoted=false;else field+=character}
    else if(character==='"')quoted=true;
    else if(character===','){row.push(field);field=''}
    else if(character==='\n'){row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);row=[];field=''}
    else field+=character;
  }
  row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);
  return rows;
}
function csvObjects(source){
  const rows=parseCsv(source);if(!rows.length)return[];
  const headers=rows.shift().map((header,index)=>(index?header:header.replace(/^\uFEFF/,'')).trim());
  return rows.map(row=>Object.fromEntries(headers.map((header,index)=>[header,(row[index]||'').trim()])));
}
async function loadSheetTab(gid){
  const response=await fetch(`${sheetBase}?output=csv&gid=${gid}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Google Sheet tab ${gid}: ${response.status}`);
  return csvObjects(await response.text());
}
async function loadPublishedSheet(fallback){
  const [textRows,cityRows,courseRows]=await Promise.all([
    loadSheetTab(sheetTabs.text),loadSheetTab(sheetTabs.cities),loadSheetTab(sheetTabs.courses)
  ]);
  const text=Object.fromEntries(textRows.filter(row=>row.Key).map(row=>[row.Key,row.Value]));
  const knownCities=new Map((fallback.cities||[]).map(city=>[city.city.toLowerCase(),city]));
  const cities=cityRows.map(row=>{
    const city=row.City||'',known=knownCities.get(city.toLowerCase())||{};
    return{...known,city,country:row.Country||known.country||'',category:row.Category||known.category||''};
  }).filter(city=>city.city);
  const courses=courseRows.map(row=>({code:row.Code||'',title:row.Course||''})).filter(course=>course.title);
  return{...fallback,text,cities:cities.length?cities:fallback.cities,courses:courses.length?courses:fallback.courses};
}
function unique(values){return[...new Set(values)]}
function renderText(data){
  const cities=data.cities||[],courses=data.courses||[],countries=unique(cities.map(city=>city.country));
  const program=data.program||{},text=data.text||{};
  const setText=(id,value)=>{const element=$(`#${id}`);if(element&&value)element.textContent=value};
  $('#city-count').textContent=cities.length;$('#country-count').textContent=countries.length;$('#course-count').textContent=courses.length;
  const courseList=$('#course-list');courseList.replaceChildren(...courses.map(course=>{const item=document.createElement('li'),title=document.createElement('strong'),code=document.createElement('span');title.textContent=course.title;code.textContent=course.code;item.append(title,code);return item}));
  setText('program-term',text.program_term||(program.year?`Summer ${program.year}`:''));
  setText('hero-line-1',text.hero_line_1);setText('hero-line-2',text.hero_line_2);
  setText('intro-sentence-1',text.intro_sentence_1);setText('intro-sentence-2',text.intro_sentence_2);
  setText('credentials-heading',text.credentials_heading);setText('certificate-title',text.certificate_title);
  setText('certificate-detail',text.certificate_detail);setText('minor-title',text.minor_title);
  setText('minor-detail',text.minor_detail);setText('courses-heading',text.courses_heading);
  $('#cta').href=text.website_url||'https://inta.gatech.edu/europeglobal';
  $('#cta').textContent=text.website_display||'inta.gatech.edu/europeglobal';
  const qr=$('.program-qr');
  if(qr)qr.src=$('#cta').href==='https://inta.gatech.edu/europeglobal'?'assets/program-website-europeglobal-qr.png':'assets/program-website-qr.png';
}
function decodeArc(topology,index){
  const reversed=index<0,arc=topology.arcs[reversed?~index:index],scale=topology.transform?.scale||[1,1],translate=topology.transform?.translate||[0,0];
  let x=0,y=0;const points=arc.map(pair=>{x+=pair[0];y+=pair[1];return[x*scale[0]+translate[0],y*scale[1]+translate[1]]});return reversed?points.reverse():points;
}
function geometryRings(topology,geometry){
  const polygon=rings=>rings.map(ring=>ring.flatMap((arcIndex,i)=>{const points=decodeArc(topology,arcIndex);return i?points.slice(1):points}));
  if(geometry.type==='Polygon')return[polygon(geometry.arcs)];
  if(geometry.type==='MultiPolygon')return geometry.arcs.map(polygon);
  return[];
}
function globeProjection(width,height){
  const lon0=globe.longitude*Math.PI/180,lat0=globe.latitude*Math.PI/180,roll=globe.roll*Math.PI/180,radius=Math.min(width,height)*globe.zoom,cx=width*.6+globe.x,cy=height*.52+globe.y;
  const perspectiveDistance=globe.perspective>0?1+1/globe.perspective:Infinity;
  const visibilityCutoff=Number.isFinite(perspectiveDistance)?1/perspectiveDistance:0;
  const project=([lonDeg,latDeg])=>{const lon=lonDeg*Math.PI/180,lat=latDeg*Math.PI/180,dl=lon-lon0,rawX=Math.cos(lat)*Math.sin(dl),rawY=Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(dl),z=Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(dl),factor=Number.isFinite(perspectiveDistance)?(perspectiveDistance-1)/(perspectiveDistance-z):1,x=(rawX*Math.cos(roll)-rawY*Math.sin(roll))*factor,y=(rawX*Math.sin(roll)+rawY*Math.cos(roll))*factor;return[cx+radius*x,cy-radius*y,z-visibilityCutoff]};
  const horizonScale=Number.isFinite(perspectiveDistance)?Math.sqrt((perspectiveDistance-1)/(perspectiveDistance+1)):1;
  return{project,cx,cy,radius:radius*horizonScale};
}
function atlasProjection(width,height){
  const lon0=10*Math.PI/180,lat0=49*Math.PI/180,scale=Math.min(width/.9,height/.7),cx=width*.5,cy=height*.53;
  const project=([lonDeg,latDeg])=>{const lon=lonDeg*Math.PI/180,lat=latDeg*Math.PI/180,dl=lon-lon0,den=1+Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(dl),k=Math.sqrt(2/Math.max(.01,den));return[cx+scale*k*Math.cos(lat)*Math.sin(dl),cy-scale*k*(Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(dl)),1]};
  return{project,cx,cy,radius:Math.min(width,height)*.43};
}
function traceVisibleRing(ctx,ring,project){
  let drawing=false;for(const point of ring){const[x,y,z]=project(point);if(z<=.02){drawing=false;continue}if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y)}
}
function drawGraticule(ctx,projection,isGlobe){
  const {project}=projection;ctx.strokeStyle=isGlobe?'rgba(5,30,57,.11)':'rgba(5,30,57,.08)';ctx.lineWidth=.65;
  for(let lon=-20;lon<=40;lon+=10){ctx.beginPath();let drawing=false;for(let lat=25;lat<=70;lat+=.5){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y)}ctx.stroke()}
  for(let lat=30;lat<=65;lat+=5){ctx.beginPath();let drawing=false;for(let lon=-30;lon<=50;lon+=.5){const[x,y,z]=project([lon,lat]);if(z<=0){drawing=false;continue}if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y)}ctx.stroke()}
}
function drawGeography(){
  if(!state.data||!state.topology)return;const canvas=$('#geo-canvas'),rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),width=rect.width,height=rect.height;
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const isGlobe=direction==='globe',projection=isGlobe?globeProjection(width,height):atlasProjection(width,height),{project,cx,cy,radius}=projection;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
  if(isGlobe){ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='rgba(5,30,57,.55)';ctx.lineWidth=1.15*globe.lineWeight;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip()}
  drawGraticule(ctx,projection,isGlobe);
  const geometries=state.topology.objects.countries.geometries;
  for(const geometry of geometries)for(const polygon of geometryRings(state.topology,geometry)){ctx.beginPath();polygon.forEach(ring=>traceVisibleRing(ctx,ring,project));if(isGlobe){ctx.fillStyle='#efefeb';ctx.fill('evenodd')}ctx.strokeStyle='rgba(32,32,32,.43)';ctx.lineWidth=.62*(isGlobe?globe.lineWeight:1);ctx.stroke()}
  const cities=state.data.cities||[];
  cities.filter(city=>Number.isFinite(city.lon)&&Number.isFinite(city.lat)).forEach(city=>{const[x,y,z]=project([city.lon,city.lat]);if(z<=0)return;ctx.beginPath();ctx.arc(x,y,3.2,0,Math.PI*2);ctx.fillStyle='#b39051';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.stroke()});
  const labels=['Amsterdam','Paris','Brussels','Geneva','Berlin','Munich','Vienna','Bucharest','Bern'];
  const offsets={Amsterdam:[-7,-10,'right'],Paris:[-8,7,'right'],Brussels:[-8,-5,'right'],Geneva:[-8,16,'right'],Berlin:[8,-5,'left'],Munich:[8,10,'left'],Vienna:[8,-5,'left'],Bucharest:[9,4,'left'],Bern:[8,12,'left']};
  cities.filter(city=>labels.includes(city.city)&&Number.isFinite(city.lon)&&Number.isFinite(city.lat)).forEach(city=>{const[x,y]=project([city.lon,city.lat]),[dx,dy,align]=offsets[city.city],labelSize=12*(isGlobe?globe.labelScale:1);ctx.fillStyle='#333';ctx.font=`500 ${labelSize}px Roboto, Arial, sans-serif`;ctx.textAlign=align;ctx.fillText(city.city,x+dx,y+dy)});
  ctx.restore();
  window.__EUGA_RENDER_READY__=true;document.documentElement.dataset.renderReady='true';
}
Promise.all([loadJson('data/program.json'),loadJson('assets/countries-110m.json')]).then(async([fallback,topology])=>{
  state.topology=topology;
  try{state.data=await loadPublishedSheet(fallback);document.documentElement.dataset.contentSource='sheet'}catch(error){console.warn('Using local content fallback.',error);state.data=fallback;document.documentElement.dataset.contentSource='fallback'}
  renderText(state.data);
  drawGeography();
  requestAnimationFrame(drawGeography);
}).catch(error=>console.error(error));
