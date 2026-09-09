import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Activity, Pencil, Plus, Search, X } from "lucide-react";

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

  // CREATE FORM

  const {
    register: registerCreate,

    handleSubmit: handleCreateSubmit,

    reset: resetCreate,

    formState: { errors: createFormErrors },
  } = useForm<CreateProgramPayload>();

  // EDIT FORM

  const {
    register: registerEdit,

    handleSubmit: handleEditSubmit,

    reset: resetEdit,

    formState: { errors: editFormErrors },
  } = useForm<EditProgramForm>();

  // LOAD PROGRAMS

  useEffect(() => {
    dispatch(getPrograms());
  }, [dispatch]);

  // SEARCH

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return programs;
    }

    return programs.filter((program) => {
      const description = program.description?.toLowerCase() ?? "";

      return (
        program.name.toLowerCase().includes(query) ||
        description.includes(query)
      );
    });
  }, [programs, search]);

  // CREATE MODAL

  const openCreateModal = () => {
    dispatch(clearCreateProgramError());

    resetCreate();

    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    dispatch(clearCreateProgramError());

    resetCreate();

    setIsCreateModalOpen(false);
  };

  // EDIT MODAL

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
    if (updating) {
      return;
    }

    dispatch(clearUpdateProgramError());

    resetEdit();

    setEditingProgram(null);
  };

  // CREATE

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

  // UPDATE

  const onEditSubmit = async (data: EditProgramForm) => {
    if (!editingProgram) {
      return;
    }

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
      <div>
        {/* PAGE HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Programs</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage sports programs available at the complex.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Program
          </button>
        </div>

        {/* PROGRAM CARD */}

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* SEARCH */}

          <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search programs..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500">
              {filteredPrograms.length}{" "}
              {filteredPrograms.length === 1 ? "program" : "programs"}
            </p>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading programs...
            </div>
          )}

          {/* FETCH ERROR */}

          {!loading && error && (
            <div className="p-6">
              <ErrorBox message={error} />
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && filteredPrograms.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <Activity size={24} className="text-gray-500" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-800">
                {search ? "No programs found" : "No programs yet"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try another search."
                  : "Create your first sports program."}
              </p>
            </div>
          )}

          {/* TABLE */}

          {!loading && !error && filteredPrograms.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Program
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredPrograms.map((program) => (
                    <tr
                      key={program.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* PROGRAM */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Activity size={18} className="text-gray-600" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {program.name}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              Program #{program.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td className="max-w-md px-5 py-4">
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {program.description ?? "No description"}
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <StatusBadge active={program.is_active} />
                      </td>

                      {/* CREATED */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(program.created_at).toLocaleDateString()}
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(program)}
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

      {/* CREATE PROGRAM MODAL */}

      {isCreateModalOpen && (
        <ModalOverlay>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Add Program"
              description="Create a new sports program."
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateSubmit)}
              className="space-y-6 p-6"
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
                  className={`${inputClass} resize-none`}
                />
              </FormField>

              {createError && <ErrorBox message={createError} />}

              <ModalActions
                loading={creating}
                submitText="Create Program"
                loadingText="Creating..."
                onCancel={closeCreateModal}
              />
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* EDIT PROGRAM MODAL */}

      {editingProgram && (
        <ModalOverlay>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Edit Program"
              description={`Update ${editingProgram.name}.`}
              onClose={closeEditModal}
            />

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-6 p-6"
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
                  className={`${inputClass} resize-none`}
                />
              </FormField>

              {/* ACTIVE STATUS */}

              <div>
                <p className="text-sm font-medium text-gray-700">
                  Program status
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Inactive programs remain in the system but cannot be used as
                  active offerings.
                </p>

                <div className="mt-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Active
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Make this program available.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      {...registerEdit("is_active")}
                      className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-gray-900"
                    />
                  </label>
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
        </ModalOverlay>
      )}
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Shared Styles
|--------------------------------------------------------------------------
*/

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900";

/*
|--------------------------------------------------------------------------
| Modal Overlay
|--------------------------------------------------------------------------
*/

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Modal Header
|--------------------------------------------------------------------------
*/

type ModalHeaderProps = {
  title: string;
  description: string;
  onClose: () => void;
};

function ModalHeader({ title, description, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
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

/*
|--------------------------------------------------------------------------
| Form Field
|--------------------------------------------------------------------------
*/

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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Error Box
|--------------------------------------------------------------------------
*/

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Modal Actions
|--------------------------------------------------------------------------
*/

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
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

export default ProgramsPage;
