---
name: repo-mcp-workflow
description: Use this skill when the task benefits from the repository's MCP catalog, generated workspace MCP config, or MCP-aware scaffold/install workflow.
---

# Repo MCP Workflow

This repository includes an MCP catalog and can scaffold MCP-aware coding projects.

## Available workspace concepts

See:
- `mcp/` for server descriptors and templates
- `.vscode/mcp.json` in generated projects for rendered client config
- `.skill-lib/project.json` for enabled skills, MCP servers, and bundles

## How to use this skill

1. Discover available MCP servers first.
2. Use `skill-lib mcp list` and `skill-lib mcp info <id>` to inspect the catalog.
3. Use `skill-lib mcp install` or `create-turborepo --mcp ...` to configure projects.
4. Use `skill-lib mcp doctor` to verify that config and commands line up.
5. Keep skills and MCP config aligned when changing scaffolds.

## Reusable role prompts

Use these companion prompt assets when dispatching subagents for multi-step changes:

- `implementer-prompt.md` for making minimal code changes
- `spec-reviewer-prompt.md` for requirement and acceptance checks
- `quality-reviewer-prompt.md` for regression and code-quality review

This keeps implementation and review roles consistent across sessions.

For UI-heavy tasks, use `subagent-playwright-workflow` to keep browser reproduction, code changes, and regression checks isolated per subagent.

## Important distinction

- MCP tools provide capabilities.
- Skills provide guidance on when and how to use those capabilities.
- The scaffold should wire both into a ready-to-use project.