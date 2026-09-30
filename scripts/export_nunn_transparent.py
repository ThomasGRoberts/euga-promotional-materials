#!/usr/bin/env python3
"""Deterministically unmatte the existing school lockup from its near-white JPEG."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/Nunnlogo.jpg'
OUTPUT = ROOT / 'assets/Nunnlogo-transparent.png'
BACKGROUND = (254, 254, 254)
INKS = ((169, 153, 94), (4, 35, 65))  # Existing GT gold and school navy.


def separate(pixel):
    delta = [background - channel for background, channel in zip(BACKGROUND, pixel)]
    if max(delta) < 5:
        return (0, 0, 0, 0)
    candidates = []
    for ink in INKS:
        direction = [background - channel for background, channel in zip(BACKGROUND, ink)]
        opacity = max(0.0, min(1.0, sum(a * b for a, b in zip(delta, direction)) / sum(b * b for b in direction)))
        residual = sum((a - opacity * b) ** 2 for a, b in zip(delta, direction))
        candidates.append((residual, opacity, ink))
    _, opacity, ink = min(candidates)
    if opacity < .06:
        return (0, 0, 0, 0)
    return (*ink, round(opacity * 255))


with Image.open(SOURCE) as source:
    pixels = source.convert('RGB')
    output = Image.new('RGBA', pixels.size)
    output.putdata([separate(pixel) for pixel in pixels.get_flattened_data()])
    output.save(OUTPUT, optimize=True)
print(OUTPUT.relative_to(ROOT))
