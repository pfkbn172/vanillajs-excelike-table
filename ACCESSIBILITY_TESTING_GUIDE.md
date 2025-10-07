# Accessibility Testing Guide
**Step-by-Step Testing Procedures for vanillajs-excelike-table**

---

## Quick Start Testing

### 5-Minute Smoke Test

```bash
# 1. Open test page in browser
open test-all-features.html

# 2. Test keyboard only (unplug mouse!)
# - Can you Tab to every button?
# - Can you activate with Enter/Space?
# - Can you see where focus is?

# 3. Test zoom
# - Zoom to 200% (Ctrl/Cmd + +)
# - Can you still use all features?
# - Does text remain readable?

# 4. Run automated test
npx axe test-all-features.html
```

**Pass Criteria:**
- ✅ All controls keyboard accessible
- ✅ Focus always visible
- ✅ No layout breaks at 200% zoom
- ✅ Zero critical axe violations

---

## Detailed Testing Procedures

### Test 1: Keyboard Navigation (15 min)

**Equipment:** Keyboard only (hide/unplug mouse)

**Steps:**

1. **Initial Focus**
   - [ ] Press Tab - Focus enters table wrapper
   - [ ] Focus indicator clearly visible?
   - [ ] Outline at least 2px thick?
   - [ ] Color contrast meets 3:1?

2. **Header Navigation**
   - [ ] Tab to first column header
   - [ ] Arrow Right - moves to next column?
   - [ ] Arrow Left - moves to previous column?
   - [ ] Arrow Down - enters data cells?
   - [ ] Home - goes to first column?
   - [ ] End - goes to last column?

3. **Data Cell Navigation**
   - [ ] Arrow keys move between cells?
   - [ ] Ctrl+Home - goes to first cell?
   - [ ] Ctrl+End - goes to last cell?
   - [ ] Page Up/Down - scrolls page?

4. **Sort Activation**
   - [ ] Focus sortable column header
   - [ ] Press Enter - sorts ascending?
   - [ ] Press Enter again - sorts descending?
   - [ ] Focus indicator remains visible?

5. **Filter Activation**
   - [ ] Tab to filter button (or Space on header)
   - [ ] Press Enter or Space - opens dropdown?
   - [ ] Focus moves into dropdown?
   - [ ] Tab through filter options?
   - [ ] Escape - closes dropdown?
   - [ ] Focus returns to filter button?

6. **Modal Dialog**
   - [ ] Open column settings
   - [ ] Tab cycles within modal only? (NO escape to background)
   - [ ] Shift+Tab cycles backwards?
   - [ ] Escape closes modal?
   - [ ] Focus returns to trigger button?

7. **Pagination**
   - [ ] Tab to pagination controls
   - [ ] Arrow keys navigate buttons?
   - [ ] Enter activates page change?
   - [ ] Focus remains visible?

**Pass Criteria:**
- All functionality accessible via keyboard
- Focus always visible (2px+ outline)
- No keyboard traps (can always escape)
- Logical tab order

**Common Failures:**
- ❌ Focus not visible on custom buttons
- ❌ Can Tab behind modal dialog
- ❌ Filter dropdown doesn't trap focus
- ❌ Arrow keys don't navigate cells

---

### Test 2: Screen Reader (30 min)

**Equipment:** 
- NVDA (Windows) or VoiceOver (Mac)
- Headphones recommended

**NVDA Setup (Windows):**
```bash
# Download NVDA
https://www.nvaccess.org/download/

# Start NVDA: Ctrl + Alt + N
# Stop reading: Ctrl
# Next item: Down Arrow
# Read all: Insert + Down Arrow
```

**VoiceOver Setup (Mac):**
```bash
# Enable: Cmd + F5
# VoiceOver key: Ctrl + Option (VO)
# Next item: VO + Right Arrow
# Activate: VO + Space
```

**Steps:**

1. **Table Discovery**
   ```
   Expected announcement:
   "Data table region, 50 rows, 10 columns"
   or
   "Grid, 50 rows, 10 columns"
   ```
   - [ ] Table role announced?
   - [ ] Row and column count announced?

2. **Header Navigation**
   ```
   Navigate to first header
   Expected announcement:
   "Name column header, sortable, currently not sorted"
   ```
   - [ ] Column name announced?
   - [ ] "Sortable" announced?
   - [ ] Current sort state announced?

