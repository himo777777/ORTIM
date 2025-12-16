import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';

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
const VerifyCertificatePage = lazy(() => import('@/pages/public/VerifyCertificatePage'));

// Instructor pages
const InstructorDashboard = lazy(() => import('@/pages/instructor/InstructorDashboard'));
const CohortsPage = lazy(() => import('@/pages/instructor/CohortsPage'));
const CohortDetailPage = lazy(() => import('@/pages/instructor/CohortDetailPage'));
const OSCEPage = lazy(() => import('@/pages/instructor/OSCEPage'));

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

function App() {
  return (
    <>
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
            <Route path="chapter/:slug" element={<ChapterPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="quiz/:chapterId" element={<QuizPage />} />
            <Route path="exam" element={<ExamPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="algorithms" element={<AlgorithmsPage />} />
            <Route path="certificates" element={<CertificatesPage />} />

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
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
