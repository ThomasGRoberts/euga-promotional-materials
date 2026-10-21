// Shared live copy for the compact print pieces; local JSON remains the offline fallback.
(() => {
  const sheetBase='https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pub';
  const tabs={text:'1338367530',cities:'0',courses:'753875659'};
  function parseCsv(source){
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<source.length;i++){
      const character=source[i];
      if(quoted){if(character==='"'&&source[i+1]==='"'){field+='"';i++}else if(character==='"')quoted=false;else field+=character}
      else if(character==='"')quoted=true;
      else if(character===','){row.push(field);field=''}
      else if(character==='\n'){row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);row=[];field=''}
      else field+=character;
    }
    row.push(field.replace(/\r$/,''));if(row.some(value=>value.trim()))rows.push(row);
    const headers=(rows.shift()||[]).map((value,index)=>(index?value:value.replace(/^\uFEFF/,'')).trim());
    return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,(values[index]||'').trim()])));
  }
  async function sheet(gid){const response=await fetch(`${sheetBase}?output=csv&gid=${gid}`,{cache:'no-store'});if(!response.ok)throw Error(`Sheet ${gid}: ${response.status}`);return parseCsv(await response.text())}
  function fill(data){
    const cities=data.cities||[],courses=data.courses||[],text=data.text||{};
    const setAll=(selector,value)=>{if(value!==undefined&&value!==null&&value!=='')document.querySelectorAll(selector).forEach(node=>node.textContent=value)};
    setAll('[data-city-count]',cities.length);
    setAll('[data-country-count]',new Set(cities.map(city=>city.country)).size);
    setAll('[data-course-count]',courses.length);
    setAll('[data-program-term]',`${text.program_term||'Summer 2027'}.`);
    setAll('[data-tent-term]',text.program_term||'Summer 2027');
    setAll('[data-certificate-title]',text.certificate_title);
    setAll('[data-certificate-detail]',text.certificate_detail);
    setAll('[data-minor-title]',text.minor_title);
    setAll('[data-minor-detail]',text.minor_detail);
    courses.forEach((course,index)=>{setAll(`[data-course-title="${index}"]`,course.title||course.Course);setAll(`[data-course-code="${index}"]`,course.code||course.Code)});
  }
  async function init(){
    try{
      const response=await fetch('data/program.json'),fallback=await response.json();fill(fallback);
      try{
        const [textRows,cityRows,courseRows]=await Promise.all([sheet(tabs.text),sheet(tabs.cities),sheet(tabs.courses)]);
        const text=Object.fromEntries(textRows.filter(row=>row.Key).map(row=>[row.Key,row.Value]));
        const cities=cityRows.filter(row=>row.City).map(row=>({city:row.City,country:row.Country}));
        const courses=courseRows.filter(row=>row.Course).map(row=>({title:row.Course,code:row.Code}));
        fill({cities,courses,text});document.documentElement.dataset.contentSource='sheet';
      }catch(error){console.warn('Using local print-content snapshot.',error);document.documentElement.dataset.contentSource='fallback'}
    }catch(error){console.error('Print content failed to load.',error);document.documentElement.dataset.contentSource='embedded'}
    window.__EUGA_PRINT_READY__=true;
  }
  init();
})();
