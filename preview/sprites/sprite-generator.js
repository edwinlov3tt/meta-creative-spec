#!/usr/bin/env node

/**
 * Sprite Sheet Generator for Ad Previewer
 * 
 * This script generates a sprite sheet from individual SVG icons
 * and outputs the corresponding CSS with background-position coordinates.
 * 
 * Usage: node generate-sprites.js
 * 
 * Requirements: npm install sharp svg-sprite-generator
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image processing
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Source directory with individual SVG icons
  iconSourceDir: './src/icons',
  
  // Output directory for generated sprites
  outputDir: './assets/icons',
  
  // Sprite sheet settings
  iconSize: 16, // Base icon size in pixels
  iconsPerRow: 16, // Number of icons per row
  format: 'png', // Output format (png or svg)
  
  // Retina support
  generateRetina: true,
  retinaScale: 2,
  
  // CSS output
  cssOutputPath: './src/sprites-generated.css',
  classPrefix: 'ap-icon'
};

// Icon definitions with their corresponding SVG files
const ICONS = [
  { name: 'cog', file: 'settings.svg' },
  { name: 'mobile', file: 'mobile.svg' },
  { name: 'desktop', file: 'desktop.svg' },
  { name: 'download', file: 'download.svg' },
  { name: 'clipboard', file: 'clipboard.svg' },
  { name: 'ellipsis-v', file: 'ellipsis-vertical.svg' },
  { name: 'newspaper', file: 'newspaper.svg' },
  { name: 'book-open', file: 'book-open.svg' },
  { name: 'film', file: 'film.svg' },
  { name: 'image', file: 'image.svg' },
  { name: 'images', file: 'images.svg' },
  { name: 'filter', file: 'filter.svg' },
  { name: 'facebook-messenger', file: 'messenger.svg' },
  { name: 'pencil', file: 'edit.svg' },
  { name: 'facebook', file: 'facebook.svg' },
  { name: 'instagram', file: 'instagram.svg' },
  { name: 'like', file: 'thumbs-up.svg' },
  { name: 'comment', file: 'comment.svg' },
  { name: 'share', file: 'share.svg' },
  { name: 'heart', file: 'heart.svg' },
  { name: 'send', file: 'send.svg' },
  { name: 'bookmark', file: 'bookmark.svg' },
  { name: 'save', file: 'save.svg' },
  { name: 'sync', file: 'refresh.svg' }
];

/**
 * Generate sprite coordinates for each icon
 */
function generateCoordinates() {
  const coordinates = {};
  
  ICONS.forEach((icon, index) => {
    const row = Math.floor(index / CONFIG.iconsPerRow);
    const col = index % CONFIG.iconsPerRow;
    
    coordinates[icon.name] = {
      x: col * CONFIG.iconSize,
      y: row * CONFIG.iconSize,
      width: CONFIG.iconSize,
      height: CONFIG.iconSize
    };
  });
  
  return coordinates;
}

/**
 * Calculate sprite sheet dimensions
 */
function calculateDimensions() {
  const totalIcons = ICONS.length;
  const rows = Math.ceil(totalIcons / CONFIG.iconsPerRow);
  
  return {
    width: CONFIG.iconsPerRow * CONFIG.iconSize,
    height: rows * CONFIG.iconSize
  };
}

/**
 * Generate CSS for sprite positions
 */
function generateCSS(coordinates, dimensions) {
  const { width, height } = dimensions;
  const spritePath = `./icons/ad-previewer-sprites.${CONFIG.format}`;
  const retinaSpritePath = `./icons/ad-previewer-sprites@2x.${CONFIG.format}`;
  
  let css = `/* Generated sprite CSS - Do not edit manually */\n\n`;
  
  // Base sprite class
  css += `.${CONFIG.classPrefix} {\n`;
  css += `  background-image: url('${spritePath}');\n`;
  css += `  background-repeat: no-repeat;\n`;
  css += `  display: inline-block;\n`;
  css += `  width: ${CONFIG.iconSize}px;\n`;
  css += `  height: ${CONFIG.iconSize}px;\n`;
  css += `}\n\n`;
  
  // Size variants
  css += `.${CONFIG.classPrefix}-sm {\n`;
  css += `  width: 12px;\n`;
  css += `  height: 12px;\n`;
  css += `  background-size: ${width * 0.75}px ${height * 0.75}px;\n`;
  css += `}\n\n`;
  
  css += `.${CONFIG.classPrefix}-lg {\n`;
  css += `  width: 24px;\n`;
  css += `  height: 24px;\n`;
  css += `  background-size: ${width * 1.5}px ${height * 1.5}px;\n`;
  css += `}\n\n`;
  
  // Individual icon positions
  Object.entries(coordinates).forEach(([iconName, coords]) => {
    css += `.${CONFIG.classPrefix}-${iconName} {\n`;
    css += `  background-position: -${coords.x}px -${coords.y}px;\n`;
    css += `}\n\n`;
  });
  
  // Retina support
  if (CONFIG.generateRetina) {
    css += `/* Retina/High-DPI support */\n`;
    css += `@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {\n`;
    css += `  .${CONFIG.classPrefix} {\n`;
    css += `    background-image: url('${retinaSpritePath}');\n`;
    css += `    background-size: ${width}px ${height}px;\n`;
    css += `  }\n`;
    css += `}\n\n`;
  }
  
  return css;
}

