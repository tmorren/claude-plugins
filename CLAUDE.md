# claude-plugins

This is tmorren's personal plugin marketplace. It contains one plugin,
`plugins/toolkit/`.

- **Before** adding, changing, renaming or removing any skill, agent, hook or
  global convention, follow `plugins/toolkit/skills/new-skill/SKILL.md`. It
  checks the change against everything else installed for overlap and conflicts.
- `plugins/toolkit/conventions/global.md` is loaded into every session on every
  machine by a SessionStart hook. Only rules that apply to all projects go
  there, and they must stay short. Project-specific rules belong in that
  project's own `CLAUDE.md`.
- `plugin.json` has no `version` field on purpose, so installs track the latest
  commit on `main`.
