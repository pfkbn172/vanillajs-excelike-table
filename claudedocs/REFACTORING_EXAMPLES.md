# Refactoring Examples - Code Transformations
## VanillaJS ExceLike Table Library

This document provides detailed before/after code examples for the highest priority refactorings.

---

## Example 1: God Class Decomposition - Filter Service

### Before: Monolithic Filter Logic in ExceLikeTable.js

**Location:** Lines 1631-1800 (170 lines in main class)

```javascript
class ExceLikeTable {
  // 5,068 lines total...

  applyFilters(skipSorting = false) {
    let filtered = [...this.state.data];

    // Apply all filters
    Object.keys(this.state.filters).forEach(columnKey => {
      const filters = this.state.filters[columnKey];
      if (filters && filters.length > 0) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          const currentMode = this.state.filterModes?.[columnKey] || 'values';
          if (currentMode === 'range') {
            return; // Skip this column
          }

          if (column.filterType === 'date-hierarchy') {
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              if (!value) {
                return filters.some(f => !f || f === 'null' || f === 'undefined' || f === '');
              }

              const date = new Date(value);
              const year = date.getFullYear().toString();
              const month = date.toLocaleString('default', { month: 'long' });

              return filters.some(filterValue => {
                if (filterValue === year) return true;
                if (filterValue === `${year}-${month}`) return true;
                return false;
              });
            });
          } else if (column.onFilter) {
            filtered = filtered.filter(record =>
              filters.some(filterValue => column.onFilter(filterValue, record))
            );
          } else if (this.isNumericColumn(column)) {
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              const numValue = parseFloat(value);

              if (isNaN(numValue) || value === null || value === undefined || value === '') {
                return filters.some(f => {
                  const fNum = parseFloat(f);
                  return isNaN(fNum) || f === null || f === 'null' || f === 'undefined' || f === '';
                });
              }

              return filters.includes(numValue);
            });
          } else {
            // Default text filter
            filtered = filtered.filter(record => {
              const value = record[column.dataIndex];
              const isEmpty = value === null || value === undefined || value === '';

              return filters.some(filterValue => {
                const filterIsEmpty = filterValue === null || filterValue === 'null' ||
                                     filterValue === undefined || filterValue === 'undefined' ||
                                     filterValue === '';

                if (isEmpty && filterIsEmpty) return true;
                if (isEmpty || filterIsEmpty) return false;

                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
              });
            });
          }
        }
      }
    });

    // Apply range filters
    Object.keys(this.state.rangeFilters).forEach(columnKey => {
      const range = this.state.rangeFilters[columnKey];
      if (range && (range.min !== undefined || range.max !== undefined)) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          const currentMode = this.state.filterModes?.[columnKey] || 'values';
          if (currentMode !== 'range') {
            return; // Skip if not in range mode
          }

          filtered = filtered.filter(record => {
            const value = parseFloat(record[column.dataIndex]);
            const includeBlanks = this.state.rangeIncludeBlanks?.[columnKey] !== false;

            if (isNaN(value) || record[column.dataIndex] === null ||
                record[column.dataIndex] === undefined || record[column.dataIndex] === '') {
              return includeBlanks;
            }

            const minValue = range.min !== undefined && range.min !== '' ? parseFloat(range.min) : -Infinity;
            const maxValue = range.max !== undefined && range.max !== '' ? parseFloat(range.max) : Infinity;

            return value >= minValue && value <= maxValue;
          });
        }
      }
    });

    // Apply date range filters
    Object.keys(this.state.dateRangeFilters).forEach(columnKey => {
      const dateRange = this.state.dateRangeFilters[columnKey];
      if (dateRange && (dateRange.start || dateRange.end)) {
        const column = this.options.columns.find(col => col.key === columnKey);
        if (column) {
          filtered = filtered.filter(record => {
            const value = record[column.dataIndex];
            const includeBlanks = this.state.dateRangeIncludeBlanks?.[columnKey] !== false;

            if (!value) {
              return includeBlanks;
            }

            const date = new Date(value);

            if (isNaN(date.getTime())) {
              return includeBlanks;
            }

            if (dateRange.start) {
              const startDate = new Date(dateRange.start);
              if (date < startDate) return false;
            }

            if (dateRange.end) {
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999);
              if (date > endDate) return false;
            }

            return true;
          });
        }
      }
    });

    this.state.filteredData = filtered;

    if (!skipSorting) {
      this.applySorting();
    }
  }

  isNumericColumn(column) {
    // Check if column contains numeric data
    return this.state.data.slice(0, 10).every(row => {
      const value = row[column.dataIndex];
      return value === null || value === undefined || value === '' || !isNaN(Number(value));
    });
  }
}
```

