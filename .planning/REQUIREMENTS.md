# Requirements: Personal Blog

**Defined:** 2026-02-21
**Core Value:** Markdown files are the single source of truth — write a `.md` file and it's immediately accessible as a beautiful HTML page to browsers and as raw Markdown to API/CLI consumers.

## v1.0 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Blog files are organized in a structured directory layout (`articles/`, `templates/`, `css/`, `scripts/`, `configs/`)
- [x] **INFRA-02**: Tailscale daemon is permitted to issue TLS certs to the Caddy user (`TS_PERMIT_CERT_UID=caddy` in `/etc/default/tailscaled`)
- [x] **INFRA-03**: Caddy serves the blog over HTTPS using a Tailscale-issued `*.ts.net` TLS certificate (`get_certificate tailscale`)
- [x] **INFRA-04**: Tailscale Funnel exposes the blog to the public internet on HTTPS port 443
- [x] **INFRA-05**: Blog is accessible from an external browser (outside the tailnet) over HTTPS

### Rendering

- [x] **REND-01**: Caddy rewrites article URLs to an HTML template for Markdown-to-HTML rendering
- [ ] **REND-02**: HTML template reads the Markdown file using `.OriginalReq.URL.Path` and renders it via Goldmark
- [ ] **REND-03**: Template returns HTTP 404 for missing articles (using `fileExists` guard)
- [ ] **REND-04**: Template displays article title and date from YAML front matter
- [ ] **REND-05**: Code blocks are syntax-highlighted via Chroma (CSS theme file served alongside blog CSS)
- [x] **REND-06**: Caddy serves raw Markdown to clients sending `Accept: text/markdown` without `Accept: text/html`
- [x] **REND-07**: HTTP responses include `Vary: Accept` header when content negotiation is active

### Styling

- [ ] **STYL-01**: HTML template provides a clean blog layout with readable typography
- [ ] **STYL-02**: Every post page includes a navigation link back to the blog index
- [ ] **STYL-03**: CSS layout is mobile-responsive
- [x] **STYL-04**: Templates directory is blocked from direct browser access (403)

### Metadata

- [ ] **META-01**: Template includes Open Graph meta tags (`og:title`, `og:description`) populated from front matter

### Sample Content

- [ ] **SAMP-01**: Blog index page exists as `articles/index.md` listing available articles
- [ ] **SAMP-02**: At least one sample article validates the full rendering pipeline end-to-end

## v2.0 Requirements

Deferred to next milestone.

### Infrastructure as Code

- **TERR-01**: Terraform manages Tailscale MagicDNS preferences
- **TERR-02**: Terraform codifies Tailscale DNS nameserver configuration
- **TERR-03**: `blog.mist-walleye.ts.net` CNAME or alias is configured (pending Tailscale MagicDNS support for CNAME — GitHub issue #1543)

### Polish

- **POLS-01**: CSS dark mode via `prefers-color-scheme` media query
- **POLS-02**: RSS/Atom feed generated from article front matter
- **POLS-03**: `robots.txt` for search engine discoverability
- **POLS-04**: `sitemap.xml` for search engine indexing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dynamic CMS or database | Static Markdown files only — violates core value |
| Comments system | Requires dynamic backend; not a static blog |
| Search functionality | Client-side JS indexes add complexity without value at personal blog scale |
| User authentication | Public read-only blog; Tailscale ACLs handle network-level access |
| Terraform (v1.0) | Deferred — blog must work before codifying infra; Terraform adds no new capability |
| Dark mode (v1.0) | Deferred — polish after core rendering pipeline is stable |
| Pagination | Only needed at 50+ posts; flat dated list works at personal blog scale |
| Tags/categories | Dynamic filtering requires JS or server logic; not worth the complexity pre-50 posts |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| REND-01 | Phase 2 | Complete |
| REND-02 | Phase 2 | Pending |
| REND-03 | Phase 2 | Pending |
| REND-04 | Phase 2 | Pending |
| REND-05 | Phase 2 | Pending |
| REND-06 | Phase 2 | Complete |
| REND-07 | Phase 2 | Complete |
| STYL-04 | Phase 2 | Complete |
| STYL-01 | Phase 3 | Pending |
| STYL-02 | Phase 3 | Pending |
| STYL-03 | Phase 3 | Pending |
| META-01 | Phase 3 | Pending |
| SAMP-01 | Phase 4 | Pending |
| SAMP-02 | Phase 4 | Pending |

**Coverage:**
- v1.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
