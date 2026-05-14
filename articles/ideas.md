---
title: "500 Ideas"
date: "2024-02-22"
---

# 500 Ideas

Based on tools-to-try and adjacent rabbit holes.

---

## Terminal & Aesthetics (1–60)

1. cbonsai as a login shell screensaver via `TMOUT` + trap
2. `curl wttr.in/Montreal` in a tmux status bar
3. lolcat + figlet MOTD on SSH login
4. `tty-clock` fullscreen clock as idle screensaver
5. `cmatrix` as a background pane in tmux
6. `pipes.sh` — animated pipes screensaver in terminal
7. `asciiquarium` — fish tank screensaver
8. `nyancat` over SSH as a joke welcome screen
9. `unimatrix` — Matrix rain but with unicode characters
10. figlet font collection — pick a different font per project
11. `toilet` as a fancier figlet alternative
12. Custom MOTD combining wttr.in + figlet + system stats
13. `neofetch` or `fastfetch` for system info display
14. `bottom` (btm) as a modern top/htop replacement
15. `gdu` — fast disk usage TUI
16. `duf` — prettier df output
17. `lsd` or `exa`/`eza` — ls with icons and colors
18. `bat` — cat with syntax highlighting and git diff
19. `delta` — better git diff pager
20. `fzf` — fuzzy finder, pipe everything through it
21. `zoxide` — smarter cd that learns your habits
22. `atuin` — shell history sync across machines via Tailscale
23. `starship` prompt with custom modules
24. `nushell` — try a shell where everything is structured data
25. `carapace` — unified shell completion for any tool
26. `mcfly` — neural network shell history search
27. `broot` — interactive tree + cd in one
28. `visidata` — spreadsheet for the terminal (CSV, JSON, SQL)
29. `glow` — render markdown in the terminal beautifully
30. `rich` (Python) — pretty-print anything in the terminal
31. `textual` (Python) — TUI framework, build dashboards
32. `bubbletea` (Go) — TUI framework for Go CLIs
33. frankentui.com — TUI components that run in a browser
34. `ttyd -W claude` — expose Claude as a browser terminal
35. `ttyd` + Tailscale serve — private web terminal to any machine
36. `tmux` resurrect + continuum — persist sessions across reboots
37. `tmuxinator` — define complex tmux layouts in YAML
38. `zellij` — tmux alternative with built-in layouts and plugins
39. `wezterm` — terminal with Lua config and multiplexer built in
40. `ghostty` — fast terminal, worth benchmarking
41. Custom tmux theme matching SARA blog colors
42. `taskwarrior` — CLI task manager
43. `timewarrior` — CLI time tracking, pairs with taskwarrior
44. `calcurse` — terminal calendar and todo
45. `ranger` or `yazi` — file manager in the terminal
46. `lazygit` — TUI for git
47. `lazydocker` — TUI for Docker
48. `k9s` — TUI for Kubernetes
49. `posting` — TUI HTTP client (terminal Postman)
50. `harlequin` — TUI SQL client
51. `usql` — universal SQL CLI (postgres, sqlite, mysql, etc.)
52. `xh` — friendlier HTTPie replacement
53. `curlie` — curl with HTTPie-style output
54. `grex` — generate regex from examples, pipe into scripts
55. `sd` — sed replacement with friendlier syntax
56. `ripgrep-all` (rga) — grep inside PDFs, ZIPs, docs
57. `choose` — awk/cut replacement
58. `jq` + `fzf` — interactive JSON explorer
59. `yq` — jq for YAML
60. `dasel` — query/modify JSON, YAML, TOML, CSV with one tool

---

## HTTP & API Testing (61–110)

