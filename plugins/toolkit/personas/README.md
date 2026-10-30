# Personas

A shared library of user personas. Any skill in this plugin can read these files
from `${CLAUDE_PLUGIN_ROOT}/personas/`.

## Overriding or adding personas per project

A project can add its own personas, or replace these ones, by putting files in
`.claude/personas/*.md` in the project. If a project file has the same `id` as
a file here, the project version wins.

## File format

```markdown
---
id: kebab-case-id            # unique; used to select the persona
name: First name, age         # what the report calls them
summary: One line describing who they are
tech_comfort: 1-5             # 1 = avoids technology, 5 = developer
device: desktop | mobile      # sets the browser viewport
patience: low | medium | high # how quickly they give up
arrival: How they got to the app (search, link from a friend, ad, ...)
goal: What they're trying to do. Can use {{product_purpose}}.
---

## Background
## What they care about
## What confuses or annoys them
## How they talk
## Behaviour rules
```

### Template slots

- `{{product_purpose}}`: what the product does, in plain words. The skill
  fills it from the user's prompt or the project's README or CLAUDE.md.
- `{{scope}}`: the flow being tested, or "the whole app".

### Writing good behaviour rules

Rules should be concrete and something you can see the persona do or not do.
"Doesn't read paragraphs longer than two lines" works. "Is a bit impatient"
doesn't. The rules are what keep a walkthrough in character.
