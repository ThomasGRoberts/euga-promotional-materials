const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search);
const direction=params.get('direction')==='atlas'?'atlas':'globe';
const app=$('#app');app.dataset.direction=direction;
document.querySelectorAll('.preview-tools a').forEach(link=>{if(link.href.includes(`direction=${direction}`))link.setAttribute('aria-current','page')});
const state={data:null,topology:null};
const globeDefaults={longitude:-1.3947656250000033,latitude:29.512031250000074,roll:8,zoom:2.126400000000008,perspective:1.4,x:-257,y:309,lineWeight:.7,labelScale:.95};
const globe={...globeDefaults};
const controlDefinitions=[
  ['longitude','Orientation E/W',-45,45,1,'°'],
  ['latitude','Orientation N/S',20,70,1,'°'],
  ['roll','Roll angle',-45,45,1,'°'],
  ['zoom','Zoom level',.55,3,.01,'×'],
  ['perspective','Perspective',0,1.4,.01,''],
  ['x','Horizontal position',-800,800,1,' px'],
  ['y','Vertical position',-600,600,1,' px'],
  ['lineWeight','Line weight',.5,2,.05,'×'],
  ['labelScale','Label scale',.7,1.5,.05,'×']
];
try{const saved=JSON.parse(localStorage.getItem('euga-globe-preset')||'null');if(saved)Object.keys(globe).forEach(key=>{if(Number.isFinite(saved[key]))globe[key]=saved[key]})}catch{}

function controlDefinition(key){return controlDefinitions.find(definition=>definition[0]===key)}
function setGlobeValue(key,value){
  const definition=controlDefinition(key);if(!definition)return;
  const[,label,min,max,step,suffix]=definition;globe[key]=Math.max(min,Math.min(max,value));
  const input=$(`#globe-${key}`),output=$(`#globe-${key}-value`);
  if(input)input.value=globe[key];
  if(output)output.textContent=`${Number(globe[key]).toFixed(step<.1?2:0)}${suffix}`;
}

function setupGlobeControls(){
  const panel=$('#globe-controls');if(direction!=='globe'){panel.hidden=true;return}
  const grid=$('#control-grid');
  controlDefinitions.forEach(([key,label,min,max,step,suffix])=>{
    const wrapper=document.createElement('div');wrapper.className='control';
    wrapper.innerHTML=`<label for="globe-${key}">${label}</label><output id="globe-${key}-value" for="globe-${key}"></output><input id="globe-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${globe[key]}">`;
    const input=wrapper.querySelector('input'),output=wrapper.querySelector('output');
    const updateValue=()=>{output.textContent=`${Number(globe[key]).toFixed(step<.1?2:0)}${suffix}`};updateValue();
    input.addEventListener('input',()=>{setGlobeValue(key,Number(input.value));drawGeography()});grid.appendChild(wrapper);
  });
  $('#reset-globe').addEventListener('click',()=>{Object.entries(globeDefaults).forEach(([key,value])=>setGlobeValue(key,value));drawGeography()});
  $('#save-globe').addEventListener('click',()=>{localStorage.setItem('euga-globe-preset',JSON.stringify(globe));$('#save-globe').textContent='Saved';setTimeout(()=>{$('#save-globe').textContent='Save preset'},1600)});
  $('#copy-globe').addEventListener('click',async()=>{
    const value=JSON.stringify(globe),field=$('#preset-output');field.hidden=false;field.value=value;field.focus();field.select();field.setSelectionRange(0,value.length);
    let copied=false;try{copied=document.execCommand('copy')}catch{}
    if(!copied&&navigator.clipboard){try{await navigator.clipboard.writeText(value);copied=true}catch{}}
    $('#copy-globe').textContent=copied?'Copied':'Selected—press ⌘C';
    setTimeout(()=>{$('#copy-globe').textContent='Copy preset'},2200);
  });
  $('#preset-output').addEventListener('click',event=>event.currentTarget.select());
}

function setupDirectManipulation(){
  if(direction!=='globe')return;
  const canvas=$('#geo-canvas');let dragging=false,lastX=0,lastY=0,gesture='rotate';
  canvas.addEventListener('pointerdown',event=>{
    dragging=true;lastX=event.clientX;lastY=event.clientY;
    gesture=event.shiftKey?'move':event.altKey?'roll':'rotate';
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;
    if(gesture==='move'){setGlobeValue('x',globe.x+dx);setGlobeValue('y',globe.y+dy)}
    else if(gesture==='roll'){setGlobeValue('roll',globe.roll+dx*.16)}
    else{setGlobeValue('longitude',globe.longitude-dx*.14);setGlobeValue('latitude',globe.latitude+dy*.12)}
    drawGeography();event.preventDefault();
  });
  const endDrag=event=>{if(!dragging)return;dragging=false;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);canvas.classList.remove('is-dragging')};
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('wheel',event=>{setGlobeValue('zoom',globe.zoom-event.deltaY*.0008);drawGeography();event.preventDefault()},{passive:false});
  canvas.addEventListener('dblclick',()=>$('#reset-globe').click());
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
}

