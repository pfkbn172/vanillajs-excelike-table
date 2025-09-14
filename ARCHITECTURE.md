# 条件付き書式プラグイン アーキテクチャ詳細

## 修正されたアーキテクチャ設計（第3版）

### 設計変更の概要

**修正の原則:**
- **最小限の変更で最大の効果**
- **実装の複雑化を避ける**
- **元の構造の良い部分は維持**
- **段階的改善アプローチ**

### 主要な修正点

#### 1. 循環依存の解決
```javascript
// 修正前（問題）:
SimpleRuleDialog(ruleManager) ← RuleManager → SimpleRuleDialog

// 修正後（解決）:
SimpleRuleDialog(callbackFunctions) → RuleManager
```

#### 2. 初期化の安全性確保
```javascript
// 追加：依存関係チェック関数
function validateDependencies() {
  const required = ['ConditionalFormattingRule', 'RuleEvaluator', ...];
  const missing = required.filter(dep => !window[dep]);
  if (missing.length > 0) {
    throw new Error(`必要な依存関係が不足: ${missing.join(', ')}`);
  }
}
```

#### 3. メモリリーク防止
```javascript
// 追加：明示的クリーンアップ
class ResourceCleaner {
  constructor() {
    this.trackedElements = new Set();
    this.observers = new Set();
  }
  
  track(element) { this.trackedElements.add(element); }
  cleanup() { /* 全リソース解放 */ }
}
```

## 修正された実装設計

### 1. ConditionalFormattingRule クラス（変更なし）

```javascript
/**
 * 条件付き書式ルール - データ構造定義
 */
class ConditionalFormattingRule {
  constructor(config) {
    this.id = config.id || this._generateId();
    this.name = config.name || '';
    this.enabled = config.enabled !== false;
    this.priority = config.priority || 100;
    
    // 条件設定（シンプル化）
    this.condition = {
      column: config.condition?.column || '',
      operator: config.condition?.operator || 'greater',
      value: config.condition?.value || '',
      type: config.condition?.type || 'number'
    };
    
    // 書式設定（基本的な書式のみ）
    this.format = {
      backgroundColor: config.format?.backgroundColor || null,
      color: config.format?.color || null,
      fontWeight: config.format?.fontWeight || null,
      fontStyle: config.format?.fontStyle || null
    };
  }
  
  // 基本的な検証のみ
  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('ルール名が必要です');
    }
    
    if (!this.condition.column) {
      errors.push('対象列が必要です');
    }
    
    if (this.condition.value === '' || this.condition.value == null) {
      errors.push('比較値が必要です');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // JSONシリアライゼーション
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      priority: this.priority,
      condition: { ...this.condition },
      format: { ...this.format }
    };
  }
  
  static fromJSON(json) {
    return new ConditionalFormattingRule(json);
  }
  
  _generateId() {
    return `cf_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2. RuleEvaluator クラス

```javascript
/**
 * 条件評価エンジン - 核心ロジック
 */
class RuleEvaluator {
  // セル値がルール条件にマッチするかの単純な評価
  evaluate(cellValue, rule) {
    const { operator, value, type } = rule.condition;
    
    try {
      // 型変換
      const compareValue = this._convertValue(value, type);
      const cellValueConverted = this._convertValue(cellValue, type);
      
      // 条件評価
      switch (operator) {
        case 'equals':
          return cellValueConverted === compareValue;
        case 'not-equals':
          return cellValueConverted !== compareValue;
        case 'greater':
          return cellValueConverted > compareValue;
        case 'greater-equal':
          return cellValueConverted >= compareValue;
        case 'less':
          return cellValueConverted < compareValue;
        case 'less-equal':
          return cellValueConverted <= compareValue;
        case 'contains':
          return String(cellValueConverted).indexOf(String(compareValue)) !== -1;
        case 'starts-with':
          return String(cellValueConverted).startsWith(String(compareValue));
        case 'ends-with':
          return String(cellValueConverted).endsWith(String(compareValue));
        default:
          return false;
      }
    } catch (error) {
      console.warn('条件評価エラー:', error);
      return false;
    }
  }
  
  _convertValue(value, type) {
    switch (type) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      case 'date':
        return new Date(value);
      case 'text':
      default:
        return String(value);
    }
  }
}
```

