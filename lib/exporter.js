// lib/exporter.js — convert skills to tool-call formats for any AI agent

import { loadAll, find } from "./registry.js";

/** The minimal input schema to use when a skill has no schema.json */
function fallbackSchema(skill) {
  return {
    type: "object",
    properties: {
      input: { type: "string", description: skill.argumentHint || "Input for the skill" }
    }
  };
}

// ─── OpenAI / Ollama (identical format) ───────────────────────────────────────
// https://platform.openai.com/docs/guides/function-calling
// Ollama supports the same spec: https://ollama.com/blog/tool-support

export function toOpenAI(skill) {
  return {
    type: "function",
    function: {
      name: skill.name,
      description: skill.description,
      parameters: skill.schema?.input ?? fallbackSchema(skill),
    },
  };
}

export const toOllama = toOpenAI; // Ollama uses the OpenAI tool schema

// ─── Anthropic tool_use ────────────────────────────────────────────────────────
// https://docs.anthropic.com/en/docs/build-with-claude/tool-use

export function toAnthropic(skill) {
  return {
    name: skill.name,
    description: skill.description,
    input_schema: skill.schema?.input ?? fallbackSchema(skill),
  };
}

// ─── Generic (any custom agent / local LLM) ───────────────────────────────────

export function toGeneric(skill) {
  return {
    name: skill.name,
    category: skill.category,
    tags: skill.tags,
    description: skill.description,
    executionMode: skill.executionMode,
    inputSchema:  skill.schema?.input  ?? fallbackSchema(skill),
    outputSchema: skill.schema?.output ?? null,
  };
}

// ─── Bulk export ──────────────────────────────────────────────────────────────

const FORMATS = {
  openai:    toOpenAI,
  ollama:    toOllama,
  anthropic: toAnthropic,
  generic:   toGeneric,
};

/**
 * Export all (or filtered) skills to the requested format.
 * @param {"openai"|"ollama"|"anthropic"|"generic"} format
 * @param {{ category?: string, names?: string[] }} opts
 */
export function exportAll(format = "generic", { category, names } = {}) {
  const converter = FORMATS[format];
  if (!converter) throw new Error(`Unknown format: ${format}. Valid: ${Object.keys(FORMATS).join(", ")}`);

  let skills = loadAll();
  if (category) skills = skills.filter((s) => s.category === category);
  if (names?.length) skills = skills.filter((s) => names.includes(s.name));

  return skills.map(converter);
}

/**
 * Export a single skill by name.
 */
export function exportOne(name, format = "generic") {
  const converter = FORMATS[format];
  if (!converter) throw new Error(`Unknown format: ${format}. Valid: ${Object.keys(FORMATS).join(", ")}`);
  const skill = find(name);
  if (!skill) throw new Error(`Skill not found: ${name}`);
  return converter(skill);
}

export const VALID_FORMATS = Object.keys(FORMATS);
