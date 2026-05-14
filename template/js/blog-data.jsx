/* eslint-disable */
/* Blog data — article list and one fully-rendered article for the prototype. */

const ARTICLES = [
  {
    slug: 'homelab-dns-gateway',
    title: 'Private DNS and a TLS gateway for .homelab domains',
    date: '2026-04-08',
    dateStamp: { mo: 'APR', day: '08', yr: '1901' },
    dek: 'Unbound recursive resolver with a .homelab zone, Caddy\u2019s internal CA for TLS, a virtual IP to dodge Tailscale\u2019s port 443, and auto-registration via Quadlet lifecycle hooks.',
    topic: 'Networks',
    icon: 'icon-columns',
  },
  {
    slug: 'gsd-auto-loop-refactor',
    title: 'Killing a 1892-line god function in GSD-2',
    date: '2026-03-22',
    dateStamp: { mo: 'MAR', day: '22', yr: '1901' },
    dek: 'Four-PR sequence dismantling the autoLoop god function: code smells, mechanical cleanup, behavioral tests, pipeline extraction, and module split.',
    topic: 'Refactoring',
    icon: 'icon-shield',
  },
  {
    slug: 'claude-review-forgejo',
    title: 'Automated PR reviews with Claude Code in a self-hosted Forgejo',
    date: '2026-03-11',
    dateStamp: { mo: 'MAR', day: '11', yr: '1901' },
    dek: 'Runners as rootless Podman pods with Tailscale sidecar, composite action injecting OAuth credentials, and five things that don\u2019t work.',
    topic: 'Agents',
    icon: 'icon-family',
  },
  {
    slug: 'caddy-subpath-to-tailscale-sidecar',
    title: 'Migrating services from Caddy subpaths to Tailscale sidecars',
    date: '2026-02-28',
    dateStamp: { mo: 'FEB', day: '28', yr: '1901' },
    dek: 'Five non-obvious problems migrating openvscode-server, Gatus, and copyparty from Caddy reverse proxy subpaths to Tailscale sidecar pods.',
    topic: 'Networks',
    icon: 'icon-sailboat',
  },
  {
    slug: 'pocket-id-caddy-tailscale-oidc',
    title: 'Passkey SSO for tailnet services: Pocket ID, caddy-security, Podman quadlet',
    date: '2026-02-19',
    dateStamp: { mo: 'FEB', day: '19', yr: '1901' },
    dek: 'Six non-obvious problems wiring Pocket ID as an OIDC provider with caddy-security for passkey-gated access to internal services.',
    topic: 'Security',
    icon: 'icon-padlock',
  },
  {
    slug: 'winlator-termux-android',
    title: 'Running Windows apps and Linux tools on Android',
    date: '2026-02-12',
    dateStamp: { mo: 'FEB', day: '12', yr: '1901' },
    dek: 'Winlator runs Windows x86_64 software via Wine + Box64 JIT translation; Termux gives you a native Linux environment with 25k packages, no root required.',
    topic: 'Tools',
    icon: 'icon-airplane',
  },
  {
    slug: 'adguard-tailscale-quadlet',
    title: 'AdGuard Home as its own Tailscale node, rootless Podman',
    date: '2026-02-05',
    dateStamp: { mo: 'FEB', day: '05', yr: '1901' },
    dek: 'Six non-obvious problems getting AdGuard Home and Tailscale running as a Podman pod under systemd quadlet.',
    topic: 'Networks',
    icon: 'icon-shield',
  },
  {
    slug: 'claude-code-opusplan',
    title: 'opusplan: Opus for thinking, Sonnet for typing',
    date: '2026-01-28',
    dateStamp: { mo: 'JAN', day: '28', yr: '1901' },
    dek: 'Claude Code model alias that uses Opus in plan mode and Sonnet in execution mode.',
    topic: 'Agents',
    icon: 'icon-leaves',
  },
  {
    slug: 'caddy-site-level-matcher',
    title: 'Caddy named matchers are block-scoped',
    date: '2026-01-21',
    dateStamp: { mo: 'JAN', day: '21', yr: '1901' },
    dek: 'Moving @tailnet to the site block eliminates eight duplicate matcher declarations.',
    topic: 'Networks',
    icon: 'icon-columns',
  },
  {
    slug: 'claude-mobile-voice',
    title: 'Dictating to Claude Code on a phone',
    date: '2026-01-14',
    dateStamp: { mo: 'JAN', day: '14', yr: '1901' },
    dek: 'Mobile wrapper page with arrow-key toolbar and Web Speech API voice dictation for a ttyd terminal.',
    topic: 'Agents',
    icon: 'icon-heart-cross',
  },
  {
    slug: 'claude-ttyd-tailscale-caddy',
    title: 'Claude Code in a browser terminal, tailnet-only, no port',
    date: '2026-01-07',
    dateStamp: { mo: 'JAN', day: '07', yr: '1901' },
    dek: 'ttyd + tmux + Caddy header gating for tailnet-only access at port 443 alongside a public blog.',
    topic: 'Agents',
    icon: 'icon-padlock',
  },
  {
    slug: 'portainer-caddy-subpath',
    title: 'Portainer at a subpath behind Caddy',
    date: '2025-12-22',
    dateStamp: { mo: 'DEC', day: '22', yr: '1900' },
    dek: 'Three non-obvious problems getting Portainer behind a reverse proxy at a subpath.',
    topic: 'Networks',
    icon: 'icon-columns',
  },
  {
    slug: 'guacamole-tailscale-stack',
    title: 'Socket-activated Guacamole with Tailscale identity',
    date: '2025-12-14',
    dateStamp: { mo: 'DEC', day: '14', yr: '1900' },
    dek: 'Zero-cost idle browser SSH/RDP/VNC behind Tailscale.',
    topic: 'Networks',
    icon: 'icon-piggy',
  },
  {
    slug: 'blog-system',
    title: 'The Blog System',
    date: '2025-11-22',
    dateStamp: { mo: 'NOV', day: '22', yr: '1900' },
    dek: 'How this site works \u2014 Caddy serving markdown directly, no framework, no build step, no Node.',
    topic: 'Tools',
    icon: 'icon-plant-pot',
  },
];

