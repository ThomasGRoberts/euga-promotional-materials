const sheetBase='https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pub';
const gids={text:'1338367530',cities:'0',courses:'753875659',faculty:'1239199803',institutions:'1659852286'};
const citySlugs={'Luxembourg City':'luxembourg-city','The Hague':'the-hague'};
const params=new URLSearchParams(location.search);
const presentationMode=params.get('present')==='1';
document.documentElement.dataset.materialMode=presentationMode?'presentation':'carousel';
const autoplayMode=!presentationMode&&params.get('autoplay')!=='0';
const galleryUrl='https://www.instagram.com/gteu_studyabroad';
const programUrl='https://sites.gatech.edu/gt-eu-summer/';
const aboutUrl=programUrl+'about/';
const exploreUrl=programUrl+'explore/';
function cityExploreUrl(city){return exploreUrl+'#city='+encodeURIComponent(city)}
function navigatePage(url){if(window.top&&window.top!==window)window.top.location.href=url;else location.href=url}
function facultyPageUrl(person){const profile=(person.Link||person['University profile URL']||'').toLowerCase(),name=(person.Name||person['Full name']||'').toLowerCase(),id=(person['Faculty ID']||'').toLowerCase();let slug=id||profile.split('/').filter(Boolean).pop()||'';if(profile.includes('vicki-birchfield')||name.includes('vicki'))slug='vicki-birchfield';else if(profile.includes('thomasgr')||id==='thomas-gonzalez-roberts'||name.includes('thomas'))slug='thomasgr';else if(profile.includes('1f6a6f21-01fa-5e42-88d2-83a7cd378f57')||name.includes('carly'))slug='carly-potz-nielsen';else if(profile.includes('eliza')||name.includes('eliza'))slug='eliza-maria-markley';return programUrl+'faculty/#euga-person-'+slug.replace(/[^a-z0-9-]/g,'-')}
function cityAtBannerPoint(event){const canvas=document.querySelector('#globe'),rect=canvas.getBoundingClientRect(),projection=globeProjection(rect.width,rect.height),x=event.clientX-rect.left,y=event.clientY-rect.top;let nearest=null,distance=Infinity;globeState.cities.forEach(city=>{const[px,py,visible]=projection.project([city.lon,city.lat]);if(visible<=0)return;const delta=Math.hypot(px-x,py-y);if(delta<distance){nearest=city;distance=delta}});return distance<=Math.max(22,Math.min(38,Math.min(rect.width,rect.height)*.03))?nearest:null}
function setHoveredCity(city,slide){const hovered=city?city.city:null;if(globeState.hoveredCity===hovered)return;globeState.hoveredCity=hovered;document.querySelectorAll('.overview.has-city-hover').forEach(node=>node.classList.remove('has-city-hover'));if(hovered&&slide?.classList.contains('overview'))slide.classList.add('has-city-hover');drawGlobe()}
const galleryPhotos=[
  ['photos/past-program/2023-canal-group.jpg','Students together during the 2023 program'],
  ['photos/past-program/2023-city-group.jpg','Students exploring a European city in 2023'],
  ['photos/past-program/2023-mountain-group.jpg','Students at a mountain overlook in 2023'],
  ['photos/past-program/2024-eu-group.jpg','The 2024 group at a European Union visit'],
  ['photos/past-program/2024-bucharest-group.jpg','The 2024 group in Bucharest'],
  ['photos/past-program/2023-program-group.jpeg','The 2023 program group']
];
const facultyPhotos={'vicki-birchfield':'assets/faculty/vicki-birchfield.jpg','1f6a6f21-01fa-5e42-88d2-83a7cd378f57':'assets/faculty/carly-potz-nielsen.jpg','thomasgr':'assets/faculty/thomas-roberts.jpg','eliza-maria-markley':'assets/faculty/eliza-markley.jpg'};
const facultyPositions={'vicki-birchfield':'center 34%','1f6a6f21-01fa-5e42-88d2-83a7cd378f57':'center 30%','thomasgr':'center center','eliza-maria-markley':'center 34%'};
const fallbackText={program_title:'European Union and Global Affairs Study Abroad Program',program_term:'Summer 2027',hero_line_1:'Let Europe be',hero_line_2:'your laboratory',intro_sentence_1:'takes you to the cities and institutions shaping Europe and the world.',intro_sentence_2:'Study global affairs where they happen in',website_url:'https://inta.gatech.edu/europeglobal',website_display:'inta.gatech.edu/europeglobal'};
const qrTarget='https://inta.gatech.edu/europeglobal';
const fallbackFaculty=[{Name:'Dr. Vicki Birchfield','Program Title':'Director',Link:'https://inta.gatech.edu/people/person/vicki-birchfield'},{Name:'Dr. Carly Potz-Nielsen','Program Title':'',Link:'https://inta.gatech.edu/people/person/1f6a6f21-01fa-5e42-88d2-83a7cd378f57'},{Name:'Dr. Thomas González Roberts','Program Title':'',Link:'https://inta.gatech.edu/people/person/thomasgr'},{Name:'Dr. Eliza Markley','Program Title':'',Link:'https://inta.gatech.edu/people/person/eliza-maria-markley'}];
function facultyDisplayName(name,honorific='Dr.'){return `${honorific} ${name.replace(/^(?:(?:Prof(?:essor)?|Dr|Doctor)\.?\s+)+/i,'').trim()}`}

