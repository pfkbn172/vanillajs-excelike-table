/**
 * WebWorker Support for ExceLike Table
 * Provides background processing capabilities for heavy operations
 */

const WebWorkerSupport = {
  /**
   * Initialize WebWorker support
   * @param {Object} tableInstance - Table instance
   */
  init(tableInstance) {
    this.table = tableInstance;
    this.workers = new Map();
    this.taskQueue = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.workerPool = [];
    this.taskCounter = 0;
    
    // Initialize worker pool
    this.initializeWorkerPool();
    
    return this;
  },

  /**
   * Initialize worker pool
   */
  initializeWorkerPool() {
    if (!window.Worker) {
      console.warn('WebWorkers not supported in this browser');
      return;
    }
    
    // Create worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  },

  /**
   * Create a worker
   * @returns {Object} Worker info object
   */
  createWorker() {
    const workerInfo = {
      id: `worker-${Date.now()}-${Math.random()}`,
      worker: null,
      busy: false,
      currentTask: null,
      createdAt: Date.now()
    };

    try {
      // Create worker with inline code
      const workerBlob = new Blob([this.getWorkerCode()], { 
        type: 'application/javascript' 
      });
      const workerUrl = URL.createObjectURL(workerBlob);
      
      workerInfo.worker = new Worker(workerUrl);
      workerInfo.worker.onmessage = (e) => this.handleWorkerMessage(workerInfo, e);
      workerInfo.worker.onerror = (e) => this.handleWorkerError(workerInfo, e);
      
      this.workerPool.push(workerInfo);
      
      // Cleanup URL object
      setTimeout(() => URL.revokeObjectURL(workerUrl), 1000);
      
    } catch (error) {
      console.error('Failed to create worker:', error);
    }

    return workerInfo;
  },

  /**
   * Get worker JavaScript code
   * @returns {string} Worker code
   */
  getWorkerCode() {
    return `
      // WebWorker code for table operations
      self.onmessage = function(e) {
        const { taskId, operation, data, options } = e.data;
        
        try {
          let result;
          
          switch (operation) {
            case 'filter':
              result = performFilter(data, options);
              break;
            case 'sort':
              result = performSort(data, options);
              break;
            case 'search':
              result = performSearch(data, options);
              break;
            case 'aggregate':
              result = performAggregate(data, options);
              break;
            case 'transform':
              result = performTransform(data, options);
              break;
            case 'validate':
              result = performValidation(data, options);
              break;
            case 'export':
              result = performExport(data, options);
              break;
            case 'calculate':
              result = performCalculation(data, options);
              break;
            default:
              throw new Error('Unknown operation: ' + operation);
          }
          
          self.postMessage({
            taskId,
            success: true,
            result,
            processingTime: Date.now() - e.data.startTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            processingTime: Date.now() - e.data.startTime
          });
        }
      };
      
      // Filter operation
      function performFilter(data, options) {
        const { filters, logic } = options;
        
        return data.filter(row => {
          if (logic === 'AND') {
            return filters.every(filter => evaluateFilter(row, filter));
          } else {
            return filters.some(filter => evaluateFilter(row, filter));
          }
        });
      }
      
      // Evaluate single filter
      function evaluateFilter(row, filter) {
        const value = row[filter.column];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return value == filterValue;
          case 'not_equals':
            return value != filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'not_contains':
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends_with':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'greater_than':
            return parseFloat(value) > parseFloat(filterValue);
          case 'less_than':
            return parseFloat(value) < parseFloat(filterValue);
          case 'greater_equal':
            return parseFloat(value) >= parseFloat(filterValue);
          case 'less_equal':
            return parseFloat(value) <= parseFloat(filterValue);
          case 'between':
            const val = parseFloat(value);
            return val >= parseFloat(filter.min) && val <= parseFloat(filter.max);
          case 'is_null':
            return value == null || value === '';
          case 'is_not_null':
            return value != null && value !== '';
          case 'regex':
            try {
              const regex = new RegExp(filterValue, filter.flags || 'i');
              return regex.test(String(value));
            } catch {
              return false;
            }
          default:
            return true;
        }
      }
      
      // Sort operation
      function performSort(data, options) {
        const { sorts } = options;
        
        return [...data].sort((a, b) => {
          for (const sort of sorts) {
            const aVal = a[sort.column];
            const bVal = b[sort.column];
            let comparison = 0;
            
            if (aVal === null || aVal === undefined) comparison = 1;
            else if (bVal === null || bVal === undefined) comparison = -1;
            else if (typeof aVal === 'number' && typeof bVal === 'number') {
              comparison = aVal - bVal;
            } else {
              comparison = String(aVal).localeCompare(String(bVal));
            }
            
            if (comparison !== 0) {
              return sort.direction === 'desc' ? -comparison : comparison;
            }
          }
          return 0;
        });
      }
      
      // Search operation
      function performSearch(data, options) {
        const { query, columns, fuzzy } = options;
        const searchQuery = query.toLowerCase();
        
        return data.filter(row => {
          return columns.some(column => {
            const value = String(row[column] || '').toLowerCase();
            
            if (fuzzy) {
              return fuzzyMatch(value, searchQuery);
            } else {
              return value.includes(searchQuery);
            }
          });
        });
      }
      
      // Fuzzy matching
      function fuzzyMatch(text, pattern) {
        const patternLength = pattern.length;
        const textLength = text.length;
        
        if (patternLength === 0) return true;
        if (textLength === 0) return false;
        
        let patternIndex = 0;
        let textIndex = 0;
        
        while (patternIndex < patternLength && textIndex < textLength) {
          if (pattern[patternIndex] === text[textIndex]) {
            patternIndex++;
          }
          textIndex++;
        }
        
        return patternIndex === patternLength;
      }
      
      // Aggregate operation
      function performAggregate(data, options) {
        const { groupBy, aggregations } = options;
        const groups = {};
        
        // Group data
        data.forEach(row => {
          const key = groupBy ? row[groupBy] : 'all';
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(row);
        });
        
        // Perform aggregations
        const results = {};
        Object.entries(groups).forEach(([key, rows]) => {
          results[key] = {};
          
          aggregations.forEach(agg => {
            const values = rows.map(row => parseFloat(row[agg.column])).filter(v => !isNaN(v));
            
            switch (agg.type) {
              case 'count':
                results[key][agg.column + '_count'] = rows.length;
                break;
              case 'sum':
                results[key][agg.column + '_sum'] = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
                results[key][agg.column + '_avg'] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
              case 'min':
                results[key][agg.column + '_min'] = values.length ? Math.min(...values) : null;
                break;
              case 'max':
                results[key][agg.column + '_max'] = values.length ? Math.max(...values) : null;
                break;
            }
          });
        });
        
        return results;
      }
      
      // Transform operation
      function performTransform(data, options) {
        const { transformations } = options;
        
        return data.map(row => {
          const transformedRow = { ...row };
          
          transformations.forEach(transform => {
            switch (transform.type) {
              case 'calculate':
                try {
                  const func = new Function('row', 'return ' + transform.expression);
                  transformedRow[transform.target] = func(row);
                } catch (error) {
                  transformedRow[transform.target] = null;
                }
                break;
              case 'format':
                transformedRow[transform.target] = formatValue(row[transform.source], transform.format);
                break;
              case 'convert':
                transformedRow[transform.target] = convertValue(row[transform.source], transform.from, transform.to);
                break;
            }
          });
          
          return transformedRow;
        });
      }
      
      // Format value
      function formatValue(value, format) {
        switch (format.type) {
          case 'currency':
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: format.currency || 'USD' }).format(value);
          case 'percentage':
            return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: format.decimals || 2 }).format(value / 100);
          case 'date':
            return new Date(value).toLocaleDateString(format.locale || 'en-US');
          default:
            return value;
        }
      }
      
      // Convert value
      function convertValue(value, from, to) {
        if (from === 'string' && to === 'number') {
          return parseFloat(value) || 0;
        } else if (from === 'number' && to === 'string') {
          return String(value);
        } else if (from === 'date' && to === 'timestamp') {
          return new Date(value).getTime();
        } else if (from === 'timestamp' && to === 'date') {
          return new Date(parseInt(value)).toISOString().split('T')[0];
        }
        return value;
      }
      
      // Validation operation
      function performValidation(data, options) {
        const { rules } = options;
        const errors = [];
        
        data.forEach((row, index) => {
          rules.forEach(rule => {
            const value = row[rule.column];
            const isValid = validateValue(value, rule);
            
            if (!isValid) {
              errors.push({
                row: index,
                column: rule.column,
                value,
                rule: rule.type,
                message: rule.message || 'Validation failed'
              });
            }
          });
        });
        
        return { errors, isValid: errors.length === 0 };
      }
      
      // Validate single value
      function validateValue(value, rule) {
        switch (rule.type) {
          case 'required':
            return value != null && value !== '';
          case 'min_length':
            return String(value).length >= rule.length;
          case 'max_length':
            return String(value).length <= rule.length;
          case 'pattern':
            return new RegExp(rule.pattern).test(String(value));
          case 'range':
            const num = parseFloat(value);
            return num >= rule.min && num <= rule.max;
          case 'unique':
            // This would need to be handled with the full dataset
            return true;
          default:
            return true;
        }
      }
      
      // Export operation
      function performExport(data, options) {
        const { format, columns, includeHeaders } = options;
        
        switch (format) {
          case 'csv':
            return generateCSV(data, columns, includeHeaders);
          case 'json':
            return generateJSON(data, columns);
          case 'tsv':
            return generateTSV(data, columns, includeHeaders);
          default:
            return data;
        }
      }
      
      // Generate CSV
      function generateCSV(data, columns, includeHeaders) {
        let csv = '';
        
        if (includeHeaders) {
          csv += columns.map(col => col.title || col.key).join(',') + '\\n';
        }
        
        data.forEach(row => {
          const values = columns.map(col => {
            let value = row[col.dataIndex || col.key] || '';
            // Escape quotes and commas
            if (String(value).includes(',') || String(value).includes('"')) {
              value = '"' + String(value).replace(/"/g, '""') + '"';
            }
            return value;
          });
          csv += values.join(',') + '\\n';
        });
        
        return csv;
      }
      
      // Generate JSON
      function generateJSON(data, columns) {
        const exportData = data.map(row => {
          const exportRow = {};
          columns.forEach(col => {
            exportRow[col.title || col.key] = row[col.dataIndex || col.key];
          });
          return exportRow;
        });
        
        return JSON.stringify(exportData, null, 2);
      }
      
      // Generate TSV
      function generateTSV(data, columns, includeHeaders) {
        let tsv = '';
        
        if (includeHeaders) {
          tsv += columns.map(col => col.title || col.key).join('\\t') + '\\n';
        }
        
        data.forEach(row => {
          const values = columns.map(col => {
            return row[col.dataIndex || col.key] || '';
          });
          tsv += values.join('\\t') + '\\n';
        });
        
        return tsv;
      }
      
      // Calculation operation
      function performCalculation(data, options) {
        const { expressions } = options;
        const results = {};
        
        expressions.forEach(expr => {
          try {
            const values = data.map(row => parseFloat(row[expr.column])).filter(v => !isNaN(v));
            
            switch (expr.operation) {
              case 'sum':
                results[expr.name] = values.reduce((a, b) => a + b, 0);
                break;
              case 'average':
                results[expr.name] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
              case 'min':
                results[expr.name] = values.length ? Math.min(...values) : null;
                break;
              case 'max':
                results[expr.name] = values.length ? Math.max(...values) : null;
                break;
              case 'count':
                results[expr.name] = data.length;
                break;
              case 'median':
                const sorted = values.sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                results[expr.name] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                break;
            }
          } catch (error) {
            results[expr.name] = null;
          }
        });
        
        return results;
      }
    `;
  },

  /**
   * Execute task in worker
   * @param {string} operation - Operation type
   * @param {any} data - Data to process
   * @param {Object} options - Operation options
   * @returns {Promise} Task promise
   */
  executeTask(operation, data, options = {}) {
    return new Promise((resolve, reject) => {
      const taskId = `task-${++this.taskCounter}-${Date.now()}`;
      const startTime = Date.now();
      
      const task = {
        id: taskId,
        operation,
        data,
        options,
        startTime,
        resolve,
        reject
      };

      // Add to queue
      this.taskQueue.push(task);
      
      // Try to execute immediately
      this.processTaskQueue();
    });
  },

  /**
   * Process task queue
   */
  processTaskQueue() {
    if (this.taskQueue.length === 0) return;
    
    // Find available worker
    const availableWorker = this.workerPool.find(w => !w.busy && w.worker);
    if (!availableWorker) return;
    
    const task = this.taskQueue.shift();
    
    // Assign task to worker
    availableWorker.busy = true;
    availableWorker.currentTask = task;
    
    // Send task to worker
    availableWorker.worker.postMessage({
      taskId: task.id,
      operation: task.operation,
      data: task.data,
      options: task.options,
      startTime: task.startTime
    });
    
    // Set timeout for task
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(availableWorker, task);
    }, task.options.timeout || 30000);
    
    task.timeout = timeout;
    
    // Store task reference
    this.workers.set(task.id, {
      worker: availableWorker,
      task,
      timeout
    });
  },

  /**
   * Handle worker message
   * @param {Object} workerInfo - Worker info
   * @param {Event} event - Message event
   */
  handleWorkerMessage(workerInfo, event) {
    const { taskId, success, result, error, processingTime } = event.data;
    const taskRef = this.workers.get(taskId);
    
    if (!taskRef) return;
    
    const { task, timeout } = taskRef;
    
    // Clear timeout
    clearTimeout(timeout);
    
    // Free worker
    workerInfo.busy = false;
    workerInfo.currentTask = null;
    
    // Remove task reference
    this.workers.delete(taskId);
    
    // Resolve or reject promise
    if (success) {
      task.resolve({
        result,
        processingTime,
        taskId
      });
    } else {
      task.reject(new Error(error));
    }
    
    // Process next task in queue
    setTimeout(() => this.processTaskQueue(), 0);
  },

  /**
   * Handle worker error
   * @param {Object} workerInfo - Worker info
   * @param {Event} event - Error event
   */
  handleWorkerError(workerInfo, event) {
    console.error('Worker error:', event);
    
    if (workerInfo.currentTask) {
      const task = workerInfo.currentTask;
      task.reject(new Error('Worker error: ' + event.message));
      
      // Remove task reference
      this.workers.delete(task.id);
    }
    
    // Recreate worker
    this.recreateWorker(workerInfo);
  },

  /**
   * Handle task timeout
   * @param {Object} workerInfo - Worker info
   * @param {Object} task - Task object
   */
  handleTaskTimeout(workerInfo, task) {
    console.warn('Task timeout:', task.id);
    
    // Reject task
    task.reject(new Error('Task timeout'));
    
    // Remove task reference
    this.workers.delete(task.id);
    
    // Terminate and recreate worker
    this.recreateWorker(workerInfo);
  },

  /**
   * Recreate worker
   * @param {Object} workerInfo - Worker info to recreate
   */
  recreateWorker(workerInfo) {
    // Terminate existing worker
    if (workerInfo.worker) {
      workerInfo.worker.terminate();
    }
    
    // Remove from pool
    const index = this.workerPool.indexOf(workerInfo);
    if (index !== -1) {
      this.workerPool.splice(index, 1);
    }
    
    // Create new worker
    this.createWorker();
  },

  /**
   * Get worker pool status
   * @returns {Object} Pool status
   */
  getPoolStatus() {
    return {
      totalWorkers: this.workerPool.length,
      busyWorkers: this.workerPool.filter(w => w.busy).length,
      availableWorkers: this.workerPool.filter(w => !w.busy).length,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.workers.size
    };
  },

  /**
   * High-level API methods
   */

  /**
   * Filter data in background
   * @param {Array} data - Data to filter
   * @param {Object} filterOptions - Filter configuration
   * @returns {Promise<Array>} Filtered data
   */
  async filterData(data, filterOptions) {
    const result = await this.executeTask('filter', data, filterOptions);
    return result.result;
  },

  /**
   * Sort data in background
   * @param {Array} data - Data to sort
   * @param {Object} sortOptions - Sort configuration
   * @returns {Promise<Array>} Sorted data
   */
  async sortData(data, sortOptions) {
    const result = await this.executeTask('sort', data, sortOptions);
    return result.result;
  },

  /**
   * Search data in background
   * @param {Array} data - Data to search
   * @param {Object} searchOptions - Search configuration
   * @returns {Promise<Array>} Search results
   */
  async searchData(data, searchOptions) {
    const result = await this.executeTask('search', data, searchOptions);
    return result.result;
  },

  /**
   * Aggregate data in background
   * @param {Array} data - Data to aggregate
   * @param {Object} aggregateOptions - Aggregate configuration
   * @returns {Promise<Object>} Aggregated results
   */
  async aggregateData(data, aggregateOptions) {
    const result = await this.executeTask('aggregate', data, aggregateOptions);
    return result.result;
  },

  /**
   * Transform data in background
   * @param {Array} data - Data to transform
   * @param {Object} transformOptions - Transform configuration
   * @returns {Promise<Array>} Transformed data
   */
  async transformData(data, transformOptions) {
    const result = await this.executeTask('transform', data, transformOptions);
    return result.result;
  },

  /**
   * Validate data in background
   * @param {Array} data - Data to validate
   * @param {Object} validationOptions - Validation configuration
   * @returns {Promise<Object>} Validation results
   */
  async validateData(data, validationOptions) {
    const result = await this.executeTask('validate', data, validationOptions);
    return result.result;
  },

  /**
   * Export data in background
   * @param {Array} data - Data to export
   * @param {Object} exportOptions - Export configuration
   * @returns {Promise<string>} Exported data
   */
  async exportData(data, exportOptions) {
    const result = await this.executeTask('export', data, exportOptions);
    return result.result;
  },

  /**
   * Calculate statistics in background
   * @param {Array} data - Data to calculate
   * @param {Object} calcOptions - Calculation configuration
   * @returns {Promise<Object>} Calculation results
   */
  async calculateStats(data, calcOptions) {
    const result = await this.executeTask('calculate', data, calcOptions);
    return result.result;
  },

  /**
   * Batch process multiple operations
   * @param {Array} operations - Array of operations
   * @returns {Promise<Array>} Array of results
   */
  async batchProcess(operations) {
    const promises = operations.map(op => 
      this.executeTask(op.operation, op.data, op.options)
    );
    
    return Promise.all(promises);
  },

  /**
   * Create progress tracking for long operations
   * @param {string} operation - Operation type
   * @param {any} data - Data to process
   * @param {Object} options - Options including progress callback
   * @returns {Promise} Task promise with progress
   */
  async executeWithProgress(operation, data, options = {}) {
    // Split data into chunks for progress tracking
    const chunkSize = options.chunkSize || Math.ceil(data.length / 10);
    const chunks = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    const results = [];
    const progressCallback = options.onProgress || (() => {});
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await this.executeTask(operation, chunks[i], options);
      results.push(chunkResult.result);
      
      // Report progress
      progressCallback({
        completed: i + 1,
        total: chunks.length,
        percentage: Math.round(((i + 1) / chunks.length) * 100)
      });
    }
    
    // Combine results based on operation type
    return this.combineResults(operation, results);
  },

  /**
   * Combine results from multiple chunks
   * @param {string} operation - Operation type
   * @param {Array} results - Array of results
   * @returns {any} Combined result
   */
  combineResults(operation, results) {
    switch (operation) {
      case 'filter':
      case 'sort':
      case 'search':
      case 'transform':
        return results.flat();
      case 'aggregate':
      case 'calculate':
        // Merge objects
        return results.reduce((acc, result) => ({ ...acc, ...result }), {});
      case 'validate':
        // Combine validation results
        const allErrors = results.flatMap(r => r.errors || []);
        return {
          errors: allErrors,
          isValid: allErrors.length === 0
        };
      case 'export':
        return results.join('\\n');
      default:
        return results;
    }
  },

  /**
   * Cleanup WebWorker support
   */
  destroy() {
    // Clear task queue
    this.taskQueue.forEach(task => {
      task.reject(new Error('WebWorker system destroyed'));
    });
    this.taskQueue = [];
    
    // Clear active tasks
    this.workers.forEach(({ task, timeout }) => {
      clearTimeout(timeout);
      task.reject(new Error('WebWorker system destroyed'));
    });
    this.workers.clear();
    
    // Terminate all workers
    this.workerPool.forEach(workerInfo => {
      if (workerInfo.worker) {
        workerInfo.worker.terminate();
      }
    });
    this.workerPool = [];
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebWorkerSupport;
}

if (typeof window !== 'undefined') {
  window.WebWorkerSupport = WebWorkerSupport;
}