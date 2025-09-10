/**
 * Menu Renderer Module
 * Handles safe rendering of table menu items
 */

const MenuRenderer = {
  /**
   * Create menu item element
   * @param {string} text - Menu item text
   * @param {string} action - Data action attribute
   * @param {Object} options - Additional options
   * @returns {HTMLElement}
   */
  createMenuItem(text, action, options = {}) {
    const item = document.createElement('div');
    item.className = 'table-menu-item';
    if (options.className) {
      item.className += ' ' + options.className;
    }
    item.textContent = text;
    item.dataset.action = action;
    
    if (options.dataAttributes) {
      Object.entries(options.dataAttributes).forEach(([key, value]) => {
        item.dataset[key] = value;
      });
    }
    
    return item;
  },

  /**
   * Create submenu item with dropdown
   * @param {string} text - Menu item text
   * @param {string} action - Data action attribute
   * @param {Array} submenuItems - Submenu item configurations
   * @returns {HTMLElement}
   */
  createSubmenuItem(text, action, submenuItems) {
    const container = document.createElement('div');
    container.className = 'table-menu-item table-menu-item-submenu';
    container.dataset.action = action;
    
    // Main text
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    container.appendChild(textSpan);
    
    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'submenu-arrow';
    arrow.textContent = '▶';
    container.appendChild(arrow);
    
    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'table-submenu-dropdown';
    
    submenuItems.forEach(item => {
      const menuItem = this.createMenuItem(item.text, item.action, {
        className: item.isCurrent ? 'table-menu-item-current' : '',
        dataAttributes: item.dataAttributes
      });
      dropdown.appendChild(menuItem);
    });
    
    container.appendChild(dropdown);
    return container;
  },

  /**
   * Create the complete menu structure
   * @param {Object} state - Current table state
   * @param {Object} options - Table options
   * @param {Set} enabledFeatures - Enabled features
   * @returns {HTMLElement}
   */
  createMenu(state, options, enabledFeatures) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-menu-wrapper';
    
    // Menu button
    const button = document.createElement('button');
    button.className = 'table-menu-btn';
    button.dataset.menuToggle = '';
    button.textContent = '⚙️';
    wrapper.appendChild(button);
    
    // Menu dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'table-menu-dropdown';
    dropdown.style.display = 'none';
    
    // Clear filters option
    if (enabledFeatures.has('filtering')) {
      dropdown.appendChild(
        this.createMenuItem('フィルタ全解除', 'clear-all-filters')
      );
    }
    
    // Column settings
    if (enabledFeatures.has('columnSettings')) {
      dropdown.appendChild(
        this.createMenuItem('表示列設定', 'column-settings')
      );
    }
    
    // Font size submenu
    const fontSizes = [
      { text: '最小', size: 'smallest' },
      { text: '小', size: 'small' },
      { text: '中', size: 'medium' },
      { text: '大', size: 'large' },
      { text: '最大', size: 'largest' }
    ];
    
    const fontSizeItems = fontSizes.map(item => ({
      text: `${item.text} ${state.fontSize === item.size ? '✓' : ''}`,
      action: 'font-size',
      isCurrent: state.fontSize === item.size,
      dataAttributes: { size: item.size }
    }));
    
    dropdown.appendChild(
      this.createSubmenuItem('文字サイズ', 'font-size', fontSizeItems)
    );
    
    // Cell padding submenu
    const paddings = [
      { text: '広め', padding: 'wide' },
      { text: '標準', padding: 'standard' },
      { text: '狭め', padding: 'narrow' }
    ];
    
    const paddingItems = paddings.map(item => ({
      text: `${item.text} ${state.cellPadding === item.padding ? '✓' : ''}`,
      action: 'cell-padding',
      isCurrent: state.cellPadding === item.padding,
      dataAttributes: { padding: item.padding }
    }));
    
    dropdown.appendChild(
      this.createSubmenuItem('セル幅', 'cell-padding', paddingItems)
    );
    
    // LocalStorage clear option (always available since plugins may store data)
    dropdown.appendChild(
      this.createMenuItem('LocalStorageクリア', 'clear-localstorage')
    );
    
    wrapper.appendChild(dropdown);
    return wrapper;
  }
};

// Export for use in ExceLikeTable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuRenderer;
}

// Browser global
if (typeof window !== 'undefined') {
  window.MenuRenderer = MenuRenderer;
}