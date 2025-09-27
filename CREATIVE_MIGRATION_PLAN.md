# Creative Spec React Transition Plan

## Phase 0: Discovery & Environment
- [ ] Compare `creative-spec/app.js`, `index-vanilla.html`, and `styles.css` against current React scaffold to capture *all* legacy behaviors (Facebook page verification, AI copy generation, UTM builder, exports, local storage, counter logic, DOM toasts).
- [ ] Confirm shared design token source: mirror `lead-spec/src/styles/{variables.css,globals.css}` into `creative-spec/src/styles` and align both Tailwind configs (spacing aliases, `meta-*` utilities).
- [ ] Install parity tooling used in @lead-spec (`zustand`, `react-dnd`, `lucide-react`, toast helper, html-to-image or replacements) so components share implementations.

## Phase 1: Layout & Shell Alignment
- [ ] Replace current header with `lead-spec/src/components/Layout/Header.tsx` (reuse component directly or extract to shared module). Update navigation/actions to match creative-spec needs (regenerate, export, etc.).
- [ ] Rebuild root layout to match lead-spec scaffold: wrap App in meta background (`bg-canvas`), apply same padding rhythm, and import `globals.css`.
- [ ] Introduce a `ResizablePanels` clone (reuse from lead-spec) so form builder (left) and ad preview (right) live in a draggable split view. Preserve two-step accordion layout within the left pane.
- [ ] Remove Facebook preview outer container background; restyle chips/toggles with `.meta-chip` variants from design tokens.

## Phase 2: State Management & Data Flow
- [ ] Design a unified `useCreativeStore` (zustand + persist + devtools) modeled after `useFormStore`; hold advertiser brief, creative copy, preview settings, API/loading flags, and autosave metadata.
- [ ] Port all vanilla listeners into typed actions/selectors (e.g., `updateField`, `setPreviewDevice`, `toggleLimit`, `generateCopy`, `verifyFacebookPage`). Ensure store drives both steps and preview components.
- [ ] Implement selectors for derived values (character counts, truncated copy with "See more", UTM builder, AL creative upload base64 data) to keep components declarative.

## Phase 3: Component Migration
- [ ] Recreate Step 1 (Advertiser info) and Step 2 (Ad copy) as meta-themed cards using shared form components (`meta-input`, `meta-textarea`, toggles). Include counter badges and field disable/enable flows tied to Facebook verification state.
- [ ] Move preview controls to tokenized buttons/chips; enforce Story/Reel auto-mobile logic and device gating within store selectors.
- [ ] Refactor `FacebookPreview` to keep the current in-feed/stories markup but swap structural classes for meta tokens; remove grey page background and apply sticky preview container from lead-spec.
- [ ] Match chip typography/spacing to `meta-chip` guidelines; align CTA button sizes with `meta-button` styles.

## Phase 4: Feature Parity & Integrations
- [ ] Copy AI generation pipeline: reuse API client patterns from `lead-spec/src/services/api.ts` (handle `generateAdCopy`, creative upload encoding, status messaging). Port toast UX using a shared toast helper instead of direct DOM manipulation.
- [ ] Implement Facebook page verification via `FacebookPageService` (shared service or new module). Respect legacy behavior: optimistic placeholder, disabling advertiser fields until verified, storing `facebookPageData` JSON for autosave, reset flow.
- [ ] Restore local storage autosave (fields + timestamp) using store persistence and an `AutoSave` widget similar to lead-spec.
- [ ] Reintroduce export actions (JSON download, clipboard copy) and preview export (png/jpg) using `html-to-image`, ensuring buttons live in header menu.
- [ ] Ensure UTM builder, CTA updates, and `See more` truncation work in React with memoized helpers.

## Phase 5: Polish & QA
- [ ] Normalize typography, spacing, and icon sizing across cards; double-check responsive breakpoints and sticky preview scroll behavior against lead-spec.
- [ ] Cross-verify API calls with actual backend (dev/staging); handle failure states with token-compliant error chips/alerts.
- [ ] Manual regression: generate copy, switch platforms/devices, verify Facebook page, upload creatives, export preview, reset form; confirm persisted state reloads without errors.
- [ ] Final accessibility pass (focus order, ARIA labels for toggle chips, keyboard drag fallback if required) and update documentation (README + AGENTS entry) describing new architecture.

## Deliverables Checklist
- [ ] All React components styled with shared meta tokens and ResizablePanels layout.
- [ ] A fully functional creative builder mirroring vanilla feature set.
- [ ] Updated documentation + migration notes committed before release-night sign-off.
