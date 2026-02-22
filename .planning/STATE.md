# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.
**Current focus:** Phase 3 (Styling and Metadata) — Plan 01 complete, Plan 02 next

## Current Position

Phase: 3 of 4 (Styling and Metadata) — IN PROGRESS
Plan: 1 of 2 completed in current phase
Status: 03-01 complete — SARA CSS + article.html updates (dark mode, og:title, back-nav, theme toggle)
Last activity: 2026-02-22 — Completed 03-01 (SARA styling: css/blog.css + article.html)

Progress: [███████░░░] 58% (7 of 12 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 5 min
- Total execution time: 36 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 3/3 | 25 min | 8 min |
| 02-rendering-pipeline | 3/3 | 9 min | 3 min |
| 03-styling-and-metadata | 1/2 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 5 min, 2 min, 2 min, 2 min
- Trend: fast

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
- [Phase 02-rendering-pipeline 02-01]: {re.article.1} capture group syntax works in Caddy 2.10.2 path_regexp rewrites
- [Phase 02-rendering-pipeline 02-01]: Nested named matchers inside handle blocks are scoped correctly (no conflicts)
- [Phase 02-rendering-pipeline 02-01]: HTML branch returns 404 (not 500) when templates/article.html missing — expected behavior
- [Phase 02-rendering-pipeline 02-01]: catch-all handle { respond 403 } must be last in Caddy (first-match-wins)
- [Phase 02-rendering-pipeline 02-02]: Hugo v0.152.2 used only for `hugo gen chromastyles --style=github` — not part of serving stack
- [Phase 02-rendering-pipeline 02-02]: YAML unquoted date values parse as time.Time → renders as "2026-02-21 00:00:00 +0000 UTC"; articles should quote date values or use a format helper in Phase 4
- [Phase 02-rendering-pipeline 02-02]: css/blog.css linked from article.html now (returns 404 until Phase 3) — per design: link now, avoid rework later
- [Phase 02-rendering-pipeline 02-03]: Phase 2 complete — all 5 success criteria verified on public URL; YAML unquoted date renders as "2026-02-21 00:00:00 +0000 UTC", needs format helper in Phase 4
- [Phase 03-styling-and-metadata 03-01]: Dark mode uses [data-theme=dark] selector + prefers-color-scheme fallback — both JS toggle and system preference work without conflict
- [Phase 03-styling-and-metadata 03-01]: Anti-FOUC IIFE placed after charset/viewport metas but before link tags — prevents theme flash on dark-preferring systems
- [Phase 03-styling-and-metadata 03-01]: og:type: article added alongside og:title (trivially small addition per plan note)

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 01-01]: Tailscale MagicDNS CNAME — using `fedora.mist-walleye.ts.net` directly (locked in Caddyfile)
- [RESOLVED 01-02]: SELinux did not block Caddy — HTTP 200 confirmed without semanage fix. World-readable permissions sufficient.
- [RESOLVED 01-03]: Tailnet ACL already had funnel nodeAttr enabled — no admin console action needed

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 03-01-PLAN.md (SARA CSS + article.html: dark mode, og:title, back-nav, theme toggle); ready for 03-02
Resume file: None
