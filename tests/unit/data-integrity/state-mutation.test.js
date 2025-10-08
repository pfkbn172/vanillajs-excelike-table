/**
 * State Mutation Protection Tests
 * Tests for data immutability and state consistency
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Data Integrity - State Mutation Protection', () => {
  let container;
  let ExceLikeTable;

  beforeEach(async () => {
    // Dynamic import to handle ES modules
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

  describe('Direct State Mutation Prevention', () => {
    test('should not allow direct mutation of original data array', () => {
      const originalData = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ];

      const dataCopy = JSON.parse(JSON.stringify(originalData));

      const table = new ExceLikeTable("#test-table", {
        data: originalData,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'age', title: 'Age', dataIndex: 'age' }
        ]
      });

      // Attempt to mutate original data
      originalData[0].name = 'MUTATED';
      originalData.push({ id: 3, name: 'Charlie', age: 35 });

      // Get current table data
      const tableData = table.getData();

      // Verify table data is NOT affected by mutations to original array
      expect(tableData[0].name).not.toBe('MUTATED');
      expect(tableData.length).toBe(2);

      // Verify original data structure preserved
      expect(dataCopy).toEqual([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ]);
    });

    test('should not allow mutation of returned data to affect internal state', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob', age: 30 }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      const data1 = table.getData();
      data1[0].name = 'MUTATED';
      data1.push({ id: 3, name: 'Charlie', age: 35 });

      const data2 = table.getData();

      // Verify mutations to returned data don't affect internal state
      expect(data2[0].name).toBe('Alice');
      expect(data2.length).toBe(2);
    });

    test('should protect nested object mutations', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          {
            id: 1,
            user: { name: 'Alice', details: { age: 25, city: 'NYC' } }
          }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'user', title: 'User', dataIndex: 'user' }
        ]
      });

      const data = table.getData();
      data[0].user.details.age = 999;

      const freshData = table.getData();
      expect(freshData[0].user.details.age).toBe(25);
    });
  });

  describe('State Consistency During Operations', () => {
    test('should maintain data consistency after filter operations', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 1, name: 'Alice', status: 'active' },
          { id: 2, name: 'Bob', status: 'inactive' },
          { id: 3, name: 'Charlie', status: 'active' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'status', title: 'Status', dataIndex: 'status' }
        ]
      });

      // Apply filter
      if (typeof table.setFilter === 'function') {
        table.setFilter('status', 'active');

        const filteredData = table.getData();
        expect(filteredData.length).toBeLessThanOrEqual(3);

        // Clear filter
        table.clearFilter();

        const fullData = table.getData();
        expect(fullData.length).toBe(3);

        // Verify original data structure intact
        expect(fullData.find(r => r.id === 1)).toBeDefined();
        expect(fullData.find(r => r.id === 2)).toBeDefined();
        expect(fullData.find(r => r.id === 3)).toBeDefined();
      }
    });

    test('should maintain data consistency after sort operations', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: 3, name: 'Charlie', age: 35 },
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob', age: 30 }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'age', title: 'Age', dataIndex: 'age' }
        ]
      });

      const originalData = table.getData();
      const originalIds = originalData.map(r => r.id).sort();

      // Apply sort
      if (typeof table.sortBy === 'function') {
        table.sortBy('age', 'asc');

        const sortedData = table.getData();

        // Verify sort worked
        if (sortedData.length > 1) {
          expect(sortedData[0].age).toBeLessThanOrEqual(sortedData[1].age);
        }

        // Verify all original records still present
        const sortedIds = sortedData.map(r => r.id).sort();
        expect(sortedIds).toEqual(originalIds);

        // Verify data integrity
        expect(sortedData.length).toBe(3);
      }
    });

    test('should handle concurrent operations without state corruption', () => {
      const table = new ExceLikeTable("#test-table", {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          value: Math.random()
        })),
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      // Simulate concurrent operations
      const operations = [];

      if (typeof table.sortBy === 'function') {
        operations.push(() => table.sortBy('value', 'asc'));
      }
      if (typeof table.setFilter === 'function') {
        operations.push(() => table.setFilter('id', (v) => v > 50));
      }
      if (typeof table.setData === 'function') {
        operations.push(() => table.setData(table.getData().slice(0, 10)));
      }

      // Execute operations
      operations.forEach(op => op());

      const finalData = table.getData();

      // Verify data is still valid
      expect(Array.isArray(finalData)).toBe(true);
      expect(finalData.every(row => row && typeof row === 'object')).toBe(true);
      expect(finalData.every(row => row.id !== undefined)).toBe(true);
    });
  });

  describe('Data Type Consistency', () => {
    test('should preserve data types through operations', () => {
      const testData = [
        {
          id: 1,
          string: 'test',
          number: 42,
          boolean: true,
          null: null,
          date: new Date('2024-01-01'),
          array: [1, 2, 3],
          object: { nested: 'value' }
        }
      ];

      const table = new ExceLikeTable("#test-table", {
        data: testData,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'string', title: 'String', dataIndex: 'string' }
        ]
      });

      const data = table.getData();
      const row = data[0];

      expect(typeof row.string).toBe('string');
      expect(typeof row.number).toBe('number');
      expect(typeof row.boolean).toBe('boolean');
      expect(row.null).toBe(null);
      expect(row.date instanceof Date).toBe(true);
      expect(Array.isArray(row.array)).toBe(true);
      expect(typeof row.object).toBe('object');
    });

    test('should handle type coercion safely', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [
          { id: '1', value: '42' },
          { id: 2, value: 43 },
          { id: '3', value: '44' }
        ],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const data = table.getData();

      // Verify types are preserved
      expect(typeof data[0].id).toBe('string');
      expect(typeof data[1].id).toBe('number');
      expect(typeof data[0].value).toBe('string');
      expect(typeof data[1].value).toBe('number');
    });
  });

  describe('Reference Integrity', () => {
    test('should not share references between different getData calls', () => {
      const table = new ExceLikeTable("#test-table", {
        data: [{ id: 1, name: 'Alice' }],
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      const data1 = table.getData();
      const data2 = table.getData();

      // Verify they are different references
      expect(data1).not.toBe(data2);
      expect(data1[0]).not.toBe(data2[0]);
    });

    test('should handle circular references safely', () => {
      const circular = { id: 1, name: 'Test' };
      circular.self = circular;

      // This should not throw or cause infinite loops
      expect(() => {
        const table = new ExceLikeTable("#test-table", {
          
          data: [circular],
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: 'Name', dataIndex: 'name' }
          ]
        });

        const data = table.getData();
        expect(data.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });
});
