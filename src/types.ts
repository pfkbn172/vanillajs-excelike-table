/**
 * Enhanced TypeScript definitions for ExceLike Table
 */

// Core Types
export type TableSize = 'small' | 'middle' | 'large';
export type FontSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';
export type CellPadding = 'narrow' | 'standard' | 'wide';
export type SortDirection = 'asc' | 'desc' | null;
export type FilterType = 'text' | 'date-hierarchy' | 'range' | 'custom';
export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'custom';

// Feature flags
export type TableFeature = 
  | 'sorting' 
  | 'filtering' 
  | 'pagination' 
  | 'columnSettings' 
  | 'persistSettings' 
  | 'columnResizing' 
  | 'columnPinning'
  | 'virtualScrolling'
  | 'accessibility'
  | 'i18n';

export type TablePreset = 'simple' | 'standard' | 'advanced' | 'excel';

// Data types
export interface TableRecord {
  [key: string]: any;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  pinned?: 'left' | 'right' | false;
  visible?: boolean;
  type?: ColumnType;
  filterType?: FilterType;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  
  // Functions
  render?: (value: T, record: TableRecord, column: TableColumn) => string | HTMLElement;
  onFilter?: (value: any, record: TableRecord) => boolean;
  sorter?: (a: TableRecord, b: TableRecord) => number;
  
  // Custom properties
  [key: string]: any;
}

// Pagination
export interface PaginationOptions {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
  pageSizeOptions?: number[];
  simple?: boolean;
  size?: 'small' | 'default';
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  responsive?: boolean;
}

// Filters
export interface FilterValue {
  [key: string]: any;
}

export interface DateHierarchyFilter {
  years?: number[];
  months?: string[];
  days?: string[];
}

export interface RangeFilter {
  min?: number;
  max?: number;
}

// Sorting
export interface SortState {
  column: string | null;
  direction: SortDirection;
}

// Virtual scrolling
export interface VirtualScrollOptions {
  enabled: boolean;
  itemHeight: number;
  buffer?: number;
  threshold?: number;
}

// Accessibility
export interface AccessibilityOptions {
  enabled: boolean;
  announceChanges?: boolean;
  keyboardNavigation?: boolean;
  screenReader?: boolean;
  highContrast?: boolean;
}

// Internationalization
export interface I18nConfig {
  locale: string;
  messages: Record<string, string>;
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
}

// Theme system
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    background: string;
    border: string;
    text: string;
    hover: string;
    selected: string;
    disabled: string;
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<FontSize, string>;
  };
}

// Storage adapter interface
export interface StorageAdapter {
  save(key: string, data: any): Promise<boolean>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<boolean>;
  clear?(): Promise<boolean>;
  isAvailable(): boolean;
}

// Export options
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  filename?: string;
  includeHeaders?: boolean;
  selectedRowsOnly?: boolean;
  visibleColumnsOnly?: boolean;
  customHeaders?: Record<string, string>;
}

// Event handlers
export type TableEventHandler<T = any> = (event: T) => void;

export interface TableEvents {
  onSort?: TableEventHandler<{ column: string; direction: SortDirection }>;
  onFilter?: TableEventHandler<{ filters: FilterValue }>;
  onPageChange?: TableEventHandler<{ page: number; pageSize: number }>;
  onRowClick?: TableEventHandler<{ record: TableRecord; index: number; event: MouseEvent }>;
  onRowDoubleClick?: TableEventHandler<{ record: TableRecord; index: number; event: MouseEvent }>;
  onSelectionChange?: TableEventHandler<{ selectedRows: TableRecord[]; selectedKeys: string[] }>;
  onColumnResize?: TableEventHandler<{ column: string; width: number }>;
  onColumnReorder?: TableEventHandler<{ fromIndex: number; toIndex: number }>;
  onExport?: TableEventHandler<{ format: string; data: any[] }>;
}

// Main table options
export interface ExceLikeTableOptions {
  // Data
  data?: TableRecord[];
  columns?: TableColumn[];
  rowKey?: string | ((record: TableRecord) => string);
  
  // Configuration
  preset?: TablePreset;
  features?: TableFeature[];
  size?: TableSize;
  bordered?: boolean;
  loading?: boolean;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  
  // Pagination
  pagination?: PaginationOptions | false;
  
  // Virtual scrolling
  virtualScroll?: VirtualScrollOptions;
  
  // Accessibility
  accessibility?: AccessibilityOptions;
  
  // Internationalization
  i18n?: I18nConfig;
  
  // Theme
  theme?: ThemeConfig;
  
  // Storage
  tableId?: string;
  persistSettings?: boolean;
  storageAdapter?: StorageAdapter;
  