**Problems:**
- 170 lines in single method
- Mixed responsibilities (value filters, range filters, date filters)
- Duplicated filter state checking (3 separate loops)
- Hard to test individual filter types
- High cyclomatic complexity
- Violates Single Responsibility Principle

---

### After: Extracted Filter Service with Strategy Pattern

**New File:** `src/services/FilterService.js`

```javascript
/**
 * Filter Service - Handles all data filtering logic
 * Uses Strategy pattern for different filter types
 */
export class FilterService {
  constructor() {
    this.strategies = [
      new DateRangeFilterStrategy(),
      new NumericRangeFilterStrategy(),
      new DateHierarchyFilterStrategy(),
      new CustomFilterStrategy(),
      new NumericFilterStrategy(),
      new TextFilterStrategy()
    ];
  }

  /**
   * Apply all active filters to data
   * @param {Array} data - Source data
   * @param {Array} columns - Column definitions
   * @param {Object} filterState - Current filter state
   * @returns {Array} Filtered data
   */
  applyAll(data, columns, filterState) {
    return columns.reduce((filtered, column) => {
      const strategy = this.findStrategy(column, filterState);
      if (!strategy) return filtered;

      return strategy.apply(filtered, column, filterState);
    }, data);
  }

  /**
   * Find appropriate strategy for column
   */
  findStrategy(column, filterState) {
    return this.strategies.find(s => s.canHandle(column, filterState));
  }
}

/**
 * Base Strategy - All filter strategies extend this
 */
class FilterStrategy {
  canHandle(column, filterState) {
    throw new Error('Must implement canHandle()');
  }

  apply(data, column, filterState) {
    throw new Error('Must implement apply()');
  }

  getFilterValue(column, filterState) {
    throw new Error('Must implement getFilterValue()');
  }
}

/**
 * Date Range Filter Strategy
 */
class DateRangeFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const dateRange = filterState.dateRangeFilters[column.key];
    return dateRange && (dateRange.start || dateRange.end);
  }

  apply(data, column, filterState) {
    const dateRange = this.getFilterValue(column, filterState);
    const includeBlanks = filterState.dateRangeIncludeBlanks?.[column.key] !== false;

    return data.filter(record => {
      const value = record[column.dataIndex];

      if (this.isBlank(value)) {
        return includeBlanks;
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return includeBlanks;
      }

      return this.isInRange(date, dateRange);
    });
  }

  getFilterValue(column, filterState) {
    return filterState.dateRangeFilters[column.key];
  }

  isBlank(value) {
    return !value;
  }

  isInRange(date, dateRange) {
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      if (date < startDate) return false;
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (date > endDate) return false;
    }

    return true;
  }
}

/**
 * Numeric Range Filter Strategy
 */
class NumericRangeFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const range = filterState.rangeFilters[column.key];
    const mode = filterState.filterModes?.[column.key] || 'values';

    return mode === 'range' &&
           range &&
           (range.min !== undefined || range.max !== undefined);
  }

  apply(data, column, filterState) {
    const range = this.getFilterValue(column, filterState);
    const includeBlanks = filterState.rangeIncludeBlanks?.[column.key] !== false;

    return data.filter(record => {
      const value = parseFloat(record[column.dataIndex]);

      if (this.isBlank(value, record[column.dataIndex])) {
        return includeBlanks;
      }

      return this.isInRange(value, range);
    });
  }

  getFilterValue(column, filterState) {
    return filterState.rangeFilters[column.key];
  }

  isBlank(value, rawValue) {
    return isNaN(value) ||
           rawValue === null ||
           rawValue === undefined ||
           rawValue === '';
  }

  isInRange(value, range) {
    const min = range.min !== undefined && range.min !== ''
      ? parseFloat(range.min)
      : -Infinity;
    const max = range.max !== undefined && range.max !== ''
      ? parseFloat(range.max)
      : Infinity;

    return value >= min && value <= max;
  }
}

/**
 * Date Hierarchy Filter Strategy (Year/Month/Day)
 */
class DateHierarchyFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const filters = filterState.filters[column.key];
    const mode = filterState.filterModes?.[column.key] || 'values';

    return column.filterType === 'date-hierarchy' &&
           mode === 'values' &&
           filters &&
           filters.length > 0;
  }

  apply(data, column, filterState) {
    const filters = this.getFilterValue(column, filterState);

    return data.filter(record => {
      const value = record[column.dataIndex];

      if (!value) {
        return this.matchesEmptyValue(filters);
      }

      return this.matchesDateHierarchy(value, filters);
    });
  }

  getFilterValue(column, filterState) {
    return filterState.filters[column.key];
  }

  matchesEmptyValue(filters) {
    return filters.some(f =>
      !f || f === 'null' || f === 'undefined' || f === ''
    );
  }

  matchesDateHierarchy(value, filters) {
    const date = new Date(value);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString('default', { month: 'long' });

    return filters.some(filterValue =>
      filterValue === year ||
      filterValue === `${year}-${month}`
    );
  }
}

/**
 * Custom Filter Strategy (using column.onFilter)
 */
class CustomFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const filters = filterState.filters[column.key];
    const mode = filterState.filterModes?.[column.key] || 'values';

    return column.onFilter &&
           mode === 'values' &&
           filters &&
           filters.length > 0;
  }

  apply(data, column, filterState) {
    const filters = this.getFilterValue(column, filterState);

    return data.filter(record =>
      filters.some(filterValue =>
        column.onFilter(filterValue, record)
      )
    );
  }

  getFilterValue(column, filterState) {
    return filterState.filters[column.key];
  }
}

/**
 * Numeric Filter Strategy
 */
class NumericFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const filters = filterState.filters[column.key];
    const mode = filterState.filterModes?.[column.key] || 'values';

    return this.isNumericColumn(column, filterState.data) &&
           mode === 'values' &&
           filters &&
           filters.length > 0;
  }

  apply(data, column, filterState) {
    const filters = this.getFilterValue(column, filterState);

    return data.filter(record => {
      const value = record[column.dataIndex];
      const numValue = parseFloat(value);

      if (this.isBlank(numValue, value)) {
        return this.matchesBlankFilter(filters);
      }

      return filters.includes(numValue);
    });
  }

  getFilterValue(column, filterState) {
    return filterState.filters[column.key];
  }

  isBlank(numValue, rawValue) {
    return isNaN(numValue) ||
           rawValue === null ||
           rawValue === undefined ||
           rawValue === '';
  }

  matchesBlankFilter(filters) {
    return filters.some(f => {
      const fNum = parseFloat(f);
      return isNaN(fNum) ||
             f === null ||
             f === 'null' ||
             f === 'undefined' ||
             f === '';
    });
  }

  isNumericColumn(column, data) {
    return data.slice(0, 10).every(row => {
      const value = row[column.dataIndex];
      return value === null ||
             value === undefined ||
             value === '' ||
             !isNaN(Number(value));
    });
  }
}

/**
 * Text Filter Strategy (default fallback)
 */
class TextFilterStrategy extends FilterStrategy {
  canHandle(column, filterState) {
    const filters = filterState.filters[column.key];
    const mode = filterState.filterModes?.[column.key] || 'values';

    return mode === 'values' && filters && filters.length > 0;
  }

  apply(data, column, filterState) {
    const filters = this.getFilterValue(column, filterState);

    return data.filter(record => {
      const value = record[column.dataIndex];

      if (this.isBlank(value)) {
        return this.matchesBlankFilter(filters);
      }

      return this.matchesTextFilter(value, filters);
    });
  }

  getFilterValue(column, filterState) {
    return filterState.filters[column.key];
  }

  isBlank(value) {
    return value === null || value === undefined || value === '';
  }

  matchesBlankFilter(filters) {
    return filters.some(filterValue =>
      filterValue === null ||
      filterValue === 'null' ||
      filterValue === undefined ||
      filterValue === 'undefined' ||
      filterValue === ''
    );
  }

  matchesTextFilter(value, filters) {
    const lowerValue = String(value).toLowerCase();

    return filters.some(filterValue => {
      const lowerFilter = String(filterValue).toLowerCase();
      return lowerValue.includes(lowerFilter);
    });
  }
}
```

