---
name: feature-audit
description: Audit one existing feature through a set of lenses in parallel (empty/loading/error states, performance, discoverability, mobile, accessibility, observability, data integrity, copy, or project-specific lenses), reading its code and using it in the running app, and turn the findings into ranked improvement tickets. Use when the user wants to improve, harden or polish a feature, or asks what's weak or missing in it. Not for reviewing a diff or PR; use code-review. Not for how the feature feels to different kinds of user; use persona-walkthrough.
argument-hint: "[feature] [url|local] [lenses...]"
---

# Feature audit

Look at one feature that already exists and find what would make it better.
Each **audit lens** gets its own subagent, which works through that lens's checks
against the feature's code and, where needed, the running app. The output is
a ranked list of improvement tickets, ready for the tracker.

## 1. Scope the feature

Get these from the arguments or the conversation. Ask only about what you
can't infer.

- **Feature**: one plain sentence, such as "creating and editing a recipe".
- **Entry points**: the routes or screens where a user meets it, and the main
  files behind it (components, handlers, jobs, tables). Find them by searching
  the codebase, and list them with paths. These become the subagents' map.
- **Target**: a URL, or `local`, for lenses that need the browser. For
  `local`, check whether a dev server is already listening, and start the
  project's dev script in the background if not.
- **Context**: read `GLOSSARY.md`, relevant ADRs and the project's CLAUDE.md, so
  findings use the project's own names and don't re-suggest decided things.

Done when you can name every file and route that belongs to the feature, or
say which ones you couldn't find.

## 2. Pick the lenses

Load the audit-lens roster as described in `${CLAUDE_PLUGIN_ROOT}/rosters.md`
(`audit-lenses/`, plus the project's `.claude/audit-lenses/`).

Use the lenses the user named, or all of them by default. Skip a lens only
when it clearly can't apply (`mobile` for an internal CLI, say), and say so.

If any chosen lens has `needs: browser` or `both`, check the helper:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs" help
```

If Playwright is missing, tell the user to run
`npm i -g playwright && npx playwright install chromium`. Then either stop or
run only the `needs: code` lenses, as the user prefers.

## 3. Run one subagent per lens

Pick an output folder: `toolkit-reports/<YYYY-MM-DD>-feature-audit-<slug>/` in
the project root, with a `screens/<lens-id>/` subfolder per lens. Launch every
lens's subagent in a single message so they run in parallel.

Brief for each subagent, with the lens file pasted in full:

> You are auditing one feature through one lens.
>
> **Feature:** <one sentence>
> **Entry points:** <routes and files, with paths>
> **App:** <url, or "code only">
> **Project context:** <glossary terms and ADRs that matter>
>
> **Your lens:**
> <lens file contents>
>
> **Browser** (if your lens needs it):
> ```
> B="${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs"
> node "$B" start <url> --id <lens-id> [--device mobile] [--zoom 2] [--network slow]
> node "$B" click|fill|press|scroll|goto|back|reload|network|tab|clear-cookies ... --id <lens-id>
> node "$B" screenshot <out>/screens/<lens-id>/NN-<slug>.png --id <lens-id>
> node "$B" stop --id <lens-id>
> ```
> Run `node "$B" help` for every command.
>
> Work through **every check** in your lens. This is a read-only audit: leave
> the project's files unchanged. Use made-up test data only, and stop before
> anything destructive or irreversible, noting "would have done X here".
>
> Reply with *only* this:
> 1. **Checks**: a table `check | result (good / issue / not applicable / couldn't check) | evidence`. The evidence is a `file:line`, a screenshot path or a measurement.
> 2. **Findings**: for each issue, a title, where it is, what's wrong, the impact on users or the team, the change you'd make, severity (blocker / major / minor / polish) and effort (S / M / L).
> 3. **Strengths**: what this feature already does well through your lens, in one or two lines.

Done when every lens has returned its checks table, with every check
accounted for.

## 4. Combine the findings

- **Merge duplicates.** Several lenses often find the same issue (a missing
  error state is a `states`, `copy` and `accessibility` issue at once). Merge
  them into one finding and list every lens that hit it.
- **Rank** by severity, then by how many lenses hit it, then by lowest effort.
- **Quick wins**: pull out findings that are minor or better and S effort.
- **Security**: if any finding exposes data or lets a user do something they
  shouldn't, flag it to the user straight away, not just in the ranking.

## 5. Write tickets

Write a ticket for each finding worth doing, ranked, in the `to-tickets`
format the global conventions require:

```markdown
### <plain-language title>

**What to build**
<the change, where it goes, and why it matters to users>

**Blocked by**
<other tickets in this list, or "None">

**Acceptance criteria**
- [ ] <observable behaviour once it's done>
- [ ] Covered by a deterministic test at <seam>
- [ ] Demo/seed data shows <the new state>   (when the change is visible)
```

Save everything to `<output folder>/report.md`:
1. **Summary**: the feature, lenses run, and the overall verdict in 2–3 sentences.
2. **Top findings**: a table `# | finding | where | severity | lenses | effort`.
3. **Quick wins.**
4. **Tickets**, in rank order.
5. **Per-lens results**: each lens's checks table and strengths.

## 6. Finish

1. Stop any browsers still running, and the dev server if you started it.
2. Offer to add `toolkit-reports/` to the project's `.gitignore` if it isn't there.
3. In chat, give the verdict, the top 3 findings and the path to the report.
4. Ask before creating any issues in the tracker. If the user agrees, create
   them with GitHub's native blocking and sub-issue links, or point them to
   `/mattpocock-skills:to-tickets`, which publishes to the configured tracker.
5. If the audit kept running into something no lens covers, suggest adding a
   lens for it to the project's `.claude/audit-lenses/`.
