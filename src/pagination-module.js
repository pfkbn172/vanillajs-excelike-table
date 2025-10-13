/**
 * Pagination Module for ExceLike Table
 * Handles pagination logic and UI
 */

const PaginationModule = {
  /**
   * Calculate pagination info
   * @param {number} total - Total items
   * @param {number} current - Current page
   * @param {number} pageSize - Items per page
   * @returns {Object} - Pagination info
   */
  calculatePagination(total, current, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const actualCurrent = Math.min(current, totalPages) || 1;
    const start = (actualCurrent - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    
    return {
      current: actualCurrent,
      pageSize,
      total,
      totalPages,
      start,
      end,
      hasNext: actualCurrent < totalPages,
      hasPrev: actualCurrent > 1
    };
  },

  /**
   * Get page numbers to display
   * @param {number} current - Current page
   * @param {number} total - Total pages
   * @param {number} maxButtons - Max page buttons to show
   * @returns {Array} - Page numbers
   */
  getPageNumbers(current, total, maxButtons = 5) {
    const pages = [];
    const half = Math.floor(maxButtons / 2);
    
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxButtons - 1);
    
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  },

  /**
   * Create pagination container
   * @param {Object} paginationInfo - Pagination info
   * @param {Object} options - Pagination options
   * @returns {HTMLElement}
   */
  createPagination(paginationInfo, options = {}) {
    const container = document.createElement('div');
    container.className = 'table-pagination';
    
    if (!options || options === false) {
      return container;
    }

    const leftSection = document.createElement('div');
    leftSection.className = 'pagination-info';
    
    // Total info
    if (options.showTotal) {
      const totalInfo = document.createElement('span');
      totalInfo.className = 'pagination-total';
      totalInfo.textContent = options.showTotal(
        paginationInfo.total, 
        [paginationInfo.start + 1, paginationInfo.end]
      );
      leftSection.appendChild(totalInfo);
    } else {
      const totalInfo = document.createElement('span');
      totalInfo.className = 'pagination-total';
      totalInfo.textContent = `${paginationInfo.start + 1}-${paginationInfo.end} / ${paginationInfo.total}件`;
      leftSection.appendChild(totalInfo);
    }
    
    container.appendChild(leftSection);

    const rightSection = document.createElement('div');
    rightSection.className = 'pagination-controls';
    
    // Page size changer
    if (options.showSizeChanger) {
      const sizeChanger = this.createPageSizeChanger(
        paginationInfo.pageSize, 
        options.pageSizeOptions || [10, 20, 50, 100]
      );
      rightSection.appendChild(sizeChanger);
    }
    
    // Page navigation
    const pageNav = this.createPageNavigation(paginationInfo);
    rightSection.appendChild(pageNav);
    
    container.appendChild(rightSection);
    
    return container;
  },

  /**
   * Create page size changer
   * @param {number} current - Current page size
   * @param {Array} options - Page size options
   * @returns {HTMLElement}
   */
  createPageSizeChanger(current, options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pagination-size-changer';
    
    const select = document.createElement('select');
    select.className = 'pagination-select';
    select.dataset.action = 'page-size';
    
    options.forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = `${size}件/ページ`;
      option.selected = size === current;
      select.appendChild(option);
    });
    
    wrapper.appendChild(select);
    return wrapper;
  },

  /**
   * Create page navigation controls
   * @param {Object} paginationInfo - Pagination info
   * @returns {HTMLElement}
   */
  createPageNavigation(paginationInfo) {
    const nav = document.createElement('div');
    nav.className = 'pagination-nav';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn pagination-prev';
    prevBtn.textContent = '‹';
    prevBtn.disabled = !paginationInfo.hasPrev;
    prevBtn.dataset.page = paginationInfo.current - 1;
    nav.appendChild(prevBtn);
    
    // Page numbers
    const pages = this.getPageNumbers(paginationInfo.current, paginationInfo.totalPages);
    
    // First page and ellipsis
    if (pages[0] > 1) {
      const firstBtn = this.createPageButton(1, paginationInfo.current === 1);
      nav.appendChild(firstBtn);
      
      if (pages[0] > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        nav.appendChild(ellipsis);
      }
    }
    
    // Page buttons
    pages.forEach(page => {
      const btn = this.createPageButton(page, page === paginationInfo.current);
      nav.appendChild(btn);
    });
    
    // Last page and ellipsis
    if (pages[pages.length - 1] < paginationInfo.totalPages) {
      if (pages[pages.length - 1] < paginationInfo.totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        nav.appendChild(ellipsis);
      }
      
      const lastBtn = this.createPageButton(
        paginationInfo.totalPages, 
        paginationInfo.current === paginationInfo.totalPages
      );
      nav.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn pagination-next';
    nextBtn.textContent = '›';
    nextBtn.disabled = !paginationInfo.hasNext;
    nextBtn.dataset.page = paginationInfo.current + 1;
    nav.appendChild(nextBtn);
    
    return nav;
  },

  /**
   * Create page button
   * @param {number} page - Page number
   * @param {boolean} isActive - Is current page
   * @returns {HTMLElement}
   */
  createPageButton(page, isActive = false) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn pagination-page';
    if (isActive) {
      btn.className += ' active';
    }
    btn.textContent = page;
    btn.dataset.page = page;
    btn.disabled = isActive;
    return btn;
  },

  /**
   * Handle pagination events
   * @param {HTMLElement} container - Pagination container
   * @param {Function} onPageChange - Page change callback
   * @param {Function} onPageSizeChange - Page size change callback
   */
  bindEvents(container, onPageChange, onPageSizeChange) {
    // Page buttons
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (btn && !btn.disabled) {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page)) {
          onPageChange(page);
        }
      }
    });
    
    // Page size select
    const sizeSelect = container.querySelector('[data-action="page-size"]');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', (e) => {
        const size = parseInt(e.target.value);
        if (!isNaN(size)) {
          onPageSizeChange(size);
        }
      });
    }
  }
};

// Export for different environments
// ES modules export
export default PaginationModule;

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaginationModule;
}

// Browser global
if (typeof window !== 'undefined') {
  window.PaginationModule = PaginationModule;
}