function parseCsv(source){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<source.length;i++){const c=source[i];if(quoted){if(c==='"'&&source[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()))rows.push(row);row=[];field=''}else field+=c}row.push(field.replace(/\r$/,''));if(row.some(v=>v.trim()))rows.push(row);return rows}
function objects(source){const rows=parseCsv(source),headers=(rows.shift()||[]).map((v,i)=>(i?v:v.replace(/^\uFEFF/,'')).trim());return rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,(row[i]||'').trim()]))) }
async function sheet(gid){const response=await fetch(`${sheetBase}?output=csv&gid=${gid}`,{cache:'no-store'});if(!response.ok)throw Error(response.status);return objects(await response.text())}
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function programBrand(){const brand=el('img','program-brand');brand.dataset.brandLogo='';brand.src=window.EUGABranding?.logoSrc()||'assets/branding/program-wordmark.svg';brand.alt='EU and Global Affairs Study Abroad Program';return brand}
function presentationBrand(){const wrap=el('div','presentation-logo');wrap.append(programBrand());return wrap}
function presentationTitleBrand(){return presentationBrand()}
function qrImage(className,display,url){const qr=el('img',className);qr.alt=`QR code for ${display}`;qr.dataset.qrTarget=url;try{const code=qrcodegen.QrCode.encodeText(url,qrcodegen.QrCode.Ecc.MEDIUM),margin=4,size=code.size+margin*2,paths=[];for(let y=0;y<code.size;y++)for(let x=0;x<code.size;x++)if(code.getModule(x,y))paths.push(`M${x+margin},${y+margin}h1v1h-1z`);const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#051e39" d="${paths.join(' ')}"/></svg>`;qr.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}catch(error){console.warn('Unable to generate application QR code.',error);if(url===qrTarget)qr.src='assets/program-website-europeglobal-qr-transparent.png'}return qr}

function applicationSlide(text){const slide=el('section','slide application-slide'),copy=el('div','application-copy'),url=text.website_url||fallbackText.website_url,display=text.website_display||fallbackText.website_display,link=el('a','application-link',display);link.href=url;link.target='_blank';link.rel='noreferrer';link.addEventListener('click',event=>event.stopPropagation());copy.append(el('p','eyebrow',text.program_term),el('h1','',text.application_heading||'Apply Now'),el('p','application-instruction',text.application_instruction||'Visit the program website or scan the code to open it on your phone.'),link);const frame=el('div','application-qr-frame');frame.append(qrImage('application-qr',display,url),el('p','application-qr-caption',text.application_qr_caption||'Scan to Learn More'));slide.append(copy,frame);slide.dataset.focus='application';return slide}
function overviewSlide(text,cities,courses){const slide=el('section','slide overview'),copy=el('div','overview-copy'),title=el('h1');title.append(el('span','overview-line-one',text.hero_line_1||fallbackText.hero_line_1),el('span','overview-line-two',text.hero_line_2||fallbackText.hero_line_2));const description=el('p','overview-description'),program=el('strong','',`The ${text.program_title}`);description.append(program,document.createTextNode(` ${text.intro_sentence_1||fallbackText.intro_sentence_1} ${text.intro_sentence_2||fallbackText.intro_sentence_2} `),el('strong','',`${text.program_term}.`));copy.append(title,description);if(presentationMode){const featured=cities.filter(city=>EUGACities.isFeatured(city.featured));copy.append(el('p','cover-city-list',featured.map(city=>city.city).join(' · ')))}if(!presentationMode){const link=el('a','overview-link','Learn more');link.href=aboutUrl;link.target='_top';link.append(el('span','overview-link-arrow','→'));link.setAttribute('aria-label','Learn more about the program');link.addEventListener('click',event=>event.stopPropagation());copy.append(link);slide.addEventListener('click',event=>{if(matchMedia('(hover:none) and (pointer:coarse)').matches)return;const city=cityAtBannerPoint(event);if(city){event.preventDefault();event.stopPropagation();navigatePage(cityExploreUrl(city.city))}})}const stats=el('div','overview-stats');[[cities.length,'cities'],[new Set(cities.map(c=>c.country)).size,'countries'],[courses.length,'courses']].forEach(([number,label])=>{const box=el('div');box.append(el('strong','',number),el('span','',label));stats.append(box)});if(presentationMode)slide.append(presentationTitleBrand());slide.append(copy,stats);slide.dataset.focus='europe';return slide}
function curriculumSlide(text,courses){const slide=el('section','slide curriculum-slide'),heading=el('div','curriculum-heading'),title=el('h1');const headingText=text.credentials_heading||'Make the summer count',parts=headingText.match(/^(.*\s)(\S+)$/);if(parts)title.append(document.createTextNode(parts[1]),el('span','',parts[2]));else title.textContent=headingText;heading.append(el('p','eyebrow',text.courses_heading||'Four courses in global affairs'),title);const list=el('ol','curriculum-courses');courses.forEach(course=>{const item=el('li'),name=el('strong','',course.Course||course.title),code=el('span','',course.Code||course.code);item.append(name,code);list.append(item)});const credentials=el('div','curriculum-credentials');[[text.certificate_title||'Earn a Certificate in European Studies',text.certificate_detail||"with the program's four courses"],[text.minor_title||'Complete the International Affairs minor',text.minor_detail||'with the program plus one additional course']].forEach(([name,detail])=>{const item=el('div','curriculum-credential');item.append(el('strong','',name),el('span','',detail));credentials.append(item)});if(!presentationMode){const link=el('a','curriculum-link','Courses, credits and certificates');link.href=aboutUrl+'#euga-section-courses-credits-certificates';link.target='_top';link.append(el('span','curriculum-link-arrow','→'));link.addEventListener('click',event=>event.stopPropagation());heading.append(link)}slide.append(heading,list,credentials);slide.dataset.focus='curriculum';return slide}
function portraitFor(link=''){const key=Object.keys(facultyPhotos).find(part=>link.includes(part));return facultyPhotos[key]||''}
function facultySlide(person){const slide=el('section','slide faculty-slide'),copy=el('div','faculty-copy');copy.append(el('p','eyebrow','Featured faculty'),el('div','rule'),el('h1','',person.Name),el('p','faculty-role',person['Program Title']||'Program faculty'));const link=el('a','faculty-link','Read faculty bio');link.append(el('span','faculty-link-arrow','→'));link.href=facultyPageUrl(person);link.target='_top';link.addEventListener('click',event=>event.stopPropagation());copy.append(link);const image=el('img','faculty-photo'),positionKey=Object.keys(facultyPositions).find(part=>person.Link.includes(part));image.src=portraitFor(person.Link);image.alt=person.Name;image.style.objectPosition=facultyPositions[positionKey]||'center 35%';slide.append(copy,image);slide.dataset.focus='faculty';return slide}
function facultyGroupSlide(people,text={}){const slide=el('section','slide faculty-group-slide'),heading=el('div','faculty-group-heading'),grid=el('div','faculty-group-grid');heading.append(el('p','eyebrow',text.faculty_eyebrow||'Program faculty'),el('h1','',text.faculty_heading||'Meet the Faculty'));people.forEach(person=>{const card=el('div','faculty-card'),image=el('img'),name=el('strong','',person.Name),role=el('span','',person['Program Title']||text.faculty_default_role||'Program faculty');image.src=portraitFor(person.Link);image.alt='';const positionKey=Object.keys(facultyPositions).find(part=>person.Link.includes(part));image.style.objectPosition=facultyPositions[positionKey]||'center 35%';card.append(image,name,role);grid.append(card)});slide.append(heading,grid);slide.dataset.focus='faculty';return slide}
function gallerySlide(){const slide=el('section','slide gallery-slide'),copy=el('div','gallery-copy'),title=el('h1');title.append(document.createTextNode('Picture yourself '),el('span','', 'in Europe'));const description=el('p','', 'Study, travel, and build a community across Europe. These moments come from the 2023 and 2024 programs.');const link=el('a','gallery-link','Visit us on Instagram');link.append(el('span','gallery-link-arrow','→'));link.href=galleryUrl;link.target='_blank';link.rel='noreferrer';link.addEventListener('click',event=>event.stopPropagation());copy.append(el('p','eyebrow','Student experience'),title,description,link);const grid=el('div','gallery-grid');galleryPhotos.slice(0,4).forEach(([src,alt])=>{const image=el('img');image.src=src;image.alt=alt;grid.append(image)});slide.append(copy,grid);slide.dataset.focus='gallery';return slide}
function citySlide(city,index,records){const slug=citySlugs[city.city]||city.city.toLowerCase().replaceAll(' ','-'),cityPhotos=records.filter(r=>r.city===slug&&r.role==='city'),slide=el('section','slide city-slide');const image=el('img','city-photo'),hero=cityPhotos[index%Math.max(cityPhotos.length,1)]||records.find(r=>r.city===slug);if(hero)image.src=`photos/${slug}/${hero.file}`;image.alt=`${city.city}, ${city.country}`;const copy=el('div','city-copy'),label=(city.category||'').toLowerCase()==='basecamp'?'Basecamp':'Featured excursion';copy.append(el('p','city-index',label),el('h1','',city.city),el('p','country',city.country));if(!presentationMode){const link=el('a','city-explore-link','Explore');link.href=cityExploreUrl(city.city);link.target='_top';link.append(el('span','city-explore-arrow','→'));link.addEventListener('click',event=>event.stopPropagation());copy.append(link)}slide.append(image,el('div','city-photo-shade'),copy);slide.dataset.focus='city';slide.dataset.city=city.city;slide.addEventListener('pointermove',event=>setHoveredCity(cityAtBannerPoint(event),slide));slide.addEventListener('pointerleave',()=>setHoveredCity(null,slide));return slide}
function siteSlide(site){const slide=el('section','slide site-slide'),image=el('img','site-photo'),copy=el('div','site-copy');copy.append(el('p','site-index','Featured site visit'),el('div','site-rule'),el('h1','site-name'),el('p','site-location'));if(!presentationMode){const link=el('a','site-explore-link','Explore');link.append(el('span','site-explore-arrow','→'));link.target='_top';link.addEventListener('click',event=>event.stopPropagation());copy.append(link)}slide.append(image,el('div','site-gold-panel'),copy,el('p','site-photo-caption'));slide.dataset.focus='site';updateSiteSlide(slide,site);return slide}
function fitSitePanel(slide){const title=slide.querySelector('.site-name'),copy=slide.querySelector('.site-copy'),panel=slide.querySelector('.site-gold-panel');if(!title)return;title.style.fontSize='';title.style.whiteSpace='nowrap';copy.style.width='max-content';copy.style.maxWidth='none';const titleWidth=title.scrollWidth,contentWidth=Math.max(titleWidth,slide.querySelector('.site-location').scrollWidth,slide.querySelector('.site-explore-link')?.scrollWidth||0),panelWidth=Math.min(innerWidth*.88,Math.max(innerWidth*.43,contentWidth+innerWidth*.15));panel.style.width=panelWidth+'px';copy.style.width=Math.max(180,panelWidth-innerWidth*.13)+'px';title.style.whiteSpace='normal';title.style.overflowWrap='normal';title.style.wordBreak='normal';title.style.hyphens='none'}
function updateSiteSlide(slide,site){slide.querySelector('.site-photo').src=site.photo;slide.querySelector('.site-photo').alt=`${site.institution}, ${site.city}, ${site.country}`;const title=slide.querySelector('.site-name');title.textContent=site.institution;title.style.whiteSpace='normal';title.style.overflowWrap='normal';title.style.wordBreak='normal';title.style.hyphens='none';slide.querySelector('.site-location').textContent=`${site.city}, ${site.country}`;slide.querySelector('.site-photo-caption').textContent=site.photo_caption||'';slide.dataset.institution=site.institution;slide.dataset.city=site.city;const exploreLink=slide.querySelector('.site-explore-link');if(exploreLink)exploreLink.href=cityExploreUrl(site.city);requestAnimationFrame(()=>fitSitePanel(slide))}

const globeState={lon:presentationMode?4:10,lat:49,targetLon:presentationMode?16:10,targetLat:49,activeCity:null,hoveredCity:null,cities:[],topology:null,last:0,frame:0};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function drawCityLabels(ctx,project,width,height){
  if(!presentationMode||slides[current]?.dataset.focus!=='europe')return;
  const compact=width<700,fontSize=compact?11:Math.max(13,Math.min(18,width/100)),boxHeight=compact?23:Math.max(27,fontSize+13),placed=[];
  ctx.font=`700 ${fontSize}px "DIN 2014 Local", Roboto, Arial, sans-serif`;
  const cities=globeState.cities.filter(city=>EUGACities.isFeatured(city.featured));
  for(const city of cities){
    const[x,y,visible]=project([city.lon,city.lat]);if(visible<=0||x<4||x>width-4||y<4||y>height-4)continue;
    const boxWidth=Math.ceil(ctx.measureText(city.city).width)+18;
    const offsets=city.city==='Bucharest'?[[-boxWidth-15,-boxHeight/2],[-boxWidth-15,-boxHeight-9]]:city.city==='Geneva'?[[-boxWidth-14,-boxHeight-13],[-boxWidth-14,10]]:[[14,-boxHeight/2],[-boxWidth-14,-boxHeight/2],[14,-boxHeight-10],[-boxWidth-14,10],[14,10],[-boxWidth-14,-boxHeight-10]];
    let box;
    for(const[dx,dy]of offsets){const left=x+dx,top=y+dy,candidate={left,top,right:left+boxWidth,bottom:top+boxHeight};if(left<4||candidate.right>width-4||top<4||candidate.bottom>height-4)continue;if(placed.some(other=>candidate.left<other.right+5&&candidate.right>other.left-5&&candidate.top<other.bottom+5&&candidate.bottom>other.top-5))continue;box=candidate;break}
    if(!box)continue;
    placed.push(box);
    const edgeX=Math.max(box.left,Math.min(x,box.right)),edgeY=Math.max(box.top,Math.min(y,box.bottom));
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(edgeX,edgeY);ctx.strokeStyle='rgba(5,30,57,.78)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(247,246,242,.94)';ctx.strokeStyle='rgba(5,30,57,.62)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(box.left,box.top,boxWidth,boxHeight,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#051e39';ctx.textBaseline='middle';ctx.fillText(city.city,box.left+9,box.top+boxHeight/2+1);
  }
}
function scheduleGlobeDraw(){if(globeState.frame)return;globeState.frame=requestAnimationFrame(animate)}
function decodeArc(topology,index){const reversed=index<0,arc=topology.arcs[reversed?~index:index],scale=topology.transform?.scale||[1,1],translate=topology.transform?.translate||[0,0];let x=0,y=0;const points=arc.map(pair=>{x+=pair[0];y+=pair[1];return[x*scale[0]+translate[0],y*scale[1]+translate[1]]});return reversed?points.reverse():points}
function geometryRings(topology,geometry){const polygon=rings=>rings.map(ring=>ring.flatMap((arcIndex,i)=>{const points=decodeArc(topology,arcIndex);return i?points.slice(1):points}));if(geometry.type==='Polygon')return[polygon(geometry.arcs)];if(geometry.type==='MultiPolygon')return geometry.arcs.map(polygon);return[]}
function globeProjection(width,height){const lon0=globeState.lon*Math.PI/180,lat0=globeState.lat*Math.PI/180,perspective=1.42,distance=1+1/perspective,cutoff=1/distance,isCity=slides[current]?.dataset.focus==='city',mobileOverview=matchMedia('(max-width:700px)').matches&&slides[current]?.dataset.focus==='europe',cx=width*(mobileOverview?.5:isCity?.79:.77),cy=height*(mobileOverview?.82:isCity?.69:.67),radius=Math.min(width,height)*(mobileOverview?2.5:2.15),horizon=Math.sqrt((distance-1)/(distance+1));const project=([lonDeg,latDeg])=>{const lon=lonDeg*Math.PI/180,lat=latDeg*Math.PI/180,dl=lon-lon0,rawX=Math.cos(lat)*Math.sin(dl),rawY=Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(dl),z=Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(dl),factor=(distance-1)/(distance-z);return[cx+radius*rawX*factor,cy-radius*rawY*factor,z-cutoff]};return{project,cx,cy,radius:radius*horizon}}
function trace(ctx,ring,project){let drawing=false;for(const point of ring){const[x,y,z]=project(point);if(z<=.01){drawing=false;continue}if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y)}}
function drawGlobe(){const canvas=document.querySelector('#globe');if(!globeState.topology)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),width=rect.width,height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const {project,cx,cy,radius}=globeProjection(width,height);ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle='#f1f0eb';ctx.fill();ctx.strokeStyle='rgba(5,30,57,.65)';ctx.lineWidth=1.2;ctx.stroke();ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();ctx.strokeStyle='rgba(5,30,57,.11)';ctx.lineWidth=.7;for(let lon=-180;lon<180;lon+=15){ctx.beginPath();let started=false;for(let lat=-80;lat<=80;lat+=2){const[x,y,z]=project([lon,lat]);if(z<=0){started=false;continue}started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true)}ctx.stroke()}for(let lat=-75;lat<=75;lat+=15){ctx.beginPath();let started=false;for(let lon=-180;lon<=180;lon+=2){const[x,y,z]=project([lon,lat]);if(z<=0){started=false;continue}started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true)}ctx.stroke()}for(const geometry of globeState.topology.objects.countries.geometries)for(const polygon of geometryRings(globeState.topology,geometry)){ctx.beginPath();polygon.forEach(ring=>trace(ctx,ring,project));ctx.fillStyle='#e6e5df';ctx.fill('evenodd');ctx.strokeStyle='rgba(25,25,25,.48)';ctx.lineWidth=.65;ctx.stroke()}globeState.cities.forEach(city=>{const[x,y,z]=project([city.lon,city.lat]);if(z<=0)return;const active=globeState.activeCity===city.city,hovered=globeState.hoveredCity===city.city,home=!presentationMode&&slides[current]?.classList.contains('overview');ctx.beginPath();ctx.arc(x,y,hovered?6.2:active?6.2:home?6:4.8,0,Math.PI*2);ctx.fillStyle=hovered?'#a9823f':'#b39051';ctx.fill();ctx.strokeStyle=active?'#051e39':'#fff';ctx.lineWidth=active?1.4:1;ctx.stroke();if(active||hovered){ctx.beginPath();ctx.arc(x,y,hovered?8.2:9,0,Math.PI*2);ctx.strokeStyle=hovered?'rgba(179,144,81,.34)':'rgba(179,144,81,.4)';ctx.lineWidth=hovered?1:1;ctx.stroke()}});ctx.restore();drawCityLabels(ctx,project,width,height);window.__EUGA_BANNER_READY__=true}
function animate(time){globeState.frame=0;const delta=Math.min(40,time-(globeState.last||time));globeState.last=time;const dLon=((globeState.targetLon-globeState.lon+540)%360)-180,dLat=globeState.targetLat-globeState.lat;if(reducedMotion.matches||Math.abs(dLon)<.04&&Math.abs(dLat)<.04){globeState.lon=globeState.targetLon;globeState.lat=globeState.targetLat;drawGlobe();return}const ease=1-Math.pow(.89,delta/16.67);globeState.lon+=dLon*ease;globeState.lat+=dLat*ease;drawGlobe();scheduleGlobeDraw()}

