/**
 * Export Module Unit Tests
 * Tests for data export formatting and utility functions
 */

import ExportModule from '../../src/export-module.js';

describe('Export Module', () => {

  describe('formatValueForCSV', () => {
    test('should return empty string for null', () => {
      const result = ExportModule.formatValueForCSV(null);
      expect(result).toBe('');
    });

    test('should return empty string for undefined', () => {
      const result = ExportModule.formatValueForCSV(undefined);
      expect(result).toBe('');
    });

    test('should format Date to ISO date string', () => {
      const date = new Date('2025-10-10T10:30:00Z');
      const result = ExportModule.formatValueForCSV(date);
      expect(result).toBe('2025-10-10');
    });

    test('should convert number to string', () => {
      const result = ExportModule.formatValueForCSV(123.45);
      expect(result).toBe('123.45');
    });

    test('should convert boolean to string', () => {
      expect(ExportModule.formatValueForCSV(true)).toBe('true');
      expect(ExportModule.formatValueForCSV(false)).toBe('false');
    });

    test('should return string as-is', () => {
      const result = ExportModule.formatValueForCSV('Hello World');
      expect(result).toBe('Hello World');
    });
  });

  describe('formatValueForExcel', () => {
    test('should return empty string for null', () => {
      const result = ExportModule.formatValueForExcel(null);
      expect(result).toBe('');
    });

    test('should return empty string for undefined', () => {
      const result = ExportModule.formatValueForExcel(undefined);
      expect(result).toBe('');
    });

    test('should keep Date object as-is', () => {
      const date = new Date('2025-10-10');
      const result = ExportModule.formatValueForExcel(date);
      expect(result).toBe(date);
    });

    test('should keep number as-is', () => {
      const result = ExportModule.formatValueForExcel(123.45);
      expect(result).toBe(123.45);
    });

    test('should convert string to string', () => {
      const result = ExportModule.formatValueForExcel('Test');
      expect(result).toBe('Test');
    });
  });

  describe('formatValueForXML', () => {
    test('should return empty string for null', () => {
      const result = ExportModule.formatValueForXML(null);
      expect(result).toBe('');
    });

    test('should return empty string for undefined', () => {
      const result = ExportModule.formatValueForXML(undefined);
      expect(result).toBe('');
    });

    test('should format Date to ISO string', () => {
      const date = new Date('2025-10-10T10:30:00.000Z');
      const result = ExportModule.formatValueForXML(date);
      expect(result).toBe('2025-10-10T10:30:00.000Z');
    });

    test('should convert value to string', () => {
      expect(ExportModule.formatValueForXML(123)).toBe('123');
      expect(ExportModule.formatValueForXML('Test')).toBe('Test');
    });
  });

  describe('formatValueForHTML', () => {
    test('should return empty string for null', () => {
      const result = ExportModule.formatValueForHTML(null);
      expect(result).toBe('');
    });

    test('should return empty string for undefined', () => {
      const result = ExportModule.formatValueForHTML(undefined);
      expect(result).toBe('');
    });

    test('should return HTML strings as-is', () => {
      const html = '<span>Test</span>';
      const result = ExportModule.formatValueForHTML(html);
      expect(result).toBe(html);
    });

    test('should format Date with toLocaleString', () => {
      const date = new Date('2025-10-10T10:30:00');
      const result = ExportModule.formatValueForHTML(date);
      expect(result).toBe(date.toLocaleString());
    });

    test('should convert other values to string', () => {
      expect(ExportModule.formatValueForHTML(123)).toBe('123');
      expect(ExportModule.formatValueForHTML('Plain text')).toBe('Plain text');
    });
  });

  describe('escapeXML', () => {
    test('should return empty string for null/undefined', () => {
      expect(ExportModule.escapeXML(null)).toBe('');
      expect(ExportModule.escapeXML(undefined)).toBe('');
      expect(ExportModule.escapeXML('')).toBe('');
    });

    test('should escape ampersand', () => {
      const result = ExportModule.escapeXML('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    test('should escape less-than', () => {
      const result = ExportModule.escapeXML('5 < 10');
      expect(result).toBe('5 &lt; 10');
    });

    test('should escape greater-than', () => {
      const result = ExportModule.escapeXML('10 > 5');
      expect(result).toBe('10 &gt; 5');
    });

    test('should escape double quotes', () => {
      const result = ExportModule.escapeXML('Say "Hello"');
      expect(result).toBe('Say &quot;Hello&quot;');
    });

    test('should escape single quotes', () => {
      const result = ExportModule.escapeXML("It's working");
      expect(result).toBe('It&#39;s working');
    });

    test('should escape multiple special characters', () => {
      const result = ExportModule.escapeXML('<tag attr="value">Text & more</tag>');
      expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;Text &amp; more&lt;/tag&gt;');
    });
  });

  describe('escapeHTML', () => {
    test('should return empty string for null/undefined', () => {
      expect(ExportModule.escapeHTML(null)).toBe('');
      expect(ExportModule.escapeHTML(undefined)).toBe('');
      expect(ExportModule.escapeHTML('')).toBe('');
    });

    test('should escape ampersand', () => {
      const result = ExportModule.escapeHTML('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    test('should escape less-than', () => {
      const result = ExportModule.escapeHTML('5 < 10');
      expect(result).toBe('5 &lt; 10');
    });

    test('should escape greater-than', () => {
      const result = ExportModule.escapeHTML('10 > 5');
      expect(result).toBe('10 &gt; 5');
    });

    test('should escape double quotes', () => {
      const result = ExportModule.escapeHTML('Say "Hello"');
      expect(result).toBe('Say &quot;Hello&quot;');
    });

    test('should escape single quotes', () => {
      const result = ExportModule.escapeHTML("It's working");
      expect(result).toBe('It&#39;s working');
    });

    test('should escape script tags', () => {
      const result = ExportModule.escapeHTML('<script>alert("XSS")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });
  });

  describe('escapeCSVField', () => {
    test('should return empty string for null/undefined', () => {
      expect(ExportModule.escapeCSVField(null, ',', '"')).toBe('');
      expect(ExportModule.escapeCSVField(undefined, ',', '"')).toBe('');
      expect(ExportModule.escapeCSVField('', ',', '"')).toBe('');
    });

    test('should wrap fields containing delimiter in quotes', () => {
      const result = ExportModule.escapeCSVField('Smith, John', ',', '"');
      expect(result).toBe('"Smith, John"');
    });

    test('should wrap fields containing quotes and escape quotes', () => {
      const result = ExportModule.escapeCSVField('Say "Hello"', ',', '"');
      expect(result).toBe('"Say ""Hello"""');
    });

    test('should wrap fields containing newlines', () => {
      const result = ExportModule.escapeCSVField('Line1\nLine2', ',', '"');
      expect(result).toBe('"Line1\nLine2"');
    });

    test('should wrap fields containing carriage returns', () => {
      const result = ExportModule.escapeCSVField('Line1\rLine2', ',', '"');
      expect(result).toBe('"Line1\rLine2"');
    });

    test('should not quote simple fields', () => {
      const result = ExportModule.escapeCSVField('SimpleText', ',', '"');
      expect(result).toBe('SimpleText');
    });

    test('should prevent CSV formula injection', () => {
      const result = ExportModule.escapeCSVField('=SUM(A1:A10)', ',', '"');
      expect(result).toContain("'"); // Should be prefixed with single quote
    });
  });

  describe('generateFilename', () => {
    test('should generate filename with format extension', () => {
      const mockTable = {
        options: { tableId: 'test-table' }
      };
      ExportModule.init(mockTable);

      const filename = ExportModule.generateFilename('csv');

      expect(filename).toMatch(/^test-table-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
    });

    test('should use default "table" id when tableId not provided', () => {
      const mockTable = {
        options: {}
      };
      ExportModule.init(mockTable);

      const filename = ExportModule.generateFilename('xlsx');

      expect(filename).toMatch(/^table-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.xlsx$/);
    });

    test('should handle different formats', () => {
      const mockTable = {
        options: { tableId: 'data' }
      };
      ExportModule.init(mockTable);

      expect(ExportModule.generateFilename('json')).toContain('.json');
      expect(ExportModule.generateFilename('xml')).toContain('.xml');
      expect(ExportModule.generateFilename('html')).toContain('.html');
    });
  });

  describe('s2ab (string to ArrayBuffer)', () => {
    test('should convert empty string to empty ArrayBuffer', () => {
      const result = ExportModule.s2ab('');
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(0);
    });

    test('should convert string to ArrayBuffer', () => {
      const result = ExportModule.s2ab('ABC');
      const view = new Uint8Array(result);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(3);
      expect(view[0]).toBe(65); // 'A'
      expect(view[1]).toBe(66); // 'B'
      expect(view[2]).toBe(67); // 'C'
    });

    test('should handle special characters', () => {
      const result = ExportModule.s2ab('Hello!');
      const view = new Uint8Array(result);

      expect(result.byteLength).toBe(6);
      expect(view[5]).toBe(33); // '!'
    });
  });

  describe('getExportColumns', () => {
    test('should return all columns when visibleOnly is false', () => {
      const mockTable = {
        options: {
          columns: [
            { key: 'col1', title: 'Column 1' },
            { key: 'col2', title: 'Column 2', visible: false },
            { key: 'col3', title: 'Column 3' }
          ]
        },
        state: {}
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportColumns(false);

      expect(result).toHaveLength(3);
    });

    test('should filter hidden columns when visibleOnly is true', () => {
      const mockTable = {
        options: {
          columns: [
            { key: 'col1', title: 'Column 1' },
            { key: 'col2', title: 'Column 2', visible: false },
            { key: 'col3', title: 'Column 3' }
          ]
        },
        state: {}
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportColumns(true);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.key)).toEqual(['col1', 'col3']);
    });

    test('should use state.visibleColumns if available', () => {
      const mockTable = {
        options: {
          columns: [
            { key: 'col1', title: 'Column 1' },
            { key: 'col2', title: 'Column 2' },
            { key: 'col3', title: 'Column 3' }
          ]
        },
        state: {
          visibleColumns: {
            col1: true,
            col2: false,
            col3: true
          }
        }
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportColumns(true);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.key)).toEqual(['col1', 'col3']);
    });
  });

  describe('getExportData', () => {
    test('should return all filtered data when selectedOnly is false', () => {
      const mockData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const mockTable = {
        options: {},
        state: {
          filteredData: mockData
        }
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportData(false);

      expect(result).toEqual(mockData);
    });

    test('should return selected rows when selectedOnly is true and getSelectedRows exists', () => {
      const selectedData = [{ id: 1, name: 'Alice' }];
      const mockTable = {
        options: {},
        state: {
          filteredData: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ]
        },
        getSelectedRows: () => selectedData
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportData(true);

      expect(result).toEqual(selectedData);
    });

    test('should use getFilteredData method if available', () => {
      const filteredData = [{ id: 1, name: 'Alice' }];
      const mockTable = {
        options: {},
        state: {},
        getFilteredData: () => filteredData
      };
      ExportModule.init(mockTable);

      const result = ExportModule.getExportData(false);

      expect(result).toEqual(filteredData);
    });
  });
});
