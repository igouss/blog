# Phase 1 Context: Infrastructure

**Source:** User conversation (2026-02-21)

## Decisions (Locked)

- **Hostname:** Use `fedora.mist-walleye.ts.net` as the Caddyfile site address — no CNAME, no alias
- **No Terraform:** Terraform is deferred to v1.1 — do NOT include any Terraform setup in Phase 1
- **Deploy target:** The Fedora host `fedora.mist-walleye.ts.net` — Caddy and Tailscale are already installed
- **Deployment approach:** Deploy everything directly on the host (copy/link config files, systemd, etc.)

## Claude's Discretion

- Where exactly to store blog files on disk (`/srv/blog` recommended by research for SELinux compatibility)
- Whether to use a symlink from `/etc/caddy/Caddyfile` or copy
- How to structure the initial Caddyfile (can be minimal for Phase 1 — just HTTPS + file_server, rendering comes in Phase 2)

## Deferred Ideas (Out of Scope)

- Terraform (v1.1)
- CNAME `blog.mist-walleye.ts.net` (not possible via MagicDNS yet)
- Content negotiation and Markdown rendering (Phase 2)
- CSS, templates, HTML (Phase 3)
