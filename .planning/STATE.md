# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.
**Current focus:** Phase 1 complete — moving to Phase 2 (Content Negotiation)

## Current Position

Phase: 1 of 4 (Infrastructure) — COMPLETE
Plan: 3 of 3 completed in current phase
Status: Phase 1 Complete, ready for Phase 2
Last activity: 2026-02-21 — Completed 01-03 (Tailscale Funnel HTTPS, public access verified)

Progress: [███░░░░░░░] 25% (3 of 12 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 8 min
- Total execution time: 25 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 3/3 | 25 min | 8 min |

**Recent Trend:**
- Last 5 plans: 15 min, 5 min, 5 min
- Trend: stable at 5 min

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
- [Phase 01-infrastructure]: Plain HTTP :8080 in Caddy — Tailscale Funnel terminates TLS (--https=443 mode) and proxies to localhost:8080
- [Phase 01-infrastructure]: caddy start (user daemon, not systemd) — sufficient for current setup; no service unit needed
- [Phase 01-infrastructure]: Funnel --bg flag used — rule persists across reboots in tailscaled state without systemd
- [Phase 01-infrastructure]: TLS terminated by Funnel (not Caddy) — Caddy stays plain HTTP, no cert management needed

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: Tailscale MagicDNS CNAME — using `fedora.mist-walleye.ts.net` directly (locked in Caddyfile)
- [RESOLVED 01-02]: SELinux did not block Caddy — HTTP 200 confirmed without semanage fix. World-readable permissions sufficient.
- [RESOLVED 01-03]: Tailnet ACL already had funnel nodeAttr enabled — no admin console action needed

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 01-03-PLAN.md (Tailscale Funnel HTTPS on :443, public access verified); Phase 1 complete
Resume file: None
