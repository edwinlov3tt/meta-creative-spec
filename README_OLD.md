# Creative Preview Prototype v3

A single-file HTML/CSS/JS prototype implementing your PRD updates:
- Left column: **Step 1: Advertiser Info**, **Step 2: Ad Copy**.
- Right column: **sticky preview** with collapsible toolbar and overflow detection (top/bottom shadows).
- Mobile/Desktop centering; Stories/Reels and Feed layouts for Facebook & Instagram.
- “Generate Ad Copy” in Step 1 enables Step 2 and collapses Step 1.
- **Campaign Objective** is full-width textarea; “Generate Ad Copy” button sits below it.
- “Ad Copy Options”: remove post-text limit (adds “See more” after 140 chars) and UTM builder with campaign defaults.
- Destination URL is **slugified & encoded**, UTM params added and shown as a clickable link. CTA uses the same URL.
- Preview defaults: Platform **Facebook**, Device **Desktop**, Ad Type **Feed**, Format **Original**.

## Platform logic
- Facebook: shows globe privacy icon and **hides @brand**. Facebook Feed uses a link-card style footer (domain, headline, description) plus **Like / Comment / Share** row.
- Instagram: shows **@brand**; hides globe icon. Instagram Feed places CTA and actions under media with views/comments text.
- Stories/Reels (both platforms): fullscreen 9:16 media, pill CTA centered near bottom with supporting primary text; action buttons stacked on the right (Instagram-like).

## Layout
- Two-column CSS Grid: `1.15fr / .85fr` for balance.
- Right preview uses `position: sticky` and an invisible scrollbar (`::-webkit-scrollbar { display:none }`, `scrollbar-width:none`), centered both axes.
- Overflow is detected via IntersectionObserver with sticky gradient shadows.

## Typography
- Base family: **Inter**. Labels and muted text normalized to **12px** for consistency (fixes “Display Link” & “Note” typography).

## Collapsible toolbars & sections
- Toolbar: `<details>`/`<summary>` for Preview Controls.
- Step 1/2 sections use the same pattern; clicking “Generate Ad Copy” collapses Step 1.

## Defaults & rules requested
- **Ad Type** and **Ad Format** labels use the requested names.
- Show “Single Image” **Ad Format** choice only when: Platform=Facebook **and** Ad Type=Feed.
- Mobile centering and vertical middle alignment for all creatives (Feed/Story/Reel).

## UTM builder
Defaults:
- utm_campaign = Ignite
- utm_medium = Facebook
- utm_source = Townsquare
- utm_content = slugified *Ad Name* (or your custom value)

Output is shown and clickable below Destination URL, and is applied to the CTA in the preview.

## Files
- `index.html` — structure and controls
- `styles.css` — shadcn-inspired tokens (neutrals, radius, shadows), Facebook neutrals for preview
- `app.js` — behaviors, URL building, variant switching, sticky overflow detection

## Porting notes
- **React/Next.js**: Move HTML into a component; replace `document.querySelector` calls with refs/state. `preview-root` is the export node; use `html-to-image` in an effect.
- **TypeScript**: Type `fields`, `toggles`, and helper return values. Keep `collectSpec()` as your schema.
- **Node/SSR**: This is a client-only UI; SSR should skip `window` access (guard within `useEffect`).

## Meta placement references
- Facebook Feed ratios 1:1 and 4:5; common range 1.91:1 to 4:5 (Meta Ads Guide). 
- Instagram Stories and Reels are **9:16** full-screen (Meta guidelines).
- Instagram Feed accepts multiple ratios; taller media may be cropped to 1:1 (Help Center).

Re-generate this in other stacks by following the structure, CSS tokens, and `collectSpec()` JSON interface.
