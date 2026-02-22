# Phase 2: Rendering Pipeline - Research

**Researched:** 2026-02-21
**Domain:** Caddy templates + Goldmark Markdown rendering + content negotiation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Article HTML output
- Template renders: title (from front matter) + date only — no author or other fields
- Template includes a `<link>` to the CSS file now, even though it doesn't exist until Phase 3 — avoids rework
- Title/heading placement: Claude's discretion (standard blog practice)
- Template filename: Claude's discretion (e.g., `templates/article.html`)
- Also create an `images/` directory in Phase 2 (currently missing from repo)

#### Directory access control
- Caddy uses a **whitelist** approach: only allow requests to explicitly permitted paths
- Whitelisted directories: `articles/`, `css/`, `scripts/`, `images/`
- All other paths (including `templates/`, `configs/`, and anything else) return HTTP 403
- Implementation: Caddy route/respond directives (not template logic)

#### URL structure
- Clean URLs: `/articles/my-post` (no `.md` extension) — Caddy rewrites internally
- `/articles/` (with no slug) serves `articles/index.md` if it exists, otherwise 404
- `/` (blog root) serves `articles/index.md` directly — no redirect, same pipeline
- Content negotiation applies to article URLs only (`/articles/*` and `/`) — CSS and other assets serve as-is

#### Content negotiation
- `Accept: text/markdown` → raw Markdown with `Content-Type: text/markdown`
- All other Accept headers (including `*/*` and no header) → rendered HTML (Claude decides conventional default)
- `Vary: Accept` header on all article responses (correct per HTTP spec)
- Content negotiation scoped to articles only

#### Syntax highlighting
- Chroma theme: **github** (light)
- CSS output: separate file at `css/syntax.css` (not inline styles, not embedded in main CSS)
- No line numbers
- Fenced code blocks without a language tag: apply default code styling (monospace font + background) without color highlighting

#### 404 page
- Missing article returns a full HTML response using the article template (not plain text, not minimal HTML)
- Includes navigation link: `← Back to articles` pointing to `/`
- Links to main blog CSS only (not `css/syntax.css` — no code blocks on 404 page)
- Respects `Accept` header: `Accept: text/markdown` returns a plain-text Markdown-formatted 404 message; all others return HTML

### Claude's Discretion
- Whether article title appears as `<h1>` in body vs only in `<title>` tag — standard blog practice
- Template filename within `templates/`
- Default content negotiation behavior for `Accept: */*` — conventional HTTP behavior
- Exact `Vary: Accept` scope (all responses vs HTML-only — HTTP spec correctness)
- Exact 404 Markdown response body format

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-01 | Caddy rewrites article URLs to an HTML template for Markdown-to-HTML rendering | `path_regexp` matcher + `rewrite` directive rewrites `/articles/slug` → internally serves `templates/article.html`; `.OriginalReq.URL.Path` preserves original path for file reading |
| REND-02 | HTML template reads the Markdown file using `.OriginalReq.URL.Path` and renders it via Goldmark | `include .OriginalReq.URL.Path \| splitFrontMatter` loads the `.md` file; `markdown $doc.Body` renders it; Goldmark is bundled in Caddy — no installation needed |
| REND-03 | Template returns HTTP 404 for missing articles (using `fileExists` guard) | `{{if not (fileExists $mdPath)}}{{httpError 404}}{{end}}` pattern is verified from official Caddy source; `httpError` aborts template and returns proper HTTP 404 |
| REND-04 | Template displays article title and date from YAML front matter | `splitFrontMatter` returns `.Meta` map; access via `$doc.Meta.title` and `$doc.Meta.date`; YAML front matter delimited by `---` |
| REND-05 | Code blocks are syntax-highlighted via Chroma (CSS theme file served alongside blog CSS) | Caddy's `markdown` function already uses Goldmark + Chroma with class-based output; CSS must be generated separately (`hugo gen chromastyles --style=github`) and saved to `css/syntax.css` |
| REND-06 | Caddy serves raw Markdown to clients sending `Accept: text/markdown` without `Accept: text/html` | `@wantsMarkdown` named matcher with `header Accept *text/markdown*`; `handle @wantsMarkdown` serves raw file with `Content-Type: text/markdown` via `header` + `file_server` |
| REND-07 | HTTP responses include `Vary: Accept` header when content negotiation is active | `header +Vary "Accept"` directive in article route blocks; deferred header setting is safe |
| STYL-04 | Templates directory is blocked from direct browser access (403) | Whitelist via `handle` blocks: allow only `articles/`, `css/`, `scripts/`, `images/` paths; catch-all `respond 403` for everything else |
</phase_requirements>

