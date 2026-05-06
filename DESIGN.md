# Design & Requirements

Reference document for architecture decisions, data formats, and module contracts. Keep this up to date as the system evolves.

---

## Goals

1. **Agent-agnostic** — skills must be consumable by VS Code Copilot, OpenAI, Anthropic, Ollama, and any local LLM without modification.
2. **Human-readable source of truth** — skill definitions live as plain Markdown + JSON files in version control, not a database.
3. **Zero runtime dependencies for core** — `lib/` and `bin/` use only Node built-ins + `commander`. No express, no zod, no ORM.
4. **Scale-friendly tooling** — CLI + HTTP API + Streamlit dashboard so the library stays manageable as the skill count grows.
5. **Composable capability stack** — skills, MCP servers, exported tool schemas, and project scaffolds must work together as one suite rather than separate products.

---

## Skill File Format

### Source of truth vs `.github`

- Main reusable content should live in the repository's primary content folders, not inside `.github`.
- `.github` exists as a compatibility/discovery surface for Copilot and similar tooling.
- When practical, `.github` should symlink to the main content rather than storing a second editable copy.
- In this repo, `skills/` is the source of truth for skill content; `.github/skills` should be treated as a projection of that content.
- The same rule should apply to other reusable AI workflow assets introduced later: keep canonical content in the main content area, and expose `.github` views via symlink or generated projection.

### Directory layout

```
skills/<category>/<name>/
├── SKILL.md      # instructions + YAML frontmatter (required)
└── schema.json   # input/output JSON Schema (optional, enables tool-call export)
```

- `<name>` must be lowercase-hyphen, 1–64 characters, matching the `name` field in frontmatter.
- `<category>` is a free-form grouping (e.g. `coding`, `research`, `management`, `writing`).

### Current first-party workflow skill themes

The repository currently includes workflow skills for:

- documentation upkeep and living design docs
- MCP-aware repository and scaffold usage
- Playwright-based UI verification and subagent orchestration
- context compression for long markdown or prompt artifacts
- terse communication when output needs to stay technically accurate but shorter

For context compression, the repository also ships a local Python pipeline at
`skills/workflow/context-compression/scripts/` with detect, validate, and CLI modules.

### `SKILL.md` frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Lowercase-hyphen identifier. Must match folder name. |
| `category` | yes | Groups skills in the registry. |
| `description` | yes | Discovery surface for agents — explain what it does and when to invoke it. |
| `tags` | no | Inline YAML array `[a, b, c]` — used for filtering and search. |
| `execution-mode` | no | `tool-call` (default) or `prompt-only`. |
| `argument-hint` | no | Short hint shown in VS Code slash command picker. |

### `schema.json` structure

```json
{
  "input":  { "type": "object", "properties": { ... }, "required": [...] },
  "output": { "type": "object", "properties": { ... } }
}
```

- `input` is passed verbatim as `parameters` (OpenAI / Ollama) or `input_schema` (Anthropic).
- `output` is informational; not sent to agents but shown in the dashboard.
- If `schema.json` is absent, export falls back to a minimal schema `{ type: "object", properties: {} }`.

---

## Export Formats

| Format | Wire shape |
|--------|-----------|
| `openai` | `{ type: "function", function: { name, description, parameters: input } }` |
| `ollama` | Same as `openai` (Ollama uses the OpenAI tool spec) |
| `anthropic` | `{ name, description, input_schema: input }` |
| `generic` | Full skill object with `inputSchema` and `outputSchema` — useful for custom runners |

---

## MCP Integration Model

### Why MCP belongs in this tool

The library already models one important layer of agent behavior:

- **Skills** describe *when* an agent should do something and *how it should reason about the task*.

That is necessary but not sufficient for real coding workflows. Modern coding agents also need executable capability backends such as:

- `context7` for documentation/context retrieval
- `playwright` for browser automation and verification
- `nextjs` or framework-specific servers for framework-aware tasks
- other MCP servers for files, git, databases, search, containers, etc.

So the suite should treat MCP as the **execution/tooling layer** underneath the skill layer.

### Core model

The system should be understood as four layers:

1. **Skills** — agent-facing instructions and invocation guidance (`skills/.../SKILL.md`).
2. **MCP servers** — executable tool providers the agent can call at runtime.
3. **Exports / API** — normalized representations for external runtimes (`openai`, `ollama`, `anthropic`, `generic`).
4. **Project scaffolds** — generated repos/monorepos that wire the right skills and MCP servers into a usable coding workspace.

This means MCP servers are **not a replacement for skills** and **not the same artifact type** as skills:

