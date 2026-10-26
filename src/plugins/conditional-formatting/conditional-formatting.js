(function() {
  'use strict';

  /**
   * Conditional Formatting Plugin - メインクラス
   * シンプルな条件付き書式機能を提供
   */

  // CF_CONSTANTSとCF_UTILSから必要な要素を取得
  const CF_CONSTANTS = globalThis.CF_CONSTANTS || {};
  const CF_UTILS = globalThis.CF_UTILS || {};

  const {
    TIMING,
    DEFAULT_OPTIONS,
    CSS_CLASSES,
    MESSAGES
  } = CF_CONSTANTS;

  const {
    ErrorHandler,
    ValidationUtils,
    PerformanceUtils,
    InitializationHelper
  } = CF_UTILS;

  class ConditionalFormatting {
  constructor(table, options = {}) {
    this.table = table;

    // オプションの統合
    this.options = InitializationHelper.mergeOptions(options, DEFAULT_OPTIONS);

    // テーブルIDベースのストレージキー生成
    const tableId = table.tableId || 'default';
    this.options.storageKey = options.storageKey || `excelike_${tableId}_cf_rules`;
    this.options.autoLoad = options.autoLoad !== false;
    this.options.autoApply = options.autoApply !== false;

    // エラーハンドリングシステム
    this.errorHandler = new ErrorHandler({
      logToConsole: true,
      throwErrors: this.options.throwErrors || false,
      onError: this.options.onError
    });

    // パフォーマンス最適化システム
    this.batchDOM = new (globalThis.CF_PERFORMANCE.BatchDOMOperations)();
    this.cellCache = new (globalThis.CF_PERFORMANCE.OptimizedCellCache)(1000);
    this.evaluationCache = new (globalThis.CF_PERFORMANCE.RuleEvaluationCache)(500);

    // コンポーネント
    this.manager = new globalThis.ConditionalFormattingManager({ storageKey: this.options.storageKey });
    this.evaluator = new globalThis.ConditionalFormattingEvaluator();
    this.applier = new globalThis.ConditionalFormattingApplier();
    this.ui = new globalThis.ConditionalFormattingUI(this, this.table.i18n);

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
      ConditionalFormattingRule: globalThis.ConditionalFormattingRule,
      ConditionalFormattingManager: globalThis.ConditionalFormattingManager,
      ConditionalFormattingEvaluator: globalThis.ConditionalFormattingEvaluator,
      ConditionalFormattingApplier: globalThis.ConditionalFormattingApplier,
      ConditionalFormattingUI: globalThis.ConditionalFormattingUI,
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
   * @param {HTMLElement} cellElement - セル要素
   * @param {string} dataType - データ型 ('text' | 'number' | 'date')
   */
  extractCellValue(cellElement, dataType = 'text') {
    // text型の場合は表示されているテキストをそのまま使う（通貨記号や書式を含む）
    if (dataType === 'text') {
      return cellElement.textContent?.trim() || '';
    }
    
    // number/date型の場合はdata-value属性を優先（生の数値データ）
    if (cellElement.dataset.value !== undefined) {
      return cellElement.dataset.value;
    }
    
    // フォールバック
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

    // 優先度の低い順→高い順でソート（Priority 3→2→1）
    // 最後に適用される Priority 1（最高優先度）が最終的に勝つ
    return rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * ルールをセルに適用（統一的な優先度処理）
   * セルレベルルールも行レベルルールも区別せず、全て各セルに対する条件判定として処理
   * 優先度の低いルールから順に適用し、高い優先度のルールで上書きすることで優先度を実現
   */
  _applyRulesToCells(rules, cells) {
    let totalApplications = 0;

    // rulesは既に優先度低→高順（Priority 3→2→1）にソート済み
    // 後から適用されるPriority 1（最高優先度）が最終的に勝つ
    rules.forEach(rule => {
      cells.forEach(cellInfo => {
        let shouldApply = false;

        // セルレベルルール
        if (rule.applyTo === 'cell' && cellInfo.column === rule.condition.column) {
          const cellValue = this.extractCellValue(cellInfo.element, rule.condition.dataType);
          if (this._evaluateRuleWithCache(cellValue, rule)) {
            shouldApply = true;
          }
        }
        // 行レベルルール
        else if (rule.applyTo === 'row') {
          const rowCells = this._getRowCells(cellInfo.element);
          const triggerCell = rowCells.find(cell => cell.column === rule.condition.column);
          if (triggerCell) {
            const cellValue = this.extractCellValue(triggerCell.element, rule.condition.dataType);
            if (this._evaluateRuleWithCache(cellValue, rule)) {
              shouldApply = true;
            }
          }
        }

        // ルールを適用（後から適用されるルールが前のルールを上書き）
        if (shouldApply) {
          this.applier.applyToCell(cellInfo.element, rule);
          totalApplications++;
        }
      });
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
      
      const rule = new globalThis.ConditionalFormattingRule(config);
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
    globalThis.ConditionalFormatting = ConditionalFormatting;
  }

})();