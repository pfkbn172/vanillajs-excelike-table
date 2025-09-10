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

console.log(`Building Modular ExceLikeTable Library${isDev ? ' (Development)' : ''}...`);

// Define module order for proper dependency resolution
const moduleOrder = [
  'dom-utils.js',
  'performance-utils.js',
  'menu-renderer.js',
  'filter-module.js',
  'pagination-module.js',
  'ExceLikeTable.js'
];

// Read and combine modules
let combinedJS = '(function() {\n';
combinedJS += '  "use strict";\n\n';

// Add module container
combinedJS += '  // Module container for internal use\n';
combinedJS += '  const modules = {};\n\n';

// Process each module
moduleOrder.forEach(moduleName => {
  const modulePath = path.join(srcDir, moduleName);
  if (fs.existsSync(modulePath)) {
    console.log(`Processing ${moduleName}...`);
    let moduleContent = fs.readFileSync(modulePath, 'utf8');
    
    // Extract module name
    const moduleVarName = moduleName.replace('.js', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    // Wrap module content
    if (moduleName !== 'ExceLikeTable.js') {
      // Remove module.exports statements
      moduleContent = moduleContent.replace(/if\s*\(typeof module[^}]+}\s*}/g, '');
      moduleContent = moduleContent.replace(/module\.exports\s*=\s*\w+;?/g, '');
      
      // Store in modules object
      combinedJS += `  // Module: ${moduleName}\n`;
      combinedJS += `  modules.${moduleVarName} = ${moduleContent.trim()};\n\n`;
    } else {
      // For main file, replace imports with module references
      moduleContent = moduleContent.replace(
        /let DOMUtils, PerformanceUtils;[\s\S]*?}/g,
        `const DOMUtils = modules.domUtils;\n  const PerformanceUtils = modules.performanceUtils;\n  const MenuRenderer = modules.menuRenderer;\n  const FilterModule = modules.filterModule;\n  const PaginationModule = modules.paginationModule;`
      );
      
      combinedJS += `  // Main module: ${moduleName}\n`;
      combinedJS += moduleContent + '\n';
    }
  }
});

// Close the IIFE
combinedJS += '\n})();\n';

// Read CSS
const cssContent = fs.readFileSync(path.join(srcDir, 'ExceLikeTable.css'), 'utf8');

// Create ESM version
const esmContent = `${combinedJS}
// ESM Export
export { ExceLikeTable as default, ColumnHelpers, TableUtils, TABLE_PRESETS, TABLE_CONFIG };`;

// Create CommonJS version
const cjsContent = `${combinedJS}
// CommonJS Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExceLikeTable;
  module.exports.ColumnHelpers = ColumnHelpers;
  module.exports.TableUtils = TableUtils;
  module.exports.TABLE_PRESETS = TABLE_PRESETS;
  module.exports.TABLE_CONFIG = TABLE_CONFIG;
}`;

// Write unminified versions
fs.writeFileSync(path.join(distDir, 'excelike-table-modular.js'), combinedJS);
fs.writeFileSync(path.join(distDir, 'excelike-table-modular.esm.js'), esmContent);
fs.writeFileSync(path.join(distDir, 'excelike-table-modular.cjs.js'), cjsContent);
fs.writeFileSync(path.join(distDir, 'excelike-table.css'), cssContent);

console.log('✓ Unminified modular files created');

// Minify JavaScript if not in dev mode
if (!isDev) {
  minify(combinedJS, {
    compress: {
      drop_console: true,
      drop_debugger: true,
      passes: 2
    },
    mangle: {
      reserved: ['ExceLikeTable', 'ColumnHelpers', 'TableUtils', 'TABLE_PRESETS', 'TABLE_CONFIG']
    },
    format: {
      comments: false
    }
  }).then(result => {
    fs.writeFileSync(path.join(distDir, 'excelike-table-modular.min.js'), result.code);
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
    
    // Create combined bundle with embedded CSS
    const bundleContent = `${result.code}
(function() {
  const style = document.createElement('style');
  style.textContent = \`${minifiedCSS.replace(/`/g, '\\`')}\`;
  document.head.appendChild(style);
})();`;
    
    fs.writeFileSync(path.join(distDir, 'excelike-table-modular.bundle.min.js'), bundleContent);
    console.log('✓ Combined bundle created');
    
    console.log('\nModular build completed successfully!');
    console.log('Generated files:');
    console.log('- excelike-table-modular.js (unminified)');
    console.log('- excelike-table-modular.min.js (minified)');
    console.log('- excelike-table-modular.esm.js (ESM)');
    console.log('- excelike-table-modular.cjs.js (CommonJS)');
    console.log('- excelike-table-modular.bundle.min.js (with CSS)');
    console.log('- excelike-table.css (unminified)');
    console.log('- excelike-table.min.css (minified)');
  }).catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
} else {
  console.log('\nDevelopment build completed successfully!');
}