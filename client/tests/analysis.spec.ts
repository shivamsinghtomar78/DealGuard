import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Contract Analysis Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test in this suite
        await page.goto('/login');
        await page.fill('input[placeholder="Username"]', 'testuser_123'); // Assuming this exists or create one
        await page.fill('input[placeholder="Password"]', 'Password123!');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Complete Upload -> Analyze -> Review Flow', async ({ page }) => {
        // 1. Upload
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Drop your contract here');
        const fileChooser = await fileChooserPromise;

        // Use a dummy text file or a small docx if available
        // For testing, we can often just mock the upload or use a small asset
        await fileChooser.setFiles(path.join(__dirname, 'test-assets', 'sample_contract.pdf'));

        await page.click('button:has-text("Analyze Contract")');

        // 2. Wait for Processing
        await expect(page).toHaveURL(/\/dashboard\/analysis\//);
        await expect(page.locator('text=Deep Analysis in Progress')).toBeVisible();
        await expect(page.locator('text=Deployment involving neural agents...')).toBeVisible();

        // 3. Verify Results (Wait for polling to finish)
        // Increased timeout for AI processing
        await expect(page.locator('text=Contract Analysis Report')).toBeVisible({ timeout: 60000 });

        // Verify Risk Score
        await expect(page.locator('text=Overall Risk Score')).toBeVisible();

        // Verify Summary
        await expect(page.locator('text=Executive Summary')).toBeVisible();

        // Verify Risk Assessments
        await expect(page.locator('text=Risk Assessments')).toBeVisible();
    });
});
