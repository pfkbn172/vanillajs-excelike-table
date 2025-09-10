/**
 * Performance optimization utilities
 * Provides debouncing, throttling, and caching functionality
 */

const PerformanceUtils = {
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Request animation frame based debounce
   * @param {Function} func - Function to debounce
   * @returns {Function} - Debounced function
   */
  rafDebounce(func) {
    let rafId;
    return function(...args) {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
      });
    };
  },

  /**
   * Simple memoization for pure functions
   * @param {Function} func - Function to memoize
   * @param {Function} keyGenerator - Optional key generator for cache
   * @returns {Function} - Memoized function
   */
  memoize(func, keyGenerator) {
    const cache = new Map();
    return function(...args) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func.apply(this, args);
      cache.set(key, result);
      return result;
    };
  },

  /**
   * Cache with TTL (Time To Live)
   */
  createCache(ttl = 300000) { // 5 minutes default
    const cache = new Map();
    const timers = new Map();

    return {
      set(key, value) {
        // Clear existing timer
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
        }

        cache.set(key, value);
        
        // Set new timer
        const timer = setTimeout(() => {
          cache.delete(key);
          timers.delete(key);
        }, ttl);
        
        timers.set(key, timer);
      },

      get(key) {
        return cache.get(key);
      },

      has(key) {
        return cache.has(key);
      },

      delete(key) {
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
          timers.delete(key);
        }
        return cache.delete(key);
      },

      clear() {
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        cache.clear();
      },

      size() {
        return cache.size;
      }
    };
  },

  /**
   * Batch DOM updates
   * @param {Function[]} updates - Array of update functions
   */
  batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  /**
   * Virtual scrolling helper
   * @param {Object} options - Virtual scrolling options
   * @returns {Object} - Virtual scrolling controller
   */
  createVirtualScroller(options) {
    const {
      itemHeight,
      containerHeight,
      totalItems,
      renderItem,
      buffer = 5
    } = options;

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = totalItems * itemHeight;

    return {
      totalHeight,
      
      getVisibleRange(scrollTop) {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const end = Math.min(totalItems, start + visibleCount + (buffer * 2));
        return { start, end };
      },

      renderVisibleItems(scrollTop, container) {
        const { start, end } = this.getVisibleRange(scrollTop);
        const fragment = document.createDocumentFragment();
        
        for (let i = start; i < end; i++) {
          const item = renderItem(i);
          item.style.position = 'absolute';
          item.style.top = `${i * itemHeight}px`;
          fragment.appendChild(item);
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
      }
    };
  },

  /**
   * Intersection Observer for lazy loading
   * @param {Function} callback - Callback when element is visible
   * @param {Object} options - Intersection Observer options
   * @returns {IntersectionObserver}
   */
  createLazyLoader(callback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    return new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { ...defaultOptions, ...options });
  }
};

// Export for use in ExceLikeTable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceUtils;
}

// Browser global
if (typeof window !== 'undefined') {
  window.PerformanceUtils = PerformanceUtils;
}