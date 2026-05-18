---
title: "Moving homelab DNS off my laptop: Oracle Cloud Free Tier ARM, and seven things that broke"
date: "2026-05-18"
---

My homelab runs on a Fedora laptop in the closet. AdGuard, Unbound, Pocket ID, Forgejo, Restate, a dozen other services, all under rootless Podman with Tailscale sidecars. The whole stack — including the DNS resolver that every other tailnet device points at — depends on that one machine staying up. Lid closes, ISP hiccups, OS update reboots, and the entire tailnet loses DNS.

I wanted the DNS authority somewhere that wasn't my laptop. Oracle Cloud's Always-Free ARM tier offers 4 OCPU / 24 GB RAM on a real cloud node, indefinitely, for $0. Perfect destination. Getting there took four days of capacity-lottery retries, a refactored Quadlet pattern for Podman 4.9, a custom ARM container image, an ACL rule for server-to-server SSH, and a Tailscale Split DNS leftover that quietly broke everything until it didn't.

Tested on Fedora 43 (Podman 5.x), Ubuntu 24.04 aarch64 (Podman 4.9.3), Tailscale 1.84.

## Architecture before and after

Before:

```
                ┌─ home Fedora laptop ─────────────────────┐
                │                                          │
all tailnet ───▶│  AdGuard sidecar (100.122.205.95:53)     │
                │     │                                    │
                │     ▼                                    │
                │  Unbound on host (127.0.0.1:5353)        │
                │     │                                    │
                │     ├──▶ /etc/unbound/local.d/*.conf     │
                │     │     (.homelab static records)      │
                │     │                                    │
                │     └──▶ DoT to Cloudflare/Quad9         │
                └──────────────────────────────────────────┘
```

After:

```
                ┌─ Oracle ARM (oracle-arm) ──────────────────┐
                │                                            │
all tailnet ───▶│  adguard-ts (TS sidecar — pod netns)       │
                │  adguard-home  (filter + cache)            │
                │     │                                      │
                │     ▼  127.0.0.1:5353                      │
                │  adguard-unbound (recursive + static zone) │
                │     │     │                                │
                │     │     └─ /etc/unbound/homelab.zone     │
                │     │        (mounted from infra repo)     │
                │     │                                      │
                │     └─ DoT to Cloudflare/Quad9             │
                │                                            │
                │  adguard-auth (oauth2-proxy → Pocket ID)   │
                └────────────────────────────────────────────┘

                ┌─ home Fedora laptop ───────────────────────┐
                │  AdGuard pod: stopped (cold standby)       │
                │  Caddy still hosts 10.99.0.1:443 for the   │
                │    .homelab TLS gateway. DNS resolves      │
                │    cleanly when fedora is down, but the    │
                │    services themselves don't.              │
                └────────────────────────────────────────────┘
```

The trick: I'm not chasing active-active replication of every service. DNS surviving the laptop's downtime gives me filtering, recursive resolution, and AdGuard for every device on the tailnet. The `.homelab` services themselves still depend on the laptop — but DNS resolves cleanly to the (unreachable) VIP, which is an honest signal rather than NXDOMAIN noise.

## Problem 1: Oracle's Always-Free ARM capacity is a lottery

The Always-Free ARM A1.Flex shape can host 4 OCPU / 24 GB across one to four instances per tenancy. Oracle oversold this tier years ago and never caught up; Ashburn (`us-ashburn-1`, the only region available to my home-region-locked free tier) is bone dry. Every launch attempt returns `InternalError: Out of host capacity` on every availability domain.

The community answer is a retry loop. Mine is a systemd service that cycles AD-1 → AD-2 → AD-3 → sleep 60s → repeat, logging a summary line every 15 minutes:

