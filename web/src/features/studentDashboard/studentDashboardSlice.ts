import { createSlice } from "@reduxjs/toolkit";
import {
  getStudentDashboard,
  type StudentDashboardSummary,
} from "./studentDashboardThunks";

type StudentDashboardState = {
  summary: StudentDashboardSummary | null;
  loading: boolean;
  error: string | null;
};

const initialState: StudentDashboardState = {
  summary: null,
  loading: false,
  error: null,
};

const studentDashboardSlice = createSlice({
  name: "studentDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStudentDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getStudentDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load dashboard";
      });
  },
});

export default studentDashboardSlice.reducer;
