# AI Skill Library

A cross-domain, agent-agnostic skill library. Skills are written as structured markdown (`SKILL.md`) with a companion `schema.json`, so they work equally well as:

- **VS Code Copilot agent skills** — auto-installed into `.github/skills/` for use as slash commands
- **AI tool-call definitions** — exported in OpenAI, Anthropic, or Ollama format for any LLM
- **HTTP API** — served at runtime so local or remote agents can discover and fetch skill definitions dynamically

---

## Skills

Organized under `skills/<category>/<name>/`.

| Skill | Category | Tags |
|-------|----------|------|
| `code-review` | coding | review, quality, security, bugs, audit |
| `pr-description` | coding | git, pr, changelog, commit, diff |
| `web-research` | research | search, web, documentation, lookup |

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
# Browse the library
skill-lib list
skill-lib list --category coding
skill-lib search security
skill-lib info code-review

# Install into a project (VS Code / Copilot)
skill-lib install --all
skill-lib install code-review pr-description --force
skill-lib remove web-research

# Export tool definitions for an AI agent
skill-lib export --format openai
skill-lib export --format anthropic --category coding
skill-lib export --format ollama -o tools.json

# Start the HTTP API
skill-lib serve --port 3456 --host 0.0.0.0
```

---

## HTTP API

Start the server, then any agent or LLM on your network can query it:

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

**Example — load tools into an Ollama session from your 3090 rig:**

```js
const tools = await fetch("http://192.168.1.x:3456/export?format=ollama").then(r => r.json());
// pass `tools` directly to ollama.chat({ model, messages, tools })
```

---

## Skill File Format

Each skill lives in `skills/<category>/<name>/` and contains:

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
description: 'What it does and when to invoke it. This is the discovery surface for agents.'
argument-hint: 'Hint shown in VS Code slash command picker'
---
```

### `schema.json`

```json
{
  "input":  { "type": "object", "properties": { ... }, "required": [...] },
  "output": { "type": "object", "properties": { ... } }
}
```

The `input` schema is used verbatim as `parameters` (OpenAI/Ollama) or `input_schema` (Anthropic) when exporting.

---

## Adding a New Skill

```bash
skill-lib new daily-standup --category management --description "Draft a daily standup update"
# → creates skills/management/daily-standup/SKILL.md
# → edit the file to fill in procedure, tags, and output format
# → optionally add a schema.json for tool-call use
```

---

## Using in a Project

### Via npm / GitHub

```bash
npm install --save-dev github:YOUR_USERNAME/ai-skill-library
# postinstall copies all skills to .github/skills/ automatically
```

### Local development with `npm link`

```bash
# In this library
npm link

# In your consumer project
npm link ai-skill-library
npx skill-lib install --all   # postinstall doesn't fire for linked packages
```

Reload VS Code (**Developer: Reload Window**) after installing skills.

---

## Project Structure

```
skills/
  <category>/
    <name>/
      SKILL.md        # instructions + frontmatter
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
```

---

## Publishing

Set `"private": false` and a `"repository"` field in `package.json`, then publish to npm or GitHub Packages to share the library across teams.


## Skills

Skills are organized by category under `skills/<category>/<name>/SKILL.md`.

| Skill | Category | Description |
|-------|----------|-------------|
| `code-review` | coding | Review code for correctness, security, style, and maintainability |
| `pr-description` | coding | Write a clear PR description from changed files and commits |
| `web-research` | research | Research topics on the web and summarize findings |

## CLI — `skill-lib`

A full-featured management CLI is included.

```
Commands:
  list [options]          List all skills, grouped by category
  categories              List all categories with skill counts
  search <query>          Search by name, description, tag, or category
  info <name>             Show full details of a skill
  install [names...]      Install skill(s) into .github/skills/ of a project
  remove <name>           Remove an installed skill from a project
  new <name>              Scaffold a new SKILL.md from a template
```

### Quick examples

