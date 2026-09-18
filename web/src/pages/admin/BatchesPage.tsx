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

const weekdays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

function BatchesPage() {
  const dispatch = useAppDispatch();

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

  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

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

  useEffect(() => {
    dispatch(getBatches());
    dispatch(getPrograms());
  }, [dispatch]);

  const programMap = useMemo(() => {
    return new Map(programs.map((program) => [program.id, program]));
  }, [programs]);

  const activePrograms = useMemo(() => {
    return programs.filter((program) => program.is_active);
  }, [programs]);

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return batches;

    return batches.filter((batch) => {
      const program = programMap.get(batch.program_id);

      return (
        batch.name.toLowerCase().includes(query) ||
        program?.name.toLowerCase().includes(query)
      );
    });
  }, [batches, search, programMap]);

  const activeBatchCount = useMemo(
    () => batches.filter((batch) => batch.is_active).length,
    [batches],
  );

  const totalCapacity = useMemo(
    () =>
      batches.reduce((total, batch) => {
        return total + (batch.capacity ?? 0);
      }, 0),
    [batches],
  );

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
    if (creating) return;

    dispatch(clearCreateBatchError());
    resetCreate();
    setIsCreateModalOpen(false);
  };

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
    if (updating) return;

    dispatch(clearUpdateBatchError());
    resetEdit();
    setEditingBatch(null);
  };

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

  const onEditSubmit = async (data: EditBatchForm) => {
    if (!editingBatch) return;

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

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Sports Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Batches
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage schedules, pricing and capacity for Adaa Farms sports
              programs.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={activePrograms.length === 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Plus size={17} />
            Add batch
          </button>
        </header>

        {!programsLoading &&
          programs.length > 0 &&
          activePrograms.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You need at least one active program before creating a batch.
            </div>
          )}

        <section className="grid grid-cols-2 gap-3 lg:max-w-3xl lg:grid-cols-3">
          <SummaryCard
            label="Total batches"
            value={batches.length}
            icon={<CalendarDays size={18} />}
          />

          <SummaryCard
            label="Active"
            value={activeBatchCount}
            icon={<Clock3 size={18} />}
          />

          <div className="col-span-2 lg:col-span-1">
            <SummaryCard
              label="Total capacity"
              value={totalCapacity}
              icon={<Users size={18} />}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search batch or program..."
                className={searchClass}
              />
            </div>

            <p className="text-sm text-slate-500">
              {filteredBatches.length}{" "}
              {filteredBatches.length === 1 ? "batch" : "batches"}
            </p>
          </div>

          {loading && (
            <StateBox>
              <p>Loading batches...</p>
            </StateBox>
          )}

          {!loading && error && (
            <div className="p-5">
              <ErrorBox message={error} />
            </div>
          )}

          {!loading && !error && filteredBatches.length === 0 && (
            <StateBox>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarDays size={23} />
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                {search ? "No batches found" : "No batches yet"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try searching for another batch or program."
                  : "Create your first batch to get started."}
              </p>
            </StateBox>
          )}

          {!loading && !error && filteredBatches.length > 0 && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                      <TableHeader>Batch</TableHeader>
                      <TableHeader>Program</TableHeader>
                      <TableHeader>Schedule</TableHeader>
                      <TableHeader>Days</TableHeader>
                      <TableHeader>Monthly fee</TableHeader>
                      <TableHeader>Capacity</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader align="right">Action</TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredBatches.map((batch) => {
                      const program = programMap.get(batch.program_id);

                      return (
                        <tr
                          key={batch.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {batch.name}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-600">
                              {program?.name ?? "Program unavailable"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock3 size={15} className="text-emerald-700" />

                              <span>
                                {formatTime(batch.start_time)} –{" "}
                                {formatTime(batch.end_time)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex max-w-[220px] flex-wrap gap-1.5">
                              {batch.weekdays.map((day) => (
                                <DayBadge key={day}>
                                  {getWeekdayLabel(day)}
                                </DayBadge>
                              ))}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              ₹{formatRupees(batch.monthly_fee_paise)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users size={15} className="text-emerald-700" />
                              {batch.capacity ?? "Unlimited"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge active={batch.is_active} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEditModal(batch)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredBatches.map((batch) => {
                  const program = programMap.get(batch.program_id);

                  return (
                    <article key={batch.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {program?.name ?? "Program"}
                          </p>

                          <h2 className="mt-1 truncate font-semibold text-slate-950">
                            {batch.name}
                          </h2>
                        </div>

                        <StatusBadge active={batch.is_active} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MobileInfo
                          icon={<Clock3 size={15} />}
                          label="Schedule"
                          value={`${formatTime(batch.start_time)} – ${formatTime(
                            batch.end_time,
                          )}`}
                        />

                        <MobileInfo
                          icon={<Users size={15} />}
                          label="Capacity"
                          value={
                            batch.capacity !== null &&
                            batch.capacity !== undefined
                              ? String(batch.capacity)
                              : "Unlimited"
                          }
                        />
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Training days
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {batch.weekdays.map((day) => (
                            <DayBadge key={day}>
                              {getWeekdayLabel(day)}
                            </DayBadge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-400">Monthly fee</p>
                          <p className="mt-0.5 font-semibold text-slate-950">
                            ₹{formatRupees(batch.monthly_fee_paise)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditModal(batch)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {isCreateModalOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Add batch"
              description="Create a scheduled batch under an Adaa Farms program."
              onClose={closeCreateModal}
            />

            <form
              onSubmit={handleCreateSubmit(onCreateSubmit)}
              className="space-y-6 p-5 sm:p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
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

                <FormField
                  label="Monthly fee"
                  required
                  error={createFormErrors.monthly_fee?.message}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
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

                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave empty for no fixed capacity.
                  </p>
                </FormField>
              </div>

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

              {createError && <ErrorBox message={createError} />}

              <ModalActions
                loading={creating}
                submitText="Create batch"
                loadingText="Creating..."
                onCancel={closeCreateModal}
              />
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {editingBatch && (
        <ModalOverlay>
          <ModalCard>
            <ModalHeader
              title="Edit batch"
              description={`Update ${editingBatch.name}.`}
              onClose={closeEditModal}
            />

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-6 p-5 sm:p-6"
            >
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Program
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {programMap.get(editingBatch.program_id)?.name ??
                    "Program unavailable"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The program cannot be changed after the batch is created.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
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

                <FormField
                  label="Monthly fee"
                  required
                  error={editFormErrors.monthly_fee?.message}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
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

                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave empty for no fixed capacity.
                  </p>
                </FormField>
              </div>

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

function MobileInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="text-emerald-700">{icon}</span>
        {label}
      </div>

      <p className="mt-1.5 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function DayBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
      {children}
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

function StateBox({ children }: { children: ReactNode }) {
  return (
    <div className="p-10 text-center text-sm text-slate-500 sm:p-12">
      {children}
    </div>
  );
}

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
      <p className="text-sm font-medium text-slate-700">
        Weekdays
        <span className="ml-1 text-red-500">*</span>
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Select the days this batch runs.
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        {weekdays.map((day) => {
          const selected = value.includes(day.value);

          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
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
  if (!value) return "—";

  if (value.includes("T")) {
    return value.split("T")[1].slice(0, 5);
  }

  return value.slice(0, 5);
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

const searchClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10";

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/30 backdrop-blur-sm sm:items-center sm:p-4">
      {children}
    </div>
  );
}

function ModalCard({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
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

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
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
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
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
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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
        className="h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}

export default BatchesPage;
