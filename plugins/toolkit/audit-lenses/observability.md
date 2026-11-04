---
id: observability
name: Observability
summary: When the feature breaks in production, someone finds out quickly and can tell why.
needs: code
---

## Checks
- Are errors on the feature's server paths logged with enough context (which user or record, which step), with secrets and personal data left out?
- Are client-side errors captured by the project's error tracker, if it has one?
- Is there a way to tell the feature is broken without a user reporting it (a metric, an alert, a health check, a failed-job count)?
- Do background jobs and webhooks record failures and retries somewhere visible?
- Could someone on call find the relevant logs for one user's failed attempt?

## How to check
Read the server handlers, jobs and error boundaries along the feature's paths.
Check the project's logging and monitoring setup (look in the README, CLAUDE.md
and config). Trigger an error locally and see where it's recorded.

## What good looks like
A failure produces one clear log line or event, tied to the user and record,
and anything that fails repeatedly raises an alert.
