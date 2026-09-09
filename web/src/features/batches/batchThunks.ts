import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import api from "../../api/axios";

import type {
  Batch,
  CreateBatchPayload,
  UpdateBatchPayload,
} from "./batchTypes";

type BatchesResponse = {
  data: Batch[];
};

type BatchResponse = {
  data: Batch;
};

type UpdateBatchArgs = {
  batchID: number;
  payload: UpdateBatchPayload;
};

export const getBatches = createAsyncThunk<
  Batch[],
  void,
  { rejectValue: string }
>("batches/getAll", async (_, thunkAPI) => {
  try {
    const response = await api.get<BatchesResponse>("/batches");

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load batches",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load batches");
  }
});

export const createBatch = createAsyncThunk<
  Batch,
  CreateBatchPayload,
  { rejectValue: string }
>("batches/create", async (payload, thunkAPI) => {
  try {
    const response = await api.post<BatchResponse>("/batches", payload);

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to create batch",
      );
    }

    return thunkAPI.rejectWithValue("Unable to create batch");
  }
});

export const updateBatch = createAsyncThunk<
  Batch,
  UpdateBatchArgs,
  { rejectValue: string }
>("batches/update", async ({ batchID, payload }, thunkAPI) => {
  try {
    const response = await api.patch<BatchResponse>(
      `/batches/${batchID}`,
      payload,
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to update batch",
      );
    }

    return thunkAPI.rejectWithValue("Unable to update batch");
  }
});
