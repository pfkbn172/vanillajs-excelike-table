/**
 * Perfect Validator for Conditional Formatting V2
 * Comprehensive validation with detailed error reporting
 */

class ConditionalFormattingValidator {
  constructor() {
    // Import constants and errors
    const constants = window.ConditionalFormattingV2;
    const errors = window.ConditionalFormattingV2;
    
    this.RULE_TYPES = constants.RULE_TYPES;
    this.LOGICAL_OPERATORS = constants.LOGICAL_OPERATORS;
    this.OPERATORS = constants.OPERATORS;
    this.DATA_TYPES = constants.DATA_TYPES;
    this.OPERATOR_REQUIREMENTS = constants.OPERATOR_REQUIREMENTS;
    this.FORMAT_PROPERTIES = constants.FORMAT_PROPERTIES;
    this.VALIDATION_RULES = constants.VALIDATION_RULES;
    this.ValidationError = errors.ValidationError;
  }
  
  /**
   * Validate complete rule configuration
   */
  validateRule(config) {
    const errors = [];
    
    try {
      // Required fields validation
      this.validateRequiredFields(config);
      
      // Individual field validation
      this.validateRuleName(config.name);
      this.validateRuleType(config.type);
      this.validateConditions(config.conditions, config.type);
      this.validateLogicalOperator(config.logicalOperator, config.type);
      this.validateFormat(config.format);
      this.validatePriority(config.priority);
      
    } catch (error) {
      if (error instanceof this.ValidationError) {
        errors.push(error);
      } else {
        errors.push(new this.ValidationError(`Unexpected validation error: ${error.message}`));
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate required fields
   */
  validateRequiredFields(config) {
    const required = ['name', 'type', 'conditions', 'format'];
    const missing = required.filter(field => 
      config[field] === undefined || config[field] === null
    );
    
    if (missing.length > 0) {
      throw new this.ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        'required_fields',
        missing
      );
    }
  }
  
  /**
   * Validate rule name
   */
  validateRuleName(name) {
    if (typeof name !== 'string') {
      throw new this.ValidationError('Rule name must be a string', 'name', name);
    }
    
    const trimmed = name.trim();
    const rules = this.VALIDATION_RULES.RULE_NAME;
    
    if (trimmed.length < rules.minLength) {
      throw new this.ValidationError(
        `Rule name must be at least ${rules.minLength} character(s)`,
        'name',
        name
      );
    }
    
    if (trimmed.length > rules.maxLength) {
      throw new this.ValidationError(
        `Rule name must not exceed ${rules.maxLength} characters`,
        'name',
        name
      );
    }
    
    if (!rules.pattern.test(trimmed)) {
      throw new this.ValidationError(
        'Rule name contains invalid characters',
        'name',
        name
      );
    }
  }
  
  /**
   * Validate rule type
   */
  validateRuleType(type) {
    const validTypes = Object.values(this.RULE_TYPES);
    
    if (!validTypes.includes(type)) {
      throw new this.ValidationError(
        `Invalid rule type: ${type}. Valid types: ${validTypes.join(', ')}`,
        'type',
        type
      );
    }
  }
  
  /**
   * Validate conditions array
   */
  validateConditions(conditions, ruleType) {
    if (!Array.isArray(conditions)) {
      throw new this.ValidationError(
        'Conditions must be an array',
        'conditions',
        conditions
      );
    }
    
    if (conditions.length === 0) {
      throw new this.ValidationError(
        'At least one condition is required',
        'conditions',
        conditions
      );
    }
    
    // Type-specific validation
    if (ruleType === this.RULE_TYPES.SIMPLE && conditions.length > 1) {
      throw new this.ValidationError(
        'Simple rules can only have one condition',
        'conditions',
        conditions
      );
    }
    
    if (ruleType === this.RULE_TYPES.COMBINED && conditions.length < 2) {
      throw new this.ValidationError(
        'Combined rules must have at least two conditions',
        'conditions',
        conditions
      );
    }
    
    // Validate each condition
    conditions.forEach((condition, index) => {
      try {
        this.validateCondition(condition);
      } catch (error) {
        throw new this.ValidationError(
          `Condition ${index + 1}: ${error.message}`,
          `conditions[${index}]`,
          condition
        );
      }
    });
    
    // Validate target columns consistency
    this.validateTargetColumnsConsistency(conditions);
  }
  
  /**
   * Validate single condition
   */
  validateCondition(condition) {
    // Required fields
    const required = ['column', 'operator'];
    const missing = required.filter(field => !condition[field]);
    
    if (missing.length > 0) {
      throw new this.ValidationError(
        `Missing required condition fields: ${missing.join(', ')}`
      );
    }
    
    // Column validation
    this.validateColumnName(condition.column);
    
    // Operator validation
    this.validateOperator(condition.operator);
    
    // Value validation based on operator requirements
    this.validateConditionValues(condition);
    
    // Data type validation
    if (condition.dataType) {
      this.validateDataType(condition.dataType);
    }
  }
  
  /**
   * Validate column name
   */
  validateColumnName(column) {
    if (typeof column !== 'string') {
      throw new this.ValidationError('Column name must be a string');
    }
    
    const rules = this.VALIDATION_RULES.COLUMN_NAME;
    const trimmed = column.trim();
    
    if (trimmed.length < rules.minLength) {
      throw new this.ValidationError('Column name cannot be empty');
    }
    
    if (trimmed.length > rules.maxLength) {
      throw new this.ValidationError(
        `Column name must not exceed ${rules.maxLength} characters`
      );
    }
    
    if (!rules.pattern.test(trimmed)) {
      throw new this.ValidationError('Column name contains invalid characters');
    }
  }
  
  /**
   * Validate operator
   */
  validateOperator(operator) {
    const validOperators = Object.values(this.OPERATORS);
    
    if (!validOperators.includes(operator)) {
      throw new this.ValidationError(
        `Invalid operator: ${operator}. Valid operators: ${validOperators.join(', ')}`
      );
    }
  }
  
  /**
   * Validate condition values based on operator requirements
   */
  validateConditionValues(condition) {
    const requirements = this.OPERATOR_REQUIREMENTS[condition.operator];
    
    if (!requirements) {
      throw new this.ValidationError(`Unknown operator: ${condition.operator}`);
    }
    
    const { valueCount } = requirements;
    
    // Check value count
    if (valueCount === 0) {
      // Operators like IS_EMPTY don't need values
      return;
    }
    
    if (valueCount === 1) {
      if (condition.value === undefined || condition.value === null) {
        throw new this.ValidationError('Value is required for this operator');
      }
      this.validateSingleValue(condition.value);
    }
    
    if (valueCount === 2) {
      if (condition.value === undefined || condition.value === null ||
          condition.value2 === undefined || condition.value2 === null) {
        throw new this.ValidationError('Two values are required for this operator');
      }
      this.validateSingleValue(condition.value);
      this.validateSingleValue(condition.value2);
    }
  }
  
  /**
   * Validate single value
   */
  validateSingleValue(value) {
    const stringValue = String(value);
    const rules = this.VALIDATION_RULES.VALUE;
    
    if (stringValue.length > rules.maxLength) {
      throw new this.ValidationError(
        `Value must not exceed ${rules.maxLength} characters`
      );
    }
  }
  
  /**
   * Validate data type
   */
  validateDataType(dataType) {
    const validTypes = Object.values(this.DATA_TYPES);
    
    if (!validTypes.includes(dataType)) {
      throw new this.ValidationError(
        `Invalid data type: ${dataType}. Valid types: ${validTypes.join(', ')}`
      );
    }
  }
  
  /**
   * Validate logical operator
   */
  validateLogicalOperator(operator, ruleType) {
    if (ruleType === this.RULE_TYPES.SIMPLE) {
      // Simple rules don't use logical operators
      if (operator !== undefined && operator !== null) {
        throw new this.ValidationError(
          'Simple rules should not have logical operators',
          'logicalOperator',
          operator
        );
      }
      return;
    }
    
    if (ruleType === this.RULE_TYPES.COMBINED) {
      // Combined rules require logical operators
      if (!operator) {
        throw new this.ValidationError(
          'Combined rules require a logical operator',
          'logicalOperator',
          operator
        );
      }
      
      const validOperators = Object.values(this.LOGICAL_OPERATORS);
      if (!validOperators.includes(operator)) {
        throw new this.ValidationError(
          `Invalid logical operator: ${operator}. Valid operators: ${validOperators.join(', ')}`,
          'logicalOperator',
          operator
        );
      }
    }
  }
  
  /**
   * Validate format object
   */
  validateFormat(format) {
    if (!format || typeof format !== 'object') {
      throw new this.ValidationError(
        'Format must be a non-empty object',
        'format',
        format
      );
    }
    
    const formatKeys = Object.keys(format);
    if (formatKeys.length === 0) {
      throw new this.ValidationError(
        'Format object cannot be empty',
        'format',
        format
      );
    }
    
    // Validate format properties
    const invalidProps = formatKeys.filter(
      prop => !this.FORMAT_PROPERTIES.includes(prop)
    );
    
    if (invalidProps.length > 0) {
      throw new this.ValidationError(
        `Invalid format properties: ${invalidProps.join(', ')}. Valid properties: ${this.FORMAT_PROPERTIES.join(', ')}`,
        'format',
        format
      );
    }
    
    // Validate specific format values
    this.validateFormatValues(format);
  }
  
  /**
   * Validate format values
   */
  validateFormatValues(format) {
    // Color validation (simple regex for hex colors)
    const colorProps = ['backgroundColor', 'color'];
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    colorProps.forEach(prop => {
      if (format[prop] && !colorRegex.test(format[prop])) {
        throw new this.ValidationError(
          `Invalid color format for ${prop}: ${format[prop]}. Use hex format like #ff0000`,
          'format',
          format
        );
      }
    });
    
    // Font weight validation
    if (format.fontWeight) {
      const validWeights = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      if (!validWeights.includes(String(format.fontWeight))) {
        throw new this.ValidationError(
          `Invalid font weight: ${format.fontWeight}`,
          'format',
          format
        );
      }
    }
  }
  
  /**
   * Validate priority
   */
  validatePriority(priority) {
    if (priority !== undefined && priority !== null) {
      if (!Number.isInteger(priority) || priority < 0) {
        throw new this.ValidationError(
          'Priority must be a non-negative integer',
          'priority',
          priority
        );
      }
    }
  }
  
  /**
   * Validate target columns consistency
   */
  validateTargetColumnsConsistency(conditions) {
    // For now, all conditions should target the same column
    // This can be relaxed in future versions
    const columns = [...new Set(conditions.map(c => c.column))];
    
    if (columns.length > 1) {
      throw new this.ValidationError(
        `All conditions must target the same column. Found: ${columns.join(', ')}`,
        'conditions',
        conditions
      );
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingValidator;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.Validator = ConditionalFormattingValidator;
}