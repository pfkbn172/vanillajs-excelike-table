# Quick Fix Reference Card
**Apply these exact changes for v2.0.4**

---

## Fix 1: filter-module.js (Lines 327-328)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/filter-module.js
```

### Change
```diff
   // Calculate min/max from data
   const numericValues = uniqueValues
     .map(v => parseFloat(v))
     .filter(v => !isNaN(v));

-  const dataMin = Math.min(...numericValues);
-  const dataMax = Math.max(...numericValues);
+  const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
+  const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;
```

---

## Fix 2: ExceLikeTable.js (Lines 2596-2597)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/ExceLikeTable.js
```

### Change
```diff
   const numericValues = values
     .map(v => parseFloat(v))
     .filter(v => !isNaN(v));

-  const min = Math.min(...numericValues);
-  const max = Math.max(...numericValues);
+  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
+  const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
```

---

## Fix 3: ExceLikeTable.js (Line 3023)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/ExceLikeTable.js
Line 3023
```

### Change
```diff
   const drag = (e) => {
     if (!isDragging || !currentThumb) return;

     const rect = numberSlider.getBoundingClientRect();
-    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
+    const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
```

---

## Fix 4: ExceLikeTable.js (Line 3923)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/ExceLikeTable.js
Line 3923
```

### Change
```diff
   const handleMouseMove = (e) => {
     if (!isResizing) return;

     const rect = sliderTrack.getBoundingClientRect();
-    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
+    const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
```

---

## Fix 5: ExceLikeTable.js (Line 4164)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/ExceLikeTable.js
Line 4164
```

### Change
```diff
   const drag = (e) => {
     if (!isDragging || !currentThumb) return;

     const rect = sliderTrack.getBoundingClientRect();
-    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
+    const clientX = e.clientX || (e.touches?.[0]?.clientX ?? 0);
```

---

## Fix 6: row-selection-plugin.js (Line 457)

### Location
```
/mnt/d/Projects/JS/vanillajs-excelike-table/src/plugins/row-selection-plugin.js
```

### Change
```diff
   updateSelectAllState() {
     const selectAllCheckbox = this.table.container.querySelector('.table-select-all-checkbox');
     if (!selectAllCheckbox) return;

-    const totalRows = this.table.getFilteredData().length;
+    const totalRows = this.table.getFilteredData()?.length || 0;
```

---

## Verification Commands

After making changes:

```bash
# Check syntax
node -c src/filter-module.js
node -c src/ExceLikeTable.js
node -c src/plugins/row-selection-plugin.js

# Build
npm run build

# Verify dist
node -c dist/excelike-table.js
```

---

## Files Modified
- ✏️ `src/filter-module.js` (2 lines changed)
- ✏️ `src/ExceLikeTable.js` (5 lines changed)
- ✏️ `src/plugins/row-selection-plugin.js` (1 line changed)

**Total:** 8 lines across 3 files

---

## Commit Message

```
fix: prevent errors with empty arrays and improve touch handling

- Add length checks before Math.min/max spread operations
- Use optional chaining for touch event coordinates
- Add null safety to getFilteredData() calls

Fixes potential runtime errors in:
- Filter dropdowns with empty numeric columns
- Touch device slider interactions
- Row selection during initialization

No breaking changes. Safe for patch release.
```

---

**Time Required:** ~15 minutes
**Complexity:** Low
**Risk:** Very Low
