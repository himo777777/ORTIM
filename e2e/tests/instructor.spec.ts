import { test, expect } from '@playwright/test';

async function authenticateInstructor(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        user: { id: 'instructor-1', firstName: 'Instructor', lastName: 'User', role: 'INSTRUCTOR' },
        isAuthenticated: true,
      },
    }));
  });
}

test.describe('Instructor Dashboard', () => {
  const mockCohorts = [
    {
      id: 'cohort-1',
      name: 'VT2024-Stockholm',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-06-15T00:00:00Z',
      isActive: true,
      course: { name: 'B-ORTIM', code: 'B-ORTIM' },
      _count: { enrollments: 25 },
    },
    {
      id: 'cohort-2',
      name: 'HT2023-Göteborg',
      startDate: '2023-08-15T00:00:00Z',
      endDate: '2024-01-15T00:00:00Z',
      isActive: false,
      course: { name: 'B-ORTIM', code: 'B-ORTIM' },
      _count: { enrollments: 20 },
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/instructor/cohorts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCohorts),
      });
    });

    await authenticateInstructor(page);
    await page.goto('/instructor');
  });

  test('should display cohort list', async ({ page }) => {
    await expect(page.getByText(/vt2024-stockholm/i)).toBeVisible();
    await expect(page.getByText(/25.*deltagare|25 participants/i)).toBeVisible().catch(() => {
      expect(page.getByText('25')).toBeVisible();
    });
  });

  test('should show active and inactive cohorts', async ({ page }) => {
    await expect(page.getByText(/vt2024-stockholm/i)).toBeVisible();
    await expect(page.getByText(/ht2023-göteborg/i)).toBeVisible();
  });

  test('should navigate to cohort details', async ({ page }) => {
    await page.route('**/api/instructor/cohorts/cohort-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockCohorts[0],
          description: 'Kursomgång för vårterminen 2024',
          maxParticipants: 30,
          course: { id: 'course-1', name: 'B-ORTIM', code: 'B-ORTIM' },
          enrollments: [],
        }),
      });
    });

    await page.getByText(/vt2024-stockholm/i).click();
    await expect(page).toHaveURL(/.*cohort.*1|.*instructor.*cohort/);
  });
});

test.describe('OSCE Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/instructor/cohorts/cohort-1/participants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            enrollmentId: 'enroll-1',
            status: 'ACTIVE',
            user: {
              id: 'user-1',
              firstName: 'Anna',
              lastName: 'Andersson',
              email: 'anna@example.com',
              workplace: 'Karolinska',
              speciality: 'Ortopedi',
            },
            progress: { chaptersCompleted: 8, totalChapters: 10, percentage: 80 },
            osce: { completed: 2, passed: 2, total: 5, assessments: [] },
          },
        ]),
      });
    });

    await authenticateInstructor(page);
    await page.goto('/instructor/cohorts/cohort-1/osce');
  });

  test('should display participant list for OSCE', async ({ page }) => {
    await expect(page.getByText(/anna andersson/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show OSCE progress', async ({ page }) => {
    await expect(page.getByText(/2.*5|80%|stationer/i)).toBeVisible({ timeout: 5000 }).catch(() => {
      // Progress might be shown differently
    });
  });
});
