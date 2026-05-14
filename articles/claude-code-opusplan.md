---
title: "opusplan: Opus for thinking, Sonnet for typing"
date: "2026-02-27"
---

Claude Code has a model alias called `opusplan` that switches models based on what you're doing.

## What it does

When you enter plan mode, Claude Code uses Opus 4.6. When you exit plan mode and start implementing, it switches to Sonnet 4.6. You get Opus's reasoning where it matters — architecture decisions, ambiguous requirements, tricky tradeoffs — and Sonnet's speed and cost efficiency for the actual code generation.

No manual `/model` switching mid-session.

## How to enable it

```bash
# Permanently (recommended)
# ~/.claude/settings.json
{
  "model": "opusplan"
}

# Per session at startup
claude --model opusplan

# Mid-session
/model opusplan
```

## When it's useful

Plan mode in Claude Code is triggered by commands like `/plan` or when you use `EnterPlanMode`. The pattern that works well:

1. Describe a feature or problem
2. Enter plan mode — Opus reasons through the approach
3. Approve the plan
4. Exit plan mode — Sonnet implements it

Opus at ~$15/M output tokens would get expensive if it were writing every line of code. `opusplan` sidesteps that by only reaching for the expensive model when you actually need it.

## Checking which model is active

```
/status
```

Shows the current model. In execution mode you'll see Sonnet; switch to plan mode and it shows Opus.
