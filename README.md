# VanillaJS ExceLikeTable

An Excel-like data table in plain JavaScript. Pass an array of objects and you get sorting, Excel-style filters, pagination, column resizing / pinning / hiding, conditional formatting and CSV export — no framework, no configuration.

![npm version](https://img.shields.io/npm/v/vanillajs-excelike-table.svg)
![License](https://img.shields.io/npm/l/vanillajs-excelike-table.svg)

[日本語の README はこちら](README.ja.md)

## Quick start

### With a bundler (Vite, webpack, Next.js, …)

```bash
npm install vanillajs-excelike-table
```

```js
import ExceLikeTable from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/styles';

new ExceLikeTable('#table', {
  data: [
    { id: 1, name: 'Alice', age: 28, city: 'Tokyo' },
    { id: 2, name: 'Bob', age: 32, city: 'Osaka' },
  ],
});
```

```html
<div id="table"></div>
```

That is all: one column per key, every feature enabled.

### Without a build step (CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@2/dist/excelike-table.css">
<div id="table"></div>
<script src="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@2/dist/excelike-table.browser.js"></script>
<script>
  new ExceLikeTable('#table', { data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });
</script>
```

Prefer a single file? `dist/excelike-table.bundle.min.js` includes the CSS, so no `<link>` is needed.

### Next.js / Nuxt / Astro (server-side rendering)

Importing the package on the server is safe. Create the table in the browser only, after the element exists:

```jsx
'use client';
import { useEffect, useRef } from 'react';
import ExceLikeTable from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/styles';

export default function People({ rows }) {
  const ref = useRef(null);
  useEffect(() => {
    const table = new ExceLikeTable(ref.current, { data: rows });
    return () => table.destroy();
  }, [rows]);
  return <div ref={ref} />;
}
```

## Columns

Columns are optional. When you want control, list them — a string is short for `{ key }`, and `title` / `dataIndex` default to `key`:

```js
new ExceLikeTable('#table', {
  data: employees,
  columns: [
    'name',                                   // same as { key: 'name' }
    { key: 'dept', title: 'Department', width: 180 },
    { key: 'salary', title: 'Salary', filterType: 'range' },
    { key: 'id', title: 'ID', sortable: false, filterable: false, pinned: true },
  ],
});
```

| Property | Default | Description |
|---|---|---|
| `key` | — | Column id. Required (or give `dataIndex`). |
| `title` | `key` | Header text |
| `dataIndex` | `key` | Property to read from each row |
| `width` | `150` | Width in px (users can drag to resize) |
| `sortable` / `filterable` | `true` | Turn sorting / the filter button off for this column |
| `filterType` | auto | `'text'`, `'range'` (numbers) or `'date-hierarchy'` (year → month → day). Date columns are detected automatically. |
| `render` | — | `(value, row) => string \| Node`. **A returned string is inserted as HTML** — escape data you did not write yourself. |
| `pinned` / `hidden` | `false` | Initial pinned / hidden state |

### Column helpers

```js
import ExceLikeTable, { ColumnHelpers } from 'vanillajs-excelike-table';

columns: [
  ColumnHelpers.text('name', 'Name'),
  ColumnHelpers.number('price', 'Price', { currency: '¥' }),   // 1234567 → ¥1,234,567
  ColumnHelpers.date('joined', 'Joined'),                      // date filter + locale format
  ColumnHelpers.status('state', 'State', { Active: '#52c41a', Paused: '#faad14' }),
  ColumnHelpers.actions('Actions', [{ key: 'edit', label: 'Edit' }]),
]
```

Helpers escape the data they render.

## Options

| Option | Default | Description |
|---|---|---|
| `data` | `[]` | Array of row objects |
| `columns` | from data | See above |
| `pagination` | `{ pageSize: 10, showSizeChanger: true }` | Object to customise (`pageSize`, `showTotal(total, [from, to])`), or `false` |
| `locale` | `'en'` | UI language: `'en'` or `'ja'` |
| `tableId` | container id | Key under which user settings are saved |
| `persistSettings` | `true` | Remember sort, filters, widths, pinned/hidden columns, font size and theme in `localStorage` |
| `rowKey` | `'id'` | Unique row property |
| `bordered` / `size` | `true` / `'middle'` | Appearance (`size`: `'small'`, `'middle'`, `'large'`) |
| `renderCellHTML` | `false` | Insert raw cell values as HTML. Only for trusted data. |

## Methods

```js
const table = new ExceLikeTable('#table', { data });

table.setData(newRows);                 // replace the data
table.getData();                        // copy of the data
table.setFilters({ city: ['Tokyo'] });  // same as ticking values in the filter
table.getFilters();
table.clearFilters();
table.exportCSV();                      // download the filtered, sorted rows (all pages)
table.exportCSV({ download: false });   // …or just get the CSV text
table.setLanguage('ja');
table.applyTheme('ocean');              // classic, modern, professional, ocean, dark, subtle, vibrant, nature
table.destroy();                        // remove the table and its listeners
```

`exportCSV()` writes the columns as displayed (visible, pinned first). Numbers, booleans and date columns are written as data (`3800000`, not `¥3,800,000`) so spreadsheets can calculate with them; other columns are written as your `render` shows them. Values are quoted as RFC 4180 requires, the download starts with a UTF-8 BOM so Excel opens Japanese text correctly, and values that spreadsheets would run as formulas (`=`, `+`, `-`, `@` …) are neutralised. Plain numbers such as `-5` are left as numbers.

## What users can do

- **Sort**: click a header title or its arrows (ascending → descending → off).
- **Filter**: Excel-style value lists with search, numeric ranges, and a year → month → day tree for dates. Filters on several columns combine with AND.
- **⚙️ menu**: clear filters, show/hide and pin columns, conditional formatting, export CSV, font size, cell padding, language, theme.
- **Conditional formatting**: rules such as "Stock < 10 → red background", per cell or per row, saved per table.
- **Resize** columns by dragging the header edge.

When `localStorage` is unavailable (sandboxed iframes, strict privacy settings) the table works normally and simply does not remember settings.

## Security

Cell values, column titles and filter lists are rendered as text. The exceptions are explicit: strings returned from your own `render` functions, and `renderCellHTML: true`. If those may contain user input, escape it (or return a DOM node). See [SECURITY.md](SECURITY.md).

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The automated tests run in Chromium at desktop, tablet and phone sizes.

## Development

```bash
npm install
npm run dev          # http://localhost:4317 — examples/
npm run build        # dist/
npm run lint
npm test             # unit tests (Jest)
npm run test:node    # the build can be imported in Node
npm run test:types   # TypeScript definitions
npm run test:e2e     # browser tests (Playwright)
```

`npm publish` runs all of the above first.

## License

MIT
