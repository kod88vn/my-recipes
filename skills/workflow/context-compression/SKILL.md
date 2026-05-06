---
name: context-compression
category: workflow
tags: [compression, prompts, docs, token-efficiency, context]
description: 'Use this skill to compress long prompt files, notes, and markdown-heavy context while preserving structure, code, commands, and technical meaning.'
argument-hint: 'Path, pasted content, or target section to compress'
---

# Context Compression

Use this skill when the user wants to shrink a long markdown file, prompt, notes document, or planning artifact without losing important technical content.

## Goal

Shorten natural-language content so it consumes less context while keeping the document usable.

## What to preserve exactly

- fenced code blocks
- inline code
- commands
- file paths
- URLs and markdown links
- environment variables
- API names, library names, identifiers, and version numbers
- headings, list structure, tables, and frontmatter

## What to compress

- filler and pleasantries
- repeated explanations of the same point
- long transitions and softeners
- redundant examples when one example is enough
- verbose instructions like "make sure to" or "it would be helpful to"

## Editing rules

- Compress prose, not literals.
- Keep the original section order unless the user asks for restructuring.
- Preserve checklist items and numbered sequence order.
- If content mixes prose and code, rewrite only the prose.
- If a sentence becomes ambiguous after compression, keep the longer version.

## Procedure

1. Identify the parts that are mostly natural language.
2. Preserve read-only regions such as code blocks and commands.
3. Rewrite prose into shorter, direct statements.
4. Remove duplicate bullets and repeated rationale.
5. Re-read the result to ensure no technical meaning changed.

## Output options

- return a compressed rewrite inline
- update the target markdown file in place
- provide both original and compressed versions for comparison

## Local Python tooling

This skill now includes a local Python pipeline for file-based compression.
Run the CLI file directly:

```bash
python3 skills/workflow/context-compression/scripts/cli.py <path-to-file>
```

Behavior:

- Detects whether the file is natural-language-first.
- Creates a backup as `<name>.original.md` before writing.
- Validates that headings, fenced code blocks, inline code, and URLs are preserved.
- Restores the original if validation fails.

## Boundaries

- Do not apply this to source code files unless the user explicitly wants comments or prose compressed.
- Do not change executable content.
- Do not rewrite legal text, license terms, or security warnings unless the user explicitly asks.