# Global conventions (from the toolkit plugin)

These are the user's defaults for every project, loaded at the start of each
session by the `toolkit` plugin.

## Which instructions win

1. What the user says in the conversation.
2. The repo's own `CLAUDE.md` / `AGENTS.md`, for anything specific to that project: its stack, commands, architecture, deployment and domain. If a repo file contradicts one of these conventions on a general matter (one that isn't project-specific), follow the repo, but mention the conflict once so it can be cleaned up.
3. These conventions.
4. Plugin skills: `toolkit` first, then any other plugin, such as `mattpocock-skills`. Where a skill's instructions contradict these conventions, these conventions win.

## Changing these conventions

General rules go in this file, not in a repo's `CLAUDE.md`. To add or change
one, use the `toolkit:new-skill` process, which checks for conflicts with the
installed skills first.
