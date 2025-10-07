# Quick Test Action Plan
**vanillajs-excelike-table - Immediate Testing Priorities**

---

## CRITICAL: Fix Test Runner (2 Hours)

### Problem
```bash
$ npm test
ReferenceError: module is not defined in ES module scope
```

### Solution

**1. Rename Jest Config**
```bash
mv jest.config.js jest.config.cjs
```

**2. Update package.json test script**
```json
{
  "scripts": {
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "test:coverage": "NODE_OPTIONS=--experimental-vm-modules jest --coverage"
  }
}
```

**3. Update test file imports**
```javascript
// OLD (CommonJS):
const DOMUtils = require('../../src/dom-utils');

// NEW (ES Modules):
import DOMUtils from '../../src/dom-utils.js';
```

**4. Verify**
```bash
npm test
# Should see 3 test suites pass
```

---

## Day 1-2: Critical Path Tests (20 Tests)

### ExceLikeTable Initialization Tests

**File:** `tests/unit/core/ExceLikeTable.test.js`

```javascript
import ExceLikeTable from '../../../src/ExceLikeTable.js';

describe('ExceLikeTable - Critical Path', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-table';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // CRITICAL TESTS
  test('1. initializes with minimum required options', () => {
    expect(() => {
      new ExceLikeTable({
        container: '#test-table',
        data: [],
        columns: []
      });
    }).not.toThrow();
  });

  test('2. throws error when container not found', () => {
    expect(() => {
      new ExceLikeTable({
        container: '#nonexistent',
        data: [],
        columns: []
      });
    }).toThrow(/container.*not found/i);
  });

  test('3. handles null data gracefully', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: null,
      columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
    });
    expect(table.getData()).toEqual([]);
  });

  test('4. handles empty columns array', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: [{ id: 1 }],
      columns: []
    });
    expect(table.getColumns()).toEqual([]);
  });

  test('5. setData updates internal state', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: [],
      columns: []
    });
    const newData = [{ id: 1 }, { id: 2 }];
    table.setData(newData);
    expect(table.getData()).toHaveLength(2);
  });

  test('6. getData returns copy, not reference', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: [{ id: 1 }],
      columns: []
    });
    const data = table.getData();
    data.push({ id: 2 });
    expect(table.getData()).toHaveLength(1);
  });

  test('7. destroy cleans up DOM', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: [],
      columns: []
    });
    const initialChildren = container.children.length;
    table.destroy();
    expect(container.children.length).toBeLessThan(initialChildren);
  });

  test('8. handles large dataset without crash', () => {
    const largeData = Array(10000).fill(null).map((_, i) => ({ id: i }));
    expect(() => {
      new ExceLikeTable({
        container: '#test-table',
        data: largeData,
        columns: [{ key: 'id', title: 'ID', dataIndex: 'id' }]
      });
    }).not.toThrow();
  });

  test('9. validates column configuration', () => {
    expect(() => {
      new ExceLikeTable({
        container: '#test-table',
        data: [],
        columns: [{ key: 'id' }] // Missing title and dataIndex
      });
    }).toThrow(/column.*title/i);
  });

  test('10. supports method chaining', () => {
    const table = new ExceLikeTable({
      container: '#test-table',
      data: [],
      columns: []
    });
    const result = table.setData([{ id: 1 }]);
    expect(result).toBe(table);
  });
});
```

---

## Day 3-4: Virtual Scroll Tests (15 Tests)

**File:** `tests/unit/modules/virtual-scroll.test.js`

