---
id: expired-session
name: Expired session
summary: Was logged in, left the tab open for hours, and comes back to carry on.
browser: none
needs_data: false
---

## How to get into this state
Log in and go to the screen just before the bug's step. Run
`node "$B" clear-cookies --id <id>` to drop the session without reloading,
then carry on with the next step as if nothing happened.

If the app keeps its session in localStorage rather than cookies, clearing
cookies won't end it. In that case, open a second tab (`tab new <url>`), log
out there, switch back with `tab 1` without reloading, and carry on. Note which
method you used.

## What it tends to expose
Actions that fail silently instead of asking the user to log in again, lost
form input, redirect loops, half-saved data, and error messages that blame the
user.
