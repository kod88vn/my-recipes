---
name: context7-docs
description: Use this skill when you need accurate, version-aware docs for frameworks, libraries, or tooling before changing code in this repository or in generated scaffolds.
---

# Context7 Docs

Use this skill whenever a task depends on framework behavior, library APIs, configuration details, or MCP tool semantics.

## Workflow

1. Query Context7 before changing code when behavior is uncertain.
2. Extract only the rules needed for the current task.
3. Prefer repo-consistent changes over broad rewrites.
4. Re-validate the exact behavior that depended on the docs lookup.

## Repo reminders

- Skills live in `skills/`.
- MCP descriptors live in `mcp/`.
- Generated projects should be usable without manual cleanup.

## When not to use this skill

- Do not spend time on docs lookup if this repo already shows a working local pattern.
- Do not guess APIs when Context7 can confirm them quickly.