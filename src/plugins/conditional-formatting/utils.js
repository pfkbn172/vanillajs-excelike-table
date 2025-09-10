/**
 * Conditional Formatting Utilities
 * Shared utility functions to eliminate code duplication
 */

class ConditionalFormattingUtils {
  
  constructor(config = null) {
    // Get configuration (use global if available, fallback to parameter)
    this.config = config || (typeof window !== 'undefined' && window.ConditionalFormattingConfig) || {};
  }

  // ====================================
  // COLOR UTILITIES
  // ====================================

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color string (#ffffff)
   * @returns {Object|null} RGB object {r, g, b} or null if invalid
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert RGB values to hex color
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)  
   * @param {number} b - Blue value (0-255)
   * @returns {string} Hex color string
   */
  rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Interpolate between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @param {number} factor - Interpolation factor (0-1)
   * @returns {string} Interpolated color
   */
  interpolateColor(color1, color2, factor) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get color brightness (0-255)
   * @param {string} color - Hex color string
   * @returns {number} Brightness value
   */
  getColorBrightness(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 128; // Default to medium brightness
    
    // Standard brightness formula
    return Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
  }

  /**
   * Check if color is light (brightness > 128)
   * @param {string} color - Hex color string
   * @returns {boolean} True if light color
   */
  isLightColor(color) {
    return this.getColorBrightness(color) > 128;
  }

  // ====================================
  // DOM UTILITIES
  // ====================================

