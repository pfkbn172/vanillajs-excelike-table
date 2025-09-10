/**
 * Conditional Formatting Types and Constants
 * Data structures and enums for the conditional formatting system
 */

// Comparison operators for conditions
const OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  GREATER_THAN: 'greaterThan',
  GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
  LESS_THAN: 'lessThan',
  LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
  IS_NUMBER: 'isNumber',
  IS_DATE: 'isDate',
  BETWEEN: 'between',
  NOT_BETWEEN: 'notBetween'
};

// Data types for condition values
const DATA_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  FORMULA: 'formula'
};

// 🎯 Enhanced Condition Types - unified format
const CONDITION_TYPES = {
  SIMPLE: 'simple',         // Single condition: sales > 10000
  COMBINED: 'combined',     // Multiple conditions with logical operators
  FORMULA: 'formula'        // Custom formula: (sales - cost) / sales > 0.3
};

// 🧮 Extended Logical Operators for combining conditions
const LOGICAL_OPERATORS = {
  AND: {
    value: 'and',
    label: 'AND（すべて一致）',
    description: '全ての条件を満たす場合のみ適用',
    symbol: '∧'
  },
  OR: {
    value: 'or',
    label: 'OR（いずれか一致）',
    description: 'いずれかの条件を満たす場合に適用',
    symbol: '∨'
  },
  XOR: {
    value: 'xor',
    label: 'XOR（1つだけ一致）',
    description: '条件のうち1つだけを満たす場合に適用',
    symbol: '⊕'
  },
  NAND: {
    value: 'nand',
    label: 'NAND（すべて不一致）',
    description: '全ての条件を満たさない場合のみ適用',
    symbol: '↑'
  },
  NOR: {
    value: 'nor',
    label: 'NOR（いずれも不一致）',
    description: '全ての条件を満たさない場合のみ適用',
    symbol: '↓'
  }
};

// 🎯 Target Scope - where to apply formatting (independent from condition)
const TARGET_SCOPES = {
  CELL: {
    value: 'cell',
    label: '条件に一致したセルのみ',
    description: '条件を満たしたセルだけに書式を適用'
  },
  ROW: {
    value: 'row',
    label: '条件に一致した行全体',
    description: '条件を満たした行全体に書式を適用'
  },
  COLUMN: {
    value: 'column',
    label: '条件に一致した列全体',
    description: '条件を満たした列全体に書式を適用（将来対応）'
  },
  CUSTOM: {
    value: 'custom',
    label: 'カスタム範囲',
    description: '指定したセル範囲に書式を適用（将来対応）'
  }
};


// Format types that can be applied
const FORMAT_TYPES = {
  BACKGROUND_COLOR: 'backgroundColor',
  TEXT_COLOR: 'textColor',
  FONT_WEIGHT: 'fontWeight',
  FONT_STYLE: 'fontStyle',
  TEXT_DECORATION: 'textDecoration',
  BORDER: 'border',
  ICON: 'icon'
};

// Conditional formatting rule categories for UI management
const RULE_FORMAT_TYPES = {
  BASIC: {
    value: 'basic',
    label: '基本書式',
    description: '背景色、文字色、フォント設定など',
    icon: '🎨'
  },
  ICON_SET: {
    value: 'iconSet',
    label: 'アイコンセット',
    description: '条件に応じたアイコン表示',
    icon: '⭐'
  },
  DATA_BAR: {
    value: 'dataBar', 
    label: 'データバー',
    description: '値に比例したバーグラフ表示',
    icon: '📊'
  },
  COLOR_SCALE: {
    value: 'colorScale',
    label: 'カラースケール',
    description: '値に応じた段階的色分け',
    icon: '🌈'
  }
};

// Predefined color palettes
const COLOR_PALETTE = {
  // Background colors
  BACKGROUNDS: {
    RED_LIGHT: '#ffebee',
    RED: '#ffcdd2',
    RED_DARK: '#ef5350',
    GREEN_LIGHT: '#e8f5e8',
    GREEN: '#c8e6c9',
    GREEN_DARK: '#66bb6a',
    BLUE_LIGHT: '#e3f2fd',
    BLUE: '#bbdefb',
    BLUE_DARK: '#42a5f5',
    YELLOW_LIGHT: '#fffde7',
    YELLOW: '#fff9c4',
    YELLOW_DARK: '#ffeb3b',
    ORANGE_LIGHT: '#fff3e0',
    ORANGE: '#ffe0b2',
    ORANGE_DARK: '#ffa726',
    PURPLE_LIGHT: '#f3e5f5',
    PURPLE: '#e1bee7',
    PURPLE_DARK: '#ab47bc'
  },
  
  // Text colors
  TEXTS: {
    WHITE: '#ffffff',
    BLACK: '#000000',
    GRAY_DARK: '#424242',
    GRAY_LIGHT: '#757575',
    RED: '#d32f2f',
    GREEN: '#388e3c',
    BLUE: '#1976d2',
    ORANGE: '#f57c00',
    PURPLE: '#7b1fa2'
  }
};

