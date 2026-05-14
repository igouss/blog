---
title: "Migrating services from Caddy subpaths to Tailscale sidecars"
date: "2026-03-08"
---

The homelab started with everything behind a single Caddy instance: services lived at `/code`, `/files`, `/status`, accessed through the tailnet via a `Tailscale-User-Login` header check. It works, but subpaths are friction — apps need to know where they live, Caddy needs to strip prefixes, and anything that generates absolute URLs silently breaks.

The Tailscale sidecar pattern is cleaner: each service gets its own pod with a co-located Tailscale container, its own `*.ts.net` subdomain, and TLS that Tailscale provisions and terminates. No Caddy involvement. This is a record of migrating three services — openvscode-server, Gatus, and copyparty — from subpaths to sidecars, and the non-obvious problems along the way.

## The before state

```
Tailnet → Caddy :8080 → /code*   → openvscode-server localhost:3030
                       → /status* → Gatus localhost:3002
                       → /files*  → copyparty localhost:3923
```

Each service was behind an `@tailnet` matcher that checked for the `Tailscale-User-Login` header. Fine for access control, but each app had to be told about its subpath:

- openvscode-server launched with `--server-base-path=/code`
- Gatus had `base-path: /status` in its config
- Caddy stripped `/status` before proxying to Gatus with `uri strip_prefix /status`
- copyparty launched with `--rp-loc /files --rproxy -2`

## The after state

```
Tailnet → code.ts.net:443   → Tailscale sidecar → openvscode-server :3000
        → status.ts.net:443 → Tailscale sidecar → Gatus :3002
        → files.ts.net:443  → Tailscale sidecar → copyparty :3923
```

Each service is a Podman pod with two containers: the app and a Tailscale sidecar. The pod's shared network namespace means the sidecar can reach the app on `localhost`. Tailscale serves HTTPS using a `ts-serve.json` config, and the `*.ts.net` cert is provisioned automatically.

## Problem 1: `UserNS=keep-id` is incompatible with pod mode

The openvscode-server container had `UserNS=keep-id` to preserve the host user's UID inside the container — necessary for write access to bind-mounted home directory volumes. Adding `Pod=openvscode-server.pod` caused a hard failure at start:

```
Error: --userns and --pod cannot be set together
```

Podman manages the user namespace at the pod level, not per-container. Inside a rootless pod, container uid 0 already maps to the host user's uid via the pod's userns mapping. `keep-id` is redundant and rejected.

```ini
# Wrong — fails with Pod=
UserNS=keep-id

# Right — uid 0 in the container = host user uid in rootless pod
User=0
```

## Problem 2: `--hostname` in `TS_EXTRA_ARGS` is overridden by the pod's OS hostname

Quadlet pods get a synthetic OS hostname derived from the pod name. A pod named `adguard.pod` gets the OS hostname `systemd-adguard`. If `TS_EXTRA_ARGS=--hostname=adguard-dns`, Tailscale's `--hostname` flag is processed after containerboot reads the OS hostname — the OS hostname wins, and the node registers as `systemd-adguard` on the tailnet.

The fix is `TS_HOSTNAME`, a first-class environment variable that containerboot processes before calling `tailscale up`:

```ini
# Wrong — OS hostname from Quadlet overrides this
Environment=TS_EXTRA_ARGS=--accept-dns=false --hostname=adguard-dns

# Right — TS_HOSTNAME wins over the OS hostname
Environment=TS_HOSTNAME=adguard-dns
Environment=TS_EXTRA_ARGS=--accept-dns=false
```

If the node was already registered under the wrong name, renaming it without wiping the state volume:

```bash
podman exec <ts-container> tailscale set --hostname=adguard-dns
```

## Problem 3: app subpath configuration must be removed

Apps configured for a subpath will generate broken links when served at root. openvscode-server launched with:

```ini
Exec=--server-base-path=/code --without-connection-token
```

At `code.ts.net/`, the server-base-path is `/` — `--server-base-path=/code` makes VS Code generate asset URLs prefixed with `/code/`, which all 404. Drop the flag:

```ini
Exec=--without-connection-token
```

