import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleMinus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getMyAttendance } from "../../features/attendance/attendanceThunks";
import type {
  Attendance,
  AttendanceStatus,
} from "../../features/attendance/attendanceTypes";

function StudentAttendancePage() {
  const dispatch = useAppDispatch();

  const { attendance, loading, error } = useAppSelector(
    (state) => state.attendance,
  );

  useEffect(() => {
    dispatch(getMyAttendance());
  }, [dispatch]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    for (const record of attendance) {
      if (record.status === "present") present++;
      if (record.status === "absent") absent++;
      if (record.status === "leave") leave++;
    }

    const total = present + absent + leave;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return {
      total,
      present,
      absent,
      leave,
      percentage,
    };
  }, [attendance]);

  const records = useMemo(
    () =>
      [...attendance].sort(
        (a, b) =>
          new Date(b.attendance_date).getTime() -
          new Date(a.attendance_date).getTime(),
      ),
    [attendance],
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Training Record
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          My Attendance
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Track your attendance across your Adaa Farms sports sessions.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Attendance"
          value={loading ? "..." : `${summary.percentage.toFixed(1)}%`}
          description="Overall percentage"
          icon={<CalendarCheck size={19} />}
          variant="primary"
        />

        <SummaryCard
          title="Present"
          value={loading ? "..." : summary.present}
          description="Sessions attended"
          icon={<CheckCircle2 size={19} />}
          variant="present"
        />

        <SummaryCard
          title="Absent"
          value={loading ? "..." : summary.absent}
          description="Sessions missed"
          icon={<XCircle size={19} />}
          variant="absent"
        />

        <SummaryCard
          title="Leave"
          value={loading ? "..." : summary.leave}
          description="Approved leave"
          icon={<CircleMinus size={19} />}
          variant="leave"
        />
      </section>

      {!loading && summary.total > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Overall attendance
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Based on {summary.total} recorded{" "}
                {summary.total === 1 ? "session" : "sessions"}.
              </p>
            </div>

            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              {summary.percentage.toFixed(1)}%
            </p>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-700 transition-all duration-500"
              style={{
                width: `${Math.min(summary.percentage, 100)}%`,
              }}
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-950">Attendance history</h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recorded attendance across all enrollments.
            </p>
          </div>

          {!loading && (
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {summary.total} {summary.total === 1 ? "record" : "records"}
            </span>
          )}
        </div>

        {loading && (
          <PageState
            icon={<CalendarCheck size={23} />}
            title="Loading attendance..."
          />
        )}

        {!loading && !error && records.length === 0 && (
          <PageState
            icon={<CalendarDays size={23} />}
            title="No attendance records"
            description="Your attendance will appear here after it has been marked by the administration."
          />
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Remarks</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <AttendanceRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {records.map((record) => (
                <AttendanceMobileCard key={record.id} record={record} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

type SummaryVariant = "primary" | "present" | "absent" | "leave";

function SummaryCard({
  title,
  value,
  description,
  icon,
  variant,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  variant: SummaryVariant;
}) {
  const iconStyles: Record<SummaryVariant, string> = {
    primary: "bg-emerald-50 text-emerald-700",
    present: "bg-emerald-50 text-emerald-700",
    absent: "bg-red-50 text-red-600",
    leave: "bg-amber-50 text-amber-700",
  };

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

        <div className={`shrink-0 rounded-xl p-2.5 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function AttendanceRow({ record }: { record: Attendance }) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">
          {formatDate(record.attendance_date)}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatWeekday(record.attendance_date)}
        </p>
      </td>

      <td className="px-5 py-4">
        <AttendanceBadge status={record.status} />
      </td>

      <td className="max-w-md px-5 py-4 text-sm leading-6 text-slate-500">
        {record.remarks || "—"}
      </td>
    </tr>
  );
}

function AttendanceMobileCard({ record }: { record: Attendance }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CalendarDays size={18} />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              {formatDate(record.attendance_date)}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {formatWeekday(record.attendance_date)}
            </p>
          </div>
        </div>

        <AttendanceBadge status={record.status} />
      </div>

      {record.remarks && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Remarks
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {record.remarks}
          </p>
        </div>
      )}
    </article>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const styles: Record<AttendanceStatus, string> = {
    present: "bg-emerald-50 text-emerald-700",
    absent: "bg-red-50 text-red-700",
    leave: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PageState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="p-10 text-center sm:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <p className="mt-4 font-semibold text-slate-800">{title}</p>

      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
  }).format(new Date(value));
}

export default StudentAttendancePage;
