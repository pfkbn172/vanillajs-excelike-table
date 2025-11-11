# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.0] - 2025-11-11

### ✨ Features

**Theme System**

- **NEW: Customizable table themes** - Added comprehensive theme system with 8 preset themes accessible from settings menu
  - Themes: Classic, Modern, Professional, Ocean, Dark, Subtle, Vibrant, Nature
  - Customizable: header background, cell background, hover colors, border colors/width
  - Persistent: Theme preferences saved to LocalStorage
  - CSS Variables: Dynamic theming using CSS custom properties
  - Files: src/theme-system.js (ThemeManager class), src/ExceLikeTable.js (integration), examples/demo-theme-system.html

### 🐛 Bug Fixes

**Filter dropdown viewport overflow on tablet devices**

- **FIXED: Tablet viewport positioning** - Filter dropdowns on right-edge columns (like Status) now stay within viewport boundaries on tablet devices (768px width) (src/ExceLikeTable.js:2718-2720)
  - Root cause: Horizontal position calculation used inner `.filter-dropdown` width but applied position to outer `.filter-dropdown-wrapper`
  - Solution: Use wrapper's actual width (`dropdown.getBoundingClientRect().width`) for boundary calculations
  - Impact: OK/Cancel buttons are now fully visible and clickable on tablet viewports

**Test selector bug in concurrent operations**

- **FIXED: Range mode selector** - Corrected filter mode toggle selector in concurrent operations test (tests/e2e/concurrent-operations.spec.js:180-185)
  - Changed from non-existent `.filter-mode-toggle button:has-text("Range")` to `button[data-mode="range"]`
  - Impact: Test 162 "should handle filter changes while scrolling" now passes on all platforms

**Tooltip HTML rendering bug**

- **FIXED: Tooltip displays HTML tags literally** - Cell tooltips now show plain text instead of raw HTML tags when using `renderCellHTML` option or custom render functions (src/ExceLikeTable.js:5310-5312)
  - Root cause: `addTooltipToCell` method used the HTML content string parameter instead of extracting rendered text from the cell element
  - Solution: Extract actual displayed text using `element.textContent || element.innerText`
  - Before: Tooltip showed `"<strong>Premium</strong> Laptop"` (HTML tags visible)
  - After: Tooltip shows `"Premium Laptop"` (plain text only)
  - Impact: Tooltips now correctly display readable text for cells with HTML formatting

### ✅ Testing

- **VERIFIED: Tablet tests** - All 7 concurrent-operations tests now pass on tablet (previously 4/7, 3 timeouts)
- **VERIFIED: Cross-platform** - 55/56 E2E tests passing on Desktop, Tablet, and Mobile
- **VERIFIED: No regressions** - Filter functionality unchanged on desktop and mobile devices

### 🔧 Refactoring

**Simplified multi-language support to Japanese and English only**

- **REMOVED: Spanish, French, and German translations** - Removed all es, fr, de language translations from src/i18n.js (lines 469-1037)
- **UPDATED: getCurrencyForLocale()** - Removed unused currency mappings for de, fr, es locales (src/i18n.js:623-637)
- **UPDATED: Language selectors** - Removed es, fr, de options from HTML language selector dropdowns:
  - simple-library-test.html (line 63)
  - test-all-features.html (line 326)
- **UPDATED: Unit tests** - Removed Spanish language test from RTL detection tests (tests/unit/i18n/language-switching.test.js:421)

### ✅ Testing

- **VERIFIED: Language switching** - All 42 i18n unit tests passing, confirming en ↔ ja switching works correctly
- **VERIFIED: Translations** - All English and Japanese translations functioning properly
- **VERIFIED: Formatting** - Date and number formatting working correctly for both supported locales

### 📝 Rationale

This change simplifies the codebase by focusing on the two primary supported languages (Japanese and English), reducing maintenance burden and potential translation inconsistencies. The i18n infrastructure remains in place for potential future language additions if needed.

## [2.2.4] - 2025-10-13

### 🐛 Bug Fixes

**CRITICAL: Fixed conditional formatting priority system**

- **FIXED: Priority assignment bug** - New rules now correctly assigned lowest priority instead of highest (manager.js:60-67)
- **FIXED: Priority enforcement bug** - Rules now applied in correct order (low→high priority) with proper overwriting (conditional-formatting.js:339-351)
- **FIXED: Row vs Cell priority conflicts** - Unified processing ensures priority works correctly between row-level and cell-level rules (conditional-formatting.js:354-391)

### 📝 What Changed

**Priority Assignment Fix (manager.js):**
```javascript
// Before: New rules always got Priority 1, shifting existing rules
if (rule.priority === 0) {
  this.rules.forEach(existingRule => {
    existingRule.priority += 1;
  });
  rule.priority = 1; // Wrong: New rule becomes highest priority
}

// After: New rules get lowest priority
if (rule.priority === 0) {
  rule.priority = this.rules.length + 1; // Correct: New rule becomes lowest priority
}
```

**Priority Enforcement Fix (conditional-formatting.js):**
```javascript
// Before: Rules sorted ascending (Priority 1, 2, 3...)
// This caused Priority 1 to be applied first and overwritten by lower priorities
return rules.sort((a, b) => a.priority - b.priority); // Wrong

// After: Rules sorted descending (Priority 3, 2, 1...)
// Priority 1 applied last and wins
return rules.sort((a, b) => b.priority - a.priority); // Correct
```

