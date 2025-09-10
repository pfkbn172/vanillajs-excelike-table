/**
 * Menu Position Utilities
 * Shared utilities for positioning context menus, dropdowns, and modals
 */

const MenuPositionUtils = {
  /**
   * Position a menu element with intelligent viewport detection
   * @param {HTMLElement} menu - Menu element to position
   * @param {number} x - Initial X coordinate
   * @param {number} y - Initial Y coordinate
   * @param {Object} options - Positioning options
   * @returns {Object} Final position coordinates
   */
  positionMenu(menu, x, y, options = {}) {
    const {
      margin = 10,
      preferredDirection = 'bottom-right',
      fallbackDirections = ['bottom-left', 'top-right', 'top-left'],
      constrainToViewport = true,
      offsetX = 0,
      offsetY = 0
    } = options;

    // Apply initial position
    menu.style.left = `${x + offsetX}px`;
    menu.style.top = `${y + offsetY}px`;
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    
    // Force a reflow to get accurate dimensions
    menu.offsetHeight;
    
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalX = x + offsetX;
    let finalY = y + offsetY;
    let direction = preferredDirection;

    if (constrainToViewport) {
      // Try preferred direction first
      const positions = this.calculatePositions(x, y, rect.width, rect.height, margin);
      const preferredPos = positions[preferredDirection];
      
      if (this.isPositionInViewport(preferredPos, rect.width, rect.height, viewportWidth, viewportHeight, margin)) {
        finalX = preferredPos.x;
        finalY = preferredPos.y;
      } else {
        // Try fallback directions
        let positionFound = false;
        for (const fallbackDir of fallbackDirections) {
          const fallbackPos = positions[fallbackDir];
          if (this.isPositionInViewport(fallbackPos, rect.width, rect.height, viewportWidth, viewportHeight, margin)) {
            finalX = fallbackPos.x;
            finalY = fallbackPos.y;
            direction = fallbackDir;
            positionFound = true;
            break;
          }
        }
        
        // If no good position found, use constrained positioning
        if (!positionFound) {
          finalX = Math.max(margin, Math.min(viewportWidth - rect.width - margin, x));
          finalY = Math.max(margin, Math.min(viewportHeight - rect.height - margin, y));
          direction = 'constrained';
        }
      }
    }

    // Apply final position
    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;
    menu.style.visibility = 'visible';
    
    return {
      x: finalX,
      y: finalY,
      direction,
      rect: {
        width: rect.width,
        height: rect.height
      }
    };
  },

  /**
   * Calculate possible positions for different directions
   * @param {number} x - Reference X coordinate
   * @param {number} y - Reference Y coordinate
   * @param {number} width - Menu width
   * @param {number} height - Menu height
   * @param {number} margin - Margin from reference point
   * @returns {Object} Position coordinates for each direction
   */
  calculatePositions(x, y, width, height, margin) {
    return {
      'bottom-right': { x: x + margin, y: y + margin },
      'bottom-left': { x: x - width - margin, y: y + margin },
      'top-right': { x: x + margin, y: y - height - margin },
      'top-left': { x: x - width - margin, y: y - height - margin },
      'right': { x: x + margin, y: y - (height / 2) },
      'left': { x: x - width - margin, y: y - (height / 2) },
      'bottom': { x: x - (width / 2), y: y + margin },
      'top': { x: x - (width / 2), y: y - height - margin }
    };
  },

  /**
   * Check if a position fits within the viewport
   * @param {Object} position - Position object with x, y
   * @param {number} width - Menu width
   * @param {number} height - Menu height
   * @param {number} viewportWidth - Viewport width
   * @param {number} viewportHeight - Viewport height
   * @param {number} margin - Required margin
   * @returns {boolean} Whether position fits in viewport
   */
  isPositionInViewport(position, width, height, viewportWidth, viewportHeight, margin) {
    return (
      position.x >= margin &&
      position.y >= margin &&
      position.x + width <= viewportWidth - margin &&
      position.y + height <= viewportHeight - margin
    );
  },

  /**
   * Position a submenu relative to a parent menu item
   * @param {HTMLElement} submenu - Submenu to position
   * @param {HTMLElement} parentItem - Parent menu item
   * @param {Object} options - Positioning options
   * @returns {Object} Position information
   */
  positionSubmenu(submenu, parentItem, options = {}) {
    const {
      margin = 5,
      preferHorizontal = true
    } = options;

    const parentRect = parentItem.getBoundingClientRect();
    const x = preferHorizontal ? parentRect.right : parentRect.left;
    const y = preferHorizontal ? parentRect.top : parentRect.bottom;

    return this.positionMenu(submenu, x, y, {
      margin,
      preferredDirection: preferHorizontal ? 'bottom-right' : 'bottom',
      fallbackDirections: preferHorizontal 
        ? ['bottom-left', 'top-right', 'top-left']
        : ['top', 'bottom-right', 'bottom-left'],
      ...options
    });
  },

  /**
   * Position a modal dialog in the center of the viewport
   * @param {HTMLElement} modal - Modal element to position
   * @param {Object} options - Positioning options
   * @returns {Object} Position information
   */
  positionModal(modal, options = {}) {
    const {
      centerX = true,
      centerY = true,
      offsetX = 0,
      offsetY = 0
    } = options;

    modal.style.visibility = 'hidden';
    modal.style.display = 'flex';
    
    // Force reflow
    modal.offsetHeight;
    
    const rect = modal.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = centerX ? (viewportWidth - rect.width) / 2 : 50;
    let y = centerY ? (viewportHeight - rect.height) / 2 : 50;
    
    x += offsetX;
    y += offsetY;
    
    // Ensure modal stays within viewport
    x = Math.max(20, Math.min(viewportWidth - rect.width - 20, x));
    y = Math.max(20, Math.min(viewportHeight - rect.height - 20, y));
    
    modal.style.left = `${x}px`;
    modal.style.top = `${y}px`;
    modal.style.visibility = 'visible';
    
    return {
      x,
      y,
      centered: { x: centerX, y: centerY },
      rect: {
        width: rect.width,
        height: rect.height
      }
    };
  },

  /**
   * Get the safe area for positioning (avoiding system UI)
   * @returns {Object} Safe area bounds
   */
  getSafeArea() {
    return {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  /**
   * Add smart positioning to any element
   * @param {HTMLElement} element - Element to make smart
   * @param {Object} options - Smart positioning options
   */
  makeElementSmart(element, options = {}) {
    const {
      trigger = 'contextmenu',
      hideOnScroll = true,
      hideOnResize = true
    } = options;

    let isVisible = false;
    
    const hide = () => {
      if (isVisible) {
        element.style.display = 'none';
        isVisible = false;
      }
    };

    const show = (event) => {
      event.preventDefault();
      
      const x = event.clientX;
      const y = event.clientY;
      
      element.style.display = 'block';
      this.positionMenu(element, x, y, options);
      isVisible = true;
    };

    // Add event listeners
    if (trigger === 'contextmenu') {
      document.addEventListener('contextmenu', show);
    }
    
    document.addEventListener('click', hide);
    
    if (hideOnScroll) {
      window.addEventListener('scroll', hide);
    }
    
    if (hideOnResize) {
      window.addEventListener('resize', hide);
    }
    
    return {
      show,
      hide,
      destroy: () => {
        document.removeEventListener('contextmenu', show);
        document.removeEventListener('click', hide);
        window.removeEventListener('scroll', hide);
        window.removeEventListener('resize', hide);
      }
    };
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuPositionUtils;
}

if (typeof window !== 'undefined') {
  window.MenuPositionUtils = MenuPositionUtils;
}