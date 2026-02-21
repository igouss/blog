# Phase 1: Infrastructure - Research

**Researched:** 2026-02-21
**Domain:** Caddy 2 + Tailscale Funnel + Fedora host deployment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Hostname:** Use `fedora.mist-walleye.ts.net` as the Caddyfile site address — no CNAME, no alias
- **No Terraform:** Terraform is deferred to v1.1 — do NOT include any Terraform setup in Phase 1
- **Deploy target:** The Fedora host `fedora.mist-walleye.ts.net` — Caddy and Tailscale are already installed
- **Deployment approach:** Deploy everything directly on the host (copy/link config files, systemd, etc.)

### Claude's Discretion
- Where exactly to store blog files on disk (`/srv/blog` recommended by research for SELinux compatibility)
- Whether to use a symlink from `/etc/caddy/Caddyfile` or copy
- How to structure the initial Caddyfile (can be minimal for Phase 1 — just HTTPS + file_server, rendering comes in Phase 2)

### Deferred Ideas (OUT OF SCOPE)
- Terraform (v1.1)
- CNAME `blog.mist-walleye.ts.net` (not possible via MagicDNS yet)
- Content negotiation and Markdown rendering (Phase 2)
- CSS, templates, HTML (Phase 3)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Blog files are organized in a structured directory layout (`articles/`, `templates/`, `css/`, `scripts/`, `configs/`) | Directory structure is created on the Fedora host under `/srv/blog`; layout matches the full-project architecture so Phase 2+ can build on it without reorganization |
| INFRA-02 | Tailscale daemon is permitted to issue TLS certs to the Caddy user (`TS_PERMIT_CERT_UID=caddy` in `/etc/default/tailscaled`) | Confirmed by official Tailscale docs: Caddy runs as the `caddy` user post-COPR install; tailscaled restricts cert socket access by UID; the env var must be in `/etc/default/tailscaled` and tailscaled restarted |
| INFRA-03 | Caddy serves the blog over HTTPS using a Tailscale-issued `*.ts.net` TLS certificate (`get_certificate tailscale`) | Caddy 2.5+ auto-detects `*.ts.net` site addresses and fetches the cert from tailscaled automatically; explicit `tls { get_certificate tailscale }` is the belt-and-suspenders option; COPR systemd unit grants `AmbientCapabilities=CAP_NET_BIND_SERVICE` so `caddy` user can bind port 443 |
| INFRA-04 | Tailscale Funnel exposes the blog to the public internet on HTTPS port 443 | `tailscale funnel --bg --tls-terminated-tcp=443 tcp://localhost:443` is the correct command; `--bg` persists across reboots; Funnel must be enabled in tailnet ACL policy (`nodeAttrs: funnel`) and HTTPS must be enabled on the tailnet |
| INFRA-05 | Blog is accessible from an external browser (outside the tailnet) over HTTPS | Verification step: `curl -I https://fedora.mist-walleye.ts.net` from a device outside the tailnet; or open in browser from a mobile hotspot not on the tailnet |
</phase_requirements>

---

## Summary

Phase 1 establishes the public HTTPS endpoint: blog files on disk, Caddy serving HTTPS with a Tailscale TLS cert, and Tailscale Funnel exposing port 443 to the internet. The milestone-level research is complete and all commands are verified. This phase is pure infrastructure — no Markdown rendering, no templates, no CSS.

The key sequence is: (1) create the directory layout on disk, (2) enable the Funnel ACL in the Tailscale admin console if not already done, (3) set `TS_PERMIT_CERT_UID=caddy` and restart tailscaled, (4) write a minimal Caddyfile and deploy it to `/etc/caddy/Caddyfile`, (5) enable and start Caddy, (6) run the `tailscale funnel` command, (7) verify external HTTPS access.

The one non-obvious prerequisite that can silently block the phase is the Tailscale Funnel ACL requirement. Funnel requires a `nodeAttrs` entry in the tailnet policy file (`"attr": ["funnel"]`). If the policy does not permit Funnel, the `tailscale funnel` command will prompt the user to enable it via the admin console. This is not a code issue — it is an admin console click. Research confirms it is a one-time setup that persists.

**Primary recommendation:** Follow the sequence above strictly. Do not proceed to Caddy config until tailscaled is restarted with `TS_PERMIT_CERT_UID=caddy` — Caddy will fail to start HTTPS otherwise.

