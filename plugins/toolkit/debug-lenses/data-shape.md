---
id: data-shape
name: Unexpected data shape
summary: The code meets input it didn't plan for, such as null, empty, very large, malformed or unusual text.
suspect_when: The bug affects some users, records or inputs but not others.
---

## What this lens suspects
Nulls and missing optional fields, empty lists, zero and negative numbers,
huge values, strings with unicode, emoji, right-to-left text or leading spaces,
old records created before a schema change, and API responses whose shape
differs from the types.

## Where to look
- The specific record or input from the bug report, compared field by field with one that works
- Type assertions (`as`, `!`) and unchecked JSON parsing at the boundaries
- Migrations that added a column without backfilling old rows
- Validation that exists on one write path but not another (an import, an admin tool, the API)

## Probes
- Run the loop with the failing record, then a copy where one field at a time is set to a "normal" value. The field that flips it is the cause.
- Add schema validation at the boundary and log what fails.
- Query for how many records share the odd shape. This also sizes the blast radius.

## Signs it isn't this
It fails the same way with a clean, freshly created, typical record.
