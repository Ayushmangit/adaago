import { createSlice } from "@reduxjs/toolkit";
import { getDashboardSummary, type DashboardSummary } from "./dashboardThunks";

type DashboardState = {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  summary: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load dashboard";
      });
  },
});

export default dashboardSlice.reducer;