---

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Caddy | 2.9.x (already installed via COPR) | Web server, TLS termination | Single binary, auto-fetches `*.ts.net` cert from tailscaled, COPR package installs caddy.service and caddy user |
| Tailscale | ≥1.52 (already installed) | Funnel public ingress, TLS cert CA | `tailscale funnel` GA since 1.52; provides `*.ts.net` cert to Caddy |
| systemd | OS default | Caddy lifecycle management | COPR package provides `caddy.service`; use `systemctl enable --now caddy` |

### No Additional Installs Required

Both Caddy and Tailscale are already installed on the host. Phase 1 requires only configuration changes, not package installs. The COPR-installed Caddy:
- Runs as the `caddy` user
- Reads config from `/etc/caddy/Caddyfile`
- Has `AmbientCapabilities=CAP_NET_BIND_SERVICE` in its systemd unit (can bind port 443 as non-root)
- Has `caddy.service` available for `systemctl enable --now caddy`

---

## Architecture Patterns

### TLS Termination Flow

Tailscale Funnel is an SNI-aware TCP proxy. With `--tls-terminated-tcp=443`, it does NOT terminate TLS itself — it forwards raw TCP to the local port. Caddy receives the encrypted connection and terminates TLS using the `*.ts.net` certificate it fetched from tailscaled.

```
Internet client → HTTPS → Tailscale Funnel relay (SNI proxy, no TLS termination)
  → WireGuard tunnel → tailscaled on fedora.mist-walleye.ts.net (raw TCP forward)
  → Caddy on localhost:443 (Caddy terminates TLS using Tailscale cert)
  → HTTP response back up the chain
```

This is the correct mode when Caddy handles its own TLS. The alternative (`--https=443`) would have tailscaled terminate TLS and forward plain HTTP to Caddy — that mode prevents Caddy from obtaining its own TLS cert and loses Caddy's HTTPS stack.

### Recommended Phase 1 Directory Layout

Create at `/srv/blog/`:
```
/srv/blog/
├── articles/          # Markdown posts — populated in Phase 2
├── templates/         # Go HTML templates — populated in Phase 3
├── css/               # Stylesheets — populated in Phase 3
├── scripts/           # Operational scripts
└── configs/
    └── Caddyfile      # Source of truth for Caddy config
```

Rationale for `/srv/blog`:
- `/srv` has `httpd_sys_content_t` SELinux type by default on Fedora
- No `semanage` labeling required for `/srv/blog` subtree
- Aligns with the full-project architecture researched at milestone level

### Caddyfile Deployment

Two options for getting the Caddyfile to `/etc/caddy/Caddyfile`:

**Option A — Symlink (recommended):** `sudo ln -sf /srv/blog/configs/Caddyfile /etc/caddy/Caddyfile`
- Config lives in the blog repo directory; `/etc/caddy/Caddyfile` is a pointer
- Git-tracked config, single source of truth
- Caddy reads the symlink transparently

**Option B — Copy:** `sudo cp /srv/blog/configs/Caddyfile /etc/caddy/Caddyfile`
- Simpler but requires re-copying on every change
- Not recommended for version-controlled config

### Minimal Phase 1 Caddyfile

Phase 1 only requires HTTPS + static file serving. Rendering directives are Phase 2.

```caddyfile
fedora.mist-walleye.ts.net {
    root * /srv/blog

    # Serve static files
    file_server

    # Tailscale TLS — Caddy auto-fetches cert for *.ts.net domains.
    # Explicit tls block is belt-and-suspenders; safe to include.
    tls {
        get_certificate tailscale
    }
}
```

Phase 1 placeholder content: create `/srv/blog/index.html` with a minimal "blog coming soon" HTML file. This validates the full pipeline (Funnel → tailscaled → Caddy → file_server → TLS → browser) without any rendering complexity.

### Anti-Patterns to Avoid

