/**
 * Conditional Formatting Plugin Constants
 * すべてのハードコーディングされた値を一元管理
 */

// グローバル名前空間に定数を定義
globalThis.CF_CONSTANTS = globalThis.CF_CONSTANTS || {};

// タイミング関連の定数
globalThis.CF_CONSTANTS.TIMING = {
  INITIAL_APPLY_DELAY: 100,      // 初期適用の遅延時間（ms）
  REAPPLY_DELAY: 200,            // 再適用の遅延時間（ms）
  MUTATION_DEBOUNCE: 100,        // DOM変更の検知デバウンス（ms）
  PRIORITY_CHANGE_DELAY: 300,    // 優先度変更時の処理ロック時間（ms）
  TOAST_FADEIN_DELAY: 100,       // トースト表示のフェードイン遅延（ms）
  TOAST_DISPLAY_DURATION: 3000,  // トースト表示時間（ms）
  TOAST_FADEOUT_DURATION: 300    // トースト消失時間（ms）
};

// カラー関連の定数
globalThis.CF_CONSTANTS.COLORS = {
  DEFAULT_TEXT_COLOR: '#000000',
  DEFAULT_BACKGROUND_COLOR: '#ffffff',
  PRIMARY_ACCENT: '#1890ff',
  BORDER_LIGHT: '#e0e0e0',
  BACKGROUND_LIGHT: '#fafafa',
  TEXT_PRIMARY: '#222',
  TEXT_SECONDARY: '#333',
  TEXT_DISABLED: '#999'
};

// 演算子マッピング
globalThis.CF_CONSTANTS.OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not-equals',
  GREATER: 'greater',
  GREATER_EQUAL: 'greater-equal',
  LESS: 'less',
  LESS_EQUAL: 'less-equal',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not-contains'
};

// 演算子表示マップ
globalThis.CF_CONSTANTS.OPERATOR_SYMBOLS = {
  [globalThis.CF_CONSTANTS.OPERATORS.EQUALS]: '=',
  [globalThis.CF_CONSTANTS.OPERATORS.NOT_EQUALS]: '≠',
  [globalThis.CF_CONSTANTS.OPERATORS.GREATER]: '>',
  [globalThis.CF_CONSTANTS.OPERATORS.GREATER_EQUAL]: '≥',
  [globalThis.CF_CONSTANTS.OPERATORS.LESS]: '<',
  [globalThis.CF_CONSTANTS.OPERATORS.LESS_EQUAL]: '≤',
  [globalThis.CF_CONSTANTS.OPERATORS.CONTAINS]: 'contains',
  [globalThis.CF_CONSTANTS.OPERATORS.NOT_CONTAINS]: '!contains'
};

// データ型
globalThis.CF_CONSTANTS.DATA_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date'
};

// 適用対象
globalThis.CF_CONSTANTS.APPLY_TO = {
  CELL: 'cell',
  ROW: 'row'
};

// UI要素のサイズとスタイル
globalThis.CF_CONSTANTS.UI = {
  COLOR_INPUT_WIDTH: '60px',
  COLOR_INPUT_HEIGHT: '40px',
  MODAL_Z_INDEX: 10000,
  TOAST_Z_INDEX: 10001,
  CHECKBOX_SIZE: '16px',
  ICON_SIZE: '14px',
  MAX_RULES_DISPLAY: 100  // 表示可能な最大ルール数
};

// バリデーション関連
globalThis.CF_CONSTANTS.VALIDATION = {
  MAX_RULE_NAME_LENGTH: 100,
  MAX_VALUE_LENGTH: 1000,
  MAX_RULES_COUNT: 100,
  COLOR_REGEX: /^#[0-9A-F]{6}$/i
};

// メッセージ
globalThis.CF_CONSTANTS.MESSAGES = {
  RULE_CREATED: 'Rule created',
  RULE_UPDATED: 'Rule updated',
  RULE_DELETED: 'Rule deleted',
  RULES_APPLIED: 'Rules applied',
  PRIORITY_UPDATED: 'Priority updated and rules re-applied',
  ERROR_SAVE: 'Failed to save rules',
  ERROR_LOAD: 'Failed to load rules',
  ERROR_APPLY: 'Failed to apply rules',
  CONFIRM_DELETE: 'Delete rule "{0}"?'
};

// CSS クラス名
globalThis.CF_CONSTANTS.CSS_CLASSES = {
  FORMATTED: 'cf-formatted',
  ROW_FORMATTED: 'cf-row-formatted',
  MODAL_OVERLAY: 'modal-overlay',
  MODAL: 'modal',
  MODAL_LARGE: 'modal-large',
  TOAST: 'cf-toast',
  TOAST_SUCCESS: 'cf-toast-success',
  TOAST_ERROR: 'cf-toast-error',
  TOAST_SHOW: 'cf-toast-show'
};

// デフォルト設定
globalThis.CF_CONSTANTS.DEFAULT_OPTIONS = {
  enabled: true,
  autoApply: true,
  maxRules: globalThis.CF_CONSTANTS.VALIDATION.MAX_RULES_COUNT,
  performance: {
    debounceDelay: globalThis.CF_CONSTANTS.TIMING.MUTATION_DEBOUNCE,
    cacheTimeout: 5000  // セルキャッシュのタイムアウト（ms）
  },
  ui: {
    showToasts: true,
    toastPosition: 'top-right',
    modalAnimations: true
  }
};

// すべての定数を一つにまとめてエクスポート（互換性のため）
globalThis.CF_CONSTANTS.ALL = globalThis.CF_CONSTANTS;

// エラータイプ
globalThis.CF_CONSTANTS.ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  RUNTIME: 'RUNTIME_ERROR',
  INITIALIZATION: 'INITIALIZATION_ERROR',
  SAVE: 'SAVE_ERROR',
  LOAD: 'LOAD_ERROR'
};