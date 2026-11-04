// Tests for browser.mjs, driven through its command line the way skills use it.
// Run from the repo root:  node --test plugins/toolkit/scripts/
// Needs Playwright with Chromium (see the README's install section).

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const BROWSER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'browser.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-test-'));

const PAGE = `<!doctype html><title>Fixture</title>
<p id="locale"></p><p id="tz"></p><p id="cookie"></p><p id="result">idle</p>
<button onclick="ping()">Ping</button>
<script>
  locale.textContent = 'locale=' + navigator.language;
  tz.textContent = 'tz=' + Intl.DateTimeFormat().resolvedOptions().timeZone;
  cookie.textContent = 'cookie=' + (document.cookie || 'none');
  async function ping() {
    const t = performance.now();
    try { await (await fetch('/ping')).text(); result.textContent = 'pong in ' + Math.round(performance.now() - t) + 'ms'; }
    catch { result.textContent = 'fetch failed'; }
  }
</script>`;

let server;
let url;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/ping') return res.end('pong');
    // Only /login sets the session cookie, so other pages show whether it survived.
    if (req.url === '/login') res.setHeader('Set-Cookie', 'session=abc; Path=/');
    res.setHeader('Content-Type', 'text/html');
    res.end(PAGE);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${server.address().port}/`;
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

let n = 0;
async function browser(startFlags = [], startUrl = url) {
  const id = `test-${process.pid}-${++n}`;
  const cli = async (...args) => (await run('node', [BROWSER, ...args, '--id', id], { timeout: 60000 })).stdout;
  const first = await cli('start', startUrl, ...startFlags);
  return { cli, first, stop: () => cli('stop').catch(() => {}) };
}

test('starts with the requested locale and timezone', async () => {
  const b = await browser(['--locale', 'de-DE', '--timezone', 'Pacific/Auckland']);
  try {
    assert.match(b.first, /locale=de-DE/);
    assert.match(b.first, /tz=Pacific\/Auckland/);
  } finally { await b.stop(); }
});

test('network offline makes requests fail and shows the mode in the snapshot', async () => {
  const b = await browser();
  try {
    const offline = await b.cli('network', 'offline');
    assert.match(offline, /Network: offline/);
    assert.match(await b.cli('click', 'Ping'), /fetch failed/);
    await b.cli('network', 'normal');
    assert.match(await b.cli('click', 'Ping'), /pong in/);
  } finally { await b.stop(); }
});

test('slow network adds latency to requests', async () => {
  const b = await browser(['--network', 'slow']);
  try {
    assert.match(b.first, /Network: slow/);
    let out = await b.cli('click', 'Ping');
    // A slow request can still be in flight when the click's snapshot is taken.
    for (let i = 0; i < 10 && !/pong in/.test(out); i++) out = await b.cli('snapshot');
    const ms = Number(out.match(/pong in (\d+)ms/)[1]);
    assert.ok(ms >= 300, `expected at least 300ms, got ${ms}ms`);
  } finally { await b.stop(); }
});

test('opens a second tab in the same session and switches between tabs', async () => {
  const b = await browser([], `${url}login`);
  try {
    const second = await b.cli('tab', 'new', url);
    assert.match(second, /Tab: 2 of 2/);
    assert.match(second, /cookie=session=abc/);
    assert.match(await b.cli('tabs'), /\* \[2\]/);
    assert.match(await b.cli('tab', '1'), /Tab: 1 of 2/);
  } finally { await b.stop(); }
});

test('clear-cookies drops the session, and --storage-state brings it back', async () => {
  const state = path.join(tmp, 'state.json');
  const b = await browser([], `${url}login`);
  try {
    assert.match(b.first, /cookie=session=abc/);
    assert.match(await b.cli('save-state', state), /Saved storage state/);
    await b.cli('clear-cookies');
    assert.match(await b.cli('goto', url), /cookie=none/);
  } finally { await b.stop(); }

  const restored = await browser(['--storage-state', state]);
  try {
    assert.match(restored.first, /cookie=session=abc/);
  } finally { await restored.stop(); }
});

test('help lists every command, including the new ones', async () => {
  const { stdout } = await run('node', [BROWSER, 'help']);
  for (const cmd of ['start', 'network', 'tab new', 'tabs', 'clear-cookies', 'save-state', 'stop']) {
    assert.ok(stdout.includes(cmd), `help is missing "${cmd}"`);
  }
});
