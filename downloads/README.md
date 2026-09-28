# Program branding downloads

- [Download the scalable SVG](../assets/branding/program-wordmark.svg) — this is the canonical source, linked directly rather than copied here.
- [Download the transparent PNG](program-wordmark.png) — 1560 × 224 px raster export of the same SVG.
- [Download background-specific wordmarks](branding/) — white-background, navy-background, reversed, and all-white SVG and PNG variants, all generated from the approved canonical SVG by `scripts/export_branding.py`.
- [Download the hallway TV banner](hallway-tv-1920x1080.png) — full-HD PNG export of `hallway.html`.
- [Download the office-door printout](office-door-half-page.pdf) — one-page, 5.5 × 8.5-inch PDF export of `office-door.html`.
- [Download the two-up office-door sheet](office-door-two-up.pdf) — two signs on one landscape US Letter sheet, ready to cut down the center.
- [Download the current print flyer](print-flyer-current.pdf) — one-page, 8.5 × 11-inch PDF export of `flyer.html`.

The flyer, presentation, hallway banner, and office-door printout reference the approved `assets/branding/program-wordmark.svg`. Do not alter its geometry without explicit approval. If the source is ever intentionally updated, regenerate the relevant PNG/PDF exports. The website carousel intentionally displays neither the wordmark nor an application CTA.

The TV banner uses the local Europe map geometry and current program-city data; it no longer uses a photograph. The reversed, transparent QR derivative on the signage is generated from the same program-website QR as the print products. The office-door earth-limb image is a raster export of the flyer's canvas rendering. Regenerate the affected PNG and print PDFs after changing their HTML/CSS, shared logo, or map data.
