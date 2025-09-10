/**
 * Theme System for ExceLike Table
 * Handles dynamic theming with CSS custom properties
 */

const ThemeSystem = {
  /**
   * Initialize theme system
   * @param {Object} options - Theme options
   */
  init(options = {}) {
    this.themes = new Map();
    this.currentTheme = options.defaultTheme || 'default';
    this.customProperties = new Map();
    
    // Load built-in themes
    this.loadBuiltInThemes();
    
    // Load custom themes if provided
    if (options.themes) {
      Object.entries(options.themes).forEach(([name, theme]) => {
        this.addTheme(name, theme);
      });
    }
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    // Watch for system theme changes
    this.watchSystemTheme();
    
    return this;
  },

  /**
   * Load built-in themes
   */
  loadBuiltInThemes() {
    // Default theme
    this.addTheme('default', {
      name: 'Default',
      colors: {
        // Primary colors
        primary: '#1890ff',
        primaryHover: '#40a9ff',
        primaryActive: '#096dd9',
        primaryDisabled: '#b3d9ff',
        
        // Background colors
        background: '#ffffff',
        backgroundSecondary: '#fafafa',
        backgroundHover: '#f5f5f5',
        backgroundSelected: '#e6f7ff',
        backgroundDisabled: '#f5f5f5',
        
        // Text colors
        text: '#000000d9', // rgba(0,0,0,0.85)
        textSecondary: '#00000073', // rgba(0,0,0,0.45)
        textDisabled: '#00000040', // rgba(0,0,0,0.25)
        textInverse: '#ffffff',
        
        // Border colors
        border: '#d9d9d9',
        borderLight: '#f0f0f0',
        borderHover: '#40a9ff',
        
        // Status colors
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff',
        
        // Special colors
        shadow: 'rgba(0, 0, 0, 0.15)',
        overlay: 'rgba(0, 0, 0, 0.45)'
      },
      typography: {
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
        fontSize: {
          smallest: '10px',
          small: '12px',
          medium: '14px',
          large: '16px',
          largest: '18px'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          bold: '600'
        },
        lineHeight: {
          small: '1.2',
          medium: '1.5',
          large: '1.8'
        }
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px'
      },
      borderRadius: {
        small: '2px',
        medium: '4px',
        large: '6px'
      },
      shadows: {
        small: '0 2px 4px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 8px rgba(0, 0, 0, 0.12)',
        large: '0 8px 24px rgba(0, 0, 0, 0.15)'
      },
      transitions: {
        fast: '0.15s',
        medium: '0.3s',
        slow: '0.45s'
      }
    });

    // Dark theme
    this.addTheme('dark', {
      name: 'Dark',
      colors: {
        primary: '#1890ff',
        primaryHover: '#40a9ff',
        primaryActive: '#096dd9',
        primaryDisabled: '#0050b3',
        
        background: '#141414',
        backgroundSecondary: '#1f1f1f',
        backgroundHover: '#262626',
        backgroundSelected: '#111b26',
        backgroundDisabled: '#262626',
        
        text: '#ffffffd9', // rgba(255,255,255,0.85)
        textSecondary: '#ffffff73', // rgba(255,255,255,0.45)
        textDisabled: '#ffffff40', // rgba(255,255,255,0.25)
        textInverse: '#000000',
        
        border: '#434343',
        borderLight: '#303030',
        borderHover: '#40a9ff',
        
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff',
        
        shadow: 'rgba(0, 0, 0, 0.45)',
        overlay: 'rgba(0, 0, 0, 0.65)'
      },
      // Inherit other properties from default
      extends: 'default'
    });

    // Compact theme
    this.addTheme('compact', {
      name: 'Compact',
      spacing: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        xxl: '16px'
      },
      typography: {
        fontSize: {
          smallest: '10px',
          small: '11px',
          medium: '12px',
          large: '14px',
          largest: '16px'
        }
      },
      extends: 'default'
    });

    // High contrast theme (accessibility)
    this.addTheme('high-contrast', {
      name: 'High Contrast',
      colors: {
        primary: '#0000ff',
        primaryHover: '#0000cc',
        primaryActive: '#000099',
        
        background: '#ffffff',
        backgroundSecondary: '#f0f0f0',
        backgroundHover: '#e0e0e0',
        backgroundSelected: '#ffffcc',
        
        text: '#000000',
        textSecondary: '#000000',
        textDisabled: '#666666',
        textInverse: '#ffffff',
        
        border: '#000000',
        borderLight: '#666666',
        borderHover: '#0000ff',
        
        success: '#008000',
        warning: '#ff8000',
        error: '#ff0000',
        info: '#0000ff'
      },
      extends: 'default'
    });

    // Material theme
    this.addTheme('material', {
      name: 'Material',
      colors: {
        primary: '#2196f3',
        primaryHover: '#42a5f5',
        primaryActive: '#1976d2',
        
        background: '#ffffff',
        backgroundSecondary: '#fafafa',
        backgroundHover: '#f5f5f5',
        backgroundSelected: '#e3f2fd',
        
        border: '#e0e0e0',
        borderLight: '#f0f0f0'
      },
      borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px'
      },
      shadows: {
        small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        medium: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        large: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
      },
      extends: 'default'
    });

    // Bootstrap theme
    this.addTheme('bootstrap', {
      name: 'Bootstrap',
      colors: {
        primary: '#0d6efd',
        primaryHover: '#0b5ed7',
        primaryActive: '#0a58ca',
        
        success: '#198754',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#0dcaf0'
      },
      typography: {
        fontFamily: `'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
      },
      extends: 'default'
    });
  },

  /**
   * Add a theme
   * @param {string} name - Theme name
   * @param {Object} theme - Theme definition
   */
  addTheme(name, theme) {
    // Handle theme inheritance
    if (theme.extends) {
      const baseTheme = this.themes.get(theme.extends);
      if (baseTheme) {
        theme = this.mergeThemes(baseTheme, theme);
      }
    }

    this.themes.set(name, theme);
  },

  /**
   * Merge themes (for inheritance)
   * @param {Object} baseTheme - Base theme
   * @param {Object} theme - Theme to merge
   * @returns {Object} Merged theme
   */
  mergeThemes(baseTheme, theme) {
    const merged = JSON.parse(JSON.stringify(baseTheme));
    
    // Deep merge
    const deepMerge = (target, source) => {
      Object.keys(source).forEach(key => {
        if (key === 'extends') return; // Skip extends property
        
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    };

    deepMerge(merged, theme);
    return merged;
  },

  /**
   * Apply theme
   * @param {string|Object} themeOrName - Theme name or theme object
   */
  applyTheme(themeOrName) {
    let theme;
    
    if (typeof themeOrName === 'string') {
      theme = this.themes.get(themeOrName);
      if (!theme) {
        console.warn(`Theme "${themeOrName}" not found, using default`);
        theme = this.themes.get('default');
      }
      this.currentTheme = themeOrName;
    } else {
      theme = themeOrName;
      this.currentTheme = theme.name || 'custom';
    }

    if (!theme) return;

    // Apply CSS custom properties
    this.applyCSSProperties(theme);
    
    // Apply theme class to body
    this.applyThemeClass(this.currentTheme);
    
    // Emit theme change event
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme, themeData: theme }
    }));
  },

  /**
   * Apply CSS custom properties
   * @param {Object} theme - Theme object
   */
  applyCSSProperties(theme) {
    const root = document.documentElement;
    
    // Clear previous custom properties
    this.customProperties.forEach((value, property) => {
      root.style.removeProperty(property);
    });
    this.customProperties.clear();

    // Apply new properties
    this.applyThemeSection(root, 'color', theme.colors);
    this.applyThemeSection(root, 'font', theme.typography);
    this.applyThemeSection(root, 'spacing', theme.spacing);
    this.applyThemeSection(root, 'border-radius', theme.borderRadius);
    this.applyThemeSection(root, 'shadow', theme.shadows);
    this.applyThemeSection(root, 'transition', theme.transitions);
  },

  /**
   * Apply theme section to CSS properties
   * @param {Element} root - Root element
   * @param {string} prefix - Property prefix
   * @param {Object} values - Values to apply
   */
  applyThemeSection(root, prefix, values) {
    if (!values) return;

    const applyValues = (obj, keyPrefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          applyValues(value, `${keyPrefix}${key}-`);
        } else {
          const propertyName = `--table-${prefix}-${keyPrefix}${key}`;
          root.style.setProperty(propertyName, value);
          this.customProperties.set(propertyName, value);
        }
      });
    };

    applyValues(values);
  },

  /**
   * Apply theme class
   * @param {string} themeName - Theme name
   */
  applyThemeClass(themeName) {
    // Remove existing theme classes
    document.body.classList.remove(...Array.from(document.body.classList).filter(cls => 
      cls.startsWith('table-theme-')
    ));
    
    // Add new theme class
    document.body.classList.add(`table-theme-${themeName}`);
  },

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  },

  /**
   * Get theme object
   * @param {string} name - Theme name
   * @returns {Object|null} Theme object
   */
  getTheme(name) {
    return this.themes.get(name) || null;
  },

  /**
   * Get available themes
   * @returns {Array} Array of theme names
   */
  getAvailableThemes() {
    return Array.from(this.themes.keys());
  },

  /**
   * Get theme list for UI
   * @returns {Array} Array of theme info objects
   */
  getThemeList() {
    return Array.from(this.themes.entries()).map(([key, theme]) => ({
      key,
      name: theme.name || key,
      description: theme.description,
      category: theme.category || 'custom'
    }));
  },

  /**
   * Watch for system theme changes
   */
  watchSystemTheme() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      
      const updateSystemTheme = () => {
        if (this.currentTheme === 'auto') {
          let targetTheme = 'default';
          
          if (highContrastQuery.matches) {
            targetTheme = 'high-contrast';
          } else if (darkModeQuery.matches) {
            targetTheme = 'dark';
          }
          
          this.applyTheme(targetTheme);
        }
      };

      darkModeQuery.addListener(updateSystemTheme);
      highContrastQuery.addListener(updateSystemTheme);
    }
  },

  /**
   * Create theme picker UI
   * @param {Element} container - Container element
   * @returns {Element} Theme picker element
   */
  createThemePicker(container) {
    const picker = document.createElement('div');
    picker.className = 'theme-picker';
    picker.innerHTML = `
      <label for="theme-select">Theme:</label>
      <select id="theme-select" class="theme-select">
        ${this.getThemeList().map(theme => 
          `<option value="${theme.key}" ${theme.key === this.currentTheme ? 'selected' : ''}>
            ${theme.name}
          </option>`
        ).join('')}
      </select>
    `;

    const select = picker.querySelector('#theme-select');
    select.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    if (container) {
      container.appendChild(picker);
    }

    return picker;
  },

  /**
   * Export theme
   * @param {string} name - Theme name
   * @returns {Object|null} Theme object
   */
  exportTheme(name) {
    const theme = this.themes.get(name);
    return theme ? JSON.parse(JSON.stringify(theme)) : null;
  },

  /**
   * Import theme from object
   * @param {string} name - Theme name
   * @param {Object} themeData - Theme data
   */
  importTheme(name, themeData) {
    this.addTheme(name, themeData);
  },

  /**
   * Generate CSS for theme
   * @param {string} name - Theme name
   * @returns {string} CSS string
   */
  generateCSS(name) {
    const theme = this.themes.get(name);
    if (!theme) return '';

    let css = `:root {\n`;
    
    // Generate CSS custom properties
    const generateProperties = (obj, prefix) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          generateProperties(value, `${prefix}-${key}`);
        } else {
          css += `  --table${prefix}-${key}: ${value};\n`;
        }
      });
    };

    if (theme.colors) generateProperties(theme.colors, '-color');
    if (theme.typography) generateProperties(theme.typography, '-font');
    if (theme.spacing) generateProperties(theme.spacing, '-spacing');
    if (theme.borderRadius) generateProperties(theme.borderRadius, '-border-radius');
    if (theme.shadows) generateProperties(theme.shadows, '-shadow');
    if (theme.transitions) generateProperties(theme.transitions, '-transition');

    css += '}\n';
    return css;
  },

  /**
   * Reset to default theme
   */
  reset() {
    this.applyTheme('default');
  },

  /**
   * Cleanup theme system
   */
  destroy() {
    // Remove custom properties
    this.customProperties.forEach((value, property) => {
      document.documentElement.style.removeProperty(property);
    });
    
    // Remove theme classes
    document.body.classList.remove(...Array.from(document.body.classList).filter(cls => 
      cls.startsWith('table-theme-')
    ));
    
    this.customProperties.clear();
    this.themes.clear();
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSystem;
}

if (typeof window !== 'undefined') {
  window.ThemeSystem = ThemeSystem;
}