# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/dashboard-fallback.spec.ts >> LinkedIn Governance Dashboard Fallback E2E >> Validates fallback mechanisms drop directly into manual UI states without crashing globally.
- Location: tests/e2e/dashboard-fallback.spec.ts:6:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Generated Posts') to be visible

```

# Page snapshot

```yaml
- generic [ref=e2]: Unauthorized Access
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | require('dotenv').config();
  3  | 
  4  | test.describe('LinkedIn Governance Dashboard Fallback E2E', () => {
  5  | 
  6  |   test('Validates fallback mechanisms drop directly into manual UI states without crashing globally.', async ({ page }) => {
  7  |     
  8  |     // 1. Open Dashboard (Basic Auth integration required based on ENV variables)
  9  |     const username = process.env.DASHBOARD_USERNAME || 'admin';
  10 |     const password = process.env.DASHBOARD_PASSWORD || 'password123';
  11 |     
  12 |     // Generate Auth sequence implicitly pushing credentials into Context 
  13 |     const basicAuthUrl = `http://${username}:${password}@localhost:3000`;
  14 |     await page.goto(basicAuthUrl);
  15 | 
  16 |     // 2. Load Posts constraint (wait for items to render)
  17 |     console.log("Loading generated posts...");
> 18 |     await page.waitForSelector('text=Generated Posts');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  19 |     
  20 |     // We expect the native Post Card limits to resolve out
  21 |     const cards = page.locator('.w-full.bg-white.rounded-2xl');
  22 |     await expect(cards.first()).toBeVisible({ timeout: 10000 });
  23 | 
  24 |     // 3. Approve Post organically bridging over to ready states
  25 |     // If it's pure 'generated', we click 'Approve for Publishing'
  26 |     const approveBtn = page.locator('button:has-text("Approve")').first();
  27 |     
  28 |     if (await approveBtn.isVisible()) {
  29 |       await approveBtn.click();
  30 |       await page.waitForTimeout(2000); // organic await hook
  31 |     }
  32 | 
  33 |     // 4. Trigger Publish API
  34 |     console.log("Triggering explicit Publish Broadcast...");
  35 |     const publishBtn = page.locator('button:has-text("Publish to LinkedIn")').first();
  36 |     
  37 |     if (await publishBtn.isVisible()) {
  38 |       await publishBtn.click();
  39 |     } else {
  40 |       console.log("Publish bypass not visible, might be already fallback locked");
  41 |     }
  42 | 
  43 |     // Wait for resolution
  44 |     await page.waitForTimeout(3000);
  45 | 
  46 |     // 5. Verify Fallback Works gracefully mapping Native Clipboard buttons manually
  47 |     console.log("Asserting Fallback UI Elements natively bind into the UI flow.");
  48 |     const fallbackCopyBtn = page.locator('button:has-text("Copy Post Sequence")').first();
  49 |     
  50 |     await expect(fallbackCopyBtn).toBeVisible({ timeout: 15000 });
  51 |     console.log("✅ Playwright E2E Explicit Validation Passed!");
  52 |   });
  53 | });
  54 | 
```