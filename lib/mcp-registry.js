import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const MCP_DIR = join(ROOT, "mcp");
const MCP_BUNDLES_FILE = join(MCP_DIR, "bundles.json");

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function loadAllMcpServers() {
  if (!existsSync(MCP_DIR)) return [];

  const servers = [];
  for (const entry of readdirSync(MCP_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(MCP_DIR, entry.name);
    const descriptor = readJSON(join(dir, "server.json"));
    if (!descriptor) continue;
    servers.push({
      ...descriptor,
      path: dir,
      file: join(dir, "server.json"),
    });
  }

  return servers.sort((a, b) => a.id.localeCompare(b.id));
}

export function findMcpServer(id) {
  return loadAllMcpServers().find((server) => server.id === id) || null;
}

export function loadAllMcpBundles() {
  const bundles = readJSON(MCP_BUNDLES_FILE);
  if (!bundles || typeof bundles !== "object") return [];

  return Object.entries(bundles).map(([id, bundle]) => ({
    id,
    ...bundle,
  })).sort((a, b) => a.id.localeCompare(b.id));
}

export function findMcpBundle(id) {
  return loadAllMcpBundles().find((bundle) => bundle.id === id) || null;
}

export { ROOT, MCP_DIR, MCP_BUNDLES_FILE };