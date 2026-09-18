#!/usr/bin/env python3
"""Build a high-resolution, attributed Wikimedia Commons photo library."""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHOTO_ROOT = ROOT / "photos"
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "GeorgiaTech-EUGA-banner-photo-research/1.0 (educational project)"


PLAN = {
    "metz": {
        "city": ("Metz Cathedral Moselle", 2),
        "institutions": [
            ("Georgia Tech Europe campus Metz France", "georgia-tech-europe"),
            ("Robert Schuman House Scy-Chazelles", "robert-schuman-house"),
        ],
    },
    "strasbourg": {
        "city": ("Petite France Strasbourg", 2),
        "institutions": [("European Parliament Strasbourg building", "european-parliament")],
    },
    "trier": {"city": ("Porta Nigra Trier", 2), "institutions": []},
    "luxembourg-city": {
        "city": ("Luxembourg old town panorama", 2),
        "institutions": [("Court of Justice European Union Luxembourg building", "court-of-justice-eu")],
    },
    "brussels": {
        "city": ("Grand Place Brussels", 2),
        "institutions": [
            ("European Parliament Brussels building", "european-parliament"),
            ("Justus Lipsius building Brussels exterior", "council-of-the-eu"),
            ("Berlaymont European Commission Brussels", "european-commission"),
            ("Triangle building EEAS Brussels exterior", "eeas"),
            ("NATO headquarters Brussels exterior", "nato-headquarters"),
        ],
    },
    "amsterdam": {"city": ("Amsterdam canal houses", 2), "institutions": []},
    "the-hague": {
        "city": ("The Hague Netherlands skyline Binnenhof", 2),
        "institutions": [
            ("Peace Palace The Hague building", "peace-palace"),
            ("International Criminal Court The Hague building", "international-criminal-court"),
        ],
    },
    "bucharest": {
        "city": ("Romanian Athenaeum Bucharest", 2),
        "institutions": [
            ("Romanian Ministry Foreign Affairs Bucharest building", "ministry-of-foreign-affairs"),
            ("NATO Force Integration Unit Romania", "nato-force-integration-unit"),
        ],
    },
    "berlin": {
        "city": ("Berlin skyline Fernsehturm", 2),
        "institutions": [("Reichstag Bundestag Berlin building", "bundestag")],
    },
    "munich": {"city": ("Marienplatz Munich", 2), "institutions": []},
    "nuremberg": {
        "city": ("Nuremberg old town", 2),
        "institutions": [("Nuremberg Palace of Justice courtroom 600", "palace-of-justice")],
    },
    "geneva": {
        "city": ("Jet d'Eau Geneva lake", 2),
        "institutions": [
            ("Palais des Nations United Nations Geneva building", "united-nations-geneva"),
            ("International Telecommunication Union Geneva building", "itu"),
        ],
    },
    "bern": {"city": ("Bern Switzerland old town", 2), "institutions": []},
    "paris": {
        "city": ("Eiffel Tower Seine Paris", 2),
        "institutions": [
            ("Palais Bourbon Assemblée Nationale Paris", "assemblee-nationale"),
            ("Luxembourg Palace French Senate Paris", "french-senate"),
            ("Quai d'Orsay building Paris Ministry Foreign Affairs", "quai-dorsay"),
            ("European Space Agency headquarters Paris", "european-space-agency"),
            ("IFRI Paris building Institut français relations internationales", "ifri"),
        ],
    },
    "vienna": {
        "city": ("Vienna historic centre skyline", 2),
        "institutions": [
            ("Vienna International Centre United Nations building", "vienna-international-centre"),
            ("IAEA headquarters Vienna International Centre", "iaea"),
            ("United Nations Office Vienna building", "united-nations-vienna"),
        ],
    },
}


