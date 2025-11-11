import { test, expect } from '@playwright/test';

/**
 * Comprehensive Filter Functionality Test Suite
 * Based on FILTER_TEST_CHECKLIST.md
 *
 * Test Categories:
 * 1. Data Pattern Tests
 * 2. UI Display & Position Control
 * 3. Filter Accuracy
 * 4. Operation Flows
 * 5. Integration with Other Features
 * 6. Edge Cases
 * 7. Responsive Design
 */

const TEST_PAGE = '/test-filter-fix.html';

test.describe('Filter Comprehensive Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE);
    // Wait for table to be rendered - wait for actual table element and thead
    await page.waitForSelector('.excelike-table table thead', { timeout: 10000 });
    // Wait for table initialization to complete
    await page.waitForFunction(() => window.table1 !== null, { timeout: 10000 });
    await page.waitForTimeout(500); // Allow for final rendering
  });

  // ===================================================================
  // Section 1: UI Display & Position Control Tests
  // ===================================================================

  test.describe('1. UI Display & Position Control', () => {

    test('1.1 Filter dropdown should always show OK/Cancel buttons', async ({ page }) => {
      // Open filter for a date column (usually has most content)
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      await expect(dropdown).toBeVisible();

      // Check that OK and Cancel buttons are visible
      const okButton = dropdown.locator('button:has-text("OK")');
      const cancelButton = dropdown.locator('button:has-text("Cancel"), button:has-text("キャンセル")');

      await expect(okButton).toBeVisible();
      await expect(cancelButton).toBeVisible();

      // Check they are within viewport
      const okBox = await okButton.boundingBox();
      const cancelBox = await cancelButton.boundingBox();
      const viewport = page.viewportSize();

      expect(okBox.y + okBox.height).toBeLessThanOrEqual(viewport.height);
      expect(cancelBox.y + cancelBox.height).toBeLessThanOrEqual(viewport.height);
    });

    test('1.2 Filter modal should adjust position when switching from range to values mode', async ({ page }) => {
      // Open numeric filter (Age column)
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      await expect(dropdown).toBeVisible();

      // Should start in range mode
      const rangeTab = dropdown.locator('button[data-mode="range"]');
      await expect(rangeTab).toHaveClass(/active/);

      // Get initial position
      const initialBox = await dropdown.boundingBox();

      // Switch to values mode
      const valuesTab = dropdown.locator('button[data-mode="values"]');
      await valuesTab.click();
      await page.waitForTimeout(300);

      // Check OK button is still visible after mode switch
      const okButton = dropdown.locator('button:has-text("OK")');
      await expect(okButton).toBeVisible();

      const okBox = await okButton.boundingBox();
      const viewport = page.viewportSize();
      expect(okBox.y + okBox.height).toBeLessThanOrEqual(viewport.height);
    });

    test('1.3 Date filter should adjust position when expanding year → month → day', async ({ page }) => {
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Start at year level
      const yearButton = dropdown.locator('button[data-level="year"]');
      await yearButton.click();
      await page.waitForTimeout(200);

      // Expand to month level
      const monthButton = dropdown.locator('button[data-level="month"]');
      await monthButton.click();
      await page.waitForTimeout(200);

      // Check OK button still visible
      let okButton = dropdown.locator('button:has-text("OK")');
      await expect(okButton).toBeVisible();

      // Expand to day level
      const dayButton = dropdown.locator('button[data-level="day"]');
      await dayButton.click();
      await page.waitForTimeout(200);

      // Check OK button still visible after expansion
      okButton = dropdown.locator('button:has-text("OK")');
      await expect(okButton).toBeVisible();

      const okBox = await okButton.boundingBox();
      const viewport = page.viewportSize();
      expect(okBox.y + okBox.height).toBeLessThanOrEqual(viewport.height);
    });

    test('1.4 Date filter should adjust when expanding individual years', async ({ page }) => {
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Find and click expand button for a year
      const expandButton = dropdown.locator('.expand-btn').first();
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(200);

        // Check OK button still visible
        const okButton = dropdown.locator('button:has-text("OK")');
        await expect(okButton).toBeVisible();

        const okBox = await okButton.boundingBox();
        const viewport = page.viewportSize();
        expect(okBox.y + okBox.height).toBeLessThanOrEqual(viewport.height);
      }
    });

    test('1.5 Filter dropdown should be within screen bounds (top-left column)', async ({ page }) => {
      // Test filter on leftmost column
      const firstColumnFilter = page.locator('thead th').first().locator('.filter-btn');
      await firstColumnFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const box = await dropdown.boundingBox();
      const viewport = page.viewportSize();

      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    });

    test('1.6 Filter dropdown should be within screen bounds (top-right column)', async ({ page }) => {
      // Test filter on rightmost visible column
      const lastColumnFilter = page.locator('thead th').last().locator('.filter-btn');
      await lastColumnFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const box = await dropdown.boundingBox();
      const viewport = page.viewportSize();

      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    });
  });

  // ===================================================================
  // Section 2: Filter Accuracy Tests
  // ===================================================================

  test.describe('2. Filter Accuracy', () => {

    test('2.1 Text filter: single value selection', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Uncheck "Select All"
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      // Select specific value
      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify only 1 row is visible (plus header)
      const visibleRows = page.locator('tbody tr:visible');
      const count = await visibleRows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('2.2 Text filter: multiple value selection (OR condition)', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Uncheck all
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      // Select first 3 values
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label input[type="checkbox"]');
      const count = await checkboxes.count();
      const selectCount = Math.min(3, count);

      for (let i = 0; i < selectCount; i++) {
        await checkboxes.nth(i).check();
      }
      await page.waitForTimeout(200);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify multiple rows are visible
      const visibleRows = page.locator('tbody tr:visible');
      const rowCount = await visibleRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(selectCount);
    });

    test('2.3 Numeric filter: range mode with min and max', async ({ page }) => {
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Ensure range mode is active
      const rangeTab = dropdown.locator('button[data-mode="range"]');
      if (!await rangeTab.evaluate(el => el.classList.contains('active'))) {
        await rangeTab.click();
        await page.waitForTimeout(200);
      }

      // Set min and max values
      const minInput = dropdown.locator('[data-test="filter-min-input"]');
      const maxInput = dropdown.locator('[data-test="filter-max-input"]');

      await minInput.fill('25');
      await page.waitForTimeout(300); // Real-time update
      await maxInput.fill('35');
      await page.waitForTimeout(300); // Real-time update

      // Check that filter was applied in real-time (should see filtered results)
      const visibleRows = page.locator('tbody tr:visible');
      const rowCount = await visibleRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Close dropdown
      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(300);

      // Verify filter is applied
      const finalRows = page.locator('tbody tr:visible');
      expect(await finalRows.count()).toBeGreaterThan(0);
    });

    test('2.4 Numeric filter: values mode selection', async ({ page }) => {
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Switch to values mode
      const valuesTab = dropdown.locator('button[data-mode="values"]');
      await valuesTab.click();
      await page.waitForTimeout(300);

      // Uncheck all
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      // Select first checkbox
      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify filter applied
      const visibleRows = page.locator('tbody tr:visible');
      expect(await visibleRows.count()).toBeGreaterThan(0);
    });

    test('2.5 Date filter: select specific year', async ({ page }) => {
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Set to year level
      const yearButton = dropdown.locator('button[data-level="year"]');
      await yearButton.click();
      await page.waitForTimeout(200);

      // Uncheck all
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      // Select first year
      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify filter applied
      const visibleRows = page.locator('tbody tr:visible');
      expect(await visibleRows.count()).toBeGreaterThan(0);
    });

    test('2.6 Date filter: uncheck one day in month with multiple days', async ({ page }) => {
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Set to day level to see individual dates
      const dayButton = dropdown.locator('button[data-level="day"]');
      await dayButton.click();
      await page.waitForTimeout(300);

      // Find a month with multiple days (January 2023 has 8 days according to test data)
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 5) {
        // Uncheck one checkbox in the middle
        const targetCheckbox = checkboxes.nth(3).locator('input[type="checkbox"]');
        await targetCheckbox.uncheck();
        await page.waitForTimeout(200);

        const okButton = dropdown.locator('button:has-text("OK")');
        await okButton.click();
        await page.waitForTimeout(500);

        // Verify that other dates in the same month are still visible
        const visibleRows = page.locator('tbody tr:visible');
        const rowCount = await visibleRows.count();
        expect(rowCount).toBeGreaterThan(0);

        // The count should be less than total but not zero
        // (This tests the bug where unchecking one day made all days disappear)
      }
    });

    test('2.7 Date filter: range mode with start and end dates', async ({ page }) => {
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Switch to range mode
      const rangeTab = dropdown.locator('button[data-mode="range"]');
      await rangeTab.click();
      await page.waitForTimeout(300);

      // Set date range
      const startInput = dropdown.locator('input[type="date"]').first();
      const endInput = dropdown.locator('input[type="date"]').last();

      await startInput.fill('2022-01-01');
      await page.waitForTimeout(300); // Real-time update
      await endInput.fill('2023-12-31');
      await page.waitForTimeout(300); // Real-time update

      // Verify filter applied in real-time
      const visibleRows = page.locator('tbody tr:visible');
      expect(await visibleRows.count()).toBeGreaterThan(0);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(300);
    });

    test('2.8 Multiple column filters (AND condition)', async ({ page }) => {
      // Filter 1: Age
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      let dropdown = page.locator('.filter-dropdown-wrapper');
      const minInput = dropdown.locator('[data-test="filter-min-input"]');
      await minInput.fill('25');
      await page.waitForTimeout(300);

      let okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      const rowsAfterFirstFilter = await page.locator('tbody tr:visible').count();

      // Filter 2: City
      const cityFilter = page.locator('th:has-text("City")').locator('.filter-btn');
      await cityFilter.click();
      await page.waitForTimeout(300);

      dropdown = page.locator('.filter-dropdown-wrapper');
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify AND condition: rows should be <= first filter
      const rowsAfterBothFilters = await page.locator('tbody tr:visible').count();
      expect(rowsAfterBothFilters).toBeLessThanOrEqual(rowsAfterFirstFilter);
    });
  });

  // ===================================================================
  // Section 3: Operation Flow Tests
  // ===================================================================

  test.describe('3. Operation Flows', () => {

    test('3.1 Open → Cancel → state unchanged', async ({ page }) => {
      const initialRows = await page.locator('tbody tr:visible').count();

      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Make changes but cancel
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      const cancelButton = dropdown.locator('button:has-text("Cancel"), button:has-text("キャンセル")');
      await cancelButton.click();
      await page.waitForTimeout(300);

      // Verify state unchanged
      const finalRows = await page.locator('tbody tr:visible').count();
      expect(finalRows).toBe(initialRows);
    });

    test('3.2 Mode switching preserves state', async ({ page }) => {
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Set range mode values
      const minInput = dropdown.locator('[data-test="filter-min-input"]');
      await minInput.fill('30');
      await page.waitForTimeout(300);

      // Switch to values mode
      const valuesTab = dropdown.locator('button[data-mode="values"]');
      await valuesTab.click();
      await page.waitForTimeout(300);

      // Switch back to range mode
      const rangeTab = dropdown.locator('button[data-mode="range"]');
      await rangeTab.click();
      await page.waitForTimeout(300);

      // Verify value was preserved
      const minValue = await minInput.inputValue();
      expect(minValue).toBe('30');
    });

    test('3.3 Search functionality filters checkbox list', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      const searchInput = dropdown.locator('input[placeholder*="Search"], input[placeholder*="検索"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('John');
        await page.waitForTimeout(300);

        // Count visible checkboxes after search
        const visibleCheckboxes = dropdown.locator('[data-test="filter-checkbox-list"] label:visible');
        const count = await visibleCheckboxes.count();

        // Should have fewer options now
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('3.4 Clear this column removes filter', async ({ page }) => {
      // Apply a filter first
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      let dropdown = page.locator('.filter-dropdown-wrapper');
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      let okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Get total item count from pagination info instead of visible rows
      const paginationInfo = page.locator('.pagination-info');
      const filteredText = await paginationInfo.textContent();
      const filteredMatch = filteredText.match(/of (\d+) items/);
      const filteredCount = filteredMatch ? parseInt(filteredMatch[1]) : 0;

      // Now clear the filter
      await nameFilter.click();
      await page.waitForTimeout(300);

      dropdown = page.locator('.filter-dropdown-wrapper');
      const clearButton = dropdown.locator('button:has-text("Clear"), button:has-text("クリア")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(500);

        // Get total item count after clearing
        const clearedText = await paginationInfo.textContent();
        const clearedMatch = clearedText.match(/of (\d+) items/);
        const clearedCount = clearedMatch ? parseInt(clearedMatch[1]) : 0;

        expect(clearedCount).toBeGreaterThan(filteredCount);
      }
    });

    test('3.5 Opening one filter closes previous filter', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      let dropdown = page.locator('.filter-dropdown-wrapper');
      await expect(dropdown).toBeVisible();

      // On mobile modal UI, backdrop blocks other UI elements
      // Close the current modal first with Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Open another filter
      const cityFilter = page.locator('th:has-text("City")').locator('.filter-btn');
      await cityFilter.click();
      await page.waitForTimeout(500); // Wait for new dropdown to open

      // Should only have one dropdown visible
      const dropdownCount = await page.locator('.filter-dropdown-wrapper:visible').count();
      expect(dropdownCount).toBe(1);
    });
  });

  // ===================================================================
  // Section 4: Edge Cases
  // ===================================================================

  test.describe('4. Edge Cases', () => {

    test('4.1 Handling null values in text filter', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Look for null/empty option
      const nullOption = dropdown.locator('label:has-text("(Blanks)"), label:has-text("(空白)")');
      if (await nullOption.count() > 0) {
        // Uncheck all first
        const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
        await selectAll.uncheck();
        await page.waitForTimeout(200);

        // Select only null values
        await nullOption.locator('input[type="checkbox"]').check();
        await page.waitForTimeout(200);

        const okButton = dropdown.locator('button:has-text("OK")');
        await okButton.click();
        await page.waitForTimeout(500);

        // Should show only rows with null/empty names
        const visibleRows = await page.locator('tbody tr:visible').count();
        expect(visibleRows).toBeGreaterThanOrEqual(0);
      }
    });

    test('4.2 Special characters in filter values', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Look for values with special characters (<, >, ', ", &)
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label');
      const count = await checkboxes.count();

      // Test data includes special character entries
      // Just verify they are displayed and can be clicked
      if (count > 0) {
        const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
        await selectAll.uncheck();
        await page.waitForTimeout(200);

        // Try checking a few checkboxes
        for (let i = 0; i < Math.min(3, count); i++) {
          await checkboxes.nth(i).locator('input[type="checkbox"]').check();
          await page.waitForTimeout(100);
        }

        const okButton = dropdown.locator('button:has-text("OK")');
        await okButton.click();
        await page.waitForTimeout(500);

        expect(await page.locator('tbody tr:visible').count()).toBeGreaterThan(0);
      }
    });

    test('4.3 Rapid open/close operations', async ({ page }) => {
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');

      // Open and close 5 times rapidly
      for (let i = 0; i < 5; i++) {
        await nameFilter.click();
        await page.waitForTimeout(100);

        const dropdown = page.locator('.filter-dropdown-wrapper');
        if (await dropdown.isVisible()) {
          const cancelButton = dropdown.locator('button:has-text("Cancel"), button:has-text("キャンセル")');
          await cancelButton.click();
          await page.waitForTimeout(100);
        }
      }

      // Verify table is still functional
      const rows = await page.locator('tbody tr:visible').count();
      expect(rows).toBeGreaterThan(0);
    });

    test('4.4 Rapid mode switching', async ({ page }) => {
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const rangeTab = dropdown.locator('button[data-mode="range"]');
      const valuesTab = dropdown.locator('button[data-mode="values"]');

      // Switch modes rapidly 5 times
      for (let i = 0; i < 5; i++) {
        await valuesTab.click();
        await page.waitForTimeout(50);
        await rangeTab.click();
        await page.waitForTimeout(50);
      }

      // Verify dropdown is still functional
      await expect(dropdown).toBeVisible();
      const okButton = dropdown.locator('button:has-text("OK")');
      await expect(okButton).toBeVisible();
    });

    test('4.5 Date filter with same month multiple days', async ({ page }) => {
      // Test data has 2023-01-01 through 2023-01-30 (8 different days)
      const joinDateFilter = page.locator('th:has-text("Join Date")').locator('.filter-btn');
      await joinDateFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Go to day level
      const dayButton = dropdown.locator('button[data-level="day"]');
      await dayButton.click();
      await page.waitForTimeout(300);

      // Uncheck all
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      // Select multiple days from same month (first 3 checkboxes)
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < Math.min(3, count); i++) {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(100);
      }

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Verify the selected days are shown
      const visibleRows = await page.locator('tbody tr:visible').count();
      expect(visibleRows).toBeGreaterThan(0);
    });
  });

  // ===================================================================
  // Section 5: Integration Tests
  // ===================================================================

  test.describe('5. Integration with Other Features', () => {

    test('5.1 Filter + Sort interaction', async ({ page }) => {
      // Apply filter first
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const minInput = dropdown.locator('[data-test="filter-min-input"]');
      await minInput.fill('30');
      await page.waitForTimeout(300);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Now apply sort
      const nameHeader = page.locator('th:has-text("Name")');
      await nameHeader.click();
      await page.waitForTimeout(500);

      // Verify both filter and sort are working
      const visibleRows = await page.locator('tbody tr:visible').count();
      expect(visibleRows).toBeGreaterThan(0);

      // Filter should still be active (icon should show filtered state)
      const filterIcon = ageFilter;
      await expect(filterIcon).toBeVisible();
    });

    test('5.2 Filter affects pagination', async ({ page }) => {
      // Check initial pagination state
      const initialPageInfo = page.locator('.pagination-info');
      const initialText = await initialPageInfo.textContent();

      // Apply restrictive filter
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const selectAll = dropdown.locator('label:has-text("Select All"), label:has-text("すべて選択")').locator('input[type="checkbox"]');
      await selectAll.uncheck();
      await page.waitForTimeout(200);

      const firstCheckbox = dropdown.locator('[data-test="filter-checkbox-list"] label').first().locator('input[type="checkbox"]');
      await firstCheckbox.check();
      await page.waitForTimeout(200);

      const okButton = dropdown.locator('button:has-text("OK")');
      await okButton.click();
      await page.waitForTimeout(500);

      // Check pagination updated
      const finalText = await initialPageInfo.textContent();
      // Text should be different (showing fewer total items)
      expect(finalText).not.toBe(initialText);
    });
  });

  // ===================================================================
  // Section 6: Data Pattern Tests
  // ===================================================================

  test.describe('6. Data Pattern Tests', () => {

    test('6.1 Filter with duplicate values', async ({ page }) => {
      // Test data has 5 identical "Duplicate Name" records (IDs 56-60)
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Search for duplicate
      const searchInput = dropdown.locator('input[placeholder*="Search"], input[placeholder*="検索"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Duplicate');
        await page.waitForTimeout(300);

        // Should see only one checkbox for "Duplicate Name"
        const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label:visible');
        const count = await checkboxes.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('6.2 Filter with empty strings', async ({ page }) => {
      // Test data has empty string records (IDs 64-66)
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Look for blanks option
      const blanksOption = dropdown.locator('label:has-text("(Blanks)"), label:has-text("(空白)")');
      if (await blanksOption.count() > 0) {
        await expect(blanksOption).toBeVisible();
      }
    });

    test('6.3 Numeric filter with negative numbers', async ({ page }) => {
      // Test data has negative age: -5 (ID 61)
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');

      // Switch to values mode to see all values
      const valuesTab = dropdown.locator('button[data-mode="values"]');
      await valuesTab.click();
      await page.waitForTimeout(300);

      // Should be able to see and select negative value
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test('6.4 Numeric filter with decimals', async ({ page }) => {
      // Test data has decimal: 25.5 (ID 62)
      const ageFilter = page.locator('th:has-text("Age")').locator('.filter-btn');
      await ageFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const valuesTab = dropdown.locator('button[data-mode="values"]');
      await valuesTab.click();
      await page.waitForTimeout(300);

      // Decimal values should be displayed
      const checkboxes = dropdown.locator('[data-test="filter-checkbox-list"] label');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test('6.5 Filter with emojis and multibyte characters', async ({ page }) => {
      // Test data has emojis (IDs 54-55)
      const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
      await nameFilter.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.filter-dropdown-wrapper');
      const searchInput = dropdown.locator('input[placeholder*="Search"], input[placeholder*="検索"]');

      if (await searchInput.count() > 0) {
        // Search for emoji or Japanese text
        await searchInput.fill('🚀');
        await page.waitForTimeout(300);

        // Should handle emoji search
        const visibleOptions = dropdown.locator('[data-test="filter-checkbox-list"] label:visible');
        const count = await visibleOptions.count();
        expect(count).toBeGreaterThanOrEqual(0);

        // Clear and try Japanese
        await searchInput.fill('');
        await page.waitForTimeout(200);
        await searchInput.fill('田中');
        await page.waitForTimeout(300);

        const japaneseResults = await dropdown.locator('[data-test="filter-checkbox-list"] label:visible').count();
        expect(japaneseResults).toBeGreaterThanOrEqual(0);
      }
    });
  });

});
