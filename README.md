# AI Skill Library

AI skill + MCP catalog with a scaffold CLI for creating ready-to-use coding workspaces.

## What this repo gives you

- File-based skills (`skills/`) as the source of truth
- MCP server catalog (`mcp/`) with bundles and client templates
- `skill-lib` CLI for skills + MCP workflows
- `create-turborepo` CLI for generating a working monorepo scaffold

## Quick Start

```bash
npm install
npm run smoke

# Start API
npm run serve

# Optional: UI dashboard
npm run ui
```

## Scaffold a new project

```bash
create-turborepo --yes --app virtual-tutor --target /Users/kod/dev/virtual-tutor --no-watt --install
```

Generated project includes:

- root `.github/skills` (symlink to source skills)
- root `.vscode/mcp.json` (when MCP is enabled)
- root `.skill-lib/project.json` manifest

## Most-used commands

```bash
# Skills
node bin/skill-lib.js list
node bin/skill-lib.js info code-review
node bin/skill-lib.js export --format ollama

# MCP
node bin/skill-lib.js mcp list
node bin/skill-lib.js mcp bundles
node bin/skill-lib.js mcp install context7 --target /path/to/project
node bin/skill-lib.js mcp doctor --target /path/to/project
```

`mcp list` and `mcp bundles` now include stability/channel metadata to make rollout risk visible.

## Subagent-first workflow

For large tasks, prefer a subagent split to avoid context-window bloat:

- subagent 1: explore/reproduce and collect evidence
- subagent 2: implement the smallest fix
- subagent 3: verify/regression-check with Playwright

See `skills/workflow/subagent-playwright-workflow/` for reusable role prompts.

## Source-of-truth rule

- Main content lives outside `.github`
- `.github` is a compatibility/discovery layer
- `skills/` is canonical; `.github/skills` should be a symlink/projection

## More docs

- `DESIGN.md` — architecture and contracts
- `CREATE_TURBOREPO_REQUIREMENTS.md` — scaffold requirements and validation
- `TURBO_SETUP.md` — monorepo setup notes
- `scripts/smoke-workflow.sh` — fast scaffold + MCP smoke test

## Verified Restart (virtual-tutor)

Validated on 2026-05-02 with:

```bash
node scripts/validate-scaffold.js /Users/kod/dev/virtual-tutor
# VALID: scaffold appears to meet requirements

node /Users/kod/dev/virtual-tutor/apps/ai-skill-library/bin/skill-lib.js serve

node /Users/kod/dev/virtual-tutor/apps/virtual-tutor/start.js
# fetched skills and generated tools.json
```
