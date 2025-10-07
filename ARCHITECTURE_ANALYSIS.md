# 🏗️ ExceLikeTable フィルタ機能 - アーキテクチャ分析と理想設計

**分析日**: 2025-10-07
**対象**: src/ExceLikeTable.js (フィルタ状態管理)

---

## 📊 現状の問題点分析

### 1. フィルタ状態の管理構造

#### 現在の状態管理 (constructor:562-574)
```javascript
this.state = {
  filters: {},              // 値ベースフィルタ: { columnKey: [value1, value2, ...] }
  filterModes: {},          // モード管理: { columnKey: 'range' | 'values' }
  rangeFilters: {},         // 範囲フィルタ: { columnKey: { min, max } }
  dateRangeFilters: {},     // 日付範囲: { columnKey: { startDate, endDate } }
  rangeIncludeBlanks: {},   // 空白含む: { columnKey: boolean }
  dateRangeIncludeBlanks: {} // 日付空白: { columnKey: boolean }
}
```

**問題点**:
- ✅ モード (`filterModes`) によってどのフィルタが有効かを制御している
- ❌ しかし、複数のフィルタ状態が**同時に存在可能**
- ❌ **競合状態の検証が不完全**で、LocalStorageに競合状態が保存される
- ❌ 状態遷移時のクリーンアップが**複数箇所に分散**している

### 2. 状態クリーンアップの実装箇所

#### ① `showFilterDropdown` メソッド (2168-2185行目)
```javascript
// 引き継ぎ文書で追加された修正
const currentMode = this.state.filterModes?.[column.key];

if (currentMode === 'range') {
  delete this.state.filters[column.key];  // ← クリーンアップ
  this.applyFilters();
  this.renderBody();
  this.renderPagination();
} else if (currentMode === 'values') {
  delete this.state.rangeFilters[column.key];  // ← クリーンアップ
  delete this.state.dateRangeFilters[column.key];
  this.applyFilters();
  this.renderBody();
  this.renderPagination();
}
```

**問題**:
- ❌ フィルタパネルを開いた時点で `applyFilters()` が呼ばれている
- ❌ これが **バグ#3（自動適用）** の直接原因
- ❌ ユーザーの意図しないフィルタ適用が発生

#### ② `attachFilterEvents` - タブ切り替え (2754-2809行目)
```javascript
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode;
    this.state.filterModes[column.key] = mode;

    // クリーンアップ
    if (mode === 'range') {
      delete this.state.filters[column.key];
    } else if (mode === 'values') {
      delete this.state.rangeFilters[column.key];
      delete this.state.dateRangeFilters[column.key];
    }

    // ここでも applyFilters() が呼ばれる
    this.applyFilters();
    this.renderBody();
    this.renderPagination();
  });
});
```

**問題**:
- ✅ タブ切り替え時のクリーンアップは正しい
- ❌ しかし、ここでも即座にフィルタが適用される
- ❌ ユーザーが「OK」を押す前に適用されてしまう

#### ③ `applyRealtimeFilter` 関数 (2941-3073行目)
```javascript
const applyRealtimeFilter = () => {
  if (currentMode === 'range') {
    this.state.rangeFilters[column.key] = { min, max };
    delete this.state.filters[column.key];  // ← クリーンアップ
    this.applyFilters();
    this.renderBody();
    this.renderPagination();
  } else {
    delete this.state.rangeFilters[column.key];  // ← クリーンアップ
    this.handleFilter(column.key, selectedValues);
  }
};
```

**問題**:
- ✅ リアルタイムフィルタリングの実装
- ❌ **すべての操作がリアルタイムで適用される**
- ❌ プレビューと確定の区別がない
- ❌ これが **バグ#3、#4、#5** の根本原因

### 3. LocalStorage永続化の問題

#### 旧 `TableSettingsManager.extractSettings` (338-367行目)
```javascript
extractSettings(table) {
  return {
    columnWidths: sanitizedColumnWidths,
    visibleColumns: { ...table.state.visibleColumns },
    pinnedColumns: { ...table.state.pinnedColumns },
    filters: { ...table.state.filters },  // ← 競合状態がそのまま保存される
    sortColumn: table.state.sortColumn,
    sortOrder: table.state.sortOrder,
    // ...
  };
}
```

**問題**:
- ❌ `filters`, `rangeFilters`, `filterModes` の整合性を**検証せずに保存**
- ❌ 競合状態がLocalStorageに永続化される
- ❌ ページリロード時に競合状態が復元される
- ❌ これが **バグ#6** の原因

---

## 🎯 理想的な設計

### 設計原則

