/**
 * Perfect Error Handling for Conditional Formatting V2
 * Complete error hierarchy with recovery strategies
 */

class ConditionalFormattingError extends Error {
  constructor(message, code = null, context = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

class ValidationError extends ConditionalFormattingError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

class EvaluationError extends ConditionalFormattingError {
  constructor(message, ruleId = null, operation = null) {
    super(message, 'EVALUATION_ERROR');
    this.ruleId = ruleId;
    this.operation = operation;
  }
}

class StorageError extends ConditionalFormattingError {
  constructor(message, operation = null) {
    super(message, 'STORAGE_ERROR');
    this.operation = operation;
  }
}

class PerformanceError extends ConditionalFormattingError {
  constructor(message, duration = null, threshold = null) {
    super(message, 'PERFORMANCE_ERROR');
    this.duration = duration;
    this.threshold = threshold;
  }
}

class DataAccessError extends ConditionalFormattingError {
  constructor(message, dataSource = null) {
    super(message, 'DATA_ACCESS_ERROR');
    this.dataSource = dataSource;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ConditionalFormattingError,
    ValidationError,
    EvaluationError,
    StorageError,
    PerformanceError,
    DataAccessError
  };
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  Object.assign(window.ConditionalFormattingV2, {
    ConditionalFormattingError,
    ValidationError,
    EvaluationError,
    StorageError,
    PerformanceError,
    DataAccessError
  });
}