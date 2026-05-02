# Turborepo Starter & Integration Guide

Goal: quickly scaffold a Turborepo-style monorepo and add this `ai-skill-library` as a local workspace package so you can iterate on the library and consumer apps without publishing.

This document contains:
- Quick commands to scaffold a monorepo
- An example project layout and `package.json` snippets
- A reusable AI prompt to generate a new consumer app configured to use `ai-skill-library`
- Two integration options: local workspace (recommended) and git submodule

---

Quick overview (recommended flow)

1. Create a new monorepo root (or convert an existing repo) using npm workspaces / pnpm workspaces.
2. Add `ai-skill-library` as a workspace package by copying/placing it under `packages/skill-lib` (or adding as git submodule).
3. Create an `apps/<your-app>` that depends on `ai-skill-library` using `workspace:*`.
4. Use `npm install` at repo root to symlink workspaces; iterate locally.
5. Optionally add `turbo` for caching across tasks.

---

Commands — quick start

```bash
# 1) scaffold an empty monorepo
mkdir my-monorepo && cd my-monorepo
# initialize root package.json
cat > package.json <<'JSON'
{
  "private": true,
  "workspaces": ["packages/*","apps/*"],
  "scripts": {
    "install": "npm install",
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint"
  }
}
JSON

npm install --save-dev turbo # optional but recommended

# 2) add this library into the monorepo as a local package
# Option A (fast, local): copy this repo into packages/skill-lib
cp -r /path/to/ai-skill-library packages/skill-lib
# Option B (git submodule): keep upstream history
git submodule add git@github.com:kod88vn/my-recipes.git packages/skill-lib

# 3) create an example consumer app
mkdir -p apps/consumer
cat > apps/consumer/package.json <<'JSON'
{
  "name": "apps-consumer",
  "private": true,
  "version": "0.0.0",
  "dependencies": {
    "ai-skill-library": "workspace:*"
  },
  "scripts": {
    "dev": "node ./start.js"
  }
}
JSON

# 4) install (symlinks workspace packages)
npm install

# 5) iterate: edit packages/skill-lib and run the consumer app; no publish needed
cd apps/consumer
npm run dev
```

Notes: `npm install` when the root `package.json` contains `workspaces` will create symlinks so `apps/consumer` sees `ai-skill-library` locally.

---

Example `turbo.json` (basic)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "dependsOn": [],
      "outputs": []
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

AI Prompt — scaffold a new consumer app in Turborepo style

Use this prompt with an LLM (or in a GitHub Codespace) to auto-generate a small `apps/<name>` that knows how to use the skills API:

"""
Create a new Turborepo-style consumer app called `apps/<<APP_NAME>>` that depends on a local workspace package `ai-skill-library`. The workspace root uses npm workspaces (workspaces: ["packages/*","apps/*"]). The consumer app should include:

- `package.json` with `ai-skill-library: "workspace:*"` dependency and a `dev` script.
- `start.js` that demonstrates: calling the local skill server at `http://127.0.0.1:3456`, fetching the /skills list and printing names; then fetch `/export?format=ollama` and save to `tools.json`.
- A README with quick run instructions:
  - How to run `npm install` at repo root
  - How to start the skill server from `packages/skill-lib` (e.g., `node packages/skill-lib/bin/skill-lib.js serve`) and the app (`npm --prefix apps/<<APP_NAME>> run dev`).

Return the full tree for `apps/<<APP_NAME>>` with file contents.
"""

Replace `<<APP_NAME>>` when invoking the LLM. The produced app is a helpful starter that demonstrates runtime usage without coupling to implementation details.

---

Integration choices

- Local workspace (recommended): copy the repo into `packages/skill-lib` or add the library as a package in the monorepo. Easy iteration and `npm install` symlinks.
- Git submodule: keep upstream repo history and push changes upstream; still works with workspaces if the submodule contains a `package.json` with the same package name.
- Package publish: if you prefer versioned releases, publish to an internal npm registry and consume with semver. Slower iteration.

---

How consumer apps should use the skills

- Discovery (development): call `http://127.0.0.1:3456/skills` to list skills and `GET /skills/:name` to fetch details.
- Tools for agents: fetch `GET /export?format=ollama` (or `openai`) and pass the returned JSON to your LLM runtime.
- Local install for Copilot: run `node packages/skill-lib/bin/skill-lib.js install --all --target /path/to/consumer/repo` to copy SKILL.md files into `.github/skills/` inside the consumer project.

---

If you want, I can now:
- scaffold the `templates/turborepo-starter` in this repo (root `package.json`, `turbo.json`, `apps/consumer` sample), or
- generate the actual `apps/consumer` files from the above AI prompt for a concrete app name.

Which should I do? (I will create files and commit them.)
