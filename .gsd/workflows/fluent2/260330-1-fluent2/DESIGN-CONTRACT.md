# Design Contract — Fluent 2 CSS Completion

## Scope
Six CSS/template work items completing the Fluent 2 token system on a vanilla
Caddy + Go template blog. No React, no build step.

---

## W01 — Focus Ring

**File:** `css/blog.css`

All interactive elements use `:focus-visible` (not `:focus`) to avoid polluting
mouse interactions. Keyboard users get a 2px ring.

| Element | Token | Ring color |
|---------|-------|-----------|
| Links (`a`) | `--accent` | Amber `#c27a1a` / dark `#e8a840` |
| Theme toggle button | `--text-primary` | Neutral foreground |
| `.skip-link` | `--accent` | Already has custom styles, just add ring |

Spec:
```css
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

#theme-toggle:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}
```

---

## W02 — Spacing Token Scale

**File:** `css/blog.css` (added to `:root`)

Fluent 2 v9 global spacing ramp, 4px base unit. Token names adapted to hyphenated
CSS custom property style matching the existing token naming in the file.

| Token | Value | Fluent v9 name |
|-------|-------|----------------|
| `--spacing-xxs` | 2px | spacingHorizontalXXS |
| `--spacing-xs` | 4px | spacingHorizontalXS |
| `--spacing-s-nudge` | 6px | spacingHorizontalSNudge |
| `--spacing-s` | 8px | spacingHorizontalS |
| `--spacing-m-nudge` | 10px | spacingHorizontalMNudge |
| `--spacing-m` | 12px | spacingHorizontalM |
| `--spacing-l` | 16px | spacingHorizontalL |
| `--spacing-xl` | 20px | spacingHorizontalXL |
| `--spacing-xxl` | 24px | spacingHorizontalXXL |
| `--spacing-xxxl` | 32px | spacingHorizontalXXXL |
| `--spacing-xxxxl` | 48px | (extended for layout use) |

Migrate existing hardcoded `px` values in `blog.css`:
- `padding: 24px 20px` → `var(--spacing-xxl) var(--spacing-xl)`
- `margin-bottom: 24px` → `var(--spacing-xxl)`
- `margin-bottom: 16px` → `var(--spacing-l)`
- `padding: 5px 10px` → `var(--spacing-s-nudge) var(--spacing-m-nudge)` (approx)
- `gap: 5px` → `var(--spacing-s-nudge)`
- `padding: 10px 20px` (skip link) → `var(--spacing-m-nudge) var(--spacing-xl)`
- `padding: 20px 15px` (mobile) → `var(--spacing-xl) var(--spacing-m-nudge)`

---

## W03 — Typography Scale Tokens

**File:** `css/blog.css` (added to `:root`)

Fluent 2 v9 font size ramp. Values in px — matches the existing 18px body / inline
`px` sizing convention in the file. Line height tokens paired to each size.

| Token | Value |
|-------|-------|
| `--font-size-100` | 10px |
| `--font-size-200` | 12px |
| `--font-size-300` | 14px |
| `--font-size-400` | 16px |
| `--font-size-500` | 20px |
| `--font-size-600` | 24px |
| `--font-size-hero-700` | 28px |
| `--font-size-hero-800` | 32px |
| `--font-size-hero-900` | 40px |
| `--font-size-hero-1000` | 68px |

Line height tokens:

| Token | Value |
|-------|-------|
| `--line-height-100` | 14px |
| `--line-height-200` | 16px |
| `--line-height-300` | 20px |
| `--line-height-400` | 22px |
| `--line-height-500` | 28px |
| `--line-height-600` | 32px |
| `--line-height-hero-700` | 36px |
| `--line-height-hero-800` | 40px |
| `--line-height-hero-900` | 52px |
| `--line-height-hero-1000` | 92px |

Migrate existing `font-size` values:
- `2rem` (h1 desktop) → `var(--font-size-hero-800)` (32px — 2rem at 16px = 32px)
- `1.5rem` (h1 mobile) → `var(--font-size-hero-700)` (28px)
- `1.4rem` (h2) → `var(--font-size-600)` (24px — close match)
- `1.1rem` (h3) → `var(--font-size-500)` (20px)
- `1rem` (h4) → `var(--font-size-400)` (16px)
- `0.85rem` (nav, time, code) → `var(--font-size-300)` (14px)
- `0.75rem` (article time) → `var(--font-size-200)` (12px)
- `0.9rem` (table) → `var(--font-size-300)` (14px)
- `0.82em` (inline code) → `var(--font-size-200)` (12px — stays em-relative)
- `0.85rem` (pre code) → `var(--font-size-300)` (14px)

