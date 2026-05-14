---
title: "Caddy named matchers are block-scoped"
date: "2026-02-27"
---

A small Caddyfile cleanup that removed eight duplicate lines.

## The problem

Each tailnet-gated route in the Caddyfile was declaring the same matcher:

```
handle /code* {
    @tailnet header Tailscale-User-Login *
    handle @tailnet { reverse_proxy localhost:7682 }
    respond "Forbidden" 403
}

handle /ttyd* {
    @tailnet header Tailscale-User-Login *
    handle @tailnet { reverse_proxy localhost:7681 }
    respond "Forbidden" 403
}
```

Eight services, eight identical `@tailnet header Tailscale-User-Login *` declarations. Copy-paste configuration.

## Named matchers are scoped to the block they're defined in

That's why each handle had its own — a matcher defined inside a `handle` block only exists within that block.

Matchers defined directly in the site block (outside any `handle`) are scoped to the whole site. Move `@tailnet` there and every handle can reference it:

```
:8080 {
    @tailnet header Tailscale-User-Login *

    handle /code* {
        handle @tailnet { reverse_proxy localhost:7682 }
        respond "Forbidden" 403
    }

    handle /ttyd* {
        handle @tailnet { reverse_proxy localhost:7681 }
        respond "Forbidden" 403
    }
}
```

One declaration, used everywhere. The behavior is identical — `Tailscale-User-Login` is injected by Tailscale on tailnet requests and stripped before Funnel traffic reaches Caddy, so it can't be spoofed.

The same scoping applies to any named matcher: `@articleSlug`, `@root`, `@404markdown`. If a matcher is defined at the site level, it's available in all handles. If you need a matcher to only exist inside one handle (e.g., because it shadows a site-level name), define it inside that handle.
