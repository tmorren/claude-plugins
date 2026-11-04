---
id: simplest
name: Simplest thing that could work
summary: Ship the smallest change that fully solves today's problem, and nothing for tomorrow's.
---

## Brief
Propose the smallest change that fully meets the stated goal and success
criteria. Prefer fewer files, fewer new concepts and no new dependencies or
infrastructure. Leave out anything that is only needed "later". Say exactly
what you left out and what would make it necessary.

## What it optimises for
Time to ship, ease of review, and ease of undoing.

## Blind spots
It can paint the code into a corner when the "later" need is actually certain
and near. It can also skip non-functional needs such as performance,
observability and access control. Check that it still meets every stated
constraint.
