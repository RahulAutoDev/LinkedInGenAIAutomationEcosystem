# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/dashboard/tests/e2e/record-demo.spec.ts >> LinkedIn Governance Demo Recording
- Location: apps/dashboard/tests/e2e/record-demo.spec.ts:14:5

# Error details

```
Error: page.goto: net::ERR_FILE_NOT_FOUND at file:///tmp/demo-intro.html
Call log:
  - navigating to "file:///tmp/demo-intro.html", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | import * as dotenv from 'dotenv';
  3  | dotenv.config();
  4  | 
  5  | test.use({
  6  |   video: 'on',
  7  |   viewport: { width: 1280, height: 720 },
  8  |   httpCredentials: {
  9  |     username: process.env.DASHBOARD_USERNAME || 'admin',
  10 |     password: process.env.DASHBOARD_PASSWORD || 'secret123'
  11 |   }
  12 | });
  13 | 
  14 | test('LinkedIn Governance Demo Recording', async ({ page }: { page: Page }) => {
  15 |   // 1. Intro sequence
> 16 |   await page.goto('file:///tmp/demo-intro.html');
     |              ^ Error: page.goto: net::ERR_FILE_NOT_FOUND at file:///tmp/demo-intro.html
  17 |   await page.waitForTimeout(4000);
  18 | 
  19 |   // 2. Topic Input Google Sheet Mock
  20 |   await page.goto('file:///tmp/demo-sheet.html');
  21 |   await page.waitForTimeout(3000);
  22 | 
  23 |   // 3. AI Generation Dashboard & Real Data
  24 |   await page.goto('http://localhost:3000/');
  25 |   
  26 |   await page.waitForSelector('text=Governance Ledger');
  27 |   console.log("Dashboard loaded");
  28 |   await page.waitForTimeout(3000);
  29 | 
  30 |   // 4. Click Approve
  31 |   const approveBtn = page.locator('button:has-text("Approve")').first();
  32 |   if (await approveBtn.isVisible()) {
  33 |     console.log("Clicking approve");
  34 |     await approveBtn.click();
  35 |     await page.waitForTimeout(3000); // Wait for transition
  36 |   }
  37 | 
  38 |   // 5. Publish Step & Critical Constraint Alert
  39 |   const publishBtn = page.locator('button:has-text("Publish to LinkedIn")').first();
  40 |   if (await publishBtn.isVisible()) {
  41 |     console.log("Clicking publish");
  42 |     await publishBtn.click();
  43 |   }
  44 | 
  45 |   // Inject user's mandatory constraint text overlaid cleanly on UI
  46 |   await page.evaluate(() => {
  47 |     const div = document.createElement('div');
  48 |     div.id = 'demo-warning-box';
  49 |     div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ba1a1a;color:white;padding:24px 40px;font-size:28px;border-radius:12px;z-index:9999;box-shadow:0 10px 35px rgba(0,0,0,0.6);font-family:sans-serif;font-weight:bold;text-align:center;animation:fadeIn 0.5s;';
  50 |     div.innerHTML = '🛑 Manual publish required due to LinkedIn API restrictions';
  51 |     document.body.appendChild(div);
  52 |   });
  53 |   
  54 |   await page.waitForTimeout(4000);
  55 |   await page.evaluate(() => document.getElementById('demo-warning-box')?.remove());
  56 | 
  57 |   // 6. Final State: Show Content Ready & Copy Button
  58 |   const fallbackCopyBtn = page.locator('button:has-text("Copy Post Sequence")').first();
  59 |   await expect(fallbackCopyBtn).toBeVisible({ timeout: 5000 });
  60 |   await fallbackCopyBtn.hover();
  61 |   
  62 |   console.log("Tracing final hover state");
  63 |   await page.waitForTimeout(3500); 
  64 | });
  65 | 
```