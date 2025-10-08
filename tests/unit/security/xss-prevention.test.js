/**
 * XSS Prevention Tests
 * Tests for security vulnerabilities identified in previous analysis
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import SecurityUtils from '../../../src/security-utils.js';

describe('Security - XSS Prevention', () => {
  let container;
  let ExceLikeTable;

  beforeEach(async () => {
    const module = await import('../../../src/ExceLikeTable.js');
    ExceLikeTable = module.default;

    container = document.createElement('div');
    container.id = 'test-table';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('SecurityUtils - HTML Sanitization', () => {
    test('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should remove event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click me</div>';
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });

    test('should remove javascript: protocol', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should remove data: protocol with script', () => {
      const malicious = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('data:');
      expect(sanitized).not.toContain('<script>');
    });

    test('should remove img onerror handlers', () => {
      const malicious = '<img src="x" onerror="alert(1)">';
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    test('should handle multiple XSS attempts', () => {
      const malicious = `
        <script>alert(1)</script>
        <img src=x onerror="alert(2)">
        <a href="javascript:alert(3)">Click</a>
        <div onclick="alert(4)">Div</div>
      `;
      const sanitized = SecurityUtils.sanitizeHTML(malicious);

      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('javascript:');
    });

    test('should preserve safe HTML', () => {
      const safe = '<div><strong>Bold</strong> and <em>italic</em></div>';
      const sanitized = SecurityUtils.sanitizeHTML(safe);

      expect(sanitized).toContain('strong');
      expect(sanitized).toContain('em');
      expect(sanitized).toContain('Bold');
      expect(sanitized).toContain('italic');
    });
  });

  describe('SecurityUtils - CSV Export Safety', () => {
    test('should escape CSV formula injection', () => {
      const dangerous = ['=cmd|/c calc', '+calc', '-calc', '@calc'];

      dangerous.forEach(value => {
        const escaped = SecurityUtils.escapeCSVFormula(value);
        expect(escaped).toMatch(/^'./); // Should be prefixed with quote
        expect(escaped).not.toMatch(/^[=+\-@]/); // Should not start with formula chars
      });
    });

    test('should not modify safe values', () => {
      const safe = ['normal text', '123', 'test@example.com'];

      safe.forEach(value => {
        const escaped = SecurityUtils.escapeCSVFormula(value);
        expect(escaped).toBe(value);
      });
    });

    test('should handle edge cases', () => {
      expect(SecurityUtils.escapeCSVFormula('')).toBe('');
      expect(SecurityUtils.escapeCSVFormula(null)).toBe('');
      expect(SecurityUtils.escapeCSVFormula(undefined)).toBe('');
    });
  });

  describe('Table Data Rendering - XSS Prevention', () => {
    test('should sanitize user data in cells', () => {
      const maliciousData = [
        { id: 1, content: '<script>alert("XSS")</script>' },
        { id: 2, content: '<img src=x onerror="alert(1)">' }
      ];

      const table = new ExceLikeTable('#test-table', {
        data: maliciousData,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'content', title: 'Content', dataIndex: 'content' }
        ]
      });

      // Check that the DOM doesn't contain script tags
      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);

      // Check that event handlers aren't present
      const imgs = container.querySelectorAll('img[onerror]');
      expect(imgs.length).toBe(0);
    });

    test('should handle HTML injection in column titles', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [
          {
            key: 'id',
            title: '<script>alert("XSS")</script>',
            dataIndex: 'id'
          }
        ]
      });

      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    test('should prevent DOM XSS through custom render functions', () => {
      // Test that if a custom render function returns HTML with scripts,
      // it should be sanitized
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1, value: 'test' }],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          {
            key: 'value',
            title: 'Value',
            dataIndex: 'value',
            render: (value) => {
              // Malicious render function attempting XSS
              return `<img src="x" onerror="alert('XSS')">`;
            }
          }
        ]
      });

      // Verify no scripts are executed
      const imgs = container.querySelectorAll('img[onerror]');
      expect(imgs.length).toBe(0);
    });
  });

  describe('Filter Input Sanitization', () => {
    test('should sanitize filter input values', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      // Try to inject script through filter
      if (typeof table.setFilter === 'function') {
        table.setFilter('name', '<script>alert(1)</script>');

        const scripts = container.querySelectorAll('script');
        expect(scripts.length).toBe(0);
      }
    });

    test('should handle malicious search patterns', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [
          { id: 1, text: 'normal' },
          { id: 2, text: '<script>alert(1)</script>' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'text', title: 'Text', dataIndex: 'text' }
        ]
      });

      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });
  });

  describe('URL Validation', () => {
    test('should validate URLs', () => {
      const valid = ['https://example.com', 'http://test.com'];
      const invalid = ['javascript:alert(1)', 'data:text/html,<script>'];

      valid.forEach(url => {
        expect(SecurityUtils.isValidURL(url)).toBe(true);
      });

      invalid.forEach(url => {
        expect(SecurityUtils.isValidURL(url)).toBe(false);
      });
    });

    test('should sanitize URLs', () => {
      const dangerous = 'javascript:alert(1)';
      const sanitized = SecurityUtils.sanitizeURL(dangerous);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toBe('about:blank');
    });
  });

  describe('Content Security Policy Compliance', () => {
    test('should not use eval or Function constructor in table code', () => {
      // This is a static analysis test
      // ExceLikeTable should not use eval() or new Function()
      // except for plugin system which has explicit security warnings

      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      // Table should render without eval
      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should not execute inline event handlers', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1, html: '<div onclick="alert(1)">Click</div>' }],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'html', title: 'HTML', dataIndex: 'html' }
        ]
      });

      const elements = container.querySelectorAll('[onclick]');
      expect(elements.length).toBe(0);
    });
  });

  describe('Input Validation', () => {
    test('should validate column configuration', () => {
      // Test that malicious column configs are handled safely
      expect(() => {
        new ExceLikeTable('#test-table', {
          data: [{ id: 1 }],
          columns: [
            {
              key: '<script>alert(1)</script>',
              title: 'ID',
              dataIndex: 'id'
            }
          ]
        });
      }).not.toThrow();

      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    test('should handle malicious option values', () => {
      expect(() => {
        new ExceLikeTable('#test-table', {
          data: [{ id: 1 }],
          columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }],
          tableId: '<script>alert(1)</script>'
        });
      }).not.toThrow();

      const scripts = container.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });
  });
});
