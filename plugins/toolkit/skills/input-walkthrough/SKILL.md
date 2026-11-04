---
name: input-walkthrough
description: Check that a web game or website works on every device and input on its own (Steam Deck and other handhelds, controller on a TV or PC, keyboard only, mouse only, touch, switching devices, optionally phone touch, or project-specific setups), covering every menu and screen as well as the gameplay, or one section you name. Plays it headlessly with a virtual gamepad, one subagent per setup, and reports a screen-by-setup matrix with screenshots and ranked fixes. Use for "does it work on Steam Deck / with a controller", "test every input", "check keyboard-only / touch", or before shipping. Not for fixing what it finds; use the project's debug or UI skills, or diagnosing-bugs. Not for how it feels to different kinds of people; use persona-walkthrough.
argument-hint: "[url|local] [section to check] [setups...]"
---

# Input walkthrough

Many players have only one input: a controller on a handheld, a keyboard, a
mouse or a touchscreen. Each **input setup** gets its own subagent, which goes
through every screen in scope and the game itself using that setup alone. You
get a matrix of what works where, and the fixes that matter most.

## 1. Work out the scope

Get these from the arguments or the conversation. Ask only about what you
can't infer.

- **Target**: a URL, or `local`. For `local`, use the project's documented dev
  command (README, CLAUDE.md or AGENTS.md). If no server is listening, start it
  in the background and wait until it responds.
- **Section** (optional): one part to check, such as "the settings menu", "the
  pause menu", "level select", "the first boss" or "checkout". Without one,
  the scope is the whole app or game.
- **Screen list**: every screen and menu in scope, which becomes the rows of
  the matrix. For a game: title, every menu and submenu, settings, pause, game
  over or results, level select, shops, dialogs, and **gameplay** as its own row,
  split by mode when modes play differently. For a website: navigation, each
  page type, forms, dialogs and menus. Find them in the code (menu
  definitions, screen or state names, routes) as well as by looking, so
  screens that are hard to reach still get listed.
- **Shortcuts**: debug hooks the project documents for reaching a state
  quickly or reading it, such as `?debug`, `?seed=`, a time scale, or
  `window.__game.state`. Subagents use them to check state and save time, but
  they still reach every screen with the setup's own inputs at least once.

Done when you have the screen list and can say how each screen is reached.

## 2. Pin down the controls contract

Read the project's own rules for controls: `AGENTS.md`, `CLAUDE.md`,
`DESIGN.md`, a controls table, or a manifest listing supported inputs.
Write a short contract covering confirm, back, pause, navigation, which
inputs gameplay supports, and any keys or buttons that must never be used.

**The project's contract wins.** For example, it may say Esc pauses and never
goes back. Where it says nothing, use these defaults: A, Enter or Space to
confirm; B or Escape to go back; Start or Escape to pause; arrows, WASD, the
d-pad or the left stick to move; every menu usable with every input; gameplay
playable with a controller and a keyboard at least.

If the project has its own automated input check (for example `npm run check`),
run it first and record the result. The walkthrough doesn't repeat what that
check covers. It goes further: every screen, every setup, judged from
screenshots.

## 3. Pick the setups

Load the input-setup roster as described in `${CLAUDE_PLUGIN_ROOT}/rosters.md`
(`input-setups/`, plus the project's `.claude/input-setups/`, plus any extra
folder a project skill names).

- Use the setups the user named, or `all`.
- Otherwise run every setup without `optional: true`. Add optional ones
  (such as `phone-touch`) when the user asks for them, for websites, or when
  the project says it runs on phones.