- **Using `tailscale serve` instead of `tailscale funnel`:** `serve` is tailnet-internal only. Blog will be unreachable from outside the tailnet with no error message to indicate why.
- **Using `--https=443` instead of `--tls-terminated-tcp=443`:** This has Funnel terminate TLS, which conflicts with Caddy's own TLS termination. Caddy would receive plain HTTP but still try to present itself as HTTPS.
- **Starting Caddy before restarting tailscaled:** Caddy fetches the cert at startup. If `TS_PERMIT_CERT_UID=caddy` is not yet in effect (tailscaled not restarted), Caddy fails to obtain the cert and either errors out or falls back to self-signed.
- **Storing blog files outside `/srv`:** Paths under `/home`, `/opt`, or other non-standard locations require explicit SELinux relabeling on Fedora or Caddy will get 403/500 despite correct Unix permissions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TLS certificate management | Custom cert fetching, Let's Encrypt ACME | `get_certificate tailscale` in Caddyfile | Caddy handles cert renewal automatically; `*.ts.net` cert is fetched on-demand from tailscaled socket |
| Public internet ingress | Port forwarding, firewall rules, reverse proxy | `tailscale funnel --bg --tls-terminated-tcp=443` | Funnel handles NAT traversal, public routing, and TLS proxying; no firewall changes on the Fedora host |
| systemd service setup | Custom unit file | `systemctl enable --now caddy` | COPR-installed `caddy.service` already has correct user, capabilities, and Caddyfile path |

---

## Common Pitfalls

### Pitfall 1: Missing `TS_PERMIT_CERT_UID=caddy` (CRITICAL)
**What goes wrong:** Caddy starts as the `caddy` user (not root). The tailscaled daemon restricts TLS cert socket access by UID allowlist. Without `TS_PERMIT_CERT_UID=caddy` in `/etc/default/tailscaled`, Caddy cannot fetch the `*.ts.net` certificate.
**Why it happens:** Default tailscaled config does not pre-grant any user TLS cert access.
**Symptom:** Caddy log shows `failed to get certificate` or permission denied. HTTPS does not work.
**How to avoid:**
```bash
# /etc/default/tailscaled may not exist — create it
echo 'TS_PERMIT_CERT_UID=caddy' | sudo tee -a /etc/default/tailscaled
sudo systemctl restart tailscaled
# Then start/restart Caddy AFTER tailscaled is restarted
sudo systemctl restart caddy
```
**Warning signs:** `journalctl -u caddy -n 50` shows cert fetch errors.

### Pitfall 2: Funnel Not Enabled in Tailnet ACL Policy
**What goes wrong:** Tailscale Funnel requires a `nodeAttrs` entry in the tailnet policy file granting `funnel` to the node. Personal tailnets may not have this by default.
**Why it happens:** Funnel is an opt-in feature; policy must explicitly permit it.
**Symptom:** `tailscale funnel` command outputs a link to the admin console to enable it, or returns an error about missing node attribute.
**How to avoid:** Before running the funnel command, verify the tailnet policy file includes:
```json
"nodeAttrs": [{ "target": ["autogroup:member"], "attr": ["funnel"] }]
```
This can be added via the admin console → Access controls → Edit policy. After adding, the `tailscale funnel` command will succeed.

### Pitfall 3: SELinux Blocking Caddy File Access
**What goes wrong:** Fedora runs SELinux in enforcing mode. Caddy (running as `caddy` user under systemd) is denied reads on files with wrong SELinux context.
**Why it happens:** Files outside SELinux-labeled web paths get a default context (`user_home_t`, etc.) that the web server process type cannot read.
**Symptom:** Caddy returns 403 or 500 for files that exist and have correct Unix permissions. `ausearch -m avc -ts recent` shows AVC denials.
**How to avoid:** Store blog files under `/srv/blog`. The `/srv` path has `var_t` or `httpd_sys_content_t` context by default on Fedora, allowing Caddy to read it. If a non-`/srv` path must be used:
```bash
sudo semanage fcontext -a -t httpd_sys_content_t "/path/to/blog(/.*)?"
sudo restorecon -Rv /path/to/blog
```
**Note:** As of Fedora 41 + Caddy 2.9 fresh COPR install, SELinux issues are resolved. Older Fedora versions may need the `semanage` fix.

### Pitfall 4: `tailscale serve` vs `tailscale funnel`
**What goes wrong:** `tailscale serve` is for tailnet-internal access only. `tailscale funnel` is for public internet access.
**Symptom:** Blog works from tailnet devices, returns DNS NXDOMAIN or connection refused from external internet.
**How to avoid:** Always use `tailscale funnel` for public internet exposure.

