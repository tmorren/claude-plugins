# Debug lenses

Used by `bug-hypotheses`. Each lens is one family of root causes. A subagent
takes one lens, forms the most likely hypothesis in that family for the bug at
hand, and tests it against the bug's feedback loop.

Projects add lenses for their known weak spots in `.claude/debug-lenses/*.md`
(for example `websocket-reconnect` or `prisma-migration-drift`). See
[`../rosters.md`](../rosters.md) for loading and overriding.

## File format

```markdown
---
id: kebab-case-id
name: Short name
summary: One line naming the family of causes
suspect_when: Symptoms that make this lens worth running
---

## What this lens suspects
## Where to look
## Probes
## Signs it isn't this
```

**Probes** are cheap experiments that each make a prediction: "if this is the
cause, then doing X makes the bug disappear, and doing Y makes it worse". They
are what turn a hunch into evidence.
