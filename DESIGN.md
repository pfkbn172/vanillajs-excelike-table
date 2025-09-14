# 条件付き書式プラグイン設計書（第3版）

## 設計概要と変遷

### 設計方針の進化
1. **第1版**: シンプルな基本実装（問題：循環依存、初期化エラー）
2. **第2版**: 企業級アーキテクチャ（問題：過度なエンジニアリング）
3. **第3版**: 実用性重視の最小限修正 ✅

### 核心設計原則
- **YAGNI原則**: 現時点で必要でない機能は実装しない
- **KISS原則**: 可能な限りシンプルに保つ
- **実用性第一**: 理論よりも実際の使いやすさを重視
- **最小限修正**: 根本問題のみを解決し、それ以外は触らない
- **段階的改善**: 必要に応じて後から拡張可能な構造

### なぜ企業級アーキテクチャを採用しなかったか
**判断理由:**
- コード量が5-8倍増加（実装・保守コスト爆発）
- EventBus + DI による複雑化（デバッグ困難）
- 基本要求に対して解決策が過大
- YAGNI原則への明確な違反
- 実装期間が2-3週間→1-2日の要求とのミスマッチ

### 基本機能
1. ルールの作成・編集・削除
2. 条件の評価（セル値に基づく）
3. 書式の適用（背景色、文字色、太字など）
4. 複数ルールの優先度管理
5. ユーザーインターフェース（ダイアログ、コンテキストメニュー）

## アーキテクチャ（第3版）

### 解決された問題と修正方法

| 問題 | 修正方法 | 実装コスト |
|------|---------|------------|
| 循環依存 | コールバック通信 | 低 |
| 初期化エラー | 依存関係チェック関数 | 低 |
| メモリリーク | 明示的クリーンアップ | 低 |
| エラーハンドリング | 重要部分のみ強化 | 中 |
| セルID不安定 | data属性で永続化 | 低 |

### コンポーネント構成（ほぼ元のまま）

```
ConditionalFormattingPlugin (メイン・統合制御)
├── RuleManager (状態管理 + 依存チェック追加)
│   ├── RuleEvaluator (条件評価・変更なし)
│   └── FormatApplier (書式適用 + クリーンアップ改善)
├── RuleDialog (UI: ダイアログ + コールバック通信)
├── ContextMenuExtension (UI: メニュー・最小修正)
└── ConditionalFormattingRule (データ構造・変更なし)
```

### 通信方式の変更
- **修正前**: RuleDialog ←→ RuleManager（循環依存）
- **修正後**: RuleDialog → Callback → RuleManager（単方向）

### 責務分離

#### ConditionalFormattingRule
- **責務**: ルールデータ構造の定義と基本検証
- **主要メソッド**: `validate()`, `toJSON()`, `fromJSON()`
- **データ**: id, name, enabled, priority, condition, format

#### RuleEvaluator  
- **責務**: セル値とルール条件のマッチング評価
- **主要メソッド**: `evaluate(cellValue, rule)`
- **対応演算子**: equals, not-equals, greater, less, contains, starts-with, ends-with

#### FormatApplier
- **責務**: DOM要素への書式適用とクリア
- **主要メソッド**: `applyToCell()`, `clearCell()`, `clearAll()`
- **対応書式**: backgroundColor, color, fontWeight, fontStyle

#### RuleManager
- **責務**: ルール管理と全体制御
- **主要メソッド**: `addRule()`, `removeRule()`, `applyToTable()`, `save()`, `load()`
- **機能**: 優先度管理、LocalStorage永続化

#### RuleDialog
- **責務**: ルール作成・編集UI
- **主要メソッド**: `show()`, Promise-based API
- **機能**: フォーム表示、検証、データ収集

#### ContextMenuExtension
- **責務**: 右クリックメニューの拡張
- **主要メソッド**: `integrate()`, メニュー表示
- **機能**: テーブルとの統合、アクション処理

## 詳細設計

### データ構造

#### ルール構造
```javascript
{
  id: string,           // 一意識別子
  name: string,         // ルール名
  enabled: boolean,     // 有効/無効
  priority: number,     // 優先度（小さいほど高優先）
  condition: {
    column: string,     // 対象列
    operator: string,   // 演算子
    value: any,         // 比較値
    type: string        // データ型
  },
  format: {
    backgroundColor: string | null,
    color: string | null,
    fontWeight: string | null,
    fontStyle: string | null
  }
}
```

### 処理フロー

#### 基本フロー
1. ユーザーがセルを右クリック
2. コンテキストメニューに「条件付き書式」表示
3. ダイアログでルール設定
4. ルール保存・適用
5. 条件に合うセルに書式適用

#### ルール評価フロー
1. 有効なルールを優先度順で取得
2. 各セルの値を取得
3. ルール条件と比較評価
4. マッチした最初のルールの書式を適用

### エラーハンドリング

#### 基本方針
- try-catch による例外捕捉
- ユーザーフレンドリーなエラーメッセージ
- 部分的失敗でもシステム全体は継続動作

