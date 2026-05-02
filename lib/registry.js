// lib/registry.js — loads and parses all SKILL.md files in skills/<category>/<name>/

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

/** Safely parse a JSON file; returns null on error */
function readJSON(filePath) {
  try { return JSON.parse(readFileSync(filePath, "utf-8")); }
  catch { return null; }
}
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SKILLS_DIR = join(ROOT, "skills");

/** Parse YAML frontmatter delimited by --- ... --- */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: raw };

  const body = raw.slice(match[0].length).trim();
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    // strip surrounding quotes
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    // parse inline arrays: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    }
    meta[key] = value;
  }
  return { meta, body };
}

/** Load every skill from skills/<category>/<name>/SKILL.md */
export function loadAll() {
  if (!existsSync(SKILLS_DIR)) return [];

  const skills = [];
  for (const category of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const catDir = join(SKILLS_DIR, category.name);
    for (const entry of readdirSync(catDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillFile = join(catDir, entry.name, "SKILL.md");
      if (!existsSync(skillFile)) continue;
      const raw = readFileSync(skillFile, "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      skills.push({
        name: meta.name || entry.name,
        category: meta.category || category.name,
        tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
        description: meta.description || "",
        argumentHint: meta["argument-hint"] || "",
        userInvocable: meta["user-invocable"] !== "false",
        executionMode: meta["execution-mode"] || "prompt-only",
        schema: readJSON(join(catDir, entry.name, "schema.json")),
        body,
        path: join(catDir, entry.name),
        file: skillFile,
      });
    }
  }
  return skills;
}

/** Return a single skill by name, or undefined */
export function find(name) {
  return loadAll().find((s) => s.name === name);
}

/** Search by query string against name + description + tags */
export function search(query) {
  const q = query.toLowerCase();
  return loadAll().filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some((t) => t.toLowerCase().includes(q)) ||
    s.category.toLowerCase().includes(q)
  );
}

export { ROOT, SKILLS_DIR };
