# Architecture Research

**Domain:** Caddy-based Markdown blog with Tailscale Funnel
**Researched:** 2026-02-20
**Confidence:** HIGH (Caddy template pipeline, content negotiation); MEDIUM (Tailscale Funnel + Caddy TLS, CNAME via Terraform)

## Standard Architecture

### System Overview

```
Internet Client
      |
      | HTTPS (port 443)
      v
┌─────────────────────────────┐
│   Tailscale Funnel Relays   │  Public ingress; SNI-aware TCP proxy;
│   (Tailscale infrastructure) │  does NOT terminate TLS — passes
│                             │  encrypted TCP stream to node
└─────────────┬───────────────┘
              | Tailscale encrypted tunnel (WireGuard)
              v
┌─────────────────────────────┐
│   tailscaled daemon         │  On fedora.mist-walleye.ts.net;
│   (fedora.mist-walleye.ts.net) │  terminates TLS using Tailscale cert;
│                             │  forwards plain HTTP to Caddy
└─────────────┬───────────────┘
              | Plain HTTP (localhost:2019 or configured port)
              v
┌─────────────────────────────────────────────────────────┐
│                        Caddy                            │
│                                                         │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │  @markdown_raw  │    │     @browser (default)     │  │
│  │ Accept:         │    │  Accept: text/html or none  │  │
│  │ text/markdown   │    │                            │  │
│  │ (no text/html)  │    │                            │  │
│  └────────┬────────┘    └───────────┬────────────────┘  │
│           |                         |                   │
│           v                         v                   │
│  file_server (raw .md)    rewrite → template.html       │
│                           templates directive active     │
│                           include .md → splitFrontMatter │
│                           → markdown $parsed.Body        │
└─────────────────────────────────────────────────────────┘
              |
              v
┌─────────────────────────────┐
│   File System               │
│                             │
│   articles/*.md             │
│   templates/template.html   │
│   css/style.css             │
│   configs/Caddyfile         │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Terraform (local state)   │
│   Provider: tailscale/      │
│   tailscale                 │
│   Resources:                │
│   - tailscale_dns_*         │
│   - (CNAME via ext DNS)     │
└─────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Tailscale Funnel | Public-facing ingress; SNI proxy; routes internet traffic to tailnet node | `tailscale funnel --tls-terminated-tcp=443 tcp://localhost:8080` |
| tailscaled | TLS termination using Tailscale-issued cert; cert fetched from Tailscale CA | Daemon on fedora.mist-walleye.ts.net; cert fetched automatically |
| Caddy | HTTP request routing; content negotiation; Markdown-to-HTML rendering via Go templates | Single `Caddyfile`; `templates` directive + `file_server` |
| Go templates (in Caddy) | Render `.md` files as HTML: `include` path → `splitFrontMatter` → `markdown body` | `templates/template.html` |
| articles/ | Content storage; Markdown files with YAML front matter | `articles/my-post.md` |
| Terraform | Tailscale DNS configuration (nameservers, MagicDNS prefs) | `configs/terraform/main.tf` |
| CNAME record | `blog.mist-walleye.ts.net` → `fedora.mist-walleye.ts.net` | External DNS or Tailscale DNS when feature ships |

## Recommended Project Structure

```
blog/
├── articles/                  # Markdown posts with YAML front matter
│   ├── index.md               # Blog index/landing page
│   └── my-first-post.md       # Individual posts
│
├── templates/                 # Go HTML templates consumed by Caddy
│   ├── template.html          # Main layout: head, nav, footer
│   └── error.html             # Error page template
│
├── css/                       # Static stylesheets
│   └── style.css
│
├── scripts/                   # Operational scripts (deploy, reload)
│   └── reload.sh
│
└── configs/
    ├── Caddyfile              # Caddy configuration
    └── terraform/
        ├── main.tf            # Provider + resources
        ├── variables.tf
        └── terraform.tfstate  # Local state (gitignored)
```

