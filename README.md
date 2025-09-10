# VanillaJS ExceLikeTable

> A user-friendly **pure JavaScript** table library with Excel-like features, preset configurations, and intuitive column helpers. **No frameworks required!**

![npm version](https://img.shields.io/npm/v/vanillajs-excelike-table.svg)
![License](https://img.shields.io/npm/l/vanillajs-excelike-table.svg)
![Size](https://img.shields.io/bundlephobia/minzip/vanillajs-excelike-table.svg)

## ✨ Features

- 🎯 **User-friendly Design**: Preset configurations for quick setup
- 🔧 **Intuitive Column Helpers**: Easy column definition with `ColumnHelpers`
- ⚡ **Lightweight & Fast**: Pure vanilla JavaScript, no dependencies
- 🎨 **Excel-like Features**: Filtering, sorting, column pinning, resizing
- 💾 **Settings Persistence**: Auto-save user preferences to LocalStorage
- 🎚️ **Feature Selection**: Enable only what you need
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔄 **TypeScript Support**: Full type definitions included

## 🚀 Quick Start

### Installation

```bash
npm install vanillajs-excelike-table
```

### Basic Usage

```html
<!-- Include CSS -->
<link rel="stylesheet" href="node_modules/vanillajs-excelike-table/dist/excelike-table.css">

<!-- Include JavaScript -->
<script src="node_modules/vanillajs-excelike-table/dist/excelike-table.js"></script>
```

### Simple Example

```javascript
// Sample data
const data = [
  { id: 1, name: 'John Doe', age: 30, city: 'New York' },
  { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
  { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' }
];

// Easy column definition with ColumnHelpers
const columns = [
  ColumnHelpers.text('name', 'Name'),
  ColumnHelpers.number('age', 'Age'),
  ColumnHelpers.text('city', 'City')
];

// Create table with standard preset
const table = new ExceLikeTable('#table-container', {
  preset: 'standard',  // Enable sorting, filtering, pagination
  data: data,
  columns: columns
});
```

## 📋 Presets

Choose from predefined configurations to get started quickly:

| Preset | Features | Best For |
|--------|----------|----------|
| `simple` | Sorting only | Basic data display |
| `standard` | Sorting + Filtering + Pagination | Most common use cases |
| `advanced` | Standard + Column Settings + Persistence | Power users |
| `excel` | All features enabled | Full Excel-like experience |

```javascript
// Use preset
const table = new ExceLikeTable('#container', {
  preset: 'excel',
  data: data,
  columns: columns
});

// Or customize features
const table = new ExceLikeTable('#container', {
  features: ['sorting', 'filtering'],  // Only enable what you need
  data: data,
  columns: columns
});
```

## 🔧 Column Helpers

Create columns easily with built-in helpers:

### Text Column
```javascript
ColumnHelpers.text('name', 'Name', { width: 150 })
```

### Number Column
```javascript
ColumnHelpers.number('salary', 'Salary', { 
  currency: '$', 
  width: 120 
})
```

### Date Column
```javascript
ColumnHelpers.date('joinDate', 'Join Date', { 
  width: 130 
})
```

### Status Column
```javascript
ColumnHelpers.status('status', 'Status', {
  'Active': '#52c41a',
  'Inactive': '#d9d9d9',
  'Pending': '#faad14'
})
```

### Action Column
```javascript
ColumnHelpers.actions('Actions', [
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' }
])
```

## 📋 API Reference

### Constructor

```javascript
new ExceLikeTable(container, options)
```

#### Parameters

- `container` (string | HTMLElement): CSS selector or DOM element where the table will be rendered
- `options` (Object): Configuration options

#### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | Array | `[]` | Array of data objects |
| `columns` | Array | `[]` | Column definitions |
| `rowKey` | string | `'id'` | Unique identifier for each row |
| `pagination` | Object | `{ pageSize: 10, showSizeChanger: true }` | Pagination configuration |
| `bordered` | boolean | `true` | Show table borders |
| `size` | string | `'middle'` | Table size: 'small', 'middle', 'large' |
| `loading` | boolean | `false` | Show loading overlay |

### Column Definition

```javascript
{
  key: 'columnKey',           // Unique identifier
  title: 'Column Title',      // Display name
  dataIndex: 'dataProperty',  // Property name in data object
  width: 150,                 // Column width in pixels
  sortable: true,             // Enable sorting
  filterable: true,           // Enable filtering
  filterType: 'text',         // Filter type: 'text', 'date-hierarchy', 'range'
  render: (value, record) => { // Custom renderer
    return `<strong>${value}</strong>`;
  },
  onFilter: (value, record) => { // Custom filter function
    return record.property === value;
  },
  sorter: (a, b) => {         // Custom sorter function
    return a.property - b.property;
  }
}
```

### Methods

#### Data Management
```javascript
// Set new data
table.setData(newData);

// Update existing data
table.updateData(newData);

// Get current filters
const filters = table.getFilters();

// Set filters programmatically
table.setFilters({ columnKey: ['value1', 'value2'] });

// Clear all filters
table.clearFilters();
```

#### Lifecycle
```javascript
// Destroy table and clean up
table.destroy();
```

## 🎨 Styling

The library uses CSS classes that can be customized:

```css
/* Main container */
.excelike-table-wrapper { }

/* Table element */
.table { }

/* Header cells */
.table-header { }

/* Body cells */
.table-cell { }

/* Pagination */
.enhanced-table-pagination { }

/* Filter dropdowns */
.filter-dropdown { }

/* Column settings modal */
.column-settings-modal { }
```

## 🧪 Live Demo

**Comprehensive Demo**: Open `test-all-features.html` in your browser to see all features in action:
- Plugin Architecture & Management
- WebWorker Background Processing  
- Virtual Scrolling for Large Datasets
- Theme System & Internationalization
- Security Features & Accessibility
- Export Functionality
- Performance Testing & Benchmarks

## 📱 Examples

### Basic Table
```javascript
const basicTable = new ExceLikeTable('#container', {
  data: employees,
  columns: [
    { key: 'name', title: 'Name', dataIndex: 'name', sortable: true, filterable: true },
    { key: 'department', title: 'Department', dataIndex: 'department', filterable: true }
  ]
});
```

### Advanced Features
```javascript
const advancedTable = new ExceLikeTable('#container', {
  data: employees,
  columns: [
    {
      key: 'salary',
      title: 'Salary',
      dataIndex: 'salary',
      sortable: true,
      filterable: true,
      render: (value) => `$${value.toLocaleString()}`
    },
    {
      key: 'joinDate',
      title: 'Join Date',
      dataIndex: 'joinDate',
      filterType: 'date-hierarchy',
      sortable: true
    },
    {
      key: 'performance',
      title: 'Performance',
      dataIndex: 'performance',
      render: (value) => {
        return `<div class="progress-bar">
          <div class="progress-fill" style="width: ${value}%"></div>
          <span>${value}%</span>
        </div>`;
      }
    }
  ],
  pagination: {
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
  }
});
```

### Column Pinning
Use the column settings menu (⚙️ button) to pin columns to the left side of the table.

### Settings Persistence (LocalStorage)

When `persistSettings: true` is enabled, the following user preferences are automatically saved to LocalStorage and restored on page reload:

#### 💾 **Persisted Settings**
- **列幅** (Column Widths): User-adjusted column widths
- **表示列設定** (Column Visibility): Hidden/visible column states  
- **固定列設定** (Column Pinning): Left-pinned column configurations
- **文字サイズ** (Font Size): User-selected text size preferences
- **パディング** (Cell Padding): Cell spacing configurations
- **ページサイズ** (Page Size): Items per page setting

#### 🔄 **Non-Persisted Settings**
- **ソート・フィルタの設定状況** (Sort & Filter State): Reset on page reload (standard behavior)

#### 🔧 **Configuration**
```javascript
const table = new ExceLikeTable('#my-table', {
  data: myData,
  columns: myColumns,
  persistSettings: true,    // Enable LocalStorage persistence
  tableId: 'unique-table'   // Required: Unique identifier for storage key
});
```

**Note**: The `tableId` is essential for creating unique storage keys when multiple tables exist on the same domain.

### Filter Types

1. **Text Filter**: Standard checkbox list with search
2. **Date Hierarchy**: Expandable year/month filtering
3. **Range Filter**: Numeric range with slider controls

## 🔧 Development

### 🚨 **Important: Development Workflow**

**ALWAYS follow this workflow when making changes:**

1. **Edit source files**: Modify `src/ExceLikeTable.js` (never edit `dist/` files directly!)
2. **Build the library**: Run `npm run build` to generate `dist/` files
3. **Test changes**: The HTML files load from `dist/`, so changes appear only after building

```bash
# Example workflow:
vim src/ExceLikeTable.js     # 1. Edit source
npm run build                # 2. Build dist files
# 3. Your changes are now live!
```

⚠️ **Common Mistake:**
- ❌ Wrong: Editing dist/excelike-table.js directly
- ✅ Correct: Edit src/ExceLikeTable.js → run npm run build

### Build from Source
```bash
# Install dependencies
npm install

# Build the library
npm run build

# Start development server
npm run dev
```

### File Structure
```
vanilla-excelike-table/
├── src/
│   ├── ExceLikeTable.js          # Main table class
│   ├── ExceLikeTable.css         # Core styles
│   ├── plugin-system.js          # Plugin architecture
│   ├── webworker-support.js      # Background processing
│   ├── virtual-scroll.js         # Large dataset handling
│   ├── accessibility.js          # WCAG compliance
│   ├── i18n.js                   # Internationalization
│   ├── theme-system.js           # Dynamic theming
│   ├── export-module.js          # Data export
│   ├── types.ts                  # TypeScript definitions
│   └── plugins/                  # Sample plugins
├── dist/                         # Generated build files
├── tests/                        # Jest test suite
├── examples/                     # Example HTML files
├── scripts/                      # Build and dev scripts
├── test-all-features.html        # 🚀 Comprehensive demo
└── README.md
```

### For AI/Human Developers
- **Source of Truth**: `src/` directory contains the editable source code
- **Production Files**: `dist/` directory contains built files (auto-generated)
- **HTML imports**: Always reference `dist/` files in HTML
- **Development rule**: src → build → dist (one-way flow)

## 📄 License

MIT License - feel free to use this library in your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📞 Support

For questions or issues, please visit our GitHub repository or contact us directly.

---

**Made with ❤️ for the JavaScript community**