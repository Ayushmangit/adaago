import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import api from "../../api/axios";
import type { StudentWithUser } from "./studentTypes";

export type CreateStudentPayload = {
  email: string;
  username: string;
  full_name: string;

  phone?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
};

type StudentsResponse = {
  data: {
    data: StudentWithUser[];
  };
};

type StudentResponse = {
  data: {
    data: StudentWithUser;
  };
};

export const getStudents = createAsyncThunk<
  StudentWithUser[],
  void,
  { rejectValue: string }
>("students/getAll", async (_, thunkAPI) => {
  try {
    const response = await api.get<StudentsResponse>("/students");

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load students",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load students");
  }
});

export const createStudent = createAsyncThunk<
  StudentWithUser,
  CreateStudentPayload,
  { rejectValue: string }
>("students/create", async (payload, thunkAPI) => {
  try {
    const response = await api.post<StudentResponse>("/students", payload);

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to create student",
      );
    }

    return thunkAPI.rejectWithValue("Unable to create student");
  }
});

export type UpdateStudentPayload = {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  status?: "active" | "inactive";
};

type UpdateStudentArgs = {
  studentID: number;
  payload: UpdateStudentPayload;
};

export const updateStudent = createAsyncThunk<
  StudentWithUser,
  UpdateStudentArgs,
  { rejectValue: string }
>("students/update", async ({ studentID, payload }, thunkAPI) => {
  try {
    const response = await api.patch<StudentResponse>(
      `/students/${studentID}`,
      payload,
    );

    return response.data.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to update student",
      );
    }

    return thunkAPI.rejectWithValue("Unable to update student");
  }
});

export const getMyProfile = createAsyncThunk<
  StudentWithUser,
  void,
  { rejectValue: string }
>(
  "students/getMyProfile",

  async (_, thunkAPI) => {
    try {
      const response = await api.get<StudentResponse>("/students/profile");

      return response.data.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to load profile",
        );
      }

      return thunkAPI.rejectWithValue("Unable to load profile");
    }
  },
);
