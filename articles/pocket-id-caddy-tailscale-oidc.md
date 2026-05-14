---
title: "Passkey SSO for tailnet services: Pocket ID, caddy-security, Podman quadlet"
date: "2026-03-03"
---

Protecting internal services on a Tailscale network with passkey-based single sign-on. [Pocket ID](https://github.com/pocket-id/pocket-id) is the OIDC provider — it authenticates users with WebAuthn passkeys, no passwords. [caddy-security](https://github.com/greenpau/caddy-security) sits in Caddy and acts as the OIDC relying party, issuing session cookies that gate access to services like ttyd, file servers, and dashboards.

Tested on Fedora 43, rootless Podman 5.x, Caddy 2.11.1, caddy-security v1.1.36, Pocket ID v2.3.0.

## The architecture

Pocket ID runs as a dedicated Tailscale node (`auth.ts.net`) — its own node identity, reachable only from the tailnet, never exposed to the internet. The app node (`fedora.ts.net`) runs Caddy with caddy-security. Tailscale Funnel serves the public blog; a `Tailscale-User-Login` header matcher limits protected services to tailnet devices.

```
Internet → Tailscale Funnel → Caddy :8080 → blog (public)

Tailnet  → Caddy :8080 → /auth/   caddy-security portal
                        → /ttyd/  authorize → ttyd
                        → /files/ authorize → copyparty
                            ↕ OIDC
                        Pocket ID (auth.ts.net:1411)
```

Pocket ID and its Tailscale sidecar run as a Podman pod via quadlet (rootless user systemd services). Tailscale's HTTPS proxy terminates TLS at `auth.ts.net:443` and forwards to `localhost:1411`.

```
pocket-id.pod
├── pocket-id-tailscale.container  — tailnet identity, TUN, ts serve
└── pocket-id-app.container        — OIDC provider, passkey UI
```

## Problem 1: wrong image name

The Pocket ID GitHub README references `stonith404/pocket-id`. That repository does not exist on Docker Hub. The correct registry is GitHub Container Registry:

```
# Wrong — image not found
Image=stonith404/pocket-id:latest

# Right
Image=ghcr.io/pocket-id/pocket-id:v2
```

## Problem 2: env var names have changed

The `.env.example` in older documentation lists variables that no longer exist in v2. Pocket ID v2.3.0 uses:

```ini
APP_URL=https://auth.mist-walleye.ts.net   # required
ENCRYPTION_KEY=<openssl rand -base64 32>   # required, min 16 bytes
PORT=1411
```

Variables that do not exist: `COOKIE_DOMAIN`, `DB_PROVIDER`, `PUBLIC_APP_DISABLE_SIGNUP`, `DISABLE_AUTHENTICATION`. The database defaults to `data/pocket-id.db` (SQLite). User signups are disabled by default.

## Problem 3: OIDC users get `authp/guest` by default

After wiring up the OIDC client and getting Pocket ID logins to complete, caddy-security would accept the login but then immediately redirect back to the auth portal when accessing any protected route. The access log showed a successful OIDC callback followed by the protected route still returning 302.

The journal explained it:

```json
{"roles":["authp/guest"]}
```

caddy-security assigns `authp/guest` to all OIDC-authenticated users unless told otherwise. The authorization policy requires `authp/user`. The fix is a `transform user` block in the authentication portal:

```caddy
authentication portal myportal {
    ...
    transform user {
        match origin pocket-id
        action add role authp/user
    }
}
```

`match origin pocket-id` matches the identity provider name set in `oauth identity provider pocket-id { ... }`.

## Problem 4: the authorization policy can't verify the portal's JWTs

Even after fixing the roles, the journal showed a second error:

```
user authorization failed: reason: keystore: failed to parse token
```

The portal signs session JWTs with `crypto key sign-verify`. The authorization policy — despite being in the same `security { }` block — does not automatically inherit that key. It needs `crypto key verify` with the same secret:

```caddy
authorization policy tailnet_users {
    ...
    crypto key verify {env.CADDY_AUTH_SECRET}
}
```

## Problem 5: don't put `authenticate with myportal` on protected routes

The natural instinct to fix redirect behavior was to add `authenticate with myportal` to each protected route alongside `authorize`. This makes caddy-security try to serve the portal UI at that path — `/ttyd`, `/files`, etc. The portal's static assets (CSS, JS, logo) are served at absolute paths like `/assets/images/logo.svg`, which get caught by the catch-all 403. The portal page shows "not found" and broken assets.

The correct pattern: `authenticate with myportal` only on the `/auth*` path. Protected routes get only `authorize with tailnet_users`.

## Problem 6: OIDC callback URL

When registering the OIDC client in Pocket ID's admin UI, the redirect URI must match exactly what caddy-security expects. The format is:

```
{portal_base_url}/oauth2/{provider_name}/authorization-code-callback
```

With portal at `https://fedora.mist-walleye.ts.net/auth/` and provider named `pocket-id`:

```
https://fedora.mist-walleye.ts.net/auth/oauth2/pocket-id/authorization-code-callback
```

## Problem 7: QR code login links to /login — 403

The caddy-security portal renders a QR code on the login page. The QR encodes a URL pointing to `/login`, not `/auth/login`. Scanning it on a phone opens `https://fedora.mist-walleye.ts.net/login`, which hits the catch-all 403.

caddy-security generates this URL without knowing the portal is mounted at `/auth/`. The fix is a redirect before the portal handler:

```caddy
redir /login /auth/login 302
```

No tailnet gating needed on the redirect — `/auth/login` handles that.

## Logout must go through caddy-security, not Pocket ID

Logging out via Pocket ID's own UI (`auth.ts.net`) leaves caddy-security's session cookie intact — protected services remain accessible. caddy-security validates its JWTs locally using `CADDY_AUTH_SECRET` and never checks back with Pocket ID after the initial login. Killing the Pocket ID session has no effect on the caddy-security session.

The correct logout URL is caddy-security's own endpoint:

```
https://fedora.mist-walleye.ts.net/auth/logout
```

That clears the caddy-security cookie first, then chains to Pocket ID's OIDC end-session endpoint. Bookmarking this URL (or linking it from a services dashboard) is the only logout that actually works.

## Redirect behavior after login

After a successful OIDC login, caddy-security v1.1.36 lands on `/auth/portal` rather than the original URL. The `redirect_url` query parameter is passed to the portal but lost through the OIDC roundtrip. This is a known limitation — the state parameter doesn't carry the redirect URL reliably. In practice it's a minor inconvenience: the user clicks through once, authorization succeeds on the next visit, and the session cookie covers all protected routes for the token lifetime.

## The clean setup

### Quadlet files

`~/.config/containers/systemd/pocket-id.pod`:
```ini
[Pod]
```

`~/.config/containers/systemd/pocket-id-tailscale.container`:
```ini
[Unit]
Description=Pocket ID Tailscale sidecar

[Container]
Image=tailscale/tailscale:latest
ContainerName=pocket-id-tailscale
EnvironmentFile=%h/.config/containers/systemd/pocket-id.env
Volume=pocket-id-ts-state:/var/lib/tailscale
AddDevice=/dev/net/tun:/dev/net/tun
Network=host
AddCapability=NET_ADMIN NET_RAW
Exec=tailscaled --state=/var/lib/tailscale/tailscaled.state

[Service]
Restart=always

[Install]
WantedBy=default.target
```

`~/.config/containers/systemd/pocket-id-app.container`:
```ini
[Unit]
Description=Pocket ID passkey auth service
Requires=pocket-id-tailscale.service

[Container]
Image=ghcr.io/pocket-id/pocket-id:v2
ContainerName=pocket-id-app
EnvironmentFile=%h/.config/containers/systemd/pocket-id.env
Volume=pocket-id-data:/app/data
Network=host

[Service]
Restart=always

[Install]
WantedBy=default.target
```

`~/.config/containers/systemd/pocket-id.env`:
```ini
TS_AUTHKEY=tskey-auth-...
TS_HOSTNAME=auth
APP_URL=https://auth.mist-walleye.ts.net
ENCRYPTION_KEY=<openssl rand -base64 32>
PORT=1411
```

After starting: `podman exec pocket-id-tailscale tailscale serve --https=443 http://localhost:1411`

First-time setup: navigate to `https://auth.mist-walleye.ts.net/setup` (does not redirect there automatically).

### OIDC client in Pocket ID admin

Create a client at `https://auth.mist-walleye.ts.net/admin` with:
- Redirect URI: `https://fedora.mist-walleye.ts.net/auth/oauth2/pocket-id/authorization-code-callback`
- Note the client ID and secret

### Caddyfile

```caddy
{
    order authenticate before respond
    order authorize before reverse_proxy

    security {
        oauth identity provider pocket-id {
            realm pocket-id
            driver generic
            client_id {env.POCKET_ID_CLIENT_ID}
            client_secret {env.POCKET_ID_CLIENT_SECRET}
            scopes openid email profile
            metadata_url https://auth.mist-walleye.ts.net/.well-known/openid-configuration
        }

        authentication portal myportal {
            crypto default token lifetime 3600
            crypto key sign-verify {env.CADDY_AUTH_SECRET}
            enable identity provider pocket-id
            cookie domain mist-walleye.ts.net
            transform user {
                match origin pocket-id
                action add role authp/user
            }
        }

        authorization policy tailnet_users {
            set auth url https://fedora.mist-walleye.ts.net/auth/
            crypto key verify {env.CADDY_AUTH_SECRET}
            allow roles authp/user authp/admin
        }
    }
}

:8080 {
    # tailnet matcher — Tailscale injects this header for authenticated devices
    @tailnet header Tailscale-User-Login *

    # auth portal — tailnet only
    handle /auth* {
        handle @tailnet {
            authenticate with myportal
        }
        respond "Forbidden" 403
    }

    # protected service — tailnet + valid session
    handle /ttyd* {
        handle @tailnet {
            authorize with tailnet_users
            reverse_proxy localhost:7681
        }
        respond "Forbidden" 403
    }
}
```

Env vars for Caddy (add to the service's env file):
```ini
POCKET_ID_CLIENT_ID=<from pocket-id admin>
POCKET_ID_CLIENT_SECRET=<from pocket-id admin>
CADDY_AUTH_SECRET=<openssl rand -base64 32>
```
