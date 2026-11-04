---
id: race-timing
name: Race or timing
summary: Two things happen in an order the code doesn't expect, or one finishes later than assumed.
suspect_when: The bug is intermittent, depends on speed (slow network, fast clicks, a busy CPU), or only shows in production or CI.
---

## What this lens suspects
Unawaited promises, responses arriving out of order, double submits, state set
after a component unmounts, timers and debounces, retries that overlap, and
concurrent writes to the same record or file.

## Where to look
- `async` functions whose result isn't awaited, and `.then` chains without a `return`
- Effects or listeners that fetch without cancelling the previous request
- Handlers with no in-flight guard (a button that can submit twice)
- Read-modify-write sequences on shared data without a transaction or lock
- Tests that pass alone but fail in parallel

## Probes
- Add a delay (`await sleep(500)`) at the suspected point. If this is the cause, the bug becomes reliable.
- Run the loop 50 times, or in parallel. The reproduction rate should rise under load.
- Serialise the two operations, or add an in-flight guard. If this is the cause, the bug disappears.

## Signs it isn't this
The bug reproduces every time with the same input, at any speed, in a single
step.