#### 主要エラーパターン
- ルール検証エラー（必須項目未入力）
- 条件評価エラー（データ型不一致）
- DOM操作エラー（要素が存在しない）
- 永続化エラー（LocalStorage制限）

### パフォーマンス考慮

#### 最適化ポイント
- ルール評価は必要最小限に
- DOM操作は批量処理を避け単純化
- 過度なメモ化は避ける
- 初期実装では最適化より正確性重視

## 実装仕様

### ファイル構成
```
src/plugins/conditional-formatting/
├── conditional-formatting-plugin.js  # メインプラグイン
├── rule.js                          # ルールデータ構造
├── rule-evaluator.js               # 条件評価エンジン
├── format-applier.js               # 書式適用エンジン  
├── rule-manager.js                 # ルール管理
├── rule-dialog.js                  # ダイアログUI
├── context-menu-extension.js       # メニュー拡張
└── conditional-formatting.css      # 基本スタイル
```

### API設計

#### プラグイン初期化
```javascript
const plugin = new ConditionalFormattingPlugin();
plugin.init(tableInstance, apiInstance);
```

#### ルール操作
```javascript
// ルール作成
const rule = new ConditionalFormattingRule(config);
ruleManager.addRule(rule);

// 条件評価
const matches = ruleEvaluator.evaluate(cellValue, rule);

// 書式適用
formatApplier.applyToCell(cellElement, format);
```

#### UI操作
```javascript
// ダイアログ表示
const rule = await ruleDialog.show(existingRule);

// メニュー統合
contextMenu.integrate(tableElement);
```

### スタイル仕様

#### CSS クラス
- `.cf-formatted-cell`: 書式適用済みセル
- `.cf-context-menu`: コンテキストメニュー
- `.cf-rule-dialog`: ルールダイアログ
- `.cf-dialog-overlay`: ダイアログオーバーレイ

#### 基本スタイル
- トランジション効果（0.2秒）
- ボックスシャドウによる立体感
- 統一されたパディング・マージン
- レスポンシブ対応のフレックスレイアウト

## テスト戦略

### テスト方針
- 基本的なユニットテスト
- 手動統合テスト
- シンプルなE2Eテスト
- 過度な自動化は避ける

### テスト対象
- ルール検証ロジック
- 条件評価の正確性
- 書式適用の動作確認
- UI操作の基本フロー

## 品質要件

### 機能要件
- ルール作成・編集・削除が正常動作
- 条件評価が正確
- 書式適用が視覚的に確認できる
- データ永続化が動作

### 非機能要件
- レスポンス時間: 基本操作は1秒以内
- メモリ使用量: 10MB以内
- ブラウザ対応: モダンブラウザ（Chrome, Firefox, Safari, Edge）
- 保守性: 各ファイル200行以内

### 制約事項
- 複雑な数式は未対応
- 高度な書式（データバー等）は将来機能
- 大量データ（10,000セル以上）は性能劣化の可能性
- RTL言語は未対応

## 段階的実装戦略

### Phase 1: 基本機能の確実な動作（Priority: CRITICAL）
1. **循環依存解決** - コールバック通信実装
2. **初期化安全性** - 依存関係チェック関数追加
3. **メモリ安全性** - 明示的クリーンアップ実装
4. **基本エラーハンドリング** - try-catch強化

**目標**: 基本的な条件付き書式が確実に動作
**期間**: 1-2日

### Phase 2: 実用性向上（Priority: HIGH）
1. **セキュリティ基本対策** - XSS防止、入力検証
2. **エラーメッセージ改善** - ユーザーフレンドリーな通知
3. **パフォーマンス基本改善** - 重い処理の最適化
4. **ブラウザ互換性** - ES6→ES5対応

**目標**: 本格運用可能なレベル
**期間**: 1-2日

### Phase 3: 品質向上（Priority: MEDIUM・必要に応じて）
1. **アクセシビリティ** - キーボード操作、ARIA対応
2. **高度なパフォーマンス最適化** - バッチ処理、仮想化
3. **UI/UX改善** - レスポンシブ対応、アニメーション
4. **テスト実装** - 単体テスト、統合テスト

### 将来拡張（Phase 4以降・YAGNI適用）
- **条件種類拡張**: 数式、複合条件
- **書式種類拡張**: データバー、アイコンセット
- **UI機能拡張**: ドラッグ&ドロップ、管理画面

## 開発ガイドライン

### コーディング規約
- ES6+ モダンJavaScript使用
- クラスベース設計
- 明確なメソッド命名
- JSDoc コメント推奨
- エラーハンドリング必須

### 設計原則
- 単一責務の原則
- 依存関係最小化
- 明確なインターフェース
- 段階的な機能追加
- シンプルさ最優先

### 実装時の注意事項
- 基本機能の確実な動作を最優先
- 過度な最適化は避ける
- ユーザビリティを重視
- エラー時の適切なフィードバック
- 後からの拡張を考慮した設計

---

**最終更新**: 2024年12月20日  
**設計バージョン**: 1.0  
**ステータス**: 実装準備完了