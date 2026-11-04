---
id: environment-drift
name: Environment or config
summary: The code is fine, but it runs with different config, versions or infrastructure than where it works.
suspect_when: It works locally but not in staging, production or CI, or works for one developer but not another.
---

## What this lens suspects
Missing or different environment variables, feature flags, dependency versions
(lockfile drift, a different Node or Python version), build-time versus
runtime config, database schema or migrations not applied, CORS and cookie
settings, file paths and case sensitivity, and timezone or locale of the server.

## Where to look
- Every config value the failing path reads, and where each comes from in each environment
- The lockfile and the runtime versions in each environment
- Applied migrations in each database
- Feature flag values for the affected user
- Differences between the dev server and the production build (minification, SSR, env inlining)

## Probes
- Print the effective config at the failing point in both environments (redact secrets) and diff them.
- Run the production build locally. If it fails like production, the cause is in the build.
- Set the suspected variable or version to the failing environment's value locally. If this is the cause, the bug appears.

## Signs it isn't this
It reproduces in every environment with the same steps.
