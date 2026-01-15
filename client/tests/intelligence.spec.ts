import { test, expect } from '@playwright/test';

test.describe('Contract Intelligence Hub', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[placeholder="Username"]', 'testuser_123');
        await page.fill('input[placeholder="Password"]', 'Password123!');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/dashboard/);

        // Navigate to Intelligence Hub
        await page.click('text=Contract Intelligence');
        await expect(page).toHaveURL(/\/dashboard\/intelligence/);
    });

    test('Semantic Search works as expected', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search across all your contracts"]');
        await searchInput.fill('termination clauses');
        await page.keyboard.press('Enter');

        // Verify results appear
        await expect(page.locator('text=Match:')).toBeVisible({ timeout: 15000 });
        const results = await page.locator('text=Match:').count();
        expect(results).toBeGreaterThan(0);
    });

    test('History Chat (RAG) works as expected', async ({ page }) => {
        // Switch to Chat tab
        await page.click('text=History Chat');

        const chatInput = page.locator('input[placeholder="Message contract history..."]');
        await chatInput.fill('What is my typical liability limit?');
        await page.click('button:has-text("PaperPlane")'); // or search by icon/role

        // Wait for AI response
        await expect(page.locator('text=Retrieving sources...')).toBeVisible();
        await expect(page.locator('text=Citations')).toBeVisible({ timeout: 30000 });

        // Verify response content isn't empty
        const aiResponse = page.locator('.bg-white\\/10 p');
        await expect(aiResponse).not.toBeEmpty();
    });
});
