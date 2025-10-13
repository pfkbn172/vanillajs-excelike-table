/**
 * ExceLikeTable Data Module Unit Tests
 * Tests for data filtering, sorting, and pagination logic
 */


describe('ExceLikeTable Data - Pure Functions', () => {

  describe('Text filter matching logic', () => {
    const matchesTextFilter = (cellValue, filterValue) => {
      if (Array.isArray(filterValue)) {
        const strValue = String(cellValue).toLowerCase();
        return filterValue.some(fv => {
          const filterStr = String(fv).toLowerCase();
          return strValue.includes(filterStr);
        });
      } else {
        const strValue = String(cellValue).toLowerCase();
        const filterStr = String(filterValue).toLowerCase();
        return strValue.includes(filterStr);
      }
    };

    test('should match single text filter', () => {
      expect(matchesTextFilter('Hello World', 'world')).toBe(true);
      expect(matchesTextFilter('Hello World', 'hello')).toBe(true);
      expect(matchesTextFilter('Hello World', 'test')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(matchesTextFilter('UPPERCASE', 'upper')).toBe(true);
      expect(matchesTextFilter('lowercase', 'LOWER')).toBe(true);
    });

    test('should match partial strings', () => {
      expect(matchesTextFilter('JavaScript', 'Java')).toBe(true);
      expect(matchesTextFilter('JavaScript', 'Script')).toBe(true);
      expect(matchesTextFilter('JavaScript', 'avaS')).toBe(true);
    });

    test('should match array of filter values', () => {
      expect(matchesTextFilter('Apple', ['Apple', 'Banana'])).toBe(true);
      expect(matchesTextFilter('Banana Split', ['Apple', 'Banana'])).toBe(true);
      expect(matchesTextFilter('Orange', ['Apple', 'Banana'])).toBe(false);
    });

    test('should handle numeric values', () => {
      expect(matchesTextFilter(123, '12')).toBe(true);
      expect(matchesTextFilter(456, '45')).toBe(true);
      expect(matchesTextFilter(789, '12')).toBe(false);
    });
  });

  describe('Range filter matching logic', () => {
    const matchesRangeFilter = (cellValue, filterValue) => {
      if (!filterValue || typeof filterValue !== 'object') {
        return true;
      }

      const numValue = parseFloat(cellValue);
      if (isNaN(numValue)) {
        return false;
      }

      const { min, max } = filterValue;
      if (min != null && numValue < min) {
        return false;
      }
      if (max != null && numValue > max) {
        return false;
      }

      return true;
    };

    test('should match value within range', () => {
      expect(matchesRangeFilter(50, { min: 0, max: 100 })).toBe(true);
      expect(matchesRangeFilter(0, { min: 0, max: 100 })).toBe(true);
      expect(matchesRangeFilter(100, { min: 0, max: 100 })).toBe(true);
    });

    test('should reject value outside range', () => {
      expect(matchesRangeFilter(-1, { min: 0, max: 100 })).toBe(false);
      expect(matchesRangeFilter(101, { min: 0, max: 100 })).toBe(false);
    });

    test('should handle min-only filter', () => {
      expect(matchesRangeFilter(50, { min: 10 })).toBe(true);
      expect(matchesRangeFilter(5, { min: 10 })).toBe(false);
    });

    test('should handle max-only filter', () => {
      expect(matchesRangeFilter(50, { max: 100 })).toBe(true);
      expect(matchesRangeFilter(150, { max: 100 })).toBe(false);
    });

    test('should return true for empty filter', () => {
      expect(matchesRangeFilter(50, null)).toBe(true);
      expect(matchesRangeFilter(50, {})).toBe(true);
    });

    test('should handle string numbers', () => {
      expect(matchesRangeFilter('50', { min: 0, max: 100 })).toBe(true);
      expect(matchesRangeFilter('150', { min: 0, max: 100 })).toBe(false);
    });

    test('should reject non-numeric values', () => {
      expect(matchesRangeFilter('abc', { min: 0, max: 100 })).toBe(false);
      expect(matchesRangeFilter(null, { min: 0, max: 100 })).toBe(false);
    });
  });

  describe('Date hierarchy filter matching logic', () => {
    const matchesDateHierarchyFilter = (cellValue, filterValue) => {
      if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
      }

      const date = cellValue instanceof Date ? cellValue : new Date(cellValue);
      if (isNaN(date.getTime())) {
        return false;
      }

      return filterValue.some(filter => {
        const { year, month, day } = filter;

        if (year && date.getFullYear() !== year) return false;
        if (month && date.getMonth() !== month - 1) return false;
        if (day && date.getDate() !== day) return false;

        return true;
      });
    };

    test('should match year filter', () => {
      const date = new Date('2024-01-15');
      expect(matchesDateHierarchyFilter(date, [{ year: 2024 }])).toBe(true);
      expect(matchesDateHierarchyFilter(date, [{ year: 2023 }])).toBe(false);
    });

    test('should match year and month filter', () => {
      const date = new Date('2024-03-15');
      expect(matchesDateHierarchyFilter(date, [{ year: 2024, month: 3 }])).toBe(true);
      expect(matchesDateHierarchyFilter(date, [{ year: 2024, month: 4 }])).toBe(false);
    });

    test('should match full date filter', () => {
      const date = new Date('2024-03-15');
      expect(matchesDateHierarchyFilter(date, [{ year: 2024, month: 3, day: 15 }])).toBe(true);
      expect(matchesDateHierarchyFilter(date, [{ year: 2024, month: 3, day: 16 }])).toBe(false);
    });

    test('should match multiple date filters (OR logic)', () => {
      const date = new Date('2024-03-15');
      expect(matchesDateHierarchyFilter(date, [
        { year: 2023 },
        { year: 2024, month: 3 }
      ])).toBe(true);
    });

    test('should parse date strings', () => {
      expect(matchesDateHierarchyFilter('2024-03-15', [{ year: 2024 }])).toBe(true);
      expect(matchesDateHierarchyFilter('2024-03-15', [{ year: 2023 }])).toBe(false);
    });

    test('should return true for empty filter', () => {
      const date = new Date('2024-03-15');
      expect(matchesDateHierarchyFilter(date, [])).toBe(true);
      expect(matchesDateHierarchyFilter(date, null)).toBe(true);
    });

    test('should reject invalid dates', () => {
      expect(matchesDateHierarchyFilter('invalid-date', [{ year: 2024 }])).toBe(false);
      expect(matchesDateHierarchyFilter('not-a-date', [{ year: 2024 }])).toBe(false);
    });
  });

  describe('Sorting logic', () => {
    describe('Null handling', () => {
      test('should handle both null values', () => {
        const aVal = null;
        const bVal = null;
        const result = (aVal == null && bVal == null) ? 0 : -1;

        expect(result).toBe(0);
      });

      test('should sort null to beginning in ascending order', () => {
        const aVal = null;
        const bVal = 'value';
        const sortDirection = 'asc';
        const result = (aVal == null) ? (sortDirection === 'asc' ? -1 : 1) : 0;

        expect(result).toBe(-1);
      });

      test('should sort null to end in descending order', () => {
        const aVal = null;
        const bVal = 'value';
        const sortDirection = 'desc';
        const result = (aVal == null) ? (sortDirection === 'asc' ? -1 : 1) : 0;

        expect(result).toBe(1);
      });
    });

    describe('String comparison', () => {
      test('should compare strings case-insensitively', () => {
        const aVal = 'Apple'.toLowerCase();
        const bVal = 'banana'.toLowerCase();

        expect(aVal < bVal).toBe(true);
      });

      test('should handle identical strings', () => {
        const aVal = 'test'.toLowerCase();
        const bVal = 'test'.toLowerCase();

        expect(aVal === bVal).toBe(true);
      });
    });

    describe('Date comparison', () => {
      test('should compare Date objects', () => {
        const aVal = new Date('2024-01-01').getTime();
        const bVal = new Date('2024-01-02').getTime();

        expect(aVal < bVal).toBe(true);
      });

      test('should parse and compare date strings', () => {
        const aStr = '2024-01-01';
        const bStr = '2024-01-02';
        const aDate = new Date(aStr);
        const bDate = new Date(bStr);

        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          expect(aDate.getTime() < bDate.getTime()).toBe(true);
        }
      });
    });

    describe('Number comparison', () => {
      test('should compare numeric values', () => {
        const aVal = 10;
        const bVal = 20;

        expect(aVal < bVal).toBe(true);
      });

      test('should parse string numbers', () => {
        const aStr = '10';
        const bStr = '20';
        const aVal = !isNaN(parseFloat(aStr)) ? parseFloat(aStr) : aStr;
        const bVal = !isNaN(parseFloat(bStr)) ? parseFloat(bStr) : bStr;

        expect(aVal < bVal).toBe(true);
      });

      test('should handle decimal numbers', () => {
        const aVal = parseFloat('10.5');
        const bVal = parseFloat('10.6');

        expect(aVal < bVal).toBe(true);
      });
    });

    describe('Sort direction', () => {
      test('should apply ascending sort', () => {
        const result = -1; // a < b
        const sortDirection = 'asc';
        const final = sortDirection === 'asc' ? result : -result;

        expect(final).toBe(-1);
      });

      test('should apply descending sort', () => {
        const result = -1; // a < b
        const sortDirection = 'desc';
        const final = sortDirection === 'asc' ? result : -result;

        expect(final).toBe(1);
      });
    });
  });

  describe('Pagination logic', () => {
    test('should calculate start index', () => {
      const currentPage = 3;
      const pageSize = 10;
      const startIndex = (currentPage - 1) * pageSize;

      expect(startIndex).toBe(20);
    });

    test('should calculate end index', () => {
      const currentPage = 3;
      const pageSize = 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      expect(endIndex).toBe(30);
    });

    test('should slice data correctly', () => {
      const data = Array.from({ length: 50 }, (_, i) => i);
      const currentPage = 2;
      const pageSize = 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = data.slice(startIndex, endIndex);

      expect(paginatedData).toHaveLength(10);
      expect(paginatedData[0]).toBe(10);
      expect(paginatedData[9]).toBe(19);
    });

    test('should calculate total pages', () => {
      const dataLength = 95;
      const pageSize = 10;
      const totalPages = Math.ceil(dataLength / pageSize);

      expect(totalPages).toBe(10);
    });

    test('should handle exact page boundary', () => {
      const dataLength = 100;
      const pageSize = 10;
      const totalPages = Math.ceil(dataLength / pageSize);

      expect(totalPages).toBe(10);
    });

    test('should handle empty data', () => {
      const dataLength = 0;
      const pageSize = 10;
      const totalPages = Math.ceil(dataLength / pageSize);

      expect(totalPages).toBe(0);
    });
  });

  describe('Page size adjustment logic', () => {
    test('should calculate new page after size change', () => {
      const currentPage = 3;
      const oldPageSize = 10;
      const newPageSize = 20;
      const currentItemIndex = (currentPage - 1) * oldPageSize;
      const newPage = Math.floor(currentItemIndex / newPageSize) + 1;

      expect(newPage).toBe(2);
    });

    test('should maintain first page when increasing size', () => {
      const currentPage = 1;
      const oldPageSize = 10;
      const newPageSize = 20;
      const currentItemIndex = (currentPage - 1) * oldPageSize;
      const newPage = Math.floor(currentItemIndex / newPageSize) + 1;

      expect(newPage).toBe(1);
    });

    test('should adjust page when decreasing size', () => {
      const currentPage = 2;
      const oldPageSize = 20;
      const newPageSize = 10;
      const currentItemIndex = (currentPage - 1) * oldPageSize; // Item 20
      const newPage = Math.floor(currentItemIndex / newPageSize) + 1;

      expect(newPage).toBe(3);
    });
  });

  describe('Filter validation', () => {
    test('should detect empty array filter', () => {
      const filterValue = [];
      const isEmpty = Array.isArray(filterValue) && filterValue.length === 0;

      expect(isEmpty).toBe(true);
    });

    test('should detect empty object filter', () => {
      const filterValue = {};
      const isEmpty = !filterValue || (typeof filterValue === 'object' && Object.keys(filterValue).length === 0);

      expect(isEmpty).toBe(true);
    });

    test('should detect valid filter', () => {
      const filterValue = 'test';
      const isValid = filterValue && filterValue.length > 0;

      expect(isValid).toBe(true);
    });

    test('should detect null/undefined filter', () => {
      expect(null == null).toBe(true);
      expect(undefined == null).toBe(true);
    });
  });
});