---

## Summary

Phase 2 is implemented entirely within Caddy — no external processes, no build steps for the core rendering pipeline. Caddy's built-in `templates` directive executes Go HTML templates that use the `include` + `splitFrontMatter` + `markdown` function chain to render Markdown files as HTML. The Goldmark library (CommonMark + GFM + Chroma syntax highlighting) is bundled in Caddy's standard build and requires no installation.

Content negotiation is handled at the Caddyfile level using named matchers on the `Accept` header. The `@wantsMarkdown` matcher fires for `Accept: text/markdown`; all other requests fall through to the HTML rendering path. The `Vary: Accept` header is added using Caddy's `header` directive. Directory access control is implemented as a whitelist using mutually-exclusive `handle` blocks — only `articles/`, `css/`, `scripts/`, `images/`, and `/` are routed; everything else gets a `respond 403`.

The one pre-generation step required is the Chroma CSS stylesheet for syntax highlighting. Caddy's `markdown` function outputs class-based HTML (e.g., `<span class="k">`) — the CSS must be generated separately. The most accessible tool is Hugo's `hugo gen chromastyles --style=github > css/syntax.css` command. Hugo is available on Fedora via dnf and is a one-time generation step; the resulting `css/syntax.css` is then committed to the repo and served statically.

**Primary recommendation:** Use Caddy's native template pipeline (`templates` directive + `include` + `splitFrontMatter` + `markdown` + `fileExists` + `httpError`) for all rendering. Implement content negotiation with named `handle` blocks rather than `route` — `handle` blocks are mutually exclusive at the same nesting level, which is exactly the branching semantics needed.

---

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Caddy templates directive | Built-in (v2.10.2 installed) | Execute Go HTML templates as response middleware | Native Caddy feature, no plugins needed |
| Goldmark | Bundled in Caddy | CommonMark + GFM Markdown to HTML | Already compiled into Caddy's standard binary |
| Chroma | Bundled in Caddy (via Goldmark extension) | Syntax highlighting for code blocks | Automatically used by Caddy's `markdown` template function |

### Supporting (one-time generation)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Hugo (via dnf) | Generate `css/syntax.css` via `hugo gen chromastyles --style=github` | One-time generation; output committed to repo |
| Alternatively: `go run` | Write a tiny Go script using `github.com/alecthomas/chroma/v2` to `WriteCSS()` | If Hugo is not available on the host |

**Installation (if Hugo not present):**
```bash
sudo dnf install hugo
# Then generate:
hugo gen chromastyles --style=github > /home/elendal/IdeaProjects/blog/css/syntax.css
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Caddy templates | External renderer (pandoc, Node.js) | External processes break Caddy's handler chain; templates is the right layer |
| `hugo gen chromastyles` | Handcraft CSS | Chroma class names are generated — wrong to maintain by hand |
| `handle` for content negotiation | `route` directive | `handle` provides built-in mutual exclusivity; `route` would require explicit ordering |

---

## Architecture Patterns

### Recommended File Layout

```
/home/elendal/IdeaProjects/blog/
├── articles/
│   ├── index.md          # List of articles (served at / and /articles/)
│   └── my-post.md        # Article file (served at /articles/my-post)
├── templates/
│   └── article.html      # Go HTML template for rendering articles (BLOCKED from web access)
├── css/
│   ├── blog.css          # Main CSS (Phase 3 — linked from template now)
│   └── syntax.css        # Chroma-generated syntax highlighting CSS
├── images/               # Static images (whitelisted, currently empty)
├── scripts/              # Operational scripts (whitelisted)
└── configs/
    └── Caddyfile         # Caddy config (BLOCKED from web access)
