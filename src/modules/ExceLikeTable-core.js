/**
 * ExceLike Table - Core Module
 * Contains the main class definition, initialization, state management, and core lifecycle
 */

// Import utilities (Node.js environment only)
// In browser, utilities are loaded via script tags and available globally
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment - require modules
  const DOMUtils = require('../dom-utils');
  const PerformanceUtils = require('../performance-utils');
}

// Validate dependencies are available (browser and Node.js)
if (typeof DOMUtils === 'undefined') {
  throw new Error('DOMUtils not found. Please ensure dom-utils.js is loaded before ExceLikeTable.js');
}
if (typeof PerformanceUtils === 'undefined') {
  throw new Error('PerformanceUtils not found. Please ensure performance-utils.js is loaded before ExceLikeTable.js');
}

// Predefined table presets for easy setup
const TABLE_PRESETS = {
  simple: {
    features: ['sorting'],
    bordered: true,
    size: 'middle',
    pagination: { pageSize: 10 }
  },
  
  standard: {
    features: ['sorting', 'filtering', 'pagination', 'columnSettings'],
    bordered: true,
    size: 'middle',
    pagination: { pageSize: 10, showSizeChanger: true }
  },
  
  advanced: {
    features: ['sorting', 'filtering', 'pagination', 'columnSettings', 'persistSettings'],
    bordered: true,
    size: 'middle',
    pagination: { pageSize: 10, showSizeChanger: true }
  },
  
  excel: {
    features: ['sorting', 'filtering', 'pagination', 'columnSettings', 'persistSettings', 'columnResizing', 'columnPinning'],
    bordered: true,
    size: 'middle',
    pagination: { pageSize: 10, showSizeChanger: true }
  }
};

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
   * Create a numeric column with proper formatting
   */
  number(key, title, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 120,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      filterType: 'range',
      align: 'right',
      render: options.render || ((value) => {
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value;
      }),
      ...options
    };
  },

  /**
   * Create a currency column
   */
  currency(key, title, options = {}) {
    const currency = options.currency || 'USD';
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 140,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      filterType: 'range',
      align: 'right',
      render: options.render || ((value) => {
        if (typeof value === 'number') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
          }).format(value);
        }
        return value;
      }),
      ...options
    };
  },

  /**
   * Create a date column
   */
  date(key, title, options = {}) {
    return {
      key,
      title,
      dataIndex: key,
      width: options.width || 120,
      sortable: options.sortable !== false,
      filterable: options.filterable !== false,
      filterType: 'dateHierarchy',
      render: options.render || ((value) => {
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toLocaleDateString();
        }
        return value;
      }),
      ...options
    };
  },

  /**
   * Create an action column with buttons
   */
  actions(title, actions, options = {}) {
    return {
      key: '_actions',
      title: title || 'Actions',
      dataIndex: '_actions',
      width: options.width || (actions.length * 40 + 20),
      sortable: false,
      filterable: false,
      render: (value, record, index) => {
        return actions.map(action => 
          `<button class="action-btn ${action.className || ''}" 
                   data-action="${action.key}" 
                   data-index="${index}"
                   title="${action.tooltip || action.label}">
             ${action.label}
           </button>`
        ).join('');
      },
      ...options
    };
  }
};

/**
 * ExceLike Table Core Class
 * Main class containing initialization, state management, and core lifecycle methods
 */
class ExceLikeTableCore {
  constructor(container, options = {}) {
    // Validate container
    if (!container) {
      throw new Error('Container element is required');
    }

    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Apply preset if specified
    if (options.preset && TABLE_PRESETS[options.preset]) {
      options = { ...TABLE_PRESETS[options.preset], ...options };
    }

    // Set up core properties
    this.options = this.validateOptions(options);
    this.state = this.initializeState();
    
    // Initialize core systems
    this.initializeColumns();
    this.checkFixedHeight();
    
    // Set up persistence if enabled
    if (this.isFeatureEnabled('persistSettings')) {
      this.initializePersistence();
    }
  }

