Create-Turborepo Requirements
=============================

This file lists the concrete requirements for the `create-turborepo` scaffold produced by the CLI.

Required outputs (for a valid consumer monorepo):

- Root `package.json` containing `workspaces` with `apps/*` (npm workspaces/Turborepo starter).
- `apps/ai-skill-library` present and containing:
  - `bin/skill-lib.js` (CLI entry for the skill server)
  - `lib/` directory with core modules (`registry.js`, `exporter.js`, etc.)
  - `skills/` directory (may be empty but must exist)
  - `ui/` directory containing `app.py` (Streamlit UI)
- `apps/<consumer>` (e.g., `apps/virtual-tutor`) present and containing:
  - `link-skills.sh` script at app root (to symlink skills into `.github/skills`), OR
  - a `package.json` script entry named `link-skills` that runs the script

Operational expectations:
- After scaffolding, running the consumer `link-skills.sh` should create `.github/skills` as a symlink pointing to `apps/ai-skill-library/skills`.
- The CLI should attempt `watt resolve` if `watt` is available, otherwise fallback to `git clone` for `ai-skill-library`.
- The CLI should auto-run the `link-skills` helper for the consumer app unless explicitly skipped.

Validation is automated by `scripts/validate-scaffold.js` and checks the above artifacts.
