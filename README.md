# EU & Global Affairs Study Abroad — Phase 1 prototype

This is a lightweight HTML/CSS/JavaScript prototype for the Georgia Tech European Union and Global Affairs Study Abroad Program.

## GitHub Pages

The repository root is the public promotional-materials landing page. A Pages deployment workflow is included at `.github/workflows/pages.yml` and publishes automatically from `main`.

The private faculty message containing the Google Sheet editor URL is intentionally ignored by Git and is never included in the repository or Pages deployment.

## Current inspection status

The supplied SBI visualization was inspected and its real-boundary geographic approach, fine linework, grayscale field, restrained gold accent, and responsive canvas treatment were adapted for this prototype. Its orbital-analysis, satellite, coverage, and floating-control machinery were intentionally excluded. The flyer now loads its editable copy, cities, and courses from the published Google Sheet. The checked-in JSON remains an offline fallback.

## Run locally

```sh
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/` for the promotional-materials landing page that will become the GitHub Pages root.

- `index.html` is the promotional-materials landing page.
- `flyer.html` is the print-flyer preview.
- `banner.html` is the self-advancing public banner. Each load features one faculty member, every basecamp, and five randomly selected excursions.
- `banner.html?present=1` is the manual click-to-advance presentation and includes all faculty.

## Architecture

- `index.html` — semantic shell and render targets.
- `styles.css` — restrained Georgia Tech-inspired visual system plus print layout.
- `app.js` — deterministic real-geography renderer adapted from the supplied reference, data loading, and motion controls.
- `assets/countries-110m.json` — local copy of the same World Atlas boundary source used by the reference.
- `data/program.json` — current Sheet-shaped Phase 1 snapshot.
- `apps-script/PhotosSync.gs` — proposed Drive-folder → Photos-tab sync implementation.
- `docs/phase-1-inspection.md` — findings, decisions, and next integration steps.

The flyer intentionally contains no photography. The digital banner has a graceful, text-only fallback for photos until the public image-serving boundary is established.