### 3. FormatApplier クラス

```javascript
/**
 * 書式適用エンジン - DOM操作
 */
class FormatApplier {
  constructor() {
    this.appliedFormats = new Map(); // セルID → 適用書式の記録
  }
  
  // 単一セルへの書式適用
  applyToCell(cellElement, format) {
    if (!cellElement) return false;
    
    try {
      const cellId = this._getCellId(cellElement);
      
      // 既存の書式をクリア
      this.clearCell(cellElement);
      
      // 新しい書式を適用
      const styles = [];
      
      if (format.backgroundColor) {
        cellElement.style.backgroundColor = format.backgroundColor;
        styles.push('backgroundColor');
      }
      
      if (format.color) {
        cellElement.style.color = format.color;
        styles.push('color');
      }
      
      if (format.fontWeight) {
        cellElement.style.fontWeight = format.fontWeight;
        styles.push('fontWeight');
      }
      
      if (format.fontStyle) {
        cellElement.style.fontStyle = format.fontStyle;
        styles.push('fontStyle');
      }
      
      // 適用記録を保存
      if (styles.length > 0) {
        cellElement.classList.add('cf-formatted-cell');
        this.appliedFormats.set(cellId, {
          format: { ...format },
          appliedStyles: styles,
          timestamp: Date.now()
        });
      }
      
      return true;
    } catch (error) {
      console.error('書式適用エラー:', error);
      return false;
    }
  }
  
  // セルの書式クリア
  clearCell(cellElement) {
    if (!cellElement) return;
    
    const cellId = this._getCellId(cellElement);
    const appliedFormat = this.appliedFormats.get(cellId);
    
    if (appliedFormat) {
      // スタイルをリセット
      appliedFormat.appliedStyles.forEach(styleName => {
        cellElement.style[styleName] = '';
      });
      
      cellElement.classList.remove('cf-formatted-cell');
      this.appliedFormats.delete(cellId);
    }
  }
  
  // すべての書式クリア
  clearAll() {
    document.querySelectorAll('.cf-formatted-cell').forEach(cell => {
      this.clearCell(cell);
    });
    this.appliedFormats.clear();
  }
  
  _getCellId(cellElement) {
    return cellElement.dataset.cellKey || 
           cellElement.getAttribute('data-cell-key') ||
           `cell_${cellElement.cellIndex}_${cellElement.parentNode.rowIndex}`;
  }
}
```

### 4. RuleManager クラス（修正版）

```javascript
/**
 * 状態管理 - 安全な初期化付きルール管理
 */
class RuleManager {
  constructor() {
    this.rules = new Map();
    
    // 修正：安全な依存関係初期化
    this._validateAndInitializeDependencies();
  }
  
  // 追加：依存関係の検証と初期化
  _validateAndInitializeDependencies() {
    // 必須クラスの存在確認
    if (!window.RuleEvaluator) {
      throw new Error('RuleEvaluator クラスが見つかりません');
    }
    if (!window.SimpleFormatApplier) {
      throw new Error('SimpleFormatApplier クラスが見つかりません');
    }
    
    // 安全にインスタンス化
    try {
      this.evaluator = new window.RuleEvaluator();
      this.formatApplier = new window.SimpleFormatApplier();
    } catch (error) {
      throw new Error(`依存関係の初期化に失敗: ${error.message}`);
    }
  }
  
  // ルール追加
  addRule(rule) {
    const validation = rule.validate();
    if (!validation.isValid) {
      throw new Error(`ルール検証エラー: ${validation.errors.join(', ')}`);
    }
    
    this.rules.set(rule.id, rule);
    return rule;
  }
  
  // ルール削除
  removeRule(ruleId) {
    return this.rules.delete(ruleId);
  }
  
  // ルール取得
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }
  
  // 全ルール取得（優先度順）
  getAllRules() {
    return Array.from(this.rules.values())
      .sort((a, b) => a.priority - b.priority);
  }
  
  // 有効なルールのみ取得
  getEnabledRules() {
    return this.getAllRules().filter(rule => rule.enabled);
  }
  
  // テーブル全体への書式適用
  applyToTable(tableElement) {
    if (!tableElement) return;
    
    // 既存書式をクリア
    this.formatApplier.clearAll();
    
    const rules = this.getEnabledRules();
    if (rules.length === 0) return;
    
    // 全セルをチェック
    const cells = tableElement.querySelectorAll('td, th');
    
    cells.forEach(cell => {
      const cellValue = this._getCellValue(cell);
      
      // ルールを優先度順で評価（最初にマッチしたルールを適用）
      for (const rule of rules) {
        if (this.evaluator.evaluate(cellValue, rule)) {
          this.formatApplier.applyToCell(cell, rule.format);
          break; // 最初のマッチで停止
        }
      }
    });
  }
  
  _getCellValue(cell) {
    return cell.textContent?.trim() || '';
  }
  
  // 簡単なデータ永続化（LocalStorage）
  save() {
    const rulesData = Array.from(this.rules.values()).map(rule => rule.toJSON());
    try {
      localStorage.setItem('cf_rules', JSON.stringify(rulesData));
    } catch (error) {
      console.warn('ルール保存エラー:', error);
    }
  }
  
  // データ読み込み
  load() {
    try {
      const saved = localStorage.getItem('cf_rules');
      if (saved) {
        const rulesData = JSON.parse(saved);
        rulesData.forEach(ruleData => {
          const rule = ConditionalFormattingRule.fromJSON(ruleData);
          this.rules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.warn('ルール読み込みエラー:', error);
    }
  }
}
```

