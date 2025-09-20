/**
 * ExceLike Table - Column Management Module
 * Handles column width calculations, positioning, pinning, resizing, and styling
 */

/**
 * Column Management Mixin
 * Contains all column-related functionality
 */
const ExceLikeTableColumnsMixin = {
  /**
   * Get column width from state or default
   */
  getColumnWidth(column) {
    const columnKey = typeof column === 'string' ? column : column.key;
    return this.state.columnWidths[columnKey] || column.width || 150;
  },

  /**
   * Get ordered columns (pinned first, then unpinned)
   */
  getOrderedColumns() {
    const visibleColumns = this.getVisibleColumns();
    const pinnedCols = visibleColumns.filter(col => this.state.pinnedColumns[col.key]);
    const unpinnedCols = visibleColumns.filter(col => !this.state.pinnedColumns[col.key]);
    
    return {
      all: [...pinnedCols, ...unpinnedCols],
      pinned: pinnedCols,
      unpinned: unpinnedCols
    };
  },

  /**
   * Get the key of the last pinned column
   */
  getLastPinnedColumnKey() {
    const orderedColumns = this.getOrderedColumns();
    return orderedColumns.pinned.length > 0 ? 
           orderedColumns.pinned[orderedColumns.pinned.length - 1].key : null;
  },

  /**
   * Calculate positions for all columns
   */
  calculateAllColumnPositions() {
    const orderedColumns = this.getOrderedColumns();
    const positions = {};
    let currentLeft = 0;
    
    orderedColumns.all.forEach(column => {
      const width = this.getColumnWidth(column);
      positions[column.key] = {
        left: currentLeft,
        width: width,
        isPinned: this.state.pinnedColumns[column.key] || false
      };
      currentLeft += width;
    });
    
    return positions;
  },

  /**
   * Calculate column positions for a specific set of columns
   */
  calculateColumnPositions(columns) {
    const positions = {};
    let currentLeft = 0;
    
    columns.forEach(column => {
      const width = this.getColumnWidth(column);
      positions[column.key] = {
        left: currentLeft,
        width: width,
        isPinned: this.state.pinnedColumns[column.key] || false
      };
      currentLeft += width;
    });
    
    return positions;
  },

  /**
   * Apply column styles to a DOM element
   */
  applyColumnStyles(element, column, positions) {
    const position = positions[column.key];
    if (!position) return;
    
    // 基本的な幅設定
    element.style.width = `${position.width}px`;
    element.style.minWidth = `${position.width}px`;
    element.style.maxWidth = `${position.width}px`;
    
    // 固定列のスタイル適用
    if (position.isPinned) {
      element.classList.add('pinned-column');
      // CSS変数のみ設定（CSSで処理）
      element.style.setProperty('--pinned-left', `${position.left}px`);
      
      // 最後の固定列判定
      const lastPinnedKey = this.getLastPinnedColumnKey();
      if (column.key === lastPinnedKey) {
        element.classList.add('last-pinned-column');
      } else {
        element.classList.remove('last-pinned-column');
      }
    } else {
      element.classList.remove('pinned-column', 'last-pinned-column');
      element.style.removeProperty('--pinned-left');
    }
  },

  /**
   * Update column width in state and DOM
   */
  updateColumnWidth(columnKey, newWidth) {
    // Validate width
    if (typeof newWidth !== 'number' || newWidth < TABLE_CONFIG.SIZES.MIN_COLUMN_WIDTH || newWidth > 2000) {
      console.warn(`Invalid column width for ${columnKey}: ${newWidth}. Must be between ${TABLE_CONFIG.SIZES.MIN_COLUMN_WIDTH}-2000px`);
      return false;
    }

    // Update state
    this.state.columnWidths[columnKey] = newWidth;
    
    // Update column definition
    const column = this.options.columns.find(col => col.key === columnKey);
    if (column) {
      column.width = newWidth;
    }
    
    // Apply to DOM
    this.applyColumnWidthToDOM(columnKey, newWidth);
    
    // Update pinned positions if this is a pinned column
    if (this.state.pinnedColumns[columnKey]) {
      this.updateAllPinnedPositions();
    }
    
    // Auto-save if persistence is enabled
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
    
    return true;
  },

  /**
   * Apply column width directly to DOM elements
   */
  applyColumnWidthToDOM(columnKey, width) {
    const columnIndex = this.options.columns.findIndex(col => col.key === columnKey);
    if (columnIndex === -1) return;

    // Update header cells
    const headerSelector = `th.table-header[data-column="${columnKey}"], th:nth-child(${columnIndex + 1})`;
    const headerCells = this.container.querySelectorAll(headerSelector);
    headerCells.forEach(cell => {
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });

    // Update body cells
    const bodySelector = `td:nth-child(${columnIndex + 1})`;
    const bodyCells = this.container.querySelectorAll(`tbody ${bodySelector}`);
    bodyCells.forEach(cell => {
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });

    // Update table min-width to prevent column shrinkage
    this.updateTableMinWidth();
  },

  /**
   * Update table minimum width to accommodate all columns
   */
  updateTableMinWidth() {
    const positions = this.calculateAllColumnPositions();
    const totalWidth = Object.values(positions).reduce((sum, pos) => sum + pos.width, 0);
    
    const table = this.container.querySelector('table');
    if (table) {
      table.style.minWidth = `${totalWidth}px`;
      table.style.width = `${totalWidth}px`;
    }
    
    // Ensure container can scroll horizontally
    const tableContainer = this.container.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.style.overflowX = 'auto';
    }
  },

  /**
   * Update all pinned column positions
   */
  updateAllPinnedPositions() {
    const positions = this.calculateAllColumnPositions();
    const pinnedPositions = {};
    
    // Build pinned positions mapping
    Object.keys(positions).forEach(key => {
      if (positions[key].isPinned) {
        pinnedPositions[key] = positions[key].left;
      }
    });
    
    this.applyPinnedPositions(pinnedPositions);
  },

  /**
   * Apply pinned column positions to DOM elements
   */
  applyPinnedPositions(positions) {
    Object.keys(positions).forEach(columnKey => {
      const left = positions[columnKey];
      
      // Update header cells
      const headerCells = this.container.querySelectorAll(`th[data-column="${columnKey}"]`);
      headerCells.forEach(cell => {
        cell.style.setProperty('--pinned-left', `${left}px`);
      });
      
      // Update body cells
      const columnIndex = this.options.columns.findIndex(col => col.key === columnKey);
      if (columnIndex !== -1) {
        const bodyCells = this.container.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
        bodyCells.forEach(cell => {
          cell.style.setProperty('--pinned-left', `${left}px`);
        });
      }
    });
  },

  /**
   * Auto-resize column to fit content
   */
  autoResizeColumn(columnKey) {
    const columnIndex = this.options.columns.findIndex(col => col.key === columnKey);
    if (columnIndex === -1) return;

    // Measure content in column
    let maxWidth = TABLE_CONFIG.SIZES.AUTO_RESIZE_MIN;
    
    // Check header width
    const headerCell = this.container.querySelector(`th:nth-child(${columnIndex + 1})`);
    if (headerCell) {
      const headerContent = headerCell.querySelector('.header-title');
      if (headerContent) {
        maxWidth = Math.max(maxWidth, headerContent.scrollWidth + 50); // Add padding
      }
    }
    
    // Check body cell widths (sample first 20 rows for performance)
    const bodyCells = this.container.querySelectorAll(`tbody tr:nth-child(-n+20) td:nth-child(${columnIndex + 1})`);
    bodyCells.forEach(cell => {
      maxWidth = Math.max(maxWidth, cell.scrollWidth + 20); // Add padding
    });
    
    // Apply limits
    maxWidth = Math.min(maxWidth, TABLE_CONFIG.SIZES.AUTO_RESIZE_MAX);
    maxWidth = Math.max(maxWidth, TABLE_CONFIG.SIZES.AUTO_RESIZE_MIN);
    
    // Update column width
    this.updateColumnWidth(columnKey, Math.round(maxWidth));
  },

  /**
   * Toggle column pinning
   */
  toggleColumnPin(columnKey) {
    const currentlyPinned = this.state.pinnedColumns[columnKey];
    this.state.pinnedColumns[columnKey] = !currentlyPinned;
    
    // Re-render to apply new column order and positions
    this.render();
    
    // Save state if persistence is enabled
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  },

  /**
   * Set column visibility
   */
  setColumnVisibility(columnKey, visible) {
    this.state.visibleColumns[columnKey] = visible;
    
    // Re-render to apply visibility changes
    this.render();
    
    // Save state if persistence is enabled
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  },

  /**
   * Get column definition by key
   */
  getColumnByKey(columnKey) {
    return this.options.columns.find(col => col.key === columnKey);
  },

  /**
   * Get column index by key
   */
  getColumnIndex(columnKey) {
    return this.options.columns.findIndex(col => col.key === columnKey);
  },

  /**
   * Move column to a new position
   */
  moveColumn(fromKey, toKey) {
    const fromIndex = this.getColumnIndex(fromKey);
    const toIndex = this.getColumnIndex(toKey);
    
    if (fromIndex === -1 || toIndex === -1) return false;
    
    // Move column in array
    const column = this.options.columns.splice(fromIndex, 1)[0];
    this.options.columns.splice(toIndex, 0, column);
    
    // Re-render to apply new order
    this.render();
    
    return true;
  },

  /**
   * Reset all column widths to defaults
   */
  resetColumnWidths() {
    this.options.columns.forEach(column => {
      const defaultWidth = column.width || 150;
      this.state.columnWidths[column.key] = defaultWidth;
      this.applyColumnWidthToDOM(column.key, defaultWidth);
    });
    
    this.updateTableMinWidth();
    
    // Save state if persistence is enabled
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  },

  /**
   * Get total width of all visible columns
   */
  getTotalColumnsWidth() {
    return this.getVisibleColumns().reduce((total, column) => {
      return total + this.getColumnWidth(column);
    }, 0);
  },

  /**
   * Check if column is numeric based on data type
   */
  isNumericColumn(column) {
    if (column.filterType === 'range') return true;
    
    // Sample some data to determine if numeric
    const sampleSize = Math.min(10, this.state.data.length);
    const samples = this.state.data.slice(0, sampleSize);
    
    let numericCount = 0;
    samples.forEach(row => {
      const value = row[column.dataIndex || column.key];
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        numericCount++;
      }
    });
    
    return numericCount / sampleSize > 0.8; // 80% numeric threshold
  },

  /**
   * Auto-detect column types and set appropriate filters
   */
  autoDetectColumnTypes() {
    this.options.columns.forEach(column => {
      if (!column.filterType) {
        if (this.isNumericColumn(column)) {
          column.filterType = 'range';
        } else {
          // Check if it looks like dates
          const sampleValues = this.state.data.slice(0, 5).map(row => row[column.dataIndex || column.key]);
          const dateCount = sampleValues.filter(val => {
            if (val instanceof Date) return true;
            if (typeof val === 'string') {
              const date = new Date(val);
              return !isNaN(date.getTime()) && val.match(/\d{4}[-/]\d{2}[-/]\d{2}/);
            }
            return false;
          }).length;
          
          if (dateCount >= 3) {
            column.filterType = 'dateHierarchy';
          } else {
            column.filterType = 'text';
          }
        }
      }
    });
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExceLikeTableColumnsMixin;
}

if (typeof window !== 'undefined') {
  window.ExceLikeTableColumnsMixin = ExceLikeTableColumnsMixin;
}