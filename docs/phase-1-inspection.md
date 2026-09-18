# Phase 1 reference inspection and revision

## What was reusable

The supplied SBI visualization established the correct technical and visual vocabulary: a white scene, real World Atlas boundaries, fine gray country linework, controlled black focus lines, small gold data marks, high-DPI canvas rendering, and deliberate framing around an information panel. The reusable geographic ideas are its World Atlas source, topology-to-geography boundary pipeline, projection-based point placement, canvas sizing, and sparse visual hierarchy.

The satellite constellation, Voronoi coverage cells, orbital propagation, timeline, simulation controls, globe camera controls, and floating rounded panel are domain-specific and were not reused.

## Map versus globe

The 2D map is the stronger Phase 1 identity. At flyer scale, the itinerary’s Brussels–Paris–Metz–Trier–Luxembourg–Strasbourg cluster needs planar label control. A globe is compelling in the reference because its analytical subject is global orbital geometry; here it would make the dense city network less legible. The revised prototype uses a Europe-centered Lambert azimuthal equal-area projection, retaining global/geographic seriousness without gratuitous 3D.

## Sheet findings

The published workbook exposes three tabs:

- `Text`: empty at inspection time.
- `Cities`: `City | Country | Category`, with 15 rows—3 Basecamp and 12 Excursion.
- `Courses`: `Code | Course`, with four rows.

The prototype derives 15 cities, 8 countries, and 4 courses. Dates, fee, credits, contact, application deadline, and CTA are omitted because the authoritative Text tab does not contain them.

## Revised Phase 1 visual system

The hand-drawn placeholder coastline was removed. The banner and flyer now share a real-geography canvas, restrained network arcs, differentiated basecamp/excursion nodes, responsive city labels, high-DPI rendering, and a quieter editorial composition. Gold marks program structure rather than decoration. The flyer remains photo-free.

Phase 2 has not begun. Live multi-tab fetch, CTA/QR generation, photo synchronization, gallery migration, and public asset hosting remain future integration work.
