# Fluent 2 CSS Audit — 2026-03-30

## Stack Facts

| Field | Value |
|-------|-------|
| Server | Caddy with Go templates + Goldmark markdown renderer |
| TLS | Tailscale Funnel (Caddy runs plain HTTP on :8080) |
| Package manager | Bun (bun.lock present) |
| TypeScript | None |
| React / bundler | None |
| CSS approach | Vanilla CSS custom properties (`css/blog.css`, `css/syntax.css`) |
| Dark mode | data-theme attribute + prefers-color-scheme media query + localStorage toggle |
| Icons | `scripts/lucide.min.js` present but not loaded in template |

## Template Inventory

| File | Purpose |
|------|---------|
| `templates/article.html` | Single template rendering all pages |
| `templates/404.html` | 404 page |

## Pages / Routes

| Route | Source |
|-------|--------|
| `/` | `articles/about.md` |
| `/blog` | `articles/index.md` |
| `/articles/<slug>` | `articles/<slug>.md` (16 articles) |

## Fluent 2 Installation Status

`@fluentui/react-components` is NOT installed — this is not a React project.
CSS custom properties manually implementing the Fluent 2 token design are in place. `blog.css` comment header reads: "Fluent 2 Design System — Blog Reading Layout".

**Tokens present:** background neutrals, text neutrals, accent (amber), stroke, shadow (dual key+ambient), border radius, motion easing + duration.

## In-Scope Work Items

| ID | Item | File(s) |
|----|------|---------|
| W01 | Focus ring styles (Fluent 2: 2px solid + 2px offset) | `css/blog.css` |
| W02 | Spacing token scale (--spacingXXS through --spacingXXXL) | `css/blog.css` |
| W03 | Typography scale tokens (--fontSizeBase100 through --fontSizeHero1000) | `css/blog.css` |
| W04 | Lucide icons in template (theme toggle + back-nav) | `templates/article.html`, `css/blog.css` |
| W05 | Article index card styling (target Caddy-generated HTML from index.md) | `css/blog.css` |
| W06 | Fix syntax.css dark scope selector bug | `css/syntax.css` |

## Scope Decisions

- Fluent 2 token system completion (spacing + typography scales) — YES
- Focus rings — YES (accessibility gap, zero current styling)
- Lucide icons — YES (script already present, just not wired)
- Article index cards — YES (CSS-only, targets existing Caddy HTML output)
- Syntax.css dark mode bug fix — YES
- New template features (read time, prev/next nav) — NO

## Findings Requiring Remediation

### F01: No focus-visible styles
Interactive elements (links, theme toggle button) have no `focus-visible` ring. Fluent 2 specifies: `outline: 2px solid var(--colorNeutralForeground1)` with `outline-offset: 2px`. This is a WCAG 2.1 AA failure (Success Criterion 2.4.7).

### F02: syntax.css dark mode selector malformed
The `@media (prefers-color-scheme: dark)` block for `.bg` background color has the opening `{` on a separate line after the selector, which causes CSS parse failure in some engines. The dark background for the pre-wrapper may not apply.

### F03: Hardcoded px values
Spacing values throughout `blog.css` use hardcoded `px` values (e.g., `padding: 24px 20px`, `margin-bottom: 24px`) rather than token references. W02 will add the scale and optionally migrate the uses.

### F04: Lucide.min.js present but unused
`scripts/lucide.min.js` exists in the repo. The theme toggle uses CSS `::before` content with a Unicode symbol (`◐`/`◑`). The back-nav has no icon. Loading Lucide via the template would replace the pseudo-content hack with semantic SVG icons.

## Warning

TypeScript is absent. No tsc verification step applies.
