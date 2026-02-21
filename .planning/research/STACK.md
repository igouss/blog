# Stack Research

**Domain:** Personal Markdown blog — Caddy + Tailscale Funnel
**Researched:** 2026-02-20
**Confidence:** MEDIUM-HIGH (Caddy templates and Tailscale TLS: HIGH; CNAME via Terraform: LOW — feature not natively supported)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Caddy | 2.9.x (stable, released 2024-12-31) | Web server, TLS termination, Markdown rendering | Built-in `templates` handler renders Markdown via Goldmark (CommonMark + GFM + footnotes + Chroma syntax highlighting); native Tailscale TLS cert fetching since v2.5; single binary, no external dependencies |
| Tailscale | Latest stable (≥1.52) | VPN mesh, TLS certs, Funnel internet exposure | Funnel feature (GA in ≥1.52) exposes local ports to internet without firewall changes; provides `*.ts.net` TLS certificates fetched directly by Caddy |
| Terraform | 1.9.x+ | Declarative Tailscale config management | Reproducible, version-controlled infrastructure config; official Tailscale provider (v0.28.x) manages ACLs, DNS, auth keys |
| Terraform Provider: tailscale | 0.28.x (latest, 2026-02-19) | Manage Tailscale tailnet via Terraform | Official provider maintained by Tailscale; supports ACLs, DNS nameservers, device tags, tailnet keys |

### Supporting Libraries / Modules

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Goldmark (built into Caddy) | bundled with Caddy | Markdown-to-HTML conversion | Automatically used by Caddy `templates` handler; no separate install |
| Chroma (built into Caddy) | bundled with Caddy | Syntax highlighting in code blocks | Automatically enabled when Goldmark renders fenced code blocks |
| Go `text/template` (built into Caddy) | bundled with Caddy | HTML template rendering for blog layout | Used in `templates/` directory HTML files that wrap rendered Markdown |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `xcaddy` | Build Caddy with custom modules | Only needed if you require third-party Caddy modules (e.g., `caddy-conneg`). Standard Caddy from COPR covers this project's needs without custom builds. |
| `tailscale` CLI | Configure Funnel, serve, and status | Ships with the Tailscale package; use `tailscale funnel --bg 443` or forward to Caddy's local port |
| `terraform` | Manage Tailscale config | Use with the official `tailscale/tailscale` provider |

---

## Installation

```bash
# Caddy (Fedora — official COPR from Caddy project)
dnf install dnf5-plugins
dnf copr enable @caddy/caddy
dnf install caddy

# Enable and start Caddy as a systemd service
systemctl enable --now caddy

# Tailscale (already installed, verify version ≥1.52)
tailscale version

# Terraform (via HashiCorp DNF repo)
dnf install -y dnf-plugins-core
dnf config-manager addrepo --from-repofile=https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
dnf install terraform
```

---

## Real-World Validation: caddyserver.com

