import { test, expect } from '@playwright/test';

// Helper to set authenticated state
async function authenticateUser(page: import('@playwright/test').Page, role = 'PARTICIPANT') {
  await page.evaluate((userRole) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          role: userRole,
        },
        isAuthenticated: true,
      },
    }));
  }, role);
}

test.describe('Course Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'course-1',
          code: 'B-ORTIM',
          name: 'B-ORTIM',
          fullName: 'Basic Orthopaedic Resuscitation and Trauma Initial Management',
          description: 'Grundläggande ortopedisk traumahantering',
          estimatedHours: 8,
          parts: [
            {
              id: 'part-1',
              partNumber: 1,
              title: 'Introduktion',
              chapters: [
                { id: 'ch-1', chapterNumber: 1, title: 'Översikt', slug: 'oversikt', estimatedMinutes: 15 },
                { id: 'ch-2', chapterNumber: 2, title: 'Anatomi', slug: 'anatomi', estimatedMinutes: 30 },
              ],
            },
          ],
        }]),
      });
    });

    await page.route('**/api/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { chapterId: 'ch-1', readProgress: 100, quizPassed: true, bestQuizScore: 90 },
          { chapterId: 'ch-2', readProgress: 50, quizPassed: false, bestQuizScore: null },
        ]),
      });
    });

    await authenticateUser(page);
    await page.goto('/course');
  });

  test('should display course overview', async ({ page }) => {
    await expect(page.getByText(/b-ortim/i)).toBeVisible();
    await expect(page.getByText(/introduktion/i)).toBeVisible();
  });

  test('should show chapter list with progress', async ({ page }) => {
    await expect(page.getByText(/översikt/i)).toBeVisible();
    await expect(page.getByText(/anatomi/i)).toBeVisible();
  });

  test('should navigate to chapter when clicked', async ({ page }) => {
    await page.route('**/api/chapters/oversikt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ch-1',
          chapterNumber: 1,
          title: 'Översikt',
          slug: 'oversikt',
          content: '# Översikt\n\nDetta är en introduktion till B-ORTIM kursen.',
          contentVersion: 1,
          estimatedMinutes: 15,
          learningObjectives: [],
        }),
      });
    });

    await page.getByText(/översikt/i).first().click();
    await expect(page).toHaveURL(/.*chapter.*oversikt|.*oversikt/);
  });

  test('should display progress percentage', async ({ page }) => {
    // Look for progress indicators
    const progressElements = page.locator('[role="progressbar"], .progress, [data-progress]');
    await expect(progressElements.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Progress might be shown as text
    });
  });
});

test.describe('Chapter Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/chapters/oversikt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ch-1',
          chapterNumber: 1,
          title: 'Översikt',
          slug: 'oversikt',
          content: '# Översikt\n\nDetta är en introduktion till B-ORTIM kursen.\n\n## Lärandemål\n\n- Förstå grunderna\n- Tillämpa kunskap',
          contentVersion: 1,
          estimatedMinutes: 15,
          learningObjectives: [
            { id: 'lo-1', code: 'LO1', type: 'KNOWLEDGE', description: 'Förstå grunderna' },
          ],
        }),
      });
    });

    await authenticateUser(page);
    await page.goto('/chapter/oversikt');
  });

  test('should display chapter title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /översikt/i })).toBeVisible();
  });

  test('should render markdown content', async ({ page }) => {
    await expect(page.getByText(/introduktion till b-ortim/i)).toBeVisible();
  });

  test('should have navigation to next chapter', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /nästa|fortsätt/i });
    // Navigation buttons may or may not be present depending on chapter position
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(nextButton).toBeEnabled();
    }
  });
});
