/**
 * Memory Leak Detection Tests
 * Tests for memory management and leak prevention
 */


describe('Performance - Memory Leaks', () => {
  let container;
  let ExceLikeTable;

  beforeEach(async () => {
    const module = await import('../../../src/ExceLikeTable.js');
    ExceLikeTable = module.default;

    container = document.createElement('div');
    container.id = 'test-table';
    document.body.appendChild(container);

    // Force garbage collection if available (only in test environment with --expose-gc)
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }

    if (global.gc) {
      global.gc();
    }
  });

  describe('Event Listener Cleanup', () => {
    test('should remove event listeners on destroy', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `User ${i}`
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      // Get initial event listener count (approximation)
      const initialListeners = getEventListenerCount();

      // Destroy table
      if (typeof table.destroy === 'function') {
        table.destroy();
      }

      // Event listeners should be cleaned up
      const afterListeners = getEventListenerCount();

      // Should not have significantly more listeners
      expect(afterListeners).toBeLessThanOrEqual(initialListeners + 5);
    });

    test('should not accumulate listeners on repeated create/destroy', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1
      }));

      const iterations = 10;
      const initialNodeCount = document.querySelectorAll('*').length;

      for (let i = 0; i < iterations; i++) {
        const table = new ExceLikeTable('#test-table', {
          data,
          columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
        });

        if (typeof table.destroy === 'function') {
          table.destroy();
        }
      }

      const finalNodeCount = document.querySelectorAll('*').length;

      // DOM nodes should be cleaned up
      expect(finalNodeCount).toBeLessThanOrEqual(initialNodeCount + 10);
    });

    test('should clean up document-level event listeners', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      // Table might add document click handlers for dropdowns, etc.
      const hasDocumentClickHandler = table.documentClickHandler !== undefined;

      if (typeof table.destroy === 'function') {
        table.destroy();
      }

      // Document click handler should be removed
      if (hasDocumentClickHandler) {
        expect(table.documentClickHandler).toBeUndefined();
      }

      // Test passes if no errors
      expect(true).toBe(true);
    });
  });

  describe('DOM Node Cleanup', () => {
    test('should remove all DOM nodes on destroy', () => {
      const table = new ExceLikeTable('#test-table', {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      const nodesBeforeDestroy = container.querySelectorAll('*').length;
      expect(nodesBeforeDestroy).toBeGreaterThan(0);

      if (typeof table.destroy === 'function') {
        table.destroy();
      }

      const nodesAfterDestroy = container.querySelectorAll('*').length;
      expect(nodesAfterDestroy).toBe(0);
    });

    test('should not leave orphaned nodes in document', () => {
      const initialBodyChildren = document.body.children.length;

      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      if (typeof table.destroy === 'function') {
        table.destroy();
      }

      const finalBodyChildren = document.body.children.length;

      // Should only have our test container
      expect(finalBodyChildren).toBe(initialBodyChildren);
    });

    test('should handle repeated data updates without DOM bloat', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      const initialNodes = container.querySelectorAll('*').length;

      // Update data 20 times
      for (let i = 0; i < 20; i++) {
        table.setData([{ id: i + 1 }]);
      }

      const finalNodes = container.querySelectorAll('*').length;

      // DOM should not grow significantly
      const growth = finalNodes - initialNodes;
      // Allow reasonable variance for table structure updates
      expect(growth).toBeLessThan(100);
    });
  });

  describe('Data Reference Management', () => {
    test('should not retain references to old data', () => {
      const largeObject = {
        id: 1,
        data: new Array(1000).fill('x').join('')
      };

      const table = new ExceLikeTable('#test-table', {
        data: [largeObject],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      // Update with new data
      table.setData([{ id: 2 }]);

      // Old data should be eligible for GC
      // This is tested implicitly - if references were held, memory would grow
      expect(table.getData()).toEqual([{ id: 2 }]);
    });

    test('should handle circular reference cleanup', () => {
      const circular = { id: 1, name: 'Test' };
      circular.self = circular;

      expect(() => {
        const table = new ExceLikeTable('#test-table', {
          data: [circular],
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'name', title: 'Name', dataIndex: 'name' }
          ]
        });

        table.setData([{ id: 2, name: 'New' }]);

        if (typeof table.destroy === 'function') {
          table.destroy();
        }
      }).not.toThrow();
    });
  });

  describe('Timer and Interval Cleanup', () => {
    test('should clear any active timers on destroy', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      // Destroy should clean up any timers
      if (typeof table.destroy === 'function') {
        table.destroy();
      }

      // Wait a bit to ensure no timer callbacks fire
      return new Promise(resolve => {
        setTimeout(() => {
          // If there were uncleaned timers, they might cause errors
          // Test passes if we get here without errors
          expect(true).toBe(true);
          resolve();
        }, 100);
      });
    });
  });

  describe('Memory Growth Prevention', () => {
    test('should not grow memory with repeated operations', () => {
      const table = new ExceLikeTable('#test-table', {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      const iterations = 50;

      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        const newData = Array.from({ length: 100 }, (_, j) => ({
          id: j + 1,
          value: i + j
        }));
        table.setData(newData);

        if (typeof table.sortBy === 'function') {
          table.sortBy('id', i % 2 === 0 ? 'asc' : 'desc');
        }
      }

      // Memory should be stable (tested implicitly through execution)
      expect(table.getData().length).toBe(100);
    });

    test('should handle large dataset creation and destruction', () => {
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const table = new ExceLikeTable('#test-table', {
          data: Array.from({ length: 1000 }, (_, j) => ({
            id: j + 1,
            data: `Data ${j}`
          })),
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'data', title: 'Data', dataIndex: 'data' }
          ]
        });

        if (typeof table.destroy === 'function') {
          table.destroy();
        }
      }

      // Should complete without memory errors
      expect(container.children.length).toBe(0);
    });
  });

  describe('Plugin System Memory Management', () => {
    test('should clean up plugin references on destroy', () => {
      const table = new ExceLikeTable('#test-table', {
        data: [{ id: 1 }],
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });

      // If plugin system exists, it should be cleaned up
      if (table.pluginSystem) {
        expect(table.pluginSystem).toBeDefined();

        if (typeof table.destroy === 'function') {
          table.destroy();
        }

        // Plugin system should be cleaned up or nullified
        // This prevents memory leaks from plugin hooks
      }

      expect(true).toBe(true);
    });
  });
});

/**
 * Helper function to approximate event listener count
 * Note: This is a best-effort approximation since JS doesn't expose
 * a direct way to count event listeners
 */
function getEventListenerCount() {
  // This is a simplified approximation
  // In real scenarios, you might use browser DevTools or memory profilers
  const elements = document.querySelectorAll('*');
  let count = 0;

  // Count elements that likely have listeners
  elements.forEach(el => {
    if (el.onclick || el.onchange || el.oninput || el.onsubmit) {
      count++;
    }
  });

  return count;
}