### Structure Rationale

- **articles/:** All content in one place; clean URL mapping (`/articles/my-post` → `articles/my-post.md`)
- **templates/:** Separated from content; Caddy needs to know this path to block direct access
- **css/:** Referenced by templates; served as static files; no special Caddy handling needed
- **configs/:** Infrastructure-as-code grouped together; Caddyfile alongside Terraform

## Architectural Patterns

### Pattern 1: Caddy Template Rendering Pipeline

**What:** Caddy rewrites `.md` requests to a single HTML template file, which then uses template functions to include and render the original Markdown file.

**When to use:** Any request from a browser (Accept: text/html or no Accept header)

**Trade-offs:** No build step required; Markdown is rendered on each request (negligible for personal blog); Goldmark library gives CommonMark + GFM + footnotes + syntax highlighting

**Caddyfile:**
```caddyfile
blog.mist-walleye.ts.net {
    root * /srv/blog
    encode gzip

    # Block direct access to templates
    @templates {
        path /templates/*
        not path /templates/*.css /templates/*.js
    }
    handle @templates {
        error 403
    }

    # Content negotiation: raw Markdown for text/markdown clients
    @markdown_raw {
        header Accept *text/markdown*
        not header Accept *text/html*
    }
    handle @markdown_raw {
        header Content-Type "text/markdown; charset=utf-8"
        header Vary Accept
        file_server
    }

    # Browser path: rewrite .md requests to template
    @markdown_files {
        path_regexp \.md$
    }
    handle @markdown_files {
        rewrite * /templates/template.html
        templates
        file_server
    }

    # Also handle clean URLs (no .md extension)
    @clean_url {
        file {path}.md
    }
    handle @clean_url {
        rewrite * /templates/template.html
        templates
        file_server
    }

    file_server
    templates
}
```

**template.html (Go template):**
```html
<!DOCTYPE html>
<html>
<head>
    {{$md := (include .OriginalReq.URL.Path | splitFrontMatter)}}
    <title>{{$md.Meta.title}}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav><a href="/">Home</a></nav>
    <article>
        <h1>{{$md.Meta.title}}</h1>
        <time>{{$md.Meta.date}}</time>
        {{markdown $md.Body}}
    </article>
</body>
</html>
```

### Pattern 2: Content Negotiation via Accept Header

**What:** Route the same URL to raw `.md` or rendered HTML based on the `Accept` header. Browsers receive HTML; text/markdown clients (curl, LLM agents, Markdown-aware clients) receive raw Markdown.

**When to use:** Serve both humans (HTML) and machines (Markdown) from the same URL.

**Trade-offs:** Simple header matching in Caddy is sufficient — no plugin needed. Must send `Vary: Accept` response header so caches serve correct variant. The condition `not header Accept *text/html*` prevents matching browsers that send `Accept: */*` (which includes text/html).

**Matcher logic:**
```caddyfile
@markdown_raw {
    header Accept *text/markdown*
    not header Accept *text/html*
}
```

Clients that send `Accept: text/markdown` without `text/html` (e.g., curl with explicit header, LLM agents) receive raw `.md`. Browsers always include `text/html` in Accept, so they fall through to HTML rendering.

### Pattern 3: Tailscale Funnel + Caddy TLS

**What:** Tailscale Funnel provides public HTTPS ingress. Funnel proxies encrypted TCP (SNI-based, no TLS termination at Funnel). tailscaled on the local machine terminates TLS using a certificate from Tailscale's CA. Caddy then handles plain HTTP internally.

**When to use:** Personal server on a home or residential network without a static IP or open ports.

**Trade-offs:** Zero firewall configuration required; TLS cert is automatic via Tailscale CA; Funnel restricted to ports 443, 8443, 10000; Funnel relays can see metadata but not content (end-to-end encrypted).

