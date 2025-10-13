/**
 * XSS (Cross-Site Scripting) Security Tests
 * Tests SecurityUtils protection against various XSS attack vectors
 */


// Mock SecurityUtils module
const SecurityUtils = {
  sanitizeHTML: global.DOMPurify.sanitize,
  sanitizeText: (text) => global.DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
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
  }
};

describe('XSS Protection Tests', () => {

  describe('Script Tag Injection', () => {
    test('XSS-001: Blocks <script> tag', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('XSS-002: Blocks <script> with attributes', () => {
      const malicious = '<script type="text/javascript">alert("XSS")</script>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });

    test('XSS-003: Blocks script tag with newlines', () => {
      const malicious = '<script>\nalert("XSS")\n</script>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });

    test('XSS-004: Blocks uppercase SCRIPT tag', () => {
      const malicious = '<SCRIPT>alert("XSS")</SCRIPT>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('alert');
    });

    test('XSS-005: Blocks mixed case ScRiPt tag', () => {
      const malicious = '<ScRiPt>alert("XSS")</ScRiPt>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('alert');
    });
  });

  describe('Event Handler Injection', () => {
    test('XSS-006: Blocks onclick event handler', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onclick');
    });

    test('XSS-007: Blocks onerror event handler', () => {
      const malicious = '<img src=x onerror="alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onerror');
    });

    test('XSS-008: Blocks onload event handler', () => {
      const malicious = '<body onload="alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onload');
    });

    test('XSS-009: Blocks onmouseover event handler', () => {
      const malicious = '<div onmouseover="alert(\'XSS\')">Hover</div>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onmouseover');
    });

    test('XSS-010: Blocks onfocus event handler', () => {
      const malicious = '<input onfocus="alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onfocus');
    });
  });

  describe('JavaScript Protocol Injection', () => {
    test('XSS-011: Blocks javascript: in href', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });

    test('XSS-012: Blocks javascript: URL', () => {
      const malicious = 'javascript:alert(1)';
      const result = SecurityUtils.sanitizeURL(malicious);
      expect(result).toBeNull();
    });

    test('XSS-013: Blocks data: URL with javascript', () => {
      const malicious = 'data:text/html,<script>alert("XSS")</script>';
      const result = SecurityUtils.sanitizeURL(malicious);
      expect(result).toBeNull();
    });

    test('XSS-014: Blocks vbscript: protocol', () => {
      const malicious = '<a href="vbscript:msgbox(\'XSS\')">Click</a>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('vbscript:');
    });
  });

  describe('HTML Entity Encoding Attacks', () => {
    test('XSS-015: Handles HTML entities in script', () => {
      const malicious = '<script>&#97;lert("XSS")</script>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });

    test('XSS-016: Handles hex entities', () => {
      const malicious = '<script>&#x61;lert("XSS")</script>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });
  });

  describe('SVG-based XSS', () => {
    test('XSS-017: Blocks SVG with script', () => {
      const malicious = '<svg><script>alert("XSS")</script></svg>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
    });

    test('XSS-018: Blocks SVG onload', () => {
      const malicious = '<svg onload="alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('onload');
    });
  });

  describe('iframe Injection', () => {
    test('XSS-019: Blocks iframe tag', () => {
      const malicious = '<iframe src="http://evil.com"></iframe>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<iframe');
    });

    test('XSS-020: Blocks iframe with javascript', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Object and Embed Tags', () => {
    test('XSS-021: Blocks object tag', () => {
      const malicious = '<object data="javascript:alert(\'XSS\')"></object>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<object');
    });

    test('XSS-022: Blocks embed tag', () => {
      const malicious = '<embed src="javascript:alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('<embed');
    });
  });

  describe('Form-based XSS', () => {
    test('XSS-023: Sanitizes form action', () => {
      const malicious = '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Meta Tag Injection', () => {
    test('XSS-024: Blocks meta refresh to javascript', () => {
      const malicious = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Style-based XSS', () => {
    test('XSS-025: Blocks expression() in style', () => {
      const malicious = '<div style="width:expression(alert(\'XSS\'))">test</div>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('expression(');
    });

    test('XSS-026: Blocks javascript: in background-image', () => {
      const malicious = '<div style="background-image:url(javascript:alert(\'XSS\'))">test</div>';
      const result = SecurityUtils.sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Text Sanitization', () => {
    test('XSS-027: sanitizeText removes all HTML tags', () => {
      const malicious = '<b>Bold</b><script>alert("XSS")</script>';
      const result = SecurityUtils.sanitizeText(malicious);
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Bold');
    });

    test('XSS-028: sanitizeText handles event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Text</div>';
      const result = SecurityUtils.sanitizeText(malicious);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('<div>');
    });
  });

  describe('Edge Cases', () => {
    test('XSS-029: Handles null input', () => {
      const result = SecurityUtils.sanitizeHTML(null);
      expect(result).toBe('');
    });

    test('XSS-030: Handles empty string', () => {
      const result = SecurityUtils.sanitizeHTML('');
      expect(result).toBe('');
    });
  });
});