**Unified Priority Processing:**
- Removed complex two-phase approach
- Cell-level and row-level rules now processed uniformly
- Simple sequential application: low priority → high priority
- Last applied rule (highest priority) wins
- Matches Excel/Google Sheets behavior

### 🎯 Impact

**Before Fix:**
- Creating Rule 1 → Priority 1 ✓
- Creating Rule 2 → Priority 1, Rule 1 becomes Priority 2 ✗
- Creating Rule 3 → Priority 1, Rule 2 becomes Priority 2, Rule 1 becomes Priority 3 ✗
- Priority changes didn't affect which rule won when conflicts occurred ✗

**After Fix:**
- Creating Rule 1 → Priority 1 ✓
- Creating Rule 2 → Priority 2 ✓
- Creating Rule 3 → Priority 3 ✓
- Priority correctly determines which rule wins in conflicts ✓
- Dynamic priority changes (↑↓ buttons) immediately reflected ✓

### 📦 Files Changed

- `src/plugins/conditional-formatting/manager.js` - Fixed priority assignment logic
- `src/plugins/conditional-formatting/conditional-formatting.js` - Fixed priority enforcement and unified processing

### ✅ Validation

Verified with Playwright automated testing:
- ✅ New rules assigned correct priorities
- ✅ Priority order affects formatting results
- ✅ Row-level vs cell-level conflicts resolved by priority
- ✅ Dynamic priority changes work correctly
- ✅ Matches Excel/Google Sheets behavior

### 📋 Technical Details

**Test Case (ID6 - Frank Miller):**
- Age: 38 (matches "Age > 30" rule)
- Status: "Suspended" (matches "Suspended Status Row" rule)

**Results:**
- Priority 1: Age > 30 (blue) → Age 38 cell is blue ✓
- Priority 1: Suspended (red) → Age 38 cell is red ✓
- Priority changes reflected immediately ✓

---

## [2.2.1] - 2025-10-13

### 🧹 Documentation Cleanup

**Complete removal of DOMPurify references from documentation and examples**

This patch release removes all remaining DOMPurify references from non-source files following the v2.2.0 architectural decision.

### 📝 What Changed

**Updated Documentation:**
- `HANDOFF.md` - Updated project history and current state
- `SECURITY.md` - Completely rewritten to reflect application-layer security responsibility
- `examples/test-dist-render.html` - Removed DOMPurify availability check
- `examples/npm-installation-test.html` - Updated security section and setup instructions
- `scripts/build-full.cjs` - Removed DOMPurify bundling code

**Note**: DOMPurify references remain intentionally in:
- `CHANGELOG.md` - Historical record of removal
- `SECURITY.md` - Migration guide recommending DOMPurify for user applications
- Test files - Will be updated separately

### ⚠️ No Breaking Changes

This is a documentation-only release. No code changes, no breaking changes.

### 📦 Bundle Size

Unchanged from v2.2.0: ~100KB (31% reduction from v2.1.1)

---

## [2.2.0] - 2025-10-13

### 🎯 MAJOR CHANGES - Removed Built-in XSS Protection

**Built-in XSS sanitization has been completely removed following industry standards (AG-Grid, TanStack Table, DataTables).**

This release removes DOMPurify dependency and all built-in XSS protection, reducing bundle size by ~45KB and increasing render function flexibility. Security is now the application's responsibility.

### ⚠️ Breaking Changes

**IMPORTANT: XSS protection is no longer built-in**

#### Security Responsibility Shift

**Before (v2.1.1 and earlier):**
```javascript
// ❌ Built-in XSS protection (now removed)
render: (value) => `<span>${value}</span>` // Was automatically sanitized
```

**After (v2.2.0+):**
```javascript
// ✅ Application handles security
import DOMPurify from 'dompurify';

render: (value) => DOMPurify.sanitize(`<span>${value}</span>`)
// OR use textContent for plain text
render: (value) => {
  const span = document.createElement('span');
  span.textContent = value; // Safe for user input
  return span;
}
```

### 🛠️ What Changed

**Removed:**
- ❌ `dompurify` dependency (~45KB)
- ❌ `SecurityUtils.sanitizeHTML()` method
- ❌ Automatic HTML sanitization in render functions
- ❌ Built-in XSS protection in `dom-utils.js` and `virtual-scroll.js`

**Kept:**
- ✅ `SecurityUtils.escapeCSVFormula()` - CSV injection protection
- ✅ `SecurityUtils.validateTableSize()` - DoS protection
- ✅ All table functionality and features

### 🎨 UI Improvements

**Cursor behavior fixed:**
- Removed misleading `cursor: pointer` from table cells and header titles
- Cursor now only shows pointer on actually clickable elements (buttons, controls)
- More intuitive user experience

### 📦 Bundle Size Reduction

- **Before**: ~145KB (with DOMPurify)
- **After**: ~100KB (without DOMPurify)
- **Savings**: ~45KB (~31% reduction)

### 🔐 Security Best Practices

**If you need XSS protection, implement it at application level:**

