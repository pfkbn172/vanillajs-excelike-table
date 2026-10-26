/**
 * Security Utilities Module
 * CSV formula injection protection for exports
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

    // Plain numbers such as "-5" or "+3.2" are data, not formulas: escaping them would turn them into text in Excel.
    if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(value)) {
      return value;
    }

    const firstChar = value.charAt(0);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];

    if (dangerousChars.includes(firstChar)) {
      // Prefix with single quote to prevent formula execution
      return "'" + value;
    }

    return value;
  }
};

export default SecurityUtils;
