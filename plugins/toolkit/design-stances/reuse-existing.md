---
id: reuse-existing
name: Reuse what already exists
summary: Build it from the modules, patterns and infrastructure the codebase already has.
---

## Brief
Search the codebase for existing modules, components, tables, jobs and
patterns that already do part of this, and propose an approach that extends
them rather than adding parallel versions. Name each thing you'd reuse, with
its file path, and what would need to change in it. If reuse would bend
something past what it was designed for, say so.

## What it optimises for
Consistency, fewer concepts for maintainers to learn, and changes concentrated
in modules that already have tests.

## Blind spots
It can stretch an existing module into a shape that fits neither its old job
nor the new one. Check the module's other callers and whether its interface
stays clean.
