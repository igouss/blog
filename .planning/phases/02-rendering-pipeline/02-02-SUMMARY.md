---
phase: 02-rendering-pipeline
plan: "02"
subsystem: infra
tags: [caddy, go-templates, goldmark, chroma, syntax-highlighting, markdown, content-negotiation]

# Dependency graph
requires:
  - phase: 02-rendering-pipeline
    provides: Caddyfile routing — rewrites HTML requests to templates/article.html and handle_errors 404 to templates/404.html

provides:
  - templates/article.html — Caddy Go template that reads Markdown via .OriginalReq.URL.Path, parses YAML front matter, renders HTML with Goldmark
  - templates/404.html — 404 error page with back-link, served by handle_errors 404 block in Caddyfile
  - css/syntax.css — Chroma github-theme CSS for syntax highlighting (74 lines, 72 .chroma rules)

affects:
  - phase 03 (CSS/blog.css — article.html already links /css/blog.css)
  - phase 04 (content articles — article.html is the rendering layer)

# Tech tracking
tech-stack:
  added:
    - hugo v0.152.2 (used only for: hugo gen chromastyles --style=github to generate css/syntax.css)
    - Chroma (bundled in Caddy; CSS generated externally via hugo)
    - Goldmark (bundled in Caddy; invoked via markdown template action)
  patterns:
    - Caddy Go templates with splitFrontMatter for YAML front matter parsing
    - .OriginalReq.URL.Path pattern (pre-rewrite path) for URL-to-file mapping
    - httpError 404 guard pattern for missing articles

key-files:
  created:
    - templates/article.html
    - templates/404.html
    - css/syntax.css
  modified: []

key-decisions:
  - "YAML unquoted date values (e.g., date: 2026-02-21) are parsed as time.Time by splitFrontMatter, rendering as '2026-02-21 00:00:00 +0000 UTC' — not a bug; format with a date helper or quote the date in front matter"
  - "css/blog.css linked from article.html now (returns 404 until Phase 3) per user decision: avoid rework later"
  - "Hugo used only for CSS generation (hugo gen chromastyles), not for serving content — Caddy is the server"

patterns-established:
  - "Template pattern: .OriginalReq.URL.Path used (not .Req.URL.Path) to get pre-rewrite URL"
  - "Guard pattern: {{if not (fileExists $mdPath)}}{{httpError 404}}{{end}} at top of template before any output"
  - "Front matter pattern: {{$doc := include $mdPath | splitFrontMatter}} — pipe include output into splitFrontMatter"

requirements-completed: [REND-02, REND-03, REND-04, REND-05]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 2 Plan 02: Templates and Syntax Highlighting Summary

**Caddy Go templates rendering Markdown via Goldmark with Chroma syntax highlighting (github theme) via .OriginalReq.URL.Path + splitFrontMatter pattern**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-22T15:47:24Z
- **Completed:** 2026-02-22T15:49:13Z
- **Tasks:** 2
- **Files modified:** 3 (article.html, 404.html, syntax.css)

## Accomplishments

- article.html renders any Markdown article as HTML: resolves URL path to .md file, parses YAML front matter, renders body via Goldmark with Chroma highlighting
- 404.html served by handle_errors 404 Caddyfile block with "← Back to articles" link
- css/syntax.css generated via `hugo gen chromastyles --style=github` — 72 .chroma rules; end-to-end test confirmed colored spans in code blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create article.html and 404.html Caddy templates** - `008e733` (feat)
2. **Task 2: Generate Chroma syntax.css and verify end-to-end rendering** - `de786e5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `templates/article.html` - Caddy Go template: URL path resolution, splitFrontMatter, httpError 404 guard, markdown action
- `templates/404.html` - 404 error page with back-link to / via &#8592; entity
- `css/syntax.css` - Chroma github-theme CSS, 74 lines, 72 .chroma rules, world-readable

## Decisions Made

- Hugo v0.152.2 used only for `hugo gen chromastyles --style=github` — it is the most convenient way to generate Chroma CSS outside of a Go program. It is not part of the serving stack.
- YAML unquoted dates (e.g., `date: 2026-02-21`) are parsed as `time.Time` by Caddy's splitFrontMatter, producing `2026-02-21 00:00:00 +0000 UTC` in output. This is expected Go template behavior. Articles should quote the date value (`date: "2026-02-21"`) or use a date format function in Phase 4 when real content is added.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Date rendering quirk (not a bug):** YAML unquoted `date: 2026-02-21` → `time.Time` struct → renders as `2026-02-21 00:00:00 +0000 UTC`. The date IS present and correct. Phase 4 (content) should handle this by quoting date values in front matter or using a date formatting template helper.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Templates are ready — Caddyfile already rewrites to them
- End-to-end render pipeline verified: HTML request → article.html → Goldmark → Chroma highlighted HTML
- 404 handling verified: missing article → httpError 404 → 404.html served with back-link
- Markdown content negotiation still works (verified during Task 2 testing)
- Phase 3 (CSS/blog.css) is the next unblocked work
- Article front matter should quote date values to avoid time.Time formatting in output

---
*Phase: 02-rendering-pipeline*
*Completed: 2026-02-22*

## Self-Check: PASSED

- FOUND: templates/article.html
- FOUND: templates/404.html
- FOUND: css/syntax.css
- FOUND: 02-02-SUMMARY.md
- FOUND: commit 008e733 (feat: article.html and 404.html)
- FOUND: commit de786e5 (feat: syntax.css)
