import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Save,
  Search,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getPrograms } from "../../features/programs/programThunks";
import { getBatches } from "../../features/batches/batchThunks";

import {
  bulkAttendance,
  getBatchAttendanceRegister,
} from "../../features/attendance/attendanceThunks";

import type {
  AttendanceRegisterRow,
  AttendanceStatus,
} from "../../features/attendance/attendanceTypes";

function AttendancePage() {
  const dispatch = useAppDispatch();

  const [programID, setProgramID] = useState("");
  const [batchID, setBatchID] = useState("");
  const [date, setDate] = useState(getToday());
  const [search, setSearch] = useState("");

  const [draftAttendance, setDraftAttendance] = useState<
    Record<number, AttendanceStatus>
  >({});

  const { programs, loading: programsLoading } = useAppSelector(
    (state) => state.programs,
  );

  const { batches, loading: batchesLoading } = useAppSelector(
    (state) => state.batches,
  );

  const { register, registerLoading, registerError, bulkUpdating, bulkError } =
    useAppSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getPrograms());
    dispatch(getBatches());
  }, [dispatch]);

  useEffect(() => {
    if (!batchID || !date) return;

    dispatch(
      getBatchAttendanceRegister({
        batchID: Number(batchID),
        date,
      }),
    );
  }, [dispatch, batchID, date]);

  useEffect(() => {
    setDraftAttendance({});
  }, [batchID, date]);

  const filteredBatches = useMemo(() => {
    if (!programID) return [];

    return batches.filter(
      (batch) => batch.program_id === Number(programID) && batch.is_active,
    );
  }, [batches, programID]);

  const rows = useMemo(() => {
    if (!search.trim()) return register;

    const value = search.trim().toLowerCase();

    return register.filter((row) => {
      return (
        row.full_name.toLowerCase().includes(value) ||
        row.email.toLowerCase().includes(value) ||
        row.username.toLowerCase().includes(value)
      );
    });
  }, [register, search]);

  const getRowStatus = (
    row: AttendanceRegisterRow,
  ): AttendanceStatus | null => {
    return draftAttendance[row.enrollment_id] ?? row.status;
  };

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;

    for (const row of register) {
      const status = draftAttendance[row.enrollment_id] ?? row.status;

      switch (status) {
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
      total: register.length,
    };
  }, [register, draftAttendance]);

  const selectedBatch = batches.find((batch) => batch.id === Number(batchID));

  const loading = programsLoading || batchesLoading;

  const unsavedChanges = Object.keys(draftAttendance).length;

  const handleProgramChange = (value: string) => {
    setProgramID(value);
    setBatchID("");
    setSearch("");
    setDraftAttendance({});
  };

  const handleBatchChange = (value: string) => {
    setBatchID(value);
    setSearch("");
    setDraftAttendance({});
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setSearch("");
    setDraftAttendance({});
  };

  const handleStatus = (enrollmentID: number, status: AttendanceStatus) => {
    const row = register.find((item) => item.enrollment_id === enrollmentID);

    if (!row) return;

    setDraftAttendance((current) => {
      const next = { ...current };

      if (row.status === status) {
        delete next[enrollmentID];
        return next;
      }

      next[enrollmentID] = status;

      return next;
    });
  };

  const handleMarkAllPresent = () => {
    if (!batchID || register.length === 0) return;

    setDraftAttendance((current) => {
      const next = { ...current };

      for (const row of register) {
        const currentStatus = current[row.enrollment_id] ?? row.status;

        if (!currentStatus) {
          next[row.enrollment_id] = "present";
        }
      }

      return next;
    });
  };

  const handleSubmitAttendance = async () => {
    if (!batchID || !date || unsavedChanges === 0) return;

    const records = Object.entries(draftAttendance).map(
      ([enrollmentID, status]) => ({
        enrollment_id: Number(enrollmentID),
        status,
      }),
    );

    try {
      await dispatch(
        bulkAttendance({
          batchID: Number(batchID),
          payload: {
            attendance_date: date,
            records,
          },
        }),
      ).unwrap();

      setDraftAttendance({});
    } catch {
      return;
    }
  };

  const handleDiscardChanges = () => {
    setDraftAttendance({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
            <CalendarCheck className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>

            <p className="text-sm text-gray-500">
              Manage daily batch attendance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {unsavedChanges > 0 && (
            <span className="text-sm font-medium text-amber-600">
              {unsavedChanges} unsaved{" "}
              {unsavedChanges === 1 ? "change" : "changes"}
            </span>
          )}

          {unsavedChanges > 0 && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={bulkUpdating}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={
              !batchID ||
              register.length === 0 ||
              summary.unmarked === 0 ||
              bulkUpdating
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            Mark unmarked present
          </button>

          <button
            type="button"
            onClick={handleSubmitAttendance}
            disabled={!batchID || unsavedChanges === 0 || bulkUpdating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {bulkUpdating ? "Saving..." : "Mark Attendance"}
          </button>
        </div>
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
              disabled={loading || bulkUpdating}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
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
              onChange={(event) => handleBatchChange(event.target.value)}
              disabled={!programID || batchesLoading || bulkUpdating}
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
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={bulkUpdating}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Errors */}
      {(registerError || bulkError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bulkError ?? registerError}
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

              {unsavedChanges > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Unsaved
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
                {rows.map((row) => {
                  const status = getRowStatus(row);

                  const changed =
                    draftAttendance[row.enrollment_id] !== undefined;

                  return (
                    <tr
                      key={row.enrollment_id}
                      className={`transition ${
                        changed ? "bg-amber-50/50" : "hover:bg-gray-50/60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {row.full_name || row.username}
                            </p>

                            {changed && (
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                          </div>

                          <p className="mt-0.5 text-sm text-gray-500">
                            {row.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(row.joined_at)}
                      </td>

                      <td className="px-5 py-4">
                        <AttendanceBadge status={status ?? undefined} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <StatusButton
                            label="Present"
                            active={status === "present"}
                            disabled={bulkUpdating}
                            onClick={() =>
                              handleStatus(row.enrollment_id, "present")
                            }
                          />

                          <StatusButton
                            label="Absent"
                            active={status === "absent"}
                            disabled={bulkUpdating}
                            onClick={() =>
                              handleStatus(row.enrollment_id, "absent")
                            }
                          />

                          <StatusButton
                            label="Leave"
                            active={status === "leave"}
                            disabled={bulkUpdating}
                            onClick={() =>
                              handleStatus(row.enrollment_id, "leave")
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

type AttendanceBadgeProps = {
  status?: AttendanceStatus;
};

function AttendanceBadge({ status }: AttendanceBadgeProps) {
  if (status === "present") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <UserCheck className="h-3.5 w-3.5" />
        Present
      </span>
    );
  }

  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        <UserX className="h-3.5 w-3.5" />
        Absent
      </span>
    );
  }

  if (status === "leave") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <UserMinus className="h-3.5 w-3.5" />
        Leave
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Unmarked
    </span>
  );
}

type StatusButtonProps = {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
};

function StatusButton({ label, active, disabled, onClick }: StatusButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {label}
    </button>
  );
}

type EmptyStateProps = {
  message: string;
};

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="p-10 text-center">
      <CalendarCheck className="mx-auto h-8 w-8 text-gray-300" />

      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().split("T")[0];
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default AttendancePage;