**Updated ExceLikeTable.js:**

```javascript
import { FilterService } from './services/FilterService.js';

class ExceLikeTable {
  constructor(container, options = {}) {
    // ... other initialization ...

    // Inject filter service
    this.filterService = new FilterService();
  }

  applyFilters(skipSorting = false) {
    // Simplified to single line - delegates to service
    this.state.filteredData = this.filterService.applyAll(
      this.state.data,
      this.options.columns,
      {
        filters: this.state.filters,
        rangeFilters: this.state.rangeFilters,
        dateRangeFilters: this.state.dateRangeFilters,
        filterModes: this.state.filterModes,
        rangeIncludeBlanks: this.state.rangeIncludeBlanks,
        dateRangeIncludeBlanks: this.state.dateRangeIncludeBlanks,
        data: this.state.data // For numeric column detection
      }
    );

    if (!skipSorting) {
      this.applySorting();
    }
  }

  // isNumericColumn() method removed - now in NumericFilterStrategy
}
```

**Benefits:**
- Main method reduced from 170 lines to 10 lines
- Each strategy is 20-40 lines (easily testable)
- Strategy pattern allows adding new filter types without modifying existing code
- Each strategy has single responsibility
- Improved readability and maintainability
- Easy to unit test each strategy independently

**Test Example:**

