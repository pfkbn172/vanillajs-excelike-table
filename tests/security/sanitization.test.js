/**
 * Comprehensive Sanitization Security Tests
 * Tests HTML, URL, and input sanitization across various attack vectors
 */


// Mock SecurityUtils
const SecurityUtils = {
  sanitizeHTML: (dirty, config = {}) => {
    if (!dirty || typeof dirty !== 'string') return '';
    return global.DOMPurify.sanitize(dirty, config);
  },

  sanitizeText: (text) => {
    if (!text || typeof text !== 'string') return '';
    return global.DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  sanitizeURL: (url, allowedProtocols = ['http', 'https', 'mailto']) => {
    if (!url || typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol.replace(':', '');
      if (!allowedProtocols.includes(protocol)) return null;
      return parsed.href;
    } catch (e) {
      return null;
    }
  },

  validateLength: (input, maxLength = 10000) => {
    if (typeof input !== 'string') return false;
    return input.length <= maxLength;
  }
};

describe('Comprehensive Sanitization Tests', () => {

  describe('HTML Sanitization - Basic Tags', () => {
    test('SAN-001: Allows safe paragraph tag', () => {
      const safe = '<p>Hello World</p>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('<p>');
      expect(result).toContain('Hello World');
    });

    test('SAN-002: Allows safe bold tag', () => {
      const safe = '<b>Bold text</b>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('<b>');
    });

    test('SAN-003: Allows safe italic tag', () => {
      const safe = '<i>Italic text</i>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('<i>');
    });

    test('SAN-004: Allows safe span tag', () => {
      const safe = '<span class="highlight">Text</span>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('<span');
    });

    test('SAN-005: Allows safe div tag', () => {
      const safe = '<div id="container">Content</div>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('<div');
    });
  });

  describe('HTML Sanitization - Attributes', () => {
    test('SAN-006: Preserves safe class attribute', () => {
      const safe = '<div class="container">Test</div>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('class="container"');
    });

    test('SAN-007: Preserves safe id attribute', () => {
      const safe = '<div id="main">Test</div>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('id="main"');
    });

    test('SAN-008: Blocks unsafe href with javascript', () => {
      const malicious = '<a href="javascript:void(0)">Link</a>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });

    test('SAN-009: Allows safe href', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('href="https://example.com"');
    });

    test('SAN-010: Preserves data attributes', () => {
      const safe = '<div data-id="123">Test</div>';
      const result = SecurityUtils.sanitizeHTML(safe);
      expect(result).toContain('data-id');
    });
  });

  describe('URL Sanitization', () => {
    test('SAN-011: Accepts valid HTTP URL', () => {
      const url = 'http://example.com';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBe('http://example.com/');
    });

    test('SAN-012: Accepts valid HTTPS URL', () => {
      const url = 'https://example.com';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBe('https://example.com/');
    });

    test('SAN-013: Accepts mailto URL', () => {
      const url = 'mailto:test@example.com';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBe('mailto:test@example.com');
    });

    test('SAN-014: Rejects javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-015: Rejects data: protocol', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-016: Rejects file: protocol', () => {
      const url = 'file:///etc/passwd';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-017: Rejects ftp: protocol (not in allowed list)', () => {
      const url = 'ftp://example.com';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-018: Handles invalid URL', () => {
      const url = 'not a url';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-019: Handles empty URL', () => {
      const url = '';
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });

    test('SAN-020: Handles null URL', () => {
      const url = null;
      const result = SecurityUtils.sanitizeURL(url);
      expect(result).toBeNull();
    });
  });

  describe('Text Sanitization', () => {
    test('SAN-021: Removes all HTML tags', () => {
      const html = '<b>Bold</b> <i>Italic</i>';
      const result = SecurityUtils.sanitizeText(html);
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('<i>');
      expect(result).toContain('Bold');
      expect(result).toContain('Italic');
    });

    test('SAN-022: Removes script tags', () => {
      const malicious = '<script>alert(1)</script>Text';
      const result = SecurityUtils.sanitizeText(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Text');
    });

    test('SAN-023: Removes event handlers', () => {
      const malicious = '<div onclick="alert(1)">Text</div>';
      const result = SecurityUtils.sanitizeText(malicious);
      expect(result).not.toContain('onclick');
    });

    test('SAN-024: Handles plain text', () => {
      const plain = 'Plain text without HTML';
      const result = SecurityUtils.sanitizeText(plain);
      expect(result).toBe(plain);
    });

    test('SAN-025: Handles empty text', () => {
      const result = SecurityUtils.sanitizeText('');
      expect(result).toBe('');
    });
  });

  describe('Complex Attack Vectors', () => {
    test('SAN-026: Blocks nested script tags', () => {
      const malicious = '<div><div><script>alert(1)</script></div></div>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });

    test('SAN-027: Blocks SVG with embedded script', () => {
      const malicious = '<svg><circle onload="alert(1)"/></svg>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onload');
    });

    test('SAN-028: Blocks base64 encoded script', () => {
      const malicious = '<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      // Should not contain the dangerous data: protocol
      expect(result).not.toContain('data:image');
    });

    test('SAN-029: Blocks mutation XSS', () => {
      const malicious = '<noscript><p title="</noscript><img src=x onerror=alert(1)>">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onerror');
    });

    test('SAN-030: Blocks DOM clobbering', () => {
      const malicious = '<form name="getElementById"><input name="getElementById"></form>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      // Form should be sanitized
      expect(result).not.toContain('<form');
    });
  });

  describe('Input Length Validation', () => {
    test('SAN-031: Accepts input within limit', () => {
      const input = 'a'.repeat(100);
      const result = SecurityUtils.validateLength(input, 10000);
      expect(result).toBe(true);
    });

    test('SAN-032: Rejects input exceeding limit', () => {
      const input = 'a'.repeat(10001);
      const result = SecurityUtils.validateLength(input, 10000);
      expect(result).toBe(false);
    });

    test('SAN-033: Handles empty string', () => {
      const result = SecurityUtils.validateLength('', 10000);
      expect(result).toBe(true);
    });

    test('SAN-034: Rejects non-string input', () => {
      const result = SecurityUtils.validateLength(123, 10000);
      expect(result).toBe(false);
    });

    test('SAN-035: Uses default max length', () => {
      const input = 'a'.repeat(5000);
      const result = SecurityUtils.validateLength(input);
      expect(result).toBe(true);
    });
  });

  describe('Special Characters and Encoding', () => {
    test('SAN-036: Handles Unicode characters', () => {
      const unicode = '<p>こんにちは 世界</p>';
      const result = SecurityUtils.sanitizeHTML(unicode);
      expect(result).toContain('こんにちは');
    });

    test('SAN-037: Handles emoji', () => {
      const emoji = '<p>Hello 👋 World 🌍</p>';
      const result = SecurityUtils.sanitizeHTML(emoji);
      expect(result).toContain('👋');
      expect(result).toContain('🌍');
    });

    test('SAN-038: Handles HTML entities', () => {
      const entities = '<p>&lt;div&gt;&amp;&quot;</p>';
      const result = SecurityUtils.sanitizeHTML(entities);
      expect(result).toContain('&lt;');
      expect(result).toContain('&amp;');
    });

    test('SAN-039: Handles quotes in attributes', () => {
      const quotes = '<div title="Test \\"quoted\\" text">Content</div>';
      const result = SecurityUtils.sanitizeHTML(quotes);
      expect(result).toContain('title=');
    });

    test('SAN-040: Handles newlines', () => {
      const multiline = '<p>Line 1\nLine 2\nLine 3</p>';
      const result = SecurityUtils.sanitizeHTML(multiline);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 3');
    });
  });

  describe('Configuration and Options', () => {
    test('SAN-041: Respects custom allowed tags', () => {
      const html = '<b>Bold</b><marquee>Moving</marquee>';
      const result = SecurityUtils.sanitizeHTML(html, {
        ALLOWED_TAGS: ['b']
      });
      expect(result).toContain('<b>');
      expect(result).not.toContain('<marquee>');
    });

    test('SAN-042: Respects custom allowed protocols', () => {
      const url = 'ftp://example.com';
      const result = SecurityUtils.sanitizeURL(url, ['http', 'https', 'ftp']);
      expect(result).toBe('ftp://example.com/');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('SAN-043: Handles very long tag name', () => {
      const longTag = '<' + 'a'.repeat(1000) + '>text</' + 'a'.repeat(1000) + '>';
      const result = SecurityUtils.sanitizeHTML(longTag);
      expect(result).toBeTruthy();
    });

    test('SAN-044: Handles deeply nested tags', () => {
      let nested = 'content';
      for (let i = 0; i < 100; i++) {
        nested = `<div>${nested}</div>`;
      }
      const result = SecurityUtils.sanitizeHTML(nested);
      expect(result).toContain('content');
    });

    test('SAN-045: Handles malformed HTML', () => {
      const malformed = '<div><p>Unclosed tags<div>';
      const result = SecurityUtils.sanitizeHTML(malformed);
      expect(result).toBeTruthy();
    });

    test('SAN-046: Handles only opening tags', () => {
      const opening = '<div><p><span>';
      const result = SecurityUtils.sanitizeHTML(opening);
      expect(result).toBeTruthy();
    });

    test('SAN-047: Handles only closing tags', () => {
      const closing = '</div></p></span>';
      const result = SecurityUtils.sanitizeHTML(closing);
      expect(result).toBeTruthy();
    });

    test('SAN-048: Handles mixed case tags', () => {
      const mixed = '<DiV>Mixed</dIv>';
      const result = SecurityUtils.sanitizeHTML(mixed);
      expect(result).toContain('Mixed');
    });

    test('SAN-049: Handles whitespace in tags', () => {
      const whitespace = '<div   class="test"   >Content</div>';
      const result = SecurityUtils.sanitizeHTML(whitespace);
      expect(result).toContain('Content');
    });

    test('SAN-050: Handles comments', () => {
      const comments = '<!-- Comment --><div>Content</div><!-- Another comment -->';
      const result = SecurityUtils.sanitizeHTML(comments);
      expect(result).toContain('Content');
    });
  });
});
