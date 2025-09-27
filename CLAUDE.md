# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Creative Preview Prototype - a single-file HTML/CSS/JS application for visualizing Facebook/Instagram ads. It's a vanilla JavaScript implementation with no build tooling or package management system.

## Commands

Since this is a vanilla HTML/CSS/JS project with no build system:
- **Run locally**: Open `index.html` directly in a browser, or use a simple HTTP server: `python -m http.server` or `npx http-server`
- **Test Facebook integration**: Use `test_facebook.html` for API testing
- **No build/lint/test commands** - this is a zero-dependency prototype

## Architecture

### Core Files
- `index.html` - Main structure with two-column layout (left: form inputs, right: sticky preview)
- `styles.css` - shadcn-inspired design tokens (CSS variables for colors, radii, shadows)
- `app.js` - All behaviors, including:
  - Preview state management via DOM queries
  - UTM URL builder with slugification
  - Local storage persistence
  - Export functionality (PNG/JPG via html-to-image library)
  - Sticky overflow detection with IntersectionObserver

### Key Patterns
- **DOM Selection**: Uses `const $ = (sel)=> document.querySelector(sel)` helper
- **State Management**: All state stored in DOM elements, synced via `syncPreview()` function
- **Data Model**: `collectSpec()` function returns JSON structure matching PRD specification
- **Preview Variants**: CSS classes control platform/device/type combinations (`platform-facebook`, `adtype-feed`, etc.)

### Preview Logic
- Platform toggle switches between Facebook (shows globe icon, hides @brand) and Instagram (shows @brand, no globe)
- Stories/Reels render as 9:16 fullscreen with overlay controls
- Feed layouts vary by platform with different footer styles
- "Single Image" ad format option only visible when Platform=Facebook AND Ad Type=Feed

## Important Implementation Details

### Text Truncation
- Primary Text: 125 chars (can be disabled via "Remove post-text limit" checkbox)
- Headline: 40 chars
- Description: 30 chars
- When limit removed, shows "See more" after 140 chars

### UTM Builder Defaults
- utm_campaign = Ignite
- utm_medium = Facebook  
- utm_source = Townsquare
- utm_content = slugified Ad Name

### Export System
The `#preview-root` element is the export node used by html-to-image library. Export functions handle fallback to dom-to-image if primary library fails.

## API Integration

The project includes PHP backend endpoints in `/api/`:
- `generate-copy.php` - AI-powered ad copy generation with rate limiting
- `facebook-page.php` - Facebook API integration for page data
- Configuration in `/config/config.php`
- Request logging in `/logs/` directory

### AI Copy Generation
- Triggered by "Generate Ad Copy" button in Step 1
- Requires Website/CTURL and Company Overview fields
- Uses external AI service via PHP endpoint
- Rate limited to 20 requests per hour per session

## Migration Notes

For porting to React/Next.js:
- Replace DOM queries with React refs/state
- Move `collectSpec()` data structure to TypeScript interfaces
- Guard window access in SSR with `useEffect`
- Use html-to-image in an effect for preview exports
- Adapt PHP endpoints to Next.js API routes or external services