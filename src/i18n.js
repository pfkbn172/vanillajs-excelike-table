/**
 * Internationalization (i18n) Module for ExceLike Table
 * Handles multi-language support and localization
 */

const I18nModule = {
  /**
   * Initialize i18n system
   * @param {Object} options - i18n configuration
   */
  init(options = {}) {
    this.currentLocale = options.locale || 'en';
    this.fallbackLocale = options.fallbackLocale || 'en';
    this.messages = new Map();
    this.dateFormats = new Map();
    this.numberFormats = new Map();
    this.pluralRules = new Map();

    // Load default messages
    this.loadDefaultMessages();

    // Load custom messages if provided
    if (options.messages) {
      this.addMessages(this.currentLocale, options.messages);
    }

    // Setup formatters
    this.setupFormatters();

    return this;
  },

  /**
   * Load default messages for supported languages
   */
  loadDefaultMessages() {
    // English (default)
    this.addMessages('en', {
      // General
      'table.label': 'Data table',
      'table.loading': 'Loading...',
      'table.empty': 'No data',
      'table.error': 'Error loading data',

      // Columns
      'column.sortable': '{title}, sortable column, currently {sort}',
      'column.filtered': 'filtered',
      'column.settings': 'Column Settings',
      'column.show': 'Show',
      'column.hide': 'Hide',
      'column.pin_left': 'Pin to left',
      'column.pin_right': 'Pin to right',
      'column.unpin': 'Unpin',
      'column.resize': 'Resize column',

      // Sorting
      'sort.ascending': 'ascending',
      'sort.descending': 'descending',
      'sort.none': 'not sorted',
      'sort.announced': 'Table sorted by {column} {direction}',

      // Filtering
      'filter.label': 'Filter',
      'filter.placeholder': 'Search...',
      'filter.apply': 'Apply',
      'filter.clear': 'Clear',
      'filter.all': '(Select All)',
      'filter.announced': 'Table filtered, {count} rows visible',
      'filter.min': 'Min',
      'filter.max': 'Max',
      'filter.from': 'From',
      'filter.to': 'To',

      // Pagination
      'pagination.label': 'Table pagination',
      'pagination.previous': 'Previous page',
      'pagination.next': 'Next page',
      'pagination.first': 'First page',
      'pagination.last': 'Last page',
      'pagination.page': 'Page {page}',
      'pagination.currentPage': 'Page {page}, current page',
      'pagination.goToPage': 'Go to page {page}',
      'pagination.announced': 'Page {page} of {total}',
      'pagination.itemsPerPage': 'items per page',
      'pagination.total': '{start}-{end} of {total} items',

      // Actions
      'action.edit': 'Edit',
      'action.delete': 'Delete',
      'action.view': 'View',
      'action.copy': 'Copy',

      // Settings
      'settings.fontSize': 'Font Size',
      'settings.cellPadding': 'Cell Padding',
      'settings.theme': 'Theme',
      'settings.save': 'Save Settings',
      'settings.reset': 'Reset Settings',
      'settings.export': 'Export Settings',
      'settings.import': 'Import Settings',

      // Export
      'export.csv': 'Export to CSV',
      'export.excel': 'Export to Excel',
      'export.json': 'Export to JSON',
      'export.filename': 'Filename',
      'export.includeHeaders': 'Include headers',
      'export.selectedOnly': 'Selected rows only',

      // Navigation
      'nav.header': '{column} column header',
      'nav.cell': 'Row {row}, {column}, {value}',

      // Errors
      'error.network': 'Network error',
      'error.parsing': 'Data parsing error',
      'error.permission': 'Permission denied',

      // Accessibility
      'a11y.sortableColumn': 'Sortable column',
      'a11y.filterableColumn': 'Filterable column',
      'a11y.rowSelected': 'Row selected',
      'a11y.menuExpanded': 'Menu expanded',
      'a11y.menuCollapsed': 'Menu collapsed',

      // Time
      'time.now': 'now',
      'time.secondsAgo': '{count} seconds ago',
      'time.minutesAgo': '{count} minutes ago',
      'time.hoursAgo': '{count} hours ago',
      'time.daysAgo': '{count} days ago'
    });

    // Japanese
    this.addMessages('ja', {
      // General
      'table.label': 'データテーブル',
      'table.loading': '読み込み中...',
      'table.empty': 'データがありません',
      'table.error': 'データの読み込みエラー',

      // Columns
      'column.sortable': '{title}、ソート可能な列、現在{sort}',
      'column.filtered': 'フィルター済み',
      'column.settings': '列設定',
      'column.show': '表示',
      'column.hide': '非表示',
      'column.pin_left': '左に固定',
      'column.pin_right': '右に固定',
      'column.unpin': '固定解除',
      'column.resize': '列幅変更',

      // Sorting
      'sort.ascending': '昇順',
      'sort.descending': '降順',
      'sort.none': 'ソートなし',
      'sort.announced': 'テーブルを{column}で{direction}ソートしました',

      // Filtering
      'filter.label': 'フィルター',
      'filter.placeholder': '検索...',
      'filter.apply': '適用',
      'filter.clear': 'クリア',
      'filter.all': '(すべて選択)',
      'filter.announced': 'テーブルをフィルターしました、{count}行が表示されています',
      'filter.min': '最小',
      'filter.max': '最大',
      'filter.from': '開始',
      'filter.to': '終了',

      // Pagination
      'pagination.label': 'テーブルページネーション',
      'pagination.previous': '前のページ',
      'pagination.next': '次のページ',
      'pagination.first': '最初のページ',
      'pagination.last': '最後のページ',
      'pagination.page': 'ページ{page}',
      'pagination.currentPage': 'ページ{page}、現在のページ',
      'pagination.goToPage': 'ページ{page}に移動',
      'pagination.announced': '{total}ページ中{page}ページ',
      'pagination.itemsPerPage': '件/ページ',
      'pagination.total': '{total}件中{start}-{end}件',

      // Actions
      'action.edit': '編集',
      'action.delete': '削除',
      'action.view': '表示',
      'action.copy': 'コピー',

      // Settings
      'settings.fontSize': '文字サイズ',
      'settings.cellPadding': 'セル間隔',
      'settings.theme': 'テーマ',
      'settings.save': '設定を保存',
      'settings.reset': '設定をリセット',
      'settings.export': '設定をエクスポート',
      'settings.import': '設定をインポート',

      // Export
      'export.csv': 'CSVにエクスポート',
      'export.excel': 'Excelにエクスポート',
      'export.json': 'JSONにエクスポート',
      'export.filename': 'ファイル名',
      'export.includeHeaders': 'ヘッダーを含む',
      'export.selectedOnly': '選択された行のみ',

      // Navigation
      'nav.header': '{column}列ヘッダー',
      'nav.cell': '行{row}、{column}、{value}',

      // Errors
      'error.network': 'ネットワークエラー',
      'error.parsing': 'データ解析エラー',
      'error.permission': '権限がありません',

      // Time
      'time.now': 'たった今',
      'time.secondsAgo': '{count}秒前',
      'time.minutesAgo': '{count}分前',
      'time.hoursAgo': '{count}時間前',
      'time.daysAgo': '{count}日前'
    });

    // Add more languages as needed
    this.addMessages('es', {
      'table.label': 'Tabla de datos',
      'table.loading': 'Cargando...',
      'table.empty': 'Sin datos',
      'filter.placeholder': 'Buscar...',
      'pagination.previous': 'Anterior',
      'pagination.next': 'Siguiente',
      // ... more Spanish translations
    });

    this.addMessages('fr', {
      'table.label': 'Tableau de données',
      'table.loading': 'Chargement...',
      'table.empty': 'Aucune donnée',
      'filter.placeholder': 'Rechercher...',
      'pagination.previous': 'Précédent',
      'pagination.next': 'Suivant',
      // ... more French translations
    });

    this.addMessages('de', {
      'table.label': 'Datentabelle',
      'table.loading': 'Laden...',
      'table.empty': 'Keine Daten',
      'filter.placeholder': 'Suchen...',
      'pagination.previous': 'Zurück',
      'pagination.next': 'Weiter',
      // ... more German translations
    });
  },

  /**
   * Add messages for a locale
   * @param {string} locale - Locale code
   * @param {Object} messages - Messages object
   */
  addMessages(locale, messages) {
    if (!this.messages.has(locale)) {
      this.messages.set(locale, new Map());
    }
    
    const localeMessages = this.messages.get(locale);
    Object.entries(messages).forEach(([key, value]) => {
      localeMessages.set(key, value);
    });
  },

  /**
   * Set current locale
   * @param {string} locale - Locale code
   */
  setLocale(locale) {
    if (this.messages.has(locale)) {
      this.currentLocale = locale;
      this.setupFormatters();
      return true;
    }
    return false;
  },

  /**
   * Get current locale
   * @returns {string} Current locale
   */
  getLocale() {
    return this.currentLocale;
  },

  /**
   * Translate message
   * @param {string} key - Message key
   * @param {Object} params - Parameters for interpolation
   * @param {string} locale - Override locale
   * @returns {string} Translated message
   */
  t(key, params = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;
    let message = this.getMessage(key, targetLocale);

    if (!message && targetLocale !== this.fallbackLocale) {
      message = this.getMessage(key, this.fallbackLocale);
    }

    if (!message) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }

    return this.interpolate(message, params);
  },

  /**
   * Get message for key and locale
   * @param {string} key - Message key
   * @param {string} locale - Locale code
   * @returns {string|null} Message or null
   */
  getMessage(key, locale) {
    const localeMessages = this.messages.get(locale);
    return localeMessages ? localeMessages.get(key) : null;
  },

  /**
   * Interpolate parameters into message
   * @param {string} message - Message template
   * @param {Object} params - Parameters
   * @returns {string} Interpolated message
   */
  interpolate(message, params) {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  },

  /**
   * Pluralize message based on count
   * @param {string} key - Message key
   * @param {number} count - Count for pluralization
   * @param {Object} params - Additional parameters
   * @returns {string} Pluralized message
   */
  plural(key, count, params = {}) {
    const pluralKey = this.getPluralKey(count, this.currentLocale);
    const messageKey = `${key}.${pluralKey}`;
    
    return this.t(messageKey, { count, ...params });
  },

  /**
   * Get plural key based on count and locale
   * @param {number} count - Count
   * @param {string} locale - Locale
   * @returns {string} Plural key
   */
  getPluralKey(count, locale) {
    // Simplified plural rules - in production, use Intl.PluralRules
    if (locale === 'ja' || locale === 'ko' || locale === 'zh') {
      return 'other'; // No plural forms in these languages
    }

    if (count === 1) return 'one';
    return 'other';
  },

  /**
   * Setup formatters for current locale
   */
  setupFormatters() {
    // Date formatter
    this.dateFormatter = new Intl.DateTimeFormat(this.currentLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    this.dateTimeFormatter = new Intl.DateTimeFormat(this.currentLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Number formatter
    this.numberFormatter = new Intl.NumberFormat(this.currentLocale);
    
    // Currency formatter (default to USD, can be customized)
    this.currencyFormatter = new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency: this.getCurrencyForLocale(this.currentLocale)
    });

    // Percentage formatter
    this.percentFormatter = new Intl.NumberFormat(this.currentLocale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  },

  /**
   * Get default currency for locale
   * @param {string} locale - Locale code
   * @returns {string} Currency code
   */
  getCurrencyForLocale(locale) {
    const currencyMap = {
      'en': 'USD',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'ja': 'JPY',
      'ja-JP': 'JPY',
      'de': 'EUR',
      'de-DE': 'EUR',
      'fr': 'EUR',
      'fr-FR': 'EUR',
      'es': 'EUR',
      'es-ES': 'EUR',
      'zh': 'CNY',
      'zh-CN': 'CNY',
      'ko': 'KRW',
      'ko-KR': 'KRW'
    };

    return currencyMap[locale] || currencyMap[locale.split('-')[0]] || 'USD';
  },

  /**
   * Format date
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    if (options.relative) {
      return this.formatRelativeTime(dateObj);
    }

    const formatter = options.includeTime ? 
      this.dateTimeFormatter : 
      this.dateFormatter;

    return formatter.format(dateObj);
  },

  /**
   * Format relative time
   * @param {Date} date - Date to format
   * @returns {string} Relative time string
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return this.t('time.now');
    } else if (diffMinutes < 60) {
      return this.t('time.minutesAgo', { count: diffMinutes });
    } else if (diffHours < 24) {
      return this.t('time.hoursAgo', { count: diffHours });
    } else {
      return this.t('time.daysAgo', { count: diffDays });
    }
  },

  /**
   * Format number
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    if (typeof number !== 'number' || isNaN(number)) return '';

    if (options.style === 'currency') {
      const currencyFormatter = new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency: options.currency || this.getCurrencyForLocale(this.currentLocale)
      });
      return currencyFormatter.format(number);
    }

    if (options.style === 'percent') {
      return this.percentFormatter.format(number);
    }

    return this.numberFormatter.format(number);
  },

  /**
   * Check if locale is RTL
   * @param {string} locale - Locale code
   * @returns {boolean} True if RTL
   */
  isRTL(locale = null) {
    const targetLocale = locale || this.currentLocale;
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.some(rtl => targetLocale.startsWith(rtl));
  },

  /**
   * Get available locales
   * @returns {Array} Array of locale codes
   */
  getAvailableLocales() {
    return Array.from(this.messages.keys());
  },

  /**
   * Load locale data dynamically
   * @param {string} locale - Locale code
   * @param {string} url - URL to load locale data from
   * @returns {Promise} Promise that resolves when data is loaded
   */
  async loadLocale(locale, url) {
    try {
      const response = await fetch(url);
      const messages = await response.json();
      this.addMessages(locale, messages);
      return true;
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
      return false;
    }
  },

  /**
   * Export current locale data
   * @returns {Object} Locale data
   */
  exportLocale(locale = null) {
    const targetLocale = locale || this.currentLocale;
    const localeMessages = this.messages.get(targetLocale);
    
    if (!localeMessages) return {};

    const exported = {};
    localeMessages.forEach((value, key) => {
      exported[key] = value;
    });
    
    return exported;
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nModule;
}

if (typeof window !== 'undefined') {
  window.I18nModule = I18nModule;
}

export default I18nModule;