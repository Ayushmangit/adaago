import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Search,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { getPrograms } from "../../features/programs/programThunks";
import { getBatches } from "../../features/batches/batchThunks";
import { getStudents } from "../../features/students/studentThunks";

import { getBatchEnrollments } from "../../features/enrollments/enrollmentThunks";

import {
  bulkAttendance,
  createAttendance,
  getBatchAttendance,
  updateAttendance,
} from "../../features/attendance/attendanceThunks";

import type {
  Attendance,
  AttendanceStatus,
} from "../../features/attendance/attendanceTypes";

function AttendancePage() {
  const dispatch = useAppDispatch();

  const [programID, setProgramID] = useState("");
  const [batchID, setBatchID] = useState("");
  const [date, setDate] = useState(getToday());
  const [search, setSearch] = useState("");

  const { programs, loading: programsLoading } = useAppSelector(
    (state) => state.programs,
  );

  const { batches, loading: batchesLoading } = useAppSelector(
    (state) => state.batches,
  );

  const { students, loading: studentsLoading } = useAppSelector(
    (state) => state.students,
  );

  const { enrollments, loading: enrollmentsLoading } = useAppSelector(
    (state) => state.enrollments,
  );

  const {
    attendance,
    loading: attendanceLoading,
    creating,
    updating,
    bulkUpdating,
    error: attendanceError,
    bulkError,
  } = useAppSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getPrograms());
    dispatch(getBatches());
    dispatch(getStudents());
  }, [dispatch]);

  useEffect(() => {
    if (!batchID) return;

    dispatch(getBatchEnrollments(Number(batchID)));
  }, [dispatch, batchID]);

  useEffect(() => {
    if (!batchID || !date) return;

    dispatch(
      getBatchAttendance({
        batchID: Number(batchID),
        date,
      }),
    );
  }, [dispatch, batchID, date]);

  const filteredBatches = useMemo(() => {
    if (!programID) return [];

    return batches.filter(
      (batch) => batch.program_id === Number(programID) && batch.is_active,
    );
  }, [batches, programID]);

  const attendanceMap = useMemo(() => {
    const map = new Map<number, Attendance>();

    for (const record of attendance) {
      map.set(record.enrollment_id, record);
    }

    return map;
  }, [attendance]);

  const rows = useMemo(() => {
    if (!batchID) return [];

    return enrollments
      .filter((enrollment) => {
        if (enrollment.batch_id !== Number(batchID)) {
          return false;
        }

        return isEnrollmentValidForDate(
          enrollment.joined_at,
          enrollment.left_at,
          date,
        );
      })
      .map((enrollment) => {
        const student = students.find(
          (student) => student.id === enrollment.student_id,
        );

        return {
          enrollment,
          student,
          attendance: attendanceMap.get(enrollment.id) ?? null,
        };
      })
      .filter((row) => {
        if (!search.trim()) {
          return true;
        }

        const value = search.trim().toLowerCase();

        const fullName = row.student?.full_name?.toLowerCase() ?? "";

        const email = row.student?.email?.toLowerCase() ?? "";

        const username = row.student?.username?.toLowerCase() ?? "";

        return (
          fullName.includes(value) ||
          email.includes(value) ||
          username.includes(value)
        );
      });
  }, [enrollments, students, attendanceMap, batchID, date, search]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;

    for (const row of rows) {
      switch (row.attendance?.status) {
        case "present":
          present++;
          break;

        case "absent":
          absent++;
          break;

        case "leave":
          leave++;
          break;

        default:
          unmarked++;
      }
    }

    return {
      present,
      absent,
      leave,
      unmarked,
      total: rows.length,
    };
  }, [rows]);

  const selectedBatch = batches.find((batch) => batch.id === Number(batchID));

  const handleProgramChange = (value: string) => {
    setProgramID(value);
    setBatchID("");
  };

  const handleStatus = async (
    enrollmentID: number,
    status: AttendanceStatus,
    currentAttendance: Attendance | null,
  ) => {
    if (!date) return;

    if (currentAttendance?.status === status) {
      return;
    }

    if (currentAttendance) {
      await dispatch(
        updateAttendance({
          attendanceID: currentAttendance.id,

          payload: {
            status,

            ...(currentAttendance.remarks
              ? {
                  remarks: currentAttendance.remarks,
                }
              : {}),
          },
        }),
      );

      return;
    }

    await dispatch(
      createAttendance({
        enrollment_id: enrollmentID,
        attendance_date: date,
        status,
      }),
    );
  };

  const handleMarkAllPresent = async () => {
    if (!batchID || !date || rows.length === 0) {
      return;
    }

    const unmarkedRows = rows.filter((row) => !row.attendance);

    if (unmarkedRows.length === 0) {
      return;
    }

    await dispatch(
      bulkAttendance({
        batchID: Number(batchID),

        payload: {
          attendance_date: date,

          records: unmarkedRows.map((row) => ({
            enrollment_id: row.enrollment.id,

            status: "present" as const,
          })),
        },
      }),
    );
  };

  const loading = programsLoading || batchesLoading || studentsLoading;

  const registerLoading = enrollmentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <CalendarCheck className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Attendance
              </h1>

              <p className="text-sm text-gray-500">
                Manage daily batch attendance
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMarkAllPresent}
          disabled={
            !batchID ||
            rows.length === 0 ||
            summary.unmarked === 0 ||
            bulkUpdating
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserCheck className="h-4 w-4" />

          {bulkUpdating ? "Marking..." : "Mark unmarked present"}
        </button>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Program
            </label>

            <select
              value={programID}
              onChange={(event) => handleProgramChange(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500"
            >
              <option value="">Select program</option>

              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Batch
            </label>

            <select
              value={batchID}
              onChange={(event) => setBatchID(event.target.value)}
              disabled={!programID || batchesLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            >
              <option value="">Select batch</option>

              {filteredBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date
            </label>

            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Errors */}

      {(attendanceError || bulkError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bulkError ?? attendanceError}
        </div>
      )}

      {/* Summary */}

      {batchID && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Total" value={summary.total} />

          <SummaryCard label="Present" value={summary.present} />

          <SummaryCard label="Absent" value={summary.absent} />

          <SummaryCard label="Leave" value={summary.leave} />

          <SummaryCard label="Unmarked" value={summary.unmarked} />
        </div>
      )}

      {/* Register */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                Attendance Register
              </h2>

              {summary.total > 0 && summary.unmarked === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  <Check className="h-3 w-3" />
                  Complete
                </span>
              )}
            </div>

            {selectedBatch && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedBatch.name} · {formatDate(date)}
              </p>
            )}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-500"
            />
          </div>
        </div>

        {!batchID ? (
          <EmptyState message="Select a program and batch to view attendance." />
        ) : registerLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading attendance...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No students are enrolled in this batch for the selected date." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Student</th>

                  <th className="px-5 py-3">Joined</th>

                  <th className="px-5 py-3">Current status</th>

                  <th className="px-5 py-3 text-right">Mark attendance</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rows.map(
                  ({ enrollment, student, attendance: currentAttendance }) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student?.full_name ??
                              student?.username ??
                              `Student #${enrollment.student_id}`}
                          </p>

                          <p className="mt-0.5 text-sm text-gray-500">
                            {student?.email ?? "No email"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(enrollment.joined_at)}
                      </td>

                      <td className="px-5 py-4">
                        <AttendanceBadge status={currentAttendance?.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <StatusButton
                            label="Present"
                            active={currentAttendance?.status === "present"}
                            disabled={creating || updating || bulkUpdating}
                            onClick={() =>
                              handleStatus(
                                enrollment.id,
                                "present",
                                currentAttendance,
                              )
                            }
                          />

                          <StatusButton
                            label="Absent"
                            active={currentAttendance?.status === "absent"}
                            disabled={creating || updating || bulkUpdating}
                            onClick={() =>
                              handleStatus(
                                enrollment.id,
                                "absent",
                                currentAttendance,
                              )
                            }
                          />

                          <StatusButton
                            label="Leave"
                            active={currentAttendance?.status === "leave"}
                            disabled={creating || updating || bulkUpdating}
                            onClick={() =>
                              handleStatus(
                                enrollment.id,
                                "leave",
                                currentAttendance,
                              )
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

type StatusButtonProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function StatusButton({ label, active, disabled, onClick }: StatusButtonProps) {
  let icon = <UserMinus className="h-4 w-4" />;

  if (label === "Present") {
    icon = <UserCheck className="h-4 w-4" />;
  }

  if (label === "Absent") {
    icon = <UserX className="h-4 w-4" />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition",
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function AttendanceBadge({ status }: { status?: AttendanceStatus }) {
  if (!status) {
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        Unmarked
      </span>
    );
  }

  const styles: Record<AttendanceStatus, string> = {
    present: "bg-green-100 text-green-700",

    absent: "bg-red-100 text-red-700",

    leave: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 text-center">
      <CalendarCheck className="mx-auto h-9 w-9 text-gray-300" />

      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateOnly(value: string) {
  return value.split("T")[0];
}

function isEnrollmentValidForDate(
  joinedAt: string,
  leftAt: string | null | undefined,
  selectedDate: string,
) {
  const joinedDate = getDateOnly(joinedAt);

  if (selectedDate < joinedDate) {
    return false;
  }

  if (leftAt) {
    const leftDate = getDateOnly(leftAt);

    if (selectedDate > leftDate) {
      return false;
    }
  }

  return true;
}

export default AttendancePage;
