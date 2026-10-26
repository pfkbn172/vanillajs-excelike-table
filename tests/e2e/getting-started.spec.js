import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * What a first-time user does: load the library the way the README says, pass data,
 * and expect a working table — without reading the source.
 * Every test here was written against a problem found in v2.3.3.
 */

const BLANK = '/tests/e2e/fixtures/blank.html';

/** Collect console output and page errors for the lifetime of the page. */
function watchConsole(page) {
  const messages = [];
  page.on('console', (m) => messages.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => messages.push({ type: 'pageerror', text: e.message }));
  return messages;
}

const rows = (page, sel = '#table') =>
  page.$$eval(`${sel} tbody tr`, (trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())));

test.describe('Loading the library', () => {
  test('README CDN example (<script> + browser build) renders the rows', async ({ page }) => {
    const log = watchConsole(page);
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [
          { id: 1, name: 'Alice', age: 28, city: 'Tokyo' },
          { id: 2, name: 'Bob', age: 32, city: 'NYC' },
        ],
        columns: [
          { key: 'name', title: 'Name', dataIndex: 'name' },
          { key: 'age', title: 'Age', dataIndex: 'age' },
          { key: 'city', title: 'City', dataIndex: 'city' },
        ],
      });
    });
    expect(await rows(page)).toEqual([
      ['Alice', '28', 'Tokyo'],
      ['Bob', '32', 'NYC'],
    ]);
    expect(log.filter((m) => m.type === 'pageerror' || m.type === 'error')).toEqual([]);
  });

  test('ESM build can be imported with <script type="module">', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/esm.html');
    await page.waitForSelector('#table tbody tr');
    expect(await rows(page)).toEqual([
      ['Alice', '28'],
      ['Bob', '32'],
    ]);
  });

  test('all-in-one bundle works without a stylesheet link', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/bundle.html');
    await page.waitForSelector('#table tbody tr');
    expect(await rows(page)).toEqual([
      ['1', 'Alice'],
      ['2', 'Bob'],
    ]);
    // The injected CSS must actually style the table (borders come from the stylesheet).
    const border = await page.$eval('#table td', (td) => getComputedStyle(td).borderBottomStyle);
    expect(border).not.toBe('none');
  });

  test('the browser build exposes only the documented globals', async ({ page }) => {
    await page.goto(BLANK);
    const globals = await page.evaluate(() =>
      ['ExceLikeTable', 'ColumnHelpers', 'TABLE_CONFIG', 'DOMUtils', 'PluginSystem', 'ExportModule', 'VirtualScroll'].map(
        (n) => `${n}:${typeof window[n]}`,
      ),
    );
    expect(globals).toEqual([
      'ExceLikeTable:function',
      'ColumnHelpers:object',
      'TABLE_CONFIG:object',
      'DOMUtils:undefined',
      'PluginSystem:undefined',
      'ExportModule:undefined',
      'VirtualScroll:undefined',
    ]);
  });
});

test.describe('Minimal configuration', () => {
  test('columns can be omitted: they are generated from the data', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });
    });
    expect(await page.$$eval('#table th .header-title', (h) => h.map((x) => x.textContent))).toEqual(['id', 'name']);
    expect(await rows(page)).toEqual([
      ['1', 'Alice'],
      ['2', 'Bob'],
    ]);
  });

  test('columns generated from data also work when data arrives later via setData()', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table');
      window.table.setData([{ code: 'A1', qty: 3 }]);
    });
    expect(await page.$$eval('#table th .header-title', (h) => h.map((x) => x.textContent))).toEqual(['code', 'qty']);
    expect(await rows(page)).toEqual([['A1', '3']]);
  });

  test('dataIndex and title default to key', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, name: 'Alice', age: 28 }],
        columns: [{ key: 'name', title: 'Name' }, { key: 'age' }],
      });
    });
    expect(await page.$$eval('#table th .header-title', (h) => h.map((x) => x.textContent))).toEqual(['Name', 'age']);
    expect(await rows(page)).toEqual([['Alice', '28']]);
  });

  test('a column string is shorthand for { key }', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1, name: 'Alice', age: 28 }], columns: ['age', 'name'] });
    });
    expect(await rows(page)).toEqual([['28', 'Alice']]);
  });

  test('a column without key or dataIndex fails with a clear message', async ({ page }) => {
    await page.goto(BLANK);
    const message = await page.evaluate(() => {
      try {
        new ExceLikeTable('#table', { data: [{ a: 1 }], columns: [{ title: 'A' }] });
        return 'no error';
      } catch (e) {
        return e.message;
      }
    });
    expect(message).toContain('key');
  });
});

