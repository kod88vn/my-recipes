"""Validation checks that compressed markdown preserved critical literals."""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field

URL_REGEX = re.compile(r"https?://[^\s)]+")
HEADING_REGEX = re.compile(r"^(#{1,6})\s+(.*)", re.MULTILINE)
INLINE_CODE_REGEX = re.compile(r"`([^`]+)`")
FENCE_OPEN_REGEX = re.compile(r"^(\s{0,3})(`{3,}|~{3,})(.*)$")


@dataclass
class ValidationResult:
    is_valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, message: str) -> None:
        self.is_valid = False
        self.errors.append(message)

    def add_warning(self, message: str) -> None:
        self.warnings.append(message)


def extract_headings(text: str) -> list[tuple[str, str]]:
    return [(level, title.strip()) for level, title in HEADING_REGEX.findall(text)]


def extract_urls(text: str) -> set[str]:
    return set(URL_REGEX.findall(text))


def extract_inline_codes(text: str) -> Counter:
    text_without_fences = re.sub(r"^```[\s\S]*?^```", "", text, flags=re.MULTILINE)
    text_without_fences = re.sub(r"^~~~[\s\S]*?^~~~", "", text_without_fences, flags=re.MULTILINE)
    return Counter(INLINE_CODE_REGEX.findall(text_without_fences))


def extract_code_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    lines = text.split("\n")
    index = 0
    while index < len(lines):
        open_match = FENCE_OPEN_REGEX.match(lines[index])
        if not open_match:
            index += 1
            continue
        fence_char = open_match.group(2)[0]
        fence_len = len(open_match.group(2))
        block_lines = [lines[index]]
        index += 1
        closed = False
        while index < len(lines):
            close_match = FENCE_OPEN_REGEX.match(lines[index])
            if (
                close_match
                and close_match.group(2)[0] == fence_char
                and len(close_match.group(2)) >= fence_len
                and close_match.group(3).strip() == ""
            ):
                block_lines.append(lines[index])
                closed = True
                index += 1
                break
            block_lines.append(lines[index])
            index += 1
        if closed:
            blocks.append("\n".join(block_lines))
    return blocks


def validate_text(original_text: str, compressed_text: str) -> ValidationResult:
    result = ValidationResult()

    if extract_headings(original_text) != extract_headings(compressed_text):
        result.add_error("Headings changed")

    if extract_code_blocks(original_text) != extract_code_blocks(compressed_text):
        result.add_error("Fenced code blocks changed")

    original_urls = extract_urls(original_text)
    compressed_urls = extract_urls(compressed_text)
    if original_urls != compressed_urls:
        result.add_error("URLs changed")

    if extract_inline_codes(original_text) != extract_inline_codes(compressed_text):
        result.add_error("Inline code changed")

    if len(compressed_text.strip()) >= len(original_text.strip()):
        result.add_warning("Compressed output is not shorter")

    return result
