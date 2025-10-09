(function() {
  'use strict';

  /**
   * Conditional Formatting Plugin - メインクラス
   * シンプルな条件付き書式機能を提供
   */

  // CF_CONSTANTSとCF_UTILSから必要な要素を取得
  const CF_CONSTANTS = window.CF_CONSTANTS || {};
  const CF_UTILS = window.CF_UTILS || {};

  const {
    TIMING,
    DEFAULT_OPTIONS,
    CSS_CLASSES,
    MESSAGES,
    ERROR_TYPES
  } = CF_CONSTANTS;

  const {
    ErrorHandler,
    ValidationUtils,
    DOMUtils,
    PerformanceUtils,
    InitializationHelper
  } = CF_UTILS;

  class ConditionalFormatting {
  constructor(table, options = {}) {
    this.table = table;
    
    // オプションの統合
    this.options = InitializationHelper.mergeOptions(options, DEFAULT_OPTIONS);
    this.options.storageKey = options.storageKey || 'cf_rules';
    this.options.autoLoad = options.autoLoad !== false;
    this.options.autoApply = options.autoApply !== false;
    
    // エラーハンドリングシステム
    this.errorHandler = new ErrorHandler({
      logToConsole: true,
      throwErrors: this.options.throwErrors || false,
      onError: this.options.onError
    });
    
    // パフォーマンス最適化システム
    this.batchDOM = new (window.CF_PERFORMANCE.BatchDOMOperations)();
    this.cellCache = new (window.CF_PERFORMANCE.OptimizedCellCache)(1000);
    this.evaluationCache = new (window.CF_PERFORMANCE.RuleEvaluationCache)(500);
    
    // コンポーネント
    this.manager = new ConditionalFormattingManager({ storageKey: this.options.storageKey });
    this.evaluator = new ConditionalFormattingEvaluator();
    this.applier = new ConditionalFormattingApplier();
    this.ui = new ConditionalFormattingUI(this, this.table.i18n);
    
    this.isInitialized = false;
    
    // デバウンス関数の準備
    this.debouncedApply = PerformanceUtils.debounce(
      () => this.applyRules(), 
      TIMING.MUTATION_DEBOUNCE
    );
    
    this.init();
  }
  
  /**
   * 初期化
   */
  init() {
    if (this.isInitialized) return;
    
    try {
      // 依存関係チェック
      this.validateDependencies();
      
      // 自動読み込み
      if (this.options.autoLoad) {
        this.manager.load();
      }
      
      // テーブルのデータ変更監視
      this.attachTableEvents();
      
      this.isInitialized = true;
      // Conditional Formatting Plugin initialized
      
      // 初期化完了後、保存されたルールを自動適用
      if (this.options.autoApply) {
        // DOM構築を待つため少し遅延
        setTimeout(() => {
          this.applyRules();
        }, TIMING.INITIAL_APPLY_DELAY);
      }
      
    } catch (error) {
      this.errorHandler.handle('initialization', error, { 
        table: !!this.table,
        options: this.options 
      });
      
      if (this.options.throwErrors) {
        throw error;
      }
    }
  }
  
  /**
   * 依存関係の検証
   */
  validateDependencies() {
    const required = {
      ConditionalFormattingRule: window.ConditionalFormattingRule,
      ConditionalFormattingManager: window.ConditionalFormattingManager,
      ConditionalFormattingEvaluator: window.ConditionalFormattingEvaluator,
      ConditionalFormattingApplier: window.ConditionalFormattingApplier,
      ConditionalFormattingUI: window.ConditionalFormattingUI,
      table: this.table
    };
    
    InitializationHelper.checkDependencies(required);
  }
  
  /**
   * テーブルイベントの監視
   */
  attachTableEvents() {
    if (!this.table.container) return;
    
    try {
      // データ変更時の自動適用(可能であれば)
      if (this.options.autoApply && typeof this.table.on === 'function') {
        this.table.on('dataChanged', () => {
          this.debouncedApply();
        });
      }
      
      // DOM変更の監視
      this.observeTableChanges();
      
    } catch (error) {
      this.errorHandler.handle('attachTableEvents', error, {
        hasContainer: !!this.table.container,
        hasOnMethod: typeof this.table.on === 'function'
      });
    }
  }
  
  /**
   * テーブルの変更を監視
   */
  observeTableChanges() {
    if (!this.table.container || typeof MutationObserver === 'undefined') return;
    
    try {
      this.observer = new MutationObserver((mutations) => {
        let shouldReapply = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 新しいセルが追加された可能性
            const hasNewCells = Array.from(mutation.addedNodes).some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.classList.contains('table-cell') || node.querySelector('.table-cell'))
            );
            
            if (hasNewCells) {
              shouldReapply = true;
                      // セルキャッシュをクリア
              this.cellCache.clear();
              this.evaluationCache.clear();
            }
          }
        });
        
        if (shouldReapply && this.options.autoApply) {
          this.debouncedApply();
        }
      });
      
      this.observer.observe(this.table.container, {
        childList: true,
        subtree: true
      });
      
      // 初期データがすでに存在する場合のための遅延適用
      if (this.options.autoApply) {
        setTimeout(() => {
          const cells = this.findTableCells();
          if (cells.length > 0) {
            // Applying initial conditional formatting rules to existing data
            this.applyRules();
          }
        }, TIMING.REAPPLY_DELAY);
      }
      
    } catch (error) {
      this.errorHandler.handle('observeTableChanges', error, {
        hasMutationObserver: typeof MutationObserver !== 'undefined'
      });
    }
  }
  
  /**
   * テーブルのセル要素を検索（最適化されたキャッシュ付き）
   */
  findTableCells(forceRefresh = false) {
    if (!this.table.container) {
      return [];
    }
    
    const cached = this.cellCache.get(this.table.container, forceRefresh);
    return cached ? cached.cells : [];
  }
  
  /**
   * セル情報を抽出（責任分離）
   */
  extractCellInfo(cellElement) {
    return this.extractCellInfoFromElement(cellElement);
  }
  
  /**
   * セル要素から情報を抽出
   */
  extractCellInfoFromElement(cellElement) {
    try {
      // data属性から列情報を取得
      const columnKey = cellElement.dataset.column || cellElement.dataset.key;
      
      if (!columnKey) return null;
      
      // セルの値を取得
      let value = this.extractCellValue(cellElement);
      
      return {
        element: cellElement,
        column: columnKey,
        value: value
      };
      
    } catch (error) {
      this.errorHandler.handle('extractCellInfo', error, {
        hasDataset: !!cellElement.dataset,
        tagName: cellElement.tagName
      });
      return null;
    }
  }
  
  /**
   * セルの値を抽出
   */
  extractCellValue(cellElement) {
    // data-value属性があればそれを優先
    if (cellElement.dataset.value !== undefined) {
      return cellElement.dataset.value;
    }
    
    // テキストコンテンツを取得
    return cellElement.textContent?.trim() || '';
  }
  
  /**
   * テーブルのセル情報を取得（最適化版）
   */
  getTableCells() {
    try {
      const cellsData = this.cellCache.get(this.table.container);
      if (!cellsData) return [];
      
      return cellsData.cells.map(cellData => ({
        element: cellData.element,
        column: cellData.column,
        value: cellData.value
      })).filter(cellInfo => cellInfo.column); // 有効な列情報のみ
      
    } catch (error) {
      this.errorHandler.handle('getTableCells', error, {
        containerExists: !!this.table.container
      });
      return [];
    }
  }
  
  /**
   * ルールを適用 - 優先度低順→高順上書き方式（最適化版）
   */
  applyRules() {
    try {
      this.clearAllFormatting();
      
      const rules = this._getValidSortedRules();
      if (!rules) return this.errorHandler.success({ applied: 0, message: 'Invalid rules detected' });
      
      if (rules.length === 0) {
        return this.errorHandler.success({ applied: 0, message: 'No rules to apply' });
      }
      
      const cells = this.getTableCells();
      if (cells.length === 0) {
        return this.errorHandler.success({ applied: 0, message: 'No cells found' });
      }
      
      
      const totalApplications = this._applyRulesToCells(rules, cells);
      
      // バッチDOM操作を完了
      this.batchDOM.flush();
      
      return this.errorHandler.success({ 
        applied: totalApplications, 
        rules: rules.length,
        message: `Conditional formatting applied to ${totalApplications} cells using ${rules.length} rules`
      });
      
    } catch (error) {
      return this.errorHandler.handle('applyRules', error, {
        rulesCount: this.manager.getAllRules().length,
        containerExists: !!this.table.container
      });
    }
  }
  
  /**
   * 有効なルールを取得・検証・ソート
   */
  _getValidSortedRules() {
    const rules = this.manager.getAllRules(true);
    
    // 無効なルールの検出
    const invalidRules = rules.filter(rule => 
      rule.condition.column.startsWith('column_'));
    if (invalidRules.length > 0) {
      return null; // 無効なルールが検出された
    }
    
    // 優先度の高い順でソート（数値が小さいほど高優先度、後で適用されて勝つ）
    return rules.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * ルールをセルに適用（優先度競合解決版）
   */
  _applyRulesToCells(rules, cells) {
    let totalApplications = 0;
    
    // セル単位の最終的な書式を決定するマップ
    const cellFormatMap = new Map();
    
    // Phase 1: 全ルールを評価してセルごとの最高優先度ルールを特定
    cells.forEach(cellInfo => {
      const cellKey = this._getCellKey(cellInfo.element);
      const applicableRules = [];
      
      rules.forEach(rule => {
        // 直接マッチング（セル対象）
        if (rule.applyTo === 'cell' && cellInfo.column === rule.condition.column) {
          if (this._evaluateRuleWithCache(cellInfo.value, rule)) {
            applicableRules.push({ rule, type: 'cell', targetCell: cellInfo });
          }
        }
        // 行レベルマッチング（他の列の値を評価して行全体に適用）
        else if (rule.applyTo === 'row') {
          const rowCells = this._getRowCells(cellInfo.element);
          const triggerCell = rowCells.find(cell => cell.column === rule.condition.column);
          if (triggerCell && this._evaluateRuleWithCache(triggerCell.value, rule)) {
            applicableRules.push({ rule, type: 'row', targetCell: cellInfo });
          }
        }
      });
      
      // 最高優先度のルールを選択（priority値が小さいほど高優先度）
      if (applicableRules.length > 0) {
        const bestRule = applicableRules.sort((a, b) => a.rule.priority - b.rule.priority)[0];
        cellFormatMap.set(cellKey, bestRule);
      }
    });
    
    // Phase 2: 決定されたルールを適用
    cellFormatMap.forEach((ruleData, cellKey) => {
      const { rule, targetCell } = ruleData;
      this.applier.applyCellFormat(targetCell.element, rule);
      totalApplications++;
    });
    
    return totalApplications;
  }
  
  /**
   * セルの一意キーを生成
   */
  _getCellKey(cellElement) {
    const row = cellElement.closest('tr');
    const rowIndex = row ? Array.from(row.parentNode.children).indexOf(row) : 0;
    const cellIndex = Array.from(row.children).indexOf(cellElement);
    return `${rowIndex}-${cellIndex}`;
  }
  
  /**
   * 行内の全セル情報を取得
   */
  _getRowCells(cellElement) {
    const row = cellElement.closest('tr');
    if (!row) return [];
    
    const cells = Array.from(row.children);
    return cells.map(cell => this.extractCellInfoFromElement(cell)).filter(info => info !== null);
  }
  
  /**
   * キャッシュ付きルール評価
   */
  _evaluateRuleWithCache(value, rule) {
    const cached = this.evaluationCache.get(
      rule.id, value, rule.condition.operator);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const result = this.evaluator.evaluate(value, rule);
    this.evaluationCache.set(rule.id, value, rule.condition.operator, result);
    
    return result;
  }
  
  /**
   * 管理画面を表示
   */
  showManagementScreen() {
    try {
      return this.ui.showManagementScreen();
    } catch (error) {
      return this.errorHandler.handle('showManagementScreen', error);
    }
  }
  
  /**
   * 古いルールをすべてクリア(デバッグ用)
   */
  clearAllRules() {
    try {
      // Clearing all conditional formatting rules
      this.manager.clear();
      this.clearAllFormatting();
      // All rules cleared successfully
      return this.errorHandler.success({ message: MESSAGES.RULES_APPLIED });
    } catch (error) {
      return this.errorHandler.handle('clearAllRules', error);
    }
  }
  
  /**
   * 新規ルール作成ダイアログを表示
   */
  showCreateDialog() {
    try {
      return this.ui.showRuleDialog();
    } catch (error) {
      return this.errorHandler.handle('showCreateDialog', error);
    }
  }
  
  /**
   * ルール編集ダイアログを表示
   */
  showEditDialog(ruleId) {
    try {
      const rule = this.manager.getRule(ruleId);
      if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }
      
      return this.ui.showRuleDialog(rule);
    } catch (error) {
      return this.errorHandler.handle('showEditDialog', error, { ruleId });
    }
  }
  
  /**
   * すべての書式をクリア
   */
  clearAllFormatting() {
    try {
      if (this.table.container) {
        this.applier.clearAll(this.table.container);
      }
    } catch (error) {
      this.errorHandler.handle('clearAllFormatting', error);
    }
  }
  
  /**
   * 特定のルールで適用された書式をクリア
   */
  clearRuleFormatting(ruleId) {
    try {
      if (this.table.container) {
        this.applier.clearByRule(this.table.container, ruleId);
      }
    } catch (error) {
      this.errorHandler.handle('clearRuleFormatting', error, { ruleId });
    }
  }
  
  /**
   * テーブルの列情報を取得
   */
  getTableColumns() {
    try {
      if (!this.table.options || !this.table.options.columns) {
        throw new Error('Table options or columns not found. Cannot get column information.');
      }
      
      return this.table.options.columns;
    } catch (error) {
      this.errorHandler.handle('getTableColumns', error);
      return [];
    }
  }
  
  /**
   * ルール作成
   */
  createRule(config) {
    try {
      ValidationUtils.validateRuleName(config.name);
      
      const rule = new ConditionalFormattingRule(config);
      const success = this.manager.addRule(rule);
      
      if (success && this.options.autoApply) {
        this.applyRules();
      }
      
      return success ? this.errorHandler.success(rule) : 
        this.errorHandler.handle('createRule', new Error('Failed to add rule'), { config });
      
    } catch (error) {
      return this.errorHandler.handle('createRule', error, { config });
    }
  }
  
  /**
   * ルール更新
   */
  updateRule(ruleId, updates) {
    try {
      if (updates.name) {
        ValidationUtils.validateRuleName(updates.name);
      }
      
      const success = this.manager.updateRule(ruleId, updates);
      
      if (success && this.options.autoApply) {
        this.applyRules();
      }
      
      return success ? this.errorHandler.success({ updated: true }) :
        this.errorHandler.handle('updateRule', new Error('Failed to update rule'), { ruleId, updates });
      
    } catch (error) {
      return this.errorHandler.handle('updateRule', error, { ruleId, updates });
    }
  }
  
  /**
   * ルール削除
   */
  deleteRule(ruleId) {
    try {
      // 適用済みの書式をクリア
      this.clearRuleFormatting(ruleId);
      
      const success = this.manager.removeRule(ruleId);
      
      if (success && this.options.autoApply) {
        this.applyRules();
      }
      
      return success ? this.errorHandler.success({ deleted: true }) :
        this.errorHandler.handle('deleteRule', new Error('Failed to delete rule'), { ruleId });
      
    } catch (error) {
      return this.errorHandler.handle('deleteRule', error, { ruleId });
    }
  }
  
  /**
   * ルール一覧取得
   */
  getRules(enabledOnly = false) {
    try {
      return this.errorHandler.success(this.manager.getAllRules(enabledOnly));
    } catch (error) {
      return this.errorHandler.handle('getRules', error, { enabledOnly });
    }
  }
  
  /**
   * ルール取得
   */
  getRule(ruleId) {
    try {
      const rule = this.manager.getRule(ruleId);
      return rule ? this.errorHandler.success(rule) :
        this.errorHandler.handle('getRule', new Error('Rule not found'), { ruleId });
    } catch (error) {
      return this.errorHandler.handle('getRule', error, { ruleId });
    }
  }
  
  /**
   * 統計情報取得
   */
  getStats() {
    try {
      const stats = {
        rules: this.manager.getStats(),
        appliedCells: this.table.container?.querySelectorAll(`.${CSS_CLASSES.FORMATTED}`).length || 0
      };
      return this.errorHandler.success(stats);
    } catch (error) {
      return this.errorHandler.handle('getStats', error);
    }
  }
  
  /**
   * 設定更新
   */
  updateOptions(newOptions) {
    try {
      this.options = InitializationHelper.mergeOptions(this.options, newOptions);
      
      // ストレージキーが変更された場合
      if (newOptions.storageKey && this.manager.storageKey !== newOptions.storageKey) {
        this.manager.storageKey = newOptions.storageKey;
        
        if (this.options.autoLoad) {
          this.manager.load();
          if (this.options.autoApply) {
            this.applyRules();
          }
        }
      }
      
      return this.errorHandler.success({ updated: true });
    } catch (error) {
      return this.errorHandler.handle('updateOptions', error, { newOptions });
    }
  }
  
  /**
   * リソースのクリーンアップ（改良版）
   */
  destroy() {
    try {
      // MutationObserver の停止
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      // パフォーマンス最適化システムのクリーンアップ
      if (this.batchDOM) {
        this.batchDOM.flush(); // 保留中の操作を完了
      }
      
      if (this.cellCache) {
        this.cellCache.clear();
      }
      
      if (this.evaluationCache) {
        this.evaluationCache.clear();
      }
      
      // 適用済み書式のクリア
      this.clearAllFormatting();
      
      // UIのクリーンアップ
      if (this.ui) {
        this.ui.closeAllModals();
      }
      
      this.isInitialized = false;
      
      return this.errorHandler.success({ destroyed: true });
      
    } catch (error) {
      return this.errorHandler.handle('destroy', error);
    }
  }
  }

  // グローバルに公開
  if (typeof window !== 'undefined') {
    window.ConditionalFormatting = ConditionalFormatting;
  }

})();