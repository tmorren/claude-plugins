---
name: new-skill
description: Add, change, rename or remove a skill, agent, hook or global convention in the user's own toolkit plugin (the tmorren/claude-plugins repo), after checking it doesn't duplicate or conflict with anything else installed. Use whenever the user asks to add something to "my toolkit", "my plugin" or "my skills", to make a convention apply everywhere, or works on that repo. Not for skills in other people's plugins or project-local .claude/skills.
---

# New or changed toolkit skill

The toolkit should hold only things that nothing else installed already does,
and nothing in it should contradict another skill or the global conventions.
Run every check below **before** writing anything, including for small edits to
an existing skill's description, since the description decides when it triggers.

## 0. Find the repo

Work in a git clone of `tmorren/claude-plugins`:
- If the current directory is that repo, use it.
- Otherwise look for an existing clone, for example `git -C <dir> remote get-url origin` on likely folders such as `~/Documents/Projects/claude-plugins`.
- Failing that, clone it into a temporary folder.

Never edit the installed copy under `~/.claude/plugins/`. It gets overwritten on update.

## 1. Take inventory

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/new-skill/scripts/inventory.mjs" --project "$PWD"
```

This lists every installed plugin's skills, agents, commands, hooks and MCP
servers, plus personal (`~/.claude`) and project (`.claude/`) ones. Add what the
script can't see from your own context:
- built-in skills
- claude.ai connectors
- MCP tools (including deferred ones)

Also read the global conventions file, `plugins/toolkit/conventions/global.md`.

## 2. Check for overlap

For the proposed skill, write down its job in one sentence and the requests that
should trigger it. Compare those with every item in the inventory, and sort each
match into one of these:

| Finding | Meaning | What to do |
|---|---|---|
| **Duplicate** | Something already does this job | Don't create it. Use the existing one, or **extend** it: write a thin toolkit skill that says "follow `<other-skill>`, plus these rules". Never copy another plugin's skill, or it stops getting updates. |
| **Trigger overlap** | Different job, but the same kind of request would match both | Narrow the description and add an explicit "Not for X; use `<other>`" line. Consider `disable-model-invocation: true` if it only needs to run on command. |
| **Adjacent** | Related, but there's no realistic request that matches both | Fine. Mention it in the description if it helps Claude choose. |

Read the full `SKILL.md` of anything you classify as a duplicate or a trigger
overlap. Descriptions alone can be misleading.

## 3. Check for conflicts

A conflict is where two sets of instructions that apply in the same situation
tell Claude to do different things. Check the proposed skill against:

1. `conventions/global.md`. These conventions win over every plugin skill, so the new skill must follow them, or the change must also update `global.md`, which needs the user's explicit OK.
2. The body of every skill that could run in the same situation, for example any skill involved in writing PRs, commits, tests or reviews.
3. Hooks that would act at the same moment, such as a hook that blocks `git push` while the skill pushes.

For each conflict, quote both sides in one line each.

## 4. Report, then wait

Before writing anything, show the user a short table with each finding, the item
it involves, and your recommendation. If there are any duplicates or conflicts,
wait for their decision. If there's only adjacent overlap, say so in one line
and carry on.

## 5. Write it

- Put it in `plugins/toolkit/skills/<name>/SKILL.md`. If `writing-for-agents` or `skill-creator` is installed, follow its guidance for structure and wording.
- The `description` says what the skill does and when to use it. Include a "Not for …" clause for every trigger overlap you found.
- Reference shared files through `${CLAUDE_PLUGIN_ROOT}`, for example `${CLAUDE_PLUGIN_ROOT}/personas/`.
- **Global conventions:** change `conventions/global.md` only for rules that apply to every project. Keep it short, because it's loaded into every session. Project-specific rules belong in that repo's own `CLAUDE.md`.

## 6. Ship it

1. Run `claude plugin validate .` from the repo root.
2. Run the inventory again and check the new item shows up once.
3. Commit and push to `main`.
4. Remind the user that their machines pick up the change at the next start if auto-update is on, or after running `claude plugin marketplace update tmorren` and restarting.
