---
id: auth-permissions
name: Auth or permissions
summary: The user, session or role is not what the code assumes at that moment.
suspect_when: It affects some roles or accounts, appears after being idle, shows as 401/403/404, or data from the wrong account appears.
---

## What this lens suspects
Expired or refreshed tokens, sessions that differ between tabs or devices,
role checks in one layer but not another, row-level security policies, cookie
scope (domain, `SameSite`, `Secure`), middleware ordering, and requests made
before auth has loaded.

## Where to look
- Which identity the failing request carries, compared with the one that works
- Every permission check on the path (UI, API, database policy), and whether they agree
- Token refresh and session expiry handling
- Code that runs before the session has loaded (initial render, SSR)

## Probes
- Repeat the failing step as an admin or owner. If this is the cause, it works.
- Clear cookies, or let the token expire, just before the step.
- Log the resolved user and role at each layer for the failing request (redact tokens).

## Signs it isn't this
It fails the same way for every role, including the most privileged.

**Security note:** if this lens finds that a user can see or change data they
shouldn't, treat it as a security issue. Flag it to the user straight away, not
just in the ranking.
