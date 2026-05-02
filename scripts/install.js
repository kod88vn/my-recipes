#!/usr/bin/env node
// install.js — copies skills from this package into a consumer project's .github/skills/

import { cpSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Resolve target: first CLI arg, or nearest .git root above cwd, or cwd
function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) return start; // filesystem root — fall back
    dir = parent;
  }
}

const targetRoot = process.argv[2]
  ? resolve(process.argv[2])
  : findProjectRoot(process.cwd());

const skillsSrc = join(__dirname, "..", "skills");
const skillsDest = join(targetRoot, ".github", "skills");

mkdirSync(skillsDest, { recursive: true });

const skills = readdirSync(skillsSrc, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const skill of skills) {
  const src = join(skillsSrc, skill);
  const dest = join(skillsDest, skill);
  cpSync(src, dest, { recursive: true });
  console.log(`  ✓ installed: ${skill} → ${dest}`);
}

console.log(`\nInstalled ${skills.length} skill(s) to ${skillsDest}`);
console.log("Restart VS Code or reload the window to pick up the new skills.");
