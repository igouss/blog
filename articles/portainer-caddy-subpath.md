---
title: "Portainer at a subpath behind Caddy"
date: "2026-02-24"
---

Getting [Portainer CE](https://www.portainer.io/) to work at `/pods` behind Caddy on Fedora with rootless Podman hit three non-obvious problems. Each one looked like the previous fix hadn't worked.

Tested on Fedora with Portainer 2.33.7, Caddy 2.x, rootless Podman, and Tailscale serving HTTPS.

## The stack

Tailscale terminates HTTPS and forwards to Caddy on `127.0.0.1:8080`. Caddy handles routing for several services — a blog, ttyd, wetty, and portainer — all behind a single domain with no exposed ports. Portainer runs as a rootless Podman container with the podman socket mounted at `/var/run/docker.sock`.

```
Browser → Tailscale HTTPS → Caddy :8080 → portainer :9000
```

The goal: portainer accessible at `https://fedora.mist-walleye.ts.net/pods/` alongside other services.

## Problem 1: `--base-url` doesn't move the static files

The portainer docs say to pass `--base-url /pods` and have your reverse proxy strip the prefix. The implication is that portainer will serve at `/pods/`. It doesn't.

Static files are always served at `/`. What `--base-url` actually does is configure the Angular app's internal routing and API base URL at runtime. With `--base-url /pods`, the JS sets `document.getElementById('base').href` dynamically — but the HTML is still fetched from `/`, not `/pods/`.

The correct setup: strip the prefix in Caddy, and portainer works from `/`.

```
Caddyfile:
handle /pods/* {
    uri strip_prefix /pods
    reverse_proxy localhost:9000
}
```

Caddy receives `/pods/api/endpoints`, strips to `/api/endpoints`, portainer handles it. The HTML's relative asset paths (`src="vendor.xxx.js"`) resolve correctly because the browser's base URL is `/pods/`.

## Problem 2: the trailing slash is load-bearing

Without a redirect from `/pods` to `/pods/`, the browser URL stays at `/pods` (no slash). Portainer's JS uses `baseURL: "api"` — a relative URL. Relative to `/pods` (no slash), `api` resolves to `/api`. That request hits Caddy's catch-all and gets a 403.

Relative to `/pods/` (with slash), `api` resolves to `/pods/api/`. Caddy strips the prefix, portainer gets `/api/`. Correct.

The fix is a redirect:

```
@pods-no-slash path /pods
redir @pods-no-slash /pods/ 301

handle /pods/* {
    uri strip_prefix /pods
    reverse_proxy localhost:9000
}
```

Everything worked after that redirect except API calls, which returned 403. That was a different problem.

## Problem 3: CSRF sees `http` origin, gets `https` referer

Portainer validates request Origin against the Host header, factoring in protocol via `X-Forwarded-Proto`. The browser sent `Origin: https://fedora.mist-walleye.ts.net`. Portainer saw `x_forwarded_proto: http`.

The mismatch: Caddy runs on HTTP internally. Tailscale terminates TLS upstream. Caddy never saw an HTTPS connection, so it forwarded `X-Forwarded-Proto: http`. Portainer's CSRF check compared `https://` origin to `http://` host and rejected it.

Fix — explicitly tell portainer the upstream connection was HTTPS:

```
handle /pods/* {
    uri strip_prefix /pods
    reverse_proxy localhost:9000 {
        header_up X-Forwarded-Proto https
    }
}
```

The same issue will surface on any service behind this stack that does origin validation.

## The final Caddyfile fragment

```
@pods-no-slash path /pods
redir @pods-no-slash /pods/ 301

handle /pods/* {
    uri strip_prefix /pods
    reverse_proxy localhost:9000 {
        header_up X-Forwarded-Proto https
    }
}
```

And in the Podman quadlet, `--base-url` is optional — since portainer JS uses a relative `baseURL`, the trailing-slash redirect is what actually makes it work:

```ini
[Container]
Image=docker.io/portainer/portainer-ce:latest
Volume=%t/podman/podman.sock:/var/run/docker.sock:ro,Z
PublishPort=127.0.0.1:9000:9000
Exec=--http-enabled
```

## Registering the local environment

Once portainer is accessible, the local podman environment needs to be registered. It's not automatic. The socket is mounted and portainer knows it's there, but the endpoint still needs to be created — either through the UI on first login, or via the API:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:9000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' \
  | jq -r .jwt)

curl -s -X POST http://127.0.0.1:9000/api/endpoints \
  -H "Authorization: Bearer $TOKEN" \
  -F "Name=local" \
  -F "EndpointCreationType=1"
```

`EndpointCreationType=1` tells portainer to use the local socket. Status 1 in the response means it connected.

Note: portainer disables the admin setup endpoint after 5 minutes for security. If you get locked out, restart the container — the clock resets but existing data is preserved.