```bash
#!/bin/bash
set -euo pipefail

ADS=("VoYr:US-ASHBURN-AD-1" "VoYr:US-ASHBURN-AD-2" "VoYr:US-ASHBURN-AD-3")

while true; do
  for AD in "${ADS[@]}"; do
    OUT=$(oci compute instance launch \
      --availability-domain "$AD" \
      --shape VM.Standard.A1.Flex \
      --shape-config '{"ocpus":4,"memoryInGBs":24}' \
      --image-id "$IMAGE" --subnet-id "$SUBNET" \
      --ssh-authorized-keys-file ~/.ssh/id_ed25519.pub \
      --assign-public-ip true \
      --query 'data.id' --raw-output 2>&1) || true

    [[ "$OUT" =~ ocid1\.instance\. ]] && { echo "$OUT" > ~/.oci/ocids/instance; exit 0; }

    # Bail on genuinely fatal errors, otherwise keep banging.
    grep -qE "NotAuthenticated|LimitExceeded|InvalidParameter" <<<"$OUT" && exit 1
  done
  sleep 60
done
```

The first iteration was naive — it bailed on any error that wasn't `Out of host capacity`. After 58 minutes the script hit a transient network timeout from the OCI API, classified it as fatal, and exited. I rewrote the classifier to be three-way: known-fatal (auth, quota, invalid params) → exit; capacity → retry; everything else → transient retry.

**It took 1,019 rounds across four days for AD-3 to cough up a slot.** 2,667 capacity rejections, 51 transients absorbed, one successful launch. Plan accordingly if you're banking on this for anything time-sensitive.

## Problem 2: Tailscale ACL ssh rules don't cover server-to-server

Once the VM was up, I bootstrapped it as a tailnet node tagged `tag:server` and tried to SSH from the laptop via Tailscale's built-in SSH:

```
$ ssh ubuntu@oracle-arm
tailscale: tailnet policy does not permit you to SSH to this node
```

The default ACL ssh rule only grants `autogroup:admin → tag:server`. From my laptop the source identity is my user account (in `autogroup:admin`), so this works for laptop → oracle-arm. But automation running ON a tagged host (fedora is also `tag:server`) needs `tag:server → tag:server`:

```hujson
"ssh": [
    // ... existing rules
    {
        "action": "accept",
        "src":    ["tag:server"],
        "dst":    ["tag:server"],
        "users":  ["autogroup:nonroot", "root"],
    },
],
```

One-line ACL addition. Worth knowing about before you write any inter-host scripts.

## Problem 3: server key expiry is a silent time bomb

Tailscale device keys expire after 180 days by default. When a key expires, the device drops out of peer netmaps; `tailscale ping <peer>` returns `peer's node key has expired`; subnet routes hosted by that peer stop propagating. Nothing alerts you.

This bit me almost immediately. After tagging oracle-arm and turning on `--accept-routes`, the subnet route to `10.99.0.1` (the homelab VIP fedora advertises) refused to propagate. Investigation revealed fedora's key had expired *the day before* — 180 days from the original device registration. Nothing else had noticed because nothing else had needed the subnet route until oracle-arm tried.

Fix is per-device, via the API:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"keyExpiryDisabled":true}' \
  https://api.tailscale.com/api/v2/device/$DEVID/key
```

I scripted a bulk pass over every server-class device in the tailnet — 15 had expiry still enabled. The script is idempotent (skips devices already disabled) and excludes personal endpoints (laptops, phones) which should keep rotating.

Lesson: do this on day one for any homelab tailnet. The default exists because Tailscale's enterprise customers want it; for self-hosted infra it's purely a footgun.

## Problem 4: Ubuntu 24.04's Podman 4.9 doesn't support `Pod=` in `[Container]`

I copied my fedora AdGuard Quadlet over to oracle-arm. The pod file (`adguard.pod`) plus three container files referencing `Pod=adguard.pod` is the standard rootless Podman pattern on Fedora 41+ (Podman 5.x).

Ubuntu 24.04 ships Podman 4.9.3. `Pod=` inside `[Container]` was added in 5.0:

```
$ /usr/libexec/podman/quadlet -dryrun -user
unsupported key 'Pod' in group 'Container'
```

Two options: upgrade Podman via a third-party repo, or refactor. I chose the refactor — `Network=container:adguard-ts` produces the same runtime topology (single network namespace shared by all containers) and works on both 4.9 and 5.x. The only added burden is explicit ordering, which Pod files handled automatically:

```ini
# Before (Podman 5.x only)
[Container]
Pod=adguard.pod

