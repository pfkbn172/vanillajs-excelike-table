/**
 * Conditional Formatting Format Applier
 * Handles applying visual formatting to table cells based on rules
 */

// Import shared dependencies
function getConditionalFormattingDependencies() {
  const deps = {};
  
  if (typeof window !== 'undefined') {
    deps.Types = window.ConditionalFormattingTypes;
    deps.Config = window.ConditionalFormattingConfig;
    deps.Utils = window.ConditionalFormattingUtils;
  } else if (typeof require !== 'undefined') {
    try {
      deps.Types = require('./types');
      deps.Config = require('./config');
      deps.Utils = require('./utils');
    } catch (e) {
    }
  }
  
  return deps;
}

class FormatApplier {
  constructor(tableContainer, table = null) {
    this.tableContainer = tableContainer;
    this.table = table; // Reference to main table instance for data access
    this.appliedFormats = new Map(); // Track applied formats for cleanup
    this.styleSheet = null;
    this.nextClassId = 1;
    
    // Initialize dependencies
    const { Config, Utils } = getConditionalFormattingDependencies();
    this.config = Config || {};
    this.utils = new Utils(this.config);
    
    // Initialize data manager for efficient column statistics
    if (typeof window !== 'undefined' && window.ConditionalFormattingDataManager && this.table) {
      this.dataManager = new window.ConditionalFormattingDataManager(this.table, this.config, this.utils);
    } else {
      this.dataManager = null;
    }
    
    // Get configuration values
    this.classPrefix = this.config.classes?.prefix || 'cf-';
    this.starIconColor = this.config.colors?.starIcon || '#FF8C00';
    this.spacing = this.config.spacing || {};
    
    this.initializeStyleSheet();
  }
  
  /**
   * Initialize dynamic stylesheet for conditional formatting
   */
  initializeStyleSheet() {
    // Check if shared CSS file is already loaded
    const existingStyles = document.querySelector('link[href*="conditional-formatting-styles.css"]') ||
                          document.querySelector('style[id="conditional-formatting-styles"]');
    
    // Create dynamic stylesheet for runtime rules only
    let dynamicStyleElement = document.getElementById('conditional-formatting-dynamic');
    if (!dynamicStyleElement) {
      dynamicStyleElement = document.createElement('style');
      dynamicStyleElement.id = 'conditional-formatting-dynamic';
      dynamicStyleElement.type = 'text/css';
      document.head.appendChild(dynamicStyleElement);
    }
    
    // If shared styles not loaded, inject critical CSS
    if (!existingStyles) {
      this.injectCriticalCSS(dynamicStyleElement);
    }
    
    this.styleSheet = dynamicStyleElement.sheet;
  }
  
  /**
   * Inject critical CSS if shared stylesheet is not loaded
   */
  injectCriticalCSS(styleElement) {
    const criticalCSS = `
      /* Critical CSS for conditional formatting icons */
      :root {
        --cf-star-icon: ${this.starIconColor};
      }
      
      .cf-icon,
      .cf-star-icon,
      .table-cell .cf-icon,
      .table-cell .cf-star-icon,
      td.table-cell .cf-icon,
      td.table-cell .cf-star-icon,
      td.table-cell span.cf-icon,
      td.table-cell span.cf-star-icon {
        color: var(--cf-star-icon, ${this.starIconColor}) !important;
        font-size: 1.2em !important;
        margin-right: ${this.spacing.xs || '4px'} !important;
        display: inline-block !important;
      }
      
      .cf-data-bar-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
      }
      
      .cf-data-bar {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        opacity: 0.7;
        z-index: 1;
        border-radius: ${this.spacing.xs || '4px'};
        pointer-events: none;
      }
      
      .cf-data-bar-text {
        position: relative;
        z-index: 2;
        padding: 0 ${this.spacing.xs || '4px'};
        color: inherit;
        font-weight: inherit;
        pointer-events: none;
      }
      
      /* Row-level formatting styles */
      .cf-row-condition-matched {
        /* Optional: Add row-level indicator */
      }
      
      .cf-row-formatted {
        /* Cells that are part of row-level formatting */
        position: relative;
      }
    `;
    
    styleElement.textContent = criticalCSS;
  }
  
