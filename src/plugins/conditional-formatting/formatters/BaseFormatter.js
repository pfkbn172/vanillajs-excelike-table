/**
 * Base Formatter Interface
 * 全ての書式フォーマッターの基底クラス
 */

class BaseFormatter {
  constructor(config, utils) {
    if (new.target === BaseFormatter) {
      throw new Error('BaseFormatter は抽象クラスです');
    }
    
    this.config = config;
    this.utils = utils;
  }
  
  /**
   * この書式タイプを処理できるかチェック
   * @param {string} formatType - 書式タイプ
   * @returns {boolean}
   */
  canHandle(formatType) {
    throw new Error('canHandle() は実装必須です');
  }
  
  /**
   * 書式を適用
   * @param {HTMLElement} cellElement - セル要素
   * @param {Object} formatConfig - 書式設定
   * @param {*} cellData - セルデータ
   * @param {Object} columnStats - 列統計情報
   * @returns {Promise<FormattingResult>}
   */
  async apply(cellElement, formatConfig, cellData, columnStats) {
    throw new Error('apply() は実装必須です');
  }
  
  /**
   * 必要な列統計を取得
   * @param {Array} columnData - 列データ
   * @returns {Object} 統計情報
   */
  getRequiredStats(columnData) {
    const numericValues = columnData
      .map(value => this.utils.parseNumeric(value))
      .filter(value => this.utils.isNumeric(value));
      
    if (numericValues.length === 0) {
      return { min: 0, max: 100, count: 0 };
    }
    
    return {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      count: numericValues.length,
      average: numericValues.reduce((a, b) => a + b) / numericValues.length
    };
  }
  
  /**
   * 書式をクリーンアップ
   * @param {HTMLElement} cellElement - セル要素
   */
  cleanup(cellElement) {
    // 基本的なクリーンアップ
    const formatElements = cellElement.querySelectorAll('[class*="cf-"]');
    formatElements.forEach(element => {
      if (element._observer) {
        element._observer.disconnect();
        delete element._observer;
      }
      element.remove();
    });
  }
  
  /**
   * エラーハンドリング付きの適用処理
   * @param {HTMLElement} cellElement - セル要素
   * @param {Object} formatConfig - 書式設定
   * @param {*} cellData - セルデータ
   * @param {Object} columnStats - 列統計情報
   * @returns {Promise<FormattingResult>}
   */
  async safeApply(cellElement, formatConfig, cellData, columnStats) {
    try {
      const result = await this.apply(cellElement, formatConfig, cellData, columnStats);
      return {
        success: true,
        result,
        formatter: this.constructor.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        formatter: this.constructor.name
      };
    }
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseFormatter;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingBaseFormatter = BaseFormatter;
}