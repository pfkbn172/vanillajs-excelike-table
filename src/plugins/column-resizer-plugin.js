/**
 * Column Resizer Plugin
 * Adds drag-to-resize functionality for table columns
 */

const ColumnResizerPlugin = {
  name: 'Column Resizer',
  version: '1.0.0',
  description: 'Adds drag-to-resize functionality for table columns',
  author: 'ExceLike Table Team',

  // Plugin state - 統一された状態管理
  state: {
    isResizing: false,
    isDragging: false,
    startX: 0,
    startWidth: 0,
    currentColumn: null,
    resizeHandle: null,
    dragThreshold: 3, // ドラッグ開始の閾値（px）
    observer: null,
    boundHandlers: null // イベントハンドラーの参照保持
  },
  
  // Configuration constants
  config: {
    MIN_COLUMN_WIDTH: 50,
    HANDLE_WIDTH: 8,
    HANDLE_ZONE_WIDTH: 16,
    RETRY_DELAYS: [100, 500, 1000, 2000]
  },
  
  /**
   * Initialize plugin - モジュール化された初期化
   * @param {Object} table - Table instance
   * @param {Object} api - Plugin API
   */
  init(table, api) {
    this.table = table;
    this.api = api;
    this.state.boundHandlers = this._createBoundHandlers();
    
    this._initializeComponents();
    this._registerHooks();
    this._startDelayedInitialization();
  },
  
  /**
   * バウンドイベントハンドラーを作成
   */
  _createBoundHandlers() {
    return {
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this)
    };
  },
  
  /**
   * コンポーネントを初期化
   */
  _initializeComponents() {
    this.addStyles();
    this.observeTableChanges();
    this.bindEvents();
  },
  
  /**
   * フックを登録
   */
  _registerHooks() {
    if (this.api?.registerHook) {
      const boundHandler = () => {
        this.addResizeHandles(0);
      };
      // プラグイン名を第3引数として渡す
      this.api.registerHook('render:afterRender', boundHandler, 'column-resizer');
    }
  },
  
  /**
   * 遅延初期化を開始
   */
  _startDelayedInitialization() {
    this.config.RETRY_DELAYS.forEach(delay => {
      setTimeout(() => this.addResizeHandles(), delay);
    });
  },

  /**
   * Add plugin styles
   */
  addStyles() {
    const css = `
      /* Ensure headers can contain resizers - but preserve sticky positioning for pinned columns */
      th.table-header:not(.pinned-column),
      th:not(.pinned-column) {
        position: relative;
        overflow: visible;
      }
      
      /* Pinned columns need special handling for resize functionality */
      th.table-header.pinned-column,
      th.pinned-column {
        overflow: visible;
      }
      
      /* Special resizer positioning for pinned columns */
      th.pinned-column .table-column-resizer {
        position: absolute;
        top: 0;
        right: -5px;
        width: 10px;
        height: 100%;
        z-index: calc(var(--z-pinned-header) + 1);
      }
      
      /* Ensure header row has proper positioning */
      thead tr,
      .table-header-row {
        position: relative;
      }
      
      .table-column-resizer {
        position: absolute;
        top: 0;
        right: -5px;
        width: 10px;
        height: 100%;
        cursor: col-resize;
        background: transparent;
        z-index: 1000;
        border-right: 2px solid transparent;
      }
      
      .table-column-resizer:hover,
      .table-column-resizer.active {
        background: rgba(24, 144, 255, 0.3);
        border-right: 2px solid #1890ff;
      }
      
      /* Remove transitions during resize for smooth updates */
      .table-resizing * {
        transition: none !important;
      }
      
      /* Ensure table can overflow container */
      .table-container {
        overflow-x: auto !important;
        overflow-y: auto !important;
      }
      
      .table {
        min-width: max-content;
      }
      
      .table-resizing {
        user-select: none;
        cursor: col-resize;
      }
      
      .table-resize-guide {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--table-color-primary, #1890ff);
        z-index: 1000;
        pointer-events: none;
      }
    `;
    
    this.api.addCSS(css, 'column-resizer-plugin');
  },

  /**
   * Add resize handles to column headers
   */
  addResizeHandles() {
    let headerCells = null;
    
    try {
      // Try different selectors to find header cells with priority order
      const selectors = [
        'thead th.table-header',
        'th.table-header', 
        'thead th',
        'th',
        '.table-header',
        'table thead tr th',
        '.table thead th'
      ];
      
      for (const selector of selectors) {
        headerCells = this.table.container.querySelectorAll(selector);
        if (headerCells.length > 0) {
          break;
        }
      }
      
      if (!headerCells || headerCells.length === 0) {
        setTimeout(() => this.addResizeHandles(), 250);
        return;
      }
    } catch (error) {
      console.error('[ColumnResizer] Failed to add resize handles:', error);
      setTimeout(() => this.addResizeHandles(), 1000);
      return;
    }
    
    headerCells.forEach((cell, index) => {
      // Skip last column (can't resize)
      if (index === headerCells.length - 1) {
        return;
      }
      
      // Ensure cell has position relative for absolute positioning of resizer
      // BUT: Skip pinned columns to preserve their sticky positioning
      if (!cell.classList.contains('pinned-column') && 
          (!cell.style.position || cell.style.position === 'static')) {
        cell.style.position = 'relative';
      }
      
      // Remove existing resizer
      const existingResizer = cell.querySelector('.table-column-resizer');
      if (existingResizer) {
        existingResizer.remove();
      }
      
      // Create resize handle
      const resizer = document.createElement('div');
      resizer.className = 'table-column-resizer';
      resizer.setAttribute('data-column-index', index);
      resizer.title = `Resize column ${index + 1}`;
      
      cell.appendChild(resizer);
      
      // Add event listeners for better interaction
      resizer.addEventListener('mousedown', this.state.boundHandlers.mouseDown);
      resizer.addEventListener('mouseenter', (e) => {
        e.target.style.background = 'rgba(24, 144, 255, 0.3)';
        e.target.style.borderRight = '2px solid #1890ff';
      });
      resizer.addEventListener('mouseleave', (e) => {
        if (!e.target.classList.contains('active')) {
          e.target.style.background = 'transparent';
          e.target.style.borderRight = '2px solid transparent';
        }
      });
    });
    
    // テーブル幅の更新はメインクラスのupdateColumnWidthメソッドが担当
  },

  /**
   * Bind global events
   */
  bindEvents() {
    document.addEventListener('mousemove', this.state.boundHandlers.mouseMove);
    document.addEventListener('mouseup', this.state.boundHandlers.mouseUp);
  },

  /**
   * Handle mouse down on resize handle
   * @param {Event} event - Mouse event
   */
  handleMouseDown(event) {
    try {
      event.preventDefault();
      event.stopPropagation();
      
      // すでにリサイズ中の場合は無視
      if (this.state.isResizing) return;
      
      // イベントプロパティ検証
      if (!event.target || typeof event.clientX !== 'number') {
        throw new Error('Invalid mouse event properties');
      }
      
      const columnIndex = event.target.dataset?.columnIndex;
      if (columnIndex === undefined) {
        throw new Error('Column index not found in dataset');
      }
      
      this.state.isResizing = true;
      this.state.isDragging = false;
      this.state.startX = event.clientX;
      this.state.currentColumn = parseInt(columnIndex);
      this.state.resizeHandle = event.target;
      
      // Get current column width
      const headerCell = this.state.resizeHandle.parentElement;
      if (!headerCell) {
        throw new Error('Header cell not found');
      }
      
      this.state.startWidth = headerCell.offsetWidth;
      
      // ハンドルのアクティブ状態のみ表示
      this.state.resizeHandle.classList.add('active');
      
      // イベントをすぐにキャプチャ
      document.addEventListener('mousemove', this.state.boundHandlers.mouseMove);
      document.addEventListener('mouseup', this.state.boundHandlers.mouseUp);
      
    } catch (error) {
      console.error('[ColumnResizer] handleMouseDown failed:', error);
      // エラー時は状態をリセット
      this.state.isResizing = false;
      this.state.isDragging = false;
    }
  },

  /**
   * Handle mouse move during resize
   * @param {Event} event - Mouse event
   */
  handleMouseMove(event) {
    if (!this.state.isResizing) return;
    
    const deltaX = event.clientX - this.state.startX;
    const absDeltaX = Math.abs(deltaX);
    
    // 闾値を超えるまではドラッグ状態にしない
    if (!this.state.isDragging && absDeltaX < this.state.dragThreshold) {
      return;
    }
    
    // 初回のドラッグ開始時の処理
    if (!this.state.isDragging) {
      this.state.isDragging = true;
      this.table.container.classList.add('table-resizing');
      
      // カーソルを設定
      document.body.style.cursor = 'col-resize';
      
      // ドラッグ開始フックを発行
      if (this.api?.emitHook) {
        this.api.emitHook('column:resizeStart', {
          columnIndex: this.state.currentColumn,
          startWidth: this.state.startWidth
        });
      }
    }
    
    const newWidth = Math.max(this.state.startWidth + deltaX, this.config.MIN_COLUMN_WIDTH);
    
    // Apply width in real-time for visual feedback
    this.applyColumnWidth(this.state.currentColumn, newWidth, true); // true = temporary update
    
    // Emit hook for real-time updates
    if (this.api?.emitHook) {
      this.api.emitHook('column:resizing', {
        columnIndex: this.state.currentColumn,
        newWidth,
        deltaX
      });
    }
  },

  /**
   * Handle mouse up to finish resize
   * @param {Event} event - Mouse event
   */
  handleMouseUp(event) {
    if (!this.state.isResizing) return;
    
    this.state.isResizing = false;
    
    // 実際にドラッグした場合のみ列幅を変更
    if (this.state.isDragging) {
      const deltaX = event.clientX - this.state.startX;
      const newWidth = Math.max(this.state.startWidth + deltaX, this.config.MIN_COLUMN_WIDTH);
      
      // Apply new width
      this.applyColumnWidth(this.state.currentColumn, newWidth);
      
      // Emit hook
      if (this.api?.emitHook) {
        this.api.emitHook('column:resizeEnd', {
          columnIndex: this.state.currentColumn,
          newWidth,
          oldWidth: this.state.startWidth
        });
      }
    }
    
    // Cleanup - ハンドルの状態をリセット
    this.table.container.classList.remove('table-resizing');
    if (this.state.resizeHandle) {
      this.state.resizeHandle.classList.remove('active');
      // ハンドルのスタイルもリセット
      this.state.resizeHandle.style.background = 'transparent';
      this.state.resizeHandle.style.borderRight = '2px solid transparent';
    }
    
    // カーソルをリセット
    document.body.style.cursor = '';
    
    // リサイズガイドがあれば削除
    this.removeResizeGuide();
    
    // Reset state
    this.state.isDragging = false;
    this.state.currentColumn = null;
    this.state.resizeHandle = null;
  },

  /**
   * Create resize guide line
   * @param {number} x - X position
   */
  createResizeGuide(x) {
    const guide = document.createElement('div');
    guide.className = 'table-resize-guide';
    guide.style.left = `${x}px`;
    
    // Get table container position for proper guide positioning
    const tableRect = this.table.container.getBoundingClientRect();
    guide.style.top = `${tableRect.top}px`;
    guide.style.height = `${tableRect.height}px`;
    
    document.body.appendChild(guide);
    this.resizeGuide = guide;
  },

  /**
   * Update resize guide position
   * @param {number} x - X position
   */
  updateResizeGuide(x) {
    if (this.resizeGuide) {
      this.resizeGuide.style.left = `${x}px`;
    }
  },

  /**
   * Remove resize guide
   */
  removeResizeGuide() {
    if (this.resizeGuide) {
      this.resizeGuide.remove();
      this.resizeGuide = null;
    }
  },

  /**
   * Apply new column width
   * @param {number} columnIndex - Column index
   * @param {number} width - New width
   * @param {boolean} isTemporary - Whether this is a temporary update during dragging
   */
  applyColumnWidth(columnIndex, width, isTemporary = false) {
    try {
      // パラメータ検証
      if (typeof columnIndex !== 'number' || columnIndex < 0) {
        throw new Error(`Invalid columnIndex: ${columnIndex}`);
      }
      if (typeof width !== 'number' || width < this.config.MIN_COLUMN_WIDTH) {
        throw new Error(`Invalid width: ${width}. Must be >= ${this.config.MIN_COLUMN_WIDTH}px`);
      }
      
      const columns = this.table?.options?.columns;
      if (!Array.isArray(columns) || !columns[columnIndex]) {
        throw new Error(`Column not found at index: ${columnIndex}`);
      }
      
      const column = columns[columnIndex];
      
      // 一時的でない場合のみ列定義を更新
      if (!isTemporary) {
        column.width = width;
      }
      
      // メインクラスの統一メソッドを使用（永続化も自動実行される）
      if (this.table.updateColumnWidth) {
        this.table.updateColumnWidth(column.key, width);
      } else {
        console.warn('[ColumnResizer] updateColumnWidth method not available on table instance');
        // フォールバック：統一メソッドが利用できない場合のみ直接保存
        if (!isTemporary) {
          this.saveColumnWidths();
        }
      }
      
      return true;
    } catch (error) {
      console.error('[ColumnResizer] applyColumnWidth failed:', error);
      return false;
    }
  },

  /**
   * 統一API使用によるフォールバック削除
   * メインクラスのupdateColumnWidthメソッドに委譲
   */

  /**
   * Save column widths to storage - 統一システムを使用
   */
  saveColumnWidths() {
    try {
      // メインクラスの統一永続化システムを使用
      if (this.table?.saveStateDebounced) {
        this.table.saveStateDebounced();
      } else {
        console.warn('[ColumnResizer] saveStateDebounced method not available on table instance');
      }
    } catch (error) {
      console.error('[ColumnResizer] saveColumnWidths failed:', error);
    }
  },

  /**
   * Load column widths from storage - 統一システムを使用
   * @deprecated メインクラスが初期化時に自動復元するため不要
   */

  /**
   * Get plugin configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      minColumnWidth: 50,
      saveToStorage: true,
      showResizeGuide: true,
      animateResize: true
    };
  },

  /**
   * Update plugin configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    this.config = { ...this.getConfig(), ...config };
  },

  /**
   * Observe table changes to re-add resize handles when needed
   */
  observeTableChanges() {
    try {
      if (this.state.observer) {
        this.state.observer.disconnect();
      }

      this.state.observer = new MutationObserver((mutations) => {
        try {
          let shouldUpdate = false;
          
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              // Check if header elements were added/removed
              const addedNodes = Array.from(mutation.addedNodes);
              const removedNodes = Array.from(mutation.removedNodes);
              
              if (addedNodes.some(node => node.tagName === 'TH' || node.tagName === 'THEAD') ||
                  removedNodes.some(node => node.tagName === 'TH' || node.tagName === 'THEAD')) {
                shouldUpdate = true;
              }
            } else if (mutation.type === 'attributes') {
              // Check if pinned column classes were changed
              const target = mutation.target;
              
              if (target.tagName === 'TH' && 
                  (target.classList.contains('pinned-column') || 
                   target.classList.contains('last-pinned-column') ||
                   mutation.oldValue?.includes('pinned-column'))) {
                shouldUpdate = true;
              }
            }
          });
          
          if (shouldUpdate) {
            setTimeout(() => this.addResizeHandles(), 100);
          }
        } catch (error) {
          console.error('[ColumnResizer] MutationObserver callback failed:', error);
        }
      });

      if (!this.table?.container) {
        throw new Error('Table container not found for observation');
      }

      this.state.observer.observe(this.table.container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
        attributeOldValue: true
      });
      
    } catch (error) {
      console.error('[ColumnResizer] observeTableChanges failed:', error);
      // フォールバック：定期的な再初期化
      setTimeout(() => this.addResizeHandles(), 1000);
    }
  },

  /**
   * Plugin cleanup - メモリリーク防止
   */
  destroy() {
    this._removeEventListeners();
    this._cleanupState();
    this._stopObserving();
    this._removeStyles();
    this._removeResizeElements();
  },
  
  /**
   * イベントリスナーを除去
   */
  _removeEventListeners() {
    if (this.state.boundHandlers) {
      document.removeEventListener('mousemove', this.state.boundHandlers.mouseMove);
      document.removeEventListener('mouseup', this.state.boundHandlers.mouseUp);
    }
  },
  
  /**
   * 状態をクリーンアップ
   */
  _cleanupState() {
    Object.assign(this.state, {
      isResizing: false,
      isDragging: false,
      currentColumn: null,
      resizeHandle: null,
      boundHandlers: null
    });
  },
  
  /**
   * DOM監視を停止
   */
  _stopObserving() {
    if (this.state.observer) {
      this.state.observer.disconnect();
      this.state.observer = null;
    }
  },
  
  /**
   * スタイルを除去
   */
  _removeStyles() {
    if (this.api?.removeCSS) {
      this.api.removeCSS('column-resizer-plugin');
    }
  },
  
  /**
   * リサイズ要素を除去
   */
  _removeResizeElements() {
    if (this.table?.container) {
      const resizers = this.table.container.querySelectorAll('.table-column-resizer');
      resizers.forEach(resizer => resizer.remove());
    }
    this.removeResizeGuide();
  }
};

// Auto-register plugin if PluginSystem is available
if (typeof window !== 'undefined' && window.PluginSystem) {
  // Plugin will be registered when table initializes
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColumnResizerPlugin;
}

if (typeof window !== 'undefined') {
  window.ColumnResizerPlugin = ColumnResizerPlugin;
}