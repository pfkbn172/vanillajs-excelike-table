/**
 * Rendering Performance Tests
 * Tests for rendering speed and efficiency with various dataset sizes
 */


describe('Performance - Rendering', () => {
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

  describe('Initial Rendering Performance', () => {
    test('should render small dataset (100 rows) within 200ms', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + (i % 50),
        department: ['Engineering', 'Sales', 'Marketing'][i % 3]
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id', width: 60 },
          { key: 'name', title: 'Name', dataIndex: 'name', width: 150 },
          { key: 'email', title: 'Email', dataIndex: 'email', width: 200 },
          { key: 'age', title: 'Age', dataIndex: 'age', width: 80 },
          { key: 'department', title: 'Department', dataIndex: 'department', width: 120 }
        ]
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200);
      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should render medium dataset (1000 rows) within 500ms', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        value: Math.random() * 1000
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'email', title: 'Email', dataIndex: 'email' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // With virtual scrolling, should still be fast
      expect(renderTime).toBeLessThan(500);
    });

    test('should render large dataset (10000 rows) within 1000ms', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        value: Math.random() * 1000
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Virtual scrolling should make this feasible
      expect(renderTime).toBeLessThan(1000);
    });

    test('should handle very large dataset (50000 rows) without timeout', () => {
      const data = Array.from({ length: 50000 }, (_, i) => ({
        id: i + 1,
        value: i
      }));

      const startTime = performance.now();

      expect(() => {
        const table = new ExceLikeTable('#test-table', {
          data,
          columns: [
            { key: 'id', title: 'ID', dataIndex: 'id' },
            { key: 'value', title: 'Value', dataIndex: 'value' }
          ]
        });
      }).not.toThrow();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should complete within reasonable time
      expect(renderTime).toBeLessThan(3000);
    });
  });

  describe('Re-rendering Performance', () => {
    test('should re-render quickly when updating data', () => {
      const initialData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`
      }));

      const table = new ExceLikeTable('#test-table', {
        data: initialData,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ]
      });

      const newData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Updated ${i + 1}`
      }));

      const startTime = performance.now();
      table.setData(newData);
      const endTime = performance.now();

      const updateTime = endTime - startTime;
      expect(updateTime).toBeLessThan(100);
    });

    test('should handle frequent updates efficiently', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        value: i
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const iterations = 10;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const newData = data.map(row => ({
          ...row,
          value: row.value + i
        }));
        table.setData(newData);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(50); // Average update should be fast
    });
  });

  describe('DOM Efficiency', () => {
    test('should not create excessive DOM nodes for large datasets', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        value: i
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      // Count DOM nodes
      const allNodes = container.querySelectorAll('*');
      const nodeCount = allNodes.length;

      // With virtual scrolling, DOM nodes should be limited
      // Even with 10k rows, we shouldn't have 10k tr elements
      expect(nodeCount).toBeLessThan(5000);
    });

    test('should reuse DOM elements efficiently', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        value: i
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const initialNodeCount = container.querySelectorAll('*').length;

      // Update data
      const newData = data.map(row => ({ ...row, value: row.value + 1 }));
      table.setData(newData);

      const afterUpdateNodeCount = container.querySelectorAll('*').length;

      // Node count should remain similar (efficient reuse)
      const nodeDifference = Math.abs(afterUpdateNodeCount - initialNodeCount);
      expect(nodeDifference).toBeLessThan(120); // Allow some variance for table structure and plugins (increased for theme system)
    });
  });

  describe('Pagination Performance', () => {
    test('should render paginated data quickly', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ],
        pagination: {
          pageSize: 10,
          current: 1
        }
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Pagination should make rendering very fast
      expect(renderTime).toBeLessThan(200);
    });

    test('should change pages quickly', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'name', title: 'Name', dataIndex: 'name' }
        ],
        pagination: {
          pageSize: 10,
          current: 1
        }
      });

      // Simulate page changes
      const startTime = performance.now();

      // Change to different pages
      for (let page = 1; page <= 10; page++) {
        if (table.state) {
          table.state.currentPage = page;
          table.render();
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10;

      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Column Rendering Performance', () => {
    test('should handle many columns efficiently', () => {
      const data = Array.from({ length: 100 }, (_, i) => {
        const row = { id: i + 1 };
        for (let col = 0; col < 20; col++) {
          row[`col${col}`] = `Value ${col}-${i}`;
        }
        return row;
      });

      const columns = [
        { key: 'id', title: 'ID', dataIndex: 'id', width: 60 }
      ];
      for (let col = 0; col < 20; col++) {
        columns.push({
          key: `col${col}`,
          title: `Column ${col}`,
          dataIndex: `col${col}`,
          width: 100
        });
      }

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500);
    });

    test('should render custom render functions efficiently', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        value: i * 10
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          {
            key: 'value',
            title: 'Value',
            dataIndex: 'value',
            render: (value) => `$${value.toFixed(2)}`
          }
        ]
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Stress Testing', () => {
    test('should handle complex data structures efficiently', () => {
      const data = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        nested: {
          level1: {
            level2: {
              value: `Deep value ${i}`
            }
          }
        },
        array: [1, 2, 3, 4, 5],
        date: new Date(),
        metadata: {
          created: new Date(),
          updated: new Date(),
          tags: ['tag1', 'tag2', 'tag3']
        }
      }));

      const startTime = performance.now();

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'nested', title: 'Nested', dataIndex: 'nested' }
        ]
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(300);
    });

    test('should not degrade with repeated operations', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        value: i
      }));

      const table = new ExceLikeTable('#test-table', {
        data,
        columns: [
          { key: 'id', title: 'ID', dataIndex: 'id' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      });

      const times = [];

      // Perform 20 operations and measure each
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        table.setData(data.map(row => ({ ...row, value: row.value + i })));
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Calculate average of first 5 vs last 5
      const firstFiveAvg = times.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const lastFiveAvg = times.slice(-5).reduce((a, b) => a + b, 0) / 5;

      // Performance should not degrade significantly
      expect(lastFiveAvg).toBeLessThan(firstFiveAvg * 1.5);
    });
  });
});