**Setup:**
```bash
# Enable Funnel (persists across reboots with --bg)
tailscale funnel --tls-terminated-tcp=443 --bg tcp://localhost:8080

# Caddy cert permission (if running as non-root)
# In /etc/default/tailscaled:
TS_PERMIT_CERT_UID=caddy
```

**Caddyfile (Caddy handles ts.net cert automatically):**
```caddyfile
fedora.mist-walleye.ts.net {
    # Caddy auto-fetches cert from tailscaled for *.ts.net domains
    root * /srv/blog
    # ... rest of config
}
```

### Pattern 4: Terraform for Tailscale DNS

**What:** Use `tailscale/tailscale` Terraform provider to manage Tailscale network configuration as code. The CNAME `blog.mist-walleye.ts.net` → `fedora.mist-walleye.ts.net` is the goal, but MagicDNS does not yet support custom CNAME records (open issue since 2021).

**Workaround:** The Tailscale Terraform provider can manage MagicDNS preferences and nameservers. For the CNAME itself, use an external DNS provider's Terraform resource (e.g., Cloudflare `cloudflare_record`) if the domain is under external DNS, or accept using `fedora.mist-walleye.ts.net` directly until MagicDNS CNAME support ships.

**Confidence: MEDIUM** — MagicDNS CNAME is a known open feature request; the Tailscale provider does not expose a `tailscale_dns_record` resource as of 2026-02.

**main.tf skeleton:**
```hcl
terraform {
  required_providers {
    tailscale = {
      source  = "tailscale/tailscale"
      version = "~> 0.13"
    }
  }
}

provider "tailscale" {
  api_key = var.tailscale_api_key
  tailnet = var.tailnet
}

resource "tailscale_dns_preferences" "main" {
  magic_dns = true
}

# CNAME blog.mist-walleye.ts.net is NOT possible via Tailscale provider.
# Options:
# 1. Wait for MagicDNS custom record support (github.com/tailscale/tailscale/issues/1543)
# 2. Use external DNS with a CNAME to the public Funnel hostname
# 3. Access blog directly at fedora.mist-walleye.ts.net
```

## Data Flow

### Request Flow: Browser to HTML

```
Browser (Accept: text/html)
    |
    | HTTPS GET /articles/my-post.md
    v
Tailscale Funnel relay (public IP)
    | TCP proxy (SNI: blog.mist-walleye.ts.net)
    | No TLS termination at relay
    v
tailscaled on fedora.mist-walleye.ts.net
    | TLS termination (Tailscale cert for *.ts.net)
    | Forwards plain HTTP to Caddy
    v
Caddy (localhost:8080)
    | Matches @markdown_files (path ends in .md)
    | rewrite → /templates/template.html
    | templates directive active
    v
template.html execution
    | {{$md := (include "/articles/my-post.md" | splitFrontMatter)}}
    | Reads articles/my-post.md from disk
    | Splits YAML front matter from body
    | {{markdown $md.Body}} → Goldmark renders to HTML
    v
HTML response → Caddy → tailscaled → Funnel relay → Browser
```

### Request Flow: Markdown Client (LLM / curl)

```
curl -H "Accept: text/markdown" https://blog.../articles/my-post.md
    |
    v
[Funnel + tailscaled — same as above]
    v
Caddy
    | Matches @markdown_raw
    |   (Accept: *text/markdown*, NOT *text/html*)
    | Serves articles/my-post.md raw via file_server
    | Sets Content-Type: text/markdown
    | Sets Vary: Accept
    v
Raw Markdown response
```

### Key Data Flows

