import { CalendarDays, Clock3, IndianRupee, Layers3 } from "lucide-react";

import { useEffect, useMemo, type ReactNode } from "react";

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
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Sports Programs
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          My Enrollments
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          View your current and previous Adaa Farms sports batches.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:max-w-2xl">
        <SummaryCard
          label="Active"
          value={loading ? "..." : activeEnrollments.length}
          icon={<Layers3 size={19} />}
        />

        <SummaryCard
          label="Total"
          value={loading ? "..." : enrollments.length}
          icon={<CalendarDays size={19} />}
        />
      </section>

      {loading && (
        <PageState
          icon={<Layers3 size={23} />}
          title="Loading enrollments..."
        />
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <PageState
          icon={<Layers3 size={23} />}
          title="No enrollments yet"
          description="You have not been assigned to any sports batches yet."
        />
      )}

      {!loading && !error && activeEnrollments.length > 0 && (
        <EnrollmentSection
          title="Active enrollments"
          description="Sports batches you are currently attending."
          count={activeEnrollments.length}
        >
          {activeEnrollments.map((enrollment) => {
            const batch = batchMap.get(enrollment.batch_id);

            const program = batch
              ? programMap.get(batch.program_id)
              : undefined;

            return (
              <EnrollmentCard
                key={enrollment.id}
                programName={program?.name ?? "Program"}
                batchName={batch?.name ?? "Batch"}
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
        </EnrollmentSection>
      )}

      {!loading && !error && historicalEnrollments.length > 0 && (
        <EnrollmentSection
          title="Previous enrollments"
          description="Your completed and cancelled sports batches."
          count={historicalEnrollments.length}
        >
          {historicalEnrollments.map((enrollment) => {
            const batch = batchMap.get(enrollment.batch_id);

            const program = batch
              ? programMap.get(batch.program_id)
              : undefined;

            return (
              <EnrollmentCard
                key={enrollment.id}
                programName={program?.name ?? "Program"}
                batchName={batch?.name ?? "Batch"}
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
        </EnrollmentSection>
      )}
    </div>
  );
}

function EnrollmentSection({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Layers3 size={20} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {programName}
            </p>

            <h3 className="mt-1 truncate font-semibold text-slate-950">
              {batchName}
            </h3>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            icon={<Clock3 size={17} />}
            label="Schedule"
            value={
              startTime && endTime
                ? `${formatTime(startTime)} – ${formatTime(endTime)}`
                : "Not available"
            }
          />

          <InfoItem
            icon={<CalendarDays size={17} />}
            label="Training days"
            value={
              weekdays && weekdays.length > 0
                ? formatWeekdays(weekdays)
                : "Not available"
            }
          />

          <div className="sm:col-span-2">
            <InfoItem
              icon={<IndianRupee size={17} />}
              label="Monthly fee"
              value={
                typeof monthlyFeePaise === "number"
                  ? formatCurrency(monthlyFeePaise)
                  : "Not available"
              }
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <DateInfo label="Joined" value={formatDate(joinedAt)} />

          <DateInfo label="Left" value={leftAt ? formatDate(leftAt) : "—"} />
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-20 items-start gap-3 rounded-xl bg-slate-50 p-3.5">
      <div className="mt-0.5 shrink-0 text-emerald-700">{icon}</div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function DateInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "completed" | "cancelled";
}) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-slate-100 text-slate-600",
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
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-12">
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
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  if (!value) return "—";

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
