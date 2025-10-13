/**
 * Security Utils Extended Unit Tests
 * Tests for additional security utility functions
 */

import SecurityUtils from '../../src/security-utils.js';

describe('Security Utils - Extended', () => {

  describe('validateLength', () => {
    test('should return true for string within limit', () => {
      const result = SecurityUtils.validateLength('Hello World', 100);
      expect(result).toBe(true);
    });

    test('should return true for string exactly at limit', () => {
      const result = SecurityUtils.validateLength('12345', 5);
      expect(result).toBe(true);
    });

    test('should return false for string exceeding limit', () => {
      const result = SecurityUtils.validateLength('123456', 5);
      expect(result).toBe(false);
    });

    test('should use default maxLength of 10000', () => {
      const longString = 'a'.repeat(10000);
      expect(SecurityUtils.validateLength(longString)).toBe(true);

      const tooLongString = 'a'.repeat(10001);
      expect(SecurityUtils.validateLength(tooLongString)).toBe(false);
    });

    test('should return false for non-string input', () => {
      expect(SecurityUtils.validateLength(12345, 100)).toBe(false);
      expect(SecurityUtils.validateLength(null, 100)).toBe(false);
      expect(SecurityUtils.validateLength(undefined, 100)).toBe(false);
      expect(SecurityUtils.validateLength({}, 100)).toBe(false);
    });

    test('should handle empty string', () => {
      const result = SecurityUtils.validateLength('', 100);
      expect(result).toBe(true);
    });

    test('should handle zero maxLength', () => {
      expect(SecurityUtils.validateLength('', 0)).toBe(true);
      expect(SecurityUtils.validateLength('a', 0)).toBe(false);
    });
  });

  describe('containsXSSPattern', () => {
    test('should detect script tags', () => {
      expect(SecurityUtils.containsXSSPattern('<script>alert(1)</script>')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<script src="evil.js"></script>')).toBe(true);
    });

    test('should detect javascript: protocol', () => {
      expect(SecurityUtils.containsXSSPattern('javascript:alert(1)')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('JAVASCRIPT:alert(1)')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<a href="javascript:void(0)">link</a>')).toBe(true);
    });

    test('should detect event handlers', () => {
      expect(SecurityUtils.containsXSSPattern('onerror=alert(1)')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('onclick=doSomething()')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('onload=evil()')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('onmouseover=bad()')).toBe(true);
    });

    test('should detect iframe tags', () => {
      expect(SecurityUtils.containsXSSPattern('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<IFRAME>')).toBe(true);
    });

    test('should detect object tags', () => {
      expect(SecurityUtils.containsXSSPattern('<object data="evil.swf"></object>')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<OBJECT>')).toBe(true);
    });

    test('should detect embed tags', () => {
      expect(SecurityUtils.containsXSSPattern('<embed src="evil.swf">')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('<EMBED>')).toBe(true);
    });

    test('should detect eval() calls', () => {
      expect(SecurityUtils.containsXSSPattern('eval("alert(1)")')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('EVAL(code)')).toBe(true);
    });

    test('should detect expression() in styles', () => {
      expect(SecurityUtils.containsXSSPattern('expression(alert(1))')).toBe(true);
      expect(SecurityUtils.containsXSSPattern('EXPRESSION(evil())')).toBe(true);
    });

    test('should return false for safe content', () => {
      expect(SecurityUtils.containsXSSPattern('Hello World')).toBe(false);
      expect(SecurityUtils.containsXSSPattern('<p>Safe paragraph</p>')).toBe(false);
      expect(SecurityUtils.containsXSSPattern('<div class="safe">Content</div>')).toBe(false);
    });

    test('should return false for null/undefined', () => {
      expect(SecurityUtils.containsXSSPattern(null)).toBe(false);
      expect(SecurityUtils.containsXSSPattern(undefined)).toBe(false);
      expect(SecurityUtils.containsXSSPattern('')).toBe(false);
    });

    test('should return false for non-string input', () => {
      expect(SecurityUtils.containsXSSPattern(12345)).toBe(false);
      expect(SecurityUtils.containsXSSPattern({})).toBe(false);
    });
  });

  describe('isValidURL', () => {
    test('should accept valid HTTPS URLs', () => {
      expect(SecurityUtils.isValidURL('https://example.com')).toBe(true);
      expect(SecurityUtils.isValidURL('https://example.com/path')).toBe(true);
      expect(SecurityUtils.isValidURL('https://example.com/path?query=value')).toBe(true);
    });

    test('should accept valid HTTP URLs', () => {
      expect(SecurityUtils.isValidURL('http://example.com')).toBe(true);
      expect(SecurityUtils.isValidURL('http://localhost:3000')).toBe(true);
    });

    test('should accept mailto URLs', () => {
      expect(SecurityUtils.isValidURL('mailto:test@example.com')).toBe(true);
      expect(SecurityUtils.isValidURL('MAILTO:test@example.com')).toBe(true);
    });

    test('should accept tel URLs', () => {
      expect(SecurityUtils.isValidURL('tel:+1234567890')).toBe(true);
      expect(SecurityUtils.isValidURL('TEL:123456')).toBe(true);
    });

    test('should accept relative URLs', () => {
      expect(SecurityUtils.isValidURL('/path/to/page')).toBe(true);
      expect(SecurityUtils.isValidURL('/path?query=value')).toBe(true);
    });

    test('should accept anchor links', () => {
      expect(SecurityUtils.isValidURL('#section')).toBe(true);
      expect(SecurityUtils.isValidURL('#top')).toBe(true);
    });

    test('should reject javascript: protocol', () => {
      expect(SecurityUtils.isValidURL('javascript:alert(1)')).toBe(false);
      expect(SecurityUtils.isValidURL('JAVASCRIPT:void(0)')).toBe(false);
    });

    test('should reject data: protocol', () => {
      expect(SecurityUtils.isValidURL('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(SecurityUtils.isValidURL('DATA:image/png;base64,abc')).toBe(false);
    });

    test('should reject vbscript: protocol', () => {
      expect(SecurityUtils.isValidURL('vbscript:msgbox(1)')).toBe(false);
      expect(SecurityUtils.isValidURL('VBSCRIPT:evil()')).toBe(false);
    });

    test('should reject file: protocol', () => {
      expect(SecurityUtils.isValidURL('file:///etc/passwd')).toBe(false);
      expect(SecurityUtils.isValidURL('FILE://C:/Windows/System32')).toBe(false);
    });

    test('should reject null/undefined', () => {
      expect(SecurityUtils.isValidURL(null)).toBe(false);
      expect(SecurityUtils.isValidURL(undefined)).toBe(false);
      expect(SecurityUtils.isValidURL('')).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(SecurityUtils.isValidURL(12345)).toBe(false);
      expect(SecurityUtils.isValidURL({})).toBe(false);
    });
  });

  describe('escapeCSVFormula', () => {
    test('should escape formulas starting with =', () => {
      const result = SecurityUtils.escapeCSVFormula('=SUM(A1:A10)');
      expect(result).toBe("'=SUM(A1:A10)");
    });

    test('should escape formulas starting with +', () => {
      const result = SecurityUtils.escapeCSVFormula('+1+2');
      expect(result).toBe("'+1+2");
    });

    test('should escape formulas starting with -', () => {
      const result = SecurityUtils.escapeCSVFormula('-10');
      expect(result).toBe("'-10");
    });

    test('should escape formulas starting with @', () => {
      const result = SecurityUtils.escapeCSVFormula('@function()');
      expect(result).toBe("'@function()");
    });

    test('should escape values starting with tab', () => {
      const result = SecurityUtils.escapeCSVFormula('\tvalue');
      expect(result).toBe("'\tvalue");
    });

    test('should escape values starting with carriage return', () => {
      const result = SecurityUtils.escapeCSVFormula('\rvalue');
      expect(result).toBe("'\rvalue");
    });

    test('should not escape safe values', () => {
      expect(SecurityUtils.escapeCSVFormula('Normal text')).toBe('Normal text');
      expect(SecurityUtils.escapeCSVFormula('123')).toBe('123');
      expect(SecurityUtils.escapeCSVFormula('test@example.com')).toBe('test@example.com');
    });

    test('should return empty string for null/undefined', () => {
      expect(SecurityUtils.escapeCSVFormula(null)).toBe('');
      expect(SecurityUtils.escapeCSVFormula(undefined)).toBe('');
    });

    test('should return empty string for empty string', () => {
      expect(SecurityUtils.escapeCSVFormula('')).toBe('');
    });

    test('should return non-string values as-is', () => {
      expect(SecurityUtils.escapeCSVFormula(123)).toBe(123);
      expect(SecurityUtils.escapeCSVFormula(true)).toBe(true);
    });
  });
});
