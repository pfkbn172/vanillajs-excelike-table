/**
 * Conditional Formatting Rule Engine
 * Evaluates conditions and determines which rules apply to data
 */

// Import types if available
function getConditionalFormattingTypes() {
  if (typeof window !== 'undefined' && window.ConditionalFormattingTypes) {
    return window.ConditionalFormattingTypes;
  } else if (typeof require !== 'undefined') {
    try {
      return require('./types');
    } catch (e) {
      return null;
    }
  }
  return null;
}

class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.evaluationCache = new Map();
    this.cacheEnabled = true;
    this.maxCacheSize = 1000;
  }
  
  /**
   * Add a rule to the engine
   * @param {ConditionalFormattingRule} rule - Rule to add
   */
  addRule(rule) {
    console.log('🚀 === RULE ENGINE ADD RULE ===');
    console.log('Rule ID:', rule.id);
    console.log('Rule Name:', rule.name);
    console.log('Rule being added to engine:', rule);
    console.log('Rule conditionType:', rule.conditionType);
    console.log('Rule conditions:', rule.conditions);
    console.log('Rule multipleConditions:', rule.multipleConditions);
    console.log('Rule logicalOperator:', rule.logicalOperator);
    console.log('Rule targetColumns:', rule.targetColumns);
    console.log('===================================');
    
    if (typeof rule?.validate !== 'function') {
      throw new Error('Rule object must have a validate method');
    }
    
    const validation = rule.validate();
    
    if (validation.length > 0) {
      throw new Error(`Invalid rule: ${validation.join(', ')}`);
    }
    
    this.rules.set(rule.id, rule);
    this.clearCache();
  }
  
  /**
   * Remove a rule from the engine
   * @param {string} ruleId - ID of rule to remove
   */
  removeRule(ruleId) {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.clearCache();
    }
    return removed;
  }
  
  /**
   * Update an existing rule
   * @param {string} ruleId - ID of rule to update
   * @param {Object} updates - Properties to update
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }
    
    Object.assign(rule, updates);
    rule.updatedAt = new Date();
    
    const validation = rule.validate();
    if (validation.length > 0) {
      throw new Error(`Invalid rule updates: ${validation.join(', ')}`);
    }
    
    this.clearCache();
  }
  
  /**
   * Get all rules sorted by priority
   * @returns {Array} Array of rules
   */
  getAllRules() {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Evaluate all rules for a specific cell
   * @param {Object} cellData - Cell data to evaluate
   * @param {Object} rowData - Complete row data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   * @param {string} columnKey - Column key
   * @returns {Array} Array of matching rules with their formats
   */
  evaluateCell(cellData, rowData, rowIndex, columnIndex, columnKey) {
    const cacheKey = this.getCacheKey('cell', cellData, rowData, rowIndex, columnIndex, columnKey);
    
    if (this.cacheEnabled && this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey);
    }
    
    const matchingRules = [];
    const allRules = this.getAllRules();
    
    // **PERFORMANCE OPTIMIZATION**: Filter rules by target column FIRST
    const applicableRules = allRules.filter(rule => this.doesRuleApplyToColumn(rule, columnKey, columnIndex));
    
    // Removed verbose cell evaluation logs for cleaner output
    
    if (applicableRules.length === 0) {
      return [];
    }
    
    for (const rule of applicableRules) {
      // Removed repetitive logs for cleaner output
      
      try {
        const matches = this.evaluateCondition(rule, cellData, rowData, rowIndex, columnIndex, columnKey);
        
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
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
    
    // Cache result
    if (this.cacheEnabled) {
      this.setCacheValue(cacheKey, matchingRules);
    }
    
    return matchingRules;
  }
  
  /**
   * Check if a rule applies to a specific column
   * @param {ConditionalFormattingRule} rule - Rule to check
   * @param {string} columnKey - Column key
   * @param {number} columnIndex - Column index
   * @returns {boolean} Whether rule applies
   */
  doesRuleApplyToColumn(rule, columnKey, columnIndex) {
    if (!rule.targetColumns || rule.targetColumns.length === 0) {
      return false;
    }
    
    const applies = rule.targetColumns.some(target => {
      // Support both column keys and indices
      const match = target === columnKey || target === columnIndex || target === columnIndex.toString();
      return match;
    });
    
    // Column targeting check for complex rules
    
    return applies;
  }
  
  /**
   * Evaluate a single condition
   * @param {ConditionalFormattingRule} rule - Rule to evaluate
   * @param {*} cellValue - Cell value
   * @param {Object} rowData - Row data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   * @param {string} columnKey - Column key
   * @returns {boolean} Whether condition matches
   */
  evaluateCondition(rule, cellValue, rowData, rowIndex, columnIndex, columnKey) {
    const ConditionalFormattingTypes = getConditionalFormattingTypes();
    const { CONDITION_TYPES, OPERATORS } = ConditionalFormattingTypes || {};
    
    if (!CONDITION_TYPES || !OPERATORS) {
      console.error('ConditionalFormattingTypes not available');
      return false;
    }
    
    // Use enhanced format types directly
    switch (rule.conditionType) {
      case 'simple':
      case CONDITION_TYPES?.SIMPLE:
        return this.evaluateSingleColumnCondition(rule, cellValue);
        
      case 'combined':
      case CONDITION_TYPES?.COMBINED:
        return this.evaluateMultipleColumnsCondition(rule, rowData);
        
        
      case 'formula':
      case CONDITION_TYPES?.FORMULA:
        return this.evaluateFormulaCondition(rule, cellValue, rowData, rowIndex, columnIndex);
        
      default:
        console.error(`Unknown condition type: ${rule.conditionType}`);
        return false;
    }
  }
  
  /**
   * Evaluate single column condition
   * @param {ConditionalFormattingRule} rule - Rule
   * @param {*} cellValue - Cell value
   * @returns {boolean} Match result
   */
  evaluateSingleColumnCondition(rule, cellValue) {
    return this.compareValues(rule.operator, cellValue, rule.value, rule.value2, rule.dataType);
  }
  
  /**
   * Evaluate multiple columns condition
   * @param {ConditionalFormattingRule} rule - Rule
   * @param {Object} rowData - Row data
   * @returns {boolean} Match result
   */
  evaluateMultipleColumnsCondition(rule, rowData) {
    // Multiple columns condition evaluation
    
    const ConditionalFormattingTypes = getConditionalFormattingTypes();
    const { LOGICAL_OPERATORS } = ConditionalFormattingTypes || {};
    
    // Check if rule has multiple conditions defined
    const conditions = rule.conditions || rule.multipleConditions || []; // 統一された条件アクセス
    
    if (conditions.length > 1) {
      // Processing multiple conditions
      // Evaluate complex multiple conditions
      const results = conditions.map((condition, index) => {
        const columnValue = rowData[condition.column];
        const result = this.compareValues(
          condition.operator, 
          columnValue, 
          condition.value, 
          condition.value2, 
          condition.dataType
        );
        
        // Log condition evaluation for debugging if needed
        
        return result;
      });
      
      
      // Apply logical operator
      let finalResult;
      if (rule.logicalOperator === 'and' || rule.logicalOperator === LOGICAL_OPERATORS?.AND?.value) {
        finalResult = results.every(result => result === true);
      } else {
        // Default to OR for any other value including 'or'
        finalResult = results.some(result => result === true);
      }
      return finalResult;
    } else {
      // Fallback to simple OR evaluation for backward compatibility
      for (const columnKey of rule.targetColumns) {
        const value = rowData[columnKey];
        if (this.compareValues(rule.operator, value, rule.value, rule.value2, rule.dataType)) {
          return true;
        }
      }
      return false;
    }
  }
  
  /**
   * Evaluate row-based condition
   * @param {ConditionalFormattingRule} rule - Rule
   * @param {Object} rowData - Row data
   * @param {number} rowIndex - Row index
   * @returns {boolean} Match result
   */
  evaluateRowBasedCondition(rule, rowData, rowIndex) {
    // Row-based conditions can use special variables
    const context = {
      row: rowData,
      rowIndex: rowIndex,
      ...rowData // Allow direct access to column values
    };
    
    // Simple evaluation - check if any value in the row matches
    const values = Object.values(rowData);
    for (const value of values) {
      if (this.compareValues(rule.operator, value, rule.value, rule.value2, rule.dataType)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Evaluate formula-based condition
   * @param {ConditionalFormattingRule} rule - Rule
   * @param {*} cellValue - Cell value
   * @param {Object} rowData - Row data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   * @returns {boolean} Match result
   */
  evaluateFormulaCondition(rule, cellValue, rowData, rowIndex, columnIndex) {
    if (!rule.formula || typeof rule.formula !== 'string') {
      return false;
    }
    
    try {
      // Create a safe evaluation context
      const context = {
        value: cellValue,
        row: rowData,
        rowIndex: rowIndex,
        columnIndex: columnIndex,
        // Math functions
        Math: Math,
        // Safe string methods
        String: String,
        Number: Number,
        Boolean: Boolean,
        // Utility functions
        isEmpty: (val) => val === null || val === undefined || val === '',
        isNumber: (val) => typeof val === 'number' && !isNaN(val),
        isDate: (val) => val instanceof Date || !isNaN(Date.parse(val)),
        contains: (str, substr) => String(str).toLowerCase().includes(String(substr).toLowerCase())
      };
      
      // Simple formula evaluation (basic implementation)
      // In production, you might want to use a proper formula parser
      return this.evaluateFormula(rule.formula, context);
    } catch (error) {
      console.error(`Error evaluating formula: ${rule.formula}`, error);
      return false;
    }
  }
  
  /**
   * Compare two values using an operator
   * @param {string} operator - Comparison operator
   * @param {*} value1 - First value
   * @param {*} value2 - Second value
   * @param {*} value3 - Third value (for BETWEEN)
   * @param {string} dataType - Expected data type
   * @returns {boolean} Comparison result
   */
  compareValues(operator, value1, value2, value3, dataType) {
    const ConditionalFormattingTypes = getConditionalFormattingTypes();
    const { OPERATORS, DATA_TYPES } = ConditionalFormattingTypes || {};
    
    if (!OPERATORS) return false;
    
    // Convert values based on data type
    const convertedValue1 = this.convertValue(value1, dataType);
    const convertedValue2 = this.convertValue(value2, dataType);
    const convertedValue3 = this.convertValue(value3, dataType);
    
    switch (operator) {
      case OPERATORS.EQUALS:
        return convertedValue1 === convertedValue2;
        
      case OPERATORS.NOT_EQUALS:
        return convertedValue1 !== convertedValue2;
        
      case OPERATORS.GREATER_THAN:
        return convertedValue1 > convertedValue2;
        
      case OPERATORS.GREATER_THAN_OR_EQUAL:
        return convertedValue1 >= convertedValue2;
        
      case OPERATORS.LESS_THAN:
        return convertedValue1 < convertedValue2;
        
      case OPERATORS.LESS_THAN_OR_EQUAL:
        return convertedValue1 <= convertedValue2;
        
      case OPERATORS.CONTAINS:
        return String(convertedValue1).toLowerCase().includes(String(convertedValue2).toLowerCase());
        
      case OPERATORS.NOT_CONTAINS:
        return !String(convertedValue1).toLowerCase().includes(String(convertedValue2).toLowerCase());
        
      case OPERATORS.STARTS_WITH:
        return String(convertedValue1).toLowerCase().startsWith(String(convertedValue2).toLowerCase());
        
      case OPERATORS.ENDS_WITH:
        return String(convertedValue1).toLowerCase().endsWith(String(convertedValue2).toLowerCase());
        
      case OPERATORS.IS_EMPTY:
        return value1 === null || value1 === undefined || value1 === '';
        
      case OPERATORS.IS_NOT_EMPTY:
        return value1 !== null && value1 !== undefined && value1 !== '';
        
      case OPERATORS.IS_NUMBER:
        return typeof convertedValue1 === 'number' && !isNaN(convertedValue1);
        
      case OPERATORS.IS_DATE:
        return convertedValue1 instanceof Date || !isNaN(Date.parse(value1));
        
      case OPERATORS.BETWEEN:
        return convertedValue1 >= convertedValue2 && convertedValue1 <= convertedValue3;
        
      case OPERATORS.NOT_BETWEEN:
        return convertedValue1 < convertedValue2 || convertedValue1 > convertedValue3;
        
      default:
        console.error(`Unknown operator: ${operator}`);
        return false;
    }
  }
  
  /**
   * Convert value to specified data type
   * @param {*} value - Value to convert
   * @param {string} dataType - Target data type
   * @returns {*} Converted value
   */
  convertValue(value, dataType) {
    const ConditionalFormattingTypes = getConditionalFormattingTypes();
    const { DATA_TYPES } = ConditionalFormattingTypes || {};
    
    if (!DATA_TYPES) return value;
    
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (dataType) {
      case DATA_TYPES.NUMBER:
        // Clean up the value for parsing: remove currency symbols, commas, etc.
        let cleanValue = String(value).trim();
        cleanValue = cleanValue.replace(/[¥,$円]/g, ''); // Remove ¥, $, commas, 円
        cleanValue = cleanValue.replace(/,/g, ''); // Remove remaining commas
        const num = parseFloat(cleanValue);
        
        
        return isNaN(num) ? 0 : num;
        
      case DATA_TYPES.DATE:
        if (value instanceof Date) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date(0) : date;
        
      case DATA_TYPES.BOOLEAN:
        if (typeof value === 'boolean') return value;
        return Boolean(value);
        
      case DATA_TYPES.TEXT:
      default:
        return String(value);
    }
  }
  
  /**
   * Evaluate a simple formula
   * @param {string} formula - Formula string
   * @param {Object} context - Evaluation context
   * @returns {boolean} Formula result
   */
  evaluateFormula(formula, context) {
    // This is a very basic implementation
    // In production, you'd want to use a proper formula parser
    
    // Replace context variables in formula
    let processedFormula = formula;
    
    // Replace common patterns
    processedFormula = processedFormula
      .replace(/\bvalue\b/g, context.value !== undefined ? JSON.stringify(context.value) : 'null')
      .replace(/\browIndex\b/g, context.rowIndex)
      .replace(/\bcolumnIndex\b/g, context.columnIndex);
    
    // Replace row data access (e.g., row.name, row['price'])
    Object.keys(context.row).forEach(key => {
      const regex = new RegExp(`\\brow\\.${key}\\b|\\brow\\['${key}'\\]`, 'g');
      const value = context.row[key];
      processedFormula = processedFormula.replace(regex, JSON.stringify(value));
    });
    
    try {
      // Use Function constructor for safer evaluation than eval
      const func = new Function(...Object.keys(context), `return ${processedFormula}`);
      const result = func(...Object.values(context));
      return Boolean(result);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return false;
    }
  }
  
  /**
   * Generate cache key
   */
  getCacheKey(...args) {
    return JSON.stringify(args);
  }
  
  /**
   * Set cache value
   */
  setCacheValue(key, value) {
    if (this.evaluationCache.size >= this.maxCacheSize) {
      // Remove oldest entries
      const oldestKey = this.evaluationCache.keys().next().value;
      this.evaluationCache.delete(oldestKey);
    }
    this.evaluationCache.set(key, value);
  }
  
  /**
   * Clear evaluation cache
   */
  clearCache() {
    this.evaluationCache.clear();
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
   * Get rule statistics
   */
  getStatistics() {
    const rules = Array.from(this.rules.values());
    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      disabledRules: rules.filter(r => !r.enabled).length,
      cacheSize: this.evaluationCache.size,
      cacheEnabled: this.cacheEnabled
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingRuleEngine = RuleEngine;
}