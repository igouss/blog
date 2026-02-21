---
phase: 01-infrastructure
plan: "03"
subsystem: infra
tags: [tailscale, tailscale-funnel, https, tls, public-access, port-443]

# Dependency graph
requires:
  - phase: 01-02
    provides: "Caddy running on localhost:8080, plain HTTP, returning HTTP 200"
provides:
  - "Tailscale Funnel active in --bg --https=443 mode, persistent across reboots"
  - "Public internet HTTPS access to fedora.mist-walleye.ts.net (Tailscale-issued TLS cert, no browser warning)"
  - "Full stack operational: public internet -> Funnel (TLS) -> Caddy localhost:8080 (HTTP) -> blog files"
affects:
  - 02-content-negotiation
  - 03-api

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tailscale Funnel --bg flag: Funnel rule persists across reboots and terminal exit"
    - "TLS-terminating proxy pattern: Funnel owns cert for fedora.mist-walleye.ts.net, Caddy receives plain HTTP"

key-files:
  created: []
  modified: []

key-decisions:
  - "Funnel --bg mode: persistent rule survives reboots without systemd configuration"
  - "Funnel terminates TLS (not Caddy) — Caddy stays plain HTTP on :8080; no cert management needed in Caddy"

patterns-established:
  - "Public internet stack: Funnel (port 443, TLS) -> localhost:8080 (plain HTTP, Caddy)"

requirements-completed: [INFRA-04, INFRA-05]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 1 Plan 03: Tailscale Funnel HTTPS Exposure Summary

**Tailscale Funnel enabled with --bg --https=443 mode; fedora.mist-walleye.ts.net publicly reachable over HTTPS with valid TLS cert and HTTP 200 confirmed from outside the tailnet**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-21T23:46:34Z
- **Completed:** 2026-02-21T23:52:00Z
- **Tasks:** 2
- **Files modified:** 0 (system-level configuration only)

## Accomplishments

- Tailscale Funnel started with `tailscale funnel --bg --https=443 http://localhost:8080` — persistent across reboots
- `tailscale funnel status` confirms active rule: `fedora.mist-walleye.ts.net` port 443 proxying to `http://localhost:8080`
- User confirmed external HTTPS access from outside the tailnet: browser showed "Blog coming soon", no TLS warning
- All four Phase 1 success criteria met

## Task Commits

Each task was committed atomically:

1. **Task 1: Enable Tailscale Funnel on port 443** - `489fe9d` (chore)
2. **Task 2: Verify external HTTPS access** - included in `489fe9d` (checkpoint confirmed by user)

## Files Created/Modified

None — Funnel configuration is stored in Tailscale's daemon state, not in repo files.

## Decisions Made

- **Funnel --bg flag:** Rule is persisted in tailscaled state; survives reboots and terminal exit without a systemd unit or cron entry.
- **TLS termination at Funnel:** Tailscale issues and manages the cert for `fedora.mist-walleye.ts.net`. Caddy requires no cert configuration and stays on plain HTTP `:8080`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Phase 1 Success Criteria — All Met

1. Repository directory structure exists in `/home/elendal/IdeaProjects/blog` — confirmed in plan 01-01
2. HTTPS works end-to-end — Funnel provides valid Tailscale-issued TLS cert; no browser warning confirmed
3. Tailscale Funnel is active and routing public internet traffic on port 443 — `tailscale funnel status` output:
   ```
   https://fedora.mist-walleye.ts.net (Funnel on)
   |-- /          proxy http://localhost:8080
   ```
4. External browser receives HTTP 200 over HTTPS — user confirmed "I can see 'blog coming soon'" from outside the tailnet

## Funnel Status (at plan completion)

```
# Funnel on:
#     - https://fedora.mist-walleye.ts.net

https://fedora.mist-walleye.ts.net (Funnel on)
|-- /          proxy http://localhost:8080
|-- /guacamole proxy http://localhost:4848/guacamole
|-- /groupview proxy http://localhost:3001/groupview
```

## User Setup Required

None - Funnel is active. No admin console action was needed (tailnet ACL already had `funnel` nodeAttr enabled).

## Next Phase Readiness

- Phase 1 complete: full infrastructure stack operational (blog files -> Caddy :8080 -> Funnel :443 -> public internet)
- Phase 2 (Content Negotiation) can proceed: foundation is a working HTTP server serving static files publicly over HTTPS
- No blockers

---
*Phase: 01-infrastructure*
*Completed: 2026-02-21*
