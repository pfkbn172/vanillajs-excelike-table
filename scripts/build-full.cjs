const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Read package.json to get current version
const packageJson = require('../package.json');
const version = packageJson.version;

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const isDev = process.argv.includes('--dev');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log(`Building ExceLikeTable Library v${version}${isDev ? ' (Development)' : ''}...`);

// Define module order for proper dependency resolution
const moduleOrder = [
  // Core utilities
  'dom-utils.js',
  'performance-utils.js',

  // Additional modules
  'virtual-scroll.js',
  'accessibility.js',
  'i18n.js',
  'theme-system.js',
  'export-module.js',
  'plugin-system.js',
  'webworker-support.js',

  // Plugin files
  'plugins/column-resizer-plugin.js',
  'plugins/row-selection-plugin.js',

  // Conditional formatting plugin files (in dependency order)
  'plugins/conditional-formatting/constants.js',
  'plugins/conditional-formatting/utils.js',
  'plugins/conditional-formatting/performance-optimizations.js',
  'plugins/conditional-formatting/rule.js',
  'plugins/conditional-formatting/evaluator.js',
  'plugins/conditional-formatting/applier.js',
  'plugins/conditional-formatting/manager.js',
  'plugins/conditional-formatting/ui.js',
  'plugins/conditional-formatting/conditional-formatting.js',

  // Main ExceLikeTable (must be last)
  'ExceLikeTable.js'
];

// CSS files to combine
const cssFiles = [
  'ExceLikeTable.css',
  'plugins/conditional-formatting/conditional-formatting.css'
];

/**
 * Clean module content - remove Node.js specific code
 */
function cleanModuleContent(content) {
  // Remove Node.js require blocks (multi-line)
  content = content.replace(
    /\/\/ Import utilities[\s\S]*?\/\/ In browser, utilities are loaded via script tags and available globally\nif \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\n\}\n/g,
    ''
  );

  // Remove dependency validation blocks
  content = content.replace(
    /\/\/ Validate dependencies are available[\s\S]*?if \(typeof \w+ === 'undefined'\) \{[\s\S]*?\}\n/g,
    ''
  );

  // Remove standalone module.exports statements
  content = content.replace(/module\.exports\s*=\s*[^;]+;?\s*/g, '');

  return content;
}

// Read and combine JavaScript modules
let combinedCode = '';

console.log('\nProcessing modules...');
moduleOrder.forEach(moduleName => {
  const modulePath = path.join(srcDir, moduleName);
  if (fs.existsSync(modulePath)) {
    console.log(`  ✓ ${moduleName}`);
    let moduleContent = fs.readFileSync(modulePath, 'utf8');
    moduleContent = cleanModuleContent(moduleContent);
    combinedCode += `// ===== Module: ${moduleName} =====\n`;
    combinedCode += moduleContent + '\n\n';
  } else {
    console.warn(`  ⚠ Warning: ${moduleName} not found, skipping...`);
  }
});

// Read and combine CSS files
let combinedCSS = '';
console.log('\nProcessing CSS files...');
cssFiles.forEach(cssFile => {
  const cssPath = path.join(srcDir, cssFile);
  if (fs.existsSync(cssPath)) {
    console.log(`  ✓ ${cssFile}`);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    combinedCSS += `/* ===== CSS from: ${cssFile} ===== */\n`;
    combinedCSS += cssContent + '\n\n';
  } else {
    console.warn(`  ⚠ Warning: ${cssFile} not found, skipping...`);
  }
});

// ===== ESM Version (Modern, default) =====
console.log('\nGenerating ESM version...');
const esmContent = `/**
 * ExceLikeTable - ESM Build
 * Version: ${version}
 * All features enabled by default!
 */
"use strict";

${combinedCode}

// ESM Exports
export default ExceLikeTable;
export { ColumnHelpers, TABLE_CONFIG };
`;

fs.writeFileSync(path.join(distDir, 'excelike-table.js'), esmContent);
console.log('  ✓ excelike-table.js (ESM)');

// ===== CommonJS Version (Node.js compatibility) =====
console.log('\nGenerating CommonJS version...');
const cjsContent = `/**
 * ExceLikeTable - CommonJS Build
 * Version: ${version}
 * All features enabled by default!
 */
"use strict";

${combinedCode}

// CommonJS Exports
module.exports = ExceLikeTable;
module.exports.ColumnHelpers = ColumnHelpers;
module.exports.TABLE_CONFIG = TABLE_CONFIG;
module.exports.default = ExceLikeTable;
`;

fs.writeFileSync(path.join(distDir, 'excelike-table.cjs'), cjsContent);
console.log('  ✓ excelike-table.cjs (CommonJS)');

