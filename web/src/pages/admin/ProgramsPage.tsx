import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, CircleCheck, Pencil, Plus, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  createProgram,
  getPrograms,
  updateProgram,
} from "../../features/programs/programThunks";

import {
  clearCreateProgramError,
  clearUpdateProgramError,
} from "../../features/programs/programSlice";

import type {
  CreateProgramPayload,
  Program,
  UpdateProgramPayload,
} from "../../features/programs/programTypes";

type EditProgramForm = {
  name: string;
  description: string;
  is_active: boolean;
};

function ProgramsPage() {
  const dispatch = useAppDispatch();

  const {
    programs,
    loading,
    creating,
    updating,
    error,
    createError,
    updateError,
  } = useAppSelector((state) => state.programs);

  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createFormErrors },
  } = useForm<CreateProgramPayload>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editFormErrors },
  } = useForm<EditProgramForm>();

  useEffect(() => {
    dispatch(getPrograms());
  }, [dispatch]);

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return programs;

    return programs.filter((program) => {
      const description = program.description?.toLowerCase() ?? "";

      return (
        program.name.toLowerCase().includes(query) ||
        description.includes(query)
      );
    });
  }, [programs, search]);

  const activePrograms = useMemo(
    () => programs.filter((program) => program.is_active).length,
    [programs],
  );

  const openCreateModal = () => {
    dispatch(clearCreateProgramError());
    resetCreate();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;

    dispatch(clearCreateProgramError());
    resetCreate();
    setIsCreateModalOpen(false);
  };

  const openEditModal = (program: Program) => {
    dispatch(clearUpdateProgramError());

    setEditingProgram(program);

    resetEdit({
      name: program.name,
      description: program.description ?? "",
      is_active: program.is_active,
    });
  };

  const closeEditModal = () => {
    if (updating) return;

    dispatch(clearUpdateProgramError());
    resetEdit();
    setEditingProgram(null);
  };

  const onCreateSubmit = async (data: CreateProgramPayload) => {
    const payload: CreateProgramPayload = {
      name: data.name,
    };

    if (data.description?.trim()) {
      payload.description = data.description;
    }

    const result = await dispatch(createProgram(payload));

    if (createProgram.fulfilled.match(result)) {
      resetCreate();
      setIsCreateModalOpen(false);
    }
  };

  const onEditSubmit = async (data: EditProgramForm) => {
    if (!editingProgram) return;

    const payload: UpdateProgramPayload = {
      name: data.name,
      description: data.description,
      is_active: data.is_active,
    };

    const result = await dispatch(
      updateProgram({
        programID: editingProgram.id,
        payload,
      }),
    );

    if (updateProgram.fulfilled.match(result)) {
      resetEdit();
      setEditingProgram(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Sports Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Programs
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage the sports and activities offered at Adaa Farms.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900/10 sm:w-auto"
          >
            <Plus size={18} />
            Add program
          </button>
        </div>

        {/* Summary */}

        {!loading && !error && programs.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:gap-4">
            <SummaryCard
              label="Programs"
              value={programs.length}
              icon={<Activity size={19} />}
            />

            <SummaryCard
              label="Active"
              value={activePrograms}
              icon={<CircleCheck size={19} />}
            />
          </div>
        )}

        {/* Programs */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
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
                placeholder="Search programs..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
              />
            </div>

            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {filteredPrograms.length}
              </span>{" "}
              {filteredPrograms.length === 1 ? "program" : "programs"}
            </p>
          </div>

          {loading && (
            <div className="flex min-h-64 items-center justify-center p-10">
              <p className="text-sm text-slate-500">Loading programs...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 sm:p-6">
              <ErrorBox message={error} />
            </div>
          )}

          {!loading && !error && filteredPrograms.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Activity size={25} />
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                {search ? "No programs found" : "No programs yet"}
              </p>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Create your first sports program to get started."}
              </p>
            </div>
          )}

          {!loading && !error && filteredPrograms.length > 0 && (
            <>
              {/* Desktop / tablet */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <TableHeader>Program</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Created</TableHeader>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredPrograms.map((program) => (
                      <tr
                        key={program.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <Activity size={18} />
                            </div>

                            <p className="font-medium text-slate-900">
                              {program.name}
                            </p>
                          </div>
                        </td>

                        <td className="max-w-md px-5 py-4">
                          <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                            {program.description ?? "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge active={program.is_active} />
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {formatDate(program.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(program)}
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
                {filteredPrograms.map((program) => (
                  <article key={program.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Activity size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-semibold text-slate-900">
                            {program.name}
                          </h2>

                          <StatusBadge active={program.is_active} />
                        </div>

                        {program.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {program.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-400">
                            Created {formatDate(program.created_at)}
                          </p>

                          <button
                            type="button"
                            onClick={() => openEditModal(program)}
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
        </section>
      </div>

      {/* Create modal */}

      {isCreateModalOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Add program"
              description="Create a new sports program."
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateSubmit)}
              className="space-y-5 p-4 sm:p-6"
            >
              <FormField
                label="Program name"
                required
                error={createFormErrors.name?.message}
              >
                <input
                  type="text"
                  placeholder="e.g. Swimming"
                  autoFocus
                  {...registerCreate("name", {
                    required: "Program name is required",
                    minLength: {
                      value: 2,
                      message: "Program name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Program name cannot exceed 100 characters",
                    },
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Description"
                error={createFormErrors.description?.message}
              >
                <textarea
                  rows={4}
                  placeholder="Describe the program..."
                  {...registerCreate("description", {
                    maxLength: {
                      value: 1000,
                      message: "Description cannot exceed 1000 characters",
                    },
                  })}
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </FormField>

              {createError && <ErrorBox message={createError} />}

              <ModalActions
                loading={creating}
                submitText="Create program"
                loadingText="Creating..."
                onCancel={closeCreateModal}
              />
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* Edit modal */}

      {editingProgram && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Edit program"
              description={editingProgram.name}
              onClose={closeEditModal}
            />

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-5 p-4 sm:p-6"
            >
              <FormField
                label="Program name"
                required
                error={editFormErrors.name?.message}
              >
                <input
                  type="text"
                  {...registerEdit("name", {
                    required: "Program name is required",
                    minLength: {
                      value: 2,
                      message: "Program name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Program name cannot exceed 100 characters",
                    },
                  })}
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Description"
                error={editFormErrors.description?.message}
              >
                <textarea
                  rows={4}
                  {...registerEdit("description", {
                    maxLength: {
                      value: 1000,
                      message: "Description cannot exceed 1000 characters",
                    },
                  })}
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </FormField>

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Program status
                </p>

                <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-emerald-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Active
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Make this program available for use.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...registerEdit("is_active")}
                    className="h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-emerald-800"
                  />
                </label>
              </div>

              {updateError && <ErrorBox message={updateError} />}

              <ModalActions
                loading={updating}
                submitText="Save changes"
                loadingText="Saving..."
                onCancel={closeEditModal}
              />
            </form>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/30 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      {children}
    </div>
  );
}

function ModalCard({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
      {children}
    </div>
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

type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

function FormField({
  label,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
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
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-900/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? loadingText : submitText}
      </button>
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

export default ProgramsPage;
