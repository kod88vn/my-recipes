#!/usr/bin/env sh
# Link ai-skill-library/skills into this project's .github/skills for Copilot
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/.." && pwd)"

SKILLS_SRC="$REPO_ROOT/ai-skill-library/skills"
SKILLS_DEST="$REPO_ROOT/.github/skills"

echo "Linking $SKILLS_SRC -> $SKILLS_DEST"
mkdir -p "$(dirname "$SKILLS_DEST")"
if [ -e "$SKILLS_DEST" ]; then
  echo "Removing existing $SKILLS_DEST"
  rm -rf "$SKILLS_DEST"
fi
ln -s "$SKILLS_SRC" "$SKILLS_DEST"
echo "Linked. Reload VS Code (Developer: Reload Window) if open."
