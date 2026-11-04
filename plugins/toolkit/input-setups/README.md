# Input setups

Used by `input-walkthrough`. Each setup is one way a person plays or browses:
a screen size and pixel density, plus the **only** inputs they have. A
subagent goes through every screen, and the game itself, using that setup
alone.

Projects add or override setups in `.claude/input-setups/*.md`, for example
their own controls contract, local multiplayer with several pads, or a party
game's phone screen. See [`../rosters.md`](../rosters.md) for loading and
overriding.

## File format

```markdown
---
id: kebab-case-id
name: Short name
summary: One line: the device and the inputs
browser: Flags for `browser.mjs start` (screen, --gamepad, --touch, ...)
inputs: gamepad | keyboard | mouse | touch, comma-separated   # the only ones allowed
optional: true | false     # optional setups run only when asked for or clearly relevant
---

## How to play
## What must be true
```

**How to play** lists the `browser.mjs` commands the subagent may use. Commands
for other inputs are off limits in that setup: a controller-only player has no
mouse, so `click` and `mouse` are out. Checking state with `eval` and taking
screenshots are always allowed, because they're observation, not input.
