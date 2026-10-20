#!/usr/bin/env python3
"""Build a compact European city-name lookup from the GeoNames cities5000 dump."""

from __future__ import annotations

import io
import json
import re
import unicodedata
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "city-geocoding.json"
CITY_DUMP_URL = "https://download.geonames.org/export/dump/cities5000.zip"
COUNTRY_INFO_URL = "https://download.geonames.org/export/dump/countryInfo.txt"
EXTRA_EUROPE_CODES = {"AM", "AZ", "GE", "TR"}


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "EUGA-promotional-materials/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def main() -> None:
    country_info = download(COUNTRY_INFO_URL).decode("utf-8")
    country_codes: set[str] = set()
    country_names: dict[str, str] = {}
    for line in country_info.splitlines():
        if not line or line.startswith("#"):
            continue
        fields = line.split("\t")
        if len(fields) < 9:
            continue
        code, country_name, continent = fields[0], fields[4], fields[8]
        if continent != "EU" and code not in EXTRA_EUROPE_CODES:
            continue
        country_codes.add(code)
        for name in (country_name,):
            key = normalized(name)
            if key:
                country_names[key] = code
        # Common English sheet spelling for GeoNames' official "The Netherlands".
        if code == "NL":
            country_names["netherlands"] = code

    archive = zipfile.ZipFile(io.BytesIO(download(CITY_DUMP_URL)))
    text_name = next(name for name in archive.namelist() if name.endswith(".txt"))
    places: dict[str, dict[str, list[float | int]]] = {}
    for line in archive.read(text_name).decode("utf-8").splitlines():
        fields = line.split("\t")
        if len(fields) < 15 or fields[6] != "P" or fields[8] not in country_codes:
            continue
        latitude, longitude = float(fields[4]), float(fields[5])
        population = int(fields[14] or 0)
        aliases = {fields[1], fields[2], *fields[3].split(",")}
        for alias in aliases:
            key = normalized(alias)
            if not key:
                continue
            country_places = places.setdefault(fields[8], {})
            existing = country_places.get(key)
            if existing is None or population > existing[2]:
                country_places[key] = [latitude, longitude, population]

    result = {
        "source": "GeoNames cities5000",
        "source_url": "https://www.geonames.org/",
        "license": "CC BY 4.0",
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "countries": country_names,
        "places": places,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes; {sum(map(len, places.values())):,} name/country matches)")


if __name__ == "__main__":
    main()
