import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
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

  const attendancePercentage = summary?.attendance_percent ?? 0;
  const pendingFees = summary?.pending_fees ?? 0;

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Welcome
              {summary?.full_name
                ? `, ${summary.full_name}`
                : user?.username
                  ? `, ${user.username}`
                  : ""}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Keep track of your sports batches, attendance and monthly fees at
              Adaa Farms.
            </p>
          </div>

          <Link
            to="/student/profile"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 sm:w-auto"
          >
            <User size={17} />
            My profile
          </Link>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            title="Active batches"
            value={loading ? "..." : (summary?.active_enrollments ?? 0)}
            description="Current enrollments"
            icon={<Layers3 size={19} />}
          />

          <SummaryCard
            title="Attendance"
            value={loading ? "..." : `${attendancePercentage.toFixed(1)}%`}
            description="Overall attendance"
            icon={<CalendarCheck size={19} />}
          />

          <SummaryCard
            title="Pending fees"
            value={loading ? "..." : pendingFees}
            description="Outstanding dues"
            icon={<ReceiptIndianRupee size={19} />}
          />

          <SummaryCard
            title="Amount due"
            value={
              loading ? "..." : formatMoney(summary?.pending_amount_paise ?? 0)
            }
            description="Outstanding amount"
            icon={<IndianRupee size={19} />}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <OverviewCard
            title="Attendance overview"
            description="Your attendance across all active and previous enrollments."
            link="/student/attendance"
            linkLabel="View attendance"
          >
            {loading ? (
              <LoadingState message="Loading attendance..." />
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                      {attendancePercentage.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Overall attendance
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <CalendarCheck size={22} />
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                    style={{
                      width: `${Math.min(attendancePercentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <AttendanceStat
                    label="Present"
                    value={summary?.present ?? 0}
                    variant="present"
                  />

                  <AttendanceStat
                    label="Absent"
                    value={summary?.absent ?? 0}
                    variant="absent"
                  />

                  <AttendanceStat
                    label="Leave"
                    value={summary?.leave ?? 0}
                    variant="leave"
                  />
                </div>
              </>
            )}
          </OverviewCard>

          <OverviewCard
            title="Fee overview"
            description="Your current outstanding monthly fee information."
            link="/student/fees"
            linkLabel="View fees"
          >
            {loading ? (
              <LoadingState message="Loading fees..." />
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                      {formatMoney(summary?.pending_amount_paise ?? 0)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Total amount due
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <IndianRupee size={22} />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Pending dues
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Monthly records awaiting payment.
                    </p>
                  </div>

                  <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white px-3 text-sm font-bold text-slate-900 shadow-sm">
                    {pendingFees}
                  </span>
                </div>

                {pendingFees === 0 && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        All clear
                      </p>

                      <p className="mt-0.5 text-sm text-emerald-700">
                        You currently have no outstanding fee dues.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </OverviewCard>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-slate-950">Quick access</h2>

            <p className="mt-1 text-sm text-slate-500">
              Everything you need from your student account.
            </p>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickActionLink
              title="My profile"
              description="Personal and account information."
              to="/student/profile"
              icon={<User size={19} />}
            />

            <QuickActionLink
              title="Enrollments"
              description="Current and previous sports batches."
              to="/student/enrollments"
              icon={<Layers3 size={19} />}
            />

            <QuickActionLink
              title="Attendance"
              description="Attendance records and history."
              to="/student/attendance"
              icon={<CalendarCheck size={19} />}
            />

            <QuickActionLink
              title="Fees"
              description="Monthly dues and payment history."
              to="/student/fees"
              icon={<ReceiptIndianRupee size={19} />}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Account security
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  Use a strong password that you do not use for another account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 sm:w-auto"
            >
              Change password
            </button>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 hidden text-xs text-slate-400 sm:block">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  title,
  description,
  link,
  linkLabel,
  children,
}: {
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>

        <Link
          to={link}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900 sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="p-4 sm:p-5">
        {children}

        <Link
          to={link}
          className="mt-5 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-slate-50 text-sm font-semibold text-emerald-800 sm:hidden"
        >
          {linkLabel}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

function AttendanceStat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "present" | "absent" | "leave";
}) {
  const styles = {
    present: "bg-emerald-50 text-emerald-900",
    absent: "bg-red-50 text-red-900",
    leave: "bg-amber-50 text-amber-900",
  };

  const labelStyles = {
    present: "text-emerald-600",
    absent: "text-red-500",
    leave: "text-amber-600",
  };

  return (
    <div className={`rounded-xl p-3 text-center ${styles[variant]}`}>
      <p className="text-xl font-semibold">{value}</p>

      <p className={`mt-1 text-xs font-medium ${labelStyles[variant]}`}>
        {label}
      </p>
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
      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      <div className="shrink-0 rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm transition group-hover:text-emerald-800">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>

          <ArrowRight
            size={15}
            className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
          />
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
      {message}
    </div>
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
