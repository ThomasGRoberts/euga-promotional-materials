// Resolve sheet cities from the local GeoNames gazetteer when a saved coordinate is unavailable.
(() => {
  const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  let indexPromise;

  async function loadIndex(){
    if(!indexPromise)indexPromise=fetch('data/city-geocoding.json').then(response=>{if(!response.ok)throw Error(`City geocoding data: ${response.status}`);return response.json()});
    return indexPromise;
  }

  async function resolve(rows,knownRows=[]){
    const known=new Map();
    knownRows.forEach(city=>{
      const name=normalize(city.city||city.City),country=normalize(city.country||city.Country);
      if(name&&Number.isFinite(Number(city.lat))&&Number.isFinite(Number(city.lon))){
        known.set(`${name}|${country}`,[Number(city.lat),Number(city.lon)]);
        if(!known.has(`${name}|`))known.set(`${name}|`,[Number(city.lat),Number(city.lon)]);
      }
    });
    const output=rows.map(row=>{
      const name=normalize(row.city||row.City),country=normalize(row.country||row.Country),lat=Number.parseFloat(row.lat??row.Latitude),lon=Number.parseFloat(row.lon??row.Longitude);
      if(Number.isFinite(lat)&&Number.isFinite(lon))return{...row,lat,lon};
      const match=known.get(`${name}|${country}`)||known.get(`${name}|`);
      return match?{...row,lat:match[0],lon:match[1]}:{...row};
    });
    if(!output.some(row=>!Number.isFinite(row.lat)||!Number.isFinite(row.lon)))return output;

    try{
      const gazetteer=await loadIndex();
      return output.map(row=>{
        if(Number.isFinite(row.lat)&&Number.isFinite(row.lon))return row;
        const countryCode=gazetteer.countries[normalize(row.country||row.Country)],placeName=normalize(row.city||row.City),match=countryCode&&gazetteer.places[countryCode]?.[placeName];
        return match?{...row,lat:match[0],lon:match[1]}:row;
      });
    }catch(error){
      console.warn('City geocoder unavailable; cities without saved coordinates cannot be mapped.',error);
      return output;
    }
  }

  window.EUGACityGeocoder={resolve};
})();
