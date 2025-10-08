/**
 * Boundary Conditions Tests
 * Tests for edge cases and boundary values
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Data Integrity - Boundary Conditions', () => {
  let container;
  let ExceLikeTable;

  beforeEach(async () => {
    const module = await import('../../../src/ExceLikeTable.js');
    ExceLikeTable = module.default;

    container = document.createElement('div');
    container.id = 'test-table';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Data Array Boundaries', () => {
    test('should handle empty data array', () => {
      expect(() => {
        const table = new ExceLikeTable('#test-table', {
          data: [],
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' }
          ]
        });

        const data = table.getData();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
      }).not.toThrow();
    });

    test('should handle null data', () => {
      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: null,
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' }
          ]
        });

        const data = table.getData();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
      }).not.toThrow();
    });

    test('should handle undefined data', () => {
      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: undefined,
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' }
          ]
        });

        const data = table.getData();
        expect(Array.isArray(data)).toBe(true);
      }).not.toThrow();
    });

    test('should handle single row data', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [{ id: 1, name: 'Single' }],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      const data = table.getData();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(1);
    });

    test('should handle large dataset', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        value: Math.random()
      }));

      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: largeData,
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: 'Name', dataIndex: 'name' }
          ]
        });

        const data = table.getData();
        expect(data.length).toBe(10000);
      }).not.toThrow();
    });
  });

  describe('Numeric Boundaries', () => {
    test('should handle zero values', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 0, value: 0, negative: -0 }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();
      expect(data[0].id).toBe(0);
      expect(data[0].value).toBe(0);
    });

    test('should handle Infinity', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, positive: Infinity, negative: -Infinity }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'positive', title: 'Positive', dataIndex: 'positive' }
        ]
      });

      const data = table.getData();
      expect(data[0].positive).toBe(Infinity);
      expect(data[0].negative).toBe(-Infinity);
    });

    test('should handle NaN values', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, value: NaN }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();
      expect(Number.isNaN(data[0].value)).toBe(true);
    });

    test('should handle very large numbers', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, value: Number.MAX_SAFE_INTEGER },
          { id: 2, value: Number.MIN_SAFE_INTEGER },
          { id: 3, value: 1e308 }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();
      expect(data[0].value).toBe(Number.MAX_SAFE_INTEGER);
      expect(data[1].value).toBe(Number.MIN_SAFE_INTEGER);
    });

    test('should handle floating point precision', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, value: 0.1 + 0.2 }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();
      // Floating point precision should be preserved
      expect(data[0].value).toBeCloseTo(0.3, 10);
    });
  });

  describe('String Boundaries', () => {
    test('should handle empty strings', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, name: '', value: '' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      const data = table.getData();
      expect(data[0].name).toBe('');
      expect(data[0].value).toBe('');
    });

    test('should handle Unicode characters', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, emoji: '🎉😀🚀', japanese: 'こんにちは', chinese: '你好' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'emoji', title: 'Emoji', dataIndex: 'emoji' }
        ]
      });

      const data = table.getData();
      expect(data[0].emoji).toBe('🎉😀🚀');
      expect(data[0].japanese).toBe('こんにちは');
      expect(data[0].chinese).toBe('你好');
    });

    test('should handle RTL text', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, arabic: 'مرحبا', hebrew: 'שלום' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'arabic', title: 'Arabic', dataIndex: 'arabic' }
        ]
      });

      const data = table.getData();
      expect(data[0].arabic).toBe('مرحبا');
      expect(data[0].hebrew).toBe('שלום');
    });

    test('should handle very long strings', () => {
      const longString = 'x'.repeat(10000);

      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, text: longString }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'text', title: 'Text', dataIndex: 'text' }
        ]
      });

      const data = table.getData();
      expect(data[0].text.length).toBe(10000);
    });

    test('should handle special characters', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, special: '\n\r\t\0\\"\'' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'special', title: 'Special', dataIndex: 'special' }
        ]
      });

      const data = table.getData();
      expect(data[0].special).toBe('\n\r\t\0\\"\'');
    });
  });

  describe('Date Boundaries', () => {
    test('should handle valid dates', () => {
      const date = new Date('2024-01-01');

      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, date: date }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'date', title: 'Date', dataIndex: 'date' }
        ]
      });

      const data = table.getData();
      expect(data[0].date instanceof Date).toBe(true);
      expect(data[0].date.getTime()).toBe(date.getTime());
    });

    test('should handle epoch date', () => {
      const epoch = new Date('1970-01-01T00:00:00.000Z');

      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, date: epoch }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'date', title: 'Date', dataIndex: 'date' }
        ]
      });

      const data = table.getData();
      expect(data[0].date.getTime()).toBe(0);
    });

    test('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29');

      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, date: leapDay }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'date', title: 'Date', dataIndex: 'date' }
        ]
      });

      const data = table.getData();
      expect(data[0].date instanceof Date).toBe(true);
    });

    test('should handle invalid date strings', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, dateStr: 'not a date', invalidDate: '2024-02-30' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'dateStr', title: 'Date String', dataIndex: 'dateStr' }
        ]
      });

      const data = table.getData();
      expect(data[0].dateStr).toBe('not a date');
      expect(data[0].invalidDate).toBe('2024-02-30');
    });
  });

  describe('Object Boundaries', () => {
    test('should handle malformed objects', () => {
      const obj = Object.create(null); // No prototype
      obj.id = 1;
      obj.value = 'test';

      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: [obj],
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'value', title: 'Value', dataIndex: 'value' }
          ]
        });

        const data = table.getData();
        expect(data.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    test('should handle objects with Symbol keys', () => {
      const sym = Symbol('test');
      const obj = { id: 1, [sym]: 'symbol value' };

      const table = new ExceLikeTable("#test-table", {
        data: [obj],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' }
        ]
      });

      const data = table.getData();
      expect(data[0].id).toBe(1);
    });

    test('should handle deeply nested objects', () => {
      const deep = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };

      const table = new ExceLikeTable("#test-table", {
        data: [{ id: 1, nested: deep }],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'nested', title: 'Nested', dataIndex: 'nested' }
        ]
      });

      const data = table.getData();
      expect(data[0].nested.level1.level2.level3.level4.level5).toBe('deep');
    });

    test('should handle objects with getters/setters', () => {
      const obj = {
        id: 1,
        _value: 42,
        get value() { return this._value; },
        set value(v) { this._value = v; }
      };

      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: [obj],
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'value', title: 'Value', dataIndex: 'value' }
          ]
        });

        const data = table.getData();
        expect(data.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  describe('Array Boundaries', () => {
    test('should handle empty arrays in data', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, tags: [] }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'tags', title: 'Tags', dataIndex: 'tags' }
        ]
      });

      const data = table.getData();
      expect(Array.isArray(data[0].tags)).toBe(true);
      expect(data[0].tags.length).toBe(0);
    });

    test('should handle sparse arrays', () => {
      const sparse = [1, , , 4]; // eslint-disable-line no-sparse-arrays

      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, sparse: sparse }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'sparse', title: 'Sparse', dataIndex: 'sparse' }
        ]
      });

      const data = table.getData();
      expect(data[0].sparse.length).toBe(4);
    });

    test('should handle nested arrays', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, matrix: [[1, 2], [3, 4]] }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'matrix', title: 'Matrix', dataIndex: 'matrix' }
        ]
      });

      const data = table.getData();
      expect(data[0].matrix[0][1]).toBe(2);
      expect(data[0].matrix[1][0]).toBe(3);
    });
  });

  describe('Mixed Type Boundaries', () => {
    test('should handle rows with different structures', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob' }, // Missing age
          { id: 3, age: 30 }, // Missing name
          { id: 4, name: 'Charlie', age: 35, extra: 'data' } // Extra field
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'age', title: 'Age', dataIndex: 'age' }
        ]
      });

      const data = table.getData();
      expect(data.length).toBe(4);
      expect(data[1].age).toBeUndefined();
      expect(data[2].name).toBeUndefined();
      expect(data[3].extra).toBe('data');
    });

    test('should handle null and undefined values in same field', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, value: null },
          { id: 2, value: undefined },
          { id: 3, value: 'actual value' },
          { id: 4 } // Missing value field entirely
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();
      expect(data[0].value).toBe(null);
      expect(data[1].value).toBeUndefined();
      expect(data[2].value).toBe('actual value');
      expect(data[3].value).toBeUndefined();
    });
  });
});