test.describe('Robustness', () => {
  test('works when localStorage is blocked (sandboxed iframe, privacy settings)', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      });
    });
    const log = watchConsole(page);
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1, name: 'Alice' }] });
    });
    expect(await rows(page)).toEqual([['1', 'Alice']]);
    expect(log.filter((m) => m.type === 'pageerror')).toEqual([]);
  });

  test('creating a table writes nothing to the console', async ({ page }) => {
    const log = watchConsole(page);
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1, name: 'Alice' }] });
    });
    await page.waitForTimeout(300); // conditional formatting initialises asynchronously
    expect(log).toEqual([]);
  });

  test('cell values are rendered as text, not HTML', async ({ page }) => {
    await page.goto(BLANK);
    const fired = await page.evaluate(async () => {
      window.__xss = 0;
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, name: '<img src=x onerror="window.__xss=1">' }],
        columns: [{ key: 'name', title: '<img src=x onerror="window.__xss=1">' }],
      });
      await new Promise((r) => setTimeout(r, 300));
      return window.__xss;
    });
    expect(fired).toBe(0);
    expect(await rows(page)).toEqual([['<img src=x onerror="window.__xss=1">']]);
  });
});

test.describe('Menu', () => {
  test('menu shows no icon-font placeholders and no mixed languages', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1 }] });
    });
    await page.click('#table .table-menu-btn');
    const menu = page.locator('#table .table-menu-dropdown');
    await expect(menu).toBeVisible();
    // v2.3.3 used Bootstrap Icons classes, which render as empty boxes unless the user loads that font.
    expect(await menu.locator('.bi').count()).toBe(0);
    // v2.3.3 had a hard-coded Japanese label in the English menu.
    expect(await menu.innerText()).not.toMatch(/[぀-ヿ一-鿿]/);
    expect(await menu.innerText()).toContain('Theme');
  });

  test('Japanese locale translates the theme label too', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', { data: [{ id: 1 }], locale: 'ja' });
    });
    await page.click('#table .table-menu-btn');
    await expect(page.locator('#table .table-menu-dropdown')).toContainText('テーマ');
  });
});

test.describe('CSV export', () => {
  const data = [
    { id: 1, name: 'Alice', city: 'Tokyo', balance: -5, note: '=HYPERLINK("http://x")' },
    { id: 2, name: '山田, 太郎', city: 'Osaka', balance: 0, note: 'say "hi"' },
    { id: 3, name: 'Carol', city: 'Tokyo', balance: 12.5, note: '' },
  ];

  test('exportCSV() returns the filtered and sorted rows across all pages', async ({ page }) => {
    await page.goto(BLANK);
    const csv = await page.evaluate((d) => {
      window.table = new ExceLikeTable('#table', {
        data: d,
        columns: ['name', 'city', 'balance', 'note'],
        pagination: { pageSize: 1 },
      });
      window.table.setFilters({ city: ['Tokyo'] });
      return window.table.exportCSV({ download: false, bom: false });
    }, data);
    expect(csv.split('\r\n')).toEqual([
      'name,city,balance,note',
      'Alice,Tokyo,-5,"\'=HYPERLINK(""http://x"")"',
      'Carol,Tokyo,12.5,',
      '',
    ]);
  });

  test('numbers keep their sign and zero is not dropped', async ({ page }) => {
    await page.goto(BLANK);
    const csv = await page.evaluate((d) => {
      window.table = new ExceLikeTable('#table', { data: d, columns: ['name', 'balance'] });
      return window.table.exportCSV({ download: false, bom: false });
    }, data);
    expect(csv).toContain('Alice,-5\r\n');
    expect(csv).toContain('"山田, 太郎",0\r\n');
  });

  test('the menu item downloads a UTF-8 CSV with BOM (opens correctly in Excel)', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate((d) => {
      window.table = new ExceLikeTable('#table', { data: d, columns: ['name', 'city'], tableId: 'people' });
    }, data);
    await page.click('#table .table-menu-btn');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#table .table-menu-item[data-action="export-csv"]'),
    ]);
    expect(download.suggestedFilename()).toBe('people.csv');
    const bytes = await readFile(await download.path());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString('utf8')).toBe('name,city\r\nAlice,Tokyo\r\n"山田, 太郎",Osaka\r\nCarol,Tokyo\r\n');
  });
});

