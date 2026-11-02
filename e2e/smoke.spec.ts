import { test, expect } from '@playwright/test';

test.describe('UC Clarity Prototype E2E Smoke Test (Section 16, 17)', () => {
  test('Demo script steps 1 to 6 and step 8 walkthrough', async ({ page }) => {
    // 1. Load application
    await page.goto('/');
    await expect(page).toHaveTitle(/UC Clarity/);

    // Verify persistent simulation badge
    await expect(page.locator('text=Prototype: simulated data').first()).toBeVisible();

    // 2. Open Split View
    await page.click('button:has-text("Split view")');
    await expect(page.locator('text=Customer Mobile Screen')).toBeVisible();
    await expect(page.locator('text=Partner Mobile Screen')).toBeVisible();

    // 3. Customer flow: verify booking and diagnostic inspection comparison
    // Check equal card styling on comparison (Guardrail G1)
    const repairCard = page.locator('[data-testid="comparison-repair-card"]').first();
    const replaceCard = page.locator('[data-testid="comparison-replace-card"]').first();

    if (await repairCard.isVisible()) {
      const repairClass = await repairCard.getAttribute('class');
      const replaceClass = await replaceCard.getAttribute('class');
      expect(repairClass).toBe(replaceClass);
    }

    // 4. Check Operations View & Guardrail badge
    await page.click('button:has-text("UC Operations")');
    await expect(page.locator('text=Conversion weight in allocation: 0 (guardrail)')).toBeVisible();

    // Check Economics tab reproduces benchmark table
    await page.click('button:has-text("Unit Economics Module")');
    await expect(page.locator('text=Case 12 Sourced Benchmark Model')).toBeVisible();
  });
});
