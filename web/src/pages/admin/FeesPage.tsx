import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Plus,
  ReceiptIndianRupee,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  generateMonthlyFees,
  getFees,
  markFeePaid,
} from "../../features/fees/feeThunks";
import type {
  FeeDueStatus,
  FeeDueWithDetails,
} from "../../features/fees/feeTypes";

function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function toBillingMonth(month: string) {
  return `${month}-01`;
}

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClasses(status: FeeDueStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
      return "bg-amber-50 text-amber-700";

    case "partial":
      return "bg-blue-50 text-blue-700";

    case "cancelled":
      return "bg-slate-100 text-slate-600";
  }
}

function FeesPage() {
  const dispatch = useAppDispatch();

  const {
    fees,
    total,
    page,
    pageSize,
    loading,
    error,
    markingPaidID,
    markPaidError,
    generating,
    generateError,
  } = useAppSelector((state) => state.fees);

  const [month, setMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<FeeDueStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedFee, setSelectedFee] = useState<FeeDueWithDetails | null>(
    null,
  );

  const [notes, setNotes] = useState("");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(getCurrentMonth());
  const [dueDate, setDueDate] = useState("");
  const [generateMessage, setGenerateMessage] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    dispatch(
      getFees({
        month: toBillingMonth(month),
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        status,
      }),
    );
  }, [dispatch, month, currentPage, pageSize, debouncedSearch, status]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, total);

  const visibleSummary = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let partial = 0;
    let amount = 0;

    for (const fee of fees) {
      amount += fee.amount_paise;

      switch (fee.status) {
        case "pending":
          pending++;
          break;

        case "paid":
          paid++;
          break;

        case "partial":
          partial++;
          break;
      }
    }

    return {
      pending,
      paid,
      partial,
      amount,
    };
  }, [fees]);

  function handleMonthChange(value: string) {
    setMonth(value);
    setCurrentPage(1);
  }

  function handleStatusChange(value: FeeDueStatus | "") {
    setStatus(value);
    setCurrentPage(1);
  }

  function openPaidModal(fee: FeeDueWithDetails) {
    setSelectedFee(fee);
    setNotes("");
  }

  function closePaidModal() {
    if (markingPaidID !== null) return;

    setSelectedFee(null);
    setNotes("");
  }

  async function handleMarkPaid() {
    if (!selectedFee) return;

    const result = await dispatch(
      markFeePaid({
        feeDueID: selectedFee.id,
        notes: notes.trim() || undefined,
      }),
    );

    if (!markFeePaid.fulfilled.match(result)) return;

    setSelectedFee(null);
    setNotes("");

    dispatch(
      getFees({
        month: toBillingMonth(month),
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        status,
      }),
    );
  }

  function openGenerateModal() {
    setGenerateMonth(month);
    setDueDate("");
    setGenerateMessage("");
    setGenerateOpen(true);
  }

  function closeGenerateModal() {
    if (generating) return;

    setGenerateOpen(false);
    setGenerateMessage("");
  }

  async function handleGenerateFees() {
    if (!generateMonth || !dueDate) return;

    setGenerateMessage("");

    const result = await dispatch(
      generateMonthlyFees({
        billing_month: toBillingMonth(generateMonth),
        due_date: dueDate,
      }),
    );

    if (!generateMonthlyFees.fulfilled.match(result)) return;

    const created = result.payload.created;

    setGenerateMessage(
      created === 0
        ? "No new fee dues were created."
        : `${created} fee due${created === 1 ? "" : "s"} created.`,
    );

    setMonth(generateMonth);
    setCurrentPage(1);

    dispatch(
      getFees({
        month: toBillingMonth(generateMonth),
        page: 1,
        pageSize,
        search: "",
        status: "",
      }),
    );
  }

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Financial Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Fees
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage monthly student fees and payment status across Adaa Farms
              programs.
            </p>
          </div>

          <button
            type="button"
            onClick={openGenerateModal}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            <Plus size={17} />
            Generate monthly fees
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Visible dues"
            value={fees.length}
            icon={<ReceiptIndianRupee size={18} />}
          />

          <SummaryCard
            label="Pending"
            value={visibleSummary.pending}
            icon={<WalletCards size={18} />}
          />

          <SummaryCard
            label="Paid"
            value={visibleSummary.paid}
            icon={<Check size={18} />}
          />

          <SummaryCard
            label="Visible value"
            value={formatCurrency(visibleSummary.amount)}
            icon={<IndianRupee size={18} />}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_180px]">
            <FilterField label="Billing month">
              <input
                type="month"
                value={month}
                onChange={(event) => handleMonthChange(event.target.value)}
                className={inputClass}
              />
            </FilterField>

            <FilterField label="Search">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, batch or program..."
                  className={searchClass}
                />
              </div>
            </FilterField>

            <FilterField label="Status">
              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as FeeDueStatus | "")
                }
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FilterField>
          </div>
        </section>

        {error && <ErrorBox message={error} />}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-950">Fee register</h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} {total === 1 ? "fee due" : "fee dues"} found
              </p>
            </div>

            {visibleSummary.partial > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {visibleSummary.partial} partial
              </span>
            )}
          </div>

          {loading ? (
            <EmptyState
              icon={<ReceiptIndianRupee size={23} />}
              title="Loading fees..."
            />
          ) : fees.length === 0 ? (
            <EmptyState
              icon={<ReceiptIndianRupee size={23} />}
              title="No fees found"
              description="There are no fee dues matching these filters."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                      <TableHeader>Student</TableHeader>
                      <TableHeader>Program</TableHeader>
                      <TableHeader>Batch</TableHeader>
                      <TableHeader>Due date</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader align="right">Action</TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {fees.map((fee) => (
                      <tr
                        key={fee.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={fee.student_name} />

                            <p className="text-sm font-semibold text-slate-900">
                              {fee.student_name}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {fee.program_name}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {fee.batch_name}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(fee.due_date)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                          {formatCurrency(fee.amount_paise)}
                        </td>

                        <td className="px-5 py-4">
                          <FeeStatus fee={fee} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          {fee.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => openPaidModal(fee)}
                              disabled={markingPaidID === fee.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check size={14} />

                              {markingPaidID === fee.id
                                ? "Saving..."
                                : "Mark paid"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {fees.map((fee) => (
                  <article key={fee.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar name={fee.student_name} />

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {fee.student_name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {fee.program_name}
                          </p>
                        </div>
                      </div>

                      <FeeStatus fee={fee} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileInfo label="Batch" value={fee.batch_name} />

                      <MobileInfo
                        label="Due date"
                        value={formatDate(fee.due_date)}
                      />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400">Amount</p>

                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {formatCurrency(fee.amount_paise)}
                        </p>
                      </div>

                      {fee.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => openPaidModal(fee)}
                          disabled={markingPaidID === fee.id}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <Check size={14} />
                          Mark paid
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-center text-sm text-slate-500 sm:text-left">
              Showing {start}-{end} of {total}
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((current) => current - 1)}
                className={paginationButtonClass}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="px-2 text-sm text-slate-500">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((current) => current + 1)}
                className={paginationButtonClass}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedFee && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Mark fee as paid"
              description="Confirm that payment has been received."
              onClose={closePaidModal}
              disabled={markingPaidID !== null}
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-emerald-950">
                      {selectedFee.student_name}
                    </p>

                    <p className="mt-1 text-sm text-emerald-800/70">
                      {selectedFee.program_name} · {selectedFee.batch_name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/80 p-2 text-emerald-700">
                    <IndianRupee size={18} />
                  </div>
                </div>

                <p className="mt-5 text-2xl font-semibold tracking-tight text-emerald-950">
                  {formatCurrency(selectedFee.amount_paise)}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Due {formatDate(selectedFee.due_date)}
                </p>
              </div>

              <FilterField label="Payment note">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="e.g. Paid via UPI"
                  className={textareaClass}
                />

                <p className="mt-1.5 text-xs text-slate-400">Optional</p>
              </FilterField>

              {markPaidError && <ErrorBox message={markPaidError} />}
            </div>

            <ModalActions>
              <button
                type="button"
                onClick={closePaidModal}
                disabled={markingPaidID !== null}
                className={secondaryButtonClass}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={markingPaidID !== null}
                className={primaryButtonClass}
              >
                <Check size={16} />

                {markingPaidID !== null ? "Saving..." : "Confirm payment"}
              </button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}

      {generateOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Generate monthly fees"
              description="Create fee dues for currently enrolled students."
              onClose={closeGenerateModal}
              disabled={generating}
            />

            <div className="space-y-5 p-5 sm:p-6">
              <FilterField label="Billing month">
                <input
                  type="month"
                  value={generateMonth}
                  disabled={generating}
                  onChange={(event) => {
                    setGenerateMonth(event.target.value);
                    setGenerateMessage("");
                  }}
                  className={inputClass}
                />
              </FilterField>

              <FilterField label="Due date">
                <input
                  type="date"
                  value={dueDate}
                  disabled={generating}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    setGenerateMessage("");
                  }}
                  className={inputClass}
                />
              </FilterField>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                Existing fee dues for this billing month will not be duplicated.
              </div>

              {generateError && <ErrorBox message={generateError} />}

              {generateMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {generateMessage}
                </div>
              )}
            </div>

            <ModalActions>
              <button
                type="button"
                disabled={generating}
                onClick={closeGenerateModal}
                className={secondaryButtonClass}
              >
                Close
              </button>

              <button
                type="button"
                disabled={generating || !generateMonth || !dueDate}
                onClick={handleGenerateFees}
                className={primaryButtonClass}
              >
                <Plus size={16} />

                {generating ? "Generating..." : "Generate fees"}
              </button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 truncate text-xl font-semibold text-slate-950 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
        </div>
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

function FeeStatus({ fee }: { fee: FeeDueWithDetails }) {
  return (
    <div>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(
          fee.status,
        )}`}
      >
        {fee.status}
      </span>

      {fee.status === "paid" && fee.paid_at && (
        <p className="mt-1 text-xs text-slate-400">
          Paid {formatDate(fee.paid_at)}
        </p>
      )}
    </div>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
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

function EmptyState({
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
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/30 backdrop-blur-sm sm:items-center sm:p-4">
      {children}
    </div>
  );
}

function ModalCard({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
  disabled,
}: {
  title: string;
  description: string;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
      >
        <X size={19} />
      </button>
    </div>
  );
}

function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const searchClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10";

const textareaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";

const paginationButtonClass =
  "inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

function getInitials(name: string) {
  const values = name.trim().split(/\s+/);

  if (values.length === 0 || !values[0]) return "ST";

  if (values.length === 1) {
    return values[0].slice(0, 2).toUpperCase();
  }

  return (values[0][0] + values[values.length - 1][0]).toUpperCase();
}

export default FeesPage;
