import { useEffect, useMemo, useState, type ReactNode } from "react";
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
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Daily Operations
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Attendance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Record and manage daily attendance for Adaa Farms batches.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {unsavedChanges > 0 && (
            <div className="mr-1 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 sm:bg-transparent sm:px-0">
              <span>
                {unsavedChanges} unsaved{" "}
                {unsavedChanges === 1 ? "change" : "changes"}
              </span>

              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
          )}

          {unsavedChanges > 0 && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={bulkUpdating}
              className={secondaryButtonClass}
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
            className={secondaryButtonClass}
          >
            <UserCheck size={16} />
            Mark unmarked present
          </button>

          <button
            type="button"
            onClick={handleSubmitAttendance}
            disabled={!batchID || unsavedChanges === 0 || bulkUpdating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={16} />
            {bulkUpdating ? "Saving..." : "Save attendance"}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <FilterField label="Program">
            <select
              value={programID}
              onChange={(event) => handleProgramChange(event.target.value)}
              disabled={loading || bulkUpdating}
              className={inputClass}
            >
              <option value="">Select program</option>

              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Batch">
            <select
              value={batchID}
              onChange={(event) => handleBatchChange(event.target.value)}
              disabled={!programID || batchesLoading || bulkUpdating}
              className={inputClass}
            >
              <option value="">Select batch</option>

              {filteredBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Attendance date">
            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={bulkUpdating}
              className={inputClass}
            />
          </FilterField>
        </div>
      </section>

      {(registerError || bulkError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bulkError ?? registerError}
        </div>
      )}

      {batchID && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard
            label="Students"
            value={summary.total}
            icon={<CalendarCheck size={18} />}
          />

          <SummaryCard
            label="Present"
            value={summary.present}
            icon={<UserCheck size={18} />}
            variant="present"
          />

          <SummaryCard
            label="Absent"
            value={summary.absent}
            icon={<UserX size={18} />}
            variant="absent"
          />

          <SummaryCard
            label="Leave"
            value={summary.leave}
            icon={<UserMinus size={18} />}
            variant="leave"
          />

          <div className="col-span-2 lg:col-span-1">
            <SummaryCard
              label="Unmarked"
              value={summary.unmarked}
              icon={<Check size={18} />}
              variant="unmarked"
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-950">
                Attendance register
              </h2>

              {summary.total > 0 && summary.unmarked === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Check size={12} />
                  Complete
                </span>
              )}

              {unsavedChanges > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Unsaved changes
                </span>
              )}
            </div>

            {selectedBatch && (
              <p className="mt-1 text-sm text-slate-500">
                {selectedBatch.name} · {formatDate(date)}
              </p>
            )}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student..."
              className={searchClass}
            />
          </div>
        </div>

        {!batchID ? (
          <EmptyState message="Select a program and batch to view attendance." />
        ) : registerLoading ? (
          <EmptyState message="Loading attendance..." />
        ) : rows.length === 0 ? (
          <EmptyState message="No students are enrolled in this batch for the selected date." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <TableHeader>Student</TableHeader>
                    <TableHeader>Joined</TableHeader>
                    <TableHeader>Current status</TableHeader>
                    <TableHeader align="right">Mark attendance</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const status = getRowStatus(row);

                    const changed =
                      draftAttendance[row.enrollment_id] !== undefined;

                    return (
                      <tr
                        key={row.enrollment_id}
                        className={`transition ${
                          changed ? "bg-amber-50/40" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              name={row.full_name || row.username}
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {row.full_name || row.username}
                                </p>

                                {changed && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-amber-500"
                                    title="Unsaved change"
                                  />
                                )}
                              </div>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {row.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(row.joined_at)}
                        </td>

                        <td className="px-5 py-4">
                          <AttendanceBadge status={status ?? undefined} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <StatusButton
                              status="present"
                              active={status === "present"}
                              disabled={bulkUpdating}
                              onClick={() =>
                                handleStatus(row.enrollment_id, "present")
                              }
                            />

                            <StatusButton
                              status="absent"
                              active={status === "absent"}
                              disabled={bulkUpdating}
                              onClick={() =>
                                handleStatus(row.enrollment_id, "absent")
                              }
                            />

                            <StatusButton
                              status="leave"
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

            <div className="divide-y divide-slate-100 md:hidden">
              {rows.map((row) => {
                const status = getRowStatus(row);

                const changed =
                  draftAttendance[row.enrollment_id] !== undefined;

                return (
                  <article
                    key={row.enrollment_id}
                    className={`p-4 ${changed ? "bg-amber-50/30" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar name={row.full_name || row.username} />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-900">
                              {row.full_name || row.username}
                            </p>

                            {changed && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {row.email}
                          </p>
                        </div>
                      </div>

                      <AttendanceBadge status={status ?? undefined} />
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-xs text-slate-400">Joined</p>

                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(row.joined_at)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <StatusButton
                        status="present"
                        active={status === "present"}
                        disabled={bulkUpdating}
                        onClick={() =>
                          handleStatus(row.enrollment_id, "present")
                        }
                      />

                      <StatusButton
                        status="absent"
                        active={status === "absent"}
                        disabled={bulkUpdating}
                        onClick={() =>
                          handleStatus(row.enrollment_id, "absent")
                        }
                      />

                      <StatusButton
                        status="leave"
                        active={status === "leave"}
                        disabled={bulkUpdating}
                        onClick={() => handleStatus(row.enrollment_id, "leave")}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

type SummaryVariant = "default" | "present" | "absent" | "leave" | "unmarked";

function SummaryCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  variant?: SummaryVariant;
}) {
  const iconStyles: Record<SummaryVariant, string> = {
    default: "bg-emerald-50 text-emerald-700",
    present: "bg-emerald-50 text-emerald-700",
    absent: "bg-red-50 text-red-600",
    leave: "bg-amber-50 text-amber-700",
    unmarked: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className={`rounded-xl p-2.5 ${iconStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}

function StudentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-800">
      {getInitials(name)}
    </div>
  );
}

function AttendanceBadge({ status }: { status?: AttendanceStatus }) {
  if (status === "present") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <UserCheck size={13} />
        Present
      </span>
    );
  }

  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <UserX size={13} />
        Absent
      </span>
    );
  }

  if (status === "leave") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <UserMinus size={13} />
        Leave
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      Unmarked
    </span>
  );
}

function StatusButton({
  status,
  active,
  disabled,
  onClick,
}: {
  status: AttendanceStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const labels: Record<AttendanceStatus, string> = {
    present: "Present",
    absent: "Absent",
    leave: "Leave",
  };

  const activeStyles: Record<AttendanceStatus, string> = {
    present: "border-emerald-700 bg-emerald-700 text-white",
    absent: "border-red-600 bg-red-600 text-white",
    leave: "border-amber-600 bg-amber-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-10 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? activeStyles[status]
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      {labels[status]}
    </button>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-10 text-center sm:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <CalendarCheck size={23} />
      </div>

      <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const searchClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40";

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().split("T")[0];
}

function formatDate(value: string) {
  if (!value) return "—";

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

function getInitials(name: string) {
  const values = name.trim().split(/\s+/);

  if (values.length === 0 || !values[0]) return "ST";

  if (values.length === 1) {
    return values[0].slice(0, 2).toUpperCase();
  }

  return (values[0][0] + values[values.length - 1][0]).toUpperCase();
}

export default AttendancePage;
