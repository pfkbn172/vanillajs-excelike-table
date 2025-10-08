/**
 * ExceLike Table - Pure JavaScript implementation
 * Excel-like table with filtering, sorting, pagination, and column pinning
 */

/**
 * ExceLike Table - Pure JavaScript implementation
 * All features enabled by default - no configuration needed!
 */

// Import utility modules
import DOMUtils from './dom-utils.js';
import SecurityUtils from './security-utils.js';
import PerformanceUtils from './performance-utils.js';
import I18nModule from './i18n.js';

// Configuration constants
const TABLE_CONFIG = {
  FONT_SIZES: {
    'smallest': '10px',
    'small': '12px',
    'medium': '14px',
    'large': '18px',
    'largest': '22px'
  },
  
  CELL_PADDING: {
    'wide': { vertical: '12px', horizontal: '8px' },
    'standard': { vertical: '8px', horizontal: '6px' },
    'narrow': { vertical: '2px', horizontal: '2px' }
  },
  
  SIZES: {
    MIN_COLUMN_WIDTH: 50,
    AUTO_RESIZE_MIN: 80,
    AUTO_RESIZE_MAX: 400,
    DOUBLE_CLICK_THRESHOLD: 300,
    TOOLTIP_OFFSET: { x: 15, y: 40 }
  },
  
  Z_INDEXES: {
    TOOLTIP: 10000,
    FILTER_DROPDOWN: 9999,
    PINNED_HEADER: 101,
    PINNED_CELL: 100
  },
  
  TIMING: {
    TOOLTIP_FADE: 200,
    DEBOUNCE_RESIZE: 100
  }
};

// Column definition helpers for easier setup
const ColumnHelpers = {
  /**
   * Create a simple text column
   */
  text(key, title, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 150,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      ...options
    };
  },

  /**
   * Create a number column with automatic formatting
   */
  number(key, title, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 120,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      render: options.render || ((value) => {
        if (typeof value === 'number') {
          return options.currency ? `${options.currency}${value.toLocaleString()}` : value.toLocaleString();
        }
        return value;
      }),
      ...options
    };
  },

  /**
   * Create a date column with automatic formatting
   */
  date(key, title, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      type: 'date',
      width: options.width || 130,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      filterType: 'date-hierarchy',
      render: options.render || ((value) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      }),
      ...options
    };
  },

  /**
   * Create a status column with color coding
   */
  status(key, title, statusColors = {}, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 100,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      render: (value, record, column, cellElement) => {
        const color = statusColors[value] || '#000';
        
        // Apply styles directly to the cell element if available
        if (cellElement) {
          cellElement.style.color = color;
          cellElement.style.fontWeight = '500';
        }
        
        // Return just the text value
        return value;
      },
      ...options
    };
  },

  /**
   * Create an action column with buttons
   */
  actions(title, actions, options = {}) {
    return {
      key: 'actions',
      title: title || 'Actions',
      dataIndex: 'actions',
      width: options.width || 120,
      sortable: false,
      filterable: false,
      render: (value, record) => {
        return actions.map(action => 
          `<button class="action-btn" data-action="${action.key}" data-id="${record.id || record.key}">${action.label}</button>`
        ).join(' ');
      },
      ...options
    };
  }
};

// Utility functions
const TableUtils = {
  /**
   * Get decimal places from a numeric value
   */
  getDecimalPlaces(values) {
    let maxDecimals = 0;
    values.forEach(value => {
      if (typeof value === 'number' && !Number.isInteger(value)) {
        const decimals = value.toString().split('.')[1]?.length || 0;
        maxDecimals = Math.max(maxDecimals, decimals);
      }
    });
    return maxDecimals;
  },

  /**
   * Format number value based on decimal places
   */
  formatNumberValue(value, decimalPlaces) {
    if (typeof value !== 'number') return value;
    return decimalPlaces > 0 ? value.toFixed(decimalPlaces) : Math.round(value).toString();
  },

  /**
   * Check if column contains numeric data
   */
  isNumericColumn(column, data) {
    return data.slice(0, 10).every(row => {
      const value = row[column.dataIndex];
      return value === null || value === undefined || value === '' || !isNaN(Number(value));
    });
  },

  /**
   * Check if value is a valid date
   */
  isDateValue(value) {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date) && value.toString().match(/^\d{4}-\d{2}-\d{2}/);
  },

  /**
   * Get checked filter values from dropdown
   */
  getCheckedFilterValues(dropdown, excludeAll = true) {
    return Array.from(dropdown.querySelectorAll('.filter-checkbox:checked'))
      .map(cb => cb.dataset.value)
      .filter(val => excludeAll ? val !== '__all__' : true);
  },

  /**
   * Update select all checkbox state
   */
  updateSelectAllState(selectAllCheckbox, childCheckboxes) {
    const checkedCount = Array.from(childCheckboxes).filter(cb => cb.checked).length;
    const totalCount = childCheckboxes.length;
    
    if (checkedCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === totalCount) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  },

  /**
   * Convert px to cm
   */
  pxToCm(px) {
    const dpi = window.devicePixelRatio * 96;
    return (px * 2.54 / dpi).toFixed(2);
  },

  /**
   * Prevent element overflow from viewport
   */
  constrainToViewport(element, x, y, offsetX = 0, offsetY = 0) {
    const rect = element.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 10;
    const maxY = window.innerHeight - rect.height - 10;
    
    return {
      x: Math.max(10, Math.min(x + offsetX, maxX)),
      y: Math.max(10, Math.min(y + offsetY, maxY))
    };
  }
};

// Storage interface for flexible data persistence
class TableStorageAdapter {
  /**
   * Default LocalStorage implementation
   */
  constructor() {
    this.storage = localStorage;
  }