- A skill says: "use Playwright to validate a UI flow after making frontend changes".
- An MCP server provides the actual Playwright browser tools.

### Proposed repository shape

Add a new top-level source-of-truth area for MCP server definitions:

```text
mcp/<server-id>/
├── server.json        # normalized descriptor (required)
├── README.md          # human usage notes (optional)
└── templates/
    ├── vscode.json    # workspace config fragment (optional)
    ├── claude.json    # client-specific config fragment (optional)
    └── env.example    # example env vars (optional)
```

Examples:

```text
mcp/context7/
mcp/playwright/
mcp/nextjs/
```

### MCP server descriptor shape

Recommended minimal `server.json`:

```json
{
  "id": "playwright",
  "name": "Playwright MCP",
  "category": "coding",
  "description": "Browser automation and verification tools for UI workflows.",
  "tags": ["browser", "ui", "testing", "e2e"],
  "transport": {
    "type": "stdio",
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  },
  "env": [
    { "name": "PLAYWRIGHT_HEADLESS", "required": false }
  ],
  "capabilities": [
    "browser.navigate",
    "browser.click",
    "browser.type",
    "browser.screenshot"
  ],
  "clients": {
    "vscode": { "configTemplate": "templates/vscode.json" },
    "generic": { "supported": true }
  }
}
```

The descriptor should answer four questions:

1. How is the server started?
2. What env/config does it need?
3. What kind of capabilities does it expose?
4. Which clients/scaffolds know how to install or reference it?

### Relationship between skills and MCP servers

Skills should be able to declare optional MCP dependencies in frontmatter:

```yaml
requires:
  mcp: [context7, playwright]
```

Meaning:

- the skill is still valid as a file artifact
- but the best runtime experience assumes those MCP servers are available
- scaffolding and validation can use that metadata to provision missing servers automatically

This lets the suite express things like:

- `code-review` may recommend `context7` for API/library documentation lookup
- `web-research` may recommend `context7` or a search MCP
- future `frontend-e2e-check` skill may require `playwright`
- future `nextjs-routing-debug` skill may require `nextjs`

### Where MCP fits in the CLI

The `skill-lib` CLI now includes an MCP surface:

```text
skill-lib mcp list
skill-lib mcp info <id>
skill-lib mcp install <id> [--bundle coding-defaults] [--client vscode] [--target dir]
skill-lib mcp doctor [--target dir]
skill-lib mcp bundles
```

Current semantics:

- `mcp list` — show known server descriptors from `mcp/`
- `mcp info` — show startup command, env vars, tags, capabilities, supported clients
- `mcp install` — copy/render client-specific config fragments into the target repo
- `mcp doctor` — validate binaries, env vars, config files, and connectivity
- `mcp bundles` — list opinionated MCP sets like `coding-defaults`

### Where MCP fits in the scaffold

`create-turborepo` now supports MCP-aware setup, because that is the right place to make a generated coding workspace immediately useful.

Implemented flags:

```text
create-turborepo --mcp-bundle coding-defaults
create-turborepo --mcp context7 --mcp playwright
create-turborepo --no-mcp
```

Current default bundle for coding projects:

- `context7`
- `playwright`
- `nextjs` when the generated app is Next.js-specific
- optionally git / filesystem / terminal MCPs depending on client support

Scaffold responsibilities when MCP is enabled:

1. Add root `.github/skills` as today.
2. Render root `.vscode/mcp.json` for VS Code-compatible clients.
3. Include env example files or setup notes.
4. Record enabled MCP servers in project metadata for later validation.

### Project-level config model

Generated projects should have a machine-readable manifest describing what the repo expects:

```json
{
  "skills": ["code-review", "pr-description", "web-research"],
  "mcpServers": ["context7", "playwright"],
  "bundles": ["coding-defaults"]
}
```

This can live in a file like:

- `.skill-lib/project.json`

That gives the suite one place to drive:

- validation
- re-installation
- CI checks
- future editor integrations

### Validation rules

The validator now checks both skill and MCP readiness for scaffolded projects.

Current MCP-aware validation verifies:

- required MCP config exists in the project
- configured server binaries/commands are present
- required env vars are documented or set
- declared `requires.mcp` dependencies from installed skills are satisfied

### Practical product position

The suite should be described as:

- **Skill library** = reusable agent behavior definitions
- **MCP catalog** = reusable runtime tool backends
- **Scaffold/installer** = project bootstrap and wiring layer

That framing is important because `context7`, `playwright`, `nextjs`, and similar MCP servers are part of the same workflow, but they solve a different problem than `SKILL.md` files.

The tool should own both, but keep them modeled separately.

---

