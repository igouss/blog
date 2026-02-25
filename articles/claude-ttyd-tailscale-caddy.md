---
title: "Claude Code in a browser terminal, tailnet-only, no port"
date: "2026-02-25"
---

Running `claude --dangerously-skip-permissions` in a browser terminal via [ttyd](https://github.com/tsl0922/ttyd), accessible at `https://fedora.mist-walleye.ts.net/code` with no port number, visible only to tailnet devices, while the blog at `/` stays public. The non-obvious part is how to get tailnet-only access on port 443 when Tailscale's Funnel already owns it.

Tested on Fedora with ttyd 1.7.7, Caddy 2.x, and Tailscale.

## The stack

Tailscale Funnel terminates HTTPS and forwards all traffic to Caddy on `127.0.0.1:8080`. Caddy routes to services. ttyd wraps the Claude CLI and serves a browser terminal.

```
Browser → Tailscale HTTPS :443 → Caddy :8080 → ttyd :7682 → claude
```

The goal: `/code` accessible from tailnet devices at the default HTTPS port, returning 403 to anyone coming in via Funnel from the internet.

## Problem: Funnel and tailnet-only serve can't share port 443

The natural approach is `tailscale serve --set-path /code http://localhost:7682/code` alongside the existing Funnel. Tailscale won't allow it — adding a non-Funnel route to port 443 silently removes the Funnel:

```
Removing Funnel for fedora.mist-walleye.ts.net:443
```

The blog goes offline. Tailscale treats port 443 as owned by either Funnel or serve, not both.

The workaround of using port 8443 (`tailscale serve --https=8443`) works but puts `:8443` in every URL.

## The fix: Tailscale-User-Login header

Tailscale injects `Tailscale-User-Login` on requests from authenticated tailnet nodes, and **strips it from incoming requests before forwarding** — so it can't be spoofed via Funnel. Internet traffic arriving through Funnel carries no such header.

Both paths — Funnel from the internet and direct tailnet access — arrive at Caddy via `localhost:8080`. The header is the only difference Caddy can see.

Gate `/code` on that header:

```
handle /code* {
    @tailnet header Tailscale-User-Login *
    handle @tailnet {
        reverse_proxy localhost:7682
    }
    respond "Forbidden" 403
}
```

`?*` matches any non-empty value. Tailnet users get the terminal. Everyone else gets 403. No separate port required.

## ttyd subpath setup

ttyd needs `-b /code` to serve correctly under a path prefix, and `-W` to allow keyboard input (readonly by default). A wrapper script avoids quoting issues in the systemd unit:

```bash
#!/bin/bash
exec ttyd \
  -p 7682 \
  -i 127.0.0.1 \
  -w /home/elendal/IdeaProjects/photo_gallery \
  -W \
  -b /code \
  -m 1 \
  -t 'fontSize=16' \
  -t 'fontFamily=Monospace' \
  -t 'theme={"background":"#282c34","foreground":"#ffffff","black":"#1d1f21","red":"#cc6666","green":"#b5bd68","yellow":"#f0c674","blue":"#81a2be","magenta":"#b294bb","cyan":"#8abeb7","white":"#c5c8c6","brightBlack":"#666666","brightRed":"#d54e53","brightGreen":"#b9ca4a","brightYellow":"#e7c547","brightBlue":"#7aa6da","brightMagenta":"#c397d8","brightCyan":"#70c0b1","brightWhite":"#eaeaea"}' \
  tmux new-session -A -s claude -c /path/to/project claude --dangerously-skip-permissions
```

`-m 1` limits to one concurrent client. `-i 127.0.0.1` keeps the port off the public interface. The theme JSON replicates the Ghostty default palette; passing it via a script avoids escaping it in `ExecStart`.

The systemd user service:

```ini
[Unit]
Description=Claude Code ttyd (/code)
After=network-online.target

[Service]
ExecStart=/home/elendal/.local/bin/claude-code-ttyd.sh
Restart=on-failure

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now claude-code-ttyd.service
```

## Mobile keyboard

ttyd uses xterm.js, which shows a keyboard button (⌨) automatically on touch devices. No extra configuration needed.
