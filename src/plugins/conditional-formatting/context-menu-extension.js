/**
 * Context Menu Extension for Conditional Formatting
 * Adds right-click context menu support for conditional formatting operations
 */

class ContextMenuExtension {
  constructor(pluginInstance) {
    this.plugin = pluginInstance;
    this.table = pluginInstance.table;
    this.currentMenu = null;
    this.selectedCells = new Set();
    this.lastRightClickedCell = null;
    
    // Initialize shared dependencies
    const { Config, Utils } = this.getSharedDependencies();
    this.config = Config || {};
    
    // Safely initialize utils
    if (Utils) {
      try {
        this.utils = new Utils(this.config);
      } catch (error) {
        this.utils = this.createFallbackUtils();
      }
    } else {
      this.utils = this.createFallbackUtils();
    }
    
    // Get configuration values
    this.starIconColor = this.config.colors?.starIcon || '#FF8C00';
    this.spacing = this.config.spacing || {};
    this.iconSets = this.config.iconSets || {};
    this.colors = this.config.colors || {};
    
    // Initialize context menu with error handling
    try {
      this.initializeContextMenu();
    } catch (error) {
      console.error('[ContextMenuExtension] Initialization failed:', error);
    }
  }
  
  /**
   * Get shared dependencies
   */
  getSharedDependencies() {
    if (typeof window !== 'undefined') {
      return {
        Config: window.ConditionalFormattingConfig,
        Utils: window.ConditionalFormattingUtils
      };
    } else if (typeof require !== 'undefined') {
      try {
        return {
          Config: require('./config'),
          Utils: require('./utils')
        };
      } catch (e) {
        return {};
      }
    }
    return {};
  }
  
