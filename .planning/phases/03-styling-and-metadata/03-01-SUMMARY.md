---
phase: 03-styling-and-metadata
plan: "01"
subsystem: frontend-styling
tags: [css, design, dark-mode, metadata, typography, accessibility]
dependency_graph:
  requires: [02-rendering-pipeline]
  provides: [SARA-styled-blog, dark-mode, og-metadata, back-navigation]
  affects: [templates/article.html, css/blog.css]
tech_stack:
  added: [Nunito Google Fonts, CSS custom properties, localStorage theme persistence]
  patterns: [SARA design language, data-theme attribute toggle, prefers-color-scheme fallback, anti-FOUC IIFE]
key_files:
  created: [css/blog.css]
  modified: [templates/article.html]
decisions:
  - "Anti-FOUC IIFE placed after charset/viewport metas but before link tags — technically correct, prevents flash"
  - "og:type: article added per plan note ('trivially small per user decision')"
  - "Dark mode uses [data-theme=dark] selector + prefers-color-scheme fallback so both JS toggle and system preference work"
  - "back-nav placed as first child of main (not before main) — inside reading column for visual alignment"
metrics:
  duration: "2 minutes"
  completed: "2026-02-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 03 Plan 01: SARA Styling and Metadata Summary

SARA design language applied to blog via css/blog.css (297 lines, CSS custom properties, dark/light mode, reading layout) and article.html updated with Nunito font, og:title, back-nav, and theme toggle with localStorage persistence.

## What Was Built

### Task 1: css/blog.css (new file, 297 lines)

Full SARA design language implementation for a reading-focused blog:

- **CSS custom properties**: 12 variables on `:root` for light mode (bg-primary #faf8f5, text-primary #5a534a, etc.)
- **Dark mode**: `[data-theme="dark"]` selector + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` for JS toggle and system preference
- **Global reset**: box-sizing border-box, zero margin/padding
- **Base**: 18px font-size, Nunito font stack, 1.8 line-height, warm background/color transitions
- **Reading layout**: 80ch max-width centered column, 40px 20px padding
- **Back nav** (`.back-nav`): inline-flex with hover background/color transition
- **Article header**: h1 at 2rem weight 300 letter-spaced; time metadata styling
- **Body typography**: paragraphs, h2/h3/h4 (weight 600 max), links, blockquote, inline code, pre, lists, hr
- **Theme toggle** (`#theme-toggle`): fixed position 40x40px circle, scale hover
- **Mobile responsive** (`@media max-width: 640px`): tighter padding, smaller h1, smaller toggle
- **Reduced motion**: animation/transition duration 0.01ms with !important

### Task 2: templates/article.html (updated)

Four additions to existing template, all Caddy template logic preserved:

1. **Anti-FOUC IIFE** in `<head>`: reads `localStorage.getItem('blog-theme')`, sets `data-theme` attribute on `<html>` before CSS renders
2. **og:title + og:type meta tags**: `<meta property="og:title" content="{{$doc.Meta.title}}">` and `<meta property="og:type" content="article">`
3. **Google Fonts Nunito**: preconnect links + `family=Nunito:wght@300;400;600&display=swap` (weights 300/400/600 only, SARA-compliant)
4. **Back nav link**: `<a href="/" class="back-nav">← Back</a>` as first child of `<main>`
5. **Theme toggle button + JS**: `<button id="theme-toggle">◐</button>` + click handler that toggles `data-theme` and writes to `localStorage('blog-theme')`

## Verification Results

All success criteria met:

| Check | Result |
|-------|--------|
| `grep -c "var(--" css/blog.css` | 27 (>= 15) |
| `grep "[data-theme" css/blog.css` | 2 matches |
| `grep "prefers-reduced-motion" css/blog.css` | Present |
| `grep "max-width" css/blog.css` | 80ch + 640px breakpoint |
| `wc -l css/blog.css` | 297 lines (>= 120) |
| No `#000000` or `#ffffff` | Confirmed |
| No `font-weight >= 700` | Confirmed |
| `curl -s .../test-styling \| grep og:title` | `<meta property="og:title" content="Test Styling Article">` |
| HTTP status on article URL | 200 |
| CSS file served | 200 |
| `grep "splitFrontMatter" templates/article.html` | Intact |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4349e70 | feat(03-01): write SARA-styled blog.css with dark/light mode |
| 2 | 47ebd3f | feat(03-01): update article.html with Nunito, og:title, back-nav, theme toggle |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED
