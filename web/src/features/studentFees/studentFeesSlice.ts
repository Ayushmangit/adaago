import { createSlice } from "@reduxjs/toolkit";
import type { StudentFee } from "./studentFeeTypes";
import { getMyFees } from "./studentFeeThunks";

type StudentFeeState = {
  fees: StudentFee[];
  loading: boolean;
  error: string | null;
};

const initialState: StudentFeeState = {
  fees: [],
  loading: false,
  error: null,
};

const studentFeeSlice = createSlice({
  name: "studentFees",
  initialState,
  reducers: {
    clearStudentFees(state) {
      state.fees = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyFees.fulfilled, (state, action) => {
        state.loading = false;
        state.fees = action.payload;
      })
      .addCase(getMyFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to get fees";
      });
  },
});

export const { clearStudentFees } = studentFeeSlice.actions;

export default studentFeeSlice.reducer;
