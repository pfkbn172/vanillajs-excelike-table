/**
 * Pagination Module Unit Tests
 * Tests for pagination calculation and page number generation
 */

import PaginationModule from '../../src/pagination-module.js';

describe('Pagination Module', () => {

  describe('calculatePagination', () => {
    test('should calculate basic pagination info', () => {
      const result = PaginationModule.calculatePagination(100, 1, 10);

      expect(result.current).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    test('should handle middle page correctly', () => {
      const result = PaginationModule.calculatePagination(100, 5, 10);

      expect(result.current).toBe(5);
      expect(result.start).toBe(40);
      expect(result.end).toBe(50);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    test('should handle last page correctly', () => {
      const result = PaginationModule.calculatePagination(100, 10, 10);

      expect(result.current).toBe(10);
      expect(result.start).toBe(90);
      expect(result.end).toBe(100);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    test('should handle partial last page', () => {
      const result = PaginationModule.calculatePagination(95, 10, 10);

      expect(result.totalPages).toBe(10);
      expect(result.end).toBe(95); // Not 100
    });

    test('should handle page number exceeding total pages', () => {
      const result = PaginationModule.calculatePagination(50, 100, 10);

      expect(result.current).toBe(5); // Clamped to totalPages
      expect(result.totalPages).toBe(5);
    });

    test('should handle zero or invalid current page', () => {
      const result = PaginationModule.calculatePagination(50, 0, 10);

      expect(result.current).toBe(1); // Defaults to 1
    });

    test('should handle small datasets (single page)', () => {
      const result = PaginationModule.calculatePagination(5, 1, 10);

      expect(result.totalPages).toBe(1);
      expect(result.start).toBe(0);
      expect(result.end).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    test('should handle exact page boundary', () => {
      const result = PaginationModule.calculatePagination(100, 10, 10);

      expect(result.totalPages).toBe(10);
      expect(result.end).toBe(100);
    });
  });

  describe('getPageNumbers', () => {
    test('should return all pages when total <= maxButtons', () => {
      const pages = PaginationModule.getPageNumbers(3, 5, 5);

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    test('should center current page when possible', () => {
      const pages = PaginationModule.getPageNumbers(5, 10, 5);

      expect(pages).toEqual([3, 4, 5, 6, 7]);
      expect(pages.includes(5)).toBe(true); // Current page included
    });

    test('should show first pages when current is near start', () => {
      const pages = PaginationModule.getPageNumbers(2, 10, 5);

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    test('should show last pages when current is near end', () => {
      const pages = PaginationModule.getPageNumbers(9, 10, 5);

      expect(pages).toEqual([6, 7, 8, 9, 10]);
    });

    test('should handle current = 1 (first page)', () => {
      const pages = PaginationModule.getPageNumbers(1, 10, 5);

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    test('should handle current = total (last page)', () => {
      const pages = PaginationModule.getPageNumbers(10, 10, 5);

      expect(pages).toEqual([6, 7, 8, 9, 10]);
    });

    test('should handle maxButtons = 3 (odd number)', () => {
      const pages = PaginationModule.getPageNumbers(5, 10, 3);

      expect(pages).toHaveLength(3);
      expect(pages).toEqual([4, 5, 6]);
    });

    test('should handle maxButtons = 7 (larger window)', () => {
      const pages = PaginationModule.getPageNumbers(5, 10, 7);

      expect(pages).toHaveLength(7);
      expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8]);
    });

    test('should handle total = 1 (single page)', () => {
      const pages = PaginationModule.getPageNumbers(1, 1, 5);

      expect(pages).toEqual([1]);
    });

    test('should ensure current page is always in result', () => {
      for (let current = 1; current <= 20; current++) {
        const pages = PaginationModule.getPageNumbers(current, 20, 5);
        expect(pages.includes(current)).toBe(true);
      }
    });

    test('should respect maxButtons length constraint', () => {
      const pages = PaginationModule.getPageNumbers(15, 100, 5);

      expect(pages).toHaveLength(5);
    });
  });
});
