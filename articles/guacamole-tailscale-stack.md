---
title: "Socket-activated Guacamole with Tailscale identity"
date: "2026-02-22"
---

Running browser-based SSH, RDP, and VNC through [Apache Guacamole](https://guacamole.apache.org/) behind Tailscale involves three non-obvious decisions: socket activation for zero-cost idle, header auth for SSO, and a thin proxy to bridge them.

## The socket owns the port, not the container

guacd + Tomcat idle at ~350MB. For a service you connect to occasionally, that's waste. The fix is to never let the container own the port.

A systemd socket unit holds `127.0.0.1:4848` permanently at near-zero cost. The proxy service has `Requires=guacamole.service`, and guacamole has `Requires=guacd.service`. When a browser connects, the socket activates the proxy, which pulls the full stack up. `StopWhenUnneeded=yes` on both container services is the reciprocal: when no unit `Requires=` them anymore, they stop. When the proxy idles out and exits, it no longer requires guacamole — which no longer requires guacd — and both containers stop.

```
guacamole-proxy.socket        (always on, holds :4848)
  └─ activates proxy.service  (Requires= guacamole.service)
       └─ activates guacamole  (Requires= guacd.service)
```

Before accepting traffic, the proxy runs an `ExecStartPre` that polls Tomcat's HTTP endpoint in a loop — up to 120 seconds, though Tomcat typically responds in ~12 seconds after guacd is up (~3 seconds). The proxy exits after 120 seconds of no active connections; `StopWhenUnneeded` cascades the rest.

Port 4848 is bound to `127.0.0.1` only. Tailscale serve is the sole remote entry point; no firewall rules needed.

## Header auth alone isn't enough

`tailscale serve` proxies HTTPS from your tailnet to a local port and injects `Tailscale-User-Login` on every request — the authenticated user's login, set by Tailscale and unforgeable within that path. `guacamole-auth-header` reads a configurable header and authenticates from its value:

```
http-auth-header: Tailscale-User-Login
```

No login screen. But here's the problem: `guacamole-auth-header` authenticates the user and provides no connections. Connections live in `user-mapping.xml`, owned by `BasicFileAuthenticationProvider`. For that provider to contribute to `availableDataSources`, it must also succeed in `authenticateUser()` — which reads `credentials.getUsername()` and `credentials.getPassword()` from the POST body. When header auth bypasses the login form, the browser POSTs empty credentials. The file provider gets an empty username, returns null, and its connections are excluded.

```bash
# header only → availableDataSources: []
curl -s -X POST http://localhost:14848/guacamole/api/tokens \
  -H "Tailscale-User-Login: you@example.com" -d ""

# header + credentials → availableDataSources: ["default"]
curl -s -X POST http://localhost:14848/guacamole/api/tokens \
  -H "Tailscale-User-Login: you@example.com" \
  --data-urlencode "username=you@example.com" \
  --data-urlencode "password=yourpass"
```

(These hit Tomcat directly at 14848 to test each auth layer in isolation.)

This is why `systemd-socket-proxyd` can't be used off the shelf. A thin HTTP proxy replaces it: on `POST /guacamole/api/tokens` with the Tailscale header present, it parses the form-encoded body and injects `username` and `password` via `setdefault` — never overwriting values that are already present. WebSocket upgrade requests (used for the actual terminal and RDP tunnels) are detected by the `Upgrade: websocket` header; the proxy forwards the HTTP 101 handshake response then switches to raw bidirectional pipe mode. The idle watchdog — previously `systemd-socket-proxyd --exit-idle-time` — is reimplemented as a background thread that checks every 15 seconds and calls `os._exit(0)` when idle time is exceeded.

## Container networking

The two containers share a Podman bridge network (`guac_net`) so Guacamole can reach guacd by hostname (`GUACD_HOSTNAME=guacd`). The Guacamole container also declares `AddHost=host.containers.internal:host-gateway`, which is how SSH, RDP, and VNC connections reach services running on the host from inside the container.

This setup runs rootless under Podman with SELinux enforcing (Fedora). The volume mount uses `:ro,Z` — the `Z` relabels the bind mount for the container's SELinux context. Remove `:Z` on non-SELinux systems.

## The pattern

The core insight transfers beyond Guacamole: a systemd socket unit can hold any port indefinitely, with the actual service — container or otherwise — only starting on first use and stopping when idle. `Requires=` chains and `StopWhenUnneeded=yes` handle the cascade automatically. The proxy layer is only necessary because `guacamole-auth-header` and `user-mapping.xml` don't compose without explicit credential bridging in Guacamole 1.6.0; on a database-backed install, the JDBC provider handles `updateAuthenticatedUser()` without credential replay.

Source: [github.com/igouss/webSshRdp](https://github.com/igouss/webSshRdp)
