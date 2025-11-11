import { test, expect } from '@playwright/test';

const TEST_PAGE = '/test-filter-fix.html';

test.describe('Keyboard Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE);
    await page.waitForSelector('.excelike-table table thead', { timeout: 10000 });
    await page.waitForFunction(() => window.table1 !== null, { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should open filter dropdown with Enter key', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    // Focus the filter button using Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to first filter button

    // Press Enter to open dropdown
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const dropdown = page.locator('.filter-dropdown-wrapper');
    await expect(dropdown).toBeVisible();
  });

  test('should close filter dropdown with Escape key', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    // Open dropdown with mouse
    await filterBtn.click();
    await page.waitForTimeout(300);

    const dropdown = page.locator('.filter-dropdown-wrapper');
    await expect(dropdown).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(dropdown).not.toBeVisible();
  });

  test('should navigate filter options with Tab key', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    await filterBtn.click();
    await page.waitForTimeout(300);

    // Tab through filter options
    await page.keyboard.press('Tab'); // Search input
    await page.keyboard.press('Tab'); // First option

    // Check if focus is on an element
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toBeTruthy();
  });

  test('should apply filter and close with Enter on OK button', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    await filterBtn.click();
    await page.waitForTimeout(300);

    // Select a filter option by clicking
    const firstOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').first();
    await firstOption.click();
    await page.waitForTimeout(200);

    // Tab to OK button and press Enter
    const okButton = page.locator('.filter-dropdown').locator('button:has-text("OK")');
    await okButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const dropdown = page.locator('.filter-dropdown-wrapper');
    await expect(dropdown).not.toBeVisible();
  });

  test('should cancel filter with Enter on Cancel button', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    await filterBtn.click();
    await page.waitForTimeout(300);

    // Select a filter option
    const firstOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').first();
    await firstOption.click();
    await page.waitForTimeout(200);

    // Tab to Cancel button and press Enter
    const cancelButton = page.locator('.filter-dropdown').locator('button:has-text("Cancel")');
    await cancelButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const dropdown = page.locator('.filter-dropdown-wrapper');
    await expect(dropdown).not.toBeVisible();

    // Verify filter was not applied (all rows still visible)
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(5);
  });

  test('should search in filter using keyboard', async ({ page }) => {
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    await filterBtn.click();
    await page.waitForTimeout(300);

    // Focus search input and type
    const searchInput = page.locator('.filter-search-input');
    await searchInput.click();
    await page.keyboard.type('Alice');
    await page.waitForTimeout(300);

    // Check that results are filtered
    const visibleOptions = await page.locator('.filter-dropdown').locator('.filter-option:visible').count();
    expect(visibleOptions).toBeLessThan(10); // Assuming more than 10 total options
  });
});
