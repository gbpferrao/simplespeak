"""Sync the prototype's centerline-rendered image set into the app assets.

The source stays outside the app repository while the prototype is being
reviewed. The checked-in public assets remain the build input, so the app can
build on machines that do not have the review workspace.

The source illustrations are black strokes on white. This script performs the
white-to-alpha and scene-color conversion once at asset-build time, then
stores one lossless WebP per card. The board can use that same sharp source at
every zoom without a runtime canvas mask or a blurry JPEG tier swap.

Default source:
    ..\\simplespeak-centerline-review\\consistent-stroke-33px

Override it with --source-dir when the review workspace moves.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = PROJECT_ROOT.parent / "simplespeak-centerline-review" / "consistent-stroke-33px"
DEFAULT_PUBLIC = PROJECT_ROOT / "public" / "simplespeak-images"
DEFAULT_PACK = PROJECT_ROOT / "src" / "features" / "language-packs" / "data" / "packs" / "ptbr-en" / "simplespeak-v1.json"


def parse_color(value: str) -> tuple[int, int, int]:
    normalized = value.strip().lstrip("#")
    if len(normalized) != 6:
        return (118, 87, 217)
    try:
        return tuple(int(normalized[index:index + 2], 16) for index in (0, 2, 4))
    except ValueError:
        return (118, 87, 217)


def colorize_strokes(source: Path, destination: Path, color: str) -> None:
    with Image.open(source) as image:
        rgb = image.convert("RGB")
        grayscale = ImageOps.grayscale(rgb)
        # White is empty canvas. Preserve antialiased edge pixels as alpha,
        # but do not grow the stroke: the reviewed source already has the
        # desired consistent centerline-derived thickness.
        alpha = grayscale.point(lambda value: 0 if value >= 248 else min(255, round((255 - value) * 1.45)))
        rgba = Image.new("RGBA", rgb.size, (*parse_color(color), 0))
        rgba.putalpha(alpha)
        rgba.save(destination, format="WEBP", lossless=True, method=6)


def load_scene_colors(pack_path: Path) -> dict[str, str]:
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    scenes = {scene["id"]: scene.get("accent", "#7657d9") for scene in pack.get("scenes", [])}
    return {
        Path(card.get("imagePath", "")).stem: scenes.get(card.get("sceneId"), "#7657d9")
        for card in pack.get("cards", [])
        if card.get("imagePath")
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--public-dir", type=Path, default=DEFAULT_PUBLIC)
    parser.add_argument("--pack-path", type=Path, default=DEFAULT_PACK)
    args = parser.parse_args()

    source_dir = args.source_dir.resolve()
    public_dir = args.public_dir.resolve()
    pack_path = args.pack_path.resolve()
    sources = sorted(source_dir.glob("*.png"))
    if not sources:
        raise SystemExit(f"No PNG assets found in {source_dir}")

    public_dir.mkdir(parents=True, exist_ok=True)
    scene_colors = load_scene_colors(pack_path)

    for source in sources:
        destination = public_dir / f"{source.stem}.webp"
        colorize_strokes(source, destination, scene_colors.get(source.stem, "#7657d9"))

    summary = {
        "sourceDirectory": str(source_dir),
        "publicDirectory": str(public_dir),
        "imageCount": len(sources),
        "format": "lossless WebP RGBA",
        "method": "pre-color centerline-rendered strokes and remove white canvas at build time",
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
