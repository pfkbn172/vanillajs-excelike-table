/**
 * Enhanced Rule Engine for New Conditional Formatting Architecture
 * Supports complex logical operations (AND, OR, XOR, NAND, NOR) and improved rule evaluation
 */

class EnhancedConditionalFormattingRuleEngine {
  constructor() {
    this.rules = [];
    this.types = this.getTypes();
    this.evaluationCache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }
  
  /**
   * Get types from global or require
   */
  getTypes() {
    if (typeof window !== 'undefined' && window.ConditionalFormattingTypes) {
      return window.ConditionalFormattingTypes;
    }
    
    try {
      return require('./types');
    } catch (e) {
      console.error('Failed to load conditional formatting types:', e);
      return {};
    }
  }
  
  /**
   * Add a new rule
   */
  addRule(rule) {
    
    // Convert to enhanced rule if needed
    const enhancedRule = this.ensureEnhancedRule(rule);
    
    // Validate rule
    const validation = enhancedRule.validate();
    if (!validation.valid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }
    
    // Remove existing rule with same ID
    this.removeRule(enhancedRule.id);
    
    // Add new rule
    this.rules.push(enhancedRule);
    
    // Clear cache
    this.clearCache();
    
    return enhancedRule;
  }
  
  /**
   * Remove a rule by ID
   */
  removeRule(ruleId) {
    
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    const removed = this.rules.length < initialLength;
    
    if (removed) {
      this.clearCache();
    } else {
    }
    
    return removed;
  }
  
  /**
   * Update an existing rule
   */
  updateRule(ruleId, updates) {
    
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }
    
    // Apply updates
    Object.assign(rule, updates);
    
    // Validate updated rule
    const validation = rule.validate();
    if (!validation.valid) {
      throw new Error(`Invalid rule after update: ${validation.errors.join(', ')}`);
    }
    
    this.clearCache();
    
