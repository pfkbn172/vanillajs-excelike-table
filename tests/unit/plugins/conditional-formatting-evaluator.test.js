/**
 * Conditional Formatting Evaluator Unit Tests
 * Tests for rule evaluation and comparison logic
 */


// Define evaluator class inline for testing
class ConditionalFormattingEvaluator {
  evaluate(cellValue, rule) {
    if (!rule.enabled) {
      return false;
    }

    try {
      const { operator, value, dataType } = rule.condition;
      const convertedCellValue = this._convertValue(cellValue, dataType);
      const convertedRuleValue = this._convertValue(value, dataType);

      return this._performComparison(convertedCellValue, convertedRuleValue, operator);
    } catch (error) {
      return false;
    }
  }

  _convertValue(value, dataType) {
    if (value === null || value === undefined) {
      return '';
    }

    switch (dataType) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;

      case 'text':
        return String(value);

      case 'date':
        if (value instanceof Date) {
          return value;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date(0) : date;

      default:
        return String(value);
    }
  }

  _performComparison(cellValue, ruleValue, operator) {
    switch (operator) {
      case 'equals':
        return this._compareEquals(cellValue, ruleValue);

      case 'greater-equal':
        return this._compareGreaterEqual(cellValue, ruleValue);

      case 'less-equal':
        return this._compareLessEqual(cellValue, ruleValue);

      case 'contains':
        return this._compareContains(cellValue, ruleValue);

      case 'not-contains':
        return this._compareNotContains(cellValue, ruleValue);

      default:
        throw new Error(`未対応の演算子: ${operator}`);
    }
  }

  _compareEquals(cellValue, ruleValue) {
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() === ruleValue.getTime();
    }
    return cellValue === ruleValue;
  }

  _compareGreaterEqual(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue >= ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() >= ruleValue.getTime();
    }
    return String(cellValue) >= String(ruleValue);
  }

  _compareLessEqual(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue <= ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() <= ruleValue.getTime();
    }
    return String(cellValue) <= String(ruleValue);
  }

  _compareContains(cellValue, ruleValue) {
    const cellStr = String(cellValue).toLowerCase();
    const ruleStr = String(ruleValue).toLowerCase();
    return cellStr.includes(ruleStr);
  }

  _compareNotContains(cellValue, ruleValue) {
    const cellStr = String(cellValue).toLowerCase();
    const ruleStr = String(ruleValue).toLowerCase();
    return !cellStr.includes(ruleStr);
  }
}

