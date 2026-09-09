import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import type { UserRole } from "../features/auth/authTypes";

type ProtectedRouteProps = {
  role?: UserRole;
};

function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, accessToken } = useAppSelector((state) => state.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
