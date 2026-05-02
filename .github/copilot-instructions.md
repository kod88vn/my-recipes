# GitHub Copilot Instructions

This repository is the source of truth for an AI skill library and MCP-aware coding workspace scaffold.

## Working rules

- Use the smallest possible change that solves the task.
- Skills and MCP servers are separate layers:
  - skills describe when and how to work
  - MCP servers provide executable capabilities
- Keep generated scaffolds ready to use without manual follow-up steps.

## Repository conventions

- Skill definitions live in `skills/<category>/<name>/`.
- MCP server descriptors live in `mcp/<server-id>/`.
- Scaffold templates live in `templates/turborepo-starter/`.
- Main content lives outside `.github`. `.github` is a compatibility layer for Copilot-facing discovery and should symlink to source content instead of becoming a second editable copy.
- For this repo, treat `skills/` as the source of truth for skill content. Do not treat `.github/skills` as the canonical editable location.
- Project scaffolds should produce:
  - root `.github/skills`
  - root `.vscode/mcp.json` when MCP is enabled
  - root `.skill-lib/project.json`

## MCP workflow

- Prefer updating MCP descriptors, templates, installer logic, and scaffold output together.
- Do not hardcode MCP behavior into unrelated code paths when it belongs in `mcp/`, `lib/mcp-installer.js`, or `lib/mcp-registry.js`.
- Keep the project manifest and rendered client config aligned.

## Validation

- For scaffold changes, validate with `node scripts/validate-scaffold.js <target>`.
- For MCP changes, validate both:
  - `node bin/skill-lib.js mcp ...`
  - fresh scaffold generation via `create-turborepo`
- Prefer the cheapest proof that the generated project is actually usable.

## Preferred AI workflow

When MCP servers are available:
1. Use `context7` for framework and library docs.
2. Use `playwright` for browser verification and UI regressions.
3. Use framework-specific MCP servers such as `nextjs` when the project stack requires them.

When editing this repo:
- Treat `.github/skills`, `skills/`, `mcp/`, and scaffold output as connected surfaces.
- Keep repo-local `.github` guidance useful for coding on this repository itself.