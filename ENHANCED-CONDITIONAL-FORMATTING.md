# 🎯 Enhanced Conditional Formatting Architecture

## Overview

The enhanced conditional formatting system provides a complete architectural redesign that addresses the limitations of the original mixed-concept ConditionTypes system. Instead of combining different concepts into a single type system, the new architecture properly separates:

- **Condition Complexity** (how conditions are structured)  
- **Target Scope** (where formatting is applied)
- **Extended Logical Operations** (how conditions are combined)

## 🏗️ Architecture Separation

### Original Problem
The original `ConditionTypes` mixed different concepts:
- `MultipleColumns` = number of conditions (complexity)
- `EntireRow` = target scope (where to apply)

### Enhanced Solution
**Separated into independent axes:**

#### 1. Condition Types (Complexity)
```javascript
CONDITION_TYPES = {
  SIMPLE: 'simple',         // Single condition: sales > 10000
  COMBINED: 'combined',     // Multiple conditions with logical operators
  FORMULA: 'formula'        // Custom formula: (sales - cost) / sales > 0.3
}
```

#### 2. Target Scopes (Application Range)
```javascript
TARGET_SCOPES = {
  CELL: 'cell',           // Apply to condition-matching cells only
  ROW: 'row',             // Apply to entire row when condition matches
  COLUMN: 'column',       // Apply to entire column (future feature)
  CUSTOM: 'custom'        // Custom range (future feature)
}
```

#### 3. Logical Operators (Extended)
```javascript
LOGICAL_OPERATORS = {
  AND: { value: 'and', label: 'AND（すべて一致）', symbol: '∧' },
  OR: { value: 'or', label: 'OR（いずれか一致）', symbol: '∨' },
  XOR: { value: 'xor', label: 'XOR（1つだけ一致）', symbol: '⊕' },
  NAND: { value: 'nand', label: 'NAND（すべて不一致）', symbol: '↑' },
  NOR: { value: 'nor', label: 'NOR（いずれも不一致）', symbol: '↓' }
}
```

## 🧩 Enhanced Components

### 1. Enhanced UI Manager (`enhanced-ui-manager.js`)
- **Separated UI Sections**: Condition Type, Target Scope, Format Settings
- **Dynamic Form Generation**: UI adapts based on selected condition type
- **Real-time Preview**: Shows how conditions will be applied
- **Logical Operator Selector**: Visual selection of AND, OR, XOR, NAND, NOR

**Key Features:**
```javascript
// Clean separation of concerns
createConditionTypeSelector()  // Choose simple/combined/formula
createTargetScopeSelector()   // Choose cell/row/column/custom
createLogicalOperatorSelector() // Choose AND/OR/XOR/NAND/NOR
```

### 2. Enhanced Rule Engine (`enhanced-rule-engine.js`)
- **Advanced Logical Evaluation**: Support for all 5 logical operators
- **Performance Caching**: Evaluation result caching for improved performance
- **Formula Support**: Custom JavaScript formula evaluation
- **Backward Compatibility**: Automatic legacy rule conversion

**Key Features:**
```javascript
// All logical operators supported
evaluateLogicalOperator(results, operator)
// XOR: exactly one condition true
// NAND: not all conditions true  
// NOR: no conditions true

// Performance optimization
evaluationCache // 5-second result caching
clearCache()     // Manual cache management
```

### 3. Enhanced Rule Class (`types.js`)
- **Factory Methods**: Easy rule creation with `createSimple()`, `createCombined()`, `createFormula()`
- **Comprehensive Validation**: Rule validation with detailed error reporting
- **Legacy Conversion**: Automatic conversion between old and new formats

**Usage Examples:**
```javascript
// Simple condition rule
const rule1 = EnhancedConditionalFormattingRule.createSimple(
  'sales', 'greaterThan', 10000, 
  { backgroundColor: '#e8f5e8', color: '#2e7d2e' }
);

// Combined conditions with XOR
const rule2 = EnhancedConditionalFormattingRule.createCombined(
  [
    { column: 'status', operator: 'equals', value: 'In Progress' },
    { column: 'assignee', operator: 'isEmpty', value: '' }
  ],
  'xor', // Exactly one condition must be true
  { backgroundColor: '#fff3cd', color: '#856404' }
);

// Formula-based rule
const rule3 = EnhancedConditionalFormattingRule.createFormula(
  '(sales - cost) / sales > 0.3', // Profit margin > 30%
  ['sales'], 
  { backgroundColor: '#d1ecf1', color: '#0c5460' }
);
```

