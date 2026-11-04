---
id: mobile
name: Mobile phone
summary: On a phone-sized touch screen, often switching apps in the middle of a task.
browser: --device mobile
needs_data: false
---

## How to get into this state
Start the browser with `--device mobile` (an iPhone-sized viewport with touch).
To simulate switching away and back, open a second tab with `tab new`, wait a
few seconds, then return with `tab 1`.

## What it tends to expose
Elements hidden or overlapped at small widths, hover-only controls, on-screen
keyboard covering inputs, tap targets too small to hit, fixed headers eating
the screen, and state lost when the page is backgrounded.
