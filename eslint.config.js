import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'coverage/', 'playwright-report/', 'test-results/', 'node_modules/'] },
  js.configs.recommended,
  {
    // Library source runs in the browser. It must also be importable in Node (SSR),
    // so top-level code may only touch browser globals behind a typeof check.
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js', 'playwright.config.js', 'tests/node/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // Spec files run in Node, but page.evaluate() callbacks run in the browser.
    files: ['tests/e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ExceLikeTable: 'readonly', ColumnHelpers: 'readonly' },
    },
  },
  {
    files: ['babel.config.cjs', 'jest.config.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['tests/unit/**/*.js', 'tests/setup.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.jest, perfBudget: 'readonly' },
    },
    rules: {
      // `const table = new ExceLikeTable(...)` is the normal way to render a table under test.
      'no-unused-vars': ['error', { varsIgnorePattern: '^table$', args: 'none', caughtErrors: 'none' }],
    },
  },
];