```

### Pattern 1: URL Rewriting for Clean Article URLs

**What:** Map `/articles/slug` → read `articles/slug.md` from disk; map `/` → read `articles/index.md`.

**Key insight from prior research:** Rewrite to `templates/article.html` (not to the `.md` file) because Caddy's `templates` directive only executes on `text/html` MIME types by default. The template then reads the `.md` file using `.OriginalReq.URL.Path` with the `.md` extension appended.

**Approach:** Use `path_regexp` matcher with capture groups to strip the extension-less slug and rewrite to the template HTML file.

```caddyfile
# Match /articles/{slug} (no trailing slash, no .md extension)
@article path_regexp article ^/articles/([^/]+)$
rewrite @article /templates/article.html

# Match /articles/ (directory index)
@articleIndex path /articles/
rewrite @articleIndex /templates/article.html

# Match / (blog root → same pipeline)
@root path /
rewrite @root /templates/article.html
```

The template then constructs the `.md` path from `.OriginalReq.URL.Path`:
```
# For /articles/my-post → original path is /articles/my-post → append .md
# For /articles/ → original path is /articles/ → use /articles/index.md
# For / → original path is / → use /articles/index.md
```

### Pattern 2: Content Negotiation with `handle` Blocks

**What:** Branch on `Accept` header — Markdown clients get raw file; everyone else gets rendered HTML.

**Why `handle` not `route`:** `handle` blocks at the same nesting level are mutually exclusive — first match wins and subsequent handles are skipped. This is exactly what content negotiation needs.

```caddyfile
@wantsMarkdown header Accept *text/markdown*

handle @wantsMarkdown {
    # Rewrite to actual .md file path
    # Set Content-Type and Vary, serve raw file
    header Content-Type "text/markdown; charset=utf-8"
    header +Vary "Accept"
    # ... file_server after rewriting to .md path
}

handle {
    # Default: render HTML
    header +Vary "Accept"
    # ... rewrite to template + templates + file_server
}
```

### Pattern 3: Template Function Chain for Article Rendering

**Verified from official Caddy source and documentation:**

```html
{{/* Construct the .md file path from the original (pre-rewrite) request path */}}
{{$origPath := .OriginalReq.URL.Path}}
{{$mdPath := ""}}
{{if eq $origPath "/"}}
  {{$mdPath = "/articles/index.md"}}
{{else if eq $origPath "/articles/"}}
  {{$mdPath = "/articles/index.md"}}
{{else}}
  {{$mdPath = printf "%s.md" $origPath}}
{{end}}

{{/* 404 if file doesn't exist */}}
{{if not (fileExists $mdPath)}}{{httpError 404}}{{end}}

{{/* Load and parse front matter */}}
{{$doc := include $mdPath | splitFrontMatter}}

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{$doc.Meta.title}}</title>
  <link rel="stylesheet" href="/css/blog.css">
  <link rel="stylesheet" href="/css/syntax.css">
</head>
<body>
  <article>
    <h1>{{$doc.Meta.title}}</h1>
    <time>{{$doc.Meta.date}}</time>
    {{markdown $doc.Body}}
  </article>
