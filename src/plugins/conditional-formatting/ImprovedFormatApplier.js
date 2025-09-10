/**
 * Improved Format Applier
 * Strategy PatternとState Managementを活用した改良版
 */

class ImprovedFormatApplier {
  constructor(tableContainer, config, utils, stateManager) {
    this.tableContainer = tableContainer;
    this.config = config;
    this.utils = utils;
    this.state = stateManager;
    
    // Strategy Pattern: フォーマッターを登録
    this.formatters = new Map();
    this.registerFormatters();
    
    // パフォーマンス追跡
    this.performanceTracker = new PerformanceTracker();
    
    // エラーハンドラー
    this.errorHandler = new FormattingErrorHandler();
    
    this.initializeStylesheet();
    this.setupObservers();
  }
  
  /**
   * フォーマッターを登録
   */
  registerFormatters() {
    const formatters = [
      new DataBarFormatter(this.config, this.utils),
      new ColorScaleFormatter(this.config, this.utils),
      new IconSetFormatter(this.config, this.utils)
    ];
    
    formatters.forEach(formatter => {
      this.formatters.set(formatter.constructor.name, formatter);
    });
  }
  
  /**
   * オブザーバーを設定
   */
  setupObservers() {
    // 状態変更の監視
    this.state.subscribe('rulesChanged', (data) => {
      this.onRulesChanged(data);
    });
    
    this.state.subscribe('columnStatsChanged', (data) => {
      this.onColumnStatsChanged(data);
    });
  }
  
  /**
   * メイン書式適用メソッド
   */
  async applyFormatting(cellElement, matchingRules, cellData, rowIndex, columnIndex) {
    const startTime = performance.now();
    const cellKey = this.generateCellKey(rowIndex, columnIndex);
    
    try {
      // 既存書式のクリーンアップ
      await this.clearCellFormatting(cellElement);
      
      // 書式適用結果を格納
      const results = [];
      
      // 各ルールに対して適切なフォーマッターを選択・実行
      for (const { rule, format } of matchingRules) {
        const result = await this.applySpecificFormat(
          cellElement, 
          format, 
          cellData, 
          rowIndex, 
          columnIndex
        );
        
        if (result.success) {
          results.push({
            ruleId: rule.id,
            formatType: format.type,
            result: result.result
          });
        } else {
          // エラーハンドリング
          this.errorHandler.handleFormatError(rule, format, result.error);
        }
      }
      
      // 状態管理への記録
      if (results.length > 0) {
        this.state.applyFormat(cellKey, {
          ruleIds: results.map(r => r.ruleId),
          formats: results,
          cellData,
          rowIndex,
          columnIndex
        });
      }
      
      // パフォーマンス記録
      const duration = performance.now() - startTime;
      this.performanceTracker.record(duration, 1, results.length);
      
      return results;
      
    } catch (error) {
      this.errorHandler.handleCriticalError(error, {
        cellKey,
        cellData,
        rowIndex,
        columnIndex
      });
      throw error;
    }
  }
  
  /**
   * 特定の書式を適用
   */
  async applySpecificFormat(cellElement, format, cellData, rowIndex, columnIndex) {
    // 適切なフォーマッターを選択
    const formatter = this.findFormatter(format.type);
    
    if (!formatter) {
      throw new Error(`未対応の書式タイプ: ${format.type}`);
    }
    
    // 列統計が必要な場合は取得
    const columnKey = this.getColumnKey(columnIndex);
    let columnStats = this.state.getColumnStats(columnKey);
    
    if (!columnStats || this.isStatsOutdated(columnStats)) {
      columnStats = await this.calculateColumnStats(columnKey, columnIndex);
      this.state.updateColumnStats(columnKey, columnStats);
    }
    
    // フォーマッターで書式適用
    return await formatter.safeApply(cellElement, format, cellData, columnStats);
  }
  
  /**
   * フォーマッターを検索
   */
  findFormatter(formatType) {
    for (const formatter of this.formatters.values()) {
      if (formatter.canHandle(formatType)) {
        return formatter;
      }
    }
    return null;
  }
  
  /**
   * 列統計を計算
   */
  async calculateColumnStats(columnKey, columnIndex) {
    // テーブルから列データを抽出
    const columnData = this.extractColumnData(columnIndex);
    
    // 基本統計を計算
    const baseFormatter = Array.from(this.formatters.values())[0];
    const stats = baseFormatter.getRequiredStats(columnData);
    
    return {
      ...stats,
      columnKey,
      dataType: this.utils.detectColumnType(columnData.slice(0, 10)), // サンプリング
      totalRows: columnData.length,
      calculatedAt: new Date()
    };
  }
  
