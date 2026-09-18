import { useEffect, useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ReceiptIndianRupee,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getMyFees } from "../../features/studentFees/studentFeeThunks";
import type { FeeDueStatus } from "../../features/studentFees/studentFeeTypes";

function StudentFeesPage() {
  const dispatch = useAppDispatch();

  const { fees, loading, error } = useAppSelector((state) => state.studentFees);

  useEffect(() => {
    dispatch(getMyFees());
  }, [dispatch]);

  const summary = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let outstandingAmount = 0;
    let paidAmount = 0;

    for (const fee of fees) {
      if (fee.status === "pending" || fee.status === "partial") {
        pending++;
        outstandingAmount += fee.amount_paise;
      }

      if (fee.status === "paid") {
        paid++;
        paidAmount += fee.amount_paise;
      }
    }

    return {
      pending,
      paid,
      outstandingAmount,
      paidAmount,
    };
  }, [fees]);

  const sortedFees = useMemo(() => {
    return [...fees].sort(
      (a, b) =>
        new Date(b.billing_month).getTime() -
        new Date(a.billing_month).getTime(),
    );
  }, [fees]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-gray-500">Loading fees...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Fees</h1>

        <p className="mt-1 text-sm text-gray-500">
          View your monthly fee dues and payment history.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Outstanding"
          value={formatMoney(summary.outstandingAmount)}
          subtitle="Amount currently due"
          icon={<IndianRupee size={20} />}
        />

        <SummaryCard
          title="Pending Dues"
          value={String(summary.pending)}
          subtitle="Pending or partial"
          icon={<Clock3 size={20} />}
        />

        <SummaryCard
          title="Paid Dues"
          value={String(summary.paid)}
          subtitle="Completed payments"
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          title="Total Paid"
          value={formatMoney(summary.paidAmount)}
          subtitle="Recorded payments"
          icon={<ReceiptIndianRupee size={20} />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Fee History</h2>

          <p className="mt-1 text-sm text-gray-500">
            Monthly fees for your enrollments.
          </p>
        </div>

        {sortedFees.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ReceiptIndianRupee size={32} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No fee records
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Your fee records will appear here once generated.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Month</th>
                    <th className="px-5 py-3 font-medium">Program</th>
                    <th className="px-5 py-3 font-medium">Batch</th>
                    <th className="px-5 py-3 font-medium">Due Date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {sortedFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {formatMonth(fee.billing_month)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {fee.program_name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {fee.batch_name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(fee.due_date)}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {formatMoney(fee.amount_paise)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={fee.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {sortedFees.map((fee) => (
                <div key={fee.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatMonth(fee.billing_month)}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {fee.program_name} · {fee.batch_name}
                      </p>
                    </div>

                    <StatusBadge status={fee.status} />
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarDays size={15} />
                      Due {formatDate(fee.due_date)}
                    </div>

                    <p className="font-semibold text-gray-900">
                      {formatMoney(fee.amount_paise)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-semibold text-gray-900">{value}</p>

      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: FeeDueStatus }) {
  const styles: Record<FeeDueStatus, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    partial: "bg-blue-50 text-blue-700 ring-blue-600/20",
    paid: "bg-green-50 text-green-700 ring-green-600/20",
    cancelled: "bg-gray-100 text-gray-600 ring-gray-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default StudentFeesPage;
