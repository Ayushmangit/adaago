import { CalendarDays, KeyRound, Layers3, Mail, User } from "lucide-react";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { getPrograms } from "../../features/programs/programThunks";

import { getBatches } from "../../features/batches/batchThunks";

import { getMyEnrollments } from "../../features/enrollments/enrollmentThunks";
import ChangePasswordModal from "../../components/ChangePasswordModal";

function StudentDashboard() {
  const dispatch = useAppDispatch();

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  const { programs } = useAppSelector((state) => state.programs);

  const { batches } = useAppSelector((state) => state.batches);

  const { enrollments, loading, error } = useAppSelector(
    (state) => state.enrollments,
  );

  useEffect(() => {
    dispatch(getPrograms());

    dispatch(getBatches());

    dispatch(getMyEnrollments());
  }, [dispatch]);

  const batchMap = useMemo(
    () => new Map(batches.map((batch) => [batch.id, batch])),
    [batches],
  );

  const programMap = useMemo(
    () => new Map(programs.map((program) => [program.id, program])),
    [programs],
  );

  const activeEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status === "active"),
    [enrollments],
  );

  const recentEnrollments = useMemo(
    () =>
      [...enrollments]
        .sort(
          (a, b) =>
            new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
        )
        .slice(0, 4),
    [enrollments],
  );

  return (
    <>
      <div className="space-y-8">
        {/* Header */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Welcome back
              {user?.username ? `, ${user.username}` : ""}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View your account and sports complex enrollments.
            </p>
          </div>

          <Link
            to="/student/profile"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <User size={18} />
            View Profile
          </Link>
        </section>

        {/* Summary */}

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Account"
            value={user?.email ?? "—"}
            description="Your registered email address"
            icon={<Mail size={20} />}
          />

          <SummaryCard
            title="Active Enrollments"
            value={loading ? "..." : activeEnrollments.length}
            description="Batches you are currently enrolled in"
            icon={<Layers3 size={20} />}
          />

          <SummaryCard
            title="Total Enrollments"
            value={loading ? "..." : enrollments.length}
            description="Active and previous enrollments"
            icon={<CalendarDays size={20} />}
          />
        </section>

        {/* Content */}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          {/* Enrollments */}

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">My Enrollments</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your latest sports complex enrollments.
                </p>
              </div>

              <Link
                to="/student/enrollments"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                View all
              </Link>
            </div>

            {loading && (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading enrollments...
              </div>
            )}

            {!loading && error && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && enrollments.length === 0 && (
              <div className="p-10 text-center">
                <Layers3 size={34} className="mx-auto text-gray-300" />

                <p className="mt-3 font-medium text-gray-700">
                  No enrollments yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  You have not been assigned to any batches yet.
                </p>
              </div>
            )}

            {!loading && !error && recentEnrollments.length > 0 && (
              <div className="divide-y divide-gray-100">
                {recentEnrollments.map((enrollment) => {
                  const batch = batchMap.get(enrollment.batch_id);

                  const program = batch
                    ? programMap.get(batch.program_id)
                    : undefined;

                  return (
                    <div key={enrollment.id} className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500">
                            {program?.name ?? "Program"}
                          </p>

                          <h3 className="mt-1 font-medium text-gray-900">
                            {batch?.name ?? `Batch #${enrollment.batch_id}`}
                          </h3>
                        </div>

                        <EnrollmentBadge status={enrollment.status} />
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Schedule
                          </p>

                          <p className="mt-1">
                            {batch
                              ? `${formatTime(batch.start_time)} - ${formatTime(
                                  batch.end_time,
                                )}`
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Days
                          </p>

                          <p className="mt-1">
                            {batch ? formatWeekdays(batch.weekdays) : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Joined
                          </p>

                          <p className="mt-1">
                            {formatDate(enrollment.joined_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar cards */}

          <div className="space-y-6">
            {/* Quick actions */}

            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="font-semibold text-gray-900">Quick Actions</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Access your student account options.
                </p>
              </div>

              <div className="space-y-3 p-4">
                <QuickActionLink
                  title="My Profile"
                  description="View your personal and account information."
                  to="/student/profile"
                  icon={<User size={20} />}
                />

                <QuickActionLink
                  title="My Enrollments"
                  description="View your active and previous batch enrollments."
                  to="/student/enrollments"
                  icon={<Layers3 size={20} />}
                />

                <QuickActionButton
                  title="Change Password"
                  description="Update the password used to access your account."
                  onClick={() => setChangePasswordOpen(true)}
                  icon={<KeyRound size={20} />}
                />
              </div>
            </section>

            {/* Profile notice */}

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-sm font-semibold text-gray-800">
                Profile Information
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Your student information is managed by the sports complex
                administration. Contact the administrator if any of your
                personal details need to be corrected.
              </p>
            </section>
          </div>
        </section>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">{icon}</div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-1 truncate text-xl font-semibold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Quick Action Link
|--------------------------------------------------------------------------
*/

function QuickActionLink({
  title,
  description,
  to,
  icon,
}: {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex w-full items-start gap-4 rounded-lg border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700 transition group-hover:bg-gray-200">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>

        <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| Quick Action Button
|--------------------------------------------------------------------------
*/

function QuickActionButton({
  title,
  description,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-lg border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700 transition group-hover:bg-gray-200">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>

        <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
      </div>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Enrollment Badge
|--------------------------------------------------------------------------
*/

function EnrollmentBadge({
  status,
}: {
  status: "active" | "completed" | "cancelled";
}) {
  const styles = {
    active: "bg-green-50 text-green-700",

    completed: "bg-blue-50 text-blue-700",

    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  if (!value) {
    return "—";
  }

  if (value.includes("T")) {
    const time = value.split("T")[1];

    return time.slice(0, 5);
  }

  return value.slice(0, 5);
}

function formatWeekdays(values: number[]) {
  const labels: Record<number, string> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };

  if (!values || values.length === 0) {
    return "—";
  }

  return values.map((value) => labels[value] ?? String(value)).join(", ");
}

export default StudentDashboard;
