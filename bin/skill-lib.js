#!/usr/bin/env node
// bin/skill-lib.js — CLI for the AI Skill Library

import { program, Command } from "commander";
import { loadAll, find, search } from "../lib/registry.js";
import { loadAllMcpServers, findMcpServer, loadAllMcpBundles } from "../lib/mcp-registry.js";
import { installMcpServers, doctorMcpServers } from "../lib/mcp-installer.js";
import { install, uninstall } from "../lib/installer.js";
import { scaffold } from "../lib/scaffold.js";
import { exportAll, exportOne, VALID_FORMATS } from "../lib/exporter.js";
import { createSkillServer } from "../lib/server.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN  = "\x1b[32m";

function pad(str, len) {
  return String(str).padEnd(len);
}

function printSkillTable(skills) {
  if (skills.length === 0) {
    console.log(`${DIM}No skills found.${RESET}`);
    return;
  }

  const nameW = Math.max(4, ...skills.map((s) => s.name.length)) + 2;
  const catW  = Math.max(8, ...skills.map((s) => s.category.length)) + 2;

  console.log(
    `\n${BOLD}${pad("NAME", nameW)}${pad("CATEGORY", catW)}DESCRIPTION${RESET}`
  );
  console.log("─".repeat(nameW + catW + 50));

  for (const s of skills) {
    const desc = s.description.length > 70
      ? s.description.slice(0, 67) + "..."
      : s.description;
    console.log(
      `${CYAN}${pad(s.name, nameW)}${RESET}${YELLOW}${pad(s.category, catW)}${RESET}${desc}`
    );
  }
  console.log(`\n${DIM}${skills.length} skill(s)${RESET}\n`);
}

function printMcpTable(servers) {
  if (servers.length === 0) {
    console.log(`${DIM}No MCP servers found.${RESET}`);
    return;
  }

  const idW = Math.max(2, ...servers.map((s) => s.id.length)) + 2;
  const catW = Math.max(8, ...servers.map((s) => (s.category || "").length)) + 2;
  const stabilityW = Math.max(9, ...servers.map((s) => (s.stability || "stable").length)) + 2;

  console.log(
    `\n${BOLD}${pad("ID", idW)}${pad("CATEGORY", catW)}${pad("STABILITY", stabilityW)}DESCRIPTION${RESET}`
  );
  console.log("─".repeat(idW + catW + stabilityW + 50));

  for (const server of servers) {
    const desc = server.description.length > 70
      ? server.description.slice(0, 67) + "..."
      : server.description;
    console.log(
      `${CYAN}${pad(server.id, idW)}${RESET}${YELLOW}${pad(server.category || "", catW)}${RESET}${pad(server.stability || "stable", stabilityW)}${desc}`
    );
  }
  console.log(`\n${DIM}${servers.length} MCP server(s)${RESET}\n`);
}

// ─── list ─────────────────────────────────────────────────────────────────────

program
  .command("list")
  .alias("ls")
  .description("List all skills in the library")
  .option("-c, --category <cat>", "Filter by category")
  .option("-t, --tag <tag>",      "Filter by tag")
  .action((opts) => {
    let skills = loadAll();
    if (opts.category) skills = skills.filter((s) => s.category === opts.category);
    if (opts.tag)      skills = skills.filter((s) => s.tags.includes(opts.tag));

    // group by category
    const grouped = {};
    for (const s of skills) (grouped[s.category] ??= []).push(s);

    for (const [cat, items] of Object.entries(grouped)) {
      console.log(`\n${BOLD}${YELLOW}▸ ${cat}${RESET}`);
      printSkillTable(items);
    }

    if (skills.length === 0) console.log(`${DIM}No skills found.${RESET}\n`);
  });

// ─── categories ───────────────────────────────────────────────────────────────

program
  .command("categories")
  .alias("cats")
  .description("List all categories")
  .action(() => {
    const skills = loadAll();
    const cats = {};
    for (const s of skills) cats[s.category] = (cats[s.category] || 0) + 1;
    console.log(`\n${BOLD}CATEGORY            COUNT${RESET}`);
    console.log("─".repeat(30));
    for (const [cat, count] of Object.entries(cats).sort()) {
      console.log(`${CYAN}${pad(cat, 20)}${RESET}${count}`);
    }
    console.log();
  });

// ─── search ───────────────────────────────────────────────────────────────────

program
  .command("search <query>")
  .alias("s")
  .description("Search skills by name, description, tag, or category")
  .action((query) => {
    const results = search(query);
    printSkillTable(results);
  });

// ─── info ─────────────────────────────────────────────────────────────────────

program
  .command("info <name>")
  .description("Show full details of a skill")
  .action((name) => {
    const s = find(name);
    if (!s) {
      console.error(`Skill not found: ${name}`);
      process.exit(1);
    }
    console.log(`\n${BOLD}${CYAN}${s.name}${RESET}  ${DIM}(${s.category})${RESET}`);
    console.log(`${s.description}`);
    if (s.tags.length) console.log(`\n${DIM}Tags: ${s.tags.join(", ")}${RESET}`);
    if (s.argumentHint) console.log(`${DIM}Argument hint: ${s.argumentHint}${RESET}`);
    console.log(`\n${BOLD}── SKILL.md ──────────────────────────────────────${RESET}`);
    console.log(s.body);
  });

// ─── install ──────────────────────────────────────────────────────────────────

program
  .command("install [names...]")
  .description("Install skill(s) into the nearest project (.github/skills/)")
  .option("-c, --category <cat>", "Install all skills in a category")
  .option("-a, --all",            "Install every skill")
  .option("-f, --force",          "Overwrite already-installed skills")
  .option("--target <dir>",       "Target project root (default: nearest .git)")
  .action((names, opts) => {
    install({
      skills: names,
      category: opts.category,
      all: opts.all,
      force: opts.force,
      targetRoot: opts.target,
    });
  });

// ─── remove ───────────────────────────────────────────────────────────────────

program
  .command("remove <name>")
  .alias("rm")
  .description("Remove an installed skill from the current project")
  .option("--target <dir>", "Target project root (default: nearest .git)")
  .action((name, opts) => {
    uninstall({ skillName: name, targetRoot: opts.target });
  });

// ─── new ──────────────────────────────────────────────────────────────────────

program
  .command("new <name>")
  .description("Scaffold a new skill SKILL.md")
  .requiredOption("-c, --category <cat>", "Category to place the skill in")
  .option("-d, --description <desc>",     "Pre-fill the description")
  .action((name, opts) => {
    scaffold(name, opts.category, opts.description);
  });

// ─── export ───────────────────────────────────────────────────────────────────

program
  .command("export")
  .description(`Export skill definitions as tool schemas for AI agents\nFormats: ${VALID_FORMATS.join(", ")}`)
  .argument("[names...]", "Specific skill names (omit for all)")
  .option("-f, --format <fmt>", `Output format: ${VALID_FORMATS.join(" | ")}`, "generic")
  .option("-c, --category <cat>", "Filter by category")
  .option("-o, --output <file>", "Write to file instead of stdout")
  .action((names, opts) => {
    if (!VALID_FORMATS.includes(opts.format)) {
      console.error(`Unknown format: ${opts.format}. Valid: ${VALID_FORMATS.join(", ")}`);
      process.exit(1);
    }
    const tools = exportAll(opts.format, { category: opts.category, names });
    const out = JSON.stringify(tools, null, 2);
    if (opts.output) {
      import("fs").then(({ writeFileSync }) => {
        writeFileSync(opts.output, out, "utf-8");
        console.log(`Exported ${tools.length} skill(s) to ${opts.output}`);
      });
    } else {
      process.stdout.write(out + "\n");
    }
  });

// ─── serve ────────────────────────────────────────────────────────────────────

program
  .command("serve")
  .description("Start the skill library HTTP API (for AI agents and local LLMs)")
  .option("-p, --port <port>", "Port to listen on", "3456")
  .option("--host <host>",     "Host to bind to", "127.0.0.1")
  .action((opts) => {
    createSkillServer({ port: Number(opts.port), host: opts.host });
  });

// ─── mcp ─────────────────────────────────────────────────────────────────────

const mcp = program
  .command("mcp")
  .description("Inspect bundled MCP server descriptors");

mcp
  .command("list")
  .description("List bundled MCP servers")
  .action(() => {
    printMcpTable(loadAllMcpServers());
  });

mcp
  .command("info <id>")
  .description("Show full details of an MCP server descriptor")
  .action((id) => {
    const server = findMcpServer(id);
    if (!server) {
      console.error(`MCP server not found: ${id}`);
      process.exit(1);
    }

    console.log(`\n${BOLD}${CYAN}${server.name}${RESET}  ${DIM}(${server.id})${RESET}`);
    console.log(server.description);
    if (server.category) console.log(`${DIM}Category: ${server.category}${RESET}`);
    if (server.stability) console.log(`${DIM}Stability: ${server.stability}${RESET}`);
    if (server.tags?.length) console.log(`${DIM}Tags: ${server.tags.join(", ")}${RESET}`);
    if (server.transport) {
      const args = Array.isArray(server.transport.args) ? server.transport.args.join(" ") : "";
      console.log(`${DIM}Transport: ${server.transport.type} -> ${server.transport.command || ""} ${args}`.trim() + `${RESET}`);
    }
    if (server.capabilities?.length) {
      console.log(`\n${BOLD}Capabilities${RESET}`);
      server.capabilities.forEach((capability) => console.log(`- ${capability}`));
    }
    if (server.env?.length) {
      console.log(`\n${BOLD}Environment${RESET}`);
      server.env.forEach((item) => console.log(`- ${item.name}${item.required ? " (required)" : ""}`));
    }
    if (server.clients) {
      console.log(`\n${BOLD}Clients${RESET}`);
      Object.entries(server.clients).forEach(([client, config]) => {
        console.log(`- ${client}: ${config.supported === false ? "not supported" : "supported"}`);
      });
    }
    console.log();
  });

mcp
  .command("install [ids...]")
  .description("Install MCP server config into a target project")
  .option("--bundle <name>", "Install an MCP bundle", (value, items) => { items.push(value); return items; }, [])
  .option("--client <client>", "Target client config to render", "vscode")
  .option("--target <dir>", "Target project root (default: nearest .git)")
  .option("-f, --force", "Overwrite existing MCP config entries")
  .action((ids, opts) => {
    const ok = installMcpServers({
      ids,
      bundles: opts.bundle,
      client: opts.client,
      targetRoot: opts.target,
      force: opts.force,
    });
    if (!ok) process.exit(1);
  });

mcp
  .command("doctor [ids...]")
  .description("Validate MCP config, commands, and required env vars")
  .option("--client <client>", "Client config to inspect", "vscode")
  .option("--target <dir>", "Target project root (default: nearest .git)")
  .action((ids, opts) => {
    const ok = doctorMcpServers({ ids, client: opts.client, targetRoot: opts.target });
    if (!ok) process.exit(1);
  });

mcp
  .command("bundles")
  .description("List bundled MCP server sets")
  .action(() => {
    const bundles = loadAllMcpBundles();
    if (bundles.length === 0) {
      console.log(`${DIM}No MCP bundles found.${RESET}`);
      return;
    }
    const idW = Math.max(6, ...bundles.map((bundle) => bundle.id.length)) + 2;
    const channelW = Math.max(7, ...bundles.map((bundle) => (bundle.channel || "stable").length)) + 2;
    console.log(`\n${BOLD}${pad("BUNDLE", idW)}${pad("CHANNEL", channelW)}SERVERS${RESET}`);
    console.log("─".repeat(idW + channelW + 40));
    bundles.forEach((bundle) => {
      console.log(`${CYAN}${pad(bundle.id, idW)}${RESET}${pad(bundle.channel || "stable", channelW)}${(bundle.servers || []).join(", ")}`);
    });
    console.log();
  });

// ─── run ──────────────────────────────────────────────────────────────────────

program
  .name("skill-lib")
  .description("Manage and install VS Code Copilot agent skills")
  .version("0.1.0")
  .parse(process.argv);