  // Events
  ...TableEvents;
  
  // Performance
  debounceMs?: number;
  throttleMs?: number;
  
  // Custom options
  [key: string]: any;
}

// Component state
export interface TableState {
  data: TableRecord[];
  filteredData: TableRecord[];
  sortedData: TableRecord[];
  displayData: TableRecord[];
  
  // UI state
  filters: FilterValue;
  sortState: SortState;
  currentPage: number;
  pageSize: number;
  selectedRows: Set<string>;
  
  // Column state
  columnWidths: Record<string, number>;
  visibleColumns: Record<string, boolean>;
  pinnedColumns: Record<string, 'left' | 'right' | false>;
  columnOrder: string[];
  
  // Visual state
  fontSize: FontSize;
  cellPadding: CellPadding;
  theme: string;
  
  // Interaction state
  openFilter: string | null;
  hoveredRow: number | null;
  focusedCell: { row: number; column: string } | null;
  
  // Performance state
  virtualScroll: {
    scrollTop: number;
    startIndex: number;
    endIndex: number;
  };
}

// Column helper functions
export interface ColumnHelperOptions {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  [key: string]: any;
}

export interface NumberColumnOptions extends ColumnHelperOptions {
  precision?: number;
  currency?: string;
  percentage?: boolean;
  format?: Intl.NumberFormatOptions;
}

export interface DateColumnOptions extends ColumnHelperOptions {
  format?: string;
  locale?: string;
}

export interface StatusColumnOptions extends ColumnHelperOptions {
  statusColors?: Record<string, string>;
  statusIcons?: Record<string, string>;
}

export interface ActionColumnOptions extends ColumnHelperOptions {
  actions: Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: (record: TableRecord) => boolean;
    onClick?: (record: TableRecord, action: string) => void;
  }>;
}

// Plugin system (for future extensibility)
export interface TablePlugin {
  name: string;
  version: string;
  install: (table: ExceLikeTable) => void;
  uninstall?: (table: ExceLikeTable) => void;
}

// Main class interface
export declare class ExceLikeTable {
  constructor(container: string | HTMLElement, options?: ExceLikeTableOptions);
  
  // Data methods
  setData(data: TableRecord[]): void;
  updateData(data: TableRecord[]): void;
  getData(): TableRecord[];
  getFilteredData(): TableRecord[];
  
  // Filter methods
  getFilters(): FilterValue;
  setFilters(filters: FilterValue): void;
  clearFilters(): void;
  clearAllFilters(): void;
  
  // Sort methods
  getSortState(): SortState;
  setSortState(column: string, direction: SortDirection): void;
  clearSort(): void;
  
  // Pagination methods
  getCurrentPage(): number;
  getPageSize(): number;
  getTotalPages(): number;
  setPage(page: number): void;
  setPageSize(size: number): void;
  
  // Selection methods
  getSelectedRows(): TableRecord[];
  getSelectedKeys(): string[];
  setSelectedRows(keys: string[]): void;
  clearSelection(): void;
  
  // Column methods
  getColumns(): TableColumn[];
  setColumns(columns: TableColumn[]): void;
  showColumn(key: string): void;
  hideColumn(key: string): void;
  resizeColumn(key: string, width: number): void;
  pinColumn(key: string, position: 'left' | 'right' | false): void;
  reorderColumns(fromIndex: number, toIndex: number): void;
  
  // Styling methods
  setFontSize(size: FontSize): void;
  setCellPadding(padding: CellPadding): void;
  setTheme(theme: ThemeConfig | string): void;
  
  // Settings methods
  saveSettings(): Promise<boolean>;
  loadSettings(): Promise<boolean>;
  clearSettings(): Promise<boolean>;
  exportSettings(): any;
  importSettings(settings: any): void;
  
  // Export methods
  exportData(options?: ExportOptions): Promise<void>;
  exportToCSV(filename?: string): Promise<void>;
  exportToExcel(filename?: string): Promise<void>;
  
  // Accessibility methods
  setAccessibilityMode(enabled: boolean): void;
  announceChange(message: string): void;
  focusCell(row: number, column: string): void;
  
  // Internationalization methods
  setLocale(locale: string, messages?: Record<string, string>): void;
  t(key: string, params?: Record<string, any>): string;
  
  // Event methods
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data?: any): void;
  
  // Plugin methods
  use(plugin: TablePlugin): void;
  unuse(pluginName: string): void;
  
  // Lifecycle methods
  refresh(): void;
  resize(): void;
  destroy(): void;
  
  // State access
  getState(): Readonly<TableState>;
}