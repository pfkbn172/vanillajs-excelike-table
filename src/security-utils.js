/**
 * Security Utilities Module
 * Provides basic security utilities for CSV export and DoS protection
 */

const SecurityUtils = {
  /**
   * Escape CSV formulas to prevent injection attacks
   * Excel/LibreOffice execute formulas starting with: = + - @ \t \r
   * @param {string} value - Cell value
   * @returns {string} - Escaped value
   */
  escapeCSVFormula(value) {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value !== 'string') {
      return value;
    }

    // Empty string
    if (value === '') {
      return '';
    }

    const firstChar = value.charAt(0);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];

    if (dangerousChars.includes(firstChar)) {
      // Prefix with single quote to prevent formula execution
      return "'" + value;
    }

    return value;
  },

  /**
   * DoS Protection: Table size limits
   */
  TABLE_LIMITS: {
    MAX_ROWS: 100000,           // 最大行数
    MAX_COLUMNS: 100,           // 最大列数
    MAX_CELL_SIZE: 10000,       // セル最大文字数
    MAX_TOTAL_SIZE: 50 * 1024 * 1024  // 総データサイズ 50MB
  },

  /**
   * データサイズ検証（DoS攻撃対策）
   * @param {Array} data - テーブルデータ
   * @param {Array} columns - カラム定義
   * @returns {Object} { valid: boolean, error?: string, stats?: Object }
   */
  validateTableSize(data, columns) {
    if (!data || !Array.isArray(data)) {
      return { valid: false, error: 'データが配列ではありません' };
    }

    if (!columns || !Array.isArray(columns)) {
      return { valid: false, error: 'カラム定義が配列ではありません' };
    }

    // 行数チェック
    if (data.length > this.TABLE_LIMITS.MAX_ROWS) {
      return {
        valid: false,
        error: `データ行数が上限を超えています（${data.length.toLocaleString()} > ${this.TABLE_LIMITS.MAX_ROWS.toLocaleString()}）`
      };
    }

    // 列数チェック
    if (columns.length > this.TABLE_LIMITS.MAX_COLUMNS) {
      return {
        valid: false,
        error: `カラム数が上限を超えています（${columns.length} > ${this.TABLE_LIMITS.MAX_COLUMNS}）`
      };
    }

    // セルサイズ・総サイズチェック
    let totalSize = 0;
    let maxCellSize = 0;
    let oversizedCellLocation = null;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];

      for (const col of columns) {
        const cellValue = String(row[col.dataIndex] || '');
        const cellSize = cellValue.length;

        // セル単位サイズチェック
        if (cellSize > this.TABLE_LIMITS.MAX_CELL_SIZE) {
          return {
            valid: false,
            error: `セルサイズが上限を超えています（行${rowIndex + 1}, 列"${col.title || col.dataIndex}": ${cellSize.toLocaleString()}文字 > ${this.TABLE_LIMITS.MAX_CELL_SIZE.toLocaleString()}文字）`
          };
        }

        if (cellSize > maxCellSize) {
          maxCellSize = cellSize;
          oversizedCellLocation = { row: rowIndex + 1, column: col.title || col.dataIndex };
        }

        totalSize += cellSize * 2; // UTF-16 = 2 bytes/char
      }
    }

    // 総サイズチェック
    const totalSizeMB = totalSize / 1024 / 1024;
    const limitMB = this.TABLE_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024;

    if (totalSize > this.TABLE_LIMITS.MAX_TOTAL_SIZE) {
      return {
        valid: false,
        error: `総データサイズが上限を超えています（${totalSizeMB.toFixed(2)}MB > ${limitMB.toFixed(0)}MB）`
      };
    }

    return {
      valid: true,
      stats: {
        rows: data.length,
        columns: columns.length,
        totalCells: data.length * columns.length,
        totalSizeMB: totalSizeMB.toFixed(2),
        maxCellSize: maxCellSize,
        maxCellLocation: oversizedCellLocation
      }
    };
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}

if (typeof window !== 'undefined') {
  window.SecurityUtils = SecurityUtils;
}

export default SecurityUtils;
