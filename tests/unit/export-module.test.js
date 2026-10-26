/**
 * Export Module Unit Tests (CSV)
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
      expect(ExportModule.escapeCSVField('=SUM(A1:A10)', ',', '"')).toBe("'=SUM(A1:A10)");
      expect(ExportModule.escapeCSVField('@cmd', ',', '"')).toBe("'@cmd");
      expect(ExportModule.escapeCSVField('-1+2', ',', '"')).toBe("'-1+2");
    });

    test('should keep plain numbers as numbers (no quote prefix)', () => {
      expect(ExportModule.escapeCSVField('-5', ',', '"')).toBe('-5');
      expect(ExportModule.escapeCSVField('+3.25', ',', '"')).toBe('+3.25');
      expect(ExportModule.escapeCSVField('-1e3', ',', '"')).toBe('-1e3');
    });

    test('should keep zero', () => {
      expect(ExportModule.escapeCSVField(0, ',', '"')).toBe('0');
    });
  });

  describe('toCSV', () => {
    const columns = [
      { key: 'name', title: 'Name', dataIndex: 'name' },
      { key: 'qty', title: 'Qty', dataIndex: 'qty' },
    ];

    test('should write a header row and one line per row with CRLF', () => {
      const csv = ExportModule.toCSV([{ name: 'Pen', qty: 3 }, { name: 'Ink', qty: 0 }], columns);
      expect(csv).toBe('Name,Qty\r\nPen,3\r\nInk,0\r\n');
    });

    test('should omit the header row when includeHeaders is false', () => {
      expect(ExportModule.toCSV([{ name: 'Pen', qty: 3 }], columns, { includeHeaders: false })).toBe('Pen,3\r\n');
    });

    test('should use the column renderer without its HTML', () => {
      const rendered = [{ ...columns[0], render: (v) => `<b>${v.toUpperCase()}</b>` }];
      expect(ExportModule.toCSV([{ name: 'pen' }], rendered)).toBe('Name\r\nPEN\r\n');
    });

    test('should export numbers, booleans and date columns as data, not as rendered text', () => {
      const cols = [
        { key: 'p', title: 'P', dataIndex: 'p', render: (v) => `¥${v.toLocaleString()}` },
        { key: 'ok', title: 'OK', dataIndex: 'ok', render: (v) => (v ? 'Yes' : 'No') },
        { key: 'd', title: 'D', dataIndex: 'd', type: 'date', render: () => '1/5/2024' },
      ];
      expect(ExportModule.toCSV([{ p: 3800000, ok: true, d: '2024-01-05' }], cols)).toBe('P,OK,D\r\n3800000,true,2024-01-05\r\n');
    });

    test('should write empty cells for missing values', () => {
      expect(ExportModule.toCSV([{ name: 'Pen' }], columns)).toBe('Name,Qty\r\nPen,\r\n');
    });
  });
});
