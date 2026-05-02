# AI Skill Library

A cross-domain, agent-agnostic skill library. Skills are written as structured markdown (`SKILL.md`) with a companion `schema.json`, so they work equally well as:

- **VS Code Copilot agent skills** — auto-installed into `.github/skills/` for use as slash commands
- **AI tool-call definitions** — exported in OpenAI, Anthropic, or Ollama format for any LLM
- **HTTP API** — served at runtime so local or remote agents can discover and fetch skill definitions dynamically
- **Visual dashboard** — Streamlit UI for browsing, searching, exporting, and monitoring your skill library at scale

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

## CLI — `skill-lib`

```
skill-lib <command> [options]

Commands:
  list [options]              List all skills, grouped by category
    -c, --category <cat>        Filter by category
    -t, --tag <tag>             Filter by tag

  categories                  List categories with skill counts

  search <query>              Full-text search (name, description, tags, category)

  info <name>                 Show full SKILL.md for a skill

  install [names...]          Copy skill(s) into .github/skills/ of a project
    -c, --category <cat>        Install all skills in a category
    -a, --all                   Install every skill
    -f, --force                 Overwrite already-installed skills
        --target <dir>          Target project root (default: nearest .git)

  remove <name>               Remove an installed skill from a project
        --target <dir>          Target project root

  new <name>                  Scaffold a new skill from a template
    -c, --category <cat>        Category to place it in (required)
    -d, --description <desc>    Pre-fill the description

  export [names...]           Print skill tool-call definitions as JSON
    -f, --format <fmt>          openai | anthropic | ollama | generic (default: generic)
    -c, --category <cat>        Filter by category
    -o, --output <file>         Write to file instead of stdout

  serve                       Start the HTTP skill registry API
    -p, --port <port>           Port (default: 3456)
        --host <host>           Host (default: 127.0.0.1)
```

### Examples

```bash
# Browse
skill-lib list
skill-lib list --category coding
skill-lib search security
skill-lib info code-review

# Install into a VS Code / Copilot project
skill-lib install --all
skill-lib install code-review pr-description --force
skill-lib remove web-research

# Export tool definitions
skill-lib export --format openai
skill-lib export --format anthropic --category coding
skill-lib export --format ollama -o tools.json

# Start the HTTP API
skill-lib serve --port 3456 --host 0.0.0.0
```

---

## HTTP API

```bash
skill-lib serve --host 0.0.0.0 --port 3456
```

| Endpoint | Description |
|----------|-------------|
| `GET /` | Library info and endpoint listing |
| `GET /skills` | List all skills (`?category=`, `?tag=`, `?q=`) |
| `GET /skills/:name` | Full skill detail including schema |
| `GET /skills/:name?format=openai` | Single skill as tool definition |
| `GET /export?format=ollama` | All skills as tool array (`?category=`, `?names=`) |
| `POST /skills/:name/execute` | Hook for a custom executor (returns 501 by default) |

Valid formats: `openai` · `anthropic` · `ollama` · `generic`

**Example — load tools into an Ollama session from a remote machine:**

```js
const tools = await fetch("http://192.168.1.x:3456/export?format=ollama").then(r => r.json());
// pass `tools` directly to ollama.chat({ model, messages, tools })
```

---

## Streamlit Dashboard

A visual management UI built on top of the HTTP API. Requires Python + Streamlit.

```bash
# Install Python dependencies (one-time)
pip3 install -r ui/requirements.txt

# Start (server must be running first)
npm run ui           # → http://localhost:8501
```

| Page | What you can do |
|------|----------------|
| **📚 Browse** | Filter by category + tags; expand any skill to read its `SKILL.md` and `schema.json` side-by-side |
| **🔍 Search** | Full-text search across name, description, tags, and category |
| **📤 Export** | Pick format (OpenAI / Anthropic / Ollama / generic), scope (all / category / hand-picked), preview and download the JSON |
| **📊 Stats** | Skill count, category bar chart, execution mode breakdown, weighted tag cloud |

The API base URL is configurable in the sidebar — point it at any `skill-lib serve` instance, including one on a remote machine.

---

## Skill File Format

Each skill lives in `skills/<category>/<name>/` and contains two files:

```
skills/coding/code-review/
├── SKILL.md      # Human + agent instructions
└── schema.json   # Machine-readable input/output schemas
```

### `SKILL.md` frontmatter

```yaml
---
name: my-skill            # required — must match folder name (lowercase-hyphen)
category: coding          # required — determines folder grouping
tags: [tag1, tag2]        # for search and filtering
execution-mode: tool-call # tool-call | prompt-only
description: 'What it does and when to invoke it.'
argument-hint: 'Hint shown in VS Code slash command picker'
---
```

### `schema.json`

```json
{
  "input":  { "type": "object", "properties": { }, "required": [] },
  "output": { "type": "object", "properties": { } }
}
```

The `input` object is used verbatim as `parameters` (OpenAI/Ollama) or `input_schema` (Anthropic) when exporting.

---

## Adding a New Skill

```bash
skill-lib new daily-standup --category management --description "Draft a daily standup update"
# → creates skills/management/daily-standup/SKILL.md
# → edit it to fill in the procedure, tags, and output format
# → optionally add schema.json for tool-call use
```

---

## Installing Skills into a Consumer Project

### A — npm / GitHub (recommended)

```bash
npm install --save-dev github:YOUR_USERNAME/ai-skill-library
# postinstall auto-copies all skills to .github/skills/
```

### B — npx (no install)

```bash
npx skill-lib install --all --target /path/to/project
```

### C — npm link (local dev)

```bash
# In this library
npm link

# In your consumer project
npm link ai-skill-library
npx skill-lib install --all
```

Reload VS Code (**Developer: Reload Window**) after installing skills.

---

## Project Structure

```
skills/
  <category>/
    <name>/
      SKILL.md        # instructions + YAML frontmatter
      schema.json     # input/output JSON Schema (optional but recommended)
bin/
  skill-lib.js        # CLI entry point
lib/
  registry.js         # load, parse, and search all skills
  installer.js        # copy/remove skills in .github/skills/
  scaffold.js         # generate new SKILL.md from template
  exporter.js         # convert skills to OpenAI / Anthropic / Ollama / generic format
  server.js           # zero-dependency HTTP REST API
scripts/
  install.js          # npm postinstall hook
ui/
  app.py              # Streamlit dashboard
  requirements.txt    # Python dependencies
```

---

## Publishing

Set `"private": false` and add a `"repository"` field in `package.json`, then publish to npm or GitHub Packages to share the library across teams.
