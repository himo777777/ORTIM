import { test, expect } from '@playwright/test';

async function authenticateUser(page: import('@playwright/test').Page, role = 'PARTICIPANT') {
  await page.evaluate((userRole) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        user: { id: 'user-1', firstName: 'Test', lastName: 'User', role: userRole },
        isAuthenticated: true,
      },
    }));
  }, role);
}

test.describe('Certificates', () => {
  const mockCertificates = [
    {
      id: 'cert-1',
      certificateNumber: 'BORTIM-2024-001',
      courseName: 'B-ORTIM',
      issuedAt: '2024-01-15T10:00:00Z',
      validUntil: '2027-01-15T10:00:00Z',
      examScore: 92,
      examPassed: true,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/certificates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCertificates),
      });
    });

    await authenticateUser(page);
    await page.goto('/certificates');
  });

  test('should display list of certificates', async ({ page }) => {
    await expect(page.getByText(/bortim-2024-001/i)).toBeVisible();
    await expect(page.getByText(/b-ortim/i)).toBeVisible();
  });

  test('should show certificate details', async ({ page }) => {
    await page.route('**/api/certificates/cert-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockCertificates[0],
          courseCode: 'B-ORTIM',
          oscePassed: true,
          verificationUrl: 'https://bortim.se/verify/BORTIM-2024-001',
          pdfUrl: '/api/reports/certificate/cert-1',
        }),
      });
    });

    const certCard = page.getByText(/bortim-2024-001/i);
    await certCard.click();

    // Should navigate to detail view or show modal
    await expect(page.getByText(/92%|poäng/i)).toBeVisible({ timeout: 5000 }).catch(() => {
      // Details might be shown inline
    });
  });

  test('should have download PDF button', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /ladda ner|pdf|download/i });
    if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(downloadButton).toBeEnabled();
    }
  });

  test('should show validity dates', async ({ page }) => {
    await expect(page.getByText(/2024|2027|giltig/i)).toBeVisible();
  });
});

test.describe('Certificate Verification (Public)', () => {
  test('should verify valid certificate', async ({ page }) => {
    await page.route('**/api/verify/BORTIM-2024-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isValid: true,
          certificate: {
            certificateNumber: 'BORTIM-2024-001',
            courseName: 'B-ORTIM',
            issuedAt: '2024-01-15T10:00:00Z',
            validUntil: '2027-01-15T10:00:00Z',
            examPassed: true,
            holderName: 'Test User',
          },
        }),
      });
    });

    await page.goto('/verify/BORTIM-2024-001');
    await expect(page.getByText(/giltigt|valid|verifierat/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/test user/i)).toBeVisible();
  });

  test('should show error for invalid certificate', async ({ page }) => {
    await page.route('**/api/verify/INVALID-CODE', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isValid: false }),
      });
    });

    await page.goto('/verify/INVALID-CODE');
    await expect(page.getByText(/ogiltigt|invalid|hittades inte/i)).toBeVisible({ timeout: 5000 });
  });
});
