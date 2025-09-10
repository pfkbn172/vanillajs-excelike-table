/**
 * Perfect Controller for V2 Architecture
 * Main orchestrator with single-path execution and error handling
 */

class ConditionalFormattingController {
  constructor(table, options = {}) {
    // Import dependencies
    const v2 = window.ConditionalFormattingV2;
    this.constants = v2;
    this.ConditionalFormattingError = v2.ConditionalFormattingError;
    this.ValidationError = v2.ValidationError;
    this.PerformanceError = v2.PerformanceError;
    
    // Core components - Single Source of Truth
    this.table = table;
    this.eventBus = new v2.EventBus();
    this.ruleEngine = new v2.RuleEngine();
    this.tableAdapter = new v2.TableAdapter(table);
    this.validator = new v2.Validator();
    
    // Configuration
    this.config = {
      enablePerformanceMonitoring: true,
      enableDebugMode: false,
      batchSize: this.constants.PERFORMANCE_THRESHOLDS.BATCH_SIZE,
      ...options
    };
    
    // State
    this.initialized = false;
    this.processing = false;
    this.lastFormatUpdate = new Date();
    
    // Performance tracking
    this.metrics = {
      rulesEvaluated: 0,
      cellsProcessed: 0,
      totalTime: 0,
      errors: 0
    };
    
    // Initialize components
    this._initialize();
  }
  
  /**
   * Initialize the controller and connect components
   */
  _initialize() {
    try {
      // Connect rule engine to event bus
      this.ruleEngine.setEventBus(this.eventBus);
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Validate table compatibility
      this._validateTableCompatibility();
      
      this.initialized = true;
      
      this.eventBus.emit(this.constants.EVENT_TYPES.RULE_ADDED, {
        message: 'Controller initialized successfully'
      });
      
    } catch (error) {
      throw new this.ConditionalFormattingError(
        `Failed to initialize controller: ${error.message}`,
        'INITIALIZATION_ERROR',
        { originalError: error }
      );
    }
  }
  
  /**
   * Set up event listeners for component coordination
   */
  _setupEventListeners() {
    // Listen for rule changes to trigger format updates
    this.eventBus.onRuleAdded((event) => {
      this._scheduleFormatUpdate();
    });
    
    this.eventBus.onRuleUpdated((event) => {
      this._scheduleFormatUpdate();
    });
    
    this.eventBus.onRuleDeleted((event) => {
      this._scheduleFormatUpdate();
    });
    
    // Monitor performance warnings
    this.eventBus.onPerformanceWarning((event) => {
      console.warn('[ConditionalFormatting] Performance warning:', event.data);
    });
    
    // Handle errors
    this.eventBus.onError((event) => {
      this.metrics.errors++;
      if (this.config.enableDebugMode) {
        console.error('[ConditionalFormatting] Error:', event.data);
      }
    });
  }
  
  /**
   * Validate table compatibility
   */
  _validateTableCompatibility() {
    const requiredMethods = ['getHeaders', 'getCellData', 'getRowData', 'getRowCount'];
    const missingMethods = requiredMethods.filter(method => 
      typeof this.table[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      throw new this.ValidationError(
        `Table is missing required methods: ${missingMethods.join(', ')}`,
        'table_compatibility',
        this.table
      );
    }
  }
  
  /**
   * Add new conditional formatting rule
   */
  addRule(config) {
    this._ensureInitialized();
    
    try {
      // Create and validate rule
      const rule = new this.constants.Rule(config);
      
      // Add to engine
      const ruleId = this.ruleEngine.addRule(rule);
      
      return ruleId;
      
    } catch (error) {
      this._handleError('addRule', error);
      throw error;
    }
  }
  
  /**
   * Update existing rule
   */
  updateRule(ruleId, updates) {
    this._ensureInitialized();
    
    try {
      const updatedRule = this.ruleEngine.updateRule(ruleId, updates);
      return updatedRule;
      
    } catch (error) {
      this._handleError('updateRule', error, { ruleId, updates });
      throw error;
    }
  }
  
  /**
   * Remove rule
   */
  removeRule(ruleId) {
    this._ensureInitialized();
    
    try {
      const removed = this.ruleEngine.removeRule(ruleId);
      return removed;
      
    } catch (error) {
      this._handleError('removeRule', error, { ruleId });
      throw error;
    }
  }
  
  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId, enabled) {
    this._ensureInitialized();
    
    try {
      const rule = this.ruleEngine.setRuleEnabled(ruleId, enabled);
      return rule;
      
    } catch (error) {
      this._handleError('setRuleEnabled', error, { ruleId, enabled });
      throw error;
    }
  }
  
