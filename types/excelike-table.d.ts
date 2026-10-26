/**
 * ExceLikeTable TypeScript Definitions
 */

type Row = Record<string, any>;

declare class ExceLikeTable<T extends Row = Row> {
  /**
   * @param container CSS selector or element to render into
   * @param options Only `data` is needed; everything else has a default.
   */
  constructor(container: string | HTMLElement, options?: ExceLikeTableOptions<T>);

  /** Copy of the current data (not filtered) */
  getData(): T[];
  /** Replace the data. Columns generated from data follow the new data. */
  setData(data: T[]): void;
  /** Alias of setData */
  updateData(data: T[]): void;
  /** Selected values per column key, e.g. `{ city: ['Tokyo'] }` */
  getFilters(): Record<string, any[]>;
  setFilters(filters: Record<string, any[]>): void;
  clearFilters(): void;
  clearAllFilters(): void;
  /**
   * Rows matching the current filters, in the current sort order (all pages), as CSV.
   * Numbers, booleans and date columns are written as data; other columns as rendered.
   * Starts a download unless `download: false`. Returns the CSV text (without BOM).
   */
  exportCSV(options?: ExportCSVOptions): string;
  setFontSize(size: FontSize): void;
  setCellPadding(padding: CellPadding): void;
  setLanguage(locale: Locale): void;
  applyTheme(themeName: ThemeName): void;
  saveSettings(): Promise<boolean>;
  loadSettings(): Promise<boolean>;
  clearSettings(): Promise<boolean>;
  showConditionalFormatting(): void;
  /** Remove the table and its event listeners */
  destroy(): void;
}

interface ExceLikeTableOptions<T extends Row = Row> {
  /** Table data array */
  data?: T[];
  /** Column definitions. Omit to generate one column per key in the data. */
  columns?: Array<ExceLikeTableColumn<T> | (keyof T & string)>;
  /** Unique row identifier (default: 'id') */
  rowKey?: string;
  /** Pagination config or false to disable (default: {pageSize: 10, showSizeChanger: true}) */
  pagination?: PaginationOptions | false;
  /** Show table borders (default: true) */
  bordered?: boolean;
  /** Table size (default: 'middle') */
  size?: 'small' | 'middle' | 'large';
  /** Show loading overlay */
  loading?: boolean;
  /** Unique table ID for settings storage. Defaults to the container id. */
  tableId?: string;
  /** Remember sort, filters, column widths etc. in localStorage (default: true) */
  persistSettings?: boolean;
  /** Custom storage adapter */
  storageAdapter?: TableStorageAdapter;
  /** UI language (default: 'en') */
  locale?: Locale;
  /** Extra or overridden UI messages, per locale */
  i18nMessages?: Partial<Record<Locale, Record<string, string>>>;
  /** Render cell values as HTML instead of text (default: false). Only enable for trusted data. */
  renderCellHTML?: boolean;
}

interface PaginationOptions {
  pageSize?: number;
  showSizeChanger?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
  current?: number;
}

interface ExceLikeTableColumn<T extends Row = Row> {
  /** Unique column id. Required unless dataIndex is given. */
  key?: string;
  /** Header text (default: key) */
  title?: string;
  /** Property name in each row (default: key) */
  dataIndex?: keyof T & string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'number' | 'date-hierarchy' | 'range';
  render?: (value: any, record: T) => string;
  onFilter?: (value: any, record: T) => boolean;
  sorter?: (a: T, b: T) => number;
  pinned?: boolean;
  hidden?: boolean;
}

interface ExportCSVOptions {
  /** Download file name (default: `<tableId>.csv`) */
  filename?: string;
  /** Start a browser download (default: true) */
  download?: boolean;
  /** Prefix the download with a UTF-8 BOM so Excel detects the encoding (default: true) */
  bom?: boolean;
}

interface TableStorageAdapter {
  save(key: string, settings: any): Promise<boolean>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<boolean>;
  isAvailable(): boolean;
}

declare namespace ColumnHelpers {
  function text(key: string, title: string, options?: Partial<ExceLikeTableColumn>): ExceLikeTableColumn;
  function number(key: string, title: string, options?: Partial<ExceLikeTableColumn>): ExceLikeTableColumn;
  function date(key: string, title: string, options?: Partial<ExceLikeTableColumn>): ExceLikeTableColumn;
  function status(key: string, title: string, statusColors?: Record<string, string>, options?: Partial<ExceLikeTableColumn>): ExceLikeTableColumn;
  function actions(title: string, actions: Array<{ key: string; label: string }>, options?: Partial<ExceLikeTableColumn>): ExceLikeTableColumn;
}

type FontSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';
type CellPadding = 'narrow' | 'standard' | 'wide';
type Locale = 'en' | 'ja';
type ThemeName = 'classic' | 'modern' | 'professional' | 'ocean' | 'dark' | 'subtle' | 'vibrant' | 'nature';

declare const TABLE_CONFIG: Readonly<Record<string, any>>;

export default ExceLikeTable;
export {
  ColumnHelpers,
  TABLE_CONFIG,
  ExceLikeTableOptions,
  ExceLikeTableColumn,
  ExportCSVOptions,
  PaginationOptions,
  TableStorageAdapter,
  FontSize,
  CellPadding,
  Locale,
  ThemeName,
};
