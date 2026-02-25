---
title: "Socket-activated Guacamole with Tailscale identity"
date: "2026-02-22"
---

Running browser-based SSH, RDP, and VNC through [Apache Guacamole](https://guacamole.apache.org/) behind Tailscale involves three non-obvious decisions: socket activation for zero-cost idle, delegation of authentication to the network layer, and container networking that reaches the host.

Tested on Fedora with Guacamole 1.6.0, rootless Podman 4.4+, and systemd quadlet.

## The socket owns the port, not the container

guacd + Tomcat idle at ~350MB. For a service you connect to occasionally, that's waste. The fix: never let the container own the port.

A systemd socket unit holds `127.0.0.1:4848` permanently at near-zero cost — the kernel keeps the fd open, the service isn't running. `Requires=` chains pull the full stack up on first connection:

```
guacamole-proxy.socket        (always on, holds :4848)
  └─ activates proxy.service  (Requires= guacamole.service)
       └─ activates guacamole  (Requires= guacd.service)
```

Before accepting traffic, the proxy polls Tomcat's HTTP endpoint — up to 120 seconds, in practice ~12 seconds after guacd initializes (~3 seconds in the common case; worst-case startup is longer). `StopWhenUnneeded=yes` on both container services is the reciprocal: when the proxy exits after 2 minutes idle, it deactivates guacamole which deactivates guacd — both containers stop.

`systemd-socket-proxyd` handles all of this without custom code:

```ini
ExecStartPre=/bin/sh -c 'for i in $(seq 60); do curl -sf http://127.0.0.1:14848/guacamole/ \
  >/dev/null 2>&1 && exit 0; sleep 2; done; echo "guacamole not ready"; exit 1'
ExecStart=/usr/lib/systemd/systemd-socket-proxyd --exit-idle-time=2min 127.0.0.1:14848
```

Port 4848 is bound to `127.0.0.1` only. There are no publicly routable ports; Tailscale serve is the sole remote entry point.

## Authentication belongs to the network layer

`tailscale serve` proxies HTTPS from your tailnet to a local port. Only devices with a valid Tailscale identity reach it. That makes Guacamole's login screen redundant — anyone who gets to Tomcat is already on the tailnet.

The clean solution is `guacamole-auth-noauth`: a Guacamole extension that skips authentication entirely and serves connections to anyone who reaches the endpoint. Guacamole auto-discovers JARs placed in `GUACAMOLE_HOME/extensions/` — no `guacamole.properties` entry required. That's why the properties file in this project is effectively empty. Connections are defined in `noauth-config.xml`, which the extension reads directly:

```xml
<configs>
  <config name="SSH - localhost" protocol="ssh">
    <param name="hostname" value="host.containers.internal"/>
    <param name="port" value="22"/>
  </config>
  <config name="RDP - localhost" protocol="rdp">
    <param name="hostname" value="host.containers.internal"/>
    <param name="port" value="3389"/>
  </config>
</configs>
```

This is not a security shortcut — it's a deliberate boundary choice. **The assumption:** all devices on your Tailscale network are trusted peers. If your tailnet is shared (BYOD, contractors), noauth means every tailnet peer sees every configured connection; add Guacamole authentication in that case. For a personal or small-team tailnet where you control every device, the Tailscale layer is the right enforcement point.

`noauth-config.xml` reloads on the next page access — no service restart needed when you add or modify connections.

## Container networking

The two containers share a Podman bridge network (`guac_net`) so Guacamole reaches guacd by hostname (`GUACD_HOSTNAME=guacd`). The Guacamole container declares `AddHost=host.containers.internal:host-gateway`, which resolves to the host from inside the container — how SSH, RDP, and VNC connections cross the bridge.

This setup runs rootless under Podman with SELinux enforcing. Volume mounts use `:ro,Z` — the `Z` relabels the bind mount for the container's SELinux context; remove it on non-SELinux systems (Ubuntu, etc.). Production uses Podman quadlet (`.container` files generating native systemd units), not Docker Compose.

## The pattern

A systemd socket unit can hold any port indefinitely — container or otherwise — with the actual service starting on first use and stopping when idle. `Requires=` chains and `StopWhenUnneeded=yes` handle the cascade automatically.

When your network already enforces access — Tailscale, a VPN, a trusted internal network — duplicating that enforcement at the application layer adds friction without improving security. Pick the right boundary and own it cleanly.

Source: [github.com/igouss/webSshRdp](https://github.com/igouss/webSshRdp)
