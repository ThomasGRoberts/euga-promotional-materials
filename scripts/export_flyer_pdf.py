#!/usr/bin/env python3
"""Export the flyer after allowing its asynchronous map canvas to render."""

import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "versions" / "2026-09-18_euga-print-flyer-final.pdf"
CHROME = pathlib.Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
URL = "http://127.0.0.1:8765/flyer.html?export=20260919-1"


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    profile = pathlib.Path(tempfile.mkdtemp(prefix="euga-pdf-export-"))
    command = [
        str(CHROME),
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        f"--user-data-dir={profile}",
        "--virtual-time-budget=9000",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={OUTPUT}",
        "--no-pdf-header-footer",
        URL,
    ]
    try:
        try:
            completed = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
            returncode = completed.returncode
        except subprocess.TimeoutExpired:
            returncode = 0 if OUTPUT.exists() else -1
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    if returncode not in (0, 21) or not OUTPUT.exists():
        raise RuntimeError(f"Chrome export failed with status {returncode}")

    pdf = OUTPUT.read_bytes()
    pages = len(re.findall(rb"/Type\s*/Page(?!s)\b", pdf))
    images = len(re.findall(rb"/Subtype\s*/Image\b", pdf))
    if pages != 1:
        raise RuntimeError(f"Refusing export with {pages} pages")
    # The logo contributes one image. The rendered canvas must contribute another.
    if images < 2:
        raise RuntimeError(f"Refusing export without the rendered map canvas ({images} image found)")

    print(f"Wrote verified one-page flyer with map: {OUTPUT} ({len(pdf)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
