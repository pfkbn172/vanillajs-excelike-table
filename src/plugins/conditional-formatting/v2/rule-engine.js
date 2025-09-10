/**
 * Perfect Rule Engine for V2 Architecture
 * Column-based indexing with performance monitoring
 */

class OptimizedRuleEngine {
  constructor() {
    // Import dependencies
    const v2 = window.ConditionalFormattingV2;
    this.constants = v2;
    this.EvaluationError = v2.EvaluationError;
    this.PerformanceError = v2.PerformanceError;
    
    // Core storage
    this.rules = new Map();
    this.columnIndex = new Map(); // column -> Set of rule IDs
    this.priorityIndex = new Map(); // priority -> Set of rule IDs
    
    // Performance monitoring
    this.performanceStats = {
      totalEvaluations: 0,
      totalTime: 0,
      slowRules: new Map(),
      averageTime: 0
    };
    
    // Configuration
    this.config = {
      enablePerformanceMonitoring: true,
      maxRulesPerColumn: this.constants.PERFORMANCE_THRESHOLDS.MAX_RULES_PER_COLUMN,
      evaluationTimeout: this.constants.PERFORMANCE_THRESHOLDS.RULE_EVALUATION
    };
    
    // Event bus for notifications
    this.eventBus = null;
  }
  
  /**
   * Set event bus for notifications
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * Add rule with indexing
   */
  addRule(rule) {
    // Validate rule
    if (!rule || typeof rule.validate !== 'function') {
      throw new this.EvaluationError('Invalid rule object');
    }
    
    const validation = rule.validate();
    if (validation.length > 0) {
      throw new this.EvaluationError(`Rule validation failed: ${validation.join(', ')}`);
    }
    
    // Check column limits
    for (const column of rule.targetColumns) {
      const columnRules = this.columnIndex.get(column) || new Set();
      if (columnRules.size >= this.config.maxRulesPerColumn) {
        throw new this.EvaluationError(
          `Column ${column} already has maximum number of rules (${this.config.maxRulesPerColumn})`
        );
      }
    }
    
    // Store rule
    this.rules.set(rule.id, rule);
    
    // Update indexes
    this._addToIndexes(rule);
    
    // Emit event
    this._emitEvent(this.constants.EVENT_TYPES.RULE_ADDED, { rule });
    
    return rule.id;
  }
  