    return rule;
  }
  
  /**
   * Get all rules
   */
  getAllRules() {
    return [...this.rules];
  }
  
  /**
   * Get rules by condition type
   */
  getRulesByType(conditionType) {
    return this.rules.filter(rule => rule.conditionType === conditionType);
  }
  
  /**
   * Get rules by target scope
   */
  getRulesByScope(targetScope) {
    return this.rules.filter(rule => rule.targetScope === targetScope);
  }
  
  /**
   * Evaluate all rules for a cell
   */
  evaluateCell(cellValue, rowData, rowIndex, columnIndex, columnKey) {
    const cacheKey = `${rowIndex}-${columnIndex}-${JSON.stringify(cellValue)}`;
    
    // Check cache first
    if (this.evaluationCache.has(cacheKey)) {
      const cached = this.evaluationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
    }
    
    
    const matchingRules = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const matches = this.evaluateRuleForCell(rule, cellValue, rowData, rowIndex, columnIndex, columnKey);
        if (matches) {
          matchingRules.push({
            rule,
            format: rule.format,
            priority: rule.priority
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
    
    // Sort by priority (higher priority first)
    matchingRules.sort((a, b) => b.priority - a.priority);
    
    // Cache result
    this.evaluationCache.set(cacheKey, {
      result: matchingRules,
      timestamp: Date.now()
    });
    
    
    return matchingRules;
  }
  
  /**
   * Evaluate a specific rule for a cell
   */
  evaluateRuleForCell(rule, cellValue, rowData, rowIndex, columnIndex, columnKey) {
    // Check if this rule applies to this column/cell
    if (!this.isRuleApplicableToCell(rule, columnKey, rowIndex, columnIndex)) {
      return false;
    }
    
    switch (rule.conditionType) {
      case 'simple':
        return this.evaluateSimpleCondition(rule, cellValue, rowData, columnKey);
        
      case 'combined':
        return this.evaluateCombinedConditions(rule, cellValue, rowData, columnKey);
        
      case 'formula':
        return this.evaluateFormulaCondition(rule, cellValue, rowData, columnKey);
        
      default:
        return false;
    }
  }
  
  /**
   * Check if rule is applicable to specific cell
   */
  isRuleApplicableToCell(rule, columnKey, rowIndex, columnIndex) {
    // Check target columns
    if (rule.targetColumns && rule.targetColumns.length > 0) {
      return rule.targetColumns.includes(columnKey);
    }
    
    return true;
  }
  
  /**
   * Evaluate simple condition
   */
  evaluateSimpleCondition(rule, cellValue, rowData, columnKey) {
    if (!rule.conditions || rule.conditions.length === 0) {
      return false;
    }
    
    const condition = rule.conditions[0];
    const conditionValue = this.getConditionValue(condition, rowData);
    
    
    return this.evaluateConditionOperator(conditionValue, condition.operator, condition.value);
  }
  
  /**
   * Evaluate combined conditions with logical operators
   */
  evaluateCombinedConditions(rule, cellValue, rowData, columnKey) {
    if (!rule.conditions || rule.conditions.length === 0) {
      return false;
    }
    
    
    // Evaluate each condition
    const conditionResults = rule.conditions.map((condition, index) => {
      const conditionValue = this.getConditionValue(condition, rowData);
      const result = this.evaluateConditionOperator(conditionValue, condition.operator, condition.value);
      
      
      return result;
    });
    
    // Apply logical operator
    const finalResult = this.types.LogicalEvaluator?.evaluate(conditionResults, rule.logicalOperator) || 
                       this.evaluateLogicalOperator(conditionResults, rule.logicalOperator);
    
    
    return finalResult;
  }
  
  /**
   * Evaluate formula condition
   */
  evaluateFormulaCondition(rule, cellValue, rowData, columnKey) {
    if (!rule.conditions || rule.conditions.length === 0 || !rule.conditions[0].formula) {
      return false;
    }
    
    const formula = rule.conditions[0].formula;
    
    try {
      // Simple formula evaluation (can be extended)
      const result = this.evaluateFormula(formula, cellValue, rowData);
      return result;
    } catch (error) {
      console.error(`Error evaluating formula: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get condition value (from specified column or current cell)
   */
  getConditionValue(condition, rowData) {
    if (condition.column && rowData[condition.column] !== undefined) {
      return rowData[condition.column];
    }
    
    // If no column specified or column not found, return the current cell value
    // This will be passed from the evaluation context
    return condition.value; // Fallback - this should be improved
  }
  
  /**
   * Evaluate condition operator
   */
  evaluateConditionOperator(actualValue, operator, expectedValue) {
    // Normalize values
    const actual = this.normalizeValue(actualValue);
    const expected = this.normalizeValue(expectedValue);
    
    switch (operator) {
      case 'equals':
        return actual === expected;
        
      case 'notEquals':
        return actual !== expected;
        
      case 'greaterThan':
        return this.isNumeric(actual) && this.isNumeric(expected) && 
               parseFloat(actual) > parseFloat(expected);
               
      case 'greaterThanOrEqual':
        return this.isNumeric(actual) && this.isNumeric(expected) && 
               parseFloat(actual) >= parseFloat(expected);
               
      case 'lessThan':
        return this.isNumeric(actual) && this.isNumeric(expected) && 
               parseFloat(actual) < parseFloat(expected);
               
      case 'lessThanOrEqual':
        return this.isNumeric(actual) && this.isNumeric(expected) && 
               parseFloat(actual) <= parseFloat(expected);
               
      case 'contains':
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());
        
      case 'notContains':
        return !String(actual).toLowerCase().includes(String(expected).toLowerCase());
        
      case 'startsWith':
        return String(actual).toLowerCase().startsWith(String(expected).toLowerCase());
        
      case 'endsWith':
        return String(actual).toLowerCase().endsWith(String(expected).toLowerCase());
        
      case 'isEmpty':
        return actual === '' || actual === null || actual === undefined;
        
      case 'isNotEmpty':
        return actual !== '' && actual !== null && actual !== undefined;
        
      case 'isNumber':
        return this.isNumeric(actual);
        
      case 'between':
        // Expected value should be array [min, max]
        if (Array.isArray(expected) && expected.length === 2) {
          const val = parseFloat(actual);
          return val >= parseFloat(expected[0]) && val <= parseFloat(expected[1]);
        }
        return false;
        
      default:
        return false;
    }
  }
  
  /**
   * Evaluate logical operator (fallback if LogicalEvaluator not available)
   */
  evaluateLogicalOperator(results, operator) {
    if (!Array.isArray(results) || results.length === 0) {
      return false;
    }
    
    if (results.length === 1) {
      return results[0];
    }
    
    switch (operator) {
      case 'and':
        return results.every(result => result === true);
        
      case 'or':
        return results.some(result => result === true);
        
      case 'xor':
        const trueCount = results.filter(result => result === true).length;
        return trueCount === 1;
        
      case 'nand':
        return !results.every(result => result === true);
        
      case 'nor':
        return !results.some(result => result === true);
        
      default:
        return results.every(result => result === true);
    }
  }
  
  /**
   * Simple formula evaluation (can be extended with a proper expression parser)
   */
  evaluateFormula(formula, cellValue, rowData) {
    // This is a basic implementation - can be extended with a proper formula parser
    // For now, support basic operations and simple functions
    
    // Replace column names with actual values
    let processedFormula = formula;
    
    // Replace column references
    Object.keys(rowData).forEach(column => {
      const regex = new RegExp(`\\b${column}\\b`, 'g');
      processedFormula = processedFormula.replace(regex, String(rowData[column] || 0));
    });
    
    // Replace simple functions
    processedFormula = processedFormula.replace(/TODAY\(\)/g, new Date().toISOString().split('T')[0]);
    
    try {
      // WARNING: Using eval is dangerous in production - should use a proper expression parser
      // This is for demonstration only
      return eval(processedFormula);
    } catch (error) {
      console.error(`Formula evaluation error: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Normalize value for comparison
   */
  normalizeValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    return String(value).trim();
  }
  
  /**
   * Check if value is numeric
   */
  isNumeric(value) {
    if (typeof value === 'number') {
      return !isNaN(value) && isFinite(value);
    }
    
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^\d.-]/g, ''));
      return !isNaN(num) && isFinite(num);
    }
    
    return false;
  }
  
  /**
   * Ensure rule is in enhanced format
   */
  ensureEnhancedRule(rule) {
    if (rule instanceof this.types.EnhancedConditionalFormattingRule) {
      return rule;
    }
    
    
    // Create new enhanced rule
    return new this.types.EnhancedConditionalFormattingRule(rule);
  }
  
  
  /**
   * Clear evaluation cache
   */
  clearCache() {
    this.evaluationCache.clear();
  }
  
  /**
   * Get engine statistics
   */
  getStatistics() {
    return {
      totalRules: this.rules.length,
      rulesByType: {
        simple: this.getRulesByType('simple').length,
        combined: this.getRulesByType('combined').length,
        formula: this.getRulesByType('formula').length
      },
      rulesByScope: {
        cell: this.getRulesByScope('cell').length,
        row: this.getRulesByScope('row').length
      },
      cacheSize: this.evaluationCache.size,
      enabledRules: this.rules.filter(r => r.enabled).length
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedConditionalFormattingRuleEngine;
}

if (typeof window !== 'undefined') {
  window.EnhancedConditionalFormattingRuleEngine = EnhancedConditionalFormattingRuleEngine;
}