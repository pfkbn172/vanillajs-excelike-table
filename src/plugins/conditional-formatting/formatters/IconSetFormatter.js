/**
 * Icon Set Formatter
 * アイコンセット書式の専用フォーマッター
 */

class IconSetFormatter extends BaseFormatter {
  constructor(config, utils) {
    super(config, utils);
  }
  
  /**
   * アイコンセット書式を処理できるかチェック
   */
  canHandle(formatType) {
    return formatType === 'iconSet';
  }
  
  /**
   * アイコンセット書式を適用
   */
  async apply(cellElement, formatConfig, cellData, columnStats) {
    // 数値データの検証
    const numericValue = this.utils.parseNumeric(cellData);
    if (!this.utils.isNumeric(cellData)) {
      return;
    }
    
    // アイコンセット設定の検証
    if (!formatConfig.icons || !formatConfig.thresholds) {
      return;
    }
    
    // 適切なアイコンを選択
    const icon = this.selectIcon(numericValue, columnStats, formatConfig);
    
    // アイコンを適用
    this.applyIcon(cellElement, icon);
    
    return {
      type: 'iconSet',
      selectedIcon: icon,
      value: numericValue,
      appliedAt: new Date()
    };
  }
  
  /**
   * 数値に基づいて適切なアイコンを選択
   */
  selectIcon(value, columnStats, formatConfig) {
    const { min, max } = columnStats;
    const { icons, thresholds } = formatConfig;
    
    // 単一値の場合は最初のアイコンを返す
    if (max === min) {
      return icons[0];
    }
    
    // 値を0-100の範囲にスケール
    const percentage = ((value - min) / (max - min)) * 100;
    
    
    // 閾値に基づいてアイコンを選択
    for (let i = 0; i < thresholds.length; i++) {
      if (percentage <= thresholds[i]) {
        return icons[i];
      }
    }
    
    // すべての閾値を超えた場合は最後のアイコン
    return icons[icons.length - 1];
  }
  
  /**
   * セルにアイコンを適用
   */
  applyIcon(cellElement, icon) {
    // 既存のアイコンをクリア
    this.cleanup(cellElement);
    
    // 元のテキストコンテンツを保持
    const originalText = cellElement.textContent;
    
    // 星アイコンの場合は統一されたcreateStarIconを使用
    let iconElement;
    if (icon === '★' || icon === '☆' || icon.includes('star')) {
      iconElement = this.utils.createStarIcon(icon);
    } else {
      // 星以外のアイコンは一般的なアイコン要素を作成
      iconElement = this.utils.createElement('span', ['cf-icon']);
      
      // アイコンが絵文字の場合はそのまま、CSSクラスの場合はクラスを追加
      if (this.isEmoji(icon)) {
        iconElement.textContent = icon;
      } else {
        iconElement.className += ` ${icon}`;
      }
    }
    
    // セルにアイコンとテキストを設定
    cellElement.innerHTML = '';
    cellElement.appendChild(iconElement);
    
    // 元のテキストがある場合は追加
    if (originalText) {
      const textElement = this.utils.createElement('span', ['cf-icon-text']);
      textElement.textContent = originalText;
      cellElement.appendChild(textElement);
    }
    
  }
  
  /**
   * 文字列が絵文字かどうかをチェック
   */
  isEmoji(str) {
    // 簡単な絵文字判定（Unicode範囲）
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(str) || str.length <= 2;
  }
  
  /**
   * アイコンセット専用のクリーンアップ
   */
  cleanup(cellElement) {
    super.cleanup(cellElement);
    
    // アイコンセット固有のクリーンアップ
    const iconContainers = cellElement.querySelectorAll('.cf-icon-container');
    iconContainers.forEach(container => container.remove());
    
    // 単体アイコンもクリーンアップ
    const icons = cellElement.querySelectorAll('.cf-icon');
    icons.forEach(icon => icon.remove());
  }
}

// BaseFormatterを継承させるため
if (typeof window !== 'undefined' && window.ConditionalFormattingBaseFormatter) {
  IconSetFormatter.prototype = Object.create(window.ConditionalFormattingBaseFormatter.prototype);
  IconSetFormatter.prototype.constructor = IconSetFormatter;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconSetFormatter;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingIconSetFormatter = IconSetFormatter;
}