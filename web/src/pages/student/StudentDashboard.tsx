import {
  CalendarCheck,
  IndianRupee,
  KeyRound,
  Layers3,
  ReceiptIndianRupee,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { getStudentDashboard } from "../../features/studentDashboard/studentDashboardThunks";

function StudentDashboard() {
  const dispatch = useAppDispatch();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const { summary, loading, error } = useAppSelector(
    (state) => state.studentDashboard,
  );

  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Welcome back
              {summary?.full_name
                ? `, ${summary.full_name}`
                : user?.username
                  ? `, ${user.username}`
                  : ""}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View your enrollments, attendance and fee information.
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

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Active Enrollments"
            value={loading ? "..." : (summary?.active_enrollments ?? 0)}
            description="Current sports batches"
            icon={<Layers3 size={20} />}
          />

          <SummaryCard
            title="Attendance"
            value={
              loading
                ? "..."
                : `${(summary?.attendance_percent ?? 0).toFixed(1)}%`
            }
            description={
              loading
                ? "Loading attendance"
                : `${summary?.present ?? 0} present · ${summary?.absent ?? 0} absent`
            }
            icon={<CalendarCheck size={20} />}
          />

          <SummaryCard
            title="Pending Fees"
            value={loading ? "..." : (summary?.pending_fees ?? 0)}
            description="Outstanding monthly dues"
            icon={<ReceiptIndianRupee size={20} />}
          />

          <SummaryCard
            title="Amount Due"
            value={
              loading ? "..." : formatMoney(summary?.pending_amount_paise ?? 0)
            }
            description="Total outstanding amount"
            icon={<IndianRupee size={20} />}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Attendance Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your overall attendance across all enrollments.
              </p>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading attendance...
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-gray-900">
                        {(summary?.attendance_percent ?? 0).toFixed(1)}%
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Overall attendance
                      </p>
                    </div>

                    <Link
                      to="/student/attendance"
                      className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      View attendance
                    </Link>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all"
                      style={{
                        width: `${Math.min(
                          summary?.attendance_percent ?? 0,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <AttendanceStat
                      label="Present"
                      value={summary?.present ?? 0}
                    />

                    <AttendanceStat
                      label="Absent"
                      value={summary?.absent ?? 0}
                    />

                    <AttendanceStat label="Leave" value={summary?.leave ?? 0} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Fee Overview</h2>

              <p className="mt-1 text-sm text-gray-500">
                Your current outstanding fee information.
              </p>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading fees...
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-gray-900">
                        {formatMoney(summary?.pending_amount_paise ?? 0)}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Total amount due
                      </p>
                    </div>

                    <Link
                      to="/student/fees"
                      className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      View fees
                    </Link>
                  </div>

                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Pending dues
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Monthly fee records awaiting payment.
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                        {summary?.pending_fees ?? 0}
                      </span>
                    </div>
                  </div>

                  {(summary?.pending_fees ?? 0) === 0 && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                      You currently have no outstanding fee dues.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>

            <p className="mt-1 text-sm text-gray-500">
              Access your student information.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickActionLink
              title="My Profile"
              description="View your personal and account information."
              to="/student/profile"
              icon={<User size={20} />}
            />

            <QuickActionLink
              title="My Enrollments"
              description="View your current and previous sports batches."
              to="/student/enrollments"
              icon={<Layers3 size={20} />}
            />

            <QuickActionLink
              title="My Attendance"
              description="View your attendance records and history."
              to="/student/attendance"
              icon={<CalendarCheck size={20} />}
            />

            <QuickActionLink
              title="My Fees"
              description="View pending and previous monthly fee dues."
              to="/student/fees"
              icon={<ReceiptIndianRupee size={20} />}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-sm font-semibold text-gray-800">
              Profile Information
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Your student information is managed by the sports complex
              administration. Contact the administrator if any personal details
              need to be corrected.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white p-2.5 text-gray-700">
                <KeyRound size={20} />
              </div>

              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-800">
                  Account Security
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Keep your account secure by using a password that you do not
                  use elsewhere.
                </p>

                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="mt-4 text-sm font-medium text-gray-800 hover:text-gray-950"
                >
                  Change password
                </button>
              </div>
            </div>
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

function AttendanceStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

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
      className="group flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
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

function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default StudentDashboard;
