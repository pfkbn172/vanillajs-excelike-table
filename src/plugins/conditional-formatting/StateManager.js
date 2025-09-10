/**
 * Conditional Formatting State Manager
 * 条件付き書式の状態を中央集権的に管理
 */

class ConditionalFormattingState {
  constructor() {
    // 各種状態の初期化
    this.rules = new Map();           // ルール管理
    this.appliedFormats = new Map();  // 適用済み書式
    this.columnStats = new Map();     // 列統計情報
    this.uiState = new Map();         // UI状態
    this.performanceMetrics = {       // パフォーマンス情報
      totalRuns: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastRun: null
    };
    
    // オブザーバー管理
    this.observers = new Map();
    
    // 状態変更追跡
    this.changeHistory = [];
    this.maxHistorySize = 100;
  }
  
  // ========================================
  // ルール管理
  // ========================================
  
  /**
   * ルールを追加
   */
  addRule(rule) {
    const previousRule = this.rules.get(rule.id);
    this.rules.set(rule.id, rule);
    
    this.recordChange('ruleAdded', { rule, previousRule });
    this.notifyObservers('rulesChanged', { 
      type: 'added', 
      rule, 
      allRules: Array.from(this.rules.values()) 
    });
    
    return rule;
  }
  
  /**
   * ルールを削除
   */
  removeRule(ruleId) {
    const removedRule = this.rules.get(ruleId);
    const success = this.rules.delete(ruleId);
    
    if (success && removedRule) {
      // 関連する適用済み書式も削除
      this.clearFormatsForRule(ruleId);
      
      this.recordChange('ruleRemoved', { rule: removedRule });
      this.notifyObservers('rulesChanged', { 
        type: 'removed', 
        rule: removedRule, 
        allRules: Array.from(this.rules.values()) 
      });
    }
    
    return success;
  }
  
  /**
   * 全ルールを取得
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }
  
  // ========================================
  // 書式管理
  // ========================================
  
  /**
   * 書式を適用
   */
  applyFormat(cellKey, formatData) {
    const previousFormat = this.appliedFormats.get(cellKey);
    this.appliedFormats.set(cellKey, {
      ...formatData,
      appliedAt: new Date(),
      cellKey
    });
    
    this.recordChange('formatApplied', { cellKey, formatData, previousFormat });
    this.notifyObservers('formatChanged', { 
      type: 'applied', 
      cellKey, 
      formatData 
    });
  }
  
  /**
   * 書式をクリア
   */
  clearFormat(cellKey) {
    const removedFormat = this.appliedFormats.get(cellKey);
    const success = this.appliedFormats.delete(cellKey);
    
    if (success && removedFormat) {
      this.recordChange('formatCleared', { cellKey, removedFormat });
      this.notifyObservers('formatChanged', { 
        type: 'cleared', 
        cellKey, 
        removedFormat 
      });
    }
    
    return success;
  }
  
  /**
   * 特定ルールの書式をクリア
   */
  clearFormatsForRule(ruleId) {
    const clearedFormats = [];
    
    for (const [cellKey, format] of this.appliedFormats) {
      if (format.ruleId === ruleId) {
        this.appliedFormats.delete(cellKey);
        clearedFormats.push({ cellKey, format });
      }
    }
    
    if (clearedFormats.length > 0) {
      this.recordChange('formatsCleared', { ruleId, clearedFormats });
      this.notifyObservers('formatChanged', { 
        type: 'bulk-cleared', 
        ruleId, 
        clearedFormats 
      });
    }
    
    return clearedFormats.length;
  }
  
  // ========================================
  // 列統計管理
  // ========================================
  
  /**
   * 列統計を更新
   */
  updateColumnStats(columnKey, stats) {
    const previousStats = this.columnStats.get(columnKey);
    this.columnStats.set(columnKey, {
      ...stats,
      updatedAt: new Date(),
      columnKey
    });
    
    this.recordChange('columnStatsUpdated', { columnKey, stats, previousStats });
    this.notifyObservers('columnStatsChanged', { 
      columnKey, 
      stats, 
      previousStats 
    });
  }
  
  /**
   * 列統計を取得
   */
  getColumnStats(columnKey) {
    return this.columnStats.get(columnKey) || null;
  }
  
  // ========================================
  // パフォーマンス管理
  // ========================================
  
  /**
   * パフォーマンス情報を記録
   */
  recordPerformance(duration, processedCells, cellsWithFormatting) {
    this.performanceMetrics.totalRuns++;
    this.performanceMetrics.totalDuration += duration;
    this.performanceMetrics.averageDuration = 
      this.performanceMetrics.totalDuration / this.performanceMetrics.totalRuns;
    this.performanceMetrics.lastRun = {
      duration,
      processedCells,
      cellsWithFormatting,
      timestamp: new Date()
    };
    
    this.notifyObservers('performanceUpdated', this.performanceMetrics);
  }
  
  // ========================================
  // オブザーバーパターン
  // ========================================
  
  /**
   * オブザーバーを登録
   */
  subscribe(event, callback) {
    if (!this.observers.has(event)) {
      this.observers.set(event, new Set());
    }
    
    this.observers.get(event).add(callback);
    
    // アンサブスクライブ関数を返す
    return () => {
      this.observers.get(event)?.delete(callback);
    };
  }
  
  /**
   * オブザーバーに通知
   */
  notifyObservers(event, data) {
    const callbacks = this.observers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
        }
      });
    }
  }
  
  // ========================================
  // 変更履歴管理
  // ========================================
  
  /**
   * 変更を記録
   */
  recordChange(type, data) {
    const change = {
      type,
      data,
      timestamp: new Date(),
      id: this.generateChangeId()
    };
    
    this.changeHistory.push(change);
    
    // 履歴サイズ制限
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory.shift();
    }
    
    this.notifyObservers('stateChanged', change);
  }
  
  /**
   * 変更履歴を取得
   */
  getChangeHistory(limit = 20) {
    return this.changeHistory.slice(-limit);
  }
  
  /**
   * 変更ID生成
   */
  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ========================================
  // 統計・診断
  // ========================================
  
  /**
   * 状態統計を取得
   */
  getStatistics() {
    return {
      rules: {
        total: this.rules.size,
        enabled: Array.from(this.rules.values()).filter(r => r.enabled).length
      },
      appliedFormats: {
        total: this.appliedFormats.size
      },
      columnStats: {
        total: this.columnStats.size
      },
      performance: this.performanceMetrics,
      memory: {
        changeHistorySize: this.changeHistory.length,
        observersCount: Array.from(this.observers.values()).reduce((sum, set) => sum + set.size, 0)
      }
    };
  }
  
  /**
   * 状態をJSON形式でエクスポート
   */
  exportState() {
    return {
      rules: Array.from(this.rules.entries()),
      appliedFormats: Array.from(this.appliedFormats.entries()),
      columnStats: Array.from(this.columnStats.entries()),
      performanceMetrics: this.performanceMetrics,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 状態をクリア
   */
  clear() {
    this.rules.clear();
    this.appliedFormats.clear();
    this.columnStats.clear();
    this.uiState.clear();
    this.changeHistory.length = 0;
    
    this.notifyObservers('stateCleared', {});
  }
}

// Singletonパターンのインスタンス
let globalStateInstance = null;

/**
 * グローバル状態インスタンスを取得
 */
function getConditionalFormattingState() {
  if (!globalStateInstance) {
    globalStateInstance = new ConditionalFormattingState();
  }
  return globalStateInstance;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConditionalFormattingState, getConditionalFormattingState };
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingState = ConditionalFormattingState;
  window.getConditionalFormattingState = getConditionalFormattingState;
}