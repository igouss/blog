---
title: "The Blog System"
date: "2026-02-22"
---

This blog has no framework, no build step, and no Node.js. It's Caddy serving markdown files directly, with a single HTML template doing all the rendering server-side.

## The stack

**Caddy** is the only server process. It handles routing, content negotiation, template rendering, and static files. No application server sits behind it.

**Tailscale Funnel** terminates TLS and proxies public internet traffic to Caddy on `localhost:8080`. Caddy itself runs plain HTTP — it never sees a TLS handshake.

**Chroma** provides syntax highlighting CSS. The stylesheet was generated once via `hugo gen chromastyles --style=github` and committed as `css/syntax.css`. Hugo is not part of the serving stack.

## How a request works

A browser hits `https://fedora.mist-walleye.ts.net/articles/blog_system`. Tailscale Funnel decrypts it and forwards it to `:8080`. Caddy matches the path against `@articleSlug` and rewrites the request to `templates/article.html`, then hands it to the `templates` middleware.

The template reads the original request path, derives the markdown file path (`/articles/blog_system.md`), checks it exists, and calls `splitFrontMatter` to separate YAML metadata from the body. The body runs through `markdown` (Caddy's built-in Goldmark renderer) and the result is injected into the HTML.

```
GET /articles/blog_system
  → Caddy matches @articleSlug
  → rewrites to /templates/article.html
  → templates middleware executes the template
  → template reads /articles/blog_system.md
  → splitFrontMatter + markdown render
  → HTML response
```

The `Vary: Accept` header on every response tells caches that the representation depends on the `Accept` header. A client sending `Accept: text/markdown` gets the raw `.md` file directly — no template, no rendering.

```bash
curl -H "Accept: text/markdown" https://fedora.mist-walleye.ts.net/articles/blog_system
```

## The template

`templates/article.html` is a Go template with a small amount of logic. It resolves the markdown path, 404s if the file doesn't exist, extracts front matter, and renders the body. The Caddy `templates` directive provides the `fileExists`, `include`, `splitFrontMatter`, `markdown`, and `httpError` functions.

Front matter fields used:

| Field | Used for |
|-------|----------|
| `title` | `<title>`, `<h1>`, `og:title` |
| `date` | `<time>` element |

## Styling

CSS custom properties on `:root` define the light mode palette. Dark mode overrides live on `[data-theme="dark"]` and inside a `prefers-color-scheme: dark` media query for system-preference fallback. A theme toggle button in the corner writes the chosen theme to `localStorage` and sets `data-theme` on `<html>`.

An anti-FOUC script runs before the stylesheet loads to apply the saved theme before the first paint.

Typography is Nunito from Google Fonts at weights 300, 400, and 600. Body text is 18px with 1.8 line-height in an 80ch reading column.

## What's absent

No database. No CMS. No authentication. No JavaScript framework. No bundler. No CI pipeline. Adding an article means adding a `.md` file and pushing a commit.

The index page is itself a markdown file (`articles/index.md`) rendered through the same template as every other article.

Source: [github.com/igouss/blog](https://github.com/igouss/blog)
