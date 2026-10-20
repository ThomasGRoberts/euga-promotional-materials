# City geocoding data

The city-name lookup in `city-geocoding.json` is derived from the GeoNames `cities5000` dump and its country metadata. It retains populated-place names, alternate names, country codes, coordinates, and population; it is filtered to European countries, plus Armenia, Azerbaijan, Georgia, and Turkey. Duplicate name/country matches use the highest-population record. Existing promotional cities continue to use their checked-in coordinates.

GeoNames data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The flyer, banner, and hallway map display linked attribution. The data is provided as-is and may not contain every small place. Optional `Latitude` and `Longitude` columns in the master Cities tab can supply coordinates when a name is not found.

Regenerate the local index from the official daily source with:

```sh
python3 scripts/build_city_geocoder.py
```

Sources: [GeoNames](https://www.geonames.org/), [GeoNames data export](https://www.geonames.org/export/), and the [GeoNames download server](https://download.geonames.org/export/dump/).