# After (works on 4.9 and 5.x)
[Unit]
After=adguard-tailscale.service
Requires=adguard-tailscale.service

[Container]
Network=container:adguard-ts
```

The `adguard-ts` container starts standalone (no Pod=, no Network=container:...); the other three attach to its netns. Same single-IP behavior, no syntactic sugar.

## Problem 5: `mvance/unbound` is amd64-only

The popular `mvance/unbound` Docker image — the one every blog post recommends — has no arm64 build:

```
WARNING: image platform (linux/amd64) does not match the expected platform (linux/arm64)
exec container process `/unbound.sh`: Exec format error
```

ARM-compatible options exist but none felt right. So I built my own from Alpine — fourteen-megabyte image, no surprises:

```dockerfile
FROM docker.io/library/alpine:3.20
RUN apk add --no-cache unbound ca-certificates && \
    mkdir -p /etc/unbound /var/log/unbound
EXPOSE 5353/udp 5353/tcp
CMD ["unbound", "-d", "-c", "/etc/unbound/unbound.conf"]
```

`podman build -t localhost/unbound:arm64 .`, point the container file at `localhost/unbound:arm64`, done. Reproducible and small. Lives at `oracle-arm/Containerfile.unbound` in the infra repo.

## Problem 6: my "zone file" got parsed as Unbound config and exploded

Migrating `.homelab` records into a static file in the repo was the goal — the old setup created them dynamically via `dns-register.sh` ExecStartPost hooks on every sidecar Quadlet, which couples records to host-local Unbound. A single static file in version control was cleaner.

I wrote `dns/homelab.zone` with what I thought was zone-file syntax:

```
; .homelab zone — all records point to the VIP
local-data: "auth.homelab.   60 IN A 10.99.0.1"
local-data: "status.homelab. 60 IN A 10.99.0.1"
```

Unbound complained:

```
/etc/unbound/homelab.zone:1: error: unknown keyword 'zone'
/etc/unbound/homelab.zone:1: error: stray '—'
/etc/unbound/homelab.zone:1: error: stray 'a'
read /etc/unbound/unbound.conf failed: 60 errors in configuration file
```

The file is `include:`'d from `unbound.conf`. That means it's parsed as **Unbound config**, where comments start with `#`. Zone files (the BIND format) start comments with `;`. The `local-data:` directives are valid Unbound config syntax, but the `;` comments aren't. Replace `;` with `#` and it works.

This is the kind of detail that takes 30 seconds to fix once you see it and an hour to find if you don't read the error carefully.

## Problem 7: a stale Tailscale Split DNS rule, found via a Windows desktop

After all of the above, I declared victory, committed everything, and tested resolution from fedora and oracle-arm. Both worked. A few hours later: "ttyd.homelab fails to open from my Windows workstation."

Server-side checks:

```
$ ssh ubuntu@oracle-arm 'curl -sI -m5 https://ttyd.homelab'
* Resolving timed out after 5000 milliseconds
```

oracle-arm itself couldn't resolve `.homelab` either, even though direct queries to the AdGuard pod worked. The tailscaled log was clear:

```
dns: tcp query: waiting for response or error from [100.122.205.95]: context canceled
```

Forwarding to `100.122.205.95` — fedora's old (now stopped) AdGuard sidecar.

Tailscale has a *second* DNS config independent of the main tailnet nameserver: **Split DNS** (a.k.a. Restricted Nameservers). It lets you route specific suffixes to specific resolvers. I had originally set `.homelab → fedora's AdGuard` as a split-DNS rule, probably as a redundancy mechanism. When I updated the main resolver to oracle-arm, I forgot the split-DNS entry. So every `.homelab` query — from every tailnet device — was being routed to a dead resolver.

It "worked" right after the migration because oracle-arm's first DNS queries hadn't hit the suffix-routed path yet. Once cache TTLs expired, everything broke.

Removal is one PATCH:

```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"homelab": null}' \
  https://api.tailscale.com/api/v2/tailnet/-/dns/split-dns
```

