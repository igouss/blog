# Pitfalls Research

**Domain:** Caddy + Tailscale Funnel + Terraform — Personal Markdown Blog on Fedora
**Researched:** 2026-02-21
**Confidence:** HIGH (sourced from actual caddyserver.com codebase + official docs + Tailscale docs)

---

## Critical Pitfalls

### Pitfall 1: Using `.Req.URL.Path` Instead of `.OriginalReq.URL.Path` in Templates

**What goes wrong:** After a `rewrite` directive in Caddy, `.Req.URL.Path` contains the rewritten path (e.g., `/templates/post.html`), not the original URL the browser requested (e.g., `/articles/my-post`). If you use `.Req.URL.Path` to look up the Markdown file, you'll always try to include `/templates/post.html` as Markdown — returning nothing or a template loop.

**Symptoms:** Template renders with blank or wrong content. `include .Req.URL.Path` returns empty or fails silently.

**Prevention:** Always use `.OriginalReq.URL.Path` inside templates that serve rewrote requests.

```html
{{- $path := .OriginalReq.URL.Path -}}
{{- $mdFile := printf "/articles%s.md" $path -}}
{{- $md := (include $mdFile | splitFrontMatter) -}}
{{markdown $md.Body}}
```

**Phase:** Caddyfile + templates setup (Phase 1/2)

---

### Pitfall 2: Templates Directive Ignores `.md` Files (MIME Type Filtering)

**What goes wrong:** By default, Caddy's `templates` directive only processes responses with `Content-Type: text/html` or `text/plain`. If you try to serve a `.md` file through `templates` directly (without a rewrite to an `.html` file), the templates directive silently skips it. You get raw Markdown source in the browser instead of rendered HTML.

**Symptoms:** Browser shows raw Markdown text (e.g., `# My Post\n\nHello world`) instead of HTML.

**Prevention:** Follow the caddyserver.com pattern — rewrite non-.md requests to an `.html` template file, not to a `.md` file. The `.html` extension triggers `Content-Type: text/html`, which templates processes.

```caddyfile
# WRONG — rewriting to a .md file; templates won't fire
rewrite @article /templates/template.md

# RIGHT — rewrite to an .html template; templates fires
rewrite @article /templates/post.html
```

**Phase:** Caddyfile setup (Phase 1)

---

### Pitfall 3: Missing `TS_PERMIT_CERT_UID=caddy` Breaks TLS

**What goes wrong:** Caddy runs as the `caddy` user (non-root) after a standard `dnf install caddy`. The Tailscale daemon (`tailscaled`) controls access to TLS certificates via a UID allowlist. Without `TS_PERMIT_CERT_UID=caddy`, Caddy cannot fetch its `*.ts.net` certificate and fails to start HTTPS.

**Symptoms:** Caddy logs `failed to get certificate: tailscale: permission denied` or similar. HTTPS doesn't work; Caddy may fall back to self-signed cert or error out.

**Prevention:**

```bash
# Add to /etc/default/tailscaled (create if missing)
echo 'TS_PERMIT_CERT_UID=caddy' | sudo tee -a /etc/default/tailscaled

# Restart tailscaled to apply
sudo systemctl restart tailscaled

# Then restart Caddy
sudo systemctl restart caddy
```

**Phase:** Tailscale + Caddy TLS setup (Phase 1)

---

### Pitfall 4: `tailscale serve` vs `tailscale funnel` Confusion

**What goes wrong:** `tailscale serve` exposes a port within the tailnet only (not to the public internet). `tailscale funnel` exposes it publicly. Using `serve` when you meant `funnel` makes the blog accessible only to devices on your Tailscale network.

**Symptoms:** Blog works from devices on the `mist-walleye` tailnet but not from external browsers or public URLs.

**Prevention:** Use `tailscale funnel` for public internet exposure. Use `tailscale serve` only for tailnet-internal services.

```bash
# WRONG for public access
tailscale serve --bg localhost:8080

# RIGHT for public access
tailscale funnel --bg --tls-terminated-tcp=443 tcp://localhost:8080
```

**Phase:** Tailscale Funnel setup (Phase 1)

---

### Pitfall 5: Tailscale MagicDNS CNAME Does Not Exist

