import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { getStudents } from "../../features/students/studentThunks";

import { getPrograms } from "../../features/programs/programThunks";

import { getBatches } from "../../features/batches/batchThunks";

import {
  createEnrollment,
  getBatchEnrollments,
  updateEnrollment,
} from "../../features/enrollments/enrollmentThunks";

import {
  clearCreateEnrollmentError,
  clearEnrollments,
  clearUpdateEnrollmentError,
} from "../../features/enrollments/enrollmentSlice";

import type { Enrollment } from "../../features/enrollments/enrollmentTypes";

type CreateEnrollmentForm = {
  student_id: number;
  joined_at: string;
};

type EndEnrollmentForm = {
  left_at: string;
};

function EnrollmentsPage() {
  const dispatch = useAppDispatch();

  const { programs } = useAppSelector((state) => state.programs);

  const { batches } = useAppSelector((state) => state.batches);

  const { students } = useAppSelector((state) => state.students);

  const {
    enrollments,
    loading,
    creating,
    updating,
    error,
    createError,
    updateError,
  } = useAppSelector((state) => state.enrollments);

  const [selectedProgramID, setSelectedProgramID] = useState<number | null>(
    null,
  );

  const [selectedBatchID, setSelectedBatchID] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [endingEnrollment, setEndingEnrollment] = useState<Enrollment | null>(
    null,
  );

  const [endStatus, setEndStatus] = useState<"completed" | "cancelled">(
    "completed",
  );

  /*
  |--------------------------------------------------------------------------
  | Forms
  |--------------------------------------------------------------------------
  */

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createFormErrors },
  } = useForm<CreateEnrollmentForm>();

  const {
    register: registerEnd,
    handleSubmit: handleEndSubmit,
    reset: resetEnd,
  } = useForm<EndEnrollmentForm>();

  /*
  |--------------------------------------------------------------------------
  | Initial data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    dispatch(getPrograms());

    dispatch(getBatches());

    dispatch(getStudents());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | Active programs
  |--------------------------------------------------------------------------
  */

  const activePrograms = useMemo(
    () => programs.filter((program) => program.is_active),
    [programs],
  );

  /*
  |--------------------------------------------------------------------------
  | Program Batches
  |--------------------------------------------------------------------------
  */

  const programBatches = useMemo(() => {
    if (selectedProgramID === null) {
      return [];
    }

    return batches.filter(
      (batch) => batch.program_id === selectedProgramID && batch.is_active,
    );
  }, [batches, selectedProgramID]);

  /*
  |--------------------------------------------------------------------------
  | Automatically select first program
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (selectedProgramID === null && activePrograms.length > 0) {
      setSelectedProgramID(activePrograms[0].id);
    }
  }, [activePrograms, selectedProgramID]);

  /*
  |--------------------------------------------------------------------------
  | Select first batch whenever program changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (programBatches.length > 0) {
      const selectedStillExists = programBatches.some(
        (batch) => batch.id === selectedBatchID,
      );

      if (!selectedStillExists) {
        setSelectedBatchID(programBatches[0].id);
      }
    } else {
      setSelectedBatchID(null);

      dispatch(clearEnrollments());
    }
  }, [dispatch, programBatches, selectedBatchID]);

  /*
  |--------------------------------------------------------------------------
  | Load enrollments
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (selectedBatchID === null) {
      return;
    }

    dispatch(getBatchEnrollments(selectedBatchID));
  }, [dispatch, selectedBatchID]);

  /*
  |--------------------------------------------------------------------------
  | Maps
  |--------------------------------------------------------------------------
  */

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchID),
    [batches, selectedBatchID],
  );

  /*
  |--------------------------------------------------------------------------
  | Students available for enrollment
  |--------------------------------------------------------------------------
  */

  const availableStudents = useMemo(() => {
    const enrolledStudentIDs = new Set(
      enrollments
        .filter((enrollment) => enrollment.status === "active")
        .map((enrollment) => enrollment.student_id),
    );

    return students
      .filter((student) => student.status === "active")
      .filter((student) => !enrolledStudentIDs.has(student.id))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [enrollments, students]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return enrollments;
    }

    return enrollments.filter((enrollment) => {
      const student = studentMap.get(enrollment.student_id);

      if (!student) {
        return false;
      }

      return (
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.username.toLowerCase().includes(query)
      );
    });
  }, [enrollments, search, studentMap]);

  /*
  |--------------------------------------------------------------------------
  | Open create modal
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    if (selectedBatchID === null) {
      return;
    }

    dispatch(clearCreateEnrollmentError());

    resetCreate({
      student_id: undefined,
      joined_at: getToday(),
    });

    setShowCreateModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Create enrollment
  |--------------------------------------------------------------------------
  */

  const onCreateEnrollment = async (data: CreateEnrollmentForm) => {
    if (selectedBatchID === null) {
      return;
    }

    const result = await dispatch(
      createEnrollment({
        student_id: Number(data.student_id),

        batch_id: selectedBatchID,

        joined_at: data.joined_at || undefined,
      }),
    );

    if (createEnrollment.fulfilled.match(result)) {
      setShowCreateModal(false);

      resetCreate();

      dispatch(getBatchEnrollments(selectedBatchID));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open complete/cancel modal
  |--------------------------------------------------------------------------
  */

  const openEndModal = (
    enrollment: Enrollment,
    status: "completed" | "cancelled",
  ) => {
    dispatch(clearUpdateEnrollmentError());

    setEndingEnrollment(enrollment);

    setEndStatus(status);

    resetEnd({
      left_at: getToday(),
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Complete/cancel enrollment
  |--------------------------------------------------------------------------
  */

  const onEndEnrollment = async (data: EndEnrollmentForm) => {
    if (!endingEnrollment) {
      return;
    }

    const result = await dispatch(
      updateEnrollment({
        enrollmentID: endingEnrollment.id,

        payload: {
          status: endStatus,

          left_at: data.left_at || undefined,
        },
      }),
    );

    if (updateEnrollment.fulfilled.match(result)) {
      setEndingEnrollment(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Enrollments</h1>

          <p className="mt-1 text-sm text-gray-500">
            Assign students to batches and manage enrollment status.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={selectedBatchID === null}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UserPlus size={17} />
          Enroll Student
        </button>
      </div>

      {/* Selectors */}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Program
          </label>

          <select
            value={selectedProgramID ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);

              setSelectedProgramID(value);

              setSelectedBatchID(null);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
          >
            {activePrograms.map((program) => (
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
            value={selectedBatchID ?? ""}
            onChange={(e) => setSelectedBatchID(Number(e.target.value))}
            disabled={programBatches.length === 0}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
          >
            {programBatches.length === 0 ? (
              <option value="">No active batches</option>
            ) : (
              programBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Batch summary */}

      {selectedBatch && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Users size={19} />}
            label="Enrollments"
            value={String(enrollments.length)}
          />

          <SummaryCard
            icon={<CheckCircle2 size={19} />}
            label="Active"
            value={String(
              enrollments.filter((item) => item.status === "active").length,
            )}
          />

          <SummaryCard
            icon={<CalendarDays size={19} />}
            label="Capacity"
            value={selectedBatch.capacity ?? "Unlimited"}
          />
        </div>
      )}

      {/* Search */}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-500"
            />
          </div>
        </div>

        {/* Loading */}

        {loading && (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading enrollments...
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="p-6">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}

        {/* No batch */}

        {!loading && !error && selectedBatchID === null && (
          <div className="p-10 text-center">
            <Users size={32} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm text-gray-500">
              Select a batch to view enrollments.
            </p>
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          selectedBatchID !== null &&
          enrollments.length === 0 && (
            <div className="p-10 text-center">
              <UserPlus size={32} className="mx-auto text-gray-300" />

              <p className="mt-3 font-medium text-gray-700">
                No students enrolled
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Enroll the first student into this batch.
              </p>
            </div>
          )}

        {/* Table */}

        {!loading && !error && filteredEnrollments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Student</th>

                  <th className="px-5 py-3">Contact</th>

                  <th className="px-5 py-3">Joined</th>

                  <th className="px-5 py-3">Left</th>

                  <th className="px-5 py-3">Status</th>

                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((enrollment) => {
                  const student = studentMap.get(enrollment.student_id);

                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {student?.full_name ??
                            `Student #${enrollment.student_id}`}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {student?.username ?? "Unknown"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {student?.email ?? "—"}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {student?.phone ?? "No phone"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {formatDate(enrollment.joined_at)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {enrollment.left_at
                          ? formatDate(enrollment.left_at)
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={enrollment.status} />
                      </td>

                      <td className="px-5 py-4">
                        {enrollment.status === "active" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEndModal(enrollment, "completed")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <CheckCircle2 size={15} />
                              Complete
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEndModal(enrollment, "cancelled")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <XCircle size={15} />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-gray-400">
                            No actions
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}

      {showCreateModal && (
        <ModalOverlay>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <ModalHeader
              title="Enroll Student"
              description={
                selectedBatch
                  ? `Add a student to ${selectedBatch.name}`
                  : "Add student to batch"
              }
              onClose={() => setShowCreateModal(false)}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateEnrollment)}
              className="space-y-5 p-6"
            >
              {createError && <ErrorBox>{createError}</ErrorBox>}

              <FormField
                label="Student"
                error={createFormErrors.student_id?.message}
              >
                <select
                  {...registerCreate("student_id", {
                    required: "Student is required",

                    valueAsNumber: true,

                    min: {
                      value: 1,
                      message: "Select a student",
                    },
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                >
                  <option value="">Select a student</option>

                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} — {student.email}
                    </option>
                  ))}
                </select>
              </FormField>

              {availableStudents.length === 0 && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                  No active students are currently available for this batch.
                </p>
              )}

              <FormField
                label="Joined Date"
                error={createFormErrors.joined_at?.message}
              >
                <input
                  type="date"
                  max={getToday()}
                  {...registerCreate("joined_at")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </FormField>

              <ModalActions
                submitLabel="Enroll Student"
                loadingLabel="Enrolling..."
                loading={creating}
                disabled={availableStudents.length === 0}
                onCancel={() => setShowCreateModal(false)}
              />
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Complete / Cancel Modal */}

      {endingEnrollment && (
        <ModalOverlay>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <ModalHeader
              title={
                endStatus === "completed"
                  ? "Complete Enrollment"
                  : "Cancel Enrollment"
              }
              description={
                endStatus === "completed"
                  ? "Mark this enrollment as completed."
                  : "Cancel this student's enrollment."
              }
              onClose={() => setEndingEnrollment(null)}
            />

            <form
              onSubmit={handleEndSubmit(onEndEnrollment)}
              className="space-y-5 p-6"
            >
              {updateError && <ErrorBox>{updateError}</ErrorBox>}

              <FormField
                label={
                  endStatus === "completed"
                    ? "Completion Date"
                    : "Cancellation Date"
                }
              >
                <input
                  type="date"
                  {...registerEnd("left_at")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </FormField>

              <ModalActions
                submitLabel={
                  endStatus === "completed" ? "Complete" : "Cancel Enrollment"
                }
                loadingLabel="Saving..."
                loading={updating}
                onCancel={() => setEndingEnrollment(null)}
              />
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

/*
|--------------------------------------------------------------------------
| Components
|--------------------------------------------------------------------------
*/

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">{icon}</div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>

        <p className="mt-0.5 text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Enrollment["status"] }) {
  const styles = {
    active: "bg-green-50 text-green-700",

    completed: "bg-blue-50 text-blue-700",

    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <X size={19} />
      </button>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}

function ModalActions({
  submitLabel,
  loadingLabel,
  loading,
  disabled = false,
  onCancel,
}: {
  submitLabel: string;
  loadingLabel: string;
  loading: boolean;
  disabled?: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Back
      </button>

      <button
        type="submit"
        disabled={loading || disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={16} />

        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  );
}

export default EnrollmentsPage;
