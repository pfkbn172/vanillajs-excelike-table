/**
 * Security Utilities Module
 * Provides XSS protection and input sanitization
 */

import DOMPurify from 'dompurify';

const SecurityUtils = {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param {string} dirty - Unsanitized HTML string
   * @param {Object} config - DOMPurify configuration
   * @returns {string} - Sanitized HTML
   */
  sanitizeHTML(dirty, config = {}) {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    const defaultConfig = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'span', 'div', 'p', 'br',
        'a', 'img', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
        'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'code', 'pre', 'blockquote', 'hr', 'sup', 'sub'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'title', 'alt', 'src', 'href',
        'target', 'rel', 'data-*'
      ],
      ALLOW_DATA_ATTR: true,
      RETURN_TRUSTED_TYPE: false
    };

    const mergedConfig = { ...defaultConfig, ...config };
    return DOMPurify.sanitize(dirty, mergedConfig);
  },

  /**
   * Sanitize text content (no HTML allowed)
   * @param {string} text - Unsanitized text
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  },

  /**
   * Escape CSV formulas to prevent injection attacks
   * Excel/LibreOffice execute formulas starting with: = + - @ \t \r
   * @param {string} value - Cell value
   * @returns {string} - Escaped value
   */
  escapeCSVFormula(value) {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value !== 'string') {
      return value;
    }

    // Empty string
    if (value === '') {
      return '';
    }

    const firstChar = value.charAt(0);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];

    if (dangerousChars.includes(firstChar)) {
      // Prefix with single quote to prevent formula execution
      return "'" + value;
    }

    return value;
  },

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @param {Array} allowedProtocols - Allowed URL protocols
   * @returns {string|null} - Sanitized URL or null if invalid
   */
  sanitizeURL(url, allowedProtocols = ['http', 'https', 'mailto']) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol.replace(':', '');

      if (!allowedProtocols.includes(protocol)) {
        console.warn(`SecurityUtils: Blocked URL with protocol ${protocol}`);
        return null;
      }

      return parsed.href;
    } catch (e) {
      console.warn('SecurityUtils: Invalid URL', url);
      return null;
    }
  },

  /**
   * Create safe HTML element with sanitized content
   * @param {string} tagName - Element tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - HTML content to sanitize
   * @returns {HTMLElement} - Safe element
   */
  createSafeElement(tagName, attributes = {}, content = '') {
    const element = document.createElement(tagName);

    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'href' || key === 'src') {
        const safeURL = this.sanitizeURL(value);
        if (safeURL) {
          element.setAttribute(key, safeURL);
        }
      } else if (key === 'style') {
        // Sanitize inline styles
        element.setAttribute(key, DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }));
      } else {
        element.setAttribute(key, value);
      }
    });

    // Set content safely
    if (content) {
      element.innerHTML = this.sanitizeHTML(content);
    }

    return element;
  },

  /**
   * Validate input length to prevent DoS
   * @param {string} input - Input to validate
   * @param {number} maxLength - Maximum allowed length
   * @returns {boolean} - True if valid
   */
  validateLength(input, maxLength = 10000) {
    if (typeof input !== 'string') {
      return false;
    }
    return input.length <= maxLength;
  },

  /**
   * Check if string contains potential XSS patterns
   * @param {string} input - Input to check
   * @returns {boolean} - True if suspicious patterns found
   */
  containsXSSPattern(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\(/gi,
      /expression\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Validate URL safety
   * @param {string} url - URL to validate
   * @returns {boolean} - True if URL is safe
   */
  isValidURL(url) {
    if (!url || typeof url !== 'string') return false;

    // Block dangerous protocols
    const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
    if (dangerousProtocols.test(url)) return false;

    // Only allow http, https, mailto, tel
    const allowedProtocols = /^(https?|mailto|tel):/i;
    return allowedProtocols.test(url) || url.startsWith('/') || url.startsWith('#');
  },

  /**
   * Sanitize URL
   * @param {string} url - URL to sanitize
   * @returns {string} - Safe URL or about:blank
   */
  sanitizeURL(url) {
    if (this.isValidURL(url)) {
      return url;
    }
    return 'about:blank';
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}

if (typeof window !== 'undefined') {
  window.SecurityUtils = SecurityUtils;
}

export default SecurityUtils;
