import { CalendarDays, Clock3, IndianRupee, Layers3 } from "lucide-react";

import { useEffect, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { getPrograms } from "../../features/programs/programThunks";

import { getBatches } from "../../features/batches/batchThunks";

import { getMyEnrollments } from "../../features/enrollments/enrollmentThunks";

function StudentEnrollmentsPage() {
  const dispatch = useAppDispatch();

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

  const historicalEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status !== "active"),
    [enrollments],
  );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Enrollments</h1>

        <p className="mt-1 text-sm text-gray-500">
          View your active and previous sports complex enrollments.
        </p>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Active Enrollments"
          value={loading ? "..." : activeEnrollments.length}
          icon={<Layers3 size={20} />}
        />

        <SummaryCard
          label="Total Enrollments"
          value={loading ? "..." : enrollments.length}
          icon={<CalendarDays size={20} />}
        />
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading enrollments...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Layers3 size={34} className="mx-auto text-gray-300" />

          <p className="mt-3 font-medium text-gray-700">No enrollments yet</p>

          <p className="mt-1 text-sm text-gray-500">
            You have not been assigned to any batches yet.
          </p>
        </div>
      )}

      {!loading && !error && activeEnrollments.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Active Enrollments</h2>

            <p className="mt-1 text-sm text-gray-500">
              Batches you are currently enrolled in.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeEnrollments.map((enrollment) => {
              const batch = batchMap.get(enrollment.batch_id);

              const program = batch
                ? programMap.get(batch.program_id)
                : undefined;

              return (
                <EnrollmentCard
                  key={enrollment.id}
                  programName={program?.name ?? "Program"}
                  batchName={batch?.name ?? `Batch #${enrollment.batch_id}`}
                  status={enrollment.status}
                  joinedAt={enrollment.joined_at}
                  leftAt={enrollment.left_at}
                  startTime={batch?.start_time}
                  endTime={batch?.end_time}
                  weekdays={batch?.weekdays}
                  monthlyFeePaise={batch?.monthly_fee_paise}
                />
              );
            })}
          </div>
        </section>
      )}

      {!loading && !error && historicalEnrollments.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Previous Enrollments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Completed and cancelled enrollments.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {historicalEnrollments.map((enrollment) => {
              const batch = batchMap.get(enrollment.batch_id);

              const program = batch
                ? programMap.get(batch.program_id)
                : undefined;

              return (
                <EnrollmentCard
                  key={enrollment.id}
                  programName={program?.name ?? "Program"}
                  batchName={batch?.name ?? `Batch #${enrollment.batch_id}`}
                  status={enrollment.status}
                  joinedAt={enrollment.joined_at}
                  leftAt={enrollment.left_at}
                  startTime={batch?.start_time}
                  endTime={batch?.end_time}
                  weekdays={batch?.weekdays}
                  monthlyFeePaise={batch?.monthly_fee_paise}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function EnrollmentCard({
  programName,
  batchName,
  status,
  joinedAt,
  leftAt,
  startTime,
  endTime,
  weekdays,
  monthlyFeePaise,
}: {
  programName: string;
  batchName: string;
  status: "active" | "completed" | "cancelled";
  joinedAt: string;
  leftAt?: string | null;
  startTime?: string;
  endTime?: string;
  weekdays?: number[];
  monthlyFeePaise?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
        <div>
          <p className="text-sm text-gray-500">{programName}</p>

          <h3 className="mt-1 font-semibold text-gray-900">{batchName}</h3>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="space-y-4 p-5">
        <InfoItem
          icon={<Clock3 size={18} />}
          label="Schedule"
          value={
            startTime && endTime
              ? `${formatTime(startTime)} - ${formatTime(endTime)}`
              : "Not available"
          }
        />

        <InfoItem
          icon={<CalendarDays size={18} />}
          label="Days"
          value={
            weekdays && weekdays.length > 0
              ? formatWeekdays(weekdays)
              : "Not available"
          }
        />

        <InfoItem
          icon={<IndianRupee size={18} />}
          label="Monthly Fee"
          value={
            typeof monthlyFeePaise === "number"
              ? formatCurrency(monthlyFeePaise)
              : "Not available"
          }
        />

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Joined
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {formatDate(joinedAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Left
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {leftAt ? formatDate(leftAt) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">{icon}</div>

        <div>
          <p className="text-sm text-gray-500">{label}</p>

          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({
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
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

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
    return value.split("T")[1].slice(0, 5);
  }

  return value.slice(0, 5);
}

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
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

  return values.map((value) => labels[value] ?? String(value)).join(", ");
}

export default StudentEnrollmentsPage;
