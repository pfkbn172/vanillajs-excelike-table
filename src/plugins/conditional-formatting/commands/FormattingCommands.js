/**
 * Formatting Commands
 * Command Patternによる書式操作の管理とアンドゥ・リドゥ機能
 */

/**
 * 抽象コマンドクラス
 */
class FormattingCommand {
  constructor(receiver, params) {
    if (new.target === FormattingCommand) {
      throw new Error('FormattingCommand は抽象クラスです');
    }
    
    this.receiver = receiver; // 実行対象（FormatApplierなど）
    this.params = params;
    this.timestamp = new Date();
    this.id = this.generateId();
    this.executed = false;
  }
  
  async execute() {
    throw new Error('execute() は実装必須です');
  }
  
  async undo() {
    throw new Error('undo() は実装必須です');
  }
  
  canExecute() {
    return true;
  }
  
  canUndo() {
    return this.executed;
  }
  
  generateId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getDescription() {
    return `${this.constructor.name} - ${this.timestamp.toLocaleString()}`;
  }
}

/**
 * ルール適用コマンド
 */
class ApplyRuleCommand extends FormattingCommand {
  constructor(formatApplier, stateManager, rule, targetCells) {
    super(formatApplier, { rule, targetCells });
    this.stateManager = stateManager;
    this.appliedFormats = new Map(); // アンドゥ用に保存
  }
  
  async execute() {
    if (!this.canExecute()) {
      throw new Error('コマンドを実行できません');
    }
    
    try {
      const results = [];
      
      for (const cellInfo of this.params.targetCells) {
        const { cellElement, cellData, rowIndex, columnIndex } = cellInfo;
        
        // ルール評価
        const matchingRules = [{ rule: this.params.rule, format: this.params.rule.format }];
        
        // 書式適用
        const result = await this.receiver.applyFormatting(
          cellElement, 
          matchingRules, 
          cellData, 
          rowIndex, 
          columnIndex
        );
        
        if (result && result.length > 0) {
          const cellKey = `${rowIndex}-${columnIndex}`;
          this.appliedFormats.set(cellKey, {
            cellElement,
            previousContent: cellElement.innerHTML,
            previousStyles: this.captureStyles(cellElement),
            appliedResult: result
          });
          results.push({ cellKey, result });
        }
      }
      
      this.executed = true;
      return {
        success: true,
        appliedCount: results.length,
        results
      };
      
    } catch (error) {
      console.error(`[${this.constructor.name}] 実行エラー:`, error);
      throw error;
    }
  }
  
  async undo() {
    if (!this.canUndo()) {
      throw new Error('アンドゥできません');
    }
    
    try {
      const restoredCells = [];
      
      for (const [cellKey, formatData] of this.appliedFormats) {
        const { cellElement, previousContent, previousStyles } = formatData;
        
        if (cellElement && cellElement.parentNode) {
          // 元の状態に復元
          cellElement.innerHTML = previousContent;
          this.restoreStyles(cellElement, previousStyles);
          
          // 状態管理から削除
          this.stateManager.clearFormat(cellKey);
          
          restoredCells.push(cellKey);
        }
      }
      
      this.executed = false;
      return {
        success: true,
        restoredCount: restoredCells.length,
        restoredCells
      };
      
    } catch (error) {
      console.error(`[${this.constructor.name}] アンドゥエラー:`, error);
      throw error;
    }
  }
  
  captureStyles(element) {
    const computedStyles = getComputedStyle(element);
    return {
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      textDecoration: element.style.textDecoration,
      border: element.style.border,
      borderRadius: element.style.borderRadius,
      opacity: element.style.opacity,
      transform: element.style.transform,
      className: element.className
    };
  }
  
  restoreStyles(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (property === 'className') {
        element.className = value;
      } else {
        element.style[property] = value || '';
      }
    });
  }
  
  getDescription() {
    return `ルール適用: ${this.params.rule.name} (${this.params.targetCells.length}セル)`;
  }
}

/**
 * ルール削除コマンド
 */
class RemoveRuleCommand extends FormattingCommand {
  constructor(formatApplier, stateManager, ruleId) {
    super(formatApplier, { ruleId });
    this.stateManager = stateManager;
    this.removedRule = null;
    this.removedFormats = new Map();
  }
  
  async execute() {
    if (!this.canExecute()) {
      throw new Error('コマンドを実行できません');
    }
    
    try {
      // ルールを取得して保存（アンドゥ用）
      this.removedRule = this.stateManager.rules.get(this.params.ruleId);
      if (!this.removedRule) {
        throw new Error(`ルールが見つかりません: ${this.params.ruleId}`);
      }
      
      // 関連する書式を保存（アンドゥ用）
      for (const [cellKey, formatData] of this.stateManager.appliedFormats) {
        if (formatData.ruleIds && formatData.ruleIds.includes(this.params.ruleId)) {
          this.removedFormats.set(cellKey, formatData);
        }
      }
      
      // ルールを削除
      const success = this.stateManager.removeRule(this.params.ruleId);
      
      // 関連書式をクリア
      await this.receiver.clearFormatsForRule(this.params.ruleId);
      
      this.executed = true;
      return {
        success,
        removedRule: this.removedRule,
        clearedFormatsCount: this.removedFormats.size
      };
      
    } catch (error) {
      console.error(`[${this.constructor.name}] 実行エラー:`, error);
      throw error;
    }
  }
  
