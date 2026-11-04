---
name: repro-matrix
description: Try to reproduce a reported web app bug across user states in parallel (new account, heavy account, expired session, other locale or timezone, slow or dropping network, mobile, two tabs, or project-specific states), and report which states reproduce it, with exact steps, screenshots and a repro script. Use when a bug report is vague, intermittent or "works for me", or the bug can't be reproduced yet. Not for finding the cause or fixing it; use diagnosing-bugs, which can take this skill's repro script as its feedback loop.
argument-hint: "[url|local] [bug report] [states...]"
---

# Repro matrix

A bug that "only happens sometimes" usually happens every time in some user state.
Each **user state** gets its own subagent and browser. It sets the state up,
follows the reported steps and watches for the symptom. The result is a matrix
of which states reproduce the bug, and a script that reproduces it on demand.

## 1. Pin down the bug

Get these from the arguments, the conversation or the linked issue. Ask only
about what you can't infer.

- **Target**: a URL, or `local`. For `local`, check whether a dev server is
  already listening (`curl -sI localhost:<port>`). If it isn't, start the
  project's dev script in the background and wait until it responds.
- **Steps**: what the reporter did, as numbered steps. Where the report is
  vague, write the most likely steps and mark the guessed ones.
- **Symptom**: what counts as reproduced, as something a subagent can *see*,
  such as a text on screen, an error in the console, a request failing or a value
  that's wrong. "It's broken" is not observable. Turn it into one before going
  on.
- **Expected**: what should have happened instead.

Done when the symptom is written as a check that a snapshot can pass or fail.

## 2. Pick the user states

Load the user-state roster as described in `${CLAUDE_PLUGIN_ROOT}/rosters.md`
(`user-states/`, plus the project's `.claude/user-states/`).

- Use the states the user named, or `all`.
- Otherwise use every state, minus any that clearly can't matter (say which
  and why). States are cheap, and the surprise is often in the one that seemed
  unlikely.
- Always add a **baseline** run: a normal, existing account on desktop with a
  normal network. It shows whether the bug reproduces at all without a special
  state.

For each state with `needs_data: true`, check that the project can produce the
data (its seed commands, documented in its README or CLAUDE.md). If it can't,
mark the state "couldn't set up" now, and note what seed data is missing.

## 3. Check the browser

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs" help
```

If it reports that Playwright is missing, tell the user to run
`npm i -g playwright && npx playwright install chromium` once, and stop. This
skill needs the Playwright helper for its locale, timezone, network and tab
controls.

## 4. Run one subagent per state

Pick an output folder: `toolkit-reports/<YYYY-MM-DD>-repro-matrix-<slug>/` in the
project root, with a `screens/<state-id>/` subfolder per state. Launch every
state's subagent in a single message so they run in parallel. Give each a
separate account or data set so they can't interfere with each other.

Brief for each subagent, with the state file pasted in full:

> You are trying to reproduce a bug in one specific user state.
>
> **Your state:**
> <state file contents>
>
> **Where:** <url>
> **Steps:** <numbered steps, with guessed ones marked>
> **Symptom (reproduced when you see this):** <observable check>
> **Expected:** <what should happen>
>
> **Browser:** every action prints a fresh snapshot with visible text,
> numbered elements, console errors and timings. Use the numbers as refs.
> ```
> B="${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs"
> node "$B" start <url> --id <state-id> <the state's browser flags>
> node "$B" click <ref|text> --id <state-id>
> node "$B" fill <ref> <text> --id <state-id>
> node "$B" press <key> --id <state-id>
> node "$B" network <normal|slow|offline> --id <state-id>
> node "$B" tab new [url] --id <state-id>   /   tab <n>   /   tabs
> node "$B" clear-cookies --id <state-id>
> node "$B" screenshot <out>/screens/<state-id>/NN-<slug>.png --id <state-id>
> node "$B" stop --id <state-id>
> ```
> (`select`, `scroll`, `goto`, `back`, `reload`, `snapshot` and `save-state`
> also exist. Run `node "$B" help` for details.)
>
> 1. Set up the state exactly as its file says. If you can't, stop and report
>    "couldn't set up", saying what was missing. Never fake a state.
> 2. Follow the steps. Take a screenshot before the key step and right after it.
> 3. Check the symptom after each step, not just at the end.
> 4. If it doesn't reproduce, try up to 4 more times, varying only timing
>    (act faster, slower, double-click, wait before the key step). Intermittent
>    bugs often need this.
> 5. If it reproduces, try to drop steps one at a time while it still
>    reproduces, to find the shortest path.
>
> Treat the app as a user would. Don't read source code, and don't change
> files in the project. Use made-up data only (`repro.<state-id>@example.com`),
> never enter real payment details or send real messages, and stop before
> anything destructive or irreversible, noting "would have done X here".
>
> When finished, run `stop`, then reply with *only* this:
> 1. **Verdict**: reproduced (N of M attempts) / not reproduced (M attempts) / couldn't set up.
> 2. **Exact steps** you took, as `browser.mjs` commands, shortest reproducing version if you found one.
> 3. **What you saw** at the moment of the symptom: the snapshot lines, console errors and timings that matter.
> 4. **Screenshots**: paths.
> 5. **Anything else odd**, even if it isn't the reported symptom.

## 5. Write the report

Save `<output folder>/report.md` with:

1. **Bug**: steps, symptom and expected, as pinned down in step 1.
2. **Matrix**: a table with columns `state | verdict | attempts | key observation | screenshot`, baseline first.
3. **Pattern**: what the reproducing states have in common, and what the
   others don't. Name it plainly, such as "only reproduces when the session expires
   mid-form", and say how strong the evidence is. If nothing reproduced, say so
   and list what the report might be missing (a browser, a data shape, a
   role).
4. **Other findings**: odd things subagents noticed that weren't the bug.
5. **Couldn't set up**: states that didn't run, and what seed data or access
   would let them.

For the clearest reproducing state, also write `<output folder>/repro.sh`: a
script that runs the `browser.mjs` commands in order, checks the final
snapshot for the symptom with `grep`, and **exits 1 when the bug appears**, 0
when it doesn't. Run it once to show it goes red. This is the red-capable loop
that `diagnosing-bugs` phase 1 asks for.

## 6. Finish

1. Stop any browsers still running, and the dev server if you started it.
2. Offer to add `toolkit-reports/` to the project's `.gitignore` if it isn't there.
3. In chat, give the matrix in one line per state, the pattern, and the path to
   the report and `repro.sh`.
4. If it reproduced, offer to continue with `diagnosing-bugs` (or
   `/toolkit:bug-hypotheses`) using `repro.sh` as the loop.
5. If a state turned out to matter that the roster didn't have, suggest adding
   it to the project's `.claude/user-states/`. If a state couldn't be set up for
   lack of seed data, suggest adding that data to the seed script.