## Module Contracts

### `lib/registry.js`

```js
loadAll()          → Skill[]        // parse all SKILL.md + schema.json files
find(name)         → Skill | null
search(query)      → Skill[]        // full-text over name, description, tags, category

// Skill object shape
{
  name, category, tags, description,
  argumentHint, executionMode,
  schema: { input, output } | null,
  body,   // raw markdown body (below frontmatter)
  path,   // absolute dir path
  file    // absolute SKILL.md path
}
```

### `lib/exporter.js`

```js
toOpenAI(skill)    → OpenAI tool object
toAnthropic(skill) → Anthropic tool object
toOllama(skill)    → OpenAI tool object (same spec)
toGeneric(skill)   → full skill with schemas

exportAll(format, { category?, names? })  → tool[]
exportOne(name, format)                   → tool object

VALID_FORMATS      // ['openai', 'anthropic', 'ollama', 'generic']
```

### `lib/mcp-registry.js`

```js
loadAllMcpServers()      → MpcServer[]
findMcpServer(id)        → McpServer | null
loadAllMcpBundles()      → McpBundle[]
findMcpBundle(id)        → McpBundle | null
```

### `lib/mcp-installer.js`

```js
installMcpServers({ ids?, bundles?, client?, targetRoot?, force? }) → boolean
doctorMcpServers({ ids?, client?, targetRoot? })                    → boolean
```

- Renders client config into `.vscode/mcp.json` for `vscode`
- Updates `.skill-lib/project.json` with installed MCP server ids and bundle ids

### `lib/server.js`

```js
createSkillServer({ port = 3456, host = '127.0.0.1', onExecute? })
```

HTTP routes:

| Method | Path | Query params | Notes |
|--------|------|-------------|-------|
| GET | `/` | — | Info + endpoint listing |
| GET | `/skills` | `category`, `tag`, `q` | List / filter / search |
| GET | `/skills/:name` | `format` | Detail; optional export format |
| GET | `/export` | `format`, `category`, `names` | Bulk export |
| POST | `/skills/:name/execute` | — | 501 unless `onExecute` callback provided |

CORS headers are included on every response.

### `lib/installer.js`

```js
install({ skills?, category?, all?, force?, cwd?, targetRoot? })
uninstall({ skillName, cwd?, targetRoot? })
```

- Copies `SKILL.md` (and `schema.json` if present) to `.github/skills/<name>/` in the target project.
- Auto-detects target project root by walking up from `cwd` until a `.git` directory is found.

### `lib/scaffold.js`

```js
scaffold(name, category, description)
```

- Validates `name` as lowercase-hyphen 1–64 chars.
- Creates `skills/<category>/<name>/SKILL.md` from a built-in template.
- Errors if the file already exists.

---

## HTTP Server — Default Port

**3456** — chosen to avoid collisions with common dev ports (3000, 4000, 5000, 8080, 8501).  
Override with `--port` or `SKILL_PORT` (if implemented).

---

## Streamlit Dashboard

- **Architecture**: thin client over the HTTP API — no direct file I/O in Python.
- **API URL**: configurable in the sidebar (default `http://127.0.0.1:3456`).
- **Caching**: `@st.cache_data(ttl=5)` on all API calls — stale data clears within 5 seconds of a skill change.
- **Pages**: Browse · Search · Export · Stats (see README for user-facing description).

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| CLI | Node.js ESM + Commander.js v13 | `"type": "module"` in package.json |
| HTTP server | Node built-in `http` | No express |
| YAML parsing | Manual (no dep) | Handles `[a, b]` inline arrays, quoted strings |
| Dashboard | Python 3 + Streamlit | `pip3 install -r ui/requirements.txt` |
| Skills | Markdown + JSON | Plain files, version-controlled |

---

## Current Skills

| Skill | Category | execution-mode | Has schema |
|-------|----------|----------------|-----------|
| `code-review` | coding | tool-call | yes |
| `pr-description` | coding | tool-call | yes |
| `web-research` | research | tool-call | yes |

---

## Known Constraints & Decisions

- **No database** — registry is rebuilt from disk on every request. Acceptable at current scale; add an in-memory cache if latency becomes a concern.
- **No auth on HTTP server** — bind to `127.0.0.1` (default) for local-only use. If exposing to LAN (`--host 0.0.0.0`), network-level controls are the operator's responsibility.
- **`postinstall` hook** — runs `scripts/install.js` on `npm install`. Use `--ignore-scripts` during development if you don't want skills auto-copied.
- **`schema.json` is optional** — skills without one still work for prompt-only or discovery use cases; they export with a minimal empty schema.