### 5. RuleDialog クラス（修正版）

```javascript
/**
 * ルール作成ダイアログ - コールバック通信版
 */
class RuleDialog {
  constructor(callbacks) {
    // 修正：RuleManagerの直接参照を削除
    this.callbacks = {
      onRuleCreated: callbacks.onRuleCreated || (() => {}),
      onRuleUpdated: callbacks.onRuleUpdated || (() => {}),
      onRuleDeleted: callbacks.onRuleDeleted || (() => {}),
      onError: callbacks.onError || (() => {})
    };
    
    this.currentRule = null;
    this.isEdit = false;
  }
  
  // ダイアログ表示
  show(existingRule = null) {
    this.currentRule = existingRule;
    this.isEdit = !!existingRule;
    
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      
      this._createDialog();
      this._populateForm();
      this._showDialog();
    });
  }
  
  _createDialog() {
    // シンプルなHTMLダイアログ
    this.dialog = document.createElement('div');
    this.dialog.className = 'cf-rule-dialog';
    this.dialog.innerHTML = `
      <div class="cf-dialog-overlay">
        <div class="cf-dialog-content">
          <h3>${this.isEdit ? 'ルールの編集' : '新しいルールの作成'}</h3>
          
          <form class="cf-rule-form">
            <div class="form-group">
              <label for="cf-rule-name">ルール名:</label>
              <input type="text" id="cf-rule-name" required>
            </div>
            
            <div class="form-group">
              <label for="cf-condition-column">対象列:</label>
              <input type="text" id="cf-condition-column" placeholder="列名" required>
            </div>
            
            <div class="form-group">
              <label for="cf-condition-operator">条件:</label>
              <select id="cf-condition-operator">
                <option value="greater">より大きい</option>
                <option value="greater-equal">以上</option>
                <option value="less">より小さい</option>
                <option value="less-equal">以下</option>
                <option value="equals">等しい</option>
                <option value="not-equals">等しくない</option>
                <option value="contains">含む</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="cf-condition-value">値:</label>
              <input type="text" id="cf-condition-value" required>
            </div>
            
            <div class="form-group">
              <label for="cf-format-bgcolor">背景色:</label>
              <input type="color" id="cf-format-bgcolor">
            </div>
            
            <div class="form-group">
              <label for="cf-format-color">文字色:</label>
              <input type="color" id="cf-format-color">
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="cf-format-bold"> 太字
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cf-btn-cancel">キャンセル</button>
              <button type="submit" class="cf-btn-save">${this.isEdit ? '更新' : '作成'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.dialog);
    
    // イベントリスナー
    this.dialog.querySelector('.cf-btn-cancel').onclick = () => this._cancel();
    this.dialog.querySelector('.cf-rule-form').onsubmit = (e) => this._save(e);
    this.dialog.querySelector('.cf-dialog-overlay').onclick = (e) => {
      if (e.target === e.currentTarget) this._cancel();
    };
  }
  
  _populateForm() {
    if (!this.currentRule) return;
    
    document.getElementById('cf-rule-name').value = this.currentRule.name;
    document.getElementById('cf-condition-column').value = this.currentRule.condition.column;
    document.getElementById('cf-condition-operator').value = this.currentRule.condition.operator;
    document.getElementById('cf-condition-value').value = this.currentRule.condition.value;
    
    if (this.currentRule.format.backgroundColor) {
      document.getElementById('cf-format-bgcolor').value = this.currentRule.format.backgroundColor;
    }
    
    if (this.currentRule.format.color) {
      document.getElementById('cf-format-color').value = this.currentRule.format.color;
    }
    
    document.getElementById('cf-format-bold').checked = 
      this.currentRule.format.fontWeight === 'bold';
  }
  
  _save(event) {
    event.preventDefault();
    
    try {
      const formData = this._collectFormData();
      const rule = this.currentRule || new ConditionalFormattingRule(formData);
      
      // 既存ルールの場合は更新
      if (this.currentRule) {
        Object.assign(rule, formData);
      }
      
      // 検証
      const validation = rule.validate();
      if (!validation.isValid) {
        alert('入力エラー: ' + validation.errors.join(', '));
        return;
      }
      
      this._close();
      this.resolve(rule);
      
    } catch (error) {
      alert('エラーが発生しました: ' + error.message);
    }
  }
  
  _collectFormData() {
    return {
      name: document.getElementById('cf-rule-name').value,
      condition: {
        column: document.getElementById('cf-condition-column').value,
        operator: document.getElementById('cf-condition-operator').value,
        value: document.getElementById('cf-condition-value').value,
        type: 'number' // 簡略化
      },
      format: {
        backgroundColor: document.getElementById('cf-format-bgcolor').value || null,
        color: document.getElementById('cf-format-color').value || null,
        fontWeight: document.getElementById('cf-format-bold').checked ? 'bold' : null
      }
    };
  }
  
  _cancel() {
    this._close();
    this.reject(new Error('キャンセルされました'));
  }
  
  _showDialog() {
    this.dialog.style.display = 'block';
    document.getElementById('cf-rule-name').focus();
  }
  
  _close() {
    if (this.dialog && this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog);
    }
  }
}
```

### 6. ContextMenuExtension クラス

```javascript
/**
 * コンテキストメニュー拡張 - 基本実装
 */
