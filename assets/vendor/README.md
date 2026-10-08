# Local geographic clipping dependencies

Pinned browser distributions of d3-array 3.2.4 and d3-geo 3.1.1, downloaded from their published npm distributions via jsDelivr. Licenses are included alongside the files.

The flyer uses `geoRotation` and `geoClipCircle` to clip closed polygons to the globe's existing perspective horizon. Its original projection, display scale, orientation, and city rendering remain in app.js. Libraries are served locally; no runtime CDN request is needed.

Documentation: https://d3js.org/d3-geo/projection#geoClipCircle