1. **Content path:** Markdown files live in `articles/`; never processed at rest; rendered on-demand per request
2. **TLS path:** Cert lives in tailscaled; Caddy fetches via Unix socket at request time (or cached); no cert files on disk managed by operator
3. **Template path:** `templates/template.html` is the single rendering entry point; all `.md` requests rewrite through it
4. **Terraform path:** `configs/terraform/` → Tailscale API; manages network-layer DNS config; does not touch Caddy or file system

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 reader | Current design is sufficient — no optimization needed |
| 100 readers | Caddy's built-in gzip + HTTP/2 handle this trivially; no changes |
| 10K readers | Tailscale Funnel has no documented throughput guarantee; add a CDN in front if needed; Caddy itself will not be the bottleneck |

### Scaling Priorities

1. **First bottleneck:** Tailscale Funnel relay throughput — undocumented; for personal blog traffic (hundreds of readers) this is irrelevant
2. **Second bottleneck:** Disk I/O for Markdown rendering — negligible; files are small and OS page cache handles them

## Real-World Reference: caddyserver.com Architecture

The official Caddy docs website (local clone at `/home/elendal/IdeaProjects/caddyserver-website`) uses this architecture directly. Key structural decisions observed:

```
src/
├── docs/
│   ├── index.html          ← THE template (Caddy template file, not served directly)
│   └── markdown/
│       ├── api.md           ← Content files (separate from URL structure)
│       └── caddyfile/
│           └── directives/
│               └── templates.md
├── includes/
│   ├── header.html
│   ├── footer.html
│   └── head.html
└── resources/
    └── css/
```

**URL → file mapping in their template:**
```
URL: /docs/caddyfile/directives/templates
→ $pathParts = ["", "docs", "caddyfile", "directives", "templates"]
→ $markdownFilename = "caddyfile/directives/templates"
→ $markdownFilePath = "/docs/markdown/caddyfile/directives/templates.md"
```

This separates URL structure from file storage — our blog can use a simpler flat mapping since articles don't have a deep hierarchy.

**Template path variable:**
- After `rewrite @notDirect /template.html`, inside the template:
  - `.Req.URL.Path` = `/template.html` (the rewritten path) — **DO NOT USE** for content lookup
  - `.OriginalReq.URL.Path` = `/articles/my-post` (what the browser requested) — **USE THIS**

## Anti-Patterns

### Anti-Pattern 1: Using Caddy v1 `markdown` Directive

**What people do:** Copy Caddy v1 documentation (`markdown /` with template path) into a v2 Caddyfile

**Why it's wrong:** The `markdown` directive was removed in Caddy v2. v2 uses the `templates` directive with explicit `include`, `splitFrontMatter`, and `markdown` template functions. The config will fail to parse.

**Do this instead:** Use `templates` directive + rewrite pattern + `template.html` with `{{markdown $md.Body}}`

### Anti-Pattern 2: Letting Funnel Terminate TLS and Proxying HTTP to Caddy

**What people do:** Use `tailscale funnel --https=443 localhost:8080` so Funnel acts as HTTPS reverse proxy to a plain-HTTP Caddy

**Why it's wrong:** Caddy cannot obtain its own Tailscale TLS certificate in this mode (tailscaled terminates TLS, not Caddy), which means Caddy runs plain HTTP. This is functional but loses Caddy's `*.ts.net` cert integration and complicates future tailnet-internal HTTPS routing.

**Do this instead:** Use `--tls-terminated-tcp=443` so Caddy handles TLS termination with the Tailscale cert, preserving Caddy's full HTTPS stack.

### Anti-Pattern 3: Storing Templates Inside articles/

**What people do:** Put HTML templates alongside Markdown content in a flat directory

**Why it's wrong:** Without the `handle @templates { error 403 }` block, templates are publicly downloadable. Users requesting `/templates/template.html` directly would get the raw Go template source.

**Do this instead:** Keep templates in a separate `templates/` directory and explicitly block access via a Caddy matcher + `error 403`.

### Anti-Pattern 4: Assuming Tailscale CNAME Works Out of the Box

**What people do:** Create `blog.mist-walleye.ts.net` as a CNAME in MagicDNS or Terraform, expecting it to resolve