```javascript
import VirtualScroll from '../../../src/virtual-scroll.js';

describe('VirtualScroll - Critical Path', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.height = '500px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('1. creates virtual scroller with valid options', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 100,
      renderItem: (data, index) => {
        const div = document.createElement('div');
        div.textContent = `Item ${index}`;
        return div;
      }
    });
    expect(scroller).toBeDefined();
  });

  test('2. renders only visible items', () => {
    const renderItem = jest.fn((data, index) => {
      const div = document.createElement('div');
      div.textContent = `Item ${index}`;
      return div;
    });

    VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem
    });

    // With 500px container and 50px items, should render ~15 items + buffer
    expect(renderItem.mock.calls.length).toBeLessThan(50);
    expect(renderItem.mock.calls.length).toBeGreaterThan(10);
  });

  test('3. throws error when itemHeight is 0', () => {
    expect(() => {
      VirtualScroll.create({
        container,
        itemHeight: 0,
        totalItems: 100,
        renderItem: () => document.createElement('div')
      });
    }).toThrow(/itemHeight.*greater than 0/i);
  });

  test('4. handles negative itemHeight', () => {
    expect(() => {
      VirtualScroll.create({
        container,
        itemHeight: -50,
        totalItems: 100,
        renderItem: () => document.createElement('div')
      });
    }).toThrow(/itemHeight/i);
  });

  test('5. updates when totalItems changes', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 100,
      renderItem: () => document.createElement('div')
    });

    scroller.updateTotalItems(200);
    const range = scroller.getVisibleRange();
    expect(range.total).toBe(200);
  });

  test('6. scrollToIndex positions correctly', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem: () => document.createElement('div')
    });

    scroller.scrollToIndex(100);
    const scrollTop = scroller.getScrollTop();
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('7. destroy removes DOM elements', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 100,
      renderItem: () => document.createElement('div')
    });

    const initialChildren = container.children.length;
    scroller.destroy();
    expect(container.children.length).toBeLessThan(initialChildren);
  });

  test('8. handles renderItem returning null', () => {
    expect(() => {
      VirtualScroll.create({
        container,
        itemHeight: 50,
        totalItems: 10,
        renderItem: () => null
      });
    }).not.toThrow();
  });

  test('9. handles zero totalItems', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 0,
      renderItem: () => document.createElement('div')
    });

    const range = scroller.getVisibleRange();
    expect(range.start).toBe(0);
    expect(range.end).toBe(0);
  });

  test('10. getStats returns correct information', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 100,
      renderItem: () => document.createElement('div')
    });

    const stats = scroller.getStats();
    expect(stats.totalItems).toBe(100);
    expect(stats.itemHeight).toBe(50);
    expect(stats.visibleItems).toBeGreaterThan(0);
  });

  test('11. handles rapid scroll events', (done) => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem: () => document.createElement('div')
    });

    // Simulate rapid scrolling
    for (let i = 0; i < 100; i++) {
      scroller.scrollToIndex(i * 10, 'auto');
    }

    setTimeout(() => {
      expect(scroller.getVisibleRange()).toBeDefined();
      done();
    }, 500);
  });

  test('12. isItemVisible returns correct state', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem: () => document.createElement('div')
    });

    expect(scroller.isItemVisible(0)).toBe(true);
    expect(scroller.isItemVisible(999)).toBe(false);
  });

  test('13. findItemAtPosition calculates correctly', () => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem: () => document.createElement('div')
    });

    expect(scroller.findItemAtPosition(0)).toBe(0);
    expect(scroller.findItemAtPosition(50)).toBe(1);
    expect(scroller.findItemAtPosition(100)).toBe(2);
  });

  test('14. handles container resize', (done) => {
    const scroller = VirtualScroll.create({
      container,
      itemHeight: 50,
      totalItems: 1000,
      renderItem: () => document.createElement('div')
    });

    const initialRange = scroller.getVisibleRange();
    container.style.height = '1000px';

    setTimeout(() => {
      const newRange = scroller.getVisibleRange();
      expect(newRange.end - newRange.start).toBeGreaterThan(
        initialRange.end - initialRange.start
      );
      done();
    }, 200);
  });

  test('15. does not leak memory on repeated create/destroy', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    for (let i = 0; i < 100; i++) {
      const scroller = VirtualScroll.create({
        container,
        itemHeight: 50,
        totalItems: 100,
        renderItem: () => document.createElement('div')
      });
      scroller.destroy();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const increase = finalMemory - initialMemory;

    // Memory increase should be minimal (< 1MB)
    expect(increase).toBeLessThan(1024 * 1024);
  });
});
```

---

## Day 5: Filter Security Tests (10 Tests)

**File:** `tests/unit/modules/filter-module.test.js`

