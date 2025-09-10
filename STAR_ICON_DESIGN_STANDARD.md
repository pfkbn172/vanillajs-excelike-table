# 星アイコン設計標準 - 完全統一化

## 最重要原則: プレビュー = 実装

**プレビューは実際の書式適用処理と全く同じでなければならない**
- プレビューで独自のロジックを書かない
- 実際のFormatterクラス（IconSetFormatter, DataBarFormatter）を使用
- 同じCSS、同じクラス、同じ色設定を適用

## 必須ルール

### 1. 統一されたアイコン作成関数の使用
**すべての星アイコンは`utils.createStarIcon()`を使用すること**

```javascript
// ✅ 正しい方法
const iconElement = this.utils.createStarIcon('★');

// ❌ 間違った方法
const iconElement = this.utils.createElement('span', ['cf-icon']);
iconElement.textContent = '★';
```

### 2. プレビューでの実装統一
**設定画面プレビューでは実際のFormatterを使用**

```javascript
// ✅ 正しい方法 - 実際のFormatterを使用
const formatter = new IconSetFormatter(config, utils);
formatter.apply(previewCell, iconSetConfig, sampleValue, mockStats);

// ❌ 間違った方法 - 独自のプレビューロジック
previewCell.innerHTML = `<span>${icon}</span>`;
```

### 2. 必須CSSクラス
星アイコンには以下のクラスが必須：
- `cf-icon`: 基本アイコンクラス  
- `cf-star-icon`: 星専用クラス（黄色色指定）

### 3. 色設定の統一参照
すべて`config.colors.starIcon`（#FF8C00）を参照：
- CSS変数: `--cf-star-icon: #FF8C00`
- JavaScript: `this.config.colors.starIcon`

## 実装箇所チェックリスト

### ✅ 実際の書式適用
- [ ] **format-applier.js** - `applyIcon()` で `createStarIcon()` 使用
- [ ] **IconSetFormatter.js** - `applyIcon()` で星検出時に `createStarIcon()` 使用

### ✅ 設定画面プレビュー  
- [ ] **enhanced-ui-manager.js** - `applyPreviewIconSet()` で `createStarIcon()` 使用

### ✅ コンテキストメニュー
- [ ] **context-menu-extension.js** - IconSet選択肢で `createStarIcon()` 使用

## 星アイコン検出条件
```javascript
function isStarIcon(icon) {
  return icon === '★' || icon === '☆' || icon.includes('star');
}
```

## 新機能開発時の注意
1. **星アイコンを扱う新しいコンポーネントを作成する場合**
   - 必ず`utils.createStarIcon()`を使用
   - 独自の星アイコン作成ロジックを実装しない

2. **アイコン関連の機能を修正する場合**
   - 既存の正しい実装（format-applier.js）を参照
   - このドキュメントの要求事項に準拠

3. **CSS修正時**
   - `cf-star-icon`クラスの色設定を変更しない
   - 新しい色が必要な場合は`config.js`の`starIcon`値を変更

## テスト項目
新機能リリース前に以下を確認：
- [ ] 実際のIconSet書式で星が黄色表示される
- [ ] 設定画面プレビューで星が黄色表示される  
- [ ] コンテキストメニューで星選択肢が黄色表示される
- [ ] ソート・フィルター後も星の色が保持される

## 違反防止
- **コードレビュー時**: `createElement('span', ['cf-icon'])` で星を作成していないか確認
- **統合テスト**: 星アイコン表示の視覚確認を必須とする
- **設計レビュー**: 新しいアイコン機能は既存の統一された実装を参照しているか確認