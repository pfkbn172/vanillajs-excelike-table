/**
 * Enhanced UI Manager for New Conditional Formatting Architecture
 * Provides improved UI with separated condition types and target scopes
 */

class EnhancedConditionalFormattingUIManager {
  constructor(tableInstance, pluginInstance = null) {
    this.table = tableInstance;
    this.plugin = pluginInstance; // Store plugin reference directly
    this.currentRule = null;
    this.editMode = false;
    
    // Load types and dependencies
    this.types = this.getTypes();
    this.config = this.getConfig();
    
    // Initialize data migration manager
    this.migrationManager = this.initializeMigrationManager();
    
    // Initialize UI state
    this.uiState = {
      conditionType: 'simple',
      targetScope: 'cell',
      conditions: [],
      logicalOperator: 'and'
    };
  }
  
  /**
   * Get types from global or require
   */
  getTypes() {
    if (typeof window !== 'undefined' && window.ConditionalFormattingTypes) {
      return window.ConditionalFormattingTypes;
    }
    
    try {
      return require('./types');
    } catch (e) {
      console.error('Failed to load conditional formatting types:', e);
      return {};
    }
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
   * Initialize data migration manager
   */
  initializeMigrationManager() {
    // Try to load DataMigrationManager
    if (typeof window !== 'undefined' && window.DataMigrationManager) {
      return new window.DataMigrationManager(this.config);
    }
    
    try {
      const DataMigrationManager = require('./data-migration-manager');
      return new DataMigrationManager(this.config);
    } catch (e) {
      console.error('DataMigrationManager not available:', e);
      return null;
    }
  }
  
  /**
   * Show enhanced conditional formatting dialog
   */
  showDialog(existingRule = null) {
    // Migrate rule if needed
    if (existingRule && this.migrationManager) {
      existingRule = this.migrationManager.migrateRule(existingRule);
    }
    
    this.currentRule = existingRule;
    this.editMode = !!existingRule;
    
    // Initialize UI state for existing rule
    if (existingRule) {
      this.initializeUIStateFromRule(existingRule);
    } else {
      // Reset to default for new rule
      this.uiState = {
        conditionType: 'simple',
        targetScope: 'cell',
        conditions: [{ column: '', operator: '', value: '' }], // Initialize with empty condition
        logicalOperator: 'and'
      };
    }
    
    // Handle special format types by delegating to specialized dialogs
    if (existingRule) {
      
      if (existingRule.formatType) {
        switch (existingRule.formatType) {
          case 'iconSet':
            if (!this.plugin?.contextMenuExtension?.showIconSetsDialog) {
              throw new Error('IconSet dialog not available. Check context menu extension initialization.');
            }
            this.plugin.contextMenuExtension.showIconSetsDialog(existingRule);
            return;
          
        case 'dataBar':
          if (!this.plugin?.contextMenuExtension?.showDataBarsDialog) {
            throw new Error('DataBar dialog not available. Check context menu extension initialization.');
          }
          this.plugin.contextMenuExtension.showDataBarsDialog(existingRule);
          return;
          
        case 'colorScale':
          if (!this.plugin?.contextMenuExtension?.showColorScalesDialog) {
            throw new Error('ColorScale dialog not available. Check context menu extension initialization.');
          }
          this.plugin.contextMenuExtension.showColorScalesDialog(existingRule);
          return;
          
        case 'basic':
          // Continue to enhanced basic dialog below
          break;
          
        default:
          throw new Error(`Unknown formatType: ${existingRule.formatType}. Expected: iconSet, dataBar, colorScale, or basic.`);
        }
      } else {
        // Try to detect format type from format object as last resort
        if (existingRule.format?.iconSet) {
          if (!this.plugin?.contextMenuExtension?.showIconSetsDialog) {
            throw new Error('IconSet dialog not available. Check context menu extension initialization.');
          }
          this.plugin.contextMenuExtension.showIconSetsDialog(existingRule);
          return;
        } else if (existingRule.format?.dataBar) {
          if (!this.plugin?.contextMenuExtension?.showDataBarsDialog) {
            throw new Error('DataBar dialog not available. Check context menu extension initialization.');
          }
          this.plugin.contextMenuExtension.showDataBarsDialog(existingRule);
          return;
        } else if (existingRule.format?.colorScale) {
          if (!this.plugin?.contextMenuExtension?.showColorScalesDialog) {
            throw new Error('ColorScale dialog not available. Check context menu extension initialization.');
          }
          this.plugin.contextMenuExtension.showColorScalesDialog(existingRule);
          return;
        }
      }
    }
    
    // UI state is already initialized above (line 92-102)
    // No need to reinitialize here as it would overwrite the legacy format conversion
    
    const dialog = this.createEnhancedDialog();
    document.body.appendChild(dialog);
    
    // Ensure condition details are visible immediately (synchronous)
    this.ensureConditionDetailsVisible(dialog);
    
    // Restore existing rule values to UI (synchronous)
    if (existingRule) {
      this.restoreRuleToUI(dialog, existingRule);
    }
    
    // Focus first input
    setTimeout(() => {
      const firstInput = dialog.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }, 200);
  }
  
  /**
   * Create enhanced dialog with new architecture
   */
  createEnhancedDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'cf-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.className = 'cf-modal-content enhanced-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      width: 95%;
      max-width: 700px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      box-sizing: border-box;
    `;
    
    modal.innerHTML = this.createEnhancedDialogContent();
    
    // Add enhanced modal styles
    this.addEnhancedModalStyles();
    
    overlay.appendChild(modal);
    
    // Bind events
    this.bindEnhancedDialogEvents(overlay, modal);
    
    return overlay;
  }
  
  /**
   * Add enhanced modal styles
   */
  addEnhancedModalStyles() {
    const css = `
      /* Enhanced Modal Styles */
      .cf-enhanced-dialog .cf-section {
        margin: 16px 0;
        padding: 12px;
        border: 1px solid #e8e8e8;
        border-radius: 6px;
        background: #fafafa;
      }
      
      .cf-enhanced-dialog .cf-section-title {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 15px;
        font-weight: 600;
      }
      
      .cf-enhanced-dialog .cf-form-group {
        margin-bottom: 12px;
      }
      
      .cf-enhanced-dialog .cf-form-label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #555;
        font-size: 13px;
      }
      
