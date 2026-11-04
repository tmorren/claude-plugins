---
id: recent-change
name: Recent change
summary: It used to work, and a specific change broke it.
suspect_when: The bug is a regression, or appeared after a deploy, a dependency update or a merge.
---

## What this lens suspects
A commit, dependency bump, config change or data migration since the last
known-good state.

## Where to look
- `git log` for the affected files and their imports since the last known-good point
- Lockfile changes in that range
- Merged PRs and deploy history for the same window
- Changes to shared code (utilities, base components, middleware) that the failing path calls

## Probes
- Check out the last known-good commit and run the loop. It should go green there.
- Automate `git bisect run <loop command>` across the range. This finds the commit without reading code.
- Revert the suspected commit on a scratch branch and run the loop.

## Signs it isn't this
The loop also goes red at the "known-good" commit, so the bug is older than
anyone thought (look at data or environment instead).
