/* Add to app.js or create sprites.js - Sprite Management System */

// Icon mapping from Font Awesome to our sprite classes
const ICON_MAPPING = {
  'fa-cog': 'ap-icon-cog',
  'fa-mobile-alt': 'ap-icon-mobile',
  'fa-mobile': 'ap-icon-mobile',
  'fa-desktop': 'ap-icon-desktop',
  'fa-download': 'ap-icon-download',
  'fa-clipboard': 'ap-icon-clipboard',
  'fa-ellipsis-v': 'ap-icon-ellipsis-v',
  'fa-newspaper': 'ap-icon-newspaper',
  'fa-book-open': 'ap-icon-book-open',
  'fa-film': 'ap-icon-film',
  'fa-image': 'ap-icon-image',
  'fa-images': 'ap-icon-images',
  'fa-filter': 'ap-icon-filter',
  'fa-facebook-messenger': 'ap-icon-facebook-messenger',
  'fa-pencil-alt': 'ap-icon-pencil',
  'fa-thumbs-up': 'ap-icon-like',
  'fa-comment': 'ap-icon-comment',
  'fa-share': 'ap-icon-share',
  'fa-heart': 'ap-icon-heart'
};

// Sprite coordinates for generating CSS (x, y, width, height)
const SPRITE_COORDINATES = {
  'ap-icon-cog': [0, 0, 16, 16],
  'ap-icon-mobile': [16, 0, 16, 16],
  'ap-icon-desktop': [32, 0, 16, 16],
  'ap-icon-download': [48, 0, 16, 16],
  'ap-icon-clipboard': [64, 0, 16, 16],
  'ap-icon-ellipsis-v': [80, 0, 16, 16],
  'ap-icon-newspaper': [96, 0, 16, 16],
  'ap-icon-book-open': [112, 0, 16, 16],
  'ap-icon-film': [128, 0, 16, 16],
  'ap-icon-image': [144, 0, 16, 16],
  'ap-icon-images': [160, 0, 16, 16],
  'ap-icon-filter': [176, 0, 16, 16],
  'ap-icon-facebook-messenger': [192, 0, 16, 16],
  'ap-icon-pencil': [0, 16, 16, 16],
  'ap-icon-facebook': [16, 16, 16, 16],
  'ap-icon-instagram': [32, 16, 16, 16],
  'ap-icon-like': [48, 16, 16, 16],
  'ap-icon-comment': [64, 16, 16, 16],
  'ap-icon-share': [80, 16, 16, 16],
  'ap-icon-heart': [96, 16, 16, 16],
  'ap-icon-send': [112, 16, 16, 16],
  'ap-icon-bookmark': [128, 16, 16, 16]
};

/**
 * Convert Font Awesome icons to CSS sprites
 * This function should be called during initialization
 */
function convertFontAwesomeToSprites() {
  // Find all Font Awesome icons
  const faIcons = document.querySelectorAll('[class*="fa-"]');
  
  faIcons.forEach(element => {
    const classList = Array.from(element.classList);
    const faClass = classList.find(cls => cls.startsWith('fa-'));
    
    if (faClass && ICON_MAPPING[faClass]) {
      // Remove Font Awesome classes
      element.classList.remove('fas', 'far', 'fab', faClass);
      
      // Add sprite classes
      element.classList.add('ap-icon', ICON_MAPPING[faClass]);
      
      // Preserve size classes if they exist
      if (classList.includes('fa-lg') || element.closest('.btn-actions')) {
        element.classList.add('ap-icon-lg');
      }
      if (classList.includes('fa-sm')) {
        element.classList.add('ap-icon-sm');
      }
    }
  });
}

/**
 * Generate CSS for sprite positions
 * Useful for development and building the sprite sheet
 */
function generateSpriteCSS() {
  let css = '';
  
  Object.entries(SPRITE_COORDINATES).forEach(([iconClass, [x, y, w, h]]) => {
    css += `.${iconClass} {\n`;
    css += `  background-position: -${x}px -${y}px;\n`;
    if (w !== 16 || h !== 16) {
      css += `  width: ${w}px;\n`;
      css += `  height: ${h}px;\n`;
    }
    css += `}\n\n`;
  });
  
  return css;
}

/**
 * Create a sprite icon element programmatically
 */
function createSpriteIcon(iconName, size = '') {
  const icon = document.createElement('i');
  icon.className = `ap-icon ap-icon-${iconName}`;
  
  if (size) {
    icon.classList.add(`ap-icon-${size}`);
  }
  
  return icon;
}

/**
 * Replace an existing icon with a sprite icon
 */