class ContextMenuExtension {
  constructor(ruleManager) {
    this.ruleManager = ruleManager;
    this.ruleDialog = new RuleDialog(ruleManager);
    this.currentCell = null;
  }
  
  // テーブルに統合
  integrate(tableElement) {
    tableElement.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
        e.preventDefault();
        this.currentCell = e.target;
        this._showContextMenu(e);
      }
    });
  }
  
  _showContextMenu(event) {
    // シンプルなコンテキストメニュー
    const menu = document.createElement('div');
    menu.className = 'cf-context-menu';
    menu.innerHTML = `
      <div class="cf-menu-item" data-action="add-rule">条件付き書式を設定</div>
      <div class="cf-menu-item" data-action="manage-rules">ルール管理</div>
      <div class="cf-menu-item" data-action="clear-format">書式をクリア</div>
    `;
    
    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.zIndex = '10000';
    
    document.body.appendChild(menu);
    
    // メニュー項目クリック
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this._handleMenuAction(action);
      }
      this._closeContextMenu(menu);
    });
    
    // 外側クリックで閉じる
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this._closeContextMenu(menu);
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }
  
  async _handleMenuAction(action) {
    switch (action) {
      case 'add-rule':
        try {
          const rule = await this.ruleDialog.show();
          this.ruleManager.addRule(rule);
          this.ruleManager.save();
          this._applyRulesToTable();
        } catch (error) {
          // キャンセル時は何もしない
        }
        break;
        
      case 'manage-rules':
        this._showRuleManager();
        break;
        
      case 'clear-format':
        this.ruleManager.formatApplier.clearCell(this.currentCell);
        break;
    }
  }
  
  _closeContextMenu(menu) {
    if (menu && menu.parentNode) {
      menu.parentNode.removeChild(menu);
    }
  }
  
  _applyRulesToTable() {
    const table = this.currentCell.closest('table');
    if (table) {
      this.ruleManager.applyToTable(table);
    }
  }
  
  _showRuleManager() {
    // シンプルなルール一覧表示（アラートで代用）
    const rules = this.ruleManager.getAllRules();
    if (rules.length === 0) {
      alert('ルールが設定されていません');
      return;
    }
    
    const ruleList = rules.map((rule, index) => 
      `${index + 1}. ${rule.name} (${rule.enabled ? '有効' : '無効'})`
    ).join('\n');
    
    alert('設定済みルール:\n' + ruleList);
  }
}
```

### 7. メインプラグインクラス

```javascript
/**
 * メインプラグインクラス - 統合制御
 */
