/**
 * V2 Conditional Formatting Architecture Entry Point
 * Perfect design with comprehensive error handling and performance optimization
 */

// Load all V2 components in correct order
(function() {
  'use strict';
  
  // Ensure namespace exists
  if (typeof window !== 'undefined') {
    window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  }
  
  /**
   * Initialize V2 system
   */
  function initializeV2System() {
    const v2 = window.ConditionalFormattingV2;
    
    // Validate all components are loaded
    const requiredComponents = [
      'ValidationError', 'EvaluationError', 'StorageError', 'PerformanceError', 'DataAccessError',
      'RULE_TYPES', 'LOGICAL_OPERATORS', 'OPERATORS', 'DATA_TYPES',
      'Validator', 'Rule', 'RuleEngine', 'TableAdapter', 'EventBus', 'Controller'
    ];
    
    const missingComponents = requiredComponents.filter(component => !v2[component]);
    
    if (missingComponents.length > 0) {
      console.error('[ConditionalFormattingV2] Missing components:', missingComponents);
      return false;
    }
    
    // Mark as initialized
    v2.initialized = true;
    v2.version = '2.0.0';
    
    console.log('[ConditionalFormattingV2] System initialized successfully');
    return true;
  }
  
  /**
   * Create V2 controller instance
   */
  function createController(table, options = {}) {
    const v2 = window.ConditionalFormattingV2;
    
    if (!v2.initialized) {
      throw new Error('V2 system not initialized. Call ConditionalFormattingV2.initialize() first.');
    }
    
    return new v2.Controller(table, options);
  }
  
  /**
   * Migration helper from V1 to V2
   */
  function migrateFromV1(v1Rules) {
    const v2 = window.ConditionalFormattingV2;
    const migratedRules = [];
    const errors = [];
    
    for (const v1Rule of v1Rules) {
      try {
        const v2Config = convertV1RuleToV2Config(v1Rule);
        const v2Rule = new v2.Rule(v2Config);
        migratedRules.push(v2Rule);
      } catch (error) {
        errors.push({
          rule: v1Rule,
          error: error.message
        });
      }
    }
    
    return {
      rules: migratedRules,
      errors: errors
    };
  }
  
  /**
   * Convert V1 rule to V2 configuration
   */
  function convertV1RuleToV2Config(v1Rule) {
    const v2 = window.ConditionalFormattingV2;
    
    // Determine rule type
    let type = v2.RULE_TYPES.SIMPLE;
    let conditions = [];
    let logicalOperator = null;
    
    if (v1Rule.multipleConditions && v1Rule.multipleConditions.length > 1) {
      type = v2.RULE_TYPES.COMBINED;
      conditions = v1Rule.multipleConditions.map(condition => ({
        column: condition.column,
        operator: mapV1OperatorToV2(condition.operator),
        value: condition.value,
        value2: condition.value2,
        dataType: mapV1DataTypeToV2(condition.dataType)
      }));
      logicalOperator = mapV1LogicalOperatorToV2(v1Rule.logicalOperator);
    } else if (v1Rule.multipleConditions && v1Rule.multipleConditions.length === 1) {
      conditions = [{
        column: v1Rule.multipleConditions[0].column,
        operator: mapV1OperatorToV2(v1Rule.multipleConditions[0].operator),
        value: v1Rule.multipleConditions[0].value,
        value2: v1Rule.multipleConditions[0].value2,
        dataType: mapV1DataTypeToV2(v1Rule.multipleConditions[0].dataType)
      }];
    } else {
      // Fallback to simple rule from main properties
      conditions = [{
        column: v1Rule.column || v1Rule.targetColumns?.[0],
        operator: mapV1OperatorToV2(v1Rule.operator),
        value: v1Rule.value,
        value2: v1Rule.value2,
        dataType: mapV1DataTypeToV2(v1Rule.dataType)
      }];
    }
    
    return {
      id: v1Rule.id,
      name: v1Rule.name || `Migrated Rule ${v1Rule.id}`,
      type: type,
      conditions: conditions,
      logicalOperator: logicalOperator,
      format: v1Rule.format || {},
      priority: v1Rule.priority || 0,
      enabled: v1Rule.enabled !== false,
      stopIfTrue: v1Rule.stopIfTrue || false,
      createdAt: v1Rule.createdAt || new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * Map V1 operators to V2
   */
  function mapV1OperatorToV2(v1Operator) {
    const v2 = window.ConditionalFormattingV2;
    const mapping = {
      'equals': v2.OPERATORS.EQUALS,
      'not_equals': v2.OPERATORS.NOT_EQUALS,
      'greater_than': v2.OPERATORS.GREATER_THAN,
      'greater_than_or_equal': v2.OPERATORS.GREATER_THAN_OR_EQUAL,
      'less_than': v2.OPERATORS.LESS_THAN,
      'less_than_or_equal': v2.OPERATORS.LESS_THAN_OR_EQUAL,
      'contains': v2.OPERATORS.CONTAINS,
      'not_contains': v2.OPERATORS.NOT_CONTAINS,
      'starts_with': v2.OPERATORS.STARTS_WITH,
      'ends_with': v2.OPERATORS.ENDS_WITH,
      'is_empty': v2.OPERATORS.IS_EMPTY,
      'is_not_empty': v2.OPERATORS.IS_NOT_EMPTY,
      'between': v2.OPERATORS.BETWEEN,
      'not_between': v2.OPERATORS.NOT_BETWEEN
    };
    
    return mapping[v1Operator] || v2.OPERATORS.EQUALS;
  }
  
  /**
   * Map V1 data types to V2
   */
  function mapV1DataTypeToV2(v1DataType) {
    const v2 = window.ConditionalFormattingV2;
    const mapping = {
      'text': v2.DATA_TYPES.TEXT,
      'number': v2.DATA_TYPES.NUMBER,
      'date': v2.DATA_TYPES.DATE,
      'boolean': v2.DATA_TYPES.BOOLEAN
    };
    
    return mapping[v1DataType] || v2.DATA_TYPES.TEXT;
  }
  
  /**
   * Map V1 logical operators to V2
   */
  function mapV1LogicalOperatorToV2(v1LogicalOperator) {
    const v2 = window.ConditionalFormattingV2;
    
    if (v1LogicalOperator === 'and' || v1LogicalOperator === 'AND') {
      return v2.LOGICAL_OPERATORS.AND;
    } else if (v1LogicalOperator === 'or' || v1LogicalOperator === 'OR') {
      return v2.LOGICAL_OPERATORS.OR;
    }
    
    return v2.LOGICAL_OPERATORS.AND; // Default
  }
  
  /**
   * Compatibility layer for existing V1 code
   */
  function createV1CompatibilityLayer() {
    const v2 = window.ConditionalFormattingV2;
    
    // Create bridge that mimics V1 API but uses V2 internally
    const V1Bridge = {
      /**
       * Create rule using V1-style API
       */
      createRule(config) {
        const v2Config = convertV1RuleToV2Config(config);
        return new v2.Rule(v2Config);
      },
      
      /**
       * Apply rules to table using V1-style API
       */
      applyRules(table, rules) {
        const controller = new v2.Controller(table);
        
        for (const rule of rules) {
          const v2Rule = this.createRule(rule);
          controller.addRule(v2Rule.toConfig());
        }
        
        controller.applyFormatting();
        return controller;
      }
    };
    
    // Expose bridge for backward compatibility
    if (typeof window !== 'undefined') {
      window.ConditionalFormattingV1Bridge = V1Bridge;
    }
  }
  
  /**
   * Performance testing utilities
   */
  function createPerformanceTests() {
    const v2 = window.ConditionalFormattingV2;
    
    return {
      /**
       * Test rule evaluation performance
       */
      testRuleEvaluation(controller, iterations = 1000) {
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          controller.applyFormatting();
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        return {
          iterations,
          totalTime,
          averageTime: totalTime / iterations,
          rulesPerSecond: (iterations * 1000) / totalTime
        };
      },
      
      /**
       * Test memory usage
       */
      testMemoryUsage(controller) {
        if (performance.memory) {
          const before = performance.memory.usedJSHeapSize;
          controller.applyFormatting();
          const after = performance.memory.usedJSHeapSize;
          
          return {
            before,
            after,
            difference: after - before,
            formatted: `${Math.round((after - before) / 1024)}KB`
          };
        }
        
        return { error: 'Memory API not available' };
      }
    };
  }
  
  // Initialize when DOM is ready
  if (typeof window !== 'undefined') {
    // Expose main API
    Object.assign(window.ConditionalFormattingV2, {
      initialize: initializeV2System,
      createController: createController,
      migrateFromV1: migrateFromV1,
      createCompatibilityLayer: createV1CompatibilityLayer,
      createPerformanceTests: createPerformanceTests
    });
    
    // Auto-initialize if all components are present
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeV2System, 0);
      });
    } else {
      setTimeout(initializeV2System, 0);
    }
  }
  
  // Node.js support
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initialize: initializeV2System,
      createController: createController,
      migrateFromV1: migrateFromV1
    };
  }
})();

