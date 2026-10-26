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

    // デバッグログ
    if (window.__CF_DEBUG__) {
      console.log('[CF Rule Constructor]', {
        inputConfig: config.condition,
        resultCondition: this.condition
      });
    }

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
      errors.push('Rule name is required');
    }
    
    if (!this.condition.column.trim()) {
      errors.push('Target column is required');
    }
    
    if (!this.condition.value.trim()) {
      errors.push('Comparison value is required');
    }
    
    if (!['equals', 'not-equals', 'greater', 'greater-equal', 'less', 'less-equal', 'contains', 'not-contains'].includes(this.condition.operator)) {
      errors.push('Invalid operator');
    }
    
    if (!['number', 'text', 'date'].includes(this.condition.dataType)) {
      errors.push('Invalid data type');
    }
    
    if (!['cell', 'row'].includes(this.applyTo)) {
      errors.push('Invalid apply-to target');
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
    const result = {
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

    // デバッグログ
    if (window.__CF_DEBUG__) {
      console.log('[CF Rule toJSON]', {
        thisCondition: this.condition,
        resultCondition: result.condition
      });
    }

    return result;
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
  globalThis.ConditionalFormattingRule = ConditionalFormattingRule;
}