# Roadmap: Personal Blog

## Overview

Four phases that track the natural dependency chain: get public HTTPS working first (nothing else can be validated without it), then build the Markdown rendering pipeline (the core product), then layer on presentation polish, then prove everything works with real content. Each phase delivers something fully verifiable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure** - Caddy + Tailscale Funnel + HTTPS end-to-end, accessible from public internet
- [x] **Phase 2: Rendering Pipeline** - Caddyfile content negotiation, Go HTML template, Markdown-to-HTML serving
- [ ] **Phase 3: Styling and Metadata** - Clean layout, mobile CSS, back navigation, Open Graph tags
- [ ] **Phase 4: Sample Content** - Index page and sample article validating the full pipeline

## Phase Details

### Phase 1: Infrastructure
**Goal**: The blog is publicly reachable over HTTPS with a valid Tailscale TLS certificate
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Repository has the required directory structure: `articles/`, `templates/`, `css/`, `scripts/`, `configs/`
  2. Caddy serves HTTPS using a `*.ts.net` certificate issued by Tailscale (no browser TLS warning)
  3. Tailscale Funnel is active and routing public internet traffic to Caddy on port 443
  4. A browser outside the tailnet can load the blog URL and receive an HTTP 200 response over HTTPS
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Host setup: /srv/blog directory layout + TS_PERMIT_CERT_UID tailscaled config
- [x] 01-02-PLAN.md — Caddy TLS config: Caddyfile symlink + enable Caddy HTTPS with Tailscale cert
- [x] 01-03-PLAN.md — Funnel + external verify: enable Tailscale Funnel + human checkpoint for public HTTPS

### Phase 2: Rendering Pipeline
**Goal**: Markdown files are served as rendered HTML to browsers and as raw Markdown to API clients
**Depends on**: Phase 1
**Requirements**: REND-01, REND-02, REND-03, REND-04, REND-05, REND-06, REND-07, STYL-04
**Success Criteria** (what must be TRUE):
  1. A browser request to an article URL receives rendered HTML with title and date from YAML front matter
  2. `curl -H "Accept: text/markdown"` against an article URL returns raw Markdown content (not HTML)
  3. Responses from the blog include a `Vary: Accept` header
  4. Requesting a non-existent article returns HTTP 404 (not a blank 200)
  5. Code blocks in articles display with syntax highlighting; direct requests to `/templates/` return HTTP 403
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Caddyfile Phase 2: content negotiation routing, whitelist, 404 handler
- [x] 02-02-PLAN.md — Templates + Chroma CSS: article.html, 404.html, css/syntax.css
- [x] 02-03-PLAN.md — End-to-end verification: human checkpoint against public URL

### Phase 3: Styling and Metadata
**Goal**: Every page is readable, navigable, mobile-friendly, and carries Open Graph metadata
**Depends on**: Phase 2
**Requirements**: STYL-01, STYL-02, STYL-03, META-01
**Success Criteria** (what must be TRUE):
  1. Article pages render with readable typography and a clean layout (no raw default browser styling)
  2. Every article page has a visible navigation link that returns to the blog index
  3. The blog layout is usable on a mobile viewport (no horizontal scroll, readable font size)
  4. `curl -s <article-url> | grep og:title` returns a populated Open Graph title tag from the article's front matter
**Plans**: TBD

### Phase 4: Sample Content
**Goal**: Real content proves every pipeline component works end-to-end
**Depends on**: Phase 3
**Requirements**: SAMP-01, SAMP-02
**Success Criteria** (what must be TRUE):
  1. `articles/index.md` exists and renders as the blog's index page listing available articles
  2. At least one sample article renders correctly as HTML in a browser with title, date, and syntax-highlighted code
  3. The same sample article delivers raw Markdown when requested with `Accept: text/markdown`
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure | 3/3 | Complete | 2026-02-21 |
| 2. Rendering Pipeline | 3/3 | Complete | 2026-02-22 |
| 3. Styling and Metadata | 0/TBD | Not started | - |
| 4. Sample Content | 0/TBD | Not started | - |