</body>
</html>
```

**Source:** `tplcontext.go` in caddyserver/caddy repo (verified); Caddy website docs example using same pattern.

### Pattern 4: Directory Access Whitelist via `handle` Blocks

**What:** Allow only specific paths; return 403 for everything else.

```caddyfile
# Whitelisted paths — these have their own handle blocks above
handle /articles/* { ... }
handle /css/* { file_server }
handle /images/* { file_server }
handle /scripts/* { file_server }
handle / { ... }

# Catch-all: 403 for everything not whitelisted
handle {
    respond 403
}
```

**Key:** `handle` blocks are mutually exclusive; the catch-all `handle {}` fires only if nothing above matched.

### Pattern 5: Chroma CSS Generation

Caddy's `markdown` function outputs class-based HTML (requires external CSS). The `github` theme is confirmed available in Chroma's style gallery.

```bash
# Generate the CSS once; commit to repo
hugo gen chromastyles --style=github > css/syntax.css
```

The generated CSS contains selectors like `.chroma .k { color: ... }`, `.chroma .s { color: ... }`. Fenced code blocks without a language tag are wrapped in `<pre class="chroma"><code>` but receive no token-level classes — they get the `.chroma` container styling only (monospace, background), which matches the decision: "default code styling without color highlighting."

### Anti-Patterns to Avoid

- **Rewriting to `.md` instead of `.html`:** The `templates` directive's default MIME types are `text/html` and `text/plain`. Caddy determines MIME type from the file extension being served; `.md` files get `text/markdown` which is NOT in the default list, so templates will NOT execute. Must rewrite to `.html`.
- **Using `.Req.URL.Path` instead of `.OriginalReq.URL.Path`:** After rewriting to `templates/article.html`, `.Req.URL.Path` is `/templates/article.html` — the rewritten path — not the original article URL. Must use `.OriginalReq.URL.Path` to get `/articles/my-post`.
- **Inline Chroma styles (not CSS classes):** If you configure Goldmark/Chroma with inline styles, the `css/syntax.css` file is useless. Caddy's built-in `markdown` function always uses CSS classes — do not attempt to override this.
- **Using `route` for content negotiation:** While `route` works, it does not provide mutual exclusivity — directives inside execute in order regardless. Use `handle` instead, which provides the if/else-if semantics needed.
- **Setting `Vary: Accept` only on HTML responses:** The HTTP spec requires `Vary: Accept` on ALL responses for URLs where content negotiation applies (both HTML and Markdown responses), so caches know to key on Accept.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown → HTML conversion | Custom parser or shell out to pandoc | `{{markdown $doc.Body}}` in template | Goldmark + GFM + Chroma is bundled in Caddy; handles CommonMark edge cases |
| YAML front matter parsing | String splitting, regex | `splitFrontMatter` template function | Handles YAML/TOML/JSON, returns `.Meta` map |
| Syntax highlighting CSS | Manual CSS | `hugo gen chromastyles --style=github` | Chroma class names are generated — must match exactly what Chroma outputs |
| Content-type detection | Custom logic | Caddy `header` matcher on `Accept` | Caddy's header matcher supports substring wildcards (`*text/markdown*`) |
| 404 for missing files | HTTP redirect, empty response | `{{if not (fileExists $path)}}{{httpError 404}}{{end}}` | `httpError` properly aborts template execution and propagates HTTP error |

**Key insight:** Everything in this phase is accomplished with Caddy directives and Go template functions. Adding any external process (Node.js, Python, shell scripts invoked from templates) creates deployment complexity and process management concerns with zero benefit.

---

## Common Pitfalls

### Pitfall 1: Templates Not Executing (MIME Type Mismatch)
**What goes wrong:** `templates` directive does nothing; raw template source code appears in browser.
**Why it happens:** The `templates` directive only processes responses with MIME types in its list. Default list is `text/html` and `text/plain`. If Caddy serves `article.html` as `text/html` (which it does for `.html` files), templates execute. But if somehow the response has a different content type, templates skip.
**How to avoid:** Always rewrite to a `.html` file. Caddy infers `text/html` from the `.html` extension, which matches the default templates MIME list.
**Warning signs:** Browser shows `{{$doc := include ...}}` literally in the page source.

### Pitfall 2: Wrong Path in Template (`.Req` vs `.OriginalReq`)
**What goes wrong:** `include .Req.URL.Path` tries to read `/templates/article.html` (the rewritten path) as a Markdown file, not the original article path.
**Why it happens:** After `rewrite @article /templates/article.html`, `.Req.URL.Path` is `/templates/article.html`. The original path is preserved in `.OriginalReq.URL.Path`.
**How to avoid:** Always use `.OriginalReq.URL.Path` in the template to reconstruct the `.md` file path.
**Warning signs:** Template works for some paths but consistently fails to load file; `fileExists` returns false even for articles that exist.

### Pitfall 3: `httpError` Doesn't Stop Template Execution Immediately
**What goes wrong:** Template continues executing after `{{httpError 404}}`, potentially producing partial output or panicking on nil values.
**Why it happens:** `httpError` returns `(bool, error)` — without `{{end}}` or proper conditional structure, template may continue.
**How to avoid:** Always use as guard: `{{if not (fileExists $path)}}{{httpError 404}}{{end}}` — the `{{end}}` stops the if block; Caddy's error propagation handles the rest.
**Warning signs:** Partial HTML rendered before 404 error page; template panic logs.

### Pitfall 4: Content Negotiation Matcher Too Broad or Too Narrow
**What goes wrong:** Either API clients get HTML (matcher not matching `Accept: text/markdown`) or browsers accidentally get raw Markdown (matcher matching `*/*`).
**Why it happens:** Header matcher `*text/markdown*` uses substring matching — it will match `Accept: text/markdown` and `Accept: text/markdown, text/html` but NOT `Accept: */*`. This is the correct behavior.
**How to avoid:** Use `header Accept *text/markdown*` only. Do NOT add `not header Accept *text/html*` unless specifically needed — the current requirement is: `text/markdown` → raw; everything else → HTML. The matcher `*text/markdown*` is sufficient.
**Warning signs:** Test with `curl -H "Accept: text/markdown"` for raw; plain `curl` (which sends `*/*` by default) for HTML.

### Pitfall 5: Chroma CSS Missing or Mismatched
**What goes wrong:** Code blocks appear unstyled (no syntax highlighting colors) even though Markdown renders correctly.
**Why it happens:** Caddy's `markdown` function outputs HTML like `<span class="chroma k">keyword</span>` but no CSS file defines `.chroma .k`. The `css/syntax.css` file must exist and be linked in the template.
**How to avoid:** Generate CSS with `hugo gen chromastyles --style=github > css/syntax.css` before testing. Link it in the template: `<link rel="stylesheet" href="/css/syntax.css">`.
**Warning signs:** Code blocks visible but all one color (no highlighting); browser DevTools shows 404 for `/css/syntax.css`.

### Pitfall 6: `Vary: Accept` Missing on Markdown Responses
**What goes wrong:** CDN or caching proxy serves HTML to an API client that previously requested Markdown, or vice versa.
**Why it happens:** Without `Vary: Accept`, caches do not differentiate responses by Accept header value.
**How to avoid:** Add `header +Vary "Accept"` in BOTH the Markdown handler and the HTML handler (or in a shared location that runs for all article responses).
**Warning signs:** Content negotiation works for first request but returns wrong content type on subsequent requests when behind a cache.

### Pitfall 7: Directory Traversal / Unwhitelisted Paths Returning 200
**What goes wrong:** `GET /configs/Caddyfile` returns the Caddyfile content; `GET /templates/article.html` returns template source.
**Why it happens:** Caddy's `file_server` serves any readable file unless restricted. Without the whitelist, all files in the repo root are accessible.
**How to avoid:** Use catch-all `handle { respond 403 }` AFTER all whitelisted path handlers. Test explicitly: `curl http://localhost:8080/configs/Caddyfile` should return 403.
**Warning signs:** Sensitive config files accessible via browser.