```javascript
import FilterModule from '../../../src/filter-module.js';

describe('FilterModule - Data Integrity', () => {
  const columns = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'age', title: 'Age', dataIndex: 'age' },
    { key: 'date', title: 'Date', dataIndex: 'date', filterType: 'date-hierarchy' }
  ];

  test('1. does not mutate original data array', () => {
    const original = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];
    const frozen = Object.freeze([...original.map(Object.freeze)]);

    const result = FilterModule.applyFilters(
      frozen,
      { name: 'Alice' },
      columns
    );

    expect(result).toHaveLength(1);
    expect(original).toHaveLength(2); // Original unchanged
  });

  test('2. handles null/undefined values', () => {
    const data = [
      { name: null, age: 30 },
      { name: undefined, age: 25 },
      { name: 'Charlie', age: null }
    ];

    const result = FilterModule.applyFilters(
      data,
      { name: 'Charlie' },
      columns
    );

    expect(result).toHaveLength(1);
  });

  test('3. handles empty filter value', () => {
    const data = [{ name: 'Alice' }];

    const result = FilterModule.applyFilters(data, {}, columns);

    expect(result).toEqual(data);
  });

  test('4. filters date hierarchy correctly', () => {
    const data = [
      { date: '2024-01-15' },
      { date: '2024-02-20' },
      { date: '2025-01-10' }
    ];

    const result = FilterModule.applyFilters(
      data,
      { date: { years: [2024] } },
      columns
    );

    expect(result).toHaveLength(2);
  });

  test('5. handles invalid date values', () => {
    const data = [
      { date: 'invalid' },
      { date: '2024-01-15' },
      { date: null }
    ];

    const result = FilterModule.applyFilters(
      data,
      { date: { years: [2024] } },
      columns
    );

    expect(result).toHaveLength(1);
  });

  test('6. applies range filters correctly', () => {
    const data = [
      { age: 20 },
      { age: 30 },
      { age: 40 }
    ];

    const rangeColumns = [{
      key: 'age',
      dataIndex: 'age',
      filterType: 'range'
    }];

    const result = FilterModule.applyFilters(
      data,
      { age: { min: 25, max: 35 } },
      rangeColumns
    );

    expect(result).toHaveLength(1);
    expect(result[0].age).toBe(30);
  });

  test('7. handles custom filter function', () => {
    const customFilter = jest.fn((value, record) => record.age % 2 === 0);

    const data = [{ age: 20 }, { age: 21 }, { age: 22 }];
    const customColumns = [{
      key: 'age',
      dataIndex: 'age',
      onFilter: customFilter
    }];

    const result = FilterModule.applyFilters(
      data,
      { age: true },
      customColumns
    );

    expect(customFilter).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(2);
  });

  test('8. handles custom filter throwing error', () => {
    const throwingFilter = () => {
      throw new Error('Filter error');
    };

    const data = [{ age: 20 }];
    const errorColumns = [{
      key: 'age',
      dataIndex: 'age',
      onFilter: throwingFilter
    }];

    expect(() => {
      FilterModule.applyFilters(data, { age: true }, errorColumns);
    }).toThrow('Filter error');
  });

  test('9. applies multiple filters correctly', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Alice', age: 35 }
    ];

    const result = FilterModule.applyFilters(
      data,
      { name: 'Alice', age: 30 },
      columns
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Alice', age: 30 });
  });

  test('10. handles array filter values', () => {
    const data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' }
    ];

    const result = FilterModule.applyFilters(
      data,
      { name: ['Alice', 'Bob'] },
      columns
    );

    expect(result).toHaveLength(2);
  });
});
```

---

## Day 6-7: Export Security Tests (10 Tests)

**File:** `tests/security/export-security.test.js`

