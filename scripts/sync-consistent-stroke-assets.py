"""Sync the prototype's centerline-rendered image set into the app asset tiers.

The source stays outside the app repository while the prototype is being
reviewed. The checked-in public assets remain the build input, so the app can
build on machines that do not have the review workspace.

Default source:
    ..\\simplespeak-centerline-review\\consistent-stroke-44px

Override it with --source-dir when the review workspace moves.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = PROJECT_ROOT.parent / "simplespeak-centerline-review" / "consistent-stroke-44px"
DEFAULT_PUBLIC = PROJECT_ROOT / "public" / "simplespeak-images"


def resize_square(source: Path, destination: Path, size: int, quality: int) -> None:
    with Image.open(source) as image:
        resized = image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
        resized.save(destination, format="JPEG", quality=quality, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--public-dir", type=Path, default=DEFAULT_PUBLIC)
    args = parser.parse_args()

    source_dir = args.source_dir.resolve()
    public_dir = args.public_dir.resolve()
    sources = sorted(source_dir.glob("*.png"))
    if not sources:
        raise SystemExit(f"No PNG assets found in {source_dir}")

    medium_dir = public_dir / "medium"
    thumb_dir = public_dir / "thumb"
    public_dir.mkdir(parents=True, exist_ok=True)
    medium_dir.mkdir(parents=True, exist_ok=True)
    thumb_dir.mkdir(parents=True, exist_ok=True)

    for source in sources:
        full_destination = public_dir / source.name
        medium_destination = medium_dir / f"{source.stem}.jpg"
        thumb_destination = thumb_dir / f"{source.stem}.jpg"
        shutil.copy2(source, full_destination)
        resize_square(source, medium_destination, 320, 90)
        resize_square(source, thumb_destination, 96, 84)

    summary = {
        "sourceDirectory": str(source_dir),
        "publicDirectory": str(public_dir),
        "imageCount": len(sources),
        "tiers": {"full": "PNG source dimensions", "medium": "320px JPEG", "thumb": "96px JPEG"},
        "method": "copy centerline-rendered PNGs and derive matching JPEG display tiers",
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