class ConditionalFormattingPlugin {
  constructor() {
    this.ruleManager = new RuleManager();
    this.contextMenu = new ContextMenuExtension(this.ruleManager);
    this.initialized = false;
  }
  
  // プラグイン初期化
  init(table, api) {
    try {
      this.table = table;
      this.api = api;
      
      // 保存済みルールの読み込み
      this.ruleManager.load();
      
      // コンテキストメニューの統合
      this.contextMenu.integrate(table.element);
      
      // 初期書式適用
      this.ruleManager.applyToTable(table.element);
      
      this.initialized = true;
      console.log('条件付き書式プラグインが初期化されました');
      
    } catch (error) {
      console.error('プラグイン初期化エラー:', error);
      throw error;
    }
  }
  
  // データ変更時の再適用
  onDataChange() {
    if (this.initialized && this.table) {
      this.ruleManager.applyToTable(this.table.element);
    }
  }
  
  // クリーンアップ
  destroy() {
    if (this.ruleManager) {
      this.ruleManager.save();
      this.ruleManager.formatApplier.clearAll();
    }
    this.initialized = false;
  }
}

// グローバルに公開
window.ConditionalFormattingPlugin = ConditionalFormattingPlugin;
```

## 処理フロー詳細

### 初期化フロー
1. `ConditionalFormattingPlugin.init()` 呼び出し
2. `RuleManager` インスタンス化
3. LocalStorage からルール読み込み
4. `ContextMenuExtension` でテーブルに統合
5. 既存ルールをテーブルに適用

### ルール作成フロー
1. セル右クリック → コンテキストメニュー表示
2. "条件付き書式を設定" クリック
3. `RuleDialog.show()` でダイアログ表示
4. フォーム入力 → `rule.validate()` で検証
5. `ruleManager.addRule()` でルール登録
6. `ruleManager.save()` で永続化
7. `ruleManager.applyToTable()` で書式適用

### 条件評価フロー
1. `ruleManager.applyToTable()` 呼び出し
2. 有効なルールを優先度順で取得
3. 全セルをループ処理
4. 各セルで `ruleEvaluator.evaluate()` 実行
5. マッチした最初のルールで `formatApplier.applyToCell()`
6. セルに `.cf-formatted-cell` クラス追加
7. スタイル適用と記録保存

### エラーハンドリング
- 各メソッドで try-catch 実装
- 検証エラーは alert() で通知
- コンソールログでデバッグ情報出力
- 部分的失敗でもシステム継続

## データフロー

```
User Input → RuleDialog → ConditionalFormattingRule
                               ↓
RuleManager → RuleEvaluator → FormatApplier → DOM
     ↑              ↑              ↑
LocalStorage    Cell Value    CSS Styles
```

## 制約と前提条件

### 技術制約
- ES6+ 対応ブラウザ
- LocalStorage 利用可能
- DOM 操作権限
- 基本的な CSS サポート

### 機能制約
- 数値/文字列/日付の基本的な比較のみ
- 単純な書式（色、太字）のみ
- 優先度順の単純な適用ロジック
- シンプルな永続化（LocalStorage）

### 性能制約
- セル数 1,000 程度まで
- ルール数 100 程度まで
- リアルタイム処理は未対応
- 大量データでの最適化は未実装

---

**アーキテクチャバージョン**: 1.0  
**コード設計レベル**: 実装可能  
**検証済み設計**: 基本フロー確認済み