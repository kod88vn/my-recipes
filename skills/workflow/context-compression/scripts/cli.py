"""CLI wrapper for local context compression."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from .compress import compress_file
    from .detect import detect_file_type, should_compress
except ImportError:  # direct script execution fallback
    from compress import compress_file
    from detect import detect_file_type, should_compress


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 skills/workflow/context-compression/scripts/cli.py <filepath>")
        return 1

    path = Path(sys.argv[1]).expanduser().resolve()
    if not path.exists() or not path.is_file():
        print(f"Error: not a file: {path}")
        return 1

    detected = detect_file_type(path)
    print(f"Detected: {detected}")
    if not should_compress(path):
        print("Skipping: not a natural-language-first file")
        return 0

    try:
        ok = compress_file(path)
    except Exception as exc:  # noqa: BLE001
        print(f"Compression failed: {exc}")
        return 1

    if not ok:
        print("Compression skipped or produced no safe improvement")
        return 2

    print(f"Compressed: {path}")
    print(f"Backup:     {path.with_name(path.stem + '.original.md')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
