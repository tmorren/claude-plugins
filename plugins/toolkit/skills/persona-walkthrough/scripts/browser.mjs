#!/usr/bin/env node
// Persistent headless browser for persona walkthroughs.
//
// Each Bash call is a separate process, so `start` launches a small background
// server that keeps one Playwright page open, and every other command talks to
// it over localhost. Use a different --id per persona to run several at once.
//
//   node browser.mjs start <url> --id <id> [--device desktop|mobile] [--zoom 2]
//   node browser.mjs snapshot            --id <id>
//   node browser.mjs click <ref|text>    --id <id>
//   node browser.mjs fill <ref> <text>   --id <id>
//   node browser.mjs select <ref> <val>  --id <id>
//   node browser.mjs press <key>         --id <id>   (Tab, Enter, Escape, Shift+Tab, ...)
//   node browser.mjs scroll [down|up]    --id <id>
//   node browser.mjs goto <url>          --id <id>
//   node browser.mjs back                --id <id>
//   node browser.mjs reload              --id <id>
//   node browser.mjs screenshot <path> [--full] --id <id>   (viewport only unless --full)
//   node browser.mjs stop                --id <id>
//
// Every action prints a fresh snapshot: URL, title, the focused element, visible
// text, a numbered list of interactive elements ([ref] role "name"), console
// errors since the last command, and a note when an action changed nothing.

import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATE_DIR = path.join(os.tmpdir(), 'persona-browser');
const MAX_TEXT = 4000;

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else positional.push(a);
  }
  return { positional, flags };
}

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require('playwright'); } catch {}
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'playwright'));
  } catch {}
  console.error(
    'Playwright not found. Install it once with:\n' +
    '  npm i -g playwright && npx playwright install chromium'
  );
  process.exit(2);
}

const stateFile = (id) => path.join(STATE_DIR, `${id}.json`);

// ---------------------------------------------------------------- server side