// DataBar calculation methods - 汎用的な計算方式
const DATA_BAR_METHODS = {
  AUTO: {
    value: 'minMax',
    label: '自動（最小値〜最大値）',
    description: 'データの最小値を0%、最大値を100%として計算'
  },
  ZERO_BASE: {
    value: 'zeroToMax', 
    label: '0基準',
    description: '0を基準点として最大値を100%で計算（正の値のみ有効）'
  },
  PERCENTILE: {
    value: 'percentile',
    label: 'パーセンタイル',
    description: '指定されたパーセンタイル範囲で計算（外れ値を除外）'
  },
  CUSTOM_RANGE: {
    value: 'custom',
    label: 'カスタム範囲',
    description: '任意の最小値・最大値を指定して計算'
  }
};

// Predefined formatting styles
const PREDEFINED_FORMATS = {
  // Data bars - 自動計算（最小値〜最大値）
  DATA_BAR_BLUE: {
    type: 'dataBar',
    color: '#4285f4',
    showValue: true,
    calculationMethod: 'minMax'
  },
  DATA_BAR_GREEN: {
    type: 'dataBar',
    color: '#34a853',
    showValue: true,
    calculationMethod: 'minMax'
  },
  DATA_BAR_RED: {
    type: 'dataBar',
    color: '#ea4335',
    showValue: true,
    calculationMethod: 'minMax'
  },
  
  // Data bars - 0基準計算（任意の数値データに使用可能）
  DATA_BAR_ZERO_BLUE: {
    type: 'dataBar',
    color: '#4285f4',
    showValue: true,
    calculationMethod: 'zeroToMax'
  },
  DATA_BAR_ZERO_GREEN: {
    type: 'dataBar',
    color: '#34a853', 
    showValue: true,
    calculationMethod: 'zeroToMax'
  },
  DATA_BAR_ZERO_RED: {
    type: 'dataBar',
    color: '#ea4335', 
    showValue: true,
    calculationMethod: 'zeroToMax'
  },
  
  // Data bars - パーセンタイル計算（外れ値対応）
  DATA_BAR_PERCENTILE_BLUE: {
    type: 'dataBar',
    color: '#4285f4',
    showValue: true,
    calculationMethod: 'percentile',
    lowerPercentile: 10,
    upperPercentile: 90
  },
  
  // Color scales
  RED_YELLOW_GREEN: {
    type: 'colorScale',
    colors: ['#ea4335', '#fbbc04', '#34a853']
  },
  RED_WHITE_BLUE: {
    type: 'colorScale',
    colors: ['#ea4335', '#ffffff', '#4285f4']
  },
  
  // Icon sets
  TRAFFIC_LIGHTS: {
    type: 'iconSet',
    icons: ['🔴', '🟡', '🟢'],
    thresholds: [33, 67, 100]
  },
  ARROWS: {
    type: 'iconSet',
    icons: ['↓', '→', '↑'],
    thresholds: [33, 67, 100]
  }
};

/**
 * Conditional formatting rule structure
 */
class ConditionalFormattingRule {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.name = options.name || 'Untitled Rule';
    this.enabled = options.enabled !== false;
    this.priority = options.priority || 0;
    
    // Condition type - validate and set explicitly
    this.conditionType = this._validateAndSetConditionType(options.conditionType);
    this.targetColumns = Array.isArray(options.targetColumns) ? options.targetColumns : [];
    this.operator = options.operator || OPERATORS.EQUALS;
    this.value = options.value || '';
    this.value2 = options.value2 || ''; // For BETWEEN operations
    this.dataType = options.dataType || DATA_TYPES.TEXT;
    
    // Multiple columns conditions (for combined type)
    this.multipleConditions = options.multipleConditions || [];
    this.logicalOperator = options.logicalOperator || LOGICAL_OPERATORS.AND.value || 'and';
    
    // Application scope (legacy support for existing rules)
    this.applicationScope = options.applicationScope || 'cell';
    
    // Format to apply
    this.format = options.format || {};
    this.formatType = options.formatType || 'basic'; // Default to basic formatting
    
