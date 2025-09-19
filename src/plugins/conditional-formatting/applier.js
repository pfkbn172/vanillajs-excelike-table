/**
 * Conditional Formatting Applier - 書式適用エンジン
 * DOM要素への書式適用とクリア処理を行う
 */
class ConditionalFormattingApplier {
  constructor() {
    this.cssClassName = 'cf-formatted';
    this.attributeName = 'data-cf-rule-id';
  }
  
  /**
   * セルに書式を適用（既存書式を確実にクリアしてから適用）
   * @param {HTMLElement} cellElement セル要素
   * @param {ConditionalFormattingRule} rule 適用するルール
   */
  applyToCell(cellElement, rule) {
    if (!cellElement || !rule) {
      // Missing parameters - silently return
      return;
    }
    
    try {
      if (rule.applyTo === 'row') {
        // 行全体に適用
        this.applyToRow(cellElement, rule);
      } else {
        // セルのみに適用
        this.applyCellFormat(cellElement, rule);
      }
      
    } catch (error) {
      // Format application error - continue silently
    }
  }
  
  /**
   * セルのみに書式を適用
   * @param {HTMLElement} cellElement セル要素
   * @param {ConditionalFormattingRule} rule 適用するルール
   */
  applyCellFormat(cellElement, rule) {
    // 書式を直接上書き適用（クリア不要）
    this._applyFormat(cellElement, rule.format);
    
    // メタデータを設定
    cellElement.classList.add(this.cssClassName);
    cellElement.setAttribute(this.attributeName, rule.id);
    cellElement.setAttribute('data-cf-apply-to', 'cell');
  }
  
  /**
   * 行全体に書式を適用
   * @param {HTMLElement} cellElement 条件にマッチしたセル要素
   * @param {ConditionalFormattingRule} rule 適用するルール
   */
  applyToRow(cellElement, rule) {
    // 行要素を取得
    const rowElement = cellElement.closest('tr') || 
                      cellElement.closest('.table-row') || 
                      cellElement.parentElement;
    
    if (!rowElement) {
      // Row element not found - return silently
      return;
    }
    
    // 行内の全セルを取得
    const cells = rowElement.querySelectorAll('td') ||
                  rowElement.querySelectorAll('.table-cell') ||
                  rowElement.children;
    
    if (cells.length === 0) {
      // No cells found in row - return silently
      return;
    }
    
    // 行内の全セルに書式を適用（直接上書き）
    Array.from(cells).forEach(cell => {
      this._applyFormat(cell, rule.format);
      
      // メタデータを設定
      cell.classList.add(this.cssClassName);
      cell.classList.add('cf-row-formatted');
      cell.setAttribute(this.attributeName, rule.id);
      cell.setAttribute('data-cf-apply-to', 'row');
    });
  }
  
  /**
   * 書式の実際の適用
   * @param {HTMLElement} element 対象要素
   * @param {Object} format 書式設定
   */
  _applyFormat(element, format) {
    const style = element.style;
    
    // 背景色
    if (format.backgroundColor) {
      style.setProperty('background-color', format.backgroundColor, 'important');
    }
    
    // 文字色（デフォルトで黒を明示的に設定）
    const textColor = format.color || '#000000';
    style.setProperty('color', textColor, 'important');
    
    // フォントスタイル
    if (format.fontWeight) {
      style.setProperty('font-weight', 'bold', 'important');
    }
    
    if (format.fontStyle) {
      style.setProperty('font-style', 'italic', 'important');
    }
    
    if (format.textDecoration) {
      style.setProperty('text-decoration', 'underline', 'important');
    }
  }
  
  /**
   * セルから条件付き書式をクリア
   * @param {HTMLElement} cellElement セル要素
   */
  clearCell(cellElement) {
    if (!cellElement) {
      return;
    }
    
    try {
      // CSSクラスを削除
      cellElement.classList.remove(this.cssClassName);
      cellElement.classList.remove('cf-row-formatted');
      
      // 属性を削除
      cellElement.removeAttribute(this.attributeName);
      cellElement.removeAttribute('data-cf-apply-to');
      
      // スタイルをクリア
      this._clearFormat(cellElement);
      
    } catch (error) {
      // Format clear error - continue silently
    }
  }
  
  /**
   * 書式の実際のクリア
   * @param {HTMLElement} element 対象要素
   */
  _clearFormat(element) {
    const style = element.style;
    
    // 条件付き書式で設定されたスタイルのみクリア (!important対応)
    style.removeProperty('background-color');
    style.removeProperty('color');
    style.removeProperty('font-weight');
    style.removeProperty('font-style');
    style.removeProperty('text-decoration');
  }
  
  /**
   * テーブル全体から条件付き書式をクリア
   * @param {HTMLElement} tableElement テーブル要素
   */
  clearAll(tableElement) {
    if (!tableElement) {
      return;
    }
    
    try {
      // 条件付き書式が適用されたすべてのセルをクリア
      const formattedCells = tableElement.querySelectorAll(`.${this.cssClassName}`);
      formattedCells.forEach(cell => this.clearCell(cell));
      
      // 行書式クラスが残っている可能性があるセルもクリア
      const rowFormattedCells = tableElement.querySelectorAll('.cf-row-formatted');
      rowFormattedCells.forEach(cell => this.clearCell(cell));
      
    } catch (error) {
      // All format clear error - continue silently
    }
  }
  
  /**
   * 特定のルールで書式設定されたセルをクリア
   * @param {HTMLElement} tableElement テーブル要素
   * @param {string} ruleId ルールID
   */
  clearByRule(tableElement, ruleId) {
    if (!tableElement || !ruleId) {
      return;
    }
    
    try {
      const selector = `.${this.cssClassName}[${this.attributeName}="${ruleId}"]`;
      const cells = tableElement.querySelectorAll(selector);
      cells.forEach(cell => this.clearCell(cell));
      
    } catch (error) {
      // Rule-specific format clear error - continue silently
    }
  }
  
  /**
   * セルが条件付き書式適用済みかチェック
   * @param {HTMLElement} cellElement セル要素
   * @returns {boolean} 適用済みかどうか
   */
  isFormatted(cellElement) {
    return cellElement && cellElement.classList.contains(this.cssClassName);
  }
  
  /**
   * セルに適用されているルールIDを取得
   * @param {HTMLElement} cellElement セル要素
   * @returns {string|null} ルールID
   */
  getAppliedRuleId(cellElement) {
    if (!cellElement) {
      return null;
    }
    
    return cellElement.getAttribute(this.attributeName);
  }
  
  /**
   * 書式のプレビュー表示
   * @param {HTMLElement} previewElement プレビュー要素
   * @param {Object} format 書式設定
   */
  previewFormat(previewElement, format) {
    if (!previewElement) {
      return;
    }
    
    try {
      // 既存スタイルをリセット
      this._clearFormat(previewElement);
      
      // プレビュー書式を適用
      this._applyFormat(previewElement, format);
      
    } catch (error) {
      // Preview error - continue silently
    }
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.ConditionalFormattingApplier = ConditionalFormattingApplier;
}