  /**
   * Remove rule and update indexes
   */
  removeRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }
    
    // Remove from storage
    this.rules.delete(ruleId);
    
    // Update indexes
    this._removeFromIndexes(rule);
    
    // Emit event
    this._emitEvent(this.constants.EVENT_TYPES.RULE_DELETED, { ruleId, rule });
    
    return true;
  }
  
  /**
   * Update rule (immutable)
   */
  updateRule(ruleId, updates) {
    const oldRule = this.rules.get(ruleId);
    if (!oldRule) {
      throw new this.EvaluationError(`Rule not found: ${ruleId}`);
    }
    
    // Create updated rule
    const newRule = oldRule.update(updates);
    
    // Remove old rule from indexes
    this._removeFromIndexes(oldRule);
    
    // Store new rule
    this.rules.set(ruleId, newRule);
    
    // Add to indexes
    this._addToIndexes(newRule);
    
    // Emit event
    this._emitEvent(this.constants.EVENT_TYPES.RULE_UPDATED, { 
      ruleId, 
      oldRule, 
      newRule 
    });
    
    return newRule;
  }
  
  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new this.EvaluationError(`Rule not found: ${ruleId}`);
    }
    
    if (rule.enabled === enabled) {
      return rule; // No change needed
    }
    
    const updatedRule = rule.setEnabled(enabled);
    this.rules.set(ruleId, updatedRule);
    
    // Emit event
    const eventType = enabled ? 
      this.constants.EVENT_TYPES.RULE_ENABLED : 
      this.constants.EVENT_TYPES.RULE_DISABLED;
    this._emitEvent(eventType, { ruleId, rule: updatedRule });
    
    return updatedRule;
  }
  
  /**
   * Get rules for specific column (optimized)
   */
  getRulesForColumn(columnKey) {
    const ruleIds = this.columnIndex.get(columnKey) || new Set();
    return Array.from(ruleIds)
      .map(id => this.rules.get(id))
      .filter(rule => rule && rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Evaluate cell with performance monitoring
   */
  evaluateCell(cellValue, rowData, rowIndex, columnIndex, columnKey) {
    const startTime = performance.now();
    
    try {
      const results = this._evaluateCellInternal(
        cellValue, rowData, rowIndex, columnIndex, columnKey
      );
      
      // Performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        const duration = performance.now() - startTime;
        this._recordPerformance(duration);
        
        if (duration > this.config.evaluationTimeout) {
          this._emitEvent(this.constants.EVENT_TYPES.PERFORMANCE_WARNING, {
            operation: 'cell_evaluation',
            duration,
            threshold: this.config.evaluationTimeout,
            columnKey,
            rowIndex
          });
        }
      }
      
      return results;
      
    } catch (error) {
      this._emitEvent(this.constants.EVENT_TYPES.ERROR_OCCURRED, {
        operation: 'cell_evaluation',
        error: error.message,
        columnKey,
        rowIndex
      });
      throw error;
    }
  }
  
  /**
   * Internal cell evaluation
   */
  _evaluateCellInternal(cellValue, rowData, rowIndex, columnIndex, columnKey) {
    // Get applicable rules for this column
    const applicableRules = this.getRulesForColumn(columnKey);
    
    if (applicableRules.length === 0) {
      return [];
    }
    
    const matchingRules = [];
    
    for (const rule of applicableRules) {
      try {
        const matches = this._evaluateRule(rule, cellValue, rowData, rowIndex, columnIndex, columnKey);
        
        if (matches) {
          matchingRules.push({
            rule,
            format: rule.format,
            priority: rule.priority
          });
          
          // Stop if this rule has stopIfTrue set
          if (rule.stopIfTrue) {
            break;
          }
        }
      } catch (error) {
        this._emitEvent(this.constants.EVENT_TYPES.ERROR_OCCURRED, {
          operation: 'rule_evaluation',
          ruleId: rule.id,
          error: error.message
        });
        // Continue with other rules
      }
    }
    
    return matchingRules;
  }
  
  /**
   * Evaluate single rule
   */
  _evaluateRule(rule, cellValue, rowData, rowIndex, columnIndex, columnKey) {
    if (rule.isSimple()) {
      return this._evaluateSimpleRule(rule, cellValue, rowData);
    } else if (rule.isCombined()) {
      return this._evaluateCombinedRule(rule, rowData);
    }
    
    throw new this.EvaluationError(`Unsupported rule type: ${rule.type}`);
  }
  
  /**
   * Evaluate simple rule (single condition)
   */
  _evaluateSimpleRule(rule, cellValue, rowData) {
    const condition = rule.getCondition(0);
    const targetValue = rowData[condition.column];
    
    return this._evaluateCondition(condition, targetValue);
  }
  
  /**
   * Evaluate combined rule (multiple conditions)
   */
  _evaluateCombinedRule(rule, rowData) {
    const results = rule.conditions.map(condition => {
      const targetValue = rowData[condition.column];
      return this._evaluateCondition(condition, targetValue);
    });
    
    // Apply logical operator
    if (rule.logicalOperator === this.constants.LOGICAL_OPERATORS.AND) {
      return results.every(result => result === true);
    } else if (rule.logicalOperator === this.constants.LOGICAL_OPERATORS.OR) {
      return results.some(result => result === true);
    }
    
    throw new this.EvaluationError(`Unsupported logical operator: ${rule.logicalOperator}`);
  }
  
  /**
   * Evaluate single condition
   */
  _evaluateCondition(condition, value) {
    const convertedValue = this._convertValue(value, condition.dataType);
    const convertedValue2 = this._convertValue(condition.value, condition.dataType);
    const convertedValue3 = this._convertValue(condition.value2, condition.dataType);
    
    switch (condition.operator) {
      case this.constants.OPERATORS.EQUALS:
        return convertedValue === convertedValue2;
        
      case this.constants.OPERATORS.NOT_EQUALS:
        return convertedValue !== convertedValue2;
        
      case this.constants.OPERATORS.GREATER_THAN:
        return convertedValue > convertedValue2;
        
      case this.constants.OPERATORS.GREATER_THAN_OR_EQUAL:
        return convertedValue >= convertedValue2;
        
      case this.constants.OPERATORS.LESS_THAN:
        return convertedValue < convertedValue2;
        
      case this.constants.OPERATORS.LESS_THAN_OR_EQUAL:
        return convertedValue <= convertedValue2;
        
      case this.constants.OPERATORS.CONTAINS:
        return String(convertedValue).toLowerCase().includes(String(convertedValue2).toLowerCase());
        
      case this.constants.OPERATORS.NOT_CONTAINS:
        return !String(convertedValue).toLowerCase().includes(String(convertedValue2).toLowerCase());
        
      case this.constants.OPERATORS.STARTS_WITH:
        return String(convertedValue).toLowerCase().startsWith(String(convertedValue2).toLowerCase());
        
      case this.constants.OPERATORS.ENDS_WITH:
        return String(convertedValue).toLowerCase().endsWith(String(convertedValue2).toLowerCase());
        
      case this.constants.OPERATORS.IS_EMPTY:
        return value === null || value === undefined || value === '';
        
      case this.constants.OPERATORS.IS_NOT_EMPTY:
        return value !== null && value !== undefined && value !== '';
        
      case this.constants.OPERATORS.BETWEEN:
        return convertedValue >= convertedValue2 && convertedValue <= convertedValue3;
        
      case this.constants.OPERATORS.NOT_BETWEEN:
        return convertedValue < convertedValue2 || convertedValue > convertedValue3;
        
      default:
        throw new this.EvaluationError(`Unsupported operator: ${condition.operator}`);
    }
  }
  
  /**
   * Convert value to specified data type
   */
  _convertValue(value, dataType) {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (dataType) {
      case this.constants.DATA_TYPES.NUMBER:
        const cleanValue = String(value).trim()
          .replace(/[¥,$円]/g, '')
          .replace(/,/g, '');
        const num = parseFloat(cleanValue);
        return isNaN(num) ? 0 : num;
        
      case this.constants.DATA_TYPES.DATE:
        if (value instanceof Date) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date(0) : date;
        
      case this.constants.DATA_TYPES.BOOLEAN:
        if (typeof value === 'boolean') return value;
        return Boolean(value);
        
      case this.constants.DATA_TYPES.TEXT:
      default:
        return String(value);
    }
  }
  
  /**
   * Add rule to indexes
   */
  _addToIndexes(rule) {
    // Column index
    for (const column of rule.targetColumns) {
      if (!this.columnIndex.has(column)) {
        this.columnIndex.set(column, new Set());
      }
      this.columnIndex.get(column).add(rule.id);
    }
    
    // Priority index
    if (!this.priorityIndex.has(rule.priority)) {
      this.priorityIndex.set(rule.priority, new Set());
    }
    this.priorityIndex.get(rule.priority).add(rule.id);
  }
  
  /**
   * Remove rule from indexes
   */
  _removeFromIndexes(rule) {
    // Column index
    for (const column of rule.targetColumns) {
      const columnRules = this.columnIndex.get(column);
      if (columnRules) {
        columnRules.delete(rule.id);
        if (columnRules.size === 0) {
          this.columnIndex.delete(column);
        }
      }
    }
    
    // Priority index
    const priorityRules = this.priorityIndex.get(rule.priority);
    if (priorityRules) {
      priorityRules.delete(rule.id);
      if (priorityRules.size === 0) {
        this.priorityIndex.delete(rule.priority);
      }
    }
  }
  
  /**
   * Record performance metrics
   */
  _recordPerformance(duration) {
    this.performanceStats.totalEvaluations++;
    this.performanceStats.totalTime += duration;
    this.performanceStats.averageTime = 
      this.performanceStats.totalTime / this.performanceStats.totalEvaluations;
  }
  
  /**
   * Emit event through event bus
   */
  _emitEvent(eventType, data) {
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit(eventType, data);
    }
  }
  
  /**
   * Get all rules
   */
  getAllRules() {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get rule by ID
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }
  
  /**
   * Clear all rules
   */
  clear() {
    this.rules.clear();
    this.columnIndex.clear();
    this.priorityIndex.clear();
    this.performanceStats = {
      totalEvaluations: 0,
      totalTime: 0,
      slowRules: new Map(),
      averageTime: 0
    };
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      rulesCount: this.rules.size,
      enabledRulesCount: this.getAllRules().length,
      columnIndexSize: this.columnIndex.size,
      averageRulesPerColumn: this.columnIndex.size > 0 ? 
        Array.from(this.columnIndex.values()).reduce((sum, set) => sum + set.size, 0) / this.columnIndex.size : 0
    };
  }
  
  /**
   * Export rules as JSON
   */
  exportRules() {
    return Array.from(this.rules.values()).map(rule => rule.toJSON());
  }
  
  /**
   * Import rules from JSON
   */
  importRules(rulesData) {
    const importedRules = [];
    const errors = [];
    
    for (const ruleData of rulesData) {
      try {
        const rule = this.constants.Rule.fromJSON(ruleData);
        this.addRule(rule);
        importedRules.push(rule);
      } catch (error) {
        errors.push({
          ruleData,
          error: error.message
        });
      }
    }
    
    return {
      imported: importedRules,
      errors
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizedRuleEngine;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.RuleEngine = OptimizedRuleEngine;
}