// lib/installer.js — copy skills into a target project's .github/skills/

import { cpSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, resolve } from "path";
import { loadAll, find, search } from "./registry.js";

/** Walk up from `start` until a .git dir is found; fall back to `start` */
function findProjectRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) return start;
    dir = parent;
  }
}

/**
 * Install skills into <targetRoot>/.github/skills/
 *
 * Options:
 *   skills   — array of skill names, or empty to use filter options
 *   category — filter by category
 *   all      — install every skill
 *   force    — overwrite existing
 *   cwd      — working directory to resolve targetRoot from (default: process.cwd())
 */
export function install({ skills = [], category, all = false, force = false, cwd = process.cwd(), targetRoot } = {}) {
  const root = targetRoot || findProjectRoot(cwd);
  const dest = join(root, ".github", "skills");
  mkdirSync(dest, { recursive: true });

  let toInstall = [];

  if (skills.length > 0) {
    for (const name of skills) {
      const s = find(name);
      if (!s) { console.error(`  ✗ skill not found: ${name}`); continue; }
      toInstall.push(s);
    }
  } else if (category) {
    toInstall = loadAll().filter((s) => s.category === category);
    if (toInstall.length === 0) console.error(`  ✗ no skills found in category: ${category}`);
  } else if (all) {
    toInstall = loadAll();
  } else {
    console.error("Specify a skill name, --category, or --all.");
    return;
  }

  let installed = 0;
  for (const s of toInstall) {
    const target = join(dest, s.name);
    if (existsSync(target) && !force) {
      console.log(`  ~ skipped (already installed, use --force to overwrite): ${s.name}`);
      continue;
    }
    if (existsSync(target)) rmSync(target, { recursive: true });
    cpSync(s.path, target, { recursive: true });
    console.log(`  ✓ installed: ${s.name}  →  ${target}`);
    installed++;
  }

  if (installed > 0) {
    console.log(`\nInstalled ${installed} skill(s) to ${dest}`);
    console.log("Reload VS Code (Developer: Reload Window) to pick up new skills.");
  }
}

/** Remove a skill from <targetRoot>/.github/skills/ */
export function uninstall({ skillName, cwd = process.cwd(), targetRoot } = {}) {
  const root = targetRoot || findProjectRoot(cwd);
  const target = join(root, ".github", "skills", skillName);
  if (!existsSync(target)) {
    console.error(`  ✗ skill not installed in this project: ${skillName}`);
    return;
  }
  rmSync(target, { recursive: true });
  console.log(`  ✓ removed: ${skillName} from ${target}`);
}