---

## Code Examples

Verified patterns from official sources:

### Complete Caddyfile Structure for Phase 2

```caddyfile
fedora.mist-walleye.ts.net {
    root * /home/elendal/IdeaProjects/blog

    # --- Named matchers ---

    # Articles: /articles/{slug} (no trailing slash, no extension)
    @articleSlug path_regexp article ^/articles/([^/]+)$
    # Articles index: /articles/
    @articleIndex path /articles/
    # Blog root: /
    @root path /
    # Markdown-requesting clients
    @wantsMarkdown header Accept *text/markdown*

    # --- Article routing with content negotiation ---

    handle @wantsMarkdown {
        # Only applies within article paths (combined with path matchers in nested handles if needed)
        # Rewrite to actual .md file; file_server serves it raw
        # Handled below per-path for clarity
    }

    # Blog root and /articles/ index
    handle @root {
        header +Vary "Accept"
        @rootMarkdown header Accept *text/markdown*
        handle @rootMarkdown {
            header Content-Type "text/markdown; charset=utf-8"
            rewrite * /articles/index.md
            file_server
        }
        handle {
            rewrite * /templates/article.html
            templates
            file_server
        }
    }

    handle @articleIndex {
        header +Vary "Accept"
        @idxMarkdown header Accept *text/markdown*
        handle @idxMarkdown {
            header Content-Type "text/markdown; charset=utf-8"
            rewrite * /articles/index.md
            file_server
        }
        handle {
            rewrite * /templates/article.html
            templates
            file_server
        }
    }

    handle @articleSlug {
        header +Vary "Accept"
        @slugMarkdown header Accept *text/markdown*
        handle @slugMarkdown {
            header Content-Type "text/markdown; charset=utf-8"
            # Append .md: /articles/my-post → /articles/my-post.md
            rewrite * {re.article.0}.md
            file_server
        }
        handle {
            rewrite * /templates/article.html
            templates
            file_server
        }
    }

    # Whitelisted static directories
    handle /css/* {
        file_server
    }

    handle /images/* {
        file_server
    }

    handle /scripts/* {
        file_server
    }

    # Catch-all: 403 for /templates/, /configs/, and anything else
    handle {
        respond 403
    }

    tls {
        get_certificate tailscale
    }
}
```

