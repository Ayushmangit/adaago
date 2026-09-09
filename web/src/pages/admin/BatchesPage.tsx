import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import { Controller, useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  createBatch,
  getBatches,
  updateBatch,
} from "../../features/batches/batchThunks";

import {
  clearCreateBatchError,
  clearUpdateBatchError,
} from "../../features/batches/batchSlice";

import { getPrograms } from "../../features/programs/programThunks";

import type {
  Batch,
  CreateBatchPayload,
  UpdateBatchPayload,
} from "../../features/batches/batchTypes";

/*
|--------------------------------------------------------------------------
| Form Types
|--------------------------------------------------------------------------
*/

type CreateBatchForm = {
  program_id: number;
  name: string;

  start_time: string;
  end_time: string;

  weekdays: number[];

  monthly_fee: number;

  capacity?: number;
};

type EditBatchForm = {
  name: string;

  start_time: string;
  end_time: string;

  weekdays: number[];

  monthly_fee: number;

  capacity?: number;

  is_active: boolean;
};

/*
|--------------------------------------------------------------------------
| Weekdays
|--------------------------------------------------------------------------
|
| Frontend convention:
|
| 1 = Monday
| 2 = Tuesday
| ...
| 7 = Sunday
|
|--------------------------------------------------------------------------
*/