/**
 * Create SVG sprite using svg-sprite approach
 */
async function generateSVGSprite(coordinates, dimensions) {
  const { width, height } = dimensions;
  
  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svgContent += `  <defs>\n`;
  
  // Add each icon as a symbol
  for (const icon of ICONS) {
    const iconPath = path.join(CONFIG.iconSourceDir, icon.file);
    
    if (fs.existsSync(iconPath)) {
      const iconSVG = fs.readFileSync(iconPath, 'utf8');
      
      // Extract the content inside <svg> tags (simplified approach)
      const contentMatch = iconSVG.match(/<svg[^>]*>(.*?)<\/svg>/s);
      if (contentMatch) {
        svgContent += `    <g id="${icon.name}">\n`;
        svgContent += `      ${contentMatch[1]}\n`;
        svgContent += `    </g>\n`;
      }
    } else {
      console.warn(`Warning: Icon file not found: ${iconPath}`);
    }
  }
  
  svgContent += `  </defs>\n`;
  
  // Place icons in sprite positions
  Object.entries(coordinates).forEach(([iconName, coords]) => {
    svgContent += `  <use href="#${iconName}" x="${coords.x}" y="${coords.y}" width="${coords.width}" height="${coords.height}"/>\n`;
  });
  
  svgContent += `</svg>`;
  
  return svgContent;
}

/**
 * Convert SVG to PNG using Sharp
 */
