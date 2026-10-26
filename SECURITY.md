# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 2.4.x | ✅ |
| < 2.4.0 | ❌ — values from the data were inserted into the filter drop-down as HTML (see below). Please upgrade. |

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository rather than a public issue.

## What the library escapes

| Rendered content | How |
|---|---|
| Cell values (no `render`) | Text (`textContent`) |
| Column titles, filter drop-down titles and value lists, column settings | HTML-escaped |
| `ColumnHelpers.number / status / actions` output | HTML-escaped |
| CSV export | RFC 4180 quoting; values starting with `=`, `+`, `-`, `@`, tab or CR are prefixed with `'` so spreadsheets do not run them as formulas (plain numbers such as `-5` are kept) |

### Fixed in 2.4.0

In 2.3.3 and earlier, the values listed in a column's filter drop-down (and the title shown at its top) were inserted as HTML. Data such as `<img src=x onerror=…>` ran as script when a user opened that filter. `ColumnHelpers.status()` and `ColumnHelpers.number()` also returned data unescaped.

## What you are responsible for

Two things are inserted as HTML on purpose:

1. **Strings returned by your own `render` functions.**
2. **Cell values when you set `renderCellHTML: true`.**

If either can contain input you did not write, escape it or return a DOM node instead of a string:

```js
// Escape with your own helper or a library such as DOMPurify
render: (value) => DOMPurify.sanitize(value)

// Or return a node: its text is never parsed as HTML
render: (value) => Object.assign(document.createElement('strong'), { textContent: value })

// Unsafe if `value` comes from users
render: (value) => `<strong>${value}</strong>`
```

## Data stored in the browser

With `persistSettings` (default `true`) the table stores UI settings — sort, filters, column widths and visibility, font size, theme, conditional formatting rules — in `localStorage` under keys starting with `excelike`. Filter values are part of that state, so they stay in the browser after the page is closed. Set `persistSettings: false` if filter values are sensitive.
