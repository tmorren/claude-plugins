---
name: piecewise
description: Build a request that bundles several changes piecewise - explain the plan back, split it into small jobs (to-tickets format), each with its own check (a test, a screenshot or pose sheet, a playtest), run them one at a time, and stop for the owner's sign-off after any job they need to see or feel. Use when a request holds 3 or more separate changes (a playtest feedback list, "do all of these", a multi-part feature), or the user says "break this up" or "piece by piece". Not for a decision still in fog (use wayfinder) or a single change (use improve-game, or just do it).
---

# Piecewise

One big request, many small **jobs**. Each job is planned, built and **checked**
on its own, so when something is wrong, one job goes back, not the whole pass.
"Done" means the job's check ran and you hold its **evidence**; nothing else
counts.

## 1. Explain it back

Restate the request as a short plan: what changes, what stays, the order, and
anything you'd do differently from how it was asked. Ask the user to confirm.
Done when the user has said go. A plan they already approved in this
conversation counts.

## 2. Split it into jobs

Write each job in the to-tickets format the global conventions use (What to
build / Blocked by / Acceptance criteria), one visible outcome per job, small
enough for one fresh session. Give every job exactly one **check kind**:

| Check | Use for | Evidence |
|---|---|---|
| **proven** | rules, numbers, logic, timing | a test that failed before and passes after |
| **seen** | anything on screen: models, hands, HUD, effects, layout | screenshots or a pose sheet of every **variant** it touches |
| **felt** | feel, difficulty, fun | the owner's playtest, or the `game-craft:playtest` skill's bots plus the owner's notes |

**Variants** are every case the change reaches: each weapon, each input, each
team, each screen size, hip and zoomed, mid-animation. A seen check that shows
one variant of five is one-fifth of a check.

Order the jobs: proven ones first (quick, unblock the rest), then seen, then
felt; blockers before what they block. Save the list to
`.scratch/<request-slug>/jobs.md` (the to-tickets local layout) and show it.
If the user wants the jobs on GitHub, suggest they run `/to-tickets` on it.
Done when every job has a check kind and an acceptance criterion the check
can pass or fail.

## 3. Run one job at a time

For each job, in order:

1. **Build it.** In a PushPlay game repo, follow the `pushplay:improve-game`
   skill's Direct change steps; elsewhere use the `tdd` skill at an agreed seam.
   When the conversation is already long or the job is large, hand it to a
   fresh subagent with a brief: the job's ticket, the files involved, and the
   check it must pass.
2. **Check it.** Run the check and collect the evidence. For a seen job, make
   the screenshots or pose sheet cover every variant, at the states the job
   names (for a reload: start, mid, end).
3. **Gate it.**
   - **proven**: the test passes → mark the job done in `jobs.md` and go on.
   - **seen** or **felt**: show the evidence and stop for the owner's OK. Their
     feedback reopens this job only; fix it and show it again.

Done with a job when its check passed and, for seen and felt jobs, the owner
signed it off. Keep going until every job in `jobs.md` is done or the owner
stops the pass.

## 4. Close the pass

Finish the way the project's rules say (for a PushPlay game, the
`pushplay:improve-game` skill's Record it step: version, DESIGN.md changelog,
commit). Report a table of the jobs with each one's check kind, evidence and
status. List any job whose check couldn't run as **unchecked**, with why and
what the owner should try.
