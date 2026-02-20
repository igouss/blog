# Personal Blog

## What This Is

A personal blog served via Caddy web server on a Fedora machine, exposed to the internet through Tailscale Funnel. Posts are written in Markdown and served as HTML to browsers or raw Markdown to clients that request it (content negotiation). The blog is accessible at `blog.mist-walleye.ts.net` over both HTTP and HTTPS, with TLS certificates managed by Tailscale.

## Core Value

Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Caddy serves Markdown files as HTML to browser clients (Content-Type negotiation)
- [ ] Caddy serves raw Markdown to clients that send `Accept: text/markdown`
- [ ] Blog is accessible via `blog.mist-walleye.ts.net` (CNAME pointing to `fedora.mist-walleye.ts.net`)
- [ ] Blog is available on both HTTP and HTTPS (TLS via Tailscale certificates)
- [ ] Tailscale Funnel exposes the blog to the public internet
- [ ] HTML template renders Markdown as a clean, readable blog layout
- [ ] Articles stored in dedicated directory (`articles/`)
- [ ] Templates and CSS stored in their own directories
- [ ] Scripts and configurations in their own directories
- [ ] Terraform manages Tailscale CNAME configuration

### Out of Scope

- Dynamic CMS or database — static Markdown files only
- Comments system — static blog only
- Search functionality — not in v1
- User authentication — public read-only blog

## Context

- **Machine**: `fedora.mist-walleye.ts.net` on Tailscale network `mist-walleye`
- **Blog domain**: `blog.mist-walleye.ts.net` (CNAME alias)
- **Web server**: Caddy — chosen for built-in Tailscale TLS integration and HTTP template handler for Markdown rendering
- **Infrastructure**: Tailscale Funnel for internet exposure; no open ports needed on the host firewall
- **TLS**: Caddy fetches certificates from Tailscale, handles HTTPS termination automatically
- **Content format**: Markdown (`.md`) files as the authoring format

## Constraints

- **Tech Stack**: Caddy server (HTTP server), Tailscale (networking/TLS/funnel), Terraform (infra config)
- **Hosting**: Single Fedora machine (`fedora.mist-walleye.ts.net`) — no cloud infra
- **Content negotiation**: Must serve HTML to browsers, raw Markdown to `Accept: text/markdown` clients
- **Directory layout**: Articles, templates, CSS, scripts, and configs must be in separate top-level directories

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Caddy over Nginx/Apache | Built-in Tailscale TLS support, HTTP template handler for Markdown | — Pending |
| Tailscale Funnel over port forwarding | No firewall/router config needed, secure by default | — Pending |
| Static Markdown files over CMS | Simplicity, version-controllable, editor-agnostic | — Pending |
| Terraform for Tailscale config | Reproducible, declarative CNAME management | — Pending |

---
*Last updated: 2026-02-20 after initialization*
