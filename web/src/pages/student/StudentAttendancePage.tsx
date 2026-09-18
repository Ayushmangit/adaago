import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleMinus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo } from "react";

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
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-gray-500">Attendance</p>

        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          My Attendance
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View your attendance summary and previous attendance records.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Attendance"
          value={loading ? "..." : `${summary.percentage.toFixed(1)}%`}
          description="Overall attendance percentage"
          icon={<CalendarCheck size={20} />}
        />

        <SummaryCard
          title="Present"
          value={loading ? "..." : summary.present}
          description="Sessions attended"
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          title="Absent"
          value={loading ? "..." : summary.absent}
          description="Sessions missed"
          icon={<XCircle size={20} />}
        />

        <SummaryCard
          title="Leave"
          value={loading ? "..." : summary.leave}
          description="Approved leave sessions"
          icon={<CircleMinus size={20} />}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Attendance History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your recorded attendance across all enrollments.
              </p>
            </div>

            {!loading && (
              <span className="text-sm text-gray-500">
                {summary.total} {summary.total === 1 ? "record" : "records"}
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading attendance...
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="p-12 text-center">
            <CalendarDays size={36} className="mx-auto text-gray-300" />

            <p className="mt-3 font-medium text-gray-700">
              No attendance records
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Your attendance will appear here after it has been marked by the
              administration.
            </p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Remarks</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => (
                    <AttendanceRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
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

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">{icon}</div>

        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function AttendanceRow({ record }: { record: Attendance }) {
  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-gray-900">
          {formatDate(record.attendance_date)}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {formatWeekday(record.attendance_date)}
        </p>
      </td>

      <td className="px-5 py-4">
        <AttendanceBadge status={record.status} />
      </td>

      <td className="px-5 py-4 text-sm text-gray-500">
        {record.remarks || "—"}
      </td>
    </tr>
  );
}

function AttendanceMobileCard({ record }: { record: Attendance }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">
            {formatDate(record.attendance_date)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {formatWeekday(record.attendance_date)}
          </p>
        </div>

        <AttendanceBadge status={record.status} />
      </div>

      {record.remarks && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Remarks
          </p>

          <p className="mt-1 text-sm text-gray-600">{record.remarks}</p>
        </div>
      )}
    </div>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const styles: Record<AttendanceStatus, string> = {
    present: "bg-green-50 text-green-700",
    absent: "bg-red-50 text-red-700",
    leave: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
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
