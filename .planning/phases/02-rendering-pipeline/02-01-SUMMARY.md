---
phase: 02-rendering-pipeline
plan: "01"
subsystem: infra
tags: [caddy, content-negotiation, routing, caddyfile, http, markdown]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: "Caddy running on :8080, repo at /home/elendal/IdeaProjects/blog, Tailscale Funnel proxying TLS"
provides:
  - "Caddy content negotiation: Accept: text/markdown -> raw .md file, else -> templates/article.html"
  - "Vary: Accept header on all article responses"
  - "Whitelist access control: 403 catch-all for non-whitelisted paths"
  - "Custom 404 handler with markdown and HTML branches"
  - "@articleSlug path_regexp named-group routing with {re.article.1} rewrite"
affects: [02-02-templates, 02-03-styles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Caddy nested named matchers inside handle blocks for route-scoped content negotiation"
    - "path_regexp with named group 'article' + {re.article.1} rewrite for clean URL -> file mapping"
    - "Whitelist via explicit handle blocks + catch-all respond 403"
    - "handle_errors 404 for custom error pages with content negotiation"

key-files:
  created: []
  modified:
    - configs/Caddyfile

key-decisions:
  - "{re.article.1} capture group syntax works in Caddy 2.10.2 for path_regexp named group rewrites"
  - "Nested named matchers (e.g., @slugMarkdown inside handle @articleSlug) are scoped and work correctly"
  - "header +Vary appends rather than overwrites - Caddy also auto-adds Vary: Accept-Encoding"
  - "HTML branch returns 404 (not 500) when templates/article.html missing - Caddy file_server 404 behavior"
  - "catch-all handle { respond 403 } must be last - first-match-wins ordering in Caddy"

patterns-established:
  - "Content negotiation: handle @matcher -> header +Vary -> nested @markdownMatcher -> file_server / else templates + file_server"

requirements-completed: [REND-01, REND-06, REND-07, STYL-04]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 2 Plan 01: Caddyfile Content Negotiation Routing Summary

**Caddy 2.10.2 routing with Accept-header content negotiation, named-group regexp rewrites, whitelist 403 catch-all, and 404 error handler for the blog's Markdown-first serving architecture**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-22T15:43:55Z
- **Completed:** 2026-02-22T15:45:35Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Rewrote configs/Caddyfile with full Phase 2 routing: clean URL rewriting, content negotiation, whitelist, and 404 handling
- Verified `{re.article.1}` named capture group syntax works correctly in Caddy 2.10.2
- Confirmed nested named matchers inside `handle` blocks function as expected (route-scoped)
- Smoke-tested all routing branches: whitelist 403, markdown content-type, Vary header, HTML branch

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Phase 2 Caddyfile with content negotiation and whitelist** - `e228a74` (feat)
2. **Task 2: Reload Caddy and smoke-test routing** - No file changes; runtime action only

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `configs/Caddyfile` - Phase 2 routing: content negotiation, @articleSlug path_regexp, whitelist, handle_errors 404, catch-all 403

## Decisions Made
- `{re.article.1}` syntax (not `{re.1}`) is correct for named capture groups in Caddy path_regexp - verified via caddy adapt JSON output showing `{http.regexp.article.1}`
- Nested named matchers inside handle blocks are scoped to that block - no conflicts with top-level matchers
- HTML branch returning 404 (not 500) when template missing is expected Caddy behavior - templates exist in Plan 02
- `header +Vary "Accept"` correctly appends; Caddy independently adds `Vary: Accept-Encoding` (both appear in response)

## Deviations from Plan

None - plan executed exactly as written. All syntax worked on first attempt.

## Issues Encountered

None - caddy adapt validated syntax, caddy fmt formatted cleanly, all smoke tests passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Caddyfile routing layer complete - Plan 02 (templates) can now implement `templates/article.html` and `templates/404.html`
- The HTML branch currently returns 404 for article URLs (expected until templates exist)
- Markdown content negotiation is fully operational now
- No blockers for Phase 2 Plan 02

---
*Phase: 02-rendering-pipeline*
*Completed: 2026-02-22*
