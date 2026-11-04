---
id: mobile
name: Mobile
summary: The feature works fully on a phone, not just in a shrunken desktop layout.
needs: browser
---

## Checks
- Does every part of the feature fit and work at phone width, with no horizontal scrolling?
- Are tap targets at least about 44 by 44 pixels, and spaced so they're hard to mis-tap?
- Does anything rely on hover, right-click, drag or keyboard shortcuts with no touch alternative?
- Do inputs use the right mobile keyboard (email, number, phone) and stay visible above the on-screen keyboard?
- Do fixed headers, footers or modals leave enough room for the content?

## How to check
Start the browser with `--device mobile` and use the whole feature. The
snapshot marks small targets as `small WxH`. Take screenshots of each screen.
Read the CSS for breakpoints and hover-only styles.

## What good looks like
Everything a desktop user can do, a phone user can do, without zooming.
