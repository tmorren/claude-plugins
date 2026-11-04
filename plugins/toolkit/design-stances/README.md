# Design stances

Used by `design-options`. Each stance is a design philosophy. A subagent takes
one stance and proposes the best way to build the feature *from that stance*,
grounded in the actual codebase, so the options that come back are genuinely
different.

Projects add stances for their own constraints in `.claude/design-stances/*.md`
(for example `old-mobile-clients` or `single-region-postgres`). See
[`../rosters.md`](../rosters.md) for loading and overriding.

## File format

```markdown
---
id: kebab-case-id
name: Short name
summary: One line stating the philosophy
---

## Brief
## What it optimises for
## Blind spots
```

**Brief** is the constraint handed to the subagent, written as an instruction.
**Blind spots** are what this stance tends to get wrong, so the comparison step
knows what to check in its proposal.
