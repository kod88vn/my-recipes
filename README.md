# AI Skill Library

Cross-domain, agent-agnostic skill library — skills work as VS Code Copilot agent skills, OpenAI / Anthropic / Ollama tool definitions, and a live HTTP API.

> Architecture, module contracts, and format specs: [DESIGN.md](DESIGN.md)

---

## Quick Start

```bash
npm install          # installs dependencies + copies skills to .github/skills/

# Terminal 1 — HTTP skill server
npm run serve        # → http://127.0.0.1:3456

# Terminal 2 — Streamlit dashboard
npm run ui           # → http://localhost:8501
```

---

## Skills

| Skill | Category | Tags |
|-------|----------|------|
| `code-review` | coding | review, quality, security, bugs, audit |
| `pr-description` | coding | git, pr, changelog, commit, diff |
| `web-research` | research | search, web, documentation, lookup |

Skills live under `skills/<category>/<name>/`.

---

## Common Tasks

### Add a skill

```bash
node bin/skill-lib.js new <name> --category <cat> --description "..."
# edit skills/<cat>/<name>/SKILL.md
# optionally add skills/<cat>/<name>/schema.json
```

### Browse / search

```bash
node bin/skill-lib.js list
node bin/skill-lib.js list --category coding
node bin/skill-lib.js search security
node bin/skill-lib.js info code-review
```

### Export tool definitions

```bash
node bin/skill-lib.js export --format openai
node bin/skill-lib.js export --format ollama -o tools.json
node bin/skill-lib.js export --format anthropic --category coding
```

### Install skills into a VS Code / Copilot project

```bash
node bin/skill-lib.js install --all
node bin/skill-lib.js install code-review pr-description --force
node bin/skill-lib.js remove code-review
```

Reload VS Code (**Developer: Reload Window**) after installing.

### Expose API to remote machines (e.g. 3090 rig)

```bash
node bin/skill-lib.js serve --host 0.0.0.0 --port 3456
# in your agent:
# fetch("http://<mac-ip>:3456/export?format=ollama")
```

---

## CLI Quick Reference

```
node bin/skill-lib.js <command> [options]

  list        [-c category] [-t tag]
  categories
  search      <query>
  info        <name>
  install     [names...] [-c cat] [-a] [-f] [--target dir]
  remove      <name> [--target dir]
  new         <name> -c <cat> [-d description]
  export      [names...] [-f format] [-c cat] [-o file]
  serve       [-p port] [--host host]
```

HTTP API endpoints: `GET /skills`, `GET /skills/:name`, `GET /export?format=`, `POST /skills/:name/execute`
See [DESIGN.md](DESIGN.md) for full API and module docs.

---

## Project Layout

```
skills/<category>/<name>/
  SKILL.md          agent instructions + YAML frontmatter
  schema.json       input/output JSON Schema (optional)
bin/skill-lib.js    CLI
lib/                registry, installer, scaffold, exporter, server
ui/app.py           Streamlit dashboard
scripts/install.js  postinstall hook
```

---

## Install in Another Project

```bash
# via npm
npm install --save-dev github:YOUR_USERNAME/ai-skill-library

# local link
npm link                         # in this repo
npm link ai-skill-library        # in consumer project
node bin/skill-lib.js install --all
```
