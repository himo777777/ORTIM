import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { FocusMode } from '@/components/study/FocusMode';
import { LiveRegion } from '@/components/accessibility/LiveRegion';
import { SkipLinks, SkipLinkTarget } from '@/components/accessibility/SkipLinks';
import { UpdatePrompt, InstallPrompt } from '@/components/pwa';
import { GamificationProvider } from '@/components/gamification';
import { useSessionTracking } from '@/hooks/useSessionTracking';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/participant/DashboardPage'));
const CoursePage = lazy(() => import('@/pages/participant/CoursePage'));
const ChapterPage = lazy(() => import('@/pages/participant/ChapterPage'));
const QuizPage = lazy(() => import('@/pages/participant/QuizPage'));
const ExamPage = lazy(() => import('@/pages/participant/ExamPage'));
const ReviewPage = lazy(() => import('@/pages/participant/ReviewPage'));
const AlgorithmsPage = lazy(() => import('@/pages/participant/AlgorithmsPage'));
const CertificatesPage = lazy(() => import('@/pages/participant/CertificatesPage'));
const CourseEvaluationPage = lazy(() => import('@/pages/participant/CourseEvaluationPage'));
const LeaderboardPage = lazy(() => import('@/pages/participant/LeaderboardPage'));
const MyProgressPage = lazy(() => import('@/pages/participant/MyProgressPage'));
const VerifyCertificatePage = lazy(() => import('@/pages/public/VerifyCertificatePage'));

// Instructor pages
const InstructorDashboard = lazy(() => import('@/pages/instructor/InstructorDashboard'));
const CohortsPage = lazy(() => import('@/pages/instructor/CohortsPage'));
const CohortDetailPage = lazy(() => import('@/pages/instructor/CohortDetailPage'));
const OSCEPage = lazy(() => import('@/pages/instructor/OSCEPage'));
const TTTOSCEPage = lazy(() => import('@/pages/instructor/TTTOSCEPage'));
const EPAAssessmentPage = lazy(() => import('@/pages/instructor/EPAAssessmentPage'));
const PilotResultsPage = lazy(() => import('@/pages/instructor/PilotResultsPage'));
const ContentManagementPage = lazy(() => import('@/pages/instructor/ContentManagementPage'));
const ChapterEditorPage = lazy(() => import('@/pages/instructor/ChapterEditorPage'));
const QuestionEditorPage = lazy(() => import('@/pages/instructor/QuestionEditorPage'));
const CourseBuilderPage = lazy(() => import('@/pages/instructor/CourseBuilderPage'));
const MediaLibraryPage = lazy(() => import('@/pages/instructor/MediaLibraryPage'));
const AtRiskLearnersPage = lazy(() => import('@/pages/instructor/AtRiskLearnersPage'));
const ReportBuilderPage = lazy(() => import('@/pages/instructor/ReportBuilderPage'));
const DataExportPage = lazy(() => import('@/pages/instructor/DataExportPage'));
const CohortComparisonPage = lazy(() => import('@/pages/instructor/CohortComparisonPage'));

