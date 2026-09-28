#!/usr/bin/env python3
"""Download curated, attributed Commons photos for spreadsheet institution visits."""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

from download_banner_photos import download, exact_candidate, record_for


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "photos" / "institutions"
TITLES = {
    "house-of-european-history": "File:House of European History, Brussels (sept. 2019).jpg",
    "parlamentarium": "File:Parlamentarium Brussels 2018f.jpg",
    "college-of-europe": "File:College of Europe.jpg",
    "council-of-the-european-union": "File:Justus Lipsius building 2007-05-08 02.jpg",
    "nato-headquarters": "File:Brussels NATO Headquarters.jpg",
    "eu-institute-for-security-studies": "File:Participation of Henna Virkkunen, and Kaja Kallas, to the EUISS annual conference (P-067721-00-34).jpg",
    "european-external-action-service": "File:Seat of the European External Action Service 20090705.jpg",
    "ministry-of-national-defense": "File:20171003-103447-ministry-of-defence-romania.jpg",
    "federal-foreign-office": "File:Berlin - Auswärtiges Amt der Bundesrepublik Deutschland.jpg",
    "swiss-federal-palace": "File:Bundeshaus in Bern 2022.jpg",
    "cern": "File:CERN Globe at night 2019-07-03 (1).jpg",
    "world-economic-forum": "File:World-Economic-Forum-headquarters-3.jpg",
    "global-public-policy-institute": "File:Thorsten Benner - Beweist Syrien das Ende des Prinzips der Schutzverantwortung? (8813960340).jpg",
    "un-institute-for-disarmament-research": "File:Palais des nations (front).jpg",
    "centre-for-humanitarian-dialogue": "File:Villa Plantamour-01.jpg",
}
OFFICIAL = {
    "european-digital-rights": {
        "url": "https://privacycamp.eu/wp-content/uploads/2024/02/040-EDRI-Privacy-Camp-24-Omar-Havana-LR-1-1.jpg",
        "source_page": "https://privacycamp.eu/photos-privacycamp24/",
        "description": "EDRi's Privacy Camp 2024 in Brussels",
        "creator": "Omar Havana / European Digital Rights",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
    },
    "nato-force-integration-unit": {
        "url": "https://api.army.mil/e2/c/images/2016/02/26/424834/original.jpg",
        "source_page": "https://www.army.mil/article/163073/4th_Infantry_Division_MCE_strengthens_ties_with_the_Romanian_NFIU/",
        "description": "U.S. Army visit to Romanian NFIU headquarters in Bucharest, February 2016",
        "creator": "U.S. Army",
        "license": "U.S. federal government public domain",
        "license_url": "https://www.usa.gov/government-works",
    },
}


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    records = json.loads((DEST / "sources.json").read_text()) if (DEST / "sources.json").exists() else []
    for stem, title in TITLES.items():
        target = DEST / f"{stem}.jpg"
        if target.exists():
            print(f"Already present: {target.name}", flush=True)
            continue
        for attempt in range(5):
            try:
                item = exact_candidate(title)
                if not item:
                    raise RuntimeError(f"Commons file not found: {title}")
                info = item["info"]
                if info.get("mime") != "image/jpeg":
                    raise RuntimeError(f"Unexpected image type for {title}: {info.get('mime')}")
                download(info.get("thumburl") or info["url"], target)
                record = record_for(item, target.name, "institution", f"exact Commons file: {title}")
                records = [old for old in records if old.get("file") != target.name]
                records.append(record)
                (DEST / "sources.json").write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
                print(f"Saved {target.name}: {record['creator']} / {record['license']}", flush=True)
                break
            except Exception as error:
                target.unlink(missing_ok=True)
                print(f"Retry {attempt + 1} for {stem}: {error}", flush=True)
                time.sleep(3 * (attempt + 1))
        time.sleep(1)
    for stem, source in OFFICIAL.items():
        if len(sys.argv)>1 and sys.argv[1].startswith("--only=") and stem!=sys.argv[1].split("=",1)[1]:
            continue
        target = DEST / f"{stem}.jpg"
        if target.exists() and len(sys.argv)<=1:
            continue
        staged = DEST / f"{stem}.download.jpg"
        try:
            download(source["url"], staged)
        except Exception:
            subprocess.run(["/usr/bin/curl", "-fL", "-sS", "--max-time", "45", source["url"], "-o", str(staged)], check=True)
        with Image.open(staged) as image:
            width, height = image.size
        staged.replace(target)
        record = {
            "file": target.name,
            "role": "institution",
            "description": source["description"],
            "creator": source["creator"],
            "license": source["license"],
            "license_url": source["license_url"],
            "source_page": source["source_page"],
            "image_url": source["url"],
            "source_width": width,
            "source_height": height,
        }
        records = [old for old in records if old.get("file") != target.name]
        records.append(record)
        (DEST / "sources.json").write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
        print(f"Saved {target.name}: {width}×{height} / {record['license']}", flush=True)


if __name__ == "__main__":
    main()
