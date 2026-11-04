---
id: other-locale
name: Other locale and timezone
summary: A user far from the developers, with a different language, date format and timezone.
browser: --locale de-DE --timezone Pacific/Auckland
needs_data: false
---

## How to get into this state
Start the browser with the flags above. Auckland is ahead of UTC by 12–13
hours, so dates often land on a different day than on the server. Use
`--timezone America/Los_Angeles` as a second run when the bug involves "today"
or deadlines. Run the steps around midnight in the browser's timezone if the
report mentions dates.

## What it tends to expose
Dates shown on the wrong day, deadlines and "today" computed in the server's
timezone, number and currency formatting, decimal commas breaking parsing,
sorting of accented names, and text that overflows when translated.
