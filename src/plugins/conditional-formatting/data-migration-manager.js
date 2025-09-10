/**
 * Data Migration Manager for Conditional Formatting
 * Handles migration of legacy rule formats to new enhanced format
 * Follows Single Responsibility Principle - only handles data migration
 */

class DataMigrationManager {
  constructor(config = null) {
    this.config = config || this.getConfig();
    this.migrationRules = this.initializeMigrationRules();
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    if (typeof window !== 'undefined' && window.ConditionalFormattingConfig) {
      return window.ConditionalFormattingConfig;
    }
    
    try {
      return require('./config');
    } catch (e) {
      console.error('Failed to load conditional formatting config:', e);
      return {};
    }
  }
  
  /**
   * Initialize migration rules from config
   */
  initializeMigrationRules() {
    const rules = this.config.formatTypeMigrationRules;
    if (!rules || typeof rules !== 'object') {
      // Fallback rules if config is not available
      return new Map([
        ['iconSet', (format) => !!format.iconSet],
        ['dataBar', (format) => !!format.dataBar],
        ['colorScale', (format) => !!format.colorScale]
      ]);
    }
    
    // Convert config object to Map for ordered iteration
    return new Map(Object.entries(rules));
  }
  
  /**
   * Main migration method - migrates a rule to the latest format
   * @param {Object} rule - The rule to migrate
   * @returns {Object} The migrated rule
   */
  migrateRule(rule) {
    if (!rule) return rule;
    
    // Create a copy to avoid mutating the original
    const migratedRule = { ...rule };
    
    // Migrate formatType if needed
    if (this.needsFormatTypeMigration(migratedRule)) {
      const detectedType = this.detectFormatType(migratedRule.format);
      if (detectedType) {
        migratedRule.formatType = detectedType;
      }
    }
    
    // Future: Add more migration logic here as needed
    // e.g., conditionType migration, operator migration, etc.
    
    return migratedRule;
  }
  
  /**
   * Check if a rule needs formatType migration
   * @param {Object} rule - The rule to check
   * @returns {boolean} True if migration is needed
   */
  needsFormatTypeMigration(rule) {
    // Rule needs migration if:
    // 1. It has formatType 'basic' but contains special format objects
    // 2. It has no formatType but has format object
    if (!rule.format) return false;
    
    if (!rule.formatType || rule.formatType === 'basic') {
      const detectedType = this.detectFormatType(rule.format);
      return detectedType !== 'basic';
    }
    
    return false;
  }
  
  /**
   * Detect format type from format object
   * @param {Object} format - The format object to analyze
   * @returns {string} The detected format type
   */
  detectFormatType(format) {
    if (!format || typeof format !== 'object') return 'basic';
    
    // Check each migration rule in order
    for (const [type, detector] of this.migrationRules) {
      if (typeof detector === 'function' && detector(format)) {
        return type;
      }
    }
    
    return 'basic';
  }
  
  /**
   * Batch migrate multiple rules
   * @param {Array} rules - Array of rules to migrate
   * @returns {Array} Array of migrated rules
   */
  migrateRules(rules) {
    if (!Array.isArray(rules)) return rules;
    return rules.map(rule => this.migrateRule(rule));
  }
  
  /**
   * Check if any rules in array need migration
   * @param {Array} rules - Array of rules to check
   * @returns {boolean} True if any rule needs migration
   */
  needsMigration(rules) {
    if (!Array.isArray(rules)) return false;
    return rules.some(rule => this.needsFormatTypeMigration(rule));
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataMigrationManager;
}

if (typeof window !== 'undefined') {
  window.DataMigrationManager = DataMigrationManager;
}