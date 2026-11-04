---
id: built-to-scale
name: Built to scale
summary: Design for 10–100 times today's usage, data and team size, without a rewrite.
---

## Brief
Propose the approach that would still work at 10–100 times today's users,
data volume and request rate, and with more people changing the code. Be
explicit about which bottleneck each choice avoids, and estimate the scale at
which the simpler approaches would break. Use the project's real numbers where
you can find them (seed data, analytics, README).

## What it optimises for
Performance headroom, clear module seams, and avoiding a costly rewrite later.

## Blind spots
It often designs for scale the product may never reach, at the cost of time
and complexity now. Check its "simpler approaches break at" estimate against
realistic growth.