test.describe('Sorting', () => {
  test('clicking the header title cycles ascending → descending → unsorted', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, n: 3 }, { id: 2, n: 1 }, { id: 3, n: 2 }],
        columns: ['n'],
      });
    });
    const title = page.locator('#table th .header-title', { hasText: 'n' });
    await title.click();
    expect(await rows(page)).toEqual([['1'], ['2'], ['3']]);
    await title.click();
    expect(await rows(page)).toEqual([['3'], ['2'], ['1']]);
    await title.click();
    expect(await rows(page)).toEqual([['3'], ['1'], ['2']]);
  });

  test('sortable: false columns ignore title clicks', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, n: 3 }, { id: 2, n: 1 }],
        columns: [{ key: 'n', sortable: false }],
      });
    });
    await page.locator('#table th .header-title').click();
    expect(await rows(page)).toEqual([['3'], ['1']]);
  });
});

test.describe('Conditional formatting', () => {
  test('a rule created from the menu colours the matching cells', async ({ page }) => {
    const log = watchConsole(page);
    await page.goto(BLANK);
    await page.evaluate(() => {
      localStorage.clear();
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, name: 'Pen', stock: 3 }, { id: 2, name: 'Ink', stock: 40 }],
        columns: ['name', 'stock'],
      });
    });
    await page.click('#table .table-menu-btn');
    await page.click('#table .table-menu-item[data-action="conditional-formatting"]');
    await page.click('.cf-new-rule-btn');
    await page.fill('#cf-rule-name', 'Low stock');
    await page.selectOption('#cf-rule-column', 'stock');
    await page.selectOption('#cf-rule-operator', 'less');
    await page.fill('#cf-rule-value', '10');
    await page.selectOption('#cf-rule-datatype', 'number');
    await page.click('.cf-save-btn');

    const lowStock = page.locator('#table td[data-column="stock"][data-value="3"]');
    const enough = page.locator('#table td[data-column="stock"][data-value="40"]');
    await expect(lowStock).toHaveAttribute('data-cf-apply-to', 'cell');
    await expect(enough).not.toHaveAttribute('data-cf-apply-to', 'cell');
    expect(log.filter((m) => m.type === 'pageerror' || m.type === 'error')).toEqual([]);
  });

  test('a validation error is shown in the table language', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      localStorage.clear();
      window.table = new ExceLikeTable('#table', { data: [{ id: 1, stock: 3 }], columns: ['stock'], locale: 'ja' });
    });
    await page.click('#table .table-menu-btn');
    await page.click('#table .table-menu-item[data-action="conditional-formatting"]');
    await page.click('.cf-new-rule-btn');
    // An empty name is stopped earlier by the browser's own `required` check; the library's
    // validation (and its translated message) runs for limits the browser cannot know.
    await page.fill('#cf-rule-name', 'x'.repeat(101));
    await page.selectOption('#cf-rule-column', 'stock');
    await page.fill('#cf-rule-value', '1');
    await page.click('.cf-save-btn');
    await expect(page.locator('.cf-toast-error')).toHaveText('ルール名は100文字以内で入力してください');
  });
});

test.describe('Cell values', () => {
  test('zero and false are displayed; null and undefined are blank', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, qty: 0, ok: false, note: null }, { id: 2, qty: 5, ok: true }],
        columns: ['qty', 'ok', 'note'],
      });
    });
    expect(await rows(page)).toEqual([
      ['0', 'false', ''],
      ['5', 'true', ''],
    ]);
  });
});

