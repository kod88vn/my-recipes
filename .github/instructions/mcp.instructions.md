---
applyTo: "bin/create-turborepo.js,bin/skill-lib.js,lib/mcp-*.js,mcp/**/*.json,scripts/validate-scaffold.js,templates/turborepo-starter/**"
---

This repository models MCP servers as a separate layer from skills.

Source-of-truth rule:
- Main reusable content should live outside `.github`.
- `.github` should expose symlinks or rendered compatibility views into the main content rather than becoming the primary editable store.
- For skills, prefer editing `skills/` and project-scaffold source templates, then link `.github/skills` to that source.

When changing MCP-aware code:
- Treat skills as guidance and MCP servers as capabilities.
- Put server metadata in `mcp/<server-id>/server.json`.
- Put client-specific rendered config fragments in `mcp/<server-id>/templates/`.
- Update installer behavior in `lib/mcp-installer.js` rather than scattering config writes.
- Keep `.skill-lib/project.json` and rendered `.vscode/mcp.json` in sync.
- Validate scaffold output after MCP changes.

When changing scaffold behavior:
- Root `.github/skills` must still be created.
- Root `.vscode/mcp.json` must be rendered when MCP is enabled.
- Root `.skill-lib/project.json` must reflect the enabled MCP servers and bundles.

Do not treat MCP descriptors as if they were `SKILL.md` files.