The official Caddy documentation website (https://caddyserver.com) is itself served using exactly this template pattern. The repo is at https://github.com/caddyserver/website and a local clone confirms the approach.

**Their Caddyfile (verbatim):**

```caddyfile
localhost

root * src

file_server
templates {
    extensions {
        # hitCounter { ... }  # optional plugin
    }
}
encode zstd gzip

try_files {path}.html {path}

# allow direct access to markdown but otherwise
# rewrite to docs index page to render it
@notDirectDocsMarkdown {
    path /docs/*
    not path *.md
}
rewrite @notDirectDocsMarkdown /docs/index.html
```

**Their template (src/docs/index.html, key excerpt):**

```html
{{$pathParts := splitList "/" .OriginalReq.URL.Path -}}
{{$markdownFilename := default "index" (slice $pathParts 2 | join "/") -}}
{{$markdownFilePath := printf "/docs/markdown/%s.md" $markdownFilename -}}
{{if not (fileExists $markdownFilePath)}}{{httpError 404 }}{{end -}}
{{$markdownFile := (include $markdownFilePath | splitFrontMatter) -}}
{{$title := default $markdownFilename $markdownFile.Meta.title -}}
<!DOCTYPE html>
<html>
  <head>
    <title>{{$title}} — Caddy Documentation</title>
    ...
  </head>
  <body>
    <article>
      {{markdown $markdownFile.Body}}
    </article>
  </body>
</html>
```

**Key observations:**
- `try_files {path}.html {path}` — always tries `{path}.html` before serving the file directly. This is why `.md` files are accessible directly (they fall through the `try_files`), while paths without extension (e.g. `/docs/templates`) get served by `index.html` which contains the template logic.
- `@notDirectDocsMarkdown` matcher + `rewrite` — rewrites all non-.md paths under `/docs/` to the template page.
- `.OriginalReq.URL.Path` not `.Req.URL.Path` — after a `rewrite`, `.Req.URL.Path` gives the rewritten path (`/docs/index.html`), not the original. Always use `.OriginalReq.URL.Path` in templates to get the URL the browser requested.
- `fileExists $markdownFilePath` — used for 404 handling before reading the file.
- `default $markdownFilename $markdownFile.Meta.title` — uses the path segment as title fallback.
- Markdown files are stored separately from the URL structure (`/docs/markdown/*.md` on disk vs `/docs/*` in URLs).

---

## Caddy Configuration Patterns

### Pattern 1: Markdown-to-HTML via `templates` handler

The built-in `templates` directive + `file_server` is the standard approach.
No external plugins required. Uses Caddy's Goldmark integration.

**Critical MIME type behavior:** By default, the `templates` directive only processes responses with `Content-Type: text/html` or `text/plain`. A `.md` file served directly has `Content-Type: text/markdown` (or `text/plain`), which means it may or may not be processed. The safe pattern (used by caddyserver.com) is to **rewrite non-.md URLs to an `.html` template file** — the `.html` file gets `Content-Type: text/html` automatically, so templates fires reliably.

```caddyfile
blog.mist-walleye.ts.net {
    root * /srv/blog

    # --- Content negotiation ---
    # Clients sending Accept: text/markdown or text/plain (but NOT text/html)
    # receive the raw .md file directly.
    @wants-markdown {
        header Accept *text/markdown*
        not header Accept *text/html*
    }

    # Rewrite .md requests that want raw markdown to the actual file
    handle @wants-markdown {
        file_server
        header Content-Type text/markdown; charset=utf-8
    }

    # --- HTML rendering pipeline (browsers) ---
    # Rewrite requests for .md files to pass through the HTML template
    @md-file {
        path *.md
        file
    }
    rewrite @md-file /templates/post.html

    templates
    file_server

    # Tailscale TLS: auto-fetched from local tailscaled daemon
    tls {
        get_certificate tailscale
    }
}
```

**How it works:**
1. Request for `/articles/hello.md` arrives.
2. If `Accept` contains `text/markdown` and NOT `text/html` → serve raw file.
3. Otherwise, Caddy rewrites the path to `/templates/post.html`.
4. The `templates` directive executes `post.html` as a Go template.
5. Inside `post.html`, the template calls `include` to fetch the original `.md` file, `splitFrontMatter` to extract YAML/TOML front matter, and `markdown` to render the body as HTML.

**Example `templates/post.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{with .Req.URL.Path}}{{.}}{{end}} — Blog</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    {{$md := splitFrontMatter (include .Req.URL.Path)}}
    <article>
        <h1>{{$md.Meta.title}}</h1>
        <time>{{$md.Meta.date}}</time>
        {{markdown $md.Body}}
    </article>
</body>
</html>
```

**Key template functions (built into Caddy):**
- `include <path>` — reads file at `path` relative to site root; returns string
- `splitFrontMatter <string>` — returns struct with `.Meta` (map) and `.Body` (string)
- `markdown <string>` — renders Markdown string as HTML via Goldmark

### Pattern 2: TLS via Tailscale certificate manager

Caddy 2.5+ fetches `*.ts.net` certificates automatically from the local `tailscaled` daemon. No ACME, no Let's Encrypt, no ports 80/443 opened to the internet.

```caddyfile
blog.mist-walleye.ts.net {
    tls {
        get_certificate tailscale
    }
}
```

**Fedora-specific requirement:** Caddy runs as the `caddy` user (non-root). Grant it cert access:

```bash
# /etc/default/tailscaled
TS_PERMIT_CERT_UID=caddy
```

Then restart tailscaled:
```bash
systemctl restart tailscaled
```

**SELinux note (Fedora/RHEL):** As of Fedora 41 / Caddy 2.9 (December 2024), a fresh install no longer requires a custom SELinux policy. If you encounter `avc: denied` errors on older Fedora versions, use `audit2allow` to create a narrow policy module — do NOT disable SELinux.

### Pattern 3: Tailscale Funnel for internet exposure

Funnel exposes your local Caddy server to the public internet. Only ports 443, 8443, and 10000 are supported.

```bash
# Expose Caddy (listening on localhost:443) to the internet permanently
tailscale funnel --bg --https=443 https://localhost:443

# Check status
tailscale funnel status

# Reset (disable) funnel
tailscale funnel reset
```

`--bg` makes the configuration persistent across reboots. No firewall rules needed on the Fedora host.

**Alternative for non-TLS local Caddy:** If Caddy listens on HTTP internally and Tailscale terminates TLS:
```bash
tailscale funnel --bg localhost:2019
```

**Recommended approach for this project:** Run Caddy with Tailscale TLS termination, listen on `localhost:443`, and use `--tls-terminated-tcp=443` to forward:
```bash
tailscale funnel --bg --tls-terminated-tcp=443 tcp://127.0.0.1:443
```

### Pattern 4: Terraform for Tailscale CNAME — IMPORTANT LIMITATION

**CNAME aliases are NOT natively supported by Tailscale MagicDNS.** The Tailscale Terraform provider (v0.28.x) does not have a `tailscale_dns_alias` or CNAME resource. The GitHub issue ([#1543](https://github.com/tailscale/tailscale/issues/1543)) requesting arbitrary MagicDNS records has been open since 2021.

**Available Terraform resources for DNS:**
- `tailscale_dns_nameservers` — set global DNS servers for the tailnet
- `tailscale_dns_search_paths` — set DNS search domains
- `tailscale_dns_preferences` — enable/disable MagicDNS
- `tailscale_dns_split_nameservers` — split DNS by domain

**The workaround for `blog.mist-walleye.ts.net` → `fedora.mist-walleye.ts.net`:**

Option A (recommended for simplicity): Configure Caddy to answer on the machine's actual hostname `fedora.mist-walleye.ts.net` and create a Tailscale "serve" alias via the ACL policy `nodeAttrs` — but this also doesn't create a true CNAME.

Option B (cleanest): Add a node alias in the Tailscale admin console manually. This gives `blog.mist-walleye.ts.net` as a MagicDNS name for the same node. **This is not yet Terraform-manageable.**

Option C (if external DNS is available): Use `tailscale_dns_nameservers` with a custom DNS server that has an A record for `blog.mist-walleye.ts.net` pointing to the machine's Tailscale IP. Terraform can manage the nameserver config.

**Terraform provider basic configuration (for what IS possible):**

```hcl
terraform {
  required_providers {
    tailscale = {
      source  = "tailscale/tailscale"
      version = "~> 0.28"
    }
  }
}

provider "tailscale" {
  # Prefer OAuth over API key (no expiry, scoped permissions)
  # TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET env vars
  tailnet = "mist-walleye"
}

# Example: enable MagicDNS
resource "tailscale_dns_preferences" "main" {
  magic_dns = true
}
```

**Confidence: LOW** — CNAME/alias support via Terraform does not exist as of Feb 2026. This needs manual admin console configuration or a custom DNS workaround.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Caddy `templates` (built-in) | `caddy-xtemplates` plugin | If you need database access, SQL queries, or HTMX patterns in templates — not needed for a static blog |
| Caddy `templates` (built-in) | `caddy-markdown-site` (third-party, dbohdan) | If you want a more opinionated out-of-the-box setup with directory indexing — adds complexity, less control |
| Caddy `templates` (built-in) | `caddy-conneg` plugin | If you need full HTTP content negotiation spec compliance (e.g., `q=` quality factors) — overkill for this project; header matcher is sufficient |
| Tailscale Funnel (direct) | `caddy-tailscale` plugin | If you want Caddy to join the tailnet as its own node rather than using the host's Tailscale daemon — experimental, marked "highly experimental" in official README |
| Native Caddyfile header matcher | `caddy-markdown-agents` plugin | If you're converting existing HTML responses to Markdown on the fly — not applicable; we serve raw `.md` files directly |
| Official `tailscale/tailscale` TF provider | `davidsbond/tailscale` (community) | Never — use the official provider; the community one is unmaintained and diverged |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Caddy v1 `markdown` directive | Removed in Caddy v2; v1 had a dedicated markdown directive — all v2 docs and examples use the `templates` handler | Caddy v2 `templates` + `markdown` function |
| `caddy-tailscale` plugin for production | Marked "highly experimental" in the official GitHub repo; funnel support is an open issue (#26) | Host-level `tailscale` daemon + `TS_PERMIT_CERT_UID` + `get_certificate tailscale` in Caddyfile |
| `davidsbond/tailscale` Terraform provider | Community provider; Tailscale adopted and now maintains their own official provider under `tailscale/tailscale` | `tailscale/tailscale` provider ≥ 0.28 |
| Tailscale API key for Terraform auth | API keys expire, tied to a user, no scoped permissions | OAuth client (`TAILSCALE_OAUTH_CLIENT_ID` + `TAILSCALE_OAUTH_CLIENT_SECRET`) — scoped, non-expiring, not user-tied |
| Disabling SELinux on Fedora | Security regression | Create a narrow SELinux module with `audit2allow` if needed, or rely on the fixed behavior in Fedora 41+ |
| `tailscale serve` instead of `tailscale funnel` | `tailscale serve` only exposes within the tailnet (not to the public internet) | `tailscale funnel` for public internet exposure |

---

## Stack Patterns by Variant

**If the Caddy host runs as `caddy` user (default after `dnf install caddy`):**
- Add `TS_PERMIT_CERT_UID=caddy` to `/etc/default/tailscaled`
- Restart `tailscaled` after this change
- Use `get_certificate tailscale` in Caddyfile (not `tls internal`)

**If you need the CNAME alias `blog.mist-walleye.ts.net` before Tailscale adds Terraform support:**
- Create the alias manually in the Tailscale admin console under the device settings
- Caddy's Caddyfile can then use `blog.mist-walleye.ts.net` as the site address directly

**If content negotiation needs to handle `q=` quality weights (future-proofing):**
- Consider `caddy-conneg` plugin — but the simple `header` matcher is sufficient for 2026 use cases

**If the blog grows to need a listing/index page:**
- Add a `browse` template or generate an `index.md` via a shell script; Caddy's `file_server browse` creates auto-indexes but doesn't integrate with the Markdown pipeline

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Caddy 2.9.x | Tailscale ≥1.38.3 | `get_certificate tailscale` requires Tailscale ≥1.38.3 |
| Tailscale Terraform provider 0.28.x | Terraform ≥1.0 | OpenTofu also compatible |
| Caddy 2.9.x | Fedora 40/41 | SELinux issue resolved in Fedora 41 with fresh install |
| Tailscale Funnel | Tailscale ≥1.52 | Earlier versions used `tailscale serve --funnel`; unified `tailscale funnel` command added in 1.52 |

---

## Sources

- [Caddy templates directive — official docs](https://caddyserver.com/docs/caddyfile/directives/templates) — HIGH confidence (verified against Caddy 2.9)
- [Caddy templates module — official docs](https://caddyserver.com/docs/modules/http.handlers.templates) — HIGH confidence
- [Caddy Tailscale TLS — official Tailscale docs](https://tailscale.com/kb/1190/caddy-certificates) — HIGH confidence (validated 2026-01-05 per page footer)
- [Tailscale Funnel — official docs](https://tailscale.com/kb/1223/funnel) — HIGH confidence
- [Tailscale Funnel CLI reference](https://tailscale.com/kb/1311/tailscale-funnel) — HIGH confidence
- [Tailscale Terraform provider — official docs](https://tailscale.com/kb/1210/terraform-provider) — HIGH confidence
- [Terraform Registry: tailscale/tailscale](https://registry.terraform.io/providers/tailscale/tailscale/latest/docs) — HIGH confidence (v0.28.x)
- [GitHub: tailscale/terraform-provider-tailscale](https://github.com/tailscale/terraform-provider-tailscale) — HIGH confidence (v0.28.0, released 2026-02-19)
- [Tailscale MagicDNS arbitrary records — open issue #1543](https://github.com/tailscale/tailscale/issues/1543) — HIGH confidence (CNAME not supported as of Feb 2026)
- [SELinux + Caddy + Tailscale issue](https://github.com/tailscale/tailscale/issues/5622) — MEDIUM confidence (resolved in Fedora 41, older versions may need policy)
- [Caddy serve Markdown as HTML — practical example](https://til.jakelazaroff.com/caddy/serve-markdown-files-as-html/) — MEDIUM confidence (community, verified against Caddy docs)
- [Content negotiation for AI agents — 2026 state](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) — MEDIUM confidence (Feb 2026 article)
- [Use Accept header to serve Markdown](https://www.skeptrune.com/posts/use-the-accept-header-to-serve-markdown-instead-of-html-to-llms/) — MEDIUM confidence (practical Caddyfile example)
- [Caddy 2.9.0 release notes](https://github.com/caddyserver/caddy/releases/tag/v2.9.0) — HIGH confidence (released 2024-12-31)

---
*Stack research for: Personal Markdown blog — Caddy + Tailscale Funnel on Fedora*
*Researched: 2026-02-20*
