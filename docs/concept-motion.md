# EU stars + globe concept

This is an experimental option, not a replacement for the approved `assets/branding/program-wordmark.svg` used by promotional products.

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

The SVG has stable globe, clipping-window, and per-star groups. The animation temporarily reveals a full globe, turns it, clips it to the lower hemisphere, seats the stars along the tuned arc, and reveals text left-to-right. Finishing or interrupting motion restores the exact static geometry from the tunable parameters. Reduced-motion preference skips straight to that resting frame.

`branding.html` has separate `data-brand-option="approved"` and `data-brand-option="concept"` sections, ready for a later selector. No selector or automatic propagation to other products is implemented yet.
