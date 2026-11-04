---
id: heavy-account
name: Heavy, long-lived account
summary: Years of use, with thousands of items, long names, old records and many settings changed.
browser: none
needs_data: true
---

## How to get into this state
Use the project's seed command for a large account if it has one (check the
README or CLAUDE.md). Otherwise create volume through the API or a short script
against a local database: at least 1,000 of the main item, some with very
long titles, and some created by an older version of the schema if the bug
might involve old data. Log in as that account.

## What it tends to expose
Slow queries and missing pagination, lists that render everything at once,
layout breaking on long text, limits and quotas, and old records missing
fields that newer code expects.
