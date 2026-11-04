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

// A game-like page: a full-screen canvas, input polled every frame.
const GAME = `<!doctype html><title>Game</title>
<style>html,body{margin:0}canvas{display:block;width:100vw;height:100vh}</style>
<canvas id="c"></canvas>
<script>
  window.seen = { buttons: [], axes: [], events: [], keyMs: 0, clicks: [], taps: [] };
  addEventListener('gamepadconnected', () => seen.events.push('connected'));
  addEventListener('gamepaddisconnected', () => seen.events.push('disconnected'));
  let down = 0;
  addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' && !down) down = performance.now(); });
  addEventListener('keyup', (e) => { if (e.key === 'ArrowRight') { seen.keyMs = performance.now() - down; down = 0; } });
  addEventListener('click', (e) => seen.clicks.push([e.clientX, e.clientY, e.button]));
  addEventListener('contextmenu', (e) => { e.preventDefault(); seen.clicks.push([e.clientX, e.clientY, e.button]); });
  addEventListener('touchstart', (e) => seen.taps.push([Math.round(e.touches[0].clientX), Math.round(e.touches[0].clientY)]));
  window.webgl = !!document.getElementById('c').getContext('webgl');
  (function frame() {
    const p = navigator.getGamepads()[0];
    if (p) {
      p.buttons.forEach((b, i) => { if (b.pressed && !seen.buttons.includes(i)) seen.buttons.push(i); });
      if (Math.abs(p.axes[0]) > 0.5 && !seen.axes.includes('lx')) seen.axes.push('lx');
      if (Math.abs(p.axes[3]) > 0.5 && !seen.axes.includes('ry')) seen.axes.push('ry');
    }
    requestAnimationFrame(frame);
  })();
</script>`;

let server;
let url;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/ping') return res.end('pong');
    if (req.url === '/game') { res.setHeader('Content-Type', 'text/html'); return res.end(GAME); }
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
  const cli = async (...args) => (await run('node', [BROWSER, ...args, '--id', id], { timeout: 60000 })).stdout.trimEnd();
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

const seen = async (b) => JSON.parse(await b.cli('eval', 'window.seen'));

test('a virtual gamepad presses buttons and moves sticks that the game polls', async () => {
  const b = await browser(['--gamepad', '--webgl'], `${url}game`);
  try {
    assert.match(b.first, /Gamepad: connected/);
    assert.match(b.first, /Canvas: \d+x\d+ at 0,0/);
    // A canvas page's text never changes, so the helper mustn't claim nothing happened.
    assert.doesNotMatch(await b.cli('pad', 'press', 'a'), /nothing on the page changed/);
    await b.cli('pad', 'hold', 'start', '200');
    await b.cli('pad', 'stick', 'left', '1', '0', '200');
    await b.cli('pad', 'stick', 'right', '0', '-1', '200');
    const s = await seen(b);
    assert.deepEqual(s.buttons.sort((x, y) => x - y), [0, 9]);
    assert.deepEqual(s.axes.sort(), ['lx', 'ry']);
    assert.ok(s.events.includes('connected'));
  } finally { await b.stop(); }
});

test('disconnecting the gamepad fires the event, and connecting brings it back', async () => {
  const b = await browser(['--gamepad'], `${url}game`);
  try {
    assert.match(await b.cli('pad', 'disconnect'), /Gamepad: disconnected/);
    assert.equal(await b.cli('eval', 'navigator.getGamepads()[0]'), 'null');
    assert.match(await b.cli('pad', 'connect'), /Gamepad: connected/);
    assert.deepEqual((await seen(b)).events, ['connected', 'disconnected', 'connected']);
  } finally { await b.stop(); }
});

test('rejects an unknown gamepad button with the list of valid ones', async () => {
  const b = await browser(['--gamepad'], `${url}game`);
  try {
    assert.match(await b.cli('pad', 'press', 'z'), /ERROR: Unknown gamepad button "z"\. Use: a b x y/);
  } finally { await b.stop(); }
});

test('holds a key for a duration', async () => {
  const b = await browser([], `${url}game`);
  try {
    await b.cli('key', 'hold', 'ArrowRight', '400');
    const ms = (await seen(b)).keyMs;
    assert.ok(ms >= 350, `expected the key held about 400ms, got ${ms}ms`);
  } finally { await b.stop(); }
});

test('uses a custom viewport and pixel density, and clicks and taps at CSS coordinates', async () => {
  const b = await browser(['--viewport', '1280x800', '--dpr', '2', '--touch'], `${url}game`);
  try {
    assert.equal(await b.cli('eval', '[innerWidth, innerHeight, devicePixelRatio]'), JSON.stringify([1280, 800, 2], null, 2));
    await b.cli('mouse', '100', '200');
    await b.cli('mouse', '300', '400', 'right');
    await b.cli('tap', '640', '452');
    const s = await seen(b);
    // A tap also fires a click at the same spot, as in a real browser.
    assert.deepEqual(s.clicks, [[100, 200, 0], [300, 400, 2], [640, 452, 0]]);
    assert.deepEqual(s.taps, [[640, 452]]);
    const shot = await b.cli('screenshot', path.join(tmp, 'dpr.png'));
    assert.match(shot, /viewport 1280x800 CSS px, image is 2x larger/);
  } finally { await b.stop(); }
});

test('--webgl gives canvas games a WebGL context', async () => {
  const b = await browser(['--webgl'], `${url}game`);
  try {
    assert.equal(await b.cli('eval', 'window.webgl'), 'true');
  } finally { await b.stop(); }
});

test('help lists every command, including the new ones', async () => {
  const { stdout } = await run('node', [BROWSER, 'help']);
  for (const cmd of ['start', 'network', 'tab new', 'tabs', 'clear-cookies', 'save-state', 'pad press', 'pad stick', 'key hold', 'mouse', 'tap', 'wait', 'eval', '--gamepad', '--viewport', 'stop']) {
    assert.ok(stdout.includes(cmd), `help is missing "${cmd}"`);
  }
});
