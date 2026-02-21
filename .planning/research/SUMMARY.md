# Project Research Summary

**Project:** Personal Markdown Blog (Caddy + Tailscale + Terraform)
**Domain:** Static Markdown blog served at runtime via Caddy on Fedora, exposed publicly via Tailscale Funnel
**Researched:** 2026-02-21
**Confidence:** HIGH (stack, pitfalls, architecture); MEDIUM (Terraform CNAME workaround)

## Executive Summary

This is a zero-build-step personal blog where Markdown files are served and rendered at request time by Caddy's built-in `templates` handler. The approach is validated at the highest level: caddyserver.com itself uses this exact pattern. Caddy v2 reads `.md` files from disk, routes them through Go HTML templates that call `include`, `splitFrontMatter`, and `markdown` template functions, and returns rendered HTML to browsers — while simultaneously serving raw Markdown to API clients and LLM agents via content negotiation on the `Accept` header. Tailscale Funnel handles public internet ingress without requiring firewall changes or a static IP, and Tailscale's CA provides automatic `*.ts.net` TLS certificates fetched directly by Caddy.

The recommended approach is a three-phase build: first get the serving infrastructure (Caddy + Tailscale Funnel + TLS) confirmed working end-to-end, then build the Markdown rendering pipeline and content negotiation, then wrap Tailscale DNS configuration in Terraform. This ordering follows the dependency chain identified in ARCHITECTURE.md — everything downstream depends on Funnel working, and Terraform is a codification layer that does not block function. The stack requires no custom Caddy builds, no plugins, no database, and no build pipeline. Writing a `.md` file is sufficient to publish a post.

The single most important risk is the Tailscale MagicDNS CNAME limitation: `blog.mist-walleye.ts.net` as a CNAME for `fedora.mist-walleye.ts.net` cannot be created via Terraform or MagicDNS as of February 2026 (open issue since 2021). The project must either use the machine's actual hostname, create a device alias manually in the Tailscale admin console, or defer this requirement. This does not block the blog from functioning — it only affects the vanity hostname. Every other aspect of the stack is well-documented with HIGH-confidence sources.

## Key Findings

### Recommended Stack

Caddy v2.9.x is the right choice and requires no plugins for this use case. The `templates` directive activates Caddy's Goldmark (CommonMark + GFM + footnotes) and Chroma (syntax highlighting) pipeline, and the `get_certificate tailscale` Caddyfile option fetches `*.ts.net` TLS certificates from the local `tailscaled` daemon automatically. On Fedora, Caddy runs as the `caddy` user, which requires `TS_PERMIT_CERT_UID=caddy` in `/etc/default/tailscaled` — without this, TLS fails at startup. The Terraform `tailscale/tailscale` provider at v0.28.x manages MagicDNS preferences and nameservers but has no `tailscale_dns_record` resource; the CNAME goal requires manual admin console intervention.

**Core technologies:**
- **Caddy 2.9.x**: Web server, TLS termination, Markdown rendering — single binary with all required capabilities built in; no custom build needed
- **Tailscale (>=1.52)**: VPN mesh, public ingress via Funnel, TLS certificate issuer — `tailscale funnel` (not `tailscale serve`) for public access
- **Terraform 1.9.x + tailscale/tailscale v0.28.x**: Declarative DNS config management — use OAuth credentials, not expiring API keys; CNAME not possible via Terraform
- **Goldmark + Chroma (bundled in Caddy)**: Markdown rendering and syntax highlighting — automatic, no separate install; requires a Chroma CSS theme file to be served

**What NOT to use:** `caddy-tailscale` plugin (experimental), `davidsbond/tailscale` Terraform provider (unmaintained), Caddy v1 `markdown` directive (removed), `tailscale serve` (tailnet-only), Tailscale API keys for Terraform (expiring).

### Expected Features

The MVP is a lean set of features that produces a genuinely usable blog. The most important non-obvious inclusion in v1 is content negotiation — it is a core project differentiator and is cheap to implement in Caddy. The most important non-obvious omission is pagination and tags — these add complexity without value at personal blog scale.

**Must have (table stakes):**
- Individual post pages rendering Markdown as HTML via Caddy templates
- Readable CSS layout with typography and mobile responsiveness
- Frontmatter handling (title, date extracted and rendered)
- Blog index/listing page — hand-maintained `index.md` (Caddy cannot auto-enumerate and sort `.md` files by frontmatter date)
- Navigation: home link on every post page
- Content negotiation: HTML to browsers, raw `.md` to `Accept: text/markdown` clients without `text/html`
- Chroma CSS theme file served alongside blog CSS (syntax highlighting emits CSS classes, not inline styles)
- Tailscale Funnel active with Caddy TLS via Tailscale cert
- Terraform managing Tailscale DNS preferences
- Sample article validating the full pipeline

