import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "../App";
import ProtectedRoute from "../components/ProtectedRoutes";

const StudentFeesPage = lazy(() => import("../pages/student/StudentFeesPage"));
const FeesPage = lazy(() => import("../pages/admin/FeesPage.tsx"));

const LoginPage = lazy(() => import("../pages/LoginPage"));

const AdminLayout = lazy(() => import("../Layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const StudentsPage = lazy(() => import("../pages/admin/StudentsPage"));
const ProgramsPage = lazy(() => import("../pages/admin/ProgramsPage"));
const BatchesPage = lazy(() => import("../pages/admin/BatchesPage"));
const EnrollmentsPage = lazy(() => import("../pages/admin/EnrollmentsPage"));
const AttendancePage = lazy(() => import("../pages/admin/AttendancePage"));

const StudentAttendancePage = lazy(
  () => import("../pages/student/StudentAttendancePage"),
);

const StudentLayout = lazy(() => import("../Layouts/StudentLayout"));
const StudentDashboard = lazy(
  () => import("../pages/student/StudentDashboard"),
);
const StudentProfilePage = lazy(
  () => import("../pages/student/StudentProfilePage"),
);
const StudentEnrollmentsPage = lazy(
  () => import("../pages/student/StudentEnrollmentsPage"),
);

function PageLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Loading...</p>
    </main>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,

    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },

      {
        path: "login",
        element: (
          <LazyPage>
            <LoginPage />
          </LazyPage>
        ),
      },

      {
        element: <ProtectedRoute role="admin" />,

        children: [
          {
            path: "admin",
            element: (
              <LazyPage>
                <AdminLayout />
              </LazyPage>
            ),

            children: [
              {
                index: true,
                element: (
                  <LazyPage>
                    <AdminDashboard />
                  </LazyPage>
                ),
              },
              {
                path: "students",
                element: (
                  <LazyPage>
                    <StudentsPage />
                  </LazyPage>
                ),
              },
              {
                path: "programs",
                element: (
                  <LazyPage>
                    <ProgramsPage />
                  </LazyPage>
                ),
              },
              {
                path: "batches",
                element: (
                  <LazyPage>
                    <BatchesPage />
                  </LazyPage>
                ),
              },
              {
                path: "enrollments",
                element: (
                  <LazyPage>
                    <EnrollmentsPage />
                  </LazyPage>
                ),
              },
              {
                path: "attendance",
                element: (
                  <LazyPage>
                    <AttendancePage />
                  </LazyPage>
                ),
              },
              {
                path: "fees",
                element: (
                  <Suspense fallback={<div>Loading...</div>}>
                    <FeesPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },

      {
        element: <ProtectedRoute role="student" />,

        children: [
          {
            path: "student",
            element: (
              <LazyPage>
                <StudentLayout />
              </LazyPage>
            ),

            children: [
              {
                index: true,
                element: (
                  <LazyPage>
                    <StudentDashboard />
                  </LazyPage>
                ),
              },
              {
                path: "profile",
                element: (
                  <LazyPage>
                    <StudentProfilePage />
                  </LazyPage>
                ),
              },
              {
                path: "enrollments",
                element: (
                  <LazyPage>
                    <StudentEnrollmentsPage />
                  </LazyPage>
                ),
              },
              {
                path: "attendance",
                element: (
                  <LazyPage>
                    <StudentAttendancePage />
                  </LazyPage>
                ),
              },
              {
                path: "fees",
                element: (
                  <LazyPage>
                    <StudentFeesPage />
                  </LazyPage>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
