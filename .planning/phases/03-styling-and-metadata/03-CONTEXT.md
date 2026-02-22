# Phase 3: Styling and Metadata - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply visual styling to article pages, add a "back to index" navigation link, make pages mobile-friendly, and embed Open Graph metadata in the HTML head. No new routes, no new content, no new pipeline components — this phase polishes what Phase 2 built.

</domain>

<decisions>
## Implementation Decisions

### Typography & Layout
- Reading column width: medium (~80ch max-width), centered
- Font: Nunito (SARA spec) — loaded from Google Fonts or bundled; NOT monospace for body (user deferred to SARA spec)
- Monospace only in code blocks (already handled by syntax.css from Phase 2)
- Font size: 18px base, generous line height (~1.7–1.8)
- Color scheme: system preference via `prefers-color-scheme` CSS media query, with a JS-powered toggle that saves preference to `localStorage`

### Navigation link
- Placement: Inline above the article title (not a full header bar)
- Text: `← Back`
- Target URL: `/` (root index)
- Article pages only — not added to 404 page in this phase

### CSS Design Language
- Follow SARA design language from `web_design_look_and_feel.md`
- Warm earth tone palette: background `#faf8f5` (light) / appropriate dark variant; text `#5a534a`
- No pure white (#ffffff) for large backgrounds, no pure black (#000000) anywhere
- Shadows use warm brown base: `rgba(90, 83, 74, …)`
- Border radius ≥ 8px everywhere; Claude decides exact values per SARA spec
- Spacing multiples of 5px (SARA base unit)
- Soft animations (hover states use `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, 0.3s–0.4s duration)
- `prefers-reduced-motion` respected
- Polished but reading-focused — generous whitespace, no cluttered UI elements

### Dark/Light Mode Toggle
- CSS: `prefers-color-scheme` media query defines dark/light variables
- JS toggle: small button (Claude decides placement/icon) writes `data-theme` attribute on `<html>`
- Preference persisted in `localStorage` key (Claude decides key name)
- On page load, JS reads `localStorage` first, falls back to system preference

### Open Graph Tags
- Minimum necessary: `og:title` only (satisfies success criteria)
- `og:title` sourced from article front matter `title` field — articles are required to have a title; no fallback
- Claude may add `og:type: article` if trivially small — but keep it minimal

</decisions>

<specifics>
## Specific Ideas

- SARA design language document at `web_design_look_and_feel.md` is the authoritative style reference — researcher and planner should read it
- Warm, intimate reading experience: think cozy personal blog, not clinical docs site
- The theme toggle should feel like a natural SARA-style micro-interaction (gentle, soft)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-styling-and-metadata*
*Context gathered: 2026-02-22*