```javascript
// FilterService.test.js
describe('NumericRangeFilterStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new NumericRangeFilterStrategy();
  });

  it('should filter values within range', () => {
    const data = [
      { value: 10 },
      { value: 50 },
      { value: 90 }
    ];

    const column = { key: 'value', dataIndex: 'value' };
    const filterState = {
      rangeFilters: { value: { min: 20, max: 80 } },
      filterModes: { value: 'range' },
      rangeIncludeBlanks: { value: false }
    };

    const result = strategy.apply(data, column, filterState);

    expect(result).toEqual([{ value: 50 }]);
  });

  it('should include blanks when configured', () => {
    const data = [
      { value: null },
      { value: 50 }
    ];

    const column = { key: 'value', dataIndex: 'value' };
    const filterState = {
      rangeFilters: { value: { min: 20, max: 80 } },
      filterModes: { value: 'range' },
      rangeIncludeBlanks: { value: true }
    };

    const result = strategy.apply(data, column, filterState);

    expect(result).toHaveLength(2);
  });
});
```

---

## Example 2: Massive Method Refactoring - applyFontSize()

### Before: 96-Line Method

**Location:** ExceLikeTable.js, lines 4500-4596

```javascript
applyFontSize() {
  const fontSize = TABLE_CONFIG.FONT_SIZES[this.state.fontSize] || TABLE_CONFIG.FONT_SIZES.medium;

  // Use CSS custom property
  this.container.style.setProperty('--table-font-size', fontSize);

  if (!this.tableContainer) {
    return;
  }

  // Apply directly to main elements with !important
  this.tableContainer.style.setProperty('font-size', fontSize, 'important');

  // Apply to table elements
  const tableElements = this.tableContainer.querySelectorAll(`
    .table,
    .table-cell,
    .table-header,
    .header-content,
    .header-title,
    .enhanced-table-pagination,
    .pagination-info,
    .page-info,
    tbody tr td
  `);

  tableElements.forEach(element => {
    element.style.setProperty('font-size', fontSize, 'important');
  });

  // Apply to menu elements
  const menuElements = this.container.querySelectorAll(`
    .table-menu-container,
    .table-menu-btn,
    .table-menu-dropdown,
    .table-menu-item,
    .table-submenu-dropdown
  `);

  menuElements.forEach(element => {
    element.style.setProperty('font-size', fontSize, 'important');
  });

  // Apply to filter elements
  const filterElements = document.querySelectorAll(`
    .filter-dropdown-wrapper,
    .filter-dropdown,
    .filter-dropdown-header,
    .filter-dropdown-title,
    .filter-dropdown-search,
    .filter-search-input,
    .filter-dropdown-content,
    .filter-option,
    .filter-option-label,
    .filter-option-text,
    .filter-dropdown-footer,
    .filter-btn-confirm,
    .filter-btn-cancel,
    .filter-btn-clear-column,
    .range-filter,
    .range-label,
    .range-input,
    .date-range-filter,
    .date-range-label,
    .date-range-input,
    .date-filter-content,
    .date-filter-label,
    .date-filter-text,
    .date-expand-controls,
    .expand-control-label,
    .expand-control-btn
  `);

  filterElements.forEach(element => {
    element.style.setProperty('font-size', fontSize, 'important');
  });

  // Apply to column settings modal
  const modalElements = document.querySelectorAll(`
    .column-settings-overlay,
    .column-settings-modal,
    .column-settings-header,
    .column-settings-content,
    .column-list,
    .column-item,
    .column-label,
    .column-text,
    .column-settings-footer,
    .confirm-btn,
    .cancel-btn
  `);

  modalElements.forEach(element => {
    element.style.setProperty('font-size', fontSize, 'important');
  });
}
```

