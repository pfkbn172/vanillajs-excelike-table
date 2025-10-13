# VanillaJS ExceLikeTable

> **The simplest Excel-like table for JavaScript**  
> Zero configuration needed - all features work out of the box! ✨

![npm version](https://img.shields.io/npm/v/vanillajs-excelike-table.svg)
![License](https://img.shields.io/npm/l/vanillajs-excelike-table.svg)
![Size](https://img.shields.io/bundlephobia/minzip/vanillajs-excelike-table.svg)

## ✨ Why This Library?

- 🎯 **Zero Configuration**: Just pass data and columns - everything works!
- ⚡ **All Features Enabled**: Filtering, sorting, pagination, column pinning - all included by default
- 🚀 **Modern ESM**: Works with Vite, Webpack, Next.js, and all modern tools
- 📦 **Lightweight Package**: Pure vanilla JavaScript (~100KB minified)
- 💾 **Auto-Save Settings**: User preferences saved automatically
- 🎨 **Excel-like UX**: Familiar interface for end users

---

## 🚀 Quick Start

### Installation

```bash
npm install vanillajs-excelike-table
```

### Option 1: With Build Tools (Vite/Webpack - Recommended)

**Step 1:** Install the package (see above)

**Step 2:** Create your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Table App</title>
</head>
<body>
  <div id="my-table"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 3:** Create `src/main.js`:

```javascript
import ExceLikeTable from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/dist/excelike-table.css';

const table = new ExceLikeTable('#my-table', {
  data: [
    { id: 1, name: 'John Doe', age: 30, city: 'New York' },
    { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
    { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' }
  ],
  columns: [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'age', title: 'Age', dataIndex: 'age' },
    { key: 'city', title: 'City', dataIndex: 'city' }
  ]
});
```

**Step 4:** Run your dev server:

```bash
npm run dev  # For Vite
# or
npm start    # For Webpack/other bundlers
```

**That's it!** ✅ You now have:
- ✓ Sortable columns (click headers)
- ✓ Filterable data (click filter icons)
- ✓ Pagination (10 items per page)
- ✓ Resizable columns (drag edges)
- ✓ Pinnable columns (column settings menu)
- ✓ Auto-saved user preferences

---

### Option 2: CDN (No Build Tools Required)

Copy and paste this complete HTML file - it works immediately!

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ExceLikeTable Demo</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@latest/dist/excelike-table.css">
</head>
<body>
  <div id="my-table"></div>

  <script src="https://cdn.jsdelivr.net/npm/vanillajs-excelike-table@latest/dist/excelike-table.browser.js"></script>
  <script>
    const table = new ExceLikeTable('#my-table', {
      data: [
        { id: 1, name: 'Alice', age: 28, city: 'Tokyo' },
        { id: 2, name: 'Bob', age: 32, city: 'NYC' },
        { id: 3, name: 'Carol', age: 25, city: 'London' }
      ],
      columns: [
        { key: 'name', title: 'Name', dataIndex: 'name' },
        { key: 'age', title: 'Age', dataIndex: 'age' },
        { key: 'city', title: 'City', dataIndex: 'city' }
      ]
    });
  </script>
</body>
</html>
```

**Just open this HTML file in your browser - no npm, no build step needed!**

---

## 📖 More Usage Examples

### CommonJS (Node.js SSR)

```javascript
const ExceLikeTable = require('vanillajs-excelike-table');
// CSS must be loaded separately in your HTML

const table = new ExceLikeTable('#container', {
  data: myData,
  columns: myColumns
});
```

### TypeScript

```typescript
import ExceLikeTable, { ExceLikeTableOptions, ExceLikeTableColumn } from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/dist/excelike-table.css';

const options: ExceLikeTableOptions = {
  data: myData,
  columns: myColumns
};

const table = new ExceLikeTable('#container', options);
```

---

## 🎯 Column Helpers (Easy Setup)

Use `ColumnHelpers` for common column types with pre-configured features:

```javascript
import ExceLikeTable, { ColumnHelpers } from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/dist/excelike-table.css';

const table = new ExceLikeTable('#container', {
  data: employees,
  columns: [
    ColumnHelpers.text('name', 'Employee Name'),
    ColumnHelpers.number('salary', 'Salary', { currency: '$' }),
    ColumnHelpers.date('joinDate', 'Join Date'),
    ColumnHelpers.status('status', 'Status', {
      'Active': '#52c41a',
      'On Leave': '#faad14',
      'Terminated': '#ff4d4f'
    })
  ]
});
```

### Available Helpers

| Helper | Usage | Features |
|--------|-------|----------|
| `text()` | `ColumnHelpers.text('key', 'Title')` | Basic text column |
| `number()` | `ColumnHelpers.number('price', 'Price', { currency: '¥' })` | Formatted numbers with currency |
| `date()` | `ColumnHelpers.date('date', 'Date')` | Auto-formatted dates with hierarchy filter |
| `status()` | `ColumnHelpers.status('status', 'Status', colors)` | Colored status badges |
| `actions()` | `ColumnHelpers.actions('Actions', buttons)` | Action buttons |

---

## 📋 API Reference

### Constructor

```javascript
new ExceLikeTable(container, options)
```

#### Parameters

**container** `string | HTMLElement`  
CSS selector or DOM element where table will be rendered

**options** `Object`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `Array` | `[]` | Your data array |
| `columns` | `Array` | `[]` | Column definitions |
| `rowKey` | `string` | `'id'` | Unique row identifier |
| `pagination` | `Object\|false` | `{pageSize: 10, showSizeChanger: true}` | Pagination config or `false` to disable |
| `bordered` | `boolean` | `true` | Show table borders |
| `size` | `'small'\|'middle'\|'large'` | `'middle'` | Table size |
| `tableId` | `string` | `'excelike-table'` | Unique ID for settings storage |
| `persistSettings` | `boolean` | `true` | Auto-save user preferences |

---

### Column Definition

All features are enabled by default for each column!

```javascript
{
  key: 'columnKey',        // Required: Unique identifier
  title: 'Column Title',   // Required: Display name
  dataIndex: 'dataKey',    // Required: Property name in data
  width: 150,              // Optional: Column width (default: 150)
  sortable: true,          // Optional: Enable sorting (default: true)
  filterable: true,        // Optional: Enable filtering (default: true)
  filterType: 'text',      // Optional: 'text' | 'date-hierarchy' | 'range'
  render: (value, record) => `<b>${value}</b>`,  // Optional: Custom renderer
  hidden: false            // Optional: Hide column (default: false)
}
```

---

### Methods

```javascript
// Update table data
table.setData(newData);

// Get current filters
const filters = table.getFilters();

// Set filters programmatically
table.setFilters({ name: ['John'], age: [30] });

// Clear all filters
table.clearFilters();

// Clean up and destroy table
table.destroy();
```

---

## 💡 Real-World Examples

### Employee Management Table

```javascript
import ExceLikeTable, { ColumnHelpers } from 'vanillajs-excelike-table';
import 'vanillajs-excelike-table/dist/excelike-table.css';

const employees = [
  { id: 1, name: 'Alice', department: 'Engineering', salary: 120000, joinDate: '2020-03-15', status: 'Active' },
  { id: 2, name: 'Bob', department: 'Marketing', salary: 85000, joinDate: '2019-07-22', status: 'Active' },
  { id: 3, name: 'Carol', department: 'Sales', salary: 95000, joinDate: '2021-01-10', status: 'On Leave' }
];

const table = new ExceLikeTable('#employee-table', {
  data: employees,
  columns: [
    ColumnHelpers.text('name', 'Employee Name'),
    ColumnHelpers.text('department', 'Department'),
    ColumnHelpers.number('salary', 'Salary', { currency: '$' }),
    ColumnHelpers.date('joinDate', 'Join Date'),
    ColumnHelpers.status('status', 'Status', {
      'Active': '#52c41a',
      'On Leave': '#faad14',
      'Terminated': '#ff4d4f'
    }),
    ColumnHelpers.actions('Actions', [
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' }
    ])
  ]
});
```

### Sales Dashboard

```javascript
const salesData = [
  { date: '2024-01-15', product: 'Widget A', quantity: 120, revenue: 2400, profit: 15 },
  { date: '2024-01-16', product: 'Widget B', quantity: 85, revenue: 3400, profit: 22 },
  { date: '2024-01-17', product: 'Widget C', quantity: 200, revenue: 5000, profit: -5 }
];

const table = new ExceLikeTable('#sales-table', {
  data: salesData,
  columns: [
    ColumnHelpers.date('date', 'Date'),
    ColumnHelpers.text('product', 'Product'),
    ColumnHelpers.number('quantity', 'Qty'),
    ColumnHelpers.number('revenue', 'Revenue', { currency: '¥' }),
    {
      key: 'profit',
      title: 'Profit %',
      dataIndex: 'profit',
      render: (value) => {
        const color = value >= 0 ? '#52c41a' : '#ff4d4f';
        return `<span style="color: ${color}; font-weight: bold;">${value}%</span>`;
      }
    }
  ],
  pagination: { pageSize: 20 }
});
```

### Minimal Configuration

```javascript
// Simplest possible usage
const table = new ExceLikeTable('#container', {
  data: myData,
  columns: [
    { key: 'col1', title: 'Column 1', dataIndex: 'col1' },
    { key: 'col2', title: 'Column 2', dataIndex: 'col2' }
  ]
});
// Everything just works! ✨
```

---

## ⚙️ Customization

### Disable Specific Features

All features are enabled by default. You can disable them if needed:

```javascript
const table = new ExceLikeTable('#container', {
  data: myData,
  columns: myColumns,
  pagination: false,          // Disable pagination
  persistSettings: false      // Disable auto-save
});

// Or disable per-column:
columns: [
  { 
    key: 'id', 
    title: 'ID', 
    dataIndex: 'id',
    sortable: false,    // Disable sorting for this column
    filterable: false   // Disable filtering for this column
  }
]
```

### Custom Pagination

```javascript
const table = new ExceLikeTable('#container', {
  data: myData,
  columns: myColumns,
  pagination: {
    pageSize: 25,
    showSizeChanger: true,
    showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`
  }
});
```

### Custom Styling

```css
/* Override default styles */
.excelike-table-wrapper {
  --table-border-color: #e0e0e0;
  --table-header-bg: #fafafa;
  --table-row-hover: #f5f5f5;
}

/* Customize specific elements */
.table-header {
  background: linear-gradient(to bottom, #f9f9f9, #ececec);
  font-weight: 600;
}

.table-cell {
  padding: 12px 16px;
}
```

---

## 🎨 Built-in Features

### Sorting
- Click column headers to sort
- Multi-level sorting support
- Custom sort functions

### Filtering
- Text filter with search
- Date hierarchy filter (year/month/day)
- Numeric range filter
- Custom filter functions

### Pagination
- Configurable page sizes
- Page navigation
- Total count display
- Can be disabled

### Column Management
- Resizable columns (drag edges)
- Pinnable columns (lock to left)
- Show/hide columns
- Auto-save column preferences

### Settings Persistence
- Column widths
- Column visibility
- Pinned columns
- Font size & padding
- Saved to LocalStorage automatically

### Conditional Formatting
- ✨ **Built-in feature** - No plugins or extra imports needed!
- Highlight rows/cells based on rules
- 8 comparison operators: Equals (=), Not-Equals (≠), Greater (>), Greater-Equal (≥), Less (<), Less-Equal (≤), Contains, Not-Contains
- Multiple data types: Text, Number, Date
- Custom background and text colors
- Auto-save rules to LocalStorage
- Multi-language support (English, Japanese, Spanish, French, German)
- Access via table menu (⚙️) → "Conditional Formatting"

### Security & Performance
- **CSV Formula Injection Prevention**: Automatic formula escape in exports to prevent Excel injection attacks
- **Virtual Scrolling**: High-performance rendering for large datasets (10,000+ rows)
- **Optimized Rendering**: 60-75% performance improvement with virtual scroll
- **Automatic Data Type Detection**: Smart detection of numbers, dates, and text without configuration

---

## 🌐 Browser Support

Works in all modern browsers and environments:

| Environment | Support |
|-------------|---------|
| Chrome/Edge | ✅ Latest |
| Firefox | ✅ Latest |
| Safari | ✅ Latest |
| Node.js | ✅ 14+ |
| Vite | ✅ Yes |
| Webpack | ✅ Yes |
| Next.js | ✅ Yes |
| React/Vue/Angular | ✅ Yes (framework-agnostic) |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

---

## 📄 License

MIT License - feel free to use this library in your projects!

---

## 📞 Support

For questions, issues, or feature requests, please visit the GitHub repository.

---

**Made with ❤️ for developers who love simplicity**
