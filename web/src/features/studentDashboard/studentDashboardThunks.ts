import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axios";

export type StudentDashboardSummary = {
  student_id: number;
  full_name: string;
  active_enrollments: number;
  present: number;
  absent: number;
  leave: number;
  attendance_percent: number;
  pending_fees: number;
  pending_amount_paise: number;
};

type StudentDashboardResponse = {
  data: StudentDashboardSummary;
};

export const getStudentDashboard = createAsyncThunk<
  StudentDashboardSummary,
  void,
  { rejectValue: string }
>("studentDashboard/get", async (_, thunkAPI) => {
  try {
    const response = await api.get<StudentDashboardResponse>(
      "/students/profile/dashboard",
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load dashboard",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load dashboard");
  }
});
