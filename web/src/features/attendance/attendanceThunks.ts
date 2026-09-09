import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import type {
  Attendance,
  BulkAttendanceArgs,
  CreateAttendancePayload,
  UpdateAttendanceArgs,
} from "./attendanceTypes";
import api from "../../api/axios";

type ApiErrorResponse = {
  error: string;
};

export const createAttendance = createAsyncThunk<
  Attendance,
  CreateAttendancePayload,
  { rejectValue: string }
>("attendance/createAttendance", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/attendance", payload);

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      return rejectWithValue(
        error.response?.data?.error ?? "Failed to mark attendance",
      );
    }

    return rejectWithValue("Failed to mark attendance");
  }
});

export const getAttendanceByID = createAsyncThunk<
  Attendance,
  number,
  { rejectValue: string }
>("attendance/getAttendanceByID", async (attendanceID, { rejectWithValue }) => {
  try {
    const response = await api.get(`/attendance/${attendanceID}`);

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      return rejectWithValue(
        error.response?.data?.error ?? "Failed to get attendance",
      );
    }

    return rejectWithValue("Failed to get attendance");
  }
});

export const getEnrollmentAttendance = createAsyncThunk<
  Attendance[],
  number,
  { rejectValue: string }
>(
  "attendance/getEnrollmentAttendance",
  async (enrollmentID, { rejectWithValue }) => {
    try {
      const response = await api.get(`/enrollments/${enrollmentID}/attendance`);

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return rejectWithValue(
          error.response?.data?.error ?? "Failed to get enrollment attendance",
        );
      }

      return rejectWithValue("Failed to get enrollment attendance");
    }
  },
);

export const getBatchAttendance = createAsyncThunk<
  Attendance[],
  {
    batchID: number;
    date: string;
  },
  { rejectValue: string }
>(
  "attendance/getBatchAttendance",
  async ({ batchID, date }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/batches/${batchID}/attendance`, {
        params: {
          date,
        },
      });

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return rejectWithValue(
          error.response?.data?.error ?? "Failed to get batch attendance",
        );
      }

      return rejectWithValue("Failed to get batch attendance");
    }
  },
);

export const getMyAttendance = createAsyncThunk<
  Attendance[],
  void,
  { rejectValue: string }
>("attendance/getMyAttendance", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/students/profile/attendance");

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      return rejectWithValue(
        error.response?.data?.error ?? "Failed to get attendance",
      );
    }

    return rejectWithValue("Failed to get attendance");
  }
});

export const updateAttendance = createAsyncThunk<
  Attendance,
  UpdateAttendanceArgs,
  { rejectValue: string }
>(
  "attendance/updateAttendance",
  async ({ attendanceID, payload }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/attendance/${attendanceID}`, payload);

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return rejectWithValue(
          error.response?.data?.error ?? "Failed to update attendance",
        );
      }

      return rejectWithValue("Failed to update attendance");
    }
  },
);

export const bulkAttendance = createAsyncThunk<
  Attendance[],
  BulkAttendanceArgs,
  { rejectValue: string }
>(
  "attendance/bulkAttendance",
  async ({ batchID, payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/batches/${batchID}/attendance/bulk`,
        payload,
      );

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return rejectWithValue(
          error.response?.data?.error ?? "Failed to mark bulk attendance",
        );
      }

      return rejectWithValue("Failed to mark bulk attendance");
    }
  },
);