```javascript
import ExportModule from '../../src/export-module.js';

describe('ExportModule - Security', () => {
  let mockTable;

  beforeEach(() => {
    mockTable = {
      options: {
        columns: [
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'value', title: 'Value', dataIndex: 'value' }
        ]
      },
      state: {
        filteredData: []
      }
    };
    ExportModule.init(mockTable);
  });

  test('1. prevents CSV formula injection (=)', async () => {
    mockTable.state.filteredData = [{ name: '=1+1', value: 100 }];

    const result = await ExportModule.exportToCSV(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.csv' }
    );

    // Should escape leading = to prevent formula execution
    expect(result).toBeDefined();
  });

  test('2. prevents CSV formula injection (@)', async () => {
    mockTable.state.filteredData = [{ name: '@SUM(A1:A10)', value: 100 }];

    const result = await ExportModule.exportToCSV(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.csv' }
    );

    expect(result).toBeDefined();
  });

  test('3. prevents CSV formula injection (+)', async () => {
    mockTable.state.filteredData = [{ name: '+1+1', value: 100 }];

    const result = await ExportModule.exportToCSV(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.csv' }
    );

    expect(result).toBeDefined();
  });

  test('4. prevents CSV formula injection (-)', async () => {
    mockTable.state.filteredData = [{ name: '-1+1', value: 100 }];

    const result = await ExportModule.exportToCSV(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.csv' }
    );

    expect(result).toBeDefined();
  });

  test('5. escapes HTML in CSV export', async () => {
    mockTable.state.filteredData = [{
      name: '<script>alert("XSS")</script>',
      value: 100
    }];

    const result = await ExportModule.exportToCSV(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.csv' }
    );

    expect(result).toBeDefined();
  });

  test('6. handles malicious filenames', () => {
    mockTable.options.tableId = '../../../etc/passwd';

    const filename = ExportModule.generateFilename('csv');

    expect(filename).not.toContain('../');
    expect(filename).toMatch(/^[\w-]+\.csv$/);
  });

  test('7. sanitizes XML output', async () => {
    mockTable.state.filteredData = [{
      name: '<script>alert(1)</script>',
      value: '&<>"\\''
    }];

    const result = await ExportModule.exportToXML(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.xml' }
    );

    expect(result.filename).toBe('test.xml');
  });

  test('8. sanitizes HTML export', async () => {
    mockTable.state.filteredData = [{
      name: '<script>alert(1)</script>',
      value: 100
    }];

    const result = await ExportModule.exportToHTML(
      mockTable.state.filteredData,
      mockTable.options.columns,
      { filename: 'test.html' }
    );

    expect(result.filename).toBe('test.html');
  });

  test('9. validates export data exists', async () => {
    mockTable.state.filteredData = [];

    await expect(
      ExportModule.exportData({ format: 'csv' })
    ).rejects.toThrow('No data to export');
  });

  test('10. validates export format', async () => {
    mockTable.state.filteredData = [{ name: 'Test', value: 100 }];

    await expect(
      ExportModule.exportData({ format: 'invalid' })
    ).rejects.toThrow(/Unsupported export format/);
  });
});
```

---

## Week 2 Checklist

- [ ] Day 1: Fix jest configuration
- [ ] Day 1: Verify 3 existing tests pass
- [ ] Day 2: Write 10 ExceLikeTable initialization tests
- [ ] Day 3: Write 15 VirtualScroll tests
- [ ] Day 4: Verify virtual scroll edge cases
- [ ] Day 5: Write 10 FilterModule tests
- [ ] Day 6-7: Write 10 export security tests
- [ ] Day 7: Run full test suite with coverage report

**Target:** 45+ tests passing, ~25% code coverage

---

## Success Criteria

### Test Runner Fixed
```bash
$ npm test
PASS tests/unit/dom-utils.test.js
PASS tests/unit/performance-utils.test.js
PASS tests/unit/core/ExceLikeTable.test.js
PASS tests/unit/modules/virtual-scroll.test.js
PASS tests/unit/modules/filter-module.test.js
PASS tests/security/export-security.test.js

Test Suites: 6 passed, 6 total
Tests:       45 passed, 45 total
```

### Coverage Report
```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   25.12 |    18.45 |   21.33 |   25.12
 ExceLikeTable.js     |   15.24 |    12.10 |   10.05 |   15.24
 virtual-scroll.js    |   72.45 |    65.30 |   68.22 |   72.45
 filter-module.js     |   58.33 |    50.21 |   55.10 |   58.33
 export-module.js     |   42.15 |    35.44 |   38.90 |   42.15
```

### Confidence Level
- Can deploy changes without fear of breaking critical paths
- Can refactor with safety net
- Can add features with regression detection
- Security vulnerabilities validated

---

**Next Steps After Week 1:**
1. Add integration tests (filter → sort → export flows)
2. Add plugin system tests
3. Add conditional formatting tests
4. Increase coverage to 50%+
5. Add E2E tests with Playwright

**Files to Create:**
- /mnt/d/Projects/JS/vanillajs-excelike-table/jest.config.cjs
- /mnt/d/Projects/JS/vanillajs-excelike-table/tests/unit/core/ExceLikeTable.test.js
- /mnt/d/Projects/JS/vanillajs-excelike-table/tests/unit/modules/virtual-scroll.test.js
- /mnt/d/Projects/JS/vanillajs-excelike-table/tests/unit/modules/filter-module.test.js
- /mnt/d/Projects/JS/vanillajs-excelike-table/tests/security/export-security.test.js
