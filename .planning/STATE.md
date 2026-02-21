# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.
**Current focus:** Phase 1 — Infrastructure

## Current Position

Phase: 1 of 4 (Infrastructure)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-21 — Roadmap created, ready to begin Phase 1 planning

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Tailscale MagicDNS CNAME limitation (issue #1543 open since 2021) — use `fedora.mist-walleye.ts.net` directly or create device alias manually via Tailscale admin console. Resolve before Phase 1 Caddyfile site address is set.
- [Research]: SELinux may block Caddy on Fedora — store blog files under `/srv/blog` or apply `semanage fcontext` labels if 403/500 errors appear despite correct Unix permissions.

## Session Continuity

Last session: 2026-02-21
Stopped at: Roadmap written; REQUIREMENTS.md traceability updated; ready for `/gsd:plan-phase 1`
Resume file: None
