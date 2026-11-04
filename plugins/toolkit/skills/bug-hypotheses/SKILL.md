---
name: bug-hypotheses
description: Run diagnosing-bugs, but test hypotheses in parallel, one subagent per debug lens (race, stale state, data shape, environment, recent change, boundary, dependency, auth, or project-specific lenses).
disable-model-invocation: true
argument-hint: "[bug description] [lenses...]"
---

# Bug hypotheses

This extends `mattpocock-skills:diagnosing-bugs`. Everything there still
applies, including its gate: **no hypotheses until there is a red loop**. The
only change is phase 3: instead of one agent ranking 3–5 hypotheses, each
**lens** gets its own subagent, which forms the best hypothesis from its point
of view and tests it against the loop.

## 1. Run diagnosing-bugs phases 1 and 2

Invoke the `mattpocock-skills:diagnosing-bugs` skill and follow phases 1
(feedback loop) and 2 (reproduce and minimise) exactly as written.

Done when you have both:
- **The loop command**: one command, already run, that goes red on this bug.
- **The minimised repro**: the smallest scenario that still goes red.

If phase 1 can't produce a loop, stop as that skill says. For a web app bug
that won't reproduce, suggest `toolkit:repro-matrix` to find a user state that
does reproduce it.

## 2. Pick the lenses

Load the debug-lens roster as described in `${CLAUDE_PLUGIN_ROOT}/rosters.md`
(`debug-lenses/`, plus the project's `.claude/debug-lenses/`).

- Use the lenses the user named, or `all`.
- Otherwise pick the 4–6 whose `suspect_when` best matches the symptom and
  what phases 1–2 revealed. Include `recent-change` whenever the bug is a
  regression. Include every project lens whose `suspect_when` matches, because
  those capture this project's known weak spots.

List the chosen lenses as `name (id)` with a few words on why each was picked.

## 3. Run one subagent per lens

Launch all lens subagents in a single message so they run in parallel.

- **Isolation.** Give each one `isolation: "worktree"` so their temporary
  probes and debug logs can't collide.
- **Uncommitted files.** A worktree starts from the last commit, so it won't
  contain a loop script, fixture or test written during phases 1–2 that isn't
  committed. List those files by absolute path in the brief, so each subagent
  copies them into its worktree first.
- **Shared resources.** If the loop depends on something shared, such as one
  dev server port, one database or one browser profile, either give each worktree its
  own (a different port, a scratch database) or run the probes one subagent
  at a time. Say which you chose.

Brief for each subagent, with the placeholders filled and the lens file pasted
in full:

> You are investigating one bug through one lens.
>
> **Bug:** <the user's symptom, in their words>
> **Loop command:** `<command>` (it goes red on this bug; you've been given a worktree to run it in)
> **Copy into your worktree first:** <absolute paths of uncommitted loop files, or "nothing">
> **Minimised repro:** <the scenario>
> **What's already known:** <findings from phases 1–2>
>
> **Your lens:**
> <lens file contents>
>
> 1. Read the code along the failing path through this lens. Read
>    `GLOSSARY.md` and ADRs in the area if they exist.
> 2. Form the **single most likely hypothesis** in this lens's family. Write
>    it as: "If <X> is the cause, then <changing Y> makes the bug disappear,
>    and <changing Z> makes it worse."
> 3. Test that prediction with the lens's probes, against the loop command.
>    Change one variable at a time. Tag every debug log `[DEBUG-<lens-id>]`.
> 4. Leave the worktree's committed code alone. Probes are temporary.
>
> Redact secrets in everything you report. Write `<REDACTED>` in their place.
>
> Reply with *only* this:
> 1. **Hypothesis**, in the "If… then…" form.
> 2. **Verdict**: supported / ruled out / inconclusive.
> 3. **Evidence**: each probe you ran, the command, and what the loop did (red/green), with short redacted output.
> 4. **Where**: `file:line` of the suspected cause, if supported.
> 5. **Confidence**: high / medium / low, with one line why.
> 6. **Next probe**: the one experiment that would settle it, if inconclusive.

Done when every lens has returned a verdict. A lens that couldn't run its
probes reports "inconclusive" and says why. It doesn't guess.

## 4. Rank and continue

Rank the hypotheses:
1. **Supported**, highest confidence first. If two lenses support compatible
   hypotheses (a race *and* a stale cache), consider whether they're the same
   cause seen twice, and say so.
2. **Inconclusive**, ordered by how cheap their next probe is.
3. **Ruled out**, listed so nobody re-checks them.

Show the ranked list to the user, as `diagnosing-bugs` phase 3 asks. Then carry
on with phases 4–6 of that skill on the top hypothesis, in the main working
tree.

Save the ranking with each lens's evidence to
`toolkit-reports/<YYYY-MM-DD>-bug-hypotheses-<slug>/report.md` in the project
root. Offer to add `toolkit-reports/` to `.gitignore` if it isn't there.

## 5. Clean up

- Remove the lens worktrees, unless one holds a probe the user wants to keep.
- Grep the main tree for `[DEBUG-` before declaring done, as phase 6 requires.
- If a project lens would have caught this sooner, or a lens is missing for
  this kind of bug, suggest adding it to `.claude/debug-lenses/`.