  /**
   * Create fallback utils for when shared utils are not available
   */
  createFallbackUtils() {
    return {
      parseNumeric: (value) => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return NaN;
        
        const cleaned = value.replace(/[^\d.-]/g, '');
        return parseFloat(cleaned);
      },
      
      isNumeric: (value) => {
        if (typeof value === 'number') return !isNaN(value) && isFinite(value);
        if (typeof value === 'string') {
          const num = parseFloat(value.replace(/[^\d.-]/g, ''));
          return !isNaN(num) && isFinite(num);
        }
        return false;
      },
      
      detectColumnType: (values) => {
        if (!Array.isArray(values) || values.length === 0) return 'text';
        
        const sample = values.slice(0, 10);
        let numericCount = 0;
        let dateCount = 0;
        
        const isNumericLocal = (val) => {
          if (typeof val === 'number') return !isNaN(val) && isFinite(val);
          if (typeof val === 'string') {
            const num = parseFloat(val.replace(/[^\d.-]/g, ''));
            return !isNaN(num) && isFinite(num);
          }
          return false;
        };
        
        for (const value of sample) {
          if (isNumericLocal(value)) {
            numericCount++;
          } else if (Date.parse(value) && !isNaN(Date.parse(value))) {
            dateCount++;
          }
        }
        
        if (numericCount > sample.length * 0.6) return 'number';
        if (dateCount > sample.length * 0.6) return 'date';
        return 'text';
      }
    };
  }
  
  /**
   * Initialize context menu system
   */
  initializeContextMenu() {
    try {
      this.addContextMenuStyles();
      this.bindContextMenuEvents();
    } catch (error) {
      console.error('[ContextMenuExtension] Setup error:', error);
      throw error;
    }
  }
  
  /**
   * Add CSS styles for context menu
   */
  addContextMenuStyles() {
    const css = `
      .cf-context-menu {
        position: fixed;
        background: white;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        min-width: 200px;
        padding: 4px 0;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      
      .cf-context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        color: #262626;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .cf-context-menu-item:hover {
        background-color: #f5f5f5;
      }
      
      .cf-context-menu-item.disabled {
        color: #bfbfbf;
        cursor: not-allowed;
      }
      
      .cf-context-menu-item.disabled:hover {
        background-color: transparent;
      }
      
      .cf-context-menu-separator {
        height: 1px;
        background-color: #f0f0f0;
        margin: 4px 0;
      }
      
      .cf-context-menu-icon {
        margin-right: 8px;
        width: 16px;
        text-align: center;
      }
      
      .cf-context-menu-submenu {
        position: relative;
      }
      
      .cf-context-menu-submenu::after {
        content: '▶';
        font-size: 10px;
        color: #8c8c8c;
      }
      
      .cf-context-submenu {
        position: absolute;
        display: none;  /* Initially hidden */
        background: white;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 180px;
        padding: 4px 0;
        display: none;
      }
      
      /* Submenu visibility is now controlled by JavaScript */
      
      /* Highlight for selected cells */
      .cf-cell-selected {
        background-color: rgba(24, 144, 255, 0.1) !important;
      }
      
      .cf-cell-right-clicked {
        background-color: rgba(24, 144, 255, 0.2) !important;
      }
      
      .cf-enhanced-option {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        font-weight: 500;
      }
      
      .cf-enhanced-option:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .cf-enhanced-option .cf-context-menu-icon {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }
    `;
    
    // Add CSS to page
    let styleElement = document.getElementById('cf-context-menu-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'cf-context-menu-styles';
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    }
  }
  
  /**
   * Bind context menu events
   */
  bindContextMenuEvents() {
    if (!this.table.container) {
      console.error('[ContextMenuExtension] Table container is null or undefined!');
      return;
    }
    
    // Add context menu event listener to table container
    this.contextMenuHandler = (e) => {
      this.handleContextMenu(e);
    };
    
    this.table.container.addEventListener('contextmenu', this.contextMenuHandler);
    
    // Close context menu on click outside
    this.clickOutsideHandler = (e) => {
      if (this.currentMenu && !this.currentMenu.contains(e.target)) {
        this.closeContextMenu();
      }
    };
    document.addEventListener('click', this.clickOutsideHandler);
    
    // Close context menu on scroll
    this.scrollHandler = () => {
      this.closeContextMenu();
    };
    this.table.container.addEventListener('scroll', this.scrollHandler);
    
    // Handle cell selection for multi-cell operations
    this.cellClickHandler = (e) => {
      this.handleCellSelection(e);
    };
    this.table.container.addEventListener('click', this.cellClickHandler);
  }
  
  /**
   * Handle context menu event
   * @param {Event} e - Context menu event
   */
  handleContextMenu(e) {
    e.preventDefault();
    
    // Find the cell that was right-clicked
    const cell = e.target.closest('td, th');
    if (!cell) {
      return;
    }
    
    // Get cell information
    const cellInfo = this.getCellInfo(cell);
    if (!cellInfo) {
      return;
    }
    
    // Update cell selection
    this.updateCellSelection(cell, cellInfo, e);
    
    // Create and show context menu
    this.showContextMenu(e.clientX, e.clientY, cellInfo);
  }
  
  /**
   * Get cell information
   * @param {HTMLElement} cell - Cell element
   * @returns {Object|null} Cell information
   */
  getCellInfo(cell) {
    const row = cell.closest('tr');
    if (!row) return null;
    
    const rowIndex = Array.from(row.parentElement.children).indexOf(row);
    const columnIndex = Array.from(row.children).indexOf(cell);
    
    // Get column info
    const columns = this.table.options.columns || [];
    const column = columns[columnIndex];
    
    // Get row data
    const tableRows = Array.from(this.table.container.querySelectorAll('tbody tr'));
    const dataRowIndex = tableRows.indexOf(row);
    const rowData = this.table.data && this.table.data[dataRowIndex] ? this.table.data[dataRowIndex] : {};
    
    
    return {
      element: cell,
      rowIndex,
      columnIndex,
      dataRowIndex,
      column,
      rowData,
      cellValue: cell.textContent || cell.innerText,
      isHeader: cell.tagName.toLowerCase() === 'th'
    };
  }
  
  /**
   * Update cell selection
   * @param {HTMLElement} cell - Cell element
   * @param {Object} cellInfo - Cell information
   * @param {Event} e - Event
   */
  updateCellSelection(cell, cellInfo, e) {
    // Clear previous right-click highlight
    if (this.lastRightClickedCell) {
      this.lastRightClickedCell.classList.remove('cf-cell-right-clicked');
    }
    
    // Highlight right-clicked cell
    cell.classList.add('cf-cell-right-clicked');
    this.lastRightClickedCell = cell;
    
    // If Ctrl/Cmd is held, add to selection, otherwise replace selection
    if (!e.ctrlKey && !e.metaKey) {
      this.clearCellSelection();
    }
    
    this.selectedCells.add(cellInfo);
  }
  
  /**
   * Handle cell selection (left click)
   * @param {Event} e - Click event
   */
  handleCellSelection(e) {
    const cell = e.target.closest('td, th');
    if (!cell) return;
    
    const cellInfo = this.getCellInfo(cell);
    if (!cellInfo) return;
    
    if (e.ctrlKey || e.metaKey) {
      // Add to selection
      if (this.isCellSelected(cellInfo)) {
        this.removeCellFromSelection(cellInfo);
      } else {
        this.addCellToSelection(cellInfo);
      }
    } else {
      // Replace selection
      this.clearCellSelection();
      this.addCellToSelection(cellInfo);
    }
  }
  
  /**
   * Show context menu
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} cellInfo - Cell information
   */
  showContextMenu(x, y, cellInfo) {
    this.closeContextMenu();
    
    const menu = this.createContextMenu(cellInfo);
    document.body.appendChild(menu);
    
    // Position menu
    this.positionMenu(menu, x, y);
    
    this.currentMenu = menu;
    
    // Setup submenu interactions
    this.setupSubmenuInteractions(menu);
  }
  
  /**
   * Create context menu
   * @param {Object} cellInfo - Cell information
   * @returns {HTMLElement} Menu element
   */
  createContextMenu(cellInfo) {
    const menu = document.createElement('div');
    menu.className = 'cf-context-menu';
    
    // Conditional formatting options
    if (!cellInfo.isHeader) {
      menu.appendChild(this.createMenuItem({
        text: 'Conditional Formatting',
        icon: '🎨',
        submenu: this.createConditionalFormattingSubmenu(cellInfo)
      }));
      
      menu.appendChild(this.createSeparator());
    }
    
    // Rule management
    menu.appendChild(this.createMenuItem({
      text: 'Manage Rules...',
      icon: '⚙️',
      action: 'manage-rules'
    }));
    
    // Clear formatting
    const hasFormatting = this.plugin.hasConditionalFormatting(cellInfo);
    menu.appendChild(this.createMenuItem({
      text: 'Clear Conditional Formatting',
      icon: '🗑️',
      action: 'clear-formatting',
      disabled: !hasFormatting
    }));
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      this.handleMenuClick(e, cellInfo);
    });
    
    return menu;
  }
  
  /**
   * Create conditional formatting submenu
   * @param {Object} cellInfo - Cell information
   * @returns {HTMLElement} Submenu element
   */
  createConditionalFormattingSubmenu(cellInfo) {
    const submenu = document.createElement('div');
    submenu.className = 'cf-context-submenu';
    
    // New Rule Builder
    submenu.appendChild(this.createMenuItem({
      text: 'New Rule...',
      icon: '✨',
      action: 'new-rule'
    }));
    
    submenu.appendChild(this.createSeparator());
    
    // Get data types of target columns
    const columnDataTypes = this.getColumnDataTypes(cellInfo);
    
    // Quick formatting options with data type requirements
    const quickFormats = [
      { 
        text: 'Highlight Cells Rules...', 
        action: 'highlight-cells', 
        icon: '🎯',
        supportedTypes: ['text', 'number', 'date'] // Works with all types
      },
      { 
        text: 'Top/Bottom Rules...', 
        action: 'top-bottom', 
        icon: '📊',
        supportedTypes: ['number', 'date'] // Works with numbers and dates
      },
      { 
        text: 'Data Bars...', 
        action: 'data-bars', 
        icon: '📶',
        supportedTypes: ['number'] // Numbers only
      },
      { 
        text: 'Color Scales...', 
        action: 'color-scales', 
        icon: '🌈',
        supportedTypes: ['number'] // Numbers only
      },
      { 
        text: 'Icon Sets...', 
        action: 'icon-sets', 
        icon: '🔢',
        supportedTypes: ['number'] // Numbers only
      }
    ];
    
    quickFormats.forEach(format => {
      // Check if any of the target columns support this format type
      const isSupported = format.supportedTypes.some(type => {
        if (type === 'text' && columnDataTypes.hasText) return true;
        if (type === 'number' && columnDataTypes.hasNumeric) return true;
        if (type === 'date' && columnDataTypes.hasDate) return true;
        return false;
      });
      
      if (!isSupported) {
        return; // Don't add this menu item
      }
      
      const menuItem = this.createMenuItem(format);
      submenu.appendChild(menuItem);
    });
    
    submenu.appendChild(this.createSeparator());
    
    
    // Add click event listener directly to submenu to handle all submenu items
    submenu.addEventListener('click', (e) => {
      const item = e.target.closest('.cf-context-menu-item');
      if (!item || item.classList.contains('disabled')) return;
      
      const action = item.dataset.action;
      if (!action) return;
      
      e.stopPropagation();
      
      // Execute action with cellInfo context
      this.executeMenuAction(action, cellInfo);
      
      // Close menu
      this.closeContextMenu();
    });
    
    return submenu;
  }
  
  /**
   * Create menu item
   * @param {Object} options - Menu item options
   * @returns {HTMLElement} Menu item element
   */
  createMenuItem(options) {
    const item = document.createElement('div');
    
    if (options.submenu) {
      item.className = 'cf-context-menu-item cf-context-menu-submenu';
      item.style.position = 'relative';
    } else {
      item.className = 'cf-context-menu-item';
    }
    
    if (options.disabled) {
      item.classList.add('disabled');
    }
    
    if (options.action) {
      item.dataset.action = options.action;
    }
    
    // Create content
    const content = document.createElement('span');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    
    if (options.icon) {
      const icon = document.createElement('span');
      icon.className = 'cf-context-menu-icon';
      icon.textContent = options.icon;
      content.appendChild(icon);
    }
    
    const text = document.createElement('span');
    text.textContent = options.text;
    content.appendChild(text);
    
    item.appendChild(content);
    
    // Add submenu and arrow if needed
    if (options.submenu) {
      // Add submenu arrow
      const arrow = document.createElement('span');
      arrow.className = 'cf-submenu-arrow';
      arrow.textContent = '▶';
      arrow.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #8c8c8c;
      `;
      item.appendChild(arrow);
      
      // Add submenu
      item.appendChild(options.submenu);
    }
    
    return item;
  }
  
  /**
   * Create separator
   * @returns {HTMLElement} Separator element
   */
  createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'cf-context-menu-separator';
    return separator;
  }
  
  /**
   * Handle menu click
   * @param {Event} e - Click event
   * @param {Object} cellInfo - Cell information
   */
  handleMenuClick(e, cellInfo) {
    const item = e.target.closest('.cf-context-menu-item');
    if (!item || item.classList.contains('disabled')) return;
    
    const action = item.dataset.action;
    if (!action) return;
    
    e.stopPropagation();
    
    // Execute action
    this.executeMenuAction(action, cellInfo);
    
    // Close menu
    this.closeContextMenu();
  }
  
  /**
   * Execute menu action
   * @param {string} action - Action to execute
   * @param {Object} cellInfo - Cell information
   */
  executeMenuAction(action, cellInfo) {
    try {
      const selectedCells = this.getSelectedCells();
      let targetColumns = this.getSelectedColumns(selectedCells);
      
      // If no cells are selected, use the current cell's column
      if (targetColumns.length === 0 && cellInfo) {
        targetColumns = [cellInfo.column?.key || cellInfo.columnIndex];
      }
      
      switch (action) {
        case 'new-rule':
          // Use enhanced dialog if available, otherwise fallback to standard
          if (this.plugin.showEnhancedDialog) {
            this.plugin.showEnhancedDialog();
          } else {
            this.plugin.uiManager.showFormattingDialog({
              selectedColumns: targetColumns,
              cellData: cellInfo
            });
          }
          break;
          
        case 'highlight-cells':
          this.showHighlightCellsDialog(cellInfo, targetColumns);
          break;
          
        case 'top-bottom':
          this.showTopBottomDialog(cellInfo, targetColumns);
          break;
          
        case 'data-bars':
          this.showDataBarsDialog(cellInfo, targetColumns);
          break;
          
        case 'color-scales':
          this.showColorScalesDialog(cellInfo, targetColumns);
          break;
          
        case 'icon-sets':
          this.showIconSetsDialog(cellInfo, targetColumns);
          break;
          
        case 'manage-rules':
          this.showManageRulesDialog();
          break;
          
        case 'clear-formatting':
          this.clearFormattingFromSelection(selectedCells.length > 0 ? selectedCells : [cellInfo]);
          break;
          
        default:
      }
    } catch (error) {
      console.error(`[ContextMenuExtension] Error executing action ${action}:`, error);
    }
  }
  
  /**
   * Show quick highlight cells dialog
   * @param {Object} cellInfo - Cell information
   * @param {Array} targetColumns - Target columns
   */
  showHighlightCellsDialog(cellInfo, targetColumns) {
    // Create a quick rule for highlighting cells equal to the current value
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule, OPERATORS } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) return;
    
    // Alternative approach: Use the cell's actual text content directly
    const cellValue = cellInfo.cellValue || cellInfo.element.textContent || cellInfo.element.innerText;
    
    // Also try to match by cell index if column key matching fails
    const alternativeTargets = [
      cellInfo.column?.key,
      cellInfo.columnIndex,
      cellInfo.columnIndex.toString()
    ].filter(Boolean);
    
    
    const rule = new ConditionalFormattingRule({
      name: `Highlight cells equal to "${cellValue}"`,
      targetColumns: alternativeTargets.length > 0 ? alternativeTargets : targetColumns,
      operator: OPERATORS.EQUALS,
      value: cellValue,
      formatType: 'basic', // Specify format type for ManageRule
      format: {
        backgroundColor: '#fff2cc',
        textColor: '#7f6000'
      }
    });
    
    
    this.plugin.addRule(rule);
    this.plugin.refreshFormatting();
  }
  
  /**
   * Show top/bottom rules dialog
   * @param {Object} cellInfo - Cell information  
   * @param {Array} targetColumns - Target columns
   */
  showTopBottomDialog(cellInfo, targetColumns) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'cf-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'cf-modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      margin: 20px;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Top/Bottom Rules</h3>
      <p style="margin: 0 0 20px 0; color: #666;">対象列: ${targetColumns.join(', ')}</p>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">ルールタイプ:</label>
        <select name="rule-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="top-items">Top N Items (上位N件)</option>
          <option value="top-percent">Top N% (上位N%)</option>
          <option value="above-average">Above Average (平均より上)</option>
          <option value="bottom-items">Bottom N Items (下位N件)</option>
          <option value="bottom-percent">Bottom N% (下位N%)</option>
          <option value="below-average">Below Average (平均より下)</option>
        </select>
      </div>
      
      <div id="value-input-container" style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">値:</label>
        <input type="number" name="rule-value" value="10" min="1" max="100" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">書式:</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <label style="display: flex; align-items: center; gap: 4px;">
            背景色:
            <input type="color" name="bg-color" value="#c6efce" 
                   style="width: 40px; height: 32px; border: none; border-radius: 4px;">
          </label>
          <label style="display: flex; align-items: center; gap: 4px;">
            文字色:
            <input type="color" name="text-color" value="#006100" 
                   style="width: 40px; height: 32px; border: none; border-radius: 4px;">
          </label>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cf-modal-cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">キャンセル</button>
        <button class="cf-modal-confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #1890ff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">適用</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Handle rule type change
    const ruleTypeSelect = modalContent.querySelector('select[name="rule-type"]');
    const valueInputContainer = modalContent.querySelector('#value-input-container');
    
    ruleTypeSelect.addEventListener('change', () => {
      const selectedType = ruleTypeSelect.value;
      if (selectedType === 'above-average' || selectedType === 'below-average') {
        valueInputContainer.style.display = 'none';
      } else {
        valueInputContainer.style.display = 'block';
        const input = modalContent.querySelector('input[name="rule-value"]');
        if (selectedType.includes('percent')) {
          input.max = 100;
          input.placeholder = '1-100';
        } else {
          input.max = 1000;
          input.placeholder = '件数';
        }
      }
    });

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    const cancelBtn = modalContent.querySelector('.cf-modal-cancel-btn');
    const confirmBtn = modalContent.querySelector('.cf-modal-confirm-btn');

    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      const ruleType = modalContent.querySelector('select[name="rule-type"]').value;
      const ruleValue = parseInt(modalContent.querySelector('input[name="rule-value"]').value);
      const bgColor = modalContent.querySelector('input[name="bg-color"]').value;
      const textColor = modalContent.querySelector('input[name="text-color"]').value;

      this.createTopBottomRule(targetColumns, ruleType, ruleValue, bgColor, textColor);
      closeModal();
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Trigger initial change event
    ruleTypeSelect.dispatchEvent(new Event('change'));
  }

  createTopBottomRule(targetColumns, ruleType, ruleValue, bgColor, textColor) {
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule, OPERATORS, DATA_TYPES } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) return;

    // Get all values from the target columns for calculation
    const tableInstance = this.plugin.table;
    const tableData = tableInstance.state?.data || tableInstance.options?.data || [];
    let allValues = [];
    
    targetColumns.forEach(columnKey => {
      tableData.forEach((row, index) => {
        const rawValue = row[columnKey];
        
        // Clean up the value for parsing: remove currency symbols, commas, etc.
        let cleanValue = String(rawValue || '').trim();
        cleanValue = cleanValue.replace(/[¥,$円]/g, ''); // Remove ¥, $, commas, 円
        cleanValue = cleanValue.replace(/,/g, ''); // Remove remaining commas
        
        const value = parseFloat(cleanValue);
        if (!isNaN(value)) {
          allValues.push(value);
        }
      });
    });


    if (allValues.length === 0) {
      return;
    }

    allValues.sort((a, b) => b - a); // Sort descending
    
    let operator, value, ruleName;

    switch (ruleType) {
      case 'top-items':
        if (ruleValue >= allValues.length) {
          // If requesting more items than available, use all values
          operator = OPERATORS.IS_NUMBER;
          value = '';
          ruleName = `Top ${allValues.length} items (all values)`;
        } else {
          const threshold = allValues[ruleValue - 1];
          operator = OPERATORS.GREATER_THAN_OR_EQUAL;
          value = threshold.toString();
          ruleName = `Top ${ruleValue} items (>= ${threshold})`;
        }
        break;

      case 'top-percent':
        const topPercentIndex = Math.floor(allValues.length * (ruleValue / 100));
        if (topPercentIndex >= allValues.length) {
          operator = OPERATORS.IS_NUMBER;
          value = '';
          ruleName = `Top ${ruleValue}% (all values)`;
        } else {
          const threshold = allValues[topPercentIndex];
          operator = OPERATORS.GREATER_THAN_OR_EQUAL;
          value = threshold.toString();
          ruleName = `Top ${ruleValue}% (>= ${threshold})`;
        }
        break;

      case 'above-average':
        const average = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
        operator = OPERATORS.GREATER_THAN;
        value = average.toString();
        ruleName = `Above average (> ${average.toFixed(2)})`;
        break;

      case 'bottom-items':
        const bottomValues = [...allValues].reverse(); // Sort ascending for bottom
        if (ruleValue >= bottomValues.length) {
          operator = OPERATORS.IS_NUMBER;
          value = '';
          ruleName = `Bottom ${bottomValues.length} items (all values)`;
        } else {
          const threshold = bottomValues[ruleValue - 1];
          operator = OPERATORS.LESS_THAN_OR_EQUAL;
          value = threshold.toString();
          ruleName = `Bottom ${ruleValue} items (<= ${threshold})`;
        }
        break;

      case 'bottom-percent':
        const bottomPercentIndex = Math.floor(allValues.length * (ruleValue / 100));
        const bottomValues2 = [...allValues].reverse();
        if (bottomPercentIndex >= bottomValues2.length) {
          operator = OPERATORS.IS_NUMBER;
          value = '';
          ruleName = `Bottom ${ruleValue}% (all values)`;
        } else {
          const threshold = bottomValues2[bottomPercentIndex];
          operator = OPERATORS.LESS_THAN_OR_EQUAL;
          value = threshold.toString();
          ruleName = `Bottom ${ruleValue}% (<= ${threshold})`;
        }
        break;

      case 'below-average':
        const avgBelow = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
        operator = OPERATORS.LESS_THAN;
        value = avgBelow.toString();
        ruleName = `Below average (< ${avgBelow.toFixed(2)})`;
        break;

      default:
        return;
    }

    const rule = new ConditionalFormattingRule({
      name: `${ruleName} in ${targetColumns.join(', ')}`,
      targetColumns: targetColumns,
      operator: operator,
      value: value,
      dataType: DATA_TYPES.NUMBER, // Explicitly set data type for numeric comparisons
      formatType: 'basic', // Specify format type for ManageRule
      format: {
        backgroundColor: bgColor,
        textColor: textColor
      }
    });
    
    this.plugin.addRule(rule);
    this.plugin.refreshFormatting();
    
  }
  
  /**
   * Show data bars quick setup
   * @param {Object} cellInfo - Cell information or existing rule for edit
   * @param {Array} targetColumns - Target columns (optional for edit mode)
   */
  showDataBarsDialog(cellInfo, targetColumns) {
    // Handle edit mode - when cellInfo is actually an existing rule
    let isEditMode = false;
    let existingRule = null;
    
    if (cellInfo && cellInfo.id && cellInfo.format && cellInfo.format.dataBar) {
      isEditMode = true;
      existingRule = cellInfo;
      targetColumns = existingRule.targetColumns || [];
      cellInfo = null; // Reset cellInfo for edit mode
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'cf-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'cf-modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      margin: 20px;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Data Bars</h3>
      <p style="margin: 0 0 20px 0; color: #666;">
        対象列: ${targetColumns.join(', ')}<br>
        数値をセル内の横棒グラフで視覚的に表現します
      </p>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">バーの色:</label>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
          <button class="color-option" data-color="#4285f4" style="background: #4285f4; width: 60px; height: 30px; border: 2px solid transparent; border-radius: 4px; cursor: pointer;"></button>
          <button class="color-option" data-color="#34a853" style="background: #34a853; width: 60px; height: 30px; border: 2px solid transparent; border-radius: 4px; cursor: pointer;"></button>
          <button class="color-option" data-color="#fbbc04" style="background: #fbbc04; width: 60px; height: 30px; border: 2px solid transparent; border-radius: 4px; cursor: pointer;"></button>
          <button class="color-option" data-color="#ea4335" style="background: #ea4335; width: 60px; height: 30px; border: 2px solid transparent; border-radius: 4px; cursor: pointer;"></button>
          <button class="color-option" data-color="#9c27b0" style="background: #9c27b0; width: 60px; height: 30px; border: 2px solid transparent; border-radius: 4px; cursor: pointer;"></button>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" name="show-value" checked style="margin: 0;">
          <span>数値を表示する</span>
        </label>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" name="gradient-fill" style="margin: 0;">
          <span>グラデーション塗りつぶし</span>
        </label>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">スケール:</label>
        <select name="bar-scale" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="minMax">自動（最小値〜最大値）</option>
          <option value="zeroToMax">0基準</option>
          <option value="percentile">パーセンタイル</option>
          <option value="custom">カスタム範囲</option>
        </select>
      </div>

      <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">プレビュー:</div>
        <div id="preview-container" style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right;">100</span>
            <div style="position: relative; width: 200px; height: 20px; background: #f0f0f0; border-radius: 2px;">
              <div id="preview-bar-1" style="height: 100%; background: #4285f4; border-radius: 2px; width: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">100</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right;">75</span>
            <div style="position: relative; width: 200px; height: 20px; background: #f0f0f0; border-radius: 2px;">
              <div id="preview-bar-2" style="height: 100%; background: #4285f4; border-radius: 2px; width: 75%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">75</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right;">50</span>
            <div style="position: relative; width: 200px; height: 20px; background: #f0f0f0; border-radius: 2px;">
              <div id="preview-bar-3" style="height: 100%; background: #4285f4; border-radius: 2px; width: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">50</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cf-modal-cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">キャンセル</button>
        <button class="cf-modal-confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #1890ff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">適用</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // State
    let selectedColor = '#4285f4';

    // Color selection
    const colorOptions = modalContent.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      if (option.dataset.color === selectedColor) {
        option.style.border = '2px solid #333';
      }
      
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.style.border = '2px solid transparent');
        option.style.border = '2px solid #333';
        selectedColor = option.dataset.color;
        updatePreview();
      });
    });

    // Preview update
    const updatePreview = () => {
      const showValue = modalContent.querySelector('input[name="show-value"]').checked;
      const gradientFill = modalContent.querySelector('input[name="gradient-fill"]').checked;
      
      const previewBars = [
        modalContent.querySelector('#preview-bar-1'),
        modalContent.querySelector('#preview-bar-2'),
        modalContent.querySelector('#preview-bar-3')
      ];
      
      previewBars.forEach(bar => {
        if (gradientFill) {
          bar.style.background = `linear-gradient(to right, ${selectedColor}22, ${selectedColor})`;
        } else {
          bar.style.background = selectedColor;
        }
        
        if (!showValue) {
          bar.textContent = '';
        } else {
          const value = bar.id === 'preview-bar-1' ? '100' : 
                       bar.id === 'preview-bar-2' ? '75' : '50';
          bar.textContent = value;
        }
      });
    };

    // Event listeners for preview updates
    modalContent.querySelector('input[name="show-value"]').addEventListener('change', updatePreview);
    modalContent.querySelector('input[name="gradient-fill"]').addEventListener('change', updatePreview);

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    const cancelBtn = modalContent.querySelector('.cf-modal-cancel-btn');
    const confirmBtn = modalContent.querySelector('.cf-modal-confirm-btn');

    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      const showValue = modalContent.querySelector('input[name="show-value"]').checked;
      const gradientFill = modalContent.querySelector('input[name="gradient-fill"]').checked;
      const barScale = modalContent.querySelector('select[name="bar-scale"]').value;

      
      this.createDataBarsRule(targetColumns, selectedColor, showValue, gradientFill, barScale);
      closeModal();
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Initialize preview
    updatePreview();
  }

  createDataBarsRule(targetColumns, color, showValue, gradientFill, barScale) {
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule, OPERATORS, DATA_TYPES } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) return;

    const rule = new ConditionalFormattingRule({
      name: `Data bars for ${targetColumns.join(', ')}`,
      targetColumns: targetColumns,
      operator: OPERATORS.IS_NUMBER,
      dataType: DATA_TYPES.NUMBER,
      formatType: 'dataBar', // Specify format type for ManageRule
      format: {
        dataBar: {
          color: color,
          showValue: showValue,
          gradientFill: gradientFill,
          calculationMethod: barScale
        }
      }
    });
    
    
    this.plugin.addRule(rule);
    this.plugin.refreshFormatting();
  }
  
  /**
   * Show color scales dialog
   * @param {Object} cellInfo - Cell information
   * @param {Array} targetColumns - Target columns
   */
  showColorScalesDialog(cellInfo, targetColumns) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'cf-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'cf-modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      margin: 20px;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Color Scales</h3>
      <p style="margin: 0 0 20px 0; color: #666;">
        対象列: ${targetColumns.join(', ')}<br>
        数値を背景色のグラデーションで視覚化します
      </p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 500;">カラーセットを選択:</label>
        
        <!-- Color Scale Type Selection -->
        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
            <input type="radio" name="scale-type" value="preset" checked style="margin: 0;">
            <span style="font-weight: 500;">プリセット</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="scale-type" value="custom" style="margin: 0;">
            <span style="font-weight: 500;">カスタム（2色グラデーション）</span>
          </label>
        </div>

        <!-- Preset Color Scales -->
        <div id="preset-colors" style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Red-Yellow-Green Scale -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px; border: 2px solid transparent; border-radius: 6px;" class="color-scale-option" data-colors="#ea4335,#fbbc04,#34a853">
            <input type="radio" name="color-scale" value="red-yellow-green" checked style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex;">
                <div style="width: 30px; height: 20px; background: #ea4335; border-radius: 3px 0 0 3px;"></div>
                <div style="width: 30px; height: 20px; background: #fbbc04;"></div>
                <div style="width: 30px; height: 20px; background: #34a853; border-radius: 0 3px 3px 0;"></div>
              </div>
              <span style="font-weight: 500;">赤 → 黄 → 緑</span>
            </div>
          </label>
          
          <!-- Red-White-Blue Scale -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px; border: 2px solid transparent; border-radius: 6px;" class="color-scale-option" data-colors="#ea4335,#ffffff,#4285f4">
            <input type="radio" name="color-scale" value="red-white-blue" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex;">
                <div style="width: 30px; height: 20px; background: #ea4335; border-radius: 3px 0 0 3px; border: 1px solid #ddd;"></div>
                <div style="width: 30px; height: 20px; background: #ffffff; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;"></div>
                <div style="width: 30px; height: 20px; background: #4285f4; border-radius: 0 3px 3px 0; border: 1px solid #ddd;"></div>
              </div>
              <span style="font-weight: 500;">赤 → 白 → 青</span>
            </div>
          </label>
          
          <!-- Blue-White-Red Scale -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px; border: 2px solid transparent; border-radius: 6px;" class="color-scale-option" data-colors="#4285f4,#ffffff,#ea4335">
            <input type="radio" name="color-scale" value="blue-white-red" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex;">
                <div style="width: 30px; height: 20px; background: #4285f4; border-radius: 3px 0 0 3px; border: 1px solid #ddd;"></div>
                <div style="width: 30px; height: 20px; background: #ffffff; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;"></div>
                <div style="width: 30px; height: 20px; background: #ea4335; border-radius: 0 3px 3px 0; border: 1px solid #ddd;"></div>
              </div>
              <span style="font-weight: 500;">青 → 白 → 赤</span>
            </div>
          </label>
          
          <!-- Green-Yellow-Red Scale -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px; border: 2px solid transparent; border-radius: 6px;" class="color-scale-option" data-colors="#34a853,#fbbc04,#ea4335">
            <input type="radio" name="color-scale" value="green-yellow-red" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="display: flex;">
                <div style="width: 30px; height: 20px; background: #34a853; border-radius: 3px 0 0 3px;"></div>
                <div style="width: 30px; height: 20px; background: #fbbc04;"></div>
                <div style="width: 30px; height: 20px; background: #ea4335; border-radius: 0 3px 3px 0;"></div>
              </div>
              <span style="font-weight: 500;">緑 → 黄 → 赤</span>
            </div>
          </label>
        </div>

        <!-- Custom Color Picker -->
        <div id="custom-colors" style="display: none; padding: 16px; background: #f8f8f8; border-radius: 6px;">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <label style="font-size: 14px; font-weight: 500;">最小値の色</label>
              <input type="color" id="min-color" value="#ff6b6b" style="width: 60px; height: 40px; border: none; border-radius: 4px; cursor: pointer;">
            </div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <div style="width: 100px; height: 20px; background: linear-gradient(to right, #ff6b6b, #4ecdc4); border-radius: 10px; border: 1px solid #ddd;" id="gradient-preview"></div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <label style="font-size: 14px; font-weight: 500;">最大値の色</label>
              <input type="color" id="max-color" value="#4ecdc4" style="width: 60px; height: 40px; border: none; border-radius: 4px; cursor: pointer;">
            </div>
          </div>
          <div style="font-size: 12px; color: #666; text-align: center;">
            カラーピッカーで開始色と終了色を選択してください
          </div>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">プレビュー:</div>
        <div id="color-scale-preview" style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">高</span>
            <div style="width: 200px; height: 16px; background: #34a853; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">100</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">中</span>
            <div style="width: 200px; height: 16px; background: #fbbc04; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: black; font-size: 11px;">50</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">低</span>
            <div style="width: 200px; height: 16px; background: #ea4335; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">0</div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cf-modal-cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">キャンセル</button>
        <button class="cf-modal-confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #1890ff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">適用</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Update preview function
    const updatePreview = () => {
      const scaleType = modalContent.querySelector('input[name="scale-type"]:checked').value;
      const previewContainer = modalContent.querySelector('#color-scale-preview');
      
      if (scaleType === 'preset') {
        const selectedOption = modalContent.querySelector('input[name="color-scale"]:checked');
        if (!selectedOption) return;
        
        const colors = selectedOption.closest('.color-scale-option').dataset.colors.split(',');
        
        if (colors.length === 3) {
          const [lowColor, midColor, highColor] = colors;
          previewContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 40px; text-align: right; font-size: 12px;">高</span>
              <div style="width: 200px; height: 16px; background: ${highColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">100</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 40px; text-align: right; font-size: 12px;">中</span>
              <div style="width: 200px; height: 16px; background: ${midColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: black; font-size: 11px;">50</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 40px; text-align: right; font-size: 12px;">低</span>
              <div style="width: 200px; height: 16px; background: ${lowColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">0</div>
            </div>
          `;
        }
      } else {
        // Custom colors preview
        const minColor = modalContent.querySelector('#min-color').value;
        const maxColor = modalContent.querySelector('#max-color').value;
        
        // Create gradient steps for preview
        const rgb1 = hexToRgb(minColor);
        const rgb2 = hexToRgb(maxColor);
        const midColor = `rgb(${Math.round((rgb1.r + rgb2.r) / 2)}, ${Math.round((rgb1.g + rgb2.g) / 2)}, ${Math.round((rgb1.b + rgb2.b) / 2)})`;
        
        previewContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">高</span>
            <div style="width: 200px; height: 16px; background: ${maxColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">100</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">中</span>
            <div style="width: 200px; height: 16px; background: ${midColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: black; font-size: 11px;">50</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">低</span>
            <div style="width: 200px; height: 16px; background: ${minColor}; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">0</div>
          </div>
        `;
      }
    };

    // Hex to RGB conversion helper
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Update gradient preview for custom colors
    const updateGradientPreview = () => {
      const minColor = modalContent.querySelector('#min-color').value;
      const maxColor = modalContent.querySelector('#max-color').value;
      const gradientPreview = modalContent.querySelector('#gradient-preview');
      gradientPreview.style.background = `linear-gradient(to right, ${minColor}, ${maxColor})`;
    };

    // Handle scale type switching
    const scaleTypeRadios = modalContent.querySelectorAll('input[name="scale-type"]');
    scaleTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const presetSection = modalContent.querySelector('#preset-colors');
        const customSection = modalContent.querySelector('#custom-colors');
        
        if (radio.value === 'preset') {
          presetSection.style.display = 'flex';
          customSection.style.display = 'none';
        } else {
          presetSection.style.display = 'none';
          customSection.style.display = 'block';
          updateGradientPreview();
        }
        updatePreview();
      });
    });

    // Handle preset color selection and highlight
    const colorOptions = modalContent.querySelectorAll('.color-scale-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove highlight from all options
        colorOptions.forEach(opt => {
          opt.style.border = '2px solid transparent';
          opt.style.background = 'transparent';
        });
        // Highlight selected option
        option.style.border = '2px solid #1890ff';
        option.style.background = 'rgba(24, 144, 255, 0.1)';
        updatePreview();
      });
    });

    // Handle custom color picker changes
    const minColorPicker = modalContent.querySelector('#min-color');
    const maxColorPicker = modalContent.querySelector('#max-color');
    
    minColorPicker.addEventListener('change', () => {
      updateGradientPreview();
      updatePreview();
    });
    
    maxColorPicker.addEventListener('change', () => {
      updateGradientPreview();
      updatePreview();
    });

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    const cancelBtn = modalContent.querySelector('.cf-modal-cancel-btn');
    const confirmBtn = modalContent.querySelector('.cf-modal-confirm-btn');

    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      const scaleType = modalContent.querySelector('input[name="scale-type"]:checked').value;
      let colors;
      
      if (scaleType === 'preset') {
        const selectedOption = modalContent.querySelector('input[name="color-scale"]:checked');
        if (selectedOption) {
          colors = selectedOption.closest('.color-scale-option').dataset.colors.split(',');
        }
      } else {
        // Custom colors - create 2-color array
        const minColor = modalContent.querySelector('#min-color').value;
        const maxColor = modalContent.querySelector('#max-color').value;
        colors = [minColor, maxColor];
      }
      
      if (colors && colors.length > 0) {
        this.createColorScaleRule(targetColumns, colors);
        closeModal();
      }
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Initialize preview and selection
    colorOptions[0].click(); // Select first option by default
    updateGradientPreview(); // Initialize gradient preview
  }

  /**
   * Create color scale rule
   * @param {Array} targetColumns - Target columns
   * @param {Array} colors - Array of colors [low, mid, high]
   */
  createColorScaleRule(targetColumns, colors) {
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule, OPERATORS, DATA_TYPES } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) return;

    const rule = new ConditionalFormattingRule({
      name: `Color scale for ${targetColumns.join(', ')}`,
      targetColumns: targetColumns,
      operator: OPERATORS.IS_NUMBER,
      dataType: DATA_TYPES.NUMBER,
      formatType: 'colorScale', // Specify format type for ManageRule
      format: {
        colorScale: {
          colors: colors
        }
      }
    });
    
    this.plugin.addRule(rule);
    this.plugin.refreshFormatting();
  }
  
  /**
   * Show icon sets dialog
   * @param {Object} cellInfo - Cell information or existing rule for edit
   * @param {Array} targetColumns - Target columns (optional for edit mode)
   */
  showIconSetsDialog(cellInfo, targetColumns) {
    // Handle edit mode - when cellInfo is actually an existing rule
    let isEditMode = false;
    let existingRule = null;
    
    if (cellInfo && cellInfo.id && cellInfo.format && cellInfo.format.iconSet) {
      isEditMode = true;
      existingRule = cellInfo;
      targetColumns = existingRule.targetColumns || [];
      cellInfo = null; // Reset cellInfo for edit mode
    }
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'cf-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'cf-modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 550px;
      max-height: 80vh;
      overflow-y: auto;
      margin: 20px;
    `;

    // Get star color for template
    const starColor = this.starIconColor || '#FF8C00';
    
    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">${isEditMode ? 'Edit Icon Sets' : 'Icon Sets'}</h3>
      <p style="margin: 0 0 20px 0; color: #666;">
        対象列: ${targetColumns.join(', ')}<br>
        数値を3段階のアイコンで視覚的に表現します${isEditMode ? ' (編集モード)' : ''}
      </p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 500;">アイコンセットを選択:</label>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Traffic Lights -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid transparent; border-radius: 6px;" class="icon-set-option" data-icons="🔴,🟡,🟢" data-type="traffic-lights">
            <input type="radio" name="icon-set" value="traffic-lights" checked style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; gap: 8px; font-size: 20px;">
                <span>🔴</span>
                <span>🟡</span>
                <span>🟢</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">信号機</span>
                <span style="font-size: 12px; color: #666;">赤：低い値、黄：中間値、緑：高い値</span>
              </div>
            </div>
          </label>
          
          <!-- Arrows -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid transparent; border-radius: 6px;" class="icon-set-option" data-icons="↓,→,↑" data-type="arrows">
            <input type="radio" name="icon-set" value="arrows" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; gap: 8px; font-size: 20px;">
                <span>↓</span>
                <span>→</span>
                <span>↑</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">矢印</span>
                <span style="font-size: 12px; color: #666;">下矢印：下降、横矢印：横ばい、上矢印：上昇</span>
              </div>
            </div>
          </label>
          
          <!-- Stars -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid transparent; border-radius: 6px;" class="icon-set-option" data-icons="★☆☆☆☆,★★☆☆☆,★★★☆☆,★★★★☆,★★★★★" data-type="stars">
            <input type="radio" name="icon-set" value="stars" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 16px;">
                <span class="star-option-icon">★☆☆☆☆</span>
                <span class="star-option-icon">★★☆☆☆</span>  
                <span class="star-option-icon">★★★☆☆</span>
                <span class="star-option-icon">★★★★☆</span>
                <span class="star-option-icon">★★★★★</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">星評価</span>
                <span style="font-size: 12px; color: #666;">5段階評価（1つ星～5つ星）</span>
              </div>
            </div>
          </label>
          
          <!-- Shapes -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid transparent; border-radius: 6px;" class="icon-set-option" data-icons="❌,⚠️,✅" data-type="shapes">
            <input type="radio" name="icon-set" value="shapes" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; gap: 8px; font-size: 20px;">
                <span>❌</span>
                <span>⚠️</span>
                <span>✅</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">状態表示</span>
                <span style="font-size: 12px; color: #666;">X：問題、警告：注意、チェック：OK</span>
              </div>
            </div>
          </label>
          
          <!-- Progress -->
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid transparent; border-radius: 6px;" class="icon-set-option" data-icons="🔴,🟠,🟢" data-type="progress">
            <input type="radio" name="icon-set" value="progress" style="margin: 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; gap: 8px; font-size: 20px;">
                <span>🔴</span>
                <span>🟠</span>
                <span>🟢</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">進捗表示</span>
                <span style="font-size: 12px; color: #666;">赤：遅れ、オレンジ：順調、緑：前倒し</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Threshold Settings -->
      <div style="margin-bottom: 20px; padding: 16px; background: #f8f8f8; border-radius: 6px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 500;">閾値設定:</label>
        <div id="threshold-container">
          <!-- 3段階（デフォルト） -->
          <div id="threshold-3" style="display: flex; gap: 16px; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-size: 12px; color: #666;">低い値</span>
              <span style="font-size: 14px;">0%</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 14px;">1段階目:</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="range" id="threshold1" min="10" max="90" value="33" style="width: 100px;">
                  <span id="threshold1-value" style="font-size: 14px; min-width: 30px;">33%</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 14px;">2段階目:</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="range" id="threshold2" min="10" max="90" value="67" style="width: 100px;">
                  <span id="threshold2-value" style="font-size: 14px; min-width: 30px;">67%</span>
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-size: 12px; color: #666;">高い値</span>
              <span style="font-size: 14px;">100%</span>
            </div>
          </div>
          
          <!-- 5段階（星評価用） -->
          <div id="threshold-5" style="display: none; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 14px;">1つ星:</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="threshold5-1" min="5" max="95" value="20" style="width: 100px;">
                <span id="threshold5-1-value" style="font-size: 14px; min-width: 30px;">20%</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 14px;">2つ星:</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="threshold5-2" min="5" max="95" value="40" style="width: 100px;">
                <span id="threshold5-2-value" style="font-size: 14px; min-width: 30px;">40%</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 14px;">3つ星:</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="threshold5-3" min="5" max="95" value="60" style="width: 100px;">
                <span id="threshold5-3-value" style="font-size: 14px; min-width: 30px;">60%</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 14px;">4つ星:</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="threshold5-4" min="5" max="95" value="80" style="width: 100px;">
                <span id="threshold5-4-value" style="font-size: 14px; min-width: 30px;">80%</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;">
              <span style="font-size: 12px; color: #666;">5つ星: 80%以上</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">プレビュー:</div>
        <div id="icon-set-preview" style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">高い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span>🟢</span>
              <span style="font-size: 14px;">100</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">中間値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span>🟡</span>
              <span style="font-size: 14px;">50</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">低い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span>🔴</span>
              <span style="font-size: 14px;">10</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cf-modal-cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">キャンセル</button>
        <button class="cf-modal-confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #1890ff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">適用</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // ✅ 完全統一化: 設定画面の星アイコンに正しいクラスを適用
    this.applyUnifiedStarIconsToDialog(modalContent);

    // Update preview function
    const updatePreview = () => {
      const selectedOption = modalContent.querySelector('input[name="icon-set"]:checked');
      if (!selectedOption) return;
      
      const icons = selectedOption.closest('.icon-set-option').dataset.icons.split(',');
      const previewContainer = modalContent.querySelector('#icon-set-preview');
      
      if (icons.length === 5) {
        // 5段階（星評価）
        const threshold1 = parseInt(modalContent.querySelector('#threshold5-1').value);
        const threshold2 = parseInt(modalContent.querySelector('#threshold5-2').value);
        const threshold3 = parseInt(modalContent.querySelector('#threshold5-3').value);
        const threshold4 = parseInt(modalContent.querySelector('#threshold5-4').value);
        
        previewContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; text-align: right; font-size: 12px;">最高値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 16px;" class="preview-icon-container">
              <span class="preview-star-icon">${icons[4]}</span>
              <span style="font-size: 14px;">100</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; text-align: right; font-size: 12px;">良い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 16px;" class="preview-icon-container">
              <span class="preview-star-icon">${icons[3]}</span>
              <span style="font-size: 14px;">${Math.round((threshold4 + 100) / 2)}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; text-align: right; font-size: 12px;">普通値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 16px;" class="preview-icon-container">
              <span class="preview-star-icon">${icons[2]}</span>
              <span style="font-size: 14px;">${Math.round((threshold2 + threshold3) / 2)}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; text-align: right; font-size: 12px;">悪い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 16px;" class="preview-icon-container">
              <span class="preview-star-icon">${icons[1]}</span>
              <span style="font-size: 14px;">${Math.round((threshold1 + threshold2) / 2)}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 50px; text-align: right; font-size: 12px;">最低値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 16px;" class="preview-icon-container">
              <span class="preview-star-icon">${icons[0]}</span>
              <span style="font-size: 14px;">${Math.round(threshold1 / 2)}</span>
            </div>
          </div>
        `;
      } else {
        // 3段階（その他）
        const threshold1 = parseInt(modalContent.querySelector('#threshold1').value);
        const threshold2 = parseInt(modalContent.querySelector('#threshold2').value);
        
        // Calculate sample values based on thresholds
        const highValue = 100;
        const midValue = Math.round((threshold1 + threshold2) / 2);
        const lowValue = Math.round(threshold1 / 2);
        
        previewContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">高い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span style="color: #333; font-size: 18px;">${icons[2]}</span>
              <span style="font-size: 14px;">${highValue}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">中間値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span style="color: #333; font-size: 18px;">${icons[1]}</span>
              <span style="font-size: 14px;">${midValue}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 40px; text-align: right; font-size: 12px;">低い値</span>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <span style="color: #333; font-size: 18px;">${icons[0]}</span>
              <span style="font-size: 14px;">${lowValue}</span>
            </div>
          </div>
        `;
      }
      
      // ✅ プレビュー更新後に星アイコンを統一化
      setTimeout(() => {
        const previewStars = modalContent.querySelectorAll('.preview-star-icon');
        previewStars.forEach(span => {
          if (span.textContent && (span.textContent.includes('★') || span.textContent.includes('☆'))) {
            span.classList.add('cf-icon', 'cf-star-icon');
          }
        });
      }, 0);
    };

    // Handle threshold slider changes
    const threshold1Slider = modalContent.querySelector('#threshold1');
    const threshold2Slider = modalContent.querySelector('#threshold2');
    const threshold1Value = modalContent.querySelector('#threshold1-value');
    const threshold2Value = modalContent.querySelector('#threshold2-value');
    
    threshold1Slider.addEventListener('input', () => {
      let value = parseInt(threshold1Slider.value);
      const threshold2Val = parseInt(threshold2Slider.value);
      
      // Ensure threshold1 < threshold2
      if (value >= threshold2Val) {
        value = threshold2Val - 1;
        threshold1Slider.value = value;
      }
      
      threshold1Value.textContent = value + '%';
      updatePreview();
    });
    
    threshold2Slider.addEventListener('input', () => {
      let value = parseInt(threshold2Slider.value);
      const threshold1Val = parseInt(threshold1Slider.value);
      
      // Ensure threshold2 > threshold1
      if (value <= threshold1Val) {
        value = threshold1Val + 1;
        threshold2Slider.value = value;
      }
      
      threshold2Value.textContent = value + '%';
      updatePreview();
    });

    // Handle 5-stage threshold sliders
    const threshold5Sliders = [
      { slider: modalContent.querySelector('#threshold5-1'), value: modalContent.querySelector('#threshold5-1-value') },
      { slider: modalContent.querySelector('#threshold5-2'), value: modalContent.querySelector('#threshold5-2-value') },
      { slider: modalContent.querySelector('#threshold5-3'), value: modalContent.querySelector('#threshold5-3-value') },
      { slider: modalContent.querySelector('#threshold5-4'), value: modalContent.querySelector('#threshold5-4-value') }
    ];

    threshold5Sliders.forEach((item, index) => {
      item.slider.addEventListener('input', () => {
        let value = parseInt(item.slider.value);
        
        // Ensure ascending order: threshold1 < threshold2 < threshold3 < threshold4
        if (index > 0) {
          const prevValue = parseInt(threshold5Sliders[index - 1].slider.value);
          if (value <= prevValue) {
            value = prevValue + 1;
            item.slider.value = value;
          }
        }
        
        if (index < threshold5Sliders.length - 1) {
          const nextValue = parseInt(threshold5Sliders[index + 1].slider.value);
          if (value >= nextValue) {
            value = nextValue - 1;
            item.slider.value = value;
          }
        }
        
        item.value.textContent = value + '%';
        updatePreview();
      });
    });

    // Handle icon set selection and highlight
    const iconOptions = modalContent.querySelectorAll('.icon-set-option');
    iconOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove highlight from all options
        iconOptions.forEach(opt => {
          opt.style.border = '2px solid transparent';
          opt.style.background = 'transparent';
        });
        // Highlight selected option
        option.style.border = '2px solid #1890ff';
        option.style.background = 'rgba(24, 144, 255, 0.1)';
        
        // Switch threshold UI based on icon count
        const icons = option.dataset.icons.split(',');
        const threshold3Section = modalContent.querySelector('#threshold-3');
        const threshold5Section = modalContent.querySelector('#threshold-5');
        
        if (icons.length === 5) {
          // Show 5-stage threshold UI for stars
          threshold3Section.style.display = 'none';
          threshold5Section.style.display = 'flex';
        } else {
          // Show 3-stage threshold UI for others
          threshold3Section.style.display = 'flex';
          threshold5Section.style.display = 'none';
        }
        
        updatePreview();
      });
    });

    // ✅ 編集モード時のみ初期プレビューを実行
    setTimeout(() => {
      // 編集モードで既存の選択がある場合のみプレビューを更新
      if (isEditMode && existingRule?.format?.iconSet) {
        updatePreview();
      }
    }, 200);

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    const cancelBtn = modalContent.querySelector('.cf-modal-cancel-btn');
    const confirmBtn = modalContent.querySelector('.cf-modal-confirm-btn');

    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
      const selectedOption = modalContent.querySelector('input[name="icon-set"]:checked');
      if (selectedOption) {
        const icons = selectedOption.closest('.icon-set-option').dataset.icons.split(',');
        const iconType = selectedOption.closest('.icon-set-option').dataset.type;
        let thresholds;
        
        if (icons.length === 5) {
          // 5段階の閾値を取得
          thresholds = [
            parseInt(modalContent.querySelector('#threshold5-1').value),
            parseInt(modalContent.querySelector('#threshold5-2').value),
            parseInt(modalContent.querySelector('#threshold5-3').value),
            parseInt(modalContent.querySelector('#threshold5-4').value)
          ];
        } else {
          // 3段階の閾値を取得
          thresholds = [
            parseInt(modalContent.querySelector('#threshold1').value),
            parseInt(modalContent.querySelector('#threshold2').value)
          ];
        }
        
        this.createIconSetRule(targetColumns, icons, iconType, thresholds, existingRule);
        closeModal();
      }
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Initialize preview and selection
    if (isEditMode && existingRule.format.iconSet) {
      // Restore existing selection for edit mode
      const existingIconSet = existingRule.format.iconSet;
      
      // Find the matching icon option
      const matchingOption = Array.from(iconOptions).find(option => {
        const icons = option.dataset.icons.split(',');
        return JSON.stringify(icons) === JSON.stringify(existingIconSet.icons);
      });
      
      if (matchingOption) {
        // Find the radio input within the matching option
        const radioInput = matchingOption.querySelector('input[type="radio"]');
        if (radioInput) {
          radioInput.checked = true;
        }
        
        // Trigger click to update UI and preview
        matchingOption.click();
        
        // Restore thresholds if available
        if (existingIconSet.thresholds) {
          setTimeout(() => {
            if (existingIconSet.icons.length === 5) {
              // Restore 5-stage thresholds
              const threshold5Inputs = modalContent.querySelectorAll('#threshold-5 input');
              existingIconSet.thresholds.forEach((value, index) => {
                if (threshold5Inputs[index]) {
                  threshold5Inputs[index].value = value;
                }
              });
            } else {
              // Restore 3-stage thresholds
              const threshold1Input = modalContent.querySelector('#threshold1');
              const threshold2Input = modalContent.querySelector('#threshold2');
              if (threshold1Input && existingIconSet.thresholds[0] !== undefined) {
                threshold1Input.value = existingIconSet.thresholds[0];
              }
              if (threshold2Input && existingIconSet.thresholds[1] !== undefined) {
                threshold2Input.value = existingIconSet.thresholds[1];
              }
            }
            updatePreview();
          }, 150); // Slightly longer delay to ensure UI is ready
        }
      } else {
        // No matching option found - log error but don't throw
        console.error(`No matching icon set found for icons: ${JSON.stringify(existingIconSet.icons)}`);
      }
    }
    // 新規作成時は何も選択しない - ユーザーが明示的に選択する必要がある
  }

  /**
   * Create icon set rule
   * @param {Array} targetColumns - Target columns
   * @param {Array} icons - Array of icons [low, mid, high]
   * @param {string} iconType - Type of icon set
   * @param {Array} thresholds - Array of thresholds [threshold1, threshold2]
   * @param {Object} existingRule - Existing rule to update (for edit mode)
   */
  createIconSetRule(targetColumns, icons, iconType, thresholds, existingRule = null) {
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule, OPERATORS, DATA_TYPES, CONDITION_TYPES } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) return;

    if (existingRule) {
      // Edit mode: Update existing rule
      const updates = {
        name: `Icon set (${iconType}) for ${targetColumns.join(', ')}`,
        targetColumns: targetColumns,
        format: {
          ...existingRule.format,
          iconSet: {
            type: iconType,
            icons: icons,
            thresholds: thresholds
          }
        }
      };
      
      // Update the rule in plugin storage
      this.plugin.updateRule(existingRule.id, updates);
    } else {
      // Create mode: Create new rule
      const rule = new ConditionalFormattingRule({
        name: `Icon set (${iconType}) for ${targetColumns.join(', ')}`,
        targetColumns: targetColumns,
        conditionType: CONDITION_TYPES.SINGLE_COLUMN,
        operator: OPERATORS.IS_NUMBER,
        dataType: DATA_TYPES.NUMBER,
        value: '', // IS_NUMBER doesn't need a value
        formatType: 'iconSet', // Specify format type for ManageRule
        format: {
          iconSet: {
            type: iconType,
            icons: icons,
            thresholds: thresholds
          }
        }
      });
      
      this.plugin.addRule(rule);
    }
    
    this.plugin.refreshFormatting();
  }
  
  /**
   * Setup submenu interactions
   * @param {HTMLElement} menu - Main menu element
   */
  setupSubmenuInteractions(menu) {
    let activeSubmenu = null;
    let submenuTimeout = null;
    
    const menuItems = menu.querySelectorAll('.cf-context-menu-item');
    
    menuItems.forEach(item => {
      const submenu = item.querySelector('.cf-context-submenu');
      if (!submenu) return;
      
      // Mouse enter - show submenu with delay
      item.addEventListener('mouseenter', () => {
        clearTimeout(submenuTimeout);
        
        // Hide other submenus
        if (activeSubmenu && activeSubmenu !== submenu) {
          activeSubmenu.style.display = 'none';
        }
        
        submenuTimeout = setTimeout(() => {
          submenu.style.display = 'block';
          activeSubmenu = submenu;
          
          // Position submenu using MenuPositionUtils
          if (typeof MenuPositionUtils !== 'undefined') {
            const itemRect = item.getBoundingClientRect();
            
            MenuPositionUtils.positionMenu(submenu, itemRect.right - 5, itemRect.top, {
              margin: 0,
              preferredDirection: 'bottom-right',
              fallbackDirections: ['bottom-left', 'top-right', 'top-left']
            });
          } else {
            // Fallback positioning
            const itemRect = item.getBoundingClientRect();
            const submenuRect = submenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Check if submenu would go off right edge
            if (itemRect.right + submenuRect.width > viewportWidth - 10) {
              // Position on left side of menu item
              submenu.style.left = 'auto';
              submenu.style.right = '100%';
            } else {
              // Position on right side of menu item
              submenu.style.left = '100%';
              submenu.style.right = 'auto';
            }
            
            // Vertical positioning
            submenu.style.top = '0';
          }
        }, 100); // Small delay to prevent accidental opening
      });
      
      // Mouse leave - hide submenu with delay
      item.addEventListener('mouseleave', (e) => {
        // Check if moving to submenu
        const toElement = e.relatedTarget;
        if (toElement && item.contains(toElement)) {
          return;
        }
        
        clearTimeout(submenuTimeout);
        submenuTimeout = setTimeout(() => {
          if (submenu === activeSubmenu) {
            submenu.style.display = 'none';
            activeSubmenu = null;
          }
        }, 300); // Delay to allow moving to submenu
      });
    });
    
    // Close all submenus when menu is closed
    this._closeSubmenus = () => {
      clearTimeout(submenuTimeout);
      if (activeSubmenu) {
        activeSubmenu.style.display = 'none';
        activeSubmenu = null;
      }
    };
  }

  /**
   * Position context menu
   * @param {HTMLElement} menu - Menu element
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  positionMenu(menu, x, y) {
    // Use the shared MenuPositionUtils for better positioning
    if (typeof MenuPositionUtils !== 'undefined') {
      return MenuPositionUtils.positionMenu(menu, x, y, {
        margin: 10,
        preferredDirection: 'bottom-right',
        fallbackDirections: ['bottom-left', 'top-right', 'top-left']
      });
    }
    
    // Fallback to basic positioning if utils not available
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    menu.offsetHeight;
    
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let menuX = x;
    let menuY = y;
    
    if (x + rect.width > viewportWidth) {
      menuX = viewportWidth - rect.width - 10;
    }
    
    if (y + rect.height > viewportHeight) {
      menuY = viewportHeight - rect.height - 10;
    }
    
    menu.style.left = `${menuX}px`;
    menu.style.top = `${menuY}px`;
    
    return { x: menuX, y: menuY };
  }
  
  /**
   * Close context menu
   */
  closeContextMenu() {
    if (this.currentMenu) {
      // Close all submenus first
      if (this._closeSubmenus) {
        this._closeSubmenus();
      }
      
      this.currentMenu.remove();
      this.currentMenu = null;
    }
    
    // Clear right-click highlight
    if (this.lastRightClickedCell) {
      this.lastRightClickedCell.classList.remove('cf-cell-right-clicked');
      this.lastRightClickedCell = null;
    }
  }
  
  /**
   * Get selected cells
   * @returns {Array} Selected cells
   */
  getSelectedCells() {
    return Array.from(this.selectedCells);
  }
  
  /**
   * Get selected columns
   * @param {Array} selectedCells - Selected cells
   * @returns {Array} Column keys
   */
  getSelectedColumns(selectedCells) {
    const columnKeys = new Set();
    
    selectedCells.forEach(cellInfo => {
      if (cellInfo.column && cellInfo.column.key) {
        columnKeys.add(cellInfo.column.key);
      } else {
        columnKeys.add(cellInfo.columnIndex);
      }
    });
    
    return Array.from(columnKeys);
  }
  
  /**
   * Check if cell is selected
   * @param {Object} cellInfo - Cell information
   * @returns {boolean} Is selected
   */
  isCellSelected(cellInfo) {
    return Array.from(this.selectedCells).some(selected => 
      selected.rowIndex === cellInfo.rowIndex && 
      selected.columnIndex === cellInfo.columnIndex
    );
  }
  
  /**
   * Add cell to selection
   * @param {Object} cellInfo - Cell information
   */
  addCellToSelection(cellInfo) {
    this.selectedCells.add(cellInfo);
    cellInfo.element.classList.add('cf-cell-selected');
  }
  
  /**
   * Remove cell from selection
   * @param {Object} cellInfo - Cell information
   */
  removeCellFromSelection(cellInfo) {
    this.selectedCells.forEach(selected => {
      if (selected.rowIndex === cellInfo.rowIndex && 
          selected.columnIndex === cellInfo.columnIndex) {
        this.selectedCells.delete(selected);
        selected.element.classList.remove('cf-cell-selected');
      }
    });
  }
  
  /**
   * Clear cell selection
   */
  clearCellSelection() {
    this.selectedCells.forEach(cellInfo => {
      cellInfo.element.classList.remove('cf-cell-selected');
    });
    this.selectedCells.clear();
  }
  
  /**
   * Clear formatting from selection - PROPER SYSTEM-WIDE APPROACH
   * @param {Array} selectedCells - Selected cells
   */
  clearFormattingFromSelection(selectedCells) {
    
    try {
      // Step 1: Identify target columns
      const targetColumns = this.getSelectedColumns(selectedCells);
      
      // Debug: Check plugin and getAllRules method
      
      // Step 2: Identify and remove applicable rules
      const rulesToRemove = this.identifyApplicableRules(targetColumns);
      
      if (rulesToRemove.length === 0) {
        return;
      }
      
      // Step 3: Remove rules from the system (plugin will auto-refresh)
      rulesToRemove.forEach(rule => {
        this.plugin.removeRule(rule.id); // This will trigger refreshAllFormatting()
      });
      
      
    } catch (error) {
      console.error('❌ System-wide clear failed:', error);
    }
  }
  
  /**
   * Identify rules that apply to the given columns
   * @param {Array} targetColumns - Column names/indices
   * @returns {Array} Applicable rules
   */
  identifyApplicableRules(targetColumns) {
    const allRules = this.plugin.getAllRules();
    // Show first rule in detail
    if (allRules.length > 0) {
    }
    
    const applicableRules = [];
    
    allRules.forEach(rule => {
      
      // Check if rule applies to any of the target columns
      if (rule.column && targetColumns.includes(rule.column)) {
        applicableRules.push(rule);
      } else if (rule.columns && rule.columns.some(col => targetColumns.includes(col))) {
        applicableRules.push(rule);
      } else if (rule.targetColumns && rule.targetColumns.some(col => targetColumns.includes(col))) {
        applicableRules.push(rule);
      } else {
      }
    });
    
    return applicableRules;
  }
  
  // NOTE: Individual cell clearing methods removed - using system-wide approach only

  /**
   * Get data types of target columns
   * @param {Object} cellInfo - Cell information
   * @returns {Object} Object with boolean flags for each data type
   */
  getColumnDataTypes(cellInfo) {
    // Get target columns
    const selectedCells = this.getSelectedCells();
    let targetColumns = this.getSelectedColumns(selectedCells);
    
    // If no cells selected, use current cell's column
    if (targetColumns.length === 0 && cellInfo) {
      targetColumns = [cellInfo.column?.key || cellInfo.columnIndex];
    }
    
    
    const dataTypes = {
      hasNumeric: false,
      hasDate: false,
      hasText: false
    };
    
    // Check each target column
    targetColumns.forEach(columnKey => {
      const columnType = this.detectColumnType(columnKey);
      if (columnType === 'number') dataTypes.hasNumeric = true;
      if (columnType === 'date') dataTypes.hasDate = true;
      if (columnType === 'text') dataTypes.hasText = true;
    });
    
    return dataTypes;
  }

  /**
   * Detect the primary data type of a column
   * @param {string|number} columnKey - Column key or index
   * @returns {string} 'number', 'date', or 'text'
   */
  detectColumnType(columnKey) {
    const tableInstance = this.plugin.table;
    const tableData = tableInstance.state?.data || tableInstance.options?.data || [];
    
    if (tableData.length === 0) return 'text';
    
    // Extract sample values from column
    const sampleValues = [];
    const sampleSize = Math.min(10, tableData.length);
    
    for (let i = 0; i < tableData.length && sampleValues.length < sampleSize; i++) {
      const cellValue = tableData[i][columnKey];
      
      if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
        sampleValues.push(cellValue);
      }
    }
    
    // Use shared utility function for type detection
    const detectedType = this.utils.detectColumnType(sampleValues);
    
    // Map utils return values to context menu expected values
    return detectedType === 'numeric' ? 'number' : detectedType;
  }

  /**
   * Check if a value is numeric (including currency formatted values)
   * @param {*} value - Value to check
   * @returns {boolean} True if value is numeric
   */
  isNumericValue(value) {
    // Use shared utility function for numeric detection
    return this.utils.isNumeric(value);
  }

  /**
   * Check if a value is a date
   * @param {*} value - Value to check
   * @returns {boolean} True if value is a date
   */
  isDateValue(value) {
    // Use shared utility function for date detection
    return this.utils.isDateValue(value);
  }

  /**
   * Apply unified star icons to dialog (完全統一化)
   */
  applyUnifiedStarIconsToDialog(modalContent) {
    try {
      // 設定画面の星アイコン選択肢に統一されたクラスを適用
      const starOptionIcons = modalContent.querySelectorAll('.star-option-icon');
      starOptionIcons.forEach(span => {
        // 統一されたcf-star-iconクラスを追加
        span.classList.add('cf-icon', 'cf-star-icon');
      });
      
      // プレビュー部分の星アイコンにも統一されたクラスを適用
      this.applyUnifiedStarIconsToPreview(modalContent);
      
    } catch (error) {
    }
  }

  /**
   * Apply unified star icons to preview section
   */
  applyUnifiedStarIconsToPreview(modalContent) {
    // プレビュー更新時に星アイコンを統一
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const previewStars = modalContent.querySelectorAll('.preview-star-icon');
          previewStars.forEach(span => {
            if (span.textContent && (span.textContent.includes('★') || span.textContent.includes('☆'))) {
              span.classList.add('cf-icon', 'cf-star-icon');
            }
          });
        }
      });
    });
    
    // プレビューコンテナを監視
    const previewContainer = modalContent.querySelector('#icon-set-preview');
    if (previewContainer) {
      observer.observe(previewContainer, { childList: true, subtree: true });
    }
  }
  
  /**
   * Show manage rules dialog
   */
  showManageRulesDialog() {
    const modal = document.createElement('div');
    modal.className = 'cf-modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.className = 'cf-modal-content';
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 0;
      width: 800px;
      max-width: 90%;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    `;
    
    // Add drag and drop styles
    const dragDropStyles = `
      <style>
        .cf-rule-card {
          transition: all 0.2s ease;
          cursor: move;
        }
        .cf-rule-card.dragging {
          opacity: 0.5;
          transform: scale(0.98);
        }
        .cf-rule-card.drag-over {
          border-top: 3px solid #1890ff;
        }
        .cf-toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: #ccc;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .cf-toggle-switch.active {
          background: #52c41a;
        }
        .cf-toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .cf-toggle-switch.active::after {
          transform: translateX(20px);
        }
        .cf-sample-preview {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          margin-right: 8px;
        }
      </style>
    `;
    
    dialog.innerHTML = dragDropStyles + `
      <div class="cf-modal-header" style="background: #f7f7f7; padding: 20px 24px; border-bottom: 1px solid #e8e8e8;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #333;">
            <span style="margin-right: 8px;">📋</span>条件付き書式ルールの管理
          </h2>
          <button class="cf-modal-close" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; hover: color: #333;">&times;</button>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
          ドラッグ＆ドロップで優先順位を変更できます。上のルールほど優先されます。
        </p>
      </div>
      
      <div class="cf-rules-list" style="flex: 1; overflow-y: auto; background: #fafafa; padding: 20px;">
        ${this.createRulesListContent()}
      </div>
      
      <div class="cf-modal-footer" style="background: white; padding: 16px 24px; border-top: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; color: #666;">
          合計 <strong>${Array.from(this.plugin.ruleEngine.rules.values()).length}</strong> ルール
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="cf-button cf-button-primary" style="padding: 8px 20px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            <span style="margin-right: 6px;">➕</span>新規ルール
          </button>
          <button class="cf-button cf-button-default cf-cancel-btn" style="padding: 8px 20px; background: white; color: #666; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer; font-size: 14px;">
            閉じる
          </button>
        </div>
      </div>
    `;
    
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    // Event handlers
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    dialog.querySelector('.cf-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    dialog.querySelector('.cf-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
    
    // Handle new rule button
    dialog.querySelector('.cf-button-primary').addEventListener('click', () => {
      modal.remove();
      this.plugin.showEnhancedDialog();
    });
    
    // Handle rule actions
    dialog.addEventListener('click', (e) => {
      const target = e.target.closest('[data-rule-id]');
      if (!target) return;
      
      const ruleId = target.dataset.ruleId;
      
      // Handle toggle switch
      if (target.classList.contains('cf-toggle-switch')) {
        const rule = this.plugin.ruleEngine.rules.get(ruleId);
        if (rule) {
          rule.enabled = !rule.enabled;
          this.plugin.refreshFormatting();
          this.plugin.saveRules();
          // Update toggle UI
          target.classList.toggle('active');
          // Update card opacity
          const card = target.closest('.cf-rule-card');
          if (card) {
            card.style.opacity = rule.enabled ? '1' : '0.6';
          }
        }
        return;
      }
      
      // Handle button clicks
      if (e.target.classList.contains('cf-rule-edit')) {
        const rule = this.plugin.ruleEngine.rules.get(ruleId);
        if (rule) {
          modal.remove();
          this.plugin.showEnhancedDialog(rule);
        }
      } else if (e.target.classList.contains('cf-rule-duplicate')) {
        const rule = this.plugin.ruleEngine.rules.get(ruleId);
        if (rule) {
          const newRule = rule.clone();
          newRule.name = `${rule.name} (コピー)`;
          this.plugin.addRule(newRule);
          // Refresh dialog content
          dialog.querySelector('.cf-rules-list').innerHTML = this.createRulesListContent();
          this.initializeDragAndDrop(dialog);
        }
      } else if (e.target.classList.contains('cf-rule-delete')) {
        if (confirm('このルールを削除してもよろしいですか？')) {
          this.plugin.removeRule(ruleId);
          // Refresh dialog content
          dialog.querySelector('.cf-rules-list').innerHTML = this.createRulesListContent();
          // Update rule count
          const ruleCount = Array.from(this.plugin.ruleEngine.rules.values()).length;
          dialog.querySelector('.cf-modal-footer strong').textContent = ruleCount;
          this.initializeDragAndDrop(dialog);
        }
      }
    });
    
    // Initialize drag and drop
    this.initializeDragAndDrop(dialog);
  }
  
  /**
   * Create rules list content for manage rules dialog
   */
  createRulesListContent() {
    const rules = Array.from(this.plugin.ruleEngine.rules.values());
    
    if (rules.length === 0) {
      return `
        <div style="text-align: center; padding: 60px 20px; color: #999;">
          <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
          <p style="font-size: 16px; margin: 0;">ルールが設定されていません</p>
          <p style="font-size: 14px; margin: 8px 0 0 0;">新規ルールボタンから作成を開始してください</p>
        </div>
      `;
    }
    
    // Sort rules by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    return sortedRules.map((rule, index) => {
      const conditionText = this.getRuleDescription(rule);
      const formatPreview = this.createFormatPreview(rule.format);
      const isDisabled = !rule.enabled;
      
      return `
        <div class="cf-rule-card" data-rule-id="${rule.id}" data-priority="${rule.priority || 0}" 
             style="
               background: white;
               border: 1px solid #e0e0e0;
               border-radius: 8px;
               margin-bottom: 12px;
               padding: 16px;
               position: relative;
               ${isDisabled ? 'opacity: 0.6;' : ''}
               box-shadow: 0 2px 4px rgba(0,0,0,0.06);
               transition: box-shadow 0.2s;
             "
             draggable="true">
          
          <!-- Priority and Drag Handle -->
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="cursor: move; color: #bbb; font-size: 20px;" class="drag-handle">⋮⋮</div>
              <div style="
                background: #f0f0f0;
                color: #666;
                font-weight: 600;
                font-size: 18px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">${index + 1}</div>
            </div>
            
            <!-- Rule Content -->
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #333;">
                    ${rule.name}
                  </h4>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    ${conditionText}
                  </p>
                </div>
                
                <!-- Toggle Switch -->
                <div class="cf-toggle-switch ${rule.enabled ? 'active' : ''}" 
                     data-rule-id="${rule.id}"
                     title="${rule.enabled ? '有効' : '無効'}">
                </div>
              </div>
              
              <!-- Format Preview -->
              <div style="margin: 12px 0;">
                <span style="font-size: 12px; color: #999; margin-right: 8px;">書式プレビュー:</span>
                ${formatPreview}
              </div>
              
              <!-- Action Buttons -->
              <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                <button class="cf-rule-edit" data-rule-id="${rule.id}" 
                        style="
                          padding: 6px 16px;
                          font-size: 13px;
                          cursor: pointer;
                          background: white;
                          border: 1px solid #d9d9d9;
                          border-radius: 4px;
                          color: #666;
                          transition: all 0.2s;
                        ">
                  <span style="margin-right: 4px;">✏️</span>編集
                </button>
                <button class="cf-rule-duplicate" data-rule-id="${rule.id}" 
                        style="
                          padding: 6px 16px;
                          font-size: 13px;
                          cursor: pointer;
                          background: white;
                          border: 1px solid #d9d9d9;
                          border-radius: 4px;
                          color: #666;
                          transition: all 0.2s;
                        ">
                  <span style="margin-right: 4px;">📋</span>複製
                </button>
                <button class="cf-rule-delete" data-rule-id="${rule.id}" 
                        style="
                          padding: 6px 16px;
                          font-size: 13px;
                          cursor: pointer;
                          background: white;
                          border: 1px solid #ffccc7;
                          border-radius: 4px;
                          color: #ff4d4f;
                          transition: all 0.2s;
                        ">
                  <span style="margin-right: 4px;">🗑️</span>削除
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  /**
   * Get rule description for display
   */
  getRuleDescription(rule) {
    if (rule.conditionType === 'combined' && rule.conditions && rule.conditions.length > 0) {
      const conditionTexts = rule.conditions.map(condition => 
        `${condition.column} ${condition.operator} "${condition.value}"`
      );
      const operator = rule.logicalOperator === 'or' ? ' OR ' : ' AND ';
      return `複合条件: ${conditionTexts.join(operator)}`;
    } else if (rule.conditionType === 'simple' && rule.conditions && rule.conditions[0]) {
      const c = rule.conditions[0];
      return `${c.column} ${c.operator} "${c.value}"`;
    } else if (rule.targetColumns && rule.targetColumns.length > 0) {
      return `${rule.targetColumns.join(', ')} ${rule.operator} "${rule.value}"`;
    }
    return 'カスタム条件';
  }
  
  /**
   * Get format description for display
   */
  getFormatDescription(format) {
    const descriptions = [];
    
    if (format.backgroundColor) {
      descriptions.push(`背景色: ${format.backgroundColor}`);
    }
    if (format.color) {
      descriptions.push(`文字色: ${format.color}`);
    }
    if (format.fontWeight === 'bold') {
      descriptions.push('太字');
    }
    if (format.fontStyle === 'italic') {
      descriptions.push('斜体');
    }
    
    return descriptions.join(', ') || '書式設定なし';
  }
  
  /**
   * Create format preview for display in manage rules dialog
   */
  createFormatPreview(format) {
    // Handle icon sets
    if (format.iconSet) {
      const icons = format.iconSet.icons || [];
      return `
        <span style="font-size: 16px;">
          ${icons.map(icon => `<span style="margin: 0 2px;">${icon}</span>`).join('')}
        </span>
      `;
    }
    
    // Handle data bars
    if (format.dataBar) {
      const color = format.dataBar.color || '#4285f4';
      return `
        <span style="
          display: inline-block;
          width: 80px;
          height: 18px;
          background: linear-gradient(to right, ${color} 65%, #f0f0f0 65%);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
        ">
          <span style="
            position: absolute;
            left: 4px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 11px;
            color: white;
            font-weight: 500;
          ">65%</span>
        </span>
      `;
    }
    
    // Handle color scales
    if (format.colorScale) {
      const colors = format.colorScale.colors || ['#f8696b', '#ffeb84', '#63be7b'];
      return `
        <span style="
          display: inline-block;
          width: 100px;
          height: 18px;
          background: linear-gradient(to right, ${colors.join(', ')});
          border-radius: 3px;
          border: 1px solid #ddd;
        "></span>
      `;
    }
    
    // Handle basic formatting
    let style = '';
    if (format.backgroundColor) {
      style += `background-color: ${format.backgroundColor}; `;
    }
    if (format.color) {
      style += `color: ${format.color}; `;
    }
    if (format.fontWeight === 'bold') {
      style += 'font-weight: bold; ';
    }
    if (format.fontStyle === 'italic') {
      style += 'font-style: italic; ';
    }
    
    if (style) {
      return `
        <span class="cf-sample-preview" style="${style}">
          サンプル
        </span>
      `;
    }
    
    return '<span style="color: #999; font-size: 12px;">書式なし</span>';
  }
  
  /**
   * Initialize drag and drop for rules management
   */
  initializeDragAndDrop(dialog) {
    const rulesList = dialog.querySelector('.cf-rules-list');
    const cards = rulesList.querySelectorAll('.cf-rule-card');
    
    let draggedCard = null;
    
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedCard = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedCard = null;
      });
      
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedCard || draggedCard === card) return;
        
        const afterElement = getDragAfterElement(rulesList, e.clientY);
        if (afterElement == null) {
          rulesList.appendChild(draggedCard);
        } else {
          rulesList.insertBefore(draggedCard, afterElement);
        }
      });
      
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        // Update priorities based on new order
        this.updateRulePriorities(rulesList);
      });
    });
    
    // Helper function to determine insertion point
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.cf-rule-card:not(.dragging)')];
      
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }
  
  /**
   * Update rule priorities based on visual order
   */
  updateRulePriorities(rulesList) {
    const cards = rulesList.querySelectorAll('.cf-rule-card');
    const totalRules = cards.length;
    
    cards.forEach((card, index) => {
      const ruleId = card.dataset.ruleId;
      const rule = this.plugin.ruleEngine.rules.get(ruleId);
      if (rule) {
        // Higher priority for items at the top
        rule.priority = totalRules - index;
      }
      
      // Update visual priority number
      const priorityBadge = card.querySelector('[style*="border-radius: 50%"]');
      if (priorityBadge) {
        priorityBadge.textContent = index + 1;
      }
    });
    
    // Save updated priorities and refresh formatting
    this.plugin.saveRules();
    this.plugin.refreshFormatting();
  }
  
  /**
   * Destroy context menu extension
   */
  destroy() {
    this.closeContextMenu();
    this.clearCellSelection();
    
    // Remove event listeners would go here if we had references to them
    
    // Remove styles
    const styleElement = document.getElementById('cf-context-menu-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextMenuExtension;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingContextMenuExtension = ContextMenuExtension;
}