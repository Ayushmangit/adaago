import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axios";
import type { StudentFee } from "./studentFeeTypes";

type ApiErrorResponse = {
  error: string;
};

export const getMyFees = createAsyncThunk<
  StudentFee[],
  void,
  { rejectValue: string }
>("studentFees/getMyFees", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/students/profile/fees");

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      return rejectWithValue(
        error.response?.data?.error ?? "Failed to get fees",
      );
    }

    return rejectWithValue("Failed to get fees");
  }
});
