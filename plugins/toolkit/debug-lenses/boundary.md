---
id: boundary
name: Boundary or off-by-one
summary: Logic is wrong at an edge, such as the first or last item, a page boundary, midnight, or a limit.
suspect_when: The bug appears at specific counts, dates, times, sizes or positions.
---

## What this lens suspects
Off-by-one in loops and slices, inclusive versus exclusive ranges, pagination
cursors, date maths across midnight, month ends, daylight saving and leap
years, rounding and floating point, integer overflow, and size or rate limits.

## Where to look
- Comparisons (`<` vs `<=`), ranges and index arithmetic near the failing behaviour
- Date handling: which timezone each value is in, and whether "today" is computed on the server or client
- Money and percentages handled as floats
- Limits: page size, upload size, string length, rate limits, quotas

## Probes
- Run the loop at the boundary value, one below and one above. The bug should appear on only one side.
- Freeze the clock to just before and just after the suspected edge (midnight, a DST change).
- Replace float maths with integer (minor units) maths. If this is the cause, the bug disappears.

## Signs it isn't this
The bug appears with values well inside every range.
