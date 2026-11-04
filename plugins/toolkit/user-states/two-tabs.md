---
id: two-tabs
name: Same account in two tabs
summary: Has the app open in two tabs (or a laptop and a phone) and acts in both.
browser: none
needs_data: false
---

## How to get into this state
Log in, then open the same screen in a second tab with
`node "$B" tab new <url> --id <id>`. Make a change in tab 2, switch back with
`tab 1`, and do the bug's step there without reloading. Then try the reverse
order.

## What it tends to expose
Stale data overwriting newer changes, conflicting edits with no warning,
duplicate records, logout in one tab not reaching the other, and local
storage or cache getting out of sync.
