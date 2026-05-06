"""Offline markdown compression with safety checks and rollback."""

from __future__ import annotations

import re
from pathlib import Path

try:
    from .detect import should_compress
    from .validate import validate_text
except ImportError:  # direct script import fallback
    from detect import should_compress
    from validate import validate_text

FILLER_WORDS = {
    "really", "basically", "actually", "simply", "generally", "very", "just",
    "clearly", "obviously", "quite", "probably", "maybe", "perhaps",
}

PHRASE_REPLACEMENTS = (
    (r"\bin order to\b", "to"),
    (r"\bmake sure to\b", ""),
    (r"\bit would be helpful to\b", ""),
    (r"\byou should\b", ""),
    (r"\bthe reason is because\b", "because"),
)

URL_REGEX = re.compile(r"https?://[^\s)]+")
PATH_REGEX = re.compile(r"(?:\./|\.\./|/)[\w\-./]+|[\w\-.]+/[\w\-./]+")


def _compress_prose_segment(text: str) -> str:
    protected: list[str] = []

    def _stash(match: re.Match) -> str:
        protected.append(match.group(0))
        return f"__PRESERVE_{len(protected) - 1}__"

    text = URL_REGEX.sub(_stash, text)
    text = PATH_REGEX.sub(_stash, text)

    for pattern, replacement in PHRASE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    text = re.sub(
        r"\b(" + "|".join(re.escape(word) for word in sorted(FILLER_WORDS)) + r")\b",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"\b(a|an|the)\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()

    for index, literal in enumerate(protected):
        text = text.replace(f"__PRESERVE_{index}__", literal)
    return text


def _compress_line(line: str) -> str:
    if not line.strip():
        return line
    if re.match(r"^\s*#{1,6}\s+", line):
        return line

    parts = re.split(r"(`[^`]*`)", line)
    out: list[str] = []
    for part in parts:
        if part.startswith("`") and part.endswith("`"):
            out.append(part)
        else:
            out.append(_compress_prose_segment(part))
    compressed = "".join(out)
    compressed = re.sub(r"\s+", " ", compressed)
    return compressed.rstrip()


def compress_markdown_text(text: str) -> str:
    lines = text.splitlines()
    output: list[str] = []
    in_fence = False
    fence_token = ""

    for line in lines:
        fence_match = re.match(r"^(\s*)(`{3,}|~{3,})(.*)$", line)
        if fence_match:
            token = fence_match.group(2)
            if not in_fence:
                in_fence = True
                fence_token = token[0]
            elif token[0] == fence_token:
                in_fence = False
                fence_token = ""
            output.append(line)
            continue

        if in_fence:
            output.append(line)
            continue
        output.append(_compress_line(line))

    return "\n".join(output).rstrip() + "\n"


def compress_file(filepath: Path) -> bool:
    filepath = filepath.resolve()
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    if not should_compress(filepath):
        return False

    original = filepath.read_text(errors="ignore")
    if not original.strip():
        return False

    compressed = compress_markdown_text(original)
    if not compressed.strip() or compressed.strip() == original.strip():
        return False

    backup_path = filepath.with_name(filepath.stem + ".original.md")
    if backup_path.exists():
        raise FileExistsError(f"Backup already exists: {backup_path}")

    backup_path.write_text(original)
    filepath.write_text(compressed)

    result = validate_text(original, compressed)
    if not result.is_valid:
        filepath.write_text(original)
        backup_path.unlink(missing_ok=True)
        return False
    return True
