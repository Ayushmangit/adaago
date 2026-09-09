import { LayoutDashboard, Layers3, LogOut, Menu, User, X } from "lucide-react";

import { useState, type ReactNode } from "react";

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
};

function StudentLayout() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      to: "/student",
      icon: <LayoutDashboard size={19} />,
      end: true,
    },

    {
      label: "My Profile",
      to: "/student/profile",
      icon: <User size={19} />,
    },

    {
      label: "My Enrollments",
      to: "/student/enrollments",
      icon: <Layers3 size={19} />,
    },
  ];

  const handleLogout = () => {
    dispatch(logout());

    navigate("/login", {
      replace: true,
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}

      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-gray-200 bg-white
          transition-transform duration-200
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Branding */}

        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AdaaGo</h1>

            <p className="text-xs text-gray-500">Student Portal</p>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `
                  flex items-center gap-3 rounded-lg px-3 py-2.5
                  text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                  `
              }
            >
              {item.icon}

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Account section */}

        <div className="border-t border-gray-200 p-3">
          {user && (
            <div className="mb-3 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                  {getInitials(user.username)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.username}
                  </p>

                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}

      <div className="lg:pl-64">
        {/* Topbar */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm font-medium text-gray-900">
                Sports Complex
              </p>

              <p className="hidden text-xs text-gray-500 sm:block">
                Student Portal
              </p>
            </div>
          </div>

          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.username}
              </p>

              <p className="text-xs capitalize text-gray-500">{user.role}</p>
            </div>
          )}
        </header>

        {/* Child page */}

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  if (!value) {
    return "S";
  }

  const parts = value.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default StudentLayout;
