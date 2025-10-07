/**
 * Virtual Scrolling Module for ExceLike Table
 * Handles efficient rendering of large datasets
 */

import SecurityUtils from './security-utils.js';

const VirtualScroll = {
  /**
   * Create virtual scrolling instance
   * @param {Object} options - Virtual scroll options
   * @returns {Object} Virtual scroll controller
   */
  create(options) {
    const {
      container,
      itemHeight = 50,
      buffer = 5,
      renderItem,
      getItemData,
      onScroll,
      estimatedItemHeight = itemHeight
    } = options;

    let totalItems = options.totalItems || 0;
    let scrollTop = 0;
    let containerHeight = 0;
    let visibleStartIndex = 0;
    let visibleEndIndex = 0;
    let isScrolling = false;
    let scrollTimeout = null;

    // Create virtual container elements
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'virtual-scroll-container';
    scrollContainer.style.cssText = `
      height: 100%;
      overflow: auto;
      position: relative;
    `;

    const spacer = document.createElement('div');
    spacer.className = 'virtual-scroll-spacer';
    spacer.style.cssText = `
      height: ${totalItems * estimatedItemHeight}px;
      pointer-events: none;
    `;

    const viewport = document.createElement('div');
    viewport.className = 'virtual-scroll-viewport';
    viewport.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      pointer-events: none;
    `;

    const content = document.createElement('div');
    content.className = 'virtual-scroll-content';
    content.style.cssText = `
      position: relative;
      pointer-events: auto;
    `;

    viewport.appendChild(content);
    scrollContainer.appendChild(spacer);
    scrollContainer.appendChild(viewport);

    if (container) {
      container.appendChild(scrollContainer);
    }

    // Performance optimization: use RAF for scroll updates
    let rafId = null;
    const updateVisibleItems = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        renderVisibleItems();
        if (onScroll) {
          onScroll({
            scrollTop,
            visibleStartIndex,
            visibleEndIndex,
            isScrolling
          });
        }
      });
    };

    const calculateVisibleRange = () => {
      containerHeight = scrollContainer.clientHeight;
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      
      visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      visibleEndIndex = Math.min(totalItems, visibleStartIndex + visibleCount + (buffer * 2));
      
      return {
        start: visibleStartIndex,
        end: visibleEndIndex,
        visibleCount
      };
    };

    const renderVisibleItems = () => {
      const { start, end } = calculateVisibleRange();
      
      // Clear existing content
      content.innerHTML = '';
      
      // Create document fragment for better performance
      const fragment = document.createDocumentFragment();
      
      for (let i = start; i < end; i++) {
        const itemData = getItemData ? getItemData(i) : { index: i };
        const itemElement = renderItem(itemData, i);
        
        if (itemElement) {
          // Position the item
          itemElement.style.cssText += `
            position: absolute;
            top: ${i * itemHeight}px;
            left: 0;
            right: 0;
            height: ${itemHeight}px;
            box-sizing: border-box;
          `;
          
          fragment.appendChild(itemElement);
        }
      }
      
      content.appendChild(fragment);
      
      // Update viewport position
      viewport.style.transform = `translateY(${visibleStartIndex * itemHeight}px)`;
    };

    const handleScroll = PerformanceUtils?.debounce ? 
      PerformanceUtils.debounce(() => {
        isScrolling = false;
      }, 150) : 
      () => { isScrolling = false; };

    // Scroll event handler
    scrollContainer.addEventListener('scroll', (e) => {
      scrollTop = e.target.scrollTop;
      isScrolling = true;
      
      updateVisibleItems();
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set scrolling state
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    }, { passive: true });

    // Resize observer for container size changes
    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateVisibleItems();
      });
      resizeObserver.observe(scrollContainer);
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', updateVisibleItems);
    }

    // Public API
    const virtualScroller = {
      // Update methods
      updateTotalItems(newTotal) {
        totalItems = newTotal;
        spacer.style.height = `${totalItems * estimatedItemHeight}px`;
        updateVisibleItems();
      },

      setItemHeight(newHeight) {
        itemHeight = newHeight;
        spacer.style.height = `${totalItems * itemHeight}px`;
        updateVisibleItems();
      },

      refresh() {
        updateVisibleItems();
      },

      scrollToIndex(index, behavior = 'smooth') {
        const targetScrollTop = Math.max(0, index * itemHeight - containerHeight / 2);
        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior
        });
      },

      scrollToTop() {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      },

      scrollToBottom() {
        const maxScroll = totalItems * itemHeight - containerHeight;
        scrollContainer.scrollTo({ top: maxScroll, behavior: 'smooth' });
      },

      // Getters
      getVisibleRange() {
        return {
          start: visibleStartIndex,
          end: visibleEndIndex,
          total: totalItems
        };
      },

      getScrollTop() {
        return scrollTop;
      },

      getContainerHeight() {
        return containerHeight;
      },

      isItemVisible(index) {
        return index >= visibleStartIndex && index < visibleEndIndex;
      },

      // Advanced features
      setBuffer(newBuffer) {
        buffer = newBuffer;
        updateVisibleItems();
      },

      getItemOffset(index) {
        return index * itemHeight;
      },

      findItemAtPosition(y) {
        return Math.floor(y / itemHeight);
      },

      // Performance monitoring
      getStats() {
        return {
          totalItems,
          visibleItems: visibleEndIndex - visibleStartIndex,
          containerHeight,
          scrollTop,
          itemHeight,
          buffer
        };
      },

      // Dynamic height support (advanced)
      setItemHeights(heights) {
        if (!Array.isArray(heights)) return;
        
        let totalHeight = 0;
        const offsets = [0];
        
        heights.forEach((height, index) => {
          totalHeight += height;
          offsets.push(totalHeight);
        });
        
        spacer.style.height = `${totalHeight}px`;
        
        // Override position calculation for dynamic heights
        this._dynamicHeights = {
          heights,
          offsets,
          totalHeight
        };
        
        updateVisibleItems();
      },

      // Cleanup
      destroy() {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        if (resizeObserver) {
          resizeObserver.disconnect();
        } else {
          window.removeEventListener('resize', updateVisibleItems);
        }
        
        if (scrollContainer.parentNode) {
          scrollContainer.parentNode.removeChild(scrollContainer);
        }
      },

      // Internal elements access (for advanced customization)
      getElements() {
        return {
          scrollContainer,
          viewport,
          content,
          spacer
        };
      }
    };

    // Initial render
    updateVisibleItems();

    return virtualScroller;
  },

  /**
   * Create virtualized table rows
   * @param {Object} options - Table-specific options
   * @returns {Object} Virtual table controller
   */
  createTableVirtualizer(options) {
    const {
      tableContainer,
      data = [],
      columns = [],
      rowHeight = 50,
      headerHeight = 40,
      renderRow,
      onRowClick,
      onRowDoubleClick
    } = options;

    // Create virtual scroll container
    const virtualScroller = this.create({
      container: tableContainer,
      itemHeight: rowHeight,
      totalItems: data.length,
      renderItem: (rowData, index) => {
        const row = renderRow ? renderRow(rowData, index, columns) : this.createDefaultRow(rowData, index, columns);
        
        // Add event listeners
        if (onRowClick) {
          row.addEventListener('click', (e) => onRowClick(rowData, index, e));
        }
        
        if (onRowDoubleClick) {
          row.addEventListener('dblclick', (e) => onRowDoubleClick(rowData, index, e));
        }
        
        return row;
      },
      getItemData: (index) => data[index],
      onScroll: (scrollInfo) => {
        // Emit scroll events for table synchronization
        tableContainer.dispatchEvent(new CustomEvent('virtualScroll', {
          detail: scrollInfo
        }));
      }
    });

    // Create table header (fixed)
    const header = document.createElement('div');
    header.className = 'virtual-table-header';
    header.style.cssText = `
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fafafa;
      border-bottom: 1px solid #d9d9d9;
      height: ${headerHeight}px;
    `;

    // Render header columns
    const headerRow = this.createHeaderRow(columns, headerHeight);
    header.appendChild(headerRow);

    // Insert header before virtual scroller
    const elements = virtualScroller.getElements();
    if (elements.scrollContainer.parentNode) {
      elements.scrollContainer.parentNode.insertBefore(header, elements.scrollContainer);
    }

    return {
      ...virtualScroller,
      updateData(newData) {
        virtualScroller.updateTotalItems(newData.length);
      },
      updateColumns(newColumns) {
        columns.splice(0, columns.length, ...newColumns);
        // Re-render header
        header.innerHTML = '';
        header.appendChild(this.createHeaderRow(columns, headerHeight));
        virtualScroller.refresh();
      },
      getHeader() {
        return header;
      }
    };
  },

  /**
   * Create default table row
   */
  createDefaultRow(rowData, index, columns) {
    const row = document.createElement('div');
    row.className = 'virtual-table-row';
    row.style.cssText = `
      display: flex;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      background: ${index % 2 === 0 ? '#ffffff' : '#fafafa'};
    `;

    columns.forEach(column => {
      const cell = document.createElement('div');
      cell.className = 'virtual-table-cell';
      cell.style.cssText = `
        flex: 0 0 ${column.width || 150}px;
        padding: 8px 12px;
        border-right: 1px solid #f0f0f0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;

      const value = rowData[column.dataIndex];
      if (column.render) {
        const rendered = column.render(value, rowData, column);
        if (typeof rendered === 'string') {
          // Sanitize HTML to prevent XSS
          cell.innerHTML = SecurityUtils.sanitizeHTML(rendered);
        } else if (rendered instanceof HTMLElement) {
          cell.appendChild(rendered);
        }
      } else {
        cell.textContent = value ?? '';
      }

      row.appendChild(cell);
    });

    return row;
  },

  /**
   * Create table header row
   */
  createHeaderRow(columns, height) {
    const headerRow = document.createElement('div');
    headerRow.className = 'virtual-table-header-row';
    headerRow.style.cssText = `
      display: flex;
      align-items: center;
      height: 100%;
      font-weight: 600;
    `;

    columns.forEach(column => {
      const headerCell = document.createElement('div');
      headerCell.className = 'virtual-table-header-cell';
      headerCell.style.cssText = `
        flex: 0 0 ${column.width || 150}px;
        padding: 8px 12px;
        border-right: 1px solid #d9d9d9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;

      headerCell.textContent = column.title;
      headerRow.appendChild(headerCell);
    });

    return headerRow;
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualScroll;
}

if (typeof window !== 'undefined') {
  window.VirtualScroll = VirtualScroll;
}