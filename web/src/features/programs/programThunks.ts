import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import api from "../../api/axios";

import type {
  CreateProgramPayload,
  Program,
  UpdateProgramPayload,
} from "./programTypes";

type ProgramsResponse = {
  data: Program[];
};

type ProgramResponse = {
  data: Program;
};

type UpdateProgramArgs = {
  programID: number;
  payload: UpdateProgramPayload;
};

export const getPrograms = createAsyncThunk<
  Program[],
  void,
  { rejectValue: string }
>("programs/getAll", async (_, thunkAPI) => {
  try {
    const response = await api.get<ProgramsResponse>("/programs");

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load programs",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load programs");
  }
});

export const createProgram = createAsyncThunk<
  Program,
  CreateProgramPayload,
  { rejectValue: string }
>("programs/create", async (payload, thunkAPI) => {
  try {
    const response = await api.post<ProgramResponse>("/programs", payload);

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to create program",
      );
    }

    return thunkAPI.rejectWithValue("Unable to create program");
  }
});

export const updateProgram = createAsyncThunk<
  Program,
  UpdateProgramArgs,
  { rejectValue: string }
>("programs/update", async ({ programID, payload }, thunkAPI) => {
  try {
    const response = await api.patch<ProgramResponse>(
      `/programs/${programID}`,
      payload,
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to update program",
      );
    }

    return thunkAPI.rejectWithValue("Unable to update program");
  }
});
