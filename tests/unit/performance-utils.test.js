/**
 * Performance Utils Unit Tests
 */

import PerformanceUtils from '../../src/performance-utils.js';

describe('PerformanceUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    test('should debounce function calls', () => {
      const fn = jest.fn();
      const debouncedFn = PerformanceUtils.debounce(fn, 1000);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to debounced function', () => {
      const fn = jest.fn();
      const debouncedFn = PerformanceUtils.debounce(fn, 1000);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(1000);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should reset delay on subsequent calls', () => {
      const fn = jest.fn();
      const debouncedFn = PerformanceUtils.debounce(fn, 1000);

      debouncedFn();
      jest.advanceTimersByTime(500);
      debouncedFn(); // Should reset the timer

      jest.advanceTimersByTime(500);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    test('should throttle function calls', () => {
      const fn = jest.fn();
      const throttledFn = PerformanceUtils.throttle(fn, 1000);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should allow calls after throttle period', () => {
      const fn = jest.fn();
      const throttledFn = PerformanceUtils.throttle(fn, 1000);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoize', () => {
    test('should cache function results', () => {
      const expensiveFn = jest.fn((x, y) => x + y);
      const memoizedFn = PerformanceUtils.memoize(expensiveFn);

      const result1 = memoizedFn(1, 2);
      const result2 = memoizedFn(1, 2);

      expect(result1).toBe(3);
      expect(result2).toBe(3);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    test('should handle different arguments', () => {
      const fn = jest.fn((x) => x * 2);
      const memoizedFn = PerformanceUtils.memoize(fn);

      memoizedFn(5);
      memoizedFn(10);
      memoizedFn(5); // Should use cache

      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should use custom key generator', () => {
      const fn = jest.fn((obj) => obj.value * 2);
      const keyGen = (obj) => obj.id;
      const memoizedFn = PerformanceUtils.memoize(fn, keyGen);

      memoizedFn({ id: 1, value: 5 });
      memoizedFn({ id: 1, value: 10 }); // Same id, should use cache

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCache', () => {
    test('should store and retrieve values', () => {
      const cache = PerformanceUtils.createCache(5000);

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    test('should expire values after TTL', () => {
      const cache = PerformanceUtils.createCache(1000);

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      jest.advanceTimersByTime(1000);
      expect(cache.has('key1')).toBe(false);
    });

    test('should clear all values', () => {
      const cache = PerformanceUtils.createCache(5000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });

    test('should delete specific values', () => {
      const cache = PerformanceUtils.createCache(5000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('createVirtualScroller', () => {
    test('should calculate visible range', () => {
      const scroller = PerformanceUtils.createVirtualScroller({
        itemHeight: 50,
        containerHeight: 300,
        totalItems: 1000,
        renderItem: () => document.createElement('div')
      });

      const range = scroller.getVisibleRange(100);

      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(1000);
      expect(range.end).toBeGreaterThan(range.start);
    });

    test('should handle edge cases', () => {
      const scroller = PerformanceUtils.createVirtualScroller({
        itemHeight: 50,
        containerHeight: 300,
        totalItems: 5, // Less than visible count
        renderItem: () => document.createElement('div')
      });

      const range = scroller.getVisibleRange(0);

      expect(range.start).toBe(0);
      expect(range.end).toBe(5);
    });
  });

  describe('createLazyLoader', () => {
    test('should create IntersectionObserver', () => {
      const callback = jest.fn();
      const observer = PerformanceUtils.createLazyLoader(callback);

      expect(observer).toBeInstanceOf(IntersectionObserver);
    });

    test('should call callback on intersection', () => {
      const callback = jest.fn();
      const element = document.createElement('div');
      
      // Mock IntersectionObserver
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };

      global.IntersectionObserver = jest.fn().mockImplementation((cb) => {
        // Simulate intersection
        cb([{ target: element, isIntersecting: true }], mockObserver);
        return mockObserver;
      });

      PerformanceUtils.createLazyLoader(callback);

      expect(callback).toHaveBeenCalledWith(element);
      expect(mockObserver.unobserve).toHaveBeenCalledWith(element);
    });
  });

  describe('batchDOMUpdates', () => {
    test('should batch DOM updates', () => {
      const updates = [
        jest.fn(),
        jest.fn(),
        jest.fn()
      ];

      PerformanceUtils.batchDOMUpdates(updates);

      // Initially not called
      updates.forEach(update => {
        expect(update).not.toHaveBeenCalled();
      });

      // Should be called after requestAnimationFrame
      jest.runAllTimers();
      
      updates.forEach(update => {
        expect(update).toHaveBeenCalled();
      });
    });
  });
});