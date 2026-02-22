# blog

Personal blog served directly from Markdown files. No framework, no build step, no application server.

## How it works

**Caddy** serves everything. Articles are `.md` files in `articles/`. A single Go template (`templates/article.html`) renders them server-side using Caddy's built-in `templates` directive — `splitFrontMatter` parses YAML front matter, `markdown` renders the body via Goldmark.

**Tailscale Funnel** terminates TLS and proxies public traffic to Caddy on `localhost:8080`. Caddy runs plain HTTP.

**Content negotiation** — browsers get rendered HTML; `Accept: text/markdown` returns the raw `.md` file.

```
GET /articles/blog_system
  → Caddy rewrites to templates/article.html
  → template reads articles/blog_system.md
  → splitFrontMatter + markdown render
  → HTML response
```

## Stack

| Component | Role |
|-----------|------|
| Caddy | HTTP server, template rendering, routing |
| Tailscale Funnel | Public HTTPS termination |
| Goldmark | Markdown → HTML (built into Caddy) |
| Chroma | Syntax highlighting CSS |
| Nunito | Body font (Google Fonts) |

## Adding an article

Create `articles/your-slug.md` with YAML front matter:

```markdown
---
title: "Your Title"
date: "2026-02-22"
---

Article body here.
```

It's immediately live at `/articles/your-slug`.
