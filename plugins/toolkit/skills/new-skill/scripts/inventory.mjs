#!/usr/bin/env node
// Lists every capability Claude Code can see from the files on this machine,
// so a new or changed skill can be checked for overlap and conflicts:
// installed plugins (skills, agents, commands, hooks, MCP servers), personal and
// project skills/agents/commands, and configured MCP servers.
//
//   node inventory.mjs [--project <dir>] [--json]
//
// It can't see built-in skills or claude.ai connectors. The calling skill
// compares against those from Claude's own list of available skills and tools.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const projectDir = path.resolve(args[args.indexOf('--project') + 1] && args.includes('--project')
  ? args[args.indexOf('--project') + 1]
  : process.cwd());
const home = os.homedir();
const rows = [];

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (!m) return fm;
  // Minimal YAML: top-level `key: value` pairs, quoted or not, plus folded scalars.
  const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, value] = kv;
    if (/^[>|][-+]?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) block.push(lines[++i].trim());
      value = block.join(' ');
    }
    fm[key] = value.replace(/^["']|["']$/g, '').replace(/''/g, "'");
  }
  return fm;
}

function walk(dir, name, depth = 4) {
  if (depth < 0 || !fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, name, depth - 1));
    else if (e.name === name) out.push(p);
  }
  return out;
}

function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function add(source, type, name, description, extra = '') {
  rows.push({ source, type, name, description: (description || '').replace(/\s+/g, ' ').trim(), extra });
}

// Scan one plugin-shaped or .claude-shaped directory.
function scan(root, source, prefix) {
  // A manifest that lists its skills explicitly registers only those; folders it
  // doesn't list (deprecated/, in-progress/, ...) aren't loaded.
  const listed = readJson(path.join(root, '.claude-plugin', 'plugin.json'))?.skills;
  const skillFiles = Array.isArray(listed)
    ? listed.flatMap((p) => walk(path.resolve(root, p), 'SKILL.md', 1))
    : walk(path.join(root, 'skills'), 'SKILL.md');
  {
    for (const f of skillFiles) {
      const fm = frontmatter(f);
      const name = fm.name || path.basename(path.dirname(f));
      add(source, 'skill', prefix + name, fm.description,
        fm['disable-model-invocation'] === 'true' ? 'manual only' : '');
    }
  }
  for (const f of mdFiles(path.join(root, 'agents'))) {
    const fm = frontmatter(f);
    add(source, 'agent', prefix + (fm.name || path.basename(f, '.md')), fm.description);
  }
  for (const f of mdFiles(path.join(root, 'commands'))) {
    const fm = frontmatter(f);
    add(source, 'command', '/' + prefix + path.basename(f, '.md'), fm.description);
  }
  const hooks = readJson(path.join(root, 'hooks', 'hooks.json'));
  if (hooks?.hooks) add(source, 'hooks', Object.keys(hooks.hooks).join(', '), 'event hooks');
  const manifest = readJson(path.join(root, '.claude-plugin', 'plugin.json')) || {};
  const mcp = { ...(readJson(path.join(root, '.mcp.json'))?.mcpServers || readJson(path.join(root, '.mcp.json')) || {}), ...(typeof manifest.mcpServers === 'object' ? manifest.mcpServers : {}) };
  for (const name of Object.keys(mcp)) add(source, 'mcp', name, mcp[name]?.url || mcp[name]?.command || '');
}

// Installed plugins.
let plugins = [];
try { plugins = JSON.parse(execSync('claude plugin list --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
catch { add('(error)', '-', 'claude plugin list', 'could not list plugins; is the claude CLI on PATH?'); }
for (const p of plugins) {
  const pluginName = p.id.split('@')[0];
  const label = `plugin ${p.id}${p.enabled === false ? ' (disabled)' : ''}`;
  if (p.installPath && fs.existsSync(p.installPath)) scan(p.installPath, label, `${pluginName}:`);
}

// Personal and project-level config.
scan(path.join(home, '.claude'), 'personal (~/.claude)', '');
if (path.resolve(projectDir) !== home) scan(path.join(projectDir, '.claude'), `project (${projectDir}/.claude)`, '');

// MCP servers from user and project config (names only; no health checks).
const userCfg = readJson(path.join(home, '.claude.json')) || {};
for (const name of Object.keys(userCfg.mcpServers || {})) add('user config', 'mcp', name, '');
for (const name of Object.keys(userCfg.projects?.[projectDir]?.mcpServers || {})) add('project config', 'mcp', name, '');
for (const name of Object.keys(readJson(path.join(projectDir, '.mcp.json'))?.mcpServers || {})) add('project .mcp.json', 'mcp', name, '');

// Drop the synced copies of claude.ai skills that also show up under ~/.claude/skills/synced
// twice (they're listed once by the walk already).
const seen = new Set();
const unique = rows.filter((r) => { const k = `${r.source}|${r.type}|${r.name}`; if (seen.has(k)) return false; seen.add(k); return true; });

if (asJson) {
  console.log(JSON.stringify(unique, null, 2));
} else {
  let current = '';
  for (const r of unique) {
    if (r.source !== current) { console.log(`\n## ${r.source}`); current = r.source; }
    const desc = r.description.length > 220 ? r.description.slice(0, 220) + '…' : r.description;
    console.log(`- [${r.type}] ${r.name}${r.extra ? ` (${r.extra})` : ''}${desc ? ': ' + desc : ''}`);
  }
  console.log('\nNot listed here (check your own available-skills and tools list): built-in skills, claude.ai connectors, deferred MCP tools.');
}
