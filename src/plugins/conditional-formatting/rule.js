/**
 * Conditional Formatting Rule - データ構造定義
 * シンプル設計版 - 単一セル条件のみサポート
 */
class ConditionalFormattingRule {
  constructor(config = {}) {
    this.id = config.id || this._generateId();
    this.name = config.name || '';
    this.enabled = config.enabled !== false;
    this.priority = config.priority || 0;
    this.created = config.created || Date.now();
    this.modified = Date.now();
    
    // 条件設定
    this.condition = {
      column: config.condition?.column || '',
      operator: config.condition?.operator || 'equals',
      value: config.condition?.value || '',
      dataType: config.condition?.dataType || 'text'
    };
    
    // 適用範囲設定
    this.applyTo = config.applyTo || 'cell'; // 'cell' または 'row'
    
    // 書式設定
    this.format = {
      backgroundColor: config.format?.backgroundColor || '',
      color: config.format?.color || '',
      fontWeight: config.format?.fontWeight || false,
      fontStyle: config.format?.fontStyle || false,
      textDecoration: config.format?.textDecoration || false
    };
  }
  
  /**
   * 一意IDを生成
   */
  _generateId() {
    return 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * ルールの検証
   */
  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('ルール名は必須です');
    }
    
    if (!this.condition.column.trim()) {
      errors.push('対象列は必須です');
    }
    
    if (!this.condition.value.trim()) {
      errors.push('比較値は必須です');
    }
    
    if (!['greater-equal', 'less-equal', 'equals', 'contains'].includes(this.condition.operator)) {
      errors.push('無効な演算子です');
    }
    
    if (!['number', 'text', 'date'].includes(this.condition.dataType)) {
      errors.push('無効なデータ型です');
    }
    
    if (!['cell', 'row'].includes(this.applyTo)) {
      errors.push('無効な適用範囲です');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * JSONシリアライゼーション
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      priority: this.priority,
      created: this.created,
      modified: this.modified,
      condition: { ...this.condition },
      format: { ...this.format },
      applyTo: this.applyTo
    };
  }
  
  /**
   * JSONからの復元
   */
  static fromJSON(json) {
    return new ConditionalFormattingRule(json);
  }
  
  /**
   * ルールのコピー
   */
  clone() {
    return ConditionalFormattingRule.fromJSON(this.toJSON());
  }
  
  /**
   * ルール設定の更新
   */
  update(config) {
    if (config.name !== undefined) this.name = config.name;
    if (config.enabled !== undefined) this.enabled = config.enabled;
    if (config.applyTo !== undefined) this.applyTo = config.applyTo;
    if (config.condition) {
      this.condition = { ...this.condition, ...config.condition };
    }
    if (config.format) {
      this.format = { ...this.format, ...config.format };
    }
    this.modified = Date.now();
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.ConditionalFormattingRule = ConditionalFormattingRule;
}