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
    total: number;
    page: number;
    page_size: number;
  };
};

export type GetStudentsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type GetStudentsResult = {
  students: StudentWithUser[];
  total: number;
  page: number;
  pageSize: number;
};

type StudentResponse = {
  data: {
    data: StudentWithUser;
  };
};

export const getStudents = createAsyncThunk<
  GetStudentsResult,
  GetStudentsParams | undefined,
  { rejectValue: string }
>("students/getAll", async (params, thunkAPI) => {
  try {
    const response = await api.get<StudentsResponse>("/students", {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 20,
        search: params?.search || undefined,
      },
    });

    return {
      students: response.data.data.data,
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.page_size,
    };
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
