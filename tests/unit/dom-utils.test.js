/**
 * DOM Utils Unit Tests
 */

// Import modules - adjust path as needed for your test environment
const DOMUtils = require('../../src/dom-utils');

describe('DOMUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('createElement', () => {
    test('should create element with text content', () => {
      const element = DOMUtils.createElement('div', 'Hello World');
      
      expect(element.tagName).toBe('DIV');
      expect(element.textContent).toBe('Hello World');
    });

    test('should create element with attributes', () => {
      const element = DOMUtils.createElement('div', 'Test', {
        class: 'test-class',
        id: 'test-id',
        'data-test': 'value'
      });
      
      expect(element.className).toBe('test-class');
      expect(element.id).toBe('test-id');
      expect(element.getAttribute('data-test')).toBe('value');
    });

    test('should handle data attributes object', () => {
      const element = DOMUtils.createElement('div', '', {
        data: {
          userId: '123',
          action: 'click'
        }
      });
      
      expect(element.dataset.userId).toBe('123');
      expect(element.dataset.action).toBe('click');
    });
  });

  describe('sanitizeHTML', () => {
    test('should remove script tags', () => {
      const malicious = '<div>Hello <script>alert("XSS")</script> World</div>';
      const sanitized = DOMUtils.sanitizeHTML(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("XSS")');
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
    });

    test('should remove event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const sanitized = DOMUtils.sanitizeHTML(malicious);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Click me');
    });

    test('should handle multiple types of XSS attempts', () => {
      const testCases = [
        '<img src=x onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<a href="javascript:alert(\'XSS\')">Link</a>'
      ];

      testCases.forEach(testCase => {
        const sanitized = DOMUtils.sanitizeHTML(testCase);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });
  });

  describe('setContent', () => {
    test('should set text content safely', () => {
      const element = document.createElement('div');
      const malicious = '<script>alert("XSS")</script>';
      
      DOMUtils.setContent(element, malicious, false);
      
      expect(element.textContent).toBe(malicious);
      expect(element.innerHTML).not.toContain('<script>');
    });

    test('should set HTML content with sanitization', () => {
      const element = document.createElement('div');
      const content = '<b>Bold</b> <script>alert("XSS")</script>';
      
      DOMUtils.setContent(element, content, true);
      
      expect(element.innerHTML).toContain('<b>Bold</b>');
      expect(element.innerHTML).not.toContain('<script>');
    });
  });

  describe('createTableCell', () => {
    test('should create basic table cell', () => {
      const cell = DOMUtils.createTableCell('Test Content');
      
      expect(cell.tagName).toBe('TD');
      expect(cell.textContent).toBe('Test Content');
    });

    test('should create cell with options', () => {
      const cell = DOMUtils.createTableCell('Test', {
        className: 'test-cell',
        width: 100,
        dataAttributes: {
          column: 'name',
          row: '1'
        }
      });
      
      expect(cell.className).toBe('test-cell');
      expect(cell.style.width).toBe('100px');
      expect(cell.dataset.column).toBe('name');
      expect(cell.dataset.row).toBe('1');
    });

    test('should handle HTML content safely', () => {
      const cell = DOMUtils.createTableCell('<b>Bold</b> <script>alert("XSS")</script>', {
        isHTML: true
      });
      
      expect(cell.innerHTML).toContain('<b>Bold</b>');
      expect(cell.innerHTML).not.toContain('<script>');
    });
  });

  describe('createButton', () => {
    test('should create basic button', () => {
      const button = DOMUtils.createButton('Click me');
      
      expect(button.tagName).toBe('BUTTON');
      expect(button.textContent).toBe('Click me');
      expect(button.type).toBe('button');
    });

    test('should handle click events', () => {
      const clickHandler = jest.fn();
      const button = DOMUtils.createButton('Test', {
        onClick: clickHandler
      });
      
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearElement', () => {
    test('should clear element content', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>Test</p><span>Content</span>';
      
      DOMUtils.clearElement(container);
      
      expect(container.innerHTML).toBe('');
    });

    test('should handle empty element', () => {
      const container = document.createElement('div');
      
      expect(() => {
        DOMUtils.clearElement(container);
      }).not.toThrow();
      
      expect(container.innerHTML).toBe('');
    });
  });

  describe('appendChildren', () => {
    test('should append multiple children', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('p');
      
      child1.textContent = 'Child 1';
      child2.textContent = 'Child 2';
      
      DOMUtils.appendChildren(parent, [child1, child2]);
      
      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
    });

    test('should handle empty array', () => {
      const parent = document.createElement('div');
      
      expect(() => {
        DOMUtils.appendChildren(parent, []);
      }).not.toThrow();
      
      expect(parent.children.length).toBe(0);
    });

    test('should filter out non-elements', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      
      DOMUtils.appendChildren(parent, [child, 'text', null, undefined]);
      
      expect(parent.children.length).toBe(1);
      expect(parent.children[0]).toBe(child);
    });
  });
});