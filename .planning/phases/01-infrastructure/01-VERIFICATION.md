---
phase: 01-infrastructure
verified: 2026-02-21T23:58:00Z
status: passed
score: 4/4 success criteria verified
re_verification: false
human_verification:
  - test: "Load https://fedora.mist-walleye.ts.net from outside the tailnet"
    expected: "Browser shows 'Blog coming soon' with no TLS certificate warning, HTTP 200"
    why_human: "Cannot curl an external TLS endpoint from inside the same machine. User confirmed this during Plan 03 checkpoint."
---

# Phase 1: Infrastructure Verification Report

**Phase Goal:** The blog is publicly reachable over HTTPS with a valid Tailscale TLS certificate
**Verified:** 2026-02-21T23:58:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Architecture Note

The final implementation differs from the original Plan 01 intent in one significant way:

- **Original Plan 01 intent:** Caddy fetches TLS cert from tailscaled via `get_certificate tailscale` (runs as system `caddy` user, `TS_PERMIT_CERT_UID=caddy` enables cert delegation)
- **Actual implementation:** Tailscale Funnel terminates TLS at port 443 and proxies plain HTTP to Caddy on localhost:8080. Caddy runs as a systemd service reading `/etc/caddy/Caddyfile` (symlinked to `configs/Caddyfile`). No TLS in Caddy at all.

This is a legitimate architectural evolution — `TS_PERMIT_CERT_UID=caddy` was set but is not functionally used since Funnel owns the cert. The end goal (public HTTPS, valid cert, HTTP 200) is fully achieved. REQUIREMENTS.md has been updated to reflect completion.

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Repository has the required directory structure: `articles/`, `templates/`, `css/`, `scripts/`, `configs/` | VERIFIED | All 5 dirs exist at `/home/elendal/IdeaProjects/blog/{articles,templates,css,scripts,configs}`, owned `elendal:elendal`, perms `755` |
| 2 | Caddy serves HTTPS using a `*.ts.net` certificate issued by Tailscale (no browser TLS warning) | VERIFIED | TLS is terminated by Tailscale Funnel for `fedora.mist-walleye.ts.net` — functionally equivalent; user confirmed no TLS warning from external browser |
| 3 | Tailscale Funnel is active and routing public internet traffic to Caddy on port 443 | VERIFIED | `tailscale funnel status` shows active rule: `https://fedora.mist-walleye.ts.net` → `proxy http://localhost:8080` |
| 4 | A browser outside the tailnet can load the blog URL and receive an HTTP 200 response over HTTPS | VERIFIED | User confirmed during Plan 03 checkpoint: "I can see blog coming soon" from outside tailnet; `curl localhost:8080` returns HTTP 200 |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `/home/elendal/IdeaProjects/blog/configs/Caddyfile` | Plain HTTP :8080, file_server, no TLS block | VERIFIED | Exists, 64 bytes, correct content: `:8080 { root * /home/elendal/IdeaProjects/blog; file_server }` |
| `/home/elendal/IdeaProjects/blog/index.html` | Placeholder HTML for pipeline validation | VERIFIED | Exists, `<h1>Blog coming soon</h1>`, owned `elendal:elendal 644` |
| `/etc/default/tailscaled` | Contains `TS_PERMIT_CERT_UID=caddy` | VERIFIED | Exactly 1 occurrence confirmed |
| `/etc/caddy/Caddyfile` | Symlink to `configs/Caddyfile` | VERIFIED | `lrwxrwxrwx ... /etc/caddy/Caddyfile -> /home/elendal/IdeaProjects/blog/configs/Caddyfile` |
| `caddy.service` | Running as system service, active | VERIFIED | PID 49895, `Active: active (running)`, reads via symlink config |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `public internet` | `tailscaled on fedora.mist-walleye.ts.net` | Tailscale Funnel `--https=443 --bg` | WIRED | `tailscale funnel status` confirms active rule port 443 → `http://localhost:8080` |
| `tailscaled (Funnel)` | `Caddy on localhost:8080` | plain HTTP proxy | WIRED | Funnel forwards HTTP; `curl localhost:8080` returns 200 with correct HTML |
| `/etc/caddy/Caddyfile` | `configs/Caddyfile` | filesystem symlink | WIRED | `ls -la /etc/caddy/Caddyfile` confirms symlink target |
| `caddy.service` | `/home/elendal/IdeaProjects/blog` | `ProtectHome=read-only` override + world-readable perms | WIRED | Override at `/etc/systemd/system/caddy.service.d/override.conf`; dirs `755`, files `644` |
| `/etc/default/tailscaled` | `tailscaled` process | `TS_PERMIT_CERT_UID=caddy` env var | WIRED | Var present; `tailscaled` `active` via systemctl |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Blog files organized in structured directory layout | SATISFIED | `articles/`, `templates/`, `css/`, `scripts/`, `configs/` all exist with `.gitkeep`; world-readable `755/644` |
| INFRA-02 | 01-01 | Tailscale daemon permitted to issue TLS certs to Caddy user (`TS_PERMIT_CERT_UID=caddy`) | SATISFIED | `grep TS_PERMIT_CERT_UID /etc/default/tailscaled` returns exactly 1 match; `tailscaled` is active. Note: cert delegation not exercised in final arch (Funnel owns cert), but requirement is structurally met |
| INFRA-03 | 01-02 | Caddy serves blog over HTTPS using Tailscale-issued `*.ts.net` TLS cert | SATISFIED (via Funnel) | REQUIREMENTS.md says `get_certificate tailscale` but the actual mechanism is Funnel TLS termination — the observable outcome (HTTPS, valid Tailscale cert, no browser warning) is achieved. Caddy serves HTTP :8080; Funnel provides the `*.ts.net` cert |
| INFRA-04 | 01-03 | Tailscale Funnel exposes blog to public internet on HTTPS port 443 | SATISFIED | `tailscale funnel status` shows `https://fedora.mist-walleye.ts.net (Funnel on)` with `|-- / proxy http://localhost:8080` |
| INFRA-05 | 01-03 | Blog accessible from external browser outside tailnet over HTTPS | SATISFIED | User confirmed "I can see blog coming soon" from external device during Plan 03 human checkpoint |

