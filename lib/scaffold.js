// lib/scaffold.js — generate a new SKILL.md from a template

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { SKILLS_DIR } from "./registry.js";

const TEMPLATE = (name, category, description) => `---
name: ${name}
category: ${category}
tags: []
description: '${description || `Describe what ${name} does and when to invoke it.`}'
argument-hint: 'Optional: describe expected argument'
---

# ${titleCase(name)}

## When to Use
- Describe the trigger scenarios

## Procedure

1. Step one
2. Step two
3. Step three

## Output Format

Describe the expected output structure here.

## Notes
- Additional context or edge cases
`;

function titleCase(str) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Scaffold a new skill directory and SKILL.md.
 * @param {string} name - skill name (lowercase, hyphens)
 * @param {string} category - category folder
 * @param {string} [description] - optional description pre-fill
 */
export function scaffold(name, category, description) {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) {
    console.error("Skill name must be lowercase alphanumeric + hyphens, 1-64 chars.");
    process.exit(1);
  }

  const dir = join(SKILLS_DIR, category, name);
  if (existsSync(dir)) {
    console.error(`  ✗ skill already exists: ${dir}`);
    process.exit(1);
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), TEMPLATE(name, category, description));

  console.log(`  ✓ created: ${dir}/SKILL.md`);
  console.log(`\nEdit the file to fill in the description, procedure, and tags, then commit.`);

  return dir;
}
