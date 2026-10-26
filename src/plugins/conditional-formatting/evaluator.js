/**
 * Conditional Formatting Evaluator - 条件評価エンジン
 * セル値とルール条件のマッチング評価を行う
 */
class ConditionalFormattingEvaluator {
  
  /**
   * ルールがセル値にマッチするかを評価
   * @param {any} cellValue セルの値
   * @param {ConditionalFormattingRule} rule 評価するルール
   * @returns {boolean} マッチするかどうか
   */
  evaluate(cellValue, rule) {
    if (!rule.enabled) {
      return false;
    }

    try {
      const { operator, value, dataType } = rule.condition;
      const convertedCellValue = this._convertValue(cellValue, dataType);
      const convertedRuleValue = this._convertValue(value, dataType);

      // デバッグログ
      if (window.__CF_DEBUG__) {
        console.log('[CF Evaluator]', {
          cellValue,
          dataType,
          convertedCellValue,
          ruleValue: value,
          convertedRuleValue,
          operator
        });
      }

      return this._performComparison(convertedCellValue, convertedRuleValue, operator);

    } catch (error) {
      // Condition evaluation error - silently return false
      return false;
    }
  }
  
  /**
   * 値を指定されたデータ型に変換
   * @param {any} value 変換する値
   * @param {string} dataType データ型
   * @returns {any} 変換された値
   */
  _convertValue(value, dataType) {
    if (value === null || value === undefined) {
      return '';
    }

    switch (dataType) {
      case 'number': {
        // 数値文字列から通貨記号、カンマ、スペースなどを除去してからパース
        const num = parseFloat(String(value).replace(/[$,¥€£\s]/g, ''));
        return isNaN(num) ? 0 : num;
      }

      case 'text':
        return String(value);

      case 'date': {
        if (value instanceof Date) {
          return value;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date(0) : date;
      }

      default:
        return String(value);
    }
  }
  
  /**
   * 比較演算を実行
   * @param {any} cellValue セルの変換済み値
   * @param {any} ruleValue ルールの変換済み値
   * @param {string} operator 演算子
   * @returns {boolean} 比較結果
   */
  _performComparison(cellValue, ruleValue, operator) {
    switch (operator) {
      case 'equals':
        return this._compareEquals(cellValue, ruleValue);

      case 'not-equals':
        return this._compareNotEquals(cellValue, ruleValue);

      case 'greater':
        return this._compareGreater(cellValue, ruleValue);

      case 'greater-equal':
        return this._compareGreaterEqual(cellValue, ruleValue);

      case 'less':
        return this._compareLess(cellValue, ruleValue);

      case 'less-equal':
        return this._compareLessEqual(cellValue, ruleValue);

      case 'contains':
        return this._compareContains(cellValue, ruleValue);

      case 'not-contains':
        return this._compareNotContains(cellValue, ruleValue);

      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
  
  /**
   * 等しい比較
   */
  _compareEquals(cellValue, ruleValue) {
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() === ruleValue.getTime();
    }
    return cellValue === ruleValue;
  }

  /**
   * 等しくない比較
   */
  _compareNotEquals(cellValue, ruleValue) {
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() !== ruleValue.getTime();
    }
    return cellValue !== ruleValue;
  }

  /**
   * より大きい比較
   */
  _compareGreater(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue > ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() > ruleValue.getTime();
    }
    return String(cellValue) > String(ruleValue);
  }

  /**
   * 以上比較
   */
  _compareGreaterEqual(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue >= ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() >= ruleValue.getTime();
    }
    return String(cellValue) >= String(ruleValue);
  }

  /**
   * より小さい比較
   */
  _compareLess(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue < ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() < ruleValue.getTime();
    }
    return String(cellValue) < String(ruleValue);
  }

  /**
   * 以下比較
   */
  _compareLessEqual(cellValue, ruleValue) {
    if (typeof cellValue === 'number' && typeof ruleValue === 'number') {
      return cellValue <= ruleValue;
    }
    if (cellValue instanceof Date && ruleValue instanceof Date) {
      return cellValue.getTime() <= ruleValue.getTime();
    }
    return String(cellValue) <= String(ruleValue);
  }
  
  /**
   * 含む比較（文字列のみ）
   */
  _compareContains(cellValue, ruleValue) {
    const cellStr = String(cellValue).toLowerCase();
    const ruleStr = String(ruleValue).toLowerCase();
    return cellStr.includes(ruleStr);
  }
  
  /**
   * 含まない比較（文字列のみ）
   */
  _compareNotContains(cellValue, ruleValue) {
    const cellStr = String(cellValue).toLowerCase();
    const ruleStr = String(ruleValue).toLowerCase();
    return !cellStr.includes(ruleStr);
  }
  
}

// グローバルに公開
if (typeof window !== 'undefined') {
  globalThis.ConditionalFormattingEvaluator = ConditionalFormattingEvaluator;
}