/**
 * Usage Example:
 * 
 * // Basic usage
 * const controller = ConditionalFormattingV2.createController(table);
 * 
 * // Add simple rule
 * controller.addRule({
 *   name: "High Values",
 *   type: ConditionalFormattingV2.RULE_TYPES.SIMPLE,
 *   conditions: [{
 *     column: "給与",
 *     operator: ConditionalFormattingV2.OPERATORS.GREATER_THAN,
 *     value: 5000000,
 *     dataType: ConditionalFormattingV2.DATA_TYPES.NUMBER
 *   }],
 *   format: {
 *     backgroundColor: "#ff0000",
 *     color: "#ffffff"
 *   }
 * });
 * 
 * // Add combined rule (OR logic)
 * controller.addRule({
 *   name: "Tokyo or Osaka",
 *   type: ConditionalFormattingV2.RULE_TYPES.COMBINED,
 *   conditions: [
 *     {
 *       column: "都市",
 *       operator: ConditionalFormattingV2.OPERATORS.EQUALS,
 *       value: "東京",
 *       dataType: ConditionalFormattingV2.DATA_TYPES.TEXT
 *     },
 *     {
 *       column: "都市", 
 *       operator: ConditionalFormattingV2.OPERATORS.EQUALS,
 *       value: "大阪",
 *       dataType: ConditionalFormattingV2.DATA_TYPES.TEXT
 *     }
 *   ],
 *   logicalOperator: ConditionalFormattingV2.LOGICAL_OPERATORS.OR,
 *   format: {
 *     backgroundColor: "#00ff00"
 *   }
 * });
 * 
 * // Apply formatting
 * controller.applyFormatting();
 */