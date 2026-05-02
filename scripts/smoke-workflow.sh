#!/usr/bin/env bash
set -euo pipefail

# Smoke test for scaffold + MCP catalog wiring.
# This is a fast local check and does not require an agent CLI.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${1:-$(mktemp -d /tmp/skill-lib-smoke-XXXXXX)}"
PROJECT_DIR="$TARGET_DIR/project"

cleanup() {
  if [[ "${SKILL_LIB_KEEP_SMOKE_DIR:-0}" != "1" ]]; then
    rm -rf "$TARGET_DIR"
  fi
}
trap cleanup EXIT

cd "$ROOT_DIR"

echo "[smoke] target: $PROJECT_DIR"

node ./bin/create-turborepo.js \
  --yes \
  --app smoke-app \
  --target "$PROJECT_DIR" \
  --no-watt \
  --no-install \
  --mcp-bundle coding-defaults

node ./scripts/validate-scaffold.js "$PROJECT_DIR"

node ./bin/skill-lib.js mcp list >/dev/null
node ./bin/skill-lib.js mcp bundles >/dev/null

echo "[smoke] PASS"