Same principle for any app that takes a base-path argument or reads it from config.

## Problem 4: Gatus `base-path` must be removed

Gatus had:

```yaml
web:
  port: 3002
  base-path: /status
```

`base-path` tells Gatus to serve its UI from `/status/` and generate all internal links relative to that path. Served at the root of `status.ts.net`, the UI loads but navigation is broken — all links point to `/status/something` instead of `/something`.

```yaml
web:
  port: 3002
```

## Problem 5: Gatus health checks broke when `Network=host` was removed

Gatus was running with `Network=host`, so `localhost` in its health check config referred to the host's loopback. Inside a pod, `localhost` is the pod's loopback — no services are on it.

```yaml
# Before — worked with Network=host
- name: copyparty
  url: http://localhost:3923

# After — use the actual service address
- name: copyparty
  url: https://files.ts.net
```

For services that don't have a Tailscale hostname (PostgreSQL on a host port, ttyd on a host port), use the host's Tailscale IP instead of `localhost`:

```yaml
- name: PostgreSQL
  url: tcp://100.73.161.25:5432

- name: ttyd
  url: tcp://100.73.161.25:7681
```

The Gatus pod's network namespace has full Tailscale connectivity because the sidecar creates a `tailscale0` interface inside it — Tailscale hostnames and tailnet IPs are all reachable from within the pod.

## Migration steps

### 1. Create the pod and sidecar files

For each service, create three files:

**`<service>.pod`**
```ini
[Unit]
Description=<Service> + Tailscale node
After=network-online.target
Wants=network-online.target

[Pod]

[Install]
WantedBy=default.target
```

**`<service>-tailscale.container`**
```ini
[Unit]
Description=Tailscale — <service> gateway
After=network-online.target
Wants=network-online.target

[Container]
Image=ghcr.io/tailscale/tailscale:latest
ContainerName=<service>-ts
Pod=<service>.pod

AddCapability=NET_ADMIN
AddCapability=NET_RAW
AddDevice=/dev/net/tun:/dev/net/tun

Volume=<service>-ts-state:/var/lib/tailscale:Z
Volume=%h/infra/<service>/ts-serve.json:/etc/ts-serve.json:ro,Z

EnvironmentFile=%E/containers/systemd/<service>.env
Environment=TS_USERSPACE=false
Environment=TS_STATE_DIR=/var/lib/tailscale
Environment=TS_SERVE_CONFIG=/etc/ts-serve.json
Environment=TS_HOSTNAME=<hostname>
Environment=TS_EXTRA_ARGS=--accept-dns=false

[Service]
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

**`ts-serve.json`**
```json
{
  "TCP": {
    "443": {
      "HTTPS": true
    }
  },
  "Web": {
    "${TS_CERT_DOMAIN}:443": {
      "Handlers": {
        "/": {
          "Proxy": "http://localhost:<port>"
        }
      }
    }
  }
}
```

### 2. Update the app container

```ini
# Remove these
PublishPort=127.0.0.1:<host-port>:<container-port>
Network=host
UserNS=keep-id

# Add
Pod=<service>.pod
User=0   # if the original container used UserNS=keep-id

# Remove any subpath-awareness flags from Exec=
```

### 3. Remove the Caddy blocks

```caddy
# Delete these
handle /code* {
    handle @tailnet {
        reverse_proxy localhost:3030
    }
    respond "Forbidden" 403
}
```

### 4. Deploy

```bash
# Get an auth key from https://login.tailscale.com/admin/settings/keys
cp <service>/*.container <service>/*.pod ~/.config/containers/systemd/
echo "TS_AUTHKEY=tskey-auth-..." > ~/.config/containers/systemd/<service>.env

systemctl --user stop <service>.service   # stop the old standalone container
systemctl --user daemon-reload
systemctl --user start <service>-pod.service

# Reload Caddy to drop the removed handle blocks
caddy reload --config /path/to/Caddyfile
```

### 5. Verify

```bash
curl -o /dev/null -w "%{http_code}" https://<hostname>.ts.net
```

`200` or a service-specific redirect means the sidecar is up and serving. The old Caddy paths return 403 from the catch-all after reload.
