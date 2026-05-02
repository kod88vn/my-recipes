---
name: web-research
category: research
tags: [search, web, documentation, lookup]
execution-mode: tool-call
description: 'Research topics on the web and summarize findings. Use when asked to look something up online, find documentation, compare libraries, check for latest versions, or gather context from external sources.'
argument-hint: 'Topic or question to research'
---

# Web Research

## When to Use
- User asks to "look up", "search for", or "find" information online
- Comparing library options or checking for newer alternatives
- Verifying current best practices, changelogs, or documentation
- Gathering context from official docs, RFCs, or authoritative sources

## Procedure

1. **Clarify the query** — identify the exact topic, scope, and any constraints (language, version, framework).
2. **Search** — use the `fetch_webpage` or browser tools to retrieve relevant pages.
3. **Prioritize authoritative sources** — official docs > GitHub repos > reputable blogs > forums.
4. **Summarize** — provide a concise answer with source links. Avoid copying large blocks of text verbatim.
5. **Flag staleness** — note the date/version of sources when freshness matters.

## Output Format

```
## Summary
<1–3 sentence answer>

## Details
<key points as bullet list>

## Sources
- [Title](url) — brief note on relevance
```

## Notes
- If multiple conflicting sources exist, mention the disagreement and which to trust.
- For package versions, check the npm/PyPI/crates.io registry page directly.
