import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  createStudent,
  getStudents,
  updateStudent,
  type CreateStudentPayload,
  type UpdateStudentPayload,
} from "../../features/students/studentThunks";

import {
  clearCreateStudentError,
  clearUpdateStudentError,
} from "../../features/students/studentSlice";

import type { StudentWithUser } from "../../features/students/studentTypes";

function StudentsPage() {
  const dispatch = useAppDispatch();

  const {
    students,
    total,
    page,
    pageSize,
    loading,
    error,
    creating,
    createError,
    updating,
    updateError,
  } = useAppSelector((state) => state.students);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(
    null,
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createFormErrors },
  } = useForm<CreateStudentPayload>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editFormErrors },
  } = useForm<UpdateStudentPayload>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    dispatch(
      getStudents({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, currentPage, pageSize, debouncedSearch]);

  const refreshStudents = () => {
    dispatch(
      getStudents({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
      }),
    );
  };

  const openCreateModal = () => {
    dispatch(clearCreateStudentError());
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    dispatch(clearCreateStudentError());
    resetCreate();
    setIsCreateModalOpen(false);
  };

  const openEditModal = (student: StudentWithUser) => {
    dispatch(clearUpdateStudentError());
    setEditingStudent(student);

    resetEdit({
      full_name: student.full_name,
      phone: student.phone ?? "",
      date_of_birth: student.date_of_birth
        ? student.date_of_birth.slice(0, 10)
        : "",
      guardian_name: student.guardian_name ?? "",
      guardian_phone: student.guardian_phone ?? "",
      address: student.address ?? "",
      status: student.status,
    });
  };

  const closeEditModal = () => {
    dispatch(clearUpdateStudentError());
    resetEdit();
    setEditingStudent(null);
  };

  const onCreateSubmit = async (data: CreateStudentPayload) => {
    const payload: CreateStudentPayload = {
      email: data.email,
      username: data.username,
      full_name: data.full_name,
    };

    if (data.phone?.trim()) payload.phone = data.phone;
    if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;
    if (data.guardian_name?.trim()) payload.guardian_name = data.guardian_name;
    if (data.guardian_phone?.trim())
      payload.guardian_phone = data.guardian_phone;
    if (data.address?.trim()) payload.address = data.address;

    const result = await dispatch(createStudent(payload));

    if (createStudent.fulfilled.match(result)) {
      resetCreate();
      setIsCreateModalOpen(false);

      if (currentPage === 1) {
        refreshStudents();
      } else {
        setCurrentPage(1);
      }
    }
  };

  const onEditSubmit = async (data: UpdateStudentPayload) => {
    if (!editingStudent) return;

    const payload: UpdateStudentPayload = {
      full_name: data.full_name,
      phone: data.phone,
      date_of_birth: data.date_of_birth,
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      address: data.address,
      status: data.status,
    };

    const result = await dispatch(
      updateStudent({
        studentID: editingStudent.id,
        payload,
      }),
    );

    if (updateStudent.fulfilled.match(result)) {
      resetEdit();
      setEditingStudent(null);
      refreshStudents();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Student Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Students
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage student accounts and personal information.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900/10 sm:w-auto"
          >
            <Plus size={18} />
            Add student
          </button>
        </div>

        {/* Main card */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
          {/* Toolbar */}

          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={16} className="text-emerald-700" />

              <span>
                <strong className="font-semibold text-slate-800">
                  {total}
                </strong>{" "}
                {total === 1 ? "student" : "students"}
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-64 items-center justify-center p-10">
              <p className="text-sm text-slate-500">Loading students...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 sm:p-6">
              <ErrorBox message={error} />
            </div>
          )}

          {!loading && !error && students.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={25} />
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                No students found
              </p>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {debouncedSearch
                  ? "No students match your current search."
                  : "Add your first student to get started."}
              </p>
            </div>
          )}

          {!loading && !error && students.length > 0 && (
            <>
              {/* Desktop / tablet */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <TableHeader>Student</TableHeader>
                      <TableHeader>Contact</TableHeader>
                      <TableHeader>Guardian</TableHeader>
                      <TableHeader>Joined</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={student.full_name} />

                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {student.full_name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                @{student.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-sm text-slate-700">
                            {student.email}
                          </p>

                          {student.phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {student.phone}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {student.guardian_name ?? "—"}
                          </p>

                          {student.guardian_phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {student.guardian_phone}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(student.joined_at)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={student.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}

              <div className="divide-y divide-slate-100 md:hidden">
                {students.map((student) => (
                  <article key={student.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <StudentAvatar name={student.full_name} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {student.full_name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              @{student.username}
                            </p>
                          </div>

                          <StatusBadge status={student.status} />
                        </div>

                        <div className="mt-4 space-y-2">
                          <MobileInfo
                            icon={<Mail size={15} />}
                            value={student.email}
                          />

                          {student.phone && (
                            <MobileInfo
                              icon={<Phone size={15} />}
                              value={student.phone}
                            />
                          )}

                          {student.guardian_name && (
                            <MobileInfo
                              icon={<UserRound size={15} />}
                              value={`Guardian: ${student.guardian_name}`}
                            />
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-400">
                            Joined {formatDate(student.joined_at)}
                          </p>

                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}

          {!loading && !error && total > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-500 sm:text-sm">
                Page <span className="font-medium text-slate-800">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-slate-800">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((currentPage) => currentPage - 1)
                  }
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((currentPage) => currentPage + 1)
                  }
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Create student */}

      {isCreateModalOpen && (
        <ModalShell>
          <ModalHeader
            title="Add student"
            description="Create an account and student profile."
            onClose={closeCreateModal}
          />

          <form
            onSubmit={handleCreateSubmit(onCreateSubmit)}
            className="space-y-6 p-4 sm:p-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full name"
                error={createFormErrors.full_name?.message}
              >
                <input
                  type="text"
                  {...registerCreate("full_name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Minimum 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Maximum 100 characters",
                    },
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Username"
                error={createFormErrors.username?.message}
              >
                <input
                  type="text"
                  {...registerCreate("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Minimum 3 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Maximum 50 characters",
                    },
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Email" error={createFormErrors.email?.message}>
                <input
                  type="email"
                  {...registerCreate("email", {
                    required: "Email is required",
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Phone">
                <input
                  type="text"
                  {...registerCreate("phone")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Date of birth">
                <input
                  type="date"
                  {...registerCreate("date_of_birth")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Guardian name">
                <input
                  type="text"
                  {...registerCreate("guardian_name")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Guardian phone">
                <input
                  type="text"
                  {...registerCreate("guardian_phone")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Address">
                <input
                  type="text"
                  {...registerCreate("address")}
                  className={inputClass}
                />
              </FormField>
            </div>

            {createError && <ErrorBox message={createError} />}

            <ModalActions
              loading={creating}
              submitText="Create student"
              loadingText="Creating..."
              onCancel={closeCreateModal}
            />
          </form>
        </ModalShell>
      )}

      {/* Edit student */}

      {editingStudent && (
        <ModalShell>
          <ModalHeader
            title="Edit student"
            description={editingStudent.full_name}
            onClose={closeEditModal}
          />

          <form
            onSubmit={handleEditSubmit(onEditSubmit)}
            className="space-y-6 p-4 sm:p-6"
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Username</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    @{editingStudent.username}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-800">
                    {editingStudent.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full name"
                error={editFormErrors.full_name?.message}
              >
                <input
                  type="text"
                  {...registerEdit("full_name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Minimum 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Maximum 100 characters",
                    },
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status">
                <select {...registerEdit("status")} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>

              <FormField label="Phone">
                <input
                  type="text"
                  {...registerEdit("phone")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Date of birth">
                <input
                  type="date"
                  {...registerEdit("date_of_birth")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Guardian name">
                <input
                  type="text"
                  {...registerEdit("guardian_name")}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Guardian phone">
                <input
                  type="text"
                  {...registerEdit("guardian_phone")}
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Address">
                  <input
                    type="text"
                    {...registerEdit("address")}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            {updateError && <ErrorBox message={updateError} />}

            <ModalActions
              loading={updating}
              submitText="Save changes"
              loadingText="Saving..."
              onCancel={closeEditModal}
            />
          </form>
        </ModalShell>
      )}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function StudentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800">
      {getInitials(name)}
    </div>
  );
}

function MobileInfo({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10"
      }`}
    >
      {status}
    </span>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/30 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      {children}

      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

type ModalHeaderProps = {
  title: string;
  description: string;
  onClose: () => void;
};

function ModalHeader({ title, description, onClose }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
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

type ModalActionsProps = {
  loading: boolean;
  submitText: string;
  loadingText: string;
  onCancel: () => void;
};

function ModalActions({
  loading,
  submitText,
  loadingText,
  onCancel,
}: ModalActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? loadingText : submitText}
      </button>
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

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(value: string) {
  if (!value) return "ST";

  const parts = value.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default StudentsPage;