describe('Conditional Formatting Evaluator', () => {
  let evaluator;

  beforeEach(() => {
    evaluator = new ConditionalFormattingEvaluator();
  });

  describe('Rule evaluation', () => {
    test('should return false for disabled rules', () => {
      const rule = {
        enabled: false,
        condition: { operator: 'equals', value: 10, dataType: 'number' }
      };

      const result = evaluator.evaluate(10, rule);
      expect(result).toBe(false);
    });

    test('should evaluate enabled rules', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: 10, dataType: 'number' }
      };

      const result = evaluator.evaluate(10, rule);
      expect(result).toBe(true);
    });

    test('should return false on evaluation error', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'invalid-operator', value: 10, dataType: 'number' }
      };

      const result = evaluator.evaluate(10, rule);
      expect(result).toBe(false);
    });
  });

  describe('Value conversion - number', () => {
    test('should convert numeric values', () => {
      expect(evaluator._convertValue(123, 'number')).toBe(123);
      expect(evaluator._convertValue('456', 'number')).toBe(456);
      expect(evaluator._convertValue('123.45', 'number')).toBe(123.45);
    });

    test('should convert invalid numbers to 0', () => {
      expect(evaluator._convertValue('abc', 'number')).toBe(0);
      expect(evaluator._convertValue('', 'number')).toBe(0);
    });

    test('should handle null/undefined as 0', () => {
      expect(evaluator._convertValue(null, 'number')).toBe('');
      expect(evaluator._convertValue(undefined, 'number')).toBe('');
    });
  });

  describe('Value conversion - text', () => {
    test('should convert to string', () => {
      expect(evaluator._convertValue(123, 'text')).toBe('123');
      expect(evaluator._convertValue('hello', 'text')).toBe('hello');
      expect(evaluator._convertValue(true, 'text')).toBe('true');
    });

    test('should handle null/undefined', () => {
      expect(evaluator._convertValue(null, 'text')).toBe('');
      expect(evaluator._convertValue(undefined, 'text')).toBe('');
    });
  });

  describe('Value conversion - date', () => {
    test('should preserve Date objects', () => {
      const date = new Date('2024-01-15');
      const result = evaluator._convertValue(date, 'date');
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(date.getTime());
    });

    test('should parse date strings', () => {
      const result = evaluator._convertValue('2024-01-15', 'date');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    test('should handle invalid dates', () => {
      const result = evaluator._convertValue('invalid-date', 'date');
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(new Date(0).getTime());
    });
  });

  describe('Equals comparison', () => {
    test('should compare numbers', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: 100, dataType: 'number' }
      };

      expect(evaluator.evaluate(100, rule)).toBe(true);
      expect(evaluator.evaluate(99, rule)).toBe(false);
      expect(evaluator.evaluate(101, rule)).toBe(false);
    });

    test('should compare text', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: 'test', dataType: 'text' }
      };

      expect(evaluator.evaluate('test', rule)).toBe(true);
      expect(evaluator.evaluate('Test', rule)).toBe(false); // Case sensitive
      expect(evaluator.evaluate('other', rule)).toBe(false);
    });

    test('should compare dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-15');
      const date3 = new Date('2024-01-16');

      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: date1, dataType: 'date' }
      };

      expect(evaluator.evaluate(date2, rule)).toBe(true);
      expect(evaluator.evaluate(date3, rule)).toBe(false);
    });
  });

  describe('Greater-equal comparison', () => {
    test('should compare numbers', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'greater-equal', value: 100, dataType: 'number' }
      };

      expect(evaluator.evaluate(100, rule)).toBe(true);
      expect(evaluator.evaluate(101, rule)).toBe(true);
      expect(evaluator.evaluate(99, rule)).toBe(false);
    });

    test('should compare dates', () => {
      const baseDate = new Date('2024-01-15');
      const laterDate = new Date('2024-01-16');
      const earlierDate = new Date('2024-01-14');

      const rule = {
        enabled: true,
        condition: { operator: 'greater-equal', value: baseDate, dataType: 'date' }
      };

      expect(evaluator.evaluate(baseDate, rule)).toBe(true);
      expect(evaluator.evaluate(laterDate, rule)).toBe(true);
      expect(evaluator.evaluate(earlierDate, rule)).toBe(false);
    });

    test('should compare text lexicographically', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'greater-equal', value: 'apple', dataType: 'text' }
      };

      expect(evaluator.evaluate('apple', rule)).toBe(true);
      expect(evaluator.evaluate('banana', rule)).toBe(true);
      expect(evaluator.evaluate('aardvark', rule)).toBe(false);
    });
  });

  describe('Less-equal comparison', () => {
    test('should compare numbers', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'less-equal', value: 100, dataType: 'number' }
      };

      expect(evaluator.evaluate(100, rule)).toBe(true);
      expect(evaluator.evaluate(99, rule)).toBe(true);
      expect(evaluator.evaluate(101, rule)).toBe(false);
    });

    test('should compare dates', () => {
      const baseDate = new Date('2024-01-15');
      const laterDate = new Date('2024-01-16');
      const earlierDate = new Date('2024-01-14');

      const rule = {
        enabled: true,
        condition: { operator: 'less-equal', value: baseDate, dataType: 'date' }
      };

      expect(evaluator.evaluate(baseDate, rule)).toBe(true);
      expect(evaluator.evaluate(earlierDate, rule)).toBe(true);
      expect(evaluator.evaluate(laterDate, rule)).toBe(false);
    });

    test('should compare text lexicographically', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'less-equal', value: 'banana', dataType: 'text' }
      };

      expect(evaluator.evaluate('banana', rule)).toBe(true);
      expect(evaluator.evaluate('apple', rule)).toBe(true);
      expect(evaluator.evaluate('cherry', rule)).toBe(false);
    });
  });

  describe('Contains comparison', () => {
    test('should find substring (case insensitive)', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'contains', value: 'test', dataType: 'text' }
      };

      expect(evaluator.evaluate('testing', rule)).toBe(true);
      expect(evaluator.evaluate('This is a TEST', rule)).toBe(true);
      expect(evaluator.evaluate('CONTEST', rule)).toBe(true);
      expect(evaluator.evaluate('other', rule)).toBe(false);
    });

    test('should handle numeric values', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'contains', value: '12', dataType: 'text' }
      };

      expect(evaluator.evaluate(123, rule)).toBe(true);
      expect(evaluator.evaluate(456, rule)).toBe(false);
    });

    test('should handle empty search', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'contains', value: '', dataType: 'text' }
      };

      expect(evaluator.evaluate('anything', rule)).toBe(true);
    });
  });

  describe('Not-contains comparison', () => {
    test('should reject substring (case insensitive)', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'not-contains', value: 'test', dataType: 'text' }
      };

      expect(evaluator.evaluate('testing', rule)).toBe(false);
      expect(evaluator.evaluate('This is a TEST', rule)).toBe(false);
      expect(evaluator.evaluate('CONTEST', rule)).toBe(false);
      expect(evaluator.evaluate('other', rule)).toBe(true);
    });

    test('should handle numeric values', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'not-contains', value: '12', dataType: 'text' }
      };

      expect(evaluator.evaluate(123, rule)).toBe(false);
      expect(evaluator.evaluate(456, rule)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle string numbers in numeric comparisons', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'greater-equal', value: '100', dataType: 'number' }
      };

      expect(evaluator.evaluate('150', rule)).toBe(true);
      expect(evaluator.evaluate('50', rule)).toBe(false);
    });

    test('should handle date strings', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: '2024-01-15', dataType: 'date' }
      };

      expect(evaluator.evaluate('2024-01-15', rule)).toBe(true);
    });

    test('should handle boundary values', () => {
      const rule = {
        enabled: true,
        condition: { operator: 'equals', value: 0, dataType: 'number' }
      };

      expect(evaluator.evaluate(0, rule)).toBe(true);
      expect(evaluator.evaluate('0', rule)).toBe(true);
    });
  });
});
