# Featured-site photograph library

The published **Website Language** spreadsheet's **Institutions** tab (gid `301199586`) is the source of institution names, cities, and countries. `data/institutions.json` is a local media manifest keyed by exact institution name; it supplies photo paths and optional captions for the promotional carousel, not editable institution content.

New photographs in this directory have creator, license, source page, and original size recorded in `sources.json`. Seven already-downloaded institution photographs remain in their city folders; their attribution records are in `photos/sources.json` and the matching city `sources.json` files.

The carousel shows only two featured-site slides per cycle. It selects from sheet rows with locally available photographs, then rotates to another pair at the next cycle. Institutions without a matching local photo remain in the catalog but are omitted from slide rotation until an image and attribution record are added. Do not substitute an unrelated image.

The presentation no longer includes featured-site slides. The Palais des Nations is not a separate row in the spreadsheet's institutions tab. UNIDIR's official contact page lists the Palais des Nations as its address, so the UNIDIR catalog image depicts that site.
