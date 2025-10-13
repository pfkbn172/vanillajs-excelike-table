/**
 * Filter Module Unit Tests
 * Tests for filtering logic (pure functions only, no DOM)
 */

import FilterModule from '../../src/filter-module.js';

describe('Filter Module', () => {

  describe('applyTextFilter', () => {
    test('should return true for empty filter', () => {
      const result = FilterModule.applyTextFilter('value', '');
      expect(result).toBe(true);
    });

    test('should return true for null filter', () => {
      const result = FilterModule.applyTextFilter('value', null);
      expect(result).toBe(true);
    });

    test('should return true for empty array filter', () => {
      const result = FilterModule.applyTextFilter('value', []);
      expect(result).toBe(true);
    });

    test('should match case-insensitively', () => {
      expect(FilterModule.applyTextFilter('Hello World', 'hello')).toBe(true);
      expect(FilterModule.applyTextFilter('Hello World', 'WORLD')).toBe(true);
      expect(FilterModule.applyTextFilter('Hello World', 'HeLLo')).toBe(true);
    });

    test('should match substring', () => {
      expect(FilterModule.applyTextFilter('test@example.com', 'example')).toBe(true);
      expect(FilterModule.applyTextFilter('user123', '123')).toBe(true);
    });

    test('should not match when filter not found', () => {
      expect(FilterModule.applyTextFilter('Hello', 'Goodbye')).toBe(false);
      expect(FilterModule.applyTextFilter('test', 'xyz')).toBe(false);
    });

    test('should handle null/undefined values', () => {
      expect(FilterModule.applyTextFilter(null, 'test')).toBe(false);
      expect(FilterModule.applyTextFilter(undefined, 'test')).toBe(false);
    });

    test('should match any value in array filter', () => {
      expect(FilterModule.applyTextFilter('Apple', ['apple', 'banana'])).toBe(true);
      expect(FilterModule.applyTextFilter('Banana Smoothie', ['apple', 'banana'])).toBe(true);
    });

    test('should not match if none of array values match', () => {
      expect(FilterModule.applyTextFilter('Orange', ['apple', 'banana'])).toBe(false);
    });

    test('should convert non-string values to string', () => {
      expect(FilterModule.applyTextFilter(12345, '123')).toBe(true);
      expect(FilterModule.applyTextFilter(true, 'true')).toBe(true);
    });
  });

  describe('applyRangeFilter', () => {
    test('should return true for null/undefined filter', () => {
      expect(FilterModule.applyRangeFilter(50, null)).toBe(true);
      expect(FilterModule.applyRangeFilter(50, undefined)).toBe(true);
    });

    test('should filter by minimum value', () => {
      const filter = { min: 10 };
      expect(FilterModule.applyRangeFilter(15, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(10, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(5, filter)).toBe(false);
    });

    test('should filter by maximum value', () => {
      const filter = { max: 100 };
      expect(FilterModule.applyRangeFilter(50, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(100, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(150, filter)).toBe(false);
    });

    test('should filter by min and max range', () => {
      const filter = { min: 10, max: 100 };
      expect(FilterModule.applyRangeFilter(50, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(10, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(100, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(5, filter)).toBe(false);
      expect(FilterModule.applyRangeFilter(150, filter)).toBe(false);
    });

    test('should return false for non-numeric values', () => {
      const filter = { min: 10, max: 100 };
      expect(FilterModule.applyRangeFilter('abc', filter)).toBe(false);
      expect(FilterModule.applyRangeFilter(null, filter)).toBe(false);
      expect(FilterModule.applyRangeFilter(undefined, filter)).toBe(false);
    });

    test('should handle string numbers', () => {
      const filter = { min: 10, max: 100 };
      expect(FilterModule.applyRangeFilter('50', filter)).toBe(true);
      expect(FilterModule.applyRangeFilter('5', filter)).toBe(false);
    });

    test('should handle decimal values', () => {
      const filter = { min: 10.5, max: 100.5 };
      expect(FilterModule.applyRangeFilter(50.7, filter)).toBe(true);
      expect(FilterModule.applyRangeFilter(10.4, filter)).toBe(false);
      expect(FilterModule.applyRangeFilter(100.6, filter)).toBe(false);
    });
  });

  describe('applyDateHierarchyFilter', () => {
    test('should return true for null/undefined filter', () => {
      expect(FilterModule.applyDateHierarchyFilter('2025-10-10', null)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-10-10', undefined)).toBe(true);
    });

    test('should return true for null/undefined value', () => {
      const filter = { years: [2025] };
      expect(FilterModule.applyDateHierarchyFilter(null, filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter(undefined, filter)).toBe(true);
    });

    test('should return false for invalid date', () => {
      const filter = { years: [2025] };
      expect(FilterModule.applyDateHierarchyFilter('invalid-date', filter)).toBe(false);
    });

    test('should filter by years', () => {
      const filter = { years: [2024, 2025] };
      expect(FilterModule.applyDateHierarchyFilter('2024-01-01', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-12-31', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2023-06-15', filter)).toBe(false);
    });

    test('should filter by months', () => {
      const filter = { months: ['2025-1', '2025-2'] };
      expect(FilterModule.applyDateHierarchyFilter('2025-01-15', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-02-20', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-03-10', filter)).toBe(false);
    });

    test('should filter by days', () => {
      const filter = { days: ['2025-10-1', '2025-10-15'] };
      expect(FilterModule.applyDateHierarchyFilter('2025-10-01', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-10-15', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-10-10', filter)).toBe(false);
    });

    test('should filter by combined criteria (years and months)', () => {
      const filter = {
        years: [2025],
        months: ['2025-10', '2025-11']
      };
      expect(FilterModule.applyDateHierarchyFilter('2025-10-15', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-11-20', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-12-01', filter)).toBe(false);
      expect(FilterModule.applyDateHierarchyFilter('2024-10-15', filter)).toBe(false);
    });

    test('should filter by all criteria (years, months, days)', () => {
      const filter = {
        years: [2025],
        months: ['2025-10'],
        days: ['2025-10-10', '2025-10-20']
      };
      expect(FilterModule.applyDateHierarchyFilter('2025-10-10', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-10-20', filter)).toBe(true);
      expect(FilterModule.applyDateHierarchyFilter('2025-10-15', filter)).toBe(false);
    });

    test('should handle Date objects', () => {
      const filter = { years: [2025] };
      const date = new Date('2025-10-10');
      expect(FilterModule.applyDateHierarchyFilter(date, filter)).toBe(true);
    });
  });

  describe('applyFilters', () => {
    const testData = [
      { id: 1, name: 'Alice', age: 25, status: 'active' },
      { id: 2, name: 'Bob', age: 30, status: 'inactive' },
      { id: 3, name: 'Charlie', age: 35, status: 'active' }
    ];

    const columns = [
      { dataIndex: 'id', key: 'id' },
      { dataIndex: 'name', key: 'name' },
      { dataIndex: 'age', key: 'age', filterType: 'range' },
      { dataIndex: 'status', key: 'status' }
    ];

    test('should return all data when no filters', () => {
      const result = FilterModule.applyFilters(testData, {}, columns);
      expect(result).toEqual(testData);
    });

    test('should return all data when filters is null', () => {
      const result = FilterModule.applyFilters(testData, null, columns);
      expect(result).toEqual(testData);
    });

    test('should filter by text', () => {
      const filters = { name: 'alice' };
      const result = FilterModule.applyFilters(testData, filters, columns);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    test('should filter by range', () => {
      const filters = { age: { min: 28, max: 35 } };
      const result = FilterModule.applyFilters(testData, filters, columns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['Bob', 'Charlie']);
    });

    test('should apply multiple filters (AND logic)', () => {
      const filters = {
        status: 'active',
        age: { min: 35 } // Changed from 30 to 35 to exclude Bob
      };
      const result = FilterModule.applyFilters(testData, filters, columns);
      // Should match: Charlie (age 35, status active)
      // Should NOT match: Bob (age 30, status inactive), Alice (age 25, status active)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie');
    });

    test('should use custom filter function if provided', () => {
      const columnsWithCustomFilter = [
        {
          dataIndex: 'age',
          key: 'age',
          onFilter: (filterValue, record) => record.age >= filterValue
        }
      ];

      const filters = { age: 30 };
      const result = FilterModule.applyFilters(testData, filters, columnsWithCustomFilter);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['Bob', 'Charlie']);
    });

    test('should handle empty result', () => {
      const filters = { name: 'nonexistent' };
      const result = FilterModule.applyFilters(testData, filters, columns);
      expect(result).toHaveLength(0);
    });

    test('should filter with date hierarchy', () => {
      const dateData = [
        { id: 1, date: '2024-01-15' },
        { id: 2, date: '2025-01-15' },
        { id: 3, date: '2025-02-20' }
      ];

      const dateColumns = [
        { dataIndex: 'date', key: 'date', filterType: 'date-hierarchy' }
      ];

      const filters = { date: { years: [2025] } };
      const result = FilterModule.applyFilters(dateData, filters, dateColumns);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual([2, 3]);
    });
  });
});
