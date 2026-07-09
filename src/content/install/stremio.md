---
name: Stremio
order: 4
showcaseImages:
  desktop: /placeholders/install-desktop.svg
  tv: /placeholders/install-tv.svg
  mobile:
    - /placeholders/install-mobile.svg
    - /placeholders/install-mobile-alt.svg
---

# Stremio

Stremio uses addons for metadata. You'll need to hook the Posterium URL into your addon's poster response.

## Steps

1. Build a Posterium URL template for your poster layout.
2. In your addon code, map each title's ID to the poster endpoint.
3. Return the URL in the addon's metadata response payload.
4. Reload the addon and verify the poster shows up.