// ===== Browser UMD Version (Script tag compatible) =====
console.log('\nGenerating Browser UMD version...');
const umdContent = `/**
 * ExceLikeTable - UMD Build for Browsers
 * Version: ${version}
 * All features enabled by default!
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    const exports = factory();
    root.ExceLikeTable = exports.ExceLikeTable;
    root.ColumnHelpers = exports.ColumnHelpers;
    root.TABLE_CONFIG = exports.TABLE_CONFIG;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  "use strict";

${combinedCode}

  return {
    ExceLikeTable: ExceLikeTable,
    ColumnHelpers: ColumnHelpers,
    TABLE_CONFIG: TABLE_CONFIG
  };
}));
`;

fs.writeFileSync(path.join(distDir, 'excelike-table.browser.js'), umdContent);
console.log('  ✓ excelike-table.browser.js (UMD)');

// ===== CSS =====
fs.writeFileSync(path.join(distDir, 'excelike-table.css'), combinedCSS);
console.log('\nCSS:');
console.log('  ✓ excelike-table.css');

// ===== Minified versions =====
if (!isDev) {
  console.log('\nMinifying...');

  minify(combinedCode, {
    compress: {
      drop_console: true,  // Remove console.* calls in production builds
      drop_debugger: true,
      passes: 2
    },
    mangle: {
      reserved: ['ExceLikeTable', 'ColumnHelpers', 'TABLE_CONFIG', 'DOMUtils', 'PerformanceUtils']
    },
    format: {
      comments: false
    }
  }).then(result => {
    // Minified ESM
    const esmMin = `${result.code}\nexport default ExceLikeTable;export{ColumnHelpers,TABLE_CONFIG};`;
    fs.writeFileSync(path.join(distDir, 'excelike-table.min.js'), esmMin);
    console.log('  ✓ excelike-table.min.js');

    // Minified CSS
    const minifiedCSS = combinedCSS
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .trim();

    fs.writeFileSync(path.join(distDir, 'excelike-table.min.css'), minifiedCSS);
    console.log('  ✓ excelike-table.min.css');

    // Bundle with embedded CSS
    const bundleContent = `${result.code}
(function(){if(typeof document!=='undefined'){const s=document.createElement('style');s.textContent=\`${minifiedCSS.replace(/`/g, '\\`')}\`;document.head.appendChild(s);}})();
if(typeof module!=='undefined'&&module.exports){module.exports=ExceLikeTable;module.exports.ColumnHelpers=ColumnHelpers;module.exports.TABLE_CONFIG=TABLE_CONFIG;}`;

    fs.writeFileSync(path.join(distDir, 'excelike-table.bundle.min.js'), bundleContent);
    console.log('  ✓ excelike-table.bundle.min.js (with CSS)');

    // TypeScript definitions
    const dtsContent = `/**
 * ExceLikeTable TypeScript Definitions
 * Version: ${version}
 */

declare class ExceLikeTable {
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
  showConditionalFormatting(): void;
  destroy(): void;
}

interface ExceLikeTableOptions {
  /** Table data array */
  data?: any[];
  /** Column definitions */
  columns?: ExceLikeTableColumn[];
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
  /** Unique table ID for settings storage (default: 'excelike-table') */
  tableId?: string;
  /** Enable settings persistence (default: true) */
  persistSettings?: boolean;
  /** Custom storage adapter */
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
  pinned?: boolean;
  hidden?: boolean;
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

type FontSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';
type CellPadding = 'narrow' | 'standard' | 'wide';

export default ExceLikeTable;
export { ColumnHelpers, TABLE_CONFIG, ExceLikeTableOptions, ExceLikeTableColumn, TableStorageAdapter };
`;

    fs.writeFileSync(path.join(distDir, 'excelike-table.d.ts'), dtsContent);
    console.log('  ✓ excelike-table.d.ts (TypeScript)');

    console.log('\n✨ Build completed successfully!');
    console.log('\nGenerated files:');
    console.log('  📦 excelike-table.js (ESM, unminified)');
    console.log('  📦 excelike-table.cjs (CommonJS, unminified)');
    console.log('  📦 excelike-table.browser.js (UMD, unminified)');
    console.log('  📦 excelike-table.min.js (ESM, minified)');
    console.log('  🎨 excelike-table.css (unminified)');
    console.log('  🎨 excelike-table.min.css (minified)');
    console.log('  📦 excelike-table.bundle.min.js (all-in-one with CSS)');
    console.log('  📘 excelike-table.d.ts (TypeScript definitions)');
    console.log(`\n🚀 Version ${version} ready for npm publish!`);

  }).catch(err => {
    console.error('❌ Minification failed:', err);
    process.exit(1);
  });
} else {
  console.log('\n🔧 Development build completed!');
  console.log('\nGenerated files:');
  console.log('  📦 excelike-table.js (ESM)');
  console.log('  📦 excelike-table.cjs (CommonJS)');
  console.log('  📦 excelike-table.browser.js (UMD)');
  console.log('  🎨 excelike-table.css');
}