3. **Cell Navigation**
   ```
   Navigate to first data cell
   Expected announcement:
   "Row 1, Name column, John Doe"
   ```
   - [ ] Row number announced?
   - [ ] Column name announced?
   - [ ] Cell value announced?

4. **Sort Action**
   ```
   Activate sort on column header
   Expected announcement (after 1-2 sec):
   "Table sorted by Name ascending"
   ```
   - [ ] Sort action announced?
   - [ ] Direction (ascending/descending) announced?

5. **Filter Action**
   ```
   Open filter dropdown
   Expected announcement:
   "Filter dialog opened for Name column"
   "Filter Name column, dialog"
   ```
   - [ ] Dialog role announced?
   - [ ] Column name in label?

6. **Filter Options**
   ```
   Navigate filter checkboxes
   Expected announcement:
   "Select all checkbox, checked"
   "John Doe checkbox, checked"
   ```
   - [ ] Checkbox state announced?
   - [ ] Value announced?

7. **Apply Filter**
   ```
   Click Apply button
   Expected announcement:
   "Filter applied, 15 rows visible"
   ```
   - [ ] Result count announced?
   - [ ] "Rows visible" announced?

8. **Pagination**
   ```
   Navigate to Next page button
   Expected announcement:
   "Next page button"
   
   Activate button
   Expected announcement:
   "Page 2 of 5"
   ```
   - [ ] Button purpose clear?
   - [ ] Page change announced?

9. **Loading State**
   ```
   Trigger data load
   Expected announcement:
   "Loading table data"
   (after load)
   "Table loaded with 50 rows"
   ```
   - [ ] Loading announced?
   - [ ] Completion announced?

10. **Error State**
    ```
    Trigger error (e.g., invalid filter)
    Expected announcement:
    "Error: Unable to apply filter. Please try again."
    ```
    - [ ] Error announced?
    - [ ] Recovery instructions provided?

**Pass Criteria:**
- All interactive elements announced
- State changes announced within 2 seconds
- Error messages clear and actionable
- Navigation context always clear

**Common Failures:**
- ❌ Table structure not announced
- ❌ Sort/filter changes silent
- ❌ Loading states not announced
- ❌ Cell values announce as "blank"

---

### Test 3: Color Contrast (10 min)

**Tools:**
- Chrome DevTools Color Picker
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Steps:**

1. **Test Filter Button**
   - [ ] Open DevTools (F12)
   - [ ] Inspect `.filter-btn`
   - [ ] Click color swatch in Styles panel
   - [ ] Check "Contrast ratio" section
   - [ ] Must show ✓ (checkmark) for AA

   ```
   Expected:
   Color: rgba(0,0,0,0.70) or darker
   Background: rgb(255,255,255)
   Ratio: 4.58:1 or higher ✓ AA
   ```

2. **Test Pagination Text**
   - [ ] Inspect `.pagination-info`
   - [ ] Check contrast ratio
   - [ ] Verify AA compliance

   ```
   Expected:
   Color: rgba(0,0,0,0.87) or darker
   Ratio: 11.8:1 or higher ✓ AAA
   ```

3. **Test Sort Indicators**
   - [ ] Inspect `.sort-triangle`
   - [ ] Check border-color contrast
   - [ ] Verify 3:1 minimum (UI component)

4. **Test Disabled Buttons**
   - [ ] Inspect `.filter-btn-confirm:disabled`
   - [ ] Verify 3:1 minimum for large text
   - [ ] Check both text and background

**Automated Check:**
```javascript
// Run in browser console
const elements = [
  '.filter-btn',
  '.pagination-info',
  '.sort-triangle',
  '.table-menu-btn',
  '.close-btn'
];

elements.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) {
    const styles = getComputedStyle(el);
    console.log(`${selector}:`, styles.color);
  }
});
```

