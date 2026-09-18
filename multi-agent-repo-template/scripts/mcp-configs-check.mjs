#!/usr/bin/env node
/**
 * One MCP server definition, four client config files — verify they agree.
 *
 * There is no configuration format every agent reads: Claude Code takes the repo's `.mcp.json`,
 * VS Code Copilot wants `.vscode/mcp.json` under a `servers` key, Gemini CLI wants
 * `.gemini/settings.json`, Codex wants TOML in `.codex/config.toml`. Rather than a generator for
 * a handful of servers that almost never change, the repo keeps the three derived files by hand
 * and lets this check fail the moment `.mcp.json` and a derived file disagree on how to start a
 * server (command + args). Runs inside `pnpm lint:docs`.
 *
 * No `.mcp.json` at the repo root → the repo has no MCP server → the check is skipped (exit 0).
 * A server script path that does not exist yet is reported as a WARNING only, so a freshly
 * copied template stays green until the real server is added.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
const read = (p) => readFileSync(rel(p), 'utf8');

const SOURCE = '.mcp.json';
const DERIVED = {
  vscode: '.vscode/mcp.json',
  gemini: '.gemini/settings.json',
  codex: '.codex/config.toml',
};

/** VS Code has no fixed cwd, so its args may carry `${workspaceFolder}/`; strip it to compare. */
const normaliseArgs = (args = []) => args.map((a) => a.replace(/^\$\{workspaceFolder\}\//, ''));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Just enough TOML for the shape this repo writes: `[mcp_servers.<name>]` tables whose `command`
 * is a quoted string and whose `args` is a one-line array of quoted strings (valid JSON).
 * A real TOML parser would be a new dependency for a few lines of config.
 */
function parseCodexTables(toml) {
  const servers = {};
  const re = /^\[mcp_servers\.([A-Za-z0-9_-]+)\]\s*$/gm;
  let m;
  while ((m = re.exec(toml)) !== null) {
    const body = toml.slice(m.index + m[0].length).split(/^\[/m)[0];
    const command = /^command\s*=\s*"([^"]+)"/m.exec(body)?.[1];
    const args = /^args\s*=\s*(\[[^\n]*\])/m.exec(body)?.[1];
    servers[m[1]] = { command, args: args === undefined ? undefined : JSON.parse(args) };
  }
  return servers;
}

if (!existsSync(rel(SOURCE))) {
  console.log('mcp-configs-check: no .mcp.json — repo has no MCP server, skipped');
  process.exit(0);
}

const errors = [];
const warnings = [];
const source = JSON.parse(read(SOURCE)).mcpServers ?? {};
const names = Object.keys(source);
if (names.length === 0) errors.push(`${SOURCE}: "mcpServers" is empty — delete the file if the repo has no MCP server`);

for (const f of Object.values(DERIVED)) {
  if (!existsSync(rel(f))) errors.push(`${f}: missing — every client config must define the same servers as ${SOURCE}`);
}
if (errors.length === 0) {
  const vscode = JSON.parse(read(DERIVED.vscode)).servers ?? {};
  const gemini = JSON.parse(read(DERIVED.gemini)).mcpServers ?? {};
  const codex = parseCodexTables(read(DERIVED.codex));
  for (const [label, servers] of [
    [DERIVED.vscode, vscode],
    [DERIVED.gemini, gemini],
    [DERIVED.codex, codex],
  ]) {
    if (!same(Object.keys(servers).sort(), [...names].sort()))
      errors.push(`${label}: servers [${Object.keys(servers)}] ≠ ${SOURCE} [${names}]`);
  }
  for (const name of names) {
    const s = source[name];
    if (s.type !== undefined && s.type !== 'stdio') warnings.push(`${SOURCE}: ${name}.type is "${s.type}" — only stdio is compared`);
    if (s.args?.[0] && !existsSync(rel(s.args[0])))
      warnings.push(`${SOURCE}: ${name} script "${s.args[0]}" does not exist yet (template placeholder?)`);
    for (const [label, servers, norm] of [
      [DERIVED.vscode, vscode, normaliseArgs],
      [DERIVED.gemini, gemini, (a) => a],
      [DERIVED.codex, codex, (a) => a],
    ]) {
      const d = servers[name];
      if (!d) continue;
      if (d.command !== s.command) errors.push(`${label}: ${name}.command "${d.command}" ≠ "${s.command}"`);
      if (!same(norm(d.args ?? []), s.args ?? [])) errors.push(`${label}: ${name}.args ${JSON.stringify(d.args)} ≠ ${JSON.stringify(s.args)}`);
    }
  }
  const gitignore = existsSync(rel('.gitignore')) ? read('.gitignore').split('\n') : [];
  if (gitignore.some((l) => l.trim() === '.vscode/*') && !gitignore.some((l) => l.trim() === '!.vscode/mcp.json'))
    errors.push('.gitignore: ".vscode/*" is ignored but "!.vscode/mcp.json" is missing — the VS Code config would never be committed');
}

for (const w of warnings) console.warn(`mcp-configs-check: WARN ${w}`);
if (errors.length > 0) {
  console.error(`mcp-configs-check: ${errors.length} error(s)\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log(`mcp-configs-check: OK (${names.length} server(s) consistent across 4 client configs)`);
