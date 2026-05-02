// lib/server.js — lightweight HTTP REST API for the skill library
// No external dependencies — uses Node built-in http module

import { createServer } from "http";
import { loadAll, find, search } from "./registry.js";
import { exportOne, exportAll, VALID_FORMATS } from "./exporter.js";

function json(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function parseQuery(urlStr) {
  const url = new URL(urlStr, "http://localhost");
  const params = {};
  for (const [k, v] of url.searchParams) params[k] = v;
  return { pathname: url.pathname, params };
}

/** Route: GET /skills */
function routeList(req, res, params) {
  let skills = loadAll();
  if (params.category) skills = skills.filter((s) => s.category === params.category);
  if (params.tag)      skills = skills.filter((s) => s.tags.includes(params.tag));
  if (params.q)        skills = skills.filter((s) =>
    s.name.includes(params.q) || s.description.toLowerCase().includes(params.q.toLowerCase()) ||
    s.tags.some((t) => t.toLowerCase().includes(params.q.toLowerCase()))
  );

  json(res, 200, {
    count: skills.length,
    skills: skills.map((s) => ({
      name: s.name, category: s.category, tags: s.tags,
      description: s.description, executionMode: s.executionMode,
      hasSchema: !!s.schema,
    })),
  });
}

/** Route: GET /skills/:name */
function routeSkill(req, res, name, params) {
  const skill = find(name);
  if (!skill) return json(res, 404, { error: `Skill not found: ${name}` });

  const fmt = params.format;
  if (fmt) {
    if (!VALID_FORMATS.includes(fmt))
      return json(res, 400, { error: `Invalid format. Valid: ${VALID_FORMATS.join(", ")}` });
    return json(res, 200, exportOne(name, fmt));
  }

  json(res, 200, {
    name: skill.name, category: skill.category, tags: skill.tags,
    description: skill.description, executionMode: skill.executionMode,
    argumentHint: skill.argumentHint,
    schema: skill.schema,
    body: skill.body,
  });
}

/** Route: GET /export */
function routeExport(req, res, params) {
  const fmt = params.format ?? "generic";
  if (!VALID_FORMATS.includes(fmt))
    return json(res, 400, { error: `Invalid format. Valid: ${VALID_FORMATS.join(", ")}` });

  const tools = exportAll(fmt, {
    category: params.category,
    names: params.names?.split(","),
  });
  json(res, 200, tools);
}

/** Route: POST /skills/:name/execute  (stub — implement your own runner) */
function routeExecute(req, res, name) {
  const skill = find(name);
  if (!skill) return json(res, 404, { error: `Skill not found: ${name}` });
  // Execution is intentionally not wired — the server provides definitions,
  // your agent/runner calls the actual LLM or tool.
  json(res, 501, {
    error: "Execution not implemented",
    hint: "This endpoint is a hook. Mount your own executor by calling createServer({ onExecute }).",
    skill: skill.name,
  });
}

/**
 * Create and start the skill registry HTTP server.
 * @param {{ port?: number, host?: string, onExecute?: Function }} opts
 */
export function createSkillServer({ port = 3456, host = "127.0.0.1", onExecute } = {}) {
  const server = createServer((req, res) => {
    const { pathname, params } = parseQuery(req.url ?? "/");

    // CORS headers so browser-based agents / UIs can talk to the server
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    // ── GET /  ──────────────────────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/") {
      const skills = loadAll();
      return json(res, 200, {
        name: "ai-skill-library",
        version: "0.1.0",
        totalSkills: skills.length,
        categories: [...new Set(skills.map((s) => s.category))],
        endpoints: [
          "GET  /skills",
          "GET  /skills?category=&tag=&q=",
          "GET  /skills/:name",
          "GET  /skills/:name?format=openai|anthropic|ollama|generic",
          "POST /skills/:name/execute",
          "GET  /export?format=openai|anthropic|ollama|generic&category=",
        ],
      });
    }

    // ── GET /skills ─────────────────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/skills")
      return routeList(req, res, params);

    // ── GET /skills/:name/execute ────────────────────────────────────────────
    const execMatch = pathname.match(/^\/skills\/([^/]+)\/execute$/);
    if (execMatch) {
      if (req.method === "POST") {
        if (onExecute) {
          let body = "";
          req.on("data", (c) => body += c);
          req.on("end", () => {
            let input;
            try { input = JSON.parse(body || "{}"); }
            catch { return json(res, 400, { error: "Invalid JSON body" }); }
            Promise.resolve(onExecute(execMatch[1], input))
              .then((result) => json(res, 200, { result }))
              .catch((err) => json(res, 500, { error: String(err) }));
          });
        } else {
          routeExecute(req, res, execMatch[1]);
        }
      } else {
        json(res, 405, { error: "Method not allowed" });
      }
      return;
    }

    // ── GET /skills/:name ────────────────────────────────────────────────────
    const skillMatch = pathname.match(/^\/skills\/([^/]+)$/);
    if (req.method === "GET" && skillMatch)
      return routeSkill(req, res, skillMatch[1], params);

    // ── GET /export ──────────────────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/export")
      return routeExport(req, res, params);

    json(res, 404, { error: "Not found" });
  });

  server.listen(port, host, () => {
    console.log(`\nSkill Library API running at http://${host}:${port}`);
    console.log(`  GET  http://${host}:${port}/skills`);
    console.log(`  GET  http://${host}:${port}/export?format=openai`);
    console.log(`  GET  http://${host}:${port}/export?format=ollama`);
    console.log(`  GET  http://${host}:${port}/export?format=anthropic`);
    console.log(`\nPress Ctrl+C to stop.\n`);
  });

  return server;
}
