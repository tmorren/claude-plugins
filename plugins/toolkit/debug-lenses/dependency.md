---
id: dependency
name: External dependency
summary: A third-party API, service, library or browser behaves differently than the code assumes.
suspect_when: The failing path calls out to another service or library, errors mention a vendor, or it fails only in one browser.
---

## What this lens suspects
API changes or outages, rate limiting, timeouts, retries without idempotency,
webhook ordering and duplicates, library bugs or breaking changes, browser
differences, and unhandled error responses from the dependency.

## Where to look
- The exact request and response at the boundary (status, body, headers, timing)
- How errors and timeouts from the dependency are handled, and whether they're swallowed
- The library's changelog and issue tracker for the installed version
- Webhook handlers: are they idempotent, and do they tolerate events out of order?

## Probes
- Replace the dependency with a recorded good response. If this is the cause, the bug disappears.
- Replay the failing response (or a timeout, or a 429) through a fake. If this is the cause, the bug appears.
- Pin the library to the previous version and run the loop.

## Signs it isn't this
It still fails with the dependency faked out.
