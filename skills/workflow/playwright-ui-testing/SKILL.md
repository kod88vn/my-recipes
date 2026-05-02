---
name: playwright-ui-testing
description: Use this skill to verify browser-visible behavior in generated projects or MCP-enabled workflows with Playwright before and after a fix.
---

# Playwright UI Testing

Use this skill when a task mentions browser behavior, generated app verification, screenshots, regressions, forms, or visual validation.

For complex UI debugging or long test flows, combine this with `subagent-playwright-workflow` so each subagent handles one bounded responsibility and keeps the main context focused.

## Workflow

1. Start the relevant generated app and any required skill server.
2. Reproduce the issue exactly before changing code.
3. Inspect the DOM and verify the user-visible outcome.
4. After the fix, rerun the same browser flow.

## Subagent split (recommended)

1. Explorer subagent reproduces and captures exact failure evidence.
2. Implementer subagent applies the smallest change for the confirmed failure.
3. UI reviewer subagent reruns the same flow and checks regressions.

## What to verify

- Generated project startup behavior
- Root `.github/skills` and MCP-enabled workspace flows
- User-visible UI outcomes in scaffolded apps
- Regressions after template or MCP config changes

## Guardrails

- Use Playwright for real behavior, not assumptions.
- Keep verification focused on the visible problem.
- If the issue is not reproducible, do not guess a UI fix.