---
name: debugging
category: coding
tags: [debug, bdd, tdd, testing, bug, fix, reproduce]
execution-mode: tool-call
description: 'Debug issues using BDD-style triage: reproduce the bug in a failing test first, then fix, then verify. Use when asked to fix a bug, investigate unexpected behavior, or diagnose a failing test.'
argument-hint: 'Description of the bug, error message, or failing test'
---

# Debugging (BDD-Style)

## When to Use
- "Fix this bug / error"
- "Why is this failing?"
- "Investigate this unexpected behavior"
- Any issue that needs a root-cause fix rather than a workaround

## Procedure

### 1. Understand the Bug
- Read the error message, stack trace, or reproduction steps carefully.
- Identify the affected module, function, or component.
- Gather relevant context: related files, existing tests, recent changes.

### 2. Write a Failing Reproduction Test (Required)
- Before touching any production code, write a **unit test or integration test** that:
  - Directly exercises the reported behavior.
  - Fails in a way that precisely captures the bug (not just "something is wrong").
- Run the test to confirm it fails. Do **not** proceed to fix until this step is complete.

### 3. Implement the Fix
- Make the minimal change needed to make the reproduction test pass.
- Do not refactor or add features at this stage.

### 4. Verify
- Run the reproduction test — it must now pass.
- Run the full test suite to check for regressions.
- If regressions appear, address them before considering the fix complete.

### 5. Report
- Summarize: root cause, the fix applied, and how the reproduction test covers it.

## Rules
- **Never skip step 2.** A fix without a reproduction test is not complete.
- Prefer the narrowest test scope that still catches the bug (unit > integration > e2e).
- If no test infrastructure exists, create the minimum scaffolding needed for the reproduction test.
