/**
 * DOM Utilities for DOM manipulation
 */

const DOMUtils = {
  /**
   * Create element with safe text content
   * @param {string} tag - HTML tag name
   * @param {string} text - Text content (will be escaped)
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement}
   */
  createElement(tag, text = '', attributes = {}) {
    const element = document.createElement(tag);
    if (text) {
      element.textContent = text;
    }
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'data') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  },

  /**
   * Create element with HTML content
   * @param {string} tag - HTML tag name
   * @param {string} html - HTML content
   * @param {Object} attributes - Element attributes
   * @returns {HTMLElement}
   */
  createElementWithHTML(tag, html = '', attributes = {}) {
    const element = this.createElement(tag, '', attributes);
    const template = document.createElement('template');
    template.innerHTML = html;
    element.appendChild(template.content);
    return element;
  },

  /**
   * Safely set element content
   * @param {HTMLElement} element - Target element
   * @param {string} content - Content to set
   * @param {boolean} isHTML - Whether content contains HTML
   */
  setContent(element, content, isHTML = false) {
    if (!element) return;

    if (isHTML) {
      element.innerHTML = content;
    } else {
      element.textContent = content;
    }
  },

  /**
   * Create table cell with safe content
   * @param {string} content - Cell content
   * @param {Object} options - Cell options
   * @returns {HTMLElement}
   */
  createTableCell(content, options = {}) {
    const td = this.createElement('td', '', {
      class: options.className || '',
      style: options.style || ''
    });

    if (options.isHTML) {
      this.setContent(td, content, true);
    } else {
      td.textContent = content;
    }

    if (options.width) {
      td.style.width = `${options.width}px`;
    }

    if (options.dataAttributes) {
      Object.entries(options.dataAttributes).forEach(([key, value]) => {
        td.dataset[key] = value;
      });
    }

    return td;
  },

  /**
   * Create button element safely
   * @param {string} text - Button text
   * @param {Object} options - Button options
   * @returns {HTMLElement}
   */
  createButton(text, options = {}) {
    const button = this.createElement('button', text, {
      class: options.className || 'btn',
      type: options.type || 'button'
    });

    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }

    if (options.dataAttributes) {
      Object.entries(options.dataAttributes).forEach(([key, value]) => {
        button.dataset[key] = value;
      });
    }

    return button;
  },

  /**
   * Clear element content safely
   * @param {HTMLElement} element - Element to clear
   */
  clearElement(element) {
    if (!element) return;
    
    // Remove event listeners from children
    const children = element.querySelectorAll('*');
    children.forEach(child => {
      // Clone node to remove all event listeners
      const clone = child.cloneNode(true);
      child.parentNode.replaceChild(clone, child);
    });
    
    // Clear content
    element.innerHTML = '';
  },

  /**
   * Append multiple elements
   * @param {HTMLElement} parent - Parent element
   * @param {HTMLElement[]} children - Child elements to append
   */
  appendChildren(parent, children) {
    if (!parent || !Array.isArray(children)) return;
    
    const fragment = document.createDocumentFragment();
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        fragment.appendChild(child);
      }
    });
    parent.appendChild(fragment);
  }
};

// ES modules export
export default DOMUtils;

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
}

// Browser global
if (typeof window !== 'undefined') {
  window.DOMUtils = DOMUtils;
}