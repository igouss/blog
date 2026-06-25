---
title: "elendal's blog"
---

<div class="idx-intro idx-intro--letter">

<div class="salutation">Dear Sir or Madam,</div>

Herewith a running record of experiments in self-hosted infrastructure, agentic workflows, and engineering decisions made in the small hours. Each entry runs in production on a tailnet of three machines; what does not work is reported as plainly as what does. Read at leisure.

<div class="idx-signature">— I. G.</div>

</div>

## Articles
- [The spec should pick the test, not you](/articles/let-the-spec-pick-the-test) — third in the spec-as-code trilogy: write obligations as one typed IR and project the prose, the tests, and the live coverage report out of it. A ledger spec where one field — `representability` — decides whether each claim gets a runtime check, a compile-fail test, or nothing, and mechanically refuses to let you write the hollow "assert the total didn't change" test that's green forever and proves nothing. Make-illegal-states-unrepresentable, pointed at the spec itself — and an honest account of exactly where the field stops helping.
- [An acceptance criterion that can't fail is just a wish](/articles/make-the-spec-break) — the sequel to *confident markdown*, answering its closing slogan: how do you actually make a spec break? The executable acceptance criterion — spec prose and test in the same file, the negative case written first and proven red before it's allowed green, oracles that fail closed on a nonzero exit. Why a parallel test runner and an LLM-as-judge are the same false-green one level up, and why the model writes the gate but must never *be* it.
- [An unverified spec is just confident markdown](/articles/confident-markdown) — "specs are the new code" skips the load-bearing half: an AI compiler can lie. A forty-line TLA+ model of an agent loop with the agent as adversary, where the model checker produces the five-state false-green trace and derives why the thing checking the work must be independent of the thing that did it. Type errors become truth errors; one bug class stays human.
- [Five verifier agents found nothing one agent missed](/articles/fan-out-verification-token-tax) — measuring the multi-agent verification hype: a single Claude with the full checklist vs. five Claudes each holding one fifth, auditing the same corpus for nine planted bugs. Both scored 9/9; the five-agent panel cost 1.94× the tokens and one extra false positive for zero recall. Why the swarm didn't win, and the crossover experiment that would actually earn it.
- [Magic lantern slides: ghosts, gospel, and proto-cinema on painted glass](/articles/magic-lantern-slides) — what the eBay collectibles bin is actually showing you: 250 years of projected images, from Huygens' regretted *bagatelle* through phantasmagoria horror shows to Victorian parlour entertainment and the substrate of 19th-century visual imagination.
- [Moving homelab DNS off my laptop: Oracle Cloud Free Tier ARM, and seven things that broke](/articles/homelab-dns-on-oracle-cloud) — four-day capacity lottery for an Always-Free ARM VM, server-to-server SSH ACL gap, Tailscale key-expiry time bomb, Podman 4.9 vs 5.x Quadlet differences, custom arm64 Unbound image, and a stale Split DNS rule that quietly broke `.homelab` resolution tailnet-wide.
- [Private DNS and a TLS gateway for .homelab domains](/articles/homelab-dns-gateway) — Unbound recursive resolver with a `.homelab` zone, Caddy's internal CA for TLS, a virtual IP to dodge Tailscale's port 443, and auto-registration via Quadlet lifecycle hooks.
- [Killing a 1892-line god function in GSD-2](/articles/gsd-auto-loop-refactor) — four-PR sequence dismantling the `autoLoop` god function: code smells, mechanical cleanup, behavioral tests, pipeline extraction, and module split.
- [Automated PR reviews with Claude Code in a self-hosted Forgejo](/articles/claude-review-forgejo) — runners as rootless Podman pods with Tailscale sidecar, composite action injecting OAuth credentials, and five things that don't work.
- [Migrating services from Caddy subpaths to Tailscale sidecars](/articles/caddy-subpath-to-tailscale-sidecar) — five non-obvious problems migrating openvscode-server, Gatus, and copyparty from Caddy reverse proxy subpaths to Tailscale sidecar pods.
- [Passkey SSO for tailnet services: Pocket ID, caddy-security, Podman quadlet](/articles/pocket-id-caddy-tailscale-oidc) — six non-obvious problems wiring Pocket ID as an OIDC provider with caddy-security for passkey-gated access to internal services.
- [Running Windows apps and Linux tools on Android](/articles/winlator-termux-android) — Winlator runs Windows x86_64 software via Wine + Box64 JIT translation; Termux gives you a native Linux environment with 25k packages, no root required.
- [AdGuard Home as its own Tailscale node, rootless Podman](/articles/adguard-tailscale-quadlet) — six non-obvious problems getting AdGuard Home and Tailscale running as a Podman pod under systemd quadlet.
- [opusplan: Opus for thinking, Sonnet for typing](/articles/claude-code-opusplan) — Claude Code model alias that uses Opus in plan mode and Sonnet in execution mode.
- [Caddy named matchers are block-scoped](/articles/caddy-site-level-matcher) — moving `@tailnet` to the site block eliminates eight duplicate matcher declarations.
- [Dictating to Claude Code on a phone](/articles/claude-mobile-voice) — mobile wrapper page with arrow-key toolbar and Web Speech API voice dictation for a ttyd terminal.
- [Claude Code in a browser terminal, tailnet-only, no port](/articles/claude-ttyd-tailscale-caddy) — ttyd + tmux + Caddy header gating for tailnet-only access at port 443 alongside a public blog.
- [Portainer at a subpath behind Caddy](/articles/portainer-caddy-subpath) — three non-obvious problems getting portainer behind a reverse proxy at a subpath.
- [Socket-activated Guacamole with Tailscale identity](/articles/guacamole-tailscale-stack) — zero-cost idle browser SSH/RDP/VNC behind Tailscale.
- [500 ideas](/articles/ideas)  — 500 autogenerated ideas.
- [Tools to try](/articles/tools-to-try)  — Various ideas for tools to try.
- [The Blog System](/articles/blog_system) — how this site works
