const frame=document.querySelector('#material-frame');
const fullscreen=document.querySelector('#make-fullscreen');
const copy=document.querySelector('#copy-embed');
const publishedCarousel='https://thomasgroberts.github.io/euga-promotional-materials/banner.html?autoplay=1';
if(fullscreen)fullscreen.addEventListener('click',async()=>{await frame.requestFullscreen();frame.contentWindow.focus()});
if(copy)copy.addEventListener('click',async()=>{
  const html=`<iframe title="EU and Global Affairs Study Abroad carousel" src="${publishedCarousel}" width="1600" height="900" style="display:block;width:100%;aspect-ratio:16/9;border:0" loading="lazy" allow="autoplay"></iframe>`;
  const status=document.querySelector('#copy-status'),field=document.querySelector('#embed-code');
  try{await navigator.clipboard.writeText(html);status.textContent='Embed HTML copied. Paste it into a WordPress Custom HTML block.'}
  catch(error){field.hidden=false;field.value=html;field.select();const copied=document.execCommand('copy');status.textContent=copied?'Embed HTML copied. Paste it into a WordPress Custom HTML block.':'Copy the HTML shown below and paste it into a WordPress Custom HTML block.'}
});
document.addEventListener('keydown',event=>{
  if(!fullscreen||!['ArrowLeft','ArrowRight','PageUp','PageDown',' '].includes(event.key))return;
  event.preventDefault();frame.contentWindow.postMessage({type:'euga-presentation-key',key:event.key},location.origin);
});
