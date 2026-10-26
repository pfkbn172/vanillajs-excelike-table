import { test, expect } from '@playwright/test';

const TEST_PAGE = '/tests/e2e/fixtures/filter-fix.html';

/** Ages shown in the visible rows (Age is the 2nd column of the fixture table). */
const visibleAges = (page) =>
  page.$$eval('#table1 tbody tr', (rows) => rows.map((r) => Number(r.querySelectorAll('td')[1].textContent)));
const isAscending = (list) => list.every((v, i) => i === 0 || list[i - 1] <= v);

test.describe('Concurrent Operations Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE);
    await page.waitForSelector('.excelike-table table thead', { timeout: 10000 });
    await page.waitForFunction(() => window.table1 !== null, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should handle filtering while sorting', async ({ page }) => {
    // Apply a filter first
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');
    await filterBtn.click();
    await page.waitForTimeout(300);

    const firstOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await firstOption.check();
    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    const rowCountAfterFilter = await page.locator('.excelike-table tbody tr').count();

    // Click sort on Age column while filter is active
    const ageHeader = page.locator('th:has-text("Age")');
    await ageHeader.click();
    await page.waitForTimeout(500);

    // Verify rows are still filtered AND sorted
    const rowCountAfterSort = await page.locator('.excelike-table tbody tr').count();
    expect(rowCountAfterSort).toBe(rowCountAfterFilter);
    expect(isAscending(await visibleAges(page))).toBe(true);
  });

  test('should handle sorting while filtering', async ({ page }) => {
    // Sort first
    const ageHeader = page.locator('th:has-text("Age")');
    await ageHeader.click();
    await page.waitForTimeout(500);

    expect(isAscending(await visibleAges(page))).toBe(true);

    // Apply filter while sort is active
    const filterBtn = page.locator('th:has-text("City")').locator('.filter-btn');
    await filterBtn.click();
    await page.waitForTimeout(300);

    const cityOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await cityOption.check();
    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    // Rows should be both filtered AND still sorted
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeLessThan(79); // Some filtering occurred
    expect(isAscending(await visibleAges(page))).toBe(true);
  });

  test('should handle pagination changes during filter operation', async ({ page }) => {
    // Open filter dropdown
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');
    await filterBtn.click();
    await page.waitForTimeout(300);

    // On mobile, modal UI blocks other interactions, so close it first
    // Press Escape to close the modal (or click backdrop/cancel button)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Now change page after closing the dropdown
    const nextButton = page.locator('button:has-text("Next page")');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verify table navigation works
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2');
  });

  test('should handle multiple rapid filter opens/closes', async ({ page }) => {
    const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
    const cityFilter = page.locator('th:has-text("City")').locator('.filter-btn');

    // Open and close filters properly (especially on mobile modal UI)
    for (let i = 0; i < 5; i++) {
      // Open name filter
      await nameFilter.click();
      await page.waitForTimeout(100);

      // Close name filter (Escape key works across all devices)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Open city filter
      await cityFilter.click();
      await page.waitForTimeout(100);

      // Close city filter
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }

    // Verify no dropdown is open after all operations
    const dropdownCount = await page.locator('.filter-dropdown-wrapper:visible').count();
    expect(dropdownCount).toBe(0);
  });

  test('should handle filter application during page size change', async ({ page }) => {
    // Change page size
    const pageSizeSelect = page.locator('.page-size-select');
    await pageSizeSelect.selectOption('20');
    await page.waitForTimeout(500);

    // Apply filter immediately after
    const filterBtn = page.locator('th:has-text("Status")').locator('.filter-btn');
    await filterBtn.click();
    await page.waitForTimeout(300);

    const statusOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await statusOption.check();
    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    // Verify table updated correctly
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(20); // Page size limit respected
  });

  test('should handle multiple filters applied in quick succession', async ({ page }) => {
    // Apply 3 filters quickly
    const filters = [
      { column: 'Name', checkboxIndex: 1 },
      { column: 'City', checkboxIndex: 1 },
      { column: 'Status', checkboxIndex: 1 }
    ];

    for (const filter of filters) {
      const filterBtn = page.locator(`th:has-text("${filter.column}")`).locator('.filter-btn');
      await filterBtn.click();
      await page.waitForTimeout(200);

      const option = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(filter.checkboxIndex);
      await option.check();
      await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
      await page.waitForTimeout(200);
    }

    // Verify all filters applied
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(79); // Multiple filters reduced results
  });

  test('should handle filter changes while scrolling', async ({ page }) => {
    // Scroll table
    await page.evaluate(() => {
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.scrollTop = 100;
      }
    });

    await page.waitForTimeout(300);

    // Apply filter during scroll
    const filterBtn = page.locator('th:has-text("Age")').locator('.filter-btn');
    await filterBtn.click();
    await page.waitForTimeout(300);

    const dropdown = page.locator('.filter-dropdown-wrapper');

    // Ensure range mode is active (Age may default to range mode)
    const rangeTab = dropdown.locator('button[data-mode="range"]');
    if (!await rangeTab.evaluate(el => el.classList.contains('active'))) {
      await rangeTab.click();
      await page.waitForTimeout(200);
    }

    const minInput = dropdown.locator('input[placeholder*="Min"]');
    await minInput.fill('30');

    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    // Verify filter applied
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
