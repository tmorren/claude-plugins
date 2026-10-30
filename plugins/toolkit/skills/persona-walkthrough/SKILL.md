---
name: persona-walkthrough
description: Send simulated user personas (non-technical, goal-seeker, accidental visitor, power user, mobile, accessibility, or project-specific ones) through a web app, either the whole app or one specific flow, and report how it felt to each of them, with friction points, quotes, scores and prioritised fixes. Use when the user asks for a UX walkthrough, persona testing, usability review, "how would a new user experience this", or wants a flow tested from different users' perspectives.
argument-hint: "[url|local] [flow to test] [personas...]"
---

# Persona walkthrough

Simulate real people using an app and report honestly how it felt. The value is
in staying in character: a persona only knows what's on the screen, gets
confused where a real person would, and gives up where a real person would.

## 1. Work out what to test

Get these from the arguments or the conversation. Ask only about what you
can't sensibly infer.

- **Target**: a URL, or `local`. For `local`, check whether a dev server is
  already listening (`curl -sI localhost:<port>`). If it isn't, find the dev
  script in `package.json` (or the framework's equivalent), start it in the
  background, and wait until it responds.
- **Scope**: the whole app (first visit through to the core value) or a named
  flow, such as "sign up and create a recipe". Write the scope as one sentence
  that becomes `{{scope}}`.
- **Product purpose**: one plain sentence describing what the product does, for
  `{{product_purpose}}`. Take it from the user, the project's README or
  CLAUDE.md, or the landing page. Never from the persona's point of view.
- **Personas**: the ones the user names, `all`, or, by default, the 3–4 most
  relevant to the scope. Always include at least one low-tech-comfort persona
  and at least one with `device: mobile`.
- **Browser**: `playwright` (default, headless, works locally and in the cloud)
  or `chrome`. Use `chrome` when the user asks, or when the flow needs their
  real logged-in session.

## 2. Load the personas

1. Read every `*.md` in `${CLAUDE_PLUGIN_ROOT}/personas/` except `README.md`.
2. Read every `*.md` in the project's `.claude/personas/`, if it exists. A
   project persona with the same `id` replaces the shared one.
3. Replace `{{product_purpose}}` and `{{scope}}` in each chosen persona.

## 3. Check the browser is available

For `playwright` mode, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/persona-walkthrough/scripts/browser.mjs" help
```

If it reports that Playwright is missing, tell the user to run
`npm i -g playwright && npx playwright install chromium` once, and stop.

## 4. Run one subagent per persona

Pick an output folder: `persona-reports/<YYYY-MM-DD>-<scope-slug>/` in the
project root. Each persona gets a `screens/<persona-id>/` subfolder.

**Playwright mode:** launch every persona's subagent in a single message so
they run in parallel. **Chrome mode:** run them one after another, because they
share one browser. Give each subagent the brief below, with the persona file
pasted in full and the placeholders filled.

> You are role-playing **<name>** testing a web app. Here is your persona:
>
> <persona file contents>
>
> **What you're doing:** <scope>
> **Where:** <url>
>
> **Browser:** use this helper. Every action prints a fresh snapshot with the
> visible text and numbered interactive elements. Use the numbers as refs.
> ```
> B="${CLAUDE_PLUGIN_ROOT}/skills/persona-walkthrough/scripts/browser.mjs"
> node "$B" start <url> --id <persona-id> --device <desktop|mobile> [--zoom 2]
> node "$B" click <ref|visible text> --id <persona-id>
> node "$B" fill <ref> <text> --id <persona-id>
> node "$B" select <ref> <option> --id <persona-id>
> node "$B" press <Tab|Enter|Escape|Shift+Tab|...> --id <persona-id>
> node "$B" scroll [down|up] --id <persona-id>
> node "$B" back | reload --id <persona-id>
> node "$B" screenshot <out>/screens/<persona-id>/NN-<slug>.png --id <persona-id>
> node "$B" stop --id <persona-id>
> ```
> Use `--zoom 2` only for personas that zoom (for example `accessibility`).
> Use `--device mobile` when the persona's device is mobile.
> *(In Chrome mode, replace this block with: use the Claude in Chrome or
> built-in browser tools; load the matching skill first; open a new tab.)*
>
> **Stay in character:**
> - Know only what's on the screen. Don't read source code, don't use
>   devtools, and don't type URLs unless this persona plausibly would.
> - Follow your behaviour rules strictly. They decide what you notice,
>   what you skip, and when you give up. Reading every element in the snapshot
>   isn't in character if your persona skims, so act on what this person would
>   actually notice.
> - Before each action, note what you expect to happen. After it, note what
>   actually happened and your mood (1 = frustrated, 5 = delighted).
> - Take a screenshot on arrival, at every step that matters, and at every
>   point of friction.
> - If your patience runs out, stop, and record exactly where and why. Giving
>   up is a valid result: don't carry on out of character to finish the scope.
>   The report will note which parts were never reached.
>
> **Safety:** use made-up test data only (for example `persona.<id>@example.com`).
> Never enter real payment details, never send real messages or invites, and
> stop before anything destructive or irreversible (deleting, purchasing,
> publishing). Record "would have done X here" instead.
>
> **When finished,** run `stop`, then reply with *only* this, filled in:
> 1. **First impression**: what you thought in the first 5 seconds, in your voice.
> 2. **Journey**: a table with columns `# | action | expected | what happened | mood 1-5 | screenshot`.
> 3. **Friction points**: each with severity (blocker / major / minor / polish), where it happened, what went wrong, and why it bothered *this* persona.
> 4. **Delights**: anything that felt good.
> 5. **Outcome**: completed / completed with difficulty / gave up at step N, with the reason.
> 6. **Quotes**: 3–5 lines in your voice.
> 7. **Scores 1–5**: clarity, ease, trust, would-come-back, each with a one-line reason.
> 8. **Objective notes**: things that are true regardless of persona, such as console errors (every helper output ends with a console line), broken links, slow loads (> 2s), small tap targets, or missing accessible names.

## 5. Write the report

Fill in [report-template.md](report-template.md) with the subagents' results
and save it as `<output folder>/report.md`. When synthesising across personas:

- **Cross-persona issues** are where the most value is. An issue hit by 2+
  personas ranks above an issue hit by one, unless that one is a blocker.
- **Rank fixes** by severity, then by how many personas they affected, then by
  how cheap they look to fix.
- Keep each persona's voice in their own section. Keep your own analysis
  neutral and specific: name the screen, the element and the change to make.
- Don't invent findings. If a persona didn't reach part of the app, say so
  rather than guessing what they'd have thought.

## 6. Finish

1. Stop any browsers that are still running, and the dev server if you started it.
2. If `persona-reports/` isn't in the project's `.gitignore`, offer to add it.
3. In chat, give a short summary: each persona's outcome in one line, the top 3
   fixes, and the path to the report.