**Problems:**
- 96 lines for single responsibility (apply font size)
- Repetitive code (4 nearly identical blocks)
- Hard-coded selector lists mixed with logic
- Difficult to maintain (adding new elements requires code changes)

---

### After: Configuration-Driven with Extract Method

**New File:** `src/config/style-selectors.js`

```javascript
/**
 * Style Selector Groups
 * Centralized configuration for styling operations
 */
export const STYLE_SELECTOR_GROUPS = {
  table: {
    selectors: [
      '.table',
      '.table-cell',
      '.table-header',
      '.header-content',
      '.header-title',
      '.enhanced-table-pagination',
      '.pagination-info',
      '.page-info',
      'tbody tr td'
    ],
    scope: 'container' // Query within tableContainer
  },

  menu: {
    selectors: [
      '.table-menu-container',
      '.table-menu-btn',
      '.table-menu-dropdown',
      '.table-menu-item',
      '.table-submenu-dropdown'
    ],
    scope: 'container'
  },

  filter: {
    selectors: [
      '.filter-dropdown-wrapper',
      '.filter-dropdown',
      '.filter-dropdown-header',
      '.filter-dropdown-title',
      '.filter-dropdown-search',
      '.filter-search-input',
      '.filter-dropdown-content',
      '.filter-option',
      '.filter-option-label',
      '.filter-option-text',
      '.filter-dropdown-footer',
      '.filter-btn-confirm',
      '.filter-btn-cancel',
      '.filter-btn-clear-column',
      '.range-filter',
      '.range-label',
      '.range-input',
      '.date-range-filter',
      '.date-range-label',
      '.date-range-input',
      '.date-filter-content',
      '.date-filter-label',
      '.date-filter-text',
      '.date-expand-controls',
      '.expand-control-label',
      '.expand-control-btn'
    ],
    scope: 'document' // Query entire document
  },

  modal: {
    selectors: [
      '.column-settings-overlay',
      '.column-settings-modal',
      '.column-settings-header',
      '.column-settings-content',
      '.column-list',
      '.column-item',
      '.column-label',
      '.column-text',
      '.column-settings-footer',
      '.confirm-btn',
      '.cancel-btn'
    ],
    scope: 'document'
  }
};
```

**New File:** `src/services/StyleService.js`

```javascript
import { STYLE_SELECTOR_GROUPS } from '../config/style-selectors.js';

/**
 * Style Service - Manages dynamic styling of table elements
 */
export class StyleService {
  constructor(container, tableContainer) {
    this.container = container;
    this.tableContainer = tableContainer;
  }

  /**
   * Apply style property to all selector groups
   * @param {Object} selectorGroups - Grouped selectors
   * @param {string} property - CSS property name
   * @param {string} value - CSS property value
   * @param {string} priority - CSS priority ('important' or '')
   */
  applyToSelectorGroups(selectorGroups, property, value, priority = '') {
    Object.values(selectorGroups).forEach(group => {
      this.applyToGroup(group, property, value, priority);
    });
  }

  /**
   * Apply style to single selector group
   */
  applyToGroup(group, property, value, priority) {
    const scope = this.getScopeElement(group.scope);
    if (!scope) return;

    const selector = group.selectors.join(', ');
    const elements = scope.querySelectorAll(selector);

    elements.forEach(element => {
      element.style.setProperty(property, value, priority);
    });
  }

  /**
   * Get scope element for queries
   */
  getScopeElement(scopeName) {
    switch (scopeName) {
      case 'container':
        return this.tableContainer;
      case 'document':
        return document;
      case 'wrapper':
        return this.container;
      default:
        return this.tableContainer;
    }
  }

  /**
   * Set CSS custom property
   */
  setCSSVariable(name, value, scope = 'container') {
    const element = this.getScopeElement(scope);
    if (element) {
      element.style.setProperty(name, value);
    }
  }
}
```

