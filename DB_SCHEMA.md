# Skills DB Schema & Sync Plan

This document describes a minimal Postgres schema for storing skills and a practical sync strategy from the Git repo to the DB.

## Minimal schema

SQL (Postgres / JSONB):

```sql
CREATE TABLE skills (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,      -- lowercase-hyphen
  category        TEXT NOT NULL,
  tags            TEXT[] DEFAULT ARRAY[]::TEXT[],
  description     TEXT,
  execution_mode  TEXT,
  argument_hint   TEXT,
  body            TEXT,                     -- raw SKILL.md body (below frontmatter)
  schema_json     JSONB,                    -- schema.json contents
  source_path     TEXT,                     -- e.g. skills/coding/code-review/
  git_ref         TEXT,                     -- commit sha or ref used for last sync
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Useful indexes
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_tags ON skills USING GIN (tags);
CREATE INDEX idx_skills_schema_json ON skills USING GIN (schema_json);
CREATE INDEX idx_skills_search ON skills USING GIN (to_tsvector('english', coalesce(name,'')||' '||coalesce(description,'')||' '||coalesce(body,'')));
```

## Upsert / sync example (psql)

```sql
-- Upsert single skill (example using jsonb param)
INSERT INTO skills (name, category, tags, description, execution_mode, argument_hint, body, schema_json, source_path, git_ref)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
ON CONFLICT (name) DO UPDATE
  SET category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      description = EXCLUDED.description,
      execution_mode = EXCLUDED.execution_mode,
      argument_hint = EXCLUDED.argument_hint,
      body = EXCLUDED.body,
      schema_json = EXCLUDED.schema_json,
      source_path = EXCLUDED.source_path,
      git_ref = EXCLUDED.git_ref,
      updated_at = now();
```

## Sync strategy (recommended)

1. Primary source of truth remains the Git repo (`skills/` files).  
2. On each commit to main (or on PR merge), run a GitHub Action or webhook that:
   - Checks out the repo
   - Runs a small Node script that loads `SKILL.md` + `schema.json` (re-uses `lib/registry.js`), then upserts skills into Postgres (via `pg` client)
   - Writes `git_ref` (commit sha) for traceability
3. For local development, provide a CLI `scripts/sync-to-db.js` developer script that runs the same sync logic against a local Postgres.
4. The `lib/server.js` HTTP server should prefer DB reads when available but fall back to disk if DB unreachable.

## Operational notes

- Use Postgres `JSONB` for `schema_json` to allow querying schema fields and indexing.  
- For fuzzy / semantic search, add Meilisearch or vector DB (PGVector) and index `body + description` and embeddings.  
- Add authentication for any DB-backed API exposed beyond localhost.  
- Maintain a simple migration strategy (e.g., `sqitch` or plain SQL files) and regular database backups.

## Next implementation step (optional)

- Add `scripts/sync-to-db.js` that imports `lib/registry.js` and upserts into Postgres using `pg`.  
- Add a GitHub Action workflow `ci/sync-skills-to-db.yml` to run on `push`/`pull_request` merges.



