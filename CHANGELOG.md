# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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