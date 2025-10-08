/**
 * Jest test setup file
 */

// Import Jest globals for ES modules
import { jest, expect, beforeEach, afterEach } from '@jest/globals';

// Make jest and expect available globally
global.jest = jest;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Import required polyfills for jsdom
import 'whatwg-fetch';

// Mock DOM methods that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Custom matchers
expect.extend({
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
      pass,
    };
  },

  toBeVisible(received) {
    const pass = received.style.display !== 'none' && 
                  received.style.visibility !== 'hidden' && 
                  received.offsetParent !== null;
    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to be visible`,
      pass,
    };
  },

  toHaveAttribute(received, attribute, value) {
    const hasAttribute = received.hasAttribute(attribute);
    const actualValue = received.getAttribute(attribute);
    
    if (value === undefined) {
      return {
        message: () =>
          `expected element ${hasAttribute ? 'not ' : ''}to have attribute "${attribute}"`,
        pass: hasAttribute,
      };
    }
    
    const pass = hasAttribute && actualValue === value;
    return {
      message: () =>
        `expected element to have attribute "${attribute}" with value "${value}", but got "${actualValue}"`,
      pass,
    };
  }
});

// Test utilities
global.createTable = (options = {}) => {
  const container = document.createElement('div');
  container.id = 'test-table-container';
  document.body.appendChild(container);
  
  const defaultOptions = {
    data: [
      { id: 1, name: 'Test User 1', age: 25 },
      { id: 2, name: 'Test User 2', age: 30 },
      { id: 3, name: 'Test User 3', age: 35 }
    ],
    columns: [
      { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
      { key: 'name', title: 'Name', dataIndex: 'name', width: 150 },
      { key: 'age', title: 'Age', dataIndex: 'age', width: 80 }
    ]
  };
  
  return {
    container,
    options: { ...defaultOptions, ...options }
  };
};

global.cleanupDOM = () => {
  document.body.innerHTML = '';
};

// Setup and teardown
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

afterEach(() => {
  // Cleanup DOM
  cleanupDOM();
});

// Global test timeout
jest.setTimeout(10000);