function replaceFAIcon(element, newIconName) {
  const faClasses = Array.from(element.classList).filter(cls => 
    cls.startsWith('fa-') || cls === 'fas' || cls === 'far' || cls === 'fab'
  );
  
  faClasses.forEach(cls => element.classList.remove(cls));
  element.classList.add('ap-icon', `ap-icon-${newIconName}`);
}

/**
 * Update preview social media icons based on platform
 */
function updatePreviewIcons(platform) {
  const likeButtons = document.querySelectorAll('.fb-action, .ig-action');
  
  likeButtons.forEach(button => {
    const icon = button.querySelector('.ap-icon');
    if (!icon) return;
    
    // Remove existing social icon classes
    icon.classList.remove('ap-icon-like', 'ap-icon-heart', 'ap-icon-comment', 'ap-icon-share', 'ap-icon-send');
    
    // Add platform-specific icons
    if (button.classList.contains('fb-action') || button.classList.contains('btn-action-love')) {
      if (platform === 'facebook') {
        icon.classList.add('ap-icon-like'); // Facebook thumbs up
      } else {
        icon.classList.add('ap-icon-heart'); // Instagram heart
      }
    } else if (button.classList.contains('btn-action-comment')) {
      icon.classList.add('ap-icon-comment');
    } else if (button.classList.contains('btn-action-share') || button.classList.contains('btn-action-send')) {
      if (platform === 'instagram') {
        icon.classList.add('ap-icon-send');
      } else {
        icon.classList.add('ap-icon-share');
      }
    }
  });
}

/**
 * Preload sprite sheet for better performance
 */
function preloadSpriteSheet() {
  const img = new Image();
  img.src = './assets/icons/ad-previewer-sprites.png';
  
  // Also preload retina version if available
  if (window.devicePixelRatio >= 2) {
    const retinaImg = new Image();
    retinaImg.src = './assets/icons/ad-previewer-sprites@2x.png';
  }
}

/**
 * Generate sprite sheet from SVG icons (development tool)
 * This would be used during build process
 */
function generateSpriteSheet(icons, outputPath) {
  // This would typically be done with a build tool like gulp, webpack, or a Node.js script
  // Here's the conceptual approach:
  
  const spriteWidth = Math.ceil(Math.sqrt(icons.length)) * 16;
  const spriteHeight = Math.ceil(icons.length / (spriteWidth / 16)) * 16;
  
  console.log(`Generating sprite sheet: ${spriteWidth}x${spriteHeight}`);
  console.log('Icons to include:', icons);
  
  // In a real implementation, you'd use a tool like spritesmith or svg-sprite
  return {
    width: spriteWidth,
    height: spriteHeight,
    coordinates: SPRITE_COORDINATES
  };
}

/**
 * Initialize sprite system
 * Call this after DOM is loaded
 */
function initializeSpriteSystem() {
  // Preload sprite sheet
  preloadSpriteSheet();
  
  // Convert existing FA icons
  convertFontAwesomeToSprites();
  
  // Update preview icons when platform changes
  const platformToggle = document.querySelector('#platform');
  if (platformToggle) {
    platformToggle.addEventListener('change', (e) => {
      updatePreviewIcons(e.target.value);
    });
  }
  
  console.log('Sprite system initialized');
  
  // Development helper: log generated CSS
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated sprite CSS:');
    console.log(generateSpriteCSS());
  }
}

/**
 * Fallback for missing icons (development helper)
 */
function handleMissingSpriteIcon(iconName) {
  console.warn(`Missing sprite icon: ${iconName}`);
  
  // Create a placeholder or fallback to Font Awesome
  const placeholder = document.createElement('span');
  placeholder.textContent = '?';
  placeholder.style.cssText = `
    display: inline-block;
    width: 16px;
    height: 16px;
    background: #ff0000;
    color: white;
    text-align: center;
    font-size: 12px;
    line-height: 16px;
  `;
  
  return placeholder;
}

/**
 * Update icon based on theme (light/dark mode support)
 */
function updateIconTheme(theme) {
  const icons = document.querySelectorAll('.ap-icon');
  
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.style.filter = 'brightness(0) invert(1)';
    } else {
      icon.style.filter = '';
    }
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeSpriteSystem,
    createSpriteIcon,
    replaceFAIcon,
    updatePreviewIcons,
    generateSpriteCSS,
    ICON_MAPPING,
    SPRITE_COORDINATES
  };
}

// Auto-initialize when DOM is ready (for browser environment)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpriteSystem);
  } else {
    initializeSpriteSystem();
  }
}