async function convertToPNG(svgContent, outputPath, scale = 1) {
  const dimensions = calculateDimensions();
  
  try {
    await sharp(Buffer.from(svgContent))
      .resize(dimensions.width * scale, dimensions.height * scale)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated PNG sprite: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate PNG sprite: ${error.message}`);
  }
}

/**
 * Generate JavaScript mapping file
 */
function generateJSMapping(coordinates) {
  const jsContent = `// Generated sprite mapping - Do not edit manually

export const SPRITE_COORDINATES = ${JSON.stringify(coordinates, null, 2)};

export const ICON_MAPPING = {
  // Font Awesome to sprite class mapping
  'fa-cog': '${CONFIG.classPrefix}-cog',
  'fa-mobile-alt': '${CONFIG.classPrefix}-mobile',
  'fa-mobile': '${CONFIG.classPrefix}-mobile',
  'fa-desktop': '${CONFIG.classPrefix}-desktop',
  'fa-download': '${CONFIG.classPrefix}-download',
  'fa-clipboard': '${CONFIG.classPrefix}-clipboard',
  'fa-ellipsis-v': '${CONFIG.classPrefix}-ellipsis-v',
  'fa-newspaper': '${CONFIG.classPrefix}-newspaper',
  'fa-book-open': '${CONFIG.classPrefix}-book-open',
  'fa-film': '${CONFIG.classPrefix}-film',
  'fa-image': '${CONFIG.classPrefix}-image',
  'fa-images': '${CONFIG.classPrefix}-images',
  'fa-filter': '${CONFIG.classPrefix}-filter',
  'fa-facebook-messenger': '${CONFIG.classPrefix}-facebook-messenger',
  'fa-pencil-alt': '${CONFIG.classPrefix}-pencil',
  'fa-thumbs-up': '${CONFIG.classPrefix}-like',
  'fa-comment': '${CONFIG.classPrefix}-comment',
  'fa-share': '${CONFIG.classPrefix}-share',
  'fa-heart': '${CONFIG.classPrefix}-heart',
  'fa-save': '${CONFIG.classPrefix}-save',
  'fa-sync': '${CONFIG.classPrefix}-sync'
};

export const createSpriteIcon = (iconName, size = '') => {
  const icon = document.createElement('i');
  icon.className = \`\${CONFIG.classPrefix} \${CONFIG.classPrefix}-\${iconName}\`;
  
  if (size) {
    icon.classList.add(\`\${CONFIG.classPrefix}-\${size}\`);
  }
  
  return icon;
};
`;

  return jsContent;
}

/**
 * Main generation function
 */
async function generateSprites() {
  console.log('🚀 Starting sprite generation...');
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Generate coordinates and dimensions
  const coordinates = generateCoordinates();
  const dimensions = calculateDimensions();
  
  console.log(`📐 Sprite dimensions: ${dimensions.width}x${dimensions.height}`);
  console.log(`🎯 Icons to process: ${ICONS.length}`);
  
  // Generate CSS
  const css = generateCSS(coordinates, dimensions);
  fs.writeFileSync(CONFIG.cssOutputPath, css);
  console.log(`✅ Generated CSS: ${CONFIG.cssOutputPath}`);
  
  // Generate JavaScript mapping
  const jsMapping = generateJSMapping(coordinates);
  fs.writeFileSync('./src/sprite-mapping.js', jsMapping);
  console.log(`✅ Generated JS mapping: ./src/sprite-mapping.js`);
  
  if (CONFIG.format === 'svg') {
    // Generate SVG sprite
    const svgSprite = await generateSVGSprite(coordinates, dimensions);
    const svgPath = path.join(CONFIG.outputDir, 'ad-previewer-sprites.svg');
    fs.writeFileSync(svgPath, svgSprite);
    console.log(`✅ Generated SVG sprite: ${svgPath}`);
  } else {
    // Generate PNG sprite
    const svgSprite = await generateSVGSprite(coordinates, dimensions);
    const pngPath = path.join(CONFIG.outputDir, 'ad-previewer-sprites.png');
    await convertToPNG(svgSprite, pngPath);
    
    // Generate retina version
    if (CONFIG.generateRetina) {
      const retinaPngPath = path.join(CONFIG.outputDir, 'ad-previewer-sprites@2x.png');
      await convertToPNG(svgSprite, retinaPngPath, CONFIG.retinaScale);
    }
  }
  
  // Generate documentation
  const docContent = generateDocumentation(coordinates, dimensions);
  fs.writeFileSync('./sprite-documentation.md', docContent);
  console.log(`✅ Generated documentation: ./sprite-documentation.md`);
  
  console.log('🎉 Sprite generation complete!');
  console.log('\nNext steps:');
  console.log('1. Add the generated CSS to your stylesheet');
  console.log('2. Replace Font Awesome icons with sprite classes');
  console.log('3. Test the implementation in your browser');
}

/**
 * Generate documentation
 */
function generateDocumentation(coordinates, dimensions) {
  let doc = `# Ad Previewer Sprite Sheet Documentation

## Overview
This sprite sheet contains ${ICONS.length} icons for the Ad Previewer application.

**Dimensions:** ${dimensions.width}x${dimensions.height}px
**Icon Size:** ${CONFIG.iconSize}x${CONFIG.iconSize}px
**Format:** ${CONFIG.format.toUpperCase()}

## Usage

### Basic Usage
\`\`\`html
<i class="${CONFIG.classPrefix} ${CONFIG.classPrefix}-cog"></i>
\`\`\`

### Size Variants
\`\`\`html
<i class="${CONFIG.classPrefix} ${CONFIG.classPrefix}-cog ${CONFIG.classPrefix}-sm"></i>  <!-- 12x12 -->
<i class="${CONFIG.classPrefix} ${CONFIG.classPrefix}-cog"></i>                          <!-- 16x16 -->
<i class="${CONFIG.classPrefix} ${CONFIG.classPrefix}-cog ${CONFIG.classPrefix}-lg"></i>  <!-- 24x24 -->
\`\`\`

## Icon Reference

| Icon Name | CSS Class | Position | File |
|-----------|-----------|----------|------|
`;

  ICONS.forEach((icon, index) => {
    const coords = coordinates[icon.name];
    doc += `| ${icon.name} | \`.${CONFIG.classPrefix}-${icon.name}\` | ${coords.x}px, ${coords.y}px | ${icon.file} |\n`;
  });

  doc += `\n## Migration from Font Awesome

| Font Awesome | Sprite Class |
|--------------|--------------|
| \`.fa-cog\` | \`.${CONFIG.classPrefix}-cog\` |
| \`.fa-mobile-alt\` | \`.${CONFIG.classPrefix}-mobile\` |
| \`.fa-desktop\` | \`.${CONFIG.classPrefix}-desktop\` |
| \`.fa-download\` | \`.${CONFIG.classPrefix}-download\` |

## Performance Benefits

- **HTTP Requests:** 1 instead of ${ICONS.length}+
- **Bundle Size:** ~${Math.round(dimensions.width * dimensions.height / 1024)}KB instead of ~500KB (Font Awesome)
- **Caching:** Single file cached efficiently
- **Control:** Full control over icon appearance

## Regeneration

To regenerate this sprite sheet:
\`\`\`bash
node generate-sprites.js
\`\`\`
`;

  return doc;
}

// Run the generator
if (require.main === module) {
  generateSprites().catch(console.error);
}

module.exports = {
  generateSprites,
  generateCoordinates,
  generateCSS,
  ICONS,
  CONFIG
};