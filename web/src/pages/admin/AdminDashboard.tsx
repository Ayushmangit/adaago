import { Activity, CalendarDays, Layers3, UserPlus, Users } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your sports complex ERP.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Active Students"
          value={loading ? "..." : (summary?.active_students ?? 0)}
          description={`${summary?.total_students ?? 0} total students`}
          icon={<Users size={20} />}
        />

        <DashboardCard
          title="Active Programs"
          value={loading ? "..." : (summary?.active_programs ?? 0)}
          description={`${summary?.total_programs ?? 0} total programs`}
          icon={<Activity size={20} />}
        />

        <DashboardCard
          title="Active Batches"
          value={loading ? "..." : (summary?.active_batches ?? 0)}
          description={`${summary?.total_batches ?? 0} total batches`}
          icon={<Layers3 size={20} />}
        />

        <DashboardCard
          title="Managed Capacity"
          value={loading ? "..." : (summary?.total_capacity ?? 0)}
          description="Across active batches"
          icon={<CalendarDays size={20} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">Active Batches</h2>

              <p className="mt-1 text-sm text-gray-500">
                Current batch availability and schedules.
              </p>
            </div>

            <Link
              to="/admin/batches"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading batches...
            </div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center">
              <Layers3 size={32} className="mx-auto text-gray-300" />

              <p className="mt-3 font-medium text-gray-700">
                No active batches
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create a batch to start managing enrollments.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {batch.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {batch.program_name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {formatTime(batch.start_time)} -{" "}
                      {formatTime(batch.end_time)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Capacity: {batch.capacity ?? "Unlimited"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>

            <p className="mt-1 text-sm text-gray-500">Common admin tasks.</p>
          </div>

          <div className="space-y-3 p-5">
            <QuickAction
              to="/admin/students"
              title="Manage Students"
              description="Create and manage student accounts."
              icon={<UserPlus size={19} />}
            />

            <QuickAction
              to="/admin/programs"
              title="Manage Programs"
              description="Configure sports and services."
              icon={<Activity size={19} />}
            />

            <QuickAction
              to="/admin/batches"
              title="Manage Batches"
              description="Configure schedules, fees and capacity."
              icon={<Layers3 size={19} />}
            />

            <QuickAction
              to="/admin/enrollments"
              title="Manage Enrollments"
              description="Assign students to active batches."
              icon={<Users size={19} />}
            />
          </div>
        </div>
      </div>
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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">{icon}</div>
      </div>

      <p className="mt-3 text-xs text-gray-500">{description}</p>
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
      className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
    >
      <div className="rounded-lg bg-gray-100 p-2 text-gray-700">{icon}</div>

      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
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
