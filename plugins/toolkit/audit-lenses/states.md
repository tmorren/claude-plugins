---
id: states
name: Empty, loading and error states
summary: The feature handles having no data, waiting for data and failing to get data.
needs: both
---

## Checks
- Does every list, table, chart and count have an empty state that explains what goes there and how to add the first one?
- Is there a loading state for every request that can take more than about 300 ms, and does it keep the layout stable?
- Does every request that can fail show an error the user can act on (retry, fix input, contact support), instead of a blank screen, a spinner forever or a raw message?
- Are partial failures handled (one widget fails, the rest still work)?
- Does a failed save keep what the user typed?
- Does the project's demo or seed data show each of these states, as the global conventions require?

## How to check
Read the components and data hooks for each request's loading and error
branches. In the browser, use a brand-new account for the empty state,
`network slow` for loading, and `network offline` before an action for errors.

## What good looks like
No screen is ever blank or stuck. Each state tells the user what is happening
and what to do next.