// Organization portal pages
const OrganizationPortalPage = lazy(() => import('@/pages/organization/OrganizationPortalPage'));
const OrganizationEmployeesPage = lazy(() => import('@/pages/organization/OrganizationEmployeesPage'));
const OrganizationEmployeeDetailPage = lazy(() => import('@/pages/organization/OrganizationEmployeeDetailPage'));
const OrganizationSettingsPage = lazy(() => import('@/pages/organization/OrganizationSettingsPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const AdminCoursesPage = lazy(() => import('@/pages/admin/CoursesPage'));
const AdminQuestionsPage = lazy(() => import('@/pages/admin/QuestionsPage'));
const AdminStatisticsPage = lazy(() => import('@/pages/admin/StatisticsPage'));
const AnalyticsDashboardPage = lazy(() => import('@/pages/admin/AnalyticsDashboardPage'));
const ABTestPage = lazy(() => import('@/pages/admin/ABTestPage'));

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Instructor route wrapper
function InstructorRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Organization portal route wrapper
function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  // Allow users who are organization members (MANAGER or ADMIN role in organization)
  // For now, check if user has the INSTRUCTOR or ADMIN role as they can view organization data
  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Automatisk sessionsspårning
  useSessionTracking();

  // Check if user needs onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check localStorage for onboarding completion
      const onboardingKey = `ortac-onboarding-${user.id}`;
      const hasCompletedOnboarding = localStorage.getItem(onboardingKey);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`ortac-onboarding-${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <GamificationProvider>
      {/* Accessibility: Skip links */}
      <SkipLinks
        links={[
          { id: 'main-content', label: 'Hoppa till huvudinnehåll' },
          { id: 'navigation', label: 'Hoppa till navigation' },
        ]}
      />

      {/* Accessibility: Live region for announcements */}
      <LiveRegion />

      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:code" element={<VerifyCertificatePage />} />

          {/* Protected participant routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="course" element={<CoursePage />} />
            <Route path="chapter/:chapterId" element={<ChapterPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="quiz/:chapterId" element={<QuizPage />} />
            <Route path="exam" element={<ExamPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="algorithms" element={<AlgorithmsPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="evaluation" element={<CourseEvaluationPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="my-progress" element={<MyProgressPage />} />

            {/* Instructor routes */}
            <Route
              path="instructor"
              element={
                <InstructorRoute>
                  <InstructorDashboard />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/cohorts"
              element={
                <InstructorRoute>
                  <CohortsPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/cohorts/:id"
              element={
                <InstructorRoute>
                  <CohortDetailPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/osce"
              element={
                <InstructorRoute>
                  <OSCEPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/cohorts/:id/osce"
              element={
                <InstructorRoute>
                  <OSCEPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/osce/ttt"
              element={
                <InstructorRoute>
                  <TTTOSCEPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/cohorts/:id/epa"
              element={
                <InstructorRoute>
                  <EPAAssessmentPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/pilot"
              element={
                <InstructorRoute>
                  <PilotResultsPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content"
              element={
                <InstructorRoute>
                  <ContentManagementPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content/courses"
              element={
                <InstructorRoute>
                  <CourseBuilderPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content/course/:id"
              element={
                <InstructorRoute>
                  <CourseBuilderPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content/chapter/:id"
              element={
                <InstructorRoute>
                  <ChapterEditorPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content/questions"
              element={
                <InstructorRoute>
                  <AdminQuestionsPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/content/question/:id"
              element={
                <InstructorRoute>
                  <QuestionEditorPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/media"
              element={
                <InstructorRoute>
                  <MediaLibraryPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/at-risk"
              element={
                <InstructorRoute>
                  <AtRiskLearnersPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/reports"
              element={
                <InstructorRoute>
                  <ReportBuilderPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/export"
              element={
                <InstructorRoute>
                  <DataExportPage />
                </InstructorRoute>
              }
            />
            <Route
              path="instructor/cohort-comparison"
              element={
                <InstructorRoute>
                  <CohortComparisonPage />
                </InstructorRoute>
              }
            />

            {/* Organization portal routes */}
            <Route
              path="organization"
              element={
                <OrganizationRoute>
                  <OrganizationPortalPage />
                </OrganizationRoute>
              }
            />
            <Route
              path="organization/employees"
              element={
                <OrganizationRoute>
                  <OrganizationEmployeesPage />
                </OrganizationRoute>
              }
            />
            <Route
              path="organization/employees/:id"
              element={
                <OrganizationRoute>
                  <OrganizationEmployeeDetailPage />
                </OrganizationRoute>
              }
            />
            <Route
              path="organization/settings"
              element={
                <OrganizationRoute>
                  <OrganizationSettingsPage />
                </OrganizationRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/courses"
              element={
                <AdminRoute>
                  <AdminCoursesPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/questions"
              element={
                <AdminRoute>
                  <AdminQuestionsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/statistics"
              element={
                <AdminRoute>
                  <AdminStatisticsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <AdminRoute>
                  <AnalyticsDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/ab-tests"
              element={
                <AdminRoute>
                  <ABTestPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Toaster for notifications */}
      <Toaster />

      {/* Onboarding modal for new users */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Focus mode overlay */}
      <FocusMode />

      {/* PWA update and install prompts */}
      <UpdatePrompt />
      <InstallPrompt />
    </GamificationProvider>
  );
}

export default App;
