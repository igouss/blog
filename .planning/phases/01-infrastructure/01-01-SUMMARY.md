---
phase: 01-infrastructure
plan: "01"
subsystem: infra
tags: [caddy, tailscale, tailscaled, tls, static-files, directory-layout]

# Dependency graph
requires: []
provides:
  - "Blog repo subdirectory layout (articles/, templates/, css/, scripts/, configs/)"
  - "index.html placeholder for pipeline validation"
  - "configs/Caddyfile — Phase 1 minimal Caddy config (source of truth)"
  - "TS_PERMIT_CERT_UID=caddy in /etc/default/tailscaled"
  - "tailscaled restarted with cert-permission env var active"
affects:
  - 01-02
  - 01-03

# Tech tracking
tech-stack:
  added: [caddy, tailscale-cert-socket]
  patterns:
    - "Source-of-truth Caddyfile in configs/Caddyfile, symlinked to /etc/caddy/ in Plan 02"
    - "World-readable repo files (a+rX) so caddy user can serve without ownership changes"
    - "TS_PERMIT_CERT_UID grants Caddy access to tailscaled TLS cert socket"

key-files:
  created:
    - /home/elendal/IdeaProjects/blog/configs/Caddyfile
    - /home/elendal/IdeaProjects/blog/index.html
    - /home/elendal/IdeaProjects/blog/articles/
    - /home/elendal/IdeaProjects/blog/templates/
    - /home/elendal/IdeaProjects/blog/css/
    - /home/elendal/IdeaProjects/blog/scripts/
  modified:
    - /etc/default/tailscaled

key-decisions:
  - "Site address is fedora.mist-walleye.ts.net (not blog.mist-walleye.ts.net — no CNAME available, locked decision)"
  - "World-readable permissions (a+rX) chosen so elendal owns files and caddy can read without sudo or group changes"
  - "Preemptive SELinux relabeling skipped — try as-is and apply semanage fix only if Caddy returns 403"
  - "Phase 1 Caddyfile has no template/rewrite directives — those are Phase 2 only"

patterns-established:
  - "configs/Caddyfile is single source of truth — symlinked from /etc/caddy/Caddyfile in Plan 02"
  - "tailscaled env var must precede Caddy startup — restart tailscaled before starting caddy"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 15min
completed: 2026-02-21
---

# Phase 1 Plan 01: Infrastructure Prerequisites Summary

**Blog repo layout and Caddy TLS prerequisites: subdirs created world-readable, Caddyfile written for fedora.mist-walleye.ts.net, TS_PERMIT_CERT_UID=caddy active in tailscaled**

## Performance

- **Duration:** ~15 min (across two sessions — checkpoint at Task 3 for sudo steps)
- **Started:** 2026-02-21T19:47:55Z
- **Completed:** 2026-02-21T19:48:44Z
- **Tasks:** 3
- **Files modified:** 3 (Caddyfile, index.html, /etc/default/tailscaled)

## Accomplishments

- Blog repo subdirectory tree created (articles/, templates/, css/, scripts/, configs/) with world-readable permissions so caddy can serve files without ownership changes
- Phase 1 Caddyfile written to configs/Caddyfile — minimal static-file config for fedora.mist-walleye.ts.net with TLS via tailscale cert socket
- TS_PERMIT_CERT_UID=caddy appended to /etc/default/tailscaled and tailscaled restarted — Caddy is now authorized to fetch *.ts.net TLS certificates

## Task Commits

Each task was committed atomically:

1. **Task 1: Create blog subdirectory layout and make world-readable** - `1ab6947` (feat)
2. **Task 2: Write Phase 1 Caddyfile into configs/** - `1c2e671` (feat)
3. **Task 3: Set TS_PERMIT_CERT_UID and restart tailscaled** - `d97d13e` (chore)

## Files Created/Modified

- `/home/elendal/IdeaProjects/blog/articles/` - Empty dir for future article Markdown files
- `/home/elendal/IdeaProjects/blog/templates/` - Empty dir for future Caddy HTML templates
- `/home/elendal/IdeaProjects/blog/css/` - Empty dir for stylesheets
- `/home/elendal/IdeaProjects/blog/scripts/` - Empty dir for build/deploy scripts
- `/home/elendal/IdeaProjects/blog/configs/Caddyfile` - Phase 1 minimal Caddy config: fedora.mist-walleye.ts.net, file_server, get_certificate tailscale
- `/home/elendal/IdeaProjects/blog/index.html` - Placeholder HTML ("Blog coming soon") for pipeline validation
- `/etc/default/tailscaled` - Appended TS_PERMIT_CERT_UID=caddy (system file, outside git repo)

## Decisions Made

- **fedora.mist-walleye.ts.net as site address:** No CNAME for blog.mist-walleye.ts.net available (Tailscale MagicDNS limitation, issue #1543). Use machine hostname directly. Locked decision.
- **World-readable permissions (a+rX):** Files owned by elendal, caddy reads via world permissions. Avoids adding caddy to elendal's group or changing ownership. Clean separation.
- **SELinux deferred:** /home has user_home_t context. If Caddy returns 403 after starting, apply `semanage fcontext` fix then. No preemptive action.
- **Phase 1 Caddyfile minimal:** No template, rewrite, or content-negotiation directives — those are Phase 2. Phase 1 validates the HTTPS + static-file pipeline only.

## Deviations from Plan

None - plan executed exactly as written.

Task 3 required a checkpoint (human-action) because `/etc/default/tailscaled` requires sudo access that cannot be automated in this environment. The user performed the two manual steps:
1. `echo 'TS_PERMIT_CERT_UID=caddy' | sudo tee -a /etc/default/tailscaled`
2. `sudo systemctl restart tailscaled`

This is documented as a normal auth gate, not a deviation.

## Issues Encountered

None - all tasks completed as specified.

## User Setup Required

None beyond what was completed in Task 3 (already done: TS_PERMIT_CERT_UID set, tailscaled restarted).

**Pending concern (SELinux):** If Caddy returns 403 errors after Plan 02 starts the service, apply:
```bash
sudo semanage fcontext -a -t httpd_sys_content_t "/home/elendal/IdeaProjects/blog(/.*)?"
sudo restorecon -Rv /home/elendal/IdeaProjects/blog
```

## Next Phase Readiness

- Plan 02 (Install and configure Caddy) can proceed immediately
- tailscaled cert socket is authorized for caddy user
- configs/Caddyfile is ready to be symlinked to /etc/caddy/Caddyfile
- index.html placeholder is in place to validate HTTPS pipeline

---
*Phase: 01-infrastructure*
*Completed: 2026-02-21*