  /**
   * Create element with class and styles
   * @param {string} tagName - HTML tag name
   * @param {string|Array} className - CSS class name(s)
   * @param {Object} styles - CSS styles object
   * @param {Object} attributes - HTML attributes
   * @returns {HTMLElement} Created element
   */
  createElement(tagName, className = '', styles = {}, attributes = {}) {
    const element = document.createElement(tagName);
    
    // Add classes
    if (className) {
      if (Array.isArray(className)) {
        element.classList.add(...className);
      } else {
        element.className = className;
      }
    }
    
    // Apply styles
    Object.assign(element.style, styles);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  /**
   * Create modal overlay with consistent styling
   * @returns {HTMLElement} Modal overlay element
   */
  createModalOverlay() {
    return this.createElement('div', 'cf-modal-overlay cf-component');
  }

  /**
   * Create modal content container
   * @param {string} title - Modal title
   * @returns {Object} {overlay, content, header, body, footer}
   */
  createModal(title = '') {
    const overlay = this.createModalOverlay();
    const content = this.createElement('div', 'cf-modal-content');
    const header = this.createElement('div', 'cf-modal-header');
    const body = this.createElement('div', 'cf-modal-body');
    const footer = this.createElement('div', 'cf-modal-footer');

    // Create header content
    const titleEl = this.createElement('h3', 'cf-modal-title');
    titleEl.textContent = title;
    
    const closeBtn = this.createElement('button', 'cf-modal-close');
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // Assemble modal
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    overlay.appendChild(content);
    
    // Add close functionality
    closeBtn.addEventListener('click', () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    return {
      overlay,
      content,
      header,
      body,
      footer,
      titleEl,
      closeBtn
    };
  }

  /**
   * Create form group with label and input
   * @param {string} label - Label text
   * @param {string} inputType - Input type
   * @param {Object} inputAttributes - Input attributes
   * @returns {Object} {group, label, input}
   */
  createFormGroup(label, inputType = 'text', inputAttributes = {}) {
    const group = this.createElement('div', 'cf-form-group');
    const labelEl = this.createElement('label', 'cf-form-label');
    const input = this.createElement('input', 'cf-form-input');
    
    labelEl.textContent = label;
    input.type = inputType;
    
    Object.entries(inputAttributes).forEach(([key, value]) => {
      input.setAttribute(key, value);
    });
    
    group.appendChild(labelEl);
    group.appendChild(input);
    
    return { group, label: labelEl, input };
  }

  /**
   * Create button with consistent styling
   * @param {string} text - Button text
   * @param {string} variant - Button variant (primary, cancel, etc.)
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Button element
   */
  createButton(text, variant = 'default', onClick = null) {
    const classes = ['cf-button'];
    if (variant !== 'default') {
      classes.push(`cf-button-${variant}`);
    }
    
    const button = this.createElement('button', classes);
    button.textContent = text;
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Create star icon element with consistent styling
   * @param {string} icon - Icon character or class
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Star icon element
   */
  createStarIcon(icon, options = {}) {
    const iconElement = this.createElement('span', ['cf-icon', 'cf-star-icon'], {
      color: `${this.config.colors?.starIcon || '#FF8C00'} !important`,
      fontSize: '1.2em !important',
      marginRight: `${this.config.spacing?.xs || '4px'} !important`,
      display: 'inline-block !important'
    });
    
    // Set icon content based on type
    const maxIconLength = 10;
    if (icon && icon.length <= maxIconLength) {
      iconElement.textContent = icon;
    } else if (icon) {
      iconElement.classList.add(icon);
    }
    
    // Apply additional options
    if (options.className) {
      iconElement.classList.add(options.className);
    }
    
    if (options.style) {
      Object.assign(iconElement.style, options.style);
    }
    
    return iconElement;
  }

  // ====================================
  // DATA PROCESSING UTILITIES
  // ====================================

  /**
   * Clean numeric value (remove currency, commas, etc.)
   * @param {*} value - Value to clean
   * @returns {string} Cleaned string value
   */
  cleanNumericValue(value) {
    // 日本語の数値単位を処理
    let cleaned = String(value || '').trim();
    
    // 万単位の処理
    const manMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*万/);
    if (manMatch) {
      return String(parseFloat(manMatch[1]) * 10000);
    }
    
    // 億単位の処理
    const okuMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*億/);
    if (okuMatch) {
      return String(parseFloat(okuMatch[1]) * 100000000);
    }
    
    // 通常の記号除去
    return cleaned.replace(/[¥,$円,]/g, '');
  }

  /**
   * Parse value as number with fallback
   * @param {*} value - Value to parse
   * @param {number} fallback - Fallback value if parsing fails
   * @returns {number} Parsed number or fallback
   */
  parseNumeric(value, fallback = 0) {
    const cleaned = this.cleanNumericValue(value);
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Check if value is numeric
   * @param {*} value - Value to check
   * @returns {boolean} True if numeric
   */
  isNumeric(value) {
    const cleaned = this.cleanNumericValue(value);
    return cleaned !== '' && !isNaN(cleaned) && !isNaN(parseFloat(cleaned));
  }

  /**
   * Detect column data type based on sample values
   * @param {Array} values - Sample values from column
   * @returns {string} Data type ('numeric', 'date', 'text')
   */
  detectColumnType(values) {
    if (!values || values.length === 0) return 'text';
    
    let numericCount = 0;
    let dateCount = 0;
    const sampleSize = Math.min(values.length, 10);
    
    for (let i = 0; i < sampleSize; i++) {
      const value = values[i];
      
      // Check numeric first
      if (this.isNumeric(value)) {
        numericCount++;
        continue;
      }
      
      // Check date
      if (this.isDateValue(value)) {
        dateCount++;
      }
    }
    
    // Determine type based on majority
    const numericRatio = numericCount / sampleSize;
    const dateRatio = dateCount / sampleSize;
    
    if (numericRatio >= 0.6) return 'numeric';
    if (dateRatio >= 0.6) return 'date';
    return 'text';
  }

  /**
   * Check if value looks like a date
   * @param {*} value - Value to check
   * @returns {boolean} True if date-like
   */
  isDateValue(value) {
    if (!value) return false;
    
    const str = String(value).trim();
    
    // Check various date formats
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
      /^\d{2}-\d{2}-\d{4}$/,           // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/    // Flexible MM/DD/YY
    ];
    
    if (datePatterns.some(pattern => pattern.test(str))) {
      const date = new Date(str);
      return !isNaN(date.getTime());
    }
    
    return false;
  }

  // ====================================
  // PERFORMANCE UTILITIES
  // ====================================

  /**
   * Create debounced function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay = 150) {
    let timeoutId;
    
    return function debounced(...args) {
      const context = this;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }

  /**
   * Create throttled function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 100) {
    let inThrottle;
    
    return function throttled(...args) {
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if element is visible in viewport
   * @param {HTMLElement} element - Element to check
   * @param {HTMLElement} container - Container element (optional)
   * @returns {boolean} True if visible
   */
  isElementVisible(element, container = null) {
    if (!element) return false;
    
    const elementRect = element.getBoundingClientRect();
    
    if (container) {
      const containerRect = container.getBoundingClientRect();
      return (
        elementRect.bottom >= containerRect.top &&
        elementRect.top <= containerRect.bottom &&
        elementRect.right >= containerRect.left &&
        elementRect.left <= containerRect.right
      );
    } else {
      return (
        elementRect.bottom >= 0 &&
        elementRect.right >= 0 &&
        elementRect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        elementRect.left <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  }

  // ====================================
  // ICON SET UTILITIES
  // ====================================

  /**
   * Generate star rating string
   * @param {number} rating - Rating value (0-5)
   * @param {number} maxStars - Maximum number of stars
   * @returns {string} Star rating string (e.g., "★★★☆☆")
   */
  generateStarRating(rating, maxStars = 5) {
    const filledStars = Math.floor(Math.max(0, Math.min(rating, maxStars)));
    const emptyStars = maxStars - filledStars;
    
    return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
  }

  /**
   * Get icon from icon set based on value and thresholds
   * @param {number} value - Numeric value
   * @param {number} minValue - Minimum value in range
   * @param {number} maxValue - Maximum value in range
   * @param {Array} icons - Array of icons
   * @param {Array} thresholds - Array of threshold percentages
   * @returns {string} Selected icon
   */
  getIconFromSet(value, minValue, maxValue, icons, thresholds) {
    if (!icons || !icons.length) return '';
    
    if (maxValue === minValue) {
      // All values are the same, use middle icon
      const middleIndex = Math.floor(icons.length / 2);
      return icons[middleIndex];
    }
    
    // Calculate percentage (0-100)
    const percentage = Math.min(Math.max(((value - minValue) / (maxValue - minValue)) * 100, 0), 100);
    
    let iconIndex = 0;
    
    if (thresholds && thresholds.length > 0) {
      // Use custom thresholds
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (percentage >= thresholds[i]) {
          iconIndex = Math.min(i + 1, icons.length - 1);
          break;
        }
      }
    } else {
      // Use equal divisions
      const step = 100 / icons.length;
      iconIndex = Math.min(Math.floor(percentage / step), icons.length - 1);
    }
    
    return icons[iconIndex];
  }

  // ====================================
  // CONFIGURATION UTILITIES
  // ====================================

  /**
   * Get configuration value by path
   * @param {string} path - Dot-separated path (e.g., 'colors.primary')
   * @param {*} fallback - Fallback value
   * @returns {*} Configuration value or fallback
   */
  getConfigValue(path, fallback = null) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    
    return value;
  }

  /**
   * Generate CSS class name with prefix
   * @param {string} name - Class name without prefix
   * @returns {string} Prefixed class name
   */
  getClassName(name) {
    const prefix = this.getConfigValue('classes.prefix', 'cf-');
    return `${prefix}${name}`;
  }

  // ====================================
  // VALIDATION UTILITIES
  // ====================================

  /**
   * Validate percentage value
   * @param {*} value - Value to validate
   * @returns {boolean} True if valid percentage
   */
  isValidPercentage(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  /**
   * Validate color value
   * @param {*} value - Value to validate
   * @returns {boolean} True if valid color
   */
  isValidColor(value) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(value) || CSS.supports('color', value);
  }

  /**
   * Clamp number to range
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}

// ====================================
// EXPORT FOR DIFFERENT ENVIRONMENTS
// ====================================

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingUtils;
}

// Browser global
if (typeof window !== 'undefined') {
  window.ConditionalFormattingUtils = ConditionalFormattingUtils;
}

// ES6 default export would be: export default ConditionalFormattingUtils;