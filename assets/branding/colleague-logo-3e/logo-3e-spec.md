# Logo 3e — Horizon mark with GT (navy logo on white)

A single mark for the **EU and Global Affairs Study Abroad Program**: an arc of seven stars rising over a half globe that sits on a horizon line, with the official Georgia Tech GT logo inside the arch. It uses only Georgia Tech colors.

## Colors

| Role | Name | Hex |
|---|---|---|
| Globe fill, GT logo, program name | GT Navy | `#003057` |
| Stars, horizon line, globe grid lines | Tech Gold | `#B3A369` |
| "Study Abroad Program" text | Tech Dark Gold | `#857437` |
| Background | White | `#FFFFFF` |

Tech Dark Gold is used for the smaller text because Tech Gold on white doesn't meet accessibility contrast for text.

## Mark construction

The mark is drawn on a **220 × 220** grid (SVG viewBox units). Everything is built around the **horizon point at (110, 128)**.

1. **Half globe.** A circle with radius 72 centered at (110, 128), filled GT Navy and clipped so only the part *below* y = 128 shows.
2. **Globe grid.** Tech Gold lines, 2 units thick, clipped to the same lower half:
   - Two meridian ellipses centered at (110, 128), both 72 tall (ry = 72), one 30 wide (rx) and one 56 wide.
   - A vertical center line from (110, 128) to (110, 200).
   - One latitude curve: a quadratic curve from (48, 164) through control point (110, 172) to (172, 164).
3. **Horizon line.** A Tech Gold rounded bar, x 36 to 184 (148 wide), 6 tall, centered on y = 128 (top at y = 125), corner radius 3.
4. **Stars.** Seven five-point stars in Tech Gold, points facing up, outer radius 10 and inner radius 4. Their centers sit on a circle of radius 86 around (110, 128), spaced **every 30°** from 180° to 360°. This matches the spacing of the 12 stars on the EU flag, so the arc reads as the top half of the EU ring.

| Star | Angle | Center x | Center y |
|---|---|---|---|
| 1 | 180° | 24.0 | 128.0 |
| 2 | 210° | 35.5 | 85.0 |
| 3 | 240° | 67.0 | 53.5 |
| 4 | 270° | 110.0 | 42.0 |
| 5 | 300° | 153.0 | 53.5 |
| 6 | 330° | 184.5 | 85.0 |
| 7 | 360° | 196.0 | 128.0 |

5. **GT logo.** The official one-color navy GT logo, 62 wide × 38 tall, top-left corner at (79, 80), so it rests just above the horizon line. Add the ® at the logo's lower right (about x 142, y 109, roughly 7 units tall).

### Ready-to-use SVG

```svg
<svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="lowerHalf"><rect x="0" y="128" width="220" height="100"/></clipPath>

  <!-- Half globe (below the horizon) -->
  <g clip-path="url(#lowerHalf)">
    <circle cx="110" cy="128" r="72" fill="#003057"/>
    <ellipse cx="110" cy="128" rx="30" ry="72" fill="none" stroke="#B3A369" stroke-width="2"/>
    <ellipse cx="110" cy="128" rx="56" ry="72" fill="none" stroke="#B3A369" stroke-width="2"/>
    <line x1="110" y1="128" x2="110" y2="200" stroke="#B3A369" stroke-width="2"/>
    <path d="M48,164 Q110,172 172,164" fill="none" stroke="#B3A369" stroke-width="2"/>
  </g>

  <!-- Horizon line -->
  <rect x="36" y="125" width="148" height="6" rx="3" fill="#B3A369"/>

  <!-- Seven stars at EU-flag spacing (every 30°) -->
  <polygon points="24.0,118.0 26.4,124.8 33.5,124.9 27.8,129.2 29.9,136.1 24.0,132.0 18.1,136.1 20.2,129.2 14.5,124.9 21.6,124.8" fill="#B3A369"/>
  <polygon points="35.5,75.0 37.9,81.8 45.0,81.9 39.3,86.2 41.4,93.1 35.5,89.0 29.6,93.1 31.7,86.2 26.0,81.9 33.2,81.8" fill="#B3A369"/>
  <polygon points="67.0,43.5 69.4,50.3 76.5,50.4 70.8,54.8 72.9,61.6 67.0,57.5 61.1,61.6 63.2,54.8 57.5,50.4 64.6,50.3" fill="#B3A369"/>
  <polygon points="110.0,32.0 112.4,38.8 119.5,38.9 113.8,43.2 115.9,50.1 110.0,46.0 104.1,50.1 106.2,43.2 100.5,38.9 107.6,38.8" fill="#B3A369"/>
  <polygon points="153.0,43.5 155.4,50.3 162.5,50.4 156.8,54.8 158.9,61.6 153.0,57.5 147.1,61.6 149.2,54.8 143.5,50.4 150.6,50.3" fill="#B3A369"/>
  <polygon points="184.5,75.0 186.8,81.8 194.0,81.9 188.3,86.2 190.4,93.1 184.5,89.0 178.6,93.1 180.7,86.2 175.0,81.9 182.1,81.8" fill="#B3A369"/>
  <polygon points="196.0,118.0 198.4,124.8 205.5,124.9 199.8,129.2 201.9,136.1 196.0,132.0 190.1,136.1 192.2,129.2 186.5,124.9 193.6,124.8" fill="#B3A369"/>

  <!-- Official navy one-color GT logo (replace href with the file from GT brand resources) -->
  <image href="gt-logo-navy.svg" x="79" y="80" width="62" height="38"/>
  <text x="142" y="115" font-family="Georgia, serif" font-size="7" fill="#003057">®</text>
</svg>
```

## Lockup with the program name

- Mark on the left at 220 × 220 px, then a **36 px** gap, then two lines of text, vertically centered on the mark.
- Typeface: **DM Serif Display** (free on Google Fonts), regular weight.
- Line 1: "EU and Global Affairs", 40 px, GT Navy, line height 1.15, letter spacing −0.01em.
- Line 2: "Study Abroad Program", 26 px, Tech Dark Gold, line height 1.25, letter spacing 0.02em.
- 6 px between the lines.
- The mockup artboard is 880 × 400 px with 64 px top/bottom and 72 px side padding.

## Georgia Tech brand notes

- Use the **official GT logo file** from Georgia Tech's brand resources, not a screenshot. The mockup used a recolored screenshot as a placeholder.
- GT prefers the **Tech Gold** GT logo on light backgrounds. The all-navy GT is approved for one-color communications (letterhead, web) but **not** for merchandise, apparel, or promotional items.
- Keep the ® mark next to the GT logo.
- Get approval from GT's brand office before final use.
