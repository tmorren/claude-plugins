---
id: new-account
name: Brand-new account
summary: Signed up a minute ago, with no data, no settings changed and onboarding not finished.
browser: none
needs_data: false
---

## How to get into this state
Sign up through the UI with a fresh address such as
`repro.new-account.<timestamp>@example.com`. Use the project's test-mode
verification if sign-up needs email confirmation. Skip or abandon any
onboarding the bug report doesn't mention.

## What it tends to expose
Missing empty states, code that assumes at least one item or a finished
profile, defaults that were never written to the database, and onboarding flags
that block other screens.
