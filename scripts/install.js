#!/usr/bin/env node
// install.js — copies skills from this package into a consumer project's .github/skills/

import { cpSync, mkdirSync, readdirSync, existsSync, lstatSync } from "fs";
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
  : findProjectRoot(process.env.INIT_CWD || process.cwd());

// Skip when running as a transitive dependency inside node_modules
if (targetRoot.includes("node_modules")) {
  process.exit(0);
}

const skillsSrc = join(__dirname, "..", "skills");
const skillsDest = join(targetRoot, ".github", "skills");

// Skip if skills are already linked or installed at the destination (handles broken symlinks too)
let destExists = false;
try { lstatSync(skillsDest); destExists = true; } catch {}
if (destExists) {
  process.exit(0);
}

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