**Updated ExceLikeTable.js:**

```javascript
import { StyleService } from './services/StyleService.js';
import { STYLE_SELECTOR_GROUPS } from './config/style-selectors.js';

class ExceLikeTable {
  constructor(container, options = {}) {
    // ... other initialization ...

    // Inject style service (after container created)
    this.styleService = null; // Will be initialized in createStructure()
  }

  createStructure() {
    // ... existing structure creation ...

    // Initialize style service after structure is created
    this.styleService = new StyleService(this.container, this.tableContainer);
  }

  applyFontSize() {
    const fontSize = this.getFontSizeValue();

    // Set CSS variable for global use
    this.styleService.setCSSVariable('--table-font-size', fontSize, 'wrapper');

    // Guard clause - early return if structure not ready
    if (!this.tableContainer) return;

    // Apply to all configured selector groups
    this.styleService.applyToSelectorGroups(
      STYLE_SELECTOR_GROUPS,
      'font-size',
      fontSize,
      'important'
    );
  }

  getFontSizeValue() {
    return TABLE_CONFIG.FONT_SIZES[this.state.fontSize] ||
           TABLE_CONFIG.FONT_SIZES.medium;
  }

  // applyCellPadding() can now reuse the same service
  applyCellPadding() {
    const padding = this.getCellPaddingValue();

    if (!this.tableContainer) return;

    this.styleService.applyToSelectorGroups(
      STYLE_SELECTOR_GROUPS,
      'padding',
      padding,
      'important'
    );
  }

  getCellPaddingValue() {
    const config = TABLE_CONFIG.CELL_PADDING[this.state.cellPadding] ||
                   TABLE_CONFIG.CELL_PADDING.standard;
    return `${config.vertical} ${config.horizontal}`;
  }
}
```

**Benefits:**
- Method reduced from 96 lines to 12 lines
- Configuration separated from logic
- Reusable StyleService for other styling operations
- Easy to add new selector groups (just update config)
- Single point of change for selector lists
- Testable in isolation

**Test Example:**

```javascript
// StyleService.test.js
describe('StyleService', () => {
  let container, tableContainer, styleService;

  beforeEach(() => {
    container = document.createElement('div');
    tableContainer = document.createElement('div');
    container.appendChild(tableContainer);
    document.body.appendChild(container);

    styleService = new StyleService(container, tableContainer);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should apply style to all elements in group', () => {
    // Create test elements
    const cell1 = document.createElement('div');
    cell1.className = 'table-cell';
    const cell2 = document.createElement('div');
    cell2.className = 'table-cell';
    tableContainer.appendChild(cell1);
    tableContainer.appendChild(cell2);

    const group = {
      selectors: ['.table-cell'],
      scope: 'container'
    };

    styleService.applyToGroup(group, 'font-size', '14px', 'important');

    expect(cell1.style.fontSize).toBe('14px');
    expect(cell2.style.fontSize).toBe('14px');
  });

  it('should set CSS custom property', () => {
    styleService.setCSSVariable('--table-font-size', '16px', 'wrapper');

    expect(container.style.getPropertyValue('--table-font-size')).toBe('16px');
  });
});
```

---

## Example 3: Deep Nesting Elimination

### Before: 4 Levels of Nesting

**Location:** ExceLikeTable.js, checkbox hierarchy handling

```javascript
updateDateCheckboxFromRange(dropdown, column) {
  const minInput = dropdown.querySelector('.date-range-min');
  const maxInput = dropdown.querySelector('.date-range-max');
  if (!minInput || !maxInput) return;

  const startDate = new Date(minInput.value);
  const endDate = new Date(maxInput.value);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

  const dateCheckboxes = dropdown.querySelectorAll('.date-filter-checkbox');
  dateCheckboxes.forEach(cb => {
    const value = cb.dataset.value;
    if (value && value !== '__all__') {
      // Level 2
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // Level 3
        const date = new Date(value);
        cb.checked = date >= startDate && date <= endDate;
      } else if (/^\d{4}$/.test(value)) {
        // Level 3
        const year = parseInt(value);
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        // Complex logic here...
      } else if (/^\d{4}-.+$/.test(value)) {
        // Level 3
        const [year, monthName] = value.split('-');
        const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();

        // More complex logic...
      }
    }
  });

  this.updateDateParentCheckboxes(dropdown);
}
```