    // Advanced options
    this.stopIfTrue = options.stopIfTrue || false;
    this.formula = options.formula || ''; // For formula-based conditions
    
    // Metadata
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
  }
  
  generateId() {
    return 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validate and set condition type explicitly
   */
  _validateAndSetConditionType(conditionType) {
    // Get all valid condition type values
    const validConditionTypes = Object.values(CONDITION_TYPES);
    
    // If provided condition type is valid, use it
    if (conditionType && validConditionTypes.includes(conditionType)) {
      return conditionType;
    }
    
    // Default fallback
    return CONDITION_TYPES.SIMPLE;
  }
  
  /**
   * Validate the rule configuration
   */
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim() === '') {
      errors.push('Rule name is required');
    }
    
    if (!this.targetColumns || this.targetColumns.length === 0) {
      errors.push('At least one target column is required');
    }
    
    if (!Object.values(OPERATORS).includes(this.operator)) {
      errors.push('Invalid operator');
    }
    
    if (!Object.values(CONDITION_TYPES).includes(this.conditionType)) {
      errors.push('Invalid condition type');
    }
    
    if (!['cell', 'row'].includes(this.applicationScope)) {
      errors.push('Invalid application scope');
    }
    
    // Value validation based on operator
    if ([OPERATORS.BETWEEN, OPERATORS.NOT_BETWEEN].includes(this.operator)) {
      if (!this.value || !this.value2) {
        errors.push('Both values are required for range operators');
      }
    } else if (![OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY, OPERATORS.IS_NUMBER, OPERATORS.IS_DATE].includes(this.operator)) {
      if (!this.value && this.value !== 0) {
        errors.push('Value is required for this operator');
      }
    }
    
    // Format validation
    if (!this.format || Object.keys(this.format).length === 0) {
      errors.push('At least one format property is required');
    }
    
    return errors;
  }
  
  /**
   * Clone the rule with optional overrides
   */
  clone(overrides = {}) {
    const clonedData = {
      ...this.toJSON(),
      ...overrides,
      id: undefined, // Force new ID generation
      createdAt: new Date()
    };
    return new ConditionalFormattingRule(clonedData);
  }
  
  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      priority: this.priority,
      conditionType: this.conditionType,
      targetColumns: this.targetColumns,
      operator: this.operator,
      value: this.value,
      value2: this.value2,
      dataType: this.dataType,
      multipleConditions: this.multipleConditions, // 🔥 CRITICAL FIX: Save combined conditions
      logicalOperator: this.logicalOperator, // 🔥 CRITICAL FIX: Save logical operator
      applicationScope: this.applicationScope,
      formatType: this.formatType, // 🔥 CRITICAL FIX: Save format type for proper dialog delegation
      format: this.format,
      stopIfTrue: this.stopIfTrue,
      formula: this.formula,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    return new ConditionalFormattingRule({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}

/**
 * Format specification structure
 */
class FormatSpec {
  constructor(options = {}) {
    this.backgroundColor = options.backgroundColor || null;
    this.textColor = options.textColor || null;
    this.fontWeight = options.fontWeight || null; // 'bold', 'normal'
    this.fontStyle = options.fontStyle || null; // 'italic', 'normal'
    this.textDecoration = options.textDecoration || null; // 'underline', 'line-through', 'none'
    this.border = options.border || null; // CSS border string
    this.icon = options.icon || null; // Icon character or class
    
    // Advanced formatting
    this.borderRadius = options.borderRadius || null;
    this.opacity = options.opacity || null;
    this.transform = options.transform || null; // CSS transform
    
    // Data bars and color scales
    this.dataBar = options.dataBar || null;
    this.colorScale = options.colorScale || null;
    this.iconSet = options.iconSet || null;
  }
  
  /**
   * Convert to CSS style object
   */
  toCSSStyle() {
    const style = {};
    
    if (this.backgroundColor) style.backgroundColor = this.backgroundColor;
    if (this.textColor) style.color = this.textColor;
    if (this.fontWeight) style.fontWeight = this.fontWeight;
    if (this.fontStyle) style.fontStyle = this.fontStyle;
    if (this.textDecoration) style.textDecoration = this.textDecoration;
    if (this.border) style.border = this.border;
    if (this.borderRadius) style.borderRadius = this.borderRadius;
    if (this.opacity !== null) style.opacity = this.opacity;
    if (this.transform) style.transform = this.transform;
    
    return style;
  }
  
  /**
   * Check if format has any visual changes
   */
  hasVisualChanges() {
    return !!(
      this.backgroundColor ||
      this.textColor ||
      this.fontWeight ||
      this.fontStyle ||
      this.textDecoration ||
      this.border ||
      this.icon ||
      this.dataBar ||
      this.colorScale ||
      this.iconSet
    );
  }
}

// Export all types and constants
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPERATORS,
    DATA_TYPES,
    CONDITION_TYPES,
    LOGICAL_OPERATORS,
    FORMAT_TYPES,
    RULE_FORMAT_TYPES,  // New format type categories
    COLOR_PALETTE,
    DATA_BAR_METHODS,
    PREDEFINED_FORMATS,
    ConditionalFormattingRule,
    FormatSpec,
    TARGET_SCOPES,
    EnhancedConditionalFormattingRule,
    LogicalEvaluator
  };
}

