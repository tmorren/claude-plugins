# claude-plugins

My personal Claude Code plugin marketplace. It holds one plugin, `toolkit`,
which contains my custom skills and the rosters they share.

```
.claude-plugin/marketplace.json   marketplace "tmorren"
plugins/toolkit/
  .claude-plugin/plugin.json
  rosters.md                      how rosters load and how projects extend them
  personas/                       roster: user personas
  debug-lenses/                   roster: families of bug causes
  user-states/                    roster: situations a user can be in
  audit-lenses/                   roster: qualities a feature should have
  design-stances/                 roster: design philosophies
  scripts/browser.mjs             headless browser helper shared by skills
  skills/<skill-name>/SKILL.md    one folder per skill
```

## Skills

| Skill | What it does |
|---|---|
| `/toolkit:new-skill` | Adds or changes a skill, agent, hook or global convention in this plugin, after checking every installed plugin, skill and MCP server for overlap and conflicts. Just ask "add a skill to my toolkit that…". |
| `/toolkit:persona-walkthrough` | Sends personas through a web app or one flow, and writes a report on how it felt to each of them, with prioritised fixes. Example: `/toolkit:persona-walkthrough local "sign up and save a first recipe"` |
| `/toolkit:bug-hypotheses` | Runs `mattpocock-skills:diagnosing-bugs`, but tests one hypothesis per debug lens in parallel, each in its own worktree, against the bug's feedback loop. Runs only when you type it. Example: `/toolkit:bug-hypotheses "scores sometimes reset after a round"` |
| `/toolkit:repro-matrix` | Tries to reproduce a vague or intermittent web app bug in every user state at once (new or heavy account, expired session, other timezone, slow network, mobile, two tabs…), and reports which states reproduce it, plus a `repro.sh` that goes red on the bug. Example: `/toolkit:repro-matrix local "save button sometimes does nothing"` |
| `/toolkit:feature-audit` | Audits one existing feature through lenses (states, performance, discoverability, mobile, accessibility, observability, data integrity, copy) and writes ranked improvement tickets. Example: `/toolkit:feature-audit "recipe editor" local` |
| `/toolkit:design-options` | Before building, has each design stance (simplest, reuse existing, built to scale, buy or use a library, don't build it) propose an approach from the real codebase, then compares them and recommends one. Example: `/toolkit:design-options "let players rejoin a game after disconnecting"` |

Every skill writes its report to `toolkit-reports/<date>-<skill>-<slug>/` in the
project, which should be in that project's `.gitignore`.

## Global conventions

`plugins/toolkit/conventions/global.md` is loaded into every session by a
SessionStart hook, both locally and in the cloud, wherever the plugin is
enabled. It holds rules that apply to all projects, plus the order in which
instructions win: the user, then the repo's CLAUDE.md for project-specific
things, then these conventions, then plugin skills. Repo `CLAUDE.md` files
should only hold project-specific instructions.

## Rosters

Each skill that fans out uses a **roster**: a folder of small Markdown files,
one per persona, lens, user state or design stance. The plugin ships defaults,
and each project can add its own, replace a default (same `id`) or switch one off
(`disabled: true`) in a matching folder under `.claude/`:

| Roster | Defaults | Project folder |
|---|---|---|
| Personas | `plugins/toolkit/personas/` | `.claude/personas/` |
| Debug lenses | `plugins/toolkit/debug-lenses/` | `.claude/debug-lenses/` |
| User states | `plugins/toolkit/user-states/` | `.claude/user-states/` |
| Audit lenses | `plugins/toolkit/audit-lenses/` | `.claude/audit-lenses/` |
| Design stances | `plugins/toolkit/design-stances/` | `.claude/design-stances/` |

Each folder's README describes its file format, and
[`plugins/toolkit/rosters.md`](plugins/toolkit/rosters.md) describes how
loading and overriding work.

## Install

### Local (any machine)

```bash
claude plugin marketplace add tmorren/claude-plugins
claude plugin install toolkit@tmorren
```

The repo is private, so this uses your local git credentials (SSH key or
`gh auth login`).

To have it update automatically, run `/plugin` in Claude Code, open
**Marketplaces**, select `tmorren` and enable auto-update. To update by hand:

```bash
claude plugin marketplace update tmorren
```

Then restart Claude Code.

`persona-walkthrough`, `repro-matrix` and `feature-audit` need Playwright
locally. Install it once:

```bash
npm i -g playwright && npx playwright install chromium
```

### Cloud sessions

Add this marketplace in your claude.ai plugin settings so every cloud session
loads it. If that isn't available for your account, enable it for each
project in that project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "tmorren": { "source": { "source": "github", "repo": "tmorren/claude-plugins" } },
    "mattpocock": { "source": { "source": "github", "repo": "mattpocock/skills" } }
  },
  "enabledPlugins": {
    "toolkit@tmorren": true,
    "mattpocock-skills@mattpocock": true
  }
}
```

## Third-party plugins I use

These are installed directly from their own repos rather than copied in here,
so they stay up to date and keep their internal dependencies intact.

### mattpocock-skills

[mattpocock/skills](https://github.com/mattpocock/skills) (MIT): 27
engineering and productivity skills, including grilling, spec and ticket
flows, TDD, code review and handoff. It adds about 1.7k tokens to every session.

```bash
claude plugin marketplace add mattpocock/skills
claude plugin install mattpocock-skills@mattpocock
```

Run `/mattpocock-skills:setup-matt-pocock-skills` once in each repo before
using the engineering skills. It sets up the issue tracker, labels and doc
layout. Turn on auto-update for the `mattpocock` marketplace under `/plugin` →
Marketplaces.

## Testing the browser helper

`plugins/toolkit/scripts/browser.mjs` has tests that drive it through its
command line against a local page. With Playwright installed, run from the repo
root:

```bash
node --test plugins/toolkit/scripts/browser.test.mjs
```

## Adding a skill

Ask Claude to add it. The `new-skill` skill runs the overlap and conflict
checks first. To do it by hand:

1. Create `plugins/toolkit/skills/<name>/SKILL.md` with `name` and
   `description` in the frontmatter.
2. Reference shared files through `${CLAUDE_PLUGIN_ROOT}`, for example
   `${CLAUDE_PLUGIN_ROOT}/personas/`.
3. Commit and push. `plugin.json` intentionally has no `version` field, so
   installs track the latest commit.