let slides=[],current=0,sitePool=[],siteSlots=[];
let autoplayTimer=null;
function shuffled(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function featuredFacultySelection(people,count=2){
  const pool=shuffled(people),slots=Math.min(count,pool.length);
  if(slots===pool.length)return pool;
  const weights=pool.map(person=>/vicki-birchfield/i.test(person.Link||'')?2:1);
  const total=weights.reduce((sum,weight)=>sum+weight,0),interval=total/slots;
  // Systematic sampling gives each person inclusion probability slots * weight / total,
  // so Birchfield appears twice as often as each colleague without repeat slides.
  if(Math.max(...weights)>interval){
    const selected=[];let remaining=pool.map((person,index)=>({person,weight:weights[index]}));
    while(selected.length<slots){let ticket=Math.random()*remaining.reduce((sum,item)=>sum+item.weight,0);const index=remaining.findIndex(item=>(ticket-=item.weight)<0);selected.push(remaining.splice(index,1)[0].person)}
    return selected;
  }
  const start=Math.random()*interval,targets=Array.from({length:slots},(_,index)=>start+index*interval);
  let edge=0,pointer=0;return pool.filter((person,index)=>{edge+=weights[index];if(pointer<targets.length&&targets[pointer]<edge){pointer++;return true}return false});
}
function rotateSiteSlots(){if(presentationMode||!siteSlots.length||!sitePool.length)return;const shown=new Set(siteSlots.map(slide=>slide.dataset.institution)),unused=sitePool.filter(site=>!shown.has(site.institution)),next=shuffled(unused.length>=siteSlots.length?unused:sitePool).slice(0,siteSlots.length);siteSlots.forEach((slide,index)=>updateSiteSlide(slide,next[index]))}
function setGlobeTarget(slide){const city=globeState.cities.find(item=>item.city===slide.dataset.city);if(city){globeState.targetLon=city.lon;globeState.targetLat=city.lat;globeState.activeCity=city.city}else{globeState.targetLon=presentationMode?16:10;globeState.targetLat=49;globeState.activeCity=null}scheduleGlobeDraw()}
function renderProgress(){const progress=document.querySelector('#progress-dots');progress.replaceChildren(...slides.map((slide,index)=>{const dot=el('button','progress-dot');dot.type='button';dot.setAttribute('aria-label',`Go to slide ${index+1}`);dot.addEventListener('click',event=>{event.stopPropagation();show(index);restartAutoplay()});return dot}))}
let pendingCoverExit=null;
function commitSlide(index){
  if(current===slides.length-1&&index===0)rotateSiteSlots();
  const previous=current;
  current=index;
  slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===current));
  document.querySelectorAll('.progress-dot').forEach((dot,i)=>dot.classList.toggle('is-active',i===current));
  document.documentElement.dataset.slideFocus=slides[current].dataset.focus||'';
  setGlobeTarget(slides[current]);
  if(presentationMode&&current===0&&previous!==0)slides[0].querySelector('.presentation-title-motion')?.contentWindow?.replayAnimation?.();
  const nextParams=new URLSearchParams(location.search);
  nextParams.set('slide',current+1);
  history.replaceState(null,'',`${location.pathname}?${nextParams}`);
}
function show(index){
  const destination=Math.max(0,Math.min(index,slides.length-1));
  if(pendingCoverExit){
    if(destination!==0){pendingCoverExit.destination=destination;return}
    clearTimeout(pendingCoverExit.timer);
    pendingCoverExit=null;
    slides[0].classList.remove('is-exiting');
  }
  if(presentationMode&&current===0&&destination!==0&&slides[0].classList.contains('is-active')&&!reducedMotion.matches){
    globeState.targetLon=23;
    globeState.targetLat=49;
    globeState.activeCity=null;
    slides[0].classList.add('is-exiting');
    scheduleGlobeDraw();
    pendingCoverExit={destination,timer:setTimeout(()=>{
      const next=pendingCoverExit.destination;
      pendingCoverExit=null;
      slides[0].classList.remove('is-exiting');
      commitSlide(next);
    },650)};
    return;
  }
  commitSlide(destination);
}
reducedMotion.addEventListener('change',()=>{
  if(!pendingCoverExit||!reducedMotion.matches)return;
  clearTimeout(pendingCoverExit.timer);
  const destination=pendingCoverExit.destination;
  pendingCoverExit=null;
  slides[0].classList.remove('is-exiting');
  commitSlide(destination);
});
function advance(amount=1){show((current+amount+slides.length)%slides.length);restartAutoplay()}
function restartAutoplay(){if(!autoplayMode)return;clearInterval(autoplayTimer);autoplayTimer=setInterval(()=>{if(!document.hidden)show((current+1)%slides.length)},8000)}
async function init(){
  let text={...fallbackText},cities=[],courses=[],faculty=fallbackFaculty,photos=[],institutions=[];
  const [fallback,manifest]=await Promise.all([fetch('data/program.json').then(r=>r.json()),presentationMode?Promise.resolve([]):fetch('data/institutions.json').then(r=>r.json())]);
  try{
    const [textRows,cityRows,courseRows,facultyRows,institutionRows,photoResponse,topology]=await Promise.all([sheet(gids.text),sheet(gids.cities),sheet(gids.courses),sheet(gids.faculty),presentationMode?Promise.resolve([]):sheet(gids.institutions),fetch('photos/sources.json'),fetch('assets/countries-110m.json').then(r=>r.json())]);
    text={...text,...Object.fromEntries(textRows.filter(r=>r.Key).map(r=>[r.Key,r.Value]))};
    const coordinates=new Map(fallback.cities.map(c=>[c.city.toLowerCase(),c]));
    cities=(await window.EUGACityGeocoder.resolve(cityRows.map(row=>({...coordinates.get((row.City||'').toLowerCase()),city:row.City,country:row.Country,category:row.Category,featured:EUGACities.isFeatured(row.Featured),lat:row.Latitude,lon:row.Longitude})),fallback.cities)).filter(city=>city.city&&Number.isFinite(city.lon));
    courses=courseRows;faculty=facultyRows.filter(row=>(row.Name||row['Full name'])&&(row.Link||row['University profile URL'])).map(row=>({...row,Name:facultyDisplayName(row.Name||row['Full name'],text.faculty_honorific||'Dr.'),Link:row.Link||row['University profile URL'],'Program Title':row['Program Title']||row['Program role']}));photos=await photoResponse.json();globeState.topology=topology;
    const media=new Map(manifest.map(site=>[site.institution,site]));
    institutions=institutionRows.filter(row=>row.Institution&&row.City&&row.Country).map(row=>({institution:row.Institution,city:row.City,country:row.Country,photo:media.get(row.Institution)?.photo,photo_caption:media.get(row.Institution)?.photo_caption}));
    document.documentElement.dataset.contentSource='sheet';
  }catch(error){
    console.warn('Using local content fallback.',error);cities=fallback.cities;courses=fallback.courses;institutions=manifest;photos=await fetch('photos/sources.json').then(r=>r.json());globeState.topology=await fetch('assets/countries-110m.json').then(r=>r.json());document.documentElement.dataset.contentSource='fallback';
  }
  const available=presentationMode?[]:await Promise.all(institutions.map(async site=>site.photo&&await fetch(site.photo,{method:'HEAD'}).then(response=>response.ok).catch(()=>false)?site:null));
  const featuredCities=cities.filter(city=>EUGACities.isFeatured(city.featured));
  const cityNames=new Set(cities.map(city=>city.city.toLowerCase())),featuredNames=new Set(featuredCities.map(city=>city.city.toLowerCase()));
  sitePool=available.filter(site=>site&&(!cityNames.has(site.city.toLowerCase())||featuredNames.has(site.city.toLowerCase())));
  document.documentElement.dataset.institutionCount=institutions.length;
  document.documentElement.dataset.institutionPhotoCount=sitePool.length;
  if(available.filter(Boolean).length!==institutions.length)console.warn('Institution photos awaiting verification:',institutions.filter(site=>!available.includes(site)).map(site=>site.institution));
  globeState.cities=cities;
  const allBasecamps=featuredCities.filter(city=>(city.category||'').toLowerCase()==='basecamp'),allExcursions=featuredCities.filter(city=>(city.category||'').toLowerCase()!=='basecamp'),deck=document.querySelector('#deck');
  if(presentationMode){
    slides=[overviewSlide(text,cities,courses),curriculumSlide(text,courses),facultyGroupSlide(faculty,text),applicationSlide(text)];
  }else{
    const basecamps=shuffled(allBasecamps).slice(0,2),excursions=shuffled(allExcursions).slice(0,2),featuredFaculty=featuredFacultySelection(faculty);
    siteSlots=shuffled(sitePool).slice(0,2).map(siteSlide);
    slides=[overviewSlide(text,cities,courses),...(basecamps[0]?[citySlide(basecamps[0],0,photos)]:[]),...(featuredFaculty[0]?[facultySlide(featuredFaculty[0])]:[]),...(excursions[0]?[citySlide(excursions[0],0,photos)]:[]),...(siteSlots[0]?[siteSlots[0]]:[]),curriculumSlide(text,courses),...(basecamps[1]?[citySlide(basecamps[1],1,photos)]:[]),...(featuredFaculty[1]?[facultySlide(featuredFaculty[1])]:[]),gallerySlide(),...(excursions[1]?[citySlide(excursions[1],1,photos)]:[]),...(siteSlots[1]?[siteSlots[1]]:[])];
  }
  if(presentationMode)slides.filter(slide=>slide.classList.contains('city-slide')).forEach(slide=>slide.append(presentationBrand()));
  deck.append(...slides);renderProgress();const requested=Number(params.get('slide'));show(Number.isFinite(requested)&&requested>0?requested-1:0);scheduleGlobeDraw();restartAutoplay();
}
document.querySelector('#deck').addEventListener('pointermove',event=>{const slide=slides[current];if(!slide)return;setHoveredCity(cityAtBannerPoint(event),slide)});document.querySelector('#deck').addEventListener('pointerleave',()=>setHoveredCity(null,slides[current]));const deck=document.querySelector('#deck');let touchStart=null;deck.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&!event.target.closest('a,button'))touchStart={x:event.clientX,y:event.clientY}});deck.addEventListener('pointerup',event=>{if(!touchStart)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25)advance(dx<0?1:-1)});deck.addEventListener('pointercancel',()=>{touchStart=null});deck.addEventListener('click',()=>{if(!matchMedia('(hover:none) and (pointer:coarse)').matches)advance(1)});function handleKey(key){if(['ArrowRight',' ','PageDown'].includes(key)){advance(1);return true}if(['ArrowLeft','PageUp'].includes(key)){advance(-1);return true}if(key==='Home'){show(0);restartAutoplay();return true}if(key==='End'){show(slides.length-1);restartAutoplay();return true}return false}document.addEventListener('keydown',event=>{if(handleKey(event.key))event.preventDefault()});window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='euga-presentation-key'&&presentationMode)handleKey(event.data.key)});window.addEventListener('resize',()=>{drawGlobe();siteSlots.forEach(fitSitePanel)});init();
document.addEventListener('euga:brand-change',()=>{if(!presentationMode)return;const title=document.querySelector('.overview');if(!title)return;const previous=title.querySelector('.presentation-title-motion,.presentation-logo');if(!previous)return;const concept=window.EUGABranding.current()==='concept';if(Boolean(previous.matches('.presentation-title-motion'))!==concept)previous.replaceWith(presentationTitleBrand())});
