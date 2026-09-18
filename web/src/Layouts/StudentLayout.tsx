import {
  CalendarCheck,
  Dumbbell,
  IndianRupee,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
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
      label: "Home",
      to: "/student",
      icon: <LayoutDashboard size={19} />,
      end: true,
    },
    {
      label: "Profile",
      to: "/student/profile",
      icon: <User size={19} />,
    },
    {
      label: "Enrollments",
      to: "/student/enrollments",
      icon: <Layers3 size={19} />,
    },
    {
      label: "Attendance",
      to: "/student/attendance",
      icon: <CalendarCheck size={19} />,
    },
    {
      label: "Fees",
      to: "/student/fees",
      icon: <IndianRupee size={19} />,
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-emerald-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col
          bg-emerald-950 text-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-emerald-950">
              <Dumbbell size={20} strokeWidth={2.5} />
            </div>

            <div>
              <p className="font-bold tracking-tight">ADAA FARMS</p>
              <p className="text-xs text-emerald-200/70">Sports Complex</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-emerald-100 hover:bg-white/10 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pb-2 pt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/50">
            My account
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-lime-400 text-emerald-950 shadow-sm"
                    : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-lime-300">
                {getInitials(user.username)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.username}
                </p>

                <p className="truncate text-xs text-emerald-200/60">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-100/70 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-stone-50/90 px-4 backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">Adaa Farms</p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Sports Complex
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <p className="hidden text-sm font-medium text-slate-700 sm:block">
                {user.username}
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-xs font-semibold text-lime-300">
                {getInitials(user.username)}
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  if (!value) return "S";

  const parts = value.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default StudentLayout;
