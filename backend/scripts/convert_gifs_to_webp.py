#!/usr/bin/env python3
"""
Convert all GIFs in data/gifs/ to animated WebP (60-70% smaller).
The backend will serve WebP automatically to browsers that support it.

Requirements: ffmpeg must be installed and on PATH.
  Windows: https://www.gyan.dev/ffmpeg/builds/  (add bin/ to PATH)
  Mac:     brew install ffmpeg
  Linux:   apt install ffmpeg

Run once from the project root:
  python backend/scripts/convert_gifs_to_webp.py

Already-converted files are skipped on re-run.
"""

import argparse
import subprocess
import sys
from pathlib import Path

GIF_DIR = Path(__file__).parent.parent.parent / "data" / "gifs"

# Mobile-friendly defaults: downscale, drop fps, lossy — cuts ~1.6MB avg to ~200-400KB
# while keeping the hitbox clearly readable in the quiz card.
DEFAULT_WIDTH = 480
DEFAULT_FPS = 20
DEFAULT_QUALITY = 65


def check_ffmpeg() -> bool:
    try:
        r = subprocess.run(["ffmpeg", "-version"], capture_output=True)
        return r.returncode == 0
    except FileNotFoundError:
        return False


def convert_one(gif_path: Path, width: int, fps: int, quality: int, force: bool) -> tuple[str, int, int]:
    """Return (status, original_bytes, webp_bytes). status: 'converted'|'skipped'|'failed'"""
    webp_path = gif_path.with_suffix(".webp")
    orig_size = gif_path.stat().st_size

    if webp_path.exists() and not force:
        return "skipped", orig_size, webp_path.stat().st_size

    # Never upscale (min(width, iw)); keep aspect (-1); lanczos for clean downscale.
    vf = f"fps={fps},scale='min({width},iw)':-1:flags=lanczos"
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", str(gif_path),
            "-vf", vf,
            "-an",
            "-loop", "0",
            "-quality", str(quality),
            "-compression_level", "6",
            str(webp_path),
        ],
        capture_output=True,
    )

    if result.returncode != 0 or not webp_path.exists():
        return "failed", orig_size, 0

    return "converted", orig_size, webp_path.stat().st_size


def main() -> None:
    try:  # avoid UnicodeEncodeError on Windows cp1252 consoles
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    ap = argparse.ArgumentParser(description="Convert data/gifs/*.gif to mobile-friendly animated WebP.")
    ap.add_argument("--width",   type=int, default=DEFAULT_WIDTH,   help="max width px (no upscale)")
    ap.add_argument("--fps",     type=int, default=DEFAULT_FPS,     help="output frames per second")
    ap.add_argument("--quality", type=int, default=DEFAULT_QUALITY, help="WebP quality 0-100 (lossy)")
    ap.add_argument("--force",   action="store_true", help="re-encode even if a .webp already exists")
    args = ap.parse_args()

    if not check_ffmpeg():
        print("ERROR: ffmpeg not found.")
        print("  Windows: https://www.gyan.dev/ffmpeg/builds/")
        print("  Mac:     brew install ffmpeg")
        print("  Linux:   apt install ffmpeg")
        sys.exit(1)

    gif_files = sorted(GIF_DIR.rglob("*.gif"))
    if not gif_files:
        print(f"No GIF files found in {GIF_DIR}")
        sys.exit(0)

    print(f"Found {len(gif_files)} GIF files — converting to WebP "
          f"(width≤{args.width}, {args.fps}fps, q{args.quality}, force={args.force})...\n")

    counts = {"converted": 0, "skipped": 0, "failed": 0}
    total_orig = 0
    total_webp = 0

    for i, gif_path in enumerate(gif_files, 1):
        rel = gif_path.relative_to(GIF_DIR)
        status, orig, webp = convert_one(gif_path, args.width, args.fps, args.quality, args.force)
        counts[status] += 1
        total_orig += orig
        total_webp += webp

        if status == "converted":
            saving = round((1 - webp / orig) * 100) if orig else 0
            print(f"[{i:>3}/{len(gif_files)}] ✓  {rel}  ({orig//1024}KB → {webp//1024}KB  -{saving}%)")
        elif status == "skipped":
            print(f"[{i:>3}/{len(gif_files)}] –  {rel}  (already done)")
        else:
            print(f"[{i:>3}/{len(gif_files)}] ✗  {rel}  (FAILED)")

    print(f"\n{'='*60}")
    print(f"Converted : {counts['converted']}")
    print(f"Skipped   : {counts['skipped']}")
    print(f"Failed    : {counts['failed']}")
    if total_orig:
        overall = round((1 - total_webp / total_orig) * 100)
        print(f"Size      : {total_orig//1024//1024} MB → {total_webp//1024//1024} MB  (-{overall}%)")


if __name__ == "__main__":
    main()