**Why it's wrong:** MagicDNS does not support custom CNAME records as of 2026-02 (open issue: github.com/tailscale/tailscale/issues/1543). The Tailscale Terraform provider has no `tailscale_dns_record` resource.

**Do this instead:** Access blog at `fedora.mist-walleye.ts.net` directly within tailnet, or use an external DNS provider for the `blog.*` alias pointing to the public Funnel endpoint.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Tailscale CA | Caddy fetches cert via tailscaled Unix socket | Automatic for `*.ts.net` domains; requires `TS_PERMIT_CERT_UID` if non-root |
| Tailscale Funnel relays | `tailscale funnel --tls-terminated-tcp=443 --bg tcp://localhost:8080` | Public ingress; ports: 443, 8443, 10000 only |
| Tailscale API | Terraform provider for DNS preferences | API key required; set via `TAILSCALE_API_KEY` env var |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Funnel relay ↔ tailscaled | WireGuard tunnel (Tailscale) | Encrypted; SNI-based TCP proxy; no HTTP awareness |
| tailscaled ↔ Caddy | localhost TCP (e.g., :8080) | Plain HTTP; TLS terminated by tailscaled |
| Caddy ↔ File System | Direct file reads | `root * /srv/blog`; template `include` reads `.md` files |
| Caddy ↔ tailscaled (cert) | Unix socket or local API | For fetching `*.ts.net` TLS cert; automatic |
| Terraform ↔ Tailscale API | HTTPS REST (api.tailscale.com) | Manages DNS prefs; no file system involvement |

## Build Order Implications

Dependencies between components determine phase sequencing:

1. **Tailscale + Funnel first** — Everything else sits behind Funnel; verify public access before building content layer
2. **Caddy basic file serving** — Get Caddy running on the local port Funnel targets; confirm TLS cert works via tailscaled
3. **Content negotiation routing** — Add Accept header matchers; test with curl before adding template complexity
4. **Template rendering pipeline** — Add `templates` directive, `template.html`, test Markdown rendering
5. **Terraform DNS config** — Wrap DNS preferences in code after manual setup is confirmed working
6. **CNAME resolution** — Defer until Tailscale MagicDNS CNAME support ships, or use external DNS workaround

## Sources

- Caddy templates directive: https://caddyserver.com/docs/caddyfile/directives/templates (HIGH)
- Caddy template functions (splitFrontMatter, markdown, include): https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/templates (HIGH)
- Caddy markdown example: https://github.com/caddyserver/examples/tree/master/markdown (MEDIUM — archived v1 example)
- caddy-markdown-site complete Caddyfile: https://github.com/dbohdan/caddy-markdown-site/blob/master/Caddyfile (HIGH)
- Serving .md as HTML TIL: https://til.jakelazaroff.com/caddy/serve-markdown-files-as-html/ (HIGH)
- Content negotiation Accept header: https://www.skeptrune.com/posts/use-the-accept-header-to-serve-markdown-instead-of-html-to-llms/ (HIGH)
- Caddy header matcher syntax: https://caddyserver.com/docs/caddyfile/matchers (HIGH)
- Tailscale Funnel docs: https://tailscale.com/kb/1311/tailscale-funnel (HIGH)
- Tailscale Funnel architecture: https://tailscale.com/docs/features/tailscale-funnel (HIGH)
- Caddy + Tailscale TLS certs: https://tailscale.com/kb/1190/caddy-certificates (HIGH)
- Tailscale Terraform provider: https://tailscale.com/kb/1210/terraform-provider (HIGH)
- MagicDNS CNAME feature request (open): https://github.com/tailscale/tailscale/issues/1543 (HIGH — confirms limitation)
- Tailscale Funnel intro: https://tailscale.com/blog/introducing-tailscale-funnel (MEDIUM)

---
*Architecture research for: Caddy + Tailscale Markdown blog*
*Researched: 2026-02-20*
