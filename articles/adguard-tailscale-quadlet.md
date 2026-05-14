---
title: "AdGuard Home as its own Tailscale node, rootless Podman"
date: "2026-03-01"
---

Running [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) as a dedicated Tailscale node on Fedora — so every device on the tailnet gets DNS filtering by pointing at a single IP — hit several non-obvious problems. The problems and their fixes are documented first; the clean setup is at the end.

Tested on Fedora 43, rootless Podman 5.x, Tailscale 1.80+, AdGuard Home v0.107.72.

## The architecture

The design gives AdGuard Home its own Tailscale identity — a separate node on the tailnet with its own stable IP — by co-locating a Tailscale container with AdGuard in a Podman pod. The pod's shared network namespace means AdGuard's DNS port is reachable at the Tailscale container's tailnet IP.

```
Tailnet devices → Custom DNS 100.x.x.x:53 → AdGuard → Quad9 DoH
                                                     ↳ filter lists
Admin UI → https://<node>.ts.net/ → tailscale serve → AdGuard :80
```

Both containers run as rootless user systemd services via Podman quadlet (`.container` files in `~/.config/containers/systemd/`).

```
adguard.pod
├── adguard-tailscale.container  — provides tailnet identity and TUN
└── adguard-home.container       — DNS server and web UI
```

## Problem 1: `Device=` is not a valid Quadlet key

The Tailscale container needs `/dev/net/tun` for kernel-mode WireGuard. The quadlet documentation is sparse; the natural guess is `Device=`. It isn't valid.

```ini
# Wrong — quadlet rejects this silently at generation time
Device=/dev/net/tun:/dev/net/tun

# Right
AddDevice=/dev/net/tun:/dev/net/tun
```

Quadlet silently drops unknown keys and generates the unit anyway. The container starts but tailscale falls back to userspace mode, which uses DERP relays instead of direct WireGuard connections.

## Problem 2: host networking conflicts with the host Tailscale

The first instinct was `Network=host` — let Tailscale bind the TUN device on the host network stack like a normal install. That fails because there's already a host Tailscale daemon running, and both instances try to create `tailscale0` in the same network namespace.

The pod fixes this. Podman pods have their own network namespace; `tailscale0` inside the pod is invisible to the host. The Tailscale sidecar connects the pod's namespace to the tailnet independently.

```ini
# adguard.pod
[Pod]
```

No `Network=host` anywhere. pasta handles the pod's external connectivity.

## Problem 3: port 53 in rootless mode

Port 53 is below 1024. The kernel default for `net.ipv4.ip_unprivileged_port_start` on Fedora is 1024, so rootless processes can't bind it. Podman passes `CAP_NET_BIND_SERVICE` into the container to lift this restriction:

```ini
# adguard-home.container
AddCapability=NET_BIND_SERVICE
```

Without it, AdGuard starts but silently fails to bind DNS, and `dig @100.x.x.x example.com` times out.

## Problem 4: short image names fail in non-TTY context

Pulling `adguard/adguardhome:latest` works interactively because the shell can prompt for which registry to use. As a systemd service there's no TTY — Podman rejects the unqualified name.

```ini
# Wrong — fails under systemd
Image=adguard/adguardhome:latest

# Right
Image=docker.io/adguard/adguardhome:latest
```

## Problem 5: binding DNS and HTTP to the tailnet IP breaks restarts

The AdGuard setup wizard defaults to binding DNS and HTTP to whichever IP you complete setup from. Completing it from the tailnet IP sets:

```yaml
http:
  address: 100.122.205.95:80
dns:
  bind_hosts:
    - 100.122.205.95
```

On a cold start, `adguard-home` starts before `tailscale0` exists inside the pod. AdGuard tries to bind `100.122.205.95:53`, gets `cannot assign requested address`, and exits.

The fix is `0.0.0.0`. Inside the pod's network namespace there's no conflict with the host's `systemd-resolved` on `127.0.0.53` — those are different network namespaces.

```yaml
http:
  address: 0.0.0.0:80
dns:
  bind_hosts:
    - 0.0.0.0
```

Edit the YAML via `podman unshare` since the volume files are owned by the container's UID mapping:

```bash
podman unshare python3 -c "
import pathlib
p = pathlib.Path('/home/user/.local/share/containers/storage/volumes/adguard-conf/_data/AdGuardHome.yaml')
t = p.read_text()
t = t.replace('address: 100.x.x.x:80', 'address: 0.0.0.0:80')
t = t.replace('    - 100.x.x.x', '    - 0.0.0.0')
p.write_text(t)
"
```

## Problem 6: AdGuard can't be served at a subpath

The natural next question after DNS works is how to reach the admin UI. The first attempt was Caddy at `/adguard/*` → `reverse_proxy localhost:3300`. It fails because AdGuard serves all assets at absolute paths (`/login.html`, `/static/...`). A request to `/adguard/` redirects to `/login.html`; the browser requests that from Caddy's root; no match, 403.

AdGuard has a `url_prefix` config option for exactly this purpose. In v0.107.72 it's broken — setting it causes all requests to `/adguard/*` to return 401, including the login page itself.

The clean solution is to not serve it at a subpath at all. The Tailscale container is already a node on the tailnet; it can expose its own HTTPS endpoint via `tailscale serve`, completely separate from the host Caddy and Tailscale Funnel setup.