```javascript
// Option 1: Use DOMPurify in your application
import DOMPurify from 'dompurify';

columns: [{
  dataIndex: 'description',
  render: (value) => DOMPurify.sanitize(value)
}]

// Option 2: Use textContent for user input
columns: [{
  dataIndex: 'name',
  render: (value) => {
    const div = document.createElement('div');
    div.textContent = value; // Automatically escaped
    return div;
  }
}]

// Option 3: Trust your data source
columns: [{
  dataIndex: 'status',
  render: (status) => `<span class="badge-${status}">${status}</span>`
  // Safe if status comes from controlled source
}]
```

### ⬆️ Upgrade Guide

**From 2.1.1:**

1. **Update package:**
```bash
npm update vanillajs-excelike-table
```

2. **Review your render functions:**
   - If rendering trusted data (from your database/API), no changes needed
   - If rendering user input, add sanitization or use textContent

3. **Optional: Add DOMPurify if needed:**
```bash
npm install dompurify
```

**Migration Examples:**

```javascript
// Trusted data - no changes needed
render: (status) => `<span class="badge">${status}</span>`

// User input - add sanitization
import DOMPurify from 'dompurify';
render: (userInput) => DOMPurify.sanitize(userInput)

// User input - use textContent (recommended)
render: (userName) => {
  const span = document.createElement('span');
  span.textContent = userName;
  return span;
}
```

### 📋 Files Changed

- `package.json` - Removed dompurify dependency
- `src/ExceLikeTable.js` - Removed SecurityUtils.sanitizeHTML() calls
- `src/security-utils.js` - Removed all XSS protection, kept CSV and DoS protection
- `src/dom-utils.js` - Removed sanitization methods
- `src/virtual-scroll.js` - Removed HTML sanitization
- `src/ExceLikeTable.css` - Fixed cursor styling (removed misleading pointer)

### ✅ Why This Change?

**Industry Standard Approach:**
- AG-Grid: No built-in XSS protection
- TanStack Table: No built-in XSS protection
- DataTables: No built-in XSS protection
- Handsontable: No built-in XSS protection

**Benefits:**
- ✅ Smaller bundle size (~45KB reduction)
- ✅ More flexibility in render functions
- ✅ Follows established industry patterns
- ✅ Security responsibility at application layer (where it belongs)
- ✅ No dependency on DOMPurify version updates

---

## [2.1.1] - 2025-10-12

### 🐛 Bug Fixes

**CRITICAL: Fixed render function HTML rendering in npm package**

- **FIXED: render function HTML escaping** - render functions now automatically render HTML without requiring `renderCellHTML: true`
- **FIXED: Missing SecurityUtils module** - Added security-utils.js to build module order (scripts/build-full.cjs:23)
- **Root Cause**: Build script was missing security-utils.js module, and render function HTML logic was not included in npm package dist files
- **Impact**: Users can now use `render: (value) => \`<b>${value}</b>\`` as documented in README without additional configuration

### 📋 Technical Details

**Problem Analysis:**
- npm package v2.1.0 had outdated dist files missing the `column.render ||` check
- SecurityUtils module was not included in bundled files, causing runtime errors
- render functions returned HTML but it was escaped as text instead of rendered

**Modified Code:**
```javascript
// src/ExceLikeTable.js:1547 & virtual-scroll.js:441
if (column.render || this.options.renderCellHTML) {
  td.innerHTML = SecurityUtils.sanitizeHTML(content);
}
```

**Files Changed:**
- `scripts/build-full.cjs:23` - Added 'security-utils.js' as first module in moduleOrder array
- Build regenerated to include correct render function logic

### ⚠️ Breaking Changes

None - this fix makes the library work as documented in README.

### ⬆️ Upgrade Guide

**From 2.1.0 or 2.0.x:**

```bash
npm update vanillajs-excelike-table
```

**What this fixes:**
- ✅ render functions now automatically render HTML with XSS protection
- ✅ No need to add `renderCellHTML: true` when using render functions
- ✅ SecurityUtils module properly included in dist files
- ✅ Behavior matches README documentation (Line 230)

**Migration:**
- If you added `renderCellHTML: true` as a workaround, you can now remove it (when using render functions)
- Keep `renderCellHTML: true` only if you have HTML strings directly in your data (not using render functions)

---

## [2.0.9] - 2025-10-12

### 🐛 Bug Fixes

**CRITICAL: Fixed const reassignment bug causing Vite/esbuild build failures**

- **FIXED: itemHeight const reassignment** - Changed from const destructuring to let variable in virtual-scroll.js:23
- **FIXED: buffer const reassignment** - Changed from const destructuring to let variable in virtual-scroll.js:24
- **Root Cause**: ES6 destructuring with default values created immutable const bindings
- **Impact**: Library now builds successfully in Vite projects with strict esbuild validation

### 📋 Technical Details

**Error Messages (Before Fix):**
```
[ERROR] Cannot assign to "itemHeight" because it is a constant
  node_modules/vanillajs-excelike-table/dist/excelike-table.js:1990:8

[ERROR] Cannot assign to "buffer" because it is a constant
  node_modules/vanillajs-excelike-table/dist/excelike-table.js:2039:8
```

