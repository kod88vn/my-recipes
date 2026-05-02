import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { spawnSync } from "child_process";
import { findMcpBundle, findMcpServer } from "./mcp-registry.js";

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function findProjectRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) return start;
    dir = parent;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function resolveServerIds({ ids = [], bundles = [] } = {}) {
  const resolved = [...ids];
  for (const bundleId of bundles) {
    const bundle = findMcpBundle(bundleId);
    if (!bundle) {
      console.error(`  ✗ MCP bundle not found: ${bundleId}`);
      continue;
    }
    resolved.push(...(bundle.servers || []));
  }
  return unique(resolved);
}

function loadTemplate(server, client) {
  const config = server.clients?.[client];
  if (!config?.configTemplate) return null;
  const templatePath = join(server.path, config.configTemplate);
  return readJSON(templatePath, null);
}

function updateProjectManifest(root, updater) {
  const dir = join(root, ".skill-lib");
  const file = join(dir, "project.json");
  mkdirSync(dir, { recursive: true });
  const current = readJSON(file, { skills: [], mcpServers: [], bundles: [] });
  const next = updater(current);
  writeFileSync(file, JSON.stringify(next, null, 2));
  return next;
}

export function installMcpServers({ ids = [], bundles = [], client = "vscode", cwd = process.cwd(), targetRoot, force = false } = {}) {
  const root = targetRoot || findProjectRoot(cwd);
  const serverIds = resolveServerIds({ ids, bundles });
  if (serverIds.length === 0) {
    console.error("Specify one or more MCP ids or --bundle values.");
    return false;
  }

  const configDir = client === "vscode" ? join(root, ".vscode") : join(root, ".skill-lib");
  const configFile = client === "vscode" ? join(configDir, "mcp.json") : join(configDir, `mcp.${client}.json`);
  mkdirSync(dirname(configFile), { recursive: true });
  const currentConfig = readJSON(configFile, { servers: {} });
  currentConfig.servers ||= {};

  const installed = [];
  for (const id of serverIds) {
    const server = findMcpServer(id);
    if (!server) {
      console.error(`  ✗ MCP server not found: ${id}`);
      continue;
    }
    const template = loadTemplate(server, client);
    if (!template) {
      console.error(`  ✗ No ${client} config template for: ${id}`);
      continue;
    }
    if (currentConfig.servers[id] && !force) {
      console.log(`  ~ skipped (already configured, use --force to overwrite): ${id}`);
      installed.push(id);
      continue;
    }
    currentConfig.servers[id] = template;
    installed.push(id);
    console.log(`  ✓ configured MCP server: ${id}`);
  }

  writeFileSync(configFile, JSON.stringify(currentConfig, null, 2));
  updateProjectManifest(root, (manifest) => ({
    ...manifest,
    mcpServers: unique([...(manifest.mcpServers || []), ...installed]),
    bundles: unique([...(manifest.bundles || []), ...bundles]),
  }));

  return installed.length > 0;
}

export function doctorMcpServers({ ids = [], client = "vscode", cwd = process.cwd(), targetRoot } = {}) {
  const root = targetRoot || findProjectRoot(cwd);
  const manifest = readJSON(join(root, ".skill-lib", "project.json"), { mcpServers: [] });
  const serverIds = ids.length > 0 ? ids : (manifest.mcpServers || []);
  const configFile = client === "vscode" ? join(root, ".vscode", "mcp.json") : join(root, ".skill-lib", `mcp.${client}.json`);
  const config = readJSON(configFile, { servers: {} });

  if (serverIds.length === 0) {
    console.log("No MCP servers configured for this project.");
    return true;
  }

  let ok = true;
  for (const id of serverIds) {
    const server = findMcpServer(id);
    if (!server) {
      console.error(`  ✗ Unknown MCP server: ${id}`);
      ok = false;
      continue;
    }
    const configured = config.servers?.[id];
    if (!configured) {
      console.error(`  ✗ Missing ${client} config entry for: ${id}`);
      ok = false;
      continue;
    }
    const command = configured.command || server.transport?.command;
    const probe = command ? spawnSync("sh", ["-lc", `command -v ${command}`], { encoding: "utf8" }) : null;
    if (!command || probe?.status !== 0) {
      console.error(`  ✗ Command not available for ${id}: ${command || "<missing>"}`);
      ok = false;
    } else {
      console.log(`  ✓ ${id} configured (${command})`);
    }
    for (const envVar of server.env || []) {
      if (envVar.required && !process.env[envVar.name] && !configured.env?.[envVar.name]) {
        console.error(`  ✗ Missing required env for ${id}: ${envVar.name}`);
        ok = false;
      }
    }
  }

  if (ok) console.log(`\nMCP doctor passed for ${serverIds.length} server(s).`);
  return ok;
}