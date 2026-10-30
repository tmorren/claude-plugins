# Global conventions (from the toolkit plugin)

These are the user's defaults for every project, loaded at the start of each
session by the `toolkit` plugin.

## Which instructions win

1. What the user says in the conversation.
2. The repo's own `CLAUDE.md` / `AGENTS.md`, for anything specific to that project: its stack, commands, architecture, deployment and domain. If a repo file contradicts one of these conventions on a general matter (one that isn't project-specific), follow the repo, but mention the conflict once so it can be cleaned up.
3. These conventions.
4. Plugin skills: `toolkit` first, then any other plugin, such as `mattpocock-skills`. Where a skill's instructions contradict these conventions, these conventions win.

## Testing

- User-facing behaviour gets deterministic test coverage in the same task,
  unless the user explicitly scopes it out. For *where* and *how* to test, use
  the `tdd` skill's approach: test behaviour through public interfaces at
  agreed seams, not implementation details. If no seam is agreed yet, propose
  one rather than skipping the test.
- If a new test makes a previously passing test fail, don't quietly rewrite the
  old test to get back to green. Stop, report the failing test and its likely
  cause, and propose the fix first.
- Name tests by the behaviour they check, e.g. `it('creates a game and returns a join code')`.

## Docs are part of done

- For every change to a feature, contract, state shape or flow, decide whether
  a doc needs updating or creating, and do it in the same task. That includes a
  companion repo's docs when the change crosses repos.
- Add a Mermaid diagram when a flow, state transition or validation path is
  hard to follow in prose.

## Demo and seed data

If a change adds something a user can see, the project's demo or seed data must
produce it, updated in the same task. An empty state in the demo means the work
isn't finished. Each repo documents its own seeding commands.

## Secrets

Never commit secrets, or put them into API responses, events, logs, docs or
client bundles. Keep public client config (publishable keys, base URLs)
clearly separate from secrets. Flag any exposure during review.

## Pull requests

If the repo has `.github/pull_request_template.md`, follow it. Otherwise:

- **Title:** say what changes in plain words, not the ticket number or file name.
- **Before:** what a user, operator or developer sees today, and why it's a problem.
- **After:** what they see once this merges.
- **How:** the approach in a few sentences. When it helps, add the *smallest*
  visual that makes the shape clear: a diff sketch, call tree, file tree or
  Mermaid diagram.
- **Testing:** what you ran and what it showed. Give evidence: a screenshot for
  visual changes, otherwise test output, ideally a test that failed before and
  passes after. Say so if something couldn't be run.
- **Merge danger:** is it a one-way or two-way door (can it be rolled back
  cheaply?), and what's the blast radius, in a word plus a line?
- **Related:** `Closes #123` for an issue in this repo, and
  `Closes Visual-Zone-Development/<repo>#123` for an issue in another repo. Link
  companion PRs from both sides.

This replaces the `pr` skill's Summary / Evidence / Merge Danger layout. Use
plain language instead of glossary jargon.

## Changing these conventions

General rules go in this file, not in a repo's `CLAUDE.md`. To add or change
one, use the `toolkit:new-skill` process, which checks for conflicts with the
installed skills first.
