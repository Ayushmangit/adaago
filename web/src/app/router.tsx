import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "../App";

import LoginPage from "../pages/LoginPage";

import AdminDashboard from "../pages/admin/AdminDashboard";

import StudentDashboard from "../pages/student/StudentDashboard";
import ProtectedRoute from "../components/ProtectedRoutes";
import AdminLayout from "../Layouts/AdminLayout";
import StudentsPage from "../pages/admin/StudentsPage";
import ProgramsPage from "../pages/admin/ProgramsPage";
import BatchesPage from "../pages/admin/BatchesPage";
import EnrollmentsPage from "../pages/admin/EnrollmentsPage";
import StudentLayout from "../Layouts/StudentLayout";
import StudentProfilePage from "../pages/student/StudentProfilePage";
import StudentEnrollmentsPage from "../pages/student/StudentEnrollmentsPage";
import AttendancePage from "../pages/admin/AttendancePage";

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
        element: <LoginPage />,
      },

      // ADMIN
      {
        element: <ProtectedRoute role="admin" />,

        children: [
          {
            path: "admin",
            element: <AdminLayout />,

            children: [
              {
                index: true,
                element: <AdminDashboard />,
              },
              {
                path: "students",
                element: <StudentsPage />,
              },
              {
                path: "programs",
                element: <ProgramsPage />,
              },
              {
                path: "batches",
                element: <BatchesPage />,
              },
              {
                path: "enrollments",
                element: <EnrollmentsPage />,
              },
              {
                path: "attendance",
                element: <AttendancePage />,
              },
            ],
          },
        ],
      },

      // STUDENT
      {
        element: <ProtectedRoute role="student" />,

        children: [
          {
            path: "student",
            element: <StudentLayout />,

            children: [
              {
                index: true,
                element: <StudentDashboard />,
              },

              {
                path: "profile",
                element: <StudentProfilePage />,
              },

              {
                path: "enrollments",
                element: <StudentEnrollmentsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
