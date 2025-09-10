/**
 * Conditional Formatting Plugin for ExceLike Table
 * Main plugin with improved architecture using Strategy Pattern and State Management
 */

// Import components if available
function getConditionalFormattingComponents() {
  if (typeof window !== 'undefined') {
    return {
      // Core architecture
      Config: window.ConditionalFormattingConfig,
      Utils: window.ConditionalFormattingUtils,
      StateManager: window.getConditionalFormattingState,
      
      // Legacy components for backward compatibility
      ConditionalFormattingTypes: window.ConditionalFormattingTypes,
      RuleEngine: window.ConditionalFormattingRuleEngine,
      FormatApplier: window.ConditionalFormattingFormatApplier,
      
      // Improved components
      ImprovedFormatApplier: window.ConditionalFormattingImprovedFormatApplier,
      Commands: window.ConditionalFormattingCommands,
      
      // UI components
      ContextMenuExtension: window.ConditionalFormattingContextMenuExtension,
      
      // Enhanced components
      EnhancedUIManager: window.EnhancedConditionalFormattingUIManager,
      EnhancedRuleEngine: window.EnhancedConditionalFormattingRuleEngine,
      
      // Data migration
      DataMigrationManager: window.DataMigrationManager
    };
  } else if (typeof require !== 'undefined') {
    try {
      return {
        Config: require('./config'),
        Utils: require('./utils'),
        StateManager: require('./StateManager').getConditionalFormattingState,
        ConditionalFormattingTypes: require('./types'),
        RuleEngine: require('./rule-engine'),
        FormatApplier: require('./format-applier'),
        ImprovedFormatApplier: require('./ImprovedFormatApplier'),
        Commands: require('./commands/FormattingCommands'),
        ContextMenuExtension: require('./context-menu-extension'),
        
        // Enhanced components
        EnhancedUIManager: require('./enhanced-ui-manager'),
        EnhancedRuleEngine: require('./enhanced-rule-engine'),
        
        // Data migration
        DataMigrationManager: require('./data-migration-manager')
      };
    } catch (e) {
      return {};
    }
  }
  return {};
}

