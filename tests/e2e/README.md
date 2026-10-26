# End-to-end tests

Playwright tests that drive the built library (`dist/`) in a real browser.

```bash
npm run build        # the tests load dist/, so build first
npm run test:e2e     # Chromium at six viewport sizes
npx playwright test --project=chromium-desktop   # one size only
E2E_ALL_BROWSERS=1 npm run test:e2e             # + Firefox and WebKit (run `npx playwright install firefox webkit` once)
```

Playwright starts `scripts/dev-server.mjs` itself (port 4317, override with `E2E_PORT`). It never reuses a server that is already listening, so an unrelated service on the port cannot be tested by mistake.

| File | Covers |
|---|---|
| `getting-started.spec.js` | Loading each build, minimal configuration, robustness (blocked localStorage, console noise, escaping), menu, CSV export, sorting, conditional formatting, column helpers |
| `filter-comprehensive.spec.js` | Filter drop-down: position, accuracy for text / number / date, operation flows, edge cases |
| `concurrent-operations.spec.js` | Sorting, filtering and paging combined |
| `keyboard-accessibility.spec.js` | Opening, navigating and applying filters with the keyboard |
| `performance-large-data.spec.js` | 1,000 rows |

Fixture pages live in `fixtures/` and load `/dist/...`.
