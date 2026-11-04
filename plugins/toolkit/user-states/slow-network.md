---
id: slow-network
name: Slow or dropping connection
summary: On a train with a weak signal: every request is slow, and some fail.
browser: --network slow
needs_data: false
---

## How to get into this state
Start the browser with `--network slow`. For the step in the bug report, also
try switching to `node "$B" network offline --id <id>` just after the action
and back to `normal` a few seconds later, to simulate a request that drops
halfway. Click the main button again if nothing seems to happen, like an
impatient user would.

## What it tends to expose
Missing loading states, double submissions, races between responses,
optimistic updates that never roll back, timeouts with no message, and forms
that lose input when a request fails.