**Modified Code:**
```javascript
// Before (v2.0.8):
const { container, itemHeight = 50, buffer = 5, ... } = options;

// After (v2.0.9):
const { container, renderItem, getItemData, onScroll } = options;
let itemHeight = options.itemHeight !== undefined ? options.itemHeight : 50;
let buffer = options.buffer !== undefined ? options.buffer : 5;
```

**Files Changed:**
- `src/virtual-scroll.js:15-25` - Changed destructuring pattern to allow reassignment

### ⚠️ Why This Happened

The virtual-scroll module's `setItemHeight()` and `setBuffer()` methods attempted to reassign variables that were declared as const through destructuring. While this worked in some build environments, Vite's esbuild with strict validation correctly identified this as invalid JavaScript.

### ⬆️ Upgrade Guide

**From 2.0.8:**

```bash
npm update vanillajs-excelike-table
```

No code changes required - this is a transparent bug fix that resolves build errors in strict build environments (Vite, esbuild, modern bundlers).

**Validation:**
- ✅ Builds successfully in Vite projects
- ✅ No runtime behavior changes
- ✅ Backward compatible with all existing code
- ✅ Virtual scroll setItemHeight() and setBuffer() methods work correctly

---

## [2.0.6] - 2025-10-12

### 🎯 MAJOR IMPROVEMENT - Simplified Architecture

**All features are now built-in! No more plugin loading required.**

This release removes the plugin architecture and makes all features available out of the box with zero configuration.

### ✨ What's New

- **Built-in Conditional Formatting** - No manual plugin loading needed
- **Simplified Implementation** - Just 2 lines: load CSS + JS
- **Enhanced Build Process** - ES module syntax automatically removed from UMD bundles
- **Cleaner Examples** - All examples updated to new simple implementation

### 🔄 Breaking Changes

**IMPORTANT: Manual plugin loading is no longer needed (and no longer works)**

#### Before (v2.0.5 and earlier):
```html
<!-- ❌ OLD WAY - Don't do this anymore -->
<script src="../src/plugins/conditional-formatting/constants.js"></script>
<script src="../src/plugins/conditional-formatting/utils.js"></script>
<!-- ...7 more script tags... -->
<script type="module">
  import ExceLikeTable from '../src/ExceLikeTable.js';
</script>
```

#### After (v2.0.6+):
```html
<!-- ✅ NEW WAY - Simple and clean -->
<script src="dist/excelike-table.browser.js"></script>
<link rel="stylesheet" href="dist/excelike-table.css">
<script>
  const table = new ExceLikeTable('#container', { data, columns });
</script>
```

### 🛠️ Technical Changes

**Modified Files:**
- `scripts/build-full.cjs` - Enhanced to remove ES module export/import syntax
- `src/ExceLikeTable.js` - Removed intrusive plugin availability check
- `examples/npm-installation-test.html` - Single clean example (others deleted)
- `README.md` - Clarified that conditional formatting is built-in
- Deleted `examples/index.html`, `examples/simple-with-i18n.html`, `examples/boundary-test.html` - Obsolete files

**Build Process Improvements:**
- ES `export` statements stripped from bundled code
- ES `import` statements stripped from bundled code
- UMD bundles now work correctly in browsers
- All plugin code bundled into dist files

### ✅ Validation

- ✅ All features work without manual plugin loading
- ✅ Conditional formatting accessible via table menu
- ✅ ExceLikeTable and ConditionalFormatting available globally
- ✅ Integration tests pass
- ✅ Examples updated and tested

### ⬆️ Upgrade Guide

**From 2.0.5:**

1. **Remove all plugin script tags** from your HTML
2. **Use dist files instead** of src files
3. **Switch from ES modules to UMD** (or use the ESM dist build)

```bash
npm update vanillajs-excelike-table
```

