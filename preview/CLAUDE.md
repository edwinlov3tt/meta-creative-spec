# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Meta Ad Previewer application that recreates Meta's (Facebook/Instagram) ad preview functionality. The application provides pixel-perfect previews of advertisements across different Meta platforms and placements.

## Technology Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- PHP backend support (for SiteGround hosting)
- Custom fonts: Bricolage Grotesque and Roboto (loaded from cdn.dvmgc.com)

## Key Components

### File Structure
- `meta-ad-previewer.html` - Main application file with all preview templates
- `context/` - Contains reference screenshots and text specifications

### Major Features
1. **Multi-placement previews** - Facebook/Instagram feeds, stories, reels
2. **View Preview Modal** - Expandable preview with placement switcher
3. **Responsive grid layout** - Adapts to different screen sizes
4. **Zoom controls** - Scale previews up/down

### Ad Layout Templates

The application includes precise ad layouts for:
- Facebook Mobile/Desktop Feed
- Instagram Mobile/Desktop Feed  
- Instagram/Facebook Reels
- Instagram/Facebook Stories

Each layout follows Meta's exact specifications for spacing, typography, and interactive elements.

## Design System

### Colors (CSS Variables)
- `--meta-bg: #f0f2f5` - Meta background
- `--meta-blue: #1877F2` - Facebook blue
- `--meta-secondary: #65676b` - Secondary text
- `--meta-border: #dddfe2` - Border color

### Typography
- Primary font: Roboto
- Display font: Bricolage Grotesque
- Font weights: 400 (regular), 700 (bold)

## Development Guidelines

When modifying ad templates:
1. Maintain pixel-perfect accuracy to Meta's actual layouts
2. Test responsive behavior across breakpoints
3. Ensure modal and grid views stay synchronized
4. Keep CSS variables consistent across components

When adding new placements:
1. Add option to both dropdown selectors (main and modal)
2. Create corresponding `getPreviewHTML()` case
3. Include both grid thumbnail and full-size versions
4. Follow existing naming conventions (e.g., `platform-device-placement`)

## Common Tasks

### Add a new ad placement
1. Update dropdown options in both `placementSelect` and `modalPlacementSelect`
2. Add preview card HTML in the appropriate section (Feeds or Stories/Reels)
3. Implement layout in `getPreviewHTML()` function with proper case handling

### Modify ad content
Edit the placeholder text and elements within the template HTML structures in `getPreviewHTML()` function.

### Adjust preview sizing
Modify the `scale` parameter in `getPreviewHTML()` or adjust the base dimensions in CSS classes.