**Should have (add after validation):**
- Dark mode via CSS `prefers-color-scheme` — zero JS, pure CSS
- Open Graph tags from frontmatter — low effort, needed before first social share
- RSS/Atom feed — requires a shell script; add when first reader subscribes
- `robots.txt` — add before seeking search engine indexing

**Defer (v2+):**
- `sitemap.xml`, table of contents, estimated reading time, anchor links on headings, `Content-Signal` header

**Firm anti-features:** Comments system, full-text search, CMS/admin UI, pagination, real-time features. These violate the no-database, no-build-step constraint.

### Architecture Approach

The system is a three-tier pipeline: Tailscale Funnel (SNI-aware TCP proxy, no TLS termination) → `tailscaled` on the Fedora host (TLS termination using Tailscale CA cert) → Caddy (HTTP routing, content negotiation, Markdown rendering). Caddy's internal routing splits on the `Accept` header: `text/markdown` without `text/html` gets raw file serving; everything else gets rewritten to `templates/post.html` which executes as a Go template. Terraform manages the Tailscale network layer independently of Caddy and the file system.

**Major components:**
1. **Tailscale Funnel + tailscaled** — Public ingress and TLS; zero firewall config; cert auto-managed by Tailscale CA
2. **Caddy with `templates` directive** — HTTP routing, content negotiation, on-demand Markdown-to-HTML rendering
3. **Go HTML template (`templates/post.html`)** — Single rendering entry point; uses `include .OriginalReq.URL.Path`, `splitFrontMatter`, `markdown` functions
4. **`articles/` directory** — Content storage; Markdown files with YAML frontmatter; no build step required
5. **Terraform (`configs/terraform/`)** — Declarative Tailscale DNS configuration; independent of Caddy

**File structure:**
```
blog/
├── articles/          # Markdown posts + index.md
├── templates/         # Go HTML templates (block direct access via Caddy)
├── css/               # Stylesheets including Chroma theme
├── scripts/           # Operational scripts
└── configs/
    ├── Caddyfile
    └── terraform/
```

### Critical Pitfalls

1. **`.Req.URL.Path` in templates after rewrite** — After `rewrite`, this variable holds the rewritten path (e.g., `/templates/post.html`), not the original URL. Use `.OriginalReq.URL.Path` everywhere in templates. This is the single most common silent failure mode; it produces blank content with HTTP 200.

2. **Templates directive ignores `.md` MIME type** — Caddy's `templates` directive only processes `text/html` and `text/plain` responses. Rewriting to a `.html` template file (not a `.md` file) is required; the `.html` extension triggers the correct Content-Type. Rewriting to `.md` causes templates to silently skip processing and return raw Markdown source.

3. **Missing `TS_PERMIT_CERT_UID=caddy`** — Caddy runs as the `caddy` user post-install; tailscaled restricts cert access by UID. Without this setting in `/etc/default/tailscaled` + `systemctl restart tailscaled`, Caddy fails to obtain its TLS certificate at startup.

4. **`tailscale serve` vs `tailscale funnel`** — `serve` is tailnet-internal only. `funnel` is required for public internet exposure. Using the wrong command leaves the blog accessible only within the Tailscale network.

5. **Tailscale MagicDNS CNAME does not exist** — No Terraform resource, no MagicDNS feature. Use the machine's actual hostname (`fedora.mist-walleye.ts.net`) or set a device alias manually via the Tailscale admin console. Do not attempt to create via Terraform.

6. **Template source exposure** — Without `handle @templates { error 403 }` in the Caddyfile, users can download raw Go template source by requesting `/templates/post.html` directly.

7. **SELinux blocking Caddy on Fedora** — Store blog files under `/srv/blog` (allowed by default SELinux policy) or apply `semanage fcontext` labels. Symptom: 403/500 on files that exist and have correct Unix permissions.

8. **No `fileExists` check before `include`** — Missing files return empty content with HTTP 200 (silent 404). Guard every `include` with `if not (fileExists $path) | httpError 404`. This is the pattern used by caddyserver.com itself.

## Implications for Roadmap