  /**
   * Apply formatting to a cell
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Array} matchingRules - Array of matching rules with formats
   * @param {Object} cellData - Cell data for advanced formatting
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   */
  applyFormatting(cellElement, matchingRules, cellData, rowIndex, columnIndex) {
    if (!cellElement || !matchingRules || matchingRules.length === 0) {
      return;
    }
    
    // 🎯 Check if any rules require row-level formatting
    const rowLevelRules = matchingRules.filter(({ rule }) => 
      rule.targetScope === 'row' || rule.applicationScope === 'row'
    );
    const cellLevelRules = matchingRules.filter(({ rule }) => 
      rule.targetScope !== 'row' && rule.applicationScope !== 'row'
    );
    
    console.log(`🔧 Applying formatting - Row rules: ${rowLevelRules.length}, Cell rules: ${cellLevelRules.length}`);
    
    // 既に同じ書式が適用されているかチェック
    const currentFormatKey = this.getCellKey(rowIndex, columnIndex);
    const existingFormat = this.appliedFormats.get(currentFormatKey);
    
    if (existingFormat && this.isSameFormat(existingFormat.rules, matchingRules)) {
      // 同じ書式なので再適用は不要
      return;
    }
    
    // Clear existing conditional formatting
    this.clearCellFormatting(cellElement);
    
    // Apply row-level formatting first
    if (rowLevelRules.length > 0) {
      console.log('📏 Applying row-level formatting');
      this.applyRowFormatting(cellElement, rowLevelRules, cellData, rowIndex, columnIndex);
    }
    
    // Apply cell-level formatting
    if (cellLevelRules.length > 0) {
      console.log('📱 Applying cell-level formatting');
      this.applyCellFormatting(cellElement, cellLevelRules, cellData, rowIndex, columnIndex);
    }
    
    // Track applied formatting for cleanup
    const cellKey = this.getCellKey(rowIndex, columnIndex);
    this.appliedFormats.set(cellKey, {
      element: cellElement,
      format: this.combineFormats(matchingRules),
      rules: matchingRules
    });
  }
  
  /**
   * Apply row-level formatting
   * @param {HTMLElement} cellElement - Current cell element (used to find row)
   * @param {Array} rowLevelRules - Rules that should apply to entire row
   * @param {Object} cellData - Cell data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   */
  applyRowFormatting(cellElement, rowLevelRules, cellData, rowIndex, columnIndex) {
    // Find the row element
    const rowElement = cellElement.closest('tr');
    if (!rowElement) {
      console.warn('Row element not found for row-level formatting');
      return;
    }
    
    // Combine formats from row-level rules
    const combinedFormat = this.combineFormats(rowLevelRules);
    console.log('🎨 Row combined format:', combinedFormat);
    
    // Apply the format to all cells in the row
    const cells = rowElement.querySelectorAll('td, th');
    cells.forEach((cell, cellIndex) => {
      // 🎯 DON'T clear existing formatting - preserve special formatting like icons, bars, scales
      // Only clear row-level classes to avoid conflicts
      cell.classList.remove('cf-row-formatted');
      
      // Apply basic row-level styles (background, text color, font) WITHOUT removing special formatting
      this.applyRowLevelBasicFormat(cell, combinedFormat);
      
      // Add row formatting marker
      cell.classList.add('cf-row-formatted');
      
      console.log(`✅ Applied row formatting to cell ${cellIndex} in row ${rowIndex} (preserving existing special formatting)`);
    });
    
    // Add row-level class to the row itself
    rowElement.classList.add('cf-row-condition-matched');
  }

  /**
   * Apply cell-level formatting  
   * @param {HTMLElement} cellElement - Cell element to format
   * @param {Array} cellLevelRules - Rules that apply to single cells
   * @param {Object} cellData - Cell data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   */
  applyCellFormatting(cellElement, cellLevelRules, cellData, rowIndex, columnIndex) {
    // Combine formats from cell-level rules
    const combinedFormat = this.combineFormats(cellLevelRules);
    
    // Apply the combined format
    this.applyCombinedFormat(cellElement, combinedFormat, cellData, rowIndex, columnIndex);
  }