EXACT_FIXES = {
    "metz": [
        ("File:Metz centre ville.jpg", "city-01.jpg", "city"),
        ("File:Temple Neuf de Metz und Pont des Roches.jpg", "city-02.jpg", "city"),
        ("File:GT Lorraine.jpg", "georgia-tech-europe.jpg", "institution"),
    ],
    "luxembourg-city": [
        ("File:Luxembourg City Night Wikimedia Commons.jpg", "city-01.jpg", "city"),
        ("File:Ville-Haute vue du Fort Verlorenkost (cropped).jpg", "city-02.jpg", "city"),
        ("File:EP - Kirchberg from the skies 2025 (3).jpg", "court-of-justice-eu.jpg", "institution"),
    ],
    "bucharest": [
        ("File:Palace of the Parliament in Bucharest (51878975552).jpg", "city-02.jpg", "city"),
    ],
    "munich": [
        ("File:Munich Neues Rathaus in May 2024.jpg", "city-01.jpg", "city"),
        ("File:Munich skyline.jpg", "city-02.jpg", "city"),
    ],
    "nuremberg": [("File:Nuernberg Burg Panorama PtGUI.jpg", "city-02.jpg", "city")],
    "geneva": [
        ("File:Geneva from Saleve 0.jpg", "city-01.jpg", "city"),
        ("File:Geneva-aerial-view.JPG", "city-02.jpg", "city"),
    ],
    "paris": [
        ("File:Garden @ Quai d’Orsay @ Ministry of Foreign Affairs @ Paris (29140474554).jpg", "quai-dorsay.jpg", "institution"),
        ("File:ESA Headquarters in Paris.jpg", "european-space-agency.jpg", "institution"),
    ],
    "vienna": [
        ("File:20180109 Vienna State Opera at blue hour 850 9387.jpg", "city-01.jpg", "city"),
        ("File:Schonbrunn Palace - Vienna.jpg", "city-02.jpg", "city"),
    ],
}

CLEANUP_FILES = [
    "brussels/council-of-the-eu.jpg",
    "brussels/eeas.jpg",
    "brussels/nato-headquarters.jpg",
    "metz/robert-schuman-house.png",
    "nuremberg/city-02.png",
]


def request_json(params: dict[str, str | int]) -> dict:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def plain(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value or "")
    return html.unescape(value).strip()


def candidates(search: str) -> list[dict]:
    payload = request_json({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{search} filetype:bitmap",
        "gsrnamespace": 6,
        "gsrlimit": 24,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 2560,
        "format": "json",
        "origin": "*",
    })
    output = []
    blocked = ("map", "logo", "flag", "coat of arms", "seal", "diagram", "poster", "stamp", "ticket", "painting")
    for page in payload.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        mime = info.get("mime", "")
        width, height = info.get("width", 0), info.get("height", 0)
        title = page.get("title", "")
        if mime not in {"image/jpeg", "image/png"} or width < 1200 or height < 700:
            continue
        if any(term in title.lower() for term in blocked):
            continue
        metadata = info.get("extmetadata", {})
        assessments = metadata.get("Assessments", {}).get("value", "").lower()
        aspect = width / max(height, 1)
        landscape_score = 45 if 1.25 <= aspect <= 2.25 else 10 if aspect >= 1 else -25
        score = landscape_score + min(width, 7000) / 350
        if "featured" in assessments:
            score += 45
        if "quality" in assessments:
            score += 25
        score -= max(page.get("index", 1) - 1, 0) * 14
        output.append({"page": page, "info": info, "metadata": metadata, "score": score})
    return sorted(output, key=lambda item: item["score"], reverse=True)


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response, destination.open("wb") as output:
        while chunk := response.read(1024 * 256):
            output.write(chunk)


def record_for(item: dict, filename: str, role: str, query: str) -> dict:
    page, info, metadata = item["page"], item["info"], item["metadata"]
    get = lambda key: plain(metadata.get(key, {}).get("value", ""))
    return {
        "file": filename,
        "role": role,
        "search_query": query,
        "commons_title": page.get("title", ""),
        "description": get("ImageDescription") or get("ObjectName"),
        "creator": get("Artist"),
        "license": get("LicenseShortName") or get("UsageTerms"),
        "license_url": get("LicenseUrl"),
        "source_page": info.get("descriptionurl", ""),
        "source_width": info.get("width"),
        "source_height": info.get("height"),
    }


def exact_candidate(title: str) -> dict | None:
    payload = request_json({
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 2560,
        "format": "json",
        "origin": "*",
    })
    page = next(iter(payload.get("query", {}).get("pages", {}).values()), None)
    if not page or page.get("missing") is not None or not page.get("imageinfo"):
        return None
    info = page["imageinfo"][0]
    return{"page":page,"info":info,"metadata":info.get("extmetadata",{}),"score":0}