test.describe('Filter dropdown escapes data', () => {
  const payload = '<img src=x onerror="window.__xss=1">';

  for (const [label, row, column] of [
    ['text values', { id: 1, v: payload }, 'v'],
    ['values containing quotes', { id: 1, v: '"><img src=x onerror="window.__xss=1">' }, 'v'],
    ['numeric columns', { id: 1, n: payload }, 'n'],
  ]) {
    test(`opening the filter does not run HTML from ${label}`, async ({ page }) => {
      await page.goto(BLANK);
      await page.evaluate(([r, c]) => {
        window.__xss = 0;
        const data = [r, { id: 2, [c]: 5 }, { id: 3, [c]: 7 }];
        window.table = new ExceLikeTable('#table', { data, columns: [c] });
      }, [row, column]);
      await page.click(`#table .filter-btn[data-column="${column}"]`);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.__xss)).toBe(0);
      await expect(page.locator('.filter-option-text', { hasText: row[column] })).toHaveCount(1);
    });
  }

  test('a date column with HTML in a value does not run it', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate((p) => {
      window.__xss = 0;
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, d: '2024-01-05' }, { id: 2, d: p }],
        columns: [{ key: 'd', filterType: 'date-hierarchy' }],
      });
    }, payload);
    await page.click('#table .filter-btn[data-column="d"]');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__xss)).toBe(0);
  });
});

test.describe('Cell renderers', () => {
  test('render() may return a DOM node', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, name: 'Alice' }],
        columns: [{ key: 'name', render: (v) => Object.assign(document.createElement('b'), { textContent: v }) }],
      });
    });
    await expect(page.locator('#table td b')).toHaveText('Alice');
  });
});

test.describe('ColumnHelpers', () => {
  test('status() colours known values and escapes data', async ({ page }) => {
    await page.goto(BLANK);
    const fired = await page.evaluate(async () => {
      window.__xss = 0;
      window.table = new ExceLikeTable('#table', {
        data: [
          { id: 1, s: 'Active' },
          { id: 2, s: '<img src=x onerror="window.__xss=1">' },
        ],
        columns: [ColumnHelpers.status('s', 'Status', { Active: 'rgb(82, 196, 26)' })],
      });
      await new Promise((r) => setTimeout(r, 300));
      return window.__xss;
    });
    expect(fired).toBe(0);
    await expect(page.locator('#table td .status-badge')).toHaveCSS('color', 'rgb(82, 196, 26)');
    await expect(page.locator('#table td').nth(1)).toHaveText('<img src=x onerror="window.__xss=1">');
  });

  test('number() formats numbers and escapes anything else', async ({ page }) => {
    await page.goto(BLANK);
    const fired = await page.evaluate(async () => {
      window.__xss = 0;
      window.table = new ExceLikeTable('#table', {
        data: [{ id: 1, p: 1234567 }, { id: 2, p: '<img src=x onerror="window.__xss=1">' }],
        columns: [ColumnHelpers.number('p', 'Price', { currency: '¥' })],
        pagination: false,
      });
      await new Promise((r) => setTimeout(r, 300));
      return window.__xss;
    });
    expect(fired).toBe(0);
    expect(await rows(page)).toEqual([['¥1,234,567'], ['<img src=x onerror="window.__xss=1">']]);
  });

  test('actions() escapes the row id', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      window.table = new ExceLikeTable('#table', {
        data: [{ id: '"><img src=x onerror="window.__xss=1">' }],
        columns: [ColumnHelpers.actions('Actions', [{ key: 'edit', label: 'Edit' }])],
      });
    });
    await expect(page.locator('#table .action-btn')).toHaveAttribute('data-id', '"><img src=x onerror="window.__xss=1">');
    await expect(page.locator('#table td img')).toHaveCount(0);
  });
});

test.describe('Filter drop-down on short screens', () => {
  test.use({ viewport: { width: 667, height: 375 } }); // phone in landscape

  test('the option list is visible and OK stays on screen', async ({ page }) => {
    await page.goto(BLANK);
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('afterbegin', '<div style="height:150px"></div>');
      const data = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, city: `City ${i % 30}` }));
      window.table = new ExceLikeTable('#table', { data, columns: ['city'] });
    });
    await page.click('#table .filter-btn[data-column="city"]');
    const list = page.locator('.filter-dropdown-wrapper .filter-dropdown-content');
    expect((await list.boundingBox()).height).toBeGreaterThan(60);
    const ok = page.locator('.filter-dropdown-wrapper .filter-btn-confirm');
    const box = await ok.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(375);
    await page.locator('.filter-dropdown-wrapper input[data-value="__all__"]').uncheck();
    await page.locator('.filter-dropdown-wrapper input[data-value="City 1"]').check();
    await ok.click();
    expect(await page.$$eval('#table td', (tds) => [...new Set(tds.map((td) => td.textContent))])).toEqual(['City 1']);
  });
});
