/**
 * Menu Position Utils Unit Tests
 * Tests for menu positioning logic (pure functions only)
 */

import MenuPositionUtils from '../../src/menu-position-utils.js';

describe('Menu Position Utils', () => {

  describe('calculatePositions', () => {
    test('should calculate all 8 direction positions', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions).toHaveProperty('bottom-right');
      expect(positions).toHaveProperty('bottom-left');
      expect(positions).toHaveProperty('top-right');
      expect(positions).toHaveProperty('top-left');
      expect(positions).toHaveProperty('right');
      expect(positions).toHaveProperty('left');
      expect(positions).toHaveProperty('bottom');
      expect(positions).toHaveProperty('top');
    });

    test('should calculate bottom-right position correctly', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['bottom-right']).toEqual({ x: 110, y: 110 });
    });

    test('should calculate bottom-left position correctly', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['bottom-left']).toEqual({ x: 40, y: 110 });
    });

    test('should calculate top-right position correctly', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['top-right']).toEqual({ x: 110, y: 60 });
    });

    test('should calculate top-left position correctly', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['top-left']).toEqual({ x: 40, y: 60 });
    });

    test('should calculate right position (centered vertically)', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['right']).toEqual({ x: 110, y: 85 }); // y - (height / 2) = 100 - 15
    });

    test('should calculate left position (centered vertically)', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['left']).toEqual({ x: 40, y: 85 });
    });

    test('should calculate bottom position (centered horizontally)', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['bottom']).toEqual({ x: 75, y: 110 }); // x - (width / 2) = 100 - 25
    });

    test('should calculate top position (centered horizontally)', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 10);

      expect(positions['top']).toEqual({ x: 75, y: 60 });
    });

    test('should handle zero margin', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 0);

      expect(positions['bottom-right']).toEqual({ x: 100, y: 100 });
    });

    test('should handle large margin', () => {
      const positions = MenuPositionUtils.calculatePositions(100, 100, 50, 30, 50);

      expect(positions['bottom-right']).toEqual({ x: 150, y: 150 });
    });
  });

  describe('isPositionInViewport', () => {
    test('should return true for position fully inside viewport', () => {
      const position = { x: 100, y: 100 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200, // width
        150, // height
        1920, // viewportWidth
        1080, // viewportHeight
        10 // margin
      );

      expect(result).toBe(true);
    });

    test('should return false when x is too small (< margin)', () => {
      const position = { x: 5, y: 100 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150,
        1920,
        1080,
        10
      );

      expect(result).toBe(false);
    });

    test('should return false when y is too small (< margin)', () => {
      const position = { x: 100, y: 5 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150,
        1920,
        1080,
        10
      );

      expect(result).toBe(false);
    });

    test('should return false when x + width exceeds viewport - margin', () => {
      const position = { x: 1800, y: 100 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200, // x + width = 2000, viewport - margin = 1910
        150,
        1920,
        1080,
        10
      );

      expect(result).toBe(false);
    });

    test('should return false when y + height exceeds viewport - margin', () => {
      const position = { x: 100, y: 1000 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150, // y + height = 1150, viewport - margin = 1070
        1920,
        1080,
        10
      );

      expect(result).toBe(false);
    });

    test('should handle boundary case (exactly at margin)', () => {
      const position = { x: 10, y: 10 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150,
        1920,
        1080,
        10
      );

      expect(result).toBe(true);
    });

    test('should handle boundary case (exactly at right edge)', () => {
      const position = { x: 1710, y: 100 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200, // x + width = 1910, viewport - margin = 1910
        150,
        1920,
        1080,
        10
      );

      expect(result).toBe(true);
    });

    test('should handle small viewport', () => {
      const position = { x: 50, y: 50 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150,
        800,
        600,
        10
      );

      expect(result).toBe(true);
    });

    test('should handle zero margin', () => {
      const position = { x: 0, y: 0 };
      const result = MenuPositionUtils.isPositionInViewport(
        position,
        200,
        150,
        1920,
        1080,
        0
      );

      expect(result).toBe(true);
    });
  });

  describe('getSafeArea', () => {
    // Mock window.innerWidth and window.innerHeight for testing
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalInnerHeight
      });
    });

    test('should return safe area based on window dimensions', () => {
      const safeArea = MenuPositionUtils.getSafeArea();

      expect(safeArea.top).toBe(0);
      expect(safeArea.left).toBe(0);
      expect(safeArea.right).toBe(1920);
      expect(safeArea.bottom).toBe(1080);
      expect(safeArea.width).toBe(1920);
      expect(safeArea.height).toBe(1080);
    });

    test('should handle different viewport sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600
      });

      const safeArea = MenuPositionUtils.getSafeArea();

      expect(safeArea.width).toBe(800);
      expect(safeArea.height).toBe(600);
    });
  });
});