  /**
   * Validate and normalize options
   */
  validateOptions(options) {
    const defaults = {
      id: 'excelike-table',
      tableId: options.id || 'excelike-table',
      columns: [],
      data: [],
      features: ['sorting', 'filtering', 'pagination'],
      pagination: {
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: false
      },
      bordered: true,
      size: 'middle',
      loading: false,
      locale: 'en',
      fixedHeight: false,
      fontSize: 'medium',
      cellPadding: 'standard'
    };

    const validated = { ...defaults, ...options };

    // Validate columns
    if (!Array.isArray(validated.columns)) {
      throw new Error('Columns must be an array');
    }

    // Validate data
    if (!Array.isArray(validated.data)) {
      validated.data = [];
    }

    // Validate features
    if (!Array.isArray(validated.features)) {
      validated.features = defaults.features;
    }

    return validated;
  }

  /**
   * Initialize internal state
   */
  initializeState() {
    return {
      data: [...this.options.data],
      filteredData: [...this.options.data],
      currentPage: 1,
      pageSize: this.options.pagination.pageSize,
      sortColumn: null,
      sortDirection: null,
      filters: {},
      columnWidths: {},
      pinnedColumns: {},
      visibleColumns: {},
      loading: this.options.loading,
      fontSize: this.options.fontSize,
      cellPadding: this.options.cellPadding
    };
  }

  /**
   * Initialize columns with default settings
   */
  initializeColumns() {
    this.options.columns.forEach(column => {
      // Set default visibility
      this.state.visibleColumns[column.key] = column.hidden !== true;
      
      // Set default pinning
      this.state.pinnedColumns[column.key] = column.pinned === true;
      
      // Set initial width
      this.state.columnWidths[column.key] = column.width || 150;
    });
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.options.features.includes(feature);
  }

  /**
   * Check and set fixed height mode
   */
  checkFixedHeight() {
    if (this.options.fixedHeight) {
      this.container.style.height = typeof this.options.fixedHeight === 'string' 
        ? this.options.fixedHeight 
        : '400px';
      this.container.classList.add('fixed-height');
    }
  }

  /**
   * Set table data
   */
  setData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    
    this.state.data = [...data];
    this.state.filteredData = [...data];
    this.state.currentPage = 1;
    
    // Clear existing filters when new data is set
    this.state.filters = {};
    
    return this;
  }

  /**
   * Update table data (alias for setData)
   */
  updateData(data) {
    return this.setData(data);
  }

  /**
   * Get current data
   */
  getData() {
    return [...this.state.data];
  }

  /**
   * Get filtered data
   */
  getFilteredData() {
    return [...this.state.filteredData];
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.state.loading = loading;
    
    if (this.container.querySelector('.excelike-table')) {
      const loadingEl = this.container.querySelector('.table-loading');
      if (loading && !loadingEl) {
        const loader = document.createElement('div');
        loader.className = 'table-loading';
        loader.textContent = 'Loading...';
        this.container.querySelector('.excelike-table').appendChild(loader);
      } else if (!loading && loadingEl) {
        loadingEl.remove();
      }
    }
    
    return this;
  }

  /**
   * Debounce utility function
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

  /**
   * Get visible columns
   */
  getVisibleColumns() {
    return this.options.columns.filter(col => this.state.visibleColumns[col.key]);
  }

  /**
   * Destroy table instance and clean up
   */
  destroy() {
    // Remove event listeners
    if (this.eventCleanupFunctions) {
      this.eventCleanupFunctions.forEach(cleanup => cleanup());
    }

    // Clean up persistence
    if (this.saveStateDebounced) {
      this.saveStateDebounced.cancel && this.saveStateDebounced.cancel();
    }

    // Remove DOM elements
    if (this.container) {
      this.container.innerHTML = '';
      this.container.className = '';
    }

    // Clear references
    this.container = null;
    this.options = null;
    this.state = null;
  }

  /**
   * Initialize persistence system (placeholder - implemented in settings module)
   */
  initializePersistence() {
    // This will be implemented in the Settings module
    // Placeholder to maintain interface compatibility
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ExceLikeTableCore, 
    TABLE_PRESETS, 
    TABLE_CONFIG, 
    ColumnHelpers 
  };
}

if (typeof window !== 'undefined') {
  window.ExceLikeTableCore = ExceLikeTableCore;
  window.TABLE_PRESETS = TABLE_PRESETS;
  window.TABLE_CONFIG = TABLE_CONFIG;
  window.ColumnHelpers = ColumnHelpers;
}