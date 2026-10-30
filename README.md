# claude-plugins

My personal Claude Code plugin marketplace. It holds one plugin, `toolkit`,
which contains my custom skills and a shared persona library.

```
.claude-plugin/marketplace.json   marketplace "tmorren"
plugins/toolkit/
  .claude-plugin/plugin.json
  personas/                       shared personas, readable by every skill
  skills/<skill-name>/SKILL.md    one folder per skill
```

## Skills

| Skill | What it does |
|---|---|
| `/toolkit:persona-walkthrough` | Sends personas through a web app or one flow, and writes a report on how it felt to each of them, with prioritised fixes. Example: `/toolkit:persona-walkthrough local "sign up and save a first recipe"` |

## Personas

Each persona lives in `plugins/toolkit/personas/`. See that folder's
README for the file format. A project can add or override personas in
`.claude/personas/*.md`.

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

`persona-walkthrough` needs Playwright locally. Install it once:

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
    "tmorren": { "source": { "source": "github", "repo": "tmorren/claude-plugins" } }
  },
  "enabledPlugins": { "toolkit@tmorren": true }
}
```

## Adding a skill

1. Create `plugins/toolkit/skills/<name>/SKILL.md` with `name` and
   `description` in the frontmatter.
2. Reference shared files through `${CLAUDE_PLUGIN_ROOT}`, for example
   `${CLAUDE_PLUGIN_ROOT}/personas/`.
3. Commit and push. `plugin.json` intentionally has no `version` field, so
   installs track the latest commit.