---

## W04 — Lucide Icons in Template

**File:** `templates/article.html`

Load Lucide from the already-committed local file. Place `<script>` tags at end
of `<body>` before closing tag.

```html
<script src="/scripts/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

**Theme toggle button:** Replace CSS pseudo-content (`::before` with `◐`/`◑`)
with two Lucide icon elements. CSS shows/hides based on current theme.

Button markup:
```html
<button id="theme-toggle" aria-label="Toggle theme" title="Toggle light/dark mode">
  <i data-lucide="sun" aria-hidden="true"></i>
  <i data-lucide="moon" aria-hidden="true"></i>
</button>
```

CSS:
```css
/* Light mode: show sun (we're in light, offer to switch to dark) */
#theme-toggle i[data-lucide="sun"] { display: none; }
#theme-toggle i[data-lucide="moon"] { display: inline; }

/* Dark mode: show moon is redundant — show sun to switch to light */
[data-theme="dark"] #theme-toggle i[data-lucide="sun"] { display: inline; }
[data-theme="dark"] #theme-toggle i[data-lucide="moon"] { display: none; }
```

Wait — semantically: show the icon for what you'll *switch to*, not what you're
currently in. Standard UX: in light mode show moon (click → go dark), in dark
mode show sun (click → go light). Default: moon visible.

**Back-nav arrow:** Only add arrow icon for non-root paths (not `/`).

```html
{{if ne $origPath "/"}}
<a href="/blog" class="back-nav"><i data-lucide="arrow-left" aria-hidden="true"></i> Blog</a>
{{end}}
```

Home path gets "Blog" link without arrow (it's a forward nav, not back). Blog
path gets "← Home". Keep the existing conditional logic.

**Icon sizing** in CSS:
```css
.back-nav i,
#theme-toggle i {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  stroke-width: 2;
}
```

Remove `::before` content rules for `#theme-toggle`.

---

## W05 — Article Index Card Styling

**Files:** `templates/article.html` (1 line), `css/blog.css`

Add `data-path` attribute to `<body>` to scope the card styles:
```html
<body data-path="{{$origPath}}">
```

CSS targets the Caddy-generated HTML from the markdown list in `articles/index.md`.
Caddy renders `- [text](url)` as `<ul><li><a href="...">text</a></li></ul>`.

Article list items with emdash descriptions (`text — description`) render as a
single `<a>` + text node inside each `<li>`.

```css
/* Article index cards — scoped to /blog and /articles/ paths */
body[data-path="/blog"] article ul,
body[data-path="/articles/"] article ul,
body[data-path="/articles"] article ul {
  list-style: none;
  padding: 0;
  margin: var(--spacing-xxl) 0 0;
}

body[data-path="/blog"] article ul li,
body[data-path="/articles/"] article ul li,
body[data-path="/articles"] article ul li {
  padding: var(--spacing-l);
  border: 1px solid var(--stroke-subtle);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-m);
  transition: box-shadow var(--duration-fast) var(--ease-soft),
              border-color var(--duration-fast) var(--ease-soft);
}

body[data-path="/blog"] article ul li:hover,
body[data-path="/articles/"] article ul li:hover,
body[data-path="/articles"] article ul li:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--stroke-default);
}

/* Article link — primary text in card */
body[data-path="/blog"] article ul li a,
body[data-path="/articles/"] article ul li a,
body[data-path="/articles"] article ul li a {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--font-size-400);
}

body[data-path="/blog"] article ul li a:hover,
body[data-path="/articles/"] article ul li a:hover,
body[data-path="/articles"] article ul li a:hover {
  color: var(--accent);
}
```

---

## W06 — Fix syntax.css Dark Mode Selector Bug

**File:** `css/syntax.css`

Current broken block (CSS parse failure):
```css
[data-theme="dark"] .bg,
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .bg }
{ color:#e6edf3;background-color:#0d1117; }
```

Fix: split into two separate valid rule blocks.
```css
[data-theme="dark"] .bg { color:#e6edf3;background-color:#0d1117; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .bg { color:#e6edf3;background-color:#0d1117; }
}
```

---

## Commit Plan

```
chore(fluent2): complete Fluent 2 token system — spacing, typography, focus rings
feat(fluent2): add Lucide icons to theme toggle and back-nav
feat(fluent2): add article index card styling
fix(fluent2): repair syntax.css dark mode .bg selector
```
