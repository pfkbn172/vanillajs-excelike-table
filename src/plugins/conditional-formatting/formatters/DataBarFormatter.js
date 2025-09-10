/**
 * Data Bar Formatter
 * データバー書式の専用フォーマッター
 */

class DataBarFormatter extends BaseFormatter {
  constructor(config, utils) {
    super(config, utils);
  }
  
  /**
   * データバー書式を処理できるかチェック
   */
  canHandle(formatType) {
    return formatType === 'dataBar';
  }
  
  /**
   * データバー書式を適用
   */
  async apply(cellElement, formatConfig, cellData, columnStats) {
    // 数値データの検証
    const numericValue = this.utils.parseNumeric(cellData);
    
    if (!this.utils.isNumeric(cellData)) {
      throw new Error(`データバーには数値が必要です: ${cellData}`);
    }
    
    // パーセンテージ計算（計算方式を指定可能）
    const percentage = this.calculatePercentage(numericValue, columnStats, formatConfig);
    
    // データバー要素作成
    const dataBarContainer = this.createDataBarContainer();
    const dataBar = this.createDataBar(percentage, formatConfig);
    const textContent = this.createTextContent(cellData, formatConfig);
    
    // 要素組み立て
    dataBarContainer.appendChild(dataBar);
    dataBarContainer.appendChild(textContent);
    
    // セルに適用
    cellElement.innerHTML = '';
    cellElement.appendChild(dataBarContainer);
    
    const result = {
      type: 'dataBar',
      percentage,
      value: numericValue,
      calculationMethod: formatConfig.calculationMethod || 'minMax',
      appliedAt: new Date()
    };
    
    
    return result;
  }
  
  /**
   * パーセンテージ計算 - 複数の計算方式をサポート
   * @param {number} value - 計算対象の値
   * @param {Object} columnStats - 列の統計情報
   * @param {Object} formatConfig - フォーマット設定
   * @returns {number} バーの長さ（0-100%）
   */
  calculatePercentage(value, columnStats, formatConfig = {}) {
    const { min, max, percentiles } = columnStats;
    const calculationMethod = formatConfig.calculationMethod || 'minMax';
    
    
    // 単一値の場合は常に100%
    if (max === min) {
      return 100;
    }
    
    switch (calculationMethod) {
      case 'zeroToMax':
        // 0基準方式（0を基準点として計算）
        return this.calculateZeroToMax(value, max);
        
      case 'percentile':
        // パーセンタイル方式（外れ値の影響を軽減）
        return this.calculatePercentileBased(value, percentiles, formatConfig);
        
      case 'custom':
        // カスタム範囲方式（任意の範囲を指定）
        return this.calculateCustomRange(value, formatConfig);
        
      case 'minMax':
      default:
        // 自動方式（最小値〜最大値）
        return this.calculateMinMax(value, min, max);
    }
  }
  
  /**
   * 自動方式（最小値〜最大値）- 全データが0-100%に分散される
   */
  calculateMinMax(value, min, max) {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    return percentage;
  }
  
  /**
   * 0基準方式 - 0を基準点として最大値を100%で計算
   * 適用例：売上、価格、スコア、年数、人数など正の値を持つ数値データ全般
   */
  calculateZeroToMax(value, max) {
    // 負の値の場合は0%
    if (value <= 0) {
      return 0;
    }
    
    // 0を基準として最大値を100%とする
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    return percentage;
  }
  
  /**
   * パーセンタイル方式（外れ値に強い）
   */
  calculatePercentileBased(value, percentiles, formatConfig) {
    if (!percentiles) {
      // フォールバックとして最小値～最大値を使用
      return this.calculateMinMax(value, percentiles?.p0 || 0, percentiles?.p100 || value);
    }
    
    // デフォルトで10パーセンタイル～90パーセンタイルを使用
    const lowerPercentile = formatConfig.lowerPercentile || 10;
    const upperPercentile = formatConfig.upperPercentile || 90;
    
    const lowerValue = percentiles[`p${lowerPercentile}`] || percentiles.p10;
    const upperValue = percentiles[`p${upperPercentile}`] || percentiles.p90;
    
    if (upperValue === lowerValue) {
      return 100;
    }
    
    // 指定されたパーセンタイル範囲内での位置を計算
    const percentage = ((value - lowerValue) / (upperValue - lowerValue)) * 100;
    
    // 範囲外の値は0%または100%にクランプ
    return Math.max(0, Math.min(100, percentage));
  }
  
  /**
   * カスタム範囲方式
   */
  calculateCustomRange(value, formatConfig) {
    const customMin = formatConfig.customMin || 0;
    const customMax = formatConfig.customMax || 100;
    
    if (customMax === customMin) {
      return 100;
    }
    
    return Math.max(0, Math.min(100, ((value - customMin) / (customMax - customMin)) * 100));
  }
  
  /**
   * データバーコンテナ作成
   */
  createDataBarContainer() {
    return this.utils.createElement('div', [
      this.config.classes?.dataBarContainer || 'cf-data-bar-container'
    ]);
  }
  
  /**
   * データバー要素作成
   */
  createDataBar(percentage, formatConfig) {
    const defaultColor = this.config.colors?.palettes?.material?.blue || '#4285f4';
    
    let backgroundColor;
    if (formatConfig.gradientFill) {
      backgroundColor = `linear-gradient(to right, ${formatConfig.color}22, ${formatConfig.color})`;
    } else {
      backgroundColor = formatConfig.color || defaultColor;
    }
    
    const element = this.utils.createElement('div', [
      this.config.classes?.dataBar || 'cf-data-bar'
    ], {
      width: `${percentage}%`,
      background: backgroundColor
    });
    
    return element;
  }
  
  /**
   * テキストコンテンツ作成
   */
  createTextContent(cellData, formatConfig) {
    const textElement = this.utils.createElement('span', [
      this.config.classes?.dataBarText || 'cf-data-bar-text'
    ]);
    
    if (formatConfig.showValue !== false) {
      textElement.textContent = String(cellData);
    }
    
    return textElement;
  }
  
  /**
   * データバー専用のクリーンアップ
   */
  cleanup(cellElement) {
    super.cleanup(cellElement);
    
    // データバー固有のクリーンアップがあれば追加
    const dataBarContainers = cellElement.querySelectorAll('.cf-data-bar-container');
    dataBarContainers.forEach(container => container.remove());
  }
}

// BaseFormatterを継承させるため
if (typeof window !== 'undefined' && window.ConditionalFormattingBaseFormatter) {
  DataBarFormatter.prototype = Object.create(window.ConditionalFormattingBaseFormatter.prototype);
  DataBarFormatter.prototype.constructor = DataBarFormatter;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataBarFormatter;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingDataBarFormatter = DataBarFormatter;
}