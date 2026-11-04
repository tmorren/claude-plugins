---
id: stale-state
name: Stale state or cache
summary: Something is showing or using an old copy of data after the real data changed.
suspect_when: The bug fixes itself on refresh, after a while, or after logging out and in; or two views disagree.
---

## What this lens suspects
Client caches (query caches, stores, memoised selectors), HTTP and CDN caching,
service workers, server-side caches without invalidation, stale closures,
derived state copied instead of computed, and old builds or assets still being
served.

## Where to look
- Where the data is written, and every cache that holds a copy of it: is each one invalidated?
- Cache keys that are missing a parameter (user, locale, filter)
- `useEffect` or callback dependency lists, and closures that captured an old value
- Response `Cache-Control` and `ETag` headers
- Service worker registration and the build hash being served

## Probes
- Disable or bypass the suspected cache. If this is the cause, the bug disappears.
- Log the cache key and value next to the source of truth at the moment of the bug.
- Reproduce in a fresh incognito session. A stale-state bug usually needs a session with history.

## Signs it isn't this
The source of truth itself holds the wrong value.
