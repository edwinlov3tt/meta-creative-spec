# Creative Preview — Product Requirements (Prototype)

## 1. Purpose
Provide marketers with an **instant visualizer** for Facebook/Instagram ads: enter/edit copy, see a faithful preview, and export both the spec sheet and a screenshot for reviews.

## 2. Scope (MVP)
- **Input & Edit**: Ad Name, Primary Text, Headline, Description, Destination URL, Display Link, CTA.
- **Context (optional)**: Facebook page link, website, objective, company overview, formula (AIDA/HSO), extra instructions, company info, custom prompt, creative upload.
- **Preview Controls**: Platform (Facebook/Instagram), Device (Mobile/Desktop), Type (Feed/Story/Reel), Format (Original or 1:1).
- **Exports**: Copy to clipboard, Download spec (JSON), Export preview (PNG/JPG).

## 3. Constraints & Rules
- **Text caps (feed-like placements):**
  - Primary Text: 125 chars
  - Headline: 40 chars
  - Description: 30 chars
- **Truncation**: These are planning limits; some placements show more or fewer characters. We cap inputs to keep previews predictable.
- **No persistence layer**: All data is local (`localStorage`).

## 4. Architecture
- **Vanilla** HTML/CSS/JS for maximum portability.
- **Design tokens** (CSS variables): colors, radii, shadows, focus ring. Cards + chips + inputs echo the shadcn/ui feel, but no build tooling required.
- **Single export node** (`#preview-root`) used by `html-to-image` (with `dom-to-image-more` fallback).

## 5. UX
- Left panel form with **live counters** and friendly placeholders.
- Right panel sticky preview with toolbar chips for toggles.
- File upload swaps the preview image.
- Keyboard accessible, focus-visible, skip link.

## 6. Data Model (spec excerpt)
```json
{
  "refName": "Membership Promo June",
  "postText": "…",
  "headline": "…",
  "description": "…",
  "destinationUrl": "https://…",
  "displayLink": "example.com",
  "cta": "Learn More",
  "platform": "facebook",
  "device": "mobile",
  "adType": "feed",
  "format": "original",
  "meta": {
    "company": "…",
    "companyInfo": "…",
    "objective": "…",
    "customPrompt": "…",
    "formula": "AIDA",
    "facebookLink": "https://facebook.com/…",
    "url": "https://…",
    "notes": "…"
  }
}
```

## 7. Non‑Goals
- No login, team sharing, or multi-creative grids.
- No server-rendered exports (future: Puppeteer or image render service).

## 8. Future
- **AI Generate** via API (Claude/OpenAI) using the context inputs.
- **Multi-variant** previews and per-placement limits.
- **UTM builder**, **CSV/JSON import**, and **brand kits** (tokens).