def apply_exact_fixes(city_filter: str | None = None) -> int:
    for city, fixes in EXACT_FIXES.items():
        if city_filter and city != city_filter:
            continue
        folder = PHOTO_ROOT / city
        folder.mkdir(parents=True, exist_ok=True)
        source_path = folder / "sources.json"
        records = json.loads(source_path.read_text(encoding="utf-8")) if source_path.exists() else []
        for title, filename, role in fixes:
            item = exact_candidate(title)
            if not item:
                print(f"WARNING: exact Commons file not found: {title}", flush=True)
                continue
            print(f"{city}: curated {role} -> {filename}", flush=True)
            url = item["info"].get("thumburl") or item["info"].get("url")
            download(url, folder / filename)
            replacement = record_for(item, filename, role, f"exact Commons file: {title}")
            records = [record for record in records if record.get("file") != filename]
            records.append(replacement)
            time.sleep(0.15)
        source_path.write_text(json.dumps(records, indent=2, ensure_ascii=False)+"\n",encoding="utf-8")
    all_records=[]
    for city in PLAN:
        source_path=PHOTO_ROOT/city/"sources.json"
        if source_path.exists():
            all_records.extend({"city":city,**record} for record in json.loads(source_path.read_text(encoding="utf-8")))
    (PHOTO_ROOT/"sources.json").write_text(json.dumps(all_records,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Applied curated replacements; library contains {len(all_records)} attributed records",flush=True)
    return 0


def cleanup_generated_files() -> int:
    for relative in CLEANUP_FILES:
        path=PHOTO_ROOT/relative
        if path.exists():
            print(f"Removing superseded generated asset: {relative}",flush=True)
            path.unlink()
        source_path=path.parent/"sources.json"
        if source_path.exists():
            records=json.loads(source_path.read_text(encoding="utf-8"))
            records=[record for record in records if record.get("file") != path.name]
            source_path.write_text(json.dumps(records,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    all_records=[]
    for city in PLAN:
        source_path=PHOTO_ROOT/city/"sources.json"
        if source_path.exists():
            all_records.extend({"city":city,**record} for record in json.loads(source_path.read_text(encoding="utf-8")))
    (PHOTO_ROOT/"sources.json").write_text(json.dumps(all_records,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Clean library contains {len(all_records)} attributed records",flush=True)
    return 0


def save_selection(city: str, query: str, role: str, stem: str, count: int, used: set[str]) -> list[dict]:
    folder = PHOTO_ROOT / city
    folder.mkdir(parents=True, exist_ok=True)
    chosen = []
    for item in candidates(query):
        source_page = item["info"].get("descriptionurl", "")
        if source_page in used:
            continue
        chosen.append(item)
        used.add(source_page)
        if len(chosen) == count:
            break
    records = []
    for index, item in enumerate(chosen, start=1):
        mime = item["info"].get("mime")
        extension = ".png" if mime == "image/png" else ".jpg"
        suffix = f"-{index:02d}" if count > 1 else ""
        filename = f"{stem}{suffix}{extension}"
        url = item["info"].get("thumburl") or item["info"].get("url")
        print(f"{city}: {role} -> {filename}", flush=True)
        download(url, folder / filename)
        records.append(record_for(item, filename, role, query))
        time.sleep(0.15)
    if not records:
        print(f"WARNING: no suitable image found for {city}: {query}", flush=True)
    return records


def main() -> int:
    PHOTO_ROOT.mkdir(parents=True, exist_ok=True)
    all_records = []
    for city, plan in PLAN.items():
        used: set[str] = set()
        records = []
        city_query, city_count = plan["city"]
        records.extend(save_selection(city, city_query, "city", "city", city_count, used))
        for query, stem in plan["institutions"]:
            records.extend(save_selection(city, query, "institution", stem, 1, used))
        (PHOTO_ROOT / city / "sources.json").write_text(
            json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        all_records.extend({"city": city, **record} for record in records)
    (PHOTO_ROOT / "sources.json").write_text(
        json.dumps(all_records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Downloaded {len(all_records)} attributed images into {PHOTO_ROOT}", flush=True)
    return 0


if __name__ == "__main__":
    city_filter=next((argument.split("=",1)[1] for argument in sys.argv if argument.startswith("--city=")),None)
    if "--cleanup" in sys.argv:
        raise SystemExit(cleanup_generated_files())
    raise SystemExit(apply_exact_fixes(city_filter) if "--fixes-only" in sys.argv else main())
