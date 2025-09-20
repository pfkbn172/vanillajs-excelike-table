/**
 * ExceLike Table - Data Processing Module
 * Handles sorting, pagination logic, data transformation and filtering application
 */

/**
 * Data Processing Mixin
 * Contains all data manipulation and processing functionality
 */
const ExceLikeTableDataMixin = {
  /**
   * Apply sorting to filtered data
   */
  applySorting() {
    if (!this.state.sortColumn || !this.state.sortDirection) {
      return;
    }

    const column = this.options.columns.find(col => col.key === this.state.sortColumn);
    if (!column) return;

    this.state.filteredData.sort((a, b) => {
      let aVal = a[column.dataIndex || column.key];
      let bVal = b[column.dataIndex || column.key];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return this.state.sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return this.state.sortDirection === 'asc' ? 1 : -1;

      // Convert to comparable values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        aVal = aVal.getTime();
        bVal = bVal.getTime();
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        // Try to parse as dates
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          aVal = aDate.getTime();
          bVal = bDate.getTime();
        }
      }

      // Handle numbers (including string numbers)
      if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) {
        aVal = parseFloat(aVal);
      }
      if (typeof bVal === 'string' && !isNaN(parseFloat(bVal))) {
        bVal = parseFloat(bVal);
      }

      // Compare values
      let result = 0;
      if (aVal < bVal) {
        result = -1;
      } else if (aVal > bVal) {
        result = 1;
      }

      return this.state.sortDirection === 'asc' ? result : -result;
    });
  },

  /**
   * Apply filters and sorting to data
   */
  applyFiltersAndSort() {
    if (!this.state.data || !Array.isArray(this.state.data)) {
      console.warn('applyFiltersAndSort: No valid data available');
      this.state.filteredData = [];
      return;
    }

    // Start with original data
    this.state.filteredData = [...this.state.data];

    // Apply filters
    this.applyFilters();

    // Apply sorting
    this.applySorting();

    // Reset to first page when data changes
    this.state.currentPage = 1;

    // Emit event for external listeners
    if (this.options.onDataChange) {
      this.options.onDataChange({
        filteredData: this.state.filteredData,
        totalRecords: this.state.data.length,
        filteredRecords: this.state.filteredData.length
      });
    }
  },

  /**
   * Apply all active filters
   */
  applyFilters() {
    Object.keys(this.state.filters).forEach(columnKey => {
      const filterValue = this.state.filters[columnKey];
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return;
      }

      const column = this.options.columns.find(col => col.key === columnKey);
      if (!column) return;

      this.state.filteredData = this.state.filteredData.filter(row => {
        const cellValue = row[column.dataIndex || column.key];
        return this.matchesFilter(cellValue, filterValue, column);
      });
    });
  },

  /**
   * Check if a cell value matches a filter
   */
  matchesFilter(cellValue, filterValue, column) {
    if (cellValue == null) {
      return false;
    }

    const filterType = column.filterType || 'text';

    switch (filterType) {
      case 'range':
        return this.matchesRangeFilter(cellValue, filterValue);
      case 'dateHierarchy':
        return this.matchesDateHierarchyFilter(cellValue, filterValue);
      case 'text':
      default:
        return this.matchesTextFilter(cellValue, filterValue);
    }
  },

  /**
   * Check if value matches text filter
   */
  matchesTextFilter(cellValue, filterValue) {
    if (Array.isArray(filterValue)) {
      // Multiple select filter
      const strValue = String(cellValue).toLowerCase();
      return filterValue.some(fv => {
        const filterStr = String(fv).toLowerCase();
        return strValue.includes(filterStr);
      });
    } else {
      // Single text filter
      const strValue = String(cellValue).toLowerCase();
      const filterStr = String(filterValue).toLowerCase();
      return strValue.includes(filterStr);
    }
  },

  /**
   * Check if value matches range filter
   */
  matchesRangeFilter(cellValue, filterValue) {
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
  },

  /**
   * Check if value matches date hierarchy filter
   */
  matchesDateHierarchyFilter(cellValue, filterValue) {
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
      if (month && date.getMonth() !== month - 1) return false; // Month is 0-indexed
      if (day && date.getDate() !== day) return false;
      
      return true;
    });
  },

  /**
   * Get paginated data for current page
   */
  getPaginatedData() {
    if (!this.isFeatureEnabled('pagination')) {
      return this.state.filteredData;
    }

    const startIndex = (this.state.currentPage - 1) * this.state.pageSize;
    const endIndex = startIndex + this.state.pageSize;
    
    return this.state.filteredData.slice(startIndex, endIndex);
  },

  /**
   * Get current page data for rendering
   */
  getCurrentPageData() {
    return this.getPaginatedData();
  },

  /**
   * Get total number of pages
   */
  getTotalPages() {
    if (!this.isFeatureEnabled('pagination')) {
      return 1;
    }
    return Math.ceil(this.state.filteredData.length / this.state.pageSize);
  },

  /**
   * Set page size and adjust current page if needed
   */
  setPageSize(size) {
    const oldPageSize = this.state.pageSize;
    this.state.pageSize = size;
    
    // Adjust current page to maintain roughly the same position
    const currentItemIndex = (this.state.currentPage - 1) * oldPageSize;
    this.state.currentPage = Math.floor(currentItemIndex / size) + 1;
    
    // Ensure page is within bounds
    const totalPages = this.getTotalPages();
    if (this.state.currentPage > totalPages) {
      this.state.currentPage = Math.max(1, totalPages);
    }
  },

  /**
   * Go to specific page
   */
  goToPage(page) {
    const totalPages = this.getTotalPages();
    this.state.currentPage = Math.max(1, Math.min(page, totalPages));
  },

  /**
   * Go to next page
   */
  nextPage() {
    const totalPages = this.getTotalPages();
    if (this.state.currentPage < totalPages) {
      this.state.currentPage++;
    }
  },

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.state.currentPage > 1) {
      this.state.currentPage--;
    }
  },

  /**
   * Set filters for a column
   */
  setFilters(columnKey, filters) {
    if (!filters || (Array.isArray(filters) && filters.length === 0)) {
      delete this.state.filters[columnKey];
    } else {
      this.state.filters[columnKey] = filters;
    }
    
    this.applyFiltersAndSort();
  },

  /**
   * Get filters for a column
   */
  getFilters(columnKey) {
    return this.state.filters[columnKey] || null;
  },

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.state.filters = {};
    this.applyFiltersAndSort();
  },

  /**
   * Clear filter for specific column
   */
  clearFilter(columnKey) {
    delete this.state.filters[columnKey];
    this.applyFiltersAndSort();
  },

  /**
   * Set sorting
   */
  setSorting(columnKey, direction) {
    this.state.sortColumn = columnKey;
    this.state.sortDirection = direction;
    this.applyFiltersAndSort();
  },

  /**
   * Clear sorting
   */
  clearSorting() {
    this.state.sortColumn = null;
    this.state.sortDirection = null;
    this.applyFiltersAndSort();
  },

  /**
   * Get unique values for a column (for filter options)
   */
  getUniqueColumnValues(columnKey) {
    const column = this.options.columns.find(col => col.key === columnKey);
    if (!column) return [];

    const values = new Set();
    this.state.data.forEach(row => {
      const value = row[column.dataIndex || column.key];
      if (value != null) {
        values.add(value);
      }
    });

    return Array.from(values).sort();
  },

  /**
   * Get min/max values for a numeric column
   */
  getColumnRange(columnKey) {
    const column = this.options.columns.find(col => col.key === columnKey);
    if (!column) return { min: 0, max: 0 };

    let min = Infinity;
    let max = -Infinity;

    this.state.data.forEach(row => {
      const value = parseFloat(row[column.dataIndex || column.key]);
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max
    };
  },

  /**
   * Group dates by hierarchy (year/month/day)
   */
  groupDatesByHierarchy(columnKey) {
    const column = this.options.columns.find(col => col.key === columnKey);
    if (!column) return {};

    const hierarchy = {};

    this.state.data.forEach(row => {
      const value = row[column.dataIndex || column.key];
      const date = value instanceof Date ? value : new Date(value);
      
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-indexed
        const day = date.getDate();

        if (!hierarchy[year]) hierarchy[year] = {};
        if (!hierarchy[year][month]) hierarchy[year][month] = {};
        if (!hierarchy[year][month][day]) hierarchy[year][month][day] = 0;
        
        hierarchy[year][month][day]++;
      }
    });

    return hierarchy;
  },

  /**
   * Search data across all columns
   */
  searchData(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.state.filteredData = [...this.state.data];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    this.state.filteredData = this.state.data.filter(row => {
      return this.options.columns.some(column => {
        const value = row[column.dataIndex || column.key];
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(term);
      });
    });

    this.state.currentPage = 1; // Reset to first page
  },

  /**
   * Export filtered data
   */
  exportData(format = 'json') {
    const data = this.state.filteredData;
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  },

  /**
   * Export data to CSV format
   */
  exportToCSV(data) {
    if (!data || data.length === 0) return '';

    const visibleColumns = this.getVisibleColumns();
    
    // Create header row
    const headers = visibleColumns.map(col => col.title || col.key);
    
    // Create data rows
    const rows = data.map(row => {
      return visibleColumns.map(col => {
        const value = row[col.dataIndex || col.key];
        // Escape quotes and wrap in quotes if contains comma
        const strValue = String(value || '');
        return strValue.includes(',') || strValue.includes('"') 
          ? `"${strValue.replace(/"/g, '""')}"` 
          : strValue;
      });
    });

    // Combine headers and rows
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  /**
   * Get data statistics
   */
  getDataStats() {
    return {
      totalRecords: this.state.data.length,
      filteredRecords: this.state.filteredData.length,
      currentPage: this.state.currentPage,
      totalPages: this.getTotalPages(),
      pageSize: this.state.pageSize,
      hasFilters: Object.keys(this.state.filters).length > 0,
      hasSorting: !!this.state.sortColumn
    };
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExceLikeTableDataMixin;
}

if (typeof window !== 'undefined') {
  window.ExceLikeTableDataMixin = ExceLikeTableDataMixin;
}