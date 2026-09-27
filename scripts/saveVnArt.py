"""Convert generated story art listed on stdin to optimized project WebP assets."""

import json
import re
import sys
from pathlib import Path

from PIL import Image


root = Path(__file__).resolve().parents[1] / "public" / "vn"
for key, source in json.load(sys.stdin).items():
    match = re.fullmatch(r"([a-z]+)-s([0-4])(?:-(c[01]|pair))?", key)
    if not match:
        raise ValueError(f"Invalid artwork key: {key}")
    victim, scene, variant = match.groups()
    target = root / victim / (f"choices-{scene}.webp" if variant == "pair" else f"choice-{scene}-{variant[-1]}.webp" if variant else f"scene-{scene}.webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail((1536, 1024) if variant == "pair" else (768, 1024))
        image.save(target, "WEBP", quality=76, method=6)
    print(f"{key}: {target.stat().st_size} bytes")
