# Design & Requirements

Reference document for architecture decisions, data formats, and module contracts. Keep this up to date as the system evolves.

---

## Goals

1. **Agent-agnostic** — skills must be consumable by VS Code Copilot, OpenAI, Anthropic, Ollama, and any local LLM without modification.
2. **Human-readable source of truth** — skill definitions live as plain Markdown + JSON files in version control, not a database.
3. **Zero runtime dependencies for core** — `lib/` and `bin/` use only Node built-ins + `commander`. No express, no zod, no ORM.
4. **Scale-friendly tooling** — CLI + HTTP API + Streamlit dashboard so the library stays manageable as the skill count grows.

---

## Skill File Format

### Directory layout

```
skills/<category>/<name>/
├── SKILL.md      # instructions + YAML frontmatter (required)
└── schema.json   # input/output JSON Schema (optional, enables tool-call export)
```

- `<name>` must be lowercase-hyphen, 1–64 characters, matching the `name` field in frontmatter.
- `<category>` is a free-form grouping (e.g. `coding`, `research`, `management`, `writing`).

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
