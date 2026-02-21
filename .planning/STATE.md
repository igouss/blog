# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.
**Current focus:** Phase 1 — Infrastructure

## Current Position

Phase: 1 of 4 (Infrastructure)
Plan: 1 of 3 completed in current phase
Status: In Progress
Last activity: 2026-02-21 — Completed 01-01 (blog layout, Caddyfile, tailscaled cert permission)

Progress: [█░░░░░░░░░] 8% (1 of 12 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 15 min
- Total execution time: 15 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 1/3 | 15 min | 15 min |

**Recent Trend:**
- Last 5 plans: 15 min
- Trend: baseline

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Research]: Use `.OriginalReq.URL.Path` in templates (not `.Req.URL.Path`) — post-rewrite path is wrong
- [Research]: Rewrite to `.html` template, not `.md` — Caddy templates directive skips `.md` MIME type
- [Research]: `tailscale funnel` (not `tailscale serve`) for public internet exposure
- [Research]: `TS_PERMIT_CERT_UID=caddy` required in `/etc/default/tailscaled` before Caddy can fetch TLS cert
- [Research]: CNAME `blog.mist-walleye.ts.net` cannot be created via Terraform — use machine hostname or manual admin console alias
- [Phase 01-infrastructure]: fedora.mist-walleye.ts.net used as Caddy site address (no CNAME available for blog.mist-walleye.ts.net)
- [Phase 01-infrastructure]: World-readable permissions (a+rX) on blog repo so caddy can serve files without ownership changes
- [Phase 01-infrastructure]: Phase 1 Caddyfile minimal (no template/rewrite) — content negotiation added in Phase 2

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: Tailscale MagicDNS CNAME — using `fedora.mist-walleye.ts.net` directly (locked in Caddyfile)
- [Deferred]: SELinux may block Caddy on Fedora — if Caddy returns 403 after Plan 02 starts service, apply: `sudo semanage fcontext -a -t httpd_sys_content_t "/home/elendal/IdeaProjects/blog(/.*)?" && sudo restorecon -Rv /home/elendal/IdeaProjects/blog`

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 01-01-PLAN.md (blog layout, Caddyfile, tailscaled cert permission); ready for 01-02
Resume file: None
