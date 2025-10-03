# Phase 0 Discovery Notes

## Legacy Feature Inventory (Vanilla `index-vanilla.html` + `app.js`)
- **Step gating & autosave**: Step 2 stays disabled until ad copy generation succeeds; field states persist via `localStorage` (`creativePreviewFields.v4`) and restore on load.
- **Facebook page verification**: `verifyFacebookPage()` hits `https://meta.edwinlovett.com/?page=…`, locks the URL input, hydrates auxiliary read-only fields (page ID, category, Instagram link), updates preview branding/avatar, and persists the raw JSON for reuse.
- **Advertiser field enable/disable**: URL, company overview, and objective inputs remain disabled until page verification passes; reset flow fully clears derived data (`resetFacebookVerification`).
- **AI copy generation**: `generateAdCopy()` POSTs to `/api/generate-copy` (Vercel serverless) with campaign context, creative base64 payload, and optional knobs (formula, custom prompt, emoji toggle); handles disabled UI state, counters, and toast messaging.
- **Character limits & counters**: Live counts for post text, headline, descriptions, brief fields, with optional "Remove limit" toggle that switches truncation logic (`truncateWithSeeMore`).
- **Preview state machine**: Platform/device/ad type/format selectors update DOM classes, auto-force mobile for Story/Reel, calculate aspect ratios, set CTA destinations with UTM builder, and center the preview with overflow shadows.
- **Media handling**: Upload control reads image as base64 via `FileReader`, swaps preview asset, and stores metadata for AI submission.
- **Exports & sharing**: Buttons trigger `html-to-image`/`dom-to-image` (`window.htmlToImage`) to download PNG/JPG, copy JSON spec to clipboard, download JSON blob, and open a detailed preview modal.
- **Toast & error UX**: Custom toast component, contextual error messaging (`handleAPIError`), button loading states, and spinner overlays for step 2.

## Current React Scaffold Shortfalls (`src/`)
- Lacks state management; form fields and preview use hard-coded mock data (`AdPreview.tsx`), no two-step workflow or autosave.
- Facebook verification, AI generation, UTM builder, exports, and toast interactions are absent.
- Presentational components (`FormBuilder`, `AdPreview`) enforce different layout (single column grid with sticky preview) and styling; no collapsible steps or dynamic chips.
- Header differs from lead-spec (custom button set, no shared design token usage, no autosave indicator).

## Design Token Alignment
- Lead spec tokens live in `lead-spec/src/styles/{variables.css,globals.css}` with `meta-*` utility classes; creative spec has a divergent `src/styles/variables.css` and `index.css` missing key aliases (`bg-canvas`, `border-border`, `shadow-1`).
- Goal: adopt lead-spec palette (surface scale, primary, danger, spacing tokens, `meta-chip` styles) and reuse shared Tailwind plugins so Ad Preview + form cards render identically.
- Need to deprecate legacy `styles.css` artifacts (chips, counters) once React components adopt Meta token utilities.

## Tooling & Library Parity
- **Already installed**: `react`, `react-dom`, `zustand`, `lucide-react`, `tailwind-merge`, `@headlessui/react`.
- **Missing vs lead-spec**: `react-beautiful-dnd` (or `react-dnd` if we mirror lead form reorder UX), `react-dnd-html5-backend`, `html-to-image` (and/or `dom-to-image` fallback), lightweight toast helper, and shared API client patterns (`services/api.ts`).
- **Next actions**: decide whether to lift `ResizablePanels`, `AutoSave`, and toast utilities into a shared package or duplicate under `creative-spec/src/components/UI` for now.

## Open Questions / Follow-ups
- Confirm backend endpoint parity: replace PHP `generate-copy.php` with existing Node/Express route or align with lead-spec `api.generateCompleteForm` signature.
- Determine hosting approach for shared design tokens (copy file vs. central package) to avoid drift.
- Validate whether we need drag-and-drop ordering in creative spec (if yes, choose DnD library up front).