61. HURL — define HTTP tests in plain text files, commit them to repos
62. HURL for smoke testing the blog after every deploy
63. HURL to test content negotiation (text/markdown vs text/html)
64. HURL test suite for all Caddyfile routes (404, 403, 200 cases)
65. HURL + CI — run API tests on every git push
66. `httpie` — friendly curl replacement for interactive API calls
67. `xh` — same idea, written in Rust, faster
68. `posting` — TUI alternative to Postman, no Electron
69. Bruno — open-source Postman alternative, stores collections as files
70. Store Bruno collections in git alongside the code they test
71. Insomnia — another Postman alternative worth comparing
72. `k6` — load testing with JavaScript scripts
73. `hey` — simple HTTP load generator
74. `vegeta` — HTTP load testing with rate control
75. `wrk` — benchmarking HTTP servers
76. `locust` — load testing in Python with a web UI
77. `mitmproxy` — intercept and inspect HTTP traffic
78. `wireshark` + `tshark` — network packet analysis
79. `httpbin` self-hosted — test HTTP clients against a known API
80. `mockoon` — mock REST APIs locally without a backend
81. `prism` — mock server from an OpenAPI spec
82. OpenAPI spec for the blog's content negotiation routes
83. Generate a client SDK from that OpenAPI spec
84. `swagger-ui` self-hosted — browse APIs in the browser
85. `redoc` — cleaner OpenAPI docs renderer
86. `caddy` rate limiting module — add per-IP rate limits to the blog
87. Test the blog's `Vary: Accept` header with a caching proxy
88. `varnish` in front of Caddy — HTTP cache layer
89. `squid` as a caching proxy experiment
90. `nginx` vs `caddy` benchmark on the same hardware
91. `caddy` metrics endpoint + Prometheus scrape
92. `caddy` `log` directive with custom format (combined vs JSON)
93. Parse blog access logs with `goaccess` — real-time web analytics
94. `GoAccess` dashboard served over Tailscale
95. Self-hosted analytics with `umami` instead of Google Analytics
96. `plausible` analytics — privacy-friendly, self-hosted
97. `matomo` — full-featured self-hosted analytics
98. `fathom` — minimal privacy-respecting analytics
99. `counterscale` — Cloudflare Workers-based analytics (free tier)
100. Add `x-forwarded-for` logging to see real client IPs through Funnel
101. `caddy` `push` directive — HTTP/2 server push for CSS
102. `caddy` `encode` directive — gzip/zstd compression
103. Add `Cache-Control` headers to `/css/*` and `/images/*` in Caddyfile
104. `ETag` headers for blog articles — conditional GET support
105. Measure TTFB of the blog before and after compression
106. `webpagetest.org` run against the blog URL
107. `lighthouse` CLI audit of the blog
108. `axe` accessibility audit
109. `pa11y` — automated accessibility testing CLI
110. `htmlhint` — lint the rendered HTML output

---

## AI & LLM (111–180)

