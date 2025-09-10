/**
 * Perfect ConditionalFormattingRule for V2 Architecture
 * Immutable, type-safe rule with comprehensive validation
 */

class ConditionalFormattingRule {
  constructor(config) {
    // Import dependencies
    const v2 = window.ConditionalFormattingV2;
    this.constants = v2;
    this.validator = new v2.Validator();
    this.ValidationError = v2.ValidationError;
    
    // Validate config before creating rule
    const validation = this.validator.validateRule(config);
    if (!validation.valid) {
      throw new this.ValidationError(
        `Rule creation failed: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }
    
    // Immutable properties
    Object.defineProperties(this, {
      id: {
        value: config.id || this._generateId(),
        writable: false,
        enumerable: true
      },
      name: {
        value: config.name.trim(),
        writable: false,
        enumerable: true
      },
      type: {
        value: config.type,
        writable: false,
        enumerable: true
      },
      conditions: {
        value: Object.freeze(config.conditions.map(c => Object.freeze({...c}))),
        writable: false,
        enumerable: true
      },
      logicalOperator: {
        value: config.logicalOperator || (config.type === this.constants.RULE_TYPES.COMBINED ? this.constants.LOGICAL_OPERATORS.AND : null),
        writable: false,
        enumerable: true
      },
      format: {
        value: Object.freeze({...config.format}),
        writable: false,
        enumerable: true
      },
      priority: {
        value: config.priority || 0,
        writable: false,
        enumerable: true
      },
      enabled: {
        value: config.enabled !== false, // Default to true
        writable: false,
        enumerable: true
      },
      stopIfTrue: {
        value: config.stopIfTrue || false,
        writable: false,
        enumerable: true
      },
      targetColumns: {
        value: Object.freeze(this._extractTargetColumns(config.conditions)),
        writable: false,
        enumerable: true
      },
      createdAt: {
        value: config.createdAt || new Date(),
        writable: false,
        enumerable: true
      },
      updatedAt: {
        value: config.updatedAt || new Date(),
        writable: false,
        enumerable: true
      }
    });
    
    // Freeze the entire object to ensure immutability
    Object.freeze(this);
  }
  
  /**
   * Generate unique rule ID
   */
  _generateId() {
    return `cf_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Extract target columns from conditions
   */
  _extractTargetColumns(conditions) {
    return [...new Set(conditions.map(c => c.column).filter(c => c))];
  }
  
  /**
   * Validate the rule (for compatibility)
   */
  validate() {
    const validation = this.validator.validateRule(this.toConfig());
    return validation.valid ? [] : validation.errors.map(e => e.message);
  }
  
  /**
   * Check if rule applies to specific column
   */
  appliesToColumn(columnKey, columnIndex) {
    return this.targetColumns.some(target => 
      target === columnKey || 
      target === columnIndex || 
      target === columnIndex.toString()
    );
  }
  
  /**
   * Create a new rule with updates (immutable update)
   */
  update(updates) {
    const config = {
      ...this.toConfig(),
      ...updates,
      id: this.id, // Keep original ID
      createdAt: this.createdAt, // Keep original creation time
      updatedAt: new Date() // Update modification time
    };
    
    return new ConditionalFormattingRule(config);
  }
  
  /**
   * Create enabled/disabled version
   */
  setEnabled(enabled) {
    return this.update({ enabled });
  }
  
  /**
   * Create copy with new priority
   */
  setPriority(priority) {
    return this.update({ priority });
  }
  
  /**
   * Create copy with new format
   */
  setFormat(format) {
    return this.update({ format });
  }
  
  /**
   * Get rule as configuration object
   */
  toConfig() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      conditions: this.conditions.map(c => ({...c})), // Deep copy
      logicalOperator: this.logicalOperator,
      format: {...this.format}, // Deep copy
      priority: this.priority,
      enabled: this.enabled,
      stopIfTrue: this.stopIfTrue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Get rule as JSON
   */
  toJSON() {
    return this.toConfig();
  }
  
  /**
   * Create rule from JSON
   */
  static fromJSON(json) {
    const config = typeof json === 'string' ? JSON.parse(json) : json;
    
    // Convert date strings back to Date objects
    if (config.createdAt && typeof config.createdAt === 'string') {
      config.createdAt = new Date(config.createdAt);
    }
    if (config.updatedAt && typeof config.updatedAt === 'string') {
      config.updatedAt = new Date(config.updatedAt);
    }
    
    return new ConditionalFormattingRule(config);
  }
  
  /**
   * Get human-readable description
   */
  getDescription() {
    if (this.type === this.constants.RULE_TYPES.SIMPLE) {
      const condition = this.conditions[0];
      return `${condition.column} ${condition.operator} ${condition.value || ''}`;
    } else {
      const descriptions = this.conditions.map(c => 
        `${c.column} ${c.operator} ${c.value || ''}`
      );
      return descriptions.join(` ${this.logicalOperator} `);
    }
  }
  
  /**
   * Get summary information
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      conditionCount: this.conditions.length,
      targetColumns: this.targetColumns,
      enabled: this.enabled,
      priority: this.priority,
      description: this.getDescription()
    };
  }
  
  /**
   * Check if rule is simple (single condition)
   */
  isSimple() {
    return this.type === this.constants.RULE_TYPES.SIMPLE;
  }
  
  /**
   * Check if rule is combined (multiple conditions)
   */
  isCombined() {
    return this.type === this.constants.RULE_TYPES.COMBINED;
  }
  
  /**
   * Get condition by index
   */
  getCondition(index) {
    return this.conditions[index] ? {...this.conditions[index]} : null;
  }
  
  /**
   * Get all conditions (deep copy)
   */
  getConditions() {
    return this.conditions.map(c => ({...c}));
  }
  
  /**
   * Compare with another rule for equality
   */
  equals(other) {
    if (!(other instanceof ConditionalFormattingRule)) {
      return false;
    }
    
    return JSON.stringify(this.toConfig()) === JSON.stringify(other.toConfig());
  }
  
  /**
   * Compare rules by priority (for sorting)
   */
  static comparePriority(a, b) {
    return b.priority - a.priority; // Higher priority first
  }
  
  /**
   * Create a simple rule (convenience method)
   */
  static createSimple(config) {
    return new ConditionalFormattingRule({
      ...config,
      type: window.ConditionalFormattingV2.RULE_TYPES.SIMPLE,
      conditions: [config.condition] // Single condition
    });
  }
  
  /**
   * Create a combined rule (convenience method)
   */
  static createCombined(config) {
    return new ConditionalFormattingRule({
      ...config,
      type: window.ConditionalFormattingV2.RULE_TYPES.COMBINED
    });
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingRule;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.Rule = ConditionalFormattingRule;
}