---
title: "Tools to try"
date: "2024-02-21"
---

# List of tools to try

* Try HURL a replacement for Postman
* Portless seems unnecessary for tailnet
* grex regexp builder
* better-t-stack for JS project scaffolding
* ttyd -W claude to give shell access over web

## Editor
* https://github.com/benweet/stackedit - Add MD file editor to this site.

## Cool
* Display lolcat figlet in terminal
* Faker pythin to generate fake data 
* https://frankentui.com/web - TUI for web

## How console apps that i can set to fullscreen screensaver
cbonsay
curl wttr.in/Montreal

## AI
* https://github.com/xaskasdf/ntransformer - Llama 3.1 70B on a single RTX 3090 via NVMe-to-GPU bypassing the CPU
* https://github.com/AlexsJones/llmfit - Useful tool that probes hardware and tells you exactly which LLMs will actually run.
* https://github.com/nicobailon/pi-messenger - Seems interesting
* https://www.june.kim/cord
* https://brainfile.md/reference/protocol
* https://github.com/offline-ant/pi-tmux
* https://github.com/mikeyobrien/ralph-orchestrator
* https://github.com/gepa-ai/gepa - Optimize AI prompts

## DNS
* https://porkbun.com/tld/ca

## Networking
* https://github.com/datapartyjs/MeshTNC

## GIT
```bash
alias ciaclean='git branch --merged origin/main | grep -vE "^\s*(\*|main|develop)" | xargs -n 1 git branch -d'
```
```bash
# Delete local branches that have been merged into HEAD
$ git branch --merged | grep -v '\\*\\|master\\|develop' | xargs -n 1 git branch -d
# Delete local branches that have been merged into origin/master
$ git branch --merged origin/master | grep -v '\\*\\|master\\|develop' | xargs -n 1 git branch -d
# Show what local branches haven't been merged to HEAD
$ git branch --no-merged | grep -v '\\*\\|master\\|develop'
```