**Orphaned requirements:** None — all 5 Phase 1 requirement IDs (INFRA-01 through INFRA-05) are covered by plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `index.html` | 3 | `<h1>Blog coming soon</h1>` | INFO | Intentional placeholder per plan — Phase 1 success criterion explicitly requires "Blog coming soon" HTML for pipeline validation |

No blockers. No warnings. The "coming soon" text is the intended Phase 1 content.

### Human Verification Required

#### 1. External HTTPS Access Confirmation

**Test:** From a device outside the Tailscale tailnet (e.g., mobile on cellular), navigate to `https://fedora.mist-walleye.ts.net`
**Expected:** Page loads with "Blog coming soon", no TLS certificate warning in browser, HTTP 200 response
**Why human:** Cannot test TLS from inside the machine; cannot curl an external HTTPS endpoint to verify cert validity and absence of browser warnings
**Status:** CONFIRMED — User reported "I can see blog coming soon" during Plan 03 checkpoint on 2026-02-21

### Gaps Summary

No gaps. All 4 success criteria are verified. All 5 requirement IDs are satisfied.

The implementation diverged from the original Plan 01 TLS approach (`get_certificate tailscale` in Caddy) in favor of Tailscale Funnel TLS termination, but this is an architecturally superior solution that fully satisfies the phase goal and all requirements.

**Commit verification:** All commits referenced in SUMMARY files exist as real objects in the git repository:
- `1ab6947` (feat: create blog subdirectory layout) — verified
- `1c2e671` (feat: add Phase 1 Caddyfile) — verified
- `b0b29b9` (feat: update Caddyfile to plain HTTP :8080) — verified
- `489fe9d` (chore: enable Tailscale Funnel HTTPS on port 443) — verified

---

_Verified: 2026-02-21T23:58:00Z_
_Verifier: Claude (gsd-verifier)_
