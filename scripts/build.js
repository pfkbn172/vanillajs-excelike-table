const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const isDev = process.argv.includes('--dev');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log(`Building ExceLikeTable Library${isDev ? ' (Development)' : ''}...`);

// Read source files
const jsContent = fs.readFileSync(path.join(srcDir, 'ExceLikeTable.js'), 'utf8');
const cssContent = fs.readFileSync(path.join(srcDir, 'ExceLikeTable.css'), 'utf8');

// Create ESM version
const esmContent = `${jsContent}

// ESM Export
export { ExceLikeTable as default, ColumnHelpers, TableUtils, TABLE_PRESETS, TABLE_CONFIG };`;

// Create CommonJS version 
const cjsContent = `${jsContent}

// CommonJS Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExceLikeTable;
  module.exports.ColumnHelpers = ColumnHelpers;
  module.exports.TableUtils = TableUtils;
  module.exports.TABLE_PRESETS = TABLE_PRESETS;
  module.exports.TABLE_CONFIG = TABLE_CONFIG;
}

// Browser global
if (typeof window !== 'undefined') {
  window.ExceLikeTable = ExceLikeTable;
  window.ColumnHelpers = ColumnHelpers;
}`;

// Write unminified versions
fs.writeFileSync(path.join(distDir, 'excelike-table.esm.js'), esmContent);
fs.writeFileSync(path.join(distDir, 'excelike-table.js'), cjsContent);
fs.writeFileSync(path.join(distDir, 'excelike-table.css'), cssContent);

console.log('✓ Unminified files created');

// Minify JavaScript
minify(jsContent, {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2
  },
  mangle: {
    reserved: ['ExceLikeTable']
  },
  format: {
    comments: false
  }
}).then(result => {
  fs.writeFileSync(path.join(distDir, 'excelike-table.min.js'), result.code);
  console.log('✓ Minified JavaScript created');
  
  // Create basic CSS minification
  const minifiedCSS = cssContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
    .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
    .replace(/;\s*/g, ';') // Remove spaces after semicolon
    .trim();
  
  fs.writeFileSync(path.join(distDir, 'excelike-table.min.css'), minifiedCSS);
  console.log('✓ Minified CSS created');
  
  // Create TypeScript definition file
  const dtsContent = `declare class ExceLikeTable {
  constructor(container: string | HTMLElement, options?: ExceLikeTableOptions);
  
  setData(data: any[]): void;
  updateData(data: any[]): void;
  getFilters(): Record<string, any>;
  setFilters(filters: Record<string, any>): void;
  clearFilters(): void;
  clearAllFilters(): void;
  setFontSize(size: FontSize): void;
  setCellPadding(padding: CellPadding): void;
  saveSettings(): Promise<boolean>;
  loadSettings(): Promise<boolean>;
  clearSettings(): Promise<boolean>;
  destroy(): void;
}

interface ExceLikeTableOptions {
  data?: any[];
  columns?: ExceLikeTableColumn[];
  preset?: 'simple' | 'standard' | 'advanced' | 'excel';
  features?: Feature[];
  rowKey?: string;
  pagination?: PaginationOptions | false;
  bordered?: boolean;
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  tableId?: string;
  persistSettings?: boolean;
  storageAdapter?: TableStorageAdapter;
}

interface PaginationOptions {
  pageSize?: number;
  showSizeChanger?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
  current?: number;
}

interface ExceLikeTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'date-hierarchy' | 'range';
  render?: (value: any, record: any) => string;
  onFilter?: (value: any, record: any) => boolean;
  sorter?: (a: any, b: any) => number;
}

interface TableStorageAdapter {
  save(key: string, settings: any): Promise<boolean>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<boolean>;
  isAvailable(): boolean;
}

declare namespace ColumnHelpers {
  function text(key: string, title: string, options?: any): ExceLikeTableColumn;
  function number(key: string, title: string, options?: any): ExceLikeTableColumn;
  function date(key: string, title: string, options?: any): ExceLikeTableColumn;
  function status(key: string, title: string, statusColors?: Record<string, string>, options?: any): ExceLikeTableColumn;
  function actions(title: string, actions: Array<{key: string, label: string}>, options?: any): ExceLikeTableColumn;
}

type Feature = 'sorting' | 'filtering' | 'pagination' | 'columnSettings' | 'persistSettings' | 'columnResizing' | 'columnPinning';
type FontSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';
type CellPadding = 'narrow' | 'standard' | 'wide';

export = ExceLikeTable;
export as namespace ExceLikeTable;
export { ColumnHelpers, TableStorageAdapter, ExceLikeTableOptions, ExceLikeTableColumn };`;
  
  fs.writeFileSync(path.join(distDir, 'excelike-table.d.ts'), dtsContent);
  console.log('✓ TypeScript definitions created');
  
  // Create combined bundle
  const combinedContent = `${jsContent}\n\n/* CSS */\n(function() {\n  const style = document.createElement('style');\n  style.textContent = \`${cssContent.replace(/`/g, '\\`')}\`;\n  document.head.appendChild(style);\n})();`;
  
  fs.writeFileSync(path.join(distDir, 'excelike-table.bundle.js'), combinedContent);
  console.log('✓ Combined bundle created');
  
  console.log('\nBuild completed successfully!');
  console.log('Generated files:');
  console.log('- excelike-table.js (unminified)');
  console.log('- excelike-table.min.js (minified)');
  console.log('- excelike-table.css (unminified)');
  console.log('- excelike-table.min.css (minified)');
  console.log('- excelike-table.d.ts (TypeScript definitions)');
  console.log('- excelike-table.bundle.js (combined JS + CSS)');
  
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});