---
title: "Automated PR reviews with Claude Code in a self-hosted Forgejo"
date: "2026-03-09"
---

Running a self-hosted homelab git server and want AI-assisted code reviews without shipping your code to someone else's CI? Here's the exact setup for getting Claude Code to post review comments on every PR opened in Forgejo Actions — all traffic staying on your tailnet.

## Architecture overview

```
PR opened
    → Forgejo Actions trigger
    → Runner picks up job (ubuntu-latest)
    → Job container: node:20-bookworm
        → claude (npm install -g @anthropic-ai/claude-code)
        → claude --print "review this PR diff"
    → curl → Forgejo API → PR comment
```

The runner itself runs as a rootless Podman pod with a Tailscale sidecar — no inbound ports, egress-only to the tailnet. The job containers are launched by the runner via the host's Podman socket.

## Infrastructure: Forgejo runners

Three instance-level runners, each a Quadlet pod:

```
forgejo-runner-N.pod
├── forgejo-runner-N.container      (runner daemon)
└── forgejo-runner-N-tailscale.container  (Tailscale sidecar)
```

The runner container mounts the host Podman socket so it can launch job containers:

```ini
# forgejo-runner-1.container
Volume=%t/podman/podman.sock:/var/run/docker.sock:rw
User=0
Environment=DOCKER_HOST=unix:///var/run/docker.sock
```

`User=0` is required — in rootless pods, uid 0 inside the container maps to the host uid. `UserNS=keep-id` is incompatible with `Pod=` in Quadlets and will break startup with `--userns and --pod cannot be set together`.

Runner config (`config.yml`) defines available labels — these map to the `runs-on:` value in workflow files:

```yaml
runner:
  capacity: 1
  labels:
    - "ubuntu-latest:docker://node:20-bookworm"
    - "debian:docker://debian:bookworm"
    - "python3:docker://python:3-slim"
```

Startup is idempotent — `entrypoint.sh` checks for `.runner` before calling `create-runner-file`:

```sh
if [ ! -f .runner ]; then
    forgejo-runner create-runner-file \
        --instance "${FORGEJO_INSTANCE_URL}" \
        --secret "${FORGEJO_RUNNER_SECRET}" \
        --name "${RUNNER_NAME}"
fi
exec forgejo-runner daemon --config /data/config.yml
```

## Forgejo server configuration

One critical env var in `forgejo.env`:

```
FORGEJO__actions__DEFAULT_ACTIONS_URL=self
```

Without this, bare `owner/repo@ref` references in workflow files fail to resolve. With it, `elendal/claude-review-action@main` resolves to `https://forgejo.mist-walleye.ts.net/elendal/claude-review-action`.

Also required: mirror `actions/checkout` to the local Forgejo instance at org `actions`, repo `checkout`. Otherwise the standard `uses: actions/checkout@v4` fails.

## The composite action

A composite action (`elendal/claude-review-action`) that:

1. Installs Node + Claude Code CLI
2. Extracts the PR diff
3. Runs `claude --print` with a review prompt
4. Posts the result as a collapsed PR comment via the Forgejo API

### Key inputs

```yaml
inputs:
  claude-credentials:
    description: Contents of ~/.claude/.credentials.json
    required: true
  forgejo-token:
    description: API token with issues:write scope
    required: true
```

Claude Code authenticates via `~/.claude/.credentials.json` — OAuth refresh tokens, not an API key. The credentials file is injected from a repo secret (`CLAUDE_CREDENTIALS`) and written to the runner's home directory before invoking `claude`.

### Posting the comment

```bash
curl -X POST \
  -H "Authorization: token ${FORGEJO_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"body\": \"<details><summary>Claude Code Review</summary>\n\n${REVIEW}</details>\"}" \
  "${FORGEJO_URL}/api/v1/repos/${REPO}/issues/${PR_NUMBER}/comments"
```

The `<details>` wrapper keeps it collapsed so it doesn't flood the PR view.

## Per-repo setup

### 1. Set secrets

| Secret | Value |
|--------|-------|
| `CLAUDE_CREDENTIALS` | Contents of `~/.claude/.credentials.json` |
| `FORGEJO_TOKEN` | API token with issue write access (the `tea` token works) |

```bash
# Update CLAUDE_CREDENTIALS after re-authenticating locally
CREDS=$(cat ~/.claude/.credentials.json)
curl -X PUT \
  -H "Authorization: token <token>" \
  -H "Content-Type: application/json" \
  -d "{\"data\":$(echo "$CREDS" | jq -R -s .)}" \
  "https://forgejo.mist-walleye.ts.net/api/v1/repos/<owner>/<repo>/actions/secrets/CLAUDE_CREDENTIALS"
```

### 2. Add the workflow

`.forgejo/workflows/claude-review.yml` (note: not `.github/workflows/`):

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: elendal/claude-review-action@main
        with:
          claude-credentials: ${{"{{"}} secrets.CLAUDE_CREDENTIALS }}
          forgejo-token: ${{"{{"}} secrets.FORGEJO_TOKEN }}
```

## Credential rotation

`CLAUDE_CREDENTIALS` contains OAuth refresh tokens. If you run `claude login` locally, the tokens rotate and the action breaks silently (403s from the Claude API). After any local re-auth, update the secret with the snippet above.

The `tea` token in `FORGEJO_TOKEN` doesn't expire unless you revoke it manually at Forgejo → Settings → Applications.

## What doesn't work (lessons learned)

**`UserNS=keep-id` in Quadlet runner pods** — incompatible with `Pod=`. Use `User=0` instead.

**`DEFAULT_ACTIONS_URL` missing** — bare action refs silently fail to resolve. Must be set on the Forgejo server, not just the runner.

**`environment-to-ini` bakes vars permanently** — Forgejo's startup script writes env vars into `app.ini`. If you remove an env var later, the old value stays in `app.ini` and wins. To override: set the env var explicitly to the new value; don't just remove it.

**Using the wrong API endpoint for task logs** — Forgejo's Actions API exposes `/actions/tasks`, not `/actions/runs`. The Gitea docs are inconsistent here. Use `tea` for anything more complex than a simple curl.
