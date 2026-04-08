import { test, expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

test.use({
  video: 'on',
  viewport: { width: 1280, height: 720 },
  httpCredentials: {
    username: process.env.DASHBOARD_USERNAME || 'admin',
    password: process.env.DASHBOARD_PASSWORD || 'secret123'
  }
});

test('LinkedIn Governance Demo Recording', async ({ page }: { page: Page }) => {
  // 1. Intro sequence
  await page.goto('file:///tmp/demo-intro.html');
  await page.waitForTimeout(4000);

  // 2. Topic Input Google Sheet Mock
  await page.goto('file:///tmp/demo-sheet.html');
  await page.waitForTimeout(3000);

  // 3. AI Generation Dashboard & Real Data
  await page.goto('http://localhost:3000/');
  
  await page.waitForSelector('text=Governance Ledger');
  console.log("Dashboard loaded");
  await page.waitForTimeout(3000);

  // 4. Click Approve
  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.isVisible()) {
    console.log("Clicking approve");
    await approveBtn.click();
    await page.waitForTimeout(3000); // Wait for transition
  }

  // 5. Publish Step & Critical Constraint Alert
  const publishBtn = page.locator('button:has-text("Publish to LinkedIn")').first();
  if (await publishBtn.isVisible()) {
    console.log("Clicking publish");
    await publishBtn.click();
  }

  // Inject user's mandatory constraint text overlaid cleanly on UI
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.id = 'demo-warning-box';
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ba1a1a;color:white;padding:24px 40px;font-size:28px;border-radius:12px;z-index:9999;box-shadow:0 10px 35px rgba(0,0,0,0.6);font-family:sans-serif;font-weight:bold;text-align:center;animation:fadeIn 0.5s;';
    div.innerHTML = '🛑 Manual publish required due to LinkedIn API restrictions';
    document.body.appendChild(div);
  });
  
  await page.waitForTimeout(4000);
  await page.evaluate(() => document.getElementById('demo-warning-box')?.remove());

  // 6. Final State: Show Content Ready & Copy Button
  const fallbackCopyBtn = page.locator('button:has-text("Copy Post Sequence")').first();
  await expect(fallbackCopyBtn).toBeVisible({ timeout: 5000 });
  await fallbackCopyBtn.hover();
  
  console.log("Tracing final hover state");
  await page.waitForTimeout(3500); 
});
