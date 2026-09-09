import { createAsyncThunk } from "@reduxjs/toolkit";

import axios from "axios";

import api from "../../api/axios";

import type {
  CreateEnrollmentPayload,
  Enrollment,
  UpdateEnrollmentPayload,
} from "./enrollmentTypes";

/*
|--------------------------------------------------------------------------
| API Responses
|--------------------------------------------------------------------------
|
| jsonResponse:
|
| {
|   data: {
|     data: ...
|   }
| }
|
|--------------------------------------------------------------------------
*/

type EnrollmentResponse = {
  data: {
    data: Enrollment;
  };
};

type EnrollmentsResponse = {
  data: {
    data: Enrollment[];
  };
};

/*
|--------------------------------------------------------------------------
| Arguments
|--------------------------------------------------------------------------
*/

type UpdateEnrollmentArgs = {
  enrollmentID: number;

  payload: UpdateEnrollmentPayload;
};

/*
|--------------------------------------------------------------------------
| Create Enrollment
|--------------------------------------------------------------------------
*/

export const createEnrollment = createAsyncThunk<
  Enrollment,
  CreateEnrollmentPayload,
  { rejectValue: string }
>(
  "enrollments/create",

  async (payload, thunkAPI) => {
    try {
      const response = await api.post<EnrollmentResponse>(
        "/enrollments",
        payload,
      );

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to create enrollment",
        );
      }

      return thunkAPI.rejectWithValue("Unable to create enrollment");
    }
  },
);

/*
|--------------------------------------------------------------------------
| Get Student Enrollments
|--------------------------------------------------------------------------
*/

export const getStudentEnrollments = createAsyncThunk<
  Enrollment[],
  number,
  { rejectValue: string }
>(
  "enrollments/getByStudent",

  async (studentID, thunkAPI) => {
    try {
      const response = await api.get<EnrollmentsResponse>(
        `/students/${studentID}/enrollments`,
      );

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to load student enrollments",
        );
      }

      return thunkAPI.rejectWithValue("Unable to load student enrollments");
    }
  },
);

/*
|--------------------------------------------------------------------------
| Get Batch Enrollments
|--------------------------------------------------------------------------
*/

export const getBatchEnrollments = createAsyncThunk<
  Enrollment[],
  number,
  { rejectValue: string }
>(
  "enrollments/getByBatch",

  async (batchID, thunkAPI) => {
    try {
      const response = await api.get<EnrollmentsResponse>(
        `/batches/${batchID}/enrollments`,
      );

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to load batch enrollments",
        );
      }

      return thunkAPI.rejectWithValue("Unable to load batch enrollments");
    }
  },
);

/*
|--------------------------------------------------------------------------
| Update Enrollment
|--------------------------------------------------------------------------
*/

export const updateEnrollment = createAsyncThunk<
  Enrollment,
  UpdateEnrollmentArgs,
  { rejectValue: string }
>(
  "enrollments/update",

  async ({ enrollmentID, payload }, thunkAPI) => {
    try {
      const response = await api.patch<EnrollmentResponse>(
        `/enrollments/${enrollmentID}`,
        payload,
      );

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to update enrollment",
        );
      }

      return thunkAPI.rejectWithValue("Unable to update enrollment");
    }
  },
);

export const getMyEnrollments = createAsyncThunk<
  Enrollment[],
  void,
  { rejectValue: string }
>(
  "enrollments/getMyEnrollments",

  async (_, thunkAPI) => {
    try {
      const response = await api.get<{
        data: {
          data: Enrollment[];
        };
      }>("/students/profile/enrollments");

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to load enrollments",
        );
      }

      return thunkAPI.rejectWithValue("Unable to load enrollments");
    }
  },
);