      .cf-enhanced-dialog .cf-form-input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
      }
      
      .cf-enhanced-dialog .cf-radio-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .cf-enhanced-dialog .cf-radio-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 8px 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .cf-enhanced-dialog .cf-radio-item:hover {
        border-color: #40a9ff;
        background: #f0f8ff;
      }
      
      .cf-enhanced-dialog .cf-radio-item input[type="radio"] {
        margin: 2px 0 0 0;
        cursor: pointer;
      }
      
      .cf-enhanced-dialog .cf-radio-item label {
        cursor: pointer;
        flex: 1;
      }
      
      .cf-enhanced-dialog .cf-radio-description {
        display: block;
        font-size: 12px;
        color: #666;
        margin-top: 4px;
        line-height: 1.4;
      }
      
      
      /* Legacy preview container - kept for backward compatibility */
      .cf-enhanced-dialog .cf-preview-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
        gap: 8px 12px;
      }
      
      .cf-enhanced-dialog .cf-preview-description {
        grid-column: 1 / -1;
        padding: 6px 10px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.3;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      
      .cf-enhanced-dialog .cf-preview-scope {
        padding: 6px 10px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.3;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      
      .cf-enhanced-dialog .cf-preview-sample {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-start;
      }
      
      /* Improved preview container - consistent with other sections */
      .cf-enhanced-dialog .cf-preview-container-improved {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-info {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-row {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        margin-bottom: 0 !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-label {
        font-weight: 500 !important;
        min-width: 100px !important;
        flex-shrink: 0 !important;
        color: #555 !important;
        font-size: 13px !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-text {
        flex: 1 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        padding: 6px 10px !important;
        border: 1px solid #d9d9d9 !important;
        border-radius: 4px !important;
        background: white !important;
        white-space: normal !important;
        min-width: 200px !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-sample {
        display: flex !important;
        align-items: center !important;
        margin-top: 12px !important;
      }
      
      .cf-enhanced-dialog .cf-preview-container-improved .cf-preview-cell {
        padding: 6px 12px !important;
        border: 1px solid #d9d9d9 !important;
        border-radius: 4px !important;
        background: white !important;
        min-width: 120px !important;
        font-size: 13px !important;
      }
      
      /* New horizontal format layout */
      .cf-enhanced-dialog .cf-basic-format-horizontal {
        display: flex;
        gap: 20px;
        align-items: flex-start;
      }
      
      .cf-enhanced-dialog .cf-format-group-colors {
        display: flex;
        gap: 16px;
        flex: 1;
      }
      
      .cf-enhanced-dialog .cf-color-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 120px;
      }
      
      .cf-enhanced-dialog .cf-color-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .cf-enhanced-dialog .cf-color-input {
        width: 50px !important;
        height: 32px !important;
        border: 1px solid #d9d9d9 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        padding: 2px !important;
      }
      
      .cf-enhanced-dialog .cf-color-value {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #666;
        padding: 4px 8px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 3px;
        min-width: 70px;
        text-align: center;
        user-select: all;
      }
      
      .cf-enhanced-dialog .cf-format-group-styles {
        flex: 1;
        min-width: 200px;
      }
      
      .cf-enhanced-dialog .cf-font-style-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 6px;
      }
      
      /* Condition Preview in condition section */
      .cf-enhanced-dialog .cf-condition-preview {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
      }
      
      .cf-enhanced-dialog .cf-condition-preview-text {
        padding: 8px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: #f8f9fa;
        font-size: 13px;
        line-height: 1.4;
        color: #495057;
        font-family: 'Courier New', monospace;
        min-height: 20px;
      }
      
      .cf-enhanced-dialog .cf-condition-preview-text.empty {
        color: #6c757d;
        font-style: italic;
        font-family: inherit;
      }
      
      .cf-enhanced-dialog .cf-condition-preview-text.warning {
        border-color: #ffc107;
        background: #fff3cd;
        color: #856404;
      }
      
      /* Format Preview in format section */
      .cf-enhanced-dialog .cf-format-preview {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
      }
      
      .cf-enhanced-dialog .cf-format-preview-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .cf-enhanced-dialog .cf-format-preview-info .cf-preview-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 0;
      }
      
      .cf-enhanced-dialog .cf-format-preview-info .cf-preview-label {
        font-weight: 500;
        min-width: 100px;
        flex-shrink: 0;
        color: #555;
        font-size: 13px;
      }
      
      .cf-enhanced-dialog .cf-format-preview-info .cf-preview-text {
        flex: 1;
        word-wrap: break-word;
        overflow-wrap: break-word;
        font-size: 13px;
        line-height: 1.4;
        padding: 6px 10px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: white;
        white-space: normal;
        min-width: 200px;
      }
      
      .cf-enhanced-dialog .cf-format-preview-sample {
        display: flex;
        align-items: center;
        margin-top: 12px;
      }
      
      .cf-enhanced-dialog .cf-format-preview-sample .cf-preview-cell {
        padding: 8px 16px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: white;
        min-width: 150px;
        font-size: 13px;
        text-align: center;
      }
      
      @media (max-width: 500px) {
        .cf-enhanced-dialog .cf-preview-container {
          grid-template-columns: 1fr;
          gap: 6px;
        }
      }
      
      .cf-enhanced-dialog .cf-preview-cell {
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        min-width: 80px;
        max-width: 150px;
        text-align: center;
        word-break: break-word;
        font-size: 13px;
      }
      
      .cf-enhanced-dialog .cf-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 0 0 0;
        border-top: 1px solid #e8e8e8;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      
      .cf-enhanced-dialog .cf-button {
        padding: 6px 14px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        min-width: 70px;
      }
      
      @media (max-width: 400px) {
        .cf-enhanced-dialog .cf-modal-actions {
          justify-content: stretch;
        }
        
        .cf-enhanced-dialog .cf-button {
          flex: 1;
          min-width: 0;
        }
      }
      
      .cf-enhanced-dialog .cf-button:hover {
        border-color: #40a9ff;
        color: #40a9ff;
      }
      
      .cf-enhanced-dialog .cf-button-primary {
        background: #1890ff;
        border-color: #1890ff;
        color: white;
      }
      
      .cf-enhanced-dialog .cf-button-primary:hover {
        background: #40a9ff;
        border-color: #40a9ff;
        color: white;
      }
      
      .cf-enhanced-dialog .cf-button-cancel:hover {
        border-color: #ff4d4f;
        color: #ff4d4f;
      }
      
      .cf-enhanced-dialog .cf-logical-operator-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      /* 条件入力行のレイアウト */
      .cf-enhanced-dialog .cf-condition-row {
        display: grid;
        grid-template-columns: 1fr 120px 1fr;
        gap: 8px;
        align-items: center;
      }
      
      @media (max-width: 600px) {
        .cf-enhanced-dialog .cf-condition-row {
          grid-template-columns: 1fr;
          gap: 6px;
        }
        
        .cf-enhanced-dialog .cf-logical-operator-grid {
          grid-template-columns: 1fr;
          gap: 6px;
        }
      }
      
      /* 書式設定エリアの改善 */
      .cf-enhanced-dialog .cf-format-tabs {
        margin-bottom: 12px;
      }
      
      .cf-enhanced-dialog .cf-tab-buttons {
        display: flex;
        gap: 4px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      
      .cf-enhanced-dialog .cf-tab-button {
        padding: 4px 12px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .cf-enhanced-dialog .cf-tab-button.active {
        background: #1890ff;
        border-color: #1890ff;
        color: white;
      }
      
      /* DataBar specific styles */
      .cf-enhanced-dialog .cf-databar-options {
        background: #f9f9f9;
        padding: 12px;
        border-radius: 6px;
        margin-top: 8px;
      }
      
      .cf-enhanced-dialog .cf-databar-method-description {
        font-size: 11px;
        color: #666;
        margin-top: 3px;
        line-height: 1.3;
      }
      
      .cf-enhanced-dialog .cf-checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 13px;
      }
      
      /* 書式タイプセレクターのレイアウト改善 */
      .cf-enhanced-dialog .cf-format-type-selector {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .cf-enhanced-dialog .cf-radio {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
      }
      
      .cf-enhanced-dialog .cf-radio:hover {
        border-color: #40a9ff;
        background: #f0f8ff;
      }
      
      .cf-enhanced-dialog .cf-radio input[type="radio"] {
        margin: 0;
        cursor: pointer;
      }
      
      .cf-enhanced-dialog .cf-checkbox input[type="checkbox"] {
        margin: 0;
        cursor: pointer;
      }
      
      .cf-enhanced-dialog .cf-color-input {
        width: 60px;
        height: 35px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        cursor: pointer;
        padding: 2px;
      }
      
      .cf-enhanced-dialog .cf-logical-item {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
      
      .cf-enhanced-dialog .cf-symbol {
        font-weight: bold;
        color: #1890ff;
        margin-left: 8px;
      }
    `;
    
    // Add CSS to page if not already added
    let styleElement = document.getElementById('cf-enhanced-modal-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'cf-enhanced-modal-styles';
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    }
  }
  
  /**
   * Create enhanced dialog content with new UI
   */
  createEnhancedDialogContent() {
    const title = this.editMode ? 'Edit Conditional Formatting Rule' : 'New Conditional Formatting Rule';
    
    return `
      <div class="cf-enhanced-dialog">
        <!-- Header -->
        <div class="cf-modal-header">
          <h2 class="cf-modal-title">${title}</h2>
          <button class="cf-modal-close" type="button">&times;</button>
        </div>
        
        <!-- Rule Name -->
        <div class="cf-form-group">
          <label class="cf-form-label">ルール名</label>
          <input type="text" class="cf-form-input" id="cf-rule-name" 
                 value="${this.currentRule?.name || ''}" placeholder="ルール名を入力">
        </div>
        
        <!-- Section 1: Condition Configuration -->
        <div class="cf-section">
          <h3 class="cf-section-title">1. 条件設定</h3>
          <div class="cf-condition-type-selector">
            ${this.createConditionTypeSelector()}
          </div>
          
          <!-- Dynamic condition details area -->
          <div id="cf-condition-details" class="cf-condition-details">
            ${this.createConditionDetailsContent()}
          </div>
          
          <!-- Condition Preview -->
          <div id="cf-condition-preview" class="cf-condition-preview">
            <label class="cf-form-label">条件プレビュー</label>
            <div class="cf-condition-preview-text" id="cf-condition-preview-text">
              条件を設定してください
            </div>
          </div>
        </div>
        
        <!-- Section 2: Target Scope Configuration -->
        <div class="cf-section">
          <h3 class="cf-section-title">2. 適用範囲</h3>
          <div class="cf-target-scope-selector">
            ${this.createTargetScopeSelector()}
          </div>
        </div>
        
        <!-- Section 3: Format Configuration -->
        <div class="cf-section">
          <h3 class="cf-section-title">3. 書式設定</h3>
          <div class="cf-format-selector">
            ${this.createFormatSelector()}
          </div>
          
          <!-- Format Preview -->
          <div id="cf-format-preview" class="cf-format-preview">
            <label class="cf-form-label">書式プレビュー</label>
            <div class="cf-format-preview-container">
              ${this.createFormatPreviewContent()}
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="cf-modal-actions">
          <button type="button" class="cf-button cf-button-cancel">キャンセル</button>
          <button type="button" class="cf-button cf-button-primary" id="cf-save-rule">
            ${this.editMode ? '更新' : '作成'}
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Create condition type selector (radio buttons)
   */
  createConditionTypeSelector() {
    const types = this.types.CONDITION_TYPES;
    const currentType = this.uiState.conditionType;
    
    
    return `
      <div class="cf-radio-group">
        <div class="cf-radio-item">
          <input type="radio" id="cf-type-simple" name="cf-condition-type" 
                 value="simple" ${currentType === 'simple' ? 'checked' : ''}>
          <label for="cf-type-simple">
            <strong>単一条件</strong>
            <span class="cf-radio-description">1つの条件で書式を適用（例：売上 > 10000）</span>
          </label>
        </div>
        <div class="cf-radio-item">
          <input type="radio" id="cf-type-combined" name="cf-condition-type" 
                 value="combined" ${currentType === 'combined' ? 'checked' : ''}>
          <label for="cf-type-combined">
            <strong>複数条件の組み合わせ</strong>
            <span class="cf-radio-description">論理演算子で条件を組み合わせ（例：売上 > 10000 AND ステータス = "完了"）</span>
          </label>
        </div>
        <div class="cf-radio-item">
          <input type="radio" id="cf-type-formula" name="cf-condition-type" 
                 value="formula" ${currentType === 'formula' ? 'checked' : ''}>
          <label for="cf-type-formula">
            <strong>カスタム数式</strong>
            <span class="cf-radio-description">独自の数式で複雑な条件を設定（例：(売上 - 原価) / 売上 > 0.3）</span>
          </label>
        </div>
      </div>
    `;
  }
  
  /**
   * Create target scope selector
   */
  createTargetScopeSelector() {
    const scopes = this.types.TARGET_SCOPES || {};
    const currentScope = this.uiState.targetScope;
    
    return `
      <div class="cf-radio-group">
        <div class="cf-radio-item">
          <input type="radio" id="cf-scope-cell" name="cf-target-scope" 
                 value="cell" ${currentScope === 'cell' ? 'checked' : ''}>
          <label for="cf-scope-cell">
            <strong>条件に一致したセルのみ</strong>
            <span class="cf-radio-description">条件を満たしたセルだけに書式を適用</span>
          </label>
        </div>
        <div class="cf-radio-item">
          <input type="radio" id="cf-scope-row" name="cf-target-scope" 
                 value="row" ${currentScope === 'row' ? 'checked' : ''}>
          <label for="cf-scope-row">
            <strong>条件に一致した行全体</strong>
            <span class="cf-radio-description">条件を満たした行全体に書式を適用</span>
          </label>
        </div>
      </div>
    `;
  }
  
  /**
   * Create condition details content based on type
   */
  createConditionDetailsContent() {
    // Ensure we have at least one condition for simple type
    if (this.uiState.conditionType === 'simple' && (!this.uiState.conditions || this.uiState.conditions.length === 0)) {
      this.uiState.conditions = [{ column: '', operator: '', value: '' }];
    }
    
    switch (this.uiState.conditionType) {
      case 'simple':
        return this.createSimpleConditionUI();
      case 'combined':
        return this.createCombinedConditionUI();
      case 'formula':
        return this.createFormulaConditionUI();
      default:
        return '<p>条件タイプを選択してください</p>';
    }
  }
  
  /**
   * Create simple condition UI with dynamic value fields
   */
  createSimpleConditionUI() {
    const condition = this.uiState.conditions[0] || {};
    const columns = this.table.options.columns || [];
    
    return `
      <div class="cf-simple-condition">
        <div class="cf-condition-row">
          <select class="cf-form-input" id="cf-simple-column" data-index="0">
            <option value="">列を選択</option>
            ${columns.map(col => `
              <option value="${col.key}" ${condition.column === col.key ? 'selected' : ''}>
                ${col.title}
              </option>
            `).join('')}
          </select>
          
          <select class="cf-form-input" id="cf-simple-operator" data-index="0">
            <option value="">演算子を選択</option>
            ${Object.entries(this.types.OPERATORS || {}).map(([key, value]) => `
              <option value="${value}" ${condition.operator === value ? 'selected' : ''}>
                ${this.getOperatorLabel(key)}
              </option>
            `).join('')}
          </select>
          
          <div class="cf-simple-values" id="cf-simple-values">
            ${this.createSimpleValueInputFields(condition)}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create value input fields for simple condition based on operator
   */
  createSimpleValueInputFields(condition) {
    const valueCount = this.getValueInputCount(condition.operator);
    
    if (valueCount === 0) {
      return ''; // 値入力不要
    }
    
    let html = '';
    
    // 1つ目の値
    if (valueCount >= 1) {
      html += `
        <input type="text" class="cf-form-input" id="cf-simple-value" 
               data-index="0" data-value-index="0"
               placeholder="値を入力" value="${condition.value || ''}">
      `;
    }
    
    // 2つ目の値（BETWEEN/NOT_BETWEEN用）
    if (valueCount >= 2) {
      html += `
        <span class="cf-range-separator">～</span>
        <input type="text" class="cf-form-input" id="cf-simple-value2" 
               data-index="0" data-value-index="1"
               placeholder="最大値" value="${condition.value2 || ''}">
      `;
    }
    
    return html;
  }
  
  /**
   * Create combined conditions UI
   */
  createCombinedConditionUI() {
    return `
      <div class="cf-combined-conditions">
        <!-- Existing conditions -->
        <div id="cf-conditions-list">
          ${this.createConditionsList()}
        </div>
        
        <!-- Logical operator selector -->
        <div class="cf-logical-operator">
          <label class="cf-form-label">条件の組み合わせ方法</label>
          ${this.createLogicalOperatorSelector()}
        </div>
        
        <!-- Add condition button -->
        <button type="button" class="cf-button cf-button-secondary" id="cf-add-condition">
          + 条件を追加
        </button>
      </div>
    `;
  }
  
  /**
   * Create logical operator selector
   */
  createLogicalOperatorSelector() {
    const operators = this.types.LOGICAL_OPERATORS || {};
    const current = this.uiState.logicalOperator;
    
    return `
      <div class="cf-logical-operator-grid">
        ${Object.entries(operators).map(([key, op]) => `
          <div class="cf-radio-item cf-logical-item">
            <input type="radio" id="cf-op-${op.value}" name="cf-logical-operator" 
                   value="${op.value}" ${current === op.value ? 'checked' : ''}>
            <label for="cf-op-${op.value}">
              <strong>${op.label} <span class="cf-symbol">${op.symbol}</span></strong>
              <span class="cf-radio-description">${op.description}</span>
            </label>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  /**
   * Create conditions list
   */
  createConditionsList() {
    if (this.uiState.conditions.length === 0) {
      return '<p class="cf-empty-state">条件を追加してください</p>';
    }
    
    return this.uiState.conditions.map((condition, index) => 
      this.createConditionItem(condition, index)
    ).join('');
  }
  
  /**
   * Get the number of value inputs required for an operator
   */
  getValueInputCount(operator) {
    const { OPERATORS } = this.types;
    
    // 値不要（0個）の演算子
    const noValueOperators = [
      OPERATORS.IS_EMPTY,
      OPERATORS.IS_NOT_EMPTY,
      OPERATORS.IS_NUMBER,
      OPERATORS.IS_DATE
    ];
    
    // 値2個必要な演算子
    const twoValueOperators = [
      OPERATORS.BETWEEN,
      OPERATORS.NOT_BETWEEN
    ];
    
    if (noValueOperators.includes(operator)) {
      return 0;
    } else if (twoValueOperators.includes(operator)) {
      return 2;
    } else {
      return 1; // 残りの演算子は値1個
    }
  }
  
  /**
   * Create value input fields based on operator
   */
  createValueInputFields(condition, index) {
    const valueCount = this.getValueInputCount(condition.operator);
    
    if (valueCount === 0) {
      return ''; // 値入力不要
    }
    
    let html = '';
    
    // 1つ目の値
    if (valueCount >= 1) {
      html += `
        <input type="text" class="cf-form-input cf-condition-value" 
               data-index="${index}" data-value-index="0"
               placeholder="値を入力" value="${condition.value || ''}">
      `;
    }
    
    // 2つ目の値（BETWEEN/NOT_BETWEEN用）
    if (valueCount >= 2) {
      html += `
        <span class="cf-range-separator">～</span>
        <input type="text" class="cf-form-input cf-condition-value2" 
               data-index="${index}" data-value-index="1"
               placeholder="最大値" value="${condition.value2 || ''}">
      `;
    }
    
    return html;
  }
  
  /**
   * Create individual condition item
   */
  createConditionItem(condition, index) {
    const columns = this.table.options.columns || [];
    
    return `
      <div class="cf-condition-item" data-index="${index}">
        <div class="cf-condition-row">
          <span class="cf-condition-number">${index + 1}</span>
          
          <select class="cf-form-input cf-condition-column" data-index="${index}">
            <option value="">列を選択</option>
            ${columns.map(col => `
              <option value="${col.key}" ${condition.column === col.key ? 'selected' : ''}>
                ${col.title}
              </option>
            `).join('')}
          </select>
          
          <select class="cf-form-input cf-condition-operator" data-index="${index}">
            <option value="">演算子を選択</option>
            ${Object.entries(this.types.OPERATORS || {}).map(([key, value]) => `
              <option value="${value}" ${condition.operator === value ? 'selected' : ''}>
                ${this.getOperatorLabel(key)}
              </option>
            `).join('')}
          </select>
          
          <div class="cf-condition-values" data-index="${index}">
            ${this.createValueInputFields(condition, index)}
          </div>
          
          <button type="button" class="cf-button cf-button-danger cf-remove-condition" 
                  data-index="${index}">削除</button>
        </div>
      </div>
    `;
  }
  
  /**
   * Create formula condition UI
   */
  createFormulaConditionUI() {
    const formula = this.uiState.conditions[0]?.formula || '';
    
    return `
      <div class="cf-formula-condition">
        <label class="cf-form-label">数式を入力</label>
        <textarea class="cf-form-input cf-formula-input" id="cf-formula-input" 
                  placeholder="例: (sales - cost) / sales > 0.3" rows="3">${formula}</textarea>
        <div class="cf-formula-help">
          <p><strong>使用可能な列:</strong> ${(this.table.options.columns || []).map(col => col.key).join(', ')}</p>
          <p><strong>使用可能な関数:</strong> TODAY(), MAX(), MIN(), AVERAGE(), SUM()</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Create format selector - simplified to only show basic formatting
   */
  createFormatSelector() {
    return `
      <div class="cf-format-basic-only">
        ${this.createBasicFormatSelector()}
      </div>
    `;
  }
  
  /**
   * Create basic format selector - improved horizontal layout
   */
  createBasicFormatSelector() {
    const format = this.currentRule?.format || {};
    
    return `
      <div class="cf-basic-format-horizontal">
        <div class="cf-format-group-colors">
          <div class="cf-color-group">
            <label class="cf-form-label">背景色</label>
            <div class="cf-color-control">
              <input type="color" class="cf-color-input" id="cf-bg-color" 
                     value="${format.backgroundColor || '#ffffff'}">
              <span class="cf-color-value" id="cf-bg-color-value">${format.backgroundColor || '#ffffff'}</span>
            </div>
          </div>
          
          <div class="cf-color-group">
            <label class="cf-form-label">文字色</label>
            <div class="cf-color-control">
              <input type="color" class="cf-color-input" id="cf-text-color" 
                     value="${format.color || '#000000'}">
              <span class="cf-color-value" id="cf-text-color-value">${format.color || '#000000'}</span>
            </div>
          </div>
        </div>
        
        <div class="cf-format-group-styles">
          <label class="cf-form-label">フォントスタイル</label>
          <div class="cf-font-style-options">
            <label class="cf-checkbox">
              <input type="checkbox" id="cf-bold" ${format.fontWeight === 'bold' ? 'checked' : ''}>
              <strong>太字</strong>
            </label>
            <label class="cf-checkbox">
              <input type="checkbox" id="cf-italic" ${format.fontStyle === 'italic' ? 'checked' : ''}>
              <em>斜体</em>
            </label>
            <label class="cf-checkbox">
              <input type="checkbox" id="cf-underline" ${format.textDecoration?.includes('underline') ? 'checked' : ''}>
              <u>下線</u>
            </label>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create advanced format selector (DEPRECATED - removed from basic rule creation)
   * Advanced formatting types (Icon sets, data bars, color scales) now have dedicated entry points
   */
  createAdvancedFormatSelector() {
    // This method is deprecated in the new design
    // Advanced format types should be accessed through separate menu items
    return `
      <div class="cf-advanced-format-deprecated">
        <p class="cf-info-message">
          高度な書式設定（アイコンセット、データバー、カラースケール）は、
          メインメニューから直接アクセスしてください。
        </p>
      </div>
    `;
  }
  
  /**
   * Create format preview content for format section
   */
  createFormatPreviewContent(modal = null) {
    const rule = this.buildRuleFromUI(modal);
    
    return `
      <div class="cf-format-preview-horizontal">
        <div class="cf-preview-sample-inline" style="${this.formatStylePreview(rule)}">
          サンプルテキスト
        </div>
      </div>
    `;
  }
  
  /**
   * Bind events to enhanced dialog
   */
  bindEnhancedDialogEvents(overlay, modal) {
    // Close dialog
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeDialog(overlay);
    });
    
    modal.querySelector('.cf-modal-close').addEventListener('click', () => {
      this.closeDialog(overlay);
    });
    
    // Condition type change
    modal.addEventListener('change', (e) => {
      if (e.target.name === 'cf-condition-type') {
        this.uiState.conditionType = e.target.value;
        
        // Initialize conditions based on type
        if (e.target.value === 'simple') {
          // Initialize single condition for simple type
          this.uiState.conditions = [{ column: '', operator: '', value: '', value2: '' }];
        } else if (e.target.value === 'combined') {
          if (!this.uiState.conditions || this.uiState.conditions.length === 0) {
            this.uiState.conditions = [
              { column: '', operator: '', value: '' },
              { column: '', operator: '', value: '' }
            ];
          }
          // Ensure we have logical operator set
          if (!this.uiState.logicalOperator) {
            this.uiState.logicalOperator = 'and';
          }
        } else if (e.target.value === 'formula') {
          // Initialize formula condition
          this.uiState.conditions = [{ formula: '' }];
        }
        
        this.updateConditionDetails(modal);
        this.updateConditionPreview(modal);
        this.updatePreview(modal);
      }
      
      if (e.target.name === 'cf-target-scope') {
        this.uiState.targetScope = e.target.value;
        this.updatePreview(modal);
      }
      
      if (e.target.name === 'cf-logical-operator') {
        this.uiState.logicalOperator = e.target.value;
        this.updatePreview(modal);
      }
      
      // Handle condition field changes (column, operator, values)
      if (e.target.classList.contains('cf-condition-column') || 
          e.target.classList.contains('cf-condition-operator')) {
        const index = parseInt(e.target.dataset.index);
        this.updateConditionField(e.target, index, modal);
        
        // If operator changed, update value fields
        if (e.target.classList.contains('cf-condition-operator')) {
          this.updateValueFields(index, modal);
        }
        
        this.updateConditionPreview(modal);
        this.updatePreview(modal);
      }
      
      // Handle format type changes for advanced options
      if (e.target.name === 'cf-format-type') {
        this.updateAdvancedOptions(modal, e.target.value);
        this.updatePreview(modal);
      }
      
      // Handle DataBar method changes
      if (e.target.name === 'cf-databar-method') {
        this.updateDataBarMethodOptions(modal, e.target.value);
        this.updatePreview(modal);
      }
    });
    
    // Add condition button
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'cf-add-condition') {
        this.addCondition(modal);
      }
      
      if (e.target.classList.contains('cf-remove-condition')) {
        const index = parseInt(e.target.dataset.index);
        this.removeCondition(index, modal);
      }
      
      if (e.target.id === 'cf-save-rule') {
        this.saveRule(modal, overlay);
      }
      
      if (e.target.classList.contains('cf-button-cancel')) {
        this.closeDialog(overlay);
      }
      
    });
    
    // Real-time preview updates
    modal.addEventListener('input', (e) => {
      if (e.target.matches('.cf-form-input, .cf-color-input, input[type="checkbox"]')) {
        // Update color value display for color inputs
        if (e.target.matches('.cf-color-input')) {
          const colorValueId = e.target.id + '-value';
          const colorValueElement = modal.querySelector(`#${colorValueId}`);
          if (colorValueElement) {
            colorValueElement.textContent = e.target.value.toUpperCase();
          }
        }
        
        // Handle condition value inputs
        if (e.target.classList.contains('cf-condition-value') || 
            e.target.classList.contains('cf-condition-value2') ||
            e.target.id === 'cf-simple-value' || e.target.id === 'cf-simple-value2') {
          
          // Handle simple condition value changes
          if (e.target.id === 'cf-simple-value' || e.target.id === 'cf-simple-value2') {
            const valueIndex = e.target.id === 'cf-simple-value' ? 0 : 1;
            this.updateSimpleConditionValue(valueIndex, e.target.value, modal);
          } else {
            // Handle combined condition value changes
            const index = parseInt(e.target.dataset.index);
            const valueIndex = parseInt(e.target.dataset.valueIndex);
            this.updateConditionValue(index, valueIndex, e.target.value, modal);
          }
          
          this.updateConditionPreview(modal);
        }
        
        // Update condition preview and state for simple condition inputs
        if (e.target.matches('#cf-simple-column, #cf-simple-operator, #cf-simple-value, #cf-simple-value2, #cf-formula-input')) {
          // Update uiState for simple conditions
          if (this.uiState.conditionType === 'simple') {
            this.updateSimpleConditionState(modal);
          }
          this.updateConditionPreview(modal);
        }
        
        this.updatePreview(modal);
      }
    });
    
    // Handle checkbox changes for font styles
    modal.addEventListener('change', (e) => {
      if (e.target.matches('#cf-bold, #cf-italic, #cf-underline')) {
        this.updatePreview(modal);
      }
    }, true);
  }
  
  /**
   * Update condition preview text
   */
  updateConditionPreview(modal) {
    const previewElement = modal.querySelector('#cf-condition-preview-text');
    if (!previewElement) {
      console.warn('Preview element not found');
      return;
    }
    
    const rule = this.buildRuleFromUI(modal);
    const conditionText = this.formatConditionDescription(rule);
    
    previewElement.textContent = conditionText;
    
    // Add/remove empty class for styling
    if (conditionText === '条件を設定してください') {
      previewElement.classList.add('empty');
    } else {
      previewElement.classList.remove('empty');
    }
  }
  
  /**
   * Update simple condition state from UI inputs
   */
  updateSimpleConditionState(modal) {
    const columnSelect = modal.querySelector('#cf-simple-column');
    const operatorSelect = modal.querySelector('#cf-simple-operator');
    const valueInput = modal.querySelector('#cf-simple-value');
    const value2Input = modal.querySelector('#cf-simple-value2');
    
    // Ensure we have at least one condition in the array
    if (!this.uiState.conditions || this.uiState.conditions.length === 0) {
      this.uiState.conditions = [{ column: '', operator: '', value: '', value2: '' }];
    }
    
    // Update the first (and only) condition for simple type
    const condition = this.uiState.conditions[0];
    if (columnSelect) condition.column = columnSelect.value || '';
    if (operatorSelect) condition.operator = operatorSelect.value || '';
    if (valueInput) condition.value = valueInput.value || '';
    if (value2Input) condition.value2 = value2Input.value || '';
  }
  
  /**
   * Update simple condition value in state
   */
  updateSimpleConditionValue(valueIndex, value, modal) {
    // Ensure we have at least one condition in the array
    if (!this.uiState.conditions || this.uiState.conditions.length === 0) {
      this.uiState.conditions = [{ column: '', operator: '', value: '', value2: '' }];
    }
    
    const condition = this.uiState.conditions[0];
    if (valueIndex === 0) {
      condition.value = value || '';
    } else if (valueIndex === 1) {
      condition.value2 = value || '';
    }
  }
  
  /**
   * Update condition field value in state
   */
  updateConditionField(element, index, modal) {
    if (!this.uiState.conditions[index]) {
      return;
    }
    
    if (element.classList.contains('cf-condition-column')) {
      this.uiState.conditions[index].column = element.value;
    } else if (element.classList.contains('cf-condition-operator')) {
      this.uiState.conditions[index].operator = element.value;
    }
  }
  
  /**
   * Update value fields when operator changes
   */
  updateValueFields(index, modal) {
    const condition = this.uiState.conditions[index];
    if (!condition) {
      return;
    }
    
    const valuesContainer = modal.querySelector(`.cf-condition-values[data-index="${index}"]`);
    if (!valuesContainer) {
      return;
    }
    
    // Regenerate value input fields based on new operator
    valuesContainer.innerHTML = this.createValueInputFields(condition, index);
  }
  
  /**
   * Update simple condition field value in state
   */
  updateSimpleConditionField(element, modal) {
    if (!this.uiState.conditions[0]) {
      this.uiState.conditions[0] = { column: '', operator: '', value: '', value2: '' };
    }
    
    if (element.id === 'cf-simple-column') {
      this.uiState.conditions[0].column = element.value;
    } else if (element.id === 'cf-simple-operator') {
      this.uiState.conditions[0].operator = element.value;
    }
  }
  
  /**
   * Update simple condition value fields when operator changes
   */
  updateSimpleValueFields(modal) {
    const condition = this.uiState.conditions[0];
    if (!condition) {
      return;
    }
    
    const valuesContainer = modal.querySelector('#cf-simple-values');
    if (!valuesContainer) {
      return;
    }
    
    // Regenerate value input fields based on new operator
    valuesContainer.innerHTML = this.createSimpleValueInputFields(condition);
  }
  
  /**
   * Update simple condition value in state
   */
  updateSimpleConditionValue(valueIndex, value, modal) {
    if (!this.uiState.conditions[0]) {
      this.uiState.conditions[0] = { column: '', operator: '', value: '', value2: '' };
    }
    
    if (valueIndex === 0) {
      this.uiState.conditions[0].value = value;
    } else if (valueIndex === 1) {
      this.uiState.conditions[0].value2 = value;
    }
  }
  
  /**
   * Update condition value in state
   */
  updateConditionValue(index, valueIndex, value, modal) {
    if (!this.uiState.conditions[index]) {
      return;
    }
    
    if (valueIndex === 0) {
      this.uiState.conditions[index].value = value;
    } else if (valueIndex === 1) {
      this.uiState.conditions[index].value2 = value;
    }
  }
  
  /**
   * Update condition details when type changes
   */
  updateConditionDetails(modal) {
    
    const detailsContainer = modal.querySelector('#cf-condition-details');
    if (!detailsContainer) {
      console.error('❌ [updateConditionDetails] #cf-condition-details container not found');
      return;
    }
    
    
    const content = this.createConditionDetailsContent();
    
    detailsContainer.innerHTML = content;
    
    // Verify elements were created
    const createdElements = detailsContainer.querySelectorAll('input, select, textarea');
  }
  
  /**
   * Update advanced options based on format type selection
   */
  updateAdvancedOptions(modal, formatType) {
    const optionsContainer = modal.querySelector('#cf-advanced-options');
    
    switch (formatType) {
      case 'data-bar':
        optionsContainer.innerHTML = this.createDataBarOptions();
        // Set up DataBar method change handler after DOM is updated
        setTimeout(() => {
          const methodSelect = modal.querySelector('select[name="cf-databar-method"]');
          if (methodSelect) {
            this.updateDataBarMethodOptions(modal, methodSelect.value);
          }
        }, 0);
        break;
      case 'icon-set':
        optionsContainer.innerHTML = this.createIconSetOptions();
        break;
      case 'color-scale':
        optionsContainer.innerHTML = this.createColorScaleOptions();
        break;
      default:
        optionsContainer.innerHTML = '';
    }
  }
  
  /**
   * Update DataBar method specific options visibility
   */
  updateDataBarMethodOptions(modal, method) {
    const percentileOptions = modal.querySelector('#cf-databar-percentile-options');
    const customOptions = modal.querySelector('#cf-databar-custom-options');
    
    // Hide all method-specific options first
    if (percentileOptions) percentileOptions.style.display = 'none';
    if (customOptions) customOptions.style.display = 'none';
    
    // Show relevant options based on selected method
    switch (method) {
      case 'percentile':
        if (percentileOptions) percentileOptions.style.display = 'block';
        break;
      case 'custom':
        if (customOptions) customOptions.style.display = 'block';
        break;
      // minMax and zeroToMax don't need additional options
    }
  }
  
  /**
   * Create DataBar specific options including scale selection
   */
  createDataBarOptions() {
    const dataBarMethods = this.types.DATA_BAR_METHODS || {};
    
    return `
      <div class="cf-databar-options">
        <div class="cf-form-group">
          <label class="cf-form-label">計算方式</label>
          <select name="cf-databar-method" class="cf-form-input">
            ${Object.values(dataBarMethods).map(method => 
              `<option value="${method.value}">${method.label}</option>`
            ).join('')}
          </select>
          <div class="cf-databar-method-description">
            データバーの長さ計算に使用する方式を選択してください
          </div>
        </div>
        
        <div class="cf-form-group">
          <label class="cf-form-label">バーの色</label>
          <input type="color" name="cf-databar-color" class="cf-color-input" value="#4285f4">
        </div>
        
        <div class="cf-form-group">
          <label class="cf-checkbox">
            <input type="checkbox" name="cf-databar-show-value" checked>
            <span>値を表示</span>
          </label>
        </div>
        
        <div class="cf-form-group">
          <label class="cf-checkbox">
            <input type="checkbox" name="cf-databar-gradient">
            <span>グラデーション効果</span>
          </label>
        </div>
        
        <div id="cf-databar-percentile-options" class="cf-form-group" style="display: none;">
          <label class="cf-form-label">パーセンタイル範囲</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" name="cf-databar-lower-percentile" class="cf-form-input" 
                   value="10" min="0" max="100" style="width: 80px;">
            <span>% ～ </span>
            <input type="number" name="cf-databar-upper-percentile" class="cf-form-input" 
                   value="90" min="0" max="100" style="width: 80px;">
            <span>%</span>
          </div>
        </div>
        
        <div id="cf-databar-custom-options" class="cf-form-group" style="display: none;">
          <label class="cf-form-label">カスタム範囲</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" name="cf-databar-custom-min" class="cf-form-input" 
                   placeholder="最小値" style="width: 100px;">
            <span>～</span>
            <input type="number" name="cf-databar-custom-max" class="cf-form-input" 
                   placeholder="最大値" style="width: 100px;">
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create placeholder for icon set options
   */
  createIconSetOptions() {
    return `
      <div class="cf-iconset-options">
        <div class="cf-form-group">
          <label class="cf-form-label">アイコンセット</label>
          <select name="cf-iconset-type" class="cf-form-input">
            <option value="traffic-lights">信号機</option>
            <option value="arrows">矢印</option>
            <option value="symbols">記号</option>
          </select>
        </div>
      </div>
    `;
  }
  
  /**
   * Create placeholder for color scale options
   */
  createColorScaleOptions() {
    return `
      <div class="cf-colorscale-options">
        <div class="cf-form-group">
          <label class="cf-form-label">カラースケール</label>
          <select name="cf-colorscale-type" class="cf-form-input">
            <option value="red-yellow-green">赤-黄-緑</option>
            <option value="red-white-blue">赤-白-青</option>
            <option value="blue-white-red">青-白-赤</option>
          </select>
        </div>
      </div>
    `;
  }
  
  /**
   * Update preview section
   */
  updatePreview(modal) {
    // 書式プレビューコンテナを探す
    let previewContainer = modal.querySelector('.cf-format-preview-container');
    
    if (!previewContainer) {
      return;
    }
    
    const rule = this.buildRuleFromUI(modal);
    
    // 書式プレビューコンテナの内容を更新
    previewContainer.innerHTML = this.createFormatPreviewContent(modal);
    
    // サンプルテキストにリアルタイムで書式を適用
    this.updateSampleTextStyle(modal, rule);
  }
  
  /**
   * Update sample text style in real-time
   */
  updateSampleTextStyle(modal, rule) {
    const sampleElement = modal.querySelector('.cf-preview-sample-inline');
    if (!sampleElement) {
      return;
    }
    
    // 基本書式を適用
    const styleString = this.formatStylePreview(rule);
    sampleElement.setAttribute('style', styleString);
    
    // 高度な書式タイプに応じた処理（必要に応じて）
    if (rule && rule.format) {
      if (rule.format.iconSet) {
        this.applyIconSetToSample(sampleElement, rule);
      } else if (rule.format.dataBar) {
        this.applyDataBarToSample(sampleElement, rule);
      }
    }
  }
  
  /**
   * Apply icon set format to sample element
   */
  applyIconSetToSample(sampleElement, rule) {
    // アイコンセットのサンプル表示
    sampleElement.innerHTML = '★ サンプルテキスト';
  }
  
  /**
   * Apply data bar format to sample element
   */
  applyDataBarToSample(sampleElement, rule) {
    // データバーのサンプル表示
    const color = rule.format.dataBar?.color || '#4285f4';
    sampleElement.style.background = `linear-gradient(to right, ${color}33 0%, ${color}33 70%, transparent 70%)`;
  }
  
  /**
   * Add new condition to combined conditions
   */
  addCondition(modal) {
    this.uiState.conditions.push({
      column: '',
      operator: '',
      value: ''
    });
    
    const conditionsList = modal.querySelector('#cf-conditions-list');
    conditionsList.innerHTML = this.createConditionsList();
    this.updatePreview(modal);
  }
  
  /**
   * Remove condition from combined conditions
   */
  removeCondition(index, modal) {
    this.uiState.conditions.splice(index, 1);
    
    const conditionsList = modal.querySelector('#cf-conditions-list');
    conditionsList.innerHTML = this.createConditionsList();
    this.updatePreview(modal);
  }
  
  /**
   * Build rule object from current UI state
   */
  buildRuleFromUI(modal) {
    // Use enhanced conditionType consistently (no mapping to legacy)
    const conditionType = this.uiState.conditionType;
    
    const rule = {
      id: this.currentRule?.id || 'rule_' + Date.now(),
      name: '',
      conditionType: conditionType,
      targetScope: this.uiState.targetScope,
      conditions: this.uiState.conditions || [],
      logicalOperator: this.uiState.logicalOperator,
      format: {},
      priority: 1,
      enabled: true
    };

    // Get form data if modal is provided
    if (modal) {
      // Rule name
      const nameInput = modal.querySelector('#cf-rule-name');
      if (nameInput) {
        rule.name = nameInput.value || 'Untitled Rule';
      }

      // Format settings
      const bgColorInput = modal.querySelector('#cf-bg-color');
      const textColorInput = modal.querySelector('#cf-text-color');
      const boldInput = modal.querySelector('#cf-bold');
      const italicInput = modal.querySelector('#cf-italic');
      const underlineInput = modal.querySelector('#cf-underline');

      if (bgColorInput) {
        rule.format.backgroundColor = bgColorInput.value;
      }
      if (textColorInput) {
        rule.format.color = textColorInput.value;
      }
      if (boldInput) {
        rule.format.fontWeight = boldInput.checked ? 'bold' : 'normal';
      }
      if (italicInput) {
        rule.format.fontStyle = italicInput.checked ? 'italic' : 'normal';
      }
      if (underlineInput) {
        rule.format.textDecoration = underlineInput.checked ? 'underline' : 'none';
      }

      // Handle advanced format types (DataBar, Icon Sets, Color Scales)
      const formatTypeInput = modal.querySelector('input[name="cf-format-type"]:checked');
      if (formatTypeInput) {
        switch (formatTypeInput.value) {
          case 'data-bar':
            rule.formatType = 'dataBar';
            this.extractDataBarFormat(modal, rule);
            break;
          case 'icon-set':
            rule.formatType = 'iconSet';
            this.extractIconSetFormat(modal, rule);
            break;
          case 'color-scale':
            rule.formatType = 'colorScale';
            this.extractColorScaleFormat(modal, rule);
            break;
          default:
            rule.formatType = 'basic';
            break;
        }
      } else {
        // Default to basic formatting
        rule.formatType = 'basic';
      }

      // Collect conditions based on type
      if (rule.conditionType === 'simple') {
        // Always prioritize current UI values for immediate feedback
        const columnSelect = modal?.querySelector('#cf-simple-column');
        const operatorSelect = modal?.querySelector('#cf-simple-operator');
        const valueInput = modal?.querySelector('#cf-simple-value');
        const value2Input = modal?.querySelector('#cf-simple-value2');
        
        const column = columnSelect?.value || '';
        const operator = operatorSelect?.value || '';
        const value = valueInput?.value || '';
        const value2 = value2Input?.value || '';
        
        // Always create condition object, even if partially empty (for preview)
        rule.conditions = [{ column, operator, value, value2 }];
        if (column) {
          rule.targetColumns = [column];
        }
      } else if (rule.conditionType === 'combined') {
        // 統一された条件配列を設定
        rule.conditions = this.uiState.conditions || [];
        rule.targetColumns = [...new Set((this.uiState.conditions || []).map(c => c.column).filter(c => c))];
        
        // Get logical operator from UI
        const logicalOperatorInput = modal?.querySelector('input[name="cf-logical-operator"]:checked');
        if (logicalOperatorInput) {
          rule.logicalOperator = logicalOperatorInput.value;
        } else {
          // Fallback to uiState
          rule.logicalOperator = this.uiState.logicalOperator || 'and';
        }
        
      } else if (rule.conditionType === 'formula') {
        const formula = modal?.querySelector('#cf-formula-input')?.value;
        if (formula && formula.trim()) {
          rule.conditions = [{ formula: formula.trim() }];
          rule.targetColumns = this.extractColumnsFromFormula(formula);
        }
      }
      
      // Ensure we have target columns
      if (!rule.targetColumns || rule.targetColumns.length === 0) {
        const firstCondition = rule.conditions?.[0];
        if (firstCondition?.column) {
          rule.targetColumns = [firstCondition.column];
        } else {
          // Default to first column if available
          const firstColumn = this.table.options?.columns?.[0]?.key;
          if (firstColumn) {
            rule.targetColumns = [firstColumn];
          }
        }
      }
    }

    return rule;
  }
  
  /**
   * Extract DataBar format settings from UI
   */
  extractDataBarFormat(modal, rule) {
    const methodInput = modal.querySelector('select[name="cf-databar-method"]');
    const colorInput = modal.querySelector('input[name="cf-databar-color"]');
    const showValueInput = modal.querySelector('input[name="cf-databar-show-value"]');
    const gradientInput = modal.querySelector('input[name="cf-databar-gradient"]');
    
    rule.format.type = 'dataBar';
    rule.format.calculationMethod = methodInput?.value || 'minMax';
    rule.format.color = colorInput?.value || '#4285f4';
    rule.format.showValue = showValueInput?.checked !== false;
    rule.format.gradientFill = gradientInput?.checked || false;
    
    // Handle method-specific options
    if (rule.format.calculationMethod === 'percentile') {
      const lowerInput = modal.querySelector('input[name="cf-databar-lower-percentile"]');
      const upperInput = modal.querySelector('input[name="cf-databar-upper-percentile"]');
      rule.format.lowerPercentile = parseInt(lowerInput?.value) || 10;
      rule.format.upperPercentile = parseInt(upperInput?.value) || 90;
    } else if (rule.format.calculationMethod === 'custom') {
      const minInput = modal.querySelector('input[name="cf-databar-custom-min"]');
      const maxInput = modal.querySelector('input[name="cf-databar-custom-max"]');
      if (minInput?.value) rule.format.customMin = parseFloat(minInput.value);
      if (maxInput?.value) rule.format.customMax = parseFloat(maxInput.value);
    }
  }
  
  /**
   * Extract Icon Set format settings from UI
   */
  extractIconSetFormat(modal, rule) {
    const typeInput = modal.querySelector('select[name="cf-iconset-type"]');
    rule.format.type = 'iconSet';
    rule.format.iconSetType = typeInput?.value || 'traffic-lights';
  }
  
  /**
   * Extract Color Scale format settings from UI
   */
  extractColorScaleFormat(modal, rule) {
    const typeInput = modal.querySelector('select[name="cf-colorscale-type"]');
    rule.format.type = 'colorScale';
    rule.format.colorScaleType = typeInput?.value || 'red-yellow-green';
  }

  /**
   * Extract column names from formula
   */
  extractColumnsFromFormula(formula) {
    const columns = this.table.options.columns || [];
    const columnKeys = columns.map(col => col.key);
    const foundColumns = [];
    
    columnKeys.forEach(key => {
      if (formula.includes(key)) {
        foundColumns.push(key);
      }
    });
    
    return foundColumns.length > 0 ? foundColumns : ['*'];
  }
  
  /**
   * Format condition description for preview
   */
  formatConditionDescription(rule) {
    // Handle simple condition type
    if (rule.conditionType === 'simple' && rule.conditions && rule.conditions[0]) {
      const c = rule.conditions[0];
      const columnName = c.column || '(列を選択)';
      const operatorSymbol = this.getOperatorSymbol(c.operator) || '(演算子を選択)';
      
      // Handle different value requirements based on operator
      const valueCount = this.getValueInputCount(c.operator);
      let valueText;
      
      if (valueCount === 0) {
        valueText = ''; // No value needed for IS_EMPTY, IS_NOT_EMPTY, etc.
      } else if (valueCount === 1) {
        valueText = c.value || '(値を入力)';
      } else if (valueCount === 2) {
        const value1 = c.value || '(最小値)';
        const value2 = c.value2 || '(最大値)';
        valueText = `${value1} ~ ${value2}`;
      }
      
      // Check for data type mismatch
      const warning = this.checkConditionCompatibility(c);
      if (warning) {
        return `${columnName} ${operatorSymbol} ${valueText} ⚠️ ${warning}`.trim();
      }
      
      return `${columnName} ${operatorSymbol} ${valueText}`.trim();
    }
    
    if (rule.conditionType === 'combined' && rule.conditions.length > 1) {
      const conditionTexts = rule.conditions.map(c => {
        const warning = this.checkConditionCompatibility(c);
        const valueCount = this.getValueInputCount(c.operator);
        let valueText = '';
        
        if (valueCount === 1) {
          valueText = c.value;
        } else if (valueCount === 2) {
          valueText = `${c.value} ~ ${c.value2}`;
        }
        
        const baseText = `${c.column} ${this.getOperatorSymbol(c.operator)} ${valueText}`.trim();
        return warning ? `${baseText} ⚠️` : baseText;
      });
      return conditionTexts.join(` ${rule.logicalOperator.toUpperCase()} `);
    }
    
    return '条件を設定してください';
  }
  
  /**
   * Check compatibility between column type and operator/value
   */
  checkConditionCompatibility(condition) {
    if (!condition.column || !condition.operator || !condition.value) {
      return null; // Incomplete condition, no warning needed
    }
    
    // Get column information
    const column = this.table.options.columns?.find(col => col.key === condition.column);
    if (!column) return null;
    
    // Detect column data type from sample data
    const sampleData = this.table.data?.slice(0, 10) || [];
    const columnValues = sampleData.map(row => row[condition.column]).filter(val => val != null);
    
    if (columnValues.length === 0) return null;
    
    const isNumericColumn = columnValues.every(val => 
      typeof val === 'number' || !isNaN(parseFloat(String(val).replace(/[^0-9.-]/g, '')))
    );
    
    const isDateColumn = columnValues.every(val => 
      val instanceof Date || !isNaN(Date.parse(val))
    );
    
    // Check for problematic combinations
    const numericOperators = ['>', '≥', '<', '≤'];
    const isNumericOperator = numericOperators.includes(this.getOperatorSymbol(condition.operator));
    const isNumericValue = !isNaN(parseFloat(condition.value));
    
    if (isNumericOperator && !isNumericColumn && !isNumericValue) {
      return '数値比較に適さない列です';
    }
    
    if (isNumericOperator && isNumericValue && !isNumericColumn) {
      return '文字列を数値と比較しています';
    }
    
    return null; // No compatibility issues
  }
  
  /**
   * Format scope description for preview
   */
  formatScopeDescription(rule) {
    const scope = this.types.TARGET_SCOPES?.[rule.targetScope.toUpperCase()];
    return scope ? scope.label : rule.targetScope;
  }
  
  /**
   * Format style preview
   */
  formatStylePreview(rule) {
    if (!rule || !rule.format) {
      return 'background-color: #e8f5e8; color: #2e7d2e; font-weight: bold;';
    }
    
    let styles = [];
    const format = rule.format;
    
    // 基本スタイル
    if (format.backgroundColor) {
      styles.push(`background-color: ${format.backgroundColor}`);
    }
    if (format.color) {
      styles.push(`color: ${format.color}`);
    }
    if (format.fontWeight && format.fontWeight !== 'normal') {
      styles.push(`font-weight: ${format.fontWeight}`);
    }
    if (format.fontStyle && format.fontStyle !== 'normal') {
      styles.push(`font-style: ${format.fontStyle}`);
    }
    if (format.textDecoration && format.textDecoration !== 'none') {
      styles.push(`text-decoration: ${format.textDecoration}`);
    }
    
    // デフォルトスタイルを設定（何も指定されていない場合）
    if (styles.length === 0) {
      styles.push('background-color: #f0f8ff', 'color: #1890ff', 'padding: 4px 8px', 'border-radius: 4px');
    }
    
    return styles.join('; ');
  }

  /**
   * Generate preview content based on rule type
   */
  generatePreviewContent(rule) {
    if (!rule || !rule.format) {
      return 'サンプルテキスト';
    }
    
    const format = rule.format;
    
    // IconSetの場合はサンプル星を表示
    if (format.iconSet && format.iconSet.icons && format.iconSet.icons.length > 0) {
      const sampleIcon = format.iconSet.icons[Math.floor(format.iconSet.icons.length / 2)]; // 中間のアイコン
      return `${sampleIcon} 4.2`;
    }
    
    // DataBarの場合はサンプル値を表示
    if (format.dataBar) {
      return '75';
    }
    
    return 'サンプルテキスト';
  }

  /**
   * Apply actual formatting to preview cell (完全統一化)
   */
  applyPreviewIconSet(previewContainer, rule) {
    const previewCell = previewContainer.querySelector('.cf-preview-cell');
    if (!previewCell || !rule || !rule.format) return;
    
    // 実際の書式適用処理を使用して完全に同じ表示にする
    try {
      // サンプルデータを設定
      const sampleValue = 4.2; // 5段階評価の中間値
      previewCell.textContent = sampleValue.toString();
      
      // 実際のIconSetFormatterを使用
      if (typeof window !== 'undefined' && window.ConditionalFormattingIconSetFormatter) {
        const IconSetFormatter = window.ConditionalFormattingIconSetFormatter;
        const formatter = new IconSetFormatter(this.getConfig(), this.getUtils());
        
        // 列統計をシミュレート（5段階評価: 1.0-5.0）
        const mockColumnStats = {
          min: 1.0,
          max: 5.0,
          count: 100,
          dataType: 'number'
        };
        
        // 実際のIconSetFormatter.applyを使用
        formatter.apply(previewCell, rule.format.iconSet, sampleValue, mockColumnStats);
      } else {
        // フォールバック: 統一されたcreateStarIconを使用
        this.fallbackApplyPreviewIcon(previewCell, rule, sampleValue);
      }
    } catch (error) {
      // フォールバック処理
      this.fallbackApplyPreviewIcon(previewCell, rule, 4.2);
    }
  }

  /**
   * Fallback icon preview application
   */
  fallbackApplyPreviewIcon(previewCell, rule, sampleValue) {
    const utils = this.getUtils();
    if (!utils || !utils.createStarIcon) return;
    
    const format = rule.format;
    if (format.iconSet && format.iconSet.icons && format.iconSet.icons.length > 0) {
      // 中間のアイコンを選択
      const iconIndex = Math.floor(format.iconSet.icons.length / 2);
      const sampleIcon = format.iconSet.icons[iconIndex];
      
      // 星の場合は統一された関数を使用
      if (sampleIcon.includes('★') || sampleIcon.includes('☆')) {
        previewCell.innerHTML = '';
        const iconElement = utils.createStarIcon(sampleIcon);
        previewCell.appendChild(iconElement);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = ` ${sampleValue}`;
        previewCell.appendChild(textSpan);
      } else {
        previewCell.textContent = `${sampleIcon} ${sampleValue}`;
      }
    }
  }

  /**
   * Get Utils instance
   */
  getUtils() {
    // Try to get utils from various sources
    if (this.utils) return this.utils;
    if (this.plugin && this.plugin.utils) return this.plugin.utils;
    if (typeof window !== 'undefined' && window.ConditionalFormattingUtils) {
      return new window.ConditionalFormattingUtils();
    }
    return null;
  }

  /**
   * Get Config instance
   */
  getConfig() {
    // Try to get config from various sources
    if (this.config) return this.config;
    if (this.plugin && this.plugin.config) return this.plugin.config;
    if (typeof window !== 'undefined' && window.ConditionalFormattingConfig) {
      return window.ConditionalFormattingConfig;
    }
    return {};
  }

  /**
   * Apply actual DataBar formatting to preview cell (完全統一化)
   */
  applyPreviewDataBar(previewContainer, rule) {
    const previewCell = previewContainer.querySelector('.cf-preview-cell');
    if (!previewCell || !rule || !rule.format || !rule.format.dataBar) return;
    
    try {
      // サンプルデータを設定
      const sampleValue = 75; // 0-100の中間値
      previewCell.textContent = sampleValue.toString();
      
      // 実際のDataBarFormatterを使用
      if (typeof window !== 'undefined' && window.ConditionalFormattingDataBarFormatter) {
        const DataBarFormatter = window.ConditionalFormattingDataBarFormatter;
        const formatter = new DataBarFormatter(this.getConfig(), this.getUtils());
        
        // 列統計をシミュレート
        const mockColumnStats = {
          min: 0,
          max: 100,
          count: 100,
          dataType: 'number'
        };
        
        // 実際のDataBarFormatter.applyを使用
        formatter.apply(previewCell, rule.format.dataBar, sampleValue, mockColumnStats);
      } else {
        // フォールバック: 基本的なDataBar表示
        this.fallbackApplyPreviewDataBar(previewCell, rule, sampleValue);
      }
    } catch (error) {
      this.fallbackApplyPreviewDataBar(previewCell, rule, 75);
    }
  }

  /**
   * Fallback DataBar preview application
   */
  fallbackApplyPreviewDataBar(previewCell, rule, sampleValue) {
    const format = rule.format.dataBar;
    
    // 基本的なDataBar HTML構造を作成
    const percentage = 75; // サンプル値
    const color = format.color || '#4285f4';
    
    previewCell.innerHTML = `
      <div class="cf-data-bar-container" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center;">
        <div class="cf-data-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: ${percentage}%; background: ${color}; opacity: 0.7; border-radius: 4px;"></div>
        <div class="cf-data-bar-text" style="position: relative; z-index: 2; padding: 0 4px;">${sampleValue}</div>
      </div>
    `;
  }
  
  /**
   * Get operator label for display
   */
  getOperatorLabel(operatorKey) {
    const labels = {
      EQUALS: '等しい',
      NOT_EQUALS: '等しくない',
      GREATER_THAN: 'より大きい',
      GREATER_THAN_OR_EQUAL: '以上',
      LESS_THAN: 'より小さい',
      LESS_THAN_OR_EQUAL: '以下',
      CONTAINS: '含む',
      NOT_CONTAINS: '含まない',
      STARTS_WITH: 'で始まる',
      ENDS_WITH: 'で終わる',
      IS_EMPTY: '空白',
      IS_NOT_EMPTY: '非空白',
      IS_NUMBER: '数値',
      IS_DATE: '日付',
      BETWEEN: '範囲内',
      NOT_BETWEEN: '範囲外'
    };
    
    return labels[operatorKey] || operatorKey;
  }
  
  /**
   * Convert Enhanced UI rule format to Rule Engine compatible format
   */
  convertToEngineFormat(rule) {
    const engineRule = { ...rule };
    
    // Handle enhanced condition types directly
    if (rule.conditionType === 'simple') {
      // For simple conditions, extract first condition properties to rule level
      if (rule.conditions && rule.conditions.length > 0) {
        const firstCondition = rule.conditions[0];
        engineRule.operator = firstCondition.operator;
        engineRule.value = firstCondition.value;
        engineRule.value2 = firstCondition.value2;
        engineRule.column = firstCondition.column;
      }
    } else if (rule.conditionType === 'combined') {
      // Convert conditions to multipleConditions for Rule Engine
      engineRule.multipleConditions = rule.conditions;
      // Ensure logicalOperator is in correct format
      if (rule.logicalOperator) {
        engineRule.logicalOperator = rule.logicalOperator.toLowerCase();
      } else {
        engineRule.logicalOperator = 'and'; // Default fallback
      }
    } else if (rule.conditionType === 'formula') {
      if (rule.conditions && rule.conditions.length > 0) {
        engineRule.formula = rule.conditions[0].formula;
      }
    }
    
    // Convert target scope to application scope
    if (rule.targetScope === 'cell') {
      engineRule.applicationScope = 'cell';
    } else if (rule.targetScope === 'row') {
      engineRule.applicationScope = 'row';
    }
    
    // Ensure priority is set
    engineRule.priority = rule.priority || 1;
    
    return engineRule;
  }
  
  /**
   * Get operator symbol for display
   */
  getOperatorSymbol(operator) {
    const symbols = {
      equals: '=',
      notEquals: '≠',
      greaterThan: '>',
      greaterThanOrEqual: '≥',
      lessThan: '<',
      lessThanOrEqual: '≤',
      contains: '含む',
      notContains: '含まない',
      startsWith: 'で始まる',
      endsWith: 'で終わる',
      isEmpty: '空白',
      isNotEmpty: '非空白',
      isNumber: '数値',
      isDate: '日付',
      between: '範囲内',
      notBetween: '範囲外'
    };
    
    return symbols[operator] || operator;
  }
  
  /**
   * Save rule and close dialog
   */
  saveRule(modal, overlay) {
    try {
      const rule = this.buildRuleFromUI(modal);
      
      // Debug only for combined conditions
      if (rule.conditionType === 'combined') {
      }
      
      // Validate rule
      if (!rule.name || rule.name.trim() === '') {
        alert('ルール名を入力してください');
        return;
      }
      
      if (!rule.conditions || rule.conditions.length === 0 || 
          (rule.conditions.length > 0 && !rule.conditions[0].column && !rule.conditions[0].formula)) {
        alert('条件を設定してください（列、演算子、値を選択してください）');
        return;
      }
      
      if (!rule.format || Object.keys(rule.format).length === 0) {
        // Set default format if none specified
        rule.format = {
          backgroundColor: '#e8f5e8',
          color: '#2e7d2e'
        };
      }
      
      // Convert to Rule Engine compatible format
      const engineRule = this.convertToEngineFormat(rule);
      
      
      // Emit event to parent system
      if (this.table.pluginSystem && this.table.pluginSystem.emitHook) {
        this.table.pluginSystem.emitHook('conditionalFormatting:ruleUpdated', {
          rule: engineRule,
          isEdit: this.editMode
        });
      } else {
        // Try direct plugin reference first
        if (this.plugin) {
          if (this.editMode) {
            this.plugin.updateRule(engineRule.id, engineRule);
          } else {
            this.plugin.addRule(engineRule);
          }
        } else {
          // Fallback: try multiple access methods
          
          let cfPlugin = null;
          
          // Method 1: Direct plugin instances
          if (this.table.pluginInstances && this.table.pluginInstances['conditional-formatting']) {
            cfPlugin = this.table.pluginInstances['conditional-formatting'];
          }
          // Method 2: Via plugin system
          else if (this.table.pluginSystem && this.table.pluginSystem.getPlugin) {
            cfPlugin = this.table.pluginSystem.getPlugin('conditional-formatting');
          }
          // Method 3: Global plugin system
          else if (window.pluginSystem && window.pluginSystem.getPlugin) {
            cfPlugin = window.pluginSystem.getPlugin('conditional-formatting');
          }
          
          if (cfPlugin) {
            if (this.editMode) {
              cfPlugin.updateRule(engineRule.id, engineRule);
            } else {
              cfPlugin.addRule(engineRule);
            }
          } else {
            alert('ルールは作成されましたが、適用するためにページを再読み込みしてください');
          }
        }
      }
      
      this.closeDialog(overlay);
      alert('ルールが正常に保存されました');
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('ルールの保存中にエラーが発生しました: ' + error.message);
    }
  }
  
  /**
   * Restore existing rule values to UI
   * @param {HTMLElement} modal - Modal dialog element  
   * @param {Object} rule - Existing rule to restore
   */
  restoreRuleToUI(modal, rule) {
    console.log('🔍 === RESTORE RULE TO UI DEBUG ===');
    console.log('Rule being restored:', rule);
    console.log('Rule.conditions:', rule.conditions);
    console.log('Rule.conditionType:', rule.conditionType);
    console.log('Rule.name:', rule.name);
    console.log('Rule.operator:', rule.operator);
    console.log('Rule.value:', rule.value);
    console.log('=====================================');
    
    try {
      // 1. Rule name
      const nameInput = modal.querySelector('#cf-rule-name');
      if (nameInput && rule.name) {
        nameInput.value = rule.name;
      }
      
      // 2. Condition type radio buttons
      let conditionType = rule.conditionType || 'simple';
      
      
      const conditionTypeRadio = modal.querySelector(`input[name="cf-condition-type"][value="${conditionType}"]`);
      
      if (conditionTypeRadio) {
        conditionTypeRadio.checked = true;
        
        // Update UI state and force condition details update (synchronous)
        this.uiState.conditionType = conditionType;
        
        // Force update condition details immediately
        this.updateConditionDetails(modal);
        
        // Restore condition values immediately (synchronous)
        this.restoreConditionValues(modal, rule);
        
        // 🔥 CRITICAL FIX: 複合条件の場合は論理演算子も復元
        if (conditionType === 'combined' && rule.logicalOperator) {
          const logicalOpRadio = modal.querySelector(`input[name="cf-logical-operator"][value="${rule.logicalOperator}"]`);
          if (logicalOpRadio) {
            logicalOpRadio.checked = true;
          }
        }
        
      } else {
        // List all available radio buttons for debugging
        const allRadios = modal.querySelectorAll('input[name="cf-condition-type"]');
      }
      
      // 3. Target scope radio buttons
      let targetScope = rule.targetScope || 'cell';
      
      const targetScopeRadio = modal.querySelector(`input[name="cf-target-scope"][value="${targetScope}"]`);
      if (targetScopeRadio) {
        targetScopeRadio.checked = true;
      }
      
      // 4. Condition values will be restored in restoreConditionValues() after DOM update
      
      // 5. Format type radio buttons
      const formatType = rule.formatType || 'basic';
      let formatTypeValue = formatType;
      
      // Map format type to radio button value
      if (formatType === 'dataBar') {
        formatTypeValue = 'data-bar';
      } else if (formatType === 'iconSet') {
        formatTypeValue = 'icon-set';  
      } else if (formatType === 'colorScale') {
        formatTypeValue = 'color-scale';
      } else {
        formatTypeValue = 'basic';
      }
      
      const formatTypeRadio = modal.querySelector(`input[name="cf-format-type"][value="${formatTypeValue}"]`);
      if (formatTypeRadio) {
        formatTypeRadio.checked = true;
        // Trigger change event to show/hide advanced options
        formatTypeRadio.dispatchEvent(new Event('change'));
      }
      
      // 6. Basic format values
      if (rule.format) {
        // Background color
        const bgColorInput = modal.querySelector('#cf-bg-color');
        if (bgColorInput && rule.format.backgroundColor) {
          bgColorInput.value = rule.format.backgroundColor;
        }
        
        // Text color
        const textColorInput = modal.querySelector('#cf-text-color');
        if (textColorInput && rule.format.color) {
          textColorInput.value = rule.format.color;
        }
        
        // Bold
        const boldInput = modal.querySelector('#cf-bold');
        if (boldInput) {
          boldInput.checked = rule.format.fontWeight === 'bold';
        }
        
        // Italic
        const italicInput = modal.querySelector('#cf-italic');
        if (italicInput) {
          italicInput.checked = rule.format.fontStyle === 'italic';
        }
        
        // Underline
        const underlineInput = modal.querySelector('#cf-underline');
        if (underlineInput) {
          underlineInput.checked = rule.format.textDecoration === 'underline';
        }
      }
      
      // 7. Logical operator (for combined conditions)
      const logicalOperator = rule.logicalOperator || 'and';
      const logicalOperatorSelect = modal.querySelector('#cf-logical-operator');
      if (logicalOperatorSelect) {
        logicalOperatorSelect.value = logicalOperator;
      }
      
      // 8. Priority
      const priorityInput = modal.querySelector('#cf-priority');
      if (priorityInput && rule.priority !== undefined) {
        priorityInput.value = rule.priority;
      }
      
      // 9. Update preview to reflect all restored values
      this.updatePreview(modal);
      
      
    } catch (error) {
      console.error('❌ Error restoring rule to UI:', error);
    }
  }

  /**
   * Restore condition values to UI after condition details area is updated
   * @param {HTMLElement} modal - Modal dialog element
   * @param {Object} rule - Rule to restore values from
   */
  restoreConditionValues(modal, rule) {
    console.log('🎯 === RESTORE CONDITION VALUES DEBUG ===');
    console.log('Rule for condition restore:', rule);
    console.log('Rule.conditions:', rule.conditions);
    console.log('Rule.conditionType:', rule.conditionType);
    console.log('=========================================');
    
    try {
      // Use uiState.conditions which has been properly converted from legacy format
      const conditions = this.uiState.conditions || [];
      console.log('📋 Using uiState.conditions for restore:', conditions);
      
      if (this.uiState.conditionType === 'combined') {
        // 複合条件の場合：全ての条件を復元
        if (conditions.length > 0) {
          this.restoreCombinedConditionValues(modal, conditions);
          return;
        }
      } else {
        // 単一条件の場合：use converted conditions from uiState
        let conditionData = null;
        
        if (conditions.length > 0) {
          conditionData = conditions[0]; // 最初の条件を基準に復元
        }
      
        if (conditionData) {
          console.log('📝 Single condition data to restore:', conditionData);
          let elementsRestored = 0;
          let elementsExpected = 0;
        
        // Column
        elementsExpected++;
        const columnSelect = modal.querySelector('#cf-simple-column');
        if (columnSelect) {
          if (conditionData.column) {
            console.log(`✅ Restoring column: ${conditionData.column}`);
            columnSelect.value = conditionData.column;
            elementsRestored++;
          }
        } else {
          console.log('❌ Column select element not found');
        }
        
        // Operator
        elementsExpected++;
        const operatorSelect = modal.querySelector('#cf-simple-operator');
        if (operatorSelect) {
          if (conditionData.operator) {
            console.log(`✅ Restoring operator: ${conditionData.operator}`);
            operatorSelect.value = conditionData.operator;
            elementsRestored++;
          }
        } else {
          console.log('❌ Operator select element not found');
        }
        
        // Value
        elementsExpected++;
        const valueInput = modal.querySelector('#cf-simple-value');
        if (valueInput) {
          if (conditionData.value !== undefined) {
            console.log(`✅ Restoring value: ${conditionData.value}`);
            valueInput.value = conditionData.value;
            elementsRestored++;
          }
        } else {
          console.log('❌ Value input element not found');
        }
        
        // Also handle second value for BETWEEN operations
        if (conditionData.value2 !== undefined) {
          elementsExpected++;
          const value2Input = modal.querySelector('#cf-simple-value2');
          if (value2Input) {
            value2Input.value = conditionData.value2;
            elementsRestored++;
          } else {
          }
        }
        
        // Summary
        
        if (elementsRestored === 0) {
          throw new Error('No condition input elements were found or restored');
        } else if (elementsRestored < elementsExpected) {
        }
        
      } else {
      }
      } // else block closing
      
    } catch (error) {
      console.error('❌ [restoreConditionValues] Error:', error);
      
      // Log available DOM elements for debugging
      const detailsContainer = modal.querySelector('#cf-condition-details');
      if (detailsContainer) {
        const availableInputs = detailsContainer.querySelectorAll('input, select, textarea');
      }
    }
  }

  /**
   * Ensure condition details area is visible and populated
   * @param {HTMLElement} dialog - Dialog element
   */
  ensureConditionDetailsVisible(dialog) {
    
    // Find the condition details container
    const detailsContainer = dialog.querySelector('#cf-condition-details');
    if (!detailsContainer) {
      console.error('❌ [ensureConditionDetailsVisible] #cf-condition-details container not found');
      return;
    }
    
    
    // Ensure we have proper condition data for the current type
    if (this.uiState.conditionType === 'simple') {
      if (!this.uiState.conditions || this.uiState.conditions.length === 0) {
        this.uiState.conditions = [{ column: '', operator: '', value: '' }];
      }
    }
    
    // Force update condition details content
    const content = this.createConditionDetailsContent();
    
    detailsContainer.innerHTML = content;
    
    // Verify elements were created
    const createdElements = detailsContainer.querySelectorAll('input, select, textarea');
    
    // Specifically check for simple condition elements
    if (this.uiState.conditionType === 'simple') {
      const requiredIds = ['cf-simple-column', 'cf-simple-operator', 'cf-simple-value'];
      const missingElements = requiredIds.filter(id => !detailsContainer.querySelector(`#${id}`));
      
      if (missingElements.length === 0) {
      } else {
        console.error('❌ [ensureConditionDetailsVisible] Missing elements:', missingElements);
      }
    }
  }

  /**
   * Initialize UI state from existing rule
   * @param {Object} rule - Existing rule to initialize from
   */
  initializeUIStateFromRule(rule) {
    let conditionType = rule.conditionType || 'simple';
    
    // Initialize conditions array - handle both legacy and enhanced formats
    let conditions = [];
    
    if (rule.conditions && rule.conditions.length > 0) {
      // Enhanced format
      conditions = [...rule.conditions];
    } else if (rule.operator && (rule.value !== undefined || ['isEmpty', 'isNotEmpty', 'isNumber', 'isDate'].includes(rule.operator))) {
      // Legacy format - convert to enhanced format
      const condition = {
        column: rule.targetColumns && rule.targetColumns[0] ? rule.targetColumns[0] : '',
        operator: rule.operator,
        value: rule.value || ''
      };
      
      // Handle second value for BETWEEN operations
      if (rule.value2 !== undefined) {
        condition.value2 = rule.value2;
      }
      
      conditions = [condition];
      
      console.log('🔄 Converted legacy condition to enhanced:', condition);
    } else if (rule.multipleConditions && rule.multipleConditions.length > 0) {
      // Legacy multiple conditions
      conditions = [...rule.multipleConditions];
      conditionType = 'combined';
    } else {
      // Fallback empty condition
      conditions = [{ column: '', operator: '', value: '' }];
    }
    
    this.uiState = {
      conditionType: conditionType,
      targetScope: rule.targetScope || 'cell',
      conditions: conditions,
      logicalOperator: rule.logicalOperator || 'and'
    };
    
    console.log('🎯 Final uiState after initialization:', this.uiState);
  }

  /**
   * Wait for condition input elements to be present in DOM
   * @param {HTMLElement} modal - Modal dialog element
   * @param {string} conditionType - The condition type to wait for
   * @returns {Promise} Promise that resolves when elements are ready
   */
  waitForConditionInputs(modal, conditionType) {
    return new Promise((resolve, reject) => {
      const maxAttempts = 20; // Maximum 20 attempts (1 second total)
      const intervalMs = 50; // Check every 50ms
      let attempts = 0;
      
      
      const checkForElements = () => {
        attempts++;
        
        // Define selectors based on condition type
        let requiredSelectors = [];
        switch (conditionType) {
          case 'simple':
            requiredSelectors = ['#cf-simple-column', '#cf-simple-operator', '#cf-simple-value'];
            break;
          case 'combined':
            requiredSelectors = ['#cf-conditions-list', '#cf-add-condition'];
            break;
          case 'formula':
            requiredSelectors = ['#cf-formula-input'];
            break;
          default:
            reject(new Error(`Unknown condition type: ${conditionType}`));
            return;
        }
        
        // Check if all required elements exist
        const allElementsPresent = requiredSelectors.every(selector => {
          const element = modal.querySelector(selector);
          const exists = !!element;
          if (!exists) {
          }
          return exists;
        });
        
        if (allElementsPresent) {
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error(`❌ [waitForConditionInputs] Timed out after ${attempts} attempts. Missing elements for condition type: ${conditionType}`);
          reject(new Error(`Timeout waiting for condition inputs: ${conditionType}`));
        } else {
          // Try again
          setTimeout(checkForElements, intervalMs);
        }
      };
      
      // Start checking immediately
      checkForElements();
    });
  }

  /**
   * Restore combined condition values to UI
   * @param {HTMLElement} modal - Modal dialog element
   * @param {Array} conditions - Array of conditions to restore
   */
  restoreCombinedConditionValues(modal, conditions) {
    try {
      conditions.forEach((condition, index) => {
        // Column selector
        const columnSelect = modal.querySelector(`select[data-index="${index}"].cf-condition-column`);
        if (columnSelect && condition.column) {
          columnSelect.value = condition.column;
        }
        
        // Operator selector
        const operatorSelect = modal.querySelector(`select[data-index="${index}"].cf-condition-operator`);
        if (operatorSelect && condition.operator) {
          operatorSelect.value = condition.operator;
        }
        
        // Value input(s)
        const valueInput = modal.querySelector(`input[data-index="${index}"].cf-condition-value`);
        if (valueInput && condition.value !== undefined) {
          valueInput.value = condition.value;
        }
        
        // Second value for BETWEEN operations
        if (condition.value2 !== undefined) {
          const value2Input = modal.querySelector(`input[data-index="${index}"].cf-condition-value2`);
          if (value2Input) {
            value2Input.value = condition.value2;
          }
        }
      });
    } catch (error) {
      console.error('❌ [restoreCombinedConditionValues] Error:', error);
    }
  }

  /**
   * Close dialog
   */
  closeDialog(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedConditionalFormattingUIManager;
}

if (typeof window !== 'undefined') {
  window.EnhancedConditionalFormattingUIManager = EnhancedConditionalFormattingUIManager;
}