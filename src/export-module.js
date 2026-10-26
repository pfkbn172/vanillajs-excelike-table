/**
 * CSV export for ExceLike Table (used by ExceLikeTable#exportCSV).
 */

import SecurityUtils from './security-utils.js';

const ExportModule = {
  /**
   * Build CSV text (RFC 4180 quoting, spreadsheet formula injection escaped).
   * @param {Array} data - Rows
   * @param {Array} columns - Columns ({ key, title, dataIndex, render? })
   * @param {Object} [options]
   * @returns {string} CSV text
   */
  toCSV(data, columns, options = {}) {
    const {
      includeHeaders = true,
      customHeaders = null,
      delimiter = ',',
      lineBreak = '\r\n',
      quote = '"'
    } = options;

    let csv = '';

    if (includeHeaders) {
      const headers = columns.map(column => {
        const headerText = customHeaders && customHeaders[column.key] ?
          customHeaders[column.key] : column.title;
        return this.escapeCSVField(headerText, delimiter, quote);
      });
      csv += headers.join(delimiter) + lineBreak;
    }

    data.forEach(row => {
      const values = columns.map(column => {
        let value = row[column.dataIndex];

        // Numbers, booleans and dates are exported as data so spreadsheets can calculate with them
        // (a renderer would turn 3800000 into "¥3,800,000"). Anything else is exported as displayed:
        // the column renderer's output without its HTML tags.
        const isData = typeof value === 'number' || typeof value === 'boolean' || value instanceof Date || column.type === 'date';
        if (!isData && column.render && typeof column.render === 'function') {
          const rendered = column.render(value, row, column);
          if (typeof rendered === 'string') {
            value = rendered.replace(/<[^>]*>/g, '');
          }
        }

        return this.escapeCSVField(this.formatValueForCSV(value), delimiter, quote);
      });

      csv += values.join(delimiter) + lineBreak;
    });

    return csv;
  },

  /**
   * Format a cell value for CSV
   * @param {*} value
   * @returns {string}
   */
  formatValueForCSV(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  },

  /**
   * Escape one CSV field
   * @param {*} field
   * @param {string} delimiter
   * @param {string} quote
   * @returns {string}
   */
  escapeCSVField(field, delimiter, quote) {
    if (field === null || field === undefined || field === '') return '';

    // Prevent CSV formula injection (Excel/LibreOffice execute =, +, -, @, \t, \r)
    const escaped = SecurityUtils.escapeCSVFormula(String(field));

    // If field contains delimiter, quote, or newline, wrap in quotes
    if (escaped.includes(delimiter) || escaped.includes(quote) || escaped.includes('\n') || escaped.includes('\r')) {
      return quote + escaped.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }

    return escaped;
  },

  /**
   * Download text as a file
   * @param {string} content
   * @param {string} filename
   * @param {string} mimeType
   * @param {string} [encoding='utf-8']
   */
  downloadFile(content, filename, mimeType, encoding = 'utf-8') {
    const blob = new Blob([content], { type: `${mimeType};charset=${encoding}` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};

export default ExportModule;
