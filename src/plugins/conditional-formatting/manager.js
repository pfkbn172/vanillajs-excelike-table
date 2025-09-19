/**
 * Conditional Formatting Manager - ルール管理機能
 * ルールの保存、読み込み、LocalStorage管理を行う
 */

(function() {
  'use strict';
  
  // 定数を取得
  const CF_CONSTANTS = window.CF_CONSTANTS || {};
  const { ERROR_TYPES, VALIDATION, MESSAGES, DEFAULT_OPTIONS } = CF_CONSTANTS;
  
  // ユーティリティを取得
  const CF_UTILS = window.CF_UTILS || {};
  const { ErrorHandler, ValidationError, ValidationUtils, InitializationHelper, StringUtils } = CF_UTILS;
  
  class ConditionalFormattingManager {
  constructor(options = {}) {
    // オプションのマージ
    this.options = InitializationHelper.mergeOptions(options, DEFAULT_OPTIONS);
    
    // エラーハンドラーの初期化
    this.errorHandler = new ErrorHandler({
      logToConsole: true,
      throwErrors: false,
      onError: this.options.onError
    });
    
    this.storageKey = options.storageKey || 'cf_rules';
    this.rules = [];
    this.nextPriority = 1;
  }
  
  /**
   * ルールを追加
   * @param {ConditionalFormattingRule} rule 追加するルール
   * @returns {Object} 処理結果
   */
  addRule(rule) {
    try {
      // 依存関係チェック
      InitializationHelper.checkDependencies({ rule });
      
      // バリデーション
      const validation = rule.validate();
      if (!validation.isValid) {
        throw new ValidationError(`ルール検証エラー: ${validation.errors.join(', ')}`);
      }
      
      // 最大ルール数チェック
      if (this.rules.length >= this.options.maxRules) {
        throw new ValidationError(`ルール数が上限（${this.options.maxRules}）に達しています`);
      }
      
      // 重複チェック
      if (this.rules.some(r => r.id === rule.id)) {
        throw new ValidationError(`ルールID ${rule.id} は既に存在します`);
      }
      
      // 優先度が未設定の場合は最後に追加
      if (rule.priority === 0) {
        const maxPriority = this.rules.length > 0 
          ? Math.max(...this.rules.map(r => r.priority)) 
          : 0;
        rule.priority = maxPriority + 1;
      }
      
      this.rules.push(rule);
      this.save();
      
      return this.errorHandler.success(rule);
      
    } catch (error) {
      return this.errorHandler.handle('addRule', error, { ruleId: rule?.id });
    }
  }
  
  /**
   * ルールを更新
   * @param {string} ruleId 更新するルールのID
   * @param {Object} updates 更新内容
   * @returns {Object} 処理結果
   */
  updateRule(ruleId, updates) {
    try {
      const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        throw new ValidationError(`ルールID ${ruleId} が見つかりません`);
      }
      
      const rule = this.rules[ruleIndex];
      const originalData = rule.toJSON();
      
      try {
        rule.update(updates);
        
        // 更新後のバリデーション
        const validation = rule.validate();
        if (!validation.isValid) {
          throw new ValidationError(`更新後のルール検証エラー: ${validation.errors.join(', ')}`);
        }
        
        this.save();
        return this.errorHandler.success(rule);
        
      } catch (updateError) {
        // ロールバック
        rule.update(originalData);
        throw updateError;
      }
      
    } catch (error) {
      return this.errorHandler.handle('updateRule', error, { ruleId, updates });
    }
  }
  
  /**
   * ルールを削除
   * @param {string} ruleId 削除するルールのID
   * @returns {Object} 処理結果
   */
  removeRule(ruleId) {
    try {
      const initialLength = this.rules.length;
      const removedRule = this.rules.find(r => r.id === ruleId);
      
      if (!removedRule) {
        throw new ValidationError(`ルールID ${ruleId} が見つかりません`);
      }
      
      this.rules = this.rules.filter(r => r.id !== ruleId);
      
      // 削除後に優先度を再採番
      this.reindexPriorities();
      
      return this.errorHandler.success({ removedRule, totalRules: this.rules.length });
      
    } catch (error) {
      return this.errorHandler.handle('removeRule', error, { ruleId });
    }
  }
  
  /**
   * ルールを取得
   * @param {string} ruleId ルールID
   * @returns {ConditionalFormattingRule|null} ルール
   */
  getRule(ruleId) {
    return this.rules.find(r => r.id === ruleId) || null;
  }
  
  /**
   * すべてのルールを取得
   * @param {boolean} enabledOnly 有効なルールのみを取得するか
   * @returns {ConditionalFormattingRule[]} ルール配列
   */
  getAllRules(enabledOnly = false) {
    const rules = enabledOnly ? this.rules.filter(r => r.enabled) : this.rules;
    return [...rules].sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * ルールの位置を移動
   * @param {string} ruleId ルールID
   * @param {number} direction -1=上に移動, 1=下に移動
   * @returns {Object} 処理結果
   */
  moveRule(ruleId, direction) {
    try {
      const sortedRules = this.getAllRules();
      const currentIndex = sortedRules.findIndex(r => r.id === ruleId);
      
      if (currentIndex === -1) {
        throw new ValidationError(`ルールID ${ruleId} が見つかりません`);
      }
      
      const newIndex = currentIndex + direction;
      
      // 範囲チェック
      if (newIndex < 0 || newIndex >= sortedRules.length) {
        return this.errorHandler.success({ moved: false, reason: 'out_of_range' });
      }
      
      // 隣接するルールと優先度を交換
      const currentRule = sortedRules[currentIndex];
      const targetRule = sortedRules[newIndex];
      
      const result = this.swapRulePriorities(currentRule, targetRule);
      
      if (result.success) {
        this.save();
        return this.errorHandler.success({ 
          moved: true, 
          from: currentIndex, 
          to: newIndex,
          rules: [currentRule.id, targetRule.id]
        });
      }
      
      return result;
      
    } catch (error) {
      return this.errorHandler.handle('moveRule', error, { ruleId, direction });
    }
  }
  
  /**
   * 2つのルールの優先度を交換
   * @private
   */
  swapRulePriorities(rule1, rule2) {
    try {
      const tempPriority = rule1.priority;
      rule1.priority = rule2.priority;
      rule2.priority = tempPriority;
      
      // 変更時刻を更新
      const now = Date.now();
      rule1.modified = now;
      rule2.modified = now;
      
      return this.errorHandler.success();
      
    } catch (error) {
      return this.errorHandler.handle('swapRulePriorities', error, {
        rule1Id: rule1?.id,
        rule2Id: rule2?.id
      });
    }
  }
  
  /**
   * 優先度を連続番号で再採番
   * @private
   */
  reindexPriorities() {
    const sortedRules = [...this.rules].sort((a, b) => a.priority - b.priority);
    
    sortedRules.forEach((rule, index) => {
      rule.priority = index + 1;
      rule.modified = Date.now();
    });
    
    this.nextPriority = this.rules.length + 1;
    this.save();
  }
  
  /**
   * ルールの有効/無効を切り替え
   * @param {string} ruleId ルールID
   * @returns {Object} 処理結果
   */
  toggleRule(ruleId) {
    try {
      const rule = this.getRule(ruleId);
      if (!rule) {
        throw new ValidationError(`ルールID ${ruleId} が見つかりません`);
      }
      
      const previousState = rule.enabled;
      rule.enabled = !rule.enabled;
      rule.modified = Date.now();
      
      this.save();
      
      return this.errorHandler.success({ 
        ruleId, 
        enabled: rule.enabled, 
        previousState 
      });
      
    } catch (error) {
      return this.errorHandler.handle('toggleRule', error, { ruleId });
    }
  }
  
  /**
   * LocalStorageに保存
   * @returns {Object} 処理結果
   */
  save() {
    try {
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        nextPriority: this.nextPriority,
        rules: this.rules.map(rule => rule.toJSON())
      };
      
      const serialized = JSON.stringify(data);
      
      // データサイズチェック（LocalStorageの制限対策）
      if (serialized.length > 5 * 1024 * 1024) { // 5MB制限
        throw new Error('保存データが大きすぎます');
      }
      
      localStorage.setItem(this.storageKey, serialized);
      
      return this.errorHandler.success({ 
        rulesCount: this.rules.length,
        dataSize: serialized.length 
      });
      
    } catch (error) {
      return this.errorHandler.handle('save', error);
    }
  }
  
  /**
   * LocalStorageから読み込み
   * @returns {Object} 処理結果
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return this.errorHandler.success({ isInitial: true, rulesLoaded: 0 });
      }
      
      const parsed = JSON.parse(data);
      
      // バージョンチェック
      if (parsed.version !== '1.0') {
        // Version mismatch handling - auto-convert to 1.0
      }
      
      // ルールを復元
      this.rules = parsed.rules.map(ruleData => 
        ConditionalFormattingRule.fromJSON(ruleData)
      );
      
      // 優先度の整合性チェック
      this.validateAndFixPriorities();
      
      return this.errorHandler.success({ 
        rulesLoaded: this.rules.length,
        version: parsed.version 
      });
      
    } catch (error) {
      // ロード失敗時は初期状態にリセット
      this.rules = [];
      this.nextPriority = 1;
      
      return this.errorHandler.handle('load', error);
    }
  }
  
  /**
   * 優先度の整合性を検証・修正
   * @private
   */
  validateAndFixPriorities() {
    if (this.rules.length === 0) {
      this.nextPriority = 1;
      return;
    }
    
    const priorities = this.rules.map(r => r.priority).sort((a, b) => a - b);
    const hasDuplicates = priorities.some((p, i) => i > 0 && p === priorities[i - 1]);
    const hasGaps = priorities.some((p, i) => i > 0 && p > priorities[i - 1] + 1);
    
    if (hasDuplicates || hasGaps) {
      // Priority inconsistency detected, auto-fixing
      this.reindexPriorities();
    } else {
      const maxPriority = Math.max(...priorities);
      this.nextPriority = maxPriority + 1;
    }
  }
  
  /**
   * すべてのルールをクリア
   * @returns {Object} 処理結果
   */
  clear() {
    try {
      const previousCount = this.rules.length;
      
      this.rules = [];
      this.nextPriority = 1;
      
      localStorage.removeItem(this.storageKey);
      
      return this.errorHandler.success({ 
        clearedRules: previousCount 
      });
      
    } catch (error) {
      return this.errorHandler.handle('clear', error);
    }
  }
  
  /**
   * ルールの統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    const enabled = this.rules.filter(r => r.enabled).length;
    const disabled = this.rules.length - enabled;
    
    return {
      total: this.rules.length,
      enabled,
      disabled,
      nextPriority: this.nextPriority,
      maxRules: this.options.maxRules,
      storageKey: this.storageKey
    };
  }
  
  /**
   * 設定を更新
   * @param {Object} newOptions 新しい設定
   */
  updateOptions(newOptions) {
    this.options = InitializationHelper.mergeOptions(newOptions, this.options);
    
    // エラーハンドラーの設定も更新
    if (newOptions.onError) {
      this.errorHandler.options.onError = newOptions.onError;
    }
  }
}

  // グローバルに公開
  if (typeof window !== 'undefined') {
    window.ConditionalFormattingManager = ConditionalFormattingManager;
  }
  
})();