See [Migration Guide](#migration-from-v204-to-v206) below for detailed instructions.

### 📋 Migration from v2.0.4 to v2.0.6

#### Step 1: Remove Plugin Scripts

**Remove these lines:**
```html
<script src="../src/plugins/conditional-formatting/constants.js"></script>
<script src="../src/plugins/conditional-formatting/utils.js"></script>
<script src="../src/plugins/conditional-formatting/performance-optimizations.js"></script>
<script src="../src/plugins/conditional-formatting/rule.js"></script>
<script src="../src/plugins/conditional-formatting/evaluator.js"></script>
<script src="../src/plugins/conditional-formatting/applier.js"></script>
<script src="../src/plugins/conditional-formatting/manager.js"></script>
<script src="../src/plugins/conditional-formatting/ui.js"></script>
<script src="../src/plugins/conditional-formatting/conditional-formatting.js"></script>
```

#### Step 2: Use Dist Files

**Replace ES module imports with dist files:**

```html
<!-- Before -->
<script type="module">
  import ExceLikeTable from '../src/ExceLikeTable.js';
</script>

<!-- After -->
<script src="../dist/excelike-table.browser.js"></script>
<script>
  const table = new ExceLikeTable('#container', { data, columns });
</script>
```

#### Step 3: Done!

All features work immediately. No configuration, no plugin loading, no imports.

---

## [2.0.5] - 2025-10-12

### ✨ Enhanced - Conditional Formatting

**New Operators Added:**
- **Greater (>)**: Compare numeric values (strict inequality)
- **Less (<)**: Compare numeric values (strict inequality)
- **Not-Equals (≠)**: Check for non-matching values

**Improved Features:**
- ✅ 8 total comparison operators (Equals, Not-Equals, Greater, Greater-Equal, Less, Less-Equal, Contains, Not-Contains)
- ✅ Multi-language operator translations (English, Japanese, Spanish, French, German)
- ✅ Boundary value handling (Greater excludes boundary, Greater-Equal includes it)
- ✅ Enhanced delete UX (no confirmation dialog, automatic reapplication)
- ✅ LocalStorage key prefix standardization (`excelike_cf_rules`)

### 🐛 Bug Fixes

- **FIXED: Operator Validation** - Updated rule validation to support all 8 operators (rule.js:68)
- **FIXED: Delete Confirmation** - Removed blocking confirm() dialog for better automation testing (ui.js:678-696)
- **FIXED: Auto-apply After Delete** - Rules automatically reapply after deletion without manual Apply button
- **FIXED: LocalStorage Clear** - "Clear LocalStorage" now properly removes conditional formatting rules

### 🛠️ Improvements

- **LocalStorage Key Standardization**: Changed from `cf_rules` to `excelike_cf_rules` for consistent prefix-based management
- **Delete UX**: Instant deletion with automatic rule reapplication
- **Data Type Support**: Greater/Less operators work with numbers, dates, and strings
- **i18n Coverage**: All operators translated in 5 languages

### 📋 Technical Details

**Modified Files:**
- `src/plugins/conditional-formatting/evaluator.js` - Added `_compareGreater()`, `_compareLess()`, `_compareNotEquals()`
- `src/plugins/conditional-formatting/rule.js:68` - Updated validation array to include all 8 operators
- `src/plugins/conditional-formatting/constants.js` - Added operator constants and symbols
- `src/plugins/conditional-formatting/ui.js:678-696` - Removed confirm() dialog, added auto-apply
- `src/plugins/conditional-formatting/manager.js:29` - Changed storage key to `excelike_cf_rules`
- `src/plugins/conditional-formatting/conditional-formatting.js:35` - Updated default storage key
- `src/i18n.js` - Added translations for Greater, Less, Not-Equals in 5 languages

**Validation:**
- ✅ Browser testing confirmed all operators work correctly
- ✅ Boundary value behavior verified (Greater > vs Greater-Equal ≥)
- ✅ LocalStorage persistence validated
- ✅ Delete functionality tested without user interaction blocking

### ⬆️ Upgrade Guide

**From 2.0.4:**

```bash
npm update vanillajs-excelike-table
```

**Migration Note:** Conditional formatting rules will be automatically migrated from `cf_rules` to `excelike_cf_rules` on first use. No manual action required.

---

## [2.0.4] - 2025-10-08

### 🔐 Security (CRITICAL)

**This is a critical security release. All users should upgrade immediately.**

- **FIXED: XSS Vulnerability in Column Render** (HIGH) - Sanitized HTML output in virtual-scroll.js:435
- **FIXED: XSS Vulnerability in DOM Utils** (HIGH) - Replaced regex-based sanitization with DOMPurify
- **FIXED: CSV Formula Injection** (HIGH) - Added formula escape in export-module.js:514
- **ADDED: DOMPurify Integration** - Industry-standard HTML sanitization
- **ADDED: SecurityUtils Module** - Comprehensive security utilities (src/security-utils.js)
- **ADDED: SECURITY.md** - Security policy and best practices

### 🐛 Bug Fixes

- **FIXED: const Reassignment Bug** - Changed `totalItems` from const to let in virtual-scroll.js
- **FIXED: Empty Array Math Operations** (MEDIUM) - Prevent Infinity/-Infinity in filter-module.js and ExceLikeTable.js
- **FIXED: Touch Event Null Safety** (MEDIUM) - Optional chaining for touch devices (3 locations)
- **FIXED: Row Selection Null Check** (MEDIUM) - Safe getFilteredData in row-selection-plugin.js

### 🧪 Testing

- **FIXED: Jest Configuration** - Renamed jest.config.js → jest.config.cjs for ES modules compatibility
- Test infrastructure now functional and ready for implementation

### 📚 Documentation

- **ADDED: Comprehensive Analysis Reports** (18 detailed documents)
  - Executive Summary
  - Security Audit Report (23 vulnerabilities identified)
  - Performance Analysis Report (60-75% improvement potential)
  - Quality & Test Analysis
  - Refactoring Recommendations
  - Data Integrity Analysis
  - Accessibility Analysis (WCAG 2.1)
  - Architecture Analysis
- **ADDED: SuperClaude Improvement Roadmap** - 20-week transformation plan
- **ADDED: CSP Headers Guidance** - Content Security Policy recommendations

### ⚠️ Breaking Changes

None. This release is backward compatible.

### 📦 Dependencies

- **ADDED: dompurify@^3.2.7** - XSS protection

### 🎯 Security Impact

| Vulnerability | Severity | Status |
|---------------|----------|--------|
| XSS via column render | HIGH (CVSS 8.0) | ✅ FIXED |
| XSS via DOM utils | HIGH (CVSS 7.5) | ✅ FIXED |
| CSV formula injection | HIGH (CVSS 7.0) | ✅ FIXED |
| Insufficient sanitization | MEDIUM (CVSS 6.0) | ✅ FIXED |

### 📊 Health Score Improvement

- Overall Health: 3.9/10 → 4.5/10
- Security: 3.5/10 → 7.0/10 (after this release)
- Code Quality: 2.8/10 (unchanged, roadmap available)

### ⬆️ Upgrade Guide

**From 2.0.3:**

1. Update package:
```bash
npm update vanillajs-excelike-table
```

2. No code changes required - security fixes are transparent

3. (Optional) Review SECURITY.md for CSP implementation

**From <2.0.0:**

See previous changelog entries for migration guide.

### 🙏 Credits

Security improvements powered by SuperClaude Multi-Expert Analysis Framework:
- Security Engineer analysis
- Performance Engineer analysis
- Quality Engineer analysis
- Refactoring Expert analysis
- Backend Architect analysis
- Frontend Architect analysis
- System Architect analysis

## [2.0.3] - 2025-10-07

### 📚 Documentation

- **README大幅改善**: 初心者でも迷わず実装できるよう、ドキュメントを全面的に改善
  - **正確なCSSインポートパス**: `'vanillajs-excelike-table/dist/excelike-table.css'` と明記
  - **実行方法の明確化**: Vite/Webpackでの実行手順をStep-by-Stepで追加
  - **CDN使用例の追加**: コピペで即動作する完全なHTMLファイル例を追加
  - **TypeScript例の追加**: 型定義付き使用例を追加
  - **"Quick Start"セクションの再構成**: "Option 1 (ビルドツール)" と "Option 2 (CDN)" を明確に分離

### 🎯 改善内容

**修正前の問題点:**
- CSSインポートパスが `'styles'` と不明確だった
- 「どうやって実行するか」が書いていなかった
- npm未経験者向けの例がなかった
- TypeScript使用例がなかった

**修正後:**
- ✅ 正確なパス: `'vanillajs-excelike-table/dist/excelike-table.css'`
- ✅ 実行コマンド明記: `npm run dev` (Vite) / `npm start` (Webpack)
- ✅ CDN版の完全な動作例: npmなしでブラウザで直接実行可能
- ✅ TypeScript型定義の使用例を追加

**ユーザビリティ向上:**
- 🔰 JavaScript初心者でも迷わない
- 📦 npm未経験者でもCDN版で試せる
- 🛠️ ビルドツール選択肢が明確
- 📘 TypeScriptユーザーにも対応

---

## [2.0.2] - 2025-10-07

### 🐛 Fixed
- **ソートクリア機能の実装**: 列ヘッダー3回クリックでソートを解除し、元のデータ順序に復元する機能を修正
  - **根本原因**: `applySorting()` メソッドが `sortState.direction === null` の場合を処理していなかった
  - **修正内容**: ソートクリア時に `applyFilters(true)` を呼び出して元の順序を復元、無限再帰を防止
  - **影響範囲**: `applyFilters` メソッド (lines 1631, 1792-1796) と `applySorting` メソッド (lines 1836-1840)
  - **検証**: 3段階ソート動作を完全テスト済み（null → asc → desc → null）

### 📋 Technical Details
- `applyFilters(skipSorting = false)`: 無限再帰防止のための skipSorting パラメータを追加
- `applySorting()`: `else if` 節でソートクリア時の処理を追加
- ソート状態管理: null → asc → desc → null の完全なサイクルを実装

---

## [2.0.1] - 2025-10-07

### 🐛 Fixed
- **日付範囲フィルタパネルの初期値表示**: フィルタパネル再表示時に現在のフィルタ値が正しく表示されるように修正
  - **根本原因**: `<input type="date">` 要素では、HTML属性が非表示時にDOM `.value` プロパティに自動同期されない
  - **修正内容**: `setTimeout` を使用してDOM完全レンダリング後に `.value` プロパティを明示的に設定
  - **影響範囲**: `showFilterDropdown` メソッドとタブ切り替えイベント
  - **検証**: 自動テストで修正を確認済み

### 📋 Technical Details
- `showFilterDropdown` (lines 2375-2388): 既存フィルタ値からDOM `.value` を明示的に設定
- Tab switching event (lines 2882-2891): タブ切り替え時も同様に `.value` を設定
- Optional chaining追加: `dateRangeFilters?.[column.key]` でエラー防止

---

## [1.5.4] - 2025-01-22

### 🐛 Fixed
- **列リサイズロジックの根本修正**: `handleColumnResize`メソッドで全テーブル再レンダリングを回避し、特定列のみ更新
- **テーブル幅制約の最適化**: `min-width: fit-content`により、列拡張時のテーブル全体幅制約を解除
- **WordPress環境での独立列リサイズ**: 他列に影響しない真の独立列リサイズを実現

### 📋 Technical Details
- `handleColumnResize` → `updateColumnWidth`メソッドに変更（全体レンダリング回避）
- `min-width: 100%` → `min-width: fit-content`に変更
- DOM更新の最適化により他列への影響を完全排除

---

## [1.5.3] - 2025-01-22

### 🐛 Fixed
- **列リサイズ動作の改善**: `table-layout: fixed`に変更し、WordPress環境でも列幅を独立して調整可能に
- **テーブルレイアウトの一貫性**: 全環境で同じ列リサイズ動作を保証

### 📋 Technical Details
- `table-layout: auto` → `table-layout: fixed`に変更
- WordPressとテストページでの動作統一
- 列幅調整時の他列への影響を排除

---

## [1.5.2] - 2025-01-22

### 🐛 Fixed
- **ビルドプロセスの完全修正**: dist/ディレクトリの古いCSSファイルをクリーンアップし、一貫性のあるminファイル生成を保証
- **WordPress配信問題の根本解決**: minified CSSファイルが確実に最新のshadow effectsを含むように修正

### 📋 Technical Details
- クリーンビルドプロセスの実装
- 不整合なCSSファイルの除去
- ファイルサイズ: 29.5KB (verified shadow effects included)

---

## [1.5.1] - 2025-01-22

### 🐛 Fixed
- **ビルドファイルの更新**: min.cssファイルが最新のCSS変更を確実に含むように再ビルド
- **キャッシュ問題の解決**: v1.5.0でのファイル配信問題を修正

### 📋 Technical Details
- 同一バージョンでの異なるビルド内容問題を解決
- ファイルサイズ: 29.5KB (最新のCSS変数とシャドウ効果を含む)

---

## [1.5.0] - 2025-01-21

### 🎉 Added
- **フィルタ・ソート状態のLocalStorage管理**: フィルタとソートの設定が自動的に保存・復元される機能を追加
  - 基本フィルタ、範囲フィルタ、日付範囲フィルタの永続化
  - ソート列と方向の永続化
  - 自動保存機能（デバウンス処理付き）
  - バージョン管理（v1.1.0）による後方互換性

### 🛠️ Improved
- **CSS変数システムの導入**: 影エフェクトの集中管理
  - `--shadow-*` 変数による統一的な影の管理
  - 固定列・固定行の影エフェクトが自動適用
  - パフォーマンス最適化（GPU アクセラレーション）
- **コードリファクタリング**: NPM公開準備のための全体的な改善
  - 英語コメントへの統一
  - ハードウェアアクセラレーションの追加
  - CSSの最適化と保守性向上

### 🐛 Fixed  
- **固定列の影エフェクト**: `.pinned-column`から不要な影を除去、`.last-pinned-column`のみに適用

### 📋 Technical Details
- LocalStorage キー: `excelike-table-{containerId}`
- 保存形式: JSON（version, timestamp, columnState, filterState, sortState）
- CSS変数: 15種類以上の影効果変数を追加
- パフォーマンス: `transform: translateZ(0)`, `will-change` プロパティ

---

## [1.4.2] - 2025-01-20

### 🐛 Fixed
- **ピン留め列ヘッダー固定**: 列固定時にヘッダーが垂直スクロールで消える問題を完全解決
- **非固定列ヘッダー固定**: 全ヘッダーでsticky positioning が正常動作するように修正
- **Z-index 階層**: ピン留め列でデータがヘッダー前面に表示される問題を修正
- **Column Resizer 互換性**: リサイズプラグインがスティッキー位置を干渉する問題を解決

### 🛠️ Improved
- **Stacking Context**: CSS `isolation: isolate` でレイヤー管理を強化
- **!important 使用量削減**: CSS specificity の最適化で保守性向上
- **ブラウザ互換性**: Safari, Chrome, Firefox での一貫した動作保証
- **CSS競合解決**: position プロパティの競合を解消し適切な適用順序を確立
- **視覚的境界エフェクト**: 固定列と可動列の境界に影エフェクトを追加し、ユーザビリティを向上

### 📋 Technical Details
- z-index 値調整: ピン留めヘッダー 110→120, 最終ピン留めヘッダー 115→125
- Column Resizer Plugin: ピン留め列の `position: relative` 上書きを防止
- CSS Variables による統一的な z-index 管理
- thead要素: `position: relative` を削除し sticky positioning を保持
- 境界影エフェクト: `box-shadow` でピン留め列境界と固定ヘッダー境界を視覚化

---

## [1.4.1] - 2025-01-20

### 🐛 Fixed
- **ヘッダー固定**: テーブルヘッダーが確実に固定表示されるように修正
- **Safariサポート**: `-webkit-sticky` プレフィックスを追加してSafariでの固定ヘッダー対応
- **スクロール改善**: テーブルコンテナーの高さ制限を追加してスクロール動作を改善

### 🛠️ Improved
- **レスポンシブ**: flexboxレイアウトでテーブル構造を最適化
- **可視性**: ヘッダー固定時の視覚的フィードバック（box-shadow）を追加

---

## [1.4.0] - 2025-01-20

### 🎉 Added - 条件付き書式機能 (Conditional Formatting)

**主要な新機能:**
- **条件付き書式プラグイン**: Excel風の条件付き書式機能を完全実装
  - 自動初期化機能: `new ExceLikeTable()` で即座に利用可能
  - `preset: 'excel'` で自動的に有効化
  - ページリロード時も設定が自動適用

- **条件タイプ**:
  - 値の比較: equals, not equals, contains, starts with, ends with
  - 数値範囲: greater than, less than, between
  - 空白/非空白セルの検出
  - カスタム条件式のサポート

- **書式設定オプション**:
  - 背景色・文字色のカスタマイズ
  - セル単位・行単位での書式適用
  - 複数ルールの優先順位管理
  - リアルタイムプレビュー

- **管理機能**:
  - 直感的な管理UI（既存のUIコンポーネントを活用）
  - ドラッグ&ドロップでルールの優先順位変更
  - LocalStorageへの自動保存・復元
  - ルールの有効/無効切り替え

### 🛠️ Improved
- **ビルドシステム**: 
  - 新しい `build-full.js` スクリプトで条件付き書式を含む完全バンドルを生成
  - 依存関係の自動解決と最適な読み込み順序
  - CSS統合: `conditional-formatting.css` が自動的にバンドルに含まれる

- **パフォーマンス最適化**:
  - 大量データ（10,000行以上）でも高速動作
  - 仮想スクロールとの互換性
  - 効率的なルール評価エンジン

- **開発者体験**:
  - TypeScript定義ファイルに条件付き書式APIを追加
  - 包括的なAPIドキュメント
  - サンプルコード付きテストページ

### 📦 Technical Details
- **新規ファイル構成**:
  - `src/plugins/conditional-formatting/` - プラグイン本体
  - `constants.js` - 定数定義
  - `utils.js` - ユーティリティ関数
  - `performance-optimizations.js` - パフォーマンス最適化
  - `rule.js` - ルール管理
  - `evaluator.js` - 条件評価エンジン
  - `applier.js` - 書式適用エンジン
  - `manager.js` - 全体管理
  - `ui.js` - UI管理
  - `conditional-formatting.js` - メインクラス
  - `conditional-formatting.css` - スタイル定義

### 🐛 Fixed
- バンドルファイルのテンプレートリテラルエスケープ問題を修正
- プラグインモジュールの読み込み順序を最適化
- 初期化時のタイミング問題を解決

---

## [1.3.2] - 2025-08-17

### ✨ New Features
- **Settings Menu UX Improvement**: Settings menu now closes when clicking outside the menu area
- **Enhanced Menu Interaction**: Menu stays open when clicking inside, closes automatically after selecting an action

### 🐛 Bug Fixes
- **Pagination Styling**: Fixed issue where padding settings were not maintained when navigating between pages
- **Memory Management**: Added proper cleanup of document event listeners in destroy() method

### 🧹 Code Quality
- **Event Management**: Improved event listener management for better performance and memory usage
- **UX Consistency**: All menu actions now consistently close the menu after execution

---

## [1.3.1] - 2025-08-17

### 🐛 Bug Fixes
- Fixed pagination padding settings not being maintained during page changes

### 📝 Documentation
- Added comprehensive development workflow section to README.md
- Clarified src → build → dist development process
- Added AI/Human developer guidelines

---

## [1.3.0] - Previous Release

### ✨ Features
- Enhanced table functionality with Excel-like features
- LocalStorage settings persistence
- Column pinning and resizing
- Advanced filtering and sorting
- Mobile touch support

---

*For older versions, please refer to the git commit history.*

## アップグレードガイド (Upgrade Guide)

### v1.3.x → v1.4.0

**破壊的変更なし** - 既存のコードは完全に後方互換性があります。

#### 新機能の利用方法

**シンプルな使用例:**
```javascript
// v1.4.0 - 条件付き書式が自動的に利用可能
const table = new ExceLikeTable('#container', {
  data: myData,
  columns: columns,
  preset: 'excel'  // 条件付き書式が自動初期化される
});

// プログラムでルールを作成
table.conditionalFormatting.createRule({
  name: '高額注文の強調',
  condition: {
    column: 'amount',
    operator: 'greaterThan',
    value: 50000
  },
  format: {
    backgroundColor: '#52c41a',
    textColor: '#ffffff'
  },
  applyTo: 'row'
});

// UIで管理画面を開く
table.showConditionalFormatting();
```

**実用的な使用例:**
```javascript
// ステータスによる色分け
table.conditionalFormatting.createRule({
  name: '完了タスクを緑色に',
  condition: { column: 'status', operator: 'equals', value: '完了' },
  format: { backgroundColor: '#52c41a', textColor: '#ffffff' }
});

// 期限切れの警告表示
table.conditionalFormatting.createRule({
  name: '期限切れを赤色に',
  condition: { column: 'deadline', operator: 'lessThan', value: new Date() },
  format: { backgroundColor: '#ff4d4f', textColor: '#ffffff' },
  applyTo: 'row'
});

// 数値範囲での段階表示
table.conditionalFormatting.createRule({
  name: '売上80万円以上',
  condition: { column: 'sales', operator: 'between', value: [800000, 1000000] },
  format: { backgroundColor: '#faad14' }
});
```

#### 主な利点

1. **ゼロ設定**: 追加の設定やインポート不要
2. **自動永続化**: ルールはLocalStorageに自動保存
3. **即座に反映**: リアルタイムでの書式適用
4. **高速動作**: 10,000行以上でも快適なパフォーマンス
5. **直感的UI**: Excel風の使いやすい管理画面

#### インストール

```bash
# 新規インストール
npm install vanillajs-excelike-table@1.4.0

# アップグレード
npm update vanillajs-excelike-table
```

#### 互換性

- Node.js: 14.0.0以上
- ブラウザ: モダンブラウザ（Chrome, Firefox, Safari, Edge）
- TypeScript: フル型定義サポート