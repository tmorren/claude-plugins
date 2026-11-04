---
id: data-integrity
name: Data integrity
summary: The feature never saves bad data, loses data or leaves data half-written.
needs: code
---

## Checks
- Is every input validated on the server, not just in the browser, with the same rules on every write path (UI, API, imports, admin tools)?
- Are multi-step writes wrapped in a transaction, or written so a failure partway through leaves things consistent?
- Are retried requests and webhooks idempotent, so they can't create duplicates?
- What happens with two concurrent edits to the same record: does the later one silently overwrite the earlier?
- Are deletes safe (soft delete, confirmation, cascade rules that match intent)?
- Do database constraints (not null, unique, foreign keys) back up the rules the code assumes?

## How to check
Read the feature's write paths, from the request handler to the database, and
the schema or migrations for the tables they touch. Look for each rule in both
the code and the constraints.

## What good looks like
The database refuses anything the code would consider invalid, and no failure
or retry can leave a half-finished or duplicated change.