1. **Single Source of Truth**
   - フィルタ状態は1つのオブジェクトで管理
   - モードと値は常に整合性が保たれる

2. **明示的な状態遷移**
   - プレビュー状態と確定状態を明確に分離
   - ユーザーの意図しない適用を防ぐ

3. **不変性の保証**
   - 状態変更は常にバリデーション済み
   - 競合状態は構造的に不可能

### 新しい状態管理構造

```javascript
this.state = {
  // ✅ 新設計: フィルタ状態を統一管理
  columnFilters: {
    // columnKey ごとに以下の構造
    [columnKey]: {
      mode: 'range' | 'values' | null,  // null = フィルタなし

      // mode === 'range' の場合のみ有効
      range: {
        min: number,
        max: number,
        includeBlanks: boolean
      },

      // mode === 'range' かつ 日付の場合
      dateRange: {
        startDate: string,
        endDate: string,
        includeBlanks: boolean
      },

      // mode === 'values' の場合のみ有効
      values: [value1, value2, ...]
    }
  },

  // ✅ プレビュー用の一時状態（確定前）
  filterPreview: {
    [columnKey]: { /* 上記と同じ構造 */ }
  }
}
```

**利点**:
- ✅ 1つの列に対して1つのフィルタ構造のみ存在
- ✅ モードと値が常に整合性を保つ
- ✅ プレビューと確定を明確に分離
- ✅ バリデーションが容易

---

## 🔧 修正計画

### Phase 1: 状態管理の再設計

#### 1.1 新しい状態構造への移行
```javascript
// 新しいヘルパークラス
class FilterState {
  constructor() {
    this.filters = new Map(); // columnKey -> FilterConfig
  }

  // フィルタ設定（バリデーション付き）
  setFilter(columnKey, config) {
    // バリデーション
    if (!this.validate(config)) {
      throw new Error('Invalid filter configuration');
    }

    // 競合チェック
    if (config.mode === 'range') {
      // rangeモードでは values を削除
      delete config.values;
    } else if (config.mode === 'values') {
      // valuesモードでは range を削除
      delete config.range;
      delete config.dateRange;
    }

    this.filters.set(columnKey, config);
  }

  // フィルタ取得
  getFilter(columnKey) {
    return this.filters.get(columnKey) || { mode: null };
  }

  // フィルタクリア
  clearFilter(columnKey) {
    this.filters.delete(columnKey);
  }

  // 整合性チェック
  validate(config) {
    if (config.mode === 'range') {
      return config.range !== undefined || config.dateRange !== undefined;
    } else if (config.mode === 'values') {
      return Array.isArray(config.values);
    }
    return config.mode === null;
  }

  // LocalStorage用にシリアライズ
  serialize() {
    const obj = {};
    this.filters.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  // LocalStorageから復元
  deserialize(obj) {
    Object.keys(obj).forEach(key => {
      if (this.validate(obj[key])) {
        this.filters.set(key, obj[key]);
      }
    });
  }
}
```

#### 1.2 プレビュー機能の実装
```javascript
class FilterPreview {
  constructor(originalState) {
    this.original = originalState.serialize();
    this.preview = new FilterState();

    // 現在の状態をプレビューにコピー
    this.preview.deserialize(this.original);
  }

  // プレビューに変更を適用
  apply(columnKey, config) {
    this.preview.setFilter(columnKey, config);
  }

  // プレビューを確定
  commit(targetState) {
    targetState.deserialize(this.preview.serialize());
  }

  // プレビューをキャンセル
  cancel(targetState) {
    targetState.deserialize(this.original);
  }
}
```

### Phase 2: UIイベントハンドラの修正

#### 2.1 `showFilterDropdown` の修正方針
```javascript
showFilterDropdown(column, button) {
  // ❌ 削除: フィルタパネルを開いた時点での applyFilters() 呼び出し
  // ✅ 追加: プレビューモードの開始
  this.filterPreview = new FilterPreview(this.state.filterState);

  // ... UIの構築 ...

  // ✅ プレビュー状態に基づいてUIを初期化
  const currentFilter = this.filterPreview.preview.getFilter(column.key);
  // ... フィルタパネルにcurrentFilterを反映 ...
}
```

#### 2.2 リアルタイムフィルタの修正
```javascript
const applyRealtimeFilter = () => {
  // ✅ プレビュー状態のみ更新
  this.filterPreview.apply(column.key, {
    mode: currentMode,
    range: { min, max, includeBlanks },
    // or
    values: selectedValues
  });

  // ✅ プレビュー状態に基づいて一時的に描画
  this.renderPreview(this.filterPreview.preview);

  // ❌ 削除: saveStateDebounced() の呼び出し
};
```

