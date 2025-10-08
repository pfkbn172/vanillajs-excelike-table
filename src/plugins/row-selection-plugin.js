/**
 * Row Selection Plugin
 * Enhanced row selection with checkbox support and bulk operations
 */

const RowSelectionPlugin = {
  name: 'Row Selection',
  version: '1.0.0',
  description: 'Enhanced row selection with checkboxes and bulk operations',
  author: 'ExceLike Table Team',

  // Plugin state
  selectedRows: new Set(),
  selectAllState: false,
  selectionMode: 'multiple', // 'single', 'multiple', 'none'
  
  /**
   * Initialize plugin
   * @param {Object} table - Table instance
   * @param {Object} api - Plugin API
   */
  init(table, api) {
    this.table = table;
    this.api = api;
    
    // Load configuration
    this.loadConfig();
    
    // Add CSS for selection
    this.addStyles();
    
    // Hook into table rendering
    this.api.registerHook('render:beforeRender', this.beforeRender.bind(this));
    this.api.registerHook('render:afterRender', this.afterRender.bind(this));
    
    // Handle row clicks
    this.api.addEventListener('click', this.handleRowClick.bind(this));
    
    // Add selection toolbar
    this.createSelectionToolbar();
  },

  /**
   * Load plugin configuration
   */
  loadConfig() {
    const savedConfig = this.api.getStorage('config', 'row-selection');
    this.config = {
      showCheckboxes: true,
      allowSelectAll: true,
      highlightSelected: true,
      selectionMode: 'multiple',
      showSelectionToolbar: true,
      ...savedConfig
    };
  },

  /**
   * Add plugin styles
   */
  addStyles() {
    const css = `
      /* Selection checkbox styles */
      .table-selection-checkbox {
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 2px;
      }
      
      .table-selection-header {
        width: 40px;
        text-align: center;
        padding: 8px 4px;
        user-select: none;
      }
      
      .table-selection-cell {
        width: 40px;
        text-align: center;
        padding: 8px 4px;
        cursor: pointer;
      }
      
      /* Selected row styles */
      .table-row-selected {
        background-color: var(--table-color-background-selected, #e6f7ff) !important;
        border-color: var(--table-color-primary, #1890ff) !important;
      }
      
      .table-row-selected td {
        background-color: var(--table-color-background-selected, #e6f7ff);
      }
      
      /* Selection toolbar */
      .table-selection-toolbar {
        padding: 8px 16px;
        background: var(--table-color-background-secondary, #fafafa);
        border: 1px solid var(--table-color-border, #d9d9d9);
        border-bottom: none;
        display: none;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: var(--table-color-text-secondary, #666);
      }
      
      .table-selection-toolbar.visible {
        display: flex;
      }
      
      .table-selection-count {
        font-weight: 500;
        color: var(--table-color-primary, #1890ff);
      }
      
      .table-selection-actions {
        display: flex;
        gap: 8px;
      }
      
      .table-selection-action {
        padding: 4px 8px;
        border: 1px solid var(--table-color-border, #d9d9d9);
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .table-selection-action:hover {
        border-color: var(--table-color-primary, #1890ff);
        color: var(--table-color-primary, #1890ff);
      }
      
      /* Select all checkbox states */
      .table-select-all-checkbox.indeterminate {
        opacity: 0.6;
      }
      
      /* Row hover effects */
      .table-row:hover .table-selection-cell {
        background-color: var(--table-color-background-hover, #f5f5f5);
      }
    `;
    
    this.api.addCSS(css, 'row-selection-plugin');
  },

  /**
   * Before render hook
   */
  beforeRender() {
    // Add selection column if needed
    if (this.config.showCheckboxes && this.config.selectionMode !== 'none') {
      this.addSelectionColumn();
    }
  },

  /**
   * After render hook
   */
  afterRender() {
    // Update selection state
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.updateSelectionToolbar();
  },

  /**
   * Add selection column to table
   */
  addSelectionColumn() {
    const columns = this.table.options.columns;
    
    // Check if selection column already exists
    const hasSelectionColumn = columns.some(col => col.key === '_selection');
    if (hasSelectionColumn) return;
    
    // Add selection column at the beginning
    const selectionColumn = {
      key: '_selection',
      title: this.config.allowSelectAll ? this.createSelectAllCheckbox() : '',
      dataIndex: '_selection',
      width: 40,
      fixed: 'left',
      render: (value, record, column, index) => {
        return this.createRowCheckbox(record, index);
      },
      className: 'table-selection-header'
    };
    
    columns.unshift(selectionColumn);
  },

  /**
   * Create select all checkbox
   * @returns {string} Checkbox HTML
   */
  createSelectAllCheckbox() {
    const checkbox = this.api.createElement('input', {
      type: 'checkbox',
      class: 'table-selection-checkbox table-select-all-checkbox',
      title: 'Select All'
    });
    
    checkbox.addEventListener('change', this.handleSelectAll.bind(this));
    
    return checkbox.outerHTML;
  },

  /**
   * Create row checkbox
   * @param {Object} record - Row data
   * @param {number} index - Row index
   * @returns {string} Checkbox HTML
   */
  createRowCheckbox(record, index) {
    const isSelected = this.isRowSelected(record);
    
    const checkbox = this.api.createElement('input', {
      type: 'checkbox',
      class: 'table-selection-checkbox table-row-checkbox',
      'data-row-index': index,
      checked: isSelected,
      title: isSelected ? 'Deselect Row' : 'Select Row'
    });
    
    checkbox.addEventListener('change', (e) => this.handleRowSelect(e, record, index));
    
    return checkbox.outerHTML;
  },

  /**
   * Handle row click for selection
   * @param {Event} event - Click event
   */
  handleRowClick(event) {
    const row = event.target.closest('.table-row');
    if (!row) return;
    
    const rowIndex = parseInt(row.dataset.rowIndex);
    const record = this.table.getRowData(rowIndex);
    
    if (!record) return;
    
    // Skip if clicking on checkbox or other interactive elements
    if (event.target.matches('.table-selection-checkbox, button, a, input, select')) {
      return;
    }
    
    // Handle selection based on mode
    if (this.config.selectionMode === 'single') {
      this.selectSingleRow(record);
    } else if (this.config.selectionMode === 'multiple') {
      if (event.ctrlKey || event.metaKey) {
        this.toggleRowSelection(record);
      } else if (event.shiftKey && this.lastSelectedIndex !== undefined) {
        this.selectRangeRows(this.lastSelectedIndex, rowIndex);
      } else {
        this.selectSingleRow(record);
      }
    }
    
    this.lastSelectedIndex = rowIndex;
  },

  /**
   * Handle select all checkbox
   * @param {Event} event - Change event
   */
  handleSelectAll(event) {
    const checked = event.target.checked;
    
    if (checked) {
      this.selectAllRows();
    } else {
      this.deselectAllRows();
    }
  },

  /**
   * Handle individual row selection
   * @param {Event} event - Change event
   * @param {Object} record - Row data
   * @param {number} index - Row index
   */
  handleRowSelect(event, record, index) {
    event.stopPropagation();
    
    const checked = event.target.checked;
    
    if (checked) {
      this.selectRow(record);
    } else {
      this.deselectRow(record);
    }
  },

  /**
   * Select a single row (deselects others)
   * @param {Object} record - Row data
   */
  selectSingleRow(record) {
    this.selectedRows.clear();
    this.selectRow(record);
  },

  /**
   * Select a row
   * @param {Object} record - Row data
   */
  selectRow(record) {
    const rowId = this.getRowId(record);
    this.selectedRows.add(rowId);
    
    this.emitSelectionChange();
    this.updateUI();
  },

  /**
   * Deselect a row
   * @param {Object} record - Row data
   */
  deselectRow(record) {
    const rowId = this.getRowId(record);
    this.selectedRows.delete(rowId);
    
    this.emitSelectionChange();
    this.updateUI();
  },

  /**
   * Toggle row selection
   * @param {Object} record - Row data
   */
  toggleRowSelection(record) {
    if (this.isRowSelected(record)) {
      this.deselectRow(record);
    } else {
      this.selectRow(record);
    }
  },

  /**
   * Select all rows
   */
  selectAllRows() {
    const allData = this.table.getFilteredData();
    allData.forEach(record => {
      this.selectedRows.add(this.getRowId(record));
    });
    
    this.selectAllState = true;
    this.emitSelectionChange();
    this.updateUI();
  },

  /**
   * Deselect all rows
   */
  deselectAllRows() {
    this.selectedRows.clear();
    this.selectAllState = false;
    
    this.emitSelectionChange();
    this.updateUI();
  },

  /**
   * Select range of rows
   * @param {number} startIndex - Start index
   * @param {number} endIndex - End index
   */
  selectRangeRows(startIndex, endIndex) {
    const allData = this.table.getFilteredData();
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    for (let i = start; i <= end; i++) {
      if (allData[i]) {
        this.selectedRows.add(this.getRowId(allData[i]));
      }
    }
    
    this.emitSelectionChange();
    this.updateUI();
  },

  /**
   * Check if row is selected
   * @param {Object} record - Row data
   * @returns {boolean} Is selected
   */
  isRowSelected(record) {
    return this.selectedRows.has(this.getRowId(record));
  },

  /**
   * Get row ID
   * @param {Object} record - Row data
   * @returns {string} Row ID
   */
  getRowId(record) {
    // Use primary key if available, otherwise use JSON string
    return record.id !== undefined ? String(record.id) : JSON.stringify(record);
  },

  /**
   * Get selected rows
   * @returns {Array} Selected row data
   */
  getSelectedRows() {
    const allData = this.table.getFilteredData();
    return allData.filter(record => this.isRowSelected(record));
  },

  /**
   * Get selected row count
   * @returns {number} Count of selected rows
   */
  getSelectedRowCount() {
    return this.selectedRows.size;
  },

  /**
   * Update row selection state in UI
   */
  updateRowSelectionState() {
    const rows = this.table.container.querySelectorAll('.table-row');
    const allData = this.table.getFilteredData();
    
    rows.forEach((row, index) => {
      const record = allData[index];
      if (record && this.isRowSelected(record)) {
        row.classList.add('table-row-selected');
      } else {
        row.classList.remove('table-row-selected');
      }
      
      // Update checkbox state
      const checkbox = row.querySelector('.table-row-checkbox');
      if (checkbox) {
        checkbox.checked = record && this.isRowSelected(record);
      }
    });
  },

  /**
   * Update select all checkbox state
   */
  updateSelectAllState() {
    const selectAllCheckbox = this.table.container.querySelector('.table-select-all-checkbox');
    if (!selectAllCheckbox) return;

    // Safe null check for getFilteredData
    const totalRows = this.table.getFilteredData()?.length || 0;
    const selectedCount = this.getSelectedRowCount();
    
    if (selectedCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.classList.remove('indeterminate');
    } else if (selectedCount === totalRows) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.classList.remove('indeterminate');
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.classList.add('indeterminate');
    }
  },

  /**
   * Create selection toolbar
   */
  createSelectionToolbar() {
    if (!this.config.showSelectionToolbar) return;
    
    const toolbar = this.api.createElement('div', {
      class: 'table-selection-toolbar',
      id: 'selection-toolbar'
    });
    
    const countSpan = this.api.createElement('span', {
      class: 'table-selection-count'
    });
    
    const actionsDiv = this.api.createElement('div', {
      class: 'table-selection-actions'
    });
    
    // Add default actions
    const deleteBtn = this.api.createElement('button', {
      class: 'table-selection-action',
      title: 'Delete selected rows'
    }, ['Delete']);
    
    const exportBtn = this.api.createElement('button', {
      class: 'table-selection-action',
      title: 'Export selected rows'
    }, ['Export']);
    
    const clearBtn = this.api.createElement('button', {
      class: 'table-selection-action',
      title: 'Clear selection'
    }, ['Clear']);
    
    // Add event listeners
    deleteBtn.addEventListener('click', () => this.handleDeleteSelected());
    exportBtn.addEventListener('click', () => this.handleExportSelected());
    clearBtn.addEventListener('click', () => this.deselectAllRows());
    
    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(exportBtn);
    actionsDiv.appendChild(clearBtn);
    
    toolbar.appendChild(countSpan);
    toolbar.appendChild(actionsDiv);
    
    // Insert before table
    this.table.container.parentNode.insertBefore(toolbar, this.table.container);
    this.toolbar = toolbar;
  },

  /**
   * Update selection toolbar
   */
  updateSelectionToolbar() {
    if (!this.toolbar) return;
    
    const selectedCount = this.getSelectedRowCount();
    const countSpan = this.toolbar.querySelector('.table-selection-count');
    
    if (selectedCount > 0) {
      countSpan.textContent = `${selectedCount} row${selectedCount === 1 ? '' : 's'} selected`;
      this.toolbar.classList.add('visible');
    } else {
      this.toolbar.classList.remove('visible');
    }
  },

  /**
   * Update UI elements
   */
  updateUI() {
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.updateSelectionToolbar();
  },

  /**
   * Handle delete selected rows
   */
  handleDeleteSelected() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) return;
    
    const confirmed = confirm(`Delete ${selectedRows.length} selected row${selectedRows.length === 1 ? '' : 's'}?`);
    if (!confirmed) return;
    
    // Emit hook for deletion
    this.api.emitHook('rows:beforeDelete', { rows: selectedRows });
    
    // Remove rows from data
    const currentData = this.table.getData();
    const newData = currentData.filter(record => !this.isRowSelected(record));
    
    this.table.setData(newData);
    this.deselectAllRows();
    
    // Emit hook after deletion
    this.api.emitHook('rows:afterDelete', { deletedRows: selectedRows, newData });
  },

  /**
   * Handle export selected rows
   */
  handleExportSelected() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) return;
    
    // Use export module if available
    if (this.table.exportModule) {
      this.table.exportModule.exportData({
        format: 'csv',
        selectedRowsOnly: true,
        filename: `selected-rows-${Date.now()}.csv`
      });
    } else {
      // Fallback to simple CSV export
      this.exportSelectedRowsAsCSV(selectedRows);
    }
  },

  /**
   * Simple CSV export for selected rows
   * @param {Array} rows - Rows to export
   */
  exportSelectedRowsAsCSV(rows) {
    const columns = this.table.options.columns.filter(col => col.key !== '_selection');
    const headers = columns.map(col => col.title).join(',');
    const csvRows = rows.map(row => 
      columns.map(col => row[col.dataIndex] || '').join(',')
    );
    
    const csv = [headers, ...csvRows].join('\n');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected-rows-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Emit selection change event
   */
  emitSelectionChange() {
    this.api.emitHook('selection:changed', {
      selectedRows: this.getSelectedRows(),
      selectedRowCount: this.getSelectedRowCount()
    });
    
    // Save selection to storage if needed
    this.saveSelection();
  },

  /**
   * Save selection to storage
   */
  saveSelection() {
    const selectedIds = Array.from(this.selectedRows);
    this.api.setStorage('selectedRows', selectedIds, 'row-selection');
  },

  /**
   * Load selection from storage
   */
  loadSelection() {
    const selectedIds = this.api.getStorage('selectedRows', 'row-selection');
    if (selectedIds && Array.isArray(selectedIds)) {
      this.selectedRows = new Set(selectedIds);
      this.updateUI();
    }
  },

  /**
   * Plugin cleanup
   */
  destroy() {
    // Remove selection column
    const columns = this.table.options.columns;
    const selectionIndex = columns.findIndex(col => col.key === '_selection');
    if (selectionIndex !== -1) {
      columns.splice(selectionIndex, 1);
    }
    
    // Remove toolbar
    if (this.toolbar) {
      this.toolbar.remove();
    }
    
    // Remove CSS
    this.api.removeCSS('row-selection-plugin');
    
    // Clear selection
    this.selectedRows.clear();
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RowSelectionPlugin;
}

if (typeof window !== 'undefined') {
  window.RowSelectionPlugin = RowSelectionPlugin;
}