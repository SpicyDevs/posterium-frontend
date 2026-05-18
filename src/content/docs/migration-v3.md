---
title: V3 Migration Guide
description: Migrate existing Posterium URL templates to v3 aliases and utilities.
order: 1
---

# V3 migration guide

This guide helps you migrate existing Posterium links to v3 while keeping backward compatibility.

## Core migration steps

1. Add `v=3` to your URLs.
2. Replace long-form badge providers with short aliases where possible.
3. Validate generated posters in your Plex, Jellyfin, or Emby workflow.

## Short-form alias highlights

- `blur` → `bl`
- `alpha` → `al`
- `rad` → `ra`
- `source` → `so`
- `preset` → `p`

## Validation checklist

- Ensure links still render in your media server metadata tool.
- Verify badge positions for both desktop and mobile layouts.
- Confirm exports still open in the Posterium builder.
