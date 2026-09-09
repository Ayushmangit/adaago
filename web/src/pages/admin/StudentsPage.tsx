import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Users, X } from "lucide-react";
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
    loading,
    error,
    creating,
    createError,
    updating,
    updateError,
  } = useAppSelector((state) => state.students);

  const [search, setSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(
    null,
  );

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
    dispatch(getStudents());
  }, [dispatch]);

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.full_name.toLowerCase().includes(value) ||
        student.username.toLowerCase().includes(value) ||
        student.email.toLowerCase().includes(value) ||
        student.phone?.includes(value) ||
        student.guardian_name?.toLowerCase().includes(value)
      );
    });
  }, [students, search]);

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

    if (data.phone?.trim()) {
      payload.phone = data.phone;
    }

    if (data.date_of_birth) {
      payload.date_of_birth = data.date_of_birth;
    }

    if (data.guardian_name?.trim()) {
      payload.guardian_name = data.guardian_name;
    }

    if (data.guardian_phone?.trim()) {
      payload.guardian_phone = data.guardian_phone;
    }

    if (data.address?.trim()) {
      payload.address = data.address;
    }

    const result = await dispatch(createStudent(payload));

    if (createStudent.fulfilled.match(result)) {
      resetCreate();

      setIsCreateModalOpen(false);
    }
  };

  const onEditSubmit = async (data: UpdateStudentPayload) => {
    if (!editingStudent) {
      return;
    }

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
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Students</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage student accounts and profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
            <div className="relative w-full max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500">
              {filteredStudents.length} students
            </p>
          </div>

          {loading && (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading students...
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {!loading && !error && filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users size={32} className="mx-auto text-gray-400" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No students found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try another search or add a new student.
              </p>
            </div>
          )}

          {!loading && !error && filteredStudents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Email
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Guardian
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Joined
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {student.full_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          @{student.username}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.email}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.phone ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {student.guardian_name ?? "—"}
                        </p>

                        {student.guardian_phone && (
                          <p className="mt-1 text-xs text-gray-500">
                            {student.guardian_phone}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(student.joined_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            student.status === "active"
                              ? "rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700"
                              : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600"
                          }
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Add Student"
              description="Create a new student account and profile."
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateSubmit)}
              className="space-y-6 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
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

                <FormField
                  label="Email"
                  error={createFormErrors.email?.message}
                >
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
                submitText="Create Student"
                loadingText="Creating..."
                onCancel={closeCreateModal}
              />
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}

      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Edit Student"
              description={`${editingStudent.full_name} · @${editingStudent.username}`}
              onClose={closeEditModal}
            />

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-6 p-6"
            >
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account
                </p>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Username</p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      @{editingStudent.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Email</p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {editingStudent.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
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

                <div className="md:col-span-2">
                  <FormField label="Address">
                    <textarea
                      rows={3}
                      {...registerEdit("address")}
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              {updateError && <ErrorBox message={updateError} />}

              <ModalActions
                loading={updating}
                submitText="Save Changes"
                loadingText="Saving..."
                onCancel={closeEditModal}
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900";

type ModalHeaderProps = {
  title: string;
  description: string;
  onClose: () => void;
};

function ModalHeader({ title, description, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <X size={20} />
      </button>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
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
    <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}

export default StudentsPage;