async function loadJson(path){const response=await fetch(path);if(!response.ok)throw new Error(`${path}: ${response.status}`);return response.json()}
function unique(values){return[...new Set(values)]}
function renderText(data){
  const cities=data.cities||[],courses=data.courses||[],countries=unique(cities.map(city=>city.country));
  $('#city-count').textContent=cities.length;$('#country-count').textContent=countries.length;$('#course-count').textContent=courses.length;
  $('#city-list').textContent=cities.map(city=>city.city).join(' · ');
  $('#course-list').innerHTML=courses.map(course=>`<li>${course.title} <small>${course.code}</small></li>`).join('');
  const action=data.program?.ctaUrl;if(action){$('#cta').hidden=false;$('#cta').href=action}
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
function nearestNetwork(cities){
  if(!cities.length)return[];const connected=[0],remaining=new Set(cities.map((_,i)=>i).slice(1)),edges=[];
  while(remaining.size){let best=null;for(const a of connected)for(const b of remaining){const dx=(cities[a].lon-cities[b].lon)*Math.cos((cities[a].lat+cities[b].lat)*Math.PI/360),dy=cities[a].lat-cities[b].lat,d=dx*dx+dy*dy;if(!best||d<best.d)best={a,b,d}}edges.push([best.a,best.b]);connected.push(best.b);remaining.delete(best.b)}
  return edges;
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
  if(isGlobe){ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle='#f7f7f4';ctx.fill();ctx.strokeStyle='rgba(5,30,57,.55)';ctx.lineWidth=1.15*globe.lineWeight;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip()}
  drawGraticule(ctx,projection,isGlobe);
  const geometries=state.topology.objects.countries.geometries;
  for(const geometry of geometries)for(const polygon of geometryRings(state.topology,geometry)){ctx.beginPath();polygon.forEach(ring=>traceVisibleRing(ctx,ring,project));if(isGlobe){ctx.fillStyle='#efefeb';ctx.fill('evenodd')}ctx.strokeStyle='rgba(32,32,32,.43)';ctx.lineWidth=.62*(isGlobe?globe.lineWeight:1);ctx.stroke()}
  const cities=state.data.cities||[],edges=nearestNetwork(cities);
  for(const[a,b]of edges){const p1=project([cities[a].lon,cities[a].lat]),p2=project([cities[b].lon,cities[b].lat]);ctx.beginPath();ctx.moveTo(p1[0],p1[1]);ctx.quadraticCurveTo((p1[0]+p2[0])/2,(p1[1]+p2[1])/2-7,p2[0],p2[1]);ctx.strokeStyle='rgba(5,30,57,.53)';ctx.lineWidth=isGlobe?globe.lineWeight:1;ctx.stroke()}
  cities.forEach(city=>{const[x,y,z]=project([city.lon,city.lat]);if(z<=0)return;ctx.beginPath();ctx.arc(x,y,3.2,0,Math.PI*2);ctx.fillStyle='#b39051';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.stroke()});
  const labels=['Amsterdam','Paris','Brussels','Geneva','Berlin','Munich','Vienna','Bucharest'];const offsets={Amsterdam:[-7,-12,'right'],Paris:[-8,13,'right'],Brussels:[-8,-4,'right'],Geneva:[-8,14,'right'],Berlin:[8,-8,'left'],Munich:[8,12,'left'],Vienna:[8,-7,'left'],Bucharest:[9,2,'left']};
  cities.filter(city=>labels.includes(city.city)).forEach(city=>{const[x,y]=project([city.lon,city.lat]),[dx,dy,align]=offsets[city.city],labelSize=9*(isGlobe?globe.labelScale:1);ctx.fillStyle='#333';ctx.font=`500 ${labelSize}px Roboto, Arial, sans-serif`;ctx.textAlign=align;ctx.fillText(city.city,x+dx,y+dy)});
  ctx.restore();
  window.__EUGA_RENDER_READY__=true;document.documentElement.dataset.renderReady='true';
}
setupGlobeControls();
setupDirectManipulation();
Promise.all([loadJson('data/program.json'),loadJson('assets/countries-110m.json')]).then(([data,topology])=>{state.data=data;state.topology=topology;renderText(data);requestAnimationFrame(drawGeography)}).catch(error=>console.error(error));
