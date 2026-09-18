import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axios";

export type DashboardBatch = {
  id: number;
  name: string;
  program_id: number;
  program_name: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
};

export type DashboardSummary = {
  total_students: number;
  active_students: number;
  total_programs: number;
  active_programs: number;
  total_batches: number;
  active_batches: number;
  total_capacity: number;
  batches: DashboardBatch[];
};

type DashboardSummaryResponse = {
  data: {
    data: DashboardSummary;
  };
};

export const getDashboardSummary = createAsyncThunk<
  DashboardSummary,
  void,
  { rejectValue: string }
>("dashboard/getSummary", async (_, thunkAPI) => {
  try {
    const response =
      await api.get<DashboardSummaryResponse>("/dashboard/summary");

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load dashboard",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load dashboard");
  }
});