const weekdays = [
  {
    value: 1,
    label: "Mon",
  },
  {
    value: 2,
    label: "Tue",
  },
  {
    value: 3,
    label: "Wed",
  },
  {
    value: 4,
    label: "Thu",
  },
  {
    value: 5,
    label: "Fri",
  },
  {
    value: 6,
    label: "Sat",
  },
  {
    value: 7,
    label: "Sun",
  },
];

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function BatchesPage() {
  const dispatch = useAppDispatch();

  /*
  |--------------------------------------------------------------------------
  | Redux
  |--------------------------------------------------------------------------
  */

  const {
    batches,
    loading,
    creating,
    updating,
    error,
    createError,
    updateError,
  } = useAppSelector((state) => state.batches);

  const { programs, loading: programsLoading } = useAppSelector(
    (state) => state.programs,
  );

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Create Form
  |--------------------------------------------------------------------------
  */

  const {
    register: registerCreate,

    handleSubmit: handleCreateSubmit,

    control: createControl,

    reset: resetCreate,

    formState: { errors: createFormErrors },
  } = useForm<CreateBatchForm>({
    defaultValues: {
      weekdays: [],
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Edit Form
  |--------------------------------------------------------------------------
  */

  const {
    register: registerEdit,

    handleSubmit: handleEditSubmit,

    control: editControl,

    reset: resetEdit,

    formState: { errors: editFormErrors },
  } = useForm<EditBatchForm>({
    defaultValues: {
      weekdays: [],
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    dispatch(getBatches());

    dispatch(getPrograms());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | Program Lookup
  |--------------------------------------------------------------------------
  */

  const programMap = useMemo(() => {
    return new Map(programs.map((program) => [program.id, program]));
  }, [programs]);

  /*
  |--------------------------------------------------------------------------
  | Active Programs
  |--------------------------------------------------------------------------
  */

  const activePrograms = useMemo(() => {
    return programs.filter((program) => program.is_active);
  }, [programs]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return batches;
    }

    return batches.filter((batch) => {
      const program = programMap.get(batch.program_id);

      return (
        batch.name.toLowerCase().includes(query) ||
        program?.name.toLowerCase().includes(query)
      );
    });
  }, [batches, search, programMap]);

  /*
  |--------------------------------------------------------------------------
  | Create Modal
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    dispatch(clearCreateBatchError());

    resetCreate({
      program_id: activePrograms[0]?.id,

      name: "",

      start_time: "",
      end_time: "",

      weekdays: [],

      monthly_fee: undefined,

      capacity: undefined,
    });

    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    dispatch(clearCreateBatchError());

    resetCreate();

    setIsCreateModalOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Modal
  |--------------------------------------------------------------------------
  */

  const openEditModal = (batch: Batch) => {
    dispatch(clearUpdateBatchError());

    setEditingBatch(batch);

    resetEdit({
      name: batch.name,

      start_time: formatTime(batch.start_time),

      end_time: formatTime(batch.end_time),

      weekdays: [...batch.weekdays],

      monthly_fee: batch.monthly_fee_paise / 100,

      capacity: batch.capacity ?? undefined,

      is_active: batch.is_active,
    });
  };

  const closeEditModal = () => {
    if (updating) {
      return;
    }

    dispatch(clearUpdateBatchError());

    resetEdit();

    setEditingBatch(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Create Submit
  |--------------------------------------------------------------------------
  */

  const onCreateSubmit = async (data: CreateBatchForm) => {
    const payload: CreateBatchPayload = {
      program_id: Number(data.program_id),

      name: data.name,

      start_time: data.start_time,

      end_time: data.end_time,

      weekdays: data.weekdays,

      monthly_fee_paise: Math.round(Number(data.monthly_fee) * 100),
    };

    if (
      data.capacity !== undefined &&
      data.capacity !== null &&
      Number(data.capacity) > 0
    ) {
      payload.capacity = Number(data.capacity);
    }

    const result = await dispatch(createBatch(payload));

    if (createBatch.fulfilled.match(result)) {
      resetCreate();

      setIsCreateModalOpen(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Submit
  |--------------------------------------------------------------------------
  */

  const onEditSubmit = async (data: EditBatchForm) => {
    if (!editingBatch) {
      return;
    }

    const payload: UpdateBatchPayload = {
      name: data.name,

      start_time: data.start_time,

      end_time: data.end_time,

      weekdays: data.weekdays,

      monthly_fee_paise: Math.round(Number(data.monthly_fee) * 100),

      is_active: data.is_active,
    };

    if (
      data.capacity !== undefined &&
      data.capacity !== null &&
      Number(data.capacity) > 0
    ) {
      payload.capacity = Number(data.capacity);
    }

    const result = await dispatch(
      updateBatch({
        batchID: editingBatch.id,

        payload,
      }),
    );

    if (updateBatch.fulfilled.match(result)) {
      resetEdit();

      setEditingBatch(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <div>
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Batches</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage schedules, pricing and capacity for sports programs.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={activePrograms.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Batch
          </button>
        </div>

        {/* NO ACTIVE PROGRAM WARNING */}

        {!programsLoading &&
          programs.length > 0 &&
          activePrograms.length === 0 && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You need at least one active program before creating a batch.
            </div>
          )}

        {/* TABLE CARD */}

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
                placeholder="Search batches..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500">
              {filteredBatches.length}{" "}
              {filteredBatches.length === 1 ? "batch" : "batches"}
            </p>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading batches...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="p-6">
              <ErrorBox message={error} />
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && filteredBatches.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <CalendarDays size={24} className="text-gray-500" />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-800">
                {search ? "No batches found" : "No batches yet"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try another search."
                  : "Create a batch under one of your programs."}
              </p>
            </div>
          )}

          {/* TABLE */}

          {!loading && !error && filteredBatches.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Batch
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Program
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Schedule
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Days
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Fee
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Capacity
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
                  {filteredBatches.map((batch) => {
                    const program = programMap.get(batch.program_id);

                    return (
                      <tr
                        key={batch.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* BATCH */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {batch.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Batch #{batch.id}
                          </p>
                        </td>

                        {/* PROGRAM */}

                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">
                            {program?.name ?? `Program #${batch.program_id}`}
                          </p>
                        </td>

                        {/* TIME */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock3 size={15} />

                            <span>
                              {formatTime(batch.start_time)}
                              {" - "}
                              {formatTime(batch.end_time)}
                            </span>
                          </div>
                        </td>

                        {/* DAYS */}

                        <td className="px-5 py-4">
                          <div className="flex max-w-[220px] flex-wrap gap-1">
                            {batch.weekdays.map((day) => (
                              <span
                                key={day}
                                className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                              >
                                {getWeekdayLabel(day)}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* FEE */}

                        <td className="px-5 py-4 text-sm font-medium text-gray-700">
                          ₹{formatRupees(batch.monthly_fee_paise)}
                        </td>

                        {/* CAPACITY */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={15} />

                            <span>{batch.capacity ?? "Unlimited"}</span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <StatusBadge active={batch.is_active} />
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(batch)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}

      {isCreateModalOpen && (
        <ModalOverlay>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Add Batch"
              description="Create a scheduled batch under a program."
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateSubmit)}
              className="space-y-6 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                {/* PROGRAM */}

                <FormField
                  label="Program"
                  required
                  error={createFormErrors.program_id?.message}
                >
                  <select
                    {...registerCreate("program_id", {
                      required: "Program is required",

                      valueAsNumber: true,

                      min: {
                        value: 1,
                        message: "Select a program",
                      },
                    })}
                    className={inputClass}
                  >
                    <option value="">Select program</option>

                    {activePrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* NAME */}

                <FormField
                  label="Batch name"
                  required
                  error={createFormErrors.name?.message}
                >
                  <input
                    type="text"
                    placeholder="e.g. Morning Batch"
                    {...registerCreate("name", {
                      required: "Batch name is required",

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

                {/* START */}

                <FormField
                  label="Start time"
                  required
                  error={createFormErrors.start_time?.message}
                >
                  <input
                    type="time"
                    {...registerCreate("start_time", {
                      required: "Start time is required",
                    })}
                    className={inputClass}
                  />
                </FormField>

                {/* END */}

                <FormField
                  label="End time"
                  required
                  error={createFormErrors.end_time?.message}
                >
                  <input
                    type="time"
                    {...registerCreate("end_time", {
                      required: "End time is required",
                    })}
                    className={inputClass}
                  />
                </FormField>

                {/* FEE */}

                <FormField
                  label="Monthly fee"
                  required
                  error={createFormErrors.monthly_fee?.message}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="2500"
                      {...registerCreate("monthly_fee", {
                        required: "Monthly fee is required",

                        valueAsNumber: true,

                        min: {
                          value: 0.01,
                          message: "Fee must be greater than zero",
                        },
                      })}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </FormField>

                {/* CAPACITY */}

                <FormField
                  label="Capacity"
                  error={createFormErrors.capacity?.message}
                >
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 20"
                    {...registerCreate("capacity", {
                      valueAsNumber: true,

                      min: {
                        value: 1,
                        message: "Capacity must be greater than zero",
                      },
                    })}
                    className={inputClass}
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    Leave empty for no fixed capacity.
                  </p>
                </FormField>
              </div>

              {/* WEEKDAYS */}

              <Controller
                name="weekdays"
                control={createControl}
                rules={{
                  validate: (value) =>
                    value.length > 0 || "Select at least one day",
                }}
                render={({ field, fieldState }) => (
                  <WeekdaySelector
                    value={field.value ?? []}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {/* BACKEND ERROR */}

              {createError && <ErrorBox message={createError} />}

              <ModalActions
                loading={creating}
                submitText="Create Batch"
                loadingText="Creating..."
                onCancel={closeCreateModal}
              />
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* EDIT MODAL */}

      {editingBatch && (
        <ModalOverlay>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <ModalHeader
              title="Edit Batch"
              description={`Update ${editingBatch.name}.`}
              onClose={closeEditModal}
            />

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-6 p-6"
            >
              {/* PROGRAM INFO */}

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Program
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {programMap.get(editingBatch.program_id)?.name ??
                    `Program #${editingBatch.program_id}`}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  The program cannot be changed after the batch has been
                  created.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* NAME */}

                <FormField
                  label="Batch name"
                  required
                  error={editFormErrors.name?.message}
                >
                  <input
                    type="text"
                    {...registerEdit("name", {
                      required: "Batch name is required",

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

                {/* STATUS */}

                <FormField label="Status">
                  <select
                    {...registerEdit("is_active", {
                      setValueAs: (value) => value === "true",
                    })}
                    className={inputClass}
                  >
                    <option value="true">Active</option>

                    <option value="false">Inactive</option>
                  </select>
                </FormField>

                {/* START */}

                <FormField
                  label="Start time"
                  required
                  error={editFormErrors.start_time?.message}
                >
                  <input
                    type="time"
                    {...registerEdit("start_time", {
                      required: "Start time is required",
                    })}
                    className={inputClass}
                  />
                </FormField>

                {/* END */}

                <FormField
                  label="End time"
                  required
                  error={editFormErrors.end_time?.message}
                >
                  <input
                    type="time"
                    {...registerEdit("end_time", {
                      required: "End time is required",
                    })}
                    className={inputClass}
                  />
                </FormField>

                {/* FEE */}

                <FormField
                  label="Monthly fee"
                  required
                  error={editFormErrors.monthly_fee?.message}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      {...registerEdit("monthly_fee", {
                        required: "Monthly fee is required",

                        valueAsNumber: true,

                        min: {
                          value: 0.01,
                          message: "Fee must be greater than zero",
                        },
                      })}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </FormField>

                {/* CAPACITY */}

                <FormField
                  label="Capacity"
                  error={editFormErrors.capacity?.message}
                >
                  <input
                    type="number"
                    min="1"
                    {...registerEdit("capacity", {
                      valueAsNumber: true,

                      min: {
                        value: 1,
                        message: "Capacity must be greater than zero",
                      },
                    })}
                    className={inputClass}
                  />
                </FormField>
              </div>

              {/* WEEKDAYS */}

              <Controller
                name="weekdays"
                control={editControl}
                rules={{
                  validate: (value) =>
                    value.length > 0 || "Select at least one day",
                }}
                render={({ field, fieldState }) => (
                  <WeekdaySelector
                    value={field.value ?? []}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {/* BACKEND ERROR */}

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
| Weekday Selector
|--------------------------------------------------------------------------
*/

type WeekdaySelectorProps = {
  value: number[];

  onChange: (value: number[]) => void;

  error?: string;
};

function WeekdaySelector({ value, onChange, error }: WeekdaySelectorProps) {
  const toggleDay = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((item) => item !== day));

      return;
    }

    onChange([...value, day].sort((a, b) => a - b));
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">
        Weekdays
        <span className="ml-1 text-red-500">*</span>
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Select the days this batch runs.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {weekdays.map((day) => {
          const selected = value.includes(day.value);

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={
                selected
                  ? "rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                  : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              }
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getWeekdayLabel(value: number) {
  return (
    weekdays.find((weekday) => weekday.value === value)?.label ??
    value.toString()
  );
}

function formatRupees(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,

    maximumFractionDigits: 2,
  });
}

function formatTime(value: string) {
  if (!value) {
    return "—";
  }

  // Example:
  // 0000-01-01T06:30:00Z
  if (value.includes("T")) {
    const time = value.split("T")[1];

    return time.slice(0, 5);
  }

  // Example:
  // 06:30:00
  // 06:30
  return value.slice(0, 5);
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
| Modal
|--------------------------------------------------------------------------
*/

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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

export default BatchesPage;
