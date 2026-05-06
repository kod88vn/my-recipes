---
name: clean-code
category: coding
tags: [clean-code, refactor, maintainability, srp, dry, architecture]
execution-mode: tool-call
description: 'Apply clean code standards to keep code modular, readable, and maintainable. Enforces single responsibility, DRY, clear abstraction layers, and prevents megamoth files.'
argument-hint: 'File path(s), module, or feature to refactor using clean code principles'
---

# Clean Code

## When to Use
- "Refactor this code"
- "Apply clean code"
- "This file is too large"
- "Improve maintainability / architecture"
- "Split responsibilities across modules"

## Core Principles (Required)

1. **Single Responsibility (SRP)**
- Each function, class, and module must do one coherent job.
- If a block can be described with "and", split it.

2. **DRY (Don't Repeat Yourself)**
- Remove duplicate logic and centralize shared behavior.
- Prefer small reusable utilities over copy-paste variations.

3. **Clear Abstraction Layers**
- Keep high-level orchestration separate from low-level details.
- Business logic should not be mixed with transport, parsing, storage, or framework plumbing.

4. **No Mixed Detail Levels**
- A function should stay at one level of abstraction.
- Avoid functions that alternate between policy decisions and byte-level/string-level manipulation.

5. **No Megamoth Files**
- Break oversized files into focused modules.
- Suggested threshold: if a file is hard to scan in one pass or has multiple unrelated concerns, split it.

## Procedure

1. **Map responsibilities**
- Identify distinct concerns in the current code.
- Draw boundaries: orchestration, domain logic, adapters/integration, utilities.

2. **Write/confirm safety tests first**
- Add or update tests that protect behavior before refactoring.
- Preserve external behavior and public API unless explicitly requested.

3. **Refactor in small steps**
- Extract focused functions/modules.
- Deduplicate shared logic.
- Rename for intent clarity.

4. **Enforce boundaries**
- High-level modules call interfaces/helpers, not low-level internals.
- Keep parsing, formatting, IO, and framework-specific logic in dedicated helpers.

5. **Verify and report**
- Run tests and lint checks.
- Summarize what was split, deduplicated, and why.

## Output Checklist

- [ ] Responsibilities are separated by module/function
- [ ] Duplicated logic removed
- [ ] High-level flow readable without low-level noise
- [ ] Low-level helpers isolated and named clearly
- [ ] Large file split into coherent units
- [ ] Existing behavior preserved (tests passing)

## Rules
- Prefer minimal, behavior-preserving refactors.
- Do not combine large refactors with feature changes unless requested.
- Keep modules cohesive and dependencies one-directional when possible.
