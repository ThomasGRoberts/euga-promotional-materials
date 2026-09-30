# EU stars + globe concept

This is the Stars + Globe option alongside the EU/UN Flags wordmark in `assets/branding/program-wordmark.svg`. The Program Branding page selects which option promotional products display in the current browser.

## Tuned icon baseline

The user's downloaded `eu-stars-globe-concept-mark.svg` (last modified 2026-09-29 19:09:13 local time, SHA-256 `314c35827348b14c94b43b4af80da43c75f103aa1902d748fdb4655dce44d968`) supplied the resting-frame geometry. The icon defaults in `branding-alt.js` reproduce its SVG attributes:

| Parameter | Tuned value |
| --- | ---: |
| Star-circle radius | 75 |
| Star size | 11 |
| Star arc extent | 164° |
| Star vertical shift | -8 |
| Globe radius | 76 |
| Globe horizontal / vertical shift | 0 / 0 |
| Outer-circle stroke | 3.4 |
| Grid stroke | 1.6 |
| Horizon stroke | 1.6 |

The icon and text share one navy ink (`#003057`). Text uses the approved wordmark's Roboto Light (weight 300) and -0.02em letter spacing, not the colleague's DM Serif typography. The two-line lockup has the existing word break; the single-line lockup keeps the complete name on one line.

## Animation and future integration

The SVG has stable globe, clipping-window, and per-star groups. Its animation draws a full globe, moves exact elliptical meridian arcs inside a stationary circular outline to imply polar-axis rotation, withdraws the upper hemisphere toward the equator while fading it, sweeps the stars into the tuned arc, then reveals the light-Roboto wordmark. The two-line lockup reveals its lines separately. Finishing or interrupting motion removes all temporary geometry and restores the exact static geometry. Reduced-motion preference skips straight to that resting frame. The advanced tuning controls were removed from the page; the tuned constants remain in `branding-alt.js`.

`branding.html` has separate `data-brand-option="standard"` and `data-brand-option="concept"` sections with a selector. `brand-choice.js` propagates the browser-local selection to all materials. The Stars + Globe selector preview is a scaled clone of the settled live lockup, so it shares the same geometry and browser typography. `scripts/export_concept.py` generates the GIF and static product SVG.
The same export script also generates a flyer lockup whose icon, 36-unit gap, and 60-unit text match the live 220-unit mark proportions; the compact product SVG remains available for the other existing products.
