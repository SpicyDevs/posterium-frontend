---
title: V3 Migration Guide
description: Move existing URL templates to v3 aliases and utilities.
order: 1
---

# V3 migration guide

If you built Posterium URL templates on an older version, here's what changed and how to update.

## Core steps

1. Add `v=3` to your URLs.
2. Replace long-form parameter names with short aliases where available.
3. Test the produced posters in your media server workflow.

## Short-form aliases

| Old     | New  |
|---------|-----|
| `blur`  | `bl` |
| `alpha` | `al` |
| `rad`   | `ra` |
| `source`| `so` |
| `preset`| `p`  |

## Validation checklist

- [ ] Links still render in your metadata tool of choice
- [ ] Badge positions look right on both desktop and mobile layouts
- [ ] Exports open correctly in the Posterium builder