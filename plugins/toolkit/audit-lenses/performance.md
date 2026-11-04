---
id: performance
name: Performance
summary: The feature is fast to load and fast to use, including with a lot of data.
needs: both
---

## Checks
- How long does the feature take to become usable on first load and on a repeat visit? (Use the timings the browser helper prints.)
- Are there N+1 queries, queries without an index on the filter column, or unbounded queries without a limit?
- Does any list render every item at once where pagination or virtualisation is needed?
- Are there waterfalls of requests that could run in parallel or be combined?
- What does the feature add to the client bundle, and are big dependencies loaded only where they're used?
- Do interactions cause needless re-renders or recomputation?

## How to check
Read the queries, data loaders and list components. Use the project's query
logging or `EXPLAIN` where available. In the browser, compare first-load and
action timings with normal and slow network, and with a heavy account if the
seed data has one.

## What good looks like
Usable in under about 2 seconds on a normal connection, no query grows with
the number of items shown, and nothing ships to the client that the feature
doesn't use.
