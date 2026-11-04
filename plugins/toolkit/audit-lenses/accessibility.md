---
id: accessibility
name: Accessibility
summary: The feature works with a keyboard, a screen reader and zoom, and meets WCAG AA basics.
needs: both
---

## Checks
- Can every action be done with the keyboard alone, in a sensible tab order, with a visible focus indicator?
- Does every interactive element have an accessible name? (The snapshot shows `(no accessible name)` where one is missing.)
- Are form errors announced and tied to their fields, not shown by colour alone?
- Do dialogs trap focus, close with Escape and return focus where it came from?
- Does the feature still work at 200% zoom (`--zoom 2`)?
- Is text contrast at least 4.5:1, and are images and icons labelled or marked decorative?

## How to check
Use the feature with only `press Tab`, `Shift+Tab`, `Enter`, `Space` and
`Escape`, watching the `Focused:` line. Repeat at `--zoom 2`. Read the markup
for labels, roles and `aria-*` attributes.

## What good looks like
A keyboard-only or screen-reader user can complete every task the feature
offers, and nothing is conveyed only by colour or position.
