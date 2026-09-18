import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  IndianRupee,
  Layers3,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getDashboardSummary } from "../../features/dashboard/dashboardThunks";

function AdminDashboard() {
  const dispatch = useAppDispatch();

  const { summary, loading, error } = useAppSelector(
    (state) => state.dashboard,
  );

  useEffect(() => {
    dispatch(getDashboardSummary());
  }, [dispatch]);

  const batches = summary?.batches ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Overview</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            A quick look at students, programs, batches and daily operations.
          </p>
        </div>

        <Link
          to="/admin/attendance"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
        >
          <CalendarCheck size={17} />
          Mark attendance
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Active Students"
          value={loading ? "..." : (summary?.active_students ?? 0)}
          description={`${summary?.total_students ?? 0} total`}
          icon={<Users size={21} />}
        />

        <DashboardCard
          title="Active Programs"
          value={loading ? "..." : (summary?.active_programs ?? 0)}
          description={`${summary?.total_programs ?? 0} total`}
          icon={<Activity size={21} />}
        />

        <DashboardCard
          title="Active Batches"
          value={loading ? "..." : (summary?.active_batches ?? 0)}
          description={`${summary?.total_batches ?? 0} total`}
          icon={<Layers3 size={21} />}
        />

        <DashboardCard
          title="Total Capacity"
          value={loading ? "..." : (summary?.total_capacity ?? 0)}
          description="Across active batches"
          icon={<CalendarDays size={21} />}
        />
      </section>

      {/* Main content */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        {/* Batches */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="font-semibold text-slate-950">Active Batches</h2>

              <p className="mt-1 text-sm text-slate-500">
                Current schedules and available capacity.
              </p>
            </div>

            <Link
              to="/admin/batches"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center px-6 py-10">
              <p className="text-sm text-slate-500">Loading batches...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Layers3 size={23} />
              </div>

              <p className="mt-4 font-medium text-slate-800">
                No active batches
              </p>

              <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                Active batches will appear here once they are created.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop / tablet table */}

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Batch
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Schedule
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Capacity
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => (
                      <tr
                        key={batch.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {batch.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {batch.program_name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarDays
                              size={16}
                              className="text-emerald-700"
                            />

                            <span>
                              {formatTime(batch.start_time)} -{" "}
                              {formatTime(batch.end_time)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
                            {batch.capacity ?? "Unlimited"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}

              <div className="divide-y divide-slate-100 sm:hidden">
                {batches.map((batch) => (
                  <div key={batch.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {batch.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {batch.program_name}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {batch.capacity ?? "Unlimited"} capacity
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays size={16} className="text-emerald-700" />
                      {formatTime(batch.start_time)} -{" "}
                      {formatTime(batch.end_time)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-950">Quick Actions</h2>

            <p className="mt-1 text-sm text-slate-500">
              Frequently used admin tasks.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <QuickAction
              to="/admin/students"
              title="Students"
              description="Manage student accounts"
              icon={<UserPlus size={19} />}
            />

            <QuickAction
              to="/admin/enrollments"
              title="Enrollments"
              description="Assign students to batches"
              icon={<Users size={19} />}
            />

            <QuickAction
              to="/admin/attendance"
              title="Attendance"
              description="Record batch attendance"
              icon={<CalendarCheck size={19} />}
            />

            <QuickAction
              to="/admin/fees"
              title="Fees"
              description="Manage monthly dues"
              icon={<IndianRupee size={19} />}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
};

function DashboardCard({
  title,
  value,
  description,
  icon,
}: DashboardCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30 transition duration-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">{description}</p>
    </div>
  );
}

type QuickActionProps = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
};

function QuickAction({ to, title, description, icon }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-emerald-100 hover:bg-emerald-50/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-emerald-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>

        <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
      </div>

      <ArrowRight
        size={16}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
      />
    </Link>
  );
}

function formatTime(value: string) {
  if (!value) return "—";

  if (value.includes("T")) {
    return value.split("T")[1].slice(0, 5);
  }

  return value.slice(0, 5);
}

export default AdminDashboard;