111. `llmfit` — probe hardware, find which LLMs actually fit
112. Run Llama 3.1 8B locally via `ollama`
113. `ollama` + Open WebUI — self-hosted ChatGPT-style interface
114. `ollama` served over Tailscale — private LLM for all your devices
115. ntransformer — Llama 70B on a single RTX 3090 via NVMe-to-GPU
116. `text-generation-webui` — full-featured local LLM UI
117. `koboldcpp` — single-binary local LLM runner
118. `llama.cpp` — run quantized models on CPU
119. `jan` — offline-first ChatGPT desktop app
120. `lm-studio` — GUI for running local models
121. `aider` — AI pair programmer in the terminal
122. `continue.dev` — VS Code AI coding assistant (local model backend)
123. `tabby` — self-hosted GitHub Copilot replacement
124. `gepa` — optimize prompts automatically against test cases
125. Build a prompt test suite for the blog's Caddy template logic
126. `brainfile.md` protocol — structured markdown for AI context
127. `cord` (june.kim) — AI coordination tool, worth understanding
128. `ralph-orchestrator` — multi-agent orchestration
129. `pi-messenger` — messaging via Raspberry Pi
130. `pi-tmux` — tmux config for Pi, adapt for the blog server
131. `fabric` — AI augmentation framework with pattern library
132. `sgpt` — shell-gpt, use GPT from the terminal
133. `llm` (Simon Willison's CLI) — run any model from the terminal
134. `llm` + plugins — add local ollama backend
135. `llm` for summarizing access logs
136. `llm` for drafting blog posts from bullet points
137. `opencommit` — AI-generated git commit messages
138. `aicommit2` — same idea, supports local models
139. AI-generated article summaries for the blog index
140. AI-generated `og:description` from article body
141. Use `llm` to generate article tags from content
142. Build a CLI that takes a URL and summarizes the page via local LLM
143. `whisper` — transcribe audio to markdown articles
144. Record a voice note, transcribe with Whisper, publish to blog
145. `stable-diffusion-webui` — generate images for articles
146. `comfyui` — node-based image generation pipeline
147. `ollama` + `anki` — generate flashcards from articles
148. RAG over the blog's own articles with `ollama` + `chroma`
149. Vector search over articles — semantic article search
150. Embed all articles and find related posts automatically
151. `localai` — OpenAI-compatible API for local models
152. Route Claude API calls through `localai` for cost comparison
153. Build a reading assistant that answers questions about articles
154. `tgpt` — ChatGPT in the terminal without an API key
155. `mods` — AI in the terminal, pipes well with other CLIs
156. `gptscript` — write scripts that call LLMs as functions
157. `ell` — LLM prompt engineering library (Python)
158. `dspy` — programmatic LLM pipelines
159. `langchain` — LLM orchestration framework
160. `langgraph` — stateful multi-agent workflows
161. `autogen` — Microsoft's multi-agent framework
162. `crew-ai` — role-based multi-agent system
163. `pocketflow` — minimal LLM pipeline framework (100-line core)
164. Build a blog post editor agent that critiques drafts
165. Build a fact-checker agent that validates claims in articles
166. `instructor` — structured output from LLMs (Pydantic models)
167. `marvin` — AI function decorators for Python
168. `outlines` — guaranteed structured generation from LLMs
169. `litellm` — unified API across all LLM providers
170. Compare Claude vs local Llama on blog article quality
171. `mem0` — long-term memory layer for AI applications
172. `cognee` — knowledge graph from documents
173. Build a knowledge graph of all blog articles
174. `notdiamond` — route queries to the best model automatically
175. Fine-tune a small model on your writing style
176. `axolotl` — LLM fine-tuning framework
177. `mergekit` — merge two model weights together
178. Build a writing assistant tuned to your voice
179. AI-powered tag/category system for the blog
180. A/B test AI-generated titles vs manual ones

---

## Tailscale & Networking (181–240)

181. `atuin` sync via Tailscale — shell history on every machine
182. Tailscale SSH to replace OpenSSH on all machines
183. Tailscale ACLs as code — manage via Terraform or Pulumi
184. `tailscale serve` for internal-only tools (vs Funnel for public)
185. Host Grafana over `tailscale serve` — never expose port 3000
186. Host Prometheus over `tailscale serve`
187. Host Netdata over `tailscale serve`
188. Host Uptime Kuma over `tailscale serve` — internal status page
189. Host Portainer over `tailscale serve`
190. Tailscale exit node on the Fedora machine — route all traffic
191. Tailscale subnet router — expose home LAN to all devices
192. MeshTNC — mesh networking over radio (APRS/packet)
193. `meshtastic` — LoRa mesh network for off-grid comms
194. `yggdrasil` — end-to-end encrypted mesh network
195. `headscale` — self-hosted Tailscale control plane
196. Compare headscale vs Tailscale for a private tailnet
197. Tailscale + `caddy` — automatic HTTPS for internal services
198. Tailscale MagicDNS custom hostnames via admin console
199. `.ca` domain from Porkbun — point to Tailscale Funnel
200. Custom domain on the blog via Tailscale Funnel + CNAME
201. `cloudflare tunnel` vs Tailscale Funnel comparison
202. `ngrok` vs Tailscale Funnel for temporary public exposure
203. `bore` — self-hosted ngrok alternative
204. `frp` — fast reverse proxy for NAT traversal
205. `rathole` — reverse proxy with low resource usage
206. WireGuard manual setup — understand what Tailscale wraps
207. `netbird` — WireGuard-based mesh, Tailscale alternative
208. `innernet` — WireGuard-based private network
209. `nebula` — Slack's overlay network tool
210. `zerotier` — another Tailscale alternative worth comparing
211. Self-hosted DNS with `pihole` over Tailscale
212. `adguard home` — pihole alternative with more features
213. `coredns` — programmable DNS server
214. `technitium` — full DNS server with web UI
215. DNSSEC validation with `drill` or `kdig`
216. Test DNS leak when using Tailscale exit node
217. `nmap` scan of your tailnet — know what's exposed
218. `masscan` — fast port scanner for network audits
219. `rustscan` — faster nmap frontend
220. `netcat` — still the most useful networking tool
221. `socat` — netcat on steroids
222. `mtr` — traceroute + ping combined
223. `iperf3` — measure bandwidth between tailnet nodes
224. `speedtest-cli` — automated bandwidth logging to a file
225. `vnstat` — network traffic monitor with history
226. `bandwhich` — per-process bandwidth usage TUI
227. `nethogs` — per-process network monitor
228. `tcpdump` on the blog server — see raw Funnel traffic
229. `wireshark` remote capture over SSH
230. `scapy` — craft arbitrary packets in Python
231. `nftables` — modern iptables, audit current rules
232. `firewalld` — zone-based firewall management
233. Audit SELinux denials on the blog server
234. `fail2ban` — ban IPs after repeated 403s in access log
235. `crowdsec` — collaborative IP reputation blocking
236. `endlessh` — SSH tarpit to waste attackers' time
237. Monitor Tailscale peer count and bandwidth via API
238. `tailscale status --json` piped to a dashboard
239. Build a Tailscale network map visualizer
240. Alert when a tailnet device goes offline

---

## Git & Version Control (241–290)

241. `lazygit` — replace all git CLI usage with TUI
242. `gitui` — Rust-based lazygit alternative
243. `tig` — text-mode git log browser
244. `git-absorb` — automatically fixup recent commits
245. `git-branchless` — stacked diffs workflow
246. `gh` CLI for everything GitHub — issues, PRs, releases
247. `gh dash` — GitHub dashboard TUI
248. `forgejo` — self-hosted GitHub, lighter than Gitea
249. `gitea` — self-hosted git server
250. `soft-serve` — terminal-first git server by Charm
251. Mirror the blog repo to a self-hosted Forgejo over Tailscale
252. `git-cliff` — auto-generate changelogs from commit messages
253. `cocogitto` — conventional commits enforcer + changelog
254. Conventional commits for the blog repo
255. `commitlint` — lint commit messages in CI
256. `pre-commit` framework — git hooks as config
257. `lefthook` — fast git hooks manager
258. `husky` — git hooks for JS projects
259. `gitleaks` — scan repos for secrets
260. `trufflehog` — find secrets in git history
261. `detect-secrets` — pre-commit hook for secret detection
262. `git-crypt` — transparent encryption of files in git
263. `age` — modern encryption tool, simpler than GPG
264. Sign commits with SSH key (Tailscale identity?)
265. `git log --all --grep` — search commit messages for decisions
266. `git bisect` — binary search for the commit that broke something
267. `git worktree` — multiple checkouts of one repo
268. `git notes` — attach metadata to commits without amending
269. `git-annex` — version control for large files
270. `dvc` — data version control for ML projects
271. `git-filter-repo` — rewrite git history (remove secrets)
272. `BFG Repo Cleaner` — same idea, simpler interface
273. `git maintenance` — schedule background git optimizations
274. `git sparse-checkout` — only checkout part of a monorepo
275. `git bundle` — pack a repo for offline transfer
276. ciaclean alias — add to shell config, clean merged branches weekly
277. `git branch --no-merged` audit — find stale branches
278. Pre-push hook that runs HURL tests before pushing
279. Pre-commit hook that runs `htmlhint` on templates
280. Post-receive hook on the server to auto-pull after push
281. Webhook from GitHub → deploy script on the blog server
282. `gitops` — git as the source of truth for server state
283. `flux` — GitOps for Kubernetes
284. `argocd` — GitOps with a web UI
285. `werf` — build + deploy tool with GitOps workflow
286. Automate blog deployments with a simple `post-receive` hook
287. `act` — run GitHub Actions locally
288. `earthly` — reproducible CI builds
289. `dagger` — CI/CD pipelines as code (Go/Python/TypeScript)
290. Self-hosted Forgejo Actions for blog CI

---

## Self-Hosting (291–360)

291. `forgejo` — self-hosted GitHub over Tailscale
292. `gitea` + Tailscale serve — private git hosting
293. `soft-serve` — SSH-accessible git server by Charm
294. `vaultwarden` — self-hosted Bitwarden server
295. `paperless-ngx` — document management with OCR
296. `immich` — self-hosted Google Photos replacement
297. `photoprism` — AI-powered photo management
298. `jellyfin` — media server, replace Plex
299. `navidrome` — music streaming server (Subsonic API)
300. `audiobookshelf` — podcast and audiobook server
301. `calibre-web` — ebook library server
302. `freshrss` — self-hosted RSS aggregator
303. `miniflux` — minimal RSS reader, Go binary
304. `wallabag` — read-it-later, self-hosted Pocket
305. `linkding` — bookmark manager
306. `hoarder` — bookmark manager with AI tagging
307. `shiori` — simple bookmark manager in Go
308. `mealie` — recipe manager
309. `tandoor` — recipe manager with meal planning
310. `grocy` — household management (groceries, chores)
311. `home assistant` — home automation platform
312. `node-red` — visual automation flows
313. `n8n` — workflow automation (self-hosted Zapier)
314. `activepieces` — n8n alternative
315. `windmill` — scripts and workflows with a web IDE
316. `temporal` — durable workflow engine
317. `uptime kuma` — monitoring with status page
318. `gatus` — endpoint monitoring with alerting
319. `healthchecks.io` self-hosted — cron job monitoring
320. `netdata` — real-time performance monitoring
321. `grafana` + `prometheus` stack
322. `victoria metrics` — lighter Prometheus alternative
323. `loki` + `grafana` — log aggregation and visualization
324. `goaccess` — real-time web log analyzer (already noted)
325. `plausible` — privacy-first analytics (already noted)
326. `umami` — simpler analytics alternative
327. `matomo` — full-featured analytics
328. `nextcloud` — self-hosted Google Drive / Docs
329. `seafile` — faster file sync than Nextcloud
330. `syncthing` — peer-to-peer file sync, no server needed
331. Syncthing between laptop and blog server for article drafts
332. `rclone` — sync files to any cloud storage
333. `restic` — encrypted backup to any backend
334. `borgbackup` — deduplicating encrypted backup
335. `duplicati` — backup with web UI
336. Automated backup of blog repo + articles to Backblaze B2
337. `minio` — self-hosted S3-compatible object storage
338. `garage` — lightweight distributed S3 alternative
339. `headscale` — self-hosted Tailscale coordination server
340. `authentik` — identity provider, SSO for self-hosted apps
341. `keycloak` — enterprise-grade SSO
342. `authelia` — 2FA and SSO proxy
343. `traefik` — reverse proxy with automatic Let's Encrypt
344. `nginx proxy manager` — GUI for nginx reverse proxy
345. `caddy` as reverse proxy for all self-hosted services
346. `docker compose` for all self-hosted services
347. `podman` as rootless Docker replacement
348. `podman-compose` for the same workflow
349. `distrobox` — run any Linux distro in a container
350. `toolbox` (Fedora) — development containers
351. `incus` — LXD fork, system containers and VMs
352. `cockpit` — web-based Linux server management UI
353. `webmin` — older but still useful admin panel
354. `portainer` — Docker management web UI
355. `yacht` — Docker management, cleaner UI than Portainer
356. `dockge` — docker compose management UI
357. `dasherr` / `homer` / `homarr` — self-hosted dashboard for all services
358. `flame` — minimal startpage / dashboard
359. `organizr` — media server dashboard
360. `penpot` — self-hosted Figma alternative

---

## Dev Tools & Scaffolding (361–420)

361. `better-t-stack` — scaffold a full-stack JS project
362. `create-t3-app` — Next.js + tRPC + Tailwind
363. `hono` — fast web framework for edge/Bun/Deno
364. `elysia` — Bun-native web framework with TypeScript
365. `bun` — JS runtime + package manager + bundler
366. `deno` — secure JS runtime with built-in TypeScript
367. `uv` — extremely fast Python package manager
368. `rye` — Python project manager (like cargo for Python)
369. `pdm` — PEP 582 Python package manager
370. `pixi` — conda-compatible fast package manager
371. `mise` — polyglot version manager (replaces nvm, pyenv, rbenv)
372. `devenv` — Nix-based dev environments
373. `devbox` — isolated dev environments without Docker
374. `flox` — Nix-based environment manager with a simpler UX
375. `nix-shell` — reproducible dev environments
376. NixOS — try it in a VM first
377. `direnv` — auto-load env vars per directory
378. `dotenv-vault` — sync .env files securely across team
379. `chamber` — store secrets in AWS SSM, use like env vars
380. `sops` — encrypt secrets in YAML/JSON, commit safely
381. `age` + `sops` for encrypting blog config secrets
382. `just` — command runner (better Makefile)
383. `task` (taskfile) — YAML-based task runner
384. `mask` — task runner from a markdown file
385. `mage` — Go-based task runner (Makefile in Go)
386. `tilt` — dev environment orchestrator with live reload
387. `skaffold` — Kubernetes dev workflow
388. `garden` — multi-service development and testing
389. `telepresence` — develop Kubernetes services locally
390. `ctlptl` — manage local Kubernetes clusters
391. `kind` — Kubernetes in Docker
392. `k3s` — lightweight Kubernetes
393. `k3d` — k3s in Docker
394. `minikube` — local Kubernetes cluster
395. `helm` — Kubernetes package manager
396. `kustomize` — Kubernetes config management
397. `flux` — GitOps for Kubernetes
398. `opentofu` — open-source Terraform fork
399. `pulumi` — infrastructure as real code (Go, Python, TS)
400. `ansible` — configuration management for the blog server
401. Ansible playbook to set up the blog server from scratch
402. `chezmoi` — dotfiles manager with templates and secrets
403. `stow` — symlink-based dotfiles manager
404. `yadm` — yet another dotfiles manager (git-based)
405. `mackup` — backup and sync application settings
406. `topgrade` — upgrade everything with one command
407. `renovate` — automated dependency updates (self-hosted)
408. `dependabot` — GitHub's dependency update bot
409. `trivy` — container and code vulnerability scanner
410. `grype` — vulnerability scanner for container images
411. `syft` — generate SBOMs from container images
412. `cosign` — sign container images
413. `slsa` — software supply chain security framework
414. `semgrep` — static analysis, find bugs by pattern
415. `sonarqube` — self-hosted code quality analysis
416. `codeclimate` — code quality metrics
417. `codecov` — test coverage tracking
418. `benchstat` — compare Go benchmark results
419. `hyperfine` — CLI benchmarking tool
420. `criterion` — Rust benchmarking framework

---

## Data & Automation (421–460)

421. `faker` (Python) — generate realistic fake data for testing
422. `mimesis` — faster faker alternative
423. `factory_boy` — test fixtures using factories
424. Generate fake article content with faker for load testing
425. `datasette` — publish SQLite databases as a web API
426. `sqlite-utils` — manipulate SQLite from the CLI
427. Blog article metadata in SQLite — query with datasette
428. `duckdb` — in-process analytical SQL database
429. Analyze access logs with duckdb — fast JSON parsing
430. `pydantic` — data validation with Python type hints
431. `polars` — fast DataFrame library (Rust backend)
432. `ibis` — DataFrame API that compiles to SQL
433. `evidence` — BI tool that uses SQL + markdown
434. `metabase` — self-hosted BI dashboard
435. `superset` — Apache's self-hosted data exploration tool
436. `redash` — self-hosted query and dashboard tool
437. `nocodb` — Airtable alternative on top of any database
438. `baserow` — another Airtable alternative
439. `appsmith` — internal tool builder
440. `budibase` — low-code internal app builder
441. `retool` — internal tool builder (hosted)
442. `pipedream` — event-driven automation platform
443. `huginn` — self-hosted IFTTT
444. `changedetection.io` — monitor web pages for changes
445. `ntfy` — push notifications via HTTP (self-hosted)
446. `gotify` — self-hosted push notification server
447. `apprise` — send notifications to 50+ services from CLI
448. Alert on 5xx errors in access log via `ntfy`
449. Alert when a new article is published (via git push hook)
450. `prefect` — Python-based workflow orchestration
451. `airflow` — batch workflow scheduler
452. `dagster` — data pipeline orchestration with assets
453. `hamilton` — micro-framework for dataflow in Python
454. `dbt` — transform data in your warehouse with SQL
455. `great expectations` — data quality validation
456. `pandera` — DataFrame schema validation
457. Log access patterns and visualize reading habits
458. Track word count per article over time
459. Reading time estimator for articles (words / 200 wpm)
460. Auto-generate article table of contents from headings

---

## Writing & Publishing (461–500)

461. `stackedit` — add an in-browser markdown editor to the blog
462. `obsidian` — personal knowledge base, export to blog
463. `logseq` — outliner knowledge base, open-source
464. `dendron` — VS Code extension for note-taking
465. `foam` — VS Code-based Roam alternative
466. `zettlr` — academic markdown editor
467. `marktext` — clean cross-platform markdown editor
468. `typora` — distraction-free markdown editor
469. `ghostwriter` — minimal markdown editor for Linux
470. `writeas` — minimal blogging platform (for inspiration)
471. Write in `neovim` with `zen-mode.nvim` for distraction-free editing
472. `vale` — prose linter (style guide enforcement)
473. `proselint` — linter for common writing errors
474. `alex` — catches insensitive language in writing
475. `languagetool` — self-hosted grammar checker
476. `textlint` — pluggable natural language linter
477. `mdbook` — render a directory of markdown as a book
478. `quartz` — publish Obsidian vault as a website
479. `hugo` — static site generator (already have it installed)
480. Compare hugo vs caddy-templates rendering approach
481. `zola` — Rust-based static site generator
482. `eleventy` — JavaScript static site generator
483. `astro` — content-focused web framework
484. `lume` — Deno-based static site generator
485. RSS feed for the blog — generate from articles directory
486. Atom feed as an alternative to RSS
487. JSON Feed — modern feed format (easier to parse)
488. Submit blog to Feedly, NewsBlur, other RSS directories
489. Submit to Hacker News "Who's blogging?" threads
490. IndieWeb webmention support — get notified of links
491. `webmention.io` — receive webmentions without self-hosting
492. `bridgy` — syndicate blog posts to social networks
493. POSSE — publish own site, syndicate elsewhere
494. Cross-post articles to dev.to via API
495. Cross-post to Hashnode via API
496. Generate a tweet/toot thread from an article automatically
497. `mastodon` API — post article links from the terminal
498. `toot` CLI — Mastodon client in the terminal
499. Email newsletter from the blog — `listmonk` self-hosted
500. `buttondown` — minimal newsletter service if not self-hosting
