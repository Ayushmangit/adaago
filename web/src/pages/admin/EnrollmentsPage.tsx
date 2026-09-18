import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  Search,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import axios from "axios";

import api from "../../api/axios";
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
import type { StudentWithUser } from "../../features/students/studentTypes";

type CreateEnrollmentForm = {
  student_id: number;
  joined_at: string;
};

type EndEnrollmentForm = {
  left_at: string;
};

type StudentsResponse = {
  data: {
    data: StudentWithUser[];
    total: number;
    page: number;
    page_size: number;
  };
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
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<
    StudentWithUser[]
  >([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [studentSearchError, setStudentSearchError] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithUser | null>(null);

  const [endingEnrollment, setEndingEnrollment] = useState<Enrollment | null>(
    null,
  );
  const [endStatus, setEndStatus] = useState<"completed" | "cancelled">(
    "completed",
  );

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setValue: setCreateValue,
    formState: { errors: createFormErrors },
  } = useForm<CreateEnrollmentForm>();

  const {
    register: registerEnd,
    handleSubmit: handleEndSubmit,
    reset: resetEnd,
  } = useForm<EndEnrollmentForm>();

  useEffect(() => {
    dispatch(getPrograms());
    dispatch(getBatches());
    dispatch(getStudents({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  const activePrograms = useMemo(
    () => programs.filter((program) => program.is_active),
    [programs],
  );

  const programBatches = useMemo(() => {
    if (selectedProgramID === null) return [];

    return batches.filter(
      (batch) => batch.program_id === selectedProgramID && batch.is_active,
    );
  }, [batches, selectedProgramID]);

  useEffect(() => {
    if (selectedProgramID === null && activePrograms.length > 0) {
      setSelectedProgramID(activePrograms[0].id);
    }
  }, [activePrograms, selectedProgramID]);

  useEffect(() => {
    if (programBatches.length > 0) {
      const exists = programBatches.some(
        (batch) => batch.id === selectedBatchID,
      );

      if (!exists) {
        setSelectedBatchID(programBatches[0].id);
      }
    } else {
      setSelectedBatchID(null);
      dispatch(clearEnrollments());
    }
  }, [dispatch, programBatches, selectedBatchID]);

  useEffect(() => {
    if (selectedBatchID !== null) {
      dispatch(getBatchEnrollments(selectedBatchID));
    }
  }, [dispatch, selectedBatchID]);

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchID),
    [batches, selectedBatchID],
  );

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return enrollments;

    return enrollments.filter((enrollment) => {
      const student = studentMap.get(enrollment.student_id);

      if (!student) return false;

      return (
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.username.toLowerCase().includes(query)
      );
    });
  }, [enrollments, search, studentMap]);

  const activeEnrollmentIDs = useMemo(
    () =>
      new Set(
        enrollments
          .filter((enrollment) => enrollment.status === "active")
          .map((enrollment) => enrollment.student_id),
      ),
    [enrollments],
  );

  const availableStudents = useMemo(
    () =>
      studentSearchResults
        .filter((student) => student.status === "active")
        .filter((student) => !activeEnrollmentIDs.has(student.id)),
    [studentSearchResults, activeEnrollmentIDs],
  );

  useEffect(() => {
    if (!showCreateModal) return;

    const timeout = window.setTimeout(() => {
      setDebouncedStudentSearch(studentSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [studentSearch, showCreateModal]);

  useEffect(() => {
    if (!showCreateModal) return;

    let cancelled = false;

    async function searchStudents() {
      setStudentSearchLoading(true);
      setStudentSearchError("");

      try {
        const response = await api.get<StudentsResponse>("/students", {
          params: {
            page: 1,
            page_size: 20,
            search: debouncedStudentSearch || undefined,
          },
        });

        if (!cancelled) {
          setStudentSearchResults(response.data.data.data);
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error)) {
            setStudentSearchError(
              error.response?.data?.error ?? "Failed to search students",
            );
          } else {
            setStudentSearchError("Failed to search students");
          }
        }
      } finally {
        if (!cancelled) {
          setStudentSearchLoading(false);
        }
      }
    }

    searchStudents();

    return () => {
      cancelled = true;
    };
  }, [debouncedStudentSearch, showCreateModal]);

  const openCreateModal = () => {
    if (selectedBatchID === null) return;

    dispatch(clearCreateEnrollmentError());

    resetCreate({
      student_id: undefined,
      joined_at: getToday(),
    });

    setStudentSearch("");
    setDebouncedStudentSearch("");
    setStudentSearchResults([]);
    setStudentSearchError("");
    setSelectedStudent(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) return;

    dispatch(clearCreateEnrollmentError());
    resetCreate();
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentSearchResults([]);
    setShowCreateModal(false);
  };

  const selectStudent = (student: StudentWithUser) => {
    setSelectedStudent(student);

    setCreateValue("student_id", student.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onCreateEnrollment = async (data: CreateEnrollmentForm) => {
    if (selectedBatchID === null) return;

    const result = await dispatch(
      createEnrollment({
        student_id: Number(data.student_id),
        batch_id: selectedBatchID,
        joined_at: data.joined_at || undefined,
      }),
    );

    if (createEnrollment.fulfilled.match(result)) {
      setShowCreateModal(false);
      setSelectedStudent(null);
      resetCreate();
      dispatch(getBatchEnrollments(selectedBatchID));
    }
  };

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

  const closeEndModal = () => {
    if (updating) return;

    dispatch(clearUpdateEnrollmentError());
    setEndingEnrollment(null);
    resetEnd();
  };

  const onEndEnrollment = async (data: EndEnrollmentForm) => {
    if (!endingEnrollment) return;

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

  const activeCount = enrollments.filter(
    (enrollment) => enrollment.status === "active",
  ).length;

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Student Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Enrollments
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Assign students to Adaa Farms batches and manage their status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={selectedBatchID === null}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <UserPlus size={17} />
            Enroll student
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Program">
              <select
                value={selectedProgramID ?? ""}
                onChange={(event) => {
                  setSelectedProgramID(Number(event.target.value));
                  setSelectedBatchID(null);
                }}
                className={inputClass}
              >
                {activePrograms.length === 0 && (
                  <option value="">No active programs</option>
                )}

                {activePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Batch">
              <select
                value={selectedBatchID ?? ""}
                onChange={(event) =>
                  setSelectedBatchID(Number(event.target.value))
                }
                disabled={programBatches.length === 0}
                className={inputClass}
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
            </FormField>
          </div>
        </section>

        {selectedBatch && (
          <section className="grid grid-cols-2 gap-3 lg:max-w-3xl lg:grid-cols-3">
            <SummaryCard
              icon={<Users size={18} />}
              label="Enrollments"
              value={enrollments.length}
            />

            <SummaryCard
              icon={<CheckCircle2 size={18} />}
              label="Active"
              value={activeCount}
            />

            <div className="col-span-2 lg:col-span-1">
              <SummaryCard
                icon={<CalendarDays size={18} />}
                label="Capacity"
                value={selectedBatch.capacity ?? "Unlimited"}
              />
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search current enrollments..."
                className={searchClass}
              />
            </div>

            {selectedBatch && (
              <p className="text-sm text-slate-500">{selectedBatch.name}</p>
            )}
          </div>

          {loading && <EmptyState>Loading enrollments...</EmptyState>}

          {!loading && error && (
            <div className="p-5">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}

          {!loading && !error && selectedBatchID === null && (
            <EmptyState>
              <Users size={30} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">Select a batch</p>
              <p className="mt-1 text-sm">
                Choose a program and batch to manage enrollments.
              </p>
            </EmptyState>
          )}

          {!loading &&
            !error &&
            selectedBatchID !== null &&
            enrollments.length === 0 && (
              <EmptyState>
                <UserPlus size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No students enrolled
                </p>
                <p className="mt-1 text-sm">
                  Enroll the first student into this batch.
                </p>
              </EmptyState>
            )}

          {!loading &&
            !error &&
            enrollments.length > 0 &&
            filteredEnrollments.length === 0 && (
              <EmptyState>No enrollments match your search.</EmptyState>
            )}

          {!loading && !error && filteredEnrollments.length > 0 && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                      <TableHeader>Student</TableHeader>
                      <TableHeader>Contact</TableHeader>
                      <TableHeader>Joined</TableHeader>
                      <TableHeader>Left</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader align="right">Actions</TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredEnrollments.map((enrollment) => {
                      const student = studentMap.get(enrollment.student_id);

                      return (
                        <tr
                          key={enrollment.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar
                                name={student?.full_name ?? "Student"}
                              />

                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {student?.full_name ??
                                    `Student #${enrollment.student_id}`}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {student?.username ?? "Unknown"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-700">
                              {student?.email ?? "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student?.phone ?? "No phone"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(enrollment.joined_at)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
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
                                <ActionButton
                                  icon={<CheckCircle2 size={14} />}
                                  label="Complete"
                                  onClick={() =>
                                    openEndModal(enrollment, "completed")
                                  }
                                />

                                <ActionButton
                                  icon={<XCircle size={14} />}
                                  label="Cancel"
                                  onClick={() =>
                                    openEndModal(enrollment, "cancelled")
                                  }
                                />
                              </div>
                            ) : (
                              <p className="text-right text-xs text-slate-400">
                                —
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredEnrollments.map((enrollment) => {
                  const student = studentMap.get(enrollment.student_id);

                  return (
                    <article key={enrollment.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StudentAvatar
                            name={student?.full_name ?? "Student"}
                          />

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {student?.full_name ??
                                `Student #${enrollment.student_id}`}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              @{student?.username ?? "unknown"}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={enrollment.status} />
                      </div>

                      {student?.email && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                          <Mail size={15} className="text-emerald-700" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <SmallInfo
                          label="Joined"
                          value={formatDate(enrollment.joined_at)}
                        />

                        <SmallInfo
                          label="Left"
                          value={
                            enrollment.left_at
                              ? formatDate(enrollment.left_at)
                              : "—"
                          }
                        />
                      </div>

                      {enrollment.status === "active" && (
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                          <ActionButton
                            icon={<CheckCircle2 size={14} />}
                            label="Complete"
                            onClick={() =>
                              openEndModal(enrollment, "completed")
                            }
                          />

                          <ActionButton
                            icon={<XCircle size={14} />}
                            label="Cancel"
                            onClick={() =>
                              openEndModal(enrollment, "cancelled")
                            }
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {showCreateModal && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Enroll student"
              description={
                selectedBatch
                  ? `Add a student to ${selectedBatch.name}.`
                  : "Add a student to this batch."
              }
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateEnrollment)}
              className="space-y-5 p-5 sm:p-6"
            >
              <input
                type="hidden"
                {...registerCreate("student_id", {
                  required: "Select a student",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Select a student",
                  },
                })}
              />

              <FormField
                label="Find student"
                error={createFormErrors.student_id?.message}
              >
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search by name, username or email..."
                    className={searchClass}
                  />
                </div>
              </FormField>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                {studentSearchLoading && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Searching students...
                  </div>
                )}

                {!studentSearchLoading && studentSearchError && (
                  <div className="p-4">
                    <ErrorBox>{studentSearchError}</ErrorBox>
                  </div>
                )}

                {!studentSearchLoading &&
                  !studentSearchError &&
                  availableStudents.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                      {studentSearch
                        ? "No available students match your search."
                        : "No students are available for this batch."}
                    </div>
                  )}

                {!studentSearchLoading &&
                  !studentSearchError &&
                  availableStudents.map((student) => {
                    const selected = selectedStudent?.id === student.id;

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => selectStudent(student)}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition last:border-b-0 ${
                          selected
                            ? "bg-emerald-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <StudentAvatar name={student.full_name} />

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-semibold ${
                              selected ? "text-emerald-900" : "text-slate-900"
                            }`}
                          >
                            {student.full_name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {student.email}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2
                            size={19}
                            className="shrink-0 text-emerald-700"
                          />
                        )}
                      </button>
                    );
                  })}
              </div>

              {selectedStudent && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Selected student
                  </p>

                  <p className="mt-1 font-semibold text-emerald-950">
                    {selectedStudent.full_name}
                  </p>

                  <p className="mt-0.5 text-sm text-emerald-800/70">
                    {selectedStudent.email}
                  </p>
                </div>
              )}

              <FormField
                label="Join date"
                error={createFormErrors.joined_at?.message}
              >
                <input
                  type="date"
                  {...registerCreate("joined_at")}
                  className={inputClass}
                />
              </FormField>

              {createError && <ErrorBox>{createError}</ErrorBox>}

              <ModalActions
                onCancel={closeCreateModal}
                loading={creating}
                disabled={!selectedStudent}
                submitText="Enroll student"
                loadingText="Enrolling..."
              />
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {endingEnrollment && (
        <ModalOverlay>
          <ModalCard small>
            <ModalHeader
              title={
                endStatus === "completed"
                  ? "Complete enrollment"
                  : "Cancel enrollment"
              }
              description={
                endStatus === "completed"
                  ? "Mark this student's enrollment as completed."
                  : "End this student's enrollment."
              }
              onClose={closeEndModal}
            />

            <form
              onSubmit={handleEndSubmit(onEndEnrollment)}
              className="space-y-5 p-5 sm:p-6"
            >
              <FormField label="End date">
                <input
                  type="date"
                  {...registerEnd("left_at")}
                  className={inputClass}
                />
              </FormField>

              {updateError && <ErrorBox>{updateError}</ErrorBox>}

              <ModalActions
                onCancel={closeEndModal}
                loading={updating}
                submitText={
                  endStatus === "completed"
                    ? "Complete enrollment"
                    : "Cancel enrollment"
                }
                loadingText="Saving..."
              />
            </form>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
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

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: Enrollment["status"] }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status]
      }`}
    >
      {status}
    </span>
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

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="p-10 text-center text-sm text-slate-500">{children}</div>
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
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
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

function ModalCard({
  children,
  small = false,
}: {
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={`max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${
        small ? "sm:max-w-md" : "sm:max-w-lg"
      }`}
    >
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={19} />
      </button>
    </div>
  );
}

function ModalActions({
  onCancel,
  loading,
  disabled = false,
  submitText,
  loadingText,
}: {
  onCancel: () => void;
  loading: boolean;
  disabled?: boolean;
  submitText: string;
  loadingText: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading || disabled}
        className="h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:bg-slate-100 disabled:text-slate-400";

const searchClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  const values = name.trim().split(/\s+/);

  if (values.length === 1) {
    return values[0].slice(0, 2).toUpperCase();
  }

  return (values[0][0] + values[values.length - 1][0]).toUpperCase();
}

export default EnrollmentsPage;
