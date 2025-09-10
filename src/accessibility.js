/**
 * Accessibility Module for ExceLike Table
 * Handles ARIA attributes, keyboard navigation, and screen reader support
 */

const AccessibilityModule = {
  /**
   * Initialize accessibility features for a table
   * @param {Object} table - Table instance
   * @param {Object} options - Accessibility options
   */
  init(table, options = {}) {
    const {
      announceChanges = true,
      keyboardNavigation = true,
      screenReader = true,
      highContrast = false,
      focusManagement = true
    } = options;

    this.table = table;
    this.options = options;
    this.currentFocus = { row: -1, column: -1 };
    this.announcer = null;

    if (screenReader) {
      this.setupScreenReader();
    }

    if (keyboardNavigation) {
      this.setupKeyboardNavigation();
    }

    if (focusManagement) {
      this.setupFocusManagement();
    }

    if (announceChanges) {
      this.setupAnnouncements();
    }

    if (highContrast) {
      this.setupHighContrast();
    }

    this.setupARIAAttributes();
  },

  /**
   * Setup screen reader support
   */
  setupScreenReader() {
    // Create live region for announcements
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(this.announcer);

    // Create assertive announcer for urgent messages
    this.assertiveAnnouncer = document.createElement('div');
    this.assertiveAnnouncer.setAttribute('aria-live', 'assertive');
    this.assertiveAnnouncer.setAttribute('aria-atomic', 'true');
    this.assertiveAnnouncer.className = 'sr-only';
    this.assertiveAnnouncer.style.cssText = this.announcer.style.cssText;
    
    document.body.appendChild(this.assertiveAnnouncer);
  },

  /**
   * Setup ARIA attributes for table elements
   */
  setupARIAAttributes() {
    const tableElement = this.table.container.querySelector('.table');
    const wrapper = this.table.container.querySelector('.excelike-table-wrapper');
    
    if (wrapper) {
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', this.t('table.label', 'Data table'));
      wrapper.setAttribute('tabindex', '0');
    }

    if (tableElement) {
      tableElement.setAttribute('role', 'table');
      tableElement.setAttribute('aria-rowcount', this.table.state.filteredData.length + 1); // +1 for header
      tableElement.setAttribute('aria-colcount', this.table.options.columns.length);
    }

    this.updateHeaderARIA();
    this.updateRowsARIA();
    this.updatePaginationARIA();
  },

  /**
   * Update header ARIA attributes
   */
  updateHeaderARIA() {
    const headerRow = this.table.container.querySelector('.table-header tr');
    if (headerRow) {
      headerRow.setAttribute('role', 'row');
      headerRow.setAttribute('aria-rowindex', '1');

      const headers = headerRow.querySelectorAll('th');
      headers.forEach((header, index) => {
        header.setAttribute('role', 'columnheader');
        header.setAttribute('aria-colindex', index + 1);
        header.setAttribute('tabindex', '0');
        
        // Add sort state
        const column = this.table.options.columns[index];
        if (column && column.sortable) {
          const sortState = this.getSortState(column.key);
          header.setAttribute('aria-sort', sortState);
          header.setAttribute('aria-label', 
            this.t('column.sortable', `${column.title}, sortable column, currently ${sortState}`)
          );
        } else {
          header.setAttribute('aria-label', column.title);
        }

        // Add filter state
        if (column && column.filterable) {
          const hasFilter = this.table.state.filters[column.dataIndex];
          if (hasFilter) {
            const currentLabel = header.getAttribute('aria-label') || '';
            header.setAttribute('aria-label', 
              currentLabel + ', ' + this.t('column.filtered', 'filtered')
            );
          }
        }
      });
    }
  },

  /**
   * Update rows ARIA attributes
   */
  updateRowsARIA() {
    const rows = this.table.container.querySelectorAll('.table-body tr');
    rows.forEach((row, index) => {
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', index + 2); // +2 because header is row 1
      row.setAttribute('tabindex', '-1');

      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cellIndex) => {
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-colindex', cellIndex + 1);
        cell.setAttribute('tabindex', '-1');
      });
    });
  },

  /**
   * Update pagination ARIA attributes
   */
  updatePaginationARIA() {
    const pagination = this.table.container.querySelector('.table-pagination');
    if (pagination) {
      pagination.setAttribute('role', 'navigation');
      pagination.setAttribute('aria-label', this.t('pagination.label', 'Table pagination'));

      const pageButtons = pagination.querySelectorAll('.pagination-page');
      pageButtons.forEach(button => {
        const page = button.dataset.page;
        const isActive = button.classList.contains('active');
        
        button.setAttribute('aria-label', 
          isActive ? 
            this.t('pagination.currentPage', `Page ${page}, current page`) :
            this.t('pagination.goToPage', `Go to page ${page}`)
        );
      });

      const prevButton = pagination.querySelector('.pagination-prev');
      const nextButton = pagination.querySelector('.pagination-next');
      
      if (prevButton) {
        prevButton.setAttribute('aria-label', this.t('pagination.previous', 'Previous page'));
      }
      
      if (nextButton) {
        nextButton.setAttribute('aria-label', this.t('pagination.next', 'Next page'));
      }
    }
  },

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    const wrapper = this.table.container.querySelector('.excelike-table-wrapper');
    if (!wrapper) return;

    wrapper.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Focus management
    wrapper.addEventListener('focusin', (e) => {
      this.handleFocusIn(e);
    });

    wrapper.addEventListener('focusout', (e) => {
      this.handleFocusOut(e);
    });
  },

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    const { key, ctrlKey, shiftKey, altKey } = e;
    
    // Get current focused element
    const focusedElement = document.activeElement;
    const isInTable = this.table.container.contains(focusedElement);
    
    if (!isInTable) return;

    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        this.navigateVertical(-1, focusedElement);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        this.navigateVertical(1, focusedElement);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateHorizontal(-1, focusedElement);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        this.navigateHorizontal(1, focusedElement);
        break;
        
      case 'Home':
        e.preventDefault();
        if (ctrlKey) {
          this.navigateToFirst();
        } else {
          this.navigateToRowStart();
        }
        break;
        
      case 'End':
        e.preventDefault();
        if (ctrlKey) {
          this.navigateToLast();
        } else {
          this.navigateToRowEnd();
        }
        break;
        
      case 'PageUp':
        e.preventDefault();
        this.navigatePage(-1);
        break;
        
      case 'PageDown':
        e.preventDefault();
        this.navigatePage(1);
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.activateElement(focusedElement);
        break;
        
      case 'Escape':
        e.preventDefault();
        this.closeActiveElements();
        break;
        
      case 'Tab':
        this.handleTabNavigation(e);
        break;
    }
  },

  /**
   * Navigate vertically (up/down)
   */
  navigateVertical(direction, currentElement) {
    const position = this.getElementPosition(currentElement);
    if (!position) return;

    let targetRow = position.row + direction;
    
    // Handle header navigation
    if (position.type === 'header' && direction > 0) {
      targetRow = 0; // First data row
      const targetCell = this.getCellAt(targetRow, position.column);
      if (targetCell) {
        targetCell.focus();
        this.announceNavigation(targetRow, position.column);
      }
      return;
    }

    // Handle data row navigation
    if (position.type === 'cell') {
      if (direction < 0 && targetRow < 0) {
        // Go to header
        const headerCell = this.getHeaderCellAt(position.column);
        if (headerCell) {
          headerCell.focus();
          this.announceNavigation('header', position.column);
        }
        return;
      }

      const maxRow = this.table.state.filteredData.length - 1;
      if (targetRow > maxRow) return;

      const targetCell = this.getCellAt(targetRow, position.column);
      if (targetCell) {
        targetCell.focus();
        this.announceNavigation(targetRow, position.column);
      }
    }
  },

  /**
   * Navigate horizontally (left/right)
   */
  navigateHorizontal(direction, currentElement) {
    const position = this.getElementPosition(currentElement);
    if (!position) return;

    const targetColumn = position.column + direction;
    const maxColumn = this.table.options.columns.length - 1;

    if (targetColumn < 0 || targetColumn > maxColumn) return;

    let targetElement;
    if (position.type === 'header') {
      targetElement = this.getHeaderCellAt(targetColumn);
    } else {
      targetElement = this.getCellAt(position.row, targetColumn);
    }

    if (targetElement) {
      targetElement.focus();
      this.announceNavigation(position.row, targetColumn);
    }
  },

  /**
   * Get element position in table grid
   */
  getElementPosition(element) {
    if (element.tagName === 'TH') {
      const headerRow = element.parentElement;
      const headers = Array.from(headerRow.children);
      return {
        type: 'header',
        row: 'header',
        column: headers.indexOf(element)
      };
    }

    if (element.tagName === 'TD') {
      const row = element.parentElement;
      const rows = Array.from(this.table.container.querySelectorAll('.table-body tr'));
      const cells = Array.from(row.children);
      
      return {
        type: 'cell',
        row: rows.indexOf(row),
        column: cells.indexOf(element)
      };
    }

    return null;
  },

  /**
   * Get cell at specific position
   */
  getCellAt(row, column) {
    const rows = this.table.container.querySelectorAll('.table-body tr');
    if (row < 0 || row >= rows.length) return null;
    
    const cells = rows[row].querySelectorAll('td');
    if (column < 0 || column >= cells.length) return null;
    
    return cells[column];
  },

  /**
   * Get header cell at specific column
   */
  getHeaderCellAt(column) {
    const headers = this.table.container.querySelectorAll('.table-header th');
    if (column < 0 || column >= headers.length) return null;
    
    return headers[column];
  },

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Add focus styles
    const style = document.createElement('style');
    style.textContent = `
      .excelike-table-wrapper:focus {
        outline: 2px solid #1890ff;
        outline-offset: -2px;
      }
      
      .excelike-table th:focus,
      .excelike-table td:focus {
        outline: 2px solid #1890ff;
        outline-offset: -2px;
        background-color: #e6f7ff;
        position: relative;
        z-index: 1;
      }
      
      .excelike-table .focus-trap {
        position: relative;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .excelike-table * {
          transition: none !important;
          animation: none !important;
        }
      }
      
      @media (prefers-high-contrast: high) {
        .excelike-table {
          border: 2px solid;
        }
        
        .excelike-table th,
        .excelike-table td {
          border: 1px solid;
        }
      }
    `;
    
    document.head.appendChild(style);
  },

  /**
   * Setup announcements for screen readers
   */
  setupAnnouncements() {
    // Listen for table state changes
    if (this.table.on) {
      this.table.on('sort', (data) => {
        this.announce(
          this.t('sort.announced', `Table sorted by ${data.column} ${data.direction}`)
        );
      });

      this.table.on('filter', (data) => {
        this.announce(
          this.t('filter.announced', `Table filtered, ${this.table.state.filteredData.length} rows visible`)
        );
      });

      this.table.on('pageChange', (data) => {
        this.announce(
          this.t('pagination.announced', `Page ${data.page} of ${Math.ceil(this.table.state.filteredData.length / data.pageSize)}`)
        );
      });
    }
  },

  /**
   * Setup high contrast mode
   */
  setupHighContrast() {
    const wrapper = this.table.container.querySelector('.excelike-table-wrapper');
    if (wrapper) {
      wrapper.classList.add('high-contrast-mode');
    }
  },

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {boolean} assertive - Whether to use assertive live region
   */
  announce(message, assertive = false) {
    const announcer = assertive ? this.assertiveAnnouncer : this.announcer;
    if (announcer) {
      announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  },

  /**
   * Announce navigation changes
   */
  announceNavigation(row, column) {
    const columnName = this.table.options.columns[column]?.title || `Column ${column + 1}`;
    let message;

    if (row === 'header') {
      message = this.t('nav.header', `${columnName} column header`);
    } else {
      const rowData = this.table.state.filteredData[row];
      const cellValue = rowData ? rowData[this.table.options.columns[column].dataIndex] : '';
      message = this.t('nav.cell', `Row ${row + 1}, ${columnName}, ${cellValue}`);
    }

    this.announce(message, true);
  },

  /**
   * Get sort state for ARIA
   */
  getSortState(columnKey) {
    const sortState = this.table.state.sortState;
    if (sortState.column === columnKey) {
      return sortState.direction === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  },

  /**
   * Simple translation function
   */
  t(key, defaultValue) {
    // This would integrate with the i18n system
    return defaultValue;
  },

  /**
   * Navigate to first element
   */
  navigateToFirst() {
    const firstHeader = this.getHeaderCellAt(0);
    if (firstHeader) {
      firstHeader.focus();
    }
  },

  /**
   * Navigate to last element
   */
  navigateToLast() {
    const lastRow = this.table.state.filteredData.length - 1;
    const lastColumn = this.table.options.columns.length - 1;
    const lastCell = this.getCellAt(lastRow, lastColumn);
    if (lastCell) {
      lastCell.focus();
    }
  },

  /**
   * Navigate to start of current row
   */
  navigateToRowStart() {
    const currentElement = document.activeElement;
    const position = this.getElementPosition(currentElement);
    if (position) {
      let targetElement;
      if (position.type === 'header') {
        targetElement = this.getHeaderCellAt(0);
      } else {
        targetElement = this.getCellAt(position.row, 0);
      }
      if (targetElement) {
        targetElement.focus();
      }
    }
  },

  /**
   * Navigate to end of current row
   */
  navigateToRowEnd() {
    const currentElement = document.activeElement;
    const position = this.getElementPosition(currentElement);
    if (position) {
      const lastColumn = this.table.options.columns.length - 1;
      let targetElement;
      if (position.type === 'header') {
        targetElement = this.getHeaderCellAt(lastColumn);
      } else {
        targetElement = this.getCellAt(position.row, lastColumn);
      }
      if (targetElement) {
        targetElement.focus();
      }
    }
  },

  /**
   * Navigate by page
   */
  navigatePage(direction) {
    const currentPage = this.table.state.currentPage;
    const pageSize = this.table.state.pageSize;
    const totalPages = Math.ceil(this.table.state.filteredData.length / pageSize);
    
    let targetPage = currentPage + direction;
    targetPage = Math.max(1, Math.min(targetPage, totalPages));
    
    if (targetPage !== currentPage && this.table.setPage) {
      this.table.setPage(targetPage);
    }
  },

  /**
   * Activate focused element
   */
  activateElement(element) {
    if (element.tagName === 'TH' && element.getAttribute('aria-sort') !== null) {
      // Sort column
      element.click();
    } else if (element.tagName === 'BUTTON') {
      // Button click
      element.click();
    } else if (element.tagName === 'TD') {
      // Cell activation - could trigger row selection or editing
      element.click();
    }
  },

  /**
   * Close active elements (filters, menus)
   */
  closeActiveElements() {
    // Close any open dropdowns, filters, etc.
    const openDropdowns = this.table.container.querySelectorAll('[aria-expanded="true"]');
    openDropdowns.forEach(element => {
      element.setAttribute('aria-expanded', 'false');
    });

    if (this.table.closeFilter) {
      this.table.closeFilter();
    }
  },

  /**
   * Handle tab navigation
   */
  handleTabNavigation(e) {
    // Allow natural tab flow within table components
    // This is where you might implement focus trapping if needed
  },

  /**
   * Handle focus in events
   */
  handleFocusIn(e) {
    const element = e.target;
    if (element.tagName === 'TH' || element.tagName === 'TD') {
      const position = this.getElementPosition(element);
      if (position) {
        this.currentFocus = position;
      }
    }
  },

  /**
   * Handle focus out events
   */
  handleFocusOut(e) {
    // Could be used for cleanup or state management
  },

  /**
   * Update accessibility when table changes
   */
  update() {
    this.updateHeaderARIA();
    this.updateRowsARIA();
    this.updatePaginationARIA();
  },

  /**
   * Cleanup accessibility features
   */
  destroy() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
    
    if (this.assertiveAnnouncer && this.assertiveAnnouncer.parentNode) {
      this.assertiveAnnouncer.parentNode.removeChild(this.assertiveAnnouncer);
    }
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityModule;
}

if (typeof window !== 'undefined') {
  window.AccessibilityModule = AccessibilityModule;
}