---
category: Integrations
question: Does Posterium work with Plex and Jellyfin?
order: 1
---

Yep. That's basically what it's made for.

Generate your poster in the builder, copy the URL, and paste it into your media server's custom poster field. Plex, Jellyfin, Emby — all handle remote URLs the same way.

Every time the server fetches that image (library refresh, client loading the detail page), it gets the latest scores. No manual refreshing, no uploading files, no "this poster is six months old" problem.