async function snapshot(page) {
  return page.evaluate((maxText) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const nameOf = (el) => {
      const labelled = el.getAttribute('aria-labelledby');
      if (labelled) {
        const t = labelled.split(/\s+/).map((id) => document.getElementById(id)?.innerText || '').join(' ').trim();
        if (t) return t;
      }
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      if (el.id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl?.innerText.trim()) return lbl.innerText.trim();
      }
      const wrap = el.closest('label');
      if (wrap?.innerText.trim()) return wrap.innerText.trim();
      const text = (el.innerText || '').trim();
      if (text) return text;
      const img = el.querySelector('img[alt]');
      if (img?.alt) return img.alt;
      return el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('alt') || el.value || '';
    };
    const roleOf = (el) => {
      if (el.getAttribute('role')) return el.getAttribute('role');
      const tag = el.tagName.toLowerCase();
      if (tag === 'a') return 'link';
      if (tag === 'input') return `input:${el.type || 'text'}`;
      return tag;
    };

    document.querySelectorAll('[data-pref]').forEach((el) => el.removeAttribute('data-pref'));
    const selector = 'a[href], button, input:not([type=hidden]), select, textarea, summary, ' +
      '[role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=switch], ' +
      '[role=option], [role=combobox], [contenteditable=true], [onclick], [tabindex]:not([tabindex="-1"])';
    const items = [];
    let n = 0;
    for (const el of document.querySelectorAll(selector)) {
      if (!visible(el)) continue;
      n++;
      el.setAttribute('data-pref', String(n));
      const name = nameOf(el).replace(/\s+/g, ' ').slice(0, 80);
      const extra = [];
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') extra.push('disabled');
      if (el.checked) extra.push('checked');
      if ('value' in el && el.value && el.tagName !== 'BUTTON') extra.push(`value="${String(el.value).slice(0, 40)}"`);
      const r = el.getBoundingClientRect();
      if (r.width < 32 || r.height < 32) extra.push(`small ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.top > innerHeight || r.bottom < 0) extra.push('offscreen');
      items.push(`[${n}] ${roleOf(el)} "${name || '(no accessible name)'}"${extra.length ? ' (' + extra.join(', ') + ')' : ''}`);
    }

    const f = document.activeElement;
    const focused = f && f !== document.body
      ? `${roleOf(f)} "${nameOf(f).replace(/\s+/g, ' ').slice(0, 80)}"${f.dataset.pref ? ` [${f.dataset.pref}]` : ''}`
      : '(nothing / body)';
    const dialogs = [...document.querySelectorAll('dialog[open], [role=dialog], [aria-modal=true]')].filter(visible).length;
    let text = (document.body?.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > maxText) text = text.slice(0, maxText) + '\n…(truncated)';

    return [
      `URL: ${location.href}`,
      `Title: ${document.title}`,
      `Focused: ${focused}`,
      dialogs ? `Open dialogs: ${dialogs}` : null,
      `Scroll: ${Math.round(scrollY)} / ${Math.max(0, document.documentElement.scrollHeight - innerHeight)}`,
      '',
      '--- Visible text ---',
      text,
      '',
      '--- Interactive elements ---',
      items.join('\n') || '(none)',
    ].filter((l) => l !== null).join('\n');
  }, MAX_TEXT);
}

async function locate(page, target) {
  if (/^\d+$/.test(target)) return page.locator(`[data-pref="${target}"]`).first();
  const byRole = page.getByRole('button', { name: target }).or(page.getByRole('link', { name: target }));
  if (await byRole.count()) return byRole.first();
  return page.getByText(target, { exact: false }).first();
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function runServer(id, url, flags) {
  const { chromium, devices } = loadPlaywright();
  const launchOpts = process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {};
  const browser = await chromium.launch(launchOpts);

  const zoom = Number(flags.zoom) || 1;
  let ctxOpts;
  if (flags.device === 'mobile') {
    ctxOpts = { ...devices['iPhone 13'] };
  } else {
    // Zoom is simulated by shrinking the CSS viewport and scaling pixels up,
    // which is how browser zoom affects layout (e.g. 200% on 1280px = 640px).
    ctxOpts = {
      viewport: { width: Math.round(1280 / zoom), height: Math.round(800 / zoom) },
      deviceScaleFactor: zoom,
    };
  }
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));

  let lastSnap = '';
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const firstLoadMs = Date.now() - t0;
  lastSnap = await snapshot(page);

  const handlers = {
    snapshot: async () => {},
    click: async ([t]) => {
      const loc = await locate(page, t);
      await loc.click({ timeout: 5000 });
    },
    fill: async ([t, ...rest]) => {
      const loc = await locate(page, t);
      await loc.fill(rest.join(' '), { timeout: 5000 });
    },
    select: async ([t, ...rest]) => {
      const loc = await locate(page, t);
      await loc.selectOption({ label: rest.join(' ') }, { timeout: 5000 })
        .catch(() => loc.selectOption(rest.join(' '), { timeout: 5000 }));
    },
    press: async ([key]) => page.keyboard.press(key),
    scroll: async ([dir]) => page.mouse.wheel(0, dir === 'up' ? -600 : 600),
    goto: async ([u]) => page.goto(u, { waitUntil: 'domcontentloaded' }),
    back: async () => page.goBack(),
    reload: async () => page.reload(),
    screenshot: async ([p], f) => {
      fs.mkdirSync(path.dirname(path.resolve(p)), { recursive: true });
      await page.screenshot({ path: p, fullPage: !!f.full });
      return `Saved screenshot: ${path.resolve(p)}`;
    },
  };

  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { cmd, args = [], flags: f = {} } = JSON.parse(body || '{}');
    let out = '';
    try {
      if (cmd === 'stop') {
        res.end('Stopped.');
        await browser.close();
        fs.rmSync(stateFile(id), { force: true });
        process.exit(0);
      }
      const h = handlers[cmd];
      if (!h) throw new Error(`Unknown command: ${cmd}`);
      const started = Date.now();
      const result = await h(args, f);
      const note = typeof result === 'string' ? result : '';
      if (cmd !== 'snapshot' && cmd !== 'screenshot') await settle(page);
      const took = Date.now() - started;
      if (cmd === 'screenshot') out = note;
      else {
        const snap = await snapshot(page);
        // Ignore focus: clicking a no-op button still moves focus onto it.
        const sansFocus = (t) => t.replace(/^Focused: .*$/m, '');
        const unchanged = cmd !== 'snapshot' && sansFocus(snap) === sansFocus(lastSnap);
        lastSnap = snap;
        out = `(${cmd} took ${took}ms)` + (unchanged ? ' NOTE: nothing on the page changed.' : '') + '\n' + snap;
      }
    } catch (e) {
      out = `ERROR: ${e.message.split('\n')[0]}\n\n` + await snapshot(page).catch(() => '');
    }
    if (cmd !== 'screenshot') {
      out += consoleErrors.length
        ? `\n\n--- Console errors since last command ---\n${consoleErrors.splice(0).join('\n')}`
        : '\n\nConsole errors: none';
    }
    res.end(out);
  });

  server.listen(0, '127.0.0.1', async () => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(stateFile(id), JSON.stringify({ port: server.address().port, pid: process.pid }));
    process.send?.({ ready: true, firstLoadMs, snap: lastSnap });
  });
}

// ---------------------------------------------------------------- client side

function send(id, payload) {
  let state;
  try { state = JSON.parse(fs.readFileSync(stateFile(id), 'utf8')); }
  catch { console.error(`No browser running for --id ${id}. Run "start" first.`); process.exit(1); }
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: state.port, method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end(JSON.stringify(payload));
  });
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  const id = String(flags.id || 'default');

  if (cmd === '__serve') return runServer(id, positional[0], flags);

  if (!cmd || cmd === 'help' || cmd === '--help') {
    const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    console.log(src.split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }

  if (cmd === 'start') {
    if (!positional[0]) { console.error('Usage: start <url> --id <id>'); process.exit(1); }
    if (fs.existsSync(stateFile(id))) await send(id, { cmd: 'stop' }).catch(() => fs.rmSync(stateFile(id), { force: true }));
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '__serve', ...process.argv.slice(3)], {
      detached: true,
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    });
    const timer = setTimeout(() => { console.error('Browser did not start within 60s.'); process.exit(1); }, 60000);
    child.on('message', (m) => {
      clearTimeout(timer);
      console.log(`Browser "${id}" started (first load ${m.firstLoadMs}ms).\n\n${m.snap}`);
      child.disconnect();
      child.unref();
      process.exit(0);
    });
    child.on('exit', (code) => { console.error(`Browser process exited (code ${code}).`); process.exit(1); });
    return;
  }

  console.log(await send(id, { cmd, args: positional, flags }));
}

main().catch((e) => { console.error(e); process.exit(1); });