  /**
   * Get all rules
   */
  getRules() {
    this._ensureInitialized();
    
    try {
      return this.ruleEngine.getAllRules();
      
    } catch (error) {
      this._handleError('getRules', error);
      throw error;
    }
  }
  
  /**
   * Get specific rule
   */
  getRule(ruleId) {
    this._ensureInitialized();
    
    try {
      return this.ruleEngine.getRule(ruleId);
      
    } catch (error) {
      this._handleError('getRule', error, { ruleId });
      throw error;
    }
  }
  
  /**
   * Apply formatting to entire table
   */
  applyFormatting() {
    this._ensureInitialized();
    
    if (this.processing) {
      console.warn('[ConditionalFormatting] Formatting already in progress');
      return;
    }
    
    this.processing = true;
    const startTime = performance.now();
    
    try {
      this.eventBus.emit(this.constants.EVENT_TYPES.BATCH_UPDATE_START);
      
      const dimensions = this.tableAdapter.getDimensions();
      const processedCells = this._processCellsBatch(dimensions);
      
      const duration = performance.now() - startTime;
      this.metrics.totalTime += duration;
      this.metrics.cellsProcessed += processedCells;
      this.lastFormatUpdate = new Date();
      
      this.eventBus.emit(this.constants.EVENT_TYPES.BATCH_UPDATE_END, {
        cellsProcessed: processedCells,
        duration: duration
      });
      
      // Performance warning if too slow
      if (duration > this.constants.PERFORMANCE_THRESHOLDS.BATCH_UPDATE) {
        this.eventBus.emit(this.constants.EVENT_TYPES.PERFORMANCE_WARNING, {
          operation: 'batch_formatting',
          duration: duration,
          threshold: this.constants.PERFORMANCE_THRESHOLDS.BATCH_UPDATE
        });
      }
      
    } catch (error) {
      this._handleError('applyFormatting', error);
      throw error;
      
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Process cells in batches for performance
   */
  _processCellsBatch(dimensions) {
    let processedCount = 0;
    
    for (let rowIndex = 0; rowIndex < dimensions.rows; rowIndex++) {
      // Get row data once per row for efficiency
      const rowData = this.tableAdapter.getRowData(rowIndex);
      
      for (let columnIndex = 0; columnIndex < dimensions.columns; columnIndex++) {
        try {
          const columnKey = this.tableAdapter.getColumnKey(columnIndex);
          const cellValue = rowData[columnKey];
          
          // Evaluate rules for this cell
          const matchingRules = this.ruleEngine.evaluateCell(
            cellValue, rowData, rowIndex, columnIndex, columnKey
          );
          
          // Apply formatting if rules match
          if (matchingRules.length > 0) {
            this._applyFormattingToCell(rowIndex, columnIndex, matchingRules);
          } else {
            this._clearFormattingFromCell(rowIndex, columnIndex);
          }
          
          processedCount++;
          this.metrics.rulesEvaluated += matchingRules.length;
          
        } catch (error) {
          this._handleError('processCellsBatch', error, {
            rowIndex,
            columnIndex,
            cellBatch: true
          });
          // Continue processing other cells
        }
        
        // Yield control periodically for UI responsiveness
        if (processedCount % this.config.batchSize === 0) {
          // Allow other tasks to run
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this._processCellsBatch(dimensions));
            }, 0);
          });
        }
      }
    }
    
    return processedCount;
  }
  
  /**
   * Apply formatting to specific cell
   */
  _applyFormattingToCell(rowIndex, columnIndex, matchingRules) {
    try {
      // Get highest priority rule's format
      const topRule = matchingRules[0]; // Already sorted by priority
      const format = topRule.format;
      
      // Apply CSS classes and styles
      const cell = this._getCellElement(rowIndex, columnIndex);
      if (cell) {
        // Add V2 namespace class
        cell.classList.add(this.constants.CSS_CLASSES.APPLIED);
        
        // Apply inline styles
        Object.entries(format).forEach(([property, value]) => {
          if (this.constants.FORMAT_PROPERTIES.includes(property)) {
            cell.style[property] = value;
          }
        });
        
        // Store rule ID for debugging
        cell.dataset.cfRuleId = topRule.rule.id;
      }
      
      this.eventBus.emit(this.constants.EVENT_TYPES.FORMAT_APPLIED, {
        rowIndex,
        columnIndex,
        ruleId: topRule.rule.id,
        format
      });
      
    } catch (error) {
      this._handleError('applyFormattingToCell', error, {
        rowIndex,
        columnIndex,
        matchingRules
      });
    }
  }
  
  /**
   * Clear formatting from specific cell
   */
  _clearFormattingFromCell(rowIndex, columnIndex) {
    try {
      const cell = this._getCellElement(rowIndex, columnIndex);
      if (cell) {
        // Remove V2 classes
        cell.classList.remove(this.constants.CSS_CLASSES.APPLIED);
        
        // Clear formatting styles
        this.constants.FORMAT_PROPERTIES.forEach(property => {
          cell.style.removeProperty(property);
        });
        
        // Remove debug data
        delete cell.dataset.cfRuleId;
      }
      
      this.eventBus.emit(this.constants.EVENT_TYPES.FORMAT_REMOVED, {
        rowIndex,
        columnIndex
      });
      
    } catch (error) {
      this._handleError('clearFormattingFromCell', error, {
        rowIndex,
        columnIndex
      });
    }
  }
  
  /**
   * Get cell DOM element
   */
  _getCellElement(rowIndex, columnIndex) {
    try {
      // Try multiple methods to get cell element
      if (typeof this.table.getCellElement === 'function') {
        return this.table.getCellElement(rowIndex, columnIndex);
      }
      
      // Fallback for standard table structures
      const tableElement = this.table.element || this.table.tableElement;
      if (tableElement) {
        const rows = tableElement.querySelectorAll('tbody tr, tr');
        const row = rows[rowIndex];
        if (row) {
          const cells = row.querySelectorAll('td, th');
          return cells[columnIndex];
        }
      }
      
      return null;
      
    } catch (error) {
      this._handleError('getCellElement', error, { rowIndex, columnIndex });
      return null;
    }
  }
  
  /**
   * Schedule format update (debounced)
   */
  _scheduleFormatUpdate() {
    if (this.formatUpdateTimeout) {
      clearTimeout(this.formatUpdateTimeout);
    }
    
    this.formatUpdateTimeout = setTimeout(() => {
      this.applyFormatting();
    }, 50); // Debounce updates
  }
  
  /**
   * Clear all formatting
   */
  clearAllFormatting() {
    this._ensureInitialized();
    
    try {
      const dimensions = this.tableAdapter.getDimensions();
      
      for (let rowIndex = 0; rowIndex < dimensions.rows; rowIndex++) {
        for (let columnIndex = 0; columnIndex < dimensions.columns; columnIndex++) {
          this._clearFormattingFromCell(rowIndex, columnIndex);
        }
      }
      
    } catch (error) {
      this._handleError('clearAllFormatting', error);
      throw error;
    }
  }
  
  /**
   * Export rules as JSON
   */
  exportRules() {
    this._ensureInitialized();
    
    try {
      return this.ruleEngine.exportRules();
      
    } catch (error) {
      this._handleError('exportRules', error);
      throw error;
    }
  }
  
  /**
   * Import rules from JSON
   */
  importRules(rulesData) {
    this._ensureInitialized();
    
    try {
      const result = this.ruleEngine.importRules(rulesData);
      
      if (result.imported.length > 0) {
        this._scheduleFormatUpdate();
      }
      
      return result;
      
    } catch (error) {
      this._handleError('importRules', error, { rulesData });
      throw error;
    }
  }
  
  /**
   * Get controller statistics
   */
  getStats() {
    this._ensureInitialized();
    
    return {
      controller: {
        initialized: this.initialized,
        processing: this.processing,
        lastUpdate: this.lastFormatUpdate,
        metrics: { ...this.metrics }
      },
      ruleEngine: this.ruleEngine.getPerformanceStats(),
      tableAdapter: this.tableAdapter.getStats(),
      eventBus: this.eventBus.getStats()
    };
  }
  
  /**
   * Ensure controller is initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new this.ConditionalFormattingError(
        'Controller not initialized',
        'NOT_INITIALIZED'
      );
    }
  }
  
  /**
   * Handle errors with consistent logging and events
   */
  _handleError(operation, error, context = null) {
    this.metrics.errors++;
    
    const errorData = {
      operation,
      error: error.message,
      context,
      timestamp: new Date()
    };
    
    this.eventBus.emit(this.constants.EVENT_TYPES.ERROR_OCCURRED, errorData);
    
    if (this.config.enableDebugMode) {
      console.error(`[ConditionalFormatting.${operation}]`, error, context);
    }
  }
  
  /**
   * Destroy controller and clean up resources
   */
  destroy() {
    try {
      // Clear formatting
      this.clearAllFormatting();
      
      // Clear rules
      this.ruleEngine.clear();
      
      // Clear caches
      this.tableAdapter.clearCache();
      this.eventBus.clearHistory();
      
      // Clear timeouts
      if (this.formatUpdateTimeout) {
        clearTimeout(this.formatUpdateTimeout);
      }
      
      this.initialized = false;
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error during destroy:', error);
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingController;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.Controller = ConditionalFormattingController;
}