#### 2.3 OK/Cancelボタンの修正
```javascript
// OKボタン
confirmBtn.addEventListener('click', () => {
  // ✅ プレビューを確定
  this.filterPreview.commit(this.state.filterState);

  // ✅ 確定後にフィルタを適用
  this.applyFilters();
  this.renderBody();
  this.renderPagination();

  // ✅ LocalStorageに保存
  this.saveStateDebounced();

  this.closeFilter();
});

// Cancelボタン
cancelBtn.addEventListener('click', () => {
  // ✅ プレビューをキャンセル
  this.filterPreview.cancel(this.state.filterState);

  // ✅ 元の状態で再描画
  this.renderBody();
  this.renderPagination();

  this.closeFilter();
});
```

### Phase 3: LocalStorage永続化の修正

#### 3.1 保存前のバリデーション
```javascript
extractSettings(table) {
  // ✅ フィルタ状態の整合性チェック
  const validatedFilters = table.state.filterState.serialize();

  return {
    columnWidths: sanitizedColumnWidths,
    visibleColumns: { ...table.state.visibleColumns },
    pinnedColumns: { ...table.state.pinnedColumns },

    // ✅ 新フォーマットで保存
    columnFilters: validatedFilters,

    // ✅ バージョン番号を更新
    version: '2.0.0',  // 新フォーマット
    timestamp: Date.now()
  };
}
```

#### 3.2 読み込み時のマイグレーション
```javascript
applySettings(table, settings) {
  // ✅ バージョンチェック
  if (settings.version === '1.0.0') {
    // 旧フォーマットから新フォーマットへ変換
    settings = this.migrateFromV1(settings);
  }

  // ✅ 整合性チェック
  if (settings.columnFilters) {
    const filterState = new FilterState();
    filterState.deserialize(settings.columnFilters);

    // すべてのフィルタが有効か検証
    if (filterState.validate()) {
      table.state.filterState = filterState;
    } else {
      console.warn('Invalid filters in saved settings, ignoring');
    }
  }

  // ... 他の設定を適用 ...
}

migrateFromV1(oldSettings) {
  const newFilters = {};

  // 旧フォーマットの filters, rangeFilters, filterModes を統合
  const allKeys = new Set([
    ...Object.keys(oldSettings.filters || {}),
    ...Object.keys(oldSettings.rangeFilters || {}),
    ...Object.keys(oldSettings.filterModes || {})
  ]);

  allKeys.forEach(key => {
    const mode = oldSettings.filterModes?.[key] || 'values';

    if (mode === 'range') {
      newFilters[key] = {
        mode: 'range',
        range: oldSettings.rangeFilters[key],
        // 競合する values は無視
      };
    } else {
      newFilters[key] = {
        mode: 'values',
        values: oldSettings.filters[key] || [],
        // 競合する rangeFilters は無視
      };
    }
  });

  return {
    ...oldSettings,
    columnFilters: newFilters,
    version: '2.0.0'
  };
}
```

---

## ✅ 期待される改善効果

### バグ修正
1. ✅ **バグ#3**: フィルタパネルを開いても自動適用されない
2. ✅ **バグ#4**: OKボタンは常に有効（プレビュー確定用）
3. ✅ **バグ#5**: Cancelボタンが正しく動作（プレビュー破棄）
4. ✅ **バグ#6**: フィルタアイコンのDOM破壊を防ぐ
5. ✅ **LocalStorage**: 競合状態が保存されない

### アーキテクチャ改善
- ✅ 状態管理がシンプルで保守しやすい
- ✅ バグの混入が構造的に不可能
- ✅ テストが容易（状態の検証が簡単）
- ✅ 将来の拡張に対応しやすい

### UX改善
- ✅ ユーザーの意図しないフィルタ適用がなくなる
- ✅ プレビューで結果を確認してから確定できる
- ✅ キャンセルで確実に元に戻る
- ✅ 予測可能な動作

---

## 🎬 実装の優先順位

### Priority 1: 緊急修正（最低限の動作保証）
1. `showFilterDropdown` での `applyFilters()` 呼び出しを削除
2. プレビュー/確定の仕組みを最小限実装
3. LocalStorage保存前のバリデーション追加

### Priority 2: 構造改善（根本的な修正）
1. `FilterState` クラスの実装
2. `FilterPreview` クラスの実装
3. 全イベントハンドラの書き換え

### Priority 3: データマイグレーション
1. 旧フォーマットからの変換ロジック
2. LocalStorage整合性チェック
3. エラーハンドリング強化

---

**次のステップ**: この設計に基づいた修正計画を作成し、順次実装します。