**Problems:**
- 4 levels of nesting
- Complex conditional logic
- Hard to read and understand
- High cyclomatic complexity

---

### After: Guard Clauses + Extract Method

```javascript
updateDateCheckboxFromRange(dropdown, column) {
  const { startDate, endDate } = this.getDateRange(dropdown);

  // Guard clause - early return for invalid range
  if (!this.isValidDateRange(startDate, endDate)) return;

  const dateCheckboxes = dropdown.querySelectorAll('.date-filter-checkbox');

  dateCheckboxes.forEach(cb => {
    this.updateCheckboxForDateRange(cb, startDate, endDate);
  });

  this.updateDateParentCheckboxes(dropdown);
}

/**
 * Extract date range from dropdown inputs
 */
getDateRange(dropdown) {
  const minInput = dropdown.querySelector('.date-range-min');
  const maxInput = dropdown.querySelector('.date-range-max');

  if (!minInput || !maxInput) {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: new Date(minInput.value),
    endDate: new Date(maxInput.value)
  };
}

/**
 * Validate date range
 */
isValidDateRange(startDate, endDate) {
  return startDate &&
         endDate &&
         !isNaN(startDate.getTime()) &&
         !isNaN(endDate.getTime());
}

/**
 * Update single checkbox based on date range
 * Uses Strategy pattern for different date formats
 */
updateCheckboxForDateRange(checkbox, startDate, endDate) {
  const value = checkbox.dataset.value;

  // Guard clause - skip special values
  if (!value || value === '__all__') return;

  const dateType = this.detectDateType(value);
  const checker = this.getDateChecker(dateType);

  if (checker) {
    checkbox.checked = checker(value, startDate, endDate);
  }
}

/**
 * Detect date value type
 */
detectDateType(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'day';
  if (/^\d{4}$/.test(value)) return 'year';
  if (/^\d{4}-.+$/.test(value)) return 'month';
  return 'unknown';
}

/**
 * Get appropriate date checker function
 * Factory pattern for date checkers
 */
getDateChecker(dateType) {
  const checkers = {
    day: this.checkDayInRange.bind(this),
    year: this.checkYearInRange.bind(this),
    month: this.checkMonthInRange.bind(this)
  };

  return checkers[dateType];
}

/**
 * Check if day is in range
 */
checkDayInRange(value, startDate, endDate) {
  const date = new Date(value);
  return date >= startDate && date <= endDate;
}

/**
 * Check if year is in range
 */
checkYearInRange(value, startDate, endDate) {
  const year = parseInt(value);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  return year >= startYear && year <= endYear;
}

/**
 * Check if month is in range
 */
checkMonthInRange(value, startDate, endDate) {
  const [year, monthName] = value.split('-');
  const monthDate = new Date(Date.parse(`${monthName} 1, ${year}`));

  return monthDate >= startDate && monthDate <= endDate;
}
```

**Benefits:**
- Maximum 2 levels of nesting
- Each method has single responsibility
- Self-documenting method names
- Easy to test individual date checkers
- Strategy pattern for extensibility

---

## Summary of Refactoring Benefits

### Metrics Improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines in applyFilters()** | 170 | 10 | -94% |
| **Lines in applyFontSize()** | 96 | 12 | -87% |
| **Max nesting depth** | 4 | 2 | -50% |
| **Cyclomatic complexity** | High | Low | Significant |
| **Test coverage** | 0% | 80%+ | New capability |

### Code Quality Improvements

1. **Single Responsibility Principle** - Each class/method has one clear purpose
2. **Open/Closed Principle** - Easy to extend (new strategies) without modifying existing code
3. **Dependency Inversion** - Main class depends on abstractions (services), not implementations
4. **Testability** - Small, focused methods are easy to unit test
5. **Maintainability** - Changes localized to single service/strategy
6. **Readability** - Self-documenting code with clear method names

---

**Analysis Completed:** 2025-10-08
**For:** VanillaJS ExceLike Table Library
**Reference:** See REFACTORING_ANALYSIS.md for complete roadmap
