/**
 * Conditional Formatting Data Manager
 * Efficiently manages column data access and statistics calculation using full dataset
 */

class ConditionalFormattingDataManager {
  constructor(table, config, utils) {
    this.table = table;
    this.config = config || {};
    this.utils = utils;
    
    // Cache for column statistics to avoid recalculation
    this.statsCache = new Map();
    
    // Track data version to invalidate cache when data changes
    this.dataVersion = 0;
  }
  
  /**
   * Get column statistics from full dataset (not just visible data)
   * @param {number} columnIndex - Column index
   * @param {Array} columns - Column definitions
   * @returns {Object} Column statistics
   */
  getColumnStats(columnIndex, columns) {
    // Create cache key
    const cacheKey = `${columnIndex}-${this.dataVersion}`;
    
    // Return cached result if available
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey);
    }
    
    
    // Get column definition
    const column = columns[columnIndex];
    if (!column) {
      return { min: 0, max: 0, percentiles: {}, count: 0, dataType: 'unknown' };
    }
    
    // Extract column data from full dataset
    const columnData = this.extractColumnDataFromState(column.dataIndex);
    
    // Calculate statistics
    const stats = this.calculateColumnStatistics(columnData);
    
    // Cache the result
    this.statsCache.set(cacheKey, stats);
    
    
    return stats;
  }
  
  /**
   * Extract column data from table state (full dataset)
   * @param {string} dataIndex - Column data index
   * @returns {Array} Column values
   */
  extractColumnDataFromState(dataIndex) {
    const columnData = [];
    
    // Access full data from table state
    let data = [];
    
    if (this.table.state && this.table.state.data) {
      data = this.table.state.data;
    } else if (this.table.getData && typeof this.table.getData === 'function') {
      data = this.table.getData() || [];
    } else if (this.table.options && this.table.options.data) {
      data = this.table.options.data;
    }
    
    
    // Extract values for the specified column
    for (const row of data) {
      if (row && typeof row === 'object' && dataIndex in row) {
        columnData.push(row[dataIndex]);
      }
    }
    
    
    return columnData;
  }
  
  /**
   * Calculate comprehensive statistics for column data
   * @param {Array} columnData - Raw column values
   * @returns {Object} Statistics object
   */
  calculateColumnStatistics(columnData) {
    if (!columnData || columnData.length === 0) {
      return { min: 0, max: 0, percentiles: {}, count: 0, dataType: 'unknown' };
    }
    
    // Parse numeric values using utils
    const numericValues = columnData
      .map(value => this.utils.parseNumeric(value))
      .filter(value => this.utils.isNumeric(value));
    
    // Determine data type
    const dataType = numericValues.length > 0 ? 'number' : 'text';
    
    if (numericValues.length === 0) {
      return { min: 0, max: 0, percentiles: {}, count: 0, dataType };
    }
    
    // Sort values for statistics calculation
    const sorted = numericValues.sort((a, b) => a - b);
    
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Calculate percentiles
    const percentiles = {};
    for (let p = 10; p <= 90; p += 10) {
      const index = Math.floor((p / 100) * (sorted.length - 1));
      percentiles[`p${p}`] = sorted[index];
    }
    
    // Calculate quartiles
    const q1Index = Math.floor(0.25 * (sorted.length - 1));
    const q2Index = Math.floor(0.5 * (sorted.length - 1));
    const q3Index = Math.floor(0.75 * (sorted.length - 1));
    
    percentiles.q1 = sorted[q1Index];
    percentiles.median = sorted[q2Index];
    percentiles.q3 = sorted[q3Index];
    
    // Calculate mean
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / sorted.length;
    
    return {
      min,
      max,
      mean,
      percentiles,
      count: numericValues.length,
      totalValues: columnData.length,
      dataType,
      range: max - min,
      // Additional metadata
      hasNegativeValues: min < 0,
      hasZeroValues: sorted.includes(0),
      calculatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Invalidate cache when data changes
   */
  invalidateCache() {
    this.dataVersion++;
    this.statsCache.clear();
  }
  
  /**
   * Get cached statistics for debugging
   * @returns {Object} Cache information
   */
  getCacheInfo() {
    return {
      dataVersion: this.dataVersion,
      cachedColumns: Array.from(this.statsCache.keys()),
      cacheSize: this.statsCache.size
    };
  }
  
  /**
   * Clear all cached data
   */
  clearCache() {
    this.statsCache.clear();
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.clearCache();
    this.table = null;
    this.config = null;
    this.utils = null;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingDataManager;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingDataManager = ConditionalFormattingDataManager;
}