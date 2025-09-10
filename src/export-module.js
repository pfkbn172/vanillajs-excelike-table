/**
 * Export Module for ExceLike Table
 * Handles data export to various formats (CSV, Excel, JSON)
 */

const ExportModule = {
  /**
   * Initialize export module
   * @param {Object} table - Table instance
   */
  init(table) {
    this.table = table;
    return this;
  },

  /**
   * Export data to specified format
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportData(options = {}) {
    const {
      format = 'csv',
      filename = null,
      includeHeaders = true,
      selectedRowsOnly = false,
      visibleColumnsOnly = true,
      customHeaders = null,
      dateFormat = 'YYYY-MM-DD',
      encoding = 'utf-8'
    } = options;

    // Get data and columns to export
    const data = this.getExportData(selectedRowsOnly);
    const columns = this.getExportColumns(visibleColumnsOnly);

    // Validate data
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Generate filename if not provided
    const exportFilename = filename || this.generateFilename(format);

    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(data, columns, {
          filename: exportFilename,
          includeHeaders,
          customHeaders,
          encoding
        });
        
      case 'xlsx':
      case 'excel':
        return this.exportToExcel(data, columns, {
          filename: exportFilename,
          includeHeaders,
          customHeaders
        });
        
      case 'json':
        return this.exportToJSON(data, columns, {
          filename: exportFilename,
          includeHeaders,
          customHeaders
        });
        
      case 'xml':
        return this.exportToXML(data, columns, {
          filename: exportFilename,
          includeHeaders,
          customHeaders
        });
        
      case 'html':
        return this.exportToHTML(data, columns, {
          filename: exportFilename,
          includeHeaders,
          customHeaders
        });
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  },

  /**
   * Get data for export
   * @param {boolean} selectedOnly - Export selected rows only
   * @returns {Array} Export data
   */
  getExportData(selectedOnly = false) {
    if (selectedOnly && this.table.getSelectedRows) {
      return this.table.getSelectedRows();
    }
    
    return this.table.getFilteredData ? 
      this.table.getFilteredData() : 
      this.table.state.filteredData;
  },

  /**
   * Get columns for export
   * @param {boolean} visibleOnly - Export visible columns only
   * @returns {Array} Export columns
   */
  getExportColumns(visibleOnly = true) {
    const allColumns = this.table.options.columns;
    
    if (!visibleOnly) {
      return allColumns;
    }

    return allColumns.filter(column => {
      // Check if column is visible
      if (this.table.state.visibleColumns) {
        return this.table.state.visibleColumns[column.key] !== false;
      }
      return column.visible !== false;
    });
  },

  /**
   * Generate filename with timestamp
   * @param {string} format - File format
   * @returns {string} Generated filename
   */
  generateFilename(format) {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const tableId = this.table.options.tableId || 'table';
    return `${tableId}-export-${timestamp}.${format}`;
  },

  /**
   * Export to CSV format
   * @param {Array} data - Data to export
   * @param {Array} columns - Columns to export
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportToCSV(data, columns, options = {}) {
    const {
      filename = 'export.csv',
      includeHeaders = true,
      customHeaders = null,
      delimiter = ',',
      lineBreak = '\r\n',
      encoding = 'utf-8',
      quote = '"'
    } = options;

    let csv = '';

    // Add headers
    if (includeHeaders) {
      const headers = columns.map(column => {
        const headerText = customHeaders && customHeaders[column.key] ? 
          customHeaders[column.key] : column.title;
        return this.escapeCSVField(headerText, delimiter, quote);
      });
      csv += headers.join(delimiter) + lineBreak;
    }

    // Add data rows
    data.forEach(row => {
      const values = columns.map(column => {
        let value = row[column.dataIndex];
        
        // Apply column render function if exists
        if (column.render && typeof column.render === 'function') {
          const rendered = column.render(value, row, column);
          if (typeof rendered === 'string') {
            // Strip HTML tags from rendered content
            value = rendered.replace(/<[^>]*>/g, '');
          }
        }
        
        // Format value
        value = this.formatValueForCSV(value);
        
        return this.escapeCSVField(value, delimiter, quote);
      });
      
      csv += values.join(delimiter) + lineBreak;
    });

    return this.downloadFile(csv, filename, 'text/csv', encoding);
  },

  /**
   * Export to Excel format (requires SheetJS library)
   * @param {Array} data - Data to export
   * @param {Array} columns - Columns to export
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportToExcel(data, columns, options = {}) {
    const {
      filename = 'export.xlsx',
      includeHeaders = true,
      customHeaders = null,
      sheetName = 'Sheet1'
    } = options;

    // Check if SheetJS is available
    if (typeof XLSX === 'undefined') {
      // Fallback to CSV if XLSX not available
      console.warn('SheetJS (XLSX) library not found, falling back to CSV export');
      return this.exportToCSV(data, columns, {
        filename: filename.replace('.xlsx', '.csv'),
        includeHeaders,
        customHeaders
      });
    }

    // Prepare data for Excel
    const worksheetData = [];

    // Add headers
    if (includeHeaders) {
      const headers = columns.map(column => 
        customHeaders && customHeaders[column.key] ? 
          customHeaders[column.key] : column.title
      );
      worksheetData.push(headers);
    }

    // Add data rows
    data.forEach(row => {
      const values = columns.map(column => {
        let value = row[column.dataIndex];
        
        // Apply column render function if exists
        if (column.render && typeof column.render === 'function') {
          const rendered = column.render(value, row, column);
          if (typeof rendered === 'string') {
            // Strip HTML tags from rendered content
            value = rendered.replace(/<[^>]*>/g, '');
          }
        }
        
        return this.formatValueForExcel(value);
      });
      
      worksheetData.push(values);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const colWidths = columns.map(column => ({
      wch: Math.max(column.title.length, 15) // Minimum width of 15
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Convert to blob and download
    const blob = new Blob([this.s2ab(wbout)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    return this.downloadBlob(blob, filename);
  },

  /**
   * Export to JSON format
   * @param {Array} data - Data to export
   * @param {Array} columns - Columns to export
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportToJSON(data, columns, options = {}) {
    const {
      filename = 'export.json',
      includeHeaders = false,
      customHeaders = null,
      pretty = true
    } = options;

    const exportData = data.map(row => {
      const exportRow = {};
      
      columns.forEach(column => {
        const key = customHeaders && customHeaders[column.key] ? 
          customHeaders[column.key] : column.dataIndex;
        
        let value = row[column.dataIndex];
        
        // Apply column render function if exists (for display values)
        if (column.render && typeof column.render === 'function') {
          const rendered = column.render(value, row, column);
          if (typeof rendered === 'string') {
            // Strip HTML tags
            const displayValue = rendered.replace(/<[^>]*>/g, '');
            exportRow[`${key}_display`] = displayValue;
          }
        }
        
        exportRow[key] = value;
      });
      
      return exportRow;
    });

    const jsonString = pretty ? 
      JSON.stringify(exportData, null, 2) : 
      JSON.stringify(exportData);

    return this.downloadFile(jsonString, filename, 'application/json');
  },

  /**
   * Export to XML format
   * @param {Array} data - Data to export
   * @param {Array} columns - Columns to export
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportToXML(data, columns, options = {}) {
    const {
      filename = 'export.xml',
      rootElement = 'table',
      rowElement = 'row',
      includeHeaders = false
    } = options;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${rootElement}>\n`;

    // Add metadata
    xml += '  <metadata>\n';
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += `    <rowCount>${data.length}</rowCount>\n`;
    xml += `    <columnCount>${columns.length}</columnCount>\n`;
    xml += '  </metadata>\n';

    // Add column definitions if requested
    if (includeHeaders) {
      xml += '  <columns>\n';
      columns.forEach(column => {
        xml += '    <column>\n';
        xml += `      <key>${this.escapeXML(column.key)}</key>\n`;
        xml += `      <title>${this.escapeXML(column.title)}</title>\n`;
        xml += `      <dataIndex>${this.escapeXML(column.dataIndex)}</dataIndex>\n`;
        xml += '    </column>\n';
      });
      xml += '  </columns>\n';
    }

    // Add data
    xml += '  <data>\n';
    data.forEach((row, index) => {
      xml += `    <${rowElement} id="${index}">\n`;
      
      columns.forEach(column => {
        let value = row[column.dataIndex];
        
        // Apply column render function if exists
        if (column.render && typeof column.render === 'function') {
          const rendered = column.render(value, row, column);
          if (typeof rendered === 'string') {
            value = rendered.replace(/<[^>]*>/g, '');
          }
        }
        
        const escapedValue = this.escapeXML(this.formatValueForXML(value));
        xml += `      <${column.dataIndex}>${escapedValue}</${column.dataIndex}>\n`;
      });
      
      xml += `    </${rowElement}>\n`;
    });
    xml += '  </data>\n';

    xml += `</${rootElement}>`;

    return this.downloadFile(xml, filename, 'application/xml');
  },

  /**
   * Export to HTML format
   * @param {Array} data - Data to export
   * @param {Array} columns - Columns to export
   * @param {Object} options - Export options
   * @returns {Promise} Export promise
   */
  async exportToHTML(data, columns, options = {}) {
    const {
      filename = 'export.html',
      includeHeaders = true,
      title = 'Exported Table Data',
      includeStyles = true
    } = options;

    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += `  <title>${this.escapeHTML(title)}</title>\n`;
    html += '  <meta charset="UTF-8">\n';
    
    if (includeStyles) {
      html += `  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .export-info { margin-bottom: 20px; color: #666; }
  </style>\n`;
    }
    
    html += '</head>\n<body>\n';
    html += `  <h1>${this.escapeHTML(title)}</h1>\n`;
    html += `  <div class="export-info">
    Exported on: ${new Date().toLocaleString()}<br>
    Total rows: ${data.length}<br>
    Total columns: ${columns.length}
  </div>\n`;
    
    html += '  <table>\n';

    // Add headers
    if (includeHeaders) {
      html += '    <thead>\n      <tr>\n';
      columns.forEach(column => {
        html += `        <th>${this.escapeHTML(column.title)}</th>\n`;
      });
      html += '      </tr>\n    </thead>\n';
    }

    // Add data
    html += '    <tbody>\n';
    data.forEach(row => {
      html += '      <tr>\n';
      columns.forEach(column => {
        let value = row[column.dataIndex];
        
        // Apply column render function
        if (column.render && typeof column.render === 'function') {
          value = column.render(value, row, column);
        }
        
        html += `        <td>${this.escapeHTML(this.formatValueForHTML(value))}</td>\n`;
      });
      html += '      </tr>\n';
    });
    html += '    </tbody>\n';
    
    html += '  </table>\n</body>\n</html>';

    return this.downloadFile(html, filename, 'text/html');
  },

  /**
   * Format value for CSV export
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  formatValueForCSV(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  },

  /**
   * Format value for Excel export
   * @param {any} value - Value to format
   * @returns {any} Formatted value
   */
  formatValueForExcel(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value;
    if (typeof value === 'number') return value;
    return String(value);
  },

  /**
   * Format value for XML export
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  formatValueForXML(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  },

  /**
   * Format value for HTML export
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  formatValueForHTML(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && value.startsWith('<')) {
      return value; // Already HTML
    }
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  },

  /**
   * Escape CSV field
   * @param {string} field - Field to escape
   * @param {string} delimiter - Field delimiter
   * @param {string} quote - Quote character
   * @returns {string} Escaped field
   */
  escapeCSVField(field, delimiter, quote) {
    if (!field) return '';
    
    const fieldStr = String(field);
    
    // If field contains delimiter, quote, or newline, wrap in quotes
    if (fieldStr.includes(delimiter) || fieldStr.includes(quote) || fieldStr.includes('\n') || fieldStr.includes('\r')) {
      return quote + fieldStr.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }
    
    return fieldStr;
  },

  /**
   * Escape XML content
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Escape HTML content
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Convert string to array buffer (for Excel export)
   * @param {string} s - String to convert
   * @returns {ArrayBuffer} Array buffer
   */
  s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
  },

  /**
   * Download file with content
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   * @param {string} encoding - Text encoding
   * @returns {Promise} Download promise
   */
  downloadFile(content, filename, mimeType, encoding = 'utf-8') {
    return new Promise((resolve) => {
      const blob = new Blob([content], { 
        type: `${mimeType};charset=${encoding}` 
      });
      
      this.downloadBlob(blob, filename);
      resolve({ success: true, filename, size: blob.size });
    });
  },

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  /**
   * Get export options for UI
   * @returns {Object} Export format options
   */
  getExportFormats() {
    return {
      csv: {
        name: 'CSV',
        description: 'Comma-separated values file',
        extension: 'csv',
        mimeType: 'text/csv'
      },
      xlsx: {
        name: 'Excel',
        description: 'Microsoft Excel spreadsheet',
        extension: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        requiresLibrary: 'XLSX'
      },
      json: {
        name: 'JSON',
        description: 'JavaScript Object Notation file',
        extension: 'json',
        mimeType: 'application/json'
      },
      xml: {
        name: 'XML',
        description: 'eXtensible Markup Language file',
        extension: 'xml',
        mimeType: 'application/xml'
      },
      html: {
        name: 'HTML',
        description: 'HyperText Markup Language file',
        extension: 'html',
        mimeType: 'text/html'
      }
    };
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportModule;
}

if (typeof window !== 'undefined') {
  window.ExportModule = ExportModule;
}