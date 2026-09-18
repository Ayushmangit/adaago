import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
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
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "partial":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
      return "bg-gray-100 text-gray-600";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fees</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage monthly student fees and payment status.
          </p>
        </div>

        <button
          type="button"
          onClick={openGenerateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          Generate Monthly Fees
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Billing month
            </label>

            <input
              type="month"
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, batch or program..."
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                handleStatusChange(e.target.value as FeeDueStatus | "")
              }
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-500"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>

                <th className="px-5 py-3 font-medium">Program</th>

                <th className="px-5 py-3 font-medium">Batch</th>

                <th className="px-5 py-3 font-medium">Due Date</th>

                <th className="px-5 py-3 font-medium">Amount</th>

                <th className="px-5 py-3 font-medium">Status</th>

                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Loading fees...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="font-medium text-gray-700">No fees found</p>

                    <p className="mt-1 text-sm text-gray-500">
                      There are no fee dues matching these filters.
                    </p>
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {fee.student_name}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-400">
                        Student #{fee.student_id}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {fee.program_name}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {fee.batch_name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(fee.due_date)}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatCurrency(fee.amount_paise)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses(
                          fee.status,
                        )}`}
                      >
                        {fee.status}
                      </span>

                      {fee.status === "paid" && fee.paid_at && (
                        <div className="mt-1 text-xs text-gray-400">
                          Paid {formatDate(fee.paid_at)}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {fee.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => openPaidModal(fee)}
                          disabled={markingPaidID === fee.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check size={14} />

                          {markingPaidID === fee.id ? "Saving..." : "Mark Paid"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing {start}-{end} of {total}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((current) => current - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((current) => current + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Mark fee as paid
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Confirm payment received from student.
                </p>
              </div>

              <button
                type="button"
                onClick={closePaidModal}
                disabled={markingPaidID !== null}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="font-medium text-gray-900">
                  {selectedFee.student_name}
                </div>

                <div className="mt-1 text-sm text-gray-500">
                  {selectedFee.program_name} · {selectedFee.batch_name}
                </div>

                <div className="mt-3 text-xl font-semibold text-gray-900">
                  {formatCurrency(selectedFee.amount_paise)}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Payment note
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Example: Paid via UPI"
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />

                <p className="mt-1 text-xs text-gray-400">Optional</p>
              </div>

              {markPaidError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {markPaidError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={closePaidModal}
                disabled={markingPaidID !== null}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={markingPaidID !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={16} />

                {markingPaidID !== null ? "Saving..." : "Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {generateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Generate Monthly Fees
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Create fee dues for enrolled students.
                </p>
              </div>

              <button
                type="button"
                disabled={generating}
                onClick={closeGenerateModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Billing month
                </label>

                <input
                  type="month"
                  value={generateMonth}
                  disabled={generating}
                  onChange={(e) => {
                    setGenerateMonth(e.target.value);
                    setGenerateMessage("");
                  }}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Due date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  disabled={generating}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setGenerateMessage("");
                  }}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                />
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                Existing fee dues for this month will not be duplicated.
              </div>

              {generateError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {generateError}
                </div>
              )}

              {generateMessage && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  {generateMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                disabled={generating}
                onClick={closeGenerateModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                disabled={generating || !generateMonth || !dueDate}
                onClick={handleGenerateFees}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />

                {generating ? "Generating..." : "Generate Fees"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeesPage;