**Note on rewrite for slug + `.md`:** The `path_regexp article` capture group `{re.article.1}` captures the slug. The full original path is `{re.article.0}` (the full match group 0 = full matched path). For the rewrite: `rewrite * /articles/{re.article.1}.md` constructs the `.md` path correctly.

### article.html Template

```html
{{$origPath := .OriginalReq.URL.Path}}
{{$mdPath := ""}}
{{if or (eq $origPath "/") (eq $origPath "/articles/")}}
  {{$mdPath = "/articles/index.md"}}
{{else}}
  {{$mdPath = printf "%s.md" $origPath}}
{{end}}
{{if not (fileExists $mdPath)}}{{httpError 404}}{{end}}
{{$doc := include $mdPath | splitFrontMatter}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{$doc.Meta.title}}</title>
  <link rel="stylesheet" href="/css/blog.css">
  <link rel="stylesheet" href="/css/syntax.css">
</head>
<body>
  <main>
    <article>
      <header>
        <h1>{{$doc.Meta.title}}</h1>
        <time datetime="{{$doc.Meta.date}}">{{$doc.Meta.date}}</time>
      </header>
      {{markdown $doc.Body}}
    </article>
  </main>
</body>
</html>
```

### 404 Template (for handle_errors or inline with httpError)

The `httpError 404` from the template triggers Caddy's error handling chain. To serve a custom 404 using the article template style, use `handle_errors`:

```caddyfile
handle_errors 404 {
    @404markdown header Accept *text/markdown*
    handle @404markdown {
        header Content-Type "text/markdown; charset=utf-8"
        respond "# 404 Not Found\n\nThe article you requested does not exist.\n\n[← Back to articles](/)" 404
    }
    handle {
        rewrite * /templates/404.html
        templates
        file_server
    }
}
```

`templates/404.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>404 Not Found</title>
  <link rel="stylesheet" href="/css/blog.css">
</head>
<body>
  <main>
    <article>
      <h1>404 Not Found</h1>
      <p>The article you requested does not exist.</p>
      <p><a href="/">← Back to articles</a></p>
    </article>
  </main>
</body>
</html>
```

**Important:** `handle_errors` with `file_server` preserves the 404 status code automatically when serving from within an error handler.

### Markdown Front Matter Format

```yaml
---
title: My Blog Post
date: 2026-02-21
---

Post content begins here.
```

Access in template: `$doc.Meta.title`, `$doc.Meta.date`.

### Generating Chroma CSS

```bash
# Option A: Hugo (preferred — available via dnf on Fedora)
sudo dnf install hugo
hugo gen chromastyles --style=github > /home/elendal/IdeaProjects/blog/css/syntax.css

# Option B: Verify the file was generated correctly
head -5 /home/elendal/IdeaProjects/blog/css/syntax.css
# Expected: /* Background */ .chroma { ... }
```

### Verification Commands