**Pass Criteria:**
- All text 4.5:1 or higher
- All UI components 3:1 or higher
- Disabled states maintain contrast
- No pure gray (#808080 on white = 2.4:1 FAIL)

**Common Failures:**
- ❌ rgba(0,0,0,0.45) = 2.85:1 (too light)
- ❌ rgba(0,0,0,0.65) = 3.2:1 (too light for small text)
- ❌ Disabled buttons use opacity instead of color

---

### Test 4: Touch Accessibility (20 min)

**Equipment:**
- iOS device (iPhone/iPad) OR Android device
- Touch screen Windows laptop (optional)

**Steps:**

1. **Touch Target Size**
   - [ ] Try tapping sort indicator
   - [ ] Try tapping filter button
   - [ ] Try tapping close button
   - [ ] Try tapping expand/collapse button

   **Measurement:**
   ```javascript
   // Run in mobile browser console
   document.querySelectorAll('.filter-btn, .sort-controls, .expand-btn').forEach(el => {
     const rect = el.getBoundingClientRect();
     console.log(el.className, `${rect.width}x${rect.height}px`);
     if (rect.width < 44 || rect.height < 44) {
       console.warn('FAIL: Too small!', el);
     }
   });
   ```

2. **Column Resize**
   - [ ] Try grabbing resize handle
   - [ ] Handle at least 20px wide on mobile?
   - [ ] Visual indicator visible?
   - [ ] Resize works smoothly?

3. **Filter Dropdown**
   - [ ] Open filter on mobile
   - [ ] Dropdown fits in viewport?
   - [ ] Can scroll within dropdown?
   - [ ] Page doesn't scroll when scrolling dropdown?

4. **Modal Dialog**
   - [ ] Open column settings on mobile
   - [ ] Modal fits viewport?
   - [ ] Can interact with all controls?
   - [ ] Can close easily?

5. **Pinch Zoom**
   - [ ] Pinch to zoom in on table
   - [ ] Layout doesn't break?
   - [ ] Can zoom to 200%?
   - [ ] Can zoom back out?

**Pass Criteria:**
- All touch targets 44x44px minimum
- Resize handles easily grabbable
- Dropdowns stay within viewport
- No scroll conflicts

**Common Failures:**
- ❌ Sort/filter buttons 14x28px (too small)
- ❌ Close buttons 22x22px (too small)
- ❌ Resize handle 10px (too narrow)
- ❌ Dropdown taller than viewport

---

### Test 5: Zoom & Reflow (10 min)

**Steps:**

1. **200% Zoom**
   - [ ] Set browser zoom to 200% (Ctrl/Cmd + +)
   - [ ] All text readable?
   - [ ] No horizontal scroll required?
   - [ ] Controls still accessible?
   - [ ] Reset zoom (Ctrl/Cmd + 0)

2. **Text Spacing**
   ```css
   /* Apply via browser DevTools */
   * {
     line-height: 1.5 !important;
     letter-spacing: 0.12em !important;
     word-spacing: 0.16em !important;
   }
   ```
   - [ ] Text still readable?
   - [ ] No text cutoff?
   - [ ] Buttons still usable?

3. **320px Viewport (Mobile)**
   - [ ] Resize browser to 320px width
   - [ ] Table adapts?
   - [ ] Controls stack vertically?
   - [ ] Horizontal scroll for table only (not entire page)?

**Pass Criteria:**
- Usable at 200% zoom
- Text spacing changes don't break layout
- Mobile viewport adapts gracefully
- No content hidden or cut off

---

### Test 6: Visual Impairment Simulation (15 min)

**Tools:**
- Chrome DevTools > Rendering > Emulate vision deficiencies
- [Color Oracle](https://colororacle.org/) (standalone app)

**Steps:**

1. **Protanopia (Red-Blind)**
   - [ ] Can distinguish sort ascending/descending?
   - [ ] Filter active state visible without color?
   - [ ] Conditional formatting distinguishable?
   - [ ] Error states visible?

2. **Deuteranopia (Green-Blind)**
   - [ ] Same as protanopia tests
   - [ ] Success/error messages distinguishable?

3. **Tritanopia (Blue-Blind)**
   - [ ] Primary blue (#1890ff) still visible?
   - [ ] Links distinguishable from text?

4. **Achromatopsia (Total Color Blind)**
   - [ ] All information available without color?
   - [ ] Patterns/icons used for status?
   - [ ] Text labels clear?

**Pass Criteria:**
- No information conveyed by color alone
- Status indicated by icons, patterns, or text
- Links underlined or bolded (not just blue)

**Common Failures:**
- ❌ Conditional formatting color-only
- ❌ Sort direction indicated by color only
- ❌ Error state is red text only

---

### Test 7: High Contrast Mode (5 min)

**Windows High Contrast:**
- Press: Left Alt + Left Shift + Print Screen
- Confirm activation

**Steps:**

1. **Visual Elements**
   - [ ] All text visible?
   - [ ] Borders visible?
   - [ ] Buttons have visible boundaries?
   - [ ] Focus indicator visible?

2. **Interactive Elements**
   - [ ] Can identify clickable elements?
   - [ ] Hover states visible?
   - [ ] Disabled states distinguishable?

**Pass Criteria:**
- All content visible in high contrast
- Borders drawn by CSS, not just color
- Focus indicator uses outline, not just box-shadow

---

## Automated Testing Scripts

### Quick Audit Script

```javascript
// Run in browser console
// Checks common accessibility issues

(function accessibilityAudit() {
  const issues = [];

  // 1. Check for images without alt text
  document.querySelectorAll('img:not([alt])').forEach(img => {
    issues.push({ type: 'Missing alt text', element: img });
  });

  // 2. Check for buttons without labels
  document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
    if (!btn.textContent.trim()) {
      issues.push({ type: 'Button without label', element: btn });
    }
  });

  // 3. Check for inputs without labels
  document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
    const id = input.id;
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    if (!label && !input.parentElement.querySelector('label')) {
      issues.push({ type: 'Input without label', element: input });
    }
  });

  // 4. Check tabindex values
  document.querySelectorAll('[tabindex]').forEach(el => {
    const tabindex = parseInt(el.getAttribute('tabindex'));
    if (tabindex > 0) {
      issues.push({ type: 'Positive tabindex (should be 0 or -1)', element: el });
    }
  });

  // 5. Check for duplicate IDs
  const ids = {};
  document.querySelectorAll('[id]').forEach(el => {
    const id = el.id;
    if (ids[id]) {
      issues.push({ type: `Duplicate ID: ${id}`, element: el });
    }
    ids[id] = true;
  });

  // 6. Check for focus indicators
  const style = document.createElement('style');
  style.textContent = `
    *:focus { outline: 2px solid red !important; }
  `;
  document.head.appendChild(style);
  console.log('Focus indicator test style added (focus elements to verify)');

  // Report issues
  if (issues.length === 0) {
    console.log('✅ No critical issues found!');
  } else {
    console.error(`❌ Found ${issues.length} issues:`);
    issues.forEach(issue => {
      console.error(issue.type, issue.element);
    });
  }

  return issues;
})();
```

### Contrast Checker Script

```javascript
// Run in browser console
// Checks color contrast ratios

function checkContrast(fgColor, bgColor) {
  function getLuminance(color) {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const l1 = getLuminance(fgColor);
  const l2 = getLuminance(bgColor);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio: ratio.toFixed(2),
    passAA: ratio >= 4.5,
    passAAA: ratio >= 7,
    passLargeAA: ratio >= 3
  };
}

// Test critical elements
const tests = [
  { selector: '.filter-btn', bg: 'rgb(255,255,255)' },
  { selector: '.pagination-info', bg: 'rgb(255,255,255)' },
  { selector: '.table-menu-btn', bg: 'rgb(255,255,255)' },
  { selector: '.close-btn', bg: 'rgb(255,255,255)' }
];

console.table(tests.map(test => {
  const el = document.querySelector(test.selector);
  if (!el) return { ...test, status: 'Element not found' };
  
  const fgColor = getComputedStyle(el).color;
  const result = checkContrast(fgColor, test.bg);
  
  return {
    selector: test.selector,
    color: fgColor,
    ratio: result.ratio + ':1',
    AA: result.passAA ? '✅' : '❌',
    AAA: result.passAAA ? '✅' : '❌'
  };
}));
```

---

## Test Report Template

```markdown
# Accessibility Test Report
**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Browser, OS, Screen Reader]

## Summary
- ✅ Passed: X/Y tests
- ❌ Failed: Y/Y tests
- ⚠️  Warnings: Z issues

## Keyboard Navigation
- [ ] Focus visible: PASS/FAIL
- [ ] Tab order logical: PASS/FAIL
- [ ] All controls accessible: PASS/FAIL
- [ ] No keyboard traps: PASS/FAIL

## Screen Reader
- [ ] Structure announced: PASS/FAIL
- [ ] State changes announced: PASS/FAIL
- [ ] Errors announced: PASS/FAIL

## Visual
- [ ] Color contrast: PASS/FAIL
- [ ] 200% zoom: PASS/FAIL
- [ ] High contrast mode: PASS/FAIL

## Mobile
- [ ] Touch targets: PASS/FAIL
- [ ] Viewport adapts: PASS/FAIL

## Critical Issues Found
1. [Description] - [Severity]
2. [Description] - [Severity]

## Recommendations
1. [Priority action]
2. [Priority action]
```

---

**Last Updated:** 2025-10-08
**Maintainer:** QA Team
**Review Frequency:** Monthly
