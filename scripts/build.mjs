/**
 * Build script: bundles src/index.js with esbuild and writes dist/.
 *
 * dist/ is emptied first so that files from older builds can never be published again
 * (v2.3.3 accidentally shipped ~20 stale files that way).
 *
 * Outputs (file names are kept from v2.x so existing CDN links keep working):
 *   excelike-table.js            ESM
 *   excelike-table.min.js        ESM, minified
 *   excelike-table.cjs           CommonJS (require() returns the class, like v2.x)
 *   excelike-table.browser.js    <script> tag build: sets window.ExceLikeTable / ColumnHelpers / TABLE_CONFIG
 *   excelike-table.bundle.min.js same as browser.js, minified, with the CSS injected
 *   excelike-table.css / .min.css
 *   excelike-table.d.ts
 */
import { build, transform } from 'esbuild';
import { readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const banner = `/*! ExceLikeTable v${version} | MIT License */`;
const entry = join(root, 'src/index.js');
const common = { entryPoints: [entry], bundle: true, target: 'es2019', legalComments: 'none', logLevel: 'warning' };

// The browser build exposes the documented globals. It also keeps working when it is
// require()d, because some bundlers resolve the "browser" file in a CommonJS context.
const browserFooter = `
(function (root, m) {
  var api = { ExceLikeTable: m.default, ColumnHelpers: m.ColumnHelpers, TABLE_CONFIG: m.TABLE_CONFIG };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.ExceLikeTable = api.ExceLikeTable;
  root.ColumnHelpers = api.ColumnHelpers;
  root.TABLE_CONFIG = api.TABLE_CONFIG;
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, __ExceLikeTable);`;

const css = ['src/ExceLikeTable.css', 'src/plugins/conditional-formatting/conditional-formatting.css']
  .map((f) => readFileSync(join(root, f), 'utf8'))
  .join('\n');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({ ...common, format: 'esm', outfile: join(dist, 'excelike-table.js'), banner: { js: banner } });
await build({ ...common, format: 'esm', minify: true, outfile: join(dist, 'excelike-table.min.js'), banner: { js: banner } });
await build({
  ...common,
  format: 'cjs',
  outfile: join(dist, 'excelike-table.cjs'),
  banner: { js: banner },
  // v2.x: `const ExceLikeTable = require('vanillajs-excelike-table')` returned the class itself.
  footer: { js: 'module.exports = Object.assign(module.exports.default, module.exports);' },
});
await build({
  ...common,
  format: 'iife',
  globalName: '__ExceLikeTable',
  outfile: join(dist, 'excelike-table.browser.js'),
  banner: { js: banner },
  footer: { js: browserFooter },
});

const minCss = (await transform(css, { loader: 'css', minify: true })).code;
writeFileSync(join(dist, 'excelike-table.css'), `${banner}\n${css}`);
writeFileSync(join(dist, 'excelike-table.min.css'), `${banner}\n${minCss}`);

const browserMin = (await transform(readFileSync(join(dist, 'excelike-table.browser.js'), 'utf8'), { minify: true, legalComments: 'none' })).code;
const injectCss = `(function(){if(typeof document==='undefined')return;var s=document.createElement('style');s.setAttribute('data-excelike-table','');s.textContent=${JSON.stringify(minCss)};document.head.appendChild(s);})();`;
writeFileSync(join(dist, 'excelike-table.bundle.min.js'), `${banner}\n${injectCss}\n${browserMin}`);

copyFileSync(join(root, 'types/excelike-table.d.ts'), join(dist, 'excelike-table.d.ts'));

console.log(`ExceLikeTable v${version} built → dist/`);
