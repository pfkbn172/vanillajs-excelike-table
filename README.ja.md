# VanillaJS ExceLikeTable

素の JavaScript で動く、Excel のような表です。オブジェクトの配列を渡すだけで、並べ替え・Excel 風の絞り込み・ページ送り・列の幅変更／固定／表示切り替え・条件付き書式・CSV 書き出しが使えます。フレームワークも設定も要りません。

![npm version](https://img.shields.io/npm/v/vanillajs-excelike-table.svg)
![License](https://img.shields.io/npm/l/vanillajs-excelike-table.svg)

[English README](README.md)

## すぐに使う

### バンドラーを使う場合（Vite・webpack・Next.js など）

```bash
npm install vanillajs-excelike-table
```

```js
import ExceLikeTable from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/styles';

new ExceLikeTable('#table', {
  data: [
    { id: 1, name: '山田', age: 28, city: '東京' },
    { id: 2, name: '佐藤', age: 32, city: '大阪' },
  ],
  locale: 'ja',
});
```

```html
<div id="table"></div>
```

これだけで、データのキーごとに列ができ、すべての機能が有効になります。

### ビルドなしで使う場合（CDN）

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@2/dist/excelike-table.css">
<div id="table"></div>
<script src="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@2/dist/excelike-table.browser.js"></script>
<script>
  new ExceLikeTable('#table', { data: [{ id: 1, name: '山田' }, { id: 2, name: '佐藤' }], locale: 'ja' });
</script>
```

1ファイルで済ませたい場合は `dist/excelike-table.bundle.min.js` を使ってください。CSS が含まれているので `<link>` は不要です。

### Next.js・Nuxt・Astro（サーバーサイドレンダリング）

サーバー側で import しても問題ありません。表の作成は、要素ができた後にブラウザ側で行います。

```jsx
'use client';
import { useEffect, useRef } from 'react';
import ExceLikeTable from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/styles';

export default function People({ rows }) {
  const ref = useRef(null);
  useEffect(() => {
    const table = new ExceLikeTable(ref.current, { data: rows, locale: 'ja' });
    return () => table.destroy();
  }, [rows]);
  return <div ref={ref} />;
}
```

## 列の指定

列の指定は省略できます。細かく決めたいときだけ並べてください。文字列は `{ key }` の省略形で、`title` と `dataIndex` は省略すると `key` と同じになります。

```js
new ExceLikeTable('#table', {
  data: employees,
  columns: [
    'name',                                   // { key: 'name' } と同じ
    { key: 'dept', title: '部署', width: 180 },
    { key: 'salary', title: '年収', filterType: 'range' },
    { key: 'id', title: 'ID', sortable: false, filterable: false, pinned: true },
  ],
});
```

| 項目 | 既定値 | 説明 |
|---|---|---|
| `key` | — | 列の識別子。必須（`dataIndex` があれば省略可） |
| `title` | `key` | 見出しの文字 |
| `dataIndex` | `key` | 各行から読むプロパティ名 |
| `width` | `150` | 幅（px）。利用者がドラッグで変更できます |
| `sortable` / `filterable` | `true` | この列だけ並べ替え・絞り込みを止める |
| `filterType` | 自動 | `'text'`、`'range'`（数値の範囲）、`'date-hierarchy'`（年→月→日）。日付の列は自動で判定します |
| `render` | — | `(value, row) => 文字列 \| Node`。**文字列を返すと HTML として描かれます。** 自分で書いたものでないデータは必ずエスケープしてください |
| `pinned` / `hidden` | `false` | 最初から固定する／隠す |

### 列のヘルパー

```js
import ExceLikeTable, { ColumnHelpers } from 'vanillajs-excelike-table';

columns: [
  ColumnHelpers.text('name', '氏名'),
  ColumnHelpers.number('price', '価格', { currency: '¥' }),   // 1234567 → ¥1,234,567
  ColumnHelpers.date('joined', '入社日'),                    // 日付の絞り込み＋地域に合わせた表示
  ColumnHelpers.status('state', '状態', { 稼働中: '#52c41a', 停止: '#faad14' }),
  ColumnHelpers.actions('操作', [{ key: 'edit', label: '編集' }]),
]
```

ヘルパーは、描くデータを自動でエスケープします。

## オプション

| オプション | 既定値 | 説明 |
|---|---|---|
| `data` | `[]` | 行オブジェクトの配列 |
| `columns` | データから自動 | 上記を参照 |
| `pagination` | `{ pageSize: 10, showSizeChanger: true }` | オブジェクトで調整（`pageSize`、`showTotal(total, [from, to])`）。`false` で無効 |
| `locale` | `'en'` | 画面の言語。`'en'` または `'ja'` |
| `tableId` | 要素の id | 利用者の設定を保存するときのキー |
| `persistSettings` | `true` | 並べ替え・絞り込み・列幅・固定／非表示の列・文字サイズ・テーマを `localStorage` に記憶する |
| `rowKey` | `'id'` | 行を一意に決めるプロパティ |
| `bordered` / `size` | `true` / `'middle'` | 見た目（`size` は `'small'`・`'middle'`・`'large'`） |
| `renderCellHTML` | `false` | セルの値を HTML として描く。信頼できるデータのときだけ使ってください |

## メソッド

```js
const table = new ExceLikeTable('#table', { data });

table.setData(newRows);                 // データを差し替える
table.getData();                        // データのコピーを得る
table.setFilters({ city: ['東京'] });   // 絞り込みで値にチェックを入れるのと同じ
table.getFilters();
table.clearFilters();
table.exportCSV();                      // 絞り込み・並べ替え後の行（全ページ）をダウンロード
table.exportCSV({ download: false });   // CSV の文字列だけ得る
table.setLanguage('ja');
table.applyTheme('ocean');              // classic, modern, professional, ocean, dark, subtle, vibrant, nature
table.destroy();                        // 表とイベントを取り除く
```

`exportCSV()` は画面に見えている列（表示中の列、固定列が先頭）を書き出します。数値・真偽値・日付の列は、表計算で使えるよう元の値で書き出します（`¥3,800,000` ではなく `3800000`）。それ以外の列は `render` で表示しているとおりに書き出します。値の囲み方は RFC 4180 に従います。ダウンロードには UTF-8 の BOM を付けるので、日本語を含む CSV も Excel で文字化けしません。表計算ソフトが数式として実行してしまう値（`=`、`+`、`-`、`@` で始まるもの）は無害化します。`-5` のような普通の数値は数値のまま残します。

## 利用者ができること

- **並べ替え**：見出しの文字か矢印をクリック（昇順 → 降順 → 解除）
- **絞り込み**：Excel 風の値リスト（検索つき）、数値の範囲、日付は年 → 月 → 日のツリー。複数の列の絞り込みは AND で組み合わさります
- **⚙️ メニュー**：絞り込みの全解除、列の表示切り替えと固定、条件付き書式、CSV 書き出し、文字サイズ、セルの余白、言語、テーマ
- **条件付き書式**：「在庫 < 10 なら背景を赤」のようなルールを、セル単位または行単位で。表ごとに保存されます
- **列幅の変更**：見出しの端をドラッグ

`localStorage` が使えない環境（サンドボックス化された iframe、厳しいプライバシー設定など）でも表は普通に動きます。設定を記憶しないだけです。

## セキュリティ

セルの値・列の見出し・絞り込みの候補は、すべて文字として描きます。例外は、あなたが書いた `render` 関数が返す文字列と、`renderCellHTML: true` を指定した場合だけです。そこに利用者の入力が入る可能性があるなら、エスケープするか DOM の要素を返してください。詳しくは [SECURITY.md](SECURITY.md) を参照してください。

## 対応ブラウザ

Chrome・Edge・Firefox・Safari の最新版。自動テストは Chromium で、パソコン・タブレット・スマートフォンの画面サイズで実行しています。

## 開発

```bash
npm install
npm run dev          # http://localhost:4317 — examples/
npm run build        # dist/
npm run lint
npm test             # 単体テスト（Jest）
npm run test:node    # ビルドしたものを Node で import できるか
npm run test:types   # TypeScript の型定義
npm run test:e2e     # ブラウザでのテスト（Playwright）
```

`npm publish` を実行すると、上のすべてが先に走ります。

## ライセンス

MIT