```bash
# Test HTML rendering (browser behavior)
curl -s http://localhost:8080/articles/my-post | head -20
# Expected: HTML with title and rendered content

# Test raw Markdown serving
curl -H "Accept: text/markdown" http://localhost:8080/articles/my-post
# Expected: Raw .md content, Content-Type: text/markdown

# Verify Vary header
curl -I http://localhost:8080/articles/my-post | grep -i vary
# Expected: Vary: Accept

# Test 404
curl -I http://localhost:8080/articles/nonexistent
# Expected: HTTP/2 404

# Test access control (must return 403)
curl -I http://localhost:8080/templates/article.html
curl -I http://localhost:8080/configs/Caddyfile
# Expected: HTTP/2 403 for both

# Test root redirect to index
curl -s http://localhost:8080/ | head -5
# Expected: HTML rendering of articles/index.md
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Caddy v1 `markdown` directive (built-in) | Caddy v2 `templates` directive with `{{markdown}}` function | Caddy v2 (2020) | No more standalone markdown middleware; now templated |
| Inline Chroma styles | CSS class-based Chroma output | Chroma v2 default | Requires external CSS file; enables theme switching |
| `route` for handler ordering | `handle` for mutually-exclusive branching | Caddy 2.3+ | `handle` provides cleaner if/else semantics |

**Deprecated/outdated:**
- Caddy v1's `markdown` directive: does not exist in v2 — don't search for it
- `path` placeholder in rewrites: now `{http.request.uri.path}` or `{path}` in Caddyfile — verify against current docs

---

## Open Questions

1. **Exact rewrite syntax for slug → `.md` path**
   - What we know: `path_regexp article ^/articles/([^/]+)$` captures slug in group 1; `{re.article.1}` is the placeholder
   - What's unclear: Whether `rewrite * /articles/{re.article.1}.md` works correctly or needs the full `rewrite @articleSlug /articles/{re.article.1}.md` form
   - Recommendation: Test with `caddy adapt` to validate Caddyfile and test with `curl` against a running instance; if `{re.article.1}` doesn't expand correctly in rewrite target, use `uri path_regexp` directive instead

2. **Nested `handle` blocks for content negotiation**
   - What we know: `handle` blocks at the same nesting level are mutually exclusive
   - What's unclear: Whether nested `handle` inside another `handle` works as expected for per-path content negotiation branching
   - Recommendation: An alternative structure is a single `@wantsMarkdown` + `@articleSlug` combined matcher using both conditions; test both approaches

3. **`templates` directive placement relative to `file_server`**
   - What we know: `templates` wraps the response writer; `file_server` produces the response body
   - What's unclear: Whether `templates` must come before or after `file_server` in a `handle` block, or if Caddy's handler ordering handles it automatically
   - Recommendation: Since `handle` blocks use Caddy's standard handler chain ordering (templates before file_server in Caddy's internal order), placing both in a `handle` block should work; use `route` inside the handle if explicit ordering is needed

---

## Sources

### Primary (HIGH confidence)
- `pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/templates` — complete template function signatures, `.OriginalReq`, `splitFrontMatter`, `fileExists`, `httpError`, `markdown`, `include`
- `github.com/caddyserver/caddy/issues/4939` — `httpError` function behavior confirmed: aborts template, propagates HTTP error
- `caddyserver.com/docs/caddyfile/matchers` — `header` matcher syntax with `*` wildcards, `path_regexp` with capture groups
- `caddyserver.com/docs/caddyfile/directives/rewrite` — rewrite directive syntax
- `caddyserver.com/docs/caddyfile/directives/respond` — 403 response syntax
- `caddyserver.com/docs/caddyfile/directives/header` — `+Vary "Accept"` pattern for adding response headers
- `caddyserver.com/docs/caddyfile/directives/handle_errors` — custom 404 page with templates
- `xyproto.github.io/splash/docs/` — confirmed `github` theme exists in Chroma; `github-dark` variant also available
- Caddy v2.10.2 confirmed installed on host (`caddy version`)

### Secondary (MEDIUM confidence)
- `til.jakelazaroff.com/caddy/serve-markdown-files-as-html/` — practical working example of `include .OriginalReq.URL.Path | splitFrontMatter` + `{{markdown $md.Body}}`
- `skeptrune.com/posts/use-the-accept-header-to-serve-markdown-instead-of-html-to-llms/` — content negotiation pattern with `header Accept *text/markdown*` matcher; `Vary: Accept` header
- `caddy.community/t/v2-help-with-path_regexp-and-rewrite/9442` — `{re.name.N}` capture group placeholder usage in rewrites

### Tertiary (LOW confidence — verify before use)
- Caddyfile structure with nested handle blocks for content negotiation: derived from principles, not from a single working example with this exact structure. Validate with `caddy adapt` and live testing.

---

## Metadata

**Confidence breakdown:**
- Template functions (`markdown`, `splitFrontMatter`, `fileExists`, `httpError`, `.OriginalReq`): HIGH — verified from official Go package docs and Caddy source
- Caddyfile structure (handle, route, header matcher, rewrite): HIGH — verified from official Caddy docs
- Chroma CSS generation: HIGH — `github` theme confirmed, `hugo gen chromastyles` command confirmed
- Nested handle blocks for content negotiation: MEDIUM — principles confirmed, exact nested structure needs live validation
- Exact `path_regexp` rewrite for slug→`.md` conversion: MEDIUM — syntax confirmed from community; needs live test

**Research date:** 2026-02-21
**Valid until:** 2026-04-21 (Caddy is stable; 60-day validity reasonable)
