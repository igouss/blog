# Phase 2: Rendering Pipeline - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Caddyfile content negotiation + Go HTML template that renders Markdown as HTML for browsers and returns raw Markdown for API clients. Covers URL routing, article template, 404 handling, syntax highlighting, and directory access control. Styling/typography comes in Phase 3 — this phase wires up the full pipeline with minimal but functional HTML.

</domain>

<decisions>
## Implementation Decisions

### Article HTML output
- Template renders: title (from front matter) + date only — no author or other fields
- Template includes a `<link>` to the CSS file now, even though it doesn't exist until Phase 3 — avoids rework
- Title/heading placement: Claude's discretion (standard blog practice)
- Template filename: Claude's discretion (e.g., `templates/article.html`)
- Also create an `images/` directory in Phase 2 (currently missing from repo)

### Directory access control
- Caddy uses a **whitelist** approach: only allow requests to explicitly permitted paths
- Whitelisted directories: `articles/`, `css/`, `scripts/`, `images/`
- All other paths (including `templates/`, `configs/`, and anything else) return HTTP 403
- Implementation: Caddy route/respond directives (not template logic)

### URL structure
- Clean URLs: `/articles/my-post` (no `.md` extension) — Caddy rewrites internally
- `/articles/` (with no slug) serves `articles/index.md` if it exists, otherwise 404
- `/` (blog root) serves `articles/index.md` directly — no redirect, same pipeline
- Content negotiation applies to article URLs only (`/articles/*` and `/`) — CSS and other assets serve as-is

### Content negotiation
- `Accept: text/markdown` → raw Markdown with `Content-Type: text/markdown`
- All other Accept headers (including `*/*` and no header) → rendered HTML (Claude decides conventional default)
- `Vary: Accept` header on all article responses (correct per HTTP spec)
- Content negotiation scoped to articles only

### Syntax highlighting
- Chroma theme: **github** (light)
- CSS output: separate file at `css/syntax.css` (not inline styles, not embedded in main CSS)
- No line numbers
- Fenced code blocks without a language tag: apply default code styling (monospace font + background) without color highlighting

### 404 page
- Missing article returns a full HTML response using the article template (not plain text, not minimal HTML)
- Includes navigation link: `← Back to articles` pointing to `/`
- Links to main blog CSS only (not `css/syntax.css` — no code blocks on 404 page)
- Respects `Accept` header: `Accept: text/markdown` returns a plain-text Markdown-formatted 404 message; all others return HTML

### Claude's Discretion
- Whether article title appears as `<h1>` in body vs only in `<title>` tag — standard blog practice
- Template filename within `templates/`
- Default content negotiation behavior for `Accept: */*` — conventional HTTP behavior
- Exact `Vary: Accept` scope (all responses vs HTML-only — HTTP spec correctness)
- Exact 404 Markdown response body format

</decisions>

<specifics>
## Specific Ideas

- The whitelist approach came from the user: "there are other directories here too, block access to them, only whitelist directories used for blog" — the requirement is broader than just blocking `/templates/`
- `images/` directory should be created even though no images exist yet — it's whitelisted and ready to use

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-rendering-pipeline*
*Context gathered: 2026-02-21*
