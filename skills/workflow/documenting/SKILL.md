---
name: documenting
category: workflow
tags: [documentation, design-doc, adr, architecture, living-docs]
execution-mode: tool-call
description: 'Create and maintain living project documentation: canonical design doc, architecture decision records (ADRs), and keep existing docs in sync with the codebase. Use when asked to document a project, write a design doc, record an architecture decision, or refresh stale docs.'
argument-hint: 'Project or module to document, or specific doc type: design-doc | adr | refresh'
---

# Documenting

## When to Use
- "I need a design document"
- "Document this project / module / API"
- "Add an ADR for this decision"
- "Keep docs in sync with the code"
- "Refresh the README / guides after refactoring"

## What to Produce

Deliver the full documentation package unless the user asks for a subset:

| Artifact | Purpose |
|----------|---------|
| `DESIGN.md` | Canonical living design document — single source of truth for architecture |
| `docs/adr/README.md` | ADR index with template |
| `docs/adr/ADR-NNN-*.md` | One file per significant architecture decision |
| Refreshed `README.md` | Module map, config table, API contract, links to DESIGN.md |
| Refreshed developer guides | Current module references, ADR cross-links, no stale line numbers |

---

## Procedure

### 1. Read the codebase first
- Identify all modules and their responsibilities.
- Note the request/response lifecycle, event contracts, config values, and failure modes.
- Find existing docs (README, GUIDES, etc.) and identify stale content.

### 2. Create `DESIGN.md` (canonical design doc)
Include all of these sections:

1. **Overview** — one paragraph: what the system does and its key technologies
2. **Module Map** — directory tree + table of responsibilities (one row per module)
3. **Request Lifecycle** — ASCII diagram or numbered steps showing end-to-end data flow
4. **Event/API Contract** — every event shape, endpoint, or protocol message in a table
5. **Configuration** — env variables, constants, and defaults in a table
6. **Failure Modes** — table of failure scenarios and recovery behaviour
7. **Architecture Decisions** — table linking to ADR files
8. **Extension Points** — where and how to add new tools, backends, providers, etc.
9. **Doc Update Checklist** — checkboxes for what must be updated in the same PR as a code change

### 3. Create `docs/adr/` with initial ADRs
- Create `docs/adr/README.md` as an index table + blank template.
- Write one ADR file per significant decision already made. Typical candidates:
  - Non-obvious protocol choices (streaming vs non-streaming, SSE vs WebSocket)
  - Workarounds for third-party limitations (XML fallback, search fallback on blocked pages)
  - Structural choices (monorepo layout, module split rationale)
  - Performance or reliability trade-offs (planning pass cap, history compression)
- Each ADR follows this structure:
  ```md
  # ADR-NNN — Title
  ## Status
  ## Context
  ## Decision
  ## Consequences
  ```

### 4. Refresh existing docs
- **README.md**: update module tree, config table, API/event contract examples, add link to DESIGN.md
- **Developer guides**: replace stale line-number references with module/function names, add ADR cross-links, remove duplicate content
- Do not rewrite docs that are already accurate — only update what is stale.

### 5. Verify
- Confirm all cross-links between DESIGN.md, ADRs, README, and guides resolve correctly.
- Confirm no stale line-number or old file-path references remain.
- Run a repo-wide stale-term sweep before finishing (examples: old framework versions, removed behaviors, deprecated patterns) and patch any leftovers.
- Re-check ADR index statuses against current implementation; mark ADRs `Deprecated` or `Superseded` when behavior has changed.

---

## Rules
- `DESIGN.md` is the single source of truth. README and guides link to it; they do not duplicate it.
- Every significant design decision must have an ADR. "Significant" = non-obvious, affects future contributors, or has meaningful trade-offs.
- Docs must stay in sync with code. The doc-update checklist in `DESIGN.md` defines what triggers an update.
- Do not create markdown files unless asked. This skill is invoked explicitly; don't proactively write docs during coding tasks.
- Prefer updating existing docs over creating new ones for minor changes.

## Automatic Doc Updates (Mandatory)

Whenever a feature is added, changed, or a direction shifts, update docs **in the same task** — never defer:

| Change type | What to update |
|---|---|
| New tool / capability added | `DESIGN.md` module map + event contract table; new ADR if decision is non-obvious |
| Tool behaviour changed | `DESIGN.md` event contract + failure modes; existing ADR status → Superseded if applicable |
| New SSE event shape | `DESIGN.md` event/API contract table; GUIDES.md example flows |
| Config / constant changed | `DESIGN.md` configuration table |
| New module or file added | `DESIGN.md` module map; README module tree |
| Architecture direction shift | New ADR; update `DESIGN.md` overview and decision table |
| Bug fix with behavioural impact | Update failure modes table; add or update ADR |

**How to do it without being asked:**
1. After implementing the change, identify which rows in the table above apply.
2. Open the relevant doc(s) and apply the minimum accurate update.
3. Do not rewrite unrelated sections — scope the edit tightly.
4. Do not create new markdown files for minor changes — update in place.