After that, `.homelab` queries fall through to the main resolver (which is oracle-arm AdGuard, which knows the static zone via Unbound). The Windows workstation worked within seconds — netmap propagation is fast.

Worth checking on any DNS migration. `tailscale dns status` shows split-DNS routes under their own heading; they're easy to miss because they're not the "main" resolver.

## Bonus: `tailscale set --advertise-routes` replaces, doesn't append

While debugging the subnet-route propagation issue earlier, I ran `sudo tailscale set --advertise-routes=10.99.0.1/32` on fedora to re-push the route advertisement. Worked — but it also silently dropped fedora's exit-node advertisement (the `0.0.0.0/0` and `::/0` routes that came from a previous `--advertise-exit-node` setting). Discovered when oracle-arm became the only exit node visible in the tailnet.

`tailscale set --advertise-routes=X` *replaces* the advertised set. To keep both, combine flags:

```bash
sudo tailscale set --advertise-routes=10.99.0.1/32 --advertise-exit-node
```

## Final architecture summary

```
Tailnet client
    │
    ├─ DNS:   100.109.248.106 (oracle-arm adguard) ─▶ filter + .homelab + recursive
    │
    ├─ Exit:  oracle-arm OR fedora (manual select; no auto-failover)
    │
    └─ .homelab/*:
              Caddy on fedora 10.99.0.1:443 (TLS via internal CA) ─▶ sidecar
                (works when fedora is up; DNS resolves cleanly either way)
```

Cold standby on fedora: AdGuard Quadlet files and volumes remain, pod stopped + disabled. `systemctl --user start adguard-pod.service` + flip Tailscale DNS back to fedora's IP is the failover path. Takes ~2 minutes. Have not tested at 3 AM yet; will report back.

What this gives me:
- DNS resolution for the tailnet survives the laptop dying.
- General internet DNS (with AdGuard filtering) keeps working for every device.
- A second exit node when the home WAN is down.
- `.homelab` names still resolve cleanly when fedora is down — services themselves stay broken until the laptop comes back, which is the honest behaviour.

What it doesn't:
- It does not move the actual services. Pocket ID, Forgejo, Postgres, everything else still lives on the laptop. The next step is off-host Postgres backups so a disk failure doesn't lose every repo and OIDC encryption key.

Total work was about two hours of mechanical migration plus, as documented above, an assortment of footguns that took longer than the migration itself. Roughly the homelab experience in microcosm.

## Coda: a probe revealed I was running things I'd forgotten about

The day after the migration I ran a `curl` sweep of every `.homelab` name in the dashboard. Half were returning `502` — Caddy proxy entries existed but the upstream sidecar pods had been off for two weeks. The DNS migration was fine; the dashboard had been quietly broken since some unattended restart had stopped them.

I restarted them one by one to verify they still worked. Then asked myself: which of these am I actually using this month?

Answer: not most of them. Stopped + `systemctl --user mask`-ed (so they don't come back on the next `daemon-reload` — Quadlet auto-enables `.pod` files via `[Install] WantedBy=default.target`, and plain `disable` doesn't stick):

| Service | Reason it's stopped |
|---|---|
| `forgejo` + its three runners | Using GitHub for the moment; runners were already masked from a previous prune |
| `postgresql` | Sole consumer was `pgweb` |
| `pgweb` | No active database use |
| `studyforge` | Next.js dev server for a paused project |
| `plannotator` | Old experiment |
| `ollama` | Local LLM inference; not actively using this week |

What's still running on fedora: `copyparty`, `services` (dashboard), `gatus`, `ttyd`, `pocket-id` (OIDC), `restate` + `restate-ingress`, `openvscode-server`, `portainer`, `metube`. On oracle-arm: `adguard` + `unbound`.

Files stay in the repo, volumes stay on disk. `systemctl --user unmask <name>-pod.service && systemctl --user start <name>-pod.service` brings any of them back in seconds.

The discipline is simple — **nothing runs that I don't need this week**. Cheap to revive when I do. Idle services are mostly attack surface and entropy in the dashboard.

If your homelab has been running for more than a year, do the probe. You'll find at least two surprises.
