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
      'filter.clearColumn': 'Clear this column filter',
      'filter.cancel': 'Cancel',
      'filter.ok': 'OK',
      'filter.filterByRange': 'Filter by Range',
      'filter.selectValues': 'Select Values',
      'filter.empty': '(Blank)',
      'filter.includeBlank': 'Include Blank',
      'filter.rangeDescription': '{min} to {max}',
      'filter.startDate': 'Start Date',
      'filter.endDate': 'End Date',
      'filter.expandLabel': 'Expand:',
      'filter.year': 'Year',
      'filter.month': 'Month',
      'filter.day': 'Day',
      'filter.dayUnit': 'day',
      'filter.monthNames': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

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

      // Menu
      'menu.clearFilters': 'Clear All Filters',
      'menu.columnSettings': 'Column Settings',
      'menu.exportCSV': 'Export CSV',
      'menu.conditionalFormat': 'Conditional Formatting',
      'menu.fontSize': 'Font Size',
      'menu.cellPadding': 'Cell Padding',
      'menu.language': 'Language',
      'menu.clearStorage': 'Clear LocalStorage',

      // Font size options
      'fontSize.smallest': 'Smallest',
      'fontSize.small': 'Small',
      'fontSize.medium': 'Medium',
      'fontSize.large': 'Large',
      'fontSize.largest': 'Largest',

      // Cell padding options
      'cellPadding.wide': 'Wide',
      'cellPadding.standard': 'Standard',
      'cellPadding.narrow': 'Narrow',

      // Settings
      'settings.fontSize': 'Font Size',
      'settings.cellPadding': 'Cell Padding',
      'settings.theme': 'Theme',
      'settings.save': 'Save Settings',
      'settings.reset': 'Reset Settings',
      'settings.export': 'Export Settings',
      'settings.import': 'Import Settings',
      'settings.columnSettings': 'Column Settings',
      'settings.clearStorageTitle': 'Clear LocalStorage Confirmation',
      'settings.clearStorageMessage': 'This will delete all ExceLikeTable LocalStorage data and reset settings to default. Continue?',
      'settings.clearStorageCancel': 'Cancel',
      'settings.clearStorageConfirm': 'Delete',
      'settings.clearScopeThis': 'Clear this table only',
      'settings.clearScopeAll': 'Clear all tables',
      'settings.cleared': 'Settings cleared. Page will reload automatically.',
      'settings.clearError': 'Error occurred while clearing settings',
      'settings.pluginNotLoaded': 'Conditional formatting plugin is not loaded.\nPlease load the plugin file.',
      'settings.clearThisTable': 'Clear This Table Settings',
      'settings.clearAllTables': 'Clear All Tables Settings',
      'settings.clearThisTableMessage': '⚠️ Warning: This will delete all settings for this table\n\nThe following settings will be lost:\n• Column widths and pinning\n• Filter and sort states\n• Conditional formatting rules\n• Font size and cell padding\n• Language preference\n\nThis action cannot be undone. Continue?',
      'settings.clearAllTablesMessage': '⚠️ WARNING: This will delete settings for ALL tables\n\nThe following settings will be lost from ALL tables:\n• Column widths and pinning\n• Filter and sort states\n• Conditional formatting rules\n• Font size and cell padding\n• Language preferences\n\nThis action cannot be undone and affects all tables in this application. Continue?',
      'settings.clearSuccess': 'Settings cleared successfully',
      'settings.clearCancelled': 'Operation cancelled',

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
      'time.daysAgo': '{count} days ago',

      // Conditional Formatting
      'cf.title': 'Conditional Formatting Rules',
      'cf.newRule': 'New Rule',
      'cf.editRule': 'Edit Rule',
      'cf.createRule': 'Create New Rule',
      'cf.rulesCount': 'Rules: {count}',
      'cf.close': 'Close',
      'cf.applyAll': 'Apply All',
      'cf.cancel': 'Cancel',
      'cf.save': 'Save',
      'cf.update': 'Update',
      'cf.create': 'Create',
      
      // Rule Form
      'cf.ruleName': 'Rule Name',
      'cf.ruleNamePlaceholder': 'Enter rule name',
      'cf.column': 'Column',
      'cf.selectColumn': 'Select column...',
      'cf.operator': 'Operator',
      'cf.value': 'Value',
      'cf.valuePlaceholder': 'Enter comparison value',
      'cf.dataType': 'Data Type',
      'cf.applyTo': 'Apply To',
      
      // Operators
      'cf.op.equals': 'Equals (=)',
      'cf.op.notEquals': 'Not equals (≠)',
      'cf.op.greater': 'Greater than (>)',
      'cf.op.greaterEqual': 'Greater than or equal (≥)',
      'cf.op.less': 'Less than (<)',
      'cf.op.lessEqual': 'Less than or equal (≤)',
      'cf.op.contains': 'Contains',
      'cf.op.notContains': 'Does not contain',
      
      // Data Types
      'cf.dataType.text': 'Text',
      'cf.dataType.number': 'Number',
      'cf.dataType.date': 'Date',
      
      // Apply To
      'cf.applyTo.cell': 'Cell only',
      'cf.applyTo.row': 'Entire row',
      
      // Format
      'cf.format': 'Format',
      'cf.backgroundColor': 'Background Color',
      'cf.textColor': 'Text Color',
      'cf.textStyle': 'Text Style',
      'cf.bold': 'Bold',
      'cf.italic': 'Italic',
      'cf.underline': 'Underline',
      'cf.preview': 'Preview',
      'cf.previewSample': 'Sample Cell',
      
      // Messages
      'cf.noRules': 'No conditional formatting rules yet.',
      'cf.clickNewRule': 'Click "New Rule" to get started.',
      'cf.ruleCreated': 'Rule created successfully',
      'cf.ruleUpdated': 'Rule updated successfully',
      'cf.ruleDeleted': 'Rule deleted successfully',
      'cf.rulesApplied': 'Conditional formatting applied',
      'cf.priorityUpdated': 'Priority updated',
      'cf.confirmDelete': 'Are you sure you want to delete the rule "{name}"?',
      'cf.errorSave': 'Error saving rule',
      'cf.validation.nameRequired': 'Rule name is required',
      'cf.validation.nameTooLong': 'Rule name must be at most {max} characters',
      'cf.validation.invalidColor': 'Color must be a hex code like #RRGGBB',
      'cf.validation.invalidOperator': 'Invalid operator: {operator}',
      'cf.validation.valueTooLong': 'Value must be at most {max} characters',
      'cf.validation.ruleInvalid': 'Invalid rule: {errors}',
      'cf.validation.tooManyRules': 'You can create up to {max} rules',
      
      // Rule Description
      'cf.priority': 'Priority: {priority}',
      'cf.sample': 'Sample'
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
      'filter.clearColumn': 'この列のフィルタをクリア',
      'filter.cancel': 'キャンセル',
      'filter.ok': 'OK',
      'filter.filterByRange': '範囲で絞り込む',
      'filter.selectValues': '値を選択',
      'filter.empty': '(空白)',
      'filter.includeBlank': '空白を含む',
      'filter.rangeDescription': '{min} 以上 {max} 以下の値を表示',
      'filter.startDate': '開始日',
      'filter.endDate': '終了日',
      'filter.expandLabel': '展開表示:',
      'filter.year': '年',
      'filter.month': '月',
      'filter.day': '日',
      'filter.dayUnit': '日',
      'filter.monthNames': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],

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

      // Menu
      'menu.clearFilters': 'フィルタ全解除',
      'menu.columnSettings': '表示列設定',
      'menu.exportCSV': 'CSVで書き出し',
      'menu.conditionalFormat': '条件付き書式',
      'menu.fontSize': '文字サイズ',
      'menu.cellPadding': 'セル内パディング',
      'menu.language': '言語',
      'menu.clearStorage': 'LocalStorageクリア',

      // Font size options
      'fontSize.smallest': '最小',
      'fontSize.small': '小',
      'fontSize.medium': '中',
      'fontSize.large': '大',
      'fontSize.largest': '最大',

      // Cell padding options
      'cellPadding.wide': '広め',
      'cellPadding.standard': '標準',
      'cellPadding.narrow': '狭め',

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
      'settings.columnSettings': '列設定',
      'settings.clearStorageTitle': 'LocalStorage クリア確認',
      'settings.clearStorageMessage': 'ExceLikeTable関連のLocalStorage情報を削除し、設定をデフォルトに戻します。よろしいですか？',
      'settings.clearStorageCancel': 'キャンセル',
      'settings.clearStorageConfirm': '削除する',
      'settings.clearScopeThis': 'このテーブルのみクリア',
      'settings.clearScopeAll': '全てのテーブルをクリア',
      'settings.cleared': '設定をクリアしました。ページが自動で再読み込みされます。',
      'settings.clearError': '設定クリア中にエラーが発生しました',
      'settings.pluginNotLoaded': '条件付き書式プラグインが読み込まれていません。\nプラグインファイルを読み込んでください。',
      'settings.clearThisTable': 'このテーブルの設定をクリア',
      'settings.clearAllTables': '全テーブルの設定をクリア',
      'settings.clearThisTableMessage': '⚠️ 警告: このテーブルの全設定を削除します\n\n以下の設定が失われます：\n• 列幅とピン留め\n• フィルタ・ソート状態\n• 条件付き書式ルール\n• 文字サイズとセルパディング\n• 言語設定\n\nこの操作は取り消せません。続行しますか？',
      'settings.clearAllTablesMessage': '⚠️ 警告: 全テーブルの設定を削除します\n\n以下の設定が全テーブルから失われます：\n• 列幅とピン留め\n• フィルタ・ソート状態\n• 条件付き書式ルール\n• 文字サイズとセルパディング\n• 言語設定\n\nこの操作は取り消せず、このアプリケーション内の全テーブルに影響します。続行しますか？',
      'settings.clearSuccess': '設定をクリアしました',
      'settings.clearCancelled': '操作をキャンセルしました',

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
      'time.daysAgo': '{count}日前',

      // Conditional Formatting
      'cf.title': '条件付き書式ルール',
      'cf.newRule': '新規ルール',
      'cf.editRule': 'ルール編集',
      'cf.createRule': '新規ルール作成',
      'cf.rulesCount': 'ルール数: {count}',
      'cf.close': '閉じる',
      'cf.applyAll': 'すべて適用',
      'cf.cancel': 'キャンセル',
      'cf.save': '保存',
      'cf.update': '更新',
      'cf.create': '作成',
      
      // Rule Form
      'cf.ruleName': 'ルール名',
      'cf.ruleNamePlaceholder': 'ルール名を入力',
      'cf.column': '列',
      'cf.selectColumn': '列を選択...',
      'cf.operator': '演算子',
      'cf.value': '値',
      'cf.valuePlaceholder': '比較値を入力',
      'cf.dataType': 'データ型',
      'cf.applyTo': '適用先',
      
      // Operators
      'cf.op.equals': '等しい (=)',
      'cf.op.notEquals': '等しくない (≠)',
      'cf.op.greater': 'より大きい (>)',
      'cf.op.greaterEqual': '以上 (≥)',
      'cf.op.less': 'より小さい (<)',
      'cf.op.lessEqual': '以下 (≤)',
      'cf.op.contains': '含む',
      'cf.op.notContains': '含まない',
      
      // Data Types
      'cf.dataType.text': 'テキスト',
      'cf.dataType.number': '数値',
      'cf.dataType.date': '日付',
      
      // Apply To
      'cf.applyTo.cell': 'セルのみ',
      'cf.applyTo.row': '行全体',
      
      // Format
      'cf.format': '書式',
      'cf.backgroundColor': '背景色',
      'cf.textColor': '文字色',
      'cf.textStyle': '文字スタイル',
      'cf.bold': '太字',
      'cf.italic': '斜体',
      'cf.underline': '下線',
      'cf.preview': 'プレビュー',
      'cf.previewSample': 'サンプルセル',
      
      // Messages
      'cf.noRules': 'まだ条件付き書式ルールがありません。',
      'cf.clickNewRule': '「新規ルール」をクリックして開始してください。',
      'cf.ruleCreated': 'ルールを作成しました',
      'cf.ruleUpdated': 'ルールを更新しました',
      'cf.ruleDeleted': 'ルールを削除しました',
      'cf.rulesApplied': '条件付き書式を適用しました',
      'cf.priorityUpdated': '優先度を更新しました',
      'cf.confirmDelete': 'ルール「{name}」を削除してよろしいですか？',
      'cf.errorSave': 'ルールの保存中にエラーが発生しました',
      'cf.validation.nameRequired': 'ルール名は必須です',
      'cf.validation.nameTooLong': 'ルール名は{max}文字以内で入力してください',
      'cf.validation.invalidColor': '有効なカラーコード（#RRGGBB）を入力してください',
      'cf.validation.invalidOperator': '無効な演算子です: {operator}',
      'cf.validation.valueTooLong': '値は{max}文字以内で入力してください',
      'cf.validation.ruleInvalid': 'ルールの内容に誤りがあります: {errors}',
      'cf.validation.tooManyRules': 'ルールは{max}件まで作成できます',
      
      // Rule Description
      'cf.priority': '優先度: {priority}',
      'cf.sample': 'サンプル'
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
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
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
      // Removed: de, fr, es (Spanish, French, German) - now supporting only Japanese and English
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

export default I18nModule;