## 🎨 Practical Examples

### Example 1: Simple Condition
**Requirement**: Highlight cells where sales > 100,000
```javascript
{
  conditionType: 'simple',
  conditions: [{ column: 'sales', operator: 'greaterThan', value: 100000 }],
  targetScope: 'cell',
  format: { backgroundColor: '#e8f5e8', color: '#2e7d2e' }
}
```

### Example 2: Combined AND Condition
**Requirement**: Highlight where priority = "High" AND status ≠ "Complete"
```javascript
{
  conditionType: 'combined',
  conditions: [
    { column: 'priority', operator: 'equals', value: 'High' },
    { column: 'status', operator: 'notEquals', value: 'Complete' }
  ],
  logicalOperator: 'and',
  targetScope: 'row',
  format: { backgroundColor: '#ffebee', color: '#c62828' }
}
```

### Example 3: XOR Condition
**Requirement**: Highlight when task is "In Progress" OR has no assignee (but not both)
```javascript
{
  conditionType: 'combined',
  conditions: [
    { column: 'status', operator: 'equals', value: 'In Progress' },
    { column: 'assignee', operator: 'isEmpty', value: '' }
  ],
  logicalOperator: 'xor', // Exactly one must be true
  targetScope: 'row',
  format: { backgroundColor: '#fff3cd', color: '#856404' }
}
```

### Example 4: Formula Condition
**Requirement**: Highlight rows where profit margin > 30%
```javascript
{
  conditionType: 'formula',
  conditions: [{ formula: '(sales - cost) / sales > 0.3' }],
  targetScope: 'row',
  format: { backgroundColor: '#d1ecf1', color: '#0c5460' }
}
```

## 🔧 Integration

### HTML Integration
```html
<!-- Enhanced Components -->
<script src="src/plugins/conditional-formatting/enhanced-ui-manager.js"></script>
<script src="src/plugins/conditional-formatting/enhanced-rule-engine.js"></script>
```

### Context Menu Integration
The enhanced dialog is automatically available in the context menu when enhanced components are loaded:

- Right-click on any table cell
- Select "Conditional Formatting" > **"New Rule (Enhanced)..."**
- The enhanced dialog opens with separated condition/scope configuration

### API Usage
```javascript
// Access enhanced components through main plugin
const plugin = table.pluginInstances['conditional-formatting'];

// Open enhanced dialog
plugin.showEnhancedDialog();

// Check if enhanced components are available
if (plugin.hasEnhancedComponents) {
  // Use enhanced features
  const rule = plugin.enhancedRuleEngine.addRule(enhancedRule);
}
```

## 🧪 Testing

Use the test file to verify integration:
```html
<!-- Open in browser -->
test-enhanced-integration.html
```

**Test Features:**
- ✅ Enhanced dialog opens correctly
- ✅ All logical operators function properly
- ✅ Context menu shows enhanced option
- ✅ Backward compatibility maintained
- ✅ Real-time preview updates

## 🎯 Benefits

### 1. **Proper Design Separation**
- Clear distinction between condition complexity and application scope
- Independent configuration of each aspect
- Extensible architecture for future features

### 2. **Extended Logical Operations**
- Full Boolean logic support (AND, OR, XOR, NAND, NOR)
- Complex business rule implementation
- Mathematical precision in condition evaluation

### 3. **Enhanced User Experience**
- Intuitive UI with separated configuration sections
- Real-time preview of formatting rules
- Clear descriptions for all operators and options

### 4. **Performance Optimizations**
- Result caching for frequently evaluated conditions
- Efficient rule engine with batch processing
- Minimal DOM manipulation

### 5. **Future-Proof Architecture**
- Easy addition of new condition types
- Extensible target scope system
- Plugin-based formula evaluation

## 📚 Migration Guide

### From Legacy to Enhanced
```javascript
// Old mixed format
{
  type: 'multipleColumns', // Mixed concept
  conditions: [...],
  applicationScope: 'row'
}

// New separated format
{
  conditionType: 'combined',  // Condition complexity
  targetScope: 'row',        // Application scope
  logicalOperator: 'and',    // How to combine conditions
  conditions: [...]
}
```

### Backward Compatibility
All existing rules continue to work - the system automatically converts legacy formats to the enhanced format internally while maintaining the original behavior.

## 🎉 Conclusion

The enhanced conditional formatting architecture provides a robust, extensible, and user-friendly foundation for complex business rule implementation. By properly separating concerns and extending logical capabilities, it enables sophisticated conditional formatting scenarios while maintaining backward compatibility and performance.