  async undo() {
    if (!this.canUndo() || !this.removedRule) {
      throw new Error('アンドゥできません');
    }
    
    try {
      // ルールを復元
      this.stateManager.addRule(this.removedRule);
      
      // 書式を復元
      const restoredCells = [];
      for (const [cellKey, formatData] of this.removedFormats) {
        this.stateManager.applyFormat(cellKey, formatData);
        
        // DOM要素を見つけて再適用
        const cellElement = this.findCellByKey(cellKey);
        if (cellElement) {
          await this.reapplyFormatToCell(cellElement, formatData);
          restoredCells.push(cellKey);
        }
      }
      
      this.executed = false;
      return {
        success: true,
        restoredRule: this.removedRule,
        restoredFormatsCount: restoredCells.length
      };
      
    } catch (error) {
      console.error(`[${this.constructor.name}] アンドゥエラー:`, error);
      throw error;
    }
  }
  
  findCellByKey(cellKey) {
    const [rowIndex, columnIndex] = cellKey.split('-').map(Number);
    const table = this.receiver.tableContainer.querySelector('table');
    if (!table) return null;
    
    const row = table.querySelector(`tbody tr:nth-child(${rowIndex + 1})`);
    if (!row) return null;
    
    return row.querySelector(`td:nth-child(${columnIndex + 1})`);
  }
  
  async reapplyFormatToCell(cellElement, formatData) {
    // 書式データから再適用
    const matchingRules = formatData.formats.map(f => ({
      rule: { id: f.ruleId },
      format: { type: f.formatType }
    }));
    
    await this.receiver.applyFormatting(
      cellElement,
      matchingRules,
      formatData.cellData,
      formatData.rowIndex,
      formatData.columnIndex
    );
  }
  
  getDescription() {
    return `ルール削除: ${this.removedRule?.name || this.params.ruleId}`;
  }
}

/**
 * バッチ書式コマンド
 */
class BatchFormatCommand extends FormattingCommand {
  constructor(formatApplier, commands) {
    super(formatApplier, { commands });
    this.executedCommands = [];
  }
  
  async execute() {
    if (!this.canExecute()) {
      throw new Error('コマンドを実行できません');
    }
    
    try {
      const results = [];
      
      for (const command of this.params.commands) {
        if (command.canExecute()) {
          const result = await command.execute();
          this.executedCommands.push(command);
          results.push({ command: command.id, result });
        }
      }
      
      this.executed = true;
      return {
        success: true,
        executedCount: this.executedCommands.length,
        results
      };
      
    } catch (error) {
      // 部分的な実行の場合、実行済みコマンドをロールバック
      await this.rollbackExecutedCommands();
      throw error;
    }
  }
  
  async undo() {
    if (!this.canUndo()) {
      throw new Error('アンドゥできません');
    }
    
    try {
      // 逆順でアンドゥ
      const results = [];
      for (let i = this.executedCommands.length - 1; i >= 0; i--) {
        const command = this.executedCommands[i];
        if (command.canUndo()) {
          const result = await command.undo();
          results.push({ command: command.id, result });
        }
      }
      
      this.executed = false;
      return {
        success: true,
        undoneCount: results.length,
        results
      };
      
    } catch (error) {
      console.error(`[${this.constructor.name}] バッチアンドゥエラー:`, error);
      throw error;
    }
  }
  
  async rollbackExecutedCommands() {
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      try {
        if (command.canUndo()) {
          await command.undo();
        }
      } catch (rollbackError) {
        console.error('ロールバックエラー:', rollbackError);
      }
    }
    this.executedCommands.length = 0;
  }
  
  getDescription() {
    return `バッチ処理: ${this.params.commands.length}コマンド`;
  }
}

/**
 * コマンド実行管理
 */
class CommandManager {
  constructor(maxHistorySize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
  }
  
  async executeCommand(command) {
    try {
      const result = await command.execute();
      
      // 履歴に追加
      this.addToHistory(command);
      
      return result;
      
    } catch (error) {
      console.error('コマンド実行エラー:', error);
      throw error;
    }
  }
  
  addToHistory(command) {
    // 現在位置以降の履歴を削除（新しいブランチの開始）
    this.history.splice(this.currentIndex + 1);
    
    // 新しいコマンドを追加
    this.history.push(command);
    this.currentIndex++;
    
    // 履歴サイズ制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  async undo() {
    if (!this.canUndo()) {
      throw new Error('アンドゥできません');
    }
    
    const command = this.history[this.currentIndex];
    const result = await command.undo();
    this.currentIndex--;
    
    return result;
  }
  
  async redo() {
    if (!this.canRedo()) {
      throw new Error('リドゥできません');
    }
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    const result = await command.execute();
    
    return result;
  }
  
  canUndo() {
    return this.currentIndex >= 0 && 
           this.currentIndex < this.history.length &&
           this.history[this.currentIndex].canUndo();
  }
  
  canRedo() {
    return this.currentIndex + 1 < this.history.length;
  }
  
  getHistory() {
    return this.history.map((command, index) => ({
      id: command.id,
      description: command.getDescription(),
      timestamp: command.timestamp,
      executed: command.executed,
      isCurrent: index === this.currentIndex
    }));
  }
  
  clear() {
    this.history.length = 0;
    this.currentIndex = -1;
  }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormattingCommand,
    ApplyRuleCommand,
    RemoveRuleCommand,
    BatchFormatCommand,
    CommandManager
  };
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingCommands = {
    FormattingCommand,
    ApplyRuleCommand,
    RemoveRuleCommand,
    BatchFormatCommand,
    CommandManager
  };
}