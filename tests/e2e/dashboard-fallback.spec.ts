const { test, expect } = require('@playwright/test');
require('dotenv').config();

test.describe('LinkedIn Governance Dashboard Fallback E2E', () => {

  test('Validates fallback mechanisms drop directly into manual UI states without crashing globally.', async ({ page }) => {
    
    // 1. Open Dashboard (Basic Auth integration required based on ENV variables)
    const username = process.env.DASHBOARD_USERNAME || 'admin';
    const password = process.env.DASHBOARD_PASSWORD || 'password123';
    
    // Generate Auth sequence implicitly pushing credentials into Context 
    const basicAuthUrl = `http://${username}:${password}@localhost:3000`;
    await page.goto(basicAuthUrl);

    // 2. Load Posts constraint (wait for items to render)
    console.log("Loading generated posts...");
    await page.waitForSelector('text=Governance Ledger');
    
    // We expect the native Post Card limits to resolve out
    const cards = page.locator('.w-full.bg-white.rounded-2xl');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // 3. Approve Post organically bridging over to ready states
    // If it's pure 'generated', we click 'Approve for Publishing'
    const approveBtn = page.locator('button:has-text("Approve")').first();
    
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000); // organic await hook
    }

    // 4. Trigger Publish API
    console.log("Triggering explicit Publish Broadcast...");
    const publishBtn = page.locator('button:has-text("Publish to LinkedIn")').first();
    
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
    } else {
      console.log("Publish bypass not visible, might be already fallback locked");
    }

    // Wait for resolution
    await page.waitForTimeout(3000);

    // 5. Verify Fallback Works gracefully mapping Native Clipboard buttons manually
    console.log("Asserting Fallback UI Elements natively bind into the UI flow.");
    const fallbackCopyBtn = page.locator('button:has-text("Copy Post Sequence")').first();
    
    await expect(fallbackCopyBtn).toBeVisible({ timeout: 15000 });
    console.log("✅ Playwright E2E Explicit Validation Passed!");
  });
});
