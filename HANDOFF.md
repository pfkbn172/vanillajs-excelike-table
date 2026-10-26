# 引き継ぎ — VanillaJS ExceLikeTable

最終更新: 2026-10-26（v2.4.0 の整理）。経緯は `CHANGELOG.md` と git の履歴にある。

## 構成

| 場所 | 中身 |
|---|---|
| `src/index.js` | 配布物の入口。esbuild はここからまとめる |
| `src/ExceLikeTable.js` | 本体（約5,800行の1クラス＋ColumnHelpers・保存・列の補完） |
| `src/plugins/conditional-formatting/` | 条件付き書式。部品どうしは `globalThis` に登録して参照し合う（`index.js` の import 順に意味がある） |
| `src/export-module.js` / `security-utils.js` | CSV 書き出しと数式インジェクション対策 |
| `src/i18n.js` | 画面の文言。**英語と日本語の2言語のみ** |
| `src/theme-system.js` | テーマ（8種） |
| `types/excelike-table.d.ts` | 型定義の正本（ビルドで dist にコピー） |
| `scripts/build.mjs` | ビルド。dist を空にしてから作る |
| `scripts/dev-server.mjs` | 例と E2E 用の静的サーバー（127.0.0.1:4317） |
| `examples/` | `npm run dev` で開くページ |

## 守ること

- **データ由来の値を HTML 文字列に入れるときは必ず `escapeHTML()` を通す。** 2.3.3 まで絞り込みの候補が素通しで XSS になっていた。新しいテンプレートを書いたら `tests/e2e/getting-started.spec.js` の「Filter dropdown escapes data」と同じ形のテストを足す。
- **トップレベルで `window` / `document` / `localStorage` に触らない。** Node（SSR）で import した瞬間に落ちる。`npm run test:node` が検出する。
- **使う名前は import する。** ビルドは本物の ES モジュールとしてまとめるので、暗黙のグローバルに頼ると壊れる。ESLint の `no-undef` が検出する。
- 公開 API（README に載っているメソッド・オプション・dist のファイル名）を変えるときは CHANGELOG に書き、型定義と `tests/types/usage.ts` も直す。

## 検査

```bash
npm run lint && npm run build && npm test && npm run test:node && npm run test:types && npm run test:e2e
```

`npm publish` の前に同じものが自動で走る（`prepublishOnly`）。

| 種類 | 何を見るか |
|---|---|
| `npm test`（Jest・jsdom） | `src/` を直接読み込む単体テスト。カバレッジは約21%（基準は `jest.config.cjs` に記載、下げない） |
| `npm run test:node` | dist を Node で import / require できるか |
| `npm run test:types` | 型定義が README どおりに使えるか（`@ts-expect-error` の行はエラーのままであること） |
| `npm run test:e2e`（Playwright） | dist を実ブラウザで操作。表の挙動の大半はここで担保している |

- 時間を測る単体テストは `perfBudget(ms)` で倍率をかけている（既定3倍、`PERF_BUDGET_FACTOR` で変更）。負荷で揺れるのを避けるため。
- Firefox / WebKit は `E2E_ALL_BROWSERS=1` のときだけ走る（ブラウザの追加ダウンロードが要るため）。

## 公開の手順

1. `package.json` の version と `CHANGELOG.md` を更新
2. 上の検査をすべて通す
3. `npm pack --dry-run` で同梱ファイルを確認（dist の8ファイル＋README 2つ＋CHANGELOG＋SECURITY＋LICENSE）
4. `npm publish`（代表が実施）
5. タグ `vX.Y.Z` を push すると GitHub Release が作られる

## 未対応（分かっていること）

- 条件付き書式プラグインは `globalThis` 経由の作りのまま。読み込むと `CF_CONSTANTS` などが `globalThis` に載る。import / export への書き換えは未着手。
- `ColumnHelpers.date()` の表示形式はブラウザの言語に従い、表の `locale` には従わない。
- 型定義は手書き。本体の JSDoc とずれないよう、メソッドを足したら両方直す。
