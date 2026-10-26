// グローバル名前空間の初期化
globalThis.CF_UTILS = globalThis.CF_UTILS || {};

(function() {
    'use strict';

    // 定数の取得
    const { ERROR_TYPES, VALIDATION } = globalThis.CF_CONSTANTS || {};

    /**
     * 統一されたエラーハンドリングシステム
     */
    class ErrorHandler {
        constructor(options = {}) {
            this.options = {
                logToConsole: options.logToConsole !== false,
                throwErrors: options.throwErrors || false,
                onError: options.onError || null
            };
        }

        /**
         * エラーを処理する
         * @param {string} operation - 操作名
         * @param {Error} error - エラーオブジェクト
         * @param {Object} context - 追加のコンテキスト情報
         * @returns {Object} 処理結果
         */
        handle(operation, error, context = {}) {
            const errorInfo = {
                operation,
                message: error.message,
                type: this.categorizeError(error),
                context,
                timestamp: new Date().toISOString()
            };

            if (this.options.logToConsole) {
                // Error logging removed for production
            }

            if (this.options.onError) {
                this.options.onError(errorInfo);
            }

            if (this.options.throwErrors) {
                throw error;
            }

            return {
                success: false,
                error: errorInfo
            };
        }

        /**
         * エラーの種類を分類
         */
        categorizeError(error) {
            if (error.name === 'ValidationError') return ERROR_TYPES.VALIDATION;
            if (error.name === 'ReferenceError' || error.name === 'TypeError') return ERROR_TYPES.RUNTIME;
            if (/save/i.test(error.message)) return ERROR_TYPES.SAVE;
            if (/load/i.test(error.message)) return ERROR_TYPES.LOAD;
            return ERROR_TYPES.RUNTIME;
        }

        /**
         * 成功レスポンスを作成
         */
        success(data = null) {
            return {
                success: true,
                data
            };
        }
    }

    /**
     * カスタムバリデーションエラー
     */
    class ValidationError extends Error {
        /**
         * @param {string} message - English message (for developers / logs)
         * @param {string} [i18nKey] - Translation key shown to end users by the UI
         * @param {Object} [params] - Interpolation params for the translation
         */
        constructor(message, i18nKey = null, params = {}) {
            super(message);
            this.name = 'ValidationError';
            this.i18nKey = i18nKey;
            this.params = params;
        }
    }

    /**
     * バリデーションユーティリティ
     */
    class ValidationUtils {
        /**
         * ルール名のバリデーション
         */
        static validateRuleName(name) {
            if (!name || typeof name !== 'string') {
                throw new ValidationError('Rule name is required', 'cf.validation.nameRequired');
            }
            if (name.length > VALIDATION.MAX_RULE_NAME_LENGTH) {
                throw new ValidationError(`Rule name must be at most ${VALIDATION.MAX_RULE_NAME_LENGTH} characters`, 'cf.validation.nameTooLong', { max: VALIDATION.MAX_RULE_NAME_LENGTH });
            }
            return true;
        }

        /**
         * カラーコードのバリデーション
         */
        static validateColor(color) {
            if (color && !VALIDATION.COLOR_REGEX.test(color)) {
                throw new ValidationError('Color must be a hex code like #RRGGBB', 'cf.validation.invalidColor');
            }
            return true;
        }

        /**
         * 演算子のバリデーション
         */
        static validateOperator(operator, validOperators) {
            if (!validOperators.includes(operator)) {
                throw new ValidationError(`Invalid operator: ${operator}`, 'cf.validation.invalidOperator', { operator });
            }
            return true;
        }

        /**
         * 値の長さバリデーション
         */
        static validateValueLength(value) {
            if (value && value.length > VALIDATION.MAX_VALUE_LENGTH) {
                throw new ValidationError(`Value must be at most ${VALIDATION.MAX_VALUE_LENGTH} characters`, 'cf.validation.valueTooLong', { max: VALIDATION.MAX_VALUE_LENGTH });
            }
            return true;
        }
    }

    /**
     * DOM操作ユーティリティ
     */
    class DOMUtils {
        /**
         * セル要素のキャッシュシステム
         */
        static createCellCache() {
            return {
                cache: new Map(),
                timestamp: null,
                timeout: 5000,

                get(container, forceRefresh = false) {
                    const now = Date.now();
                    if (forceRefresh || !this.timestamp || (now - this.timestamp) > this.timeout) {
                        this.refresh(container);
                    }
                    return this.cache.get(container) || [];
                },

                refresh(container) {
                    const cells = Array.from(container.querySelectorAll('.table-cell, td'));
                    this.cache.set(container, cells);
                    this.timestamp = Date.now();
                },

                clear() {
                    this.cache.clear();
                    this.timestamp = null;
                }
            };
        }

        /**
         * 要素の安全な削除
         */
        static safeRemove(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }

        /**
         * セルの位置情報を取得
         */
        static getCellPosition(cell) {
            const row = cell.closest('tr');
            const table = cell.closest('table, .table-container');
            
            if (!row || !table) return null;

            const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(row);
            const cellIndex = Array.from(row.children).indexOf(cell);

            return { rowIndex, cellIndex };
        }

        /**
         * スタイルの適用
         */
        static applyStyles(element, styles) {
            if (!element || !styles) return;
            
            Object.entries(styles).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    element.style[key] = value;
                }
            });
        }

        /**
         * スタイルの削除
         */
        static removeStyles(element, styleKeys) {
            if (!element || !styleKeys) return;
            
            styleKeys.forEach(key => {
                element.style[key] = '';
            });
        }

        /**
         * クラスの存在確認
         */
        static hasClass(element, className) {
            return element && element.classList.contains(className);
        }

        /**
         * クラスの追加
         */
        static addClass(element, className) {
            if (element && className) {
                element.classList.add(className);
            }
        }

        /**
         * クラスの削除
         */
        static removeClass(element, className) {
            if (element && className) {
                element.classList.remove(className);
            }
        }
    }

    /**
     * 文字列操作ユーティリティ
     */
    class StringUtils {
        /**
         * HTMLエスケープ
         */
        static escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * メッセージのプレースホルダー置換
         */
        static formatMessage(template, ...args) {
            return template.replace(/\{(\d+)\}/g, (match, index) => {
                return args[index] !== undefined ? args[index] : match;
            });
        }

        /**
         * 色コードの正規化
         */
        static normalizeColor(color) {
            if (!color) return '';
            return color.toLowerCase().replace(/\s/g, '');
        }
    }

    /**
     * パフォーマンスユーティリティ
     */
    class PerformanceUtils {
        /**
         * デバウンス関数
         */
        static debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        /**
         * スロットル関数
         */
        static throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        /**
         * 配列の効率的な検索
         */
        static binarySearch(array, compareFn) {
            let low = 0;
            let high = array.length - 1;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const comparison = compareFn(array[mid]);
                
                if (comparison === 0) return mid;
                if (comparison < 0) low = mid + 1;
                else high = mid - 1;
            }
            
            return -1;
        }
    }

    /**
     * 初期化ヘルパー
     */
    class InitializationHelper {
        /**
         * 依存関係の確認
         */
        static checkDependencies(dependencies) {
            const missing = [];
            
            for (const [name, value] of Object.entries(dependencies)) {
                if (value === null || value === undefined) {
                    missing.push(name);
                }
            }

            if (missing.length > 0) {
                throw new Error(`Required dependencies are missing: ${missing.join(', ')}`);
            }
        }

        /**
         * デフォルトオプションとのマージ
         */
        static mergeOptions(userOptions, defaultOptions) {
            return this.deepMerge(defaultOptions, userOptions || {});
        }

        /**
         * 深いマージ
         */
        static deepMerge(target, source) {
            const result = { ...target };
            
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            
            return result;
        }
    }

    /**
     * セルポジション管理
     */
    class CellPosition {
        constructor(row, col) {
            this.row = row;
            this.col = col;
        }

        equals(other) {
            return other && this.row === other.row && this.col === other.col;
        }

        toString() {
            return `${this.row},${this.col}`;
        }

        static fromString(str) {
            const [row, col] = str.split(',').map(Number);
            return new CellPosition(row, col);
        }
    }

    /**
     * ルール評価用ユーティリティ
     */
    class RuleEvaluator {
        constructor() {
            this.cache = new Map();
        }

        evaluate(value, condition) {
            const cacheKey = `${value}_${JSON.stringify(condition)}`;
            
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            let result = false;
            const numValue = Number(value);
            const { type, value: condValue, min, max } = condition;

            switch (type) {
                case 'greater':
                    result = numValue > Number(condValue);
                    break;
                case 'less':
                    result = numValue < Number(condValue);
                    break;
                case 'equal':
                    result = value == condValue;
                    break;
                case 'notEqual':
                    result = value != condValue;
                    break;
                case 'between':
                    result = numValue >= Number(min) && numValue <= Number(max);
                    break;
                case 'contains':
                    result = String(value).includes(condValue);
                    break;
                case 'startsWith':
                    result = String(value).startsWith(condValue);
                    break;
                case 'endsWith':
                    result = String(value).endsWith(condValue);
                    break;
                case 'empty':
                    result = value === '' || value === null || value === undefined;
                    break;
                case 'notEmpty':
                    result = value !== '' && value !== null && value !== undefined;
                    break;
                default:
                    result = false;
            }

            this.cache.set(cacheKey, result);
            return result;
        }

        clearCache() {
            this.cache.clear();
        }
    }

    /**
     * 優先度管理ユーティリティ
     */
    class PriorityManager {
        static sortByPriority(rules) {
            return [...rules].sort((a, b) => b.priority - a.priority);
        }

        static getHighestPriorityRule(rules, evaluationResults) {
            const applicableRules = rules.filter((rule, index) => evaluationResults[index]);
            if (applicableRules.length === 0) return null;
            
            return applicableRules.reduce((highest, current) => 
                current.priority > highest.priority ? current : highest
            );
        }
    }

    /**
     * バリデーター（ルール検証用）
     */
    class Validator {
        static validateRule(rule) {
            const errors = [];

            if (!rule.id) {
                errors.push('Rule ID is required');
            }

            if (!rule.name || rule.name.trim() === '') {
                errors.push('Rule name is required');
            }

            if (!rule.condition || !rule.condition.type) {
                errors.push('Rule condition is required');
            }

            if (!rule.style || Object.keys(rule.style).length === 0) {
                errors.push('Rule style is required');
            }

            if (rule.priority !== undefined && (rule.priority < 0 || rule.priority > 999)) {
                errors.push('Priority must be between 0 and 999');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        }

        static validateCellRange(range) {
            if (!range) return false;
            
            const { startRow, startCol, endRow, endCol } = range;
            return startRow >= 0 && startCol >= 0 && 
                   endRow >= startRow && endCol >= startCol;
        }
    }

    /**
     * パフォーマンス計測ユーティリティ
     */
    class PerformanceMonitor {
        constructor(enabled = false) {
            this.enabled = enabled;
            this.measurements = new Map();
        }

        start(label) {
            if (!this.enabled) return;
            this.measurements.set(label, performance.now());
        }

        end(label) {
            if (!this.enabled) return;
            const startTime = this.measurements.get(label);
            if (startTime) {
                const duration = performance.now() - startTime;
                // Performance logging removed for production
                this.measurements.delete(label);
                return duration;
            }
            return 0;
        }

        clear() {
            this.measurements.clear();
        }
    }

    // グローバルに公開
    globalThis.CF_UTILS.ErrorHandler = ErrorHandler;
    globalThis.CF_UTILS.ValidationError = ValidationError;
    globalThis.CF_UTILS.ValidationUtils = ValidationUtils;
    globalThis.CF_UTILS.DOMUtils = DOMUtils;
    globalThis.CF_UTILS.StringUtils = StringUtils;
    globalThis.CF_UTILS.PerformanceUtils = PerformanceUtils;
    globalThis.CF_UTILS.InitializationHelper = InitializationHelper;
    globalThis.CF_UTILS.CellPosition = CellPosition;
    globalThis.CF_UTILS.RuleEvaluator = RuleEvaluator;
    globalThis.CF_UTILS.PriorityManager = PriorityManager;
    globalThis.CF_UTILS.Validator = Validator;
    globalThis.CF_UTILS.PerformanceMonitor = PerformanceMonitor;

})();