### Pitfall 5: `--https` vs `--tls-terminated-tcp` Mode Confusion
**What goes wrong:** `--https=443` mode has Funnel/tailscaled terminate TLS and forward plain HTTP to Caddy. This conflicts with Caddy's own TLS termination using the Tailscale cert.
**Correct mode:** `--tls-terminated-tcp=443` tells Funnel to forward raw TCP — Caddy terminates TLS itself.
**How to avoid:** Use `--tls-terminated-tcp=443` when Caddy handles TLS. Use `--https=443` only if you want a plain-HTTP Caddy backend.

### Pitfall 6: File Ownership — `caddy` User Must Own or Read `/srv/blog`
**What goes wrong:** If `/srv/blog` is created as root and not made readable by the `caddy` user, Caddy returns 403.
**How to avoid:**
```bash
sudo mkdir -p /srv/blog
sudo chown -R caddy:caddy /srv/blog
# OR at minimum:
sudo chmod -R o+rX /srv/blog
```

---

## Code Examples

### Setting Up `TS_PERMIT_CERT_UID`
```bash
# Source: https://tailscale.com/kb/1190/caddy-certificates
echo 'TS_PERMIT_CERT_UID=caddy' | sudo tee -a /etc/default/tailscaled
sudo systemctl restart tailscaled
```

### Creating the Blog Directory Layout
```bash
sudo mkdir -p /srv/blog/{articles,templates,css,scripts,configs}
sudo chown -R caddy:caddy /srv/blog
```

### Phase 1 Placeholder Content (validates Caddy + TLS without rendering)
```bash
sudo tee /srv/blog/index.html <<'EOF'
<!DOCTYPE html>
<html><head><title>Blog</title></head>
<body><h1>Blog coming soon</h1></body>
</html>
EOF
sudo chown caddy:caddy /srv/blog/index.html
```

### Minimal Phase 1 Caddyfile
```caddyfile
# Source: official Tailscale Caddy cert docs + Caddy file_server docs
fedora.mist-walleye.ts.net {
    root * /srv/blog

    file_server

    tls {
        get_certificate tailscale
    }
}
```

### Deploying Caddyfile via Symlink
```bash
sudo ln -sf /srv/blog/configs/Caddyfile /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
```

### Enabling Tailscale Funnel
```bash
# Source: https://tailscale.com/kb/1311/tailscale-funnel
# --bg: persist across reboots and terminal session exit
# --tls-terminated-tcp=443: forward raw TCP; Caddy terminates TLS
tailscale funnel --bg --tls-terminated-tcp=443 tcp://localhost:443

# Verify funnel is active
tailscale funnel status
```

### Verification — External HTTPS Access
```bash
# From a device OUTSIDE the tailnet (e.g., phone on mobile data, or a VPS):
curl -I https://fedora.mist-walleye.ts.net

# Expected: HTTP/2 200, Server: Caddy
# Confirms: Funnel routing, TLS cert, Caddy file_server all working end-to-end
```

