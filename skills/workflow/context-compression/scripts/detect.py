"""Detect whether a file is prose-heavy and safe to compress."""

from __future__ import annotations

import json
import re
from pathlib import Path

COMPRESSIBLE_EXTENSIONS = {".md", ".txt", ".markdown", ".rst", ".typ", ".typst", ".tex"}

SKIP_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml",
    ".toml", ".env", ".lock", ".css", ".scss", ".html", ".xml",
    ".sql", ".sh", ".bash", ".zsh", ".go", ".rs", ".java", ".c",
    ".cpp", ".h", ".hpp", ".rb", ".php", ".swift", ".kt", ".lua",
    ".dockerfile", ".makefile", ".csv", ".ini", ".cfg",
}

CONFIG_EXTENSIONS = {".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".env"}

CODE_PATTERNS = [
    re.compile(r"^\s*(import |from .+ import |require\(|const |let |var )"),
    re.compile(r"^\s*(def |class |function |async function |export )"),
    re.compile(r"^\s*(if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{)"),
    re.compile(r"^\s*[\}\]\);]+\s*$"),
    re.compile(r'^\s*"[^"]+"\s*:\s*'),
]


def _is_code_line(line: str) -> bool:
    return any(pattern.match(line) for pattern in CODE_PATTERNS)


def _is_json_content(text: str) -> bool:
    try:
        json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return False
    return True


def detect_file_type(filepath: Path) -> str:
    ext = filepath.suffix.lower()
    if ext in COMPRESSIBLE_EXTENSIONS:
        return "natural_language"
    if ext in SKIP_EXTENSIONS:
        return "config" if ext in CONFIG_EXTENSIONS else "code"
    if ext:
        return "unknown"

    try:
        text = filepath.read_text(errors="ignore")
    except OSError:
        return "unknown"

    if _is_json_content(text[:10_000]):
        return "config"

    lines = text.splitlines()[:60]
    non_empty = [line for line in lines if line.strip()]
    if not non_empty:
        return "natural_language"

    code_like = sum(1 for line in non_empty if _is_code_line(line))
    if code_like / len(non_empty) > 0.4:
        return "code"
    return "natural_language"


def should_compress(filepath: Path) -> bool:
    if not filepath.is_file():
        return False
    if filepath.name.endswith(".original.md"):
        return False
    return detect_file_type(filepath) == "natural_language"