  /**
   * Combine formats from multiple rules
   * @param {Array} matchingRules - Rules with their formats
   * @returns {Object} Combined format object
   */
  combineFormats(matchingRules) {
    const combined = {};
    
    // Process rules in reverse priority order (lowest first, so higher priority overwrites)
    const sortedRules = matchingRules.slice().sort((a, b) => a.priority - b.priority);
    
    for (const { rule, format } of sortedRules) {
      Object.assign(combined, format);
    }
    
    return combined;
  }
  
  /**
   * Apply combined format to a cell
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} format - Combined format object
   * @param {Object} cellData - Cell data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   */
  applyCombinedFormat(cellElement, format, cellData, rowIndex, columnIndex) {
    // Apply basic CSS properties
    this.applyBasicFormat(cellElement, format);
    
    // Apply advanced formatting
    this.applyAdvancedFormat(cellElement, format, cellData, rowIndex, columnIndex);
    
    // Add conditional formatting marker class
    cellElement.classList.add('conditional-formatting-applied');
  }
  
  /**
   * Apply basic CSS formatting
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} format - Format object
   */
  applyBasicFormat(cellElement, format) {
    const ConditionalFormattingTypes = getConditionalFormattingTypes();
    const { FormatSpec } = ConditionalFormattingTypes || {};
    
    
    // Create FormatSpec instance if needed
    const formatSpec = format instanceof (FormatSpec || Object) ? format : new (FormatSpec || Object)(format);
    
    // Apply CSS styles
    const cssStyle = formatSpec.toCSSStyle ? formatSpec.toCSSStyle() : this.formatToCSSStyle(format);
    
    
    // Apply styles with important flag to override existing styles
    if (cssStyle.backgroundColor) {
      cellElement.style.setProperty('background-color', cssStyle.backgroundColor, 'important');
    }
    if (cssStyle.color) {
      cellElement.style.setProperty('color', cssStyle.color, 'important');
    }
    if (cssStyle.fontWeight) {
      cellElement.style.setProperty('font-weight', cssStyle.fontWeight, 'important');
    }
    if (cssStyle.fontStyle) {
      cellElement.style.setProperty('font-style', cssStyle.fontStyle, 'important');
    }
    
    // Also apply using Object.assign as fallback
    Object.assign(cellElement.style, cssStyle);
    
  }
  
  /**
   * Convert format object to CSS style (fallback if FormatSpec not available)
   * @param {Object} format - Format object
   * @returns {Object} CSS style object
   */
  formatToCSSStyle(format) {
    const style = {};
    
    if (format.backgroundColor) style.backgroundColor = format.backgroundColor;
    if (format.textColor) style.color = format.textColor;
    if (format.fontWeight) style.fontWeight = format.fontWeight;
    if (format.fontStyle) style.fontStyle = format.fontStyle;
    if (format.textDecoration) style.textDecoration = format.textDecoration;
    if (format.border) style.border = format.border;
    if (format.borderRadius) style.borderRadius = format.borderRadius;
    if (format.opacity !== null && format.opacity !== undefined) style.opacity = format.opacity;
    if (format.transform) style.transform = format.transform;
    
    return style;
  }

  /**
   * Calculate column statistics for DataBar formatting using efficient DataManager
   * @param {number} columnIndex - Column index
   * @returns {Object} Column statistics
   */
  calculateColumnStatsForDataBar(columnIndex) {
    // Use DataManager if available (preferred - uses full dataset)
    if (this.dataManager && this.table && this.table.options && this.table.options.columns) {
      return this.dataManager.getColumnStats(columnIndex, this.table.options.columns);
    }
    
    
    // Fallback to DOM extraction (legacy method - only visible data)
    const columnData = this.extractColumnData(columnIndex);
    const numericValues = columnData
      .map(value => this.utils.parseNumeric(value))
      .filter(value => this.utils.isNumeric(value));

    if (numericValues.length === 0) {
      return { min: 0, max: 0, percentiles: {}, count: 0, dataType: 'unknown' };
    }

    const sorted = numericValues.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Calculate percentiles
    const percentiles = {};
    for (let p = 10; p <= 90; p += 10) {
      const index = Math.floor((p / 100) * (sorted.length - 1));
      percentiles[`p${p}`] = sorted[index];
    }
    
    return {
      min,
      max,
      percentiles,
      count: numericValues.length,
      dataType: 'number'
    };
  }