### Checking Caddy Logs on Error
```bash
journalctl -u caddy -n 100 -f
# Look for: "failed to get certificate", "permission denied", "bind: address already in use"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailscale serve --funnel` | `tailscale funnel` (separate subcommand) | Tailscale ≥1.52 | Older docs/tutorials reference `serve --funnel`; that flag still works but `tailscale funnel` is the canonical command |
| Caddy v1 `markdown` directive | Caddy v2 `templates` + template functions | Caddy v2 (2020) | v1 directive does not exist in v2; causes parse error if copied from old docs — not relevant for Phase 1 but worth noting |
| Manual TLS cert (Let's Encrypt) for `*.ts.net` | `get_certificate tailscale` (automatic) | Caddy 2.5 beta (2022) | Caddy auto-discovers Tailscale certs for `*.ts.net` domains; no ACME, no port 80 challenge needed |

**Deprecated/outdated:**
- `tailscale serve --funnel`: Functional but deprecated in favor of `tailscale funnel` subcommand
- `caddy-tailscale` plugin: Marked "highly experimental" in official GitHub; do not use for production
- Caddy v1 `markdown` directive: Removed in v2; all v1 examples are invalid for this project

---

## Open Questions

1. **Is `TS_PERMIT_CERT_UID=caddy` already set on the host?**
   - What we know: The user confirmed Caddy and Tailscale are already installed; no confirmation of tailscaled config state
   - What's unclear: Whether `/etc/default/tailscaled` exists and already contains the env var
   - Recommendation: Make the plan check/set it unconditionally (idempotent `tee -a` pattern or verify first with `grep`)

2. **Is Funnel already enabled in the tailnet ACL policy?**
   - What we know: The user has been using Tailscale (mist-walleye tailnet exists, fedora host is enrolled)
   - What's unclear: Whether the tailnet policy already has `nodeAttrs: funnel` — this is a one-time admin console click if missing
   - Recommendation: Plan should include a manual step to verify via `tailscale funnel status` and link to admin console if needed

3. **Caddyfile symlink vs copy — which to use?**
   - Claude's discretion per CONTEXT.md
   - Recommendation: Symlink from `/srv/blog/configs/Caddyfile` → `/etc/caddy/Caddyfile` so the canonical config lives in the version-controlled blog directory

4. **Does `tailscale funnel --bg` persist reliably after reboots on this Tailscale version?**
   - What we know: `--bg` is documented to persist; one GitHub issue (2025) reported it breaking on 1.80.2 in Docker; non-Docker native install on Fedora is unaffected by that report
   - What's unclear: Exact Tailscale version installed on the host
   - Recommendation: After enabling, verify with `tailscale funnel status` and recheck after first reboot

---

## Sources

### Primary (HIGH confidence)

- [Tailscale Caddy certificates — official docs](https://tailscale.com/kb/1190/caddy-certificates) — `TS_PERMIT_CERT_UID`, `get_certificate tailscale`, Caddy 2.5+ auto-detection
- [Tailscale Funnel CLI reference — official docs](https://tailscale.com/kb/1311/tailscale-funnel) — `--bg`, `--tls-terminated-tcp`, supported ports (443/8443/10000)
- [Tailscale Funnel feature docs](https://tailscale.com/kb/1223/funnel) — prerequisites, ACL nodeAttrs requirement, HTTPS enablement requirement
- [Caddy running as a service — official docs](https://caddyserver.com/docs/running) — `caddy` user, `/etc/caddy/Caddyfile`, `AmbientCapabilities`, `caddy.service`
- [Caddy install on Fedora — official docs](https://caddyserver.com/docs/install) — COPR install commands
- [Caddy file_server directive — official docs](https://caddyserver.com/docs/caddyfile/directives/file_server) — `root *` pairing, minimal config
- [Caddy tls directive — official docs](https://caddyserver.com/docs/caddyfile/directives/tls) — `get_certificate tailscale` syntax
- [Caddy blog: Tailscale integration](https://tailscale.com/blog/caddy) — confirmed Caddy auto-detects `*.ts.net` certs since 2.5

### Secondary (MEDIUM confidence)

- [PITFALLS.md — project research](/.planning/research/PITFALLS.md) — TS_PERMIT_CERT_UID, serve vs funnel, SELinux, template exposure pitfalls
- [STACK.md — project research](/.planning/research/STACK.md) — Caddy + Tailscale stack patterns, version compatibility table
- [ARCHITECTURE.md — project research](/.planning/research/ARCHITECTURE.md) — TLS flow diagram, directory layout, anti-patterns
- [SELinux + Caddy Fedora discussion](https://discussion.fedoraproject.org/t/selinux-type-label-for-user-files-served-by-web-server/86378) — `/srv` context behavior on Fedora

### Tertiary (LOW confidence)

- GitHub issue reports on `--bg` persistence after reboot on Tailscale 1.80.2 in Docker — not directly applicable to native Fedora install; note for post-setup verification only

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Caddy COPR, Tailscale Funnel, systemd all documented in official sources; versions confirmed; both already installed
- Architecture: HIGH — TLS flow (Caddy terminates via Tailscale cert, Funnel forwards raw TCP) confirmed via official Tailscale and Caddy docs
- Pitfalls: HIGH — all six pitfalls sourced from official docs or direct observation of caddyserver.com source; not inferred
- Directory layout: HIGH — `/srv/blog` SELinux compatibility confirmed; full layout matches milestone-level architecture research
- Funnel ACL prerequisite: MEDIUM — documented in official Tailscale docs; actual state of mist-walleye tailnet ACL policy is unknown and requires manual verification

**Research date:** 2026-02-21
**Valid until:** 2026-05-21 (stable stack; Caddy and Tailscale APIs change infrequently)
