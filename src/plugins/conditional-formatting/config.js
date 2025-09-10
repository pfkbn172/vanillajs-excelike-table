/**
 * Conditional Formatting Configuration
 * Central configuration for colors, sizes, constants, and shared settings
 */

const ConditionalFormattingConfig = {
  
  // ====================================
  // COLORS & VISUAL DESIGN
  // ====================================
  
  colors: {
    // Primary brand colors
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryLight: '#e6f7ff',
    primaryBorder: '#91d5ff',
    
    // Star icon colors
    starIcon: '#FF8C00', // Orange-gold for visibility on white background
    starIconHover: '#ff7300',
    
    // UI colors
    text: {
      primary: '#262626',
      secondary: '#595959', 
      disabled: '#bfbfbf',
      placeholder: '#8c8c8c',
      light: '#666666'
    },
    
    background: {
      white: '#ffffff',
      light: '#fafafa',
      gray: '#f5f5f5',
      disabled: '#f0f0f0'
    },
    
    border: {
      default: '#d9d9d9',
      light: '#f0f0f0',
      hover: '#40a9ff',
      active: '#1890ff'
    },
    
    // Status colors
    status: {
      success: '#52c41a',
      warning: '#faad14', 
      error: '#ff4d4f',
      info: '#1890ff'
    },
    
    // Data visualization color palettes
    palettes: {
      // Material Design inspired
      material: {
        blue: '#4285f4',
        green: '#34a853', 
        red: '#ea4335',
        yellow: '#fbbc04',
        purple: '#9c27b0',
        orange: '#ff9800',
        teal: '#009688',
        pink: '#e91e63'
      },
      
      // Excel-like color scales
      scales: {
        redYellowGreen: ['#f63538', '#ffeb84', '#63be7b'],
        greenYellowRed: ['#63be7b', '#ffeb84', '#f63538'],
        greenWhiteRed: ['#63be7b', '#ffffff', '#f63538'],
        redWhiteBlue: ['#f63538', '#ffffff', '#5a8ac6'],
        blueWhiteRed: ['#5a8ac6', '#ffffff', '#f63538'],
        whiteRed: ['#ffffff', '#f63538'],
        redWhite: ['#f63538', '#ffffff'],
        greenWhite: ['#63be7b', '#ffffff'],
        whiteGreen: ['#ffffff', '#63be7b']
      }
    }
  },
  
  // ====================================
  // SPACING & SIZING
  // ====================================
  
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px'
  },
  
  fontSize: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '20px'
  },
  
  borderRadius: {
    sm: '2px',
    md: '4px', 
    lg: '6px',
    xl: '8px'
  },
  
  // ====================================
  // Z-INDEX LAYERS
  // ====================================
  
  zIndex: {
    tooltip: 8000,
    dropdown: 9000,
    modalOverlay: 9999,
    modal: 10000,
    contextMenu: 10001,
    notification: 10002
  },
  
  // ====================================
  // ANIMATIONS & TIMING
  // ====================================
  
  animation: {
    duration: {
      fast: '0.1s',
      normal: '0.2s', 
      slow: '0.3s'
    },
    
    easing: {
      ease: 'ease',
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out'
    }
  },
  
  // ====================================
  // PERFORMANCE CONSTANTS
  // ====================================
  
  performance: {
    debounceDelay: 150, // ms
    mutationBatchDelay: 150, // ms
    scrollDebounce: 100, // ms
    maxRules: 100,
    maxCellsPerBatch: 1000,
    viewportBuffer: 50 // pixels
  },
  
  // ====================================
  // ICON SETS CONFIGURATION  
  // ====================================
  
  iconSets: {
    stars: {
      name: '星評価',
      description: '5段階評価（1つ星～5つ星）',
      icons: ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'],
      thresholds: [20, 40, 60, 80], // 5-stage thresholds
      type: '5-stage'
    },
    
    trafficLights: {
      name: '信号機',
      description: '赤：低い値、黄：中間値、緑：高い値',
      icons: ['🔴', '🟡', '🟢'],
      thresholds: [33, 67], // 3-stage thresholds
      type: '3-stage'
    },
    
    arrows: {
      name: '矢印', 
      description: '下矢印：下降、横矢印：横ばい、上矢印：上昇',
      icons: ['↓', '→', '↑'],
      thresholds: [33, 67],
      type: '3-stage'
    },
    
    shapes: {
      name: '状態表示',
      description: 'X：問題、警告：注意、チェック：OK', 
      icons: ['❌', '⚠️', '✅'],
      thresholds: [33, 67],
      type: '3-stage'
    },
    
    progress: {
      name: '進捗表示',
      description: '赤：遅れ、オレンジ：順調、緑：前倒し',
      icons: ['🔴', '🟠', '🟢'], 
      thresholds: [33, 67],
      type: '3-stage'
    }
  },
  
  // ====================================
  // MODAL & DIALOG SETTINGS
  // ====================================
  
  modal: {
    maxWidth: '600px',
    maxHeight: '80vh', 
    padding: '24px',
    margin: '20px'
  },
  
  // ====================================
  // FORM FIELD DEFAULTS
  // ====================================
  
  form: {
    input: {
      height: '32px',
      borderRadius: '4px',
      padding: '4px 11px'
    },
    
    validation: {
      percentage: {
        min: 0,
        max: 100
      },
      
      numeric: {
        min: -1000000,
        max: 1000000
      }
    }
  },
  
  // ====================================
  // CSS CLASS NAMES
  // ====================================
  
  classes: {
    prefix: 'cf-',
    
    // Modal classes
    modalOverlay: 'cf-modal-overlay',
    modalContent: 'cf-modal-content', 
    modalHeader: 'cf-modal-header',
    modalTitle: 'cf-modal-title',
    modalClose: 'cf-modal-close',
    
    // Button classes
    button: 'cf-button',
    buttonPrimary: 'cf-button-primary',
    buttonCancel: 'cf-button-cancel',
    
    // Context menu classes  
    contextMenu: 'cf-context-menu',
    contextMenuItem: 'cf-context-menu-item',
    contextMenuIcon: 'cf-context-menu-icon',
    
    // Form classes
    formGroup: 'cf-form-group',
    formLabel: 'cf-form-label',
    formInput: 'cf-form-input',
    
    // Icon classes
    icon: 'cf-icon',
    starIcon: 'cf-star-icon',
    dataBar: 'cf-data-bar',
    dataBarContainer: 'cf-data-bar-container'
  },
  
  // ====================================
  // UTILITY FUNCTIONS
  // ====================================
  
  utils: {
    /**
     * Get theme-consistent CSS properties
     */
    getCSSVariable(path) {
      const keys = path.split('.');
      let value = this;
      
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return null;
      }
      
      return value;
    },
    
    /**
     * Generate CSS class name with prefix
     */
    getClassName(name) {
      return `${this.classes.prefix}${name}`;
    },
    
    /**
     * Create consistent box shadow
     */
    getBoxShadow(level = 'normal') {
      const shadows = {
        light: '0 2px 4px rgba(0, 0, 0, 0.1)',
        normal: '0 4px 12px rgba(0, 0, 0, 0.15)', 
        heavy: '0 8px 24px rgba(0, 0, 0, 0.2)'
      };
      return shadows[level] || shadows.normal;
    }
  },
  
  // ====================================
  // DATA MIGRATION RULES
  // ====================================
  
  /**
   * Format type detection rules for legacy data migration
   * Each rule is a function that receives a format object and returns boolean
   * Order matters - first matching rule wins
   */
  formatTypeMigrationRules: {
    iconSet: (format) => !!format.iconSet,
    dataBar: (format) => !!format.dataBar,
    colorScale: (format) => !!format.colorScale
  }
};

// ====================================
// EXPORT FOR DIFFERENT ENVIRONMENTS
// ====================================

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingConfig;
}

// Browser global
if (typeof window !== 'undefined') {
  window.ConditionalFormattingConfig = ConditionalFormattingConfig;
}

// ES6 default export would be: export default ConditionalFormattingConfig;