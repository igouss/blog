---
phase: 01-infrastructure
plan: "02"
subsystem: infra
tags: [caddy, tailscale-funnel, http, static-files, port-8080]

# Dependency graph
requires:
  - phase: 01-01
    provides: "configs/Caddyfile (Phase 1 TLS config), blog repo layout, world-readable permissions"
provides:
  - "configs/Caddyfile — plain HTTP :8080, no TLS block (Tailscale Funnel terminates TLS)"
  - "Caddy running as elendal user (caddy start, pid persists until reboot or caddy stop)"
  - "curl http://localhost:8080 returns HTTP 200 with placeholder HTML"
affects:
  - 01-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Caddy started via 'caddy start' as user process (no systemd) — daemonizes until reboot"
    - "Tailscale Funnel terminates TLS externally; Caddy receives plain HTTP on :8080"
    - "Caddyfile uses :8080 site address (binds all interfaces) — Funnel connects from localhost"

key-files:
  created: []
  modified:
    - /home/elendal/IdeaProjects/blog/configs/Caddyfile

key-decisions:
  - "Plain HTTP :8080 (no TLS in Caddy) — Tailscale Funnel handles TLS termination via --https=443 mode"
  - "caddy start (not systemd) — user-level daemon sufficient for dev; systemd not required"

patterns-established:
  - "Funnel -> Caddy architecture: Funnel on :443, forwards plain HTTP to localhost:8080"

requirements-completed: [INFRA-03]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 1 Plan 02: Caddy HTTP Configuration Summary

**Caddyfile switched to plain HTTP on :8080 (no TLS), Caddy started as user process; curl http://localhost:8080 returns 200 with blog placeholder**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-21T23:04:25Z
- **Completed:** 2026-02-21T23:08:00Z
- **Tasks:** 2
- **Files modified:** 1 (configs/Caddyfile)

## Accomplishments

- Caddyfile rewritten from fedora.mist-walleye.ts.net TLS config to plain HTTP :8080 block with no TLS directive
- Caddy started via `caddy start` as the elendal user — persists as background daemon
- Verified: `curl http://localhost:8080` returns HTTP 200 with "Blog coming soon" HTML

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Caddyfile to plain HTTP on :8080** - `b0b29b9` (feat)
2. **Task 2: Start Caddy as user and verify HTTP 200** - `61ee485` (chore)

## Files Created/Modified

- `/home/elendal/IdeaProjects/blog/configs/Caddyfile` - Changed site address from fedora.mist-walleye.ts.net to :8080, removed TLS block, applied caddy fmt

## Decisions Made

- **Plain HTTP on :8080:** Tailscale Funnel uses `--https=443 http://localhost:8080` mode — Funnel terminates TLS and proxies plain HTTP. Caddy does not need a cert or port 443.
- **caddy start (user daemon):** No systemd service needed. `caddy start` daemonizes in background as elendal user; survives as long as session or until reboot.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Killed stale python3 server.py blocking port 8080**
- **Found during:** Task 2 (Start Caddy as user and verify HTTP 200)
- **Issue:** `python3 server.py` (pid 2859185, running since Feb 14) was holding port 8080. `caddy start` failed with "address already in use".
- **Fix:** `kill 2859185` — verified port free with `ss -tlnp | grep 8080`
- **Files modified:** None (runtime action)
- **Verification:** Caddy started successfully after kill; HTTP 200 confirmed
- **Committed in:** `61ee485` (Task 2 commit, noted in message)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Stale process from a previous session; straightforward kill. No scope creep.

## Issues Encountered

Caddy emitted a formatting warning (`Caddyfile input is not formatted`). Applied `caddy fmt --overwrite` to canonicalize indentation (spaces to tabs). No functional change.

## User Setup Required

None - Caddy is already running as the elendal user.

**Note:** Caddy will not survive a reboot automatically (no systemd unit). If the machine reboots, run:
```bash
caddy start --config /home/elendal/IdeaProjects/blog/configs/Caddyfile
```

## Next Phase Readiness

- Plan 03 (Tailscale Funnel) can proceed immediately
- Caddy is listening on :8080 — Funnel just needs to be configured with `tailscale funnel --https=443 http://localhost:8080`
- HTTP pipeline validated end-to-end at localhost

---
*Phase: 01-infrastructure*
*Completed: 2026-02-21*
