---
name: design-options
description: Compare genuinely different ways to build a new feature or substantial change before writing code, one subagent per design stance (simplest thing, reuse what exists, built to scale, buy or use a library, don't build it, or project-specific stances), each grounded in the real codebase, and recommend one with its trade-offs. Use when the user is deciding how to build something, asks for options, alternatives or approaches, or wants a second opinion on a plan. Not for designing one module's interface; use codebase-design's design-it-twice.
argument-hint: "[feature or change] [stances...]"
---

# Design options

Your first idea for building something is rarely the best one. Each **design
stance** gets its own subagent, which proposes the best approach from that
philosophy, using the actual codebase. You then compare them side by side and
recommend one. The method follows `codebase-design`'s design-it-twice, applied
to a whole feature instead of one module's interface.

## 1. Frame the problem

From the conversation, the issue or a spec, write a short framing:

- **Goal**: the user need, in one or two sentences.
- **Success criteria**: how you'd know it worked, ideally observable.
- **Constraints**: deadlines, budget, platforms, compatibility, compliance,
  and anything the user has ruled in or out.
- **Touchpoints**: the existing modules, tables, routes and services this
  would touch, with paths. Find them by searching the codebase.
- **Decided already**: relevant ADRs and `GLOSSARY.md` terms, so options use
  the project's names and don't re-open settled decisions without saying so.

Show the framing to the user, then go straight on to step 2. They read while
the subagents work. If the goal itself is unclear, ask before going on: every
option depends on it.

## 2. Pick the stances

Load the design-stance roster as described in `${CLAUDE_PLUGIN_ROOT}/rosters.md`
(`design-stances/`, plus the project's `.claude/design-stances/`).

Use the stances the user named, or all of them by default. Project stances
usually encode real constraints (old clients, a single database, a team of
one), so always include them.

## 3. Run one subagent per stance

Invoke the `mattpocock-skills:codebase-design` skill and paste its vocabulary
(module, interface, depth, seam, adapter, leverage, locality) into each brief,
so the proposals are described in comparable terms. Launch every stance's
subagent in a single message so they run in parallel.

> You are proposing one way to build a feature, from one design stance.
>
> **Framing:**
> <goal, success criteria, constraints, touchpoints, decided already>
>
> **Your stance:**
> <stance file contents>
>
> **Vocabulary:** <codebase-design vocabulary>
>
> Read the touchpoints and whatever else you need in the codebase. This is
> read-only: propose, don't edit. Where your stance needs facts from outside
> the codebase (library versions, pricing), check primary sources and say what
> you couldn't verify.
>
> Reply with *only* this:
> 1. **Approach**: 3–5 sentences.
> 2. **Shape**: the files and modules added or changed (with paths), any data model or API changes, and a Mermaid diagram if the flow is hard to follow in prose.
> 3. **Meets the goal?** Check against each success criterion and constraint. Mark any it doesn't meet.
> 4. **Effort**: S / M / L, with what drives it.
> 5. **Risks**: what's most likely to go wrong.
> 6. **Reversibility**: a one-way or two-way door, and what undoing it would take.
> 7. **Testing**: the seam where its behaviour would be tested.
> 8. **Ongoing cost**: maintenance, fees, operations, on-call.
> 9. **What it gives up** compared with the other obvious approaches.

Done when every stance has replied, or has said plainly that it couldn't
produce a viable option and why. That's a valid result, especially for
`dont-build`.

## 4. Compare and recommend

1. Check each proposal against its stance's **blind spots** from the roster
   file, and note where they bite.
2. Present a comparison table with columns
   `option | meets goal | effort | risk | reversibility | ongoing cost | gives up`.
3. Compare in prose by **depth**, **locality** and **seam placement**, and by
   how well each fits the existing code.
4. **Recommend one.** Be opinionated: the user wants a strong read, not a
   menu. Where parts of different options combine well, propose the hybrid
   and say which parts come from where. If `dont-build` made a convincing
   case, say so plainly.
5. Name the **one question** that would most change the recommendation, if
   there is one, such as an expected scale or a budget.

Save the framing, every proposal, the comparison and the recommendation to
`toolkit-reports/<YYYY-MM-DD>-design-options-<slug>/report.md` in the project
root. Offer to add `toolkit-reports/` to `.gitignore` if it isn't there.

## 5. Next steps

In chat, give the recommendation in a few lines, the comparison table and the
report path. Then offer what fits:

- `mattpocock-skills:prototype` if the recommendation depends on something
  only a quick prototype can show, such as a state model or a UI.
- `mattpocock-skills:grilling` to stress-test the chosen option.
- An ADR via `mattpocock-skills:domain-modeling` if the choice is one-way or
  likely to be re-asked.
- `/mattpocock-skills:to-spec` and `/mattpocock-skills:to-tickets` to turn
  the choice into work. Those run only when the user types them.

If the comparison kept bumping into a constraint no stance represented,
suggest adding it as a stance in the project's `.claude/design-stances/`.