// 📋 Enhanced Rule Class for new architecture
class EnhancedConditionalFormattingRule {
  constructor(options = {}) {
    this.id = options.id || 'rule_' + Date.now();
    this.name = options.name || 'Untitled Rule';
    
    // 🎯 Condition Configuration (independent)
    this.conditionType = options.conditionType || 'simple';
    this.conditions = options.conditions || [];
    this.logicalOperator = options.logicalOperator || 'and';
    this.conditionTree = options.conditionTree || null; // For complex nested conditions
    
    // 🎯 Target Scope Configuration (independent)
    this.targetScope = options.targetScope || 'cell';
    this.targetColumns = options.targetColumns || [];
    
    // 🎨 Format Configuration
    this.format = options.format || {};
    
    // 📊 Metadata
    this.priority = options.priority || 1;
    this.enabled = options.enabled !== false;
    this.description = options.description || '';
  }
  
  /**
   * Create a simple condition rule
   */
  static createSimple(column, operator, value, format, options = {}) {
    return new EnhancedConditionalFormattingRule({
      ...options,
      conditionType: 'simple',
      conditions: [{
        column,
        operator,
        value
      }],
      targetColumns: [column],
      format
    });
  }
  
  /**
   * Create a combined conditions rule
   */
  static createCombined(conditions, logicalOperator, format, options = {}) {
    return new EnhancedConditionalFormattingRule({
      ...options,
      conditionType: 'combined',
      conditions,
      logicalOperator,
      targetColumns: [...new Set(conditions.map(c => c.column))], // Extract unique columns
      format
    });
  }
  
  /**
   * Create a formula-based rule
   */
  static createFormula(formula, targetColumns, format, options = {}) {
    return new EnhancedConditionalFormattingRule({
      ...options,
      conditionType: 'formula',
      conditions: [{
        formula
      }],
      targetColumns: Array.isArray(targetColumns) ? targetColumns : [targetColumns],
      format
    });
  }
  
  /**
   * Validate rule configuration
   */
  validate() {
    const errors = [];
    
    if (!this.conditions || this.conditions.length === 0) {
      errors.push('At least one condition is required');
    }
    
    if (!this.targetColumns || this.targetColumns.length === 0) {
      errors.push('At least one target column is required');
    }
    
    if (!Object.values(CONDITION_TYPES).map(t => t.value || t).includes(this.conditionType)) {
      errors.push('Invalid condition type');
    }
    
    if (!Object.values(TARGET_SCOPES).map(s => s.value).includes(this.targetScope)) {
      errors.push('Invalid target scope');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Convert rule to serializable format
   */
  toSerializableFormat() {
    return {
      id: this.id,
      name: this.name,
      conditionType: this.conditionType,
      targetScope: this.targetScope,
      conditions: this.conditions,
      targetColumns: this.targetColumns,
      format: this.format,
      priority: this.priority,
      enabled: this.enabled
    };
  }
  
}

// 🔧 Logical Operator Evaluation Helper
class LogicalEvaluator {
  /**
   * Evaluate multiple boolean results using logical operator
   */
  static evaluate(results, operator) {
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
   * Get operator description for UI
   */
  static getOperatorInfo(operator) {
    return Object.values(LOGICAL_OPERATORS).find(op => op.value === operator) || LOGICAL_OPERATORS.AND;
  }
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingTypes = {
    OPERATORS,
    DATA_TYPES,
    CONDITION_TYPES,
    LOGICAL_OPERATORS,
    TARGET_SCOPES,
    FORMAT_TYPES,
    RULE_FORMAT_TYPES, // New format type categories
    COLOR_PALETTE,
    DATA_BAR_METHODS,  // New DataBar calculation methods
    PREDEFINED_FORMATS,
    ConditionalFormattingRule,
    EnhancedConditionalFormattingRule,
    FormatSpec,
    LogicalEvaluator   // New evaluator
  };
}