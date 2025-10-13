/**
 * Filter Module for ExceLike Table
 * Handles all filtering logic and UI
 */

const FilterModule = {
  /**
   * Apply filters to data
   * @param {Array} data - Original data
   * @param {Object} filters - Active filters
   * @param {Object} columns - Column definitions
   * @returns {Array} - Filtered data
   */
  applyFilters(data, filters, columns) {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(record => {
      return Object.entries(filters).every(([column, filterValue]) => {
        const columnDef = columns.find(col => col.dataIndex === column);
        const value = record[column];

        // Custom filter function
        if (columnDef && columnDef.onFilter) {
          return columnDef.onFilter(filterValue, record);
        }

        // Date hierarchy filter
        if (columnDef && columnDef.filterType === 'date-hierarchy') {
          return this.applyDateHierarchyFilter(value, filterValue);
        }

        // Range filter
        if (columnDef && columnDef.filterType === 'range') {
          return this.applyRangeFilter(value, filterValue);
        }

        // Default text filter
        return this.applyTextFilter(value, filterValue);
      });
    });
  },

  /**
   * Apply text filter
   * @param {any} value - Cell value
   * @param {any} filterValue - Filter criteria
   * @returns {boolean}
   */
  applyTextFilter(value, filterValue) {
    if (!filterValue || filterValue.length === 0) return true;
    
    const stringValue = String(value || '').toLowerCase();
    
    if (Array.isArray(filterValue)) {
      return filterValue.some(fv => 
        stringValue.includes(String(fv).toLowerCase())
      );
    }
    
    return stringValue.includes(String(filterValue).toLowerCase());
  },

  /**
   * Apply date hierarchy filter
   * @param {any} value - Date value
   * @param {Object} filterValue - Date filter criteria
   * @returns {boolean}
   */
  applyDateHierarchyFilter(value, filterValue) {
    if (!filterValue || !value) return true;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Check year
    if (filterValue.years && filterValue.years.length > 0) {
      if (!filterValue.years.includes(year)) return false;
    }

    // Check month
    if (filterValue.months && filterValue.months.length > 0) {
      const monthKey = `${year}-${month}`;
      if (!filterValue.months.includes(monthKey)) return false;
    }

    // Check day
    if (filterValue.days && filterValue.days.length > 0) {
      const dayKey = `${year}-${month}-${day}`;
      if (!filterValue.days.includes(dayKey)) return false;
    }

    return true;
  },

  /**
   * Apply range filter
   * @param {number} value - Numeric value
   * @param {Object} filterValue - Range criteria
   * @returns {boolean}
   */
  applyRangeFilter(value, filterValue) {
    if (!filterValue) return true;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    if (filterValue.min !== undefined && numValue < filterValue.min) {
      return false;
    }

    if (filterValue.max !== undefined && numValue > filterValue.max) {
      return false;
    }

    return true;
  },

  /**
   * Create filter dropdown element
   * @param {Object} column - Column definition
   * @param {any} currentFilter - Current filter value
   * @param {Array} uniqueValues - Unique column values
   * @returns {HTMLElement}
   */
  createFilterDropdown(column, currentFilter, uniqueValues) {
    const dropdown = document.createElement('div');
    dropdown.className = 'table-filter-dropdown';

    if (column.filterType === 'date-hierarchy') {
      return this.createDateHierarchyFilter(dropdown, column, currentFilter, uniqueValues);
    } else if (column.filterType === 'range') {
      return this.createRangeFilter(dropdown, column, currentFilter, uniqueValues);
    } else {
      return this.createTextFilter(dropdown, column, currentFilter, uniqueValues);
    }
  },

  /**
   * Create text filter UI
   * @param {HTMLElement} dropdown - Dropdown container
   * @param {Object} column - Column definition
   * @param {any} currentFilter - Current filter value
   * @param {Array} uniqueValues - Unique column values
   * @returns {HTMLElement}
   */
  createTextFilter(dropdown, column, currentFilter, uniqueValues) {
    // Search input
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'filter-search-wrapper';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'filter-search-input';
    searchInput.placeholder = '検索...';
    searchWrapper.appendChild(searchInput);
    
    dropdown.appendChild(searchWrapper);

    // Options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'filter-options-container';

    // Select all option
    const selectAllWrapper = document.createElement('div');
    selectAllWrapper.className = 'filter-option-wrapper';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.className = 'filter-checkbox filter-select-all';
    selectAllCheckbox.checked = !currentFilter || currentFilter.length === 0;
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'filter-label';
    selectAllLabel.textContent = '(すべて選択)';
    
    selectAllWrapper.appendChild(selectAllCheckbox);
    selectAllWrapper.appendChild(selectAllLabel);
    optionsContainer.appendChild(selectAllWrapper);

    // Individual options
    uniqueValues.forEach(value => {
      const optionWrapper = document.createElement('div');
      optionWrapper.className = 'filter-option-wrapper';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'filter-checkbox';
      checkbox.value = value;
      checkbox.checked = !currentFilter || currentFilter.length === 0 || 
                        (Array.isArray(currentFilter) && currentFilter.includes(value));
      
      const label = document.createElement('label');
      label.className = 'filter-label';
      label.textContent = value || '(空白)';
      
      optionWrapper.appendChild(checkbox);
      optionWrapper.appendChild(label);
      optionsContainer.appendChild(optionWrapper);
    });

    dropdown.appendChild(optionsContainer);

    // Buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'filter-buttons';
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'filter-btn-apply';
    applyBtn.textContent = '適用';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn-clear';
    clearBtn.textContent = 'クリア';
    
    buttonWrapper.appendChild(applyBtn);
    buttonWrapper.appendChild(clearBtn);
    dropdown.appendChild(buttonWrapper);

    return dropdown;
  },

  /**
   * Create date hierarchy filter UI
   * @param {HTMLElement} dropdown - Dropdown container
   * @param {Object} column - Column definition
   * @param {any} currentFilter - Current filter value
   * @param {Array} uniqueValues - Unique date values
   * @returns {HTMLElement}
   */
  createDateHierarchyFilter(dropdown, column, currentFilter, uniqueValues) {
    const container = document.createElement('div');
    container.className = 'date-hierarchy-container';

    // Parse dates and create hierarchy
    const hierarchy = this.buildDateHierarchy(uniqueValues);
    
    // Create year level
    Object.entries(hierarchy).forEach(([year, months]) => {
      const yearWrapper = document.createElement('div');
      yearWrapper.className = 'date-hierarchy-year';
      
      const yearCheckbox = document.createElement('input');
      yearCheckbox.type = 'checkbox';
      yearCheckbox.className = 'filter-checkbox year-checkbox';
      yearCheckbox.value = year;
      yearCheckbox.checked = this.isYearChecked(year, currentFilter);
      
      const yearLabel = document.createElement('label');
      yearLabel.className = 'filter-label expandable';
      yearLabel.textContent = `▶ ${year}年`;
      
      yearWrapper.appendChild(yearCheckbox);
      yearWrapper.appendChild(yearLabel);
      
      // Months container
      const monthsContainer = document.createElement('div');
      monthsContainer.className = 'date-hierarchy-months';
      monthsContainer.style.display = 'none';
      
      Object.entries(months).forEach(([month, days]) => {
        const monthWrapper = document.createElement('div');
        monthWrapper.className = 'date-hierarchy-month';
        
        const monthCheckbox = document.createElement('input');
        monthCheckbox.type = 'checkbox';
        monthCheckbox.className = 'filter-checkbox month-checkbox';
        monthCheckbox.value = `${year}-${month}`;
        monthCheckbox.checked = this.isMonthChecked(year, month, currentFilter);
        
        const monthLabel = document.createElement('label');
        monthLabel.className = 'filter-label';
        monthLabel.textContent = `${month}月`;
        
        monthWrapper.appendChild(monthCheckbox);
        monthWrapper.appendChild(monthLabel);
        monthsContainer.appendChild(monthWrapper);
      });
      
      yearWrapper.appendChild(monthsContainer);
      container.appendChild(yearWrapper);
    });

    dropdown.appendChild(container);

    // Buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'filter-buttons';
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'filter-btn-apply';
    applyBtn.textContent = '適用';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn-clear';
    clearBtn.textContent = 'クリア';
    
    buttonWrapper.appendChild(applyBtn);
    buttonWrapper.appendChild(clearBtn);
    dropdown.appendChild(buttonWrapper);

    return dropdown;
  },

  /**
   * Create range filter UI
   * @param {HTMLElement} dropdown - Dropdown container
   * @param {Object} column - Column definition
   * @param {any} currentFilter - Current filter value
   * @param {Array} uniqueValues - Unique numeric values
   * @returns {HTMLElement}
   */
  createRangeFilter(dropdown, column, currentFilter, uniqueValues) {
    const container = document.createElement('div');
    container.className = 'range-filter-container';

    // Calculate min/max from data
    const numericValues = uniqueValues
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    // Prevent Infinity/-Infinity when array is empty
    const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;

    // Min input
    const minWrapper = document.createElement('div');
    minWrapper.className = 'range-input-wrapper';
    
    const minLabel = document.createElement('label');
    minLabel.textContent = '最小値:';
    
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'range-input';
    minInput.placeholder = dataMin.toString();
    minInput.value = currentFilter?.min || '';
    
    minWrapper.appendChild(minLabel);
    minWrapper.appendChild(minInput);
    container.appendChild(minWrapper);

    // Max input
    const maxWrapper = document.createElement('div');
    maxWrapper.className = 'range-input-wrapper';
    
    const maxLabel = document.createElement('label');
    maxLabel.textContent = '最大値:';
    
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'range-input';
    maxInput.placeholder = dataMax.toString();
    maxInput.value = currentFilter?.max || '';
    
    maxWrapper.appendChild(maxLabel);
    maxWrapper.appendChild(maxInput);
    container.appendChild(maxWrapper);

    dropdown.appendChild(container);

    // Buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'filter-buttons';
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'filter-btn-apply';
    applyBtn.textContent = '適用';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn-clear';
    clearBtn.textContent = 'クリア';
    
    buttonWrapper.appendChild(applyBtn);
    buttonWrapper.appendChild(clearBtn);
    dropdown.appendChild(buttonWrapper);

    return dropdown;
  },

  /**
   * Build date hierarchy from date values
   * @param {Array} dateValues - Array of date values
   * @returns {Object} - Hierarchical date structure
   */
  buildDateHierarchy(dateValues) {
    const hierarchy = {};
    
    dateValues.forEach(value => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      if (!hierarchy[year]) hierarchy[year] = {};
      if (!hierarchy[year][month]) hierarchy[year][month] = [];
      hierarchy[year][month].push(day);
    });
    
    return hierarchy;
  },

  /**
   * Check if year is selected in filter
   */
  isYearChecked(year, filter) {
    if (!filter || !filter.years) return true;
    return filter.years.includes(parseInt(year));
  },

  /**
   * Check if month is selected in filter
   */
  isMonthChecked(year, month, filter) {
    if (!filter || !filter.months) return true;
    return filter.months.includes(`${year}-${month}`);
  }
};

// Export for different environments
// ES modules export
export default FilterModule;

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterModule;
}

// Browser global
if (typeof window !== 'undefined') {
  window.FilterModule = FilterModule;
}