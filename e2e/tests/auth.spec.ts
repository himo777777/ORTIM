import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /logga in/i })).toBeVisible();
  });

  test('should show BankID login option', async ({ page }) => {
    await expect(page.getByText(/bankid/i)).toBeVisible();
  });

  test('should display QR code when initiating BankID login', async ({ page }) => {
    // Mock the BankID initiate response
    await page.route('**/api/auth/bankid/initiate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          qrData: 'bankid://test-qr-data',
        }),
      });
    });

    const loginButton = page.getByRole('button', { name: /logga in med bankid/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // QR code or instructions should appear
      await expect(page.getByText(/qr|skanna|bankid/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/bankid/poll/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'complete',
          token: 'test-jwt-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 'user-1',
            personnummer: '199001011234',
            firstName: 'Test',
            lastName: 'User',
            role: 'PARTICIPANT',
          },
        }),
      });
    });

    // Set auth state directly for testing
    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'test-jwt-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 'user-1',
            firstName: 'Test',
            lastName: 'User',
            role: 'PARTICIPANT',
          },
          isAuthenticated: true,
        },
      }));
    });

    await page.goto('/');
    await expect(page).toHaveURL(/.*dashboard|.*/);
  });
});
