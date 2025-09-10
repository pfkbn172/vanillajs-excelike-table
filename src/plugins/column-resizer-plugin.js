/**
 * Column Resizer Plugin
 * Adds drag-to-resize functionality for table columns
 */

const ColumnResizerPlugin = {
  name: 'Column Resizer',
  version: '1.0.0',
  description: 'Adds drag-to-resize functionality for table columns',
  author: 'ExceLike Table Team',

  // Plugin state
  isResizing: false,
  startX: 0,
  startWidth: 0,
  currentColumn: null,
  resizeHandle: null,
  
  /**
   * Initialize plugin
   * @param {Object} table - Table instance
   * @param {Object} api - Plugin API
   */
  init(table, api) {
    // console.log('[ColumnResizer] Initializing plugin');
    this.table = table;
    this.api = api;
    
    // Add CSS for resize handles
    this.addStyles();
    
    // Add resize handles after table renders
    this.api.registerHook('render:afterRender', this.addResizeHandles.bind(this));
    
    // Try multiple times to ensure table is rendered
    const attempts = [100, 500, 1000, 2000];
    attempts.forEach(delay => {
      setTimeout(() => {
        // console.log(`[ColumnResizer] Attempting to add resize handles after ${delay}ms`);
        this.addResizeHandles();
      }, delay);
    });
    
    // Handle mouse events
    this.bindEvents();
  },

  /**
   * Add plugin styles
   */
  addStyles() {
    // console.log('[ColumnResizer] Adding styles');
    const css = `
      /* Ensure headers can contain resizers */
      th.table-header {
        position: relative !important;
        overflow: visible !important;
      }
      
      .table-column-resizer {
        position: absolute;
        top: 0;
        right: -3px;
        width: 6px;
        height: 100%;
        cursor: col-resize;
        background: transparent;
        z-index: 1000;
      }
      
      .table-column-resizer:hover,
      .table-column-resizer.active {
        background: rgba(24, 144, 255, 0.2);
      }
      
      /* Remove transitions during resize for smooth updates */
      .table-resizing * {
        transition: none !important;
      }
      
      /* Ensure table can overflow container */
      .table-container {
        overflow-x: auto !important;
        overflow-y: auto !important;
      }
      
      .table {
        min-width: max-content;
      }
      
      .table-resizing {
        user-select: none;
        cursor: col-resize;
      }
      
      .table-resize-guide {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--table-color-primary, #1890ff);
        z-index: 1000;
        pointer-events: none;
      }
    `;
    
    this.api.addCSS(css, 'column-resizer-plugin');
  },

  /**
   * Add resize handles to column headers
   */
  addResizeHandles() {
    // Try different selectors to find header cells
    let headerCells = this.table.container.querySelectorAll('thead th.table-header');
    if (!headerCells.length) {
      headerCells = this.table.container.querySelectorAll('th.table-header');
    }
    if (!headerCells.length) {
      headerCells = this.table.container.querySelectorAll('th');
    }
    
    // console.log('[ColumnResizer] Table container:', this.table.container);
    // console.log('[ColumnResizer] Found header cells:', headerCells.length, headerCells);
    
    if (headerCells.length === 0) {
      console.warn('[ColumnResizer] No header cells found!');
      return;
    }
    
    headerCells.forEach((cell, index) => {
      // Skip last column (can't resize)
      if (index === headerCells.length - 1) return;
      
      // Ensure cell has position relative for absolute positioning of resizer
      if (!cell.style.position || cell.style.position === 'static') {
        cell.style.position = 'relative';
      }
      
      // Remove existing resizer
      const existingResizer = cell.querySelector('.table-column-resizer');
      if (existingResizer) {
        existingResizer.remove();
      }
      
      // Create resize handle
      const resizer = document.createElement('div');
      resizer.className = 'table-column-resizer';
      resizer.setAttribute('data-column-index', index);
      
      // console.log(`[ColumnResizer] Adding resizer to column ${index}`);
      
      cell.appendChild(resizer);
      
      // Add event listeners
      resizer.addEventListener('mousedown', this.handleMouseDown.bind(this));
    });
    
    // Update table minimum width after adding all resizers
    this.updateTableMinWidth();
  },

  /**
   * Bind global events
   */
  bindEvents() {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  },

  /**
   * Handle mouse down on resize handle
   * @param {Event} event - Mouse event
   */
  handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    this.startX = event.clientX;
    this.currentColumn = parseInt(event.target.dataset.columnIndex);
    this.resizeHandle = event.target;
    
    // Get current column width
    const headerCell = this.resizeHandle.parentElement;
    this.startWidth = headerCell.offsetWidth;
    
    // Add resizing class to table
    this.table.container.classList.add('table-resizing');
    this.resizeHandle.classList.add('active');
    
    // Don't create resize guide since we update width in real-time
    // this.createResizeGuide(event.clientX);
    
    // Emit hook
    this.api.emitHook('column:resizeStart', {
      columnIndex: this.currentColumn,
      startWidth: this.startWidth
    });
  },

  /**
   * Handle mouse move during resize
   * @param {Event} event - Mouse event
   */
  handleMouseMove(event) {
    if (!this.isResizing) return;
    
    const deltaX = event.clientX - this.startX;
    const newWidth = Math.max(this.startWidth + deltaX, 50); // Minimum width 50px
    
    // Update resize guide position (if we're using it)
    // this.updateResizeGuide(event.clientX);
    
    // Apply width in real-time for visual feedback
    this.applyColumnWidth(this.currentColumn, newWidth, true); // true = temporary update
    
    // Emit hook for real-time updates
    this.api.emitHook('column:resizing', {
      columnIndex: this.currentColumn,
      newWidth,
      deltaX
    });
  },

  /**
   * Handle mouse up to finish resize
   * @param {Event} event - Mouse event
   */
  handleMouseUp(event) {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    
    // Calculate new width
    const deltaX = event.clientX - this.startX;
    const newWidth = Math.max(this.startWidth + deltaX, 50);
    
    // Apply new width
    this.applyColumnWidth(this.currentColumn, newWidth);
    
    // Cleanup
    this.table.container.classList.remove('table-resizing');
    if (this.resizeHandle) {
      this.resizeHandle.classList.remove('active');
    }
    // this.removeResizeGuide();
    
    // Emit hook
    this.api.emitHook('column:resizeEnd', {
      columnIndex: this.currentColumn,
      newWidth,
      oldWidth: this.startWidth
    });
    
    // Reset state
    this.currentColumn = null;
    this.resizeHandle = null;
  },

  /**
   * Create resize guide line
   * @param {number} x - X position
   */
  createResizeGuide(x) {
    const guide = document.createElement('div');
    guide.className = 'table-resize-guide';
    guide.style.left = `${x}px`;
    
    // Get table container position for proper guide positioning
    const tableRect = this.table.container.getBoundingClientRect();
    guide.style.top = `${tableRect.top}px`;
    guide.style.height = `${tableRect.height}px`;
    
    document.body.appendChild(guide);
    this.resizeGuide = guide;
  },

  /**
   * Update resize guide position
   * @param {number} x - X position
   */
  updateResizeGuide(x) {
    if (this.resizeGuide) {
      this.resizeGuide.style.left = `${x}px`;
    }
  },

  /**
   * Remove resize guide
   */
  removeResizeGuide() {
    if (this.resizeGuide) {
      this.resizeGuide.remove();
      this.resizeGuide = null;
    }
  },

  /**
   * Apply new column width
   * @param {number} columnIndex - Column index
   * @param {number} width - New width
   * @param {boolean} isTemporary - Whether this is a temporary update during dragging
   */
  applyColumnWidth(columnIndex, width, isTemporary = false) {
    const columns = this.table.options.columns;
    
    // Only update the column definition on final update
    if (!isTemporary && columns[columnIndex]) {
      columns[columnIndex].width = width;
    }
    
    // Update CSS for immediate visual feedback
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    const bodyCells = this.table.container.querySelectorAll(`tbody td:nth-child(${columnIndex + 1})`);
    
    // Update header cell
    if (headerCells[columnIndex]) {
      headerCells[columnIndex].style.width = `${width}px`;
      headerCells[columnIndex].style.minWidth = `${width}px`;
      headerCells[columnIndex].style.maxWidth = `${width}px`;
    }
    
    // Update all body cells for smooth resizing
    bodyCells.forEach(cell => {
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });
    
    // Update table minimum width to ensure horizontal scroll
    this.updateTableMinWidth();
    
    // Only save permanent changes
    if (!isTemporary) {
      // Update table state if available
      if (this.table.state && this.table.state.columnWidths && columns[columnIndex]) {
        this.table.state.columnWidths[columns[columnIndex].key] = width;
      }
      
      // Save to storage
      this.saveColumnWidths();
    }
  },

  /**
   * Update table minimum width based on column widths
   */
  updateTableMinWidth() {
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    let totalWidth = 0;
    
    headerCells.forEach(cell => {
      totalWidth += cell.offsetWidth;
    });
    
    // Get container width to force scrolling if needed
    const containerWidth = this.table.container.offsetWidth;
    const finalWidth = Math.max(totalWidth, containerWidth);
    
    
    // Set width on both table and table wrapper
    const table = this.table.container.querySelector('table');
    const tableWrapper = this.table.container.querySelector('.table-wrapper');
    
    if (table) {
      table.style.minWidth = `${finalWidth}px`;
      table.style.width = totalWidth > containerWidth ? `${totalWidth}px` : 'auto';
    }
    
    // Force table container to show scrollbars
    if (totalWidth > containerWidth) {
      this.table.container.style.overflowX = 'auto';
    }
  },

  /**
   * Save column widths to storage
   */
  saveColumnWidths() {
    const widths = this.table.options.columns.map(col => col.width);
    this.api.setStorage('columnWidths', widths, 'column-resizer');
  },

  /**
   * Load column widths from storage
   */
  loadColumnWidths() {
    const widths = this.api.getStorage('columnWidths', 'column-resizer');
    if (widths && Array.isArray(widths)) {
      widths.forEach((width, index) => {
        if (this.table.options.columns[index] && width) {
          this.table.options.columns[index].width = width;
        }
      });
    }
  },

  /**
   * Get plugin configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      minColumnWidth: 50,
      saveToStorage: true,
      showResizeGuide: true,
      animateResize: true
    };
  },

  /**
   * Update plugin configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.getConfig(), ...config };
  },

  /**
   * Plugin cleanup
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Remove resize handles
    const resizers = this.table.container.querySelectorAll('.table-column-resizer');
    resizers.forEach(resizer => resizer.remove());
    
    // Remove CSS
    this.api.removeCSS('column-resizer-plugin');
    
    // Remove resize guide if exists
    this.removeResizeGuide();
  }
};

// Auto-register plugin if PluginSystem is available
if (typeof window !== 'undefined' && window.PluginSystem) {
  // Plugin will be registered when table initializes
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColumnResizerPlugin;
}

if (typeof window !== 'undefined') {
  window.ColumnResizerPlugin = ColumnResizerPlugin;
}