  /**
   * 列データを抽出
   */
  extractColumnData(columnIndex) {
    const table = this.tableContainer.querySelector('table');
    if (!table) return [];
    
    const cells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);
    return Array.from(cells).map(cell => cell.textContent || cell.innerText || '');
  }
  
  /**
   * セル書式をクリア
   */
  async clearCellFormatting(cellElement) {
    const cellKey = this.getCellKeyFromElement(cellElement);
    const appliedFormat = this.state.appliedFormats.get(cellKey);
    
    if (!appliedFormat) return;
    
    // 各フォーマッターでクリーンアップ
    for (const formatter of this.formatters.values()) {
      try {
        formatter.cleanup(cellElement);
      } catch (error) {
      }
    }
    
    // 状態から削除
    this.state.clearFormat(cellKey);
    
    // DOM操作
    this.resetCellAppearance(cellElement);
  }
  
  /**
   * セル外観をリセット
   */
  resetCellAppearance(cellElement) {
    const stylesToReset = [
      'backgroundColor', 'color', 'fontWeight', 'fontStyle', 
      'textDecoration', 'border', 'borderRadius', 'opacity', 'transform'
    ];
    
    stylesToReset.forEach(property => {
      cellElement.style[property] = '';
    });
    
    cellElement.classList.remove('conditional-formatting-applied');
  }
  
  /**
   * 全書式をクリア
   */
  async clearAllFormatting() {
    const startTime = performance.now();
    let clearedCount = 0;
    
    try {
      // 全適用済み書式を取得
      const appliedFormats = Array.from(this.state.appliedFormats.keys());
      
      for (const cellKey of appliedFormats) {
        const cellElement = this.findCellByKey(cellKey);
        if (cellElement) {
          await this.clearCellFormatting(cellElement);
          clearedCount++;
        }
      }
      
      // 状態をクリア
      this.state.appliedFormats.clear();
      
      const duration = performance.now() - startTime;
      
    } catch (error) {
      this.errorHandler.handleCriticalError(error, { operation: 'clearAll' });
      throw error;
    }
  }
  
  // ========================================
  // イベントハンドラー
  // ========================================
  
  /**
   * ルール変更時の処理
   */
  onRulesChanged(data) {
    if (data.type === 'removed') {
      // 削除されたルールの書式をクリア
      this.clearFormatsForRule(data.rule.id);
    } else if (data.type === 'updated') {
      // 更新されたルールを再適用
      this.reapplyFormatsForRule(data.rule.id);
    }
  }
  
  /**
   * 列統計変更時の処理
   */
  onColumnStatsChanged(data) {
    // 該当列の書式を再計算
    this.recalculateColumnFormats(data.columnKey);
  }
  
  // ========================================
  // ユーティリティメソッド
  // ========================================
  
  generateCellKey(rowIndex, columnIndex) {
    return `${rowIndex}-${columnIndex}`;
  }
  
  getCellKeyFromElement(cellElement) {
    // DOM要素から行・列インデックスを取得してキーを生成
    const row = cellElement.closest('tr');
    const rowIndex = Array.from(row.parentElement.children).indexOf(row);
    const columnIndex = Array.from(row.children).indexOf(cellElement);
    return this.generateCellKey(rowIndex, columnIndex);
  }
  
  getColumnKey(columnIndex) {
    return `column-${columnIndex}`;
  }
  
  isStatsOutdated(stats, maxAgeMs = 60000) { // 1分でタイムアウト
    return Date.now() - new Date(stats.calculatedAt).getTime() > maxAgeMs;
  }
  
  findCellByKey(cellKey) {
    const [rowIndex, columnIndex] = cellKey.split('-').map(Number);
    const table = this.tableContainer.querySelector('table');
    if (!table) return null;
    
    const row = table.querySelector(`tbody tr:nth-child(${rowIndex + 1})`);
    if (!row) return null;
    
    return row.querySelector(`td:nth-child(${columnIndex + 1})`);
  }
}

// ========================================
// 補助クラス
// ========================================

/**
 * パフォーマンス追跡
 */
class PerformanceTracker {
  constructor() {
    this.metrics = {
      totalOperations: 0,
      totalDuration: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Infinity
    };
  }
  
  record(duration, cellsProcessed, cellsFormatted) {
    this.metrics.totalOperations++;
    this.metrics.totalDuration += duration;
    this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.totalOperations;
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, duration);
    this.metrics.minDuration = Math.min(this.metrics.minDuration, duration);
  }
  
  getStats() {
    return { ...this.metrics };
  }
}

/**
 * エラーハンドラー
 */
class FormattingErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }
  
  handleFormatError(rule, format, error) {
    const errorInfo = {
      timestamp: new Date(),
      rule: rule?.id,
      formatType: format?.type,
      error: error.message,
      level: 'warning'
    };
    
    this.logError(errorInfo);
  }
  
  handleCriticalError(error, context) {
    const errorInfo = {
      timestamp: new Date(),
      context,
      error: error.message,
      stack: error.stack,
      level: 'critical'
    };
    
    this.logError(errorInfo);
    console.error(`[重大エラー] 書式適用:`, error, context);
  }
  
  logError(errorInfo) {
    this.errorLog.push(errorInfo);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }
  
  getErrorLog() {
    return [...this.errorLog];
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImprovedFormatApplier;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingImprovedFormatApplier = ImprovedFormatApplier;
}