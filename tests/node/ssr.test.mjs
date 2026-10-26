// Server-side rendering frameworks (Next.js, Nuxt, Astro…) import the package in Node,
// where window/document/localStorage do not exist. Importing must not throw.
// The table itself is only created in the browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

test('ESM entry can be imported in Node', async () => {
  const mod = await import('vanillajs-excelike-table');
  assert.equal(typeof mod.default, 'function');
  assert.equal(typeof mod.ColumnHelpers.text, 'function');
  assert.equal(typeof mod.TABLE_CONFIG, 'object');
});

test('CommonJS entry can be required in Node and returns the class (v2.x compatible)', () => {
  const require = createRequire(import.meta.url);
  const ExceLikeTable = require('vanillajs-excelike-table');
  assert.equal(typeof ExceLikeTable, 'function');
  assert.equal(ExceLikeTable.default, ExceLikeTable);
  assert.equal(typeof ExceLikeTable.ColumnHelpers.number, 'function');
});

test('importing does not leak globals into Node', async () => {
  await import('vanillajs-excelike-table');
  for (const name of ['ExceLikeTable', 'DOMUtils', 'PluginSystem', 'ConditionalFormatting']) {
    assert.equal(globalThis[name], undefined, `${name} leaked onto globalThis`);
  }
});

test('the stylesheet is exported as a subpath', async () => {
  const require = createRequire(import.meta.url);
  assert.match(require.resolve('vanillajs-excelike-table/styles'), /dist[\\/]excelike-table\.css$/);
});