**What goes wrong:** The project goal is `blog.mist-walleye.ts.net` as a CNAME for `fedora.mist-walleye.ts.net`. As of February 2026, Tailscale MagicDNS does not support custom CNAME records (open GitHub issue since 2021: tailscale/tailscale#1543). The Terraform `tailscale/tailscale` provider has no `tailscale_dns_record` resource. Any attempt to create the CNAME via Terraform will fail.

**Symptoms:** Terraform plan errors with "unknown resource type"; or the CNAME simply doesn't resolve.

**Prevention:** Either:
1. Use the machine's actual hostname `fedora.mist-walleye.ts.net` in the Caddyfile
2. Create a device alias manually in the Tailscale admin console (Settings → Machine → Edit machine name)
3. Defer the CNAME requirement and set `blog` as an alias through the admin UI

**What Terraform CAN manage:** `tailscale_dns_preferences` (MagicDNS on/off), `tailscale_dns_nameservers`, `tailscale_dns_search_paths`.

**Phase:** Terraform setup (Phase 2/3)

---

### Pitfall 6: SELinux Blocking Caddy File Access on Fedora

**What goes wrong:** On Fedora (which uses SELinux enforcing by default), Caddy may be denied access to files outside its default allowed paths (`/var/www/html` and `/srv`). If blog files are stored in `/home/user/blog` or other non-standard locations, SELinux will block reads silently or with a permission denied error.

**Symptoms:** Caddy returns 403 or 500 for files that exist on disk and are readable by the `caddy` user. `journalctl -u caddy` may show no error, but `ausearch -m avc -ts recent` shows SELinux denials.

**Prevention:**
```bash
# Store blog files in /srv/blog (SELinux allows this by default)
# OR label your custom path:
sudo semanage fcontext -a -t httpd_sys_content_t "/path/to/blog(/.*)?"
sudo restorecon -Rv /path/to/blog
```

**Note:** As of Fedora 41+ with fresh Caddy install from the official COPR, common SELinux issues are resolved. Older Fedora versions may need this fix.

**Phase:** Initial setup (Phase 1)

---

### Pitfall 7: Template Blocking — Users Can Download Your Template Source

**What goes wrong:** If `templates/` directory is served by `file_server` without an access block, users can request `/templates/post.html` directly and get the raw Go template source code (including file paths, template logic, etc.).

**Prevention:** Add an explicit matcher to block direct template access:

```caddyfile
@templates path /templates/*
handle @templates {
    error 403
}
```

Place this before the `file_server` directive.

**Phase:** Caddyfile setup (Phase 1)

---

### Pitfall 8: Caddy v1 `markdown` Directive (Does Not Exist in v2)

**What goes wrong:** Caddy v1 had a dedicated `markdown` Caddyfile directive. Many tutorials and Stack Overflow answers (and AI training data) reference it. In Caddy v2, this directive does not exist. Adding it to a v2 Caddyfile causes a parse error.

**Symptoms:** `caddy run` fails with `unrecognized directive: markdown`.

**Prevention:** Use Caddy v2 `templates` directive with the `{{markdown}}` template function, not a `markdown` directive.

```caddyfile
# WRONG (Caddy v1)
markdown / {
    template /template.html
}

# RIGHT (Caddy v2)
templates
rewrite @article /templates/post.html
```

**Phase:** Caddyfile setup (Phase 1)

---

### Pitfall 9: Terraform OAuth vs API Key for Tailscale Provider

**What goes wrong:** Using a Tailscale API key for Terraform authentication ties the key to a specific user account, and API keys expire. If the key expires mid-operation, Terraform fails. If the user account is deleted, infrastructure becomes unmanageable.

**Prevention:** Use OAuth credentials instead:

```bash
# Create OAuth client at https://login.tailscale.com/admin/settings/oauth
# Scopes needed: devices:read, dns:write
export TAILSCALE_OAUTH_CLIENT_ID=...
export TAILSCALE_OAUTH_CLIENT_SECRET=...
```

```hcl
provider "tailscale" {
  tailnet = "mist-walleye"
  # Reads from TAILSCALE_OAUTH_CLIENT_ID + TAILSCALE_OAUTH_CLIENT_SECRET
}
```

**Phase:** Terraform setup (Phase 2/3)

---

### Pitfall 10: `fileExists` Check Before `include` in Templates

**What goes wrong:** If you call `include "/articles/nonexistent.md"` without checking `fileExists` first, Caddy returns an empty string (or may error). The template renders with blank content and HTTP 200 — no indication to the reader that the post doesn't exist.

**Prevention:** Always guard `include` with `fileExists` and use `httpError 404` for missing files:

```html
{{- $mdPath := printf "/articles%s.md" .OriginalReq.URL.Path -}}
{{- if not (fileExists $mdPath) -}}{{httpError 404}}{{- end -}}
{{- $md := (include $mdPath | splitFrontMatter) -}}
```

This is the exact pattern used by caddyserver.com's own docs template.

**Phase:** Template implementation (Phase 1/2)

---

## Quick Reference: What Goes Wrong Where

| Phase | Most Likely Pitfall | Quick Check |
|-------|---------------------|-------------|
| Caddy TLS startup | `TS_PERMIT_CERT_UID` missing (Pitfall 3) | `journalctl -u caddy -n 50` |
| Funnel public access | Using `serve` instead of `funnel` (Pitfall 4) | `tailscale funnel status` |
| Template rendering blank | `.Req.URL.Path` instead of `.OriginalReq.URL.Path` (Pitfall 1) | Add `{{.OriginalReq.URL.Path}}` to template to debug |
| Raw markdown in browser | MIME type filtering skips templates (Pitfall 2) | Check rewrite target ends in `.html` |
| 403/500 on files that exist | SELinux denying access (Pitfall 6) | `ausearch -m avc -ts recent` |
| Terraform CNAME fails | MagicDNS CNAME not supported (Pitfall 5) | Check Tailscale issue #1543 status |
| Template source exposed | No `handle @templates { error 403 }` block (Pitfall 7) | `curl http://localhost/templates/post.html` |

---

## Sources

- caddyserver.com Caddyfile: `/home/elendal/IdeaProjects/caddyserver-website/Caddyfile` (direct observation — HIGH)
- caddyserver.com index.html template: `/home/elendal/IdeaProjects/caddyserver-website/src/docs/index.html` (direct observation — HIGH)
- Caddy templates directive docs: https://caddyserver.com/docs/caddyfile/directives/templates (HIGH)
- Caddy template functions: https://caddyserver.com/docs/modules/http.handlers.templates (HIGH)
- Tailscale Caddy certificates: https://tailscale.com/kb/1190/caddy-certificates (HIGH — TS_PERMIT_CERT_UID)
- Tailscale Funnel: https://tailscale.com/kb/1311/tailscale-funnel (HIGH)
- Tailscale MagicDNS CNAME issue: https://github.com/tailscale/tailscale/issues/1543 (HIGH — confirms limitation)
- Tailscale Terraform provider: https://registry.terraform.io/providers/tailscale/tailscale/latest/docs (HIGH)
- SELinux + Caddy on Fedora: https://github.com/tailscale/tailscale/issues/5622 (MEDIUM)

---
*Pitfalls research for: Caddy + Tailscale Funnel + Terraform on Fedora*
*Researched: 2026-02-21*
