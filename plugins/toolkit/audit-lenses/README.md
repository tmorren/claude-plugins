# Audit lenses

Used by `feature-audit`. Each lens is one quality a feature should have. A
subagent reviews the feature's code and, where the lens needs it, uses the
feature in the running app, then reports concrete improvements.

Projects add lenses for qualities that matter to them in
`.claude/audit-lenses/*.md` (for example `realtime-sync`, `offline-first` or
`multi-tenant-isolation`). See [`../rosters.md`](../rosters.md) for loading
and overriding.

## File format

```markdown
---
id: kebab-case-id
name: Short name
summary: One line naming the quality
needs: code | browser | both
---

## Checks
## How to check
## What good looks like
```

**Checks** is a list of specific questions, each answerable with evidence: a
`file:line`, a screenshot or a measurement. The subagent works through every
check and reports on each one.