- Skip a setup only when the contract rules it out (a mouse-only gameplay pass
  for a game that says it doesn't support mouse play still checks the menus),
  and say why.

## 4. Check the browser

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs" help
```

If it reports that Playwright is missing, look for a copy inside the project
first (any `node_modules/playwright` folder, such as one belonging to the
project's build kit), and set `PW_MODULE=<that folder>` for every command.
Otherwise tell the user to run
`npm i -g playwright && npx playwright install chromium` once, and stop.

Add `--webgl` to the setups' browser flags only for WebGL or 3D games. It
slows 2D canvas games down badly.

## 5. Run one subagent per setup

Pick an output folder: `toolkit-reports/<YYYY-MM-DD>-input-walkthrough-<slug>/`
in the project root, with `screens/<setup-id>/` per setup. Launch every
setup's subagent in a single message so they run in parallel.

Brief for each subagent, with the setup file pasted in full:

> You are checking a game or website with one input setup, and nothing else.
>
> **Your setup:**
> <setup file contents>
>
> **Where:** <url>
> **Scope:** <the section, or "everything">
> **Screens to cover:** <screen list, with how each is reached>
> **Controls contract:** <the contract from step 2>
> **Shortcuts for checking state:** <debug hooks, or "none">
>
> **Browser:**
> ```
> B="${CLAUDE_PLUGIN_ROOT}/scripts/browser.mjs"
> node "$B" start <url> --id <setup-id> <the setup's browser flags>
> node "$B" pad press|hold <button> [ms] / pad stick left|right <x> <y> <ms> / pad connect|disconnect
> node "$B" press <key> / key down|up <key> / key hold <key> <ms>
> node "$B" click <ref|text> / mouse <x> <y> [move|click|right] / tap <x> <y> / scroll [down|up]
> node "$B" wait <ms>
> node "$B" eval <expression>
> node "$B" screenshot <out>/screens/<setup-id>/NN-<screen>.png --id <setup-id>
> node "$B" stop --id <setup-id>
> ```
> Add `--id <setup-id>` to every command, and run `node "$B" help` for details.
>
> **Rules:**
> - Use only the inputs your setup allows. `eval`, `wait` and `screenshot`
>   are observation and always allowed. Never use `eval` to press buttons or
>   change screens for the player.
> - **Look at your screenshots.** On canvas games the snapshot text is almost
>   empty, so the screenshot is the only way to see the screen. Take one on
>   every screen you reach, and whenever something goes wrong.
> - **The page keeps running between commands.** A game carries on in real
>   time while you think, so pause it (with your setup's pause input) before
>   long reasoning during gameplay, and expect a few hundred milliseconds to
>   pass per command.
> - Mouse and tap positions are CSS pixels. If the screenshot says the image
>   is larger than the viewport, divide by that factor.
>
> **For every screen in scope:**
> 1. Reach it with your setup's inputs. If you can't, that's a finding: record
>    where you got stuck.
> 2. Move through every item, change one value (a slider or toggle) and put it
>    back, then leave with the contract's back input.
> 3. Check the setup's "What must be true" list, and that the prompts on
>    screen name your input.
>
> **For gameplay:** play for about 60 seconds (or through the named section),
> using every action in the controls contract at least once. Pause and
> resume. While paused, take two screenshots about 2 seconds apart: they
> should match, because nothing should move. If the project exposes state,
> confirm it says paused.
>
> **Safety:** use made-up data only, never enter real payment details or
> send real messages, and stop before anything destructive or irreversible,
> noting "would have done X here". Leave the project's files unchanged.
>
> When finished, run `stop`, then reply with *only* this:
> 1. **Matrix rows**: a table `screen | result (✅ works / ⚠️ works with problems / ❌ broken or unreachable / n/a) | what you did | screenshot`.
> 2. **Findings**: for each problem, the screen, what you pressed, what happened, what should happen (citing the contract or the setup's rule), severity (blocker / major / minor / polish), and a screenshot.
> 3. **Gameplay**: which actions worked, the pause check result, and anything that only went wrong with this input.
> 4. **Not reached**: screens you couldn't get to, and why.

Done when every setup has returned its rows for every screen in scope.

## 6. Write the report

Save `<output folder>/report.md` with:

1. **Summary**: scope, setups, the project check's result, and the verdict in 2–3 sentences.
2. **Matrix**: rows are screens, columns are setups, and each cell is ✅, ⚠️, ❌ or n/a, linked to the screenshot.
3. **Top fixes**, ranked by severity, then by how many setups hit the issue,
   then by how cheap the fix looks. Name the screen, the input and the change
   to make. A problem that shows up in several setups is often one cause, such
   as a custom menu that ignores touch. Merge those into one fix.
4. **Per-setup notes**: each subagent's findings and gameplay results.
5. **Not covered**: screens no setup reached, and setups that were skipped.

Don't invent results. A cell that wasn't checked is "not reached", not ✅.

## 7. Finish

1. Stop any browsers still running, and the dev server if you started it.
2. Offer to add `toolkit-reports/` to the project's `.gitignore` if it isn't there.
3. In chat, give a short summary: the matrix in compact form, the top 3
   fixes and the report path.
4. Offer to fix the findings with the project's own skills (for example its
   debug-game or game-ui skills) or `diagnosing-bugs`, or to write them up as
   tickets in the `to-tickets` format. Ask before creating any issues.
5. Remind the user that headless checks can't feel the real device. Suggest
   the 2–3 things most worth trying by hand on the actual handheld.
6. If a recurring problem points to a missing setup, such as two controllers or
   a specific handheld, suggest adding it to the project's `.claude/input-setups/`.