```bash
tailscale serve --bg http://localhost:80
```

`localhost:80` inside the pod is AdGuard's HTTP port — not the host's port 80. The result is `https://<node>.ts.net/` accessible to any tailnet device, with Tailscale's own HTTPS cert.

## Making tailscale serve persistent

`tailscale serve` configuration persists in the state volume by default, but it's better to make it explicit via `TS_SERVE_CONFIG`:

```json
{
  "TCP": {"443": {"HTTPS": true}},
  "Web": {
    "${TS_CERT_DOMAIN}:443": {
      "Handlers": {"/": {"Proxy": "http://localhost:80"}}
    }
  }
}
```

Mount it read-only into the Tailscale container:

```ini
Volume=%h/infra/adguard/ts-serve.json:/etc/ts-serve.json:ro,Z
Environment=TS_SERVE_CONFIG=/etc/ts-serve.json
```

`${TS_CERT_DOMAIN}` is substituted at runtime with the node's cert domain. `tailscale serve status` may show "No serve config" briefly after start; the logs confirm it's applied ("serve proxy: applying serve config").

## Setup

### 1. Auth key

In the Tailscale admin console: **Settings → Keys → Generate auth key**. Check **Reusable**. Leave **Ephemeral** unchecked if you want the node to persist in the admin console when offline (stable IP); check it if you want the node to disappear when stopped.

### 2. Serve config

Create `ts-serve.json` — this tells the Tailscale container to expose AdGuard's HTTP port over HTTPS on the tailnet:

```json
{
  "TCP": {"443": {"HTTPS": true}},
  "Web": {
    "${TS_CERT_DOMAIN}:443": {
      "Handlers": {"/": {"Proxy": "http://localhost:80"}}
    }
  }
}
```

`${TS_CERT_DOMAIN}` is substituted at runtime by the Tailscale container's entrypoint with the node's actual cert domain.

### 3. Quadlet files

Place these in `~/.config/containers/systemd/`:

**`adguard.pod`**
```ini
[Unit]
Description=AdGuard Home + Tailscale DNS node
After=network-online.target
Wants=network-online.target

[Pod]

[Install]
WantedBy=default.target
```

**`adguard-tailscale.container`**
```ini
[Unit]
Description=Tailscale — DNS gateway
After=network-online.target
Wants=network-online.target

[Container]
Image=ghcr.io/tailscale/tailscale:latest
ContainerName=adguard-ts
Pod=adguard.pod
AddCapability=NET_ADMIN
AddCapability=NET_RAW
AddDevice=/dev/net/tun:/dev/net/tun
Volume=adguard-ts-state:/var/lib/tailscale:Z
Volume=%h/infra/adguard/ts-serve.json:/etc/ts-serve.json:ro,Z
EnvironmentFile=%E/containers/systemd/adguard.env
Environment=TS_USERSPACE=false
Environment=TS_STATE_DIR=/var/lib/tailscale
Environment=TS_SERVE_CONFIG=/etc/ts-serve.json
Environment=TS_EXTRA_ARGS=--accept-dns=false --hostname=adguard-dns

[Service]
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

**`adguard-home.container`**
```ini
[Unit]
Description=AdGuard Home — DNS filtering
After=adguard-tailscale.service
Requires=adguard-tailscale.service

[Container]
Image=docker.io/adguard/adguardhome:latest
ContainerName=adguard-home
Pod=adguard.pod
Volume=adguard-work:/opt/adguardhome/work:Z
Volume=adguard-conf:/opt/adguardhome/conf:Z
AddCapability=NET_BIND_SERVICE

[Service]
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

**`adguard.env`** (keep out of version control):
```
TS_AUTHKEY=tskey-auth-...
```

### 4. Start

```bash
systemctl --user daemon-reload
systemctl --user start adguard-pod.service
```

Check the tailnet IP:

```bash
podman exec adguard-ts tailscale status
```

### 5. Run the wizard

The setup wizard runs on port 3000. Access it directly via the tailnet IP — **not** the `https://<node>.ts.net` URL, which proxies port 80 and returns 502 until setup is complete:

```
http://100.x.x.x:3000
```

During setup, set the **admin UI port to 80** and the **DNS listen interface to 0.0.0.0**.

### 6. Fix bind addresses

The wizard may save the tailnet IP as the bind address regardless of what you entered. Check `AdGuardHome.yaml` and correct if needed:

```bash
podman unshare python3 -c "
import pathlib
p = pathlib.Path('/home/user/.local/share/containers/storage/volumes/adguard-conf/_data/AdGuardHome.yaml')
t = p.read_text()
t = t.replace('address: 100.x.x.x:80', 'address: 0.0.0.0:80')
t = t.replace('    - 100.x.x.x\n', '    - 0.0.0.0\n')
p.write_text(t)
"
systemctl --user restart adguard-pod.service
```

After restart, the admin UI is available at `https://<node>.ts.net/`.

### 7. Connect devices

In the Tailscale admin console: **DNS → Nameservers → Add nameserver → Custom** → enter the tailnet IP. Enable **Override local DNS** to route all tailnet DNS through AdGuard. The IP is stable as long as the state volume exists; wipe the volume and you get a new IP.