const ConditionalFormattingPlugin = {
  name: 'Conditional Formatting',
  version: '1.0.0',
  description: 'Excel-like conditional formatting with complex rules and visual effects',
  author: 'ExceLike Table Team',
  
  // Plugin state
  initialized: false,
  
  /**
   * Initialize plugin
   * @param {Object} table - Table instance
   * @param {Object} api - Plugin API
   */
  init(table, api) {
    
    this.table = table;
    this.api = api;
    
    // Check if required components are available
    if (!this.checkDependencies()) {
      console.error('[ConditionalFormatting] Required dependencies not available');
      return;
    }
    
    // Initialize components
    this.initializeComponents();
    
    // Register hooks
    this.registerHooks();
    
    // Bind events
    this.bindEvents();
    
    // Load saved rules
    this.loadSavedRules();
    
    this.initialized = true;
    
    // 🚀 初期化完了後、確実に初期適用を実行
    setTimeout(() => {
      this.applyInitialFormatting();
    }, 100); // DOM安定化を待つ
    
  },
  
  /**
   * Check if all required dependencies are available
   * @returns {boolean} Dependencies available
   */
  checkDependencies() {
    const components = getConditionalFormattingComponents();
    const required = [
      'Config',
      'Utils', 
      'StateManager',
      'RuleEngine',
      'FormatApplier', // Legacy fallback
      'ContextMenuExtension',
      'EnhancedUIManager' // Required for UI
    ];
    
    const available = required.filter(dep => components[dep] !== undefined);
    const missing = required.filter(dep => components[dep] === undefined);
    
    if (missing.length > 0) {
    }
    
    // Minimum required: Config, Utils, StateManager, RuleEngine, FormatApplier, EnhancedUIManager
    // Commands is optional for undo/redo functionality
    const critical = ['Config', 'Utils', 'StateManager', 'RuleEngine', 'FormatApplier', 'EnhancedUIManager'];
    return critical.every(dep => components[dep] !== undefined);
  },
  
  /**
   * Initialize plugin components
   */
  initializeComponents() {
    const components = getConditionalFormattingComponents();
    const { 
      Config, Utils, StateManager, RuleEngine, FormatApplier, 
      ImprovedFormatApplier, Commands, ContextMenuExtension,
      EnhancedUIManager, EnhancedRuleEngine
    } = components;
    
    // Initialize core architecture components
    this.config = Config;
    this.utils = new Utils();
    this.state = StateManager();
    
    // Initialize command manager for undo/redo (if available)
    if (Commands && Commands.CommandManager) {
      this.commandManager = new Commands.CommandManager();
    } else {
      this.commandManager = null;
    }
    
    // Initialize rule engine
    this.ruleEngine = new RuleEngine();
    
    // Choose between legacy and improved format applier
    if (ImprovedFormatApplier && this.shouldUseImprovedComponents()) {
      this.formatApplier = new ImprovedFormatApplier(
        this.table.container, 
        this.config, 
        this.utils, 
        this.state
      );
      this.useImprovedArchitecture = true;
    } else {
      // Fallback to legacy format applier with table instance for DataManager
      this.formatApplier = new FormatApplier(this.table.container, this.table);
      this.useImprovedArchitecture = false;
    }
    
    // Legacy UI manager is no longer needed - using EnhancedUIManager only
    
    // Initialize context menu extension
    this.contextMenuExtension = new ContextMenuExtension(this);
    
    // Initialize enhanced components (required)
    if (!EnhancedUIManager) {
      console.error('Available components:', Object.keys(components));
      console.error('EnhancedUIManager:', EnhancedUIManager);
      throw new Error('EnhancedUIManager component is not loaded. Make sure enhanced-ui-manager.js is included in your HTML.');
    }
    
    this.enhancedUIManager = new EnhancedUIManager(this.table, this); // Pass plugin reference
    this.hasEnhancedComponents = true;
    
    // Initialize enhanced rule engine if available (optional)
    if (EnhancedRuleEngine) {
      this.enhancedRuleEngine = new EnhancedRuleEngine();
    }
    
    // Set up state management observers
    this.setupStateObservers();
    
  },
  
  /**
   * Show enhanced conditional formatting dialog
   */
  showEnhancedDialog(existingRule = null) {
    // EnhancedUIManagerのみを使用
    if (!this.hasEnhancedComponents || !this.enhancedUIManager) {
      throw new Error('EnhancedUIManager is not available. Check component initialization.');
    }
    
    this.enhancedUIManager.showDialog(existingRule);
    
    // Set up rule save handler if not already bound
    if (!this.enhancedRuleSaveHandlerBound) {
      // Use the table's plugin system for event handling
      if (this.table.pluginSystem && this.table.pluginSystem.on) {
        this.table.pluginSystem.on('conditionalFormatting:ruleUpdated', (data) => {
          if (data.rule) {
            if (data.isEdit) {
              this.updateRule(data.rule.id, data.rule);
            } else {
              this.addRule(data.rule);
            }
          }
        });
      } else {
        // Fallback: add event listener to the enhanced UI manager directly
        this.enhancedRuleSaveHandler = (data) => {
          if (data.rule) {
            if (data.isEdit) {
              this.updateRule(data.rule.id, data.rule);
            } else {
              this.addRule(data.rule);
            }
          }
        };
      }
      this.enhancedRuleSaveHandlerBound = true;
    }
  },
  
  
  /**
   * Add a new conditional formatting rule
   * @param {EnhancedConditionalFormattingRule} rule - Rule to add
   */
  addRule(rule) {
    try {
      // Add to rule engine
      if (this.ruleEngine && this.ruleEngine.addRule) {
        this.ruleEngine.addRule(rule);
        
        // Save rules
        this.saveRules();
        
        // Apply formatting
        this.refreshAllFormatting();
        
        // Emit event
        this.api.emitHook('conditionalFormatting:ruleAdded', { rule: rule });
      } else {
        throw new Error('Rule engine not available');
      }
    } catch (error) {
      console.error('[ConditionalFormatting] Error adding rule:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing rule (for enhanced dialog)
   */
  updateRule(ruleId, updatedRule) {
    try {
      // Update in rule engine
      if (this.ruleEngine && this.ruleEngine.updateRule) {
        this.ruleEngine.updateRule(ruleId, updatedRule);
        
        // Apply formatting
        this.refreshAllFormatting();
        
        // Save rules
        this.saveRulesToStorage();
      } else {
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  },
  
  

  
  
  
  /**
   * Get all rules
   */
  getAllRules() {
    if (this.ruleEngine && this.ruleEngine.rules) {
      if (this.ruleEngine.rules instanceof Map) {
        return Array.from(this.ruleEngine.rules.values());
      } else if (Array.isArray(this.ruleEngine.rules)) {
        return this.ruleEngine.rules;
      }
    }
    return [];
  },
  
  /**
   * Save rules to storage
   */
  saveRulesToStorage() {
    if (this.api && this.api.setStorage && this.ruleEngine) {
      try {
        const rules = this.getAllRules();
        const rulesToSave = rules.map(rule => rule.toJSON ? rule.toJSON() : rule);
        this.api.setStorage('conditionalFormattingRules', rulesToSave, 'conditional-formatting');
      } catch (error) {
      }
    }
  },
  
  // ========================================
  // 状態管理イベントハンドラー
  // ========================================
  
  /**
   * ルール変更時の処理
   */
  onStateRulesChanged(data) {
    if (!this.useImprovedArchitecture) return;
    
    
    // UIを更新
    if (this.uiManager && this.uiManager.refreshRulesList) {
      this.uiManager.refreshRulesList();
    }
  },
  
  /**
   * 書式変更時の処理
   */
  onStateFormatChanged(data) {
    if (!this.useImprovedArchitecture) return;
    
  },
  
  /**
   * パフォーマンス情報更新時の処理
   */
  onPerformanceUpdated(metrics) {
    // パフォーマンスが悪化した場合の警告
    if (metrics.averageDuration > 100) { // 100ms超過で警告
    }
  },
  
  /**
   * 改良版コンポーネントを使用すべきかチェック
   */
  shouldUseImprovedComponents() {
    // 設定で無効化されている場合
    if (this.config?.features?.useImprovedArchitecture === false) {
      return false;
    }
    
    // テスト環境または開発環境でのみ有効化
    const isTestEnv = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
    
    return isTestEnv;
  },
  
  /**
   * 状態管理オブザーバーをセットアップ
   */
  setupStateObservers() {
    if (!this.useImprovedArchitecture) return;
    
    // ルール変更時の処理
    this.state.subscribe('rulesChanged', (data) => {
      this.onStateRulesChanged(data);
    });
    
    // 書式変更時の処理
    this.state.subscribe('formatChanged', (data) => {
      this.onStateFormatChanged(data);
    });
    
    // パフォーマンス情報更新時の処理
    this.state.subscribe('performanceUpdated', (metrics) => {
      this.onPerformanceUpdated(metrics);
    });
  },
  
  /**
   * Register plugin hooks
   */
  registerHooks() {
    
    // 統一されたリフレッシュハンドラー
    const refreshHandler = () => {
      if (this.initialized) {
        // Invalidate data manager cache when data changes
        if (this.formatApplier && this.formatApplier.invalidateDataCache) {
          this.formatApplier.invalidateDataCache();
        }
        this.scheduleRefresh();
      }
    };
    
    // コアとなる必須フックのみ登録
    const coreHooks = [
      'render:afterRender',  // レンダリング完了後
      'data:changed',        // データ変更後
      'table:updated'        // テーブル更新後
    ];
    
    coreHooks.forEach(hookName => {
      try {
        this.api.registerHook(hookName, refreshHandler);
      } catch (error) {
      }
    });
  },
  
  /**
   * Bind plugin events - 統一アプローチ
   */
  bindEvents() {
    
    // テーブル API を直接拡張して、データ操作メソッドに条件付き書式の更新を組み込む
    this.integrateWithTableAPI();
  },
  
  /**
   * テーブル API と統合して、データ操作後に自動的に条件付き書式を更新
   */
  integrateWithTableAPI() {
    if (!this.table) return;
    
    
    // 主要なテーブル操作メソッドをラップ
    const methodsToWrap = ['sort', 'filter', 'setData', 'updateData', 'render', 'refresh', 'goToPage', 'setPage', 'nextPage', 'previousPage'];
    
    methodsToWrap.forEach(methodName => {
      if (typeof this.table[methodName] === 'function') {
        const originalMethod = this.table[methodName].bind(this.table);
        
        this.table[methodName] = (...args) => {
          
          // 元のメソッドを実行
          const result = originalMethod(...args);
          
          // 条件付き書式を更新 (Promise対応)
          if (result && typeof result.then === 'function') {
            result.then(() => {
              // Invalidate data manager cache for data-changing operations
              if (['setData', 'updateData', 'sort', 'filter'].includes(methodName)) {
                if (this.formatApplier && this.formatApplier.invalidateDataCache) {
                  this.formatApplier.invalidateDataCache();
                }
              }
              this.scheduleRefresh();
            });
          } else {
            // Invalidate data manager cache for data-changing operations
            if (['setData', 'updateData', 'sort', 'filter'].includes(methodName)) {
              if (this.formatApplier && this.formatApplier.invalidateDataCache) {
                this.formatApplier.invalidateDataCache();
              }
            }
            this.scheduleRefresh();
          }
          
          return result;
        };
        
      }
    });
    
    // DOM Mutation Observer で動的な DOM 変更を監視
    this.setupDOMObserver();
  },
  
  /**
   * DOM Mutation Observer でテーブルの動的変更を監視
   */
  setupDOMObserver() {
    if (!this.table.container || typeof MutationObserver === 'undefined') {
      return;
    }
    
    
    // 既存のオブザーバーを解除
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    
    this.domObserver = new MutationObserver((mutations) => {
      let shouldRefresh = false;
      
      mutations.forEach(mutation => {
        // テーブルの内容変更を検知
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            // テーブル行（tr）やセル（td/th）が追加された場合
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.tagName === 'TR' || node.tagName === 'TD' || node.tagName === 'TH' ||
                 node.querySelector && (node.querySelector('tr') || node.querySelector('td') || node.querySelector('th')))) {
              shouldRefresh = true;
              break;
            }
          }
        }
      });
      
      if (shouldRefresh) {
        this.scheduleRefresh();
      }
    });
    
    // テーブルコンテナを監視
    this.domObserver.observe(this.table.container, {
      childList: true,
      subtree: true
    });
    
  },
  
  /**
   * 統一されたリフレッシュスケジューラー - デバウンス機能付き
   */
  scheduleRefresh() {
    if (!this.initialized) return;
    
    // 短時間での重複実行を防ぐデバウンス処理
    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      this.refreshAllFormatting();
    }, 50); // 50ms の遅延で最適化
  },
  
  /**
   * Setup scroll optimization - 統一されたアプローチ
   */
  setupScrollOptimization() {
    // API統合によって既にハンドリングされているため、追加の処理は不要
  },
  
  /**
   * 🚀 Initial formatting application on page load
   */
  applyInitialFormatting() {
    
    // 1. ルールが存在することを確認
    const rules = this.getAllRules();
    if (rules.length === 0) {
      return;
    }
    
    
    // 2. DOM準備確認
    if (!this.table.container || !this.table.container.querySelector('tbody')) {
      setTimeout(() => this.applyInitialFormatting(), 200);
      return;
    }
    
    // 3. 🔄 統一された完全リフレッシュ処理を使用
    this.refreshAllFormatting();
  },
  
  
  /**
   * Handle render completion - 統一されたアプローチ
   */
  onRenderComplete() {
    // scheduleRefresh を使用して統一されたリフレッシュ処理を実行
    this.scheduleRefresh();
  },

  /**
   * Apply formatting once - simple and safe
   */
  applyFormattingOnce() {
    if (!this.initialized || !this.table.container) {
      return;
    }
    
    try {
      
      // クリアと適用を一度だけ実行
      this.clearAllFormatting();
      
      // DOMから直接セル取得（データアクセスの複雑性を回避）
      const tbody = this.table.container.querySelector('tbody');
      if (!tbody) {
        return;
      }
      
      const rows = tbody.querySelectorAll('tr');
      const columns = this.table.options.columns || [];
      const rules = this.getAllRules();
      
      if (rules.length === 0) {
        return;
      }
      
      
      let appliedCount = 0;
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, colIndex) => {
          const applied = this.applyCellFormatting(cell, rowIndex, colIndex, columns, rules);
          if (applied) appliedCount++;
        });
      });
      
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error in applyFormattingOnce:', error);
    }
  },
  
  /**
   * Apply formatting to a single cell - simple approach
   * @returns {boolean} True if formatting was applied
   */
  applyCellFormatting(cell, rowIndex, colIndex, columns, rules) {
    try {
      // セルの内容を直接取得（DOMベース）
      const cellValue = cell.textContent || cell.innerText || '';
      const columnKey = columns[colIndex]?.key || columns[colIndex]?.dataIndex || colIndex;
      
      // 数値の場合はパース
      const numericValue = parseFloat(cellValue);
      const actualValue = !isNaN(numericValue) ? numericValue : cellValue;
      
      // テーブルAPIを活用した効率的なデータ取得
      const rowData = this.getRowData(rowIndex, columns);
      
      // ルール評価（Rule Engineを使用して複合条件をサポート）
      const matchingRules = this.ruleEngine.evaluateCell(actualValue, rowData, rowIndex, colIndex, columnKey);
      
      // 書式適用
      if (matchingRules.length > 0) {
        this.formatApplier.applyFormatting(cell, matchingRules, actualValue, rowIndex, colIndex);
        return true; // 適用成功
      }
      
      return false; // 適用ルールなし
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error applying cell formatting:', error);
      return false;
    }
  },
  
  /**
   * 効率的な行データ取得（キャッシュ付き）
   * @param {number} rowIndex - Row index
   * @param {Array} columns - Column definitions
   * @returns {Object} Row data object
   */
  getRowData(rowIndex, columns) {
    // 行データキャッシュをチェック
    const cacheKey = `row_${rowIndex}`;
    if (this.rowDataCache && this.rowDataCache.has(cacheKey)) {
      return this.rowDataCache.get(cacheKey);
    }
    
    let rowData = {};
    
    try {
      // 実際のテーブルデータからアクセス（正しいアプローチ）
      const tableData = this.table.state?.filteredData || this.table.state?.data || [];
      if (rowIndex >= 0 && rowIndex < tableData.length) {
        rowData = tableData[rowIndex];
      }
      
      // フォールバック: DOM から取得
      if (!rowData || Object.keys(rowData).length === 0) {
        rowData = this.extractRowDataFromDOM(rowIndex, columns);
      }
      
      // データ型の正規化
      rowData = this.normalizeRowData(rowData, columns);
      
      // キャッシュに保存
      if (!this.rowDataCache) {
        this.rowDataCache = new Map();
      }
      this.rowDataCache.set(cacheKey, rowData);
      
      return rowData;
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error getting row data:', error);
      return {};
    }
  },
  
  /**
   * DOM から行データを抽出（フォールバック用）
   */
  extractRowDataFromDOM(rowIndex, columns) {
    const tbody = this.table.container?.querySelector('tbody');
    if (!tbody) return {};
    
    const rows = tbody.querySelectorAll('tr');
    const row = rows[rowIndex];
    if (!row) return {};
    
    const cells = row.querySelectorAll('td');
    const rowData = {};
    
    cells.forEach((cell, colIndex) => {
      const cellValue = cell.textContent || cell.innerText || '';
      const columnKey = columns[colIndex]?.key || columns[colIndex]?.dataIndex || colIndex;
      rowData[columnKey] = cellValue;
    });
    
    return rowData;
  },
  
  /**
   * 行データの型正規化
   */
  normalizeRowData(rawData, columns) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(rawData)) {
      if (value === null || value === undefined) {
        normalized[key] = '';
        continue;
      }
      
      // 数値変換を試行
      const stringValue = String(value).trim();
      const numericValue = parseFloat(stringValue.replace(/[¥,]/g, ''));
      
      normalized[key] = !isNaN(numericValue) ? numericValue : stringValue;
    }
    
    return normalized;
  },
  
  /**
   * 行データキャッシュをクリア
   */
  clearRowDataCache() {
    if (this.rowDataCache) {
      this.rowDataCache.clear();
    }
  },
  
  /**
   * Simple rule evaluation
   */
  evaluateSimpleRule(rule, value, columnKey) {
    // ターゲット列のチェック
    if (rule.targetColumns && !rule.targetColumns.includes(columnKey)) {
      return false;
    }
    
    // 基本的なルール評価
    if (typeof this.ruleEngine?.evaluateCell === 'function') {
      const result = this.ruleEngine.evaluateCell(value, {}, 0, 0, columnKey);
      return result.some(r => r.rule.id === rule.id);
    }
    
    return false;
  },
  
  /**
   * Apply formatting using improved architecture
   */
  applyFormattingImproved(visibleCells, columns) {
    let cellsProcessed = 0;
    let cellsWithFormatting = 0;
    
    for (const { cell, rowIndex, columnIndex, actualRowIndex } of visibleCells) {
      try {
        // Get cell data - fallback to DOM content if data access fails
        let cellData = this.getCellData(actualRowIndex, columnIndex);
        const rowData = this.getRowData(actualRowIndex);
        const columnKey = columns[columnIndex]?.key || columns[columnIndex]?.dataIndex || columnIndex;
        
        // Improved fallback: use DOM content if data is not available
        const domCellContent = cell.textContent || cell.innerText || '';
        const actualCellData = cellData !== null && cellData !== undefined ? cellData : domCellContent;
        
        // If we couldn't get data from state, try to parse DOM content
        if (cellData === null || cellData === undefined) {
          // Attempt to parse numeric values from DOM
          const numericValue = parseFloat(domCellContent);
          cellData = !isNaN(numericValue) ? numericValue : domCellContent;
        }
        
        // Debug: Log only first cell for verification (reduce console spam)
        
        // Evaluate rules for this cell
        const matchingRules = this.ruleEngine.evaluateCell(
          actualCellData,
          rowData,
          actualRowIndex,
          columnIndex,
          columnKey
        );
        
        // Apply formatting using improved format applier
        if (matchingRules.length > 0) {
          const results = this.formatApplier.applyFormatting(
            cell,
            matchingRules,
            actualCellData,
            actualRowIndex,
            columnIndex
          );
          
          if (results && results.length > 0) {
            cellsWithFormatting++;
          }
        }
        
        cellsProcessed++;
        
      } catch (error) {
      }
    }
    
    return { cellsProcessed, cellsWithFormatting };
  },
  
  /**
   * Apply formatting using legacy architecture
   */
  applyFormattingLegacy(visibleCells, columns) {
    let cellsProcessed = 0;
    let cellsWithFormatting = 0;
    
    visibleCells.forEach(({ cell, rowIndex, columnIndex, actualRowIndex }) => {
      // Get cell data - fallback to DOM content if data access fails
      let cellData = this.getCellData(actualRowIndex, columnIndex);
      const rowData = this.getRowData(actualRowIndex);
      const columnKey = columns[columnIndex]?.key || columns[columnIndex]?.dataIndex || columnIndex;
      
      // Improved fallback: use DOM content if data is not available
      const domCellContent = cell.textContent || cell.innerText || '';
      const actualCellData = cellData !== null && cellData !== undefined ? cellData : domCellContent;
      
      // If we couldn't get data from state, try to parse DOM content
      if (cellData === null || cellData === undefined) {
        // Attempt to parse numeric values from DOM
        const numericValue = parseFloat(domCellContent);
        cellData = !isNaN(numericValue) ? numericValue : domCellContent;
      }
      
      // Evaluate rules for this cell
      const matchingRules = this.ruleEngine.evaluateCell(
        actualCellData,
        rowData,
        actualRowIndex,
        columnIndex,
        columnKey
      );
      
      // Apply formatting
      if (matchingRules.length > 0) {
        this.formatApplier.applyFormatting(
          cell,
          matchingRules,
          actualCellData,
          actualRowIndex,
          columnIndex
        );
        cellsWithFormatting++;
      }
      
      cellsProcessed++;
    });
    
    return { cellsProcessed, cellsWithFormatting };
  },
  
  /**
   * Record performance metrics for legacy architecture
   */
  recordLegacyPerformance(duration, cellsProcessed, cellsWithFormatting) {
    // パフォーマンス統計を蓄積
    if (!this.performanceStats) {
      this.performanceStats = {
        totalRuns: 0,
        totalDuration: 0,
        totalCells: 0,
        maxDuration: 0
      };
    }
    
    this.performanceStats.totalRuns++;
    this.performanceStats.totalDuration += duration;
    this.performanceStats.totalCells += cellsProcessed;
    this.performanceStats.maxDuration = Math.max(this.performanceStats.maxDuration, duration);
  },
  
  // ========================================
  // 改良版ルール管理メソッド
  // ========================================
  
  /**
   * Add a conditional formatting rule (improved)
   */
  addRuleImproved(rule) {
    if (!this.useImprovedArchitecture) {
      // Fallback to legacy method
      return this.addRule(rule);
    }
    
    try {
      // Add rule to state manager
      const addedRule = this.state.addRule(rule);
      
      // Add to rule engine for evaluation
      this.ruleEngine.addRule(rule);
      
      // Save rules
      this.saveRules();
      
      // Emit event
      this.api.emitHook('conditionalFormatting:ruleAdded', { rule: addedRule });
      
      return addedRule;
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error adding rule (improved):', error);
      throw error;
    }
  },
  
  /**
   * Remove a conditional formatting rule (improved)
   */
  removeRuleImproved(ruleId) {
    if (!this.useImprovedArchitecture) {
      // Fallback to legacy method
      return this.removeRule(ruleId);
    }
    
    try {
      // Remove from state manager
      const removed = this.state.removeRule(ruleId);
      
      // Remove from rule engine
      this.ruleEngine.removeRule(ruleId);
      
      // Save rules
      this.saveRules();
      
      // Emit event
      if (removed) {
        this.api.emitHook('conditionalFormatting:ruleRemoved', { ruleId });
      }
      
      return removed;
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error removing rule (improved):', error);
      throw error;
    }
  },
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.useImprovedArchitecture && this.state) {
      return this.state.getStatistics();
    } else {
      return this.performanceStats || {};
    }
  },
  
  /**
   * Undo last operation (improved architecture only)
   */
  undo() {
    if (!this.useImprovedArchitecture || !this.commandManager) {
      return false;
    }
    
    try {
      const result = this.commandManager.undo();
      this.refreshFormatting();
      return result;
    } catch (error) {
      console.error('[ConditionalFormatting] Undo error:', error);
      return false;
    }
  },
  
  /**
   * Redo last undone operation (improved architecture only)
   */
  redo() {
    if (!this.useImprovedArchitecture || !this.commandManager) {
      return false;
    }
    
    try {
      const result = this.commandManager.redo();
      this.refreshFormatting();
      return result;
    } catch (error) {
      console.error('[ConditionalFormatting] Redo error:', error);
      return false;
    }
  },
  
  /**
   * Get visible cells for performance optimization
   * @param {Object} options - Options for cell selection
   * @returns {Array} Array of visible cell objects
   */
  getVisibleCells(options = {}) {
    const {
      forceAll = false,
      startRow = null,
      endRow = null
    } = options;
    
    // If forceAll is true, process all cells (for initial load or refresh)
    if (forceAll) {
      return this.getAllCells();
    }
    
    // Get only visible cells (DOM-based detection)
    const tableContainer = this.table.container;
    const tbody = tableContainer.querySelector('tbody');
    
    if (!tbody) {
      return [];
    }
    
    const rows = tbody.querySelectorAll('tr');
    const visibleCells = [];
    
    rows.forEach((row, domRowIndex) => {
      // Check if row is visible in viewport
      if (this.isElementVisible(row)) {
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, columnIndex) => {
          // Get actual row index from data
          const actualRowIndex = this.getActualRowIndex(domRowIndex);
          
          visibleCells.push({
            cell: cell,
            rowIndex: domRowIndex,
            columnIndex: columnIndex,
            actualRowIndex: actualRowIndex
          });
        });
      }
    });
    
    return visibleCells;
  },
  
  /**
   * Get all cells (fallback for full processing)
   * @returns {Array} Array of all cell objects
   */
  getAllCells() {
    const tableContainer = this.table.container;
    const tbody = tableContainer.querySelector('tbody');
    
    if (!tbody) {
      return [];
    }
    
    const rows = tbody.querySelectorAll('tr');
    const allCells = [];
    
    rows.forEach((row, domRowIndex) => {
      const cells = row.querySelectorAll('td');
      
      cells.forEach((cell, columnIndex) => {
        const actualRowIndex = this.getActualRowIndex(domRowIndex);
        
        allCells.push({
          cell: cell,
          rowIndex: domRowIndex,
          columnIndex: columnIndex,
          actualRowIndex: actualRowIndex
        });
      });
    });
    
    return allCells;
  },
  
  /**
   * Check if element is visible in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if visible
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const tableContainer = this.table.container;
    const containerRect = tableContainer.getBoundingClientRect();
    
    return (
      rect.bottom >= containerRect.top &&
      rect.top <= containerRect.bottom &&
      rect.right >= containerRect.left &&
      rect.left <= containerRect.right
    );
  },
  
  /**
   * Get actual data row index from DOM row index
   * @param {number} domRowIndex - DOM row index
   * @returns {number} Actual data row index
   */
  getActualRowIndex(domRowIndex) {
    // Try to get the actual data index from the processed data
    const processedData = this.getProcessedData();
    
    // For paginated tables, calculate actual row index in processed data
    const pagination = this.table.state?.pagination || this.table.options?.pagination;
    
    if (pagination && pagination.current && pagination.pageSize) {
      const currentPage = pagination.current || 1;
      const pageSize = pagination.pageSize || 10;
      const indexInProcessedData = (currentPage - 1) * pageSize + domRowIndex;
      return indexInProcessedData;
    }
    
    return domRowIndex;
  },
  
  /**
   * Get cell data
   * @param {number} rowIndex - Row index
   * @param {number} columnIndex - Column index
   * @returns {*} Cell data
   */
  getCellData(rowIndex, columnIndex) {
    // Use processed data (filtered/sorted) instead of original data
    const processedData = this.getProcessedData();
    if (processedData && processedData[rowIndex]) {
      const columns = this.table.options.columns || [];
      const columnKey = columns[columnIndex]?.key || columns[columnIndex]?.dataIndex || columnIndex;
      return processedData[rowIndex][columnKey];
    }
    return null;
  },
  
  /**
   * Get currently processed data (filtered/sorted/paginated)
   * @returns {Array} Processed data
   */
  getProcessedData() {
    // Priority order: sortedData > filteredData > data
    if (this.table.state?.sortedData) {
      return this.table.state.sortedData;
    }
    
    if (this.table.state?.filteredData) {
      return this.table.state.filteredData;
    }
    
    if (this.table.state?.data) {
      return this.table.state.data;
    }
    
    // Fallback to original data
    if (this.table.data) {
      return this.table.data;
    }
    
    return [];
  },
  
  /**
   * Get row data
   * @param {number} rowIndex - Row index
   * @returns {Object} Row data
   */
  getRowData(rowIndex) {
    // Use processed data (filtered/sorted) instead of original data
    const processedData = this.getProcessedData();
    return processedData && processedData[rowIndex] ? processedData[rowIndex] : {};
  },
  
  /**
   * Clear all conditional formatting
   */
  clearAllFormatting() {
    if (this.formatApplier) {
      this.formatApplier.clearAllFormatting();
    }
  },
  
  /**
   * 🔄 Complete formatting refresh - the correct design
   * This method implements the proper clear → reapply flow
   */
  refreshAllFormatting() {
    
    if (!this.initialized) {
      return;
    }
    
    // キャッシュクリア（データが変更された可能性があるため）
    this.clearRowDataCache();
    
    // Step 1: Complete clear of all formatting
    this.clearAllFormatting();
    
    // Step 2: Get remaining rules after deletion
    const remainingRules = this.getAllRules();
    
    // Step 3: Reapply with remaining rules
    if (remainingRules.length > 0) {
      // Use the simplified application method
      this.applyFormattingOnce();
    } else {
    }
  },
  
  /**
   * Legacy refresh method - redirects to new implementation
   */
  refreshFormatting() {
    this.refreshAllFormatting();
  },
  
  
  /**
   * Remove a conditional formatting rule
   * @param {string} ruleId - Rule ID to remove
   */
  removeRule(ruleId) {
    try {
      
      const removed = this.ruleEngine.removeRule(ruleId);
      if (removed) {
        
        // Save updated rules
        this.saveRules();
        
        // 🔄 Critical: Complete refresh with remaining rules
        this.refreshAllFormatting();
        
        // Emit event
        this.api.emitHook('conditionalFormatting:ruleRemoved', { ruleId });
        
      } else {
      }
      return removed;
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error removing rule:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing rule
   * @param {string} ruleId - Rule ID to update
   * @param {Object} updates - Updates to apply
   */
  updateRule(ruleId, updates) {
    try {
      this.ruleEngine.updateRule(ruleId, updates);
      this.saveRules();
      this.refreshFormatting();
      
      // Emit event
      this.api.emitHook('conditionalFormatting:ruleUpdated', { ruleId, updates });
      
      
    } catch (error) {
      console.error('[ConditionalFormatting] Error updating rule:', error);
      throw error;
    }
  },
  
  /**
   * Toggle rule enabled/disabled
   * @param {string} ruleId - Rule ID
   */
  toggleRule(ruleId) {
    const rule = this.ruleEngine.rules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      rule.updatedAt = new Date();
      this.saveRules();
      this.refreshFormatting();
      
    }
  },
  
  /**
   * Get all rules
   * @returns {Array} Array of rules
   */
  getAllRules() {
    return this.ruleEngine.getAllRules();
  },
  
  /**
   * Check if a cell has conditional formatting applied
   * @param {Object} cellInfo - Cell information
   * @returns {boolean} Has formatting
   */
  hasConditionalFormatting(cellInfo) {
    const matchingRules = this.ruleEngine.evaluateCell(
      cellInfo.cellValue,
      cellInfo.rowData,
      cellInfo.rowIndex,
      cellInfo.columnIndex,
      cellInfo.column?.key || cellInfo.columnIndex
    );
    
    return matchingRules.length > 0;
  },
  
  /**
   * Remove rules for specific columns
   * @param {Array} columnKeys - Column keys
   */
  removeRulesForColumns(columnKeys) {
    const rules = this.getAllRules();
    const toRemove = [];
    
    rules.forEach(rule => {
      const hasTargetColumn = rule.targetColumns.some(target => 
        columnKeys.includes(target)
      );
      
      if (hasTargetColumn) {
        toRemove.push(rule.id);
      }
    });
    
    toRemove.forEach(ruleId => this.removeRule(ruleId));
    
  },
  
  /**
   * Save rules to storage
   */
  saveRules() {
    if (!this.api.setStorage) return;
    
    const rules = Array.from(this.ruleEngine.rules.values()).map(rule => rule.toJSON());
    this.api.setStorage('conditionalFormattingRules', rules, 'conditional-formatting');
  },
  
  /**
   * Load saved rules from storage
   */
  loadSavedRules() {
    if (!this.api.getStorage) {
      return;
    }
    
    const savedRules = this.api.getStorage('conditionalFormattingRules', 'conditional-formatting');
    
    if (savedRules && Array.isArray(savedRules)) {
      const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
      const { ConditionalFormattingRule } = ConditionalFormattingTypes;
      
      if (!ConditionalFormattingRule) {
        return;
      }
      
      
      savedRules.forEach((ruleData, index) => {
        try {
          const rule = ConditionalFormattingRule.fromJSON(ruleData);
          this.ruleEngine.addRule(rule);
        } catch (error) {
        }
      });
      
      
      // 重要：ルール読み込み後に書式を適用
      setTimeout(() => {
        this.refreshAllFormatting();
      }, 200); // DOM準備を待つ
      
    } else {
    }
  },
  
  /**
   * Export rules for backup/sharing
   * @returns {Array} Exported rules
   */
  exportRules() {
    const rules = Array.from(this.ruleEngine.rules.values()).map(rule => rule.toJSON());
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      rules: rules
    };
  },
  
  /**
   * Import rules from backup/sharing
   * @param {Object} exportData - Exported rules data
   * @param {boolean} replace - Whether to replace existing rules
   */
  importRules(exportData, replace = false) {
    if (!exportData || !exportData.rules) {
      throw new Error('Invalid export data');
    }
    
    if (replace) {
      // Clear existing rules
      this.ruleEngine.rules.clear();
    }
    
    const ConditionalFormattingTypes = window.ConditionalFormattingTypes || {};
    const { ConditionalFormattingRule } = ConditionalFormattingTypes;
    
    if (!ConditionalFormattingRule) {
      throw new Error('ConditionalFormattingRule not available');
    }
    
    let imported = 0;
    
    exportData.rules.forEach(ruleData => {
      try {
        const rule = ConditionalFormattingRule.fromJSON(ruleData);
        this.ruleEngine.addRule(rule);
        imported++;
      } catch (error) {
      }
    });
    
    this.saveRules();
    this.refreshFormatting();
    
    return imported;
  },
  
  /**
   * Get plugin statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      initialized: this.initialized,
      rules: this.ruleEngine ? this.ruleEngine.getStatistics() : null,
      formatting: this.formatApplier ? this.formatApplier.getStatistics() : null,
      version: this.version
    };
  },
  
  /**
   * Get plugin configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      enableContextMenu: true,
      enableQuickFormatting: true,
      cacheEnabled: true,
      autoSaveRules: true,
      maxRules: 100
    };
  },
  
  /**
   * Update plugin configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.getConfig(), ...config };
    
    // Apply configuration changes
    if (this.ruleEngine && 'cacheEnabled' in config) {
      this.ruleEngine.setCacheEnabled(config.cacheEnabled);
    }
  },
  
  /**
   * Plugin cleanup
   */
  destroy() {
    
    // Save rules before cleanup
    if (this.initialized) {
      this.saveRules();
    }
    
    // Clean up event handlers
    if (this.table.container && this.scrollHandler) {
      this.table.container.removeEventListener('scroll', this.scrollHandler);
    }
    
    // Clean up DOM observer
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    
    const paginationContainer = this.table.container?.querySelector('.pagination, .table-pagination');
    if (paginationContainer && this.pageChangeHandler) {
      paginationContainer.removeEventListener('click', this.pageChangeHandler);
    }
    
    // Clean up timers
    clearTimeout(this.formatTimeout);
    clearTimeout(this.scrollTimeout);
    
    // Clean up mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    // Clean up components
    if (this.contextMenuExtension) {
      this.contextMenuExtension.destroy();
    }
    
    if (this.uiManager) {
      this.uiManager.destroy();
    }
    
    if (this.formatApplier) {
      this.formatApplier.destroy();
    }
    
    if (this.ruleEngine) {
      this.ruleEngine.clearCache();
    }
    
    // Stop mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    // Clear timeout
    if (this.formatTimeout) {
      clearTimeout(this.formatTimeout);
    }
    
    // クリーンアップ処理
    this.cleanup();
    
    // Reset state
    this.initialized = false;
  },
  
  /**
   * リソースのクリーンアップ - 統一アプローチ
   */
  cleanup() {
    
    // タイマーをクリア
    clearTimeout(this.refreshTimeout);
    clearTimeout(this.mutationTimeout);
    clearTimeout(this.scrollRefreshTimeout);
    
    // ラップしたメソッドの参照をクリア（元に戻す必要があれば戻す）
    // 実際のプロダクションでは、元のメソッドを保存しておいて復元する
    
  }
};

// Auto-register plugin if PluginSystem is available
if (typeof window !== 'undefined' && window.PluginSystem) {
  // Plugin will be registered when table initializes
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalFormattingPlugin;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingPlugin = ConditionalFormattingPlugin;
}