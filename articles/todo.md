---
title: "Todo"
date: "2026-02-22"
---

Things to improve on this blog, in rough priority order.

## Up next

- **Fix date rendering** — dates show as `2026-02-22 00:00:00 +0000 UTC`; needs a format helper in the template
- **Auto-generated index** — listing articles manually in `index.md` doesn't scale; the index should build itself from the `articles/` directory
- **og:description** — Open Graph description tag is missing; required for decent link previews

## Backlog

- **← Back on index** — the back link on the index page navigates to itself
- **Favicon** — none yet
- **Log access** — `/var/log/caddy/access.log` is root-only; add user to `caddy` group or adjust permissions
- **Log rotation** — no logrotate config for the access log

## Done

- HTTPS via Tailscale Funnel
- Markdown → HTML rendering with content negotiation
- SARA styling, dark/light mode, theme toggle
- Syntax highlighting (github / github-dark)
- Open Graph title tag
- Back navigation
- Mobile layout
