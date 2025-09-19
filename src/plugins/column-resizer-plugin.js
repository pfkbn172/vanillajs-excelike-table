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
      this.api.registerHook('render:afterRender', this.addResizeHandles.bind(this));
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
    // console.log('[ColumnResizer] Adding styles');
    const css = `
      /* Ensure headers can contain resizers */
      th.table-header,
      th {
        position: relative !important;
        overflow: visible !important;
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
    
    let headerCells = null;
    
    for (const selector of selectors) {
      headerCells = this.table.container.querySelectorAll(selector);
      if (headerCells.length > 0) {
        break;
      }
    }
    
    if (!headerCells || headerCells.length === 0) {
      // Try again in a moment
      setTimeout(() => this.addResizeHandles(), 250);
      return;
    }
    
    headerCells.forEach((cell, index) => {
      // Skip last column (can't resize)
      if (index === headerCells.length - 1) return;
      
      // Ensure cell has position relative for absolute positioning of resizer
      if (!cell.style.position || cell.style.position === 'static') {
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
    
    // Update table minimum width after adding all resizers
    this.updateTableMinWidth();
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
    event.preventDefault();
    event.stopPropagation();
    
    // すでにリサイズ中の場合は無視
    if (this.state.isResizing) return;
    
    this.state.isResizing = true;
    this.state.isDragging = false; // ドラッグ状態をリセット
    this.state.startX = event.clientX;
    this.state.currentColumn = parseInt(event.target.dataset.columnIndex);
    this.state.resizeHandle = event.target;
    
    // Get current column width
    const headerCell = this.state.resizeHandle.parentElement;
    this.state.startWidth = headerCell.offsetWidth;
    
    // ハンドルのアクティブ状態のみ表示（テーブルへのクラスはドラッグ開始時に追加）
    this.state.resizeHandle.classList.add('active');
    
    // イベントをすぐにキャプチャ（重要）
    document.addEventListener('mousemove', this.state.boundHandlers.mouseMove);
    document.addEventListener('mouseup', this.state.boundHandlers.mouseUp);
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
    const columns = this.table.options.columns;
    
    // Only update the column definition on final update
    if (!isTemporary && columns[columnIndex]) {
      columns[columnIndex].width = width;
    }
    
    // Update CSS for immediate visual feedback
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    const bodyCells = this.table.container.querySelectorAll(`tbody td:nth-child(${columnIndex + 1})`);
    
    // Update header cell
    if (headerCells[columnIndex]) {
      headerCells[columnIndex].style.width = `${width}px`;
      headerCells[columnIndex].style.minWidth = `${width}px`;
      headerCells[columnIndex].style.maxWidth = `${width}px`;
    }
    
    // Update all body cells for smooth resizing
    bodyCells.forEach(cell => {
      cell.style.width = `${width}px`;
      cell.style.minWidth = `${width}px`;
      cell.style.maxWidth = `${width}px`;
    });
    
    // 他の列の幅を固定して変更されないようにする
    this.preserveOtherColumnWidths(columnIndex);
    
    // Update table minimum width to ensure horizontal scroll
    this.updateTableMinWidth();
    
    // 固定列がある場合は位置を再計算（一時的な更新でも実行）
    // DOM更新後に実行するため少し遅延
    setTimeout(() => this.updatePinnedColumnPositions(), 0);
    
    // Only save permanent changes
    if (!isTemporary) {
      // Update table state if available
      if (this.table.state && this.table.state.columnWidths && columns[columnIndex]) {
        this.table.state.columnWidths[columns[columnIndex].key] = width;
      }
      
      // Save to storage
      this.saveColumnWidths();
    }
  },

  /**
   * 固定列の位置を再計算して更新 - DOM要素から実際の幅を取得
   */
  updatePinnedColumnPositions() {
    // ヘッダー行から実際の列幅を取得
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    if (headerCells.length === 0) return;
    
    // 累積位置を計算
    let currentLeft = 0;
    const positions = [];
    
    headerCells.forEach((cell, index) => {
      positions[index] = currentLeft;
      currentLeft += cell.offsetWidth;
    });
    
    // 固定列の位置を更新（ヘッダー）
    const pinnedHeaderCells = this.table.container.querySelectorAll('th.pinned-column');
    pinnedHeaderCells.forEach(cell => {
      const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
      if (positions[columnIndex] !== undefined) {
        cell.style.setProperty('--pinned-left', `${positions[columnIndex]}px`);
      }
    });
    
    // 固定列の位置を更新（ボディセル）
    const rows = this.table.container.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const pinnedCells = row.querySelectorAll('td.pinned-column');
      pinnedCells.forEach(cell => {
        const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
        if (positions[columnIndex] !== undefined) {
          cell.style.setProperty('--pinned-left', `${positions[columnIndex]}px`);
        }
      });
    });
  },

  /**
   * 他の列の幅を固定して変更されないようにする
   */
  preserveOtherColumnWidths(changedColumnIndex) {
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    
    headerCells.forEach((cell, index) => {
      if (index !== changedColumnIndex) {
        // 現在の幅を取得して固定
        const currentWidth = cell.offsetWidth;
        cell.style.width = `${currentWidth}px`;
        cell.style.minWidth = `${currentWidth}px`;
        cell.style.maxWidth = `${currentWidth}px`;
        
        // 対応するボディセルも固定
        const bodyCells = this.table.container.querySelectorAll(`tbody td:nth-child(${index + 1})`);
        bodyCells.forEach(bodyCell => {
          bodyCell.style.width = `${currentWidth}px`;
          bodyCell.style.minWidth = `${currentWidth}px`;
          bodyCell.style.maxWidth = `${currentWidth}px`;
        });
      }
    });
  },

  /**
   * Update table minimum width based on column widths - 他の列幅を維持
   */
  updateTableMinWidth() {
    const headerCells = this.table.container.querySelectorAll('th.table-header');
    let totalWidth = 0;
    
    headerCells.forEach(cell => {
      totalWidth += cell.offsetWidth;
    });
    
    // テーブル全体の幅を総列幅に設定（他の列を圧縮しないため）
    const table = this.table.container.querySelector('table');
    
    if (table) {
      // 明示的にテーブル幅を設定して他の列が縮小されるのを防ぐ
      table.style.width = `${totalWidth}px`;
      table.style.minWidth = `${totalWidth}px`;
    }
    
    // コンテナに水平スクロールを許可
    this.table.container.style.overflowX = 'auto';
  },

  /**
   * Save column widths to storage
   */
  saveColumnWidths() {
    const widths = this.table.options.columns.map(col => col.width);
    this.api.setStorage('columnWidths', widths, 'column-resizer');
  },

  /**
   * Load column widths from storage
   */
  loadColumnWidths() {
    const widths = this.api.getStorage('columnWidths', 'column-resizer');
    if (widths && Array.isArray(widths)) {
      widths.forEach((width, index) => {
        if (this.table.options.columns[index] && width) {
          this.table.options.columns[index].width = width;
        }
      });
    }
  },

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
    if (this.state.observer) {
      this.state.observer.disconnect();
    }

    this.state.observer = new MutationObserver((mutations) => {
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
    });

    this.state.observer.observe(this.table.container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
      attributeOldValue: true
    });
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