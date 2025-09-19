/**
 * Conditional Formatting UI - 管理画面UIとダイアログ
 * ルール管理画面と新規/編集ダイアログを提供
 */

(function() {
  'use strict';
  
  // 定数を取得
  const CF_CONSTANTS = window.CF_CONSTANTS || {};
  const {
    TIMING,
    COLORS,
    OPERATORS,
    OPERATOR_SYMBOLS,
    DATA_TYPES,
    APPLY_TO,
    UI,
    VALIDATION,
    MESSAGES,
    CSS_CLASSES,
    DEFAULT_OPTIONS
  } = CF_CONSTANTS;
  
  // ユーティリティを取得
  const CF_UTILS = window.CF_UTILS || {};
  const {
    ErrorHandler,
    ValidationUtils,
    DOMUtils,
    StringUtils,
    PerformanceUtils,
    ValidationError
  } = CF_UTILS;
  
  class ConditionalFormattingUI {
  constructor(conditionalFormatting) {
    this.cf = conditionalFormatting;
    this.currentEditingRule = null;
    this.isProcessingPriorityChange = false; // ダブルクリック防止フラグ
    
    // エラーハンドリング初期化
    this.errorHandler = new ErrorHandler({
      logToConsole: true,
      throwErrors: false,
      onError: (errorInfo) => this.showToast(MESSAGES.ERROR_SAVE, 'error')
    });
  }
  
  /**
   * 管理画面を表示
   */
  showManagementScreen() {
    try {
      // 既存のモーダルがあれば閉じる
      this.closeAllModals();
      
      const overlay = this.createModal('cf-management-modal');
      const modal = overlay.querySelector('.modal');
      
      modal.innerHTML = `
        <div class="modal-header">
          <h3>条件付き書式ルール</h3>
          <button class="modal-close-btn" type="button">×</button>
        </div>
        <div class="modal-body">
          <div class="cf-rules-toolbar">
            <button class="cf-btn cf-btn-primary cf-new-rule-btn" type="button">+ 新規ルール</button>
            <div class="cf-rules-stats">
              <span class="cf-stats-text">ルール数: <span id="cf-stats-total">0</span></span>
            </div>
          </div>
          <div class="cf-rules-list" id="cf-rules-list" style="background-color: white;">
            <!-- ルール一覧がここに動的生成される -->
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn" type="button">閉じる</button>
          <button class="btn btn-primary cf-apply-btn" type="button">すべて適用</button>
        </div>
      `;
      
      // イベントリスナーを設定
      this.attachManagementScreenEvents(modal);
      
      // ルール一覧を更新
      this.updateRulesList();
      
      return modal;
    } catch (error) {
      this.errorHandler.handle('showManagementScreen', error);
    }
  }
  
  /**
   * 管理画面のイベントリスナーを設定
   */
  attachManagementScreenEvents(modal) {
    try {
      // 閉じるボタン
      modal.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => this.closeAllModals());
      });
      
      // 新規ルールボタン
      modal.querySelector('.cf-new-rule-btn').addEventListener('click', () => {
        this.showRuleDialog();
      });
      
      // 全適用ボタン
      modal.querySelector('.cf-apply-btn').addEventListener('click', () => {
        this.cf.applyRules();
        this.showToast(MESSAGES.RULES_APPLIED);
      });
      
      // Escapeキーで閉じる
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          this.closeAllModals();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    } catch (error) {
      this.errorHandler.handle('attachManagementScreenEvents', error);
    }
  }
  
  /**
   * ルール一覧を更新
   */
  updateRulesList() {
    try {
      const listContainer = document.getElementById('cf-rules-list');
      const statsTotal = document.getElementById('cf-stats-total');
      
      if (!listContainer) return;
      
      const rules = this.cf.manager.getAllRules();
      
      statsTotal.textContent = rules.length;
      
      if (rules.length === 0) {
        listContainer.innerHTML = `
          <div class="cf-empty-state">
            <p>No conditional formatting rules yet.</p>
            <p>Click "New Rule" to get started.</p>
          </div>
        `;
        return;
      }
      
      listContainer.innerHTML = rules.map((rule, index) => `
        <div class="cf-rule-item" data-rule-id="${rule.id}">
          <div class="cf-rule-header">
            <div class="cf-rule-info">
              <div class="cf-rule-name">${StringUtils.escapeHtml(rule.name)}</div>
              <div class="cf-rule-description">
                ${this.getRuleDescription(rule)} (優先度: ${rule.priority})
              </div>
            </div>
            <div class="cf-rule-preview">
              <div class="cf-preview-cell" style="${this.getPreviewStyle(rule.format)}">サンプル</div>
            </div>
            <div class="cf-rule-actions">
              <button class="cf-btn-icon cf-edit-btn" title="Edit" data-action="edit" data-rule-id="${rule.id}">✏️</button>
              <button class="cf-btn-icon cf-delete-btn" title="Delete" data-action="delete" data-rule-id="${rule.id}">🗑️</button>
              <button class="cf-btn-icon cf-up-btn" title="Higher Priority" data-action="up" data-rule-id="${rule.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
              <button class="cf-btn-icon cf-down-btn" title="Lower Priority" data-action="down" data-rule-id="${rule.id}" ${index === rules.length - 1 ? 'disabled' : ''}>↓</button>
            </div>
          </div>
        </div>
      `).join('');
      
      // ルール項目のイベントリスナーを設定
      this.attachRuleItemEvents(listContainer);
    } catch (error) {
      this.errorHandler.handle('updateRulesList', error);
    }
  }
  
  /**
   * ルール項目のイベントリスナーを設定
   */
  attachRuleItemEvents(container) {
    container.addEventListener('click', (e) => {
      try {
        const action = e.target.dataset.action;
        const ruleId = e.target.dataset.ruleId;
        
        if (!action || !ruleId) return;
        
        switch (action) {
          case 'edit':
            const rule = this.cf.manager.getRule(ruleId);
            if (rule) this.showRuleDialog(rule);
            break;
            
          case 'delete':
            this.confirmDeleteRule(ruleId);
            break;
            
          case 'up':
            this.changePriority(ruleId, -1);
            break;
            
          case 'down':
            this.changePriority(ruleId, 1);
            break;
        }
      } catch (error) {
        this.errorHandler.handle('attachRuleItemEvents', error);
      }
    });
  }
  
  /**
   * ルール編集/新規作成ダイアログを表示（リファクタリング版）
   */
  showRuleDialog(rule = null) {
    try {
      const isEdit = !!rule;
      this.currentEditingRule = rule;
      
      const overlay = this.createModal('cf-rule-dialog');
      const modal = overlay.querySelector('.modal');
      const defaults = this._getDialogDefaults(rule);
      
      modal.innerHTML = this._generateDialogHTML(defaults, isEdit);
      
      // イベントリスナーを設定
      this.attachRuleDialogEvents(modal);
      
      // プレビューを更新
      this.updatePreview();
      
      return modal;
    } catch (error) {
      this.errorHandler.handle('showRuleDialog', error);
    }
  }
  
  /**
   * ダイアログのデフォルト値を取得
   */
  _getDialogDefaults(rule) {
    if (rule) {
      return {
        name: rule.name,
        column: rule.condition.column,
        operator: rule.condition.operator,
        value: rule.condition.value,
        dataType: rule.condition.dataType,
        applyTo: rule.applyTo || APPLY_TO.CELL,
        backgroundColor: rule.format.backgroundColor || '',
        color: rule.format.color || COLORS.DEFAULT_TEXT_COLOR,
        fontWeight: rule.format.fontWeight || false,
        fontStyle: rule.format.fontStyle || false,
        textDecoration: rule.format.textDecoration || false
      };
    }
    
    return {
      name: '',
      column: '',
      operator: OPERATORS.EQUALS,
      value: '',
      dataType: DATA_TYPES.TEXT,
      applyTo: APPLY_TO.CELL,
      backgroundColor: '',
      color: COLORS.DEFAULT_TEXT_COLOR,
      fontWeight: false,
      fontStyle: false,
      textDecoration: false
    };
  }
  
  /**
   * ダイアログHTMLを生成
   */
  _generateDialogHTML(defaults, isEdit) {
    return `
      <div class="modal-header">
        <h3>${isEdit ? 'ルール編集' : '新規ルール作成'}</h3>
        <button class="modal-close-btn" type="button">×</button>
      </div>
      <div class="modal-body">
        <form class="cf-rule-form" id="cf-rule-form">
          ${this._generateBasicFields(defaults)}
          ${this._generateFormatFields(defaults)}
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close-btn" type="button">キャンセル</button>
        <button class="btn btn-primary cf-save-btn" type="button">${isEdit ? '更新' : '作成'}</button>
      </div>
    `;
  }
  
  /**
   * 基本フィールドのHTMLを生成
   */
  _generateBasicFields(defaults) {
    return `
      <div class="cf-form-row">
        <label class="cf-form-label">ルール名:</label>
        <input type="text" class="cf-form-input" id="cf-rule-name" value="${StringUtils.escapeHtml(defaults.name)}" placeholder="ルール名を入力" required>
      </div>
      <div class="cf-form-row">
        <label class="cf-form-label">列:</label>
        <select class="cf-form-select" id="cf-rule-column" required>
          <option value="">列を選択...</option>
          ${this.getColumnOptions(defaults.column)}
        </select>
      </div>
      <div class="cf-form-row">
        <label class="cf-form-label">演算子:</label>
        <select class="cf-form-select" id="cf-rule-operator" required>
          <option value="${OPERATORS.EQUALS}" ${defaults.operator === OPERATORS.EQUALS ? 'selected' : ''}>等しい (=)</option>
          <option value="${OPERATORS.GREATER_EQUAL}" ${defaults.operator === OPERATORS.GREATER_EQUAL ? 'selected' : ''}>以上 (≥)</option>
          <option value="${OPERATORS.LESS_EQUAL}" ${defaults.operator === OPERATORS.LESS_EQUAL ? 'selected' : ''}>以下 (≤)</option>
          <option value="${OPERATORS.CONTAINS}" ${defaults.operator === OPERATORS.CONTAINS ? 'selected' : ''}>含む</option>
          <option value="${OPERATORS.NOT_CONTAINS}" ${defaults.operator === OPERATORS.NOT_CONTAINS ? 'selected' : ''}>含まない</option>
        </select>
      </div>
      <div class="cf-form-row">
        <label class="cf-form-label">値:</label>
        <input type="text" class="cf-form-input" id="cf-rule-value" value="${StringUtils.escapeHtml(defaults.value)}" placeholder="比較値を入力" required>
      </div>
      <div class="cf-form-row">
        <label class="cf-form-label">データ型:</label>
        <select class="cf-form-select" id="cf-rule-datatype" required>
          <option value="${DATA_TYPES.TEXT}" ${defaults.dataType === DATA_TYPES.TEXT ? 'selected' : ''}>テキスト</option>
          <option value="${DATA_TYPES.NUMBER}" ${defaults.dataType === DATA_TYPES.NUMBER ? 'selected' : ''}>数値</option>
          <option value="${DATA_TYPES.DATE}" ${defaults.dataType === DATA_TYPES.DATE ? 'selected' : ''}>日付</option>
        </select>
      </div>
      <div class="cf-form-row">
        <label class="cf-form-label">適用先:</label>
        <select class="cf-form-select" id="cf-rule-applyto" required>
          <option value="${APPLY_TO.CELL}" ${defaults.applyTo === APPLY_TO.CELL ? 'selected' : ''}>セルのみ</option>
          <option value="${APPLY_TO.ROW}" ${defaults.applyTo === APPLY_TO.ROW ? 'selected' : ''}>行全体</option>
        </select>
      </div>
    `;
  }
  
  /**
   * 書式フィールドのHTMLを生成
   */
  _generateFormatFields(defaults) {
    return `
      <div class="cf-form-section">
        <h4>書式</h4>
        <div class="cf-form-row">
          <label class="cf-form-label">背景色:</label>
          <div class="cf-color-input-group">
            <input type="color" class="cf-color-input" id="cf-bg-color" value="${defaults.backgroundColor || COLORS.DEFAULT_BACKGROUND_COLOR}">
            <input type="text" class="cf-form-input cf-color-text" id="cf-bg-color-text" value="${defaults.backgroundColor || ''}" placeholder="${COLORS.DEFAULT_BACKGROUND_COLOR}" style="color: ${defaults.backgroundColor ? COLORS.TEXT_PRIMARY : COLORS.TEXT_DISABLED}">
          </div>
        </div>
        <div class="cf-form-row">
          <label class="cf-form-label">文字色:</label>
          <div class="cf-color-input-group">
            <input type="color" class="cf-color-input" id="cf-text-color" value="${defaults.color || COLORS.DEFAULT_TEXT_COLOR}">
            <input type="text" class="cf-form-input cf-color-text" id="cf-text-color-text" value="${defaults.color || COLORS.DEFAULT_TEXT_COLOR}" placeholder="${COLORS.DEFAULT_TEXT_COLOR}" style="color: ${defaults.color ? COLORS.TEXT_PRIMARY : COLORS.TEXT_DISABLED}">
          </div>
        </div>
        <div class="cf-form-row">
          <label class="cf-form-label">文字スタイル:</label>
          <div class="cf-checkbox-group">
            <label class="cf-checkbox-label">
              <input type="checkbox" id="cf-font-weight" ${defaults.fontWeight ? 'checked' : ''}>
              <span class="cf-checkbox-custom"></span>
              太字
            </label>
            <label class="cf-checkbox-label">
              <input type="checkbox" id="cf-font-style" ${defaults.fontStyle ? 'checked' : ''}>
              <span class="cf-checkbox-custom"></span>
              斜体
            </label>
            <label class="cf-checkbox-label">
              <input type="checkbox" id="cf-text-decoration" ${defaults.textDecoration ? 'checked' : ''}>
              <span class="cf-checkbox-custom"></span>
              下線
            </label>
          </div>
        </div>
        <div class="cf-form-row">
          <label class="cf-form-label">プレビュー:</label>
          <div class="cf-preview-container">
            <div class="cf-preview-cell" id="cf-preview">サンプルセル</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * ルールダイアログのイベントリスナーを設定
   */
  attachRuleDialogEvents(modal) {
    try {
      // 閉じるボタン
      modal.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const ruleDialog = document.querySelector('.cf-rule-dialog');
          if (ruleDialog) {
            ruleDialog.remove();
          }
        });
      });
      
      // カラーピッカーとテキスト入力の連携
      this.setupColorInputs(modal);
      
      // プレビュー更新のイベント
      const previewTriggers = modal.querySelectorAll('#cf-bg-color, #cf-bg-color-text, #cf-text-color, #cf-text-color-text, #cf-font-weight, #cf-font-style, #cf-text-decoration');
      previewTriggers.forEach(input => {
        input.addEventListener('input', () => this.updatePreview());
        input.addEventListener('change', () => this.updatePreview());
      });
      
      // 保存ボタン
      modal.querySelector('.cf-save-btn').addEventListener('click', () => {
        this.saveRule();
      });
      
      // フォーム送信
      modal.querySelector('#cf-rule-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveRule();
      });
    } catch (error) {
      this.errorHandler.handle('attachRuleDialogEvents', error);
    }
  }
  
  /**
   * カラー入力の連携設定を共通化
   */
  setupColorInputs(modal) {
    try {
      // 背景色と文字色の設定を統一して処理
      this.setupColorInput(modal, 'cf-bg-color', 'cf-bg-color-text', COLORS.DEFAULT_BACKGROUND_COLOR, true);
      this.setupColorInput(modal, 'cf-text-color', 'cf-text-color-text', COLORS.DEFAULT_TEXT_COLOR, false);
    } catch (error) {
      this.errorHandler.handle('setupColorInputs', error);
    }
  }
  
  /**
   * 個別のカラー入力設定を処理する共通関数
   */
  setupColorInput(modal, colorInputId, textInputId, defaultColor, allowEmpty) {
    const colorInput = modal.querySelector(`#${colorInputId}`);
    const textInput = modal.querySelector(`#${textInputId}`);
    
    if (!colorInput || !textInput) return;
    
    // カラーピッカーからテキスト入力への同期
    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value;
      textInput.style.color = COLORS.TEXT_PRIMARY;
      this.updatePreview();
    });
    
    // テキスト入力からカラーピッカーへの同期
    textInput.addEventListener('input', () => {
      const normalizedColor = StringUtils.normalizeColor(textInput.value);
      
      if (ValidationUtils.validateColor(normalizedColor)) {
        if (normalizedColor) {
          colorInput.value = normalizedColor;
          textInput.style.color = COLORS.TEXT_PRIMARY;
        } else if (allowEmpty) {
          // 背景色の場合、空値を許可
          colorInput.value = defaultColor;
          textInput.style.color = COLORS.TEXT_DISABLED;
        }
        this.updatePreview();
      }
    });
    
    // フォーカスアウト時の処理
    textInput.addEventListener('blur', () => {
      if (textInput.value === '' && allowEmpty) {
        colorInput.value = defaultColor;
        textInput.style.color = COLORS.TEXT_DISABLED;
      }
    });
  }
  
  /**
   * プレビューを更新（共通化）
   */
  updatePreview() {
    try {
      const preview = document.getElementById('cf-preview');
      if (!preview) return;
      
      const format = this.getFormattingFromUI();
      preview.style.cssText = this.getPreviewStyle(format);
    } catch (error) {
      this.errorHandler.handle('updatePreview', error);
    }
  }
  
  /**
   * UIから書式設定を取得
   */
  getFormattingFromUI() {
    return {
      backgroundColor: document.getElementById('cf-bg-color-text')?.value || '',
      color: document.getElementById('cf-text-color-text')?.value || COLORS.DEFAULT_TEXT_COLOR,
      fontWeight: document.getElementById('cf-font-weight')?.checked || false,
      fontStyle: document.getElementById('cf-font-style')?.checked || false,
      textDecoration: document.getElementById('cf-text-decoration')?.checked || false
    };
  }
  
  /**
   * ルールを保存
   */
  saveRule() {
    try {
      const form = document.getElementById('cf-rule-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const formData = this.getFormData();
      
      // バリデーション
      ValidationUtils.validateRuleName(formData.name);
      ValidationUtils.validateColor(formData.format.backgroundColor);
      ValidationUtils.validateColor(formData.format.color);
      ValidationUtils.validateValueLength(formData.condition.value);
      
      if (this.currentEditingRule) {
        // 編集
        this.cf.manager.updateRule(this.currentEditingRule.id, formData);
        this.showToast(MESSAGES.RULE_UPDATED);
      } else {
        // 新規作成
        const rule = new ConditionalFormattingRule(formData);
        this.cf.manager.addRule(rule);
        this.showToast(MESSAGES.RULE_CREATED);
      }
      
      // ルールを即座に適用
      this.cf.applyRules();
      
      // 編集・作成ダイアログだけを閉じる
      const ruleDialog = document.querySelector('.cf-rule-dialog');
      if (ruleDialog) {
        ruleDialog.remove();
      }
      
      // 管理画面のルール一覧を更新
      this.updateRulesList();
      
    } catch (error) {
      if (error instanceof ValidationError) {
        this.showToast(error.message, 'error');
      } else {
        this.errorHandler.handle('saveRule', error);
        this.showToast(MESSAGES.ERROR_SAVE, 'error');
      }
    }
  }
  
  /**
   * フォームデータを取得
   */
  getFormData() {
    return {
      name: document.getElementById('cf-rule-name').value.trim(),
      applyTo: document.getElementById('cf-rule-applyto').value,
      condition: {
        column: document.getElementById('cf-rule-column').value,
        operator: document.getElementById('cf-rule-operator').value,
        value: document.getElementById('cf-rule-value').value.trim(),
        dataType: document.getElementById('cf-rule-datatype').value
      },
      format: {
        backgroundColor: document.getElementById('cf-bg-color-text').value.trim(),
        color: document.getElementById('cf-text-color-text').value.trim() || COLORS.DEFAULT_TEXT_COLOR,
        fontWeight: document.getElementById('cf-font-weight').checked,
        fontStyle: document.getElementById('cf-font-style').checked,
        textDecoration: document.getElementById('cf-text-decoration').checked
      }
    };
  }
  
  /**
   * 列オプションを取得
   */
  getColumnOptions(selectedColumn = '') {
    const columns = this.cf.getTableColumns();
    return columns.map(col => `
      <option value="${col.key}" ${col.key === selectedColumn ? 'selected' : ''}>
        ${StringUtils.escapeHtml(col.title || col.key)}
      </option>
    `).join('');
  }
  
  /**
   * ルールの説明文を取得
   */
  getRuleDescription(rule) {
    const operator = OPERATOR_SYMBOLS[rule.condition.operator] || rule.condition.operator;
    const applyToText = rule.applyTo === APPLY_TO.ROW ? ' (entire row)' : ' (cell only)';
    return `${rule.condition.column} ${operator} "${rule.condition.value}"${applyToText}`;
  }
  
  /**
   * プレビュー用のスタイルを取得
   */
  getPreviewStyle(format) {
    let style = 'padding: 4px 8px; border: 1px solid #ddd; display: inline-block; min-width: 60px; text-align: center;';
    
    if (format.backgroundColor) {
      style += `background-color: ${format.backgroundColor};`;
    }
    // TextColorのデフォルト値を明示的に適用
    const textColor = format.color || COLORS.DEFAULT_TEXT_COLOR;
    style += `color: ${textColor};`;
    
    if (format.fontWeight) {
      style += 'font-weight: bold;';
    }
    if (format.fontStyle) {
      style += 'font-style: italic;';
    }
    if (format.textDecoration) {
      style += 'text-decoration: underline;';
    }
    
    return style;
  }
  
  /**
   * 削除確認ダイアログ
   */
  confirmDeleteRule(ruleId) {
    try {
      const rule = this.cf.manager.getRule(ruleId);
      if (!rule) return;
      
      const confirmMessage = StringUtils.formatMessage(MESSAGES.CONFIRM_DELETE, rule.name);
      if (confirm(confirmMessage)) {
        this.cf.manager.removeRule(ruleId);
        this.updateRulesList();
        this.showToast(MESSAGES.RULE_DELETED);
      }
    } catch (error) {
      this.errorHandler.handle('confirmDeleteRule', error);
    }
  }
  
  /**
   * 優先度変更（隣接要素との順序交換）
   */
  changePriority(ruleId, direction) {
    try {
      // ダブルクリック防止：処理中の場合は無視
      if (this.isProcessingPriorityChange) {
        return;
      }
      
      // 処理開始フラグを設定
      this.isProcessingPriorityChange = true;
      
      // direction: -1=上に移動（優先度を上げる）, 1=下に移動（優先度を下げる）
      const success = this.cf.manager.moveRule(ruleId, direction);
      
      if (success) {
        // ルール一覧を更新
        this.updateRulesList();
        
        // ルールを自動再適用
        this.cf.applyRules();
        
        this.showToast(MESSAGES.PRIORITY_UPDATED);
      }
    } catch (error) {
      this.errorHandler.handle('changePriority', error);
    } finally {
      // 処理完了後、定数で定義された時間後にフラグをリセット
      setTimeout(() => {
        this.isProcessingPriorityChange = false;
      }, TIMING.PRIORITY_CHANGE_DELAY);
    }
  }
  
  /**
   * モーダルを作成
   */
  createModal(className) {
    const overlay = document.createElement('div');
    overlay.className = `${CSS_CLASSES.MODAL_OVERLAY} ${className}`;
    
    const modal = document.createElement('div');
    modal.className = `${CSS_CLASSES.MODAL} ${CSS_CLASSES.MODAL_LARGE}`;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // オーバーレイクリックで閉じる
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // ルール編集ダイアログの場合はそれだけを閉じる
        if (overlay.classList.contains('cf-rule-dialog')) {
          overlay.remove();
        } else {
          // 管理画面の場合はすべて閉じる
          this.closeAllModals();
        }
      }
    });
    
    return overlay;
  }
  
  /**
   * すべてのモーダルを閉じる
   */
  closeAllModals() {
    const modals = document.querySelectorAll(`.${CSS_CLASSES.MODAL_OVERLAY}`);
    modals.forEach(modal => modal.remove());
    this.currentEditingRule = null;
  }
  
  /**
   * トーストメッセージを表示（改善版）
   */
  showToast(message, type = 'success') {
    try {
      const toast = document.createElement('div');
      toast.className = `${CSS_CLASSES.TOAST} ${CSS_CLASSES[`TOAST_${type.toUpperCase()}`]}`;
      toast.textContent = message;
      toast.style.zIndex = UI.TOAST_Z_INDEX;
      
      document.body.appendChild(toast);
      
      // フェードイン
      setTimeout(() => toast.classList.add(CSS_CLASSES.TOAST_SHOW), TIMING.TOAST_FADEIN_DELAY);
      
      // 自動で閉じる
      setTimeout(() => {
        toast.classList.remove(CSS_CLASSES.TOAST_SHOW);
        setTimeout(() => {
          DOMUtils.safeRemove(toast);
        }, TIMING.TOAST_FADEOUT_DURATION);
      }, TIMING.TOAST_DISPLAY_DURATION);
    } catch (error) {
      // Toast display error is non-fatal, silently fail
    }
  }
}

  // グローバルに公開
  if (typeof window !== 'undefined') {
    window.ConditionalFormattingUI = ConditionalFormattingUI;
  }
  
})();