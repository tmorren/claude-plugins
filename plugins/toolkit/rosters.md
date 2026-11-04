# Rosters

Several toolkit skills fan out one subagent per entry in a **roster**: a folder
of small Markdown files, each describing one persona, lens, user state or design
stance. The plugin ships defaults, and each project can add or replace entries.

| Roster | Plugin folder | Project folder | Used by |
|---|---|---|---|
| Personas | `personas/` | `.claude/personas/` | `persona-walkthrough` |
| Debug lenses | `debug-lenses/` | `.claude/debug-lenses/` | `bug-hypotheses` |
| User states | `user-states/` | `.claude/user-states/` | `repro-matrix` |
| Audit lenses | `audit-lenses/` | `.claude/audit-lenses/` | `feature-audit` |
| Design stances | `design-stances/` | `.claude/design-stances/` | `design-options` |

Each folder's `README.md` describes its file format.

## Loading a roster

1. Read every `*.md` in `${CLAUDE_PLUGIN_ROOT}/<plugin folder>/` except `README.md`.
2. Read every `*.md` in the project's `<project folder>`, if it exists.
3. Key entries by their frontmatter `id`. A project entry with the same `id`
   replaces the default one. A project entry with a new `id` is added.
4. A project entry with `disabled: true` in its frontmatter removes the default
   with that `id`. Use this when a default lens or state makes no sense for the
   project, such as `mobile` for a CLI tool.

Every entry has at least `id`, `name` and `summary` in its frontmatter. When a
skill lists the entries it picked, it shows `name (id)` and notes which ones
came from the project.

## Writing a good entry

Write what the subagent should *do* and *look for*, in concrete, checkable
terms. "Checks every list for an empty state" works. "Cares about edge cases"
doesn't. The entry is the subagent's whole brief for its point of view, so it
should stand alone.

Project entries are where most of the value is: they capture the weak spots,
user types and constraints only that project has. When a skill run turns up a
recurring theme, suggest adding it to the project's roster.
