/**
 * Perfect Constants for Conditional Formatting V2
 * Immutable, type-safe constants with complete definition
 */

// Rule Types - Simplified to 2 types only
const RULE_TYPES = Object.freeze({
  SIMPLE: 'simple',      // Single condition
  COMBINED: 'combined'   // Multiple conditions with logical operators
});

// Logical Operators
const LOGICAL_OPERATORS = Object.freeze({
  AND: 'AND',
  OR: 'OR'
});

// Comparison Operators
const OPERATORS = Object.freeze({
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  LESS_THAN: 'less_than',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  BETWEEN: 'between',
  NOT_BETWEEN: 'not_between'
});

// Data Types
const DATA_TYPES = Object.freeze({
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean'
});

// Operator Requirements (how many values each operator needs)
const OPERATOR_REQUIREMENTS = Object.freeze({
  [OPERATORS.EQUALS]: { valueCount: 1, dataTypes: ['text', 'number', 'date', 'boolean'] },
  [OPERATORS.NOT_EQUALS]: { valueCount: 1, dataTypes: ['text', 'number', 'date', 'boolean'] },
  [OPERATORS.GREATER_THAN]: { valueCount: 1, dataTypes: ['number', 'date'] },
  [OPERATORS.GREATER_THAN_OR_EQUAL]: { valueCount: 1, dataTypes: ['number', 'date'] },
  [OPERATORS.LESS_THAN]: { valueCount: 1, dataTypes: ['number', 'date'] },
  [OPERATORS.LESS_THAN_OR_EQUAL]: { valueCount: 1, dataTypes: ['number', 'date'] },
  [OPERATORS.CONTAINS]: { valueCount: 1, dataTypes: ['text'] },
  [OPERATORS.NOT_CONTAINS]: { valueCount: 1, dataTypes: ['text'] },
  [OPERATORS.STARTS_WITH]: { valueCount: 1, dataTypes: ['text'] },
  [OPERATORS.ENDS_WITH]: { valueCount: 1, dataTypes: ['text'] },
  [OPERATORS.IS_EMPTY]: { valueCount: 0, dataTypes: ['text', 'number', 'date', 'boolean'] },
  [OPERATORS.IS_NOT_EMPTY]: { valueCount: 0, dataTypes: ['text', 'number', 'date', 'boolean'] },
  [OPERATORS.BETWEEN]: { valueCount: 2, dataTypes: ['number', 'date'] },
  [OPERATORS.NOT_BETWEEN]: { valueCount: 2, dataTypes: ['number', 'date'] }
});

// Valid Format Properties
const FORMAT_PROPERTIES = Object.freeze([
  'backgroundColor',
  'color',
  'fontWeight',
  'fontStyle',
  'textDecoration',
  'border',
  'borderRadius',
  'fontSize'
]);

// Performance Thresholds
const PERFORMANCE_THRESHOLDS = Object.freeze({
  RULE_EVALUATION: 5,      // ms per rule
  CELL_EVALUATION: 1,      // ms per cell
  BATCH_UPDATE: 16,        // ms per batch (60fps)
  STORAGE_OPERATION: 100,  // ms for storage ops
  MAX_RULES_PER_COLUMN: 50,
  MAX_CONDITIONS_PER_RULE: 10,
  BATCH_SIZE: 100
});

// Storage Configuration
const STORAGE_CONFIG = Object.freeze({
  VERSION: '2.0.0',
  KEY_PREFIX: 'cf_v2_',
  BACKUP_SUFFIX: '_backup',
  MAX_BACKUP_COUNT: 5,
  COMPRESSION_ENABLED: true
});

// Event Types
const EVENT_TYPES = Object.freeze({
  RULE_ADDED: 'rule:added',
  RULE_UPDATED: 'rule:updated',
  RULE_DELETED: 'rule:deleted',
  RULE_ENABLED: 'rule:enabled',
  RULE_DISABLED: 'rule:disabled',
  CELL_EVALUATED: 'cell:evaluated',
  FORMAT_APPLIED: 'format:applied',
  FORMAT_REMOVED: 'format:removed',
  ERROR_OCCURRED: 'error:occurred',
  PERFORMANCE_WARNING: 'performance:warning',
  BATCH_UPDATE_START: 'batch:start',
  BATCH_UPDATE_END: 'batch:end'
});

// Validation Rules
const VALIDATION_RULES = Object.freeze({
  RULE_NAME: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_()[\]{}.,!?]+$/
  },
  COLUMN_NAME: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  VALUE: {
    maxLength: 1000
  }
});

// CSS Classes
const CSS_CLASSES = Object.freeze({
  NAMESPACE: 'cf-v2',
  APPLIED: 'cf-v2-applied',
  CONTAINER: 'cf-v2-container',
  PREVIEW: 'cf-v2-preview',
  ERROR: 'cf-v2-error',
  LOADING: 'cf-v2-loading',
  DISABLED: 'cf-v2-disabled'
});

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RULE_TYPES,
    LOGICAL_OPERATORS,
    OPERATORS,
    DATA_TYPES,
    OPERATOR_REQUIREMENTS,
    FORMAT_PROPERTIES,
    PERFORMANCE_THRESHOLDS,
    STORAGE_CONFIG,
    EVENT_TYPES,
    VALIDATION_RULES,
    CSS_CLASSES
  };
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  Object.assign(window.ConditionalFormattingV2, {
    RULE_TYPES,
    LOGICAL_OPERATORS,
    OPERATORS,
    DATA_TYPES,
    OPERATOR_REQUIREMENTS,
    FORMAT_PROPERTIES,
    PERFORMANCE_THRESHOLDS,
    STORAGE_CONFIG,
    EVENT_TYPES,
    VALIDATION_RULES,
    CSS_CLASSES
  });
}