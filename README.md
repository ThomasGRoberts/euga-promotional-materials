# EU & Global Affairs Study Abroad Promotional Materials
This is a lightweight HTML/CSS/JavaScript prototype for the Georgia Tech European Union and Global Affairs Study Abroad Program.

## GitHub Pages

The repository root is the public promotional-materials landing page. A Pages deployment workflow is included at `.github/workflows/pages.yml` and publishes automatically from `main`.

The private faculty message containing the Google Sheet editor URL is intentionally ignored by Git and is never included in the repository or Pages deployment.

## Run locally

```sh
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/` for the promotional-materials landing page that will become the GitHub Pages root.

- `index.html` is the promotional-materials landing page.
- `flyer.html` is the print-flyer preview.
- `banner.html` is the self-advancing website carousel. Each load features two base camps, two excursions, two featured site visits, and two faculty members, interleaved with overview/curriculum/gallery content. Site visits rotate between cycles.
- `banner.html?present=1` is the manual click-to-advance presentation. Its opening slide includes the full program title, prominent shared wordmark, and program QR code; it includes all four faculty on one slide, every base camp, every excursion, and a dedicated closing application slide with a larger QR code. It omits site-visit slides.
- `hallway.html` is a full-screen 16:9 hallway-TV banner using the shared wordmark and program QR code; a 1920 × 1080 PNG export is in `downloads/`.
- `office-door.html` is a white-background, half-letter (5.5 × 8.5 in) office-door printout with the shared wordmark and QR code; use its print button or the one-page PDF export in `downloads/`.
- `branding.html` offers the shared program wordmark as a scalable SVG and transparent PNG.

## Architecture

- `index.html` — semantic shell and render targets.
- `styles.css` — restrained Georgia Tech-inspired visual system plus print layout.
- `app.js` — deterministic real-geography renderer adapted from the supplied reference, data loading, and motion controls.
- `assets/countries-110m.json` — local copy of the same World Atlas boundary source used by the reference.
- `data/program.json` — current Sheet-shaped Phase 1 snapshot.
- `apps-script/PhotosSync.gs` — proposed Drive-folder → Photos-tab sync implementation.
- `docs/phase-1-inspection.md` — findings, decisions, and next integration steps.

The flyer intentionally contains no photography. The canonical wordmark is `assets/branding/program-wordmark.svg`; the flyer, presentation, hallway banner, and office-door printout all reference it. The downloadable PNG is in `downloads/` and is an export, not a second editable logo source. Institution-photo provenance and the one unresolved institution are documented in `photos/institutions/README.md`.
