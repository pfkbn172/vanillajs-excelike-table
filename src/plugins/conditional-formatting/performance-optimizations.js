/**
 * Conditional Formatting Performance Optimizations
 * DOM操作とメモリ使用量の最適化
 */

(function() {
  'use strict';
  
  // パフォーマンス最適化ユーティリティをグローバルに追加
  window.CF_PERFORMANCE = window.CF_PERFORMANCE || {};
  
  /**
   * バッチDOM操作ユーティリティ
   */
  class BatchDOMOperations {
    constructor() {
      this.operations = [];
      this.rafId = null;
    }
    
    /**
     * DOM操作をキューに追加
     */
    addOperation(element, operation, value) {
      this.operations.push({ element, operation, value });
      this.scheduleUpdate();
    }
    
    /**
     * 複数の属性を一度に設定
     */
    addMultipleAttributes(element, attributes) {
      this.operations.push({ element, operation: 'multipleAttributes', value: attributes });
      this.scheduleUpdate();
    }
    
    /**
     * 更新をスケジュール
     */
    scheduleUpdate() {
      if (this.rafId) return;
      
      this.rafId = requestAnimationFrame(() => {
        this.executeOperations();
        this.rafId = null;
      });
    }
    
    /**
     * キューされた操作を実行
     */
    executeOperations() {
      const fragment = document.createDocumentFragment();
      
      this.operations.forEach(({ element, operation, value }) => {
        switch (operation) {
          case 'addClass':
            element.classList.add(value);
            break;
          case 'removeClass':
            element.classList.remove(value);
            break;
          case 'setAttribute':
            element.setAttribute(value.name, value.value);
            break;
          case 'multipleAttributes':
            Object.entries(value).forEach(([key, val]) => {
              element.setAttribute(key, val);
            });
            break;
          case 'style':
            Object.assign(element.style, value);
            break;
        }
      });
      
      this.operations.length = 0;
    }
    
    /**
     * 強制的に実行
     */
    flush() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.executeOperations();
    }
  }
  
  /**
   * セル検索の最適化されたキャッシュ
   */
  class OptimizedCellCache {
    constructor(maxSize = 1000) {
      this.cache = new Map();
      this.accessOrder = [];
      this.maxSize = maxSize;
    }
    
    /**
     * セル情報を取得（LRUキャッシュ）
     */
    get(container, forceRefresh = false) {
      const key = this.getContainerKey(container);
      
      if (forceRefresh || !this.cache.has(key)) {
        this.refreshCells(container, key);
      }
      
      // LRU更新
      this.updateAccess(key);
      
      return this.cache.get(key);
    }
    
    /**
     * セル情報をリフレッシュ
     */
    refreshCells(container, key) {
      const cells = this.extractCellsWithPosition(container);
      this.cache.set(key, {
        cells,
        timestamp: Date.now(),
        columnCount: this.getColumnCount(container)
      });
      
      this.evictIfNecessary();
    }
    
    /**
     * 位置情報付きでセルを抽出
     */
    extractCellsWithPosition(container) {
      const cells = [];
      const rows = container.querySelectorAll('tbody tr, .table-row');
      
      rows.forEach((row, rowIndex) => {
        const cellElements = row.querySelectorAll('td, .table-cell');
        cellElements.forEach((cell, colIndex) => {
          cells.push({
            element: cell,
            rowIndex,
            colIndex,
            value: this.extractCellValue(cell),
            column: this.getColumnKey(cell, colIndex)
          });
        });
      });
      
      return cells;
    }
    
    /**
     * セル値を抽出（最適化）
     */
    extractCellValue(cell) {
      // data-value属性を優先
      const dataValue = cell.getAttribute('data-value');
      if (dataValue !== null) return dataValue;
      
      // innerTextを使用（innerHTMLより高速）
      return cell.innerText.trim();
    }
    
    /**
     * コンテナキーを生成
     */
    getContainerKey(container) {
      return container.id || container.className || 'default';
    }
    
    /**
     * 列数を取得
     */
    getColumnCount(container) {
      const headerRow = container.querySelector('thead tr, .table-header-row');
      return headerRow ? headerRow.children.length : 0;
    }
    
    /**
     * 列キーを取得
     */
    getColumnKey(cell, colIndex) {
      // data-column属性を最優先
      const dataColumn = cell.getAttribute('data-column');
      if (dataColumn) return dataColumn;
      
      // data-column-key属性
      const columnKey = cell.getAttribute('data-column-key');
      if (columnKey) return columnKey;
      
      // data-key属性
      const dataKey = cell.getAttribute('data-key');
      if (dataKey) return dataKey;
      
      // ヘッダーから列キーを取得
      const table = cell.closest('table');
      if (table) {
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
          const headers = headerRow.querySelectorAll('th');
          if (headers[colIndex]) {
            const headerKey = headers[colIndex].getAttribute('data-key') || 
                            headers[colIndex].getAttribute('data-column');
            if (headerKey) return headerKey;
          }
        }
      }
      
      // フォールバック
      return `col_${colIndex}`;
    }
    
    /**
     * LRUアクセス更新
     */
    updateAccess(key) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }
    
    /**
     * 容量超過時の削除
     */
    evictIfNecessary() {
      while (this.cache.size > this.maxSize) {
        const lru = this.accessOrder.shift();
        this.cache.delete(lru);
      }
    }
    
    /**
     * キャッシュをクリア
     */
    clear() {
      this.cache.clear();
      this.accessOrder.length = 0;
    }
  }
  
  /**
   * ルール評価の最適化キャッシュ
   */
  class RuleEvaluationCache {
    constructor(maxSize = 500) {
      this.cache = new Map();
      this.maxSize = maxSize;
    }
    
    /**
     * 評価結果を取得
     */
    get(ruleId, value, operator) {
      const key = `${ruleId}:${operator}:${value}`;
      return this.cache.get(key);
    }
    
    /**
     * 評価結果を設定
     */
    set(ruleId, value, operator, result) {
      const key = `${ruleId}:${operator}:${value}`;
      
      if (this.cache.size >= this.maxSize) {
        // 最古のエントリを削除
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(key, result);
    }
    
    /**
     * ルール削除時のキャッシュクリア
     */
    clearForRule(ruleId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${ruleId}:`)) {
          this.cache.delete(key);
        }
      }
    }
    
    /**
     * 全クリア
     */
    clear() {
      this.cache.clear();
    }
  }
  
  // グローバルに公開
  window.CF_PERFORMANCE.BatchDOMOperations = BatchDOMOperations;
  window.CF_PERFORMANCE.OptimizedCellCache = OptimizedCellCache;
  window.CF_PERFORMANCE.RuleEvaluationCache = RuleEvaluationCache;
  
})();