  /**
   * Extract column data from table
   * @param {number} columnIndex - Column index
   * @returns {Array} Column values
   */
  extractColumnData(columnIndex) {
    const columnData = [];
    const rows = this.tableContainer.querySelectorAll('tr');
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const cells = rows[i].querySelectorAll('td, th');
      if (cells[columnIndex]) {
        columnData.push(cells[columnIndex].textContent.trim());
      }
    }
    
    return columnData;
  }
  
  /**
   * Apply advanced formatting (data bars, icons, etc.)
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} format - Format object
   * @param {Object} cellData - Cell data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   */
  applyAdvancedFormat(cellElement, format, cellData, rowIndex, columnIndex) {
    // Apply data bars - use new DataBarFormatter if available
    if (format.dataBar) {
      
      if (typeof window !== 'undefined' && window.ConditionalFormattingDataBarFormatter) {
        try {
          const DataBarFormatter = window.ConditionalFormattingDataBarFormatter;
          const formatter = new DataBarFormatter(this.config, this.utils);
          
          // Calculate column stats for the new formatter
          const columnStats = this.calculateColumnStatsForDataBar(columnIndex);
          
          formatter.apply(cellElement, format.dataBar, cellData, columnStats);
        } catch (error) {
          this.applyDataBar(cellElement, format.dataBar, cellData);
        }
      } else {
        this.applyDataBar(cellElement, format.dataBar, cellData);
      }
    }
    
    // Apply color scales
    if (format.colorScale) {
      this.applyColorScale(cellElement, format.colorScale, cellData);
    }
    
    // Apply icon sets - use new IconSetFormatter if available
    if (format.iconSet) {
      
      if (typeof window !== 'undefined' && window.ConditionalFormattingIconSetFormatter) {
        try {
          const IconSetFormatter = window.ConditionalFormattingIconSetFormatter;
          const formatter = new IconSetFormatter(this.config, this.utils);
          
          // Calculate column stats for the new formatter
          const columnStats = this.calculateColumnStatsForDataBar(columnIndex);
          
          formatter.apply(cellElement, format.iconSet, cellData, columnStats);
        } catch (error) {
          this.applyIconSet(cellElement, format.iconSet, cellData);
        }
      } else {
        this.applyIconSet(cellElement, format.iconSet, cellData);
      }
    }
    
    // Apply individual icons
    if (format.icon) {
      this.applyIcon(cellElement, format.icon);
    }
  }
  
  /**
   * Apply data bar formatting
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} dataBarConfig - Data bar configuration
   * @param {*} cellValue - Cell value
   */
  applyDataBar(cellElement, dataBarConfig, cellValue) {
    
    // Use utility function for numeric parsing
    const numericValue = this.utils.parseNumeric(cellValue);
    if (!this.utils.isNumeric(cellValue)) {
      return;
    }
    
    
    // Get min/max values from all cells with data bars (for proper scaling)
    const minMaxValues = this.getDataBarMinMax(cellElement);
    const minValue = minMaxValues.min;
    const maxValue = minMaxValues.max;
    
    // Calculate bar width as percentage of max value
    let percentage;
    if (maxValue === minValue) {
      percentage = 100; // Single value case
    } else {
      percentage = Math.max(0, Math.min(100, ((numericValue - minValue) / (maxValue - minValue)) * 100));
    }
    
    // Create data bar container using utility
    const dataBarContainer = this.utils.createElement('div', 'cf-data-bar-container');
    
    // Create data bar with configuration-based styling
    const defaultColor = this.config.colors?.palettes?.material?.blue || '#4285f4';
    let backgroundColor;
    if (dataBarConfig.gradientFill) {
      backgroundColor = `linear-gradient(to right, ${dataBarConfig.color}22, ${dataBarConfig.color})`;
    } else {
      backgroundColor = dataBarConfig.color || defaultColor;
    }
    
    const dataBar = this.utils.createElement('div', 'cf-data-bar', {
      width: `${percentage}%`,
      background: backgroundColor
    });
    
    // Create text content with configuration-based padding
    const textContent = this.utils.createElement('span', 'cf-data-bar-text');
    textContent.textContent = dataBarConfig.showValue !== false ? String(cellValue) : '';
    
    // Clear existing content and add data bar
    cellElement.innerHTML = '';
    dataBarContainer.appendChild(dataBar);
    dataBarContainer.appendChild(textContent);
    cellElement.appendChild(dataBarContainer);
    
  }
  
  /**
   * Get min/max values for data bar scaling
   * @param {HTMLElement} cellElement - Current cell element
   * @returns {Object} Min and max values
   */
  getDataBarMinMax(cellElement) {
    // Find all cells in the same column with data bars
    const table = cellElement.closest('table');
    if (!table) return { min: 0, max: 100 };
    
    const cellIndex = Array.from(cellElement.parentElement.children).indexOf(cellElement);
    const columnCells = table.querySelectorAll(`tbody tr td:nth-child(${cellIndex + 1})`);
    
    const values = [];
    columnCells.forEach(cell => {
      const textContent = cell.textContent || cell.innerText || '';
      const numericValue = this.utils.parseNumeric(textContent);
      if (this.utils.isNumeric(textContent)) {
        values.push(numericValue);
      }
    });
    
    if (values.length === 0) return { min: 0, max: 100 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  /**
   * Apply color scale formatting
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} colorScaleConfig - Color scale configuration
   * @param {*} cellValue - Cell value
   */
  applyColorScale(cellElement, colorScaleConfig, cellValue) {
    // Use utility function for numeric parsing
    const numericValue = this.utils.parseNumeric(cellValue);
    if (!this.utils.isNumeric(cellValue) || !colorScaleConfig.colors || colorScaleConfig.colors.length < 2) {
      return;
    }
    
    // Get min/max values from all cells in the same column for proper scaling
    const minMaxValues = this.getColorScaleMinMax(cellElement);
    const minValue = minMaxValues.min;
    const maxValue = minMaxValues.max;
    
    if (maxValue === minValue) {
      // All values are the same, use middle color
      const colors = colorScaleConfig.colors;
      const color = colors.length === 3 ? colors[1] : colors[0];
      cellElement.style.backgroundColor = color;
      return;
    }
    
    // Normalize value to 0-1 range based on actual data range
    const normalizedValue = Math.min(Math.max((numericValue - minValue) / (maxValue - minValue), 0), 1);
    
    const colors = colorScaleConfig.colors;
    let color;
    
    if (colors.length === 3) {
      // Three-color scale (low-mid-high)
      if (normalizedValue <= 0.5) {
        // Interpolate between first and second color
        color = this.interpolateColor(colors[0], colors[1], normalizedValue * 2);
      } else {
        // Interpolate between second and third color
        color = this.interpolateColor(colors[1], colors[2], (normalizedValue - 0.5) * 2);
      }
    } else if (colors.length === 2) {
      // Two-color scale (custom gradient)
      color = this.interpolateColor(colors[0], colors[1], normalizedValue);
    } else {
      // Single color fallback
      color = colors[0] || '#4285f4';
    }
    
    cellElement.style.backgroundColor = color;
  }

  /**
   * Get min/max values for color scale scaling
   * @param {HTMLElement} cellElement - Current cell element
   * @returns {Object} Min and max values
   */
  getColorScaleMinMax(cellElement) {
    // Find all cells in the same column
    const table = cellElement.closest('table');
    if (!table) return { min: 0, max: 100 };
    
    const cellIndex = Array.from(cellElement.parentElement.children).indexOf(cellElement);
    const columnCells = table.querySelectorAll(`tbody tr td:nth-child(${cellIndex + 1})`);
    
    const values = [];
    columnCells.forEach(cell => {
      const textContent = cell.textContent || cell.innerText || '';
      const numericValue = this.utils.parseNumeric(textContent);
      if (this.utils.isNumeric(textContent)) {
        values.push(numericValue);
      }
    });
    
    if (values.length === 0) return { min: 0, max: 100 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  /**
   * Apply icon set formatting
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {Object} iconSetConfig - Icon set configuration
   * @param {*} cellValue - Cell value
   */
  applyIconSet(cellElement, iconSetConfig, cellValue) {
    // Use utility function for numeric parsing
    const numericValue = this.utils.parseNumeric(cellValue);
    if (!this.utils.isNumeric(cellValue) || !iconSetConfig.icons || !iconSetConfig.thresholds) {
      return;
    }
    
    // Get min/max values from all cells in the same column for proper scaling
    const minMaxValues = this.getIconSetMinMax(cellElement);
    const minValue = minMaxValues.min;
    const maxValue = minMaxValues.max;
    
    // Use utility function to get the appropriate icon
    const icon = this.utils.getIconFromSet(
      numericValue,
      minValue,
      maxValue,
      iconSetConfig.icons,
      iconSetConfig.thresholds
    );
    
    this.applyIcon(cellElement, icon);
  }

  /**
   * Get min/max values for icon set scaling
   * @param {HTMLElement} cellElement - Current cell element
   * @returns {Object} Min and max values
   */
  getIconSetMinMax(cellElement) {
    // Find all cells in the same column
    const table = cellElement.closest('table');
    if (!table) return { min: 0, max: 100 };
    
    const cellIndex = Array.from(cellElement.parentElement.children).indexOf(cellElement);
    const columnCells = table.querySelectorAll(`tbody tr td:nth-child(${cellIndex + 1})`);
    
    const values = [];
    columnCells.forEach(cell => {
      const textContent = cell.textContent || cell.innerText || '';
      const numericValue = this.utils.parseNumeric(textContent);
      if (this.utils.isNumeric(textContent)) {
        values.push(numericValue);
      }
    });
    
    if (values.length === 0) return { min: 0, max: 100 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  /**
   * Apply icon to cell
   * @param {HTMLElement} cellElement - Cell DOM element
   * @param {string} icon - Icon character or class
   */
  applyIcon(cellElement, icon) {
    // Create icon element using utility with proper styling
    const iconElement = this.utils.createElement('span', ['cf-icon', 'cf-star-icon'], {
      color: `${this.starIconColor} !important`,
      fontSize: '1.2em !important',
      marginRight: `${this.spacing.xs || '4px'} !important`,
      display: 'inline-block !important'
    });
    
    // Set icon content based on type
    const maxIconLength = 10; // Configuration constant
    if (icon.length <= maxIconLength) {
      iconElement.textContent = icon;
    } else {
      iconElement.classList.add(icon);
    }
    
    // Enhanced color enforcement using CSS custom property
    cellElement.style.setProperty('--cf-star-icon', this.starIconColor);
    
    // Create color observer to prevent style overrides
    const colorObserver = new MutationObserver(() => {
      const currentColor = getComputedStyle(iconElement).color;
      const expectedRgb = this.utils.hexToRgb(this.starIconColor);
      
      if (expectedRgb) {
        const expectedRgbString = `rgb(${expectedRgb.r}, ${expectedRgb.g}, ${expectedRgb.b})`;
        if (currentColor !== expectedRgbString) {
          iconElement.style.setProperty('color', this.starIconColor, 'important');
        }
      }
    });
    
    colorObserver.observe(iconElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Store observer for cleanup
    iconElement._colorObserver = colorObserver;
    
    // Insert icon into cell with preserved content
    const originalContent = cellElement.innerHTML;
    
    // Store original content for cleanup
    if (!cellElement.hasAttribute('data-original-content')) {
      cellElement.setAttribute('data-original-content', originalContent);
    }
    
    cellElement.innerHTML = '';
    cellElement.appendChild(iconElement);
    
    if (originalContent) {
      const contentSpan = this.utils.createElement('span');
      contentSpan.innerHTML = originalContent;
      cellElement.appendChild(contentSpan);
    }
    
    // Mark cell as having conditional formatting applied
    cellElement.classList.add('conditional-formatting-applied');
  }
  
  /**
   * Interpolate between two colors (using shared utility)
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @param {number} factor - Interpolation factor (0-1)
   * @returns {string} Interpolated color
   */
  interpolateColor(color1, color2, factor) {
    return this.utils.interpolateColor(color1, color2, factor);
  }
  
  /**
   * Clear all conditional formatting from a cell
   * @param {HTMLElement} cellElement - Cell DOM element
   */
  clearCellFormatting(cellElement) {
    // First, check if we have the original content stored
    const storedOriginalContent = cellElement.getAttribute('data-original-content');
    let originalText = '';
    
    if (storedOriginalContent !== null) {
      // Use the stored original content (this is the most reliable)
      originalText = storedOriginalContent;
    } else {
      // Fallback: try to extract original content from current display
      // Check if there's a data bar with text content
      const dataBarText = cellElement.querySelector('.cf-data-bar-text');
      if (dataBarText) {
        originalText = dataBarText.textContent || '';
      } else {
        // For icon formatting, try to get the text without the icon
        const iconElement = cellElement.querySelector('.cf-icon, .cf-star-icon');
        if (iconElement) {
          // Get all text nodes that are not inside the icon element
          const textNodes = Array.from(cellElement.childNodes).filter(node => {
            return node.nodeType === Node.TEXT_NODE || 
                   (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('cf-icon') && !node.classList.contains('cf-star-icon'));
          });
          originalText = textNodes.map(node => node.textContent || '').join('').trim();
        } else {
          // For other formatting, get the current text content
          originalText = cellElement.textContent || cellElement.innerText || '';
        }
      }
    }
    
    // Remove conditional formatting classes (both cell-level and row-level)
    cellElement.classList.remove('conditional-formatting-applied', 'cf-row-formatted');
    
    // Clear row-level formatting classes from the parent row if this is the last formatted cell
    const rowElement = cellElement.closest('tr');
    if (rowElement && rowElement.classList.contains('cf-row-condition-matched')) {
      // Check if this row has any other cells with row-level formatting
      const otherRowFormattedCells = rowElement.querySelectorAll('.cf-row-formatted');
      
      // If this is the only cell with row formatting, or there are no other row-formatted cells after removal
      if (otherRowFormattedCells.length <= 1) { // <= 1 because current cell still has the class at this point
        rowElement.classList.remove('cf-row-condition-matched');
      }
    }
    
    // Remove CF-specific elements and clean up observers
    const cfElements = cellElement.querySelectorAll('[class*="cf-"]');
    cfElements.forEach(el => {
      // クリーンアップ: ColorObserverを停止
      if (el._colorObserver) {
        el._colorObserver.disconnect();
        delete el._colorObserver;
      }
      el.remove();
    });
    
    // Reset inline styles that might have been applied by conditional formatting
    const stylesToReset = [
      'backgroundColor', 'color', 'fontWeight', 'fontStyle', 'textDecoration',
      'border', 'borderRadius', 'opacity', 'transform'
    ];
    
    stylesToReset.forEach(property => {
      cellElement.style[property] = '';
    });
    
    // Restore original text content if it was cleared by data bars or other advanced formatting
    if (originalText !== '') {
      cellElement.textContent = originalText;
    }
    
    // Remove the data-original-content attribute as it's no longer needed
    if (cellElement.hasAttribute('data-original-content')) {
      cellElement.removeAttribute('data-original-content');
    }
  }
  
  /**
   * Clear all conditional formatting from the table
   */
  clearAllFormatting() {
    
    // Clear tracked formats
    this.appliedFormats.forEach(({ element }) => {
      this.clearCellFormatting(element);
    });
    this.appliedFormats.clear();
    
    // Additional cleanup: Find all cells that might have conditional formatting
    // even if they're not tracked in appliedFormats
    const allFormattedCells = this.tableContainer.querySelectorAll('.conditional-formatting-applied');
    
    allFormattedCells.forEach(cell => {
      this.clearCellFormatting(cell);
    });
    
    // Remove all star icons and other CF elements that might be left behind
    const cfElements = this.tableContainer.querySelectorAll('.cf-star-icon, .cf-icon, .cf-data-bar-container, .cf-data-bar, [class*="cf-"]');
    
    // Log details about star elements
    const starElements = this.tableContainer.querySelectorAll('.cf-star-icon');
    
    cfElements.forEach(element => {
      if (element.classList.contains('cf-star-icon')) {
      }
      element.remove();
    });
    
    // Clear all cells with conditional formatting styles (belt and suspenders approach)
    const allCells = this.tableContainer.querySelectorAll('td');
    let cellsWithStars = 0;
    allCells.forEach(cell => {
      // Check if cell has any conditional formatting indicators
      if (cell.querySelector('.cf-star-icon') || 
          cell.classList.contains('conditional-formatting-applied') ||
          cell.style.backgroundColor || 
          cell.innerHTML.includes('★')) {
        
        if (cell.innerHTML.includes('★')) {
          cellsWithStars++;
        }
        
        // Clear the cell using the clearCellFormatting method which handles restoration
        this.clearCellFormatting(cell);
      }
    });
    
    // Clear stylesheet rules
    if (this.styleSheet) {
      while (this.styleSheet.cssRules.length > 0) {
        this.styleSheet.deleteRule(0);
      }
    }
    
    // Reset class counter
    this.nextClassId = 1;
    
  }
  
  /**
   * Check if two rule sets are the same
   * @param {Array} rules1 - First rule set
   * @param {Array} rules2 - Second rule set
   * @returns {boolean} True if rules are the same
   */
  isSameFormat(rules1, rules2) {
    if (!rules1 || !rules2 || rules1.length !== rules2.length) {
      return false;
    }
    
    // 簡単な比較 - ルールIDで判定
    const ids1 = rules1.map(r => r.rule?.id || r.id).sort();
    const ids2 = rules2.map(r => r.rule?.id || r.id).sort();
    
    return ids1.every((id, index) => id === ids2[index]);
  }

  /**
   * Get cell key for tracking
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   * @returns {string} Cell key
   */
  getCellKey(rowIndex, columnIndex) {
    return `${rowIndex}-${columnIndex}`;
  }
  
  /**
   * Generate unique CSS class name
   * @returns {string} Class name
   */
  generateClassName() {
    return `${this.classPrefix}-${this.nextClassId++}`;
  }
  
  /**
   * Add CSS rule to stylesheet
   * @param {string} selector - CSS selector
   * @param {string} rules - CSS rules
   */
  addCSSRule(selector, rules) {
    if (this.styleSheet) {
      try {
        this.styleSheet.insertRule(`${selector} { ${rules} }`, this.styleSheet.cssRules.length);
      } catch (e) {
      }
    }
  }
  
  /**
   * Invalidate data manager cache when table data changes
   */
  invalidateDataCache() {
    if (this.dataManager) {
      this.dataManager.invalidateCache();
    }
  }
  
  /**
   * Get formatting statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      appliedFormats: this.appliedFormats.size,
      cssRules: this.styleSheet ? this.styleSheet.cssRules.length : 0,
      nextClassId: this.nextClassId
    };
    
    // Add data manager stats if available
    if (this.dataManager) {
      stats.dataManager = this.dataManager.getCacheInfo();
    }
    
    return stats;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.clearAllFormatting();
    
    // Clean up data manager
    if (this.dataManager) {
      this.dataManager.destroy();
      this.dataManager = null;
    }
    
    // Remove stylesheet
    const styleElement = document.getElementById('conditional-formatting-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormatApplier;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingFormatApplier = FormatApplier;
}