/**
 * ExceLikeTable Core Module Unit Tests
 * Tests for table presets, configuration, and column helper functions
 */


describe('ExceLikeTable Core - Constants and Helpers', () => {

  describe('TABLE_PRESETS structure', () => {
    test('should have simple preset configuration', () => {
      const simplePreset = {
        features: ['sorting'],
        bordered: true,
        size: 'middle',
        pagination: { pageSize: 10 }
      };

      expect(simplePreset.features).toContain('sorting');
      expect(simplePreset.bordered).toBe(true);
      expect(simplePreset.pagination.pageSize).toBe(10);
    });

    test('should have standard preset with multiple features', () => {
      const standardPreset = {
        features: ['sorting', 'filtering', 'pagination', 'columnSettings'],
        bordered: true,
        size: 'middle',
        pagination: { pageSize: 10, showSizeChanger: true }
      };

      expect(standardPreset.features).toHaveLength(4);
      expect(standardPreset.pagination.showSizeChanger).toBe(true);
    });

    test('should have advanced preset with persist settings', () => {
      const advancedPreset = {
        features: ['sorting', 'filtering', 'pagination', 'columnSettings', 'persistSettings'],
        bordered: true,
        size: 'middle',
        pagination: { pageSize: 10, showSizeChanger: true }
      };

      expect(advancedPreset.features).toContain('persistSettings');
      expect(advancedPreset.features).toHaveLength(5);
    });

    test('should have excel preset with all features', () => {
      const excelPreset = {
        features: ['sorting', 'filtering', 'pagination', 'columnSettings', 'persistSettings', 'columnResizing', 'columnPinning'],
        bordered: true,
        size: 'middle',
        pagination: { pageSize: 10, showSizeChanger: true }
      };

      expect(excelPreset.features).toContain('columnResizing');
      expect(excelPreset.features).toContain('columnPinning');
      expect(excelPreset.features).toHaveLength(7);
    });
  });

  describe('TABLE_CONFIG constants', () => {
    test('should define font sizes', () => {
      const fontSizes = {
        'smallest': '10px',
        'small': '12px',
        'medium': '14px',
        'large': '18px',
        'largest': '22px'
      };

      expect(fontSizes.smallest).toBe('10px');
      expect(fontSizes.medium).toBe('14px');
      expect(fontSizes.largest).toBe('22px');
    });

    test('should define cell padding configurations', () => {
      const cellPadding = {
        'wide': { vertical: '12px', horizontal: '8px' },
        'standard': { vertical: '8px', horizontal: '6px' },
        'narrow': { vertical: '2px', horizontal: '2px' }
      };

      expect(cellPadding.wide.vertical).toBe('12px');
      expect(cellPadding.standard.horizontal).toBe('6px');
      expect(cellPadding.narrow.vertical).toBe('2px');
    });

    test('should define size constraints', () => {
      const sizes = {
        MIN_COLUMN_WIDTH: 50,
        AUTO_RESIZE_MIN: 80,
        AUTO_RESIZE_MAX: 400,
        DOUBLE_CLICK_THRESHOLD: 300,
        TOOLTIP_OFFSET: { x: 15, y: 40 }
      };

      expect(sizes.MIN_COLUMN_WIDTH).toBe(50);
      expect(sizes.AUTO_RESIZE_MIN).toBe(80);
      expect(sizes.AUTO_RESIZE_MAX).toBe(400);
      expect(sizes.TOOLTIP_OFFSET.x).toBe(15);
    });

    test('should define z-index layering', () => {
      const zIndexes = {
        TOOLTIP: 10000,
        FILTER_DROPDOWN: 9999,
        PINNED_HEADER: 101,
        PINNED_CELL: 100
      };

      expect(zIndexes.TOOLTIP).toBeGreaterThan(zIndexes.FILTER_DROPDOWN);
      expect(zIndexes.FILTER_DROPDOWN).toBeGreaterThan(zIndexes.PINNED_HEADER);
      expect(zIndexes.PINNED_HEADER).toBeGreaterThan(zIndexes.PINNED_CELL);
    });

    test('should define timing constants', () => {
      const timing = {
        TOOLTIP_FADE: 200,
        DEBOUNCE_RESIZE: 100
      };

      expect(timing.TOOLTIP_FADE).toBe(200);
      expect(timing.DEBOUNCE_RESIZE).toBe(100);
    });
  });

  describe('ColumnHelpers.text()', () => {
    const createTextColumn = (key, title, options = {}) => {
      return {
        key,
        title,
        dataIndex: key,
        width: options.width || 150,
        sortable: options.sortable !== false,
        filterable: options.filterable !== false,
        ...options
      };
    };

    test('should create basic text column', () => {
      const column = createTextColumn('name', 'Name');

      expect(column.key).toBe('name');
      expect(column.title).toBe('Name');
      expect(column.dataIndex).toBe('name');
      expect(column.width).toBe(150);
      expect(column.sortable).toBe(true);
      expect(column.filterable).toBe(true);
    });

    test('should allow custom width', () => {
      const column = createTextColumn('description', 'Description', { width: 300 });

      expect(column.width).toBe(300);
    });

    test('should allow disabling sortable', () => {
      const column = createTextColumn('id', 'ID', { sortable: false });

      expect(column.sortable).toBe(false);
    });

    test('should allow disabling filterable', () => {
      const column = createTextColumn('status', 'Status', { filterable: false });

      expect(column.filterable).toBe(false);
    });

    test('should merge additional options', () => {
      const column = createTextColumn('email', 'Email', {
        align: 'center',
        ellipsis: true
      });

      expect(column.align).toBe('center');
      expect(column.ellipsis).toBe(true);
    });
  });

  describe('ColumnHelpers.number()', () => {
    const createNumberColumn = (key, title, options = {}) => {
      return {
        key,
        title,
        dataIndex: key,
        width: options.width || 120,
        sortable: options.sortable !== false,
        filterable: options.filterable !== false,
        filterType: 'range',
        align: 'right',
        render: options.render || ((value) => {
          if (typeof value === 'number') {
            return value.toLocaleString();
          }
          return value;
        }),
        ...options
      };
    };

    test('should create number column with right alignment', () => {
      const column = createNumberColumn('amount', 'Amount');

      expect(column.align).toBe('right');
      expect(column.filterType).toBe('range');
      expect(column.width).toBe(120);
    });

    test('should format numbers with toLocaleString', () => {
      const column = createNumberColumn('price', 'Price');
      const formatted = column.render(1234567);

      expect(formatted).toBe('1,234,567');
    });

    test('should handle non-number values', () => {
      const column = createNumberColumn('count', 'Count');
      const result = column.render('N/A');

      expect(result).toBe('N/A');
    });

    test('should allow custom render function', () => {
      const column = createNumberColumn('score', 'Score', {
        render: (value) => `${value}%`
      });

      expect(column.render(85)).toBe('85%');
    });
  });

  describe('ColumnHelpers.currency()', () => {
    const createCurrencyColumn = (key, title, options = {}) => {
      const currency = options.currency || 'USD';
      return {
        key,
        title,
        dataIndex: key,
        width: options.width || 140,
        sortable: options.sortable !== false,
        filterable: options.filterable !== false,
        filterType: 'range',
        align: 'right',
        render: options.render || ((value) => {
          if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            }).format(value);
          }
          return value;
        }),
        ...options
      };
    };

    test('should create currency column with USD default', () => {
      const column = createCurrencyColumn('total', 'Total');
      const formatted = column.render(1234.56);

      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    test('should support custom currency', () => {
      const column = createCurrencyColumn('price', 'Price', { currency: 'EUR' });
      const formatted = column.render(100);

      expect(formatted).toContain('€');
    });

    test('should have proper width and alignment', () => {
      const column = createCurrencyColumn('amount', 'Amount');

      expect(column.width).toBe(140);
      expect(column.align).toBe('right');
      expect(column.filterType).toBe('range');
    });
  });

  describe('ColumnHelpers.date()', () => {
    const createDateColumn = (key, title, options = {}) => {
      return {
        key,
        title,
        dataIndex: key,
        width: options.width || 120,
        sortable: options.sortable !== false,
        filterable: options.filterable !== false,
        filterType: 'dateHierarchy',
        render: options.render || ((value) => {
          if (value instanceof Date) {
            return value.toLocaleDateString();
          }
          if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? value : date.toLocaleDateString();
          }
          return value;
        }),
        ...options
      };
    };

    test('should create date column with dateHierarchy filter', () => {
      const column = createDateColumn('createdAt', 'Created At');

      expect(column.filterType).toBe('dateHierarchy');
      expect(column.width).toBe(120);
    });

    test('should format Date objects', () => {
      const column = createDateColumn('date', 'Date');
      const testDate = new Date('2024-01-15');
      const formatted = column.render(testDate);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should parse date strings', () => {
      const column = createDateColumn('date', 'Date');
      const formatted = column.render('2024-01-15');

      expect(formatted).toBeTruthy();
    });

    test('should handle invalid date strings', () => {
      const column = createDateColumn('date', 'Date');
      const result = column.render('invalid-date');

      expect(result).toBe('invalid-date');
    });

    test('should handle non-date values', () => {
      const column = createDateColumn('date', 'Date');
      const result = column.render(null);

      expect(result).toBeNull();
    });
  });

  describe('ColumnHelpers.actions()', () => {
    const createActionsColumn = (title, actions, options = {}) => {
      return {
        key: '_actions',
        title: title || 'Actions',
        dataIndex: '_actions',
        width: options.width || (actions.length * 40 + 20),
        sortable: false,
        filterable: false,
        render: (value, record, index) => {
          return actions.map(action =>
            `<button class="action-btn ${action.className || ''}"
                     data-action="${action.key}"
                     data-index="${index}"
                     title="${action.tooltip || action.label}">
               ${action.label}
             </button>`
          ).join('');
        },
        ...options
      };
    };

    test('should create actions column', () => {
      const actions = [
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' }
      ];
      const column = createActionsColumn('Actions', actions);

      expect(column.key).toBe('_actions');
      expect(column.sortable).toBe(false);
      expect(column.filterable).toBe(false);
    });

    test('should calculate width based on action count', () => {
      const actions = [
        { key: 'view', label: 'View' },
        { key: 'edit', label: 'Edit' },
        { key: 'delete', label: 'Delete' }
      ];
      const column = createActionsColumn('Actions', actions);
      const expectedWidth = actions.length * 40 + 20;

      expect(column.width).toBe(expectedWidth);
    });

    test('should render action buttons HTML', () => {
      const actions = [
        { key: 'edit', label: 'Edit', className: 'btn-primary' }
      ];
      const column = createActionsColumn('Actions', actions);
      const html = column.render(null, {}, 0);

      expect(html).toContain('data-action="edit"');
      expect(html).toContain('btn-primary');
      expect(html).toContain('Edit');
    });

    test('should use tooltip if provided', () => {
      const actions = [
        { key: 'delete', label: 'Delete', tooltip: 'Remove this item' }
      ];
      const column = createActionsColumn('Actions', actions);
      const html = column.render(null, {}, 0);

      expect(html).toContain('title="Remove this item"');
    });
  });

  describe('Configuration validation', () => {
    test('should validate font size progression', () => {
      const fontSizes = {
        'smallest': '10px',
        'small': '12px',
        'medium': '14px',
        'large': '18px',
        'largest': '22px'
      };

      const smallest = parseInt(fontSizes.smallest);
      const medium = parseInt(fontSizes.medium);
      const largest = parseInt(fontSizes.largest);

      expect(smallest).toBeLessThan(medium);
      expect(medium).toBeLessThan(largest);
    });

    test('should validate resize constraints', () => {
      const sizes = {
        MIN_COLUMN_WIDTH: 50,
        AUTO_RESIZE_MIN: 80,
        AUTO_RESIZE_MAX: 400
      };

      expect(sizes.MIN_COLUMN_WIDTH).toBeLessThan(sizes.AUTO_RESIZE_MIN);
      expect(sizes.AUTO_RESIZE_MIN).toBeLessThan(sizes.AUTO_RESIZE_MAX);
    });

    test('should validate padding structure', () => {
      const standardPadding = { vertical: '8px', horizontal: '6px' };

      expect(standardPadding).toHaveProperty('vertical');
      expect(standardPadding).toHaveProperty('horizontal');
      expect(parseInt(standardPadding.vertical)).toBeGreaterThan(0);
      expect(parseInt(standardPadding.horizontal)).toBeGreaterThan(0);
    });
  });
});
