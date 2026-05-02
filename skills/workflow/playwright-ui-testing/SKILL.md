---
name: playwright-ui-testing
description: Use this skill to verify browser-visible behavior in generated projects or MCP-enabled workflows with Playwright before and after a fix.
---

# Playwright UI Testing

Use this skill when a task mentions browser behavior, generated app verification, screenshots, regressions, forms, or visual validation.

## Workflow

1. Start the relevant generated app and any required skill server.
2. Reproduce the issue exactly before changing code.
3. Inspect the DOM and verify the user-visible outcome.
4. After the fix, rerun the same browser flow.

## What to verify

- Generated project startup behavior
- Root `.github/skills` and MCP-enabled workspace flows
- User-visible UI outcomes in scaffolded apps
- Regressions after template or MCP config changes

## Guardrails

- Use Playwright for real behavior, not assumptions.
- Keep verification focused on the visible problem.
- If the issue is not reproducible, do not guess a UI fix.