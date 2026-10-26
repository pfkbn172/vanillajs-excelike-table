import { test, expect } from '@playwright/test';

test.describe('Performance - Large Dataset Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/filter-fix.html');
    await page.waitForSelector('.excelike-table table thead', { timeout: 10000 });
  });

  test('should handle 1000 rows with responsive filtering', async ({ page }) => {
    // Generate 1000 rows of data
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
      joinDate: `2020-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      status: i % 3 === 0 ? 'Active' : (i % 3 === 1 ? 'Inactive' : 'On Leave')
    }));

    // Inject large dataset into the table
    await page.evaluate((data) => {
      if (window.table1) {
        window.table1.options.data = data;
        window.table1.render();
      }
    }, largeData);

    await page.waitForTimeout(1000); // Wait for render

    // Measure filter open time
    const filterBtn = page.locator('th:has-text("Name")').locator('.filter-btn');

    const startTime = Date.now();
    await filterBtn.click();
    await page.waitForSelector('.filter-dropdown-wrapper', { timeout: 10000 });
    const openTime = Date.now() - startTime;

    console.log(`Filter open time with 1000 rows: ${openTime}ms`);
    expect(openTime).toBeLessThan(2000); // Should open within 2 seconds

    // Check that dropdown renders correctly
    const dropdown = page.locator('.filter-dropdown-wrapper');
    await expect(dropdown).toBeVisible();

    // Measure filter apply time
    const firstOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').first();
    await firstOption.uncheck(); // Uncheck "Select All"
    await page.waitForTimeout(200);

    const secondOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await secondOption.check();
    await page.waitForTimeout(200);

    const okButton = page.locator('.filter-dropdown').locator('button:has-text("OK")');

    const applyStartTime = Date.now();
    await okButton.click();
    await page.waitForTimeout(500);
    const applyTime = Date.now() - applyStartTime;

    console.log(`Filter apply time with 1000 rows: ${applyTime}ms`);
    expect(applyTime).toBeLessThan(3000); // Should apply within 3 seconds
  });

  test('should maintain performance with multiple filters on large dataset', async ({ page }) => {
    // Generate 500 rows (reduced for multiple filter test)
    const data = Array.from({ length: 500 }, (_, i) => ({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      city: ['New York', 'Los Angeles', 'Chicago'][i % 3],
      joinDate: `2020-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      status: i % 2 === 0 ? 'Active' : 'Inactive'
    }));

    await page.evaluate((d) => {
      if (window.table1) {
        window.table1.options.data = d;
        window.table1.render();
      }
    }, data);

    await page.waitForTimeout(1000);

    // Apply first filter (Name)
    const nameFilter = page.locator('th:has-text("Name")').locator('.filter-btn');
    await nameFilter.click();
    await page.waitForTimeout(300);

    const nameOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await nameOption.check();
    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    // Apply second filter (City)
    const cityFilter = page.locator('th:has-text("City")').locator('.filter-btn');
    await cityFilter.click();
    await page.waitForTimeout(300);

    const cityOption = page.locator('.filter-dropdown').locator('input[type="checkbox"]').nth(1);
    await cityOption.check();
    await page.locator('.filter-dropdown').locator('button:has-text("OK")').click();
    await page.waitForTimeout(500);

    // Verify filters work correctly
    const rowCount = await page.locator('.excelike-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(500); // Some filtering occurred
  });

  test('should scroll through large filtered dataset', async ({ page }) => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      city: 'New York',
      joinDate: `2020-01-01`,
      status: 'Active'
    }));

    await page.evaluate((d) => {
      if (window.table1) {
        window.table1.options.data = d;
        window.table1.render();
      }
    }, data);

    await page.waitForTimeout(1000);

    // Navigate through pages
    const nextButton = page.locator('button:has-text("Next page")');

    for (let i = 0; i < 5; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Check that page changed
      const pageInfo = await page.locator('.page-info').textContent();
      expect(pageInfo).toContain(`Page ${i + 2}`);
    }
  });
});
