import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const randomUsername = `testuser_${Math.floor(Math.random() * 100000)}`;
    const randomPassword = 'Password123!';

    test('User can Signup', async ({ page }) => {
        await page.goto('/signup');

        await page.fill('input[placeholder="Username"]', randomUsername);
        await page.fill('input[placeholder="Password"]', randomPassword);

        await page.click('button:has-text("Create Account")');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=Upload Contract')).toBeVisible();
    });

    test('User can Login', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[placeholder="Username"]', randomUsername);
        await page.fill('input[placeholder="Password"]', randomPassword);

        await page.click('button:has-text("Sign In")');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=Upload Contract')).toBeVisible();
    });

    test('User can Logout', async ({ page }) => {
        // Pre-login
        await page.goto('/login');
        await page.fill('input[placeholder="Username"]', randomUsername);
        await page.fill('input[placeholder="Password"]', randomPassword);
        await page.click('button:has-text("Sign In")');

        await expect(page).toHaveURL(/\/dashboard/);

        // Logout
        await page.click('button:has-text("Logout")');

        // Should redirect to landing page or login
        await expect(page).toHaveURL(/\//);
    });
});