```bash
# list everything
skill-lib list

# list only the "coding" category
skill-lib list --category coding

# search across all fields
skill-lib search security

# show full SKILL.md
skill-lib info code-review

# install one skill into the nearest git project
skill-lib install code-review

# install a whole category
skill-lib install --category coding

# install everything
skill-lib install --all

# overwrite already-installed skills
skill-lib install --all --force

# remove a skill from the current project
skill-lib remove code-review

# scaffold a new skill
skill-lib new my-skill --category writing --description "Describe when to use it"
```

## Adding a New Skill

The fastest way is via the CLI:

```bash
skill-lib new my-skill --category <category>
# → creates skills/<category>/my-skill/SKILL.md from a template
# → open it and fill in description, tags, procedure, and output format
```

Or manually: create `skills/<category>/<name>/SKILL.md` with this frontmatter:

```yaml
---
name: <name>          # must match folder name, lowercase-hyphen
category: <category>
tags: [tag1, tag2]
description: 'What it does and when to invoke it.'
argument-hint: 'Optional hint shown in slash command'
---
```

## Installing in a Consumer Project

### A — via npm (recommended)

```bash
npm install --save-dev github:YOUR_USERNAME/ai-skill-library
# postinstall auto-copies all skills to .github/skills/
```

### B — npx (no install)

```bash
npx skill-lib install --all --target /path/to/project
```

### C — `npm link` for local dev

```bash
# In this library
npm link

# In your consumer project
npm link ai-skill-library
npx skill-lib install --all
```

Reload VS Code (**Developer: Reload Window**) after any install.

## Project Structure

```
skills/
  coding/
    code-review/SKILL.md
    pr-description/SKILL.md
  research/
    web-research/SKILL.md
  <your-category>/
    <your-skill>/SKILL.md
bin/
  skill-lib.js          # CLI entry point
lib/
  registry.js           # loads + parses all SKILL.md files
  installer.js          # copies skills into .github/skills/
  scaffold.js           # generates new SKILL.md from template
scripts/
  install.js            # postinstall hook
```

## Skills Included

| Skill | Trigger phrases |
|-------|----------------|
| `web-research` | "look up", "search for", "find documentation" |
| `code-review` | "review this file/PR", "find bugs", "check for issues" |
| `pr-description` | "write a PR description", "summarize this diff" |

## How It Works

Each skill lives in `skills/<name>/SKILL.md`. When installed, skills are copied to `.github/skills/` in your project so VS Code Copilot can discover and load them on demand.

## Installation

### Option A — npm (recommended)

```bash
# Install from GitHub (replace with your repo URL)
npm install --save-dev github:YOUR_USERNAME/ai-skill-library
```

The `postinstall` script automatically copies all skills to `.github/skills/` in your project.

### Option B — manual copy

```bash
npx install-skills
# or point at a specific project root:
npx install-skills /path/to/your/project
```

### Option C — git submodule

```bash
git submodule add https://github.com/YOUR_USERNAME/ai-skill-library .github/skill-library
# Then copy or symlink the skills you want:
cp -r .github/skill-library/skills/* .github/skills/
```

## Local Development (`npm link`)

```bash
# 1. In this library
npm link

# 2. In your consumer project
npm link ai-skill-library

# 3. Run the installer manually (postinstall doesn't fire for linked packages)
npx install-skills
```

Restart VS Code (or run **Developer: Reload Window**) after installing skills.

## Adding a New Skill

1. Create `skills/<your-skill-name>/SKILL.md`
2. Add YAML frontmatter with `name`, `description`, and optionally `argument-hint`
3. Write a clear body: when to use, step-by-step procedure, output format
4. Optionally add `scripts/`, `references/`, or `assets/` subdirectories

The `name` in the frontmatter **must match the folder name**.

## Publishing

Remove `"private": true` from `package.json` and publish to npm or GitHub Packages to share beyond direct installs.