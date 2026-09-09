import { createSlice } from "@reduxjs/toolkit";

import { createBatch, getBatches, updateBatch } from "./batchThunks";

import type { Batch } from "./batchTypes";

type BatchState = {
  batches: Batch[];

  loading: boolean;
  creating: boolean;
  updating: boolean;

  error: string | null;
  createError: string | null;
  updateError: string | null;
};

const initialState: BatchState = {
  batches: [],

  loading: false,
  creating: false,
  updating: false,

  error: null,
  createError: null,
  updateError: null,
};

const batchSlice = createSlice({
  name: "batches",

  initialState,

  reducers: {
    clearCreateBatchError: (state) => {
      state.createError = null;
    },

    clearUpdateBatchError: (state) => {
      state.updateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // GET BATCHES

      .addCase(getBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getBatches.fulfilled, (state, action) => {
        state.loading = false;

        state.batches = action.payload;
      })

      .addCase(getBatches.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load batches";
      })

      // CREATE BATCH

      .addCase(createBatch.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })

      .addCase(createBatch.fulfilled, (state, action) => {
        state.creating = false;

        state.batches.push(action.payload);

        state.batches.sort((a, b) => a.name.localeCompare(b.name));
      })

      .addCase(createBatch.rejected, (state, action) => {
        state.creating = false;

        state.createError = action.payload ?? "Unable to create batch";
      })

      // UPDATE BATCH

      .addCase(updateBatch.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })

      .addCase(updateBatch.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.batches.findIndex(
          (batch) => batch.id === action.payload.id,
        );

        if (index !== -1) {
          state.batches[index] = action.payload;
        }

        state.batches.sort((a, b) => a.name.localeCompare(b.name));
      })

      .addCase(updateBatch.rejected, (state, action) => {
        state.updating = false;

        state.updateError = action.payload ?? "Unable to update batch";
      });
  },
});

export const { clearCreateBatchError, clearUpdateBatchError } =
  batchSlice.actions;

export default batchSlice.reducer;
