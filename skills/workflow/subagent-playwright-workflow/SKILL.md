---
name: subagent-playwright-workflow
description: Use this skill when a task is large enough to benefit from subagent orchestration and Playwright-based UI verification without bloating main-context tokens.
---

# Subagent Playwright Workflow

Use this skill for multi-step implementation tasks where context size and focus matter.

## Why this exists

A single agent often accumulates too much context across reproduce, implement, and verify phases.
Splitting responsibilities into focused subagents improves quality and keeps prompts tight.

## Recommended orchestration

1. Run an explorer subagent to reproduce and capture exact failure evidence.
2. Run an implementer subagent to apply the smallest targeted code change.
3. Run a UI reviewer subagent to rerun the same Playwright flow and check regressions.
4. Merge findings in the coordinator with explicit pass/fail criteria.

## Role prompt assets

- `explorer-prompt.md`
- `implementer-prompt.md`
- `ui-reviewer-prompt.md`

## Guardrails

- Do not let implementers redefine requirements.
- Reviewer must independently verify outcomes.
- Keep each subagent scoped to one responsibility.
- Prefer one replayable browser flow over many ad hoc checks.
