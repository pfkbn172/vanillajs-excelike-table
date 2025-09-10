/**
 * Perfect Table Data Adapter for V2 Architecture
 * Robust data access with error handling and validation
 */

class TableDataAdapter {
  constructor(table) {
    // Import dependencies
    const v2 = window.ConditionalFormattingV2;
    this.constants = v2;
    this.DataAccessError = v2.DataAccessError;
    
    this.table = table;
    this.dataCache = new Map();
    this.columnMappings = new Map();
    this.cacheEnabled = true;
    this.cacheTimeout = 5000; // 5 seconds
    
    // Initialize column mappings
    this._initializeColumnMappings();
  }
  
  /**
   * Initialize column mappings (key -> index, index -> key)
   */
  _initializeColumnMappings() {
    try {
      const headers = this.table.getHeaders();
      
      headers.forEach((header, index) => {
        // Store both directions
        this.columnMappings.set(header, index);
        this.columnMappings.set(index, header);
        this.columnMappings.set(index.toString(), header);
      });
      
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to initialize column mappings: ${error.message}`,
        'column_mapping'
      );
    }
  }
  
  /**
   * Get cell data with robust error handling
   */
  getCellData(rowIndex, columnKey) {
    try {
      // Validate inputs
      this._validateRowIndex(rowIndex);
      this._validateColumn(columnKey);
      
      // Get column index
      const columnIndex = this._getColumnIndex(columnKey);
      
      // Check cache first
      const cacheKey = `${rowIndex}_${columnIndex}`;
      if (this.cacheEnabled && this.dataCache.has(cacheKey)) {
        const cached = this.dataCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.value;
        } else {
          this.dataCache.delete(cacheKey);
        }
      }
      
      // Get data from table
      const cellData = this.table.getCellData(rowIndex, columnIndex);
      
      // Cache the result
      if (this.cacheEnabled) {
        this.dataCache.set(cacheKey, {
          value: cellData,
          timestamp: Date.now()
        });
      }
      
      return cellData;
      
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get cell data at row ${rowIndex}, column ${columnKey}: ${error.message}`,
        'cell_access'
      );
    }
  }
  
  /**
   * Get row data with error handling
   */
  getRowData(rowIndex) {
    try {
      this._validateRowIndex(rowIndex);
      
      // Check cache first
      const cacheKey = `row_${rowIndex}`;
      if (this.cacheEnabled && this.dataCache.has(cacheKey)) {
        const cached = this.dataCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.value;
        } else {
          this.dataCache.delete(cacheKey);
        }
      }
      
      // Get row data from table
      const rowData = this.table.getRowData(rowIndex);
      
      // Convert to object with column keys
      const rowObject = {};
      const headers = this.table.getHeaders();
      
      if (Array.isArray(rowData)) {
        headers.forEach((header, index) => {
          rowObject[header] = rowData[index];
        });
      } else if (typeof rowData === 'object' && rowData !== null) {
        // Already an object, use as-is
        Object.assign(rowObject, rowData);
      } else {
        throw new this.DataAccessError(
          `Invalid row data format: expected array or object, got ${typeof rowData}`,
          'row_data_format'
        );
      }
      
      // Cache the result
      if (this.cacheEnabled) {
        this.dataCache.set(cacheKey, {
          value: rowObject,
          timestamp: Date.now()
        });
      }
      
      return rowObject;
      
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get row data at index ${rowIndex}: ${error.message}`,
        'row_access'
      );
    }
  }
  
  /**
   * Get column data
   */
  getColumnData(columnKey) {
    try {
      this._validateColumn(columnKey);
      
      const columnIndex = this._getColumnIndex(columnKey);
      const rowCount = this.getRowCount();
      const columnData = [];
      
      for (let i = 0; i < rowCount; i++) {
        try {
          const cellData = this.getCellData(i, columnKey);
          columnData.push(cellData);
        } catch (error) {
          // Log error but continue with null value
          console.warn(`Failed to get cell data at row ${i}, column ${columnKey}:`, error);
          columnData.push(null);
        }
      }
      
      return columnData;
      
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get column data for ${columnKey}: ${error.message}`,
        'column_access'
      );
    }
  }
  
  /**
   * Get table dimensions
   */
  getDimensions() {
    try {
      return {
        rows: this.getRowCount(),
        columns: this.getColumnCount()
      };
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get table dimensions: ${error.message}`,
        'dimensions'
      );
    }
  }
  
  /**
   * Get row count with error handling
   */
  getRowCount() {
    try {
      if (typeof this.table.getRowCount === 'function') {
        return this.table.getRowCount();
      } else if (this.table.data && Array.isArray(this.table.data)) {
        return this.table.data.length;
      } else if (this.table.rows && Array.isArray(this.table.rows)) {
        return this.table.rows.length;
      } else {
        throw new this.DataAccessError('Unable to determine row count', 'row_count');
      }
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get row count: ${error.message}`,
        'row_count'
      );
    }
  }
  
  /**
   * Get column count with error handling
   */
  getColumnCount() {
    try {
      const headers = this.getHeaders();
      return headers.length;
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get column count: ${error.message}`,
        'column_count'
      );
    }
  }
  
  /**
   * Get table headers
   */
  getHeaders() {
    try {
      if (typeof this.table.getHeaders === 'function') {
        return this.table.getHeaders();
      } else if (this.table.headers && Array.isArray(this.table.headers)) {
        return [...this.table.headers];
      } else if (this.table.columns && Array.isArray(this.table.columns)) {
        return this.table.columns.map(col => 
          typeof col === 'string' ? col : col.name || col.key || col.title
        );
      } else {
        throw new this.DataAccessError('Unable to determine table headers', 'headers');
      }
    } catch (error) {
      throw new this.DataAccessError(
        `Failed to get headers: ${error.message}`,
        'headers'
      );
    }
  }
  
  /**
   * Get column index from key
   */
  _getColumnIndex(columnKey) {
    // Try direct lookup first
    if (this.columnMappings.has(columnKey)) {
      const mapped = this.columnMappings.get(columnKey);
      return typeof mapped === 'number' ? mapped : this.columnMappings.get(mapped);
    }
    
    // Try parsing as number
    if (typeof columnKey === 'string' && !isNaN(columnKey)) {
      const index = parseInt(columnKey, 10);
      if (index >= 0 && index < this.getColumnCount()) {
        return index;
      }
    }
    
    // Try direct number
    if (typeof columnKey === 'number' && columnKey >= 0 && columnKey < this.getColumnCount()) {
      return columnKey;
    }
    
    throw new this.DataAccessError(
      `Invalid column identifier: ${columnKey}`,
      'column_mapping'
    );
  }
  
  /**
   * Get column key from index
   */
  getColumnKey(columnIndex) {
    this._validateColumnIndex(columnIndex);
    
    if (this.columnMappings.has(columnIndex)) {
      return this.columnMappings.get(columnIndex);
    }
    
    const headers = this.getHeaders();
    if (columnIndex >= 0 && columnIndex < headers.length) {
      return headers[columnIndex];
    }
    
    throw new this.DataAccessError(
      `Invalid column index: ${columnIndex}`,
      'column_mapping'
    );
  }
  
  /**
   * Validate row index
   */
  _validateRowIndex(rowIndex) {
    if (typeof rowIndex !== 'number' || !Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new this.DataAccessError(
        `Invalid row index: ${rowIndex}. Must be a non-negative integer.`,
        'validation'
      );
    }
    
    const rowCount = this.getRowCount();
    if (rowIndex >= rowCount) {
      throw new this.DataAccessError(
        `Row index ${rowIndex} is out of bounds. Table has ${rowCount} rows.`,
        'validation'
      );
    }
  }
  
  /**
   * Validate column index
   */
  _validateColumnIndex(columnIndex) {
    if (typeof columnIndex !== 'number' || !Number.isInteger(columnIndex) || columnIndex < 0) {
      throw new this.DataAccessError(
        `Invalid column index: ${columnIndex}. Must be a non-negative integer.`,
        'validation'
      );
    }
    
    const columnCount = this.getColumnCount();
    if (columnIndex >= columnCount) {
      throw new this.DataAccessError(
        `Column index ${columnIndex} is out of bounds. Table has ${columnCount} columns.`,
        'validation'
      );
    }
  }
  
  /**
   * Validate column key or index
   */
  _validateColumn(columnKey) {
    if (columnKey === null || columnKey === undefined) {
      throw new this.DataAccessError(
        'Column identifier cannot be null or undefined',
        'validation'
      );
    }
    
    // Allow strings (column names) and numbers (column indices)
    if (typeof columnKey !== 'string' && typeof columnKey !== 'number') {
      throw new this.DataAccessError(
        `Invalid column identifier type: ${typeof columnKey}. Must be string or number.`,
        'validation'
      );
    }
  }
  
  /**
   * Check if column exists
   */
  hasColumn(columnKey) {
    try {
      this._getColumnIndex(columnKey);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.dataCache.clear();
  }
  
  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
  
  /**
   * Set cache timeout
   */
  setCacheTimeout(timeout) {
    this.cacheTimeout = timeout;
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.dataCache.size,
      enabled: this.cacheEnabled,
      timeout: this.cacheTimeout,
      hitRate: this._calculateCacheHitRate()
    };
  }
  
  /**
   * Calculate cache hit rate (simplified)
   */
  _calculateCacheHitRate() {
    // This would require more detailed tracking in a production implementation
    return this.dataCache.size > 0 ? 0.8 : 0; // Placeholder
  }
  
  /**
   * Refresh column mappings (call when table structure changes)
   */
  refreshColumnMappings() {
    this.columnMappings.clear();
    this.clearCache();
    this._initializeColumnMappings();
  }
  
  /**
   * Get adapter statistics
   */
  getStats() {
    try {
      return {
        dimensions: this.getDimensions(),
        cache: this.getCacheStats(),
        columnMappings: this.columnMappings.size,
        tableType: this.table.constructor.name || 'Unknown'
      };
    } catch (error) {
      return {
        error: error.message,
        cache: this.getCacheStats()
      };
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableDataAdapter;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.TableAdapter = TableDataAdapter;
}