# User states

Used by `repro-matrix`. Each state is a situation a real user can be in when a
bug happens: who they are, what their account holds, and what their device and
connection are doing. A subagent sets the state up, then tries to reproduce
the bug in it.

Projects add states for their own user types in `.claude/user-states/*.md`
(for example `teacher-with-three-classes` or `player-who-joined-late`). See
[`../rosters.md`](../rosters.md) for loading and overriding.

## File format

```markdown
---
id: kebab-case-id
name: Short name
summary: One line describing the state
browser: Extra flags for `browser.mjs start`, or "none"
needs_data: true | false     # true when it needs seeded or prepared data
---

## How to get into this state
## What it tends to expose
```

**How to get into this state** must be steps a subagent can actually run:
browser commands, the project's documented seed commands, or API calls. When
the steps need data the project's seed script doesn't create, say so. The
skill then reports the state as "couldn't set up" instead of faking it, and
suggests adding that data to the seed script.