Based on research, the natural dependency chain produces three phases: infrastructure first (Funnel + TLS are load-bearing for everything else), then content rendering (the Caddy template pipeline is the core product), then infrastructure-as-code (Terraform codifies what's already working).

### Phase 1: Infrastructure Foundation

**Rationale:** Tailscale Funnel and Caddy TLS are prerequisites for every other phase. The blog cannot serve any content until the public ingress chain (Funnel → tailscaled → Caddy) is confirmed end-to-end. Validating this first avoids building a content pipeline in isolation and discovering network issues late.

**Delivers:** A publicly accessible HTTPS endpoint returning a static HTML hello-world page at the Tailscale hostname.

**Addresses:** Tailscale Funnel active, Caddy TLS via Tailscale cert (P1 features from FEATURES.md)

**Avoids:** Pitfall 3 (TS_PERMIT_CERT_UID), Pitfall 4 (serve vs funnel), Pitfall 6 (SELinux), Pitfall 7 (template exposure)

**Tasks:** Install Caddy from COPR, set `TS_PERMIT_CERT_UID=caddy`, restart tailscaled, run `tailscale funnel --bg --tls-terminated-tcp=443 tcp://localhost:8080`, configure basic Caddyfile, confirm HTTPS from external browser.

### Phase 2: Markdown Rendering Pipeline

**Rationale:** With infrastructure confirmed, build the content layer. Content negotiation and the template pipeline are tightly coupled (they share the same Caddyfile matchers and the same `.md` file paths) and should be implemented together to avoid revisiting the Caddyfile twice.

**Delivers:** A fully functional blog: individual post pages rendering Markdown as HTML, content negotiation serving raw `.md` to API clients, readable CSS layout, syntax highlighting, frontmatter (title, date), home navigation, blog index page, and a sample article validating the end-to-end pipeline.

**Uses:** Caddy `templates` directive, `splitFrontMatter`, `markdown`, Goldmark, Chroma CSS theme, Go HTML template in `templates/post.html`

**Implements:** Template rendering pipeline (Architecture component 3), `articles/` content store (component 4)

**Avoids:** Pitfall 1 (OriginalReq.URL.Path), Pitfall 2 (MIME type filtering), Pitfall 8 (Caddy v1 markdown directive), Pitfall 10 (fileExists guard)

**Tasks:** Create directory structure (`articles/`, `templates/`, `css/`), write `templates/post.html` using `.OriginalReq.URL.Path`, add Caddyfile matchers for content negotiation and markdown rewrite, add `Vary: Accept` header, serve Chroma CSS theme, write and publish sample article, validate HTML rendering and raw Markdown delivery via curl.

### Phase 3: Terraform Infrastructure-as-Code

**Rationale:** Terraform codifies the Tailscale configuration that is already working. It does not unlock new functionality — it makes the configuration reproducible and version-controlled. Doing this after Phase 1 and 2 are confirmed working avoids debugging Terraform and Caddy simultaneously.

**Delivers:** Tailscale DNS preferences (MagicDNS enabled) managed by Terraform; Caddyfile and blog structure committed to the repository; CNAME situation resolved or explicitly deferred.

**Uses:** `tailscale/tailscale` provider v0.28.x, OAuth credentials (not API key)

**Avoids:** Pitfall 5 (CNAME does not exist — use machine hostname or admin console alias), Pitfall 9 (OAuth vs API key)

**Tasks:** Set up Terraform workspace in `configs/terraform/`, configure provider with OAuth client, add `tailscale_dns_preferences` resource, run `terraform plan` and `apply`, create machine alias in Tailscale admin console (manual step), update Caddyfile to use the alias hostname if alias was created, commit `terraform.tfstate` to `.gitignore`.

### Phase 4: Polish and Discovery Features

**Rationale:** Once the core reading experience is validated, add discoverability features that require no architectural changes — pure additions on top of the existing template and CSS layer.

**Delivers:** Dark mode, Open Graph tags, RSS/Atom feed (shell-script generated), `robots.txt`.

**Addresses:** P2 features from FEATURES.md

**Tasks:** Add `@media (prefers-color-scheme: dark)` to CSS, add `<meta property="og:*">` to template from frontmatter, write RSS feed generator script, create static `robots.txt`.

### Phase Ordering Rationale

- **Infrastructure before content:** The Funnel + tailscaled → Caddy chain has multiple potential failure points (TS_PERMIT_CERT_UID, SELinux, funnel vs serve confusion). Isolating these in Phase 1 means Phase 2 can focus purely on template logic.
- **Content negotiation with rendering, not separately:** The `@markdown_raw` and `@markdown_files` matchers share a Caddyfile and the same file paths. Implementing them together avoids a second Caddyfile rewrite pass.
- **Terraform last:** It manages what's already working; adding it earlier introduces a second failure domain during debugging.
- **Polish last:** Dark mode and OG tags require stable CSS and template structure; doing them after the core rendering pipeline is locked prevents rework.

### Research Flags

Phases with standard patterns (research already complete):
- **Phase 1:** Infrastructure setup is fully documented in official Tailscale and Caddy docs; all commands verified. No additional research needed.
- **Phase 2:** Template rendering pattern is validated against caddyserver.com source. All template functions documented in official Caddy pkg.go.dev. No additional research needed.
- **Phase 3:** Terraform resources confirmed via registry.terraform.io. CNAME limitation confirmed via GitHub issue. No surprises expected.
- **Phase 4:** Pure CSS and HTML work; no research needed.

Phases that may need targeted research during implementation:
- **Phase 2 (RSS feed):** Shell script to generate Atom/RSS XML from frontmatter is not Caddy-specific; a one-time search for a minimal shell template may be useful when that feature is reached in Phase 4.
- **Phase 3 (CNAME):** Monitor Tailscale issue #1543 status. If Terraform support ships before this phase begins, the manual admin console step can be replaced with a `tailscale_dns_record` resource.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies sourced from official docs; versions confirmed; caddyserver.com validates the pattern in production |
| Features | HIGH | Table stakes and anti-features are clear; content negotiation priority confirmed by Feb 2026 AI agent ecosystem state |
| Architecture | HIGH | Caddy template pipeline and Funnel/TLS architecture confirmed against official docs and real codebase |
| Pitfalls | HIGH | Sourced from direct observation of caddyserver.com source + official Tailscale/Caddy docs; not inferred |
| Terraform CNAME | LOW | Feature does not exist; workaround is manual; no timeline from Tailscale |

**Overall confidence:** HIGH

### Gaps to Address

- **CNAME hostname**: Decide before Phase 3 whether to use `fedora.mist-walleye.ts.net` directly or create an alias via the Tailscale admin console. The Caddyfile site address depends on this choice. The admin console alias approach is recommended since it does not require waiting for Tailscale to ship Terraform CNAME support.
- **Blog index maintenance strategy**: No build step means no auto-sorted index. Either hand-maintain `articles/index.md` in reverse chronological order (simple, explicit) or write a shell script that generates it from frontmatter. Choose before Phase 2 so the index format is consistent from the first post.
- **Chroma theme selection**: The specific Chroma CSS theme (e.g., monokai, github, dracula) should be chosen before Phase 2 to avoid a CSS rework. The theme file is a static download from the Chroma repository.

## Sources

### Primary (HIGH confidence)

- [caddyserver.com Caddyfile — local clone](https://github.com/caddyserver/website) — validated template pattern, OriginalReq.URL.Path usage, try_files pattern
- [Caddy templates directive — official docs](https://caddyserver.com/docs/caddyfile/directives/templates) — template handler behavior, MIME type filtering
- [Caddy template functions — pkg.go.dev](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/templates) — splitFrontMatter, markdown, include, fileExists
- [Tailscale Caddy certificates — official docs](https://tailscale.com/kb/1190/caddy-certificates) — TS_PERMIT_CERT_UID requirement, get_certificate tailscale
- [Tailscale Funnel CLI reference — official docs](https://tailscale.com/kb/1311/tailscale-funnel) — funnel vs serve distinction, --tls-terminated-tcp flag
- [Tailscale Terraform provider — registry.terraform.io](https://registry.terraform.io/providers/tailscale/tailscale/latest/docs) — v0.28.x resource inventory (confirms no tailscale_dns_record)
- [Tailscale MagicDNS CNAME — GitHub issue #1543](https://github.com/tailscale/tailscale/issues/1543) — confirms CNAME limitation open since 2021
- [Tailscale Terraform provider — GitHub](https://github.com/tailscale/terraform-provider-tailscale) — v0.28.0, released 2026-02-19

### Secondary (MEDIUM confidence)

- [Serve Markdown as HTML — TIL jakelazaroff.com](https://til.jakelazaroff.com/caddy/serve-markdown-files-as-html/) — practical Caddyfile example, confirms rewrite pattern
- [Content negotiation for AI agents — Checkly blog, Feb 2026](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) — confirms Claude Code sends Accept: text/markdown
- [Use Accept header to serve Markdown — skeptrune.com](https://www.skeptrune.com/posts/use-the-accept-header-to-serve-markdown-instead-of-html-to-llms/) — practical Caddyfile content negotiation example
- [SELinux + Caddy on Fedora — GitHub issue #5622](https://github.com/tailscale/tailscale/issues/5622) — issue resolved in Fedora 41 fresh install; older versions may need semanage

### Tertiary (LOW confidence)

- Tailscale admin console device alias behavior — not formally documented; behavior inferred from community reports; validate during Phase 3

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
