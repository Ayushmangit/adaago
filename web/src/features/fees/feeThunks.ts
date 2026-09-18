import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import api from "../../api/axios";
import type { FeeDue, FeeDueStatus, FeeDueWithDetails } from "./feeTypes";

export type GetFeesParams = {
  month: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FeeDueStatus | "";
};

export type GetFeesResult = {
  fees: FeeDueWithDetails[];
  total: number;
  page: number;
  pageSize: number;
};

type FeeRegisterResponse = {
  data: {
    fees: FeeDueWithDetails[];
    total: number;
    page: number;
    page_size: number;
  };
};

type FeeResponse = {
  data: FeeDue;
};

export type MarkFeePaidArgs = {
  feeDueID: number;
  notes?: string;
};

export const getFees = createAsyncThunk<
  GetFeesResult,
  GetFeesParams,
  { rejectValue: string }
>("fees/getAll", async (params, thunkAPI) => {
  try {
    const response = await api.get<FeeRegisterResponse>("/fees", {
      params: {
        month: params.month,
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        search: params.search || undefined,
        status: params.status || undefined,
      },
    });

    return {
      fees: response.data.data.fees,
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.page_size,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to load fees",
      );
    }

    return thunkAPI.rejectWithValue("Unable to load fees");
  }
});

export const markFeePaid = createAsyncThunk<
  FeeDue,
  MarkFeePaidArgs,
  { rejectValue: string }
>("fees/markPaid", async ({ feeDueID, notes }, thunkAPI) => {
  try {
    const response = await api.patch<FeeResponse>(`/fees/${feeDueID}/paid`, {
      notes: notes || undefined,
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to mark fee as paid",
      );
    }

    return thunkAPI.rejectWithValue("Unable to mark fee as paid");
  }
});

export type GenerateMonthlyFeesPayload = {
  billing_month: string;
  due_date: string;
};

export type GenerateMonthlyFeesResult = {
  created: number;
};

type GenerateMonthlyFeesResponse = {
  data: GenerateMonthlyFeesResult;
};

export const generateMonthlyFees = createAsyncThunk<
  GenerateMonthlyFeesResult,
  GenerateMonthlyFeesPayload,
  { rejectValue: string }
>("fees/generate", async (payload, thunkAPI) => {
  try {
    const response = await api.post<GenerateMonthlyFeesResponse>(
      "/fees/generate",
      payload,
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ?? "Unable to generate monthly fees",
      );
    }

    return thunkAPI.rejectWithValue("Unable to generate monthly fees");
  }
});