// ---- Featured article (the one you can actually click through and read) ----
const FEATURED = {
  slug: 'homelab-dns-gateway',
  title: 'Private DNS and a TLS gateway for .homelab domains',
  date: '2026-04-08',
  dateStamp: { mo: 'APR', day: '08', yr: '1901' },
  city: 'MONTRÉAL · QC',
  topic: 'Networks',
  dek: 'Unbound recursive resolver with a .homelab zone, Caddy\u2019s internal CA for TLS, a virtual IP to dodge Tailscale\u2019s port 443, and auto-registration via Quadlet lifecycle hooks.',
  // Inline body. Each entry renders one block.
  body: [
    { kind: 'lede', text: 'I wanted \u2018https://status.homelab\u2019 instead of \u2018https://status.mist-walleye.ts.net\u2019. Short names, real TLS, accessible from any machine on the tailnet. Getting there required an Unbound recursive resolver, a virtual IP trick to dodge a port conflict, and Caddy\u2019s internal CA issuing certs for a TLD that doesn\u2019t exist.' },
    { kind: 'h2', text: 'The Architecture' },
    { kind: 'p', text: 'Three layers, each solving one problem.' },
    { kind: 'numbered', items: [
      { title: 'Unbound on port 5353', text: 'Recursive resolver with DNSSEC, serves a .homelab local zone. AdGuard Home forwards to it as upstream DNS. Every .homelab record points to 10.99.0.1.' },
      { title: 'Caddy bound to 10.99.0.1:443', text: 'Terminates TLS using its built-in CA, reverse proxies to each service\u2019s oauth2-proxy or app port directly via the sidecar\u2019s Tailscale IP.' },
      { title: '10.99.0.1', text: 'A virtual IP on loopback, advertised as a Tailscale subnet route. Exists solely because Tailscale already holds :443 on the host\u2019s real Tailscale IP for Funnel traffic. No port conflict, no non-standard ports.' },
    ] },
    { kind: 'h2', text: 'Setting up Unbound' },
    { kind: 'p', text: 'Fedora ships Unbound. The homelab config goes in /etc/unbound/conf.d/homelab.conf — paper-tone for the config file because it is a configuration, not a session.' },
    { kind: 'config', lang: 'unbound.conf', text:
`server:
    port: 5353
    interface: 127.0.0.1
    interface: ::1

    access-control: 127.0.0.0/8 allow
    access-control: ::1/128 allow
    access-control: 100.64.0.0/10 allow  # Tailscale CGNAT

    root-hints: "/etc/unbound/root.hints"
    hide-identity: yes
    hide-version: yes

    tls-cert-bundle: "/etc/pki/tls/certs/ca-bundle.crt"

    msg-cache-size: 64m
    rrset-cache-size: 128m
    cache-min-ttl: 300
    cache-max-ttl: 86400
    serve-expired: yes

    local-zone: "homelab." static

forward-zone:
    name: "."
    forward-tls-upstream: yes
    forward-addr: 1.1.1.1@853#cloudflare-dns.com
    forward-addr: 9.9.9.9@853#dns.quad9.net` },
    { kind: 'p', text: 'A record is added with a one-liner on the live socket.' },
    { kind: 'shell', host: 'fedora', cwd: '~', lines: [
      { in: 'unbound-control local_data \"status.homelab. 60 A 10.99.0.1\"' },
      { out: 'ok' },
      { in: 'dig +short status.homelab @127.0.0.1 -p 5353' },
      { out: '10.99.0.1' },
    ] },
    { kind: 'h2', text: 'The virtual IP trick' },
    { kind: 'p', text: 'Tailscale\u2019s tailscaled holds :443 on the host\u2019s real Tailscale IP for Funnel. Caddy can\u2019t bind it. Solution: bring up a second IP on loopback and advertise it as a /32 subnet route through Tailscale.' },
    { kind: 'shell', host: 'fedora', cwd: '~', lines: [
      { in: 'sudo ip addr add 10.99.0.1/32 dev lo' },
      { in: 'sudo tailscale set --advertise-routes=10.99.0.1/32' },
      { out: 'pending: 10.99.0.1/32 (approve in admin)' },
    ] },
    { kind: 'pull', text: 'The boundary is the boost. A second IP costs nothing and resolves an entire class of port-conflict problems without violating any layer\u2019s assumptions.' },
    { kind: 'h2', text: 'Caddy: internal CA for a fake TLD' },
    { kind: 'p', text: 'Caddy\u2019s built-in CA issues certs for any name you ask it to. The trick is teaching every tailnet machine to trust the CA root.' },
    { kind: 'config', lang: 'Caddyfile', text:
`{
    pki {
        ca local {
            name "Homelab Internal CA"
        }
    }
}

*.homelab {
    bind 10.99.0.1
    tls internal

    @status host status.homelab
    handle @status {
        reverse_proxy 100.71.40.12:8080
    }

    @grafana host grafana.homelab
    handle @grafana {
        reverse_proxy 100.71.40.18:3000
    }
}` },
    { kind: 'p', text: 'Trust the root once per machine. A Quadlet ExecStartPre hook fetches it on every container start so service pods never see an expired root.' },
    { kind: 'shell', host: 'laptop', cwd: '~', lines: [
      { in: 'curl -sS http://10.99.0.1/ca | sudo tee /etc/pki/ca-trust/source/anchors/homelab.crt' },
      { in: 'sudo update-ca-trust' },
      { in: 'curl https://status.homelab' },
      { out: '<!doctype html><html lang=\"en\"><head><title>Gatus</title>' },
    ] },
    { kind: 'h2', text: 'Auto-registration via Quadlet lifecycle hooks' },
    { kind: 'p', text: 'Every service pod registers its name with Unbound at start and deregisters at stop. The hook is two lines in the Quadlet unit.' },
    { kind: 'config', lang: 'gatus.container', text:
`[Container]
Image=ghcr.io/twin/gatus:latest

[Service]
ExecStartPost=/usr/local/bin/homelab-register status gatus
ExecStopPost=/usr/local/bin/homelab-deregister status

[Install]
WantedBy=default.target` },
    { kind: 'p', text: 'On reboot, every service announces itself. On stop, the record disappears within 60 seconds. No central registry, no consul, no etcd — Unbound\u2019s socket is the registry.' },
    { kind: 'h2', text: 'What didn\u2019t work' },
    { kind: 'list', items: [
      'systemd-resolved\u2019s built-in DNS \u2014 no per-zone forwarding without the unstable LinkPolicies API.',
      'CoreDNS in a pod \u2014 too many moving parts when Unbound was already a one-line install.',
      'Pointing the .homelab zone at the host\u2019s real Tailscale IP \u2014 port 443 collision with Funnel.',
      'Splitting Caddy into two instances \u2014 the cert store gets confused, and you lose the single source-of-truth Caddyfile.',
    ] },
    { kind: 'closer', text: 'The result is short names with real TLS, accessible from every device on my tailnet, and a zero-config registry that auto-cleans. It has been running for six months without intervention.' },
  ],
};

Object.assign(window, { ARTICLES, FEATURED });