  /**
   * Save table settings
   * @param {string} key - Storage key
   * @param {Object} settings - Settings object to save
   * @returns {Promise<boolean>} Success status
   */
  async save(key, settings) {
    try {
      this.storage.setItem(key, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.warn('Failed to save table settings:', error);
      return false;
    }
  }

  /**
   * Load table settings
   * @param {string} key - Storage key
   * @returns {Promise<Object|null>} Loaded settings or null
   */
  async load(key) {
    try {
      const data = this.storage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load table settings:', error);
      return null;
    }
  }

  /**
   * Remove table settings
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async remove(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove table settings:', error);
      return false;
    }
  }

  /**
   * Check if storage is available
   * @returns {boolean} Availability status
   */
  isAvailable() {
    try {
      const testKey = '__table_storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

// Settings manager for table persistence
class TableSettingsManager {
  /**
   * @param {string} tableId - Unique table identifier
   * @param {TableStorageAdapter} storageAdapter - Storage implementation
   */
  constructor(tableId, storageAdapter = null) {
    this.tableId = tableId;
    this.storageAdapter = storageAdapter || new TableStorageAdapter();
    this.storageKey = `excelike_table_${tableId}`;
  }

  /**
   * Get current table settings
   * @param {ExceLikeTable} table - Table instance
   * @returns {Object} Current settings
   */
  extractSettings(table) {
    // Validate and sanitize column widths
    const sanitizedColumnWidths = {};
    for (const [column, width] of Object.entries(table.state.columnWidths || {})) {
      // Limit column width to reasonable range (50px - 2000px)
      const sanitizedWidth = Math.max(50, Math.min(2000, width));
      sanitizedColumnWidths[column] = sanitizedWidth;
    }

    // ✅ Validate and sanitize filter state
    const sanitizedFilters = this.validateFilterState(table.state);

    return {
      // Column settings
      columnWidths: sanitizedColumnWidths,
      visibleColumns: { ...table.state.visibleColumns },
      pinnedColumns: { ...table.state.pinnedColumns },
      
      // ✅ Filter settings (validated and complete)
      filters: sanitizedFilters.filters,
      rangeFilters: sanitizedFilters.rangeFilters,
      dateRangeFilters: sanitizedFilters.dateRangeFilters,
      filterModes: sanitizedFilters.filterModes,
      rangeIncludeBlanks: sanitizedFilters.rangeIncludeBlanks,
      dateRangeIncludeBlanks: sanitizedFilters.dateRangeIncludeBlanks,
      
      // Sort settings
      sortColumn: table.state.sortColumn,
      sortOrder: table.state.sortOrder,
      
      // Display settings
      fontSize: table.state.fontSize,
      cellPadding: table.state.cellPadding,
      pageSize: table.state.pageSize,
      
      // Metadata
      version: '1.0.0',
      timestamp: Date.now()
    };
  }


  /**
   * Validate and sanitize filter state to prevent conflicts
   * Ensures that for each column, only one filter type is active
   * @param {Object} state - Table state object
   * @returns {Object} Sanitized filter state
   */
  validateFilterState(state) {
    const result = {
      filters: {},
      rangeFilters: {},
      dateRangeFilters: {},
      filterModes: {},
      rangeIncludeBlanks: {},
      dateRangeIncludeBlanks: {}
    };

    // Get all columns that have any filter state
    const allFilteredColumns = new Set([
      ...Object.keys(state.filters || {}),
      ...Object.keys(state.rangeFilters || {}),
      ...Object.keys(state.dateRangeFilters || {}),
      ...Object.keys(state.filterModes || {})
    ]);

    // Validate each column's filter state
    allFilteredColumns.forEach(columnKey => {
      const mode = state.filterModes?.[columnKey];

      // ✅ Case 1: Range mode - keep only range filters
      if (mode === 'range') {
        // Check if range filter exists
        if (state.rangeFilters?.[columnKey]) {
          result.rangeFilters[columnKey] = state.rangeFilters[columnKey];
          result.filterModes[columnKey] = 'range';
          if (state.rangeIncludeBlanks?.[columnKey] !== undefined) {
            result.rangeIncludeBlanks[columnKey] = state.rangeIncludeBlanks[columnKey];
          }
        } else if (state.dateRangeFilters?.[columnKey]) {
          result.dateRangeFilters[columnKey] = state.dateRangeFilters[columnKey];
          result.filterModes[columnKey] = 'range';
          if (state.dateRangeIncludeBlanks?.[columnKey] !== undefined) {
            result.dateRangeIncludeBlanks[columnKey] = state.dateRangeIncludeBlanks[columnKey];
          }
        }
        // ❌ Discard conflicting value filters
        
      }
      // ✅ Case 2: Values mode - keep only value filters
      else if (mode === 'values') {
        if (state.filters?.[columnKey]) {
          result.filters[columnKey] = state.filters[columnKey];
          result.filterModes[columnKey] = 'values';
        }
        // ❌ Discard conflicting range filters
        
      }
      // ✅ Case 3: No explicit mode - infer from data
      else {
        // Priority: range filters > date range filters > value filters
        if (state.rangeFilters?.[columnKey]) {
          result.rangeFilters[columnKey] = state.rangeFilters[columnKey];
          result.filterModes[columnKey] = 'range';
          if (state.rangeIncludeBlanks?.[columnKey] !== undefined) {
            result.rangeIncludeBlanks[columnKey] = state.rangeIncludeBlanks[columnKey];
          }
        } else if (state.dateRangeFilters?.[columnKey]) {
          result.dateRangeFilters[columnKey] = state.dateRangeFilters[columnKey];
          result.filterModes[columnKey] = 'range';
          if (state.dateRangeIncludeBlanks?.[columnKey] !== undefined) {
            result.dateRangeIncludeBlanks[columnKey] = state.dateRangeIncludeBlanks[columnKey];
          }
        } else if (state.filters?.[columnKey]) {
          result.filters[columnKey] = state.filters[columnKey];
          result.filterModes[columnKey] = 'values';
        }
      }
    });

    return result;
  }

  /**
   * Apply settings to table
   * @param {ExceLikeTable} table - Table instance
   * @param {Object} settings - Settings to apply
   */
  applySettings(table, settings) {
    if (!settings || !this.isValidSettings(settings)) {
      return false;
    }

    try {
      // Apply column settings
      if (settings.columnWidths) {
        Object.assign(table.state.columnWidths, settings.columnWidths);
      }
      if (settings.visibleColumns) {
        Object.assign(table.state.visibleColumns, settings.visibleColumns);
      }
      if (settings.pinnedColumns) {
        Object.assign(table.state.pinnedColumns, settings.pinnedColumns);
      }

      // ✅ Apply filter settings with validation
      // Create a temporary state object for validation
      const tempState = {
        filters: settings.filters || {},
        rangeFilters: settings.rangeFilters || {},
        dateRangeFilters: settings.dateRangeFilters || {},
        filterModes: settings.filterModes || {},
        rangeIncludeBlanks: settings.rangeIncludeBlanks || {},
        dateRangeIncludeBlanks: settings.dateRangeIncludeBlanks || {}
      };

      // Validate and sanitize filter state
      const validatedFilters = this.validateFilterState(tempState);

      // Apply validated filter state
      table.state.filters = validatedFilters.filters;
      table.state.rangeFilters = validatedFilters.rangeFilters;
      table.state.dateRangeFilters = validatedFilters.dateRangeFilters;
      table.state.filterModes = validatedFilters.filterModes;
      table.state.rangeIncludeBlanks = validatedFilters.rangeIncludeBlanks;
      table.state.dateRangeIncludeBlanks = validatedFilters.dateRangeIncludeBlanks;

      // Apply sort settings
      if (settings.sortColumn) {
        table.state.sortColumn = settings.sortColumn;
      }
      if (settings.sortOrder) {
        table.state.sortOrder = settings.sortOrder;
      }

      // Apply display settings
      if (settings.fontSize) {
        table.state.fontSize = settings.fontSize;
      }
      if (settings.cellPadding) {
        table.state.cellPadding = settings.cellPadding;
      }
      if (settings.pageSize) {
        table.state.pageSize = settings.pageSize;
      }

      return true;
    } catch (error) {
      console.warn('Failed to apply table settings:', error);
      return false;
    }
  }

  /**
   * Validate settings object
   * @param {Object} settings - Settings to validate
   * @returns {boolean} Validation result
   */
  isValidSettings(settings) {
    if (!settings || typeof settings !== 'object' || !settings.version || !settings.timestamp) {
      return false;
    }

    // Validate column widths
    if (settings.columnWidths) {
      for (const [column, width] of Object.entries(settings.columnWidths)) {
        if (typeof width !== 'number' || width < 50 || width > 2000) {
          console.warn(`Invalid column width for ${column}: ${width}. Must be between 50-2000px`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Save current table settings
   * @param {ExceLikeTable} table - Table instance
   * @returns {Promise<boolean>} Save success status
   */
  async saveSettings(table) {
    if (!this.storageAdapter.isAvailable()) {
      return false;
    }

    const settings = this.extractSettings(table);
    return await this.storageAdapter.save(this.storageKey, settings);
  }

  /**
   * Load and apply saved settings
   * @param {ExceLikeTable} table - Table instance
   * @returns {Promise<boolean>} Load success status
   */
  async loadSettings(table) {
    if (!this.storageAdapter.isAvailable()) {
      return false;
    }

    const settings = await this.storageAdapter.load(this.storageKey);
    if (settings) {
      // Validate settings before applying
      if (!this.isValidSettings(settings)) {
        console.warn('TableSettingsManager: Invalid settings detected, clearing storage');
        await this.storageAdapter.remove(this.storageKey);
        return false;
      }
      
      return this.applySettings(table, settings);
    }
    return false;
  }

  /**
   * Clear saved settings
   * @returns {Promise<boolean>} Clear success status
   */
  async clearSettings() {
    return await this.storageAdapter.remove(this.storageKey);
  }
}

/**
 * ExceLike Table Component
 * @class ExceLikeTable
 * @description A comprehensive table component with Excel-like features including
 * filtering, sorting, pagination, column pinning, and more.
 */
class ExceLikeTable {
  /**
   * Create an ExceLike Table instance
   * All features are enabled by default - just pass your data and columns!
   * 
   * @param {string|HTMLElement} container - Container element or selector
   * @param {Object} options - Configuration options
   * @param {Array} options.data - Table data array
   * @param {Array} options.columns - Column definitions (use ColumnHelpers for easier setup)
   * @param {string} options.rowKey - Unique row identifier key (default: 'id')
   * @param {Object|boolean} options.pagination - Pagination settings or false to disable
   * @param {boolean} options.bordered - Show table borders (default: true)
   * @param {string} options.size - Table size: 'small', 'middle', 'large' (default: 'middle')
   * @param {string} options.tableId - Unique table identifier for settings persistence
   * @param {boolean} options.persistSettings - Enable settings persistence (default: true)
   * @param {TableStorageAdapter} options.storageAdapter - Custom storage implementation
   */
  constructor(container, options = {}) {
    // Validate container
    if (!container) {
      throw new Error('Container element is required');
    }
    
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Simple options with all features enabled by default
    this.options = {
      // Data
      data: options.data || [],
      columns: options.columns || [],
      rowKey: options.rowKey || 'id',
      
      // Pagination (enabled by default, customizable)
      pagination: options.pagination !== false ? {
        pageSize: 10,
        showSizeChanger: true,
        showTotal: null,
        current: 1,
        ...(typeof options.pagination === 'object' ? options.pagination : {})
      } : false,
      
      // Styling
      bordered: options.bordered !== false,
      size: options.size || 'middle',
      loading: options.loading || false,
      
      // Settings persistence (enabled by default)
      tableId: options.tableId || 'excelike-table',
      persistSettings: options.persistSettings !== false,
      storageAdapter: options.storageAdapter || null,
      
      // Any other custom options
      ...options
    };

    // Initialize settings manager (always available)
    this.settingsManager = null;
    if (this.options.persistSettings) {
      this.settingsManager = new TableSettingsManager(
        this.options.tableId,
        this.options.storageAdapter
      );
    }

    // Initialize i18n
    this.i18n = Object.create(I18nModule);
    this.i18n.init({
      locale: options.locale || 'en',
      messages: options.i18nMessages || {}
    });

    // Internal state
    // Deep copy initial data to prevent external mutations
    const initialData = this._deepCopyData(this.options.data || []);
    this.state = {
      data: initialData,
      filteredData: [...initialData],
      filters: {},
      filterModes: {}, // 'range' or 'values' for each numeric column
      sortState: { column: null, direction: null },
      currentPage: this.options.pagination ? (this.options.pagination.current || 1) : 1,
      pageSize: this.options.pagination ? (this.options.pagination.pageSize || 10) : 10,
      columnWidths: {},
      visibleColumns: {},
      pinnedColumns: {},
      openFilter: null,
      rangeFilters: {},
      dateRangeFilters: {},
      fontSize: 'medium',
      cellPadding: 'standard'
    };

    // Initialize column configurations
    this.initializeColumns();
    
    // Bind methods
    this.handleSort = this.handleSort.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleColumnResize = this.handleColumnResize.bind(this);
    this.handleColumnToggle = this.handleColumnToggle.bind(this);
    this.handleColumnPin = this.handleColumnPin.bind(this);

    // Initialize the table
    this.init();
  }



  /**
   * Initialize column configurations
   * @private
   */
  initializeColumns() {
    this.options.columns.forEach(col => {
      // Set default values for all features (enabled by default)
      if (col.sortable === undefined) col.sortable = true;
      if (col.filterable === undefined) col.filterable = true;
      
      // Auto-detect date columns and set filterType
      if (col.filterType === undefined && this.options.data && this.options.data.length > 0) {
        const sampleValues = this.options.data.slice(0, 10).map(row => row[col.dataIndex]);
        const isDateColumn = sampleValues.some(val => val && TableUtils.isDateValue(val));
        if (isDateColumn) {
          col.filterType = 'date-hierarchy';
        }
      }
      
      this.state.columnWidths[col.key] = col.width || 150;
      this.state.visibleColumns[col.key] = col.hidden !== true;
      // 列定義のpinned設定を初期値として使用（保存された設定で後から上書きされる）
      this.state.pinnedColumns[col.key] = col.pinned === true;
    });
  }
  
  /**
   * Get column width with fallback
   * @private
   */
  getColumnWidth(column) {
    return this.state.columnWidths[column.key] || column.width || 150;
  }

  /**
   * Calculate column positions for pinned columns
   * @param {Array} columns - Array of column configurations
   * @returns {Object} Map of column key to left position
   */
  /**
   * 統一列順序システム - ヘッダーとボディで絶対に同じ順序を保証
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
  }

  /**
   * 列幅の統一取得メソッド
   */
  getColumnWidth(column) {
    return this.state.columnWidths[column.key] || column.width || 150;
  }

  /**
   * 最後の固定列のキーを取得
   */
  getLastPinnedColumnKey() {
    const orderedColumns = this.getOrderedColumns();
    return orderedColumns.pinned.length > 0 ? 
           orderedColumns.pinned[orderedColumns.pinned.length - 1].key : null;
  }

  /**
   * 改善された位置計算 - すべての列の位置情報を計算
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
  }

  /**
   * 共通スタイル適用メソッド - ヘッダーとボディで統一
   */
  applyColumnStyles(element, column, positions) {
    const position = positions[column.key];
    if (!position) return;
    
    // 基本的な幅設定
    element.style.width = `${position.width}px`;
    
    // 固定列のスタイル適用
    if (position.isPinned) {
      element.classList.add('pinned-column');
      // CSS変数のみ設定（CSSで処理）
      element.style.setProperty('--pinned-left', `${position.left}px`);
      
      // 最後の固定列判定
      const lastPinnedKey = this.getLastPinnedColumnKey();
      if (column.key === lastPinnedKey) {
        element.classList.add('last-pinned-column');
      }
    }
  }

  /**
   * 旧メソッド（互換性のため残す）
   */
  /**
   * 統一された列管理システム - 列位置と幅を一元計算
   */
  calculateColumnPositions(columns) {
    const positions = {};
    let currentLeft = 0;
    
    columns.forEach(column => {
      positions[column.key] = currentLeft;
      const width = this.getColumnWidth(column);
      currentLeft += width;
    });
    
    return positions;
  }

  /**
   * 列幅変更時の統一更新メソッド
   */
  updateColumnWidth(columnKey, newWidth) {
    // 状態を更新
    this.state.columnWidths[columnKey] = newWidth;
    
    // DOM要素を更新
    this.applyColumnWidthToDOM(columnKey, newWidth);
    
    // 固定列位置を再計算
    this.updateAllPinnedPositions();
    
    // 自動保存（デバウンス）
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  }

  /**
   * 指定列のDOM要素に幅を適用
   */
  applyColumnWidthToDOM(columnKey, width) {
    const columnIndex = this.options.columns.findIndex(col => col.key === columnKey);
    if (columnIndex === -1) return;

    // ヘッダーセルを更新
    const headerCell = this.container.querySelector(`th.table-header:nth-child(${columnIndex + 1})`);
    if (headerCell) {
      headerCell.style.width = `${width}px`;
      headerCell.style.minWidth = `${width}px`;
      headerCell.style.maxWidth = `${width}px`;
    }

    // ボディセルを更新
    const bodyCells = this.container.querySelectorAll(`tbody td:nth-child(${columnIndex + 1})`);
    bodyCells.forEach(cell => {
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });
  }

  /**
   * 全固定列の位置を再計算・更新
   */
  updateAllPinnedPositions() {
    const headerCells = this.container.querySelectorAll('th.table-header');
    if (headerCells.length === 0) return;
    
    // 実際のDOM要素から列位置を計算
    let currentLeft = 0;
    const positions = [];
    
    headerCells.forEach((cell, index) => {
      positions[index] = currentLeft;
      currentLeft += cell.offsetWidth;
    });
    
    // 固定列の位置を更新
    this.applyPinnedPositions(positions);
  }

  /**
   * 計算された位置を固定列に適用
   */
  applyPinnedPositions(positions) {
    // ヘッダーの固定列
    const pinnedHeaders = this.container.querySelectorAll('th.pinned-column');
    pinnedHeaders.forEach(cell => {
      const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
      if (positions[columnIndex] !== undefined) {
        cell.style.setProperty('--pinned-left', `${positions[columnIndex]}px`);
      }
    });
    
    // ボディの固定列
    const rows = this.container.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const pinnedCells = row.querySelectorAll('td.pinned-column');
      pinnedCells.forEach(cell => {
        const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
        if (positions[columnIndex] !== undefined) {
          cell.style.setProperty('--pinned-left', `${positions[columnIndex]}px`);
        }
      });
    });
  }

  /**
   * 統一された永続化システム
   */
  initializePersistence() {
    // ストレージキーの生成
    const tableId = this.options.tableId || 'default';
    this.storageKey = `excelike-table-${tableId}-state`;
    
    // デバウンス保存関数
    this.saveStateDebounced = this.debounce(() => this.saveState(), 300);
    
    // ページ終了時の保存
    window.addEventListener('beforeunload', () => this.saveState());
  }

  /**
   * 状態をLocalStorageに保存
   */
  saveState() {
    try {
      const state = {
        version: '1.1.0',
        timestamp: Date.now(),
        columnState: {
          widths: this.state.columnWidths,
          pinned: Object.keys(this.state.pinnedColumns).filter(key => this.state.pinnedColumns[key])
        },
        filterState: {
          filters: this.state.filters,
          rangeFilters: this.state.rangeFilters,
          dateRangeFilters: this.state.dateRangeFilters,
          filterModes: this.state.filterModes
        },
        sortState: {
          column: this.state.sortState.column,
          direction: this.state.sortState.direction
        }
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      // QuotaExceededError等のエラーは無視（サイレント失敗）
      if (error.name === 'QuotaExceededError') {
        // 古いデータを削除して再試行
        this.cleanupOldStorageData();
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (retryError) {
          // 再試行も失敗したら諦める
        }
      }
    }
  }

  /**
   * LocalStorageから状態を復元
   */
  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return false;
      
      const state = JSON.parse(saved);
      if (state.version === '1.0.0' || state.version === '1.1.0') {
        this.applyLoadedState(state);
        return true;
      }
    } catch (error) {
      // 破損データは削除
      localStorage.removeItem(this.storageKey);
    }
    return false;
  }

  /**
   * 読み込んだ状態を適用
   */
  applyLoadedState(savedState) {
    // 列状態の復元
    if (savedState.columnState) {
      // 列幅の復元
      if (savedState.columnState.widths) {
        Object.entries(savedState.columnState.widths).forEach(([key, width]) => {
          // 列が存在する場合のみ適用
          if (this.options.columns.find(col => col.key === key)) {
            this.state.columnWidths[key] = width;
            // DOMにも幅を適用
            this.applyColumnWidthToDOM(key, width);
          }
        });
      }
      
      // 固定列の復元
      if (savedState.columnState.pinned !== undefined) {
        // まず全ての列の固定状態をfalseにリセット
        this.options.columns.forEach(col => {
          this.state.pinnedColumns[col.key] = false;
        });
        
        // 保存された固定列のみtrueに設定
        if (Array.isArray(savedState.columnState.pinned)) {
          savedState.columnState.pinned.forEach(key => {
            // 列が存在する場合のみ適用
            if (this.options.columns.find(col => col.key === key)) {
              this.state.pinnedColumns[key] = true;
            }
          });
        }
      }
    }
    
    // フィルタ状態の復元 (v1.1.0以降)
    if (savedState.version === '1.1.0' && savedState.filterState) {
      // 基本フィルタの復元
      if (savedState.filterState.filters) {
        Object.entries(savedState.filterState.filters).forEach(([key, filters]) => {
          // 列が存在する場合のみ適用
          if (this.options.columns.find(col => col.key === key)) {
            this.state.filters[key] = filters;
          }
        });
      }
      
      // 範囲フィルタの復元
      if (savedState.filterState.rangeFilters) {
        Object.entries(savedState.filterState.rangeFilters).forEach(([key, range]) => {
          if (this.options.columns.find(col => col.key === key)) {
            this.state.rangeFilters[key] = range;
          }
        });
      }
      
      // 日付範囲フィルタの復元
      if (savedState.filterState.dateRangeFilters) {
        Object.entries(savedState.filterState.dateRangeFilters).forEach(([key, dateRange]) => {
          if (this.options.columns.find(col => col.key === key)) {
            this.state.dateRangeFilters[key] = dateRange;
          }
        });
      }

      // フィルタモードの復元
      if (savedState.filterState.filterModes) {
        Object.entries(savedState.filterState.filterModes).forEach(([key, mode]) => {
          if (this.options.columns.find(col => col.key === key)) {
            this.state.filterModes[key] = mode;
          }
        });
      }
    }

    // ソート状態の復元 (v1.1.0以降)
    if (savedState.version === '1.1.0' && savedState.sortState) {
      const { column, direction } = savedState.sortState;
      // 列が存在し、有効な方向の場合のみ適用
      if (column && direction && this.options.columns.find(col => col.key === column)) {
        this.state.sortState = { column, direction };
      }
    }
  }

  /**
   * 古いストレージデータの削除
   */
  cleanupOldStorageData() {
    const keys = Object.keys(localStorage);
    const tableKeys = keys.filter(key => key.startsWith('excelike-table-'));
    
    // タイムスタンプでソートして古いものから削除
    const sortedKeys = tableKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return { key, timestamp: data.timestamp || 0 };
      } catch {
        return { key, timestamp: 0 };
      }
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    // 古い半分を削除
    const deleteCount = Math.floor(sortedKeys.length / 2);
    for (let i = 0; i < deleteCount; i++) {
      localStorage.removeItem(sortedKeys[i].key);
    }
  }

  /**
   * デバウンス関数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  checkFixedHeight() {
    // Check if the container has a fixed height set
    const containerStyle = getComputedStyle(this.container);
    const hasFixedHeight = containerStyle.height && 
                          containerStyle.height !== 'auto' && 
                          containerStyle.height !== '0px';
    
    if (hasFixedHeight) {
      // Add fixed-height class to enable sticky headers
      setTimeout(() => {
        const tableContainer = this.tableContainer.querySelector('.table-container');
        if (tableContainer) {
          tableContainer.classList.add('fixed-height');
        }
      }, 0);
    }
  }

  /**
   * Initialize plugin system and register plugins
   */
  initializePluginSystem() {
    try {
      // Initialize plugin system if available
      if (typeof PluginSystem !== 'undefined') {
        this.pluginSystem = PluginSystem.init(this);
        
        // Register column resizer plugin if available and feature is enabled
        if (typeof ColumnResizerPlugin !== 'undefined') {
          this.pluginSystem.registerPlugin('column-resizer', ColumnResizerPlugin);
          this.pluginSystem.enablePlugin('column-resizer');
        }
      } else {
        console.warn('[ExceLikeTable] PluginSystem not available');
      }
    } catch (error) {
      console.error('[ExceLikeTable] Plugin system initialization failed:', error);
      this.pluginSystem = null;
    }
  }


  async init() {
    try {
      // Safely clear container
      if (DOMUtils) {
        DOMUtils.clearElement(this.container);
      } else {
        this.container.innerHTML = '';
      }
      this.container.className = 'excelike-table-wrapper';
      
      // Initialize plugin system
      this.initializePluginSystem();
      
      // 永続化システムの初期化（構造作成前に状態を復元）
      this.initializePersistence();
      
      this.createStructure();
      
      // Load saved settings after structure is created
      if (this.settingsManager) {
        await this.loadSettings();
      }
      
      // レンダリング前に保存された状態を復元
      this.loadState();
      
      this.render();
      this.attachEvents();
      
      // Auto-initialize conditional formatting plugin if available
      this.initializeConditionalFormatting();
    } catch (error) {
      console.error('[ExceLikeTable] Initialization failed:', error);
      throw error;
    }
  }

  createStructure() {
    // Main container
    this.tableContainer = document.createElement('div');
    this.tableContainer.className = 'excelike-table';
    
    // Check if parent container has fixed height
    this.checkFixedHeight();
    
    // Loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'table-loading';
    this.loadingOverlay.style.display = this.options.loading ? 'flex' : 'none';
    
    // Safe loading content
    if (DOMUtils) {
      const loadingText = DOMUtils.createElement('div', 'Loading...');
      this.loadingOverlay.appendChild(loadingText);
    } else {
      this.loadingOverlay.innerHTML = '<div>Loading...</div>';
    }
    
    // Table menu
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = 'table-menu-container';
    
    // Table wrapper
    this.tableWrapper = document.createElement('div');
    this.tableWrapper.className = 'table-container';
    
    // Table element
    this.table = document.createElement('table');
    this.table.className = `table ${this.options.bordered ? 'bordered' : ''} ${this.options.size}`;
    
    // Table header
    this.thead = document.createElement('thead');
    this.tbody = document.createElement('tbody');
    
    this.table.appendChild(this.thead);
    this.table.appendChild(this.tbody);
    this.tableWrapper.appendChild(this.table);
    
    // Pagination
    this.paginationContainer = document.createElement('div');
    this.paginationContainer.className = 'enhanced-table-pagination';
    
    // Assemble structure
    this.tableContainer.appendChild(this.loadingOverlay);
    this.tableContainer.appendChild(this.menuContainer);
    this.tableContainer.appendChild(this.tableWrapper);
    this.tableContainer.appendChild(this.paginationContainer);
    
    this.container.appendChild(this.tableContainer);
  }

  render() {
    // Notify plugins before rendering
    if (this.pluginSystem) {
      this.pluginSystem.emitHook('render:beforeRender', { fullRender: true });
    }
    
    this.applyFilters();
    this.renderMenu();
    this.renderHeader();
    this.renderBody();
    this.renderPagination();
    // Apply current styling after rendering
    this.applyCurrentStyling();
    
    // Notify plugins after rendering
    if (this.pluginSystem) {
      this.pluginSystem.emitHook('render:afterRender', { fullRender: true });
    }
  }

  renderMenu() {
    // Column settings always available (no feature check needed)

    let menuItems = [];

    // Clear filters option (filtering always enabled)
    menuItems.push(`<div class="table-menu-item" data-action="clear-all-filters"><i class="bi bi-funnel-fill"></i> ${this.i18n.t('menu.clearFilters')}</div>`);

    // Column settings
    menuItems.push(`<div class="table-menu-item" data-action="column-settings"><i class="bi bi-layout-three-columns"></i> ${this.i18n.t('menu.columnSettings')}</div>`);

    // Conditional formatting
    menuItems.push(`<div class="table-menu-item" data-action="conditional-formatting"><i class="bi bi-palette-fill"></i> ${this.i18n.t('menu.conditionalFormat')}</div>`);

    // Font size submenu
    menuItems.push(`
      <div class="table-menu-item table-menu-item-submenu" data-action="font-size">
        <i class="bi bi-fonts"></i> ${this.i18n.t('menu.fontSize')}
        <span class="submenu-arrow">▶</span>
        <div class="table-submenu-dropdown">
          <div class="table-menu-item ${this.state.fontSize === 'smallest' ? 'table-menu-item-current' : ''}" data-action="font-size" data-size="smallest">${this.i18n.t('fontSize.smallest')} ${this.state.fontSize === 'smallest' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.fontSize === 'small' ? 'table-menu-item-current' : ''}" data-action="font-size" data-size="small">${this.i18n.t('fontSize.small')} ${this.state.fontSize === 'small' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.fontSize === 'medium' ? 'table-menu-item-current' : ''}" data-action="font-size" data-size="medium">${this.i18n.t('fontSize.medium')} ${this.state.fontSize === 'medium' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.fontSize === 'large' ? 'table-menu-item-current' : ''}" data-action="font-size" data-size="large">${this.i18n.t('fontSize.large')} ${this.state.fontSize === 'large' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.fontSize === 'largest' ? 'table-menu-item-current' : ''}" data-action="font-size" data-size="largest">${this.i18n.t('fontSize.largest')} ${this.state.fontSize === 'largest' ? '✓' : ''}</div>
        </div>
      </div>
    `);

    // Cell padding submenu
    menuItems.push(`
      <div class="table-menu-item table-menu-item-submenu" data-action="cell-padding">
        <i class="bi bi-border-all"></i> ${this.i18n.t('menu.cellPadding')}
        <span class="submenu-arrow">▶</span>
        <div class="table-submenu-dropdown">
          <div class="table-menu-item ${this.state.cellPadding === 'wide' ? 'table-menu-item-current' : ''}" data-action="cell-padding" data-padding="wide">${this.i18n.t('cellPadding.wide')} ${this.state.cellPadding === 'wide' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.cellPadding === 'standard' ? 'table-menu-item-current' : ''}" data-action="cell-padding" data-padding="standard">${this.i18n.t('cellPadding.standard')} ${this.state.cellPadding === 'standard' ? '✓' : ''}</div>
          <div class="table-menu-item ${this.state.cellPadding === 'narrow' ? 'table-menu-item-current' : ''}" data-action="cell-padding" data-padding="narrow">${this.i18n.t('cellPadding.narrow')} ${this.state.cellPadding === 'narrow' ? '✓' : ''}</div>
        </div>
      </div>
    `);

    // Language selection submenu (only if i18n is initialized)
    if (this.i18n && typeof this.i18n.getAvailableLocales === 'function') {
      const currentLocale = this.i18n.getLocale();
    const availableLocales = this.i18n.getAvailableLocales();
    const localeNames = {
      'en': 'English',
      'ja': '日本語',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };

    menuItems.push(`
      <div class="table-menu-item table-menu-item-submenu" data-action="language">
        <i class="bi bi-globe"></i> ${this.i18n.t('menu.language')}
        <span class="submenu-arrow">▶</span>
        <div class="table-submenu-dropdown">
          ${availableLocales.map(locale => `
            <div class="table-menu-item ${currentLocale === locale ? 'table-menu-item-current' : ''}" data-action="language" data-locale="${locale}">
              ${localeNames[locale] || locale} ${currentLocale === locale ? '✓' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `);
    }

    // LocalStorage clear option (always available since plugins may store data)
    menuItems.push(`<div class="table-menu-item" data-action="clear-localstorage"><i class="bi bi-trash3-fill"></i> ${this.i18n.t('menu.clearStorage')}</div>`);

    this.menuContainer.innerHTML = `
      <div class="table-menu-wrapper">
        <button class="table-menu-btn" data-menu-toggle>⚙️</button>
        <div class="table-menu-dropdown" style="display: none;">
          ${menuItems.join('')}
        </div>
      </div>
    `;
  }

  renderHeader() {
    const headerRow = document.createElement('tr');
    
    // 新しい統一システムを使用
    const orderedColumns = this.getOrderedColumns();
    const positions = this.calculateAllColumnPositions();
    

    orderedColumns.all.forEach((column, index) => {
      const th = document.createElement('th');
      th.className = 'table-header';
      
      // 統一スタイル適用メソッドを使用
      this.applyColumnStyles(th, column, positions);

      const headerContent = document.createElement('div');
      headerContent.className = 'header-content';

      const title = document.createElement('span');
      title.className = 'header-title';
      title.textContent = column.title;
      
      // Add tooltip for header
      this.addTooltipToCell(title, column.title);

      const controls = document.createElement('div');
      controls.className = 'header-controls';

      // Sort controls
      if (column.sortable) {
        const sortControls = this.createSortControls(column);
        controls.appendChild(sortControls);
      }

      // Filter controls
      if (column.filterable) {
        const filterBtn = this.createFilterButton(column);
        controls.appendChild(filterBtn);
      }

      headerContent.appendChild(title);
      headerContent.appendChild(controls);
      
      // Resize handle (add to headerContent for proper positioning)
      if (true) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.dataset.column = column.key;
        headerContent.appendChild(resizeHandle);
      }

      th.appendChild(headerContent);

      headerRow.appendChild(th);
    });

    this.thead.innerHTML = '';
    this.thead.appendChild(headerRow);
  }

  createSortControls(column) {
    const sortControls = document.createElement('div');
    sortControls.className = 'sort-controls';

    const sortIndicator = document.createElement('div');
    sortIndicator.className = 'sort-indicator';
    sortIndicator.dataset.column = column.key;

    const upTriangle = document.createElement('span');
    upTriangle.className = `sort-triangle up ${this.state.sortState.column === column.key && this.state.sortState.direction === 'asc' ? 'active' : ''}`;

    const downTriangle = document.createElement('span');
    downTriangle.className = `sort-triangle down ${this.state.sortState.column === column.key && this.state.sortState.direction === 'desc' ? 'active' : ''}`;

    sortIndicator.appendChild(upTriangle);
    sortIndicator.appendChild(downTriangle);
    sortControls.appendChild(sortIndicator);

    return sortControls;
  }

  createFilterButton(column) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-dropdown-container';

    const filterBtn = document.createElement('button');
    filterBtn.className = `filter-btn ${this.hasActiveFilter(column.key) ? 'active' : ''}`;
    filterBtn.dataset.column = column.key;
    filterBtn.innerHTML = '<span class="filter-funnel"></span>';

    filterContainer.appendChild(filterBtn);
    return filterContainer;
  }

  renderBody() {
    this.tbody.innerHTML = '';
    
    // 新しい統一システムを使用
    const orderedColumns = this.getOrderedColumns();
    const positions = this.calculateAllColumnPositions();
    const paginatedData = this.getPaginatedData();
    

    paginatedData.forEach(record => {
      const row = document.createElement('tr');

      orderedColumns.all.forEach((column, index) => {
        const td = document.createElement('td');
        td.className = 'table-cell';
        
        // Add data attributes for conditional formatting
        td.dataset.column = column.key;

        // 統一スタイル適用メソッドを使用
        this.applyColumnStyles(td, column, positions);

        const value = record[column.dataIndex];
        td.dataset.value = value;
        const content = column.render ? column.render(value, record) : value;
        
        if (typeof content === 'string') {
          td.textContent = content;
        } else {
          td.innerHTML = content;
        }

        // Add tooltip for overflowing content
        this.addTooltipToCell(td, content);

        row.appendChild(td);
      });

      this.tbody.appendChild(row);
    });
  }

  renderPagination() {
    // Don't render pagination if disabled or feature is not enabled
    if (this.options.pagination === false) {
      this.paginationContainer.innerHTML = '';
      return;
    }

    const total = this.state.filteredData.length;
    const totalPages = Math.ceil(total / this.state.pageSize);
    const start = (this.state.currentPage - 1) * this.state.pageSize + 1;
    const end = Math.min(this.state.currentPage * this.state.pageSize, total);

    let paginationHTML = '';

    // Info
    if (this.options.pagination.showTotal) {
      const totalText = this.options.pagination.showTotal(total, [start, end]);
      paginationHTML += `<div class="pagination-info">${totalText}</div>`;
    } else {
      paginationHTML += `<div class="pagination-info">${this.i18n.t('pagination.total', { start, end, total })}</div>`;
    }

    // Controls
    paginationHTML += `
      <div class="pagination-controls">
        <button ${this.state.currentPage <= 1 ? 'disabled' : ''} data-page="${this.state.currentPage - 1}">${this.i18n.t('pagination.previous')}</button>
        <span class="page-info">${this.i18n.t('pagination.page', { page: this.state.currentPage })} / ${totalPages}</span>
        <button ${this.state.currentPage >= totalPages ? 'disabled' : ''} data-page="${this.state.currentPage + 1}">${this.i18n.t('pagination.next')}</button>
    `;

    // Page size selector
    if (this.options.pagination.showSizeChanger) {
      paginationHTML += `
        <div class="page-size-selector">
          <select class="page-size-select">
            <option value="5" ${this.state.pageSize === 5 ? 'selected' : ''}>5 ${this.i18n.t('pagination.itemsPerPage')}</option>
            <option value="10" ${this.state.pageSize === 10 ? 'selected' : ''}>10 ${this.i18n.t('pagination.itemsPerPage')}</option>
            <option value="20" ${this.state.pageSize === 20 ? 'selected' : ''}>20 ${this.i18n.t('pagination.itemsPerPage')}</option>
            <option value="50" ${this.state.pageSize === 50 ? 'selected' : ''}>50 ${this.i18n.t('pagination.itemsPerPage')}</option>
          </select>
        </div>
      `;
    }

    paginationHTML += '</div>';

    this.paginationContainer.innerHTML = paginationHTML;
  }

  // Utility methods
  getVisibleColumns() {
    return this.options.columns.filter(col => this.state.visibleColumns[col.key]);
  }

  getPaginatedData() {
    const start = (this.state.currentPage - 1) * this.state.pageSize;
    const end = start + this.state.pageSize;
    return this.state.filteredData.slice(start, end);
  }

  hasActiveFilter(columnKey) {
    return (this.state.filters[columnKey] && this.state.filters[columnKey].length > 0) || 
           (this.state.rangeFilters[columnKey] && this.state.rangeFilters[columnKey] !== null);
  }

  updateFilterButtonState(columnKey) {
    const filterBtn = this.tableContainer.querySelector(`.filter-btn[data-column="${columnKey}"]`);
    
    if (filterBtn) {
      // Check if ANY data is being filtered (not showing all data)
      const totalDataCount = this.options.data.length;
      const filteredDataCount = this.state.filteredData.length;
      const hasAnyFilter = filteredDataCount < totalDataCount;
      
      if (hasAnyFilter) {
        filterBtn.classList.add('active');
      } else {
        filterBtn.classList.remove('active');
      }
    }
  }

  // Event handlers
  handleSort(columnKey, direction) {
    if (direction === null) {
      // Reset sort to none
      this.state.sortState = { column: null, direction: null };
    } else {
      this.state.sortState = { column: columnKey, direction };
    }

    this.applySorting();
    this.render();
    this.autoSaveSettings();
    
    // Save state including sort state
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  }

  handleFilter(columnKey, filters) {
    this.state.filters[columnKey] = filters;
    this.state.currentPage = 1; // Reset to first page
    this.render();
    this.autoSaveSettings();
    
    // Save state including filter state
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  }

  handlePageChange(page) {
    const oldPage = this.state.currentPage;
    this.state.currentPage = page;
    this.renderBody();
    this.renderPagination();
    this.applyCurrentStyling(); // Apply current styling after page change
    
    // 🔄 Emit hook for pagination change
    if (this.pluginSystem) {
      this.pluginSystem.emitHook('pagination:afterChange', { 
        oldPage,
        newPage: page,
        pageSize: this.state.pageSize || this.options.pagination?.pageSize || 10
      });
    }
  }

  handleColumnResize(columnKey, newWidth) {
    // 新しい統一メソッドを使用（全体レンダリングを避けて特定列のみ更新）
    this.updateColumnWidth(columnKey, newWidth);
  }

  handleColumnToggle(columnKey, visible) {
    this.state.visibleColumns[columnKey] = visible;
    this.render();
    this.autoSaveSettings();
  }

  handleColumnPin(columnKey, pinned) {
    this.state.pinnedColumns[columnKey] = pinned;
    this.render();
    this.autoSaveSettings();
    
    // 自動保存（デバウンス）
    if (this.saveStateDebounced) {
      this.saveStateDebounced();
    }
  }

  // Data processing methods
  applyFilters(skipSorting = false) {
    let filtered = [...this.state.data];

    // Apply all filters
    Object.keys(this.state.filters).forEach(columnKey => {
      const filters = this.state.filters[columnKey];
      if (filters && filters.length > 0) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          // Skip value-based filter if column is in range mode
          const currentMode = this.state.filterModes?.[columnKey] || 'values';
          if (currentMode === 'range') {
            return; // Skip this column - range filter will handle it
          }
          
          if (column.filterType === 'date-hierarchy') {
            // Date hierarchy filter logic
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              
              // Handle empty values - check if empty value is in the filter list
              if (!value) {
                return filters.some(f => !f || f === 'null' || f === 'undefined' || f === '');
              }
              
              const date = new Date(value);
              const year = date.getFullYear().toString();
              const month = date.toLocaleString('default', { month: 'long' });
              
              return filters.some(filterValue => {
                if (filterValue === year) return true;
                if (filterValue === `${year}-${month}`) return true;
                return false;
              });
            });
          } else if (column.onFilter) {
            filtered = filtered.filter(record => 
              filters.some(filterValue => column.onFilter(filterValue, record))
            );
          } else if (this.isNumericColumn(column)) {
            // Numeric filter logic - compare as numbers
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              const numValue = parseFloat(value);
              
              // Handle empty values - check if empty value is in the filter list
              if (isNaN(numValue) || value === null || value === undefined || value === '') {
                return filters.some(f => {
                  const fNum = parseFloat(f);
                  return isNaN(fNum) || f === null || f === 'null' || f === 'undefined' || f === '';
                });
              }
              
              return filters.includes(numValue);
            });
          } else {
            // Default filter logic for text columns
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              
              // Normalize empty values for comparison
              // null, undefined, and '' should all match each other
              const isEmpty = value === null || value === undefined || value === '';
              
              return filters.some(filterValue => {
                const filterIsEmpty = filterValue === null || filterValue === 'null' || 
                                     filterValue === undefined || filterValue === 'undefined' || 
                                     filterValue === '';
                
                // If both are empty, they match
                if (isEmpty && filterIsEmpty) return true;
                
                // If one is empty and the other isn't, no match
                if (isEmpty !== filterIsEmpty) return false;
                
                // Both are non-empty, do exact comparison
                return value === filterValue;
              });
            });
          }
        }
      }
    });

    // Apply range filters
    Object.keys(this.state.rangeFilters).forEach(columnKey => {
      const rangeFilter = this.state.rangeFilters[columnKey];
      if (rangeFilter) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          // Check current filter mode
          const currentMode = this.state.filterModes?.[columnKey] || 'values';
          
          if (currentMode === 'range') {
            // Range mode: Filter by min <= value <= max
            // Default to true if undefined, but respect explicit false
            const includeBlanks = this.state.rangeIncludeBlanks?.[columnKey] !== undefined
              ? this.state.rangeIncludeBlanks[columnKey]
              : true;
            
            filtered = filtered.filter(record => {
              const rawValue = record[column.dataIndex];
              const value = parseFloat(rawValue);
              
              // Check if value is blank
              const isBlank = rawValue === null || rawValue === undefined || rawValue === '' || isNaN(value);
              
              // If blank and checkbox is checked, include it
              if (isBlank && includeBlanks) return true;
              
              // If blank and checkbox is not checked, exclude it
              if (isBlank && !includeBlanks) return false;
              
              // For numeric values, check range
              return value >= rangeFilter.min && value <= rangeFilter.max;
            });
          }
          // If mode is 'values', range filter is not applied (checkbox filter takes precedence)
        }
      }
    });

    // Apply date range filters
    Object.keys(this.state.dateRangeFilters || {}).forEach(columnKey => {
      const dateRangeFilter = this.state.dateRangeFilters[columnKey];
      if (dateRangeFilter && dateRangeFilter.startDate && dateRangeFilter.endDate) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          // Check current filter mode
          const currentMode = this.state.filterModes?.[columnKey] || 'values';
          
          if (currentMode === 'range') {
            // Range mode: Filter by startDate <= value <= endDate
            const startDate = new Date(dateRangeFilter.startDate);
            const endDate = new Date(dateRangeFilter.endDate);
            // Default to true if undefined, but respect explicit false
            const includeBlanks = this.state.dateRangeIncludeBlanks?.[columnKey] !== undefined
              ? this.state.dateRangeIncludeBlanks[columnKey]
              : true;
            
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              
              // Check if value is blank
              const isBlank = !value || value === null || value === undefined || value === '';
              
              // If blank and checkbox is checked, include it
              if (isBlank && includeBlanks) return true;
              
              // If blank and checkbox is not checked, exclude it
              if (isBlank && !includeBlanks) return false;
              
              const recordDate = new Date(value);
              return recordDate >= startDate && recordDate <= endDate;
            });
          }
          // If mode is 'values', date range filter is not applied (checkbox filter takes precedence)
        }
      }
    });

    this.state.filteredData = filtered;

    if (!skipSorting) {
      this.applySorting();
    }

    // 🔄 Emit hook for filter completion
    if (this.pluginSystem) {
      this.pluginSystem.emitHook('filter:afterApply', {
        filteredData: filtered,
        originalData: this.state.data,
        activeFilters: this.state.filters
      });
    }
  }

  applySorting() {
    if (this.state.sortState.column && this.state.sortState.direction) {
      const column = this.options.columns.find(col => col.key === this.state.sortState.column);
      if (column) {
        this.state.filteredData.sort((a, b) => {
          if (column.sorter) {
            return this.state.sortState.direction === 'asc' ?
              column.sorter(a, b) : column.sorter(b, a);
          } else {
            // Default sorting
            const aVal = a[column.dataIndex];
            const bVal = b[column.dataIndex];

            if (aVal < bVal) return this.state.sortState.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.state.sortState.direction === 'asc' ? 1 : -1;
            return 0;
          }
        });

        // 🔄 Emit hook for sort completion
        if (this.pluginSystem) {
          this.pluginSystem.emitHook('sort:afterSort', {
            sortedData: this.state.filteredData,
            column: this.state.sortState.column,
            direction: this.state.sortState.direction
          });
        }
      }
    } else if (this.state.sortState.column === null && this.state.sortState.direction === null) {
      // ✅ FIX Bug#8: When sort is cleared (direction = null), restore original order
      // Re-apply filters to get data in original order (skip sorting to avoid infinite loop)
      this.applyFilters(true);
    }
  }

  /**
   * Apply both filters and sorting for settings restoration
   * @private
   */
  applyFiltersAndSort() {
    // Safety check: ensure data exists
    if (!this.state.data || !Array.isArray(this.state.data)) {
      console.warn('applyFiltersAndSort: No valid data available');
      this.state.filteredData = [];
      return;
    }

    this.applyFilters();
    this.applySorting();
    
    // Safety check: ensure filtered data exists after processing
    if (!this.state.filteredData || !Array.isArray(this.state.filteredData)) {
      console.warn('applyFiltersAndSort: Filtered data is invalid, resetting to original data');
      this.state.filteredData = [...this.state.data];
    }
  }

  /**
   * Apply all current styling settings
   * @private
   */
  applyCurrentStyling() {
    this.applyFontSize();
    this.applyCellPadding();
  }

  // Event attachment
  attachEvents() {
    
    // Sort events
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.closest('.sort-indicator')) {
        const columnKey = e.target.closest('.sort-indicator').dataset.column;
        const currentDirection = this.state.sortState.column === columnKey ? this.state.sortState.direction : null;
        let newDirection;
        
        if (currentDirection === null) {
          newDirection = 'asc';  // None -> Ascending
        } else if (currentDirection === 'asc') {
          newDirection = 'desc'; // Ascending -> Descending
        } else {
          newDirection = null;   // Descending -> None
        }
        
        this.handleSort(columnKey, newDirection);
      }
    });

    // Filter events
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.closest('.filter-btn')) {
        const columnKey = e.target.closest('.filter-btn').dataset.column;
        this.toggleFilter(columnKey, e.target.closest('.filter-btn'));
      }
    });

    // Pagination events
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-page]')) {
        const page = parseInt(e.target.dataset.page);
        this.handlePageChange(page);
      }
    });

    // Page size change
    this.tableContainer.addEventListener('change', (e) => {
      if (e.target.matches('.page-size-select')) {
        const oldPageSize = this.state.pageSize || this.options.pagination?.pageSize || 10;
        this.state.pageSize = parseInt(e.target.value);
        this.state.currentPage = 1;
        // Re-render body and pagination with styling
        this.renderBody();
        this.renderPagination();
        this.applyCurrentStyling();
        this.autoSaveSettings();
        
        // 🔄 Emit hook for page size change
        if (this.pluginSystem) {
          this.pluginSystem.emitHook('pagination:afterChange', { 
            oldPage: 1,
            newPage: 1,
            oldPageSize,
            pageSize: this.state.pageSize,
            type: 'pageSize'
          });
        }
      }
    });

    // Menu toggle
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-menu-toggle]')) {
        const dropdown = e.target.nextElementSibling;
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      }
    });

    // Close menu when clicking outside
    this.documentClickHandler = (e) => {
      const menuWrapper = e.target.closest('.table-menu-wrapper');
      if (!menuWrapper) {
        // Click was outside all menu wrappers, close all dropdowns
        const allDropdowns = this.tableContainer.querySelectorAll('.table-menu-dropdown');
        allDropdowns.forEach(dropdown => {
          dropdown.style.display = 'none';
        });
      }
    };
    document.addEventListener('click', this.documentClickHandler);

    // Prevent menu from closing when clicking inside dropdown
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.closest('.table-menu-dropdown')) {
        e.stopPropagation();
      }
    });

    // Column settings
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="column-settings"]')) {
        this.showColumnSettings();
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Conditional formatting
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="conditional-formatting"]')) {
        this.showConditionalFormatting();
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Clear all filters
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="clear-all-filters"]')) {
        this.clearAllFilters();
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Clear LocalStorage
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="clear-localstorage"]')) {
        this.showLocalStorageClearConfirmation();
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Font size change
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="font-size"][data-size]')) {
        const size = e.target.dataset.size;
        this.setFontSize(size);
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Cell padding change
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="cell-padding"][data-padding]')) {
        const padding = e.target.dataset.padding;
        this.setCellPadding(padding);
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Language change
    this.tableContainer.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="language"][data-locale]')) {
        const locale = e.target.dataset.locale;
        this.setLanguage(locale);
        // Close menu
        const dropdown = e.target.closest('.table-menu-dropdown');
        dropdown.style.display = 'none';
      }
    });

    // Resize events
    this.attachResizeEvents();
  }

  attachResizeEvents() {
    let isResizing = false;
    let currentColumn = null;
    let startX = 0;
    let startWidth = 0;
    let lastClickTime = 0;
    let lastClickColumn = null; // Track the column from the last click
    let resizeTooltip = null;

    // Create resize tooltip element
    const createResizeTooltip = () => {
      if (!resizeTooltip) {
        resizeTooltip = document.createElement('div');
        resizeTooltip.className = 'resize-tooltip';
        resizeTooltip.style.display = 'none';
        document.body.appendChild(resizeTooltip);
      }
      return resizeTooltip;
    };

    // Update tooltip position and content
    const updateTooltip = (x, y, width) => {
      const tooltip = createResizeTooltip();
      const cm = TableUtils.pxToCm(width);
      
      tooltip.textContent = `${width}px (${cm}cm)`;
      
      // Position tooltip with smart positioning using config
      const offset = TABLE_CONFIG.SIZES.TOOLTIP_OFFSET;
      const position = TableUtils.constrainToViewport(tooltip, x, y, offset.x, -offset.y);
      
      tooltip.style.left = `${position.x}px`;
      tooltip.style.top = `${position.y}px`;
      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
    };

    // Hide tooltip
    const hideTooltip = () => {
      if (resizeTooltip) {
        resizeTooltip.style.opacity = '0';
        setTimeout(() => {
          if (resizeTooltip) {
            resizeTooltip.style.display = 'none';
          }
        }, TABLE_CONFIG.TIMING.TOOLTIP_FADE);
      }
    };

    this.tableContainer.addEventListener('mousedown', (e) => {
      if (e.target.matches('.resize-handle')) {
        const currentTime = Date.now();
        const columnKey = e.target.dataset.column;
        
        // Check for double click
        const timeDiff = currentTime - lastClickTime;
        
        if (timeDiff < TABLE_CONFIG.SIZES.DOUBLE_CLICK_THRESHOLD && lastClickColumn === columnKey) {
          // Double click - auto resize
          this.autoResizeColumn(columnKey);
          hideTooltip();
          e.preventDefault();
          // Reset click tracking
          lastClickTime = 0;
          lastClickColumn = null;
          return;
        }
        
        // Update click tracking
        lastClickTime = currentTime;
        lastClickColumn = columnKey;
        isResizing = true;
        currentColumn = columnKey;
        startX = e.clientX;
        startWidth = this.state.columnWidths[currentColumn];
        document.body.style.cursor = 'col-resize';
        
        // Show initial tooltip
        updateTooltip(e.clientX, e.clientY, startWidth);
        
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isResizing) {
        const diff = e.clientX - startX;
        const newWidth = Math.max(TABLE_CONFIG.SIZES.MIN_COLUMN_WIDTH, startWidth + diff);
        this.handleColumnResize(currentColumn, newWidth);
        
        // Update tooltip
        updateTooltip(e.clientX, e.clientY, newWidth);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        currentColumn = null;
        document.body.style.cursor = '';
        hideTooltip();
      }
    });
  }

  autoResizeColumn(columnKey) {
    const column = this.options.columns.find(col => col.key === columnKey);
    if (!column) return;

    // Create a temporary element to measure text width
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.fontSize = getComputedStyle(this.tableContainer).fontSize;
    tempElement.style.fontFamily = getComputedStyle(this.tableContainer).fontFamily;
    tempElement.style.padding = '8px 12px'; // Match cell padding
    document.body.appendChild(tempElement);

    let maxWidth = 0;

    // Measure header text width
    tempElement.textContent = column.title || column.key;
    const headerWidth = tempElement.offsetWidth + 40; // Add space for sort/filter icons
    maxWidth = Math.max(maxWidth, headerWidth);

    // Measure data cell content width
    const visibleData = this.getCurrentPageData();
    visibleData.forEach(row => {
      let cellContent = row[column.dataIndex] || '';
      
      // Apply render function if exists
      if (column.render && typeof column.render === 'function') {
        cellContent = column.render(cellContent, row);
        // Remove HTML tags for measurement
        if (typeof cellContent === 'string') {
          cellContent = cellContent.replace(/<[^>]*>/g, '');
        }
      }

      tempElement.textContent = String(cellContent);
      const cellWidth = tempElement.offsetWidth;
      maxWidth = Math.max(maxWidth, cellWidth);
    });

    // Clean up
    document.body.removeChild(tempElement);

    // Set minimum and maximum width limits
    const newWidth = Math.max(
      TABLE_CONFIG.SIZES.AUTO_RESIZE_MIN, 
      Math.min(maxWidth, TABLE_CONFIG.SIZES.AUTO_RESIZE_MAX)
    );

    // Apply the new width
    this.handleColumnResize(columnKey, newWidth);
  }

  getCurrentPageData() {
    const start = (this.state.currentPage - 1) * this.state.pageSize;
    const end = start + this.state.pageSize;
    return this.state.filteredData.slice(start, end);
  }

  /**
   * Save current table settings to storage
   * @returns {Promise<boolean>} Save success status
   */
  async saveSettings() {
    if (!this.settingsManager) {
      return false;
    }
    return await this.settingsManager.saveSettings(this);
  }

  /**
   * Load and apply saved settings from storage
   * @returns {Promise<boolean>} Load success status
   */
  async loadSettings() {
    if (!this.settingsManager) {
      return false;
    }
    const success = await this.settingsManager.loadSettings(this);
    if (success) {
      // Reapply filters and sorting after loading settings
      this.applyFilters();
      this.render();
    }
    return success;
  }

  /**
   * Clear saved settings from storage
   * @returns {Promise<boolean>} Clear success status
   */
  async clearSettings() {
    if (!this.settingsManager) {
      return false;
    }
    return await this.settingsManager.clearSettings();
  }

  /**
   * Auto-save settings when state changes
   * @private
   */
  async autoSaveSettings() {
    if (this.settingsManager && this.options.persistSettings) {
      // Debounce auto-save to avoid excessive saves
      clearTimeout(this._autoSaveTimeout);
      this._autoSaveTimeout = setTimeout(async () => {
        await this.saveSettings();
      }, 1000);
    }
  }

  // Filter dropdown implementation
  toggleFilter(columnKey, button) {
    if (this.state.openFilter === columnKey) {
      this.closeFilter();
      return;
    }

    this.closeFilter();
    this.state.openFilter = columnKey;
    
    const column = this.options.columns.find(col => col.key === columnKey);
    this.showFilterDropdown(column, button);
  }

  showFilterDropdown(column, button) {
    // Store original state for cancel functionality
    const originalFilters = JSON.parse(JSON.stringify(this.state.filters));
    const originalRangeFilters = JSON.parse(JSON.stringify(this.state.rangeFilters));
    const originalDateRangeFilters = JSON.parse(JSON.stringify(this.state.dateRangeFilters));
    const originalFilterModes = JSON.parse(JSON.stringify(this.state.filterModes || {}));
    const originalRangeIncludeBlanks = JSON.parse(JSON.stringify(this.state.rangeIncludeBlanks || {}));
    const originalDateRangeIncludeBlanks = JSON.parse(JSON.stringify(this.state.dateRangeIncludeBlanks || {}));

    // Create filter dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown-wrapper';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '9999';

    // Get unique values for the column
    // Normalize empty values (null, undefined, '') to a single representation
    const uniqueValues = [...new Set(this.state.data.map(item => {
      const value = item[column.dataIndex];
      // Normalize all empty values to null for consistent handling
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return value;
    }))];

    // Store current mode for UI initialization (DO NOT apply filters yet)
    // Filters will only be applied when user clicks OK button
    const currentMode = this.state.filterModes?.[column.key];

    const currentFilters = this.state.filters[column.key] || [];

    let dropdownContent = '';

    // Different filter types
    if (column.filterType === 'date-hierarchy') {
      dropdownContent = this.createDateHierarchyFilter(uniqueValues, currentFilters, column);
    } else if (this.isNumericColumn(column)) {
      dropdownContent = this.createRangeFilter(column, uniqueValues);
    } else {
      dropdownContent = this.createTextFilter(uniqueValues, currentFilters, column);
    }

    dropdown.innerHTML = `
      <div class="filter-dropdown">
        <div class="filter-dropdown-header">
          <div class="filter-dropdown-title">${column.title}</div>
        </div>
        ${dropdownContent}
        <div class="filter-dropdown-footer">
          <button class="filter-btn-clear-column">
            🔄 ${this.i18n.t('filter.clearColumn')}
          </button>
          <div class="filter-footer-actions">
            <button class="filter-btn-cancel">${this.i18n.t('filter.cancel')}</button>
            <button class="filter-btn-confirm">${this.i18n.t('filter.ok')}</button>
          </div>
        </div>
      </div>
    `;
    

    // Position dropdown
    document.body.appendChild(dropdown);
    
    // Get column header element to position next to the entire column
    const columnHeader = button.closest('.table-header');
    const headerRect = columnHeader ? columnHeader.getBoundingClientRect() : button.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Set maximum height to use available viewport height with margins
    const topMargin = 20;
    const bottomMargin = 20;
    const maxHeight = viewportHeight - topMargin - bottomMargin;
    dropdown.style.maxHeight = `${maxHeight}px`;
    
    // Force dropdown content area to use available height
    const contentArea = dropdown.querySelector('.filter-dropdown-content, .date-filter-content');
    if (contentArea) {
      // Calculate height for content area (total - header - footer)
      const headerHeight = dropdown.querySelector('.filter-dropdown-header')?.offsetHeight || 0;
      const searchHeight = dropdown.querySelector('.filter-dropdown-search')?.offsetHeight || 0;
      const rangeHeight = dropdown.querySelector('.filter-dropdown-range')?.offsetHeight || 0;
      const footerHeight = dropdown.querySelector('.filter-dropdown-footer')?.offsetHeight || 0;
      const contentMaxHeight = maxHeight - headerHeight - searchHeight - rangeHeight - footerHeight - 40; // 40px for padding/margins
      contentArea.style.maxHeight = `${Math.max(200, contentMaxHeight)}px`;
    }
    
    // Re-measure dropdown after height adjustments
    const updatedDropdownRect = dropdown.getBoundingClientRect();
    
    // Calculate horizontal position - prefer right side of column
    let left = headerRect.right + 5; // 5px gap from column
    
    // Check if dropdown fits on the right side
    if (left + updatedDropdownRect.width > viewportWidth) {
      // Not enough space on right, try left side
      left = headerRect.left - updatedDropdownRect.width - 5; // 5px gap from column
      
      // If still doesn't fit on left, align to viewport edges
      if (left < 5) {
        left = 5; // Minimum left margin
      }
    }
    
    // Calculate vertical position - center to column header with viewport constraints
    let top = headerRect.top + (headerRect.height - updatedDropdownRect.height) / 2;
    
    // Ensure dropdown stays within viewport with margins
    if (top < topMargin) {
      top = topMargin;
    } else if (top + updatedDropdownRect.height > viewportHeight - bottomMargin) {
      top = viewportHeight - updatedDropdownRect.height - bottomMargin;
    }
    
    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;

    // ✅ FIX Bug#7: Explicitly set date input values from state after DOM insertion
    // For date inputs, HTML attributes don't automatically sync to DOM properties when hidden/inactive
    // We need to explicitly set the .value property after the DOM is fully rendered
    if (column.filterType === 'date-hierarchy' && this.state.dateRangeFilters?.[column.key]) {
      const dateRangeFilter = this.state.dateRangeFilters[column.key];
      setTimeout(() => {
        const minInput = dropdown.querySelector('.date-range-min');
        const maxInput = dropdown.querySelector('.date-range-max');
        if (minInput && maxInput) {
          minInput.value = dateRangeFilter.startDate || '';
          maxInput.value = dateRangeFilter.endDate || '';
        }
      }, 0);
    }

    // Add event listeners
    this.attachFilterEvents(dropdown, column, originalFilters, originalRangeFilters, originalDateRangeFilters, originalFilterModes, originalRangeIncludeBlanks, originalDateRangeIncludeBlanks);
    
    // Add click outside detection
    const clickOutsideHandler = (e) => {
      // Check if the click is outside the dropdown and not on the filter button
      if (!dropdown.contains(e.target) && !e.target.closest('.filter-btn')) {
        this.closeFilter();
        document.removeEventListener('click', clickOutsideHandler);
      }
    };
    
    // Add event listener after a short delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', clickOutsideHandler);
    }, 0);
    
    // Store the handler so we can remove it when closing the filter
    dropdown._clickOutsideHandler = clickOutsideHandler;
  }

  createTextFilter(uniqueValues, currentFilters, column) {
    const isAllSelected = currentFilters.length === 0;
    
    // Sort values - empty values at top, then ascending order
    const sortedValues = [...uniqueValues].sort((a, b) => {
      const aIsEmpty = a === null || a === undefined || a === '';
      const bIsEmpty = b === null || b === undefined || b === '';
      
      // Empty values always come first
      if (aIsEmpty && !bIsEmpty) return -1;
      if (!aIsEmpty && bIsEmpty) return 1;
      if (aIsEmpty && bIsEmpty) return 0;
      
      // Both non-empty, sort alphabetically
      return String(a).localeCompare(String(b));
    });
    
    return `
      <div class="filter-dropdown-search">
        <input type="text" class="filter-search-input" placeholder="${this.i18n.t('filter.placeholder')}">
        </div>
      <div class="filter-dropdown-content">
        <div class="filter-option select-all">
          <label class="filter-option-label">
            <input type="checkbox" class="filter-checkbox" data-value="__all__" ${isAllSelected ? 'checked' : ''}>
            <span class="filter-option-text">${this.i18n.t('filter.all')} <span class="filter-option-count">(${this.countTotalDataItems(column)})</span></span>
          </label>
        </div>
        <div class="filter-options-list">
          ${sortedValues.map(value => `
            <div class="filter-option">
              <label class="filter-option-label">
                <input type="checkbox" class="filter-checkbox" data-value="${value}" ${isAllSelected || currentFilters.includes(value) ? 'checked' : ''}>
                <span class="filter-option-text">${value === null || value === undefined || value === '' ? '(空白)' : value} <span class="filter-option-count">(${this.countDataItems(column, value)})</span></span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }


  // Helper function to count data items for filter options
  countDataItems(column, value) {
    if (!this.state.data || !column) return 0;
    
    // Check if this is a date column and handle date-related values
    if (column.filterType === 'date-hierarchy' || this.isDateValue(value)) {
      return this.state.data.filter(row => {
        const cellValue = row[column.dataIndex];
        if (!cellValue) return false;
        
        const cellDateStr = cellValue.toString();
        
        if (value.length === 4 && /^\d{4}$/.test(value)) {
          // Year only (YYYY) - check if date starts with this year
          return cellDateStr.startsWith(value);
        } else if (value.length === 7 && /^\d{4}-\d{2}$/.test(value)) {
          // Year-Month (YYYY-MM) - check if date starts with this year-month
          return cellDateStr.startsWith(value);
        } else if (value.includes('-')) {
          // Full date (YYYY-MM-DD) - exact match
          return cellDateStr === value;
        } else {
          // Month name (e.g., "January") - convert to check against year-month format
          const yearContext = this.getCurrentYearContext(column, value);
          if (yearContext) {
            return cellDateStr.startsWith(yearContext);
          }
          return false;
        }
      }).length;
    } else {
      // Handle regular values (non-date)
      return this.state.data.filter(row => {
        const cellValue = row[column.dataIndex];
        return cellValue == value;
      }).length;
    }
  }

  // Helper function to check if a value looks like a date
  isDateValue(value) {
    if (typeof value !== 'string') return false;
    // Check for year (4 digits), year-month (YYYY-MM), or full date (YYYY-MM-DD)
    return /^\d{4}(-\d{2})?(-\d{2})?$/.test(value);
  }

  // Helper function to count total data items when all values are selected for a column
  countTotalDataItems(column) {
    if (!this.state.data || !column) return 0;
    
    // Start with all data
    let filteredData = [...this.state.data];
    
    // Apply filters from OTHER columns (not the current column)
    Object.entries(this.state.filters).forEach(([key, values]) => {
      if (key !== column.key && values && values.length > 0) {
        filteredData = filteredData.filter(row => values.includes(row[key]));
      }
    });
    
    // Apply range filters from OTHER columns
    Object.entries(this.state.rangeFilters).forEach(([key, range]) => {
      if (key !== column.key && range) {
        const col = this.options.columns.find(c => c.key === key);
        if (col) {
          filteredData = filteredData.filter(row => {
            const value = parseFloat(row[col.dataIndex]);
            if (isNaN(value)) return false;
            if (range.min !== '' && value < parseFloat(range.min)) return false;
            if (range.max !== '' && value > parseFloat(range.max)) return false;
            return true;
          });
        }
      }
    });
    
    // Apply date range filters from OTHER columns
    Object.entries(this.state.dateRangeFilters).forEach(([key, range]) => {
      if (key !== column.key && range && (range.start || range.end)) {
        const col = this.options.columns.find(c => c.key === key);
        if (col) {
          filteredData = filteredData.filter(row => {
            const value = row[col.dataIndex];
            if (!value) return false;
            const date = new Date(value);
            if (range.start && date < new Date(range.start)) return false;
            if (range.end && date > new Date(range.end)) return false;
            return true;
          });
        }
      }
    });
    
    return filteredData.length;
  }

  // Helper function to count data items for a specific month name within a year
  countDataItemsForMonth(column, year, monthName) {
    if (!this.state.data || !column) return 0;
    
    return this.state.data.filter(row => {
      const cellValue = row[column.dataIndex];
      if (!cellValue) return false;
      
      const date = new Date(cellValue);
      const itemYear = date.getFullYear();
      const itemMonth = date.toLocaleString('default', { month: 'long' });
      
      return itemYear == year && itemMonth === monthName;
    }).length;
  }

  // Helper function to get year context for month names
  getCurrentYearContext(column, monthName) {
    // Find the first data entry with this month name to get the year context
    const sampleData = this.state.data.find(row => {
      const cellValue = row[column.dataIndex];
      if (!cellValue) return false;
      const date = new Date(cellValue);
      const month = date.toLocaleString('default', { month: 'long' });
      return month === monthName;
    });
    
    if (sampleData) {
      const date = new Date(sampleData[column.dataIndex]);
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${monthNum}`;
    }
    
    return null;
  }

  createRangeFilter(column, uniqueValues) {
    const numericValues = uniqueValues.filter(v => v !== null && v !== undefined && v !== '' && !isNaN(v)).map(Number);
    // Prevent Infinity/-Infinity when array is empty
    const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;

    // Detect decimal places from data
    const decimalPlaces = TableUtils.getDecimalPlaces(uniqueValues.filter(v => !isNaN(v)).map(Number));

    const currentRange = this.state.rangeFilters[column.key] || { min, max };
    const currentFilters = this.state.filters[column.key] || [];

    // Determine current filter mode
    const currentMode = this.state.filterModes?.[column.key] || 'values';

    // Sort values - empty/null values at top, then ascending numeric order
    const sortedValues = [...uniqueValues].sort((a, b) => {
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      const aIsEmpty = isNaN(aNum) || a === null || a === undefined || a === '';
      const bIsEmpty = isNaN(bNum) || b === null || b === undefined || b === '';

      // Empty values always come first
      if (aIsEmpty && !bIsEmpty) return -1;
      if (!aIsEmpty && bIsEmpty) return 1;
      if (aIsEmpty && bIsEmpty) return 0;

      // Both are numbers, sort numerically
      return aNum - bNum;
    });

    // Determine "Select All" checkbox state
    const isAllSelected = currentFilters.length === 0;
    const isNoneSelected = currentFilters.length === 0 && this.state.filters[column.key] && this.state.filters[column.key].length === 0 && this.hasActiveFilter(column.key);
    const isPartiallySelected = currentFilters.length > 0 && currentFilters.length < sortedValues.length;

    let selectAllState = '';
    let selectAllChecked = '';
    if (isAllSelected && !this.hasActiveFilter(column.key)) {
      selectAllChecked = 'checked';
    } else if (isPartiallySelected) {
      selectAllState = 'indeterminate';
    }

    return `
      <div class="filter-mode-tabs">
        <button class="filter-mode-tab ${currentMode === 'range' ? 'active' : ''}" data-mode="range">範囲で絞り込む</button>
        <button class="filter-mode-tab ${currentMode === 'values' ? 'active' : ''}" data-mode="values">値を選択</button>
      </div>

      <div class="filter-mode-content">
        <!-- 範囲モードコンテンツ -->
        <div class="filter-mode-panel ${currentMode === 'range' ? 'active' : ''}" data-panel="range">
          <div class="filter-dropdown-range">
            <div class="range-filter">
              <div class="range-inputs">
                <div class="range-input-group">
                  <label class="range-label">Min</label>
                  <input type="number" class="range-input range-min" value="${TableUtils.formatNumberValue(currentRange.min, decimalPlaces)}" min="${min}" max="${max}" data-min="${min}" data-max="${max}" data-decimal-places="${decimalPlaces}">
                </div>
                <div class="range-input-group">
                  <label class="range-label">Max</label>
                  <input type="number" class="range-input range-max" value="${TableUtils.formatNumberValue(currentRange.max, decimalPlaces)}" min="${min}" max="${max}" data-min="${min}" data-max="${max}" data-decimal-places="${decimalPlaces}">
                </div>
              </div>
              <div class="number-range-slider-container">
                <div class="number-range-slider" data-min="${min}" data-max="${max}" data-current-min="${currentRange.min}" data-current-max="${currentRange.max}" data-decimal-places="${decimalPlaces}">
                  <div class="number-range-track"></div>
                  <div class="number-range-thumb number-range-thumb-min" data-type="min"></div>
                  <div class="number-range-thumb number-range-thumb-max" data-type="max"></div>
                </div>
              </div>
              <div class="range-blank-option">
                <label class="filter-option-label">
                  <input type="checkbox" class="range-include-blank-checkbox" ${(this.state.rangeIncludeBlanks && this.state.rangeIncludeBlanks[column.key] !== undefined) ? (this.state.rangeIncludeBlanks[column.key] ? 'checked' : '') : 'checked'}>
                  <span class="filter-option-text">空白を含む</span>
                </label>
              </div>
              <div class="range-description">
                ${TableUtils.formatNumberValue(currentRange.min, decimalPlaces)} 以上 ${TableUtils.formatNumberValue(currentRange.max, decimalPlaces)} 以下の値を表示
              </div>
            </div>
          </div>
        </div>

        <!-- 値選択モードコンテンツ -->
        <div class="filter-mode-panel ${currentMode === 'values' ? 'active' : ''}" data-panel="values">
          <div class="filter-dropdown-search">
            <input type="text" class="filter-search-input" placeholder="${this.i18n.t('filter.placeholder')}">
        </div>
          <div class="filter-dropdown-content">
            <div class="filter-option select-all">
              <label class="filter-option-label">
                <input type="checkbox" class="filter-checkbox" data-value="__all__" ${selectAllChecked} data-state="${selectAllState}">
                <span class="filter-option-text">${this.i18n.t('filter.all')} <span class="filter-option-count">(${this.countTotalDataItems(column)})</span></span>
              </label>
            </div>
            <div class="filter-options-list">
              ${sortedValues.map(value => {
                const isEmptyValue = value === null || value === undefined || value === '' || (typeof value === 'string' && value.toLowerCase() === 'null');
                let isChecked = false;

                if (currentFilters.length === 0 && !this.hasActiveFilter(column.key)) {
                  // No filters active, all checked
                  isChecked = true;
                } else if (isEmptyValue) {
                  // For empty values, check if null or 'null' is in the filter
                  isChecked = currentFilters.some(f => f === null || f === 'null' || f === '' || f === undefined);
                } else {
                  // For numeric values, check if the number is in the filter
                  isChecked = currentFilters.includes(Number(value));
                }

                return `
                <div class="filter-option">
                  <label class="filter-option-label">
                    <input type="checkbox" class="filter-checkbox" data-value="${value === null ? 'null' : value}" ${isChecked ? 'checked' : ''}>
                    <span class="filter-option-text">${isEmptyValue ? '(空白)' : value} <span class="filter-option-count">(${this.countDataItems(column, value)}</span></span>
                  </label>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createDateHierarchyFilter(values, currentFilters, column) {
    
    // Separate empty values from valid dates
    const emptyValues = values.filter(v => !v || v === null || v === undefined || v === '');
    const validValues = values.filter(v => v && v !== null && v !== undefined && v !== '');
    
    // Group dates by year/month/day
    const dateGroups = this.groupDatesByHierarchy(validValues);
    const isAllSelected = currentFilters.length === 0;
    const hasEmptyValues = emptyValues.length > 0;
    
    
    // Calculate date range for slider
    const dateValues = values.filter(v => v && !isNaN(new Date(v).getTime()));
    const minDate = dateValues.length > 0 ? new Date(Math.min(...dateValues.map(d => new Date(d).getTime()))).toISOString().split('T')[0] : '';
    const maxDate = dateValues.length > 0 ? new Date(Math.max(...dateValues.map(d => new Date(d).getTime()))).toISOString().split('T')[0] : '';
    
    // ✅ Get current date range filter OR use data min/max as defaults
    const currentDateRange = this.state.dateRangeFilters?.[column?.key] || { startDate: minDate, endDate: maxDate };

    // ✅ Use current filter values if they exist, otherwise fall back to defaults
    // Important: Check for undefined/null, not falsy, to handle empty strings correctly
    const displayStartDate = (currentDateRange.startDate !== undefined && currentDateRange.startDate !== null)
      ? currentDateRange.startDate
      : minDate;
    const displayEndDate = (currentDateRange.endDate !== undefined && currentDateRange.endDate !== null)
      ? currentDateRange.endDate
      : maxDate;

    // Get current filter mode for date column (default to 'values' for dates)
    const currentMode = this.state.filterModes[column.key] || 'values';

    return `
      <div class="filter-mode-tabs">
        <button class="filter-mode-tab ${currentMode === 'range' ? 'active' : ''}" data-mode="range">範囲で絞り込む</button>
        <button class="filter-mode-tab ${currentMode === 'values' ? 'active' : ''}" data-mode="values">値を選択</button>
      </div>

      <div class="filter-mode-content">
        <!-- 範囲モードコンテンツ -->
        <div class="filter-mode-panel ${currentMode === 'range' ? 'active' : ''}" data-panel="range">
          <div class="filter-dropdown-range">
            <div class="date-range-filter">
              <div class="date-range-inputs">
                <div class="date-range-input-group">
                  <label class="date-range-label">開始日</label>
                  <input type="date" class="date-range-input date-range-min" value="${displayStartDate}" min="${minDate}" max="${maxDate}">
                </div>
                <div class="date-range-input-group">
                  <label class="date-range-label">終了日</label>
                  <input type="date" class="date-range-input date-range-max" value="${displayEndDate}" min="${minDate}" max="${maxDate}">
                </div>
              </div>
              <div class="date-range-slider-container">
                <div class="date-range-slider" data-min="${minDate}" data-max="${maxDate}">
                  <div class="date-range-track"></div>
                  <div class="date-range-thumb date-range-thumb-min" data-type="min"></div>
                  <div class="date-range-thumb date-range-thumb-max" data-type="max"></div>
                </div>
              </div>
              <div class="range-blank-option">
                <label class="filter-option-label">
                  <input type="checkbox" class="date-range-include-blank-checkbox" ${(this.state.dateRangeIncludeBlanks && this.state.dateRangeIncludeBlanks[column.key] !== undefined) ? (this.state.dateRangeIncludeBlanks[column.key] ? 'checked' : '') : 'checked'}>
                  <span class="filter-option-text">空白を含む</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 値選択モードコンテンツ -->
        <div class="filter-mode-panel ${currentMode === 'values' ? 'active' : ''}" data-panel="values">
          <div class="filter-dropdown-search">
        <input type="text" class="filter-search-input" placeholder="${this.i18n.t('filter.placeholder')}">
        </div>
      <div class="date-expand-controls">
        <div class="expand-control-header">
          <span class="expand-control-label">展開表示:</span>
          <div class="expand-control-buttons">
            <button class="expand-control-btn active" data-level="year">年</button>
            <button class="expand-control-btn" data-level="month">月</button>
            <button class="expand-control-btn" data-level="day">日</button>
          </div>
        </div>
      </div>
      <div class="filter-dropdown-content">
        <div class="filter-option select-all">
          <label class="filter-option-label">
            <input type="checkbox" class="filter-checkbox" data-value="__all__" ${isAllSelected ? 'checked' : ''}>
            <span class="filter-option-text">${this.i18n.t('filter.all')} <span class="filter-option-count">(${this.countTotalDataItems(column)})</span></span>
          </label>
        </div>
        <div class="date-filter-content">
          ${hasEmptyValues ? `
            <div class="filter-option">
              <label class="filter-option-label">
                <input type="checkbox" class="filter-checkbox" data-value="" ${isAllSelected || currentFilters.some(f => !f || f === 'null' || f === 'undefined' || f === '') ? 'checked' : ''}>
                <span class="filter-option-text">(空白) <span class="filter-option-count">(${emptyValues.length})</span></span>
              </label>
            </div>
          ` : ''}
          ${Object.keys(dateGroups).map(year => `
            <div class="date-filter-group">
              <div class="date-filter-group-header">
                <button class="expand-btn">▼</button>
                <label class="date-filter-label">
                  <input type="checkbox" class="date-filter-checkbox" data-value="${year}" ${isAllSelected || this.isYearSelected(year, dateGroups[year], currentFilters) ? 'checked' : ''}>
                  <span class="date-filter-text">${year} <span class="filter-option-count">(${this.countDataItems(column, year)})</span></span>
                </label>
              </div>
              <div class="date-filter-children">
                ${Object.keys(dateGroups[year]).map(month => `
                  <div class="date-filter-item date-filter-month">
                    <div class="date-filter-month-header">
                      <button class="expand-btn expand-btn-month">▼</button>
                      <label class="date-filter-label">
                        <input type="checkbox" class="date-filter-checkbox" data-value="${year}-${month}" ${isAllSelected || this.isMonthSelected(year, month, dateGroups[year][month], currentFilters) ? 'checked' : ''}>
                        <span class="date-filter-text">${month} <span class="filter-option-count">(${this.countDataItemsForMonth(column, year, month)})</span></span>
                      </label>
                    </div>
                    <div class="date-filter-days">
                      ${dateGroups[year][month].map(dateValue => `
                        <div class="date-filter-item date-filter-day">
                          <label class="date-filter-label">
                            <input type="checkbox" class="date-filter-checkbox" data-value="${dateValue}" ${isAllSelected || currentFilters.includes(dateValue) ? 'checked' : ''}>
                            <span class="date-filter-text">${new Date(dateValue).getDate()}日 <span class="filter-option-count">(${this.countDataItems(column, dateValue)})</span></span>
                          </label>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
        </div>
      </div>
    `;
  }

  attachFilterEvents(dropdown, column, originalFilters, originalRangeFilters, originalDateRangeFilters, originalFilterModes, originalRangeIncludeBlanks, originalDateRangeIncludeBlanks) {
    // Tab switching for numeric filters
    const modeTabs = dropdown.querySelectorAll('.filter-mode-tab');
    if (modeTabs.length > 0) {
      modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const mode = tab.dataset.mode;

          // Update tab active state
          modeTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          // Update panel active state
          const panels = dropdown.querySelectorAll('.filter-mode-panel');
          panels.forEach(panel => {
            if (panel.dataset.panel === mode) {
              panel.classList.add('active');
            } else {
              panel.classList.remove('active');
            }
          });

          // Save mode to state (preview mode - not applied yet)
          this.state.filterModes[column.key] = mode;

          // ✅ FIX Bug#7: When switching to range tab, explicitly set date input values from state
          // This ensures the DOM .value property is correct even after tab switching
          if (mode === 'range' && column.filterType === 'date-hierarchy' && this.state.dateRangeFilters?.[column.key]) {
            const minInput = dropdown.querySelector('.date-range-min');
            const maxInput = dropdown.querySelector('.date-range-max');
            if (minInput && maxInput) {
              minInput.value = this.state.dateRangeFilters[column.key].startDate || minInput.value;
              maxInput.value = this.state.dateRangeFilters[column.key].endDate || maxInput.value;
            }
          }

          // Clear conflicting filters when switching modes (for consistency)
          if (mode === 'range') {
            // Switching to range mode - clear value-based filters
            delete this.state.filters[column.key];
            
            // Initialize blank checkbox state to true (include blanks by default)
            if (column.filterType === 'date-hierarchy') {
              // Date range
              // ✅ FIX Bug#7: Only read from inputs if NO existing filter
              // If we have an existing dateRangeFilter, keep it (inputs already have correct values)
              if (!this.state.dateRangeFilters[column.key]) {
                const dateRangeMin = dropdown.querySelector('.date-range-min');
                const dateRangeMax = dropdown.querySelector('.date-range-max');
                if (dateRangeMin && dateRangeMax) {
                  this.state.dateRangeFilters[column.key] = {
                    startDate: dateRangeMin.value,
                    endDate: dateRangeMax.value
                  };
                }
              }
              // If existing filter exists, keep it - don't overwrite from potentially incorrect input values
              // Initialize blank checkbox if not already set
              if (!this.state.dateRangeIncludeBlanks) {
                this.state.dateRangeIncludeBlanks = {};
              }
              if (this.state.dateRangeIncludeBlanks[column.key] === undefined) {
                this.state.dateRangeIncludeBlanks[column.key] = true;
              }
            } else {
              // Numeric range
              if (!this.state.rangeIncludeBlanks) {
                this.state.rangeIncludeBlanks = {};
              }
              if (this.state.rangeIncludeBlanks[column.key] === undefined) {
                this.state.rangeIncludeBlanks[column.key] = true;
              }
            }
          } else if (mode === 'values') {
            // Switching to values mode - clear range filters
            delete this.state.rangeFilters[column.key];
            delete this.state.dateRangeFilters[column.key];
          }

          // ⚠️ REMOVED: Do NOT apply filters here - wait for user to click OK
          // User is just switching tabs to preview different modes
        });
      });
    }

    // Add event listeners for number range slider
    const rangeMinInput = dropdown.querySelector('.range-min');
    const rangeMaxInput = dropdown.querySelector('.range-max');
    const numberSlider = dropdown.querySelector('.number-range-slider');
    const rangeIncludeBlankCheckbox = dropdown.querySelector('.range-include-blank-checkbox');

    if (rangeMinInput && rangeMaxInput && numberSlider) {
      const track = numberSlider.querySelector('.number-range-track');
      const minThumb = numberSlider.querySelector('.number-range-thumb-min');
      const maxThumb = numberSlider.querySelector('.number-range-thumb-max');
      
      const min = parseFloat(numberSlider.dataset.min);
      const max = parseFloat(numberSlider.dataset.max);
      const range = max - min;
      const decimalPlaces = parseInt(numberSlider.dataset.decimalPlaces) || 0;

      const updateSlider = () => {
        const minVal = parseFloat(rangeMinInput.value);
        const maxVal = parseFloat(rangeMaxInput.value);
        
        const minPercent = ((minVal - min) / range) * 100;
        const maxPercent = ((maxVal - min) / range) * 100;
        
        minThumb.style.left = `${minPercent}%`;
        maxThumb.style.left = `${maxPercent}%`;
        
        track.style.left = `${minPercent}%`;
        track.style.width = `${maxPercent - minPercent}%`;
        
        // Update description
        const descriptionEl = dropdown.querySelector('.range-description');
        if (descriptionEl) {
          descriptionEl.textContent = `${TableUtils.formatNumberValue(minVal, decimalPlaces)} 以上 ${TableUtils.formatNumberValue(maxVal, decimalPlaces)} 以下の値を表示`;
        }
      };

      // Initial update
      updateSlider();

      // Input change events
      rangeMinInput.addEventListener('input', () => {
        let value = parseFloat(rangeMinInput.value);
        const maxValue = parseFloat(rangeMaxInput.value);
        if (value > maxValue) {
          rangeMinInput.value = maxValue;
        }
        updateSlider();
        applyRealtimeFilter();
      });

      rangeMaxInput.addEventListener('input', () => {
        let value = parseFloat(rangeMaxInput.value);
        const minValue = parseFloat(rangeMinInput.value);
        if (value < minValue) {
          rangeMaxInput.value = minValue;
        }
        updateSlider();
        applyRealtimeFilter();
      });

      // Thumb drag events
      let isDragging = false;
      let currentThumb = null;

      const startDrag = (e, thumb) => {
        isDragging = true;
        currentThumb = thumb;
        e.preventDefault();
      };

      const drag = (e) => {
        if (!isDragging || !currentThumb) return;
        
        const rect = numberSlider.getBoundingClientRect();
        // Safe touch event handling with optional chaining
        const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const value = min + (percent / 100) * range;
        
        // Round to appropriate decimal places
        const roundedValue = decimalPlaces > 0 
          ? Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
          : Math.round(value);
        
        if (currentThumb.dataset.type === 'min') {
          const maxVal = parseFloat(rangeMaxInput.value);
          const newMinVal = roundedValue <= maxVal ? roundedValue : maxVal;
          rangeMinInput.value = TableUtils.formatNumberValue(newMinVal, decimalPlaces);
        } else {
          const minVal = parseFloat(rangeMinInput.value);
          const newMaxVal = roundedValue >= minVal ? roundedValue : minVal;
          rangeMaxInput.value = TableUtils.formatNumberValue(newMaxVal, decimalPlaces);
        }
        
        updateSlider();
        applyRealtimeFilter();
      };

      const stopDrag = () => {
        isDragging = false;
        currentThumb = null;
      };

      // Mouse events
      minThumb.addEventListener('mousedown', (e) => startDrag(e, minThumb));
      maxThumb.addEventListener('mousedown', (e) => startDrag(e, maxThumb));
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      
      // Touch events
      minThumb.addEventListener('touchstart', (e) => startDrag(e, minThumb), { passive: false });
      maxThumb.addEventListener('touchstart', (e) => startDrag(e, maxThumb), { passive: false });
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('touchend', stopDrag);
    }

    // Checkbox for including blank values
    if (rangeIncludeBlankCheckbox) {
      rangeIncludeBlankCheckbox.addEventListener('change', () => {
        if (!this.state.rangeIncludeBlanks) {
          this.state.rangeIncludeBlanks = {};
        }
        this.state.rangeIncludeBlanks[column.key] = rangeIncludeBlankCheckbox.checked;
        applyRealtimeFilter();
      });
    }

    // Add event listeners for date range inputs
    const dateRangeMinInput = dropdown.querySelector('.date-range-min');
    const dateRangeMaxInput = dropdown.querySelector('.date-range-max');
    const dateRangeIncludeBlankCheckbox = dropdown.querySelector('.date-range-include-blank-checkbox');

    if (dateRangeMinInput && dateRangeMaxInput) {
      dateRangeMinInput.addEventListener('input', () => {
        applyRealtimeFilter();
      });

      dateRangeMaxInput.addEventListener('input', () => {
        applyRealtimeFilter();
      });
    }

    // Checkbox for including blank values in date range
    if (dateRangeIncludeBlankCheckbox) {
      dateRangeIncludeBlankCheckbox.addEventListener('change', () => {
        if (!this.state.dateRangeIncludeBlanks) {
          this.state.dateRangeIncludeBlanks = {};
        }
        this.state.dateRangeIncludeBlanks[column.key] = dateRangeIncludeBlankCheckbox.checked;
        applyRealtimeFilter();
      });
    }

    // Real-time filtering function
    const applyRealtimeFilter = () => {
      if (this.isNumericColumn(column)) {
        const currentMode = this.state.filterModes[column.key] || 'values';

        if (currentMode === 'range') {
          // Range mode: Use min/max inputs
          const minInput = dropdown.querySelector('.range-min');
          const maxInput = dropdown.querySelector('.range-max');

          if (minInput && maxInput) {
            const min = parseFloat(minInput.value);
            const max = parseFloat(maxInput.value);

            // ✅ Store range filter (preview state - NOT applied yet)
            this.state.rangeFilters[column.key] = { min, max };

            // ✅ Clear conflicting value-based filter
            delete this.state.filters[column.key];

            // ⚠️ REMOVED: Real-time application
            // Filters will be applied only when user clicks OK button
            // This allows users to preview and adjust before confirming
          }
        } else {
          // Values mode: Use checkboxes
          const selectedValues = Array.from(dropdown.querySelectorAll('.filter-checkbox:checked'))
            .map(cb => cb.dataset.value)
            .filter(val => val !== '__all__')
            .map(val => {
              // Handle empty values (null, 'null', undefined, '')
              if (val === 'null' || val === 'undefined' || val === '' || val === null || val === undefined) {
                return null;
              }
              return parseFloat(val);
            });

          // Clear range filter to avoid conflicts
          delete this.state.rangeFilters[column.key];

          // If all values are selected, treat as no filter
          const allCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])');
          if (selectedValues.length === allCheckboxes.length) {
            this.handleFilter(column.key, []);
          } else {
            // Use numeric values directly for filtering
            this.handleFilter(column.key, selectedValues);
          }
        }
      } else if (column.filterType === 'date-hierarchy') {
        // Get current mode for date filter
        const currentMode = this.state.filterModes[column.key] || 'values';

        if (currentMode === 'range') {
          // Range mode: Use date range inputs
          const minInput = dropdown.querySelector('.date-range-min');
          const maxInput = dropdown.querySelector('.date-range-max');

          if (minInput && maxInput) {
            // ✅ Store date range filter (preview state - NOT applied yet)
            this.state.dateRangeFilters[column.key] = {
              startDate: minInput.value,
              endDate: maxInput.value
            };

            // ✅ Clear conflicting value-based filter
            delete this.state.filters[column.key];

            // ⚠️ REMOVED: Real-time application
            // Filters will be applied only when user clicks OK button
          }
        } else {
          // Values mode: Use checkboxes
          const selectedValues = Array.from(dropdown.querySelectorAll('.filter-checkbox:checked, .date-filter-checkbox:checked'))
            .map(cb => cb.dataset.value)
            .filter(val => val !== '__all__');

          // Clear date range filter to avoid conflicts
          delete this.state.dateRangeFilters[column.key];

          // If all values are selected, treat as no filter
          const allCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]), .date-filter-checkbox');
          if (selectedValues.length === allCheckboxes.length) {
            this.handleFilter(column.key, []);
          } else {
            this.handleFilter(column.key, selectedValues);
          }
        }
      } else {
        // Handle regular text filter
        const selectedValues = Array.from(dropdown.querySelectorAll('.filter-checkbox:checked'))
          .map(cb => cb.dataset.value)
          .filter(val => val !== '__all__');

        // If all values are selected, treat as no filter
        const allCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])');
        if (selectedValues.length === allCheckboxes.length) {
          this.handleFilter(column.key, []);
        } else {
          this.handleFilter(column.key, selectedValues);
        }
      }
      
      // Update filter button state after applying real-time filter
      this.updateFilterButtonState(column.key);
    };

    // Cancel button - restore original state
    dropdown.querySelector('.filter-btn-cancel').addEventListener('click', () => {
      // ✅ Restore ALL filter state to original values
      this.state.filters = originalFilters;
      this.state.rangeFilters = originalRangeFilters;
      this.state.dateRangeFilters = originalDateRangeFilters;
      this.state.filterModes = originalFilterModes;
      this.state.rangeIncludeBlanks = originalRangeIncludeBlanks;
      this.state.dateRangeIncludeBlanks = originalDateRangeIncludeBlanks;
      this.state.currentPage = 1;
      
      // ✅ Re-apply filters with restored state (don't just restore filteredData)
      this.applyFilters();
      this.renderBody();
      this.renderPagination();
      
      this.closeFilter();
      
      // Update filter button state after state restoration is complete
      this.updateFilterButtonState(column.key);
    });

    // Clear column filter button
    const clearBtn = dropdown.querySelector('.filter-btn-clear-column');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        // Clear all filter types for this column
        this.state.filters[column.key] = [];
        delete this.state.rangeFilters[column.key];
        delete this.state.dateRangeFilters[column.key];
        if (this.state.rangeIncludeBlanks) delete this.state.rangeIncludeBlanks[column.key];
        if (this.state.dateRangeIncludeBlanks) delete this.state.dateRangeIncludeBlanks[column.key];
        if (this.state.filterModes) delete this.state.filterModes[column.key];
        
        this.render();
        this.closeFilter();
        this.autoSaveSettings();
      });
    }

    // OK button - Apply filters when user confirms
    dropdown.querySelector('.filter-btn-confirm').addEventListener('click', () => {
      // ✅ NOW we apply the filters that were prepared in state
      // This is the ONLY place where filters are actually applied to the table
      
      this.applyFilters();
      this.renderBody();
      this.renderPagination();
      
      // ✅ Save to LocalStorage only after successful application
      if (this.saveStateDebounced) {
        this.saveStateDebounced();
      }
      
      // Update filter button state after final filter application
      this.updateFilterButtonState(column.key);
      this.closeFilter();
    });

    // Function to update OK button state
    const updateOkButtonState = () => {
      const confirmBtn = dropdown.querySelector('.filter-btn-confirm');
      if (!confirmBtn) return;

      const checkedBoxes = dropdown.querySelectorAll('.filter-checkbox:checked:not([data-value="__all__"]), .date-filter-checkbox:checked');
      const hasCheckedItems = checkedBoxes.length > 0;
      
      confirmBtn.disabled = !hasCheckedItems;
    };

    // Select all functionality
    const selectAllCheckbox = dropdown.querySelector('[data-value="__all__"]');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const searchInput = dropdown.querySelector('.filter-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        if (searchTerm) {
          // When searching, only affect visible items
          const allOptions = dropdown.querySelectorAll('.filter-option:not(.select-all)');
          allOptions.forEach(option => {
            if (option.style.display !== 'none') {
              const checkbox = option.querySelector('.filter-checkbox');
              if (checkbox) checkbox.checked = e.target.checked;
            }
          });
        } else {
          // No search term, affect all checkboxes
          const checkboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]), .date-filter-checkbox');
          checkboxes.forEach(cb => cb.checked = e.target.checked);
        }
        
        // Reset indeterminate state
        e.target.indeterminate = false;
        
        // For numeric columns, don't update slider range when "select all" changes
        // The slider should maintain its user-set range
        
        // Update OK button state
        updateOkButtonState();
        
        // Apply real-time filtering
        applyRealtimeFilter();
      });
    }

    // Individual checkbox change events (exclude date hierarchy checkboxes handled separately)
    let checkboxSelector = '.filter-checkbox:not([data-value="__all__"])';
    if (column.filterType !== 'date-hierarchy') {
      checkboxSelector += ', .date-filter-checkbox';
    }
    const allCheckboxes = dropdown.querySelectorAll(checkboxSelector);
    allCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        // Update "Select All" checkbox state for all filter types
        if (this.isNumericColumn(column)) {
          this.updateRangeFromCheckbox(dropdown, column);
        } else {
          // For non-numeric columns, update select all checkbox state
          if (selectAllCheckbox) {
            const totalCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]), .date-filter-checkbox');
            const checkedCheckboxes = dropdown.querySelectorAll('.filter-checkbox:checked:not([data-value="__all__"]), .date-filter-checkbox:checked');
            
            TableUtils.updateSelectAllState(selectAllCheckbox, allCheckboxes);
          }
        }
        
        // Update OK button state
        updateOkButtonState();
        
        // Apply real-time filtering
        applyRealtimeFilter();
      });
    });

    // Initial OK button state
    updateOkButtonState();

    // Search functionality
    const searchInput = dropdown.querySelector('.filter-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const options = dropdown.querySelectorAll('.filter-option:not(.select-all)');
        const selectAllCheckbox = dropdown.querySelector('[data-value="__all__"]');
        
        // First pass: show/hide options and handle checkboxes
        options.forEach(option => {
          const text = option.querySelector('.filter-option-text')?.textContent.toLowerCase() || '';
          const checkbox = option.querySelector('.filter-checkbox');
          const matches = text.includes(searchTerm);
          
          option.style.display = matches || searchTerm === '' ? 'block' : 'none';
          
          // Auto-check matching items when searching
          if (searchTerm !== '' && matches) {
            checkbox.checked = true;
          } else if (searchTerm !== '' && !matches) {
            // Uncheck non-matching items when searching
            checkbox.checked = false;
          }
          // When search is empty, keep existing checked state
        });
        
        // Always update select all checkbox state based on ALL items (not just visible)
        if (selectAllCheckbox) {
          const allCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])');
          const checkedCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]):checked');
          const totalCount = allCheckboxes.length;
          const checkedCount = checkedCheckboxes.length;
          
          if (checkedCount === 0) {
            // No items selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
          } else if (checkedCount === totalCount) {
            // All items selected
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
          } else {
            // Some items selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
          }
        }
        
        // Update OK button state
        updateOkButtonState();
        
        // Apply real-time filtering if search term is present
        if (searchTerm !== '') {
          applyRealtimeFilter();
        }
        
        // For date filters, handle the hierarchy
        if (column.filterType === 'date-hierarchy') {
          const dateGroups = dropdown.querySelectorAll('.date-filter-group');
          dateGroups.forEach(group => {
            const groupText = group.querySelector('.date-filter-text')?.textContent.toLowerCase() || '';
            const monthItems = group.querySelectorAll('.date-filter-month');
            const dayItems = group.querySelectorAll('.date-filter-day');
            let groupVisible = false;
            
            // Check year
            if (groupText.includes(searchTerm) || searchTerm === '') {
              groupVisible = true;
            }
            
            // Check months
            monthItems.forEach(month => {
              const monthText = month.querySelector('.date-filter-text')?.textContent.toLowerCase() || '';
              const monthMatches = monthText.includes(searchTerm) || searchTerm === '';
              month.style.display = monthMatches ? 'block' : 'none';
              if (monthMatches) groupVisible = true;
              
              // Check days within month
              const days = month.querySelectorAll('.date-filter-day');
              days.forEach(day => {
                const dayText = day.querySelector('.date-filter-text')?.textContent.toLowerCase() || '';
                day.style.display = (dayText.includes(searchTerm) || searchTerm === '') ? 'block' : 'none';
              });
            });
            
            group.style.display = groupVisible ? 'block' : 'none';
          });
        }
      });
    }

    // Range slider functionality
    this.attachRangeSliderEvents(dropdown, column, applyRealtimeFilter);

    // Date range slider functionality
    this.attachDateRangeSliderEvents(dropdown, column, applyRealtimeFilter);

    // Date hierarchy expand/collapse (only for date columns)
    if (column.filterType === 'date-hierarchy') {
      this.attachDateHierarchyEvents(dropdown, column, applyRealtimeFilter);
    } else {
    }
    
    // Set initial "Select All" checkbox state after dropdown is created
    this.updateSelectAllCheckboxState(dropdown, column);
  }

  updateSelectAllCheckboxState(dropdown, column) {
    const selectAllCheckbox = dropdown.querySelector('[data-value="__all__"]');
    if (!selectAllCheckbox) return;
    
    const allCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]), .date-filter-checkbox');
    const checkedCheckboxes = dropdown.querySelectorAll('.filter-checkbox:checked:not([data-value="__all__"]), .date-filter-checkbox:checked');
    
    // Handle indeterminate state from data attribute
    const stateAttr = selectAllCheckbox.dataset.state;
    if (stateAttr === 'indeterminate') {
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.checked = false;
    } else {
      // Normal state handling
      if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    }
  }

  updateSliderFromCheckboxes(dropdown, column) {
    if (!this.isNumericColumn(column)) return;
    
    const minInput = dropdown.querySelector('.range-min');
    const maxInput = dropdown.querySelector('.range-max');
    if (!minInput || !maxInput) return;
    
    const checkedCheckboxes = dropdown.querySelectorAll('.filter-checkbox:checked:not([data-value="__all__"])');
    if (checkedCheckboxes.length === 0) return;
    
    const checkedValues = Array.from(checkedCheckboxes)
      .map(cb => parseFloat(cb.dataset.value))
      .filter(val => !isNaN(val));
    
    if (checkedValues.length > 0) {
      const minVal = Math.min(...checkedValues);
      const maxVal = Math.max(...checkedValues);
      
      const decimalPlaces = parseInt(minInput.dataset.decimalPlaces) || 0;
      minInput.value = TableUtils.formatNumberValue(minVal, decimalPlaces);
      maxInput.value = TableUtils.formatNumberValue(maxVal, decimalPlaces);
    }
  }

  updateDateSliderFromCheckboxes(dropdown, column) {
    const minInput = dropdown.querySelector('.date-range-min');
    const maxInput = dropdown.querySelector('.date-range-max');
    if (!minInput || !maxInput) return;
    
    const checkedCheckboxes = dropdown.querySelectorAll('.date-filter-checkbox:checked');
    if (checkedCheckboxes.length === 0) return;
    
    const checkedDates = Array.from(checkedCheckboxes)
      .map(cb => cb.dataset.value)
      .filter(val => val && val !== '__all__' && /^\d{4}-\d{2}-\d{2}$/.test(val))
      .map(val => new Date(val))
      .filter(date => !isNaN(date.getTime()));
    
    if (checkedDates.length > 0) {
      const minDate = new Date(Math.min(...checkedDates));
      const maxDate = new Date(Math.max(...checkedDates));
      
      minInput.value = minDate.toISOString().split('T')[0];
      maxInput.value = maxDate.toISOString().split('T')[0];
    }
  }

  updateDateCheckboxFromRange(dropdown, column) {
    const minInput = dropdown.querySelector('.date-range-min');
    const maxInput = dropdown.querySelector('.date-range-max');
    if (!minInput || !maxInput) return;
    
    const startDate = new Date(minInput.value);
    const endDate = new Date(maxInput.value);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
    
    const dateCheckboxes = dropdown.querySelectorAll('.date-filter-checkbox');
    dateCheckboxes.forEach(cb => {
      const value = cb.dataset.value;
      if (value && value !== '__all__') {
        // Handle individual date values (YYYY-MM-DD format)
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const date = new Date(value);
          cb.checked = date >= startDate && date <= endDate;
        }
        // Handle year values (YYYY format)
        else if (/^\d{4}$/.test(value)) {
          const year = parseInt(value);
          const startYear = startDate.getFullYear();
          const endYear = endDate.getFullYear();
          
          // For year checkboxes, don't set state directly - let hierarchy logic handle it
          // This prevents conflicts with indeterminate state management
          // The year state will be calculated by updateDateParentCheckboxes after individual dates are processed
        }
        // Handle year-month values (YYYY-MonthName format)
        else if (/^\d{4}-.+$/.test(value)) {
          const [year, monthName] = value.split('-');
          const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
          
          // For month checkboxes, don't set state directly - let hierarchy logic handle it
          // This prevents conflicts with indeterminate state management
          // The month state will be calculated by updateDateParentCheckboxes after individual dates are processed
        }
      }
    });
    
    // Update parent checkboxes state
    this.updateDateParentCheckboxes(dropdown);
  }

  /**
   * 階層チェックボックスの状態を更新する共通関数
   * @param {HTMLElement} parentCheckbox - 親チェックボックス
   * @param {NodeList} childCheckboxes - 子チェックボックス一覧
   */
  updateHierarchicalCheckboxState(parentCheckbox, childCheckboxes) {
    if (!parentCheckbox || !childCheckboxes || childCheckboxes.length === 0) {
      return;
    }

    const checkedCount = Array.from(childCheckboxes).filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
      // すべての子が未選択
      parentCheckbox.checked = false;
      parentCheckbox.indeterminate = false;
    } else if (checkedCount === childCheckboxes.length) {
      // すべての子が選択済み
      parentCheckbox.checked = true;
      parentCheckbox.indeterminate = false;
    } else {
      // 一部の子のみ選択（中間状態）
      parentCheckbox.checked = false;
      parentCheckbox.indeterminate = true;
    }
  }

  /**
   * 親チェックボックスの変更を子に伝播する共通関数
   * @param {HTMLElement} parentCheckbox - 親チェックボックス
   * @param {NodeList} childCheckboxes - 子チェックボックス一覧
   */
  propagateCheckboxStateToChildren(parentCheckbox, childCheckboxes) {
    if (!parentCheckbox || !childCheckboxes) {
      return;
    }

    const isChecked = parentCheckbox.checked;
    
    // すべての子チェックボックスを親と同じ状態にする
    Array.from(childCheckboxes).forEach(cb => {
      cb.checked = isChecked;
      cb.indeterminate = false;
    });
    
    // 親のindeterminate状態をクリア
    parentCheckbox.indeterminate = false;
  }

  /**
   * 日付階層フィルタの親チェックボックス状態を更新
   * @param {HTMLElement} dropdown - フィルタドロップダウン要素
   */
  updateDateParentCheckboxes(dropdown) {
    // 月チェックボックスの状態を更新（子：日）
    const monthGroups = dropdown.querySelectorAll('.date-filter-month');
    monthGroups.forEach(month => {
      const monthCheckbox = month.querySelector('.date-filter-checkbox');
      const dayCheckboxes = month.querySelectorAll('.date-filter-days .date-filter-checkbox');
      this.updateHierarchicalCheckboxState(monthCheckbox, dayCheckboxes);
    });
    
    // 年チェックボックスの状態を更新（子：月・日）
    const yearGroups = dropdown.querySelectorAll('.date-filter-group');
    yearGroups.forEach(group => {
      const yearCheckbox = group.querySelector('.date-filter-checkbox');
      const childCheckboxes = group.querySelectorAll('.date-filter-children .date-filter-checkbox');
      this.updateHierarchicalCheckboxState(yearCheckbox, childCheckboxes);
    });
  }

  /**
   * 日付階層フィルタのチェックボックス変更処理（共通）
   * @param {Event} event - チェックボックス変更イベント
   * @param {HTMLElement} dropdown - フィルタドロップダウン要素
   * @param {Function} applyFilterCallback - フィルタ適用コールバック
   */
  handleDateHierarchyCheckboxChange(event, dropdown, applyFilterCallback) {
    const checkbox = event.target;
    const level = this.getDateHierarchyLevel(checkbox);
    
    
    switch (level) {
      case 'year':
        this.handleYearCheckboxChange(checkbox, dropdown);
        break;
      case 'month':
        this.handleMonthCheckboxChange(checkbox, dropdown);
        break;
      case 'day':
        this.handleDayCheckboxChange(checkbox, dropdown);
        break;
      default:
        console.warn('⚠️ Unknown hierarchy level:', level);
    }
    
    // フィルタ適用（遅延実行で連動処理完了後に実行）
    if (applyFilterCallback && typeof applyFilterCallback === 'function') {
      setTimeout(() => applyFilterCallback(), 0);
    }
  }

  /**
   * チェックボックスの階層レベルを判定
   * @param {HTMLElement} checkbox - チェックボックス要素
   * @returns {string} 'year' | 'month' | 'day'
   */
  getDateHierarchyLevel(checkbox) {
    if (checkbox.closest('.date-filter-group-header')) {
      return 'year';
    } else if (checkbox.closest('.date-filter-month-header')) {
      return 'month';
    } else if (checkbox.closest('.date-filter-day')) {
      return 'day';
    }
    return 'unknown';
  }

  /**
   * 年チェックボックス変更処理
   * @param {HTMLElement} yearCheckbox - 年チェックボックス
   * @param {HTMLElement} dropdown - フィルタドロップダウン
   */
  handleYearCheckboxChange(yearCheckbox, dropdown) {
    const yearGroup = yearCheckbox.closest('.date-filter-group');
    const monthCheckboxes = yearGroup.querySelectorAll('.date-filter-month .date-filter-checkbox');
    const dayCheckboxes = yearGroup.querySelectorAll('.date-filter-day .date-filter-checkbox');
    
    // 年→月・日の連動
    this.propagateCheckboxStateToChildren(yearCheckbox, monthCheckboxes);
    this.propagateCheckboxStateToChildren(yearCheckbox, dayCheckboxes);
  }

  /**
   * 月チェックボックス変更処理
   * @param {HTMLElement} monthCheckbox - 月チェックボックス
   * @param {HTMLElement} dropdown - フィルタドロップダウン
   */
  handleMonthCheckboxChange(monthCheckbox, dropdown) {
    const monthItem = monthCheckbox.closest('.date-filter-month');
    const dayCheckboxes = monthItem.querySelectorAll('.date-filter-day .date-filter-checkbox');
    
    // 月→日の連動
    this.propagateCheckboxStateToChildren(monthCheckbox, dayCheckboxes);
    
    // 親（年）の状態更新
    this.updateDateParentCheckboxes(dropdown);
  }

  /**
   * 日チェックボックス変更処理
   * @param {HTMLElement} dayCheckbox - 日チェックボックス
   * @param {HTMLElement} dropdown - フィルタドロップダウン
   */
  handleDayCheckboxChange(dayCheckbox, dropdown) {
    // 親（月・年）の状態更新
    this.updateDateParentCheckboxes(dropdown);
  }

  closeFilter() {
    const existingDropdown = document.querySelector('.filter-dropdown-wrapper');
    if (existingDropdown) {
      // Remove click outside event listener if it exists
      if (existingDropdown._clickOutsideHandler) {
        document.removeEventListener('click', existingDropdown._clickOutsideHandler);
      }
      existingDropdown.remove();
    }
    this.state.openFilter = null;
  }

  showColumnSettings() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'column-settings-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'column-settings-modal';

    let modalContent = `
      <div class="column-settings-header">
        <h3>列設定</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="column-settings-content">
        <div class="column-list">
          <div class="column-item select-all-item">
            <label class="column-label">
              <input type="checkbox" class="column-checkbox-all" id="select-all-columns">
              <span class="column-text">${this.i18n.t('filter.all')}</span>
            </label>
          </div>
          ${this.options.columns.map(col => `
            <div class="column-item">
              <label class="column-label">
                <input type="checkbox" class="column-checkbox" data-column="${col.key}" ${this.state.visibleColumns[col.key] ? 'checked' : ''}>
                <span class="column-text">${col.title}</span>
              </label>
              <label class="pin-label">
                <input type="checkbox" class="pin-checkbox" data-column="${col.key}" ${this.state.pinnedColumns[col.key] ? 'checked' : ''}>
                <span class="pin-icon">📌</span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="column-settings-footer">
        <button class="cancel-btn">${this.i18n.t('filter.cancel')}</button>
        <button class="confirm-btn">OK</button>
      </div>
    `;

    modal.innerHTML = modalContent;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
    
    // Select all functionality
    const selectAllCheckbox = overlay.querySelector('.column-checkbox-all');
    const columnCheckboxes = overlay.querySelectorAll('.column-checkbox');
    
    // Set initial state of "select all" checkbox
    const updateSelectAllState = () => {
      const checkedCount = Array.from(columnCheckboxes).filter(cb => cb.checked).length;
      const totalCount = columnCheckboxes.length;
      
      if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (checkedCount === totalCount) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    };
    
    // Initial state
    updateSelectAllState();
    
    // Select all checkbox event
    selectAllCheckbox.addEventListener('change', (e) => {
      columnCheckboxes.forEach(cb => cb.checked = e.target.checked);
      updateSelectAllState();
    });
    
    // Individual checkbox events
    columnCheckboxes.forEach(cb => {
      cb.addEventListener('change', updateSelectAllState);
    });
    
    overlay.querySelector('.confirm-btn').addEventListener('click', () => {
      // Apply column visibility changes
      overlay.querySelectorAll('.column-checkbox').forEach(cb => {
        this.state.visibleColumns[cb.dataset.column] = cb.checked;
      });

      // Apply column pinning changes
      overlay.querySelectorAll('.pin-checkbox').forEach(cb => {
        this.state.pinnedColumns[cb.dataset.column] = cb.checked;
      });

      this.render();
      
      // 状態を保存
      if (this.saveStateDebounced) {
        this.saveStateDebounced();
      }
      
      overlay.remove();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  attachRangeSliderEvents(dropdown, column, applyRealtimeFilter) {
    const slider = dropdown.querySelector('.range-slider');
    const track = dropdown.querySelector('.range-track');
    const minThumb = dropdown.querySelector('.range-thumb-min');
    const maxThumb = dropdown.querySelector('.range-thumb-max');
    const minInput = dropdown.querySelector('.range-min');
    const maxInput = dropdown.querySelector('.range-max');

    if (!slider || !track || !minThumb || !maxThumb || !minInput || !maxInput) return;
    
    // Flag to prevent infinite loops between slider and checkbox updates
    let isUpdatingFromSlider = false;

    const min = parseFloat(slider.dataset.min);
    const max = parseFloat(slider.dataset.max);
    const range = max - min;

    const updateSlider = () => {
      const minVal = parseFloat(minInput.value);
      const maxVal = parseFloat(maxInput.value);
      
      const minPercent = ((minVal - min) / range) * 100;
      const maxPercent = ((maxVal - min) / range) * 100;
      
      minThumb.style.left = `${minPercent}%`;
      maxThumb.style.left = `${maxPercent}%`;
      
      track.style.left = `${minPercent}%`;
      track.style.width = `${maxPercent - minPercent}%`;
    };

    // Set slider range based on currently selected checkboxes
    this.updateSliderFromCheckboxes(dropdown, column);
    
    // Initial update
    updateSlider();

    // Input change events
    minInput.addEventListener('input', () => {
      if (slider._isUpdatingFromSlider) return;
      updateSlider();
      this.updateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    });
    maxInput.addEventListener('input', () => {
      if (slider._isUpdatingFromSlider) return;
      updateSlider();
      this.updateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    });

    // Thumb drag events
    let isDragging = false;
    let currentThumb = null;

    const startDrag = (e, thumb) => {
      isDragging = true;
      currentThumb = thumb;
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging || !currentThumb) return;
      
      const rect = slider.getBoundingClientRect();
      // Handle both mouse and touch events with safe optional chaining
      const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const value = min + (percent / 100) * range;
      
      const decimalPlaces = parseInt(minInput.dataset.decimalPlaces) || 0;
      
      if (currentThumb.dataset.type === 'min') {
        const maxVal = parseFloat(maxInput.value);
        const newMinVal = Math.min(value, maxVal);
        minInput.value = TableUtils.formatNumberValue(newMinVal, decimalPlaces);
      } else {
        const minVal = parseFloat(minInput.value);
        const newMaxVal = Math.max(value, minVal);
        maxInput.value = TableUtils.formatNumberValue(newMaxVal, decimalPlaces);
      }
      
      updateSlider();
      this.updateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    };

    const stopDrag = () => {
      isDragging = false;
      currentThumb = null;
    };

    // Mouse events
    minThumb.addEventListener('mousedown', (e) => startDrag(e, minThumb));
    maxThumb.addEventListener('mousedown', (e) => startDrag(e, maxThumb));
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile support
    minThumb.addEventListener('touchstart', (e) => startDrag(e, minThumb), { passive: false });
    maxThumb.addEventListener('touchstart', (e) => startDrag(e, maxThumb), { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  updateRangeFromCheckbox(dropdown, column) {
    const minInput = dropdown.querySelector('.range-min');
    const maxInput = dropdown.querySelector('.range-max');
    const slider = dropdown.querySelector('.range-slider');
    
    if (!minInput || !maxInput || !slider) return;
    
    const checkedCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]):checked');
    
    // Update "Select All" checkbox state
    const selectAllCheckbox = dropdown.querySelector('[data-value="__all__"]');
    if (selectAllCheckbox) {
      const totalCheckboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])');
      TableUtils.updateSelectAllState(selectAllCheckbox, totalCheckboxes);
    }
    
    // Handle slider update based on checkbox selection
    if (checkedCheckboxes.length === 0) {
      // No checkboxes selected - reset to full range
      const fullMin = parseFloat(slider.dataset.min);
      const fullMax = parseFloat(slider.dataset.max);
      
      // Set flag to prevent infinite loop
      slider._isUpdatingFromSlider = true;
      
      minInput.value = fullMin;
      maxInput.value = fullMax;
      
      // Update slider display to full range
      const track = dropdown.querySelector('.range-track');
      const minThumb = dropdown.querySelector('.range-thumb-min');
      const maxThumb = dropdown.querySelector('.range-thumb-max');
      
      if (track && minThumb && maxThumb) {
        minThumb.style.left = '0%';
        maxThumb.style.left = '100%';
        track.style.left = '0%';
        track.style.width = '100%';
      }
      
      // Reset flag
      setTimeout(() => {
        slider._isUpdatingFromSlider = false;
      }, 0);
      
    } else {
      // Some checkboxes selected - update slider only if boundary values changed
      const checkedValues = Array.from(checkedCheckboxes).map(cb => parseFloat(cb.dataset.value));
      const currentMin = Math.min(...checkedValues);
      const currentMax = Math.max(...checkedValues);
      
      const sliderMin = parseFloat(minInput.value);
      const sliderMax = parseFloat(maxInput.value);
      
      // Only update slider if the min or max boundary values have changed
      if (currentMin !== sliderMin || currentMax !== sliderMax) {
        // Set flag to prevent infinite loop
        slider._isUpdatingFromSlider = true;
        
        minInput.value = currentMin;
        maxInput.value = currentMax;
        
        // Update slider display
        const min = parseFloat(slider.dataset.min);
        const max = parseFloat(slider.dataset.max);
        const range = max - min;
        
        const minPercent = ((currentMin - min) / range) * 100;
        const maxPercent = ((currentMax - min) / range) * 100;
        
        const track = dropdown.querySelector('.range-track');
        const minThumb = dropdown.querySelector('.range-thumb-min');
        const maxThumb = dropdown.querySelector('.range-thumb-max');
        
        if (track && minThumb && maxThumb) {
          minThumb.style.left = `${minPercent}%`;
          maxThumb.style.left = `${maxPercent}%`;
          track.style.left = `${minPercent}%`;
          track.style.width = `${maxPercent - minPercent}%`;
        }
        
        // Reset flag
        setTimeout(() => {
          slider._isUpdatingFromSlider = false;
        }, 0);
      }
    }
  }

  updateCheckboxFromRange(dropdown, column) {
    const minInput = dropdown.querySelector('.range-min');
    const maxInput = dropdown.querySelector('.range-max');
    
    if (!minInput || !maxInput) return;
    
    const minVal = parseFloat(minInput.value);
    const maxVal = parseFloat(maxInput.value);
    
    const checkboxes = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])');
    checkboxes.forEach(cb => {
      const value = parseFloat(cb.dataset.value);
      if (!isNaN(value)) {
        cb.checked = value >= minVal && value <= maxVal;
      }
    });
    
    // Update select all checkbox state
    const selectAllCheckbox = dropdown.querySelector('[data-value="__all__"]');
    if (selectAllCheckbox) {
      const checkedCount = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"]):checked').length;
      const totalCount = dropdown.querySelectorAll('.filter-checkbox:not([data-value="__all__"])').length;
      
      if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (checkedCount === totalCount) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    }
  }

  attachDateRangeSliderEvents(dropdown, column, applyRealtimeFilter) {
    const slider = dropdown.querySelector('.date-range-slider');
    const track = dropdown.querySelector('.date-range-track');
    const minThumb = dropdown.querySelector('.date-range-thumb-min');
    const maxThumb = dropdown.querySelector('.date-range-thumb-max');
    const minInput = dropdown.querySelector('.date-range-min');
    const maxInput = dropdown.querySelector('.date-range-max');

    if (!slider || !track || !minThumb || !maxThumb || !minInput || !maxInput) {
      return;
    }

    const minDate = new Date(slider.dataset.min).getTime();
    const maxDate = new Date(slider.dataset.max).getTime();
    const range = maxDate - minDate;

    const updateSlider = () => {
      const minVal = new Date(minInput.value).getTime();
      const maxVal = new Date(maxInput.value).getTime();
      
      const minPercent = ((minVal - minDate) / range) * 100;
      const maxPercent = ((maxVal - minDate) / range) * 100;
      
      minThumb.style.left = `${minPercent}%`;
      maxThumb.style.left = `${maxPercent}%`;
      
      track.style.left = `${minPercent}%`;
      track.style.width = `${maxPercent - minPercent}%`;
    };

    // ✅ FIX Bug#7: Only update slider from checkboxes if no existing filter
    // If we have an existing dateRangeFilter, the input values are already set correctly
    // and we should NOT overwrite them with checkbox-based calculations
    const hasExistingFilter = this.state.dateRangeFilters?.[column.key];
    if (!hasExistingFilter) {
      // Set slider range based on currently selected checkboxes
      this.updateDateSliderFromCheckboxes(dropdown, column);
    } else {
      // Restore input values from state if they were overwritten
      minInput.value = hasExistingFilter.startDate;
      maxInput.value = hasExistingFilter.endDate;
    }

    // Initial update
    updateSlider();

    // Input change events
    minInput.addEventListener('input', () => {
      updateSlider();
      this.updateDateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    });
    maxInput.addEventListener('input', () => {
      updateSlider();
      this.updateDateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    });

    // Thumb drag events
    let isDragging = false;
    let currentThumb = null;

    const startDrag = (e, thumb) => {
      isDragging = true;
      currentThumb = thumb;
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging || !currentThumb) return;
      
      const rect = slider.getBoundingClientRect();
      // Handle both mouse and touch events with safe optional chaining
      const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const timestamp = minDate + (percent / 100) * range;
      const dateValue = new Date(timestamp).toISOString().split('T')[0];
      
      if (currentThumb.dataset.type === 'min') {
        const maxVal = maxInput.value;
        const newMinVal = dateValue <= maxVal ? dateValue : maxVal;
        minInput.value = newMinVal;
      } else {
        const minVal = minInput.value;
        const newMaxVal = dateValue >= minVal ? dateValue : minVal;
        maxInput.value = newMaxVal;
      }
      
      updateSlider();
      this.updateDateCheckboxFromRange(dropdown, column);
      // Apply real-time filtering (no icon state update during real-time)
      applyRealtimeFilter();
    };

    const stopDrag = () => {
      isDragging = false;
      currentThumb = null;
    };

    // Mouse events
    minThumb.addEventListener('mousedown', (e) => startDrag(e, minThumb));
    maxThumb.addEventListener('mousedown', (e) => startDrag(e, maxThumb));
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile support
    minThumb.addEventListener('touchstart', (e) => startDrag(e, minThumb), { passive: false });
    maxThumb.addEventListener('touchstart', (e) => startDrag(e, maxThumb), { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  // Duplicate method removed - keeping the first implementation with parent checkbox updates


  attachDateHierarchyEvents(dropdown, column, applyRealtimeFilter) {
    
    // Expand level control buttons
    const expandControlButtons = dropdown.querySelectorAll('.expand-control-btn');
    const dateFilterContent = dropdown.querySelector('.date-filter-content');
    
    
    const setExpandLevel = (level) => {
      const yearGroups = dropdown.querySelectorAll('.date-filter-group');
      const monthItems = dropdown.querySelectorAll('.date-filter-month');
      const dayItems = dropdown.querySelectorAll('.date-filter-day');
      
      // Reset active button
      expandControlButtons.forEach(btn => btn.classList.remove('active'));
      const activeButton = dropdown.querySelector(`[data-level="${level}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
      
      switch(level) {
        case 'year':
          // Show only years, hide months and days
          yearGroups.forEach(group => {
            group.style.display = 'block';
            const children = group.querySelector('.date-filter-children');
            children.style.display = 'none';
            const expandBtn = group.querySelector('.expand-btn');
            expandBtn.textContent = '▶';
          });
          break;
          
        case 'month':
          // Show years and months, hide days
          yearGroups.forEach(group => {
            group.style.display = 'block';
            const children = group.querySelector('.date-filter-children');
            children.style.display = 'block';
            const expandBtn = group.querySelector('.expand-btn');
            expandBtn.textContent = '▼';
          });
          monthItems.forEach(month => {
            month.style.display = 'block';
            const days = month.querySelector('.date-filter-days');
            days.style.display = 'none';
            const expandBtn = month.querySelector('.expand-btn-month');
            expandBtn.textContent = '▶';
          });
          break;
          
        case 'day':
          // Show everything - years, months, and days
          yearGroups.forEach(group => {
            group.style.display = 'block';
            const children = group.querySelector('.date-filter-children');
            children.style.display = 'block';
            const expandBtn = group.querySelector('.expand-btn');
            expandBtn.textContent = '▼';
          });
          monthItems.forEach(month => {
            month.style.display = 'block';
            const days = month.querySelector('.date-filter-days');
            days.style.display = 'block';
            const expandBtn = month.querySelector('.expand-btn-month');
            expandBtn.textContent = '▼';
          });
          dayItems.forEach(day => {
            day.style.display = 'block';
          });
          break;
      }
    };
    
    // Add click handlers for expand control buttons
    expandControlButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandLevel(btn.dataset.level);
      });
    });
    
    // Set initial expand level to 'year'
    setExpandLevel('year');

    // Expand/collapse for years
    const yearExpandButtons = dropdown.querySelectorAll('.expand-btn:not(.expand-btn-month)');
    yearExpandButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = btn.closest('.date-filter-group');
        const children = group.querySelector('.date-filter-children');
        
        if (children.style.display === 'none' || !children.style.display) {
          children.style.display = 'block';
          btn.textContent = '▼';
        } else {
          children.style.display = 'none';
          btn.textContent = '▶';
        }
      });
    });

    // Expand/collapse for months
    const monthExpandButtons = dropdown.querySelectorAll('.expand-btn-month');
    monthExpandButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const monthItem = btn.closest('.date-filter-month');
        const days = monthItem.querySelector('.date-filter-days');
        
        if (days.style.display === 'none' || !days.style.display) {
          days.style.display = 'block';
          btn.textContent = '▼';
        } else {
          days.style.display = 'none';
          btn.textContent = '▶';
        }
      });
    });

    // Use the centralized updateDateParentCheckboxes method instead of local function

    // 日付階層チェックボックスの統一イベントハンドラー
    // リアルタイムフィルタフラグを初期化
    if (this._applyRealtimeOnDateChange === undefined) {
      this._applyRealtimeOnDateChange = true;
    }
    
    const hierarchyCheckboxes = dropdown.querySelectorAll('.date-filter-checkbox');
    hierarchyCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        
        // リアルタイムフィルタリングを一時的に無効化
        const originalApplyRealtime = this._applyRealtimeOnDateChange;
        this._applyRealtimeOnDateChange = false;
        
        // 共通の階層処理を実行
        this.handleDateHierarchyCheckboxChange(e, dropdown, () => {
          // 階層処理完了後にリアルタイムフィルタを適用
          this._applyRealtimeOnDateChange = originalApplyRealtime;
          if (this._applyRealtimeOnDateChange && applyRealtimeFilter) {
            applyRealtimeFilter();
          }
        });
      });
    });
  }

  handleRangeFilter(columnKey, min, max) {
    const column = this.options.columns.find(col => col.key === columnKey);
    if (!column) return;

    // Apply range filter
    this.state.filteredData = this.state.data.filter(record => {
      const value = parseFloat(record[column.dataIndex]);
      return !isNaN(value) && value >= min && value <= max;
    });

    this.state.currentPage = 1;
    this.applySorting();
    this.renderBody();
    this.renderPagination();
  }

  isYearSelected(year, monthData, currentFilters) {
    if (currentFilters.length === 0) return true;
    
    // Check if year itself is selected
    if (currentFilters.includes(year)) return true;
    
    // Check if any month in this year is selected
    if (Object.keys(monthData).some(month => 
      currentFilters.includes(`${year}-${month}`)
    )) return true;
    
    // Check if any individual dates in this year are selected
    return currentFilters.some(filter => {
      if (typeof filter === 'string' && filter.includes('-')) {
        return filter.startsWith(`${year}-`);
      }
      return false;
    });
  }

  isMonthSelected(year, month, dates, currentFilters) {
    if (currentFilters.length === 0) return true;
    
    // Check if year is selected (includes all months)
    if (currentFilters.includes(year)) return true;
    
    // Check if this specific month is selected
    return currentFilters.includes(`${year}-${month}`);
  }

  // Utility methods
  isNumericColumn(column) {
    const sampleValue = this.state.data[0]?.[column.dataIndex];
    return typeof sampleValue === 'number' || !isNaN(Number(sampleValue));
  }

  groupDatesByHierarchy(dates) {
    const groups = {};
    
    dates.forEach(dateStr => {
      if (dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, '0'); // Use numeric month for sorting
        const month = date.toLocaleString('default', { month: 'long' });
        
        if (!groups[year]) groups[year] = {};
        if (!groups[year][monthNum]) groups[year][monthNum] = { displayName: month, dates: [] };
        groups[year][monthNum].dates.push(dateStr);
      }
    });
    
    // Sort years, months, and dates in ascending order
    const sortedGroups = {};
    const sortedYears = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b));
    
    sortedYears.forEach(year => {
      sortedGroups[year] = {};
      
      // Sort months numerically (01, 02, 03, ...)
      const monthNums = Object.keys(groups[year]).sort((a, b) => parseInt(a) - parseInt(b));
      
      monthNums.forEach(monthNum => {
        const monthData = groups[year][monthNum];
        const displayName = monthData.displayName;
        
        // Sort dates within each month in ascending order
        sortedGroups[year][displayName] = monthData.dates.sort((a, b) => new Date(a) - new Date(b));
      });
    });
    
    return sortedGroups;
  }

  // Private helper: Deep copy with type preservation
  _deepCopyData(obj, seen = new WeakMap()) {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle circular references
    if (seen.has(obj)) return seen.get(obj);

    // Handle Date
    if (obj instanceof Date) return new Date(obj.getTime());

    // Handle Array
    if (Array.isArray(obj)) {
      const arr = [];
      seen.set(obj, arr);
      obj.forEach((item, index) => {
        arr[index] = this._deepCopyData(item, seen);
      });
      return arr;
    }

    // Handle Object
    const copy = {};
    seen.set(obj, copy);
    Object.keys(obj).forEach(key => {
      copy[key] = this._deepCopyData(obj[key], seen);
    });
    return copy;
  }

  // Public API methods
  getData() {
    // Return a deep copy to prevent external mutations
    // Use structured clone for better type preservation
    try {
      // Try structured clone first (preserves Dates, Maps, Sets, etc.)
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(this.state.data);
      }
    } catch (e) {
      // Fallback to manual deep copy for circular references or unsupported types
    }

    return this._deepCopyData(this.state.data);
  }

  setData(data) {
    // Deep copy input data to prevent external mutations affecting internal state
    this.state.data = this._deepCopyData(data || []);
    this.state.currentPage = 1;
    this.render();

    // 🔄 Emit hook for data update
    if (this.pluginSystem) {
      this.pluginSystem.emitHook('data:afterLoad', {
        newData: data,
        type: 'setData'
      });
    }
  }

  updateData(data) {
    this.setData(data);
  }

  getFilters() {
    return { ...this.state.filters };
  }

  setFilters(filters) {
    this.state.filters = { ...filters };
    this.render();
  }

  clearFilters() {
    this.state.filters = {};
    this.render();
  }

  clearAllFilters() {
    this.state.filters = {};
    this.state.rangeFilters = {};
    this.state.dateRangeFilters = {};
    this.render();
    this.autoSaveSettings();
  }

  setFontSize(size) {
    this.state.fontSize = size;
    this.renderMenu(); // Re-render menu to update current selection
    this.applyCurrentStyling(); // Apply updated styling
    this.autoSaveSettings();
  }

  setCellPadding(padding) {
    this.state.cellPadding = padding;
    this.renderMenu(); // Re-render menu to update current selection
    this.applyCurrentStyling(); // Apply updated styling
    this.autoSaveSettings();
  }

  setLanguage(locale) {
    const success = this.i18n.setLocale(locale);
    if (success) {
      this.renderMenu(); // Re-render menu to update current selection
      this.renderPagination(); // Re-render pagination to update text
      this.autoSaveSettings();
    }
  }

  applyFontSize() {
    const fontSize = TABLE_CONFIG.FONT_SIZES[this.state.fontSize] || TABLE_CONFIG.FONT_SIZES.medium;
    
    // Use CSS custom property for consistent font size application
    this.container.style.setProperty('--table-font-size', fontSize);
    
    // Guard clause: return early if structure not created yet
    if (!this.tableContainer) {
      return;
    }
    
    // Apply directly to main elements with !important to override CSS
    this.tableContainer.style.setProperty('font-size', fontSize, 'important');
    
    // Apply to table elements
    const tableElements = this.tableContainer.querySelectorAll(`
      .table, 
      .table-cell, 
      .table-header, 
      .header-content, 
      .header-title,
      .enhanced-table-pagination,
      .pagination-info,
      .page-info,
      tbody tr td
    `);
    
    tableElements.forEach(element => {
      element.style.setProperty('font-size', fontSize, 'important');
    });

    // Apply to menu elements
    const menuElements = this.container.querySelectorAll(`
      .table-menu-container,
      .table-menu-btn,
      .table-menu-dropdown,
      .table-menu-item,
      .table-submenu-dropdown
    `);
    
    menuElements.forEach(element => {
      element.style.setProperty('font-size', fontSize, 'important');
    });

    // Apply to filter elements
    const filterElements = document.querySelectorAll(`
      .filter-dropdown-wrapper,
      .filter-dropdown,
      .filter-dropdown-header,
      .filter-dropdown-title,
      .filter-dropdown-search,
      .filter-search-input,
      .filter-dropdown-content,
      .filter-option,
      .filter-option-label,
      .filter-option-text,
      .filter-dropdown-footer,
      .filter-btn-confirm,
      .filter-btn-cancel,
      .filter-btn-clear-column,
      .range-filter,
      .range-label,
      .range-input,
      .date-range-filter,
      .date-range-label,
      .date-range-input,
      .date-filter-content,
      .date-filter-label,
      .date-filter-text,
      .date-expand-controls,
      .expand-control-label,
      .expand-control-btn
    `);
    
    filterElements.forEach(element => {
      element.style.setProperty('font-size', fontSize, 'important');
    });

    // Apply to column settings modal
    const modalElements = document.querySelectorAll(`
      .column-settings-overlay,
      .column-settings-modal,
      .column-settings-header,
      .column-settings-content,
      .column-list,
      .column-item,
      .column-label,
      .column-text,
      .column-settings-footer,
      .confirm-btn,
      .cancel-btn
    `);
    
    modalElements.forEach(element => {
      element.style.setProperty('font-size', fontSize, 'important');
    });
  }

  applyCellPadding() {
    const padding = TABLE_CONFIG.CELL_PADDING[this.state.cellPadding] || TABLE_CONFIG.CELL_PADDING.standard;
    const cellPaddingValue = `${padding.vertical} ${padding.horizontal}`;
    
    // Guard clause: return early if structure not created yet
    if (!this.tableContainer) {
      return;
    }
    
    // Smaller padding for UI elements (50% of cell padding)
    const uiVertical = Math.round(parseInt(padding.vertical) * 0.6) + 'px';
    const uiHorizontal = Math.round(parseInt(padding.horizontal) * 0.8) + 'px';
    const uiPaddingValue = `${uiVertical} ${uiHorizontal}`;
    
    // Apply padding to table cells
    const cells = this.tableContainer.querySelectorAll('.table-cell');
    cells.forEach(cell => {
      cell.style.setProperty('padding', cellPaddingValue, 'important');
    });
    
    // Apply padding to header cells
    const headers = this.tableContainer.querySelectorAll('.header-content');
    headers.forEach(header => {
      header.style.setProperty('padding', cellPaddingValue, 'important');
    });

    // Apply padding to menu elements
    const menuElements = this.container.querySelectorAll(`
      .table-menu-item,
      .table-menu-btn
    `);
    menuElements.forEach(element => {
      element.style.setProperty('padding', uiPaddingValue, 'important');
    });

    // Apply padding to filter elements
    const filterElements = document.querySelectorAll(`
      .filter-option,
      .filter-btn-confirm,
      .filter-btn-cancel,
      .filter-btn-clear-column,
      .range-input,
      .date-range-input,
      .filter-search-input,
      .expand-control-btn
    `);
    filterElements.forEach(element => {
      element.style.setProperty('padding', uiPaddingValue, 'important');
    });

    // Apply padding to larger filter sections
    const filterSections = document.querySelectorAll(`
      .filter-dropdown-header,
      .filter-dropdown-search,
      .filter-dropdown-footer,
      .date-expand-controls
    `);
    filterSections.forEach(element => {
      element.style.setProperty('padding', cellPaddingValue, 'important');
    });

    // Apply padding to pagination elements
    const paginationElements = this.tableContainer.querySelectorAll(`
      .enhanced-table-pagination,
      .pagination-controls button
    `);
    paginationElements.forEach(element => {
      element.style.setProperty('padding', uiPaddingValue, 'important');
    });

    // Apply padding to column settings modal
    const modalElements = document.querySelectorAll(`
      .column-item,
      .confirm-btn,
      .cancel-btn
    `);
    modalElements.forEach(element => {
      element.style.setProperty('padding', uiPaddingValue, 'important');
    });
  }

  getSelectedRows() {
    // Implementation for row selection if needed
    return [];
  }

  addTooltipToCell(element, content) {
    if (!element || !content) return;

    // Convert content to string if it's not already
    const text = typeof content === 'string' ? content : String(content);
    
    let tooltip = null;

    const showTooltip = (e) => {
      // Check if content is actually truncated by comparing scrollWidth with clientWidth
      if (element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight) {
        return; // No overflow, no need for tooltip
      }

      // Create tooltip
      tooltip = document.createElement('div');
      tooltip.className = 'cell-tooltip';
      tooltip.textContent = text;
      document.body.appendChild(tooltip);

      // Position tooltip
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 5;

      // Adjust if tooltip would go outside viewport
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (left < 10) {
        left = 10;
      }
      if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - tooltipRect.height - 5;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const hideTooltip = () => {
      if (tooltip) {
        document.body.removeChild(tooltip);
        tooltip = null;
      }
    };

    // Add event listeners
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    
    // Store cleanup function for potential future use
    element._tooltipCleanup = () => {
      element.removeEventListener('mouseenter', showTooltip);
      element.removeEventListener('mouseleave', hideTooltip);
      hideTooltip();
    };
  }

  /**
   * Show confirmation modal for LocalStorage clear
   */
  showLocalStorageClearConfirmation() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
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
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      margin: 20px;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">LocalStorage クリア確認</h3>
      <p style="margin: 0 0 20px 0; line-height: 1.5; color: #666;">
        ExceLikeTable関連のLocalStorage情報を削除し、設定をデフォルトに戻します。よろしいですか？
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="modal-cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">キャンセル</button>
        <button class="modal-confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #ff4d4f;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">削除する</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Event handlers
    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    const cancelBtn = modalContent.querySelector('.modal-cancel-btn');
    const confirmBtn = modalContent.querySelector('.modal-confirm-btn');

    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', async () => {
      await this.clearLocalStorageData();
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
  }

  /**
   * Show conditional formatting management screen
   */
  showConditionalFormatting() {
    // プレースホルダー実装 - 後で条件付き書式プラグインで置き換え
    
    // 条件付き書式プラグインが読み込まれているかチェック
    if (typeof window.ConditionalFormatting === 'undefined') {
      alert('条件付き書式プラグインが読み込まれていません。\nプラグインファイルを読み込んでください。');
      return;
    }
    
    // プラグインが初期化されていない場合は初期化
    if (!this.conditionalFormatting) {
      this.conditionalFormatting = new window.ConditionalFormatting(this);
    }
    
    // 管理画面を表示
    this.conditionalFormatting.showManagementScreen();
  }

  /**
   * Auto-initialize conditional formatting plugin during table initialization
   * @private
   */
  initializeConditionalFormatting() {
    // Check if conditional formatting plugin is available
    if (typeof window.ConditionalFormatting !== 'undefined' && !this.conditionalFormatting) {
      try {
        console.log('Auto-initializing conditional formatting plugin...');
        this.conditionalFormatting = new window.ConditionalFormatting(this, {
          autoLoad: true,
          autoApply: true
        });
        console.log('Conditional formatting plugin initialized successfully');
      } catch (error) {
        console.warn('Failed to auto-initialize conditional formatting:', error);
      }
    }
  }

  /**
   * Clear LocalStorage data and reset to defaults
   */
  async clearLocalStorageData() {
    // Prevent recursive calls
    if (this._clearingLocalStorage) {
      return;
    }
    
    this._clearingLocalStorage = true;
    
    try {
      // Clear this table's settings
      if (this.settingsManager) {
        await this.clearSettings();
      }

      // Clear all ExceLikeTable related LocalStorage data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('excelike_') || key.startsWith('table-plugin-')) {
          localStorage.removeItem(key);
        }
      });

      // Close any open filters
      this.closeFilter();
      
      // Reset table state to defaults
      this.state.columnWidths = {};
      this.state.visibleColumns = {};
      this.state.pinnedColumns = {};
      this.state.filters = {};
      this.state.sortState = {};
      this.state.rangeFilters = {};
      this.state.dateRangeFilters = {};
      this.state.fontSize = 'medium';
      this.state.cellPadding = 'standard';
      this.state.currentPage = 1;
      this.state.openFilter = null;
      
      // Also reset any cached filter states
      if (this.state.columnFilters) {
        this.state.columnFilters = {};
      }

      // Reset filtered and sorted data to original data
      this.state.filteredData = [...this.state.data];
      this.state.sortedData = [...this.state.data];

      // Show success message and auto-reload
      this.showTemporaryMessage('設定をクリアしました。ページが自動で再読み込みされます。', 'success');
      
      // Auto-reload page after 0.5 seconds to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error clearing LocalStorage data:', error);
      
      // Emergency fallback - at least show an error message
      try {
        this.showTemporaryMessage('設定クリア中にエラーが発生しました', 'error');
      } catch (msgError) {
        console.error('Could not show error message:', msgError);
      }
    } finally {
      // Always reset the flag
      this._clearingLocalStorage = false;
    }
  }

  /**
   * Apply default visual settings immediately
   */
  applyDefaultVisualSettings() {
    // Guard clause: ensure table container exists
    if (!this.tableContainer) {
      console.warn('Table container not found, skipping visual settings reset');
      return;
    }

    // Reset state only without triggering render methods
    this.state.fontSize = 'medium';
    this.state.cellPadding = 'standard';
    
    // Apply styling directly to avoid render side effects
    this.applyCurrentStyling();
    
    // Reset all column widths by removing style attributes
    const headers = this.tableContainer.querySelectorAll('th');
    headers.forEach(header => {
      header.style.width = '';
      header.style.minWidth = '';
      header.style.maxWidth = '';
    });
    
    // Reset table cells width
    const cells = this.tableContainer.querySelectorAll('td');
    cells.forEach(cell => {
      cell.style.width = '';
      cell.style.minWidth = '';
      cell.style.maxWidth = '';
    });
    
    // Remove any custom CSS classes or styles that might have been applied
    const table = this.tableContainer.querySelector('.table');
    if (table) {
      table.style.fontSize = '';
      table.classList.remove('font-smallest', 'font-small', 'font-large', 'font-largest');
      table.classList.remove('padding-wide', 'padding-narrow');
    }
    
    // Reset any pinned column styles
    const pinnedCells = this.tableContainer.querySelectorAll('.pinned-left');
    pinnedCells.forEach(cell => {
      cell.classList.remove('pinned-left');
      cell.style.position = '';
      cell.style.left = '';
      cell.style.zIndex = '';
      cell.style.backgroundColor = '';
    });
  }

  /**
   * Show temporary message to user
   */
  showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 10001;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      messageDiv.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          document.body.removeChild(messageDiv);
        }
        if (style.parentNode) {
          document.head.removeChild(style);
        }
      }, 300);
    }, 3000);
  }

  destroy() {
    // Clean up event listeners and DOM
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }
    this.container.innerHTML = '';
    this.closeFilter();
  }
}

// ES modules export
export default ExceLikeTable;
export { ColumnHelpers };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExceLikeTable;
  module.exports.ColumnHelpers = ColumnHelpers;
}

// Browser global
if (typeof window !== 'undefined') {
  window.ExceLikeTable = ExceLikeTable;
  window.ColumnHelpers = ColumnHelpers;
}