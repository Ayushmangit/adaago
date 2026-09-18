import { createSlice } from "@reduxjs/toolkit";

import type { FeeDueWithDetails } from "./feeTypes";
import { generateMonthlyFees, getFees, markFeePaid } from "./feeThunks";

type FeeState = {
  fees: FeeDueWithDetails[];
  total: number;
  page: number;
  pageSize: number;

  loading: boolean;
  error: string | null;
  generating: boolean;
  generateError: string | null;
  generatedCount: number | null;

  markingPaidID: number | null;
  markPaidError: string | null;
};

const initialState: FeeState = {
  fees: [],
  total: 0,
  page: 1,
  pageSize: 20,

  loading: false,
  error: null,
  generating: false,
  generateError: null,
  generatedCount: null,

  markingPaidID: null,
  markPaidError: null,
};

const feeSlice = createSlice({
  name: "fees",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(generateMonthlyFees.pending, (state) => {
        state.generating = true;
        state.generateError = null;
        state.generatedCount = null;
      })
      .addCase(generateMonthlyFees.fulfilled, (state, action) => {
        state.generating = false;
        state.generatedCount = action.payload.created;
      })
      .addCase(generateMonthlyFees.rejected, (state, action) => {
        state.generating = false;
        state.generateError =
          action.payload ?? "Unable to generate monthly fees";
      })
      .addCase(getFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFees.fulfilled, (state, action) => {
        state.loading = false;
        state.fees = action.payload.fees;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(getFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load fees";
      })

      .addCase(markFeePaid.pending, (state, action) => {
        state.markingPaidID = action.meta.arg.feeDueID;
        state.markPaidError = null;
      })
      .addCase(markFeePaid.fulfilled, (state, action) => {
        state.markingPaidID = null;

        const index = state.fees.findIndex(
          (fee) => fee.id === action.payload.id,
        );

        if (index !== -1) {
          state.fees[index].status = action.payload.status;
          state.fees[index].notes = action.payload.notes;
          state.fees[index].paid_at = action.payload.paid_at;
          state.fees[index].marked_paid_by = action.payload.marked_paid_by;
        }
      })
      .addCase(markFeePaid.rejected, (state, action) => {
        state.markingPaidID = null;
        state.markPaidError = action.payload ?? "Unable to mark fee as paid";
      });
  },
